#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
精度验证脚本：
1. Port 匹配 — 抽查「匹配成功」的样本是否真的正确，以及漏匹配情况
2. Container — 验证数量统计和映射完整性
3. Sales PIC — 检查「模糊匹配」建议的准确率
4. Sales Office — 同上
"""
import csv, re, sys
from collections import defaultdict, Counter

try:
    import pymysql
except ImportError:
    print("pip install pymysql"); sys.exit(1)

conn = pymysql.connect(host='localhost', port=3306, user='root',
                       password='ldf123', database='logitrack', charset='utf8mb4')
cur = conn.cursor()

rows = []
with open('chinese Pricing.csv', encoding='utf-8-sig') as f:
    reader = csv.reader(f, delimiter='\t')
    next(reader)
    for i, row in enumerate(reader, start=2):
        if len(row) < 10: continue
        if len(row) < 34: row = row + [''] * (34 - len(row))
        rows.append((i, row))

# ──────────────────────────────────────────────
# 1. PORT 匹配准确度验证
# ──────────────────────────────────────────────
cur.execute("SELECT id, port_code, port_name, city, port_type, country_code FROM port")
db_ports_raw = cur.fetchall()
port_by_code = {}; port_by_name = {}; port_by_city = {}
for pid, pcode, pname, city, ptype, ccode in db_ports_raw:
    if pcode: port_by_code[pcode.strip().upper()] = (pid, pcode, pname, ccode)
    if pname: port_by_name[pname.strip().upper()] = (pid, pcode, pname, ccode)
    if city:  port_by_city[city.strip().upper()]  = (pid, pcode, pname, ccode)

SMART = str.maketrans({'\u2018':"'",'\u2019':"'",'\u201c':'"','\u201d':'"'})

def try_match_port(token):
    t = token.strip().translate(SMART)
    tu = t.upper()
    if not tu or tu in ('-','TBA','N/A',''): return None,'empty'
    if tu in port_by_code: return port_by_code[tu],'code'
    if tu in port_by_name: return port_by_name[tu],'name'
    if tu in port_by_city: return port_by_city[tu],'city'
    first = tu.split(',')[0].strip()
    if first in port_by_code: return port_by_code[first],'code_partial'
    if first in port_by_name: return port_by_name[first],'name_partial'
    if first in port_by_city: return port_by_city[first],'city_partial'
    last = tu.split(',')[-1].strip()
    if last and last != tu:
        if last in port_by_code: return port_by_code[last],'code_tail'
        if last in port_by_name: return port_by_name[last],'name_tail'
        if last in port_by_city: return port_by_city[last],'city_tail'
    return None,'no_match'

print("=" * 60)
print("1. PORT 匹配精度验证")
print("=" * 60)

pol_stats = Counter(); pod_stats = Counter()
matched_by_city_pol = []   # 城市匹配样本（风险最高）
matched_by_city_pod = []
unmatched_pol_count = 0; unmatched_pod_count = 0
total_pol_tokens = 0; total_pod_tokens = 0

for row_num, row in rows:
    ref = row[2].strip()
    for tok in re.split(r'[/;]', row[18].strip()):
        tok = tok.strip()
        if not tok or tok in ('-','TBA','N/A'): continue
        total_pol_tokens += 1
        result, mtype = try_match_port(tok)
        pol_stats[mtype] += 1
        if result and 'city' in mtype:
            matched_by_city_pol.append((tok, result[1], result[2], result[3]))
        if result is None:
            unmatched_pol_count += 1

    for tok in re.split(r'[/;]', row[19].strip()):
        tok = tok.strip()
        if not tok or tok in ('-','TBA','N/A'): continue
        total_pod_tokens += 1
        result, mtype = try_match_port(tok)
        pod_stats[mtype] += 1
        if result and 'city' in mtype:
            matched_by_city_pod.append((tok, result[1], result[2], result[3]))
        if result is None:
            unmatched_pod_count += 1

print(f"\n【POL】总 token 数: {total_pol_tokens}")
for k, v in sorted(pol_stats.items(), key=lambda x:-x[1]):
    pct = v/total_pol_tokens*100
    print(f"  {k:20s}: {v:4d} ({pct:.1f}%)")
print(f"\n  ⚠️  city 匹配样本（准确度存疑，前20条）:")
seen = set()
for raw, code, name, country in matched_by_city_pol[:40]:
    key = (raw.upper(), code)
    if key not in seen:
        seen.add(key)
        print(f"    CSV: {repr(raw):30s} → DB: {code} '{name}' [{country}]")
    if len(seen) >= 20: break

print(f"\n【POD】总 token 数: {total_pod_tokens}")
for k, v in sorted(pod_stats.items(), key=lambda x:-x[1]):
    pct = v/total_pod_tokens*100
    print(f"  {k:20s}: {v:4d} ({pct:.1f}%)")
print(f"\n  ⚠️  city 匹配样本（准确度存疑，前20条）:")
seen = set()
for raw, code, name, country in matched_by_city_pod[:60]:
    key = (raw.upper(), code)
    if key not in seen:
        seen.add(key)
        print(f"    CSV: {repr(raw):35s} → DB: {code} '{name}' [{country}]")
    if len(seen) >= 20: break

# ──────────────────────────────────────────────
# 2. CONTAINER 准确度
# ──────────────────────────────────────────────
print("\n" + "=" * 60)
print("2. CONTAINER 映射精度验证")
print("=" * 60)
cur.execute("SELECT container_code FROM container_types")
db_containers = set(r[0].upper() for r in cur.fetchall())
print(f"数据库现有箱型: {sorted(db_containers)}")

SMART_Q = str.maketrans({'\u2018':"'",'\u2019':"'",'\u2032':"'",'\uff07':"'",'\u02bc':"'"})
CONTAINER_RE = re.compile(r"20|40|45|GP|HQ|HC|OT|FR|RF|NOR|TANK|REEFER|FLAT|RACK|BULK|BBK|BREAK|FLEXI", re.I)

# 统计 unit 列中所有唯一 token
unit_tokens = Counter()
for row_num, row in rows:
    unit_raw = row[14].strip().translate(SMART_Q)
    qty_raw  = row[13].strip().translate(SMART_Q)
    if unit_raw and re.match(r'^\d[\d,\.]*$', unit_raw.replace(',','')):
        if CONTAINER_RE.search(qty_raw):
            unit_raw, qty_raw = qty_raw, unit_raw
    if CONTAINER_RE.search(unit_raw):
        for tok in re.split(r'[/+&,x\*](?=\s*[\d\'\"2345])', unit_raw):
            tok = tok.strip()
            if tok and CONTAINER_RE.search(tok):
                unit_tokens[tok] += 1

print(f"\n所有含容器关键词的 unit token ({len(unit_tokens)} 种):")
for tok, cnt in sorted(unit_tokens.items(), key=lambda x:-x[1])[:50]:
    print(f"  {repr(tok):35s}: {cnt}")

# ──────────────────────────────────────────────
# 3. SALES PIC 模糊匹配准确度验证
# ──────────────────────────────────────────────
print("\n" + "=" * 60)
print("3. SALES PIC 模糊匹配准确度验证")
print("=" * 60)
cur.execute("SELECT id, name, sales_country_code FROM dict_sales_pic ORDER BY name")
db_pics = {r[1].strip().upper(): (r[0], r[1], r[2]) for r in cur.fetchall()}

# 读取导出的 unmapped_sales_pic.csv，检查建议的「模糊匹配」
fuzzy_suggestions = []
with open('unmapped_sales_pic.csv', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('系统可能匹配（模糊）'):
            fuzzy_suggestions.append({
                'csv_name': row['CSV原始姓名'],
                'suggestion': row['系统可能匹配（模糊）'],
                'count': row['出现次数'],
            })

print(f"\n模糊匹配建议总数: {len(fuzzy_suggestions)}")
print("（脚本只检测多余空格，下面列出所有有建议的条目）:")
no_suggestion_but_similar = []
for _, info in db_pics.items():
    db_name = info[1]
for csv_key, db_info in [(k, db_pics.get(k)) for k in db_pics]:
    pass

# 更完整：将全部 CSV PIC 与 DB PIC 做编辑距离近似比对
csv_pics_raw = {}
for row_num, row in rows:
    pic = row[8].strip()
    if pic and pic not in ('-',''):
        csv_pics_raw[pic.upper()] = pic

# 找出 DB 中不存在但可能是拼写差异的
def similarity(a, b):
    # 简单的：去标点后比较词集合的交集程度
    wa = set(re.findall(r'[A-Z]+', a.upper()))
    wb = set(re.findall(r'[A-Z]+', b.upper()))
    if not wa or not wb: return 0
    return len(wa & wb) / max(len(wa), len(wb))

missing_csv = [k for k in csv_pics_raw if k not in db_pics]
print(f"\n缺失 PIC 总数: {len(missing_csv)}")
print("\n--- 有模糊匹配建议的条目 ---")
for s in fuzzy_suggestions:
    print(f"  CSV: {repr(s['csv_name']):35s} → 建议: {repr(s['suggestion'])} ({s['count']}次)")

# ──────────────────────────────────────────────
# 4. SALES OFFICE 模糊匹配准确度
# ──────────────────────────────────────────────
print("\n" + "=" * 60)
print("4. SALES OFFICE 模糊匹配准确度验证")
print("=" * 60)
with open('unmapped_sales_office.csv', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"  CSV: {repr(row['CSV原始办公室名称']):45s} | 次数: {row['出现次数']:4s} | "
              f"模糊建议: {repr(row['系统可能匹配（模糊）'])} | 操作: {row['建议操作']}")

conn.close()
print("\n=== 验证完成 ===")
