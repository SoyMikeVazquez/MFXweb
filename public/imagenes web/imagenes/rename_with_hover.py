#!/usr/bin/env python3
"""
Busca las primeras 10 miniaturas en la página de portfolio, extrae un título representativo
(a partir de atributos de hover/anchor o del título de la página del item) y renombra
los archivos ya descargados en la carpeta `imagenes/` para usar ese título.

Uso: python3 rename_with_hover.py
"""
import os
import re
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://maquillajefxmexico.com/portfolio"
OUT_DIR = os.path.abspath(os.path.dirname(__file__))
MAX_IMAGES = 10

INVALID_CHARS = r"<>:\/\|\?\*\"\n\r\t"
MAX_NAME_LEN = 120


def sanitize_filename(name: str, default='image') -> str:
    name = name.strip()
    name = re.sub(r"&[a-zA-Z0-9#]+;", '', name)
    name = re.sub(r"[{}]+".format(INVALID_CHARS), '_', name)
    name = re.sub(r"\s+", '_', name)
    if not name:
        name = default
    if len(name) > MAX_NAME_LEN:
        name = name[:MAX_NAME_LEN]
    return name


def get_image_elements(soup):
    imgs = soup.find_all('img', src=re.compile(r'/wp-content/uploads/'))
    # dedupe by src
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


def extract_title_from_link(href):
    try:
        full = urljoin(BASE_URL, href)
        r = requests.get(full, timeout=15)
        r.raise_for_status()
        s = BeautifulSoup(r.text, 'html.parser')
        # try common patterns
        og = s.find('meta', property='og:title')
        if og and og.get('content'):
            return og.get('content')
        h1 = s.find('h1')
        if h1 and h1.get_text(strip=True):
            return h1.get_text(strip=True)
        title_tag = s.title
        if title_tag and title_tag.string:
            return title_tag.string.strip()
    except Exception:
        return None
    return None


def find_local_file_for_src(out_dir, src_basename):
    # try exact match first
    path = os.path.join(out_dir, src_basename)
    if os.path.exists(path):
        return path

    def normalize_name(name: str) -> str:
        # remove extension duplicates and keep final ext
        name = name or ''
        # remove trailing _N before extension
        name = re.sub(r'_(\d+)(?=\.[^.]+$)', '', name)
        # if multiple dots, keep only base and final ext for normalization
        parts = name.split('.')
        if len(parts) > 1:
            base = '.'.join(parts[:-1])
            ext = parts[-1]
        else:
            base = parts[0]
            ext = ''
        # remove common WP size suffix like -300x211 or -225x300 or -scaled
        base = re.sub(r'(-\d+x\d+)$', '', base)
        base = re.sub(r'(-scaled)$', '', base)
        # lowercase and strip
        return (base + ('.' + ext if ext else '')).lower()

    target_norm = normalize_name(src_basename)
    candidates = []
    for f in os.listdir(out_dir):
        fn = f
        if not os.path.isfile(os.path.join(out_dir, fn)):
            continue
        if src_basename in fn:
            candidates.append(fn)
            continue
        if normalize_name(fn) == target_norm:
            candidates.append(fn)

    if not candidates:
        # as fallback, try any file that contains the base (without size) substring
        base_no_size = re.sub(r'(-\d+x\d+)(?=\.[^.]+$)', '', src_basename)
        for f in os.listdir(out_dir):
            if base_no_size in f:
                candidates.append(f)

    if not candidates:
        return None

    # prefer exact-like matches, then shortest filename
    candidates = sorted(set(candidates), key=lambda x: (0 if x == src_basename else 1, len(x)))
    return os.path.join(out_dir, candidates[0])


def main():
    print('Obteniendo la página principal...')
    r = requests.get(BASE_URL, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, 'html.parser')
    imgs = get_image_elements(soup)
    print(f'Encontradas {len(imgs)} candidatas; procesando las primeras {MAX_IMAGES}...')
    renamed = []
    for i, img in enumerate(imgs[:MAX_IMAGES]):
        src = img.get('src') or img.get('data-src')
        if not src:
            continue
        full_src = urljoin(BASE_URL, src)
        parsed = urlparse(full_src)
        basename = os.path.basename(parsed.path)
        # determine desired title — prefer the hover caption added by the WP plugin
        title = None
        # look for caption elements added by the gallery plugin near the img
        parent = img.parent
        caption = None
        if parent:
            caption = parent.find(class_=re.compile(r'(gallery-item-caption-over|gallery-item-caption-wrap|caption-style-hoverer|gallery-item-caption-over|gallery-item-caption)', re.I))
        if caption and caption.get_text(strip=True):
            title = caption.get_text(' ', strip=True)
        else:
            # fallback: anchor attributes
            a = img.find_parent('a')
            if a:
                for attr in ('title','data-title','data-caption','aria-label'):
                    if a.get(attr):
                        title = a.get(attr)
                        break
                if not title and a.get('href'):
                    # as a last resort, try the linked page title
                    title = extract_title_from_link(a.get('href'))
        # still fallback to image attributes or filename
        if not title:
            for attr in ('title','alt'):
                if img.get(attr):
                    title = img.get(attr)
                    break
        if not title:
            title = basename
        name = sanitize_filename(title)
        # normalize extension: pick the last suffix after final dot to avoid .jpeg.jpeg
        parts = basename.split('.')
        if len(parts) >= 2:
            ext = '.' + parts[-1]
        else:
            ext = '.jpg'
        new_filename = f"{name}{ext}"
        # find local file (try exact basename, then variants)
        local = find_local_file_for_src(OUT_DIR, basename)
        if not local:
            print(f'[{i+1}] No se encontró archivo local para {basename}, se omitirá')
            continue
        # if local filename contains duplicate extension or _2 suffix from previous run, check a cleaned candidate
        local_name = os.path.basename(local)
        # propose a cleaned name by removing trailing _N before extension
        local_name_clean = re.sub(r'_(\d+)(?=\.[^.]+$)', '', local_name)
        if local_name_clean != local_name:
            candidate_path = os.path.join(OUT_DIR, local_name_clean)
            # only switch to the cleaned path if that file actually exists
            if os.path.exists(candidate_path):
                local = candidate_path
        new_path = os.path.join(OUT_DIR, new_filename)
        # avoid overwrite by adding index suffix if needed
        if os.path.exists(new_path):
            idx = 2
            base_no_ext = os.path.splitext(new_filename)[0]
            while True:
                candidate = os.path.join(OUT_DIR, f"{base_no_ext}_{idx}{ext}")
                if not os.path.exists(candidate):
                    new_path = candidate
                    break
                idx += 1
        os.rename(local, new_path)
        renamed.append((local, new_path))
        print(f'[{i+1}] {basename} -> {os.path.basename(new_path)}')
    print(f'Completado. Renombradas {len(renamed)} imágenes.')


if __name__ == '__main__':
    main()
