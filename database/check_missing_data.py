#!/usr/bin/env python3
"""
检查 List.csv 中哪些数据还没有导入到数据库
对比 country、dict_sales_office、sales_pic 三张表
"""

import csv
import unicodedata
import mysql.connector
from collections import defaultdict

def normalize_str(s):
    """Normalize: uppercase, replace non-breaking spaces, strip accents for comparison"""
    s = s.upper().replace('\xa0', ' ').replace('\u2019', "'").strip()
    # Strip combining diacritics (accents) for fuzzy match
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return ' '.join(s.split())  # normalize multiple spaces

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'ldf123',
    'database': 'logitrack'
}

# 国家代码映射（与生成脚本保持一致）
COUNTRY_MAPPING = {
    'AGENTS': 'AG',
    'BELGIUM': 'BE',
    'CHINA': 'CN',
    'FRANCE': 'FR',
    'GERMANY': 'DE',
    'GREECE': 'GR',
    'MOROCCO': 'MA',
    'NETHERLANDS': 'NL',
    'OTHERS': 'OT',
    'POLAND': 'PL',
    'SOUTH AFRICA': 'ZA',
    'SWITZERLAND': 'CH',
    'TBA': 'TB',
    'United Kingdom': 'GB',
    'USA': 'US'
}

CSV_PATH = r'c:\logitrack\LogiTrack--update-status-report-20260126023903\database\List.csv'

print("=" * 65)
print("LogiTrack - List.csv 数据对比报告")
print("=" * 65)

# ─── 1. 读取 CSV ───────────────────────────────────────────────
csv_countries  = set()
csv_offices    = {}   # country_code -> set of office names
csv_pics       = defaultdict(set)  # (country_code, office_name) -> set of pic names
unknown_countries = set()

with open(CSV_PATH, encoding='utf-8-sig') as f:
    reader = csv.DictReader(f, delimiter='\t')
    for row in reader:
        country_raw = (row.get('SALESCOUNTRY') or '').strip()
        office_raw  = (row.get('SALESOFFICE')  or '').strip()
        pic_raw     = (row.get('SALESPIC')     or '').strip()

        if not country_raw or not office_raw or not pic_raw:
            continue

        code = COUNTRY_MAPPING.get(country_raw)
        if not code:
            unknown_countries.add(country_raw)
            continue

        csv_countries.add(code)
        csv_offices.setdefault(code, set()).add(office_raw)
        csv_pics[(code, office_raw)].add(pic_raw)  # keep original for display

print(f"\nCSV 统计: {len(csv_countries)} 个国家 | "
      f"{sum(len(v) for v in csv_offices.values())} 个办公室 | "
      f"{sum(len(v) for v in csv_pics.values())} 个 PIC (去重后)")

if unknown_countries:
    print(f"\n⚠ 未映射的国家名称 (已跳过): {unknown_countries}")

# ─── 2. 查询数据库 ─────────────────────────────────────────────
conn = mysql.connector.connect(**DB_CONFIG)
cur  = conn.cursor()

cur.execute("SELECT country_code FROM country")
db_countries = {r[0] for r in cur.fetchall()}

cur.execute("SELECT code, name, country_code FROM dict_sales_office")
db_offices_rows = cur.fetchall()
db_office_names_by_country = defaultdict(set)   # country_code -> set of name (normalized)
db_office_code_map = {}                          # (country_code, name.norm) -> code
for code, name, cc in db_offices_rows:
    db_office_names_by_country[cc].add(normalize_str(name))
    db_office_code_map[(cc, normalize_str(name))] = code

cur.execute("SELECT sp.name, sp.country_code, so.name FROM sales_pic sp "
            "JOIN dict_sales_office so ON so.id = sp.sales_office_id")
db_pics_rows = cur.fetchall()
db_pic_set = set()   # (country_code, office_name_norm, pic_name_norm)
for pic_name, cc, office_name in db_pics_rows:
    db_pic_set.add((cc, normalize_str(office_name), normalize_str(pic_name)))

conn.close()

print(f"数据库统计: {len(db_countries)} 个国家 | "
      f"{len(db_offices_rows)} 个办公室 | "
      f"{len(db_pics_rows)} 个 PIC")

# ─── 3. 对比 country ──────────────────────────────────────────
missing_countries = csv_countries - db_countries
print("\n" + "─" * 65)
print(f"[1] 缺失的 Country ({len(missing_countries)} 个)")
if missing_countries:
    for c in sorted(missing_countries):
        orig = next(k for k, v in COUNTRY_MAPPING.items() if v == c)
        print(f"    ❌  {c}  ({orig})")
else:
    print("    ✅ 全部已导入")

# ─── 4. 对比 dict_sales_office ────────────────────────────────
missing_offices_by_country = defaultdict(list)
total_missing_offices = 0

for cc, offices in sorted(csv_offices.items()):
    if cc not in db_countries:
        continue   # 国家本身还没导入，先跳过
    for office in sorted(offices):
        if normalize_str(office) not in db_office_names_by_country[cc]:
            missing_offices_by_country[cc].append(office)
            total_missing_offices += 1

print("\n" + "─" * 65)
print(f"[2] 缺失的 Sales Office ({total_missing_offices} 个)")
if missing_offices_by_country:
    for cc in sorted(missing_offices_by_country):
        orig = next((k for k, v in COUNTRY_MAPPING.items() if v == cc), cc)
        print(f"\n  国家: {cc} ({orig})")
        for o in missing_offices_by_country[cc]:
            print(f"    ❌  {o}")
else:
    print("    ✅ 全部已导入")

# ─── 5. 对比 sales_pic ────────────────────────────────────────
missing_pics_by_office = defaultdict(list)
total_missing_pics = 0

for (cc, office), pics in sorted(csv_pics.items()):
    if cc not in db_countries:
        continue
    office_norm = normalize_str(office)
    for pic in sorted(pics):
        if (cc, office_norm, normalize_str(pic)) not in db_pic_set:
            missing_pics_by_office[(cc, office)].append(pic)
            total_missing_pics += 1

print("\n" + "─" * 65)
print(f"[3] 缺失的 Sales PIC ({total_missing_pics} 个)")
if missing_pics_by_office:
    for (cc, office) in sorted(missing_pics_by_office):
        orig = next((k for k, v in COUNTRY_MAPPING.items() if v == cc), cc)
        print(f"\n  {cc} ({orig}) / {office}")
        for p in missing_pics_by_office[(cc, office)]:
            print(f"    ❌  {p}")
else:
    print("    ✅ 全部已导入")

# ─── 6. 汇总 ──────────────────────────────────────────────────
print("\n" + "=" * 65)
print("汇总")
print("=" * 65)
print(f"  缺失 Country:      {len(missing_countries)}")
print(f"  缺失 Sales Office: {total_missing_offices}")
print(f"  缺失 Sales PIC:    {total_missing_pics}")
if len(missing_countries) == 0 and total_missing_offices == 0 and total_missing_pics == 0:
    print("\n  🎉 List.csv 中的数据已全部导入数据库！")
else:
    print("\n  ⚠ 存在未导入数据，请执行 import_sales_data_generated.sql")
print("=" * 65)
