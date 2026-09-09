#!/usr/bin/env python3
"""
Asigna categorías en images_canonical.json buscando secciones por id (anchors) en
https://maquillajefxmexico.com/portfolio#slug
Uso: edita la variable ANCHORS más abajo o pásala por línea de comandos (no implementado si no).

Comportamiento:
- Para cada slug en ANCHORS, busca el elemento con id=slug o un ancla <a href="#slug"> y toma su contenedor
- Extrae todos los <img> dentro de esa sección (DOM) y asocia por basename normalizado con entries en canonical
- Añade la categoría (nombre derivado del slug, p.ej. 'character-makeup' -> 'Character Makeup') al campo `categories` (si no existe)
- Hace backup antes de modificar
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
BACKUP = ROOT / 'images_canonical.anchors.bak.json'
URL_BASE = 'https://maquillajefxmexico.com/portfolio'

# EDITA AQUI los slugs que quieres procesar (o pasa una lista desde fuera)
ANCHORS = [
    'character-makeup',
]

if not CANON.exists():
    print('No canonical file found:', CANON)
    raise SystemExit(1)

with open(CANON, 'r', encoding='utf-8') as f:
    canonical = json.load(f)

# normalization helpers (same as before)
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

# build mapping basename -> list of canonical indices
canon_map = {}
for i, e in enumerate(canonical):
    src = e.get('src_url') or ''
    b = os.path.basename(urlparse(src).path)
    norm = normalize_basename(b)
    stem = b.rsplit('.',1)[0]
    stem_norm = norm.rsplit('.',1)[0] if '.' in norm else norm
    for key in [b, norm, stem, stem_norm]:
        canon_map.setdefault(key, []).append(i)

print('Fetching page', URL_BASE)
resp = requests.get(URL_BASE, timeout=20)
resp.raise_for_status()
soup = BeautifulSoup(resp.text, 'html.parser')

# helper to derive human category name from slug
def slug_to_name(slug):
    parts = slug.replace('-', ' ').replace('_',' ').split()
    return ' '.join([p.capitalize() for p in parts])

matched_total = 0
per_anchor = {}

for slug in ANCHORS:
    cat_name = slug_to_name(slug)
    print('\nProcessing anchor:', slug, '-> category:', cat_name)
    # attempt to find an element with id=slug
    target = soup.find(id=slug)
    # if not found try to find <a href="#slug"> and take its parent section
    if target is None:
        a = soup.find('a', href=f'#{slug}')
        if a:
            # try parent that contains images
            parent = a.find_parent()
            # climb up until we find a container with imgs or until body
            node = parent
            found = None
            while node and node.name != 'body':
                if node.find('img'):
                    found = node
                    break
                node = node.find_parent()
            target = found or parent

    if target is None:
        print('  Could not find anchor/section for', slug)
        per_anchor[slug] = {'matched':0, 'note':'section not found'}
        continue

    imgs = target.find_all('img')
    print('  Found', len(imgs), 'img tags inside the section')
    matched = 0
    for img in imgs:
        src = img.get('src') or img.get('data-src') or ''
        if not src:
            continue
        full = urljoin(URL_BASE, src)
        b = os.path.basename(urlparse(full).path)
        keys = [b, normalize_basename(b), b.rsplit('.',1)[0], normalize_basename(b).rsplit('.',1)[0] if '.' in normalize_basename(b) else normalize_basename(b)]
        found_idx = None
        for k in keys:
            if k in canon_map:
                # choose first unmatched canonical index for this key
                for idx in canon_map[k]:
                    # we may match same canonical multiple times (if duplicates); allow duplicates
                    found_idx = idx
                    break
            if found_idx is not None:
                break
        if found_idx is None:
            # try partial match by looking for key substring in canonical basenames
            for canon_key, idxs in canon_map.items():
                if k in canon_key:
                    found_idx = idxs[0]
                    break
        if found_idx is not None:
            entry = canonical[found_idx]
            cats = entry.get('categories') or []
            if cat_name not in cats:
                cats.append(cat_name)
                entry['categories'] = cats
            matched += 1
    matched_total += matched
    per_anchor[slug] = {'matched': matched}
    print('  Matched', matched, 'images for category', cat_name)

# write backup and save
with open(BACKUP, 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)

with open(CANON, 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)

print('\nDone. Total matched across anchors:', matched_total)
print('Per-anchor summary:')
for k,v in per_anchor.items():
    print(' -', k, v)

print('\nSample entries updated (first 30 with non-empty categories):')
count=0
for e in canonical:
    if e.get('categories'):
        print('-', e.get('filename'), '=>', e.get('categories'))
        count+=1
        if count>=30:
            break
