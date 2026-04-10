#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
精细化筛选脚本 v2：
- POL/POD：忽略大小写+空格 再次匹配数据库，真正匹配不上的才列出
- POL/POD 按 Reference Number 中"-"后含A → Air；否则 → Ocean
- Sales PIC：忽略大小写+空格+不可见字符 再次匹配，筛出真正缺失的
"""
import csv, re, sys
from collections import defaultdict

try:
    import pymysql
except ImportError:
    print("pip install pymysql"); sys.exit(1)

SMART = str.maketrans({
    '\u2018':"'",'\u2019':"'",'\u201c':'"','\u201d':'"',
    '\u2032':"'",'\uff07':"'",'\u02bc':"'",
    '\u200b':'','\u200c':'','\u200d':'','\ufeff':'','\xa0':' ',
})

def norm(s: str) -> str:
    """统一标准化：去不可见字符 → 替换智能引号 → 全大写 → 合并空格"""
    s = s.strip().translate(SMART)
    s = re.sub(r'\s+', ' ', s).upper()
    return s

def is_air_ref(ref: str) -> bool:
    """判断是否为空运单号：'-' 后紧跟的字母串中含有 A"""
    m = re.search(r'-([A-Z]+)', ref.upper())
    return bool(m and 'A' in m.group(1))

# ── 连接数据库 ────────────────────────────────────────────────
conn = pymysql.connect(host='localhost', port=3306, user='root',
                       password='ldf123', database='logitrack', charset='utf8mb4')
cur = conn.cursor()

# ── 读取 CSV ──────────────────────────────────────────────────
rows = []
with open('chinese Pricing.csv', encoding='utf-8-sig') as f:
    reader = csv.reader(f, delimiter='\t')
    next(reader)
    for i, row in enumerate(reader, start=2):
        if len(row) < 10: continue
        if len(row) < 34: row = row + [''] * (34 - len(row))
        rows.append((i, row))
print(f"读取 CSV 完成，共 {len(rows)} 行")

# ══════════════════════════════════════════════════════════════
# 1. 构建数据库港口索引（忽略大小写+空格的标准化 key）
# ══════════════════════════════════════════════════════════════
cur.execute("SELECT id, port_code, port_name, city, port_type, country_code FROM port")
db_ports_raw = cur.fetchall()

# 正式索引：norm(key) → (id, port_code, port_name, port_type, country_code, match_field)
port_index = {}

def add_index(key_raw, pid, pcode, pname, ptype, ccode, field):
    # 完整值
    k = norm(key_raw)
    if k and k not in port_index:
        port_index[k] = (pid, pcode or '', pname or '', ptype or '', ccode or '', field)
    # 去所有空格的紧凑形式（如 "HONG KONG" → "HONGKONG"）
    compact = re.sub(r'\s', '', k)
    if compact and compact != k and compact not in port_index:
        port_index[compact] = (pid, pcode or '', pname or '', ptype or '', ccode or '', field + '_compact')
    # 按逗号拆分，索引每一段（处理 "Xingang,Tianjin, China" → 索引 TIANJIN）
    parts_raw = [p.strip() for p in key_raw.split(',')]
    for i, part in enumerate(parts_raw):
        pk = norm(part)
        if pk and len(pk) > 2 and pk not in port_index:
            port_index[pk] = (pid, pcode or '', pname or '', ptype or '', ccode or '', field + f'_part{i}')
        # 每段也建立紧凑形式
        pc = re.sub(r'\s', '', pk)
        if pc and pc != pk and pc not in port_index:
            port_index[pc] = (pid, pcode or '', pname or '', ptype or '', ccode or '', field + f'_part{i}_compact')

for pid, pcode, pname, city, ptype, ccode in db_ports_raw:
    for val, field in [(pcode, 'port_code'), (pname, 'port_name'), (city, 'city')]:
        if val:
            add_index(val, pid, pcode, pname, ptype, ccode, field)

def match_port(token: str):
    t = norm(token)
    if not t or t in ('-', 'TBA', 'N/A', ''):
        return None, None, None, 'empty'
    # 直接命中
    if t in port_index:
        r = port_index[t]; return r[0], r[1], r[2], r[5]
    # 去空格紧凑形式（Hongkong → HONGKONG）
    compact = re.sub(r'\s', '', t)
    if compact != t and compact in port_index:
        r = port_index[compact]; return r[0], r[1], r[2], r[5]
    # 按逗号/换行/斜杠拆分各段，跳过纯数字（邮编）
    parts = [norm(p) for p in re.split(r'[,/\n]', token) if norm(p) and len(norm(p)) > 2]
    for p in parts:
        if re.match(r'^\d+$', p): continue
        if p in port_index:
            r = port_index[p]; return r[0], r[1], r[2], r[5] + '_partial'
        pc = re.sub(r'\s', '', p)
        if pc != p and pc in port_index:
            r = port_index[pc]; return r[0], r[1], r[2], r[5] + '_partial'
    return None, None, None, 'no_match'

# ══════════════════════════════════════════════════════════════
# 2. 重新扫描 CSV，收集真正匹配不上的 POL / POD
# ══════════════════════════════════════════════════════════════
# 结构：{norm_raw_val: {original, count, air_refs[], ocean_refs[], cargo_types[]}}
unmatched_pol = defaultdict(lambda: {'original':'', 'count':0, 'air_refs':[], 'ocean_refs':[], 'cargos':set()})
unmatched_pod = defaultdict(lambda: {'original':'', 'count':0, 'air_refs':[], 'ocean_refs':[], 'cargos':set()})

stat_pol = {'matched':0, 'unmatched':0, 'empty':0}
stat_pod = {'matched':0, 'unmatched':0, 'empty':0}

for row_num, row in rows:
    ref       = row[2].strip()
    pol_raw   = row[18].strip()
    pod_raw   = row[19].strip()
    cargo     = row[11].strip().upper()
    air_flag  = is_air_ref(ref)

    for tok in re.split(r'[/;]', pol_raw):
        tok = tok.strip()
        if not tok or tok in ('-', 'TBA', 'N/A'):
            stat_pol['empty'] += 1; continue
        pid, pcode, pname, mtype = match_port(tok)
        if pid is not None:
            stat_pol['matched'] += 1
        else:
            stat_pol['unmatched'] += 1
            k = norm(tok)
            d = unmatched_pol[k]
            if not d['original']: d['original'] = tok
            d['count'] += 1
            d['cargos'].add(cargo)
            if air_flag: d['air_refs'].append(ref)
            else:        d['ocean_refs'].append(ref)

    for tok in re.split(r'[/;]', pod_raw):
        tok = tok.strip()
        if not tok or tok in ('-', 'TBA', 'N/A'):
            stat_pod['empty'] += 1; continue
        pid, pcode, pname, mtype = match_port(tok)
        if pid is not None:
            stat_pod['matched'] += 1
        else:
            stat_pod['unmatched'] += 1
            k = norm(tok)
            d = unmatched_pod[k]
            if not d['original']: d['original'] = tok
            d['count'] += 1
            d['cargos'].add(cargo)
            if air_flag: d['air_refs'].append(ref)
            else:        d['ocean_refs'].append(ref)

print(f"\nPOL 匹配统计: 命中={stat_pol['matched']}, 未命中={stat_pol['unmatched']}, 空值={stat_pol['empty']}")
print(f"POD 匹配统计: 命中={stat_pod['matched']}, 未命中={stat_pod['unmatched']}, 空值={stat_pod['empty']}")

# ── 辅助：写 POL/POD 分类 CSV ────────────────────────────────
HEADER_PORT = ['CSV原始值', '出现次数', '货运类型(Air/Ocean/Both)',
               'Air单号示例（前5个）', 'Ocean单号示例（前5个）', '建议操作']

def write_port_csv(store, filename_air, filename_ocean, port_label):
    air_rows   = []
    ocean_rows = []
    both_rows_air   = []
    both_rows_ocean = []

    for k, info in store.items():
        has_air   = len(info['air_refs'])   > 0
        has_ocean = len(info['ocean_refs']) > 0
        orig  = info['original']
        cnt   = info['count']
        cargos = ','.join(sorted(info['cargos']))
        air_sample   = '; '.join(info['air_refs'][:5])
        ocean_sample = '; '.join(info['ocean_refs'][:5])
        action = f'请提供正确的 {port_label} 港口代码以便系统匹配'
        row_data = [orig, cnt, cargos, air_sample, ocean_sample, action]

        if has_air and has_ocean:
            both_rows_air.append(row_data)
            both_rows_ocean.append(row_data)
        elif has_air:
            air_rows.append(row_data)
        else:
            ocean_rows.append(row_data)

    # Air 文件（含 both）
    all_air = sorted(air_rows + both_rows_air, key=lambda x: -x[1])
    with open(filename_air, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(HEADER_PORT)
        w.writerows(all_air)
    print(f"✅ {filename_air} — {len(all_air)} 行")

    # Ocean 文件（含 both）
    all_ocean = sorted(ocean_rows + both_rows_ocean, key=lambda x: -x[1])
    with open(filename_ocean, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(HEADER_PORT)
        w.writerows(all_ocean)
    print(f"✅ {filename_ocean} — {len(all_ocean)} 行")

write_port_csv(unmatched_pol,
               'unmapped_Airport_pol.csv', 'unmapped_Ocean_pol.csv', 'POL')
write_port_csv(unmatched_pod,
               'unmapped_Airport_pod.csv', 'unmapped_Ocean_pod.csv', 'POD')

# ══════════════════════════════════════════════════════════════
# 3. Sales PIC：忽略大小写+空格+不可见字符 再次精细比对
# ══════════════════════════════════════════════════════════════
cur.execute("SELECT id, name, sales_country_code, sales_office_id FROM dict_sales_pic")
db_pics_raw = cur.fetchall()

# 建立多层索引：
#   norm(name) → (id, original_name, country_code)
db_pic_by_norm  = {}  # 标准化后完全匹配
db_pic_by_words = {}  # 词集合 frozenset → (id, original_name, country_code)

for pid, pname, pcountry, poffice in db_pics_raw:
    k = norm(pname)
    db_pic_by_norm[k] = (pid, pname, pcountry)
    words = frozenset(re.findall(r'[A-Z]+', k))
    if len(words) >= 2:  # 至少两个词才做词集合匹配（避免单字母误报）
        if words not in db_pic_by_words:
            db_pic_by_words[words] = []
        db_pic_by_words[words].append((pid, pname, pcountry))

# 收集 CSV 中所有 PIC 及关联信息
csv_pic_data = defaultdict(lambda: {'original':'', 'countries':set(), 'offices':set(), 'refs':[], 'count':0})
for row_num, row in rows:
    pic_raw = row[8].strip()
    office  = row[7].strip()
    country = row[6].strip()
    ref     = row[2].strip()
    if not pic_raw or pic_raw in ('-', 'TBA', ''): continue
    k = norm(pic_raw)
    d = csv_pic_data[k]
    if not d['original']: d['original'] = pic_raw
    d['count']    += 1
    d['refs'].append(ref)
    if country: d['countries'].add(country)
    if office:  d['offices'].add(office)

# 精细匹配：norm完全匹配 → 词集合≥0.9 → 真正缺失
truly_missing = []
auto_fixable  = []  # 仅大小写/空格/不可见字符差异，可自动修复

for k, info in csv_pic_data.items():
    orig    = info['original']
    cnt     = info['count']
    countries = ', '.join(sorted(info['countries']))
    offices   = ', '.join(sorted(info['offices'])[:3])
    sample    = '; '.join(info['refs'][:5])

    # 层级1：norm 精确匹配
    if k in db_pic_by_norm:
        db_orig = db_pic_by_norm[k][1]
        if db_orig != orig:  # 原始写法不同但标准化后相同 → 自动可修复
            auto_fixable.append([orig, db_orig, cnt, countries, offices,
                                  '大小写/空格/不可见字符差异，技术团队可自动修复', sample])
        continue  # 已匹配，跳过

    # 层级2：词集合相似度 ≥ 0.85
    words_csv = frozenset(re.findall(r'[A-Z]+', k))
    best_score, best_match_name = 0.0, None
    best_reason = ''
    if len(words_csv) >= 2:
        for db_words, db_list in db_pic_by_words.items():
            score = len(words_csv & db_words) / max(len(words_csv), len(db_words))
            if score > best_score:
                best_score = score
                best_match_name = db_list[0][1]
        if best_score >= 0.85:
            best_reason = f'姓名单词高度相似({int(best_score*100)}%)，请确认是否为同一人'

    truly_missing.append([orig, cnt, countries, offices,
                           best_match_name or '', best_reason,
                           sample,
                           f'疑似与"{best_match_name}"为同一人，请业务确认' if best_match_name
                           else '系统中未找到，请确认是否需要新增'])

# 输出：真正缺失的
HEADER_PIC = ['CSV原始姓名', '出现次数', '所属Country', '所属Sales Office（前3个）',
              '系统可能匹配', '匹配原因', '对应Reference Number（前5个）', '建议操作']
truly_missing.sort(key=lambda x: -x[1])
with open('unmapped_sales_pic_v2.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(HEADER_PIC)
    w.writerows(truly_missing)
print(f"\n✅ unmapped_sales_pic_v2.csv — {len(truly_missing)} 个真正缺失的 PIC")

# 输出：可自动修复的（给技术团队参考）
auto_fixable.sort(key=lambda x: -x[2])
with open('_auto_fix_sales_pic.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['CSV原始姓名', '数据库实际值', '出现次数', '所属Country',
                '所属Sales Office（前3个）', '修复方式', '对应Reference Number（前5个）'])
    w.writerows(auto_fixable)
print(f"✅ _auto_fix_sales_pic.csv — {len(auto_fixable)} 个可自动修复的 PIC（技术团队处理，无需业务介入）")

conn.close()
print("\n=== 全部完成 ===")
print("  📄 unmapped_Airport_pol.csv   — 空运 POL 无法匹配")
print("  📄 unmapped_Ocean_pol.csv     — 海运 POL 无法匹配")
print("  📄 unmapped_Airport_pod.csv   — 空运 POD 无法匹配")
print("  📄 unmapped_Ocean_pod.csv     — 海运 POD 无法匹配")
print("  📄 unmapped_sales_pic_v2.csv  — 真正缺失的 Sales PIC（业务核对）")
print("  📄 _auto_fix_sales_pic.csv    — 可自动修复的 PIC（技术处理）")
