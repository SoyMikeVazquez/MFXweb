#!/usr/bin/env python3
"""
Reasigna `order` en images_canonical.json según el orden visual en la página
https://maquillajefxmexico.com/portfolio (DOM order of gallery items).
Hace backup antes de aplicar cambios.
"""
import os
import json
from urllib.parse import urljoin, urlparse
from pathlib import Path
import re

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
CANON = ROOT / 'images_canonical.json'
BACKUP = ROOT / 'images_canonical.siteorder.bak.json'
URL = 'https://maquillajefxmexico.com/portfolio'

if not CANON.exists():
    print('No canonical file found:', CANON)
    raise SystemExit(1)

with open(CANON, 'r', encoding='utf-8') as f:
    canonical = json.load(f)

# build map basename -> list of entries indices in canonical
canon_map = {}
for i, e in enumerate(canonical):
    src = e.get('src_url') or ''
    b = os.path.basename(urlparse(src).path)
    canon_map.setdefault(b, []).append(i)

# fetch page and find gallery item images in DOM order
print('Fetching page', URL)
resp = requests.get(URL, timeout=20)
resp.raise_for_status()
soup = BeautifulSoup(resp.text, 'html.parser')

# try to find a gallery container first
candidates = []
for tag in soup.find_all(['section','div','ul']):
    cls = ' '.join(tag.get('class') or [])
    if re.search(r'portfolio|gallery|masonry|grid|gallery-items|gallery-wrapper', cls, re.I):
        candidates.append(tag)

# if we found containers, pick the one with most images
best = None; best_count = 0
for c in candidates:
    imgs = c.find_all('img')
    if len(imgs) > best_count:
        best_count = len(imgs); best = c

if best is None:
    # fallback: all imgs under body
    imgs = soup.find_all('img')
else:
    imgs = best.find_all('img')

print('Found', len(imgs), 'img tags in chosen container')

# produce ordered list of basenames (normalized)
ordered_basenames = []
for img in imgs:
    src = img.get('src') or img.get('data-src') or ''
    if not src:
        continue
    full = urljoin(URL, src)
    b = os.path.basename(urlparse(full).path)
    ordered_basenames.append(b)

# Now assign order by scanning ordered_basenames and matching canonical entries
# We'll assign lowest possible order to matching items, and for canonical entries not found we'll append them at the end preserving current relative order
new_order = [None] * len(canonical)
order_counter = 1
used_canon_idxs = set()

for b in ordered_basenames:
    if b in canon_map:
        for canon_idx in canon_map[b]:
            if canon_idx in used_canon_idxs:
                continue
            new_order[canon_idx] = order_counter
            used_canon_idxs.add(canon_idx)
            order_counter += 1
            break

# append remaining canonical entries not assigned yet
for i in range(len(canonical)):
    if i in used_canon_idxs:
        continue
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
print('\nSample first 20 orders:')
for e in canonical[:20]:
    print(e.get('order'), e.get('filename'))
