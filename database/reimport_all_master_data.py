#!/usr/bin/env python3
"""
LogiTrack Pro - 全量主数据重导入脚本
1. 从 "Country and Port.csv" 导入 country + port 表 (保持enquiry FK映射)
2. 从 "Sales Contry+Office+salePic.csv" 导入 dict_sales_country + dict_sales_office + dict_sales_pic
"""

import sys, os, csv, re

try:
    import mysql.connector
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "mysql-connector-python"])
    import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'ldf123',
    'database': 'logitrack'
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)

COUNTRY_PORT_CSV = os.path.join(PROJECT_DIR, "Country and Port.csv")
SALES_CSV = os.path.join(PROJECT_DIR, "Sales Contry+Office+salePic.csv")


def get_conn():
    return mysql.connector.connect(**DB_CONFIG)


# ═══════════════════════════════════════════════════════════════════════════
# Part 1: Country + Port 导入
# ═══════════════════════════════════════════════════════════════════════════

def parse_country_port_csv():
    """解析 Country and Port.csv, 返回 (sea_ports, air_ports) 列表
    CSV格式: tab-separated, 20列
    SEA: [0]=Country [1]=/ [2]=port_name [3]=/ [4]=Display_name [5]=/ [6]=port_code [7-12]=空
    AIR: [13]=Country [14]=/ [15]=port_name [16]=/ [17]=Display_name [18]=/ [19]=port_code
    """
    sea_ports = []  # [(country, port_name, display_name, port_code), ...]
    air_ports = []
    
    with open(COUNTRY_PORT_CSV, 'r', encoding='utf-8-sig') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        if i < 2:  # 跳过header
            continue
        line = line.rstrip('\n').rstrip('\r')
        if not line.strip():
            continue

        parts = line.split('\t')
        
        # SEA port (indices 0,2,4,6)
        if len(parts) > 6:
            sea_country = parts[0].strip()
            sea_port_name = parts[2].strip()
            sea_display = parts[4].strip()
            sea_code = parts[6].strip()
            if sea_country and sea_port_name and sea_code:
                sea_ports.append((sea_country, sea_port_name, sea_display, sea_code))
        
        # AIR port (indices 13,15,17,19)
        if len(parts) >= 20:
            air_country = parts[13].strip()
            air_port_name = parts[15].strip()
            air_display = parts[17].strip()
            air_code = parts[19].strip()
            if air_country and air_port_name and air_code:
                air_ports.append((air_country, air_port_name, air_display, air_code))
    
    return sea_ports, air_ports


