#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LogiTrack Pro — Phase 0: 迁移环境准备
功能:
  1. 导入新端口 (Country and Port new.csv)
  2. 添加 CMP (China Main Port) 为 SEA+AIR 端口
  3. 补录 14 个缺失 port_code 的端口
  4. 补录缺失 container_types
  5. 修正 SHENZHEN CENTER 办公室名称
  6. 补录缺失 sales_office
  7. 补录 NA PIC + 其他缺失 sales_pic
  8. 补录缺失国家
"""

import csv
import os
import re
import sys

try:
    import pymysql
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymysql"])
    import pymysql

# ============================================================
# 配置
# ============================================================
DB_CONFIG = {
    'host': 'localhost', 'port': 3306,
    'user': 'root', 'password': 'ldf123',
    'database': 'logitrack', 'charset': 'utf8mb4',
}

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEW_PORT_CSV = os.path.join(PROJECT_ROOT, 'Country and Port new.csv')
DATA_DIR = r'C:\Users\Administrator\Desktop\data'

# ============================================================
# 国家名 → ISO alpha-2 映射
# ============================================================
COUNTRY_CODE_MAP = {
    'ALBANIA': 'AL', 'ALGERIA': 'DZ', 'ANTIGUA': 'AG', 'ARGENTINA': 'AR',
    'AUSTRALIA': 'AU', 'AUSTRIA': 'AT', 'BAHAMAS': 'BS', 'BAHRAIN': 'BH',
    'BANGLADESH': 'BD', 'BARBADOS': 'BB', 'BELGIUM': 'BE', 'BENIN': 'BJ',
    'BOLIVIA': 'BO', 'BRAZIL': 'BR', 'BRUNEI': 'BN', 'BULGARIA': 'BG',
    'BURKINA FASO': 'BF', 'CAMBODIA': 'KH', 'CAMEROON': 'CM', 'CANADA': 'CA',
    'CHILE': 'CL', 'CHINA': 'CN', 'COLOMBIA': 'CO', 'CONGO': 'CD',
    'COSTA RICA': 'CR', "COTE D'IVOIRE": 'CI', "CÔTE D'IVOIRE": 'CI',
    'CROATIA': 'HR', 'CUBA': 'CU', 'CYPRUS': 'CY',
    'CZECH REPUBLIC': 'CZ', 'CZECHIA': 'CZ',
    'DENMARK': 'DK', 'DJIBOUTI': 'DJ', 'DOMINICAN': 'DO',
    'DOMINICAN REPUBLIC': 'DO', 'ECUADOR': 'EC', 'EGYPT': 'EG',
    'EL SALVADOR': 'SV', 'ESTONIA': 'EE', 'FIJI': 'FJ', 'FINLAND': 'FI',
    'FRANCE': 'FR', 'FRENCH GUIANA': 'GF', 'FRENCH POLYNESIA': 'PF',
    'GABON': 'GA', 'GEORGIA': 'GE', 'GERMANY': 'DE', 'GHANA': 'GH',
    'GREECE': 'GR', 'GRENADA': 'GD', 'GUADELOUPE': 'GP', 'GUATEMALA': 'GT',
    'GUINEA': 'GN', 'GUYANA': 'GY', 'HAITI': 'HT', 'HONDURAS': 'HN',
    'HONG KONG': 'HK', 'HUNGARY': 'HU', 'INDIA': 'IN', 'INDONESIA': 'ID',
    'IRAQ': 'IQ', 'IRELAND': 'IE', 'ISRAEL': 'IL', 'ITALY': 'IT',
    'JAPAN': 'JP', 'JORDAN': 'JO', 'KAZAKHSTAN': 'KZ', 'KENYA': 'KE',
    'KOREA': 'KR', 'SOUTH KOREA': 'KR', 'KUWAIT': 'KW', 'KYRGYZSTAN': 'KG',
    'LATVIA': 'LV', 'LEBANON': 'LB', 'LIBERIA': 'LR', 'LIBYA': 'LY',
    'LITHUANIA': 'LT', 'MACAU': 'MO', 'MADAGASCAR': 'MG', 'MALAYSIA': 'MY',
    'MALDIVES': 'MV', 'MALTA': 'MT', 'MAURITIUS': 'MU', 'MAYOTTE': 'YT',
    'MEXICO': 'MX', 'MONGOLIA': 'MN', 'MOROCCO': 'MA', 'MOZAMBIQUE': 'MZ',
    'NAMIBIA': 'NA', 'NETHERLANDS': 'NL', 'NEW CALEDONIA': 'NC',
    'NEW ZEALAND': 'NZ', 'NIGERIA': 'NG', 'NORWAY': 'NO', 'OMAN': 'OM',
    'PAKISTAN': 'PK', 'PANAMA': 'PA', 'PAPUA NEW GUINEA': 'PG',
    'PARAGUAY': 'PY', 'PERU': 'PE', 'PHILIPPINES': 'PH', 'POLAND': 'PL',
    'PORTUGAL': 'PT', 'PUERTO RICO': 'PR', 'QATAR': 'QA', 'REUNION': 'RE',
    'ROMANIA': 'RO', 'RUSSIA': 'RU', 'SAUDI ARABIA': 'SA', 'SENEGAL': 'SN',
    'SEYCHELLES': 'SC', 'SIERRA LEONE': 'SL', 'SINGAPORE': 'SG',
    'SLOVAKIA': 'SK', 'SLOVENIA': 'SI', 'SOMALIA': 'SO',
    'SOUTH AFRICA': 'ZA', 'SOUTH SUDAN': 'SS', 'SPAIN': 'ES',
    'SRI LANKA': 'LK', 'SURINAME': 'SR', 'SWEDEN': 'SE',
    'SWITZERLAND': 'CH', 'TAIWAN': 'TW', 'TANZANIA': 'TZ',
    'THAILAND': 'TH', 'TOGO': 'TG',
    'TRINIDAD AND TOBAGO': 'TT', 'TUNISIA': 'TN', 'TURKEY': 'TR',
    'UK': 'GB', 'UNITED KINGDOM': 'GB',
    'UNITED ARAB EMIRATES': 'AE', 'UAE': 'AE',
    'UGANDA': 'UG', 'URUGUAY': 'UY',
    'USA': 'US', 'UNITED STATES': 'US',
    'VENEZUELA': 'VE', 'VIETNAM': 'VN', 'ZIMBABWE': 'ZW',
    'RWANDA': 'RW', 'KOSOVO': 'XK',
    'SAINT BARTHELEMY': 'BL',
    'SAINT VINCENT AND THE GRENADINES': 'VC',
    'SOLOMON ISLANDS': 'SB',
    # 新增
    'ALABAMA': 'US', 'MALAWI': 'MW', 'MAURITANIA': 'MR', 'MYANMAR': 'MM',
    'ANGOLA': 'AO', 'AZERBAIJAN': 'AZ',
    'TRINIDAD AND TOBAGO': 'TT',
    # Sales countries
    'AGENTS': 'AG', 'OTHERS': 'OT', 'TBA': 'TB',
}

# 14 个缺失 port_code 的端口 → 生成合成代码
SYNTHETIC_PORTS = [
    ('CA', 'Saskatchewan',       'Saskatchewan, Canada',            'CASKW', 'SEA'),
    ('CA', 'Stratford, ON',      'Stratford, ON, Canada',           'CASTF', 'SEA'),
    ('CN', 'Huanggang',          'Huanggang, Hubei, China',         'CNHGG', 'SEA'),
    ('CN', 'Jiujiang, Guangdong','Jiujiang, Guangdong, China',      'CNJJG', 'SEA'),
    ('CN', 'Jiujiang, Jiangxi',  'Jiujiang, Jiangxi, China',        'CNJJX', 'SEA'),
    ('CN', 'Nanping',            'Nanping, China',                   'CNNPG', 'SEA'),
    ('CN', 'Shangluo',           'Shangluo, China',                  'CNSLU', 'SEA'),
    ('CN', 'Yichun',             'Yichun,Jiangxi, China',            'CNYCH', 'SEA'),
    ('CN', 'Yuzhou',             'Yuzhou, China',                    'CNYZH', 'SEA'),
    ('HR', 'Jalzabet',           'Jalzabet, Croatia',                'HRJLZ', 'SEA'),
    ('FR', 'Nozay',              'Nozay, France',                    'FRNZY', 'SEA'),
    ('SE', 'Borlange',           'Borlange, Sweden',                 'SEBOR', 'SEA'),
    ('AE', 'Al Karama',          'Al Karama, United Arab Emirates',  'AEAKR', 'SEA'),
    ('US', 'Tracy, CA',          'Tracy, CA, USA',                   'USTCY', 'SEA'),
]


def get_country_code(name: str) -> str:
    key = name.strip().upper()
    if key in COUNTRY_CODE_MAP:
        return COUNTRY_CODE_MAP[key]
    for k, v in COUNTRY_CODE_MAP.items():
        if k in key or key in k:
            return v
    return 'XX'


def connect_db():
    return pymysql.connect(**DB_CONFIG)


# ============================================================
# Step 1: 导入新端口
# ============================================================
def step_01_import_ports(conn):
    """导入 Country and Port new.csv (SEA + AIR 两段)"""
    print('\n' + '='*60)
    print('Step 1: 导入新端口 (Country and Port new.csv)')
    print('='*60)

    cur = conn.cursor()

    # 读取文件
    with open(NEW_PORT_CSV, 'r', encoding='utf-8-sig') as f:
        lines = f.readlines()

    section = None  # 'SEA' or 'AIR'
    ports = []
    seen_codes = set()

    for i, line in enumerate(lines):
        raw = line.rstrip('\n').rstrip('\r')

        # 检测段落标题
        if 'SEA port code' in raw:
            section = 'SEA'
            continue
        if 'AIR port code' in raw:
            section = 'AIR'
            continue

        if section is None:
            continue

        # 跳过空行和表头
        stripped = raw.strip()
        if not stripped:
            continue
        if stripped.startswith('Country') and 'port name' in stripped:
            continue

        # 解析: Country / port_name / display_name / port_code
        parts = raw.split('/')
        if len(parts) < 4:
            continue

        country_name = parts[0].strip().rstrip('\t').strip()
        port_name = parts[1].strip().lstrip('\t').rstrip('\t').strip()
        display_name = parts[2].strip().lstrip('\t').rstrip('\t').strip()
        port_code = parts[3].strip().lstrip('\t').rstrip('\t').strip()

        # 跳过缺失 port_code
        if not port_code or port_code == '-':
            continue

        # 去除尾部空格
        port_code = port_code.strip()

        # 跳过重复 port_code
        if port_code.upper() in seen_codes:
            continue
        seen_codes.add(port_code.upper())

        country_code = get_country_code(country_name)
        # 从 display_name 提取 city (去掉最后的 ", Country" 部分)
        city = port_name  # 默认用 port_name 作为 city

        ports.append({
            'port_code': port_code,
            'port_name': display_name,  # 使用 display_name 作为 port_name（前端显示用）
            'port_type': section,
            'country_code': country_code,
            'city': city,
        })

    # 先确保所有国家存在
    ensure_countries(conn, ports)

    # UPSERT 端口
    inserted = 0
    updated = 0
    for p in ports:
        cur.execute('SELECT id FROM port WHERE port_code = %s', (p['port_code'],))
        existing = cur.fetchone()
        if existing:
            cur.execute('''UPDATE port SET port_name=%s, port_type=%s, country_code=%s, city=%s
                           WHERE port_code=%s''',
                        (p['port_name'], p['port_type'], p['country_code'], p['city'], p['port_code']))
            updated += 1
        else:
            cur.execute('''INSERT INTO port (port_code, port_name, port_type, country_code, city, is_active)
                           VALUES (%s, %s, %s, %s, %s, 1)''',
                        (p['port_code'], p['port_name'], p['port_type'], p['country_code'], p['city']))
            inserted += 1

    conn.commit()
    print(f'  ✅ 端口导入完成: 新增 {inserted}, 更新 {updated}, 总计 {len(ports)}')
    return ports


def ensure_countries(conn, ports):
    """确保所有端口涉及的国家存在于 country 表"""
    cur = conn.cursor()
    cur.execute('SELECT country_code FROM country')
    existing = {r[0] for r in cur.fetchall()}

    needed = set()
    for p in ports:
        cc = p['country_code']
        if cc and cc != 'XX' and cc not in existing:
            needed.add(cc)

    # 反向查找国家名
    code_to_name = {}
    for name, code in COUNTRY_CODE_MAP.items():
        if code not in code_to_name and not name.startswith('Z-'):
            code_to_name[code] = name.title()

    for cc in needed:
        name = code_to_name.get(cc, cc)
        cur.execute('INSERT IGNORE INTO country (country_code, country_name_en, is_active) VALUES (%s, %s, 1)', (cc, name))
        existing.add(cc)

    conn.commit()
    if needed:
        print(f'  ✅ 新增 {len(needed)} 个国家: {needed}')


# ============================================================
# Step 2: 添加 CMP (China Main Port) 为 SEA+AIR
# ============================================================
def step_02_add_cmp(conn):
    print('\n' + '='*60)
    print('Step 2: 添加 CMP (China Main Port) 端口')
    print('='*60)

    cur = conn.cursor()

    # port_code 有 UNIQUE 约束，CMP 只能存在一条记录（同时用于 SEA 和 AIR 匹配）
    cur.execute("SELECT id FROM port WHERE port_code = 'CMP'")
    if not cur.fetchone():
        cur.execute('''INSERT INTO port (port_code, port_name, port_type, country_code, city, is_active)
                       VALUES ('CMP', 'China Main Port, China', 'SEA', 'CN', 'China Main Port', 1)''')
        print('  ✅ 新增 CMP (China Main Port)')
    else:
        print('  ⏭️ CMP 已存在')

    conn.commit()


# ============================================================
# Step 3: 补录 14 个合成端口
# ============================================================
def step_03_synthetic_ports(conn):
    print('\n' + '='*60)
    print('Step 3: 补录 14 个缺失 port_code 的端口')
    print('='*60)

    cur = conn.cursor()
    added = 0
    for cc, city, display, code, ptype in SYNTHETIC_PORTS:
        cur.execute('SELECT id FROM port WHERE port_code = %s', (code,))
        if not cur.fetchone():
            cur.execute('''INSERT INTO port (port_code, port_name, port_type, country_code, city, is_active)
                           VALUES (%s, %s, %s, %s, %s, 1)''',
                        (code, display, ptype, cc, city))
            added += 1
            print(f'  ✅ 新增 {code}: {display}')
        else:
            print(f'  ⏭️ {code} 已存在')

    conn.commit()
    print(f'  总计新增 {added} 个合成端口')
    return added


# ============================================================
# Step 4: 补录缺失 container_types
# ============================================================
def step_04_container_types(conn):
    print('\n' + '='*60)
    print('Step 4: 补录缺失 container_types')
    print('='*60)

    cur = conn.cursor()
    needed = [
        ('40NOR', "40' Non-Operating Reefer",  2.0,  40, 1),
        ('20NOR', "20' Non-Operating Reefer",  1.0,  20, 1),
        ('BBK',   'Breakbulk',                 0.0,  None, 1),
        ('BULK',  'Bulk Container',            0.0,  None, 1),
        ('20TANK',"20' ISO Tank",              1.0,  20, 1),
        ('40TANK',"40' ISO Tank",              2.0,  40, 1),
        ('20FR',  "20' Flat Rack",             1.0,  20, 1),
        ('40FR',  "40' Flat Rack",             2.0,  40, 1),
        ('20GP',  "20' General Purpose",       1.0,  20, 0),
        ('40GP',  "40' General Purpose",       2.0,  40, 0),
    ]

    added = 0
    for code, name, teu, length, is_special in needed:
        cur.execute('SELECT id FROM container_types WHERE container_code = %s', (code,))
        if not cur.fetchone():
            cur.execute('''INSERT INTO container_types
                           (container_code, container_name, teu_value, length_feet, is_special, is_active)
                           VALUES (%s, %s, %s, %s, %s, 1)''',
                        (code, name, teu, length, is_special))
            added += 1
            print(f'  ✅ 新增 {code}: {name}')
        else:
            print(f'  ⏭️ {code} 已存在')

    conn.commit()
    print(f'  总计新增 {added} 个箱型')


# ============================================================
# Step 5: 修正 SHENZHEN CENTER 办公室名称
# ============================================================
def step_05_fix_shenzhen(conn):
    print('\n' + '='*60)
    print('Step 5: 修正 SHENZHEN CENTER 办公室名称')
    print('='*60)

    cur = conn.cursor()
    correct_name = "SHENZHEN CENTER INT'L LOGISTICS CO.,LTD"

    cur.execute("SELECT id, name FROM dict_sales_office WHERE name LIKE '%%SHENZHEN CENTER%%' AND id = 200")
    row = cur.fetchone()
    if row:
        old_name = row[1]
        if old_name != correct_name:
            cur.execute('UPDATE dict_sales_office SET name = %s WHERE id = %s', (correct_name, row[0]))
            conn.commit()
            print(f'  ✅ 修正: "{old_name}" → "{correct_name}"')
        else:
            print(f'  ⏭️ 名称已正确')
    else:
        print('  ⚠️ 未找到 SHENZHEN CENTER 办公室 (id=200)')


# ============================================================
# Step 6: 补录缺失 sales_office
# ============================================================
def step_06_sales_offices(conn):
    print('\n' + '='*60)
    print('Step 6: 补录缺失 sales_office')
    print('='*60)

    cur = conn.cursor()

    # 需要新增的办公室
    offices_to_add = [
        # (name, sales_country_code, is_active, remark)
        ('ZIEGLER FRANCE',    'BE', 0, 'Migration only - office no longer exists'),
        ('ZIEGLER XIAMEN',    'CN', 0, 'Migration only - office no longer exists'),
        ('LEX ULUSLARARASI',  'OT', 1, None),
    ]

    added = 0
    for name, sc_code, active, remark in offices_to_add:
        cur.execute('SELECT id FROM dict_sales_office WHERE UPPER(name) = %s', (name.upper(),))
        if not cur.fetchone():
            # 生成 code 和 name_norm
            code_base = re.sub(r'[^A-Z]', '', name.upper())[:10]
            cur.execute('SELECT MAX(id) FROM dict_sales_office')
            max_id = cur.fetchone()[0] or 0
            new_id = max_id + 1
            code = f'{code_base}_{new_id}'
            name_norm = f'{sc_code}:{name}'

            cur.execute('''INSERT INTO dict_sales_office
                           (name, code, name_norm, sales_country_code, is_active, remark)
                           VALUES (%s, %s, %s, %s, %s, %s)''',
                        (name, code, name_norm, sc_code, active, remark))
            added += 1
            print(f'  ✅ 新增办公室: {name} (is_active={active})')
        else:
            print(f'  ⏭️ {name} 已存在')

    conn.commit()
    print(f'  总计新增 {added} 个办公室')


# ============================================================
# Step 7: 补录缺失 sales_pic
# ============================================================
def step_07_sales_pic(conn):
    print('\n' + '='*60)
    print('Step 7: 补录缺失 sales_pic')
    print('='*60)

    cur = conn.cursor()

    # A. 创建 NA PIC (通用占位)
    cur.execute("SELECT id FROM dict_sales_pic WHERE name = 'NA'")
    na_row = cur.fetchone()
    if na_row:
        na_pic_id = na_row[0]
        print(f'  ⏭️ NA PIC 已存在 (id={na_pic_id})')
    else:
        # 获取 ZIEGLER FRANCE 的 office_id
        cur.execute("SELECT id FROM dict_sales_office WHERE UPPER(name) = 'ZIEGLER FRANCE'")
        zf_row = cur.fetchone()
        if not zf_row:
            print('  ⚠️ ZIEGLER FRANCE 办公室不存在，请先运行 Step 6')
            return

        zf_office_id = zf_row[0]
        # 确定 sales_country_code — ZIEGLER FRANCE 的大部分 PIC 属于 BE
        cur.execute('''INSERT INTO dict_sales_pic (name, sales_country_code, sales_office_id, is_active)
                       VALUES ('NA', 'BE', %s, 0)''', (zf_office_id,))
        na_pic_id = cur.lastrowid
        print(f'  ✅ 创建 NA PIC (id={na_pic_id}, office=ZIEGLER FRANCE)')

    # B. 读取 mapping 文件，添加名称修正的 PIC
    mapping_file = os.path.join(DATA_DIR, 'unmapped_sales_pic_20260414.csv')
    if not os.path.exists(mapping_file):
        print(f'  ⚠️ 未找到 {mapping_file}')
        conn.commit()
        return

    with open(mapping_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        pic_mappings = list(reader)

    # 按 mapping 值分类处理
    name_corrections = []  # (csv_name, correct_name, target_office_name)
    na_with_office = []    # (csv_name, target_office_name)

    for row in pic_mappings:
        csv_name = row.get('CSV原始姓名', '').strip()
        mapping = row.get('Map to sales pic', '').strip()
        if not csv_name or not mapping:
            continue

        mapping_upper = mapping.upper().strip()

        # 提取 "please correct sales office to ..." 部分
        office_override = None
        name_part = mapping
        m_office = re.search(r'please\s+correct\s+sales\s+office\s+to\s+["\']?([^"\']+)', mapping, re.IGNORECASE)
        if m_office:
            office_override = m_office.group(1).strip().upper()
            if office_override == 'ZIEGLER FRNACE':
                office_override = 'ZIEGLER FRANCE'
            # 名称部分是 "please" 之前的内容
            idx = mapping.lower().find('please')
            name_part = mapping[:idx].strip() if idx > 0 else mapping

        if mapping_upper == 'NA' or (mapping_upper.startswith('NA') and (len(mapping_upper) == 2 or mapping_upper[2] in (' ', ','))):
            if office_override:
                na_with_office.append((csv_name, office_override))
            # 纯 NA → 后续迁移直接用 NA PIC
        elif office_override:
            # 名称修正 + office 覆盖 (如 "PASCAL VAN DER SPEK  please correct...")
            correct_name = name_part.strip()
            if not correct_name or correct_name.upper() == 'NA':
                correct_name = csv_name  # 如果没提取到名称，保持原名
            name_corrections.append((csv_name, correct_name, office_override))
        else:
            # 纯名称修正 (如 "TIM SU")
            name_corrections.append((csv_name, mapping.strip(), None))

    # 添加名称修正的 PIC
    added = 0
    for csv_name, correct_name, target_office_name in name_corrections:
        # 检查 correct_name 是否已存在
        cur.execute('SELECT id FROM dict_sales_pic WHERE UPPER(name) = %s', (correct_name.upper(),))
        if cur.fetchone():
            print(f'  ⏭️ PIC {correct_name} 已存在')
            continue

        # 确定 office
        if target_office_name:
            # 从 mapping 指定的 office 名称查找
            cur.execute('SELECT id FROM dict_sales_office WHERE UPPER(name) = %s', (target_office_name.upper(),))
            row = cur.fetchone()
            if row:
                target_office_id = row[0]
            else:
                print(f'  ⚠️ 办公室 {target_office_name} 不存在, 跳过 {correct_name}')
                continue
        else:
            # 使用预定义映射
            target_office_id = _resolve_pic_office(cur, csv_name, correct_name)
            if target_office_id is None:
                print(f'  ⚠️ 无法确定 {correct_name} 的办公室，跳过')
                continue

        # 确定 sales_country_code
        sc_code = _get_office_country(cur, target_office_id)

        cur.execute('''INSERT INTO dict_sales_pic (name, sales_country_code, sales_office_id, is_active)
                       VALUES (%s, %s, %s, 1)''', (correct_name, sc_code, target_office_id))
        added += 1
        print(f'  ✅ 新增 PIC: {correct_name} (id={cur.lastrowid}, office={target_office_name or "预定义"})')

    conn.commit()
    print(f'  总计新增 {added} 个 PIC（不含 NA）')
    print(f'  NA + office 修正行: {len(na_with_office)} 条')

    return na_pic_id


# PIC 名称修正 → 目标 office 的预定义映射
_PIC_OFFICE_MAP = {
    'PASCAL VAN DER SPEK': 'ZIEGLER NETHERLANDS',
    'BIKIRAN BARUA BIKI': 'VAN LOGISTICS BGD',
    'MUHAMMAD NAEEM': 'PAKISTAN CARGO SERVICE',
    'ALESSANDRO BUFFA': 'UTC MEDITERRANEAN SRLU',
    'MUDASSAR BASHIR KAMBOH': 'QUALITY',
    'LIZZI ESPINAL ALVARENGA': 'REXCARGO',
    'TIM SU': "SHENZHEN CENTER INT'L LOGISTICS CO.,LTD",
    'SELINA': "SHENZHEN CENTER INT'L LOGISTICS CO.,LTD",
    'GERARD MULCAHY': 'WEST COAST AVIATION',
    'ELENA GHILOTTI': 'STARPOWER EUROPE AG',
    'SUSANA WONG': 'ZIEGLER HONG KONG',
    'SIMON KIBI': 'ZIEGLER JOHANNESBURG',
}


def _resolve_pic_office(cur, csv_name: str, correct_name: str):
    """获取 PIC 的目标 office_id"""
    target_name = _PIC_OFFICE_MAP.get(correct_name.upper(), _PIC_OFFICE_MAP.get(correct_name))
    if not target_name:
        # 尝试用 csv_name 查找
        for k, v in _PIC_OFFICE_MAP.items():
            if k.upper() == correct_name.upper():
                target_name = v
                break

    if not target_name:
        return None

    cur.execute('SELECT id FROM dict_sales_office WHERE UPPER(name) = %s', (target_name.upper(),))
    row = cur.fetchone()
    return row[0] if row else None


def _get_office_country(cur, office_id):
    """获取 office 的 sales_country_code"""
    cur.execute('SELECT sales_country_code FROM dict_sales_office WHERE id = %s', (office_id,))
    row = cur.fetchone()
    return row[0] if row else 'OT'


# ============================================================
# Step 8: 补录缺失国家
# ============================================================
def step_08_countries(conn):
    print('\n' + '='*60)
    print('Step 8: 确保所有必需国家存在')
    print('='*60)

    cur = conn.cursor()
    cur.execute('SELECT country_code FROM country')
    existing = {r[0] for r in cur.fetchall()}

    new_countries = {
        'MW': 'Malawi', 'MR': 'Mauritania', 'MM': 'Myanmar',
        'AO': 'Angola', 'AZ': 'Azerbaijan', 'XK': 'Kosovo',
        'SB': 'Solomon Islands', 'SS': 'South Sudan',
    }

    added = 0
    for cc, name in new_countries.items():
        if cc not in existing:
            cur.execute('INSERT IGNORE INTO country (country_code, country_name_en, is_active) VALUES (%s, %s, 1)',
                        (cc, name))
            added += 1
            print(f'  ✅ 新增国家: {cc} = {name}')

    conn.commit()
    if added == 0:
        print('  ⏭️ 所有国家已存在')
    else:
        print(f'  总计新增 {added} 个国家')


# ============================================================
# 汇总验证
# ============================================================
def verify(conn):
    print('\n' + '='*60)
    print('验证结果')
    print('='*60)

    cur = conn.cursor()

    cur.execute('SELECT COUNT(*) FROM port')
    print(f'  端口总数: {cur.fetchone()[0]}')

    cur.execute('SELECT port_type, COUNT(*) FROM port GROUP BY port_type')
    for r in cur.fetchall():
        print(f'    {r[0]}: {r[1]}')

    cur.execute('SELECT COUNT(*) FROM container_types')
    print(f'  箱型总数: {cur.fetchone()[0]}')

    cur.execute('SELECT COUNT(*) FROM dict_sales_office')
    print(f'  办公室总数: {cur.fetchone()[0]}')

    cur.execute('SELECT COUNT(*) FROM dict_sales_pic')
    print(f'  PIC 总数: {cur.fetchone()[0]}')

    cur.execute('SELECT COUNT(*) FROM country')
    print(f'  国家总数: {cur.fetchone()[0]}')

    # 检查 CMP
    cur.execute("SELECT id, port_code, port_type FROM port WHERE port_code = 'CMP'")
    cmp_rows = cur.fetchall()
    print(f'  CMP 端口: {cmp_rows}')

    # 检查 NA PIC
    cur.execute("SELECT id, name, sales_office_id FROM dict_sales_pic WHERE name = 'NA'")
    print(f'  NA PIC: {cur.fetchall()}')

    # 检查 ZIEGLER FRANCE
    cur.execute("SELECT id, name, is_active, remark FROM dict_sales_office WHERE UPPER(name) = 'ZIEGLER FRANCE'")
    print(f'  ZIEGLER FRANCE: {cur.fetchall()}')

    # 检查 SHENZHEN
    cur.execute("SELECT id, name FROM dict_sales_office WHERE name LIKE '%%SHENZHEN CENTER%%'")
    print(f'  SHENZHEN CENTER: {cur.fetchall()}')


# ============================================================
# Main
# ============================================================
def main():
    print('='*60)
    print('LogiTrack Pro — Phase 0: 迁移环境准备')
    print('='*60)

    conn = connect_db()
    try:
        step_08_countries(conn)         # 先添加国家
        step_01_import_ports(conn)      # 导入新端口
        step_02_add_cmp(conn)           # CMP
        step_03_synthetic_ports(conn)   # 14 个合成端口
        step_04_container_types(conn)   # 箱型
        step_05_fix_shenzhen(conn)      # SHENZHEN 修正
        step_06_sales_offices(conn)     # 办公室
        step_07_sales_pic(conn)         # PIC
        verify(conn)
    except Exception as e:
        conn.rollback()
        print(f'\n❌ 错误: {e}')
        import traceback
        traceback.print_exc()
        raise
    finally:
        conn.close()

    print('\n✅ Phase 0 完成!')


if __name__ == '__main__':
    main()
