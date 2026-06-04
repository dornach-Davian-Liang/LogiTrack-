#!/usr/bin/env python3
"""
生成补丁 SQL：只插入 List.csv 中缺失的数据
"""

import csv
import mysql.connector
from collections import defaultdict

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'ldf123',
    'database': 'logitrack'
}

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

COUNTRY_NAME_MAP = {
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

CSV_PATH = r'c:\logitrack\LogiTrack--update-status-report-20260126023903\database\List.csv'
OUT_SQL  = r'c:\logitrack\LogiTrack--update-status-report-20260126023903\database\patch_missing_data.sql'

# ─── 1. 读取 CSV ───────────────────────────────────────────────
csv_offices = {}   # country_code -> {office_name}
csv_pics    = defaultdict(set)  # (country_code, office_name) -> {pic_name}

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
            continue
        csv_offices.setdefault(code, set()).add(office_raw)
        csv_pics[(code, office_raw)].add(pic_raw)

# ─── 2. 查询数据库 ─────────────────────────────────────────────
conn = mysql.connector.connect(**DB_CONFIG)
cur  = conn.cursor()

cur.execute("SELECT country_code FROM country")
db_countries = {r[0] for r in cur.fetchall()}

cur.execute("SELECT id, code, name, name_norm, country_code FROM dict_sales_office")
db_office_rows = cur.fetchall()
db_office_by_name_cc = {}   # (country_code, name_upper) -> id
db_name_norm_set = set()    # name_norm already used
db_code_set = set()         # code already used

for oid, ocode, oname, oname_norm, occ in db_office_rows:
    db_office_by_name_cc[(occ, oname.upper())] = oid
    db_name_norm_set.add(oname_norm.upper())
    db_code_set.add(ocode)

cur.execute("SELECT sp.name, sp.country_code, so.name, so.id FROM sales_pic sp "
            "JOIN dict_sales_office so ON so.id = sp.sales_office_id")
db_pic_rows = cur.fetchall()
db_pic_set = set()   # (country_code, office_name_upper, pic_name_upper)
for pname, pcc, oname, _ in db_pic_rows:
    db_pic_set.add((pcc, oname.upper(), pname.upper()))

conn.close()

# ─── 3. 计算缺失数据 ──────────────────────────────────────────
# 3a: 缺失国家
missing_countries = []
for cc, (name_en, name_cn) in COUNTRY_NAME_MAP.items():
    if cc not in db_countries:
        missing_countries.append((cc, name_en, name_cn))

print(f"缺失国家: {len(missing_countries)}")
for c in missing_countries:
    print(f"  {c}")

# 3b: 缺失办公室 + 生成办公室 code
missing_offices = []   # (cc, office_name, generated_code)

# 生成 code 时需避免与现有 code 冲突
all_codes = set(db_code_set)

def make_office_code(cc, office_name):
    abbr = ''.join(c for c in office_name if c.isalnum()).upper()[:40]
    code = f"{cc}-{abbr}"
    counter = 2
    while code in all_codes:
        code = f"{cc}-{abbr}-{counter}"
        counter += 1
    all_codes.add(code)
    return code

# 也需要避免 name_norm 冲突
all_name_norms = set(db_name_norm_set)

# 特殊处理：AG-PCS2 存在但 country_code='AGENTS' 需要 UPDATE 而非重新插入
# 将其手动加入 db_office_by_name_cc 以避免被当作缺失
db_office_by_name_cc[('AG', 'PCS')] = 117   # AG-PCS2 的 id

for cc, offices in sorted(csv_offices.items()):
    if cc not in db_countries and cc not in [c[0] for c in missing_countries]:
        continue  # country even missing from CSV mapping - skip
    for office in sorted(offices):
        if (cc, office.upper()) not in db_office_by_name_cc:
            missing_offices.append({
                'cc': cc,
                'name': office,
                'name_norm': office.upper().strip(),
            })

print(f"缺失办公室: {len(missing_offices)}")
for o in missing_offices:
    print(f"  {o['cc']} / {o['name']}")

# ─── 4. 生成 SQL ──────────────────────────────────────────────
lines = [
    "-- ============================================================",
    "-- Patch SQL: 只补充 List.csv 中缺失的数据",
    "-- 不会影响已存在的数据",
    "-- ============================================================",
    "",
    "USE logitrack;",
    "SET FOREIGN_KEY_CHECKS = 0;",
    "SET NAMES utf8mb4;",
    "",
]

# 4a: 修复 AG-PCS2 的 country_code
lines += [
    "-- ──────────────────────────────────────────────────────────",
    "-- Fix: 修正 AG-PCS2 的 country_code (AGENTS -> AG)",
    "-- ──────────────────────────────────────────────────────────",
    "UPDATE dict_sales_office SET country_code = 'AG', updated_at = CURRENT_TIMESTAMP",
    "WHERE code = 'AG-PCS2' AND country_code = 'AGENTS';",
    "",
]

# 4b: 缺失国家
if missing_countries:
    lines += [
        "-- ──────────────────────────────────────────────────────────",
        f"-- Step 1: 插入缺失国家 ({len(missing_countries)} 个)",
        "-- ──────────────────────────────────────────────────────────",
        "INSERT INTO country (country_code, country_name_en, country_name_cn, is_active, is_core) VALUES",
    ]
    is_core_set = {'CN', 'FR', 'DE', 'GB', 'US'}
    vals = []
    for cc, name_en, name_cn in sorted(missing_countries):
        is_core = 1 if cc in is_core_set else 0
        name_en_esc = name_en.replace("'", "''")
        name_cn_esc = name_cn.replace("'", "''")
        vals.append(f"  ('{cc}', '{name_en_esc}', '{name_cn_esc}', 1, {is_core})")
    lines.append(',\n'.join(vals))
    lines += [
        "ON DUPLICATE KEY UPDATE",
        "  country_name_en = VALUES(country_name_en),",
        "  country_name_cn = VALUES(country_name_cn),",
        "  updated_at = CURRENT_TIMESTAMP;",
        f"SELECT 'Inserted {len(missing_countries)} missing countries' AS status;",
        "",
    ]
else:
    lines += ["-- Step 1: 无缺失国家", ""]

# 4c: 缺失办公室
if missing_offices:
    lines += [
        "-- ──────────────────────────────────────────────────────────",
        f"-- Step 2: 插入缺失办公室 ({len(missing_offices)} 个)",
        "-- ──────────────────────────────────────────────────────────",
        "INSERT INTO dict_sales_office (code, name, name_norm, country_code, is_active, sort_order) VALUES",
    ]
    # Assign codes and handle name_norm conflicts
    office_code_lookup = {}   # (cc, office_name) -> generated code
    vals = []
    sort_order_map = defaultdict(int)
    for o in missing_offices:
        cc = o['cc']
        name = o['name']
        name_norm = o['name_norm']

        # Handle name_norm uniqueness: if conflict, append country code
        if name_norm in all_name_norms:
            candidate = f"{name_norm} ({cc})"
            suffix = 2
            while candidate.upper() in all_name_norms:
                candidate = f"{name_norm} ({cc})-{suffix}"
                suffix += 1
            name_norm = candidate
        all_name_norms.add(name_norm.upper())

        code = make_office_code(cc, name)
        office_code_lookup[(cc, name)] = code
        sort_order_map[cc] += 10

        name_esc = name.replace("'", "''")
        nm_esc   = name_norm.replace("'", "''")
        vals.append(f"  ('{code}', '{name_esc}', '{nm_esc}', '{cc}', 1, {sort_order_map[cc]})")

    lines.append(',\n'.join(vals))
    lines += [
        "ON DUPLICATE KEY UPDATE",
        "  name = VALUES(name),",
        "  name_norm = VALUES(name_norm),",
        "  country_code = VALUES(country_code),",
        "  updated_at = CURRENT_TIMESTAMP;",
        f"SELECT 'Inserted {len(missing_offices)} missing offices' AS status;",
        "",
    ]
else:
    lines += ["-- Step 2: 无缺失办公室", ""]
    office_code_lookup = {}

# 4d: 缺失 PIC
# Re-query the database to get updated office ids (after inserting missing offices)
# Instead, we use a subquery approach

# Rebuild office lookup including newly added ones
# For newly added offices, we need their codes to join via dict_sales_office
# Use INSERT ... SELECT with JOIN

# Collect all missing PICs, grouped by (cc, office_name)
missing_pics = []   # (cc, office_name, pic_name)
for (cc, office), pics in sorted(csv_pics.items()):
    office_upper = office.upper()
    for pic in sorted(pics):
        db_key = (cc, office_upper, pic.upper())
        if db_key not in db_pic_set:
            missing_pics.append((cc, office, pic))

print(f"缺失PIC: {len(missing_pics)}")

# Build office code map: for existing offices use db lookup, for new ones use generated code
# DB lookup: (cc, office_name_upper) -> code (via code field)
cur2 = mysql.connector.connect(**DB_CONFIG).cursor()
# Note: need fresh connection after potential updates; but we'll rely on code field
# Actually, let's build the office code from db_office_rows + new offices
db_office_code_by_name = {}  # (cc, name_upper) -> office_code
for oid, ocode, oname, oname_norm, occ in db_office_rows:
    db_office_code_by_name[(occ, oname.upper())] = ocode
# Also add the AG-PCS2 fixed mapping
db_office_code_by_name[('AG', 'PCS')] = 'AG-PCS2'
# Add newly generated office codes
for (cc, name), code in office_code_lookup.items():
    db_office_code_by_name[(cc, name.upper())] = code

if missing_pics:
    lines += [
        "-- ──────────────────────────────────────────────────────────",
        f"-- Step 3: 插入缺失 PIC ({len(missing_pics)} 个)",
        "-- ──────────────────────────────────────────────────────────",
        "INSERT INTO sales_pic (name, name_norm, country_code, sales_office_id, is_active)",
        "SELECT pic_data.name, pic_data.name_norm, pic_data.country_code, so.id, 1",
        "FROM (",
    ]

    pic_vals = []
    is_first = True
    skipped = []
    for cc, office, pic in missing_pics:
        ocode = db_office_code_by_name.get((cc, office.upper()))
        if not ocode:
            skipped.append((cc, office, pic))
            continue
        pic_esc  = pic.replace("'", "''")
        pic_norm = pic.upper().replace("'", "''")
        if is_first:
            pic_vals.append(f"  SELECT '{pic_esc}' AS name, '{pic_norm}' AS name_norm, '{cc}' AS country_code, '{ocode}' AS office_code")
            is_first = False
        else:
            pic_vals.append(f"  UNION ALL SELECT '{pic_esc}', '{pic_norm}', '{cc}', '{ocode}'")

    lines.append('\n'.join(pic_vals))
    lines += [
        ") AS pic_data",
        "INNER JOIN dict_sales_office so ON so.code = pic_data.office_code",
        "ON DUPLICATE KEY UPDATE",
        "  name = VALUES(name),",
        "  name_norm = VALUES(name_norm),",
        "  updated_at = CURRENT_TIMESTAMP;",
        f"SELECT 'Inserted {len(missing_pics)} missing PICs' AS status;",
        "",
    ]

    if skipped:
        print(f"\n⚠ 无法找到办公室代码的 PIC ({len(skipped)} 个)，已跳过:")
        for s in skipped:
            print(f"  {s}")
else:
    lines += ["-- Step 3: 无缺失 PIC", ""]

lines += [
    "SET FOREIGN_KEY_CHECKS = 1;",
    "",
    "-- ──────────────────────────────────────────────────────────",
    "-- 验证结果",
    "-- ──────────────────────────────────────────────────────────",
    "SELECT c.country_code, c.country_name_en,",
    "  COUNT(DISTINCT so.id) AS offices,",
    "  COUNT(DISTINCT sp.id) AS pics",
    "FROM country c",
    "LEFT JOIN dict_sales_office so ON so.country_code = c.country_code",
    "LEFT JOIN sales_pic sp ON sp.country_code = c.country_code",
    "WHERE c.country_code IN ('AG','BE','CN','FR','DE','GR','MA','NL','OT','PL','ZA','CH','TB','GB','US')",
    "GROUP BY c.country_code, c.country_name_en",
    "ORDER BY pics DESC;",
]

sql_text = '\n'.join(lines)
with open(OUT_SQL, 'w', encoding='utf-8') as f:
    f.write(sql_text)

print(f"\n✅ 已生成: {OUT_SQL}")
print(f"   缺失国家: {len(missing_countries)}")
print(f"   缺失办公室: {len(missing_offices)}")
print(f"   缺失PIC: {len(missing_pics)}")
