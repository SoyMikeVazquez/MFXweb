#!/usr/bin/env python3
"""
Asigna `order` solo a imágenes que aparecen en la galería (excluye logos/íconos).
- Detecta la galería en https://maquillajefxmexico.com/portfolio
- Normaliza basenames y hace matching con entries en images_canonical.json
- Excluye canonical entries cuyo src_url contenga patrones de logo/icon
- Asigna order 1..N solo a las coincidencias; las demás entradas reciben order = null
- Hace backup antes de escribir
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
BACKUP = ROOT / 'images_canonical.gallery.bak.json'
URL = 'https://maquillajefxmexico.com/portfolio'

if not CANON.exists():
    print('No canonical file found:', CANON)
    raise SystemExit(1)

with open(CANON, 'r', encoding='utf-8') as f:
    canonical = json.load(f)

# exclude patterns for non-gallery images
exclude_re = re.compile(r'logo|cropped|favicon|icon|avatar|badge|social|placeholder|blank|svg', re.I)

# normalization helpers (same as v2)
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

# Prepare canonical mapping, but mark excluded entries
canon_map = {}
included_idxs = set()
for i, e in enumerate(canonical):
    src = e.get('src_url') or ''
    b = os.path.basename(urlparse(src).path)
    if exclude_re.search(b) or exclude_re.search(src):
        # excluded: do not include in gallery mapping
        continue
    norm = normalize_basename(b)
    stem = b.rsplit('.', 1)[0]
    stem_norm = norm.rsplit('.', 1)[0] if '.' in norm else norm
    for key in [b, norm, stem, stem_norm]:
        canon_map.setdefault(key, []).append(i)
    included_idxs.add(i)

print('Canonical total items:', len(canonical))
print('Canonical items eligible for gallery mapping:', len(included_idxs))

# fetch page and gallery images in DOM order
resp = requests.get(URL, timeout=20)
resp.raise_for_status()
soup = BeautifulSoup(resp.text, 'html.parser')

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
    # skip page-level icons too
    if exclude_re.search(b) or exclude_re.search(full):
        continue
    ordered_basenames.append(b)

print('Found', len(ordered_basenames), 'gallery image tags in page container (after exclusions)')

# assign orders to matched canonical indices
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

print('Matched gallery items to canonical entries:', matched)

# For any included canonical entries that were not matched, keep them after matched ones preserving original relative order
for i in range(len(canonical)):
    if i in used_canon_idxs:
        continue
    if i not in included_idxs:
        # excluded items: leave order as null
        new_order[i] = None
        continue
    # included but not matched: append after matched
    new_order[i] = order_counter
    order_counter += 1

# backup and write
with open(BACKUP, 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)

for i, e in enumerate(canonical):
    e['order'] = new_order[i]

with open(CANON, 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)

print('Wrote updated canonical and backup. Total items:', len(canonical))
print('\nSample first 30 gallery-ordered items:')
for e in sorted([x for x in canonical if x.get('order')], key=lambda x: x['order'])[:30]:
    print(e['order'], e.get('filename'), '->', e.get('src_url'))

print('\nSample excluded items (first 10):')
count=0
for e in canonical:
    if e.get('order') is None:
        print('-', e.get('filename'), '->', e.get('src_url'))
        count+=1
        if count>=10:
            break
