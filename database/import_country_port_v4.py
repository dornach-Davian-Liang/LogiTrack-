#!/usr/bin/env python3
"""
LogiTrack Pro — Country & Port 数据重导入脚本 (v4)
需求:
  1. 保留 country 表 id 1-15，删除其余，从 Country and Port.csv 导入新国家（去重）
  2. 清空 port 表，从 Country and Port.csv 重新导入 SEA + AIR 港口
     port_name 存储 Display name 列（前端 Route Information 直接使用）
"""

import csv
import os
import sys

try:
    import pymysql
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymysql"])
    import pymysql

# ─── DB config ───────────────────────────────────────────
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'ldf123',
    'database': 'logitrack',
    'charset': 'utf8mb4',
}

# ─── Country name → ISO 3166-1 alpha-2 mapping ──────────
# Built from SEA port_code first 2 chars + manual overrides
COUNTRY_CODE_MAP = {
    'ALBANIA': 'AL', 'ALGERIA': 'DZ', 'ANTIGUA': 'AG', 'ARGENTINA': 'AR',
    'AUSTRALIA': 'AU', 'AUSTRIA': 'AT', 'BAHAMAS': 'BS', 'BAHRAIN': 'BH',
    'BANGLADESH': 'BD', 'BARBADOS': 'BB', 'BELGIUM': 'BE', 'BENIN': 'BJ',
    'BOLIVIA': 'BO', 'BRAZIL': 'BR', 'BRUNEI': 'BN', 'BULGARIA': 'BG',
    'BURKINA FASO': 'BF', 'CAMBODIA': 'KH', 'CAMEROON': 'CM', 'CANADA': 'CA',
    'CHILE': 'CL', 'CHINA': 'CN', 'COLOMBIA': 'CO', 'CONGO': 'CD',
    'COSTA RICA': 'CR', "COTE D'IVOIRE": 'CI', "CÔTE D'IVOIRE": 'CI',
    'CROATIA': 'HR', 'CUBA': 'CU', 'CYPRUS': 'CY', 'CZECH REPUBLIC': 'CZ',
    'DENMARK': 'DK', 'DJIBOUTI': 'DJ', 'DOMINICAN': 'DO',
    'DOMINICAN REPUBLIC': 'DO', 'ECUADOR': 'EC', 'EGYPT': 'EG',
    'EL SALVADOR': 'SV', 'ESTONIA': 'EE', 'FIJI': 'FJ', 'FINLAND': 'FI',
    'FRANCE': 'FR', 'FRENCH GUIANA': 'GF', 'FRENCH POLYNESIA': 'PF',
    'GABON': 'GA', 'GEORGIA': 'GE', 'GERMANY': 'DE', 'GHANA': 'GH',
    'GREECE': 'GR', 'GRENADA': 'GD', 'GUADELOUPE': 'GP', 'GUINEA': 'GN',
    'GUYANA': 'GY', 'HAITI': 'HT', 'HONDURAS': 'HN', 'HONG KONG': 'HK',
    'HUNGARY': 'HU', 'INDIA': 'IN', 'INDONESIA': 'ID', 'IRAQ': 'IQ',
    'IRELAND': 'IE', 'ISRAEL': 'IL', 'ITALY': 'IT', 'JAPAN': 'JP',
    'JORDAN': 'JO', 'KAZAKHSTAN': 'KZ', 'KENYA': 'KE', 'KOREA': 'KR',
    'SOUTH KOREA': 'KR', 'KUWAIT': 'KW', 'KYRGYZSTAN': 'KG', 'LATVIA': 'LV',
    'LEBANON': 'LB', 'LIBERIA': 'LR', 'LIBYA': 'LY', 'LITHUANIA': 'LT',
    'MACAU': 'MO', 'MADAGASCAR': 'MG', 'MALAYSIA': 'MY', 'MALDIVES': 'MV',
    'MALTA': 'MT', 'MAURITIUS': 'MU', 'MAYOTTE': 'YT', 'MEXICO': 'MX',
    'MONGOLIA': 'MN', 'MOROCCO': 'MA', 'MOZAMBIQUE': 'MZ', 'NAMIBIA': 'NA',
    'NETHERLANDS': 'NL', 'NEW CALEDONIA': 'NC', 'NEW ZEALAND': 'NZ',
    'NIGERIA': 'NG', 'NORWAY': 'NO', 'OMAN': 'OM', 'PAKISTAN': 'PK',
    'PANAMA': 'PA', 'PAPUA NEW GUINEA': 'PG', 'PARAGUAY': 'PY', 'PERU': 'PE',
    'PHILIPPINES': 'PH', 'POLAND': 'PL', 'PORTUGAL': 'PT',
    'PUERTO RICO': 'PR', 'QATAR': 'QA', 'REUNION': 'RE', 'ROMANIA': 'RO',
    'RUSSIA': 'RU', 'SAUDI ARABIA': 'SA', 'SENEGAL': 'SN',
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
    'VENEZUELA': 'VE', 'VIETNAM': 'VN', 'KOSOVO': 'XK',
    'SAINT BARTHELEMY': 'BL',
    'SAINT VINCENT AND THE GRENADINES': 'VC',
    # Sales countries (already in id 1-15)
    'AGENTS': 'AG', 'OTHERS': 'OT', 'TBA': 'TB',
    'Z-BELGIUM': 'BE', 'Z-CHINA': 'CN', 'Z-GERMANY': 'DE',
    'Z-GREECE': 'GR', 'Z-MOROCCO': 'MA', 'Z-NETHERLANDS': 'NL',
    'Z-POLAND': 'PL', 'Z-SOUTH AFRICA': 'ZA', 'Z-SWITZERLAND': 'CH',
    'Z-UK': 'GB', 'Z-USA': 'US',
}


