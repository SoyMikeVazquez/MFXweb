#!/usr/bin/env python3
"""
Asigna categorías buscando wrappers con clases tipo 'eael-filterable-gallery-item-wrap eael-cf-<slug>'
- Lee `images_canonical.json` y mapea basenames
- Para cada wrapper con clase eael-cf-*, recoge las <img> dentro y asocia entries
- Si se pasa SLUGS list, añade solo esas categorías
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
BACKUP = ROOT / 'images_canonical.eael.bak.json'
URL = 'https://maquillajefxmexico.com/portfolio'

# slugs to process (lowercase, hyphenated). Edit or replace with sys.argv in future.
SLUGS = ['character-make-up']

if not CANON.exists():
    print('Missing', CANON)
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

# build map
canon_map = {}
for i,e in enumerate(canonical):
    src = e.get('src_url','')
    b = src and Path(urlparse(src).path).name or ''
    norm = normalize_basename(b)
    stem = b.rsplit('.',1)[0]
    stem_norm = norm.rsplit('.',1)[0] if '.' in norm else norm
    for k in (b, norm, stem, stem_norm):
        canon_map.setdefault(k, []).append(i)

print('Fetching', URL)
resp = requests.get(URL, timeout=20)
resp.raise_for_status()
soup = BeautifulSoup(resp.text, 'html.parser')

# find wrappers
wrappers = soup.find_all(class_=re.compile(r'eael-filterable-gallery-item-wrap'))
print('Found', len(wrappers), 'filterable-item wrappers')

slug_to_matched = {s:0 for s in SLUGS}
slug_to_examples = {s:[] for s in SLUGS}

for w in wrappers:
    classes = ' '.join(w.get('class') or [])
    # find all eael-cf-... classes
    for m in re.finditer(r'eael-cf-([a-z0-9_-]+)', classes):
        cat_slug = m.group(1)
        # normalize hyphens/underscores
        cat_slug_norm = cat_slug.replace('_','-')
        if cat_slug_norm not in SLUGS:
            continue
        # collect imgs inside this wrapper
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
                # add category name derived from slug
                cat_name = ' '.join([p.capitalize() for p in cat_slug_norm.split('-')])
                cats = entry.get('categories') or []
                if cat_name not in cats:
                    cats.append(cat_name)
                    entry['categories'] = cats
                slug_to_matched[cat_slug_norm] += 1
                if len(slug_to_examples[cat_slug_norm]) < 6:
                    slug_to_examples[cat_slug_norm].append((entry.get('filename'), entry.get('src_url')))

# write backup and save
with open(BACKUP, 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)
with open(CANON, 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)

print('\nResults:')
for s in SLUGS:
    print('-', s, 'matched:', slug_to_matched[s])
    for ex in slug_to_examples[s]:
        print('   ex:', ex)

print('\nDone.')
