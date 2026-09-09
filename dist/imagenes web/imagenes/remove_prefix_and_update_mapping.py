#!/usr/bin/env python3
"""
Quita prefijos numéricos tipo '01_' de los nombres de los archivos listados en
images_mapping_strict.json y genera images_mapping_no_prefix.json con el mismo orden
pero filenames sin prefijo. No sobrescribe si hay colisiones: añade sufijo _1, _2...
"""
import os
import json
import re
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent
STRICT = OUT_DIR / 'images_mapping_strict.json'
OUT = OUT_DIR / 'images_mapping_no_prefix.json'

if not STRICT.exists():
    print('No se encontró', STRICT)
    raise SystemExit(1)

with open(STRICT, 'r', encoding='utf-8') as f:
    data = json.load(f)

new_mappings = []
existing = set(os.listdir(OUT_DIR))
for item in data:
    idx = item.get('index')
    src = item.get('src_url')
    caption = item.get('hover_caption')
    old = item.get('old_local_filename')
    new_with_prefix = item.get('new_local_filename') or item.get('new_local_filename')
    if not new_with_prefix:
        # fallback to constructed name
        new_with_prefix = item.get('new_local_filename')
    # remove leading NN_ prefix
    if new_with_prefix:
        no_pref = re.sub(r'^\d{2}_', '', new_with_prefix)
        # ensure no duplicates
        candidate = no_pref
        k = 1
        while candidate in existing:
            name, ext = os.path.splitext(no_pref)
            candidate = f"{name}_{k}{ext}"
            k += 1
        # perform rename on disk if the file exists with prefix
        if (OUT_DIR / new_with_prefix).exists():
            try:
                (OUT_DIR / new_with_prefix).rename(OUT_DIR / candidate)
                print(f'Renamed on disk: {new_with_prefix} -> {candidate}')
                existing.add(candidate)
                if new_with_prefix in existing:
                    existing.discard(new_with_prefix)
            except Exception as e:
                print('Error renaming', new_with_prefix, '->', candidate, e)
        else:
            # maybe file already had no prefix or different name
            if (OUT_DIR / candidate).exists():
                # already present
                existing.add(candidate)
            else:
                print('Archivo esperado no encontrado en disk:', new_with_prefix)
        new_mappings.append({
            'order': idx,
            'src_url': src,
            'hover_caption': caption,
            'filename': candidate,
            'category': None
        })
    else:
        print('No new_local_filename for item', idx)

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(new_mappings, f, ensure_ascii=False, indent=2)

print('Wrote', OUT)
