#!/usr/bin/env python3
"""
Extrae textos asociados a las miniaturas del portfolio en la página objetivo
para identificar el texto que aparece al hacer hover.

Imprime los primeros 20 elementos con:
- src de la imagen
- href del enlace padre (si existe)
- textos en elementos cercanos que coincidan con caption/overlay/title/project
- texto visible del enlace/elemento
"""
import re
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://maquillajefxmexico.com/portfolio"

r = requests.get(BASE_URL, timeout=20)
r.raise_for_status()
soup = BeautifulSoup(r.text, 'html.parser')

# find candidate containers that look like portfolio items
candidates = []
# typical patterns: elements with class containing 'portfolio', 'project', 'item', 'masonry', 'grid'
for tag in soup.find_all(True):
    cls = ' '.join(tag.get('class') or [])
    if re.search(r'(portfolio|project|item|entry|grid|gallery|masonry)', cls, re.I):
        # if contains an img, consider
        if tag.find('img'):
            candidates.append(tag)

# fallback: any img under wp-content/uploads
if not candidates:
    candidates = [img.parent for img in soup.find_all('img', src=re.compile(r'/wp-content/uploads/'))]

seen = set()
count = 0
for node in candidates:
    if count >= 20:
        break
    img = node.find('img')
    if not img:
        continue
    src = img.get('src') or img.get('data-src') or ''
    key = src
    if key in seen:
        continue
    seen.add(key)
    href = None
    a = img.find_parent('a')
    if a and a.get('href'):
        href = a.get('href')
    # collect nearby texts
    texts = []
    # direct attributes
    for attr in ('title','alt','aria-label'):
        v = img.get(attr)
        if v:
            texts.append(('img_attr_'+attr, v.strip()))
    # attributes on link
    if a:
        for attr in ('title','aria-label','data-title','data-caption'):
            v = a.get(attr)
            if v:
                texts.append(('a_attr_'+attr, v.strip()))
    # search for overlay/caption/title inside node
    for el in node.find_all(True):
        cls = ' '.join(el.get('class') or [])
        if re.search(r'(caption|overlay|title|project|entry|case|meta)', cls, re.I):
            t = el.get_text(' ', strip=True)
            if t:
                texts.append(('nearby_class_'+cls, t))
    # also collect any small texts inside node
    alltext = node.get_text(' ', strip=True)
    if alltext:
        texts.append(('node_text', alltext))

    print('---')
    print('img src:', src)
    print('link href:', href)
    for k, v in texts:
        print(f'{k}: {v}')
    count += 1

print('Done')