def get_country_code(country_name: str) -> str:
    """Resolve country name to ISO alpha-2 code"""
    key = country_name.strip().upper()
    if key in COUNTRY_CODE_MAP:
        return COUNTRY_CODE_MAP[key]
    # Fallback: try first match substring
    for k, v in COUNTRY_CODE_MAP.items():
        if k in key or key in k:
            return v
    return 'XX'  # unknown


def parse_csv(csv_path: str):
    """Parse Country and Port.csv (tab-separated) → sea_ports, air_ports, all_countries.
    Tries multiple delimiters and encodings."""
    sea_ports = []
    air_ports = []
    all_countries = set()

    # Try reading the file with different approaches
    rows = []
    for enc in ('utf-8-sig', 'utf-8', 'latin-1', 'cp1252'):
        try:
            with open(csv_path, 'r', encoding=enc) as f:
                content = f.read()
            if len(content) < 10:
                print(f"  WARNING: File is empty or too small ({len(content)} bytes)")
                break
            # Auto-detect delimiter
            first_line = content.split('\n')[0]
            if '\t' in first_line:
                delim = '\t'
            elif ',' in first_line:
                delim = ','
            else:
                delim = '\t'
            reader = csv.reader(content.splitlines(), delimiter=delim)
            rows = list(reader)
            if len(rows) > 2:
                break
        except Exception as e:
            continue

    if len(rows) < 3:
        print(f"  ERROR: Could not parse CSV or file is empty. Rows found: {len(rows)}")
        return sea_ports, air_ports, all_countries

    # Skip header rows (row 0 = "SEA port code / AIR port code", row 1 = column headers)
    for row in rows[2:]:
        # SEA part: columns 0-3
        sea_country = (row[0] if len(row) > 0 else '').strip()
        sea_port_name = (row[1] if len(row) > 1 else '').strip()
        sea_display = (row[2] if len(row) > 2 else '').strip()
        sea_code = (row[3] if len(row) > 3 else '').strip()

        if sea_country and sea_code and sea_display:
            all_countries.add(sea_country)
            sea_ports.append({
                'country': sea_country,
                'city': sea_port_name,
                'display_name': sea_display,
                'port_code': sea_code.strip(),
                'port_type': 'SEA',
            })

        # AIR part: columns 5-8 (column 4 is empty separator)
        air_country = (row[5] if len(row) > 5 else '').strip()
        air_port_name = (row[6] if len(row) > 6 else '').strip()
        air_display = (row[7] if len(row) > 7 else '').strip()
        air_code = (row[8] if len(row) > 8 else '').strip()

        if air_country and air_code and air_display:
            all_countries.add(air_country)
            air_ports.append({
                'country': air_country,
                'city': air_port_name,
                'display_name': air_display,
                'port_code': air_code.strip(),
                'port_type': 'AIR',
            })

    return sea_ports, air_ports, all_countries


