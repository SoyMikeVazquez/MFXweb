#!/usr/bin/env python3
"""
Extrae categorías para las primeras 10 imágenes del portfolio.
Estrategia:
- Recoger los botones de filtro/categoría visibles en la página y generar slugs.
- Para cada item con caption, inspeccionar sus clases y atributos (p.ej. data-groups, data-filter, class names) y emparejar con slugs.
- Si no se encuentra categoría, seguir el enlace del item y buscar elementos tipo 'category', 'cat', 'portfolio-category' o breadcrumbs.

Salida: images_categories.json
"""
import os
import re
import json
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://maquillajefxmexico.com/portfolio"
OUT_DIR = os.path.abspath(os.path.dirname(__file__))
OUT_JSON = os.path.join(OUT_DIR, 'images_categories.json')
MAX_ITEMS = 10


def slugify(text: str) -> str:
    if not text:
        return ''
    text = text.strip().lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'\s+', '-', text)
    return text


def get_filters(soup):
    # try to find filter buttons/links (nav above grid)
    filters = []
    # common selectors
    selectors = [
        "ul.filters li",
        "ul.portfolio-filter li",
        "nav.portfolio-filter a",
        ".portfolio .filter a",
        ".gallery-filter a",
        ".eael-gallery-filter a",
        ".filter-categories a",
    ]
    for sel in selectors:
        for el in soup.select(sel):
            text = el.get_text(strip=True)
            if text:
                filters.append(text)
    # fallback: find top-of-page nav links that look like categories
    if not filters:
        for el in soup.find_all(['a','button']):
            cls = ' '.join(el.get('class') or [])
            if 'filter' in cls or 'portfolio' in cls:
                text = el.get_text(strip=True)
                if text and len(text) < 40:
                    filters.append(text)
    # dedupe
    out = []
    seen = set()
    for f in filters:
        if f.lower() in seen:
            continue
        seen.add(f.lower())
        out.append({'label': f, 'slug': slugify(f)})
    return out


def find_items_with_captions(soup):
    items = []
    for node in soup.find_all(True):
        if not node.find('img'):
            continue
        caption_el = node.find(class_=re.compile(r'(gallery-item-caption-over|gallery-item-caption-wrap|caption-style-hoverer|gallery-item-caption)', re.I))
        if caption_el:
            img = node.find('img')
            src = img.get('src') or img.get('data-src') or ''
            a = img.find_parent('a')
            href = a.get('href') if a and a.get('href') else None
            items.append({'node': node, 'img': img, 'src': urljoin(BASE_URL, src), 'href': href, 'caption': caption_el.get_text(' ', strip=True)})
    # dedupe by src
    seen = set(); out = []
    for it in items:
        if it['src'] in seen:
            continue
        seen.add(it['src'])
        out.append(it)
    return out


def extract_category_from_node(node, filters):
    # check class names
    classes = ' '.join(node.get('class') or [])
    # check data attributes
    attrs = ' '.join([f'{k}={v}' for k,v in node.attrs.items() if isinstance(v, str)])
    candidates = set()
    for f in filters:
        slug = f['slug']
        if slug and (slug in classes.lower() or slug in attrs.lower()):
            candidates.add(f['label'])
    # check direct data-groups or data-filter
    dg = node.get('data-groups') or node.get('data-filter') or node.get('data-category')
    if dg:
        s = str(dg)
        # try to extract readable names
        parts = re.split(r'[\[\],"]+', s)
        for p in parts:
            p = p.strip()
            if not p:
                continue
            # match to filters
            for f in filters:
                if slugify(p) == f['slug'] or p.lower() in f['label'].lower():
                    candidates.add(f['label'])
            # else add raw
            if len(p) > 1:
                candidates.add(p)
    return list(candidates)


def extract_category_from_page(href, filters):
    try:
        full = urljoin(BASE_URL, href)
        r = requests.get(full, timeout=10)
        r.raise_for_status()
        s = BeautifulSoup(r.text, 'html.parser')
        # search for elements that indicate category
        # meta keywords or og:category
        metas = s.find_all('meta')
        for m in metas:
            if m.get('property') in ('article:section','og:site_name') and m.get('content'):
                return [m.get('content')]
        # look for breadcrumbs or category links
        for el in s.select('.breadcrumbs a, .breadcrumb a, .post-categories a, .entry-meta a'):
            text = el.get_text(strip=True)
            if text:
                return [text]
        # look for terms listed
        for el in s.find_all(class_=re.compile(r'(category|term|cat|portfolio-category|entry-category)', re.I)):
            t = el.get_text(' ', strip=True)
            if t:
                return [t]
    except Exception:
        return None
    return None


def main():
    r = requests.get(BASE_URL, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, 'html.parser')
    filters = get_filters(soup)
    items = find_items_with_captions(soup)
    out = []
    for idx, it in enumerate(items[:MAX_ITEMS], 1):
        node = it['node']
        src = it['src']
        caption = it['caption']
        href = it['href']
        cats = extract_category_from_node(node, filters)
        if not cats and href:
            page_cats = extract_category_from_page(href, filters)
            if page_cats:
                cats = page_cats
        out.append({'index': idx, 'src_url': src, 'caption': caption, 'href': href, 'categories': cats})
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print('Wrote', OUT_JSON)
    for o in out:
        print(o['index'], o['src_url'])
        print('   caption:', o['caption'])
        print('   categories:', o['categories'])

if __name__ == '__main__':
    main()
