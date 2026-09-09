#!/usr/bin/env python3
"""
Mejor versión: reasigna `order` normalizando nombres para una mejor coincidencia.
"""
import os
import json
from urllib.parse import urljoin, urlparse
from pathlib import Path
import re
import unicodedata

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
CANON = ROOT / 'images_canonical.json'
BACKUP = ROOT / 'images_canonical.siteorder.v2.bak.json'
URL = 'https://maquillajefxmexico.com/portfolio'

if not CANON.exists():
    print('No canonical file found:', CANON)
    raise SystemExit(1)

with open(CANON, 'r', encoding='utf-8') as f:
    canonical = json.load(f)

# normalization helpers
size_suffix_re = re.compile(r"[-_]\d{1,4}x\d{1,4}(?:-\d+)?")
dup_ext_re = re.compile(r"(\.[a-zA-Z0-9]+)\1+$")
nonword_re = re.compile(r"[^a-z0-9]+")

def normalize_basename(b):
    # lowercase
    b = b.lower()
    # collapse duplicate extensions like .jpeg.jpeg -> .jpeg
    b = dup_ext_re.sub(r"\1", b)
    # remove size suffixes before extension
    parts = b.rsplit('.', 1)
    if len(parts) == 2:
        name, ext = parts
        name = size_suffix_re.sub('', name)
        b = f"{name}.{ext}"
    else:
        b = size_suffix_re.sub('', b)
    # strip accents
    b = unicodedata.normalize('NFKD', b)
    b = ''.join([c for c in b if not unicodedata.combining(c)])
    # replace non-word with underscore
    b = nonword_re.sub('_', b).strip('_')
    return b

# build multi-key map: original basename, normalized basename, stem, normalized stem
canon_map = {}
for i, e in enumerate(canonical):
    src = e.get('src_url') or ''
    b = os.path.basename(urlparse(src).path)
    norm = normalize_basename(b)
    stem = b.rsplit('.', 1)[0]
    stem_norm = norm.rsplit('.', 1)[0] if '.' in norm else norm
    for key in [b, norm, stem, stem_norm]:
        canon_map.setdefault(key, []).append(i)

print('Fetching page', URL)
resp = requests.get(URL, timeout=20)
resp.raise_for_status()
soup = BeautifulSoup(resp.text, 'html.parser')

# find best gallery container
candidates = []
for tag in soup.find_all(['section','div','ul']):
    cls = ' '.join(tag.get('class') or [])
    if re.search(r'portfolio|gallery|masonry|grid|gallery-items|gallery-wrapper', cls, re.I):
        candidates.append(tag)
best = None; best_count = 0
for c in candidates:
    imgs = c.find_all('img')
    if len(imgs) > best_count:
        best_count = len(imgs); best = c
if best is None:
    imgs = soup.find_all('img')
else:
    imgs = best.find_all('img')

ordered_basenames = []
for img in imgs:
    src = img.get('src') or img.get('data-src') or ''
    if not src:
        continue
    full = urljoin(URL, src)
    b = os.path.basename(urlparse(full).path)
    ordered_basenames.append(b)

print('Found', len(ordered_basenames), 'images in page container')

# assign orders using normalized matching
new_order = [None] * len(canonical)
order_counter = 1
used_canon_idxs = set()
matched = 0

for b in ordered_basenames:
    keys = [b, normalize_basename(b), b.rsplit('.',1)[0], normalize_basename(b).rsplit('.',1)[0] if '.' in normalize_basename(b) else normalize_basename(b)]
    found = False
    for k in keys:
        if k in canon_map:
            for canon_idx in canon_map[k]:
                if canon_idx in used_canon_idxs:
                    continue
                new_order[canon_idx] = order_counter
                used_canon_idxs.add(canon_idx)
                order_counter += 1
                matched += 1
                found = True
                break
        if found:
            break

# append remaining
for i in range(len(canonical)):
    if i in used_canon_idxs:
        continue
    new_order[i] = order_counter
    order_counter += 1

with open(BACKUP, 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)

for i, e in enumerate(canonical):
    e['order'] = new_order[i]

with open(CANON, 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)

print('Wrote updated canonical and backup. Total items:', len(canonical))
print('Matched items from page:', matched)
print('\nSample first 30 orders:')
for e in sorted(canonical, key=lambda x: x.get('order', 9999))[:30]:
    print(e.get('order'), e.get('filename'), '->', e.get('src_url'))