def import_country_port(conn):
    """导入country和port表"""
    cursor = conn.cursor()
    
    print("=" * 60)
    print("Part 1: 导入 Country + Port")
    print("=" * 60)
    
    sea_ports, air_ports = parse_country_port_csv()
    print(f"  CSV解析: {len(sea_ports)} SEA ports, {len(air_ports)} AIR ports")
    
    # Step 1: 记录旧port映射 (port_code -> old_id)
    cursor.execute("SELECT id, port_code FROM port")
    old_port_map = {row[1]: row[0] for row in cursor.fetchall()}
    print(f"  旧port记录: {len(old_port_map)}")
    
    # Step 2: 收集所有国家
    countries = set()
    for (country, _, _, _) in sea_ports:
        countries.add(country)
    for (country, _, _, _) in air_ports:
        countries.add(country)
    
    # 生成2字符country_code (从port_code前2位, 或手动映射)
    country_code_map = {}  # country_name -> country_code
    # 从SEA ports提取: port_code前2位通常是ISO country code
    for (country, _, _, port_code) in sea_ports:
        if len(port_code) >= 2 and country not in country_code_map:
            cc = port_code[:2].upper()
            country_code_map[country] = cc
    # 从AIR ports补充
    for (country, _, _, port_code) in air_ports:
        if country not in country_code_map:
            # AIR port codes是IATA 3字母, 不能直接用
            # 尝试从已有的SEA port映射
            pass
    
    # 手动补充没有sea port的国家
    manual_codes = {
        'Austria': 'AT', 'Bulgaria': 'BG', 'Burkina Faso': 'BF', 'Cambodia': 'KH',
        'Cameroon': 'CM', 'Congo': 'CD', 'Costa Rica': 'CR', 'Cyprus': 'CY',
        'Denmark': 'DK', 'Egypt': 'EG', 'El Salvador': 'SV', 'France': 'FR',
        'Gabon': 'GA', 'Germany': 'DE', 'Ghana': 'GH', 'Greece': 'GR',
        'India': 'IN', 'Indonesia': 'ID', 'Italy': 'IT', 'Japan': 'JP',
        'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Korea': 'KR', 'Kosovo': 'XK',
        'Kuwait': 'KW', 'Latvia': 'LV', 'Lebanon': 'LB', 'Libya': 'LY',
        'Macau': 'MO', 'Mexico': 'MX', 'Mongolia': 'MN', 'Morocco': 'MA',
        'Netherlands': 'NL', 'New Zealand': 'NZ', 'Nigeria': 'NG', 'Norway': 'NO',
        'Pakistan': 'PK', 'Panama': 'PA', 'Papua New Guinea': 'PG', 'Peru': 'PE',
        'Poland': 'PL', 'Portugal': 'PT', 'Qatar': 'QA', 'Reunion': 'RE',
        'Saudi Arabia': 'SA', 'Senegal': 'SN', 'Seychelles': 'SC', 'Slovenia': 'SI',
        'Somalia': 'SO', 'South Africa': 'ZA', 'South Sudan': 'SS', 'Spain': 'ES',
        'Sri Lanka': 'LK', 'Sweden': 'SE', 'Switzerland': 'CH', 'Taiwan': 'TW',
        'Tanzania': 'TZ', 'Thailand': 'TH', 'Togo': 'TG', 
        'Trinidad and Tobago': 'TT', 'Tunisia': 'TN', 'Turkey': 'TR',
        'Uganda': 'UG', 'UK': 'GB', 'USA': 'US',
        'United Arab Emirates': 'AE', 'Venezuela': 'VE', 'Vietnam': 'VN',
        'Belgium ': 'BE',  # trailing space variant
        "Côte D'Ivoire": 'CI',
    }
    for name, code in manual_codes.items():
        if name not in country_code_map:
            country_code_map[name] = code
    
    print(f"  国家总数: {len(countries)}, 已映射: {len(country_code_map)}")
    unmapped = [c for c in countries if c not in country_code_map]
    if unmapped:
        print(f"  !! 未映射国家: {unmapped}")
    
    # Step 3: 禁用FK检查, 清空表
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    cursor.execute("TRUNCATE TABLE port")
    cursor.execute("TRUNCATE TABLE country")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    print("  已清空 country + port 表")
    
    # Step 4: 插入country
    country_id_map = {}  # country_name -> new_id
    for idx, name in enumerate(sorted(countries), start=1):
        cc = country_code_map.get(name, 'XX')
        cursor.execute(
            "INSERT INTO country (country_code, country_name_en, is_active, is_core) VALUES (%s, %s, 1, 0)",
            (cc, name)
        )
        country_id_map[name] = cursor.lastrowid
    conn.commit()
    print(f"  已导入 {len(country_id_map)} 个国家")
    
    # Step 5: 插入port (SEA)
    new_port_map = {}  # port_code -> new_id
    port_count = 0
    seen_codes = set()
    
    for (country, port_name, display_name, port_code) in sea_ports:
        if port_code in seen_codes:
            continue  # 跳过重复port_code
        seen_codes.add(port_code)
        cc = country_code_map.get(country, 'XX')
        cid = country_id_map.get(country)
        cursor.execute(
            "INSERT INTO port (port_code, port_name, port_type, country_code, city, country_id, is_active) "
            "VALUES (%s, %s, 'SEA', %s, %s, %s, 1)",
            (port_code, display_name, cc, port_name, cid)
        )
        new_port_map[port_code] = cursor.lastrowid
        port_count += 1
    
    # Step 6: 插入port (AIR)
    air_count = 0
    for (country, port_name, display_name, port_code) in air_ports:
        if port_code in seen_codes:
            continue
        seen_codes.add(port_code)
        cc = country_code_map.get(country, 'XX')
        cid = country_id_map.get(country)
        cursor.execute(
            "INSERT INTO port (port_code, port_name, port_type, country_code, city, country_id, is_active) "
            "VALUES (%s, %s, 'AIR', %s, %s, %s, 1)",
            (port_code, display_name, cc, port_name, cid)
        )
        new_port_map[port_code] = cursor.lastrowid
        air_count += 1
    
    conn.commit()
    print(f"  已导入 {port_count} SEA ports + {air_count} AIR ports = {port_count + air_count} total")
    
    # Step 7: 更新enquiry中的port FK引用
    # 找出当前所有引用的port_id
    fk_tables = [
        ("enquiry_pol", "port_id"),
        ("enquiry_pod", "port_id"),
        ("offer_price_line", "pol_id"),
        ("offer_price_line", "pod_id"),
        ("enquiry_route_group_pol", "port_id"),
        ("enquiry_route_group_pod", "port_id"),
    ]
    
    remap_count = 0
    for table, col in fk_tables:
        # 获取所有旧port_id
        cursor.execute(f"SELECT DISTINCT {col} FROM {table}")
        old_ids = [row[0] for row in cursor.fetchall()]
        
        for old_id in old_ids:
            # 找到对应的port_code
            old_code = None
            for code, oid in old_port_map.items():
                if oid == old_id:
                    old_code = code
                    break
            
            if old_code and old_code in new_port_map:
                new_id = new_port_map[old_code]
                if new_id != old_id:
                    cursor.execute(f"UPDATE {table} SET {col} = %s WHERE {col} = %s", (new_id, old_id))
                    remap_count += cursor.rowcount
    
    conn.commit()
    print(f"  已重映射 {remap_count} 条 FK 引用")
    
    return new_port_map


