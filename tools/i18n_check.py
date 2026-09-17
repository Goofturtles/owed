"""Owed dictionary check. Run from the owed/ folder:   python tools/i18n_check.py

The dictionaries in assets/i18n/<lang>.js are the source: each is one
OwedI18n.add("<lang>", { ... }) call around a JSON object. English is the
reference every other language translates.

Fails (exit 1) on anything that would show a raw key, lose a value, or break markup:
  - a key used in the HTML or JS that English does not define
  - a key bound in markup (data-i18n, data-i18n-html, data-i18n-attr) that has {slots}:
    markup cannot fill them, so they would show literally (a plural renders its "other" form)
  - in ANY language: a value that is not text or a plural of text; markup outside the allow-list
    (ALLOWED tags and attributes, links only https:, mailto: or relative, no entities in attributes)
  - for a language marked ready in assets/js/i18n.js:
      a missing key (except those listed in tools/i18n_skip.json), an extra key,
      {slots} that differ from English, markup that differs from English (every tag and every
      attribute, not just tag names), a plural/non-plural mismatch, a plural without "other",
      an empty value
  - a translator note in tools/i18n_notes.json for a key English does not have

A language that is not ready yet is still fully checked, but its problems are reported as
a count and do not fail the run, so English can be kept green while a translation is in
progress. Pass --all to fail on every language regardless.

Warnings (never fail): English keys not seen in code (fine when built at runtime), and one
English wording translated two different ways in the same language.
"""
import collections
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ['en', 'fr', 'es']
PREFIX = r'(?:common|lang|landing|motion|theme|appShell|auth|app|engine|catalog|store)'
FILE_LIKE = re.compile(r'\.(html|js|json|css|md|png|jpe?g|svg|webp|txt)$')
# quote-aware: a ">" inside a quoted attribute value does not end the tag (so class="x>" onfocus=... is seen whole)
# no space after "<" or "</": browsers read "< b>" as text and swallow "</ b>", so neither counts as a tag
START_TAG = re.compile(r'<(/?)([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s"\'=<>`]+))?)*)\s*/?\s*>')
ATTR = re.compile(r'([\w:-]+)(?:\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+))?')
# Markup a dictionary value may contain, in ANY language: an allow-list, so an unknown tag, an unknown attribute
# or an encoded trick (&#106;avascript:, srcdoc=, on...=) cannot be written at all. Extend it only when English
# genuinely needs a new tag or attribute.
ALLOWED = {
    'a': {'href', 'rel', 'target', 'class'},
    'b': {'class'}, 'strong': {'class'}, 'i': {'class'}, 'span': {'class'}, 'br': set(),
    'em': {'class', 'data-count-to', 'data-count-dur'},
    'button': {'class', 'type', 'data-paste'},
}
SAFE_HREF = re.compile(r'^(?:https://[^\s"\'<>&]+|mailto:[^\s"\'<>&]+|[A-Za-z0-9._/#?=-]+)$')   # no other scheme, no entities
UNSAFE_VALUE = re.compile(r'[<>]|&#|&[a-z]+;|javascript', re.I)


def markup_problems(text):
    """Why a value's markup is not allowed, or [] if it is."""
    problems = []
    # every "<" must open a complete, well-formed tag: catches "<!--", "< script", and an unclosed "<img onerror=..."
    tags, pos = [], text.find('<')
    while pos != -1:
        m = START_TAG.match(text, pos)
        if not m:
            problems.append(f'a "<" that does not open a well-formed tag: "{text[pos:pos + 30]}"')
            pos = text.find('<', pos + 1)
            continue
        tags.append(m)
        pos = text.find('<', m.end())
    for m in tags:
        tag = m.group(2).lower()
        if tag not in ALLOWED:
            problems.append(f'<{tag}> is not an allowed tag')
            continue
        for name, val in ATTR.findall(m.group(3)):
            name, val = name.lower(), (val or '').strip('"\'')
            if name not in ALLOWED[tag]:
                problems.append(f'{name}= is not allowed on <{tag}>')
            elif name == 'href' and not SAFE_HREF.match(val):
                problems.append(f'href "{val[:40]}" is not an https/mailto/relative link')
            elif name != 'href' and UNSAFE_VALUE.search(val):
                problems.append(f'{name}= value "{val[:40]}" contains markup or an entity')
    return problems


