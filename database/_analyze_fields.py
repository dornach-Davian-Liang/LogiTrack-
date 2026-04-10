#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import csv, re, os
from collections import Counter, defaultdict

rows = []
csv_path = os.path.join(os.path.dirname(__file__), 'chinese Pricing.csv')
with open(csv_path, encoding='utf-8-sig') as f:
    reader = csv.reader(f, delimiter='\t')
    header = next(reader)
    for row in reader:
        if len(row) < 10:
            continue
        if len(row) < 34:
            row = row + [''] * (34 - len(row))
        rows.append(row)

print(f'Total data rows: {len(rows)}')

# ---- Reference Number (Col 2) ----
refs = [r[2].strip() for r in rows]
pattern_ok = sum(1 for r in refs if re.match(r'^CN\d{6}-[A-Z]+\d*$', r))
bad = [(i+2, r) for i,r in enumerate(refs) if not re.match(r'^CN\d{6}-[A-Z]+\d*$', r)]
dup_refs = [r for r,c in Counter(refs).items() if c>1]
print(f'\n=== Reference Number ===')
print(f'  Pattern OK: {pattern_ok}/{len(refs)}')
print(f'  Bad patterns ({len(bad)}): {bad[:15]}')
print(f'  Duplicates ({len(dup_refs)}): {dup_refs}')

# ---- Product (Col 3) ----
print(f'\n=== Product (Col 3) ===')
V3_PRODUCTS = {'AIR','SEA','RAIL','RAIL-SEA','RAIL-AIR','SEA-AIR','AIR-RAIL-SEA'}
prods = Counter(r[3].strip().upper() for r in rows)
for k,v in sorted(prods.items(), key=lambda x:-x[1]):
    flag = '✅' if k in V3_PRODUCTS else '❌ NOT IN V3'
    print(f'  {flag}  {repr(k)}: {v}')

# ---- CN Pricing Admin (Col 5) ----
print(f'\n=== CN Pricing Admin (Col 5) ===')
V3_ADMINS = {'JANET CHAN','NIKI GUAN','SUSANA WONG','YUKI YING','YVONNE HO'}
admins = Counter(r[5].strip() for r in rows)
for k,v in sorted(admins.items(), key=lambda x:-x[1]):
    flag = '✅' if k.upper() in V3_ADMINS else '❌ NOT IN V3'
    print(f'  {flag}  {repr(k)}: {v}')

# ---- Sales Office (Col 7) ----
print(f'\n=== Sales Office (Col 7) ===')
offices_raw = Counter(r[7].strip() for r in rows)
print(f'  Unique values: {len(offices_raw)}')
blank_office = offices_raw.get('',0) + offices_raw.get('-',0)
print(f'  Blank/dash: {blank_office}')
print(f'  All values: {sorted(offices_raw.keys())}')

# ---- Sales PIC (Col 8) ----
print(f'\n=== Sales PIC (Col 8) ===')
pics_raw = Counter(r[8].strip() for r in rows)
print(f'  Unique values: {len(pics_raw)}')
blank_pic = pics_raw.get('',0) + pics_raw.get('-',0)
print(f'  Blank/dash: {blank_pic}')
print(f'  All values: {sorted(pics_raw.keys())}')

# ---- CN Office (Col 9) ----
print(f'\n=== CN Office / Assigned CN Offices (Col 9) ===')
V3_CN = {'SHANGHAI','SHENZHEN','NINGBO','HONG KONG','TIANJIN','QINGDAO','XIAMEN','CN-MULTI'}
cn_offices = Counter(r[9].strip().upper() for r in rows)
for k,v in sorted(cn_offices.items(), key=lambda x:-x[1]):
    flag = '✅' if any(valid in k for valid in V3_CN) else ('— empty/dash' if k in ('','-','N/A') else '⚠️ CHECK')
    print(f'  {flag}  {repr(k)}: {v}')

