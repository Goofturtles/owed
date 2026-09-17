"""Strip the white ground out of every capture, then rebuild the two boards.

Nothing on this site is white-on-colour: a rect that fills the whole canvas in
white is the page showing through, never art. Dropping it is what lets a piece
sit over footage in After Effects instead of punching a white hole in it.
Coloured full-bleed rects (the film's grey frame, the black panels) are art and
stay. Reads _src/, writes landing/ and app/.
"""
import io, os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
# Namespace only real ids and real references. A blanket search-and-replace
# also rewrites whatever the base64 photographs happen to spell.
NS_ID = re.compile(r'(id=")((?:clip|grad)[0-9]+)')
NS_REF = re.compile(r'(#)((?:clip|grad)[0-9]+)')
SRC = os.path.join(HERE, '_src')

def read(p):
    return io.open(p, encoding='utf-8').read()

def size_of(svg):
    m = re.search(r'<svg[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"', svg)
    return (float(m.group(1)), float(m.group(2)))

def white(fill):
    f = (fill or '').strip().lower()
    return f in ('#fff', '#ffffff', 'white')

def strip(svg):
    """drop <rect id=page-background> and any full-bleed white rect"""
    W, H = size_of(svg)
    head = svg[:svg.index('>', svg.index('<svg')) + 1]
    rest = svg[len(head):]
    defs = re.search(r'<defs>[\s\S]*?</defs>', rest)
    defs_txt = defs.group(0) if defs else ''
    body = rest.replace(defs_txt, '', 1) if defs_txt else rest
    removed = []

    def drop(m):
        t = m.group(0)
        w = re.search(r'\bwidth="([\d.]+)"', t)
        h = re.search(r'\bheight="([\d.]+)"', t)
        if not w or not h:
            return t
        full = float(w.group(1)) >= W - 1 and float(h.group(1)) >= H - 1
        fill = re.search(r'\bfill="([^"]*)"', t)
        if 'id="page-background"' in t or (full and white(fill.group(1) if fill else '')):
            removed.append(t[:60])
            return ''
        return t

    body = re.sub(r'<rect\b[^>]*/>', drop, body)
    return head + defs_txt + body, removed

def inner(svg):
    return svg[svg.index('>', svg.index('<svg')) + 1: svg.rindex('</svg>')]

def board(parts, order, title, gap=0, across=False):
    """lay the parts out in one coordinate space, each in its own named group"""
    if across:
        H = max(size_of(parts[k])[1] for k in order)
        W = sum(size_of(parts[k])[0] for k in order) + gap * (len(order) - 1)
    else:
        W = max(size_of(parts[k])[0] for k in order)
        H = sum(size_of(parts[k])[1] for k in order) + gap * (len(order) - 1)
    pos, groups, defs = 0, [], []
    for k in order:
        # Every capture numbers its clip paths and gradients from 1, so dropping
        # two of them in one document makes the second section's shapes clip to
        # the first section's boxes and vanish. Give each part its own namespace.
        pre = 's' + k.split('-')[0] + '_'      # an id may not start with a digit
        svg = NS_ID.sub(lambda m: m.group(1) + pre + m.group(2), parts[k])
        svg = NS_REF.sub(lambda m: m.group(1) + pre + m.group(2), svg)
        w, h = size_of(svg)
        m = re.search(r'<defs>([\s\S]*?)</defs>', svg)
        if m:
            defs.append(m.group(1))
        body = re.sub(r'<defs>[\s\S]*?</defs>', '', inner(svg), count=1)
        x, y = (pos, 0) if across else (round((W - w) / 2), pos)
        groups.append('<g id="%s" transform="translate(%d,%d)">%s</g>' % (k, x, y, body))
        pos += (w if across else h) + gap
    return ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            'width="%d" height="%d" viewBox="0 0 %d %d"><title>%s</title>%s%s</svg>'
            % (W, H, W, H, title,
               ('<defs>' + ''.join(defs) + '</defs>') if defs else '', ''.join(groups)))

clean = {'landing': {}, 'app': {}}
for folder in ('landing', 'app'):
    out_dir = os.path.join(HERE, folder)
    shutil.rmtree(out_dir, ignore_errors=True)
    os.makedirs(out_dir)
    # walk subfolders too: landing/animated holds the FAQ's open states
    for base, _dirs, files in os.walk(os.path.join(SRC, folder)):
        rel_dir = os.path.relpath(base, os.path.join(SRC, folder))
        for f in sorted(files):
            if not f.endswith('.svg') or f.startswith('00-'):
                continue      # the boards are rebuilt from the cleaned parts
            svg, removed = strip(read(os.path.join(base, f)))
            rel = f if rel_dir == '.' else os.path.join(rel_dir, f)
            if rel_dir == '.':
                clean[folder][f[:-4]] = svg      # only top-level parts board up
            target = os.path.join(out_dir, rel)
            os.makedirs(os.path.dirname(target), exist_ok=True)
            io.open(target, 'w', encoding='utf-8', newline='\n').write(svg)
            print('%-46s -%d ground rect%s' % (rel.replace(os.sep, '/'), len(removed),
                                               '' if len(removed) == 1 else 's'))

# Keep this list in step with STACK in aescript.js: same board, and a drift
# between the two would have After Effects scroll past a missing section.
stack = ['01-nav', '02-film-chapter1', '05-sources-marquee', '06-script-showcase',
         '07-numbers', '08-five-places', '09-environment', '10-questions',
         '11-closing', '12-footer']
missing = [k for k in stack if k not in clean['landing']]
if missing:
    raise SystemExit('board is missing: ' + ', '.join(missing))
full = board(clean['landing'], stack, 'Owed landing page')
io.open(os.path.join(HERE, 'landing', '00-landing-full-page.svg'), 'w',
        encoding='utf-8', newline='\n').write(full)
print('rebuilt 00-landing-full-page.svg  %dx%d' % size_of(full))

qs = [k for k in sorted(clean['app']) if k[:3] in ('13-', '14-', '15-', '16-')]
strip_svg = board(clean['app'], qs, 'Owed — the four questions', gap=40, across=True)
io.open(os.path.join(HERE, 'app', '00-four-questions-strip.svg'), 'w',
        encoding='utf-8', newline='\n').write(strip_svg)
print('rebuilt 00-four-questions-strip.svg  %dx%d' % size_of(strip_svg))