def load(code):
    path = os.path.join(ROOT, 'assets', 'i18n', code + '.js')
    text = io.open(path, encoding='utf-8').read()
    start = text.index('{', text.index('OwedI18n.add('))   # the header comment may contain braces
    return json.loads(text[start: text.rindex('}') + 1])


def ready_flags():
    s = io.open(os.path.join(ROOT, 'assets', 'js', 'i18n.js'), encoding='utf-8').read()
    return {m.group(1): m.group(2) == 'true' for m in re.finditer(r"code: '(\w+)'[^}]*ready: (true|false)", s)}


def strings(v):
    return [x for x in (v.values() if isinstance(v, dict) else [v]) if isinstance(x, str)]


def slots(v):
    return sorted({s for x in strings(v) for s in re.findall(r'\{(\w+)\}', x)})


def markup(v):
    """Every tag with its full, normalised attribute set: a translation may move text, never markup."""
    out = []
    for x in ([v] if isinstance(v, str) else strings(v)):
        for m in START_TAG.finditer(x):
            attrs = sorted((a.lower(), (val or '').strip('"\'')) for a, val in ATTR.findall(m.group(3)) if a)
            out.append((m.group(1), m.group(2).lower(), tuple(attrs)))
    return sorted(out)


def strip_js_comments(s):
    s = re.sub(r'/\*.*?\*/', ' ', s, flags=re.S)
    return re.sub(r'(^|[^:"\'\\])//[^\n]*', r'\1', s)   # a // not after ':' (so http:// survives)


def used_keys():
    keys, bound = set(), set()
    for dirpath, _, files in os.walk(ROOT):
        rel = os.path.relpath(dirpath, ROOT)
        if rel.split(os.sep)[0] in ('film', 'film2', 'reels', 'storyboard', 'vectors', 'docs', 'node_modules', '.git', 'tools'):
            continue
        for f in files:
            p = os.path.join(dirpath, f)
            if f.endswith('.html'):
                s = io.open(p, encoding='utf-8').read()
                found = set(re.findall(r'data-i18n(?:-html)?="([^"]+)"', s))
                for attr in re.findall(r'data-i18n-attr="([^"]+)"', s):
                    found.update(part.split(':', 1)[1].strip() for part in attr.split(';') if ':' in part)
                keys |= found
                bound |= found
            elif f.endswith('.js') and os.path.basename(rel) != 'i18n':
                s = strip_js_comments(io.open(p, encoding='utf-8').read())
                keys.update(k for k in re.findall(r"""['"](""" + PREFIX + r"""\.[A-Za-z0-9_.]+)['"]""", s) if not FILE_LIKE.search(k))
    return keys, bound


