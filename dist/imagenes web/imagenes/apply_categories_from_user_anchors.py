#!/usr/bin/env python3
"""
Mapea una lista de anchors proporcionada por el usuario a los slugs reales (eael-cf-*)
presentes en la página y aplica la categoría derivada a las imágenes en images_canonical.json.

EDIT: USER_ANCHORS below are taken from the user message.
"""
import re
import json
from pathlib import Path
from urllib.parse import urljoin, urlparse
import unicodedata

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
CANON = ROOT / 'images_canonical.json'
BACKUP = ROOT / 'images_canonical.anchors_bulk.bak.json'
URL = 'https://maquillajefxmexico.com/portfolio'

# anchors provided by user
USER_ANCHORS = [
    'horror-and-fantasy',
    'old-age',
    'realistic-bodies',
    'realistic-animals',
    'puppets',
    'blood-wounds',
    'costumes-masks',
]

if not CANON.exists():
    print('No canonical file found', CANON)
    raise SystemExit(1)

with open(CANON, 'r', encoding='utf-8') as f:
    canonical = json.load(f)

# normalization helpers
size_suffix_re = re.compile(r"[-_]\d{1,4}x\d{1,4}(?:-\d+)?")
dup_ext_re = re.compile(r"(\.[a-zA-Z0-9]+)\1+$")
nonword_re = re.compile(r"[^a-z0-9]+")

def normalize_basename(b):
    b = b.lower()
    b = dup_ext_re.sub(r"\1", b)
    parts = b.rsplit('.', 1)
    if len(parts) == 2:
        name, ext = parts
        name = size_suffix_re.sub('', name)
        b = f"{name}.{ext}"
    else:
        b = size_suffix_re.sub('', b)
    b = unicodedata.normalize('NFKD', b)
    b = ''.join([c for c in b if not unicodedata.combining(c)])
    b = nonword_re.sub('_', b).strip('_')
    return b

# build map basename->indices
canon_map = {}
for i,e in enumerate(canonical):
    src = e.get('src_url','')
    b = src and Path(urlparse(src).path).name or ''
    norm = normalize_basename(b)
    stem = b.rsplit('.',1)[0]
    stem_norm = norm.rsplit('.',1)[0] if '.' in norm else norm
    for k in (b, norm, stem, stem_norm):
        canon_map.setdefault(k, []).append(i)

print('Fetching page', URL)
resp = requests.get(URL, timeout=20)
resp.raise_for_status()
soup = BeautifulSoup(resp.text, 'html.parser')

# gather available eael slugs
available = set()
for el in soup.find_all(class_=re.compile(r'eael-filterable-gallery-item-wrap')):
    classes = el.get('class') or []
    for c in classes:
        m = re.match(r'eael-cf-([a-z0-9_-]+)', c)
        if m:
            available.add(m.group(1))
available = sorted(available)
print('Detected eael slugs on page:', available)

# helper to find best match
def slug_words(s):
    return re.sub(r'[^a-z0-9\-]', '', s.lower()).replace('_','-').split('-')

def best_match(user_slug, candidates):
    uwords = [w for w in slug_words(user_slug) if w and w!='and']
    # try exact
    if user_slug in candidates:
        return user_slug
    # try variants with/without 'and' or hyphen differences
    for c in candidates:
        cwords = [w for w in slug_words(c) if w and w!='and']
        # if all user words present in candidate
        if all(any(uw==cw for cw in cwords) for uw in uwords):
            return c
    # substring match
    for c in candidates:
        if user_slug.replace('-','') in c.replace('-','') or c.replace('-','') in user_slug.replace('-',''):
            return c
    # no match
    return None

# build mapping from user anchors to actual slugs
mapping = {}
for ua in USER_ANCHORS:
    m = best_match(ua, available)
    mapping[ua] = m

print('\nMapping user anchors to available slugs:')
for ua,m in mapping.items():
    print('-', ua, '->', m)

# Now apply categories for matched slugs
matched_summary = {}
for ua, matched_slug in mapping.items():
    if not matched_slug:
        matched_summary[ua] = {'matched':0, 'note':'no match on page'}
        continue
    # category name
    cat_name = ' '.join([p.capitalize() for p in matched_slug.replace('_','-').split('-') if p!='and'])
    # find wrappers with eael-cf- matched_slug
    wrappers = soup.find_all(class_=re.compile(r'eael-filterable-gallery-item-wrap'))
    matched = 0
    examples = []
    for w in wrappers:
        classes = ' '.join(w.get('class') or [])
        if f'eael-cf-{matched_slug}' not in classes:
            continue
        imgs = w.find_all('img')
        for img in imgs:
            src = img.get('src') or img.get('data-src') or ''
            if not src:
                continue
            b = Path(urlparse(src).path).name
            keys = [b, normalize_basename(b), b.rsplit('.',1)[0], normalize_basename(b).rsplit('.',1)[0] if '.' in normalize_basename(b) else normalize_basename(b)]
            found_idx = None
            for k in keys:
                if k in canon_map:
                    found_idx = canon_map[k][0]
                    break
            if found_idx is not None:
                entry = canonical[found_idx]
                cats = entry.get('categories') or []
                if cat_name not in cats:
                    cats.append(cat_name)
                    entry['categories'] = cats
                matched += 1
                if len(examples) < 6:
                    examples.append((entry.get('filename'), entry.get('src_url')))
    matched_summary[ua] = {'matched': matched, 'slug': matched_slug, 'cat_name': cat_name, 'examples': examples}
    print('-', ua, '->', matched_slug, 'matched', matched)

# backup and write
with open(BACKUP, 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)
with open(CANON, 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)

print('\nDone. Summary:')
for k,v in matched_summary.items():
    print(k, v['matched'], '->', v.get('cat_name'))
    for ex in v.get('examples',[]):
        print('   ex', ex)
