#!/usr/bin/env python3
import re
import requests
from bs4 import BeautifulSoup
from collections import Counter

URL='https://maquillajefxmexico.com/portfolio'
print('Fetching', URL)
resp = requests.get(URL, timeout=20)
resp.raise_for_status()
soup = BeautifulSoup(resp.text, 'html.parser')

wrappers = soup.find_all(class_=re.compile(r'eael-filterable-gallery-item-wrap'))

counter = Counter()
for w in wrappers:
    classes = w.get('class') or []
    for c in classes:
        m = re.match(r'eael-cf-([a-z0-9_-]+)', c)
        if m:
            counter[m.group(1)] += 1

print('Found', len(counter), 'unique eael-cf slugs')
for slug, count in counter.most_common():
    print('-', slug, count)