# ═══════════════════════════════════════════════════════════════════════════
# Part 2: Sales Country + Office + Pic 导入
# ═══════════════════════════════════════════════════════════════════════════

def parse_sales_csv():
    """解析 Sales Contry+Office+salePic.csv"""
    records = []  # [(country, office, pic), ...]
    
    with open(SALES_CSV, 'r', encoding='utf-8-sig') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        if i == 0:  # 跳过header
            continue
        line = line.strip()
        if not line:
            continue
        
        # 格式: SALECOUNTRY\t,\tSALESOFFICE\t,\tSALESPIC
        # 用 "," 分隔（前后可能有tab/空格）
        parts = re.split(r'\s*,\s*', line)
        if len(parts) >= 3:
            country = parts[0].strip()
            office = parts[1].strip()
            pic = parts[2].strip()
            if country and office and pic:
                records.append((country, office, pic))
    
    return records


# dict_sales_country code 对应关系
SALES_COUNTRY_MAP = {
    'AGENTS': 'AG',
    'Z-BELGIUM': 'BE',
    'Z-CHINA': 'CN',
    'Z-GERMANY': 'DE',
    'Z-GREECE': 'GR',
    'Z-MOROCCO': 'MA',
    'Z-NETHERLANDS': 'NL',
    'Z-POLAND': 'PL',
    'Z-SOUTH AFRICA': 'ZA',
    'Z-SWITZERLAND': 'CH',
    'Z-UK': 'GB',
    'Z-USA': 'US',
    'OTHERS': 'OT',
    'TBA': 'TB',
}