def main():
    # French and Spanish text in messages: Windows pipes default to cp1252, which garbles or breaks it
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    fail_all = '--all' in sys.argv
    errors, warnings, pending = [], [], collections.Counter()
    d = {}
    for code in LANGS:
        try:
            d[code] = load(code)
        except Exception as e:  # noqa: BLE001
            errors.append(f'{code}.js is not loadable JSON: {e}')
    if errors:
        print('\n'.join('ERROR ' + e for e in errors)); sys.exit(1)

    ready = ready_flags()
    if set(ready) != set(LANGS):
        # fail closed: a flag this script cannot read must not count as "not ready" and let a language through unchecked
        errors.append(f'could not read a ready flag for every language in assets/js/i18n.js (found {sorted(ready)}, expected {LANGS})')
    skip = set(json.load(io.open(os.path.join(ROOT, 'tools', 'i18n_skip.json'), encoding='utf-8'))['keys'])
    notes = json.load(io.open(os.path.join(ROOT, 'tools', 'i18n_notes.json'), encoding='utf-8'))
    en = d['en']

    for code in LANGS:
        for k, v in d[code].items():
            # a value is text, or a plural object whose forms are all text; anything else shows a raw key at runtime
            if not (isinstance(v, str) or (isinstance(v, dict) and v and all(isinstance(x, str) for x in v.values()))):
                errors.append(f'{code}: value for {k} is neither text nor a plural of text: {json.dumps(v)[:60]}')
                continue
            for x in strings(v):
                for why in markup_problems(x):
                    errors.append(f'{code}: markup not allowed in {k}: {why}')
    for k, v in en.items():
        if isinstance(v, dict) and 'other' not in v:
            errors.append(f'en: plural without "other": {k}')
    for k in sorted(set(notes) - set(en)):
        errors.append(f'note for a key English does not have: {k}')
    for k in sorted(skip - set(en)):
        errors.append(f'skip list names a key English does not have: {k}')

    used, bound = used_keys()
    for k in sorted(used - set(en)):
        if not k.endswith('.'):
            errors.append(f'used in code but not in en.js: {k}')
    for k in sorted(bound & set(en)):
        if slots(en[k]):
            errors.append(f'bound in markup but has {{slots}}, which markup cannot fill: {k}')
    for k in sorted(set(en) - used):
        warnings.append(f'in en.js but not seen in code (fine if built at runtime): {k}')

    for code in ('fr', 'es'):
        t, found = d[code], []
        found += [f'missing {k}' for k in sorted(set(en) - set(t) - skip)]
        found += [f'not in English {k}' for k in sorted(set(t) - set(en))]
        for k in sorted(set(en) & set(t)):
            if slots(en[k]) != slots(t[k]):
                found.append(f'slots differ for {k}: en {slots(en[k])} vs {slots(t[k])}')
            if isinstance(en[k], dict) and isinstance(t[k], dict):
                # plural forms differ per language (French and Spanish have "many"): each form must carry English's "other" markup
                ref = markup(en[k].get('other', ''))
                for form, text in t[k].items():
                    if isinstance(text, str) and markup(text) != ref:
                        found.append(f'markup differs from English for {k} ({form} form)')
            elif markup(en[k]) != markup(t[k]):
                found.append(f'markup differs from English for {k}')
            if isinstance(en[k], dict) != isinstance(t[k], dict):
                found.append(f'plural/non-plural mismatch for {k}')
            if isinstance(t[k], dict) and 'other' not in t[k]:
                found.append(f'plural without "other": {k}')
            if isinstance(t[k], str) and isinstance(en[k], str) and not t[k].strip() and en[k].strip():
                found.append(f'empty value for {k}')
        # one English wording, one translation
        by_en = collections.defaultdict(set)
        for k in set(en) & set(t):
            if isinstance(en[k], str) and isinstance(t[k], str):
                by_en[en[k]].add(t[k])
        for src, outs in by_en.items():
            if len(outs) > 1:
                warnings.append(f'{code}: "{src[:50]}" is translated {len(outs)} ways: ' + ' | '.join(sorted(o[:40] for o in outs)))
        if ready.get(code) or fail_all:
            errors += [f'{code}: {x}' for x in found]
        else:
            pending[code] = len(found)

    groups = collections.Counter(w.split(': ', 1)[0] if w.startswith(('fr:', 'es:')) else 'unseen in code' for w in warnings)
    for w in warnings:
        print('warn ', w)
    for e in errors:
        print('ERROR', e)
    print('\nwarnings by kind:', dict(groups))
    for code in ('fr', 'es'):
        state = 'ready' if ready.get(code) else f'not ready ({pending[code]} open items, not failing)'
        print(f'{code}: {len(d[code])} keys, {state}')
    print(f'en: {len(en)} keys | used in code: {len(used)} | skip list: {len(skip)} | errors: {len(errors)}')
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
