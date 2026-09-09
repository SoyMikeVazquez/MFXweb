#!/usr/bin/env python3
"""
Extrae estrictamente los captions del plugin para cada item del portfolio y muestra
src + caption para confirmar los títulos que aparecen en hover.
Genera images_captions_strict.json
"""
import os
import re
import json
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://maquillajefxmexico.com/portfolio"
OUT_DIR = os.path.abspath(os.path.dirname(__file__))

r = requests.get(BASE_URL, timeout=20)
r.raise_for_status()
soup = BeautifulSoup(r.text, 'html.parser')

items = []
# Look for gallery item wrappers — search for nodes that contain both img and caption classes
for node in soup.find_all(True):
    # node must contain an img and a caption element of the plugin
    if not node.find('img'):
        continue
    caption_el = node.find(class_=re.compile(r'(gallery-item-caption-over|gallery-item-caption-wrap|caption-style-hoverer|gallery-item-caption)', re.I))
    if caption_el:
        img = node.find('img')
        src = img.get('src') or img.get('data-src') or ''
        caption_text = caption_el.get_text(' ', strip=True)
        items.append({'src': urljoin(BASE_URL, src), 'caption': caption_text})

# dedupe by src
seen = set(); final = []
for it in items:
    if it['src'] in seen:
        continue
    seen.add(it['src'])
    final.append(it)

# take first 20 for inspection
out = final[:20]
path = os.path.join(OUT_DIR, 'images_captions_strict.json')
with open(path, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print('Wrote', path)
for i, it in enumerate(out, 1):
    print(i, it['src'])
    print('   ->', it['caption'])
