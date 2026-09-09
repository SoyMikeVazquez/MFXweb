#!/usr/bin/env python3
"""
Asigna el campo `order` de `images_canonical.json` según la posición actual en el archivo.
Hace una copia de seguridad `images_canonical.bak.json` antes de sobrescribir.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CANON = ROOT / 'images_canonical.json'
BACKUP = ROOT / 'images_canonical.bak.json'

if not CANON.exists():
    print('No se encontró', CANON)
    raise SystemExit(1)

with open(CANON, 'r', encoding='utf-8') as f:
    data = json.load(f)

# backup
with open(BACKUP, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# assign orders by position (1-based)
for i, item in enumerate(data, start=1):
    item['order'] = i

with open(CANON, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Updated', CANON)
print('Wrote backup to', BACKUP)
print('Total items:', len(data))
print('\nSample (first 15):')
for item in data[:15]:
    print(item.get('order'), item.get('filename'))