# ---- Volume CBM (Col 12) ----
print(f'\n=== Volume CBM (Col 12) ===')
vol_vals = [r[12].strip() for r in rows]
blank_vol = sum(1 for v in vol_vals if not v or v == '-')
bad_vol = [(i+2, v) for i,v in enumerate(vol_vals)
           if v and v not in ('-','') and not re.match(r'^[\d,\.]+$', v.replace(' ',''))]
print(f'  Blank/dash: {blank_vol}')
print(f'  Non-numeric values (first 20): {bad_vol[:20]}')

# ---- Quantity (Col 13) ----
print(f'\n=== Quantity (Col 13) ===')
qty_vals = [r[13].strip() for r in rows]
blank_qty = sum(1 for v in qty_vals if not v or v == '-')
bad_qty = [(i+2, v) for i,v in enumerate(qty_vals)
           if v and v not in ('-','') and not re.match(r'^[\d,\.]+$', v.replace(' ',''))]
print(f'  Blank/dash: {blank_qty}')
print(f'  Non-numeric values (first 20): {bad_qty[:20]}')

# ---- Quantity Unit (Col 14) ----
print(f'\n=== Quantity Unit (Col 14) ===')
CONTAINER_CODES = re.compile(r"20|40|45|GP|HQ|HC|OT|FR|RF|NOR|TANK|REEFER|FLAT|RACK|BULK|CONSOL", re.I)
unit_vals = Counter(r[14].strip() for r in rows)
# Classify
containers = {}; uom_ok = {}; blank_u = 0; other_u = {}
for k,v in unit_vals.items():
    ku = k.upper()
    if not k or k == '-': blank_u += v
    elif CONTAINER_CODES.search(ku): containers[k] = v
    elif ku in ('KG','PCS','CTN','PLT','SET','UNIT','ROLL','BOX','PALLET','BAG','DRUM','CARTON'): uom_ok[k] = v
    else: other_u[k] = v
print(f'  Container-type values ({sum(containers.values())} rows): first 30 = {sorted(containers.keys())[:30]}')
print(f'  UOM values ({sum(uom_ok.values())} rows): {sorted(uom_ok.keys())}')
print(f'  Blank/dash: {blank_u}')
print(f'  Other/ambiguous ({sum(other_u.values())} rows): {sorted(other_u.keys())[:30]}')

# ---- Commodity (Col 16) ----
print(f'\n=== Commodity (Col 16) ===')
comm_vals = [r[16].strip() for r in rows]
blank_comm = sum(1 for v in comm_vals if not v or v in ('-','N/A','TBA'))
long_comm = [(i+2, len(v), v[:80]) for i,v in enumerate(comm_vals) if len(v) > 500]
print(f'  Blank/TBA/dash: {blank_comm}')
print(f'  Very long (>500 chars): {len(long_comm)} rows')

# ---- Haz/Special Equipment (Col 17) ----
print(f'\n=== Haz/Special Equipment (Col 17) ===')
haz_vals = [r[17].strip() for r in rows]
blank_haz = sum(1 for v in haz_vals if not v or v in ('-','N/A','No','no','NO'))
print(f'  Blank/No/dash: {blank_haz} / {len(haz_vals)}')
print(f'  Has value: {len(haz_vals) - blank_haz}')
sample_haz = [v for v in haz_vals if v and v not in ('-','N/A','No','no','NO')][:10]
print(f'  Sample values: {sample_haz}')

# ---- Enquiry Date (Col 0) ----
print(f'\n=== Enquiry Received Date (Col 0) ===')
dates = [r[0].strip() for r in rows]
date_pattern = re.compile(r'^\d{1,2}\s+\w+\s+\d{4}$')
bad_dates = [(i+2, d) for i,d in enumerate(dates) if not date_pattern.match(d)]
print(f'  Bad format count: {len(bad_dates)}')
print(f'  Bad (first 10): {bad_dates[:10]}')

print('\n=== DONE ===')
