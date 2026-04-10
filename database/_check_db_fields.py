#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pymysql, csv, re
from collections import Counter

conn = pymysql.connect(host='localhost',port=3306,user='root',password='ldf123',
                       database='logitrack',charset='utf8mb4')
cur = conn.cursor()

# 1. Sales Office
cur.execute('SELECT name FROM dict_sales_office ORDER BY name')
db_offices = sorted([r[0].strip().upper() for r in cur.fetchall()])
print(f'== dict_sales_office total: {len(db_offices)}')

# Load CSV
rows = []
with open('chinese Pricing.csv', encoding='utf-8-sig') as f:
    reader = csv.reader(f, delimiter='\t')
    next(reader)  # skip header
    for row in reader:
        if len(row) >= 10:
            if len(row) < 34:
                row = row + [''] * (34 - len(row))
            rows.append(row)

csv_offices = sorted(set(r[7].strip().upper() for r in rows if r[7].strip() and r[7].strip() != '-'))
csv_pics = sorted(set(r[8].strip().upper() for r in rows if r[8].strip() and r[8].strip() not in ('-','')))

missing_offices = [o for o in csv_offices if o not in db_offices]
print(f'CSV unique offices: {len(csv_offices)}')
print(f'Missing from DB ({len(missing_offices)}): {missing_offices}')

# 2. Sales PIC
cur.execute('SELECT name FROM dict_sales_pic ORDER BY name')
db_pics = sorted([r[0].strip().upper() for r in cur.fetchall()])
print(f'\n== dict_sales_pic total: {len(db_pics)}')
print(f'CSV unique PICs: {len(csv_pics)}')
missing_pics = [p for p in csv_pics if p not in db_pics]
print(f'Missing PICs ({len(missing_pics)}): {missing_pics[:40]}')

# 3. container_types
cur.execute('SELECT container_code FROM container_types ORDER BY container_code')
db_containers = [r[0] for r in cur.fetchall()]
print(f'\n== container_types: {db_containers}')

# Check which CSV container codes are NOT in DB
CONTAINER_NORMALIZE = {
    "20'GP": '20GP', "20GP": '20GP', "20'FT": '20GP', "20FT": '20GP', "20'DC": '20GP',
    "20'DV": '20GP', "20;GP": '20GP',
    "40'GP": '40GP', "40GP": '40GP', "40'FT": '40GP', "40FT": '40GP',
    "40'HQ": '40HQ', "40HQ": '40HQ', "40'HC": '40HQ', "40HC": '40HQ', "40'HQ Reefer": '40RF',
    "45'HQ": '45HQ', "45HQ": '45HQ', "45'HC": '45HQ', "45*HQ": '45HQ',
    "20'OT": '20OT', "20OT": '20OT', "20 FT OPEN TOP": '20OT', "20' open top": '20OT',
    "20' OT": '20OT', "20'OT ": '20OT', "20' Open top": '20OT',
    "40'OT": '40OT', "40OT": '40OT',
    "20'FR": '20FR', "20FR": '20FR',
    "40'FR": '40FR', "40FR": '40FR', "40'FR (OOG)": '40FR', "40 FLAT RACK": '40FR',
    "20'RF": '20RF', "20'REEFER": '20RF', "20 REEFER": '20RF',
    "40'RF": '40RF', "40'RF (OOG)": '40RF',
    "20'NOR": '20NOR', "40'NOR": '40NOR', "40NOR": '40NOR',
    "20' ISO TANK": '20TANK', "20'ISO TANK": '20TANK', "20'TANK": '20TANK',
    "20FT ISO Tank": '20TANK', "20'Flexitank": '20TANK',
    "40'FT SOC TANK": '40TANK',
    "BULK CONTAINER": 'BULK',
    "45'HQ": '45HQ',
}

# Extract all container-like unit values from CSV
CONTAINER_CODES = re.compile(r"20|40|45|GP|HQ|HC|OT|FR|RF|NOR|TANK|REEFER|FLAT|RACK|BULK|BBK|BREAK", re.I)
unit_vals = [r[14].strip() for r in rows if CONTAINER_CODES.search(r[14].strip())]

# Try to find all raw container tokens mentioned
raw_container_tokens = set()
for u in unit_vals:
    parts = re.split(r'[/+&,x\*]', u)
    for p in parts:
        p = p.strip()
        if p and CONTAINER_CODES.search(p):
            raw_container_tokens.add(p)

# Normalize each token
unmapped_containers = {}
for tok in sorted(raw_container_tokens):
    norm = CONTAINER_NORMALIZE.get(tok)
    if not norm:
        # try uppercase match
        norm = CONTAINER_NORMALIZE.get(tok.upper())
    if norm and norm not in db_containers:
        unmapped_containers[tok] = norm
    elif not norm:
        unmapped_containers[tok] = '?? UNKNOWN'

print(f'\n== Container tokens NOT in DB or NOT mapped ({len(unmapped_containers)}):')
for k, v in sorted(unmapped_containers.items()):
    print(f'  {repr(k)} -> {v}')

# 4. dict_sales_country
cur.execute('SELECT code, name FROM dict_sales_country ORDER BY code')
print('\n== dict_sales_country:')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]}')

# 5. country table for AGENTS/OTHERS
cur.execute("SELECT country_code, country_name_en FROM country WHERE country_code IN ('AG','OT','TB','AGENTS','OTHERS')")
print(f'\n== Special countries in country table: {cur.fetchall()}')

# 6. port count
cur.execute('SELECT COUNT(*) FROM port')
print(f'\n== port table total: {cur.fetchone()[0]}')

# 7. enquiry_container_line exists?
try:
    cur.execute('DESCRIBE enquiry_container_line')
    cols = [r[0] for r in cur.fetchall()]
    print(f'\n== enquiry_container_line EXISTS, columns: {cols}')
except:
    print('\n== enquiry_container_line: NOT FOUND in DB')

# 8. CN Pricing Admin check
try:
    cur.execute('SELECT name FROM dict_cn_pricing_admin ORDER BY display_order')
    print(f'\n== dict_cn_pricing_admin: {[r[0] for r in cur.fetchall()]}')
except:
    print('\n== dict_cn_pricing_admin: TABLE NOT FOUND')

# 9. Enquiry columns
cur.execute("DESCRIBE enquiry")
print('\n== enquiry columns: {}'.format([r[0] for r in cur.fetchall()]))

conn.close()
print('\n=== CHECK DONE ===')
