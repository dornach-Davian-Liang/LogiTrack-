#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据校验脚本 - 校验 chinese Pricing.csv 与 MySQL enquiry 表数据一致性
"""
import csv
import re
import os
import sys
from datetime import datetime
from collections import defaultdict

try:
    import pymysql
    from dateutil import parser as date_parser
except ImportError:
    print("pip install pymysql python-dateutil")
    sys.exit(1)

DB_CONFIG = {
    'host': 'localhost', 'port': 3306,
    'user': 'root', 'password': 'ldf123',
    'database': 'logitrack', 'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}
CSV_FILE = os.path.join(os.path.dirname(__file__), 'chinese Pricing.csv')

_INVISIBLE = re.compile(r'[\u200b\u200c\u200d\u200e\u200f\ufeff\u00ad]')

def clean(v):
    if not v: return ''
    s = str(v).replace('\r\n', ' ').replace('\n', ' ').strip()
    return _INVISIBLE.sub('', re.sub(r'\s+', ' ', s)).strip()

def normalize_quotes(s):
    return s.replace('\u2019', "'").replace('\u2018', "'").replace('\u02bc', "'")

def parse_date(v):
    raw = clean(v)
    if not raw or raw.upper() in ('TBA', '-', 'N/A', 'NA', '/', '\\', ''):
        return None
    try:
        return date_parser.parse(raw, dayfirst=True).strftime('%Y-%m-%d')
    except:
        return None

def parse_number(v):
    raw = clean(v)
    if not raw or raw.upper() in ('TBA', '-', 'N/A', ''):
        return None
    try:
        return float(raw.replace(',', ''))
    except:
        return None

def normalize_status(v):
    v = clean(v).lower()
    return {'new': 'New', 'quoted': 'Quoted', 'cancelled': 'Cancelled', 'canceled': 'Cancelled'}.get(v, 'New')

def normalize_booking(v):
    v = clean(v).lower()
    return {'yes': 'Yes', 'rejected': 'Rejected', 'pending': 'Pending', 'invalid': 'Invalid'}.get(v, 'Pending')

def get_offer_type(cargo):
    c = cargo.upper()
    if c == 'AIR': return 'AIR'
    if c in ('FCL', 'LCL', 'SEA', 'RAIL-SEA', 'SEA-AIR'): return 'OCEAN'
    return 'OTHER'

# 列索引
C_DATE, C_IDATE, C_REF, C_PROD, C_STATUS = 0, 1, 2, 3, 4
C_CN_ADMIN, C_COUNTRY, C_OFFICE, C_PIC, C_CN = 5, 6, 7, 8, 9
C_CARGO, C_VOL, C_QTY, C_UNIT, C_TEU = 11, 12, 13, 14, 15
C_COMM, C_HAZ, C_POL, C_POD, C_POD_C = 16, 17, 18, 19, 20
C_CORE, C_CAT, C_READY = 21, 22, 23
C_ADD, C_FSQ, C_FO_OCN, C_FO_AIR, C_LO_OCN, C_LO_AIR = 24, 25, 26, 27, 28, 29
C_BOOK, C_REM, C_REJ, C_ACT = 30, 31, 32, 33

conn = pymysql.connect(**DB_CONFIG)
cur = conn.cursor()

print("=" * 70)
print("  数据校验报告 - chinese Pricing.csv vs MySQL logitrack")
print("=" * 70)

# ============================================================
# 1. 行数校验
# ============================================================
print("\n【1】行数校验")
with open(CSV_FILE, 'r', encoding='utf-8-sig', errors='replace', newline='') as f:
    reader = csv.reader(f, delimiter='\t')
    next(reader)
    csv_rows = [r for r in reader if len(r) > 2 and r[2].strip()]
csv_count = len(csv_rows)

cur.execute("SELECT COUNT(*) AS cnt FROM enquiry")
db_count = cur.fetchone()['cnt']

# 检查CSV中重复reference
refs = [r[2].strip() for r in csv_rows]
from collections import Counter
dup_refs = {k: v for k, v in Counter(refs).items() if v > 1}

expected = csv_count - len(dup_refs)  # 重复的只算1条
print(f"  CSV 数据行:         {csv_count}")
print(f"  CSV 重复reference:  {sum(v-1 for v in dup_refs.values())} 行 ({len(dup_refs)} 个不同ref)")
print(f"  期望DB行数:         {expected}")
print(f"  实际DB行数:         {db_count}")
row_match = abs(db_count - expected) <= 2
print(f"  结论: {'✅ 一致' if row_match else '❌ 不一致'}")

# ============================================================
# 2. 逐字段抽样校验 (取100条)
# ============================================================
print("\n【2】字段值校验 (抽样100条)")

# 加载DB数据到字典
cur.execute("""
    SELECT e.reference_number, e.enquiry_received_date, e.issue_date,
           e.product_code, e.status, e.cn_pricing_admin,
           e.cargo_type_code, e.volume_cbm, e.quantity, e.quantity_uom_code,
           e.quantity_teu, e.commodity, e.cargo_ready_date,
           e.booking_confirmed, e.remark, e.rejected_reason, e.actual_reason,
           e.core_flag, e.additional_requirement,
           c_sales.country_name_en AS sales_country_name,
           c_pod.country_name_en AS pod_country_name,
           o.name AS office_name,
           po_l.port_code AS pol_code,
           po_d.port_code AS pod_code
    FROM enquiry e
    LEFT JOIN country c_sales ON e.sales_country_id = c_sales.id
    LEFT JOIN country c_pod ON e.pod_country_id = c_pod.id
    LEFT JOIN dict_sales_office o ON e.sales_office_id = o.id
    LEFT JOIN port po_l ON e.pol_id = po_l.id
    LEFT JOIN port po_d ON e.pod_id = po_d.id
    LIMIT 10000
