#!/usr/bin/env python3
"""
读取 List1.csv，与数据库对比，只插入缺失数据
"""

import csv
import unicodedata
import mysql.connector
from collections import defaultdict

DB_CONFIG = {
    'host': 'localhost', 'port': 3306,
    'user': 'root', 'password': 'ldf123', 'database': 'logitrack'
}

# 国家代码映射（扩展版，处理 List1.csv 中的新格式）
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
    'SOUTH_AFRICA': 'ZA',   # List1.csv 中的格式
    'SWITZERLAND': 'CH',
    'TBA': 'TB',
    'United Kingdom': 'GB',
    'UK': 'GB',             # List1.csv 中的格式
    'USA': 'US'
}

COUNTRY_NAMES = {
    'AG': ('AGENTS', 'Agents'),
    'BE': ('BELGIUM', 'Belgium'),
    'CN': ('CHINA', 'China'),
    'FR': ('FRANCE', 'France'),
    'DE': ('GERMANY', 'Germany'),
    'GR': ('GREECE', 'Greece'),
    'MA': ('MOROCCO', 'Morocco'),
    'NL': ('NETHERLANDS', 'Netherlands'),
    'OT': ('OTHERS', 'Others'),
    'PL': ('POLAND', 'Poland'),
    'ZA': ('SOUTH AFRICA', 'South Africa'),
    'CH': ('SWITZERLAND', 'Switzerland'),
    'TB': ('TBA', 'TBA'),
    'GB': ('United Kingdom', 'United Kingdom'),
    'US': ('USA', 'USA'),
}

CSV_PATH = r'c:\logitrack\LogiTrack--update-status-report-20260126023903\database\List1.csv'

def normalize(s):
    s = s.upper().replace('\xa0', ' ').replace('\u2019', "'").strip()
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return ' '.join(s.split())

# ─── 读取 CSV ─────────────────────────────────────────────────
csv_countries = set()
csv_offices   = {}      # cc -> {office_name}
csv_pics      = defaultdict(set)  # (cc, office) -> {pic}
unknown_cc    = set()

with open(CSV_PATH, encoding='utf-8-sig') as f:
    reader = csv.DictReader(f, delimiter='\t')
    for row in reader:
        country_raw = (row.get('SALESCOUNTRY') or '').strip()
        office_raw  = (row.get('SALESOFFICE')  or '').strip().rstrip()
        pic_raw     = (row.get('SALESPIC')     or '').strip().rstrip()
        if not country_raw or not office_raw or not pic_raw:
            continue
        cc = COUNTRY_MAPPING.get(country_raw)
        if not cc:
            unknown_cc.add(country_raw)
            continue
        csv_countries.add(cc)
        csv_offices.setdefault(cc, set()).add(office_raw)
        csv_pics[(cc, office_raw)].add(pic_raw)

print(f"CSV1 统计: {len(csv_countries)} 国家 | "
      f"{sum(len(v) for v in csv_offices.values())} 办公室 | "
      f"{sum(len(v) for v in csv_pics.values())} PIC")
if unknown_cc:
    print(f"⚠ 未映射国家: {unknown_cc}")

# ─── 查询数据库 ───────────────────────────────────────────────
conn = mysql.connector.connect(**DB_CONFIG)
cur  = conn.cursor()

cur.execute("SELECT country_code FROM country")
db_cc = {r[0] for r in cur.fetchall()}

cur.execute("SELECT id, code, name, name_norm, country_code FROM dict_sales_office")
db_offices = cur.fetchall()
db_office_norms = defaultdict(set)   # cc -> {norm_name}
db_office_codes  = set()             # all codes
db_name_norms    = set()             # all name_norms
db_office_by_name = {}               # (cc, norm_name) -> code

for oid, ocode, oname, oname_norm, occ in db_offices:
    n = normalize(oname)
    db_office_norms[occ].add(n)
    db_office_codes.add(ocode)
    db_name_norms.add(normalize(oname_norm))
    db_office_by_name[(occ, n)] = ocode

cur.execute("SELECT sp.name, sp.country_code, so.name FROM sales_pic sp "
            "JOIN dict_sales_office so ON so.id = sp.sales_office_id")
db_pic_set = set()
for pname, pcc, oname in cur.fetchall():
    db_pic_set.add((pcc, normalize(oname), normalize(pname)))

conn.close()

# ─── 计算缺失数据 ──────────────────────────────────────────────
missing_cc = [(cc, *COUNTRY_NAMES[cc]) for cc in sorted(csv_countries) if cc not in db_cc]

# 生成 office code（避免与现有冲突）
all_codes      = set(db_office_codes)
all_name_norms = set(db_name_norms)

