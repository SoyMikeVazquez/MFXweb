#!/usr/bin/env python3
"""
Lee images_captions_strict.json y genera images_mapping_strict.json; renombra archivos locales
para usar los captions estrictos (sanitizados) con prefijo numérico.

Uso: python3 apply_strict_mapping_and_rename.py
"""
import os
import re
import json
import unicodedata
from urllib.parse import urlparse, urljoin

OUT_DIR = os.path.abspath(os.path.dirname(__file__))
CAPTIONS_PATH = os.path.join(OUT_DIR, 'images_captions_strict.json')
MAPPING_OUT = os.path.join(OUT_DIR, 'images_mapping_strict.json')
MAX_IMAGES = 10

INVALID_CHARS = r"<>:\/\|\?\*\"\n\r\t"
MAX_NAME_LEN = 120


def strip_accents(text: str) -> str:
    if not text:
        return ''
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join([c for c in nfkd if not unicodedata.combining(c)])


def sanitize_filename(name: str, default='image') -> str:
    if not name:
        return default
    name = name.strip()
    # replace smart quotes
    name = name.replace('“','').replace('”','').replace('’',"'")
    name = strip_accents(name)
    # replace entities
    name = re.sub(r'&[a-zA-Z0-9#]+;', '', name)
    # replace invalid chars with underscore
    name = re.sub(r"[{}]+".format(INVALID_CHARS), '_', name)
    # replace sequences of non-alnum with underscore
    name = re.sub(r'[^0-9A-Za-z\-]+', '_', name)
    name = re.sub(r'_+', '_', name)
    name = name.strip('_')
    if not name:
        name = default
    if len(name) > MAX_NAME_LEN:
        name = name[:MAX_NAME_LEN]
    return name


def normalize_for_match(name: str) -> str:
    n = os.path.basename(name)
    n = re.sub(r'_(\d+)(?=\.[^.]+$)', '', n)
    parts = n.split('.')
    if len(parts) > 2:
        n = parts[0] + '.' + parts[-1]
    n = re.sub(r'(-\d+x\d+)(?=\.[^.]+$)', '', n)
    n = re.sub(r'(-scaled)(?=\.[^.]+$)', '', n, flags=re.I)
    return n.lower()


def find_local_file_for_src(src_url):
    files = [f for f in os.listdir(OUT_DIR) if os.path.isfile(os.path.join(OUT_DIR, f))]
    basename = os.path.basename(urlparse(src_url).path)
    # exact
    if basename in files:
        return basename
    target = normalize_for_match(basename)
    for f in files:
        if normalize_for_match(f) == target:
            return f
    # substring
    base_no_ext = re.sub(r'(-\d+x\d+)(?=\.[^.]+$)', '', basename)
    base_no_ext = re.sub(r'\.[^.]+$', '', base_no_ext)
    for f in files:
        if base_no_ext in f:
            return f
    # lcs fallback
    def lcs_len(a: str, b: str) -> int:
        best = 0
        a = a.lower(); b = b.lower()
        for i in range(len(a)):
            for j in range(i + 1, len(a) + 1):
                sub = a[i:j]
                if sub in b and len(sub) > best:
                    best = len(sub)
        return best
    best_file = None; best_score = 0
    for f in files:
        s = lcs_len(basename, f)
        if s > best_score:
            best_score = s; best_file = f
    if best_file and best_score >= 6:
        return best_file
    return None


def main():
    if not os.path.exists(CAPTIONS_PATH):
        print('Captions file not found:', CAPTIONS_PATH)
        return
    with open(CAPTIONS_PATH, 'r', encoding='utf-8') as f:
        captions = json.load(f)

    mapping = []
    idx = 1
    for it in captions[:MAX_IMAGES]:
        src = it.get('src')
        caption = it.get('caption') or ''
        local = find_local_file_for_src(src)
        suggested_base = sanitize_filename(caption)
        # determine extension
        if local:
            ext = os.path.splitext(local)[1]
        else:
            ext = os.path.splitext(urlparse(src).path)[1] or '.jpg'
        new_name = f"{idx:02d}_{suggested_base}{ext}"
        # if file exists and name equals current, skip
        renamed = None
        if local:
            local_path = os.path.join(OUT_DIR, local)
            new_path = os.path.join(OUT_DIR, new_name)
            # avoid overwriting by incrementing suffix
            if os.path.exists(new_path):
                # if it's the same file, fine
                if os.path.samefile(local_path, new_path):
                    renamed = new_name
                else:
                    k = 2
                    while True:
                        candidate = os.path.join(OUT_DIR, f"{idx:02d}_{suggested_base}_{k}{ext}")
                        if not os.path.exists(candidate):
                            new_path = candidate
                            new_name = os.path.basename(new_path)
                            break
                        k += 1
                    os.rename(local_path, new_path)
                    renamed = new_name
            else:
                try:
                    os.rename(local_path, new_path)
                    renamed = new_name
                except Exception as e:
                    print('Error renaming', local_path, '->', new_path, e)
        mapping.append({
            'index': idx,
            'src_url': src,
            'hover_caption': caption,
            'old_local_filename': local,
            'new_local_filename': renamed or new_name
        })
        idx += 1

    with open(MAPPING_OUT, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print('Wrote mapping:', MAPPING_OUT)
    for m in mapping:
        print(m['index'], m['old_local_filename'], '->', m['new_local_filename'], '| caption:', m['hover_caption'])

if __name__ == '__main__':
    main()
