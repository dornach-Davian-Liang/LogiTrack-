#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LogiTrack Pro - 国家/销售办公室/销售联系人数据修复脚本
1. 修复 country 表:
   - id=1 AG 名称改为 AGENTS
   - 将 id 32-224 的非标准数据映射到正确 ISO 记录
   - 更新 enquiry.pod_country_id 引用
   - 删除非标准重复记录
   - 补充物流相关标准国家
2. 补全 dict_sales_office (from List.csv)
3. 补全 sales_pic (from List.csv)
"""

import os
import csv
import pymysql
import re

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'ldf123',
    'database': 'logitrack',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor,
    'autocommit': False
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIST_CSV = os.path.join(BASE_DIR, 'database', 'List.csv')

# 非标准代码 → 正确 ISO Alpha-2 映射
# None 表示城市名或无效，映射到其他
JUNK_TO_ISO = {
    'PA': 'PA',   # Panama
    'UK': 'GB',   # UNITED KINGDOM（已有id=7 GB）
    'HO': 'HK',   # HONG KONG
    'AU': 'AU',   # Australia
    'CA': 'CA',   # Canada
    'SO': 'SO',   # Somalia
    'FR1': 'FR',  # FRANCE/UK → France
    'EQ': 'EG',   # EQYPT（拼写错误）
    'ES': 'ES',   # Spain
    'BA': 'BA',   # Bosnia and Herzegovina
    'BE1': 'BE',  # BELGIUM/FRANCE → Belgium
    'AL': 'AL',   # Albania
    'CA1': 'CA',  # CANADA（重复）
    'SW': 'SE',   # SWEDEN（SW不是ISO，应为SE）
    'QA': 'QA',   # Qatar
    'ME': 'MX',   # MEXICO（ME不是ISO，应为MX）
    'UA': 'UA',   # Ukraine
    'VI': 'VI',   # Virgin Islands, U.S.
    'TA': 'TW',   # TAIWAN（TW）
    'HU': 'HU',   # Hungary
    'MA1': 'MU',  # MAURITIUS（MU）
    'IT': 'IT',   # Italy
    'TA1': 'TW',  # TAIWAN/CHINA → Taiwan
    'US1': 'US',  # USA/UK → USA
    'TU': 'TR',   # TURKEY（TR）
    'UR': 'UY',   # URUGUAY（UY）
    'TU1': 'TN',  # TUNISIA（TN）
    'IN': 'IN',   # India
    'SA': 'SA',   # Saudi Arabia
    'BR': 'BR',   # Brazil
    'MA2': 'PH',  # MANILA → Philippines（PH）
    'PH': 'PH',   # Philippines
    'CO': 'CO',   # Colombia
    'IR': 'IR',   # Iran
    'PA1': 'PG',  # PAPUA NEW GUINEA（PG）
    'UK1': 'GB',  # UK/UAE → GB
    'UA1': 'AE',  # UAE/UK → AE（UAE）
    'SE': 'SE',   # Sweden
    'SP': 'ES',   # SPAIN（ES）
    'UK2': 'GB',  # UK/BELGIUM → GB
    'BE2': 'BE',  # BELGIUM/USA → BE
    'BE3': 'BE',  # BELGIUM/USA/UK → BE
    'BA1': 'BH',  # BAHRAIN（BH）
    'RE': 'RE',   # Reunion
    'AR': 'AR',   # Argentina
    'JA': 'JP',   # JAPAN（JP）
    'BE4': 'BE',  # BELGIUM/NETHERLANDS → BE
    'BU': 'BG',   # BULGARIA（BG）
    'CO1': 'CO',  # COLOMBIA（重复）
    '-': None,    # 无效
    'US2': 'US',  # USA/CANADA → US
    'IN1': 'ID',  # INDONESIA（ID）
    'EG': 'EG',   # Egypt
    'UG': 'UG',   # Uganda
    'UZ': 'UZ',   # Uzbekistan
    'KA': 'KZ',   # KAZAKHSTAN（KZ）
    'DE1': 'DK',  # DENMARK（DK）
    'CU': 'CU',   # Cuba
    'SC': 'SC',   # Seychelles
    'BE5': 'BE',  # BELGIUM/NETHERLANDS/USA/CANADA → BE
    'BE6': 'BE',  # BELGIUM/USA/CANADA → BE
    'GU': 'GU',   # Guam
    'IS': 'IS',   # Iceland
    'FR2': 'GF',  # FRENCH GUIANA（GF）
    'BE7': 'BJ',  # BENIN（BJ）
    'CA2': 'CA',  # CANADA/AUSTRALIA/... → CA
    'EG1': 'EG',  # EGYPT（重复）
    'TO': 'TO',   # Tonga
    'MA3': 'MY',  # MALAYSIA（MY）
    'PO': 'PT',   # PORTUGAL（PT）
    'CZ': 'CZ',   # Czech Republic
    'GE': 'GE',   # Georgia
    'GE1': 'GE',  # GEORGIA（重复）
    'KE': 'KE',   # Kenya
    'OM': 'OM',   # Oman
    'CH1': 'CL',  # CHILE（CL）
    'ZA1': 'ZM',  # ZAMBIA（ZM）
    'CA3': 'KH',  # CAMBODIA（KH）
    'RO': 'RO',   # Romania
    'CO2': 'CG',  # CONGO（CG）
    'EC': 'EC',   # Ecuador
    'NE': 'NE',   # Niger
    'DE2': 'DK',  # DENMARK/NETHERLANDS/UK → DK
    'BE8': 'BE',  # BEGLIUM/USA（拼写错误）→ BE
    'LI': 'LI',   # Liechtenstein
    'FI': 'FI',   # Finland
    'TA2': 'TZ',  # TANZANIA（TZ）
    'US3': 'US',  # USA/CHILE → US
    'NI': 'NI',   # Nicaragua
    'SA1': 'VC',  # SAINT VINCENT AND THE GRENADINES（VC）
    'MA4': 'MV',  # MALDIVES（MV）
    'DJ': 'DJ',   # Djibouti
    'NE1': 'NL',  # NETHERLANDS/UK → NL
    'JO': 'JO',   # Jordan
    'TH': 'TH',   # Thailand
    'BE9': 'BE',  # BELGIUM/UK → BE
    'GU1': 'GN',  # GUINEA（GN）
    'AR1': 'AR',  # ARGENTINA/HONDURAS → AR
    'SO1': 'ZA',  # SOUTH AFRICA/MOZAMBIQUE → ZA
    'MA5': 'MG',  # MADAGASCAR（MG）
    'SI': 'SI',   # Slovenia
    'MO': 'MO',   # Macau
    'CY': 'CY',   # Cyprus
    'GH': 'GH',   # Ghana
    'MA6': 'MT',  # MALTA（MT）
    'BE10': 'BE', # BELGIUM/... → BE
    'RU': 'RU',   # Russia
    'LI1': 'LY',  # LIBYA（LY）
    'GU2': 'GY',  # GUYANA（GY）
    'KO': 'KR',   # KOREA（KR）
    'UR1': 'UY',  # URUGUAY/PARAGUAY → UY
    'AL1': 'AL',  # ALBANIA（重复）
    'TR': 'TR',   # Turkey
    'SA2': 'BL',  # SAINT BARTHELEMY（BL）
    'MO1': 'MZ',  # MOZAMBIQUE（MZ）
    'KO1': 'KR',  # KOREA/JAPAN → KR
    'NE2': 'NL',  # NETHERLANDS/BELGIUM → NL
    'GA': 'GA',   # Gabon
    'BA2': 'BB',  # BARBADOS（BB）
    'MO2': 'MN',  # MONGOLIA（MN）
    'NO': 'NO',   # Norway
    'FR3': 'FR',  # FRANCE/CÔTE D'IVOIRE/GUADELOUPE → FR
    'IS1': 'IL',  # ISRAEL/JAPAN → IL
    'VE': 'VE',   # Venezuela
    'SA3': 'SA',  # SAUDI ARABIA/UAE → SA
    'SI1': 'SL',  # SIERRA LEONE（SL）
    'SE1': 'RS',  # SERBIA（RS）
    'RW': 'RW',   # Rwanda
    'SO2': 'SO',  # SOMALIA（重复）
    'MY': 'MY',   # Malaysia
    'PU': 'PR',   # PUERTO RICO（PR）
    'BU1': 'BG',  # BULGARIA/GREECE → BG
    'PA2': 'PA',  # PANAMA（重复）
    'GE2': 'GE',  # GEORGIA/CAROLINA → GE
    'BR1': 'BN',  # BRUNEI（BN）
    'DU': 'AE',   # DUBAI → AE
    'DO': 'DO',   # Dominican Republic
    'AN': 'CW',   # Netherlands Antilles → Curacao (CW, 现代代码)
    'AU1': 'AT',  # AUSTRIA（AT）
    'RO1': 'RO',  # ROMANIA/CZECH REPUBLIC → RO
    'SL': 'SL',   # Sierra Leone
    'HU1': 'HU',  # HUNGARY/SLOVAKIA → HU
    'GE3': 'DE',  # GERMANY/BELGIUM → DE
    'LI2': 'LT',  # LITHUANIA（LT）
    'GU3': 'GP',  # GUADELOUPE（GP）
    'GR1': 'GD',  # GRENADA（GD）
    'SR': 'SR',   # Suriname
    'DE3': 'TZ',  # DEMOCRATIC/TANZANIA → TZ
    'DE4': 'CD',  # DEMOCRATIC REPUBLIC OF THE CONGO（CD）
    'FR4': 'FR',  # FRANCE/BELGIUM → FR
    'UK3': 'GB',  # UK/NETHERLANDS → GB
    'FR5': 'FR',  # FRANCE/BELGIUM/NETHERLANDS → FR
    'NA': 'NA',   # Namibia
    'BU2': 'BF',  # BURKINA FASO（BF）
    'CA4': 'TN',  # CAPITAL OF TUNISIA → TN
    'BE11': 'BE', # BELGIUM/NETHERLANDS/GERMANY → BE
    'BO': 'BO',   # Bolivia
    'LA': 'LA',   # Lao PDR
    'SL1': 'SI',  # SLOVENIA → SI
    'MA7': 'YT',  # MAYOTTE（YT）
    'UK4': 'GB',  # UK/ITALY → GB
    'BA3': 'BS',  # BAHAMA（BS）
    'FI1': 'FJ',  # FIJI（FJ）
    'SE2': 'SC',  # SEYCHELLES → SC
    'UK5': 'GB',  # UK/FRANCE → GB
    'FR6': 'PF',  # FRENCH POLYNESIA（PF）
    'PE': 'PE',   # Peru
    'EL': 'SV',   # EL SALVADOR（SV）
    'LI3': 'LY',  # LIBYAN ARAB JAMAHIRIYA → LY
    'HO1': 'HN',  # HONDURAS（HN）
    'HA': 'HT',   # HAITI（HT）
    'LE': 'LB',   # LEBANON（LB）
    'IR1': 'IQ',  # IRAQ（IQ）
    'SO3': 'KR',  # SOUTH KOREA → KR
    'CA5': 'CM',  # CAMEROON（CM）
    'LA1': 'NG',  # LAGOS → Nigeria（NG）
    'ZI': 'ZW',   # ZIMBABWE（ZW）
    'NE3': 'NL',  # NETHERLANDS/FRANCE → NL
    'KU': 'KW',   # KUWAIT（KW）
    'BR2': 'BR',  # BRAZIL/PARAGUAY → BR
    'CR': 'CR',   # Costa Rica
    'IV': 'CI',   # IVORY COAST（CI）
    'SU': 'SR',   # SURINAME → SR
    'JE': 'AE',   # JEBEL ALI → AE
    'JA1': 'ID',  # JAKARTA → ID
    'CO3': 'CR',  # COSTA RICA → CR
    'JA2': 'JP',  # JAPAN/MUMBAI/THAILAND → JP
    'GE4': 'DE',  # GERMANY/NETHERLANDS/POLAND → DE
    'UK6': 'GB',  # UK/DE/NL → GB
    'EG2': 'EG',  # EGYPT/SOUTH AFRICA → EG
    'IN2': 'ID',  # INDONESIAN → ID
    'UN': 'AE',   # UNITED ARAB EMIRATES → AE
    'BE12': 'BE', # Belgium（拼写错误 Belgiium）
}

# 物流常用国家完整列表（ISO 标准，超出已有id 1-15 的补充）
LOGISTICS_COUNTRIES = [
    # 欧洲
    ('AD', 'Andorra', 0), ('AL', 'Albania', 0), ('AT', 'Austria', 0),
    ('BA', 'Bosnia and Herzegovina', 0), ('BG', 'Bulgaria', 0),
    ('BY', 'Belarus', 0), ('CY', 'Cyprus', 0), ('CZ', 'Czech Republic', 0),
    ('DK', 'Denmark', 0), ('EE', 'Estonia', 0), ('ES', 'Spain', 1),
    ('FI', 'Finland', 0), ('GA', 'Gabon', 0), ('GD', 'Grenada', 0),
    ('HR', 'Croatia', 0), ('HU', 'Hungary', 0), ('IE', 'Ireland', 0),
    ('IL', 'Israel', 1), ('IS', 'Iceland', 0), ('IT', 'Italy', 1),
    ('LI', 'Liechtenstein', 0), ('LT', 'Lithuania', 0), ('LU', 'Luxembourg', 0),
    ('LV', 'Latvia', 0), ('MC', 'Monaco', 0), ('MD', 'Moldova', 0),
    ('ME', 'Montenegro', 0), ('MK', 'North Macedonia', 0), ('MT', 'Malta', 0),
    ('NO', 'Norway', 0), ('PT', 'Portugal', 0), ('RO', 'Romania', 0),
    ('RS', 'Serbia', 0), ('RU', 'Russia', 0), ('SE', 'Sweden', 0),
    ('SI', 'Slovenia', 0), ('SK', 'Slovakia', 0), ('TR', 'Turkey', 0),
    ('UA', 'Ukraine', 0), ('XK', 'Kosovo', 0),
    # 亚太
    ('AE', 'United Arab Emirates', 0), ('AF', 'Afghanistan', 0),
    ('AU', 'Australia', 0), ('BD', 'Bangladesh', 0), ('BH', 'Bahrain', 0),
    ('BN', 'Brunei', 0), ('BT', 'Bhutan', 0), ('CA', 'Canada', 0),
    ('CL', 'Chile', 0), ('CN_HK', None, 0),  # placeholder skipped
    ('HK', 'Hong Kong SAR', 0), ('ID', 'Indonesia', 0), ('IN', 'India', 0),
    ('IQ', 'Iraq', 0), ('IR', 'Iran', 0), ('JO', 'Jordan', 0),
    ('JP', 'Japan', 0), ('KH', 'Cambodia', 0), ('KP', 'North Korea', 0),
    ('KR', 'South Korea', 0), ('KW', 'Kuwait', 0), ('KZ', 'Kazakhstan', 0),
    ('LA', 'Laos', 0), ('LB', 'Lebanon', 0), ('LK', 'Sri Lanka', 0),
    ('MM', 'Myanmar', 0), ('MN', 'Mongolia', 0), ('MO', 'Macau SAR', 0),
    ('MV', 'Maldives', 0), ('MY', 'Malaysia', 0), ('NP', 'Nepal', 0),
    ('NZ', 'New Zealand', 0), ('OM', 'Oman', 0), ('PH', 'Philippines', 0),
    ('PK', 'Pakistan', 0), ('PS', 'Palestine', 0), ('QA', 'Qatar', 0),
    ('SA', 'Saudi Arabia', 0), ('SG', 'Singapore', 0), ('SY', 'Syria', 0),
    ('TH', 'Thailand', 0), ('TJ', 'Tajikistan', 0), ('TL', 'Timor-Leste', 0),
    ('TM', 'Turkmenistan', 0), ('TW', 'Taiwan', 0), ('UZ', 'Uzbekistan', 0),
    ('VN', 'Vietnam', 0), ('YE', 'Yemen', 0),
    # 非洲
    ('AO', 'Angola', 0), ('BF', 'Burkina Faso', 0), ('BJ', 'Benin', 0),
    ('BW', 'Botswana', 0), ('CD', 'DR Congo', 0), ('CF', 'Central African Republic', 0),
    ('CG', 'Republic of Congo', 0), ('CI', "Ivory Coast", 0),
    ('CM', 'Cameroon', 0), ('CV', 'Cape Verde', 0), ('DJ', 'Djibouti', 0),
    ('DZ', 'Algeria', 0), ('EG', 'Egypt', 0), ('ER', 'Eritrea', 0),
    ('ET', 'Ethiopia', 0), ('GA', 'Gabon', 0), ('GH', 'Ghana', 0),
    ('GN', 'Guinea', 0), ('GW', 'Guinea-Bissau', 0), ('GQ', 'Equatorial Guinea', 0),
    ('KE', 'Kenya', 0), ('LR', 'Liberia', 0), ('LS', 'Lesotho', 0),
    ('LY', 'Libya', 0), ('MG', 'Madagascar', 0), ('ML', 'Mali', 0),
    ('MR', 'Mauritania', 0), ('MU', 'Mauritius', 0), ('MW', 'Malawi', 0),
    ('MZ', 'Mozambique', 0), ('NA', 'Namibia', 0), ('NE', 'Niger', 0),
    ('NG', 'Nigeria', 0), ('RW', 'Rwanda', 0), ('SC', 'Seychelles', 0),
    ('SD', 'Sudan', 0), ('SL', 'Sierra Leone', 0), ('SN', 'Senegal', 0),
    ('SO', 'Somalia', 0), ('SS', 'South Sudan', 0), ('SZ', 'Eswatini', 0),
    ('TD', 'Chad', 0), ('TG', 'Togo', 0), ('TN', 'Tunisia', 0),
    ('TZ', 'Tanzania', 0), ('UG', 'Uganda', 0), ('YT', 'Mayotte', 0),
    ('ZM', 'Zambia', 0), ('ZW', 'Zimbabwe', 0),
    # 美洲
    ('AR', 'Argentina', 0), ('BB', 'Barbados', 0), ('BL', 'Saint Barthelemy', 0),
    ('BN', 'Brunei', 0), ('BO', 'Bolivia', 0), ('BR', 'Brazil', 0),
    ('BS', 'Bahamas', 0), ('BZ', 'Belize', 0), ('CO', 'Colombia', 0),
    ('CR', 'Costa Rica', 0), ('CU', 'Cuba', 0), ('DO', 'Dominican Republic', 0),
    ('EC', 'Ecuador', 0), ('GD', 'Grenada', 0), ('GP', 'Guadeloupe', 0),
    ('GT', 'Guatemala', 0), ('GY', 'Guyana', 0), ('HN', 'Honduras', 0),
    ('HT', 'Haiti', 0), ('JM', 'Jamaica', 0), ('KN', 'Saint Kitts and Nevis', 0),
    ('MQ', 'Martinique', 0), ('MX', 'Mexico', 0), ('NI', 'Nicaragua', 0),
    ('PA', 'Panama', 0), ('PE', 'Peru', 0), ('PR', 'Puerto Rico', 0),
    ('PY', 'Paraguay', 0), ('SR', 'Suriname', 0), ('SV', 'El Salvador', 0),
    ('TT', 'Trinidad and Tobago', 0), ('TW', 'Taiwan', 0),
    ('UY', 'Uruguay', 0), ('VC', 'Saint Vincent and the Grenadines', 0),
    ('VE', 'Venezuela', 0), ('VG', 'British Virgin Islands', 0),
    ('VI', 'US Virgin Islands', 0),
    # 其他（物流常用）
    ('CW', 'Curacao', 0), ('FJ', 'Fiji', 0), ('GF', 'French Guiana', 0),
    ('GU', 'Guam', 0), ('MN', 'Mongolia', 0), ('NC', 'New Caledonia', 0),
    ('PF', 'French Polynesia', 0), ('PG', 'Papua New Guinea', 0),
    ('PM', 'Saint Pierre and Miquelon', 0), ('RE', 'Reunion', 0),
    ('SB', 'Solomon Islands', 0), ('TO', 'Tonga', 0), ('VU', 'Vanuatu', 0),
    ('WS', 'Samoa', 0),
]


def connect():
    conn = pymysql.connect(**DB_CONFIG)
    print(f"✅ 已连接到数据库: {DB_CONFIG['database']}")
    return conn


def fix_id1_ag(cursor):
    """修复 id=1 AG: Antigua and Barbuda → AGENTS"""
    cursor.execute(
        "UPDATE country SET country_name_en='AGENTS', country_name_cn='代理商', is_core=0 WHERE id=1 AND country_code='AG'"
    )
    print(f"  ✅ id=1 AG 名称修正为 AGENTS（影响 {cursor.rowcount} 行）")


def build_iso_id_map(cursor):
    """构建 iso_code → country_id 映射（包含 id 1-15 和 225+）"""
    cursor.execute("SELECT id, country_code FROM country WHERE id <= 15 OR id >= 225")
    rows = cursor.fetchall()
    iso_map = {}
    for r in rows:
        iso_map[r['country_code'].strip().upper()] = r['id']
    return iso_map


def migrate_enquiry_references(cursor, junk_id, target_id):
    """将 enquiry.pod_country_id 和 port.country_id 从 junk_id 改到 target_id"""
    if target_id is None:
        target_id = 11  # OT = OTHERS
    cursor.execute(
        "UPDATE enquiry SET pod_country_id=%s WHERE pod_country_id=%s",
        (target_id, junk_id)
    )
    enq_count = cursor.rowcount
    cursor.execute(
        "UPDATE port SET country_id=%s WHERE country_id=%s",
        (target_id, junk_id)
    )
    port_count = cursor.rowcount
    return enq_count, port_count


def process_junk_countries(cursor, iso_map):
    """处理 id 32-224 的非标准国家，更新 enquiry 引用后删除"""
    cursor.execute("SELECT id, country_code, country_name_en FROM country WHERE id BETWEEN 32 AND 224 ORDER BY id")
    junk_countries = cursor.fetchall()
    
    migrated_total = 0
    deleted = 0
    skipped = 0

    for c in junk_countries:
        junk_id = c['id']
        junk_code = c['country_code'].strip()
        
        # 查找映射目标 ISO 代码
        target_iso = JUNK_TO_ISO.get(junk_code)
        
        if target_iso is None:
            # 无效/城市名 → 映射到 OTHERS
            target_id = 11  # OT = OTHERS
        else:
            # 先查 id 1-15 和 225+
            target_id = iso_map.get(target_iso.upper())
            if target_id is None:
                # 目标 ISO 国家还不在数据库，暂时映射到 OTHERS
                target_id = 11

        # 更新 enquiry 和 port 引用
        enq_n, port_n = migrate_enquiry_references(cursor, junk_id, target_id)
        if enq_n > 0 or port_n > 0:
            print(f"    → {junk_code}(id={junk_id}) → {target_iso or 'OT'}(id={target_id}): enquiry×{enq_n} port×{port_n}")
            migrated_total += enq_n

        # 删除此非标准记录
        cursor.execute("DELETE FROM country WHERE id=%s", (junk_id,))
        deleted += 1

    print(f"  ✅ 已迁移 {migrated_total} 条 enquiry 引用，删除 {deleted} 个非标准国家记录")
    return deleted


def add_logistics_countries(cursor, iso_map):
    """补充物流常用标准国家（INSERT IGNORE）"""
    added = 0
    skipped_codes = set()
    seen_codes = set(iso_map.keys())  # 已有的代码

    for (code, name_en, is_core) in LOGISTICS_COUNTRIES:
        if code == 'CN_HK':  # 跳过占位符
            continue
        if code.upper() in seen_codes:
            skipped_codes.add(code)
            continue
        try:
            cursor.execute(
                """INSERT INTO country (country_code, country_name_en, is_core, is_active)
                   VALUES (%s, %s, %s, 1)
                   ON DUPLICATE KEY UPDATE country_name_en=VALUES(country_name_en), is_core=VALUES(is_core)""",
                (code, name_en, is_core)
            )
            if cursor.rowcount > 0:
                added += 1
                seen_codes.add(code.upper())
        except Exception as e:
            print(f"    ⚠️  {code}: {e}")

    print(f"  ✅ 新增/更新 {added} 个物流标准国家")
    return added


def complete_offices_and_pics(cursor):
    """从 List.csv 补全 dict_sales_office 和 sales_pic"""
    if not os.path.exists(LIST_CSV):
        print(f"  ❌ List.csv 未找到: {LIST_CSV}")
        return

    # 加载当前销售国家缓存
    cursor.execute("SELECT id, country_code FROM country")
    country_by_code = {}
    for r in cursor.fetchall():
        country_by_code[r['country_code'].strip().upper()] = r['id']

    # 销售国家名称 → country_code 映射
    SALES_COUNTRY_MAP = {
        'AGENTS': 'AG', 'BELGIUM': 'BE', 'CHINA': 'CN', 'FRANCE': 'FR',
        'GERMANY': 'DE', 'GREECE': 'GR', 'MOROCCO': 'MA', 'NETHERLANDS': 'NL',
        'OTHERS': 'OT', 'POLAND': 'PL', 'SOUTH AFRICA': 'ZA',
        'SWITZERLAND': 'CH', 'TBA': 'TB', 'UNITED KINGDOM': 'GB', 'USA': 'US',
        'UK': 'GB',
    }

    # 加载现有 office 缓存
    cursor.execute("SELECT id, UPPER(TRIM(name)) AS name_norm FROM dict_sales_office")
    existing_offices = {r['name_norm']: r['id'] for r in cursor.fetchall()}

    # 加载现有 pic 缓存（name + office_id 复合）
    cursor.execute("SELECT id, UPPER(TRIM(name)) AS name_norm, sales_office_id FROM sales_pic")
    existing_pics = {(r['name_norm'], r['sales_office_id']) for r in cursor.fetchall()}

    offices_added = 0
    pics_added = 0
    errors = []

    with open(LIST_CSV, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f, delimiter='\t')
        next(reader)  # skip header
        for row in reader:
            if len(row) < 3:
                continue
            sales_country = row[0].strip()
            office_name = row[1].strip()
            pic_name = row[2].strip()
            
            if not office_name or office_name == 'SALESOFFICE':
                continue
            
            country_code = SALES_COUNTRY_MAP.get(sales_country.upper(), 'OT')
            country_id = country_by_code.get(country_code, 11)  # fallback to OTHERS

            # 确保 office 存在
            office_name_norm = office_name.upper().strip()
            if office_name_norm not in existing_offices:
                try:
                    cursor.execute(
                        """INSERT INTO dict_sales_office (name, name_norm, is_active, sort_order, code, country_code)
                           VALUES (%s, %s, 1, 0, %s, %s)""",
                        (office_name, office_name_norm, '', country_code)
                    )
                    office_id = cursor.lastrowid
                    existing_offices[office_name_norm] = office_id
                    offices_added += 1
                except Exception as e:
                    errors.append(f"office [{office_name}]: {e}")
                    continue
            
            office_id = existing_offices[office_name_norm]

            # 确保 PIC 存在
            if pic_name:
                pic_norm = pic_name.upper().strip()
                key = (pic_norm, office_id)
                if key not in existing_pics:
                    try:
                        # 先检查同名 pic 是否已有（name+office_id 唯一）
                        cursor.execute(
                            """INSERT IGNORE INTO sales_pic (name, name_norm, country_code, sales_office_id, is_active)
                               VALUES (%s, %s, %s, %s, 1)""",
                            (pic_name, pic_norm, country_code, office_id)
                        )
                        if cursor.rowcount > 0:
                            existing_pics.add(key)
                            pics_added += 1
                    except Exception as e:
                        errors.append(f"pic [{pic_name} @ {office_name}]: {e}")

    if errors:
        print(f"  ⚠️  {len(errors)} 个错误（显示前10条）:")
        for e in errors[:10]:
            print(f"     {e}")

    print(f"  ✅ 新增 {offices_added} 个销售办公室，{pics_added} 个销售联系人")


def verify(cursor):
    """输出验证统计"""
    cursor.execute("SELECT COUNT(*) AS n FROM country WHERE id <= 15")
    c_core = cursor.fetchone()['n']
    cursor.execute("SELECT COUNT(*) AS n FROM country WHERE id > 15")
    c_extra = cursor.fetchone()['n']
    cursor.execute("SELECT COUNT(*) AS n FROM country WHERE id BETWEEN 32 AND 224")
    c_junk = cursor.fetchone()['n']
    cursor.execute("SELECT COUNT(*) AS n FROM dict_sales_office")
    offices = cursor.fetchone()['n']
    cursor.execute("SELECT COUNT(*) AS n FROM sales_pic")
    pics = cursor.fetchone()['n']
    cursor.execute("SELECT COUNT(*) AS n FROM enquiry WHERE pod_country_id BETWEEN 32 AND 224")
    bad_refs = cursor.fetchone()['n']

    print("\n═══════════════════════════════════════════")
    print("📊 验证结果")
    print("═══════════════════════════════════════════")
    print(f"  country id 1-15:    {c_core} 条（应为 15）")
    print(f"  country id 32-224 残留: {c_junk} 条（应为 0）")
    print(f"  country 标准 ISO:   {c_extra} 条（物流常用国家）")
    print(f"  dict_sales_office:  {offices} 条")
    print(f"  sales_pic:          {pics} 条")
    print(f"  enquiry 非标准引用:  {bad_refs} 条（应为 0）")


def main():
    print("═══════════════════════════════════════════")
    print("  LogiTrack - 国家/Office/PIC 数据修复")
    print("═══════════════════════════════════════════")

    conn = connect()
    cursor = conn.cursor()

    try:
        # 1. 修复 id=1 AG 名称
        print("\n▶ Step 1: 修复 id=1 AG 为 AGENTS")
        fix_id1_ag(cursor)

        # 2. 构建 ISO id 映射
        iso_map = build_iso_id_map(cursor)
        print(f"\n▶ Step 2: 加载 ISO 国家映射（{len(iso_map)} 个）")

        # 3. 处理非标准国家，迁移 enquiry 引用
        print("\n▶ Step 3: 迁移 enquiry.pod_country_id 并删除非标准国家记录")
        process_junk_countries(cursor, iso_map)

        # 重新刷新映射（删除后）
        iso_map = build_iso_id_map(cursor)

        # 4. 补充物流标准国家
        print("\n▶ Step 4: 补充物流常用标准国家")
        add_logistics_countries(cursor, iso_map)

        conn.commit()
        print("  ✅ country 表修复已提交")

        # 5. 补全 office 和 PIC
        print("\n▶ Step 5: 从 List.csv 补全 dict_sales_office 和 sales_pic")
        complete_offices_and_pics(cursor)
        conn.commit()
        print("  ✅ office/PIC 数据已提交")

        # 6. 输出验证
        verify(cursor)

    except Exception as e:
        conn.rollback()
        print(f"\n❌ 发生错误，已回滚: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        cursor.close()
        conn.close()
        print("\n✅ 数据库连接已关闭")


if __name__ == '__main__':
    main()
