#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
导出所有无法映射的数据，供业务团队核对
输出文件：
  unmapped_pol.csv        - 无法匹配的 POL（起运港）
  unmapped_pod.csv        - 无法匹配的 POD（目的港）
  unmapped_container.csv  - 数据库缺失的箱型
  unmapped_sales_pic.csv  - 缺失的 Sales PIC
  unmapped_sales_office.csv - 缺失的 Sales Office
"""
import csv, re, sys
from collections import defaultdict

try:
    import pymysql
except ImportError:
    print("请先安装 pymysql: pip install pymysql"); sys.exit(1)

# ── 数据库连接 ────────────────────────────────────────────────
conn = pymysql.connect(host='localhost', port=3306, user='root',
                       password='ldf123', database='logitrack', charset='utf8mb4')
cur = conn.cursor()

# ── 读取 CSV ──────────────────────────────────────────────────
rows = []
with open('chinese Pricing.csv', encoding='utf-8-sig') as f:
    reader = csv.reader(f, delimiter='\t')
    next(reader)  # 跳过表头
    for i, row in enumerate(reader, start=2):
        if len(row) < 10:
            continue
        if len(row) < 34:
            row = row + [''] * (34 - len(row))
        rows.append((i, row))

print(f"读取 CSV 完成，共 {len(rows)} 行数据")

# ══════════════════════════════════════════════════════════════
# 1. POL / POD 无法匹配
# ══════════════════════════════════════════════════════════════
# 从数据库读取所有港口（port_code、port_name、city）
cur.execute("SELECT id, port_code, port_name, city, port_type, country_code FROM port")
db_ports_raw = cur.fetchall()

# 建立多层索引
port_by_code  = {}   # code.upper() -> id
port_by_name  = {}   # name.upper() -> id
port_by_city  = {}   # city.upper() -> id

for pid, pcode, pname, city, ptype, ccode in db_ports_raw:
    if pcode:  port_by_code[pcode.strip().upper()] = pid
    if pname:  port_by_name[pname.strip().upper()] = pid
    if city:   port_by_city[city.strip().upper()]  = pid

def normalize_port_token(raw: str) -> str:
    """标准化单个港口 token，去除冗余修饰"""
    s = raw.strip()
    # 替换智能引号
    s = s.replace('\u2018','\'').replace('\u2019','\'').replace('\u201c','"').replace('\u201d','"')
    return s

# 新增：去空格/标点索引
port_by_name_ns = {}  # name 去空格
port_by_city_ns = {}  # city 去空格
port_by_name_np = {}  # name 去所有非字母数字
port_by_city_np = {}  # city 去所有非字母数字

for pid, pcode, pname, city, ptype, ccode in db_ports_raw:
    if pname:
        pnu = pname.strip().upper()
        port_by_name_ns[re.sub(r'\s+', '', pnu)] = pid
        port_by_name_np[re.sub(r'[^A-Z0-9]', '', pnu)] = pid
    if city:
        ctu = city.strip().upper()
        port_by_city_ns[re.sub(r'\s+', '', ctu)] = pid
        port_by_city_np[re.sub(r'[^A-Z0-9]', '', ctu)] = pid

def try_match_port(token: str):
    """
    按 code → name → city 三层匹配，增加空格/标点/后缀容错
    """
    t = normalize_port_token(token)
    tu = t.upper()
    if not tu or tu in ('-', 'TBA', 'N/A', ''):
        return None, 'empty'

    # 精确匹配（原有逻辑）
    if tu in port_by_code:
        return port_by_code[tu], 'code'
    if tu in port_by_name:
        return port_by_name[tu], 'name'
    if tu in port_by_city:
        return port_by_city[tu], 'city'

    # 去空格匹配（如 Hongkong → Hong Kong, ABUD HABI → Abu Dhabi）
    tu_ns = re.sub(r'\s+', '', tu)
    if tu_ns in port_by_name_ns:
        return port_by_name_ns[tu_ns], 'name_nospace'
    if tu_ns in port_by_city_ns:
        return port_by_city_ns[tu_ns], 'city_nospace'

    # 去标点匹配（如 Fos-Sur-Mer → Fos Sur Mer, Dar-es-salaam → Dar Es Salaam）
    tu_np = re.sub(r'[^A-Z0-9]', '', tu)
    if tu_np in port_by_name_np:
        return port_by_name_np[tu_np], 'name_nopunct'
    if tu_np in port_by_city_np:
        return port_by_city_np[tu_np], 'city_nopunct'

    # 去常见后缀（Port, City, Station, District）
    for suffix in [' PORT', ' CITY', ' STATION', ' DISTRICT']:
        if tu.endswith(suffix):
            base = tu[:-len(suffix)].strip()
            if base in port_by_code:  return port_by_code[base], 'code_desuffix'
            if base in port_by_name:  return port_by_name[base], 'name_desuffix'
            if base in port_by_city:  return port_by_city[base], 'city_desuffix'

    # 尾部加 . 的（如 London Gateway.）
    tu_dot = tu.rstrip('.')
    if tu_dot != tu:
        if tu_dot in port_by_code:  return port_by_code[tu_dot], 'code_dot'
        if tu_dot in port_by_name:  return port_by_name[tu_dot], 'name_dot'
        if tu_dot in port_by_city:  return port_by_city[tu_dot], 'city_dot'

    # 逗号分隔取首段/尾段（原有逻辑）
    first = tu.split(',')[0].strip()
    if first in port_by_code:  return port_by_code[first], 'code_partial'
    if first in port_by_name:  return port_by_name[first], 'name_partial'
    if first in port_by_city:  return port_by_city[first], 'city_partial'
    last = tu.split(',')[-1].strip()
    if last and last != tu:
        if last in port_by_code:  return port_by_code[last], 'code_tail'
        if last in port_by_name:  return port_by_name[last], 'name_tail'
        if last in port_by_city:  return port_by_city[last], 'city_tail'
    return None, 'no_match'

# 收集所有未匹配的 POL / POD
unmapped_pol = {}   # raw_value -> {ref_numbers, occurrences, row_nums}
unmapped_pod = {}

def record_unmatch(store: dict, raw_val: str, ref_num: str, row_num: int):
    if raw_val not in store:
        store[raw_val] = {'refs': [], 'count': 0}
    store[raw_val]['refs'].append(ref_num)
    store[raw_val]['count'] += 1

for row_num, row in rows:
    ref = row[2].strip()
    pol_raw = row[18].strip()
    pod_raw = row[19].strip()

    # POL：按 '/' 分隔多港口
    for tok in re.split(r'[/;]', pol_raw):
        tok = tok.strip()
        if not tok or tok in ('-', 'TBA', 'N/A'):
            continue
        pid, mtype = try_match_port(tok)
        if pid is None:
            record_unmatch(unmapped_pol, tok, ref, row_num)

    # POD：同上
    for tok in re.split(r'[/;]', pod_raw):
        tok = tok.strip()
        if not tok or tok in ('-', 'TBA', 'N/A'):
            continue
        pid, mtype = try_match_port(tok)
        if pid is None:
            record_unmatch(unmapped_pod, tok, ref, row_num)

# 写 POL CSV
with open('unmapped_pol.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['CSV原始值', '出现次数', '对应Reference Number（前5个）', '建议操作'])
    for val, info in sorted(unmapped_pol.items(), key=lambda x: -x[1]['count']):
        sample_refs = '; '.join(info['refs'][:5])
        w.writerow([val, info['count'], sample_refs, '请提供正确的港口代码（如CNSHA）以便系统匹配'])
print(f"✅ unmapped_pol.csv — {len(unmapped_pol)} 个未匹配 POL 值")

# 写 POD CSV
with open('unmapped_pod.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['CSV原始值', '出现次数', '对应Reference Number（前5个）', '建议操作'])
    for val, info in sorted(unmapped_pod.items(), key=lambda x: -x[1]['count']):
        sample_refs = '; '.join(info['refs'][:5])
        w.writerow([val, info['count'], sample_refs, '请提供正确的港口代码（如GBFXT）以便系统匹配'])
print(f"✅ unmapped_pod.csv — {len(unmapped_pod)} 个未匹配 POD 值")

# ══════════════════════════════════════════════════════════════
# 2. 箱型（Container Type）数据库缺失
# ══════════════════════════════════════════════════════════════
cur.execute("SELECT container_code FROM container_types")
db_containers = set(r[0].upper() for r in cur.fetchall())

SMART_QUOTE_MAP = str.maketrans({'\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"',
                                  '\u2032': "'", '\uff07': "'", '\u02bc': "'"})

CONTAINER_NORMALIZE = {
    "20'GP": '20GP', "20GP": '20GP', "20'FT": '20GP', "20FT": '20GP',
    "20'DC": '20GP', "20'DV": '20GP', "20;GP": '20GP', "20'": '20GP',
    "40'GP": '40GP', "40GP": '40GP', "40'FT": '40GP', "40FT": '40GP',
    "40'HQ": '40HQ', "40HQ": '40HQ', "40'HC": '40HQ', "40HC": '40HQ',
    "40'HQ REEFER": '40RF', "40'HQ Reefer".upper(): '40RF',
    "45'HQ": '45HQ', "45HQ": '45HQ', "45'HC": '45HQ', "45*HQ": '45HQ',
    "45'": '45HQ',
    "20'OT": '20OT', "20OT": '20OT', "20 FT OPEN TOP": '20OT',
    "20' OPEN TOP": '20OT', "20' OT": '20OT',
    "40'OT": '40OT', "40OT": '40OT', "40' OT": '40OT',
    "20'FR": '20FR', "20FR": '20FR', "20'FR OOG": '20FR', "20OOG": '20FR',
    "40'FR": '40FR', "40FR": '40FR', "40'FR (OOG)": '40FR', "40'FR OOG": '40FR',
    "40 FLAT RACK": '40FR', "40' FR (OW": '40FR',
    "20'RF": '20RF', "20RF": '20RF', "20'REEFER": '20RF', "20 REEFER": '20RF',
    "40'RF": '40RF', "40RF": '40RF', "40'RF (OOG)": '40RF',
    "40 REEFER": '40RF', "40 REFFER": '40RF', "40'REFFER": '40RF',
    "20'NOR": '20NOR', "20NOR": '20NOR',
    "40'NOR": '40NOR', "40NOR": '40NOR',
    "20' ISO TANK": '20TANK', "20'ISO TANK": '20TANK', "20'TANK": '20TANK',
    "20FT ISO TANK": '20TANK', "20TANK": '20TANK', "20'FLEXITANK": '20TANK',
    "40'FT SOC TANK": '40TANK', "40'TANK": '40TANK', "40TANK": '40TANK',
    "40FT EMPTY (NEW) ISOTANKS": '40TANK', "ITANK": '40TANK',
    "BULK CONTAINER": 'BULK', "BREAKBULK": 'BBK', "BBK SHIPEMENT": 'BBK',
    "BBK": 'BBK', "1 BREAKBULK": 'BBK',
    "20'HC": '20GP', "20'": '20GP',
    "40' HC": '40HQ', "40''HQ": '40HQ', "40' HQ": '40HQ',
    "40-FOOT CONTAINER": '40GP',
    "40'JQ": '40HQ',
    "40' FAT OOG": '40FR', "40'OOG": '40FR', "40OOG": '40FR', "20'OOG": '20FR',
    "40'OT (IG)": '40OT',
    "HQ": '40HQ',
    "45'": '45HQ',
    "FT": '20GP',
    "45'HQ": '45HQ',
}

CONTAINER_RE = re.compile(r"20|40|45|GP|HQ|HC|OT|FR|RF|NOR|TANK|REEFER|FLAT|RACK|BULK|BBK|BREAK|FLEXI", re.I)

def normalize_container(raw: str) -> str:
    s = raw.strip().translate(SMART_QUOTE_MAP)
    up = s.upper()
    if up in CONTAINER_NORMALIZE:
        return CONTAINER_NORMALIZE[up]
    return None

# 收集所有出现在 CSV 中的箱型原始值及其对应标准 code
cntr_raw_data = defaultdict(lambda: {'norm_code': None, 'refs': [], 'count': 0})

for row_num, row in rows:
    ref     = row[2].strip()
    qty_raw = row[13].strip().translate(SMART_QUOTE_MAP)
    unit_raw = row[14].strip().translate(SMART_QUOTE_MAP)

    # 互换检测
    if unit_raw and re.match(r'^\d[\d,\.]*$', unit_raw.replace(',', '')):
        if CONTAINER_RE.search(qty_raw):
            qty_raw, unit_raw = unit_raw, qty_raw

    if not CONTAINER_RE.search(unit_raw):
        continue

    # 拆分多柜型
    for tok in re.split(r'[/+&,x\*](?=\s*[\d\'\"2345])', unit_raw):
        tok = tok.strip()
        if not tok or not CONTAINER_RE.search(tok):
            continue
        code = normalize_container(tok)
        raw_key = tok
        if raw_key not in cntr_raw_data:
            cntr_raw_data[raw_key]['norm_code'] = code
        cntr_raw_data[raw_key]['refs'].append(ref)
        cntr_raw_data[raw_key]['count'] += 1

# 找出标准 code 不在 DB 中的
missing_containers = {}
for raw_val, info in cntr_raw_data.items():
    code = info['norm_code']
    if code is None:
        missing_containers[raw_val] = {'mapped_to': '无法识别', 'count': info['count'],
                                        'refs': info['refs']}
    elif code.upper() not in db_containers:
        missing_containers[raw_val] = {'mapped_to': code, 'count': info['count'],
                                        'refs': info['refs']}

with open('unmapped_container.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['CSV原始箱型值', '映射目标code', '数据库是否存在', '出现次数',
                '对应Reference Number（前5个）', '建议操作'])
    for val, info in sorted(missing_containers.items(), key=lambda x: -x[1]['count']):
        code = info['mapped_to']
        in_db = '✅ 存在' if code.upper() in db_containers else '❌ 缺失'
        sample = '; '.join(info['refs'][:5])
        action = '请确认是否需要在系统中新增此箱型' if code != '无法识别' else '请确认正确箱型代码'
        w.writerow([val, code, in_db, info['count'], sample, action])
print(f"✅ unmapped_container.csv — {len(missing_containers)} 个问题箱型值")

# ══════════════════════════════════════════════════════════════
# 3. Sales PIC 缺失
# ══════════════════════════════════════════════════════════════
cur.execute("SELECT id, name, sales_country_code FROM dict_sales_pic ORDER BY name")
db_pics_rows = cur.fetchall()
db_pic_name_map = {}  # name.upper() -> (id, original_name, country_code)
for pid, pname, pcountry in db_pics_rows:
    db_pic_name_map[pname.strip().upper()] = (pid, pname, pcountry)

# 从 CSV 收集所有 PIC + 关联信息
csv_pic_data = defaultdict(lambda: {'offices': set(), 'countries': set(),
                                     'refs': [], 'count': 0})
for row_num, row in rows:
    ref     = row[2].strip()
    pic_raw = row[8].strip()
    office  = row[7].strip()
    country = row[6].strip()
    if not pic_raw or pic_raw in ('-', 'TBA', ''):
        continue
    key = pic_raw.upper()
    csv_pic_data[key]['refs'].append(ref)
    csv_pic_data[key]['count'] += 1
    if office: csv_pic_data[key]['offices'].add(office)
    if country: csv_pic_data[key]['countries'].add(country)
    # 保存原始大小写（取首次出现值）
    if 'original' not in csv_pic_data[key]:
        csv_pic_data[key]['original'] = pic_raw

# 找出 DB 中不存在的
def fuzzy_name_match(csv_key, db_map):
    """多策略模糊匹配：空格标准化 → 去标点 → 词集合相似度"""
    # 策略1：标准化空格（去掉多余空格、零宽字符）
    cleaned = re.sub(r'[\u200b\u200c\u200d\ufeff]', '', csv_key)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    if cleaned in db_map: return db_map[cleaned][1], '空格/不可见字符差异'

    # 策略2：去掉所有标点和特殊字符后匹配
    no_punct = re.sub(r'[^A-Z0-9 ]', ' ', cleaned)
    no_punct = re.sub(r'\s+', ' ', no_punct).strip()
    if no_punct in db_map: return db_map[no_punct][1], '标点差异'
    for db_key, db_val in db_map.items():
        db_no_punct = re.sub(r'[^A-Z0-9 ]', ' ', db_key)
        db_no_punct = re.sub(r'\s+', ' ', db_no_punct).strip()
        if no_punct == db_no_punct: return db_val[1], '标点差异'

    # 策略3：词集合相似度（≥0.8 认为是同一人）
    words_a = set(re.findall(r'[A-Z]+', cleaned))
    best_score, best_match = 0.0, None
    for db_key, db_val in db_map.items():
        words_b = set(re.findall(r'[A-Z]+', db_key))
        if not words_a or not words_b: continue
        score = len(words_a & words_b) / max(len(words_a), len(words_b))
        if score > best_score:
            best_score, best_match = score, db_val[1]
    if best_score >= 0.8: return best_match, f'姓名相似({int(best_score*100)}%)'

    return None, ''

missing_pics = {}
for key, info in csv_pic_data.items():
    if key not in db_pic_name_map:
        fuzzy, reason = fuzzy_name_match(key, db_pic_name_map)
        missing_pics[key] = {
            'original': info.get('original', key),
            'count': info['count'],
            'offices': ', '.join(sorted(info['offices'])[:3]),
            'countries': ', '.join(sorted(info['countries'])),
            'refs': info['refs'],
            'fuzzy_match': fuzzy or '',
            'fuzzy_reason': reason,
        }

with open('unmapped_sales_pic.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['CSV原始姓名', '出现次数', '所属Country', '所属Sales Office（前3个）',
                '系统可能匹配（模糊）', '匹配原因', '对应Reference Number（前5个）', '建议操作'])
    for key, info in sorted(missing_pics.items(), key=lambda x: -x[1]['count']):
        sample = '; '.join(info['refs'][:5])
        fuzzy = info['fuzzy_match']
        reason = info['fuzzy_reason']
        if fuzzy:
            action = f'疑似与"{fuzzy}"为同一人（{reason}），请业务团队确认'
        else:
            action = '系统中未找到此联系人，请确认是否需要新增'
        w.writerow([info['original'], info['count'], info['countries'],
                    info['offices'], fuzzy, reason, sample, action])
print(f"✅ unmapped_sales_pic.csv — {len(missing_pics)} 个缺失 Sales PIC")

# ══════════════════════════════════════════════════════════════
# 4. Sales Office 缺失
# ══════════════════════════════════════════════════════════════
cur.execute("SELECT id, name, sales_country_code FROM dict_sales_office ORDER BY name")
db_offices_rows = cur.fetchall()
db_office_name_map = {}  # name.upper() -> (id, original_name, country_code)
for oid, oname, ocountry in db_offices_rows:
    db_office_name_map[oname.strip().upper()] = (oid, oname, ocountry)

csv_office_data = defaultdict(lambda: {'countries': set(), 'pics': set(),
                                        'refs': [], 'count': 0})
for row_num, row in rows:
    ref     = row[2].strip()
    office  = row[7].strip()
    country = row[6].strip()
    pic     = row[8].strip()
    if not office or office in ('-', 'TBA', ''):
        continue
    key = office.upper()
    csv_office_data[key]['refs'].append(ref)
    csv_office_data[key]['count'] += 1
    if country: csv_office_data[key]['countries'].add(country)
    if pic:     csv_office_data[key]['pics'].add(pic)
    if 'original' not in csv_office_data[key]:
        csv_office_data[key]['original'] = office

def fuzzy_office_match(csv_key, db_map):
    """多策略模糊匹配 Office 名称"""
    # 策略1：去零宽字符 + 标准化空格
    cleaned = re.sub(r'[\u200b\u200c\u200d\ufeff]', '', csv_key).strip()
    cleaned = re.sub(r'\s+', ' ', cleaned)
    if cleaned in db_map: return db_map[cleaned][1], '不可见字符/空格差异'

    # 策略2：去括号
    bracket_removed = re.sub(r'\s*\(.*?\)', '', cleaned).strip()
    if bracket_removed in db_map: return db_map[bracket_removed][1], '括号差异'

    # 策略3：去所有空格后比较（CAPE TOWN vs CAPETOWN）
    no_space_csv = re.sub(r'\s', '', cleaned)
    for db_key, db_val in db_map.items():
        if re.sub(r'\s', '', db_key) == no_space_csv:
            return db_val[1], '空格差异（如CAPE TOWN vs CAPETOWN）'

    # 策略4：编辑距离 ≤2（检测单字母拼写错误）
    def edit_distance(s1, s2):
        if abs(len(s1)-len(s2)) > 3: return 99
        m, n = len(s1), len(s2)
        dp = list(range(n+1))
        for i in range(1, m+1):
            prev, dp[0] = dp[0], i
            for j in range(1, n+1):
                prev, dp[j] = dp[j], prev if s1[i-1]==s2[j-1] else min(prev, dp[j], dp[j-1])+1
        return dp[n]
    best_dist, best_match = 99, None
    for db_key, db_val in db_map.items():
        d = edit_distance(cleaned, db_key)
        if d < best_dist:
            best_dist, best_match = d, db_val[1]
    if best_dist <= 2: return best_match, f'拼写相近(编辑距离={best_dist})'

    return None, ''

missing_offices = {}
for key, info in csv_office_data.items():
    if key not in db_office_name_map:
        fuzzy, reason = fuzzy_office_match(key, db_office_name_map)
        missing_offices[key] = {
            'original': info.get('original', key),
            'count': info['count'],
            'countries': ', '.join(sorted(info['countries'])),
            'sample_pics': ', '.join(list(info['pics'])[:3]),
            'refs': info['refs'],
            'fuzzy_match': fuzzy or '',
            'fuzzy_reason': reason,
        }

with open('unmapped_sales_office.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['CSV原始办公室名称', '出现次数', '所属Country', '相关Sales PIC示例（前3个）',
                '系统可能匹配（模糊）', '匹配原因', '对应Reference Number（前5个）', '建议操作'])
    for key, info in sorted(missing_offices.items(), key=lambda x: -x[1]['count']):
        sample = '; '.join(info['refs'][:5])
        fuzzy = info['fuzzy_match']
        reason = info['fuzzy_reason']
        if info['original'].upper() in ('(PLS UPDATE SALES COUNTRY+ PIC COLUMN)', 'TBA'):
            action = '脏数据或待填写，建议整行跳过'
        elif fuzzy:
            action = f'疑似与"{fuzzy}"为同一公司（{reason}），请确认是否合并'
        else:
            action = '系统中未找到此公司，请确认是否需要新增'
        w.writerow([info['original'], info['count'], info['countries'],
                    info['sample_pics'], fuzzy, reason, sample, action])
print(f"✅ unmapped_sales_office.csv — {len(missing_offices)} 个缺失 Sales Office")

conn.close()
print("\n所有文件已生成完毕，请在当前目录查看:")
print("  📄 unmapped_pol.csv")
print("  📄 unmapped_pod.csv")
print("  📄 unmapped_container.csv")
print("  📄 unmapped_sales_pic.csv")
print("  📄 unmapped_sales_office.csv")
