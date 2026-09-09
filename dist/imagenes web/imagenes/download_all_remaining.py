#!/usr/bin/env python3
"""
Descarga todas las imágenes del portfolio que aún no estén en images_canonical.json.
- No duplica las primeras 10 ya procesadas.
- Guarda imágenes en la carpeta `imagenes/` con nombres sanitizados (sin prefijo numérico).
- Actualiza `images_canonical.json` agregando las nuevas entradas.

Uso: python3 download_all_remaining.py
"""
import os
import re
import json
import unicodedata
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

OUT_DIR = os.path.abspath(os.path.dirname(__file__))
CANONICAL = os.path.join(OUT_DIR, 'images_canonical.json')
BASE_URL = 'https://maquillajefxmexico.com/portfolio'

# helpers
INVALID_CHARS = r"<>:\/\|\?\*\"\n\r\t"


def strip_accents(text: str) -> str:
    if not text:
        return ''
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join([c for c in nfkd if not unicodedata.combining(c)])


def sanitize_filename(name: str, default='image') -> str:
    if not name:
        return default
    name = name.strip()
    name = name.replace('“','').replace('”','').replace('’',"'")
    name = strip_accents(name)
    name = re.sub(r'&[a-zA-Z0-9#]+;', '', name)
    name = re.sub(r"[{}]+".format(INVALID_CHARS), '_', name)
    # replace non-alnum with underscore
    name = re.sub(r'[^0-9A-Za-z\-]+', '_', name)
    name = re.sub(r'_+', '_', name)
    name = name.strip('_')
    if not name:
        name = default
    return name


def safe_unique_name(base_name: str, existing_files: set, ext: str):
    base, _ = os.path.splitext(base_name)
    candidate = f"{base}{ext}"
    k = 1
    while candidate in existing_files:
        candidate = f"{base}_{k}{ext}"
        k += 1
    existing_files.add(candidate)
    return candidate


def download_url(url, path):
    try:
        r = requests.get(url, stream=True, timeout=30)
        r.raise_for_status()
        with open(path, 'wb') as f:
            for chunk in r.iter_content(1024 * 8):
                f.write(chunk)
        return True
    except Exception as e:
        print('Download error', url, e)
        return False


def load_canonical():
    if os.path.exists(CANONICAL):
        with open(CANONICAL, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def save_canonical(data):
    with open(CANONICAL, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# start
print('Fetching portfolio page...')
resp = requests.get(BASE_URL, timeout=20)
resp.raise_for_status()
soup = BeautifulSoup(resp.text, 'html.parser')

# find all items with plugin captions
nodes = []
for node in soup.find_all(True):
    if not node.find('img'):
        continue
    caption_el = node.find(class_=re.compile(r'(gallery-item-caption-over|gallery-item-caption-wrap|caption-style-hoverer|gallery-item-caption)', re.I))
    if caption_el:
        img = node.find('img')
        src = img.get('src') or img.get('data-src') or ''
        a = img.find_parent('a')
        href = a.get('href') if a and a.get('href') else None
        nodes.append({'node': node, 'img': img, 'src': urljoin(BASE_URL, src), 'href': href, 'caption': caption_el.get_text(' ', strip=True)})

# dedupe by src
seen = set(); items = []
for it in nodes:
    if it['src'] in seen:
        continue
    seen.add(it['src'])
    items.append(it)

print('Found', len(items), 'unique items on page')

canonical = load_canonical()
existing_srcs = set([c['src_url'] for c in canonical])
files_on_disk = set(os.listdir(OUT_DIR))
next_added = 0
max_idx = max([c['order'] for c in canonical if c.get('order')], default=0) if canonical else 0

for it in items:
    src = it['src']
    if src in existing_srcs:
        # skip already processed
        continue
    caption = it['caption']
    href = it['href']
    # prefer href if points to uploads
    download_url_candidate = None
    if href and '/wp-content/uploads/' in href:
        download_url_candidate = href
    else:
        # sometimes img src is a thumbnail; try the image src (could be fine)
        download_url_candidate = src
    # determine extension
    parsed = urlparse(download_url_candidate)
    ext = os.path.splitext(parsed.path)[1] or '.jpg'
    safe_base = sanitize_filename(caption)
    filename = safe_unique_name(f"{safe_base}{ext}", files_on_disk, ext)
    # download
    out_path = os.path.join(OUT_DIR, filename)
    ok = download_url(download_url_candidate, out_path)
    if not ok:
        print('Fallo descarga para', download_url_candidate, '— omitiendo')
        continue
    # attempt to extract categories by inspecting node attrs like data-groups or classes
    cats = []
    node = it['node']
    # check data attributes
    dg = node.get('data-groups') or node.get('data-filter') or node.get('data-category')
    if dg:
        # parse common cases
        parts = re.split(r'[\[\],"\s]+', str(dg))
        for p in parts:
            p = p.strip()
            if p:
                cats.append(p)
    # if none, try following href page for category metadata
    if not cats and href:
        try:
            r2 = requests.get(href, timeout=10)
            r2.raise_for_status()
            s2 = BeautifulSoup(r2.text, 'html.parser')
            # try meta article:section
            m = s2.find('meta', property='article:section') or s2.find('meta', attrs={'name':'category'})
            if m and m.get('content'):
                cats.append(m.get('content'))
        except Exception:
            pass
    # append to canonical
    entry = {
        'src_url': src,
        'filename': filename,
        'hover_caption': caption,
        'categories': cats,
        'order': None
    }
    canonical.append(entry)
    existing_srcs.add(src)
    next_added += 1
    print('Added:', filename, 'from', download_url_candidate)

# save canonical
if next_added:
    save_canonical(canonical)
    print('Updated canonical with', next_added, 'new items')
else:
    print('No new items to add')
