"""Owed rulebook check. Run from the owed/ folder:   python tools/check_rules.py

Every rule must have the fields the engine and the pages read, with values the
engine understands. Fails (exit 1) on anything that would hide a rule, show a
broken one, or match it to the wrong people."""
import io, json, re, sys

CATS = {'phone', 'laptop', 'tablet', 'headphones', 'tv', 'console', 'camera', 'watch', 'appliance-large',
        'appliance-small', 'vacuum', 'kitchen', 'power-tool', 'furniture', 'mattress', 'footwear', 'apparel',
        'bag', 'bike', 'outdoor', 'printer', 'toy', 'vehicle', 'monitor', 'other', '*'}
REGIONS = {'US', 'CA', 'MX', 'UK', 'EU', '*'}
TYPES = {'manufacturer', 'statutory', 'card', 'retailer', 'settlement', 'program'}
PAY = {'*', 'visa', 'mastercard', 'amex', 'discover', 'debit', 'cash', 'any-credit', 'unknown'}
REQUIRES = {'membership', 'store-card', 'card-tier'}

html = io.open('app.html', encoding='utf-8').read()
SUBS = set(re.findall(r'value="(?:US|CA)\|((?:US|CA)-[A-Z]{2})"', html))
cat = io.open('assets/js/catalog.js', encoding='utf-8').read()
STORES = set(re.findall(r"\{ id: '([a-z]+)'", cat[cat.index('var STORES'):cat.index('function storeKey')]))
ISSUERS = set(re.findall(r"\{ id: '([a-z]+)', name:", cat[cat.index('var ISSUERS'):cat.index('function issuerName')])) | {'amex'}

d = json.load(io.open('data/coverage.json', encoding='utf-8'))
errors, seen = [], set()
for r in d['rules']:
    i = r.get('id', '?')
    def bad(msg): errors.append('%s: %s' % (i, msg))
    if i in seen: bad('duplicate id')
    seen.add(i)
    for f in ('id', 'source_type', 'title', 'applies_to', 'window_months', 'what_you_get', 'confidence', 'how_to_claim', 'source_url'):
        if f not in r or r[f] in (None, ''): bad('missing ' + f)
    for f in ('title', 'what_you_get', 'window_note', 'how_to_claim', 'contact', 'script_hint', 'source_url'):
        if f in r and not isinstance(r[f], str): bad('%s is not text' % f)
    if r.get('source_type') not in TYPES: bad('source_type %r' % r.get('source_type'))
    if r.get('confidence') not in ('certain', 'likely', 'possible'): bad('confidence %r' % r.get('confidence'))
    w = r.get('window_months')
    if not isinstance(w, (int, float)) or w <= 0: bad('window_months %r' % w)
    if not str(r.get('source_url', '')).startswith('http'): bad('source_url %r' % r.get('source_url'))
    if r.get('starts') and not re.match(r'^\d{4}-\d{2}-\d{2}$', r['starts']): bad('starts %r' % r['starts'])
    if '\ufffd' in json.dumps(r, ensure_ascii=False): bad('broken character')
    at = r.get('applies_to') or {}
    for f in ('brands', 'categories', 'regions', 'payment_methods'):
        if not isinstance(at.get(f), list) or not at.get(f): bad('applies_to.%s empty' % f)
    if set(at.get('categories') or []) - CATS: bad('categories %s' % (set(at['categories']) - CATS))
    if set(at.get('regions') or []) - REGIONS: bad('regions %s' % (set(at['regions']) - REGIONS))
    if set(at.get('payment_methods') or []) - PAY: bad('payments %s' % (set(at['payment_methods']) - PAY))
    if set(at.get('subregions') or []) - SUBS: bad('subregions not in the picker %s' % (set(at['subregions']) - SUBS))
    for s in at.get('subregions') or []:
        if s[:2] not in (at.get('regions') or []) and '*' not in (at.get('regions') or []): bad('subregion %s outside its regions' % s)
    if set(at.get('stores') or []) - STORES: bad('unknown stores %s' % (set(at['stores']) - STORES))
    if set(at.get('issuers') or []) - ISSUERS: bad('unknown banks %s' % (set(at['issuers']) - ISSUERS))
    if at.get('requires') and at['requires'] not in REQUIRES: bad('requires %r' % at['requires'])
    if r.get('source_type') == 'retailer' and '*' in (at.get('brands') or []) and not at.get('stores'): bad('store-wide rule without a store')
    if r.get('source_type') == 'manufacturer' and '*' in (at.get('brands') or []) and not r['id'].startswith('programs-'):
        pass

by_region = {}
for r in d['rules']:
    for g in r['applies_to']['regions']: by_region[g] = by_region.get(g, 0) + 1
print('%d rules | %s | errors: %d' % (len(d['rules']), ' '.join('%s %d' % kv for kv in sorted(by_region.items())), len(errors)))
for e in errors: print('ERROR', e)
sys.exit(1 if errors else 0)