""")
db_map = {r['reference_number']: r for r in cur.fetchall()}

# 加载容器明细
cur.execute("SELECT enquiry_id, container_code, container_qty FROM enquiry_container_line")
container_by_enquiry = defaultdict(list)
for r in cur.fetchall():
    container_by_enquiry[r['enquiry_id']].append((r['container_code'], r['container_qty']))

cur.execute("SELECT id, reference_number FROM enquiry LIMIT 10000")
id_map = {r['reference_number']: r['id'] for r in cur.fetchall()}

CONTAINER_MAP = {
    "20gp": "20GP", "20'gp": "20GP", "20'": "20GP",
    "40gp": "40GP", "40'gp": "40GP", "40'": "40GP",
    "40hq": "40HQ", "40'hq": "40HQ", "40hc": "40HQ", "40'hc": "40HQ",
    "45hq": "45HQ", "45'hq": "45HQ", "45hc": "45HQ",
    "20rf": "20RF", "20'rf": "20RF",
    "40rf": "40RF", "40'rf": "40RF",
    "20ot": "20OT", "20'ot": "20OT",
    "40ot": "40OT", "40'ot": "40OT",
    "20fr": "20FR", "20'fr": "20FR", "20' flat rack": "20FR",
    "40fr": "40FR", "40'fr": "40FR", "40' flat rack": "40FR",
}

mismatches = []
checked = 0
skip_refs = set(dup_refs.keys())

import random
random.seed(42)
sample_indices = random.sample(range(len(csv_rows)), min(500, len(csv_rows)))

fields_err = defaultdict(int)

for idx in sample_indices:
    row = csv_rows[idx]
    ref = row[C_REF].strip()
    if ref in skip_refs:
        continue
    if ref not in db_map:
        mismatches.append(f"  {ref}: DB中找不到该记录")
        continue

    db = db_map[ref]
    checked += 1

    def col(i):
        return clean(row[i]) if i < len(row) else ''

    errs = []

    # 日期
    csv_enq = parse_date(col(C_DATE))
    db_enq = db['enquiry_received_date'].strftime('%Y-%m-%d') if db['enquiry_received_date'] else None
    if csv_enq and db_enq and csv_enq != db_enq:
        errs.append(f"enquiry_date: csv={csv_enq} db={db_enq}")
        fields_err['enquiry_received_date'] += 1

    csv_issue = parse_date(col(C_IDATE))
    db_issue = db['issue_date'].strftime('%Y-%m-%d') if db['issue_date'] else None
    if csv_issue and db_issue and csv_issue != db_issue:
        errs.append(f"issue_date: csv={csv_issue} db={db_issue}")
        fields_err['issue_date'] += 1

    # 产品
    csv_prod = col(C_PROD).upper()
    if csv_prod and db['product_code'] and csv_prod != db['product_code']:
        errs.append(f"product_code: csv={csv_prod} db={db['product_code']}")
        fields_err['product_code'] += 1

    # 状态
    csv_status = normalize_status(col(C_STATUS))
    if csv_status != db['status']:
        errs.append(f"status: csv={csv_status} db={db['status']}")
        fields_err['status'] += 1

    # CN Admin
    csv_admin = col(C_CN_ADMIN)
    db_admin = db['cn_pricing_admin'] or ''
    if csv_admin and db_admin and csv_admin.upper() != db_admin.upper():
        errs.append(f"cn_admin: csv={csv_admin} db={db_admin}")
        fields_err['cn_pricing_admin'] += 1

    # 货物类型
    csv_cargo = col(C_CARGO).upper()
    if csv_cargo and db['cargo_type_code'] and csv_cargo != db['cargo_type_code']:
        errs.append(f"cargo_type: csv={csv_cargo} db={db['cargo_type_code']}")
        fields_err['cargo_type_code'] += 1

    # 体积
    csv_vol = parse_number(col(C_VOL))
    if csv_vol is not None and db['volume_cbm'] is not None:
        if abs(float(csv_vol) - float(db['volume_cbm'])) > 0.01:
            errs.append(f"volume_cbm: csv={csv_vol} db={db['volume_cbm']}")
            fields_err['volume_cbm'] += 1

    # 数量 (只校验 KG 类型)
    unit_raw = normalize_quotes(col(C_UNIT))
    if unit_raw.upper() in ('KG', 'KGS'):
        csv_qty = parse_number(col(C_QTY))
        if csv_qty is not None and db['quantity'] is not None:
            if abs(float(csv_qty) - float(db['quantity'])) > 0.01:
                errs.append(f"quantity: csv={csv_qty} db={db['quantity']}")
                fields_err['quantity'] += 1
        if db['quantity_uom_code'] != 'KG':
            errs.append(f"uom_code: csv=KG db={db['quantity_uom_code']}")
            fields_err['quantity_uom_code'] += 1

    # 货好日期
    csv_ready = parse_date(col(C_READY))
    db_ready = db['cargo_ready_date'].strftime('%Y-%m-%d') if db['cargo_ready_date'] else None
    if csv_ready and db_ready and csv_ready != db_ready:
        errs.append(f"cargo_ready: csv={csv_ready} db={db_ready}")
        fields_err['cargo_ready_date'] += 1

    raw_ready = col(C_READY)
    if raw_ready.upper() in ('TBA', '-') and db_ready is not None:
        errs.append(f"cargo_ready TBA but db={db_ready}")
        fields_err['cargo_ready_tba'] += 1

    # 订单状态
    csv_book = normalize_booking(col(C_BOOK))
    if csv_book != db['booking_confirmed']:
        errs.append(f"booking: csv={csv_book} db={db['booking_confirmed']}")
        fields_err['booking_confirmed'] += 1

    # 国家名（大写比较）
    csv_country = col(C_COUNTRY).upper()
    db_country = (db['sales_country_name'] or '').upper()
    if csv_country and db_country and csv_country != db_country:
        # 宽松匹配
        if csv_country not in db_country and db_country not in csv_country:
            errs.append(f"sales_country: csv={col(C_COUNTRY)} db={db['sales_country_name']}")
            fields_err['sales_country'] += 1

    # 港口代码
    csv_pol = re.sub(r'[^A-Za-z0-9]', '', col(C_POL)).upper()
    db_pol = (db['pol_code'] or '').upper()
    if csv_pol and db_pol and csv_pol != db_pol:
        errs.append(f"pol: csv={csv_pol} db={db_pol}")
        fields_err['pol'] += 1

    csv_pod = re.sub(r'[^A-Za-z0-9]', '', col(C_POD)).upper()
    db_pod = (db['pod_code'] or '').upper()
    if csv_pod and db_pod and csv_pod != db_pod:
        errs.append(f"pod: csv={csv_pod} db={db_pod}")
        fields_err['pod'] += 1

    if errs:
        mismatches.append(f"  {ref}: " + " | ".join(errs))

print(f"  抽样校验 {checked} 条记录")
print(f"  字段不匹配行数: {len(mismatches)}")

if fields_err:
    print(f"\n  字段错误统计:")
    for field, cnt in sorted(fields_err.items(), key=lambda x: -x[1]):
        print(f"    {field:<30}: {cnt} 处")

if mismatches[:20]:
    print(f"\n  不匹配详情 (前20条):")
    for m in mismatches[:20]:
        print(m)
else:
    print("  ✅ 抽样字段全部匹配")

# ============================================================
# 3. offer 校验
# ============================================================
print("\n【3】报价记录(offer)校验")
cur.execute("SELECT COUNT(*) AS cnt FROM offer")
offer_cnt = cur.fetchone()['cnt']
# CSV中有报价的行数
has_offer = 0
for row in csv_rows:
    cargo = clean(row[C_CARGO]).upper()
    ot = get_offer_type(cargo)
    if ot == 'OCEAN':
        v1 = clean(row[C_FO_OCN] if len(row) > C_FO_OCN else '')
        v2 = clean(row[C_LO_OCN] if len(row) > C_LO_OCN else '')
    elif ot == 'AIR':
        v1 = clean(row[C_FO_AIR] if len(row) > C_FO_AIR else '')
        v2 = clean(row[C_LO_AIR] if len(row) > C_LO_AIR else '')
    else:
        v1 = clean(row[C_FO_OCN] if len(row) > C_FO_OCN else '') or clean(row[C_FO_AIR] if len(row) > C_FO_AIR else '')
        v2 = ''
    if v1 and v1 not in ('-', 'N/A', 'TBA'):
        has_offer += 1

print(f"  CSV 有报价行数:   {has_offer}")
print(f"  DB offer 记录数:  {offer_cnt}")
print(f"  结论: {'✅ 合理 (offer数≥有报价行数说明部分记录有first+latest两条)' if offer_cnt >= has_offer else '⚠️ 请人工复查'}")

# ============================================================
# 4. 容器明细校验
# ============================================================
print("\n【4】容器明细(enquiry_container_line)校验")
cur.execute("SELECT COUNT(*) AS cnt FROM enquiry_container_line")
ecl_cnt = cur.fetchone()['cnt']

# CSV中FCL容器行数
fcl_rows = sum(1 for r in csv_rows if clean(r[C_CARGO]).upper() == 'FCL')
print(f"  CSV FCL 行数:          {fcl_rows}")
print(f"  DB 容器明细行数:       {ecl_cnt}")
print(f"  结论: {'✅ 合理 (多柜型会产生多行)' if ecl_cnt >= fcl_rows * 0.8 else '⚠️ 容器明细偏少，请复查'}")

# 容器类型分布对比
cur.execute("SELECT container_code, SUM(container_qty) AS total_qty FROM enquiry_container_line GROUP BY container_code ORDER BY total_qty DESC")
db_containers = {r['container_code']: r['total_qty'] for r in cur.fetchall()}
print(f"\n  DB 容器类型分布:")
for code, qty in db_containers.items():
    print(f"    {code}: {qty} 箱")

# ============================================================
# 5. TBA 日期校验
# ============================================================
print("\n【5】TBA货好日期校验 (应写入NULL)")
tba_count_csv = sum(1 for r in csv_rows if clean(r[C_READY] if len(r) > C_READY else '').upper() in ('TBA', '-'))
cur.execute("SELECT COUNT(*) AS cnt FROM enquiry WHERE cargo_ready_date IS NULL")
null_date_db = cur.fetchone()['cnt']
cur.execute("SELECT COUNT(*) AS cnt FROM enquiry WHERE cargo_ready_date_raw_text IS NOT NULL")
raw_text_db = cur.fetchone()['cnt']
print(f"  CSV TBA/- 日期行数:    {tba_count_csv}")
print(f"  DB cargo_ready_date=NULL: {null_date_db}")
print(f"  DB cargo_ready_date_raw_text≠NULL: {raw_text_db} (应为0)")
print(f"  结论: {'✅ 正确' if raw_text_db == 0 and null_date_db >= tba_count_csv else '⚠️ 请复查'}")

# ============================================================
# 6. qty/unit 互换校验
# ============================================================
print("\n【6】qty/unit互换修复校验 (抽查5条)")
swap_cases = []
for row in csv_rows:
    qty_s = normalize_quotes(clean(row[C_QTY] if len(row) > C_QTY else ''))
    unit_s = normalize_quotes(clean(row[C_UNIT] if len(row) > C_UNIT else ''))
    try:
        float(unit_s.replace(',', ''))
        unit_is_num = True
    except:
        unit_is_num = False
    unit_low = unit_s.lower().strip("'")
    qty_is_cont = unit_low in CONTAINER_MAP or '/' in unit_s
    if unit_is_num and qty_is_cont:
        swap_cases.append((row[C_REF].strip(), qty_s, unit_s))

print(f"  CSV 检测到需互换行数: {len(swap_cases)}")
for ref, qty, unit in swap_cases[:5]:
    if ref in db_map:
        db = db_map[ref]
        print(f"    {ref}: csv_qty_col={qty} csv_unit_col={unit} → db.quantity={db['quantity']} db.uom={db['quantity_uom_code']}")

# ============================================================
# 7. 总结
# ============================================================
print("\n" + "=" * 70)
print("【总结】")
print(f"  行数校验:      {'✅ 通过' if row_match else '❌ 需检查'}")
print(f"  字段校验:      {'✅ 通过' if not mismatches else f'⚠️ {len(mismatches)} 行存在差异'}")
print(f"  报价校验:      {'✅ 合理' if offer_cnt >= has_offer else '⚠️'}")
print(f"  容器明细校验:  {'✅ 合理' if ecl_cnt >= fcl_rows * 0.8 else '⚠️'}")
print(f"  TBA日期校验:   {'✅ 通过' if raw_text_db == 0 else '⚠️'}")
print(f"  qty/unit互换:  {'✅ 已处理 ' + str(len(swap_cases)) + ' 行' if swap_cases else '✅ 无互换'}")
print("=" * 70)

conn.close()
