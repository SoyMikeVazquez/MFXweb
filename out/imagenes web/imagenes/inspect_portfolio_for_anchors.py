#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup

URL='https://maquillajefxmexico.com/portfolio'
print('Fetching', URL)
resp = requests.get(URL, timeout=20)
resp.raise_for_status()
soup = BeautifulSoup(resp.text, 'html.parser')

print('\n--- Anchors with href containing "character" or "#" ---')
for a in soup.find_all('a', href=True):
    h = a['href']
    if 'character' in h or h.startswith('#'):
        print('-', h, 'text=', a.get_text(strip=True)[:60])

print('\n--- Elements with id="character-makeup" ---')
el = soup.find(id='character-makeup')
if el:
    print('Found element id=character-makeup, tag=', el.name)
    print(el.prettify()[:1000])
else:
    print('No element with id=character-makeup found')

print('\n--- Elements with data-filter or data-category attributes ---')
for el in soup.find_all(attrs={True: True}):
    for attr in ['data-filter','data-category','data-groups','data-categories']:
        if el.has_attr(attr):
            print(attr, '=', el[attr], ' tag=', el.name, ' classes=', el.get('class'))

print('\n--- Candidate gallery containers (class contains portfolio/gallery/grid/masonry) ---')
for tag in soup.find_all(['div','section','ul']):
    cls = ' '.join(tag.get('class') or [])
    if any(k in cls for k in ['portfolio','gallery','grid','masonry','gallery-items','gallery-wrapper','isotope','filter']):
        print('TAG', tag.name, 'class=', cls[:200])
        # print a small preview
        print(tag.prettify()[:800])
        print('-----')

print('\n--- Done ---')
