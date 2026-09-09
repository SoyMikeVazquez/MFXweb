#!/usr/bin/env python3
"""
Descarga las primeras 10 imágenes de https://maquillajefxmexico.com/portfolio
y las guarda en la carpeta `imagenes/` con nombres tomados del texto de hover (o alt/title).

Uso: python3 download_portfolio.py

Requisitos: requests, beautifulsoup4
"""
import os
import re
import sys
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://maquillajefxmexico.com/portfolio"
OUT_DIR = os.path.abspath(os.path.dirname(__file__))  # carpeta `imagenes` en workspace
MAX_IMAGES = 10

INVALID_CHARS = r"<>:\/\|\?\*\"\n\r\t"
MAX_NAME_LEN = 120


def sanitize_filename(name: str, default='image') -> str:
    name = name.strip()
    # remove html entities
    name = re.sub(r"&[a-zA-Z0-9#]+;", '', name)
    # replace invalid chars with underscore
    name = re.sub(r"[{}]+".format(INVALID_CHARS), '_', name)
    # collapse spaces
    name = re.sub(r"\s+", '_', name)
    # trim
    if not name:
        name = default
    if len(name) > MAX_NAME_LEN:
        name = name[:MAX_NAME_LEN]
    return name


def choose_title(img, a_tag=None):
    # Prefer title/alt attributes from image or anchor; fall back to nearby caption text
    for attr in ('title', 'alt'):
        v = img.get(attr)
        if v:
            return v
    if a_tag is not None:
        for attr in ('title', 'aria-label'):
            v = a_tag.get(attr)
            if v:
                return v
    # look for overlay/caption siblings
    parent = img.parent
    if parent:
        # figcaption
        fc = parent.find('figcaption') if hasattr(parent, 'find') else None
        if fc and fc.get_text(strip=True):
            return fc.get_text(strip=True)
        # look for elements with class containing 'caption' or 'overlay' near img
        if hasattr(parent, 'find'):
            cand = parent.find(class_=re.compile(r'(caption|overlay|title)', re.I))
            if cand and cand.get_text(strip=True):
                return cand.get_text(strip=True)
    # last resort: filename from src
    src = img.get('src') or img.get('data-src') or ''
    parsed = os.path.basename(urlparse(src).path)
    return parsed or 'image'


def get_image_elements(soup):
    # find all images within the main portfolio area
    # heuristic: images under a section or div that contains 'portfolio' in class or id
    portfolio_containers = soup.find_all(lambda tag: tag.name in ('section','div') and tag.get('class') and any('portfolio' in c.lower() for c in tag.get('class')))
    imgs = []
    if portfolio_containers:
        for cont in portfolio_containers:
            imgs.extend(cont.find_all('img'))
    else:
        # fallback: find images that come from wp-content/uploads
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


def download(url, path):
    try:
        resp = requests.get(url, stream=True, timeout=20)
        resp.raise_for_status()
        with open(path, 'wb') as f:
            for chunk in resp.iter_content(1024 * 8):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Error descargando {url}: {e}")
        return False


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Descargando desde {BASE_URL}")
    try:
        r = requests.get(BASE_URL, timeout=20)
        r.raise_for_status()
    except Exception as e:
        print(f"No se pudo obtener la página: {e}")
        sys.exit(1)

    soup = BeautifulSoup(r.text, 'html.parser')
    imgs = get_image_elements(soup)
    print(f"Encontradas {len(imgs)} imágenes candidatas en el portfolio (se tomarán las primeras {MAX_IMAGES}).")

    count = 0
    name_counts = {}
    for img in imgs:
        if count >= MAX_IMAGES:
            break
        a_tag = img.find_parent('a')
        title_raw = choose_title(img, a_tag)
        name = sanitize_filename(title_raw)
        src = img.get('src') or img.get('data-src')
        if not src:
            continue
        full_src = urljoin(BASE_URL, src)
        # determine extension
        parsed = urlparse(full_src)
        base = os.path.basename(parsed.path)
        ext = os.path.splitext(base)[1]
        if not ext:
            ext = '.jpg'
        filename = f"{name}{ext}"
        if filename in name_counts:
            name_counts[filename] += 1
            filename = f"{name}_{name_counts[filename]}{ext}"
        else:
            name_counts[filename] = 1
        out_path = os.path.join(OUT_DIR, filename)
        print(f"[{count+1}] {full_src} -> {out_path}")
        ok = download(full_src, out_path)
        if ok:
            count += 1

    print(f"Completado: {count} imágenes descargadas en {OUT_DIR}")


if __name__ == '__main__':
    main()
