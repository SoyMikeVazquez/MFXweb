#!/usr/bin/env python3
"""
Construye un único JSON canónico `images_canonical.json` que combine:
- images_mapping_no_prefix.json (filenames finales sin prefijo)
- images_captions_strict.json (src -> caption)
- images_categories.json (src -> categories)

Reglas:
- Dedupe por src_url (prefer mapping entries present in mapping_no_prefix when available).
- Campos en cada entrada: id (order or index), src_url, filename, hover_caption, categories (list), original_local (if any)
- Asegura que filenames sean únicos en disco; si colisión añade suffix `_1`, `_2`.

Salida: images_canonical.json
"""
import os
import json
from pathlib import Path
from urllib.parse import urljoin

OUT_DIR = Path(__file__).resolve().parent
NO_PREFIX = OUT_DIR / 'images_mapping_no_prefix.json'
CAPTIONS = OUT_DIR / 'images_captions_strict.json'
CATS = OUT_DIR / 'images_categories.json'
OUT = OUT_DIR / 'images_canonical.json'

# load helper
def load(path):
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

map_no_pref = load(NO_PREFIX) or []
captions = load(CAPTIONS) or []
categories = load(CATS) or []

# index captions by src_url
cap_idx = {c.get('src'): c.get('caption') for c in captions}
# categories file uses 'src_url' as key
cat_idx = {c.get('src_url'): c.get('categories') for c in categories}

# existing filenames on disk
files_on_disk = set(os.listdir(OUT_DIR))

canonical = []
seen_src = set()

# prefer items present in map_no_pref (keeps order)
for item in map_no_pref:
    src = item.get('src_url')
    if not src or src in seen_src:
        continue
    seen_src.add(src)
    caption = item.get('hover_caption') or cap_idx.get(src)
    cats = cat_idx.get(src) or []
    filename = item.get('filename')
    # ensure filename exists or is unique
    if filename in files_on_disk:
        # OK
        pass
    else:
        # maybe different case: try to find matching file by basename
        # leave as-is; it may be missing
        pass
    canonical.append({
        'src_url': src,
        'filename': filename,
        'hover_caption': caption,
        'categories': cats,
        'order': item.get('order')
    })

# add any captions not present in mapping
for c in captions:
    src = c.get('src')
    if not src or src in seen_src:
        continue
    seen_src.add(src)
    caption = c.get('caption')
    cats = cat_idx.get(src) or []
    # try to find local file
    # heuristics: find any file that contains basename
    basename = os.path.basename(src)
    local = None
    for f in files_on_disk:
        if basename in f:
            local = f
            break
    canonical.append({
        'src_url': src,
        'filename': local,
        'hover_caption': caption,
        'categories': cats,
        'order': None
    })

# final pass: ensure filenames unique and not None; if None, create suggested name
def safe_unique_name(name, existing):
    if not name:
        base = 'image'
        ext = '.jpg'
    else:
        base, ext = os.path.splitext(name)
        if not ext:
            ext = '.jpg'
    candidate = base + ext
    k = 1
    while candidate in existing:
        candidate = f"{base}_{k}{ext}"
        k += 1
    existing.add(candidate)
    return candidate

existing = set(os.listdir(OUT_DIR))
for entry in canonical:
    fname = entry.get('filename')
    if fname and fname in existing:
        # okay
        continue
    # generate safe suggested name from caption
    caption = entry.get('hover_caption') or 'image'
    # sanitize caption to filename-ish
    safe = ''.join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in caption)
    safe = '_'.join(safe.split())
    safe = safe.strip('_')
    if not safe:
        safe = 'image'
    # choose extension from src
    ext = os.path.splitext(entry['src_url'])[1] or '.jpg'
    suggested = f"{safe}{ext}"
    entry['filename'] = safe_unique_name(suggested, existing)

# write canonical
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)

print('Wrote', OUT)
print('Total entries:', len(canonical))