def import_sales_data(conn):
    """导入 dict_sales_country, dict_sales_office, dict_sales_pic"""
    cursor = conn.cursor()
    
    print("\n" + "=" * 60)
    print("Part 2: 导入 Sales Country + Office + Pic")
    print("=" * 60)
    
    records = parse_sales_csv()
    print(f"  CSV解析: {len(records)} 条记录")
    
    # 统计
    countries_set = set()
    offices_set = set()  # (country, office)
    for country, office, pic in records:
        countries_set.add(country)
        offices_set.add((country, office))
    
    print(f"  国家: {len(countries_set)}, 办公室: {len(offices_set)}, 人员: {len(records)}")
    
    # Step 1: 记录旧映射 (用于更新enquiry FK)
    cursor.execute("SELECT id, code FROM dict_sales_office")
    old_office_map = {row[1]: row[0] for row in cursor.fetchall()}
    
    cursor.execute("SELECT id, name, sales_office_id FROM dict_sales_pic")
    old_pic_data = cursor.fetchall()
    
    # 同时保存旧 sales_pic 表数据
    cursor.execute("SELECT id, name, sales_office_id FROM sales_pic")
    old_spic_data = cursor.fetchall()
    
    # Step 2: 保存当前enquiry引用的office_id和pic_id映射
    cursor.execute("SELECT id, sales_office_id, sales_pic_id FROM enquiry WHERE sales_office_id IS NOT NULL")
    enquiry_refs = cursor.fetchall()
    
    # 构建旧office_id -> office_code 映射
    cursor.execute("SELECT id, code, name FROM dict_sales_office")
    old_office_id_to_code = {}
    old_office_id_to_name = {}
    for row in cursor.fetchall():
        old_office_id_to_code[row[0]] = row[1]
        old_office_id_to_name[row[0]] = row[2]
    
    # 构建旧pic_id -> (pic_name, office_id) 映射
    cursor.execute("SELECT id, name, sales_office_id FROM dict_sales_pic")
    old_pic_id_to_info = {}
    for row in cursor.fetchall():
        old_pic_id_to_info[row[0]] = (row[1], row[2])  # (name, office_id)
    
    # Step 3: 禁用FK检查, 清空sales表
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    cursor.execute("TRUNCATE TABLE dict_sales_pic")
    cursor.execute("TRUNCATE TABLE sales_pic")
    cursor.execute("TRUNCATE TABLE dict_sales_office")
    cursor.execute("TRUNCATE TABLE dict_sales_country")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    print("  已清空 dict_sales_country, dict_sales_office, dict_sales_pic, sales_pic 表")
    
    # Step 4: 插入 dict_sales_country
    sort_order = 1
    country_code_map = {}  # csv_country_name -> db_code
    
    for name in sorted(countries_set):
        code = SALES_COUNTRY_MAP.get(name)
        if not code:
            # 生成简短code
            code = name[:2].upper()
        country_code_map[name] = code
        
        # 对于 Z- 前缀的，显示名去掉 Z- 
        display_name = name
        if name.startswith('Z-'):
            display_name = name[2:]
        
        cursor.execute(
            "INSERT INTO dict_sales_country (code, name, sort_order, is_active) VALUES (%s, %s, %s, 1)",
            (code, display_name, sort_order)
        )
        sort_order += 1
    
    conn.commit()
    print(f"  已导入 {len(country_code_map)} 个销售国家")
    
    # Step 5: 插入 dict_sales_office
    office_id_map = {}  # (country, office_name) -> new_id
    office_name_to_id = {}  # office_name_norm -> new_id (用于enquiry remap)
    office_sort = 1
    
    for (country, office) in sorted(offices_set):
        cc = country_code_map.get(country, 'XX')
        # 生成唯一code: 前3字母of办公室名 + 序号
        code_base = re.sub(r'[^A-Za-z0-9]', '', office)[:10].upper()
        code = f"{code_base}_{office_sort}"
        # name_norm 包含 country code 确保跨国同名办公室不冲突
        name_norm = f"{cc}:{office.upper().strip()}"
        
        cursor.execute(
            "INSERT INTO dict_sales_office (code, name, name_norm, sales_country_code, country_code, is_active, sort_order) "
            "VALUES (%s, %s, %s, %s, %s, 1, %s)",
            (code, office, name_norm, cc, cc, office_sort)
        )
        new_id = cursor.lastrowid
        office_id_map[(country, office)] = new_id
        # 多种key方便enquiry remap
        office_name_to_id[f"{cc}:{office.upper().strip()}"] = new_id
        office_name_to_id[office.upper().strip()] = new_id  # 兜底: 按名称匹配
        office_sort += 1
    
    conn.commit()
    print(f"  已导入 {len(office_id_map)} 个办公室")
    
    # Step 6: 插入 dict_sales_pic + sales_pic
    pic_count = 0
    new_pic_name_to_id = {}  # (pic_name_norm, office_id) -> new_pic_id
    
    for (country, office, pic) in records:
        cc = country_code_map.get(country, 'XX')
        office_id = office_id_map.get((country, office))
        if not office_id:
            print(f"  !! 找不到办公室: {country} / {office}")
            continue
        
        # dict_sales_pic
        cursor.execute(
            "INSERT INTO dict_sales_pic (name, sales_country_code, sales_office_id, is_active) "
            "VALUES (%s, %s, %s, 1)",
            (pic, cc, office_id)
        )
        new_pic_id = cursor.lastrowid
        new_pic_name_to_id[(pic.upper().strip(), office_id)] = new_pic_id
        
        # sales_pic (同步) - name_norm 包含 office_id 确保跨办公室同名人员不冲突
        pic_name_norm = f"{office_id}:{pic.upper().strip()}"
        cursor.execute(
            "INSERT INTO sales_pic (name, name_norm, country_code, sales_office_id, is_active) "
            "VALUES (%s, %s, %s, %s, 1)",
            (pic, pic_name_norm, cc, office_id)
        )
        pic_count += 1
    
    conn.commit()
    print(f"  已导入 {pic_count} 个销售人员")
    
    # Step 7: 更新enquiry中的office和pic FK引用
    remap_count = 0
    for (eid, old_oid, old_pid) in enquiry_refs:
        new_oid = None
        new_pid = None
        
        # 尝试通过办公室名称匹配
        if old_oid and old_oid in old_office_id_to_name:
            old_oname = old_office_id_to_name[old_oid].upper().strip()
            new_oid = office_name_to_id.get(old_oname)
        
        # 尝试通过pic名称+office匹配
        if old_pid and old_pid in old_pic_id_to_info:
            old_pname, old_p_oid = old_pic_id_to_info[old_pid]
            # 如果已经找到新office_id，用它来查找pic
            search_oid = new_oid
            if not search_oid and old_p_oid in old_office_id_to_name:
                oname = old_office_id_to_name[old_p_oid].upper().strip()
                search_oid = office_name_to_id.get(oname)
            
            if search_oid:
                new_pid = new_pic_name_to_id.get((old_pname.upper().strip(), search_oid))
        
        # 更新enquiry
        updates = []
        params = []
        if new_oid and new_oid != old_oid:
            updates.append("sales_office_id = %s")
            params.append(new_oid)
        if new_pid and new_pid != old_pid:
            updates.append("sales_pic_id = %s")
            params.append(new_pid)
        
        if updates:
            params.append(eid)
            sql = f"UPDATE enquiry SET {', '.join(updates)} WHERE id = %s"
            cursor.execute(sql, params)
            remap_count += 1
    
    conn.commit()
    print(f"  已重映射 {remap_count} 条 enquiry FK 引用")


# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print("LogiTrack Pro - 全量主数据重导入")
    print(f"  Country+Port CSV: {COUNTRY_PORT_CSV}")
    print(f"  Sales CSV: {SALES_CSV}")
    print()
    
    if not os.path.exists(COUNTRY_PORT_CSV):
        print(f"ERROR: 找不到文件 {COUNTRY_PORT_CSV}")
        sys.exit(1)
    if not os.path.exists(SALES_CSV):
        print(f"ERROR: 找不到文件 {SALES_CSV}")
        sys.exit(1)
    
    conn = get_conn()
    try:
        import_country_port(conn)
        import_sales_data(conn)
        
        # 验证
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM country")
        print(f"\n验证: country = {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM port WHERE port_type='SEA'")
        print(f"验证: SEA ports = {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM port WHERE port_type='AIR'")
        print(f"验证: AIR ports = {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM dict_sales_country")
        print(f"验证: sales countries = {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM dict_sales_office")
        print(f"验证: sales offices = {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM dict_sales_pic")
        print(f"验证: sales pics = {cursor.fetchone()[0]}")
        
        print("\n✅ 全量导入完成!")
    except Exception as e:
        print(f"\n❌ 导入失败: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()
