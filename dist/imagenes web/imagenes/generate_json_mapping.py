#!/usr/bin/env python3
"""
Genera un archivo JSON con el mapeo de las primeras 10 imágenes del portfolio:
- index
- src_url (original)
- hover_title (texto mostrado al hacer hover)
- local_filename (archivo guardado en la carpeta)
- suggested_filename (sanitizado, con prefijo numérico)

Salida: images_mapping.json en la misma carpeta.
"""
import os
import re
import json
import unicodedata
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://maquillajefxmexico.com/portfolio"
OUT_DIR = os.path.abspath(os.path.dirname(__file__))
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
    name = strip_accents(name)
    name = name.replace('“', '').replace('”', '').replace('’', "'")
    name = re.sub(r'&[a-zA-Z0-9#]+;', '', name)
    name = re.sub(r"[{}]+".format(INVALID_CHARS), '_', name)
    name = re.sub(r'[^0-9A-Za-z_\-]+', '_', name)
    name = re.sub(r'_+', '_', name)
    name = name.strip('_')
    if not name:
        name = default
    if len(name) > MAX_NAME_LEN:
        name = name[:MAX_NAME_LEN]
    return name


def get_image_elements(soup):
    imgs = soup.find_all('img', src=re.compile(r'/wp-content/uploads/'))
    seen = set()
    out = []
    for img in imgs:
        src = img.get('src') or img.get('data-src')
        if not src:
            continue
        full = urljoin(BASE_URL, src)
        if full in seen:
            continue
        seen.add(full)
        out.append(img)
    return out


def normalize_for_match(name: str) -> str:
    n = os.path.basename(name)
    n = re.sub(r'_(\d+)(?=\.[^.]+$)', '', n)
    parts = n.split('.')
    if len(parts) > 2:
        n = parts[0] + '.' + parts[-1]
    n = re.sub(r'(-\d+x\d+)(?=\.[^.]+$)', '', n)
    n = re.sub(r'(-scaled)(?=\.[^.]+$)', '', n, flags=re.I)
    return n.lower()


def find_local_file_for_src(out_dir, src_basename):
    files = [f for f in os.listdir(out_dir) if os.path.isfile(os.path.join(out_dir, f))]
    # exact
    if src_basename in files:
        return src_basename
    target = normalize_for_match(src_basename)
    for f in files:
        if normalize_for_match(f) == target:
            return f
    # substring
    base_no_ext = re.sub(r'(-\d+x\d+)(?=\.[^.]+$)', '', src_basename)
    base_no_ext = re.sub(r'\.[^.]+$', '', base_no_ext)
    for f in files:
        if base_no_ext in f:
            return f
    # lcs heuristic
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
        s = lcs_len(src_basename, f)
        if s > best_score:
            best_score = s; best_file = f
    if best_file and best_score >= 6:
        return best_file
    return None


def extract_hover_title(img):
    parent = img.parent
    caption = None
    if parent:
        caption = parent.find(class_=re.compile(r'(gallery-item-caption-over|gallery-item-caption-wrap|caption-style-hoverer|gallery-item-caption)', re.I))
    if caption and caption.get_text(strip=True):
        return caption.get_text(' ', strip=True)
    a = img.find_parent('a')
    if a:
        for attr in ('title','data-title','data-caption','aria-label'):
            if a.get(attr):
                return a.get(attr)
        href = a.get('href')
        if href:
            try:
                r = requests.get(urljoin(BASE_URL, href), timeout=10)
                r.raise_for_status()
                s = BeautifulSoup(r.text, 'html.parser')
                og = s.find('meta', property='og:title')
                if og and og.get('content'):
                    return og.get('content')
                h1 = s.find('h1')
                if h1 and h1.get_text(strip=True):
                    return h1.get_text(strip=True)
            except Exception:
                pass
    for attr in ('title','alt'):
        if img.get(attr):
            return img.get(attr)
    src = img.get('src') or img.get('data-src') or ''
    return os.path.basename(urlparse(src).path)


def main():
    r = requests.get(BASE_URL, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, 'html.parser')
    imgs = get_image_elements(soup)

    out = []
    idx = 1
    for img in imgs[:MAX_IMAGES]:
        src = img.get('src') or img.get('data-src')
        if not src:
            continue
        src_full = urljoin(BASE_URL, src)
        basename = os.path.basename(urlparse(src_full).path)
        local = find_local_file_for_src(OUT_DIR, basename)
        title = extract_hover_title(img)
        suggested = sanitize_filename(title)
        # extension from local if exists else from src
        if local:
            ext = os.path.splitext(local)[1]
        else:
            ext = os.path.splitext(basename)[1] or '.jpg'
        suggested_name = f"{idx:02d}_{suggested}{ext}"
        out.append({
            'index': idx,
            'src_url': src_full,
            'hover_title': title,
            'local_filename': local,
            'suggested_filename': suggested_name
        })
        idx += 1

    json_path = os.path.join(OUT_DIR, 'images_mapping.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print('Generado:', json_path)


if __name__ == '__main__':
    main()