def make_code(cc, name):
    abbr = ''.join(c for c in name if c.isalnum()).upper()[:40]
    code = f"{cc}-{abbr}"
    cnt = 2
    while code in all_codes:
        code = f"{cc}-{abbr}-{cnt}"
        cnt += 1
    all_codes.add(code)
    return code

missing_offices = []  # {cc, name, code}
new_office_code = {}  # (cc, norm_name) -> code

for cc, offices in sorted(csv_offices.items()):
    for office in sorted(offices):
        norm = normalize(office)
        if norm not in db_office_norms.get(cc, set()):
            # check name_norm uniqueness
            nn = norm
            if nn in all_name_norms:
                nn = f"{norm} ({cc})"
                cnt = 2
                while nn.upper() in all_name_norms:
                    nn = f"{norm} ({cc})-{cnt}"
                    cnt += 1
            all_name_norms.add(nn.upper())
            code = make_code(cc, office)
            missing_offices.append({'cc': cc, 'name': office.strip(), 'name_norm': nn, 'code': code})
            new_office_code[(cc, norm)] = code

# 合并 lookup
full_office_lookup = dict(db_office_by_name)
full_office_lookup.update(new_office_code)

missing_pics = []  # (cc, office, pic)
for (cc, office), pics in sorted(csv_pics.items()):
    onorm = normalize(office)
    for pic in sorted(pics):
        if (cc, onorm, normalize(pic)) not in db_pic_set:
            missing_pics.append((cc, office.strip(), pic.strip()))

print(f"\n缺失: {len(missing_cc)} 国家 | {len(missing_offices)} 办公室 | {len(missing_pics)} PIC")
if missing_cc:
    print("  缺失国家:", [c[0] for c in missing_cc])
if missing_offices:
    print("  缺失办公室:")
    for o in missing_offices:
        print(f"    {o['cc']}/{o['name']}")

# ─── 执行导入 ─────────────────────────────────────────────────
conn = mysql.connector.connect(**DB_CONFIG)
conn.autocommit = False
cur  = conn.cursor()

# 1. 插入缺失国家
is_core = {'CN', 'FR', 'DE', 'GB', 'US'}
for cc, name_en, name_cn in missing_cc:
    cur.execute(
        "INSERT INTO country (country_code, country_name_en, country_name_cn, is_active, is_core) "
        "VALUES (%s, %s, %s, 1, %s) ON DUPLICATE KEY UPDATE "
        "country_name_en=VALUES(country_name_en), country_name_cn=VALUES(country_name_cn), updated_at=CURRENT_TIMESTAMP",
        (cc, name_en, name_cn, 1 if cc in is_core else 0)
    )
print(f"✅ 国家插入: {cur.rowcount if missing_cc else 0} 行影响")

# 2. 插入缺失办公室
sort_map = defaultdict(int)
for o in missing_offices:
    sort_map[o['cc']] += 10
    cur.execute(
        "INSERT INTO dict_sales_office (code, name, name_norm, country_code, is_active, sort_order) "
        "VALUES (%s, %s, %s, %s, 1, %s) ON DUPLICATE KEY UPDATE "
        "name=VALUES(name), name_norm=VALUES(name_norm), country_code=VALUES(country_code), updated_at=CURRENT_TIMESTAMP",
        (o['code'], o['name'], o['name_norm'], o['cc'], sort_map[o['cc']])
    )
print(f"✅ 办公室插入完成 ({len(missing_offices)} 条)")

conn.commit()  # commit offices before querying their ids

# 3. 插入缺失 PIC（需重新查询 office id）
cur.execute("SELECT code, id FROM dict_sales_office")
office_id_map = {code: oid for code, oid in cur.fetchall()}

inserted_pics = 0
skipped_pics  = 0
for cc, office, pic in missing_pics:
    ocode = full_office_lookup.get((cc, normalize(office)))
    if not ocode:
        print(f"  ⚠ 找不到 office code: {cc}/{office}")
        skipped_pics += 1
        continue
    oid = office_id_map.get(ocode)
    if not oid:
        print(f"  ⚠ 找不到 office id: {ocode}")
        skipped_pics += 1
        continue
    try:
        cur.execute(
            "INSERT INTO sales_pic (name, name_norm, country_code, sales_office_id, is_active) "
            "VALUES (%s, %s, %s, %s, 1) ON DUPLICATE KEY UPDATE "
            "name=VALUES(name), name_norm=VALUES(name_norm), updated_at=CURRENT_TIMESTAMP",
            (pic, normalize(pic), cc, oid)
        )
        inserted_pics += 1
    except Exception as e:
        print(f"  ❌ PIC insert error: {e} | {cc}/{office}/{pic}")
        skipped_pics += 1

conn.commit()
print(f"✅ PIC 插入: {inserted_pics} 条  跳过: {skipped_pics} 条")

conn.close()
print("\n🎉 List1.csv 数据导入完成！")