def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(project_root, 'Country and Port.csv')

    if not os.path.exists(csv_path):
        print(f"ERROR: CSV not found: {csv_path}")
        sys.exit(1)

    print("=" * 60)
    print("LogiTrack Pro — Country & Port 数据重导入 (v4)")
    print("=" * 60)

    # 1. Parse CSV
    print("\n[1/5] 解析 Country and Port.csv ...")
    sea_ports, air_ports, all_countries = parse_csv(csv_path)
    print(f"  SEA ports: {len(sea_ports)}")
    print(f"  AIR ports: {len(air_ports)}")
    print(f"  Unique countries in CSV: {len(all_countries)}")

    # 2. Connect DB
    print("\n[2/5] 连接数据库 ...")
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        # 3. Clean country table (keep id 1-15)
        print("\n[3/5] 清理 country 表 (保留 id 1-15) ...")
        cursor.execute("SELECT COUNT(*) FROM country WHERE id > 15")
        extra_count = cursor.fetchone()[0]
        print(f"  将删除 {extra_count} 条 id>15 的记录")

        # Get existing country names (id 1-15) for dedup
        cursor.execute("SELECT country_code, UPPER(country_name_en) FROM country WHERE id <= 15")
        existing_codes = set()
        existing_names = set()
        for code, name in cursor.fetchall():
            existing_codes.add(code.upper())
            existing_names.add(name)

        print(f"  保留的 id<=15 国家: {len(existing_codes)} 个")

        # Disable FK checks for cleanup
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        cursor.execute("DELETE FROM country WHERE id > 15")
        deleted = cursor.rowcount
        print(f"  已删除: {deleted} 条")

        # Import new countries from CSV (skip duplicates with id 1-15)
        inserted_countries = 0
        skipped_countries = []
        for country_name in sorted(all_countries):
            cc = get_country_code(country_name)
            name_upper = country_name.strip().upper()

            # Skip if country_code or name already in id 1-15
            if cc.upper() in existing_codes or name_upper in existing_names:
                skipped_countries.append(f"{country_name} ({cc})")
                continue

            try:
                cursor.execute(
                    "INSERT INTO country (country_code, country_name_en, is_active) VALUES (%s, %s, 1)",
                    (cc, country_name.strip())
                )
                inserted_countries += 1
                existing_codes.add(cc.upper())
                existing_names.add(name_upper)
            except pymysql.err.IntegrityError:
                # duplicate country_code
                skipped_countries.append(f"{country_name} ({cc}) [dup code]")

        print(f"  新增国家: {inserted_countries} 个")
        if skipped_countries:
            print(f"  跳过(已存在): {len(skipped_countries)} 个")

        # 4. Clean and reimport port table
        print("\n[4/5] 清空 port 表并重新导入 ...")
        cursor.execute("DELETE FROM port")
        deleted_ports = cursor.rowcount
        print(f"  已删除旧 port: {deleted_ports} 条")

        # Build country_name → (country_id, country_code) lookup (from DB after insert)
        cursor.execute("SELECT id, country_code, country_name_en FROM country WHERE is_active = 1")
        country_id_lookup = {}    # name_upper → id
        country_code_lookup = {}  # name_upper → country_code
        code_to_id = {}           # country_code_upper → id
        for cid, cc, cn in cursor.fetchall():
            country_id_lookup[cn.strip().upper()] = cid
            country_code_lookup[cn.strip().upper()] = cc
            code_to_id[cc.strip().upper()] = cid

        def resolve_country_id(country_name: str):
            """Resolve country name to (country_id, country_code)"""
            name_upper = country_name.strip().upper()
            if name_upper in country_id_lookup:
                return country_id_lookup[name_upper], country_code_lookup[name_upper]
            # Fallback: try to match by code
            cc = get_country_code(country_name)
            cid = code_to_id.get(cc.upper())
            return cid, cc

        # Import ports — port_code is UNIQUE in DB (not composite with port_type)
        all_ports = sea_ports + air_ports
        inserted_ports = 0
        skipped_ports = 0
        seen_port_codes = set()

        for p in all_ports:
            port_code = p['port_code'].strip()
            port_type = p['port_type']
            display_name = p['display_name']
            city = p['city']
            country_name = p['country'].strip()

            # Resolve country_id and country_code
            cid, cc = resolve_country_id(country_name)

            # Dedup by port_code (UNIQUE in DB, not composite with port_type)
            key = port_code.upper()
            if key in seen_port_codes:
                skipped_ports += 1
                continue
            seen_port_codes.add(key)

            try:
                cursor.execute(
                    """INSERT INTO port (port_code, port_name, port_type, country_id, country_code, city, is_active)
                       VALUES (%s, %s, %s, %s, %s, %s, 1)""",
                    (port_code, display_name, port_type, cid, cc, city)
                )
                inserted_ports += 1
            except pymysql.err.IntegrityError as e:
                skipped_ports += 1
                print(f"  WARN: 跳过重复 port {port_code}/{port_type}: {e}")

        print(f"  新增 port: {inserted_ports} 条 (跳过重复: {skipped_ports})")

        # Re-enable FK checks
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

        # 5. Verify
        print("\n[5/5] 验证 ...")
        cursor.execute("SELECT COUNT(*) FROM country")
        total_countries = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM port WHERE port_type='SEA'")
        sea_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM port WHERE port_type='AIR'")
        air_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM port")
        total_ports = cursor.fetchone()[0]

        print(f"  country 表总计: {total_countries} 条")
        print(f"  port 表总计: {total_ports} 条 (SEA={sea_count}, AIR={air_count})")

        # Sample check
        cursor.execute("SELECT port_code, port_name, port_type FROM port ORDER BY id LIMIT 5")
        print("\n  前5条 port 样本:")
        for row in cursor.fetchall():
            print(f"    {row[0]} | {row[1]} | {row[2]}")

        conn.commit()
        print("\n✅ 全部完成！数据已提交。")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    main()
