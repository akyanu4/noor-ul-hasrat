#!/usr/bin/env python3
"""Rebuild data/library/index.json from data/library/<slug>.json (run after adding or editing an article)."""
import json, os, sys
D = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'library')
CATS = ["Basics", "Bai'at", "The path", "Practices", "Terms", "FAQ"]
out, bad = [], []
for f in sorted(os.listdir(D)):
    if not f.endswith('.json') or f in ('index.json', 'sayings.json'): continue
    a = json.load(open(os.path.join(D, f), encoding='utf-8'))
    slug = f[:-5]
    if a.get('slug') != slug: bad.append(f + ': slug must match file name')
    if a.get('cat') not in CATS: bad.append(f + ': cat must be one of ' + ', '.join(CATS))
    if a.get('level') not in ('open', 'murid'): bad.append(f + ': level must be open or murid')
    for k in ('title', 'summary', 'blocks'):
        if not a.get(k): bad.append(f + ': missing ' + k)
    out.append({k: a.get(k) for k in ('slug', 'title', 'ur', 'cat', 'level', 'summary', 'order', 'tags') if a.get(k) is not None})
    ru = a.get('ru') or {}
    if ru.get('title'): out[-1]['ru_title'] = ru['title']
    if ru.get('summary'): out[-1]['ru_summary'] = ru['summary']
out.sort(key=lambda x: (CATS.index(x['cat']) if x.get('cat') in CATS else 99, x.get('order', 99), x['title']))
if bad: print('\n'.join(bad)); sys.exit(1)
# Sayings of Hazrat for the daily saying (Home card, push, share links): every quote block, with its Roman Urdu twin.
says = []
for f in sorted(os.listdir(D)):
    if not f.endswith('.json') or f in ('index.json', 'sayings.json'): continue
    a = json.load(open(os.path.join(D, f), encoding='utf-8'))
    rb = ((a.get('ru') or {}).get('blocks')) or []
    for i, b in enumerate(a.get('blocks') or []):
        q = (b.get('q') or '').strip()
        if not q or not (30 <= len(q) <= 280): continue
        src = b.get('src') or {}
        r = rb[i].get('q') if i < len(rb) and isinstance(rb[i], dict) else None
        says.append({k: v for k, v in {'s': a['slug'], 'i': i, 'q': q, 'ru': r, 'v': src.get('v') or None, 't': src.get('t') or 0, 'label': src.get('label') or ''}.items() if v not in (None, '')})
json.dump(says, open(os.path.join(D, 'sayings.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(says), 'sayings')
json.dump(out, open(os.path.join(D, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out), 'articles')
