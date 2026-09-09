#!/usr/bin/env python3
"""
Renombra las primeras 10 imágenes descargadas usando el texto exacto del hover.
Genera nombres con prefijo numérico: 01_Titulo_sanitizado.ext

Uso: python3 clean_and_replace.py
"""
import os
import re
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
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join([c for c in nfkd if not unicodedata.combining(c)])


def sanitize_filename(name: str, default='image') -> str:
    if not name:
        return default
    name = name.strip()
    name = strip_accents(name)
    # remove smart quotes and fancy punctuation
    name = name.replace('“', '').replace('”', '').replace('’', "'")
    # remove html entities
    name = re.sub(r'&[a-zA-Z0-9#]+;', '', name)
    # replace invalid chars
    name = re.sub(r"[{}]+".format(INVALID_CHARS), '_', name)
    # replace any non-alnum with underscore
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


def find_local_file_for_src(out_dir, src_basename):
    files = [f for f in os.listdir(out_dir) if os.path.isfile(os.path.join(out_dir, f))]

    def normalize_for_match(name: str) -> str:
        # lower, remove trailing _N, remove size suffix like -300x211, remove -scaled
        n = name
        # strip path
        n = os.path.basename(n)
        # remove trailing index _2 before extension
        n = re.sub(r'_(\d+)(?=\.[^.]+$)', '', n)
        # collapse duplicate extensions: keep one
        parts = n.split('.')
        if len(parts) > 2:
            n = parts[0] + '.' + parts[-1]
        # remove size suffix before final extension
        n = re.sub(r'(-\d+x\d+)(?=\.[^.]+$)', '', n)
        n = re.sub(r'(-scaled)(?=\.[^.]+$)', '', n, flags=re.I)
        return n.lower()

    target_norm = normalize_for_match(src_basename)

    # 1) exact normalized match
    for f in files:
        if normalize_for_match(f) == target_norm:
            return os.path.join(out_dir, f)

    # 2) substring match (prefer shortest filename that contains the base)
    candidates = []
    base_no_ext = re.sub(r'(-\d+x\d+)(?=\.[^.]+$)', '', src_basename)
    base_no_ext = re.sub(r'\.[^.]+$', '', base_no_ext)
    for f in files:
        if base_no_ext in f:
            candidates.append(f)
    if candidates:
        candidates.sort(key=lambda x: len(x))
        return os.path.join(out_dir, candidates[0])

    # 3) fallback: longest common substring heuristic
    def lcs_len(a: str, b: str) -> int:
        # simple common substring length (not optimal but fine for short names)
        best = 0
        for i in range(len(a)):
            for j in range(i + 1, len(a) + 1):
                sub = a[i:j]
                if sub in b and len(sub) > best:
                    best = len(sub)
        return best

    best_file = None
    best_score = 0
    for f in files:
        score = lcs_len(src_basename.lower(), f.lower())
        if score > best_score:
            best_score = score
            best_file = f
    if best_file and best_score >= 6:
        return os.path.join(out_dir, best_file)

    return None


def extract_hover_title(img, base_url=BASE_URL):
    # prefer plugin caption elements
    parent = img.parent
    caption = None
    if parent:
        caption = parent.find(class_=re.compile(r'(gallery-item-caption-over|gallery-item-caption-wrap|caption-style-hoverer|gallery-item-caption)', re.I))
    if caption and caption.get_text(strip=True):
        return caption.get_text(' ', strip=True)
    # anchor attributes
    a = img.find_parent('a')
    if a:
        for attr in ('title','data-title','data-caption','aria-label'):
            if a.get(attr):
                return a.get(attr)
        # try linked page title
        href = a.get('href')
        if href:
            try:
                r = requests.get(urljoin(base_url, href), timeout=10)
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
    # image attrs
    for attr in ('title','alt'):
        if img.get(attr):
            return img.get(attr)
    # fallback to filename
    src = img.get('src') or img.get('data-src') or ''
    return os.path.basename(urlparse(src).path)


def main():
    print('Obteniendo HTML y preparando renombrado...')
    r = requests.get(BASE_URL, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, 'html.parser')
    imgs = get_image_elements(soup)
    print(f'Encontradas {len(imgs)} imágenes candidatas; procesando las primeras {MAX_IMAGES}...')

    mappings = []
    idx = 1
    for img in imgs[:MAX_IMAGES]:
        src = img.get('src') or img.get('data-src')
        if not src:
            continue
        parsed = urlparse(urljoin(BASE_URL, src))
        basename = os.path.basename(parsed.path)
        local = find_local_file_for_src(OUT_DIR, basename)
        if not local:
            print('No se encontró archivo local para', basename)
            continue
        title = extract_hover_title(img)
        safe = sanitize_filename(title)
        # determine extension from local file (use last extension)
        local_name = os.path.basename(local)
        parts = local_name.split('.')
        if len(parts) >= 2:
            ext = '.' + parts[-1]
        else:
            ext = '.jpg'
        new_name = f"{idx:02d}_{safe}{ext}"
        # avoid overwrite
        candidate = os.path.join(OUT_DIR, new_name)
        j = 1
        while os.path.exists(candidate):
            j += 1
            candidate = os.path.join(OUT_DIR, f"{idx:02d}_{safe}_{j}{ext}")
        os.rename(local, candidate)
        print(f'Renombrado: {os.path.basename(local)} -> {os.path.basename(candidate)}')
        mappings.append((local, candidate, title))
        idx += 1

    print('\nCompletado. Renombradas', len(mappings), 'imágenes.')
    # print mapping summary
    for old, new, title in mappings:
        print('-', os.path.basename(old), '->', os.path.basename(new), '| title:', title)


if __name__ == '__main__':
    main()
