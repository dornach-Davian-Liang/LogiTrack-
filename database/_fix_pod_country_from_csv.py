#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复 pod_country_id：通过原始 CSV 的 reference_number 重新映射
（修正上次迁移中 AU、CA、IT 等被错误映射到 OT 的问题）
"""

import os
import csv
import re
import pymysql

DB_CONFIG = {
    'host': 'localhost', 'port': 3306, 'user': 'root',
    'password': 'ldf123', 'database': 'logitrack',
    'charset': 'utf8mb4', 'cursorclass': pymysql.cursors.DictCursor,
    'autocommit': False
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_FILE = os.path.join(BASE_DIR, 'China Pricing - Enquiry Record-working(Rate Enquiry Summary).csv')

# 与 import_enquiry_data.py 一致的列索引（0-based）
COL_REFERENCE   = 2
COL_POD_COUNTRY = 19

# 与之前导入一致的非标准代码→ISO 映射
# （只需包含在上次 fix script 中被错误映射为 OT 的那些，因为有正确 ISO id）
EXTRA_NORM = {
    'UNITED KINGDOM': 'GB', 'UK': 'GB', 'GREAT BRITAIN': 'GB',
    'HONG KONG': 'HK', 'HK': 'HK', 'HONGKONG': 'HK',
    'AUSTRALIA': 'AU', 'AUSTRIA': 'AT',
    'CANADA': 'CA', 'ITALY': 'IT', 'INDIA': 'IN',
    'BRAZIL': 'BR', 'SAUDI ARABIA': 'SA', 'ROMANIA': 'RO',
    'TURKEY': 'TR', 'SWEDEN': 'SE', 'HUNGARY': 'HU',
    'ANGOLA': 'AO', 'PHILIPPINES': 'PH', 'INDONESIA': 'ID',
    'KENYA': 'KE', 'MYANMAR': 'MM', 'THAILAND': 'TH',
    'MALAYSIA': 'MY', 'EGYPT': 'EG', 'EQYPT': 'EG',
    'SOUTH AFRICA': 'ZA', 'IRAN': 'IR', 'QATAR': 'QA',
    'CUBA': 'CU', 'FINLAND': 'FI', 'NIGERIA': 'NG',
    'COLOMBIA': 'CO', 'FINLAND': 'FI', 'NORWAY': 'NO',
    'CZECH REPUBLIC': 'CZ', 'GEORGIA': 'GE', 'UKRAINE': 'UA',
    'SINGAPORE': 'SG', 'VIETNAM': 'VN', 'TAIWAN': 'TW',
    'JAPAN': 'JP', 'SOUTH KOREA': 'KR', 'KOREA': 'KR',
    'PAKISTAN': 'PK', 'BANGLADESH': 'BD', 'SRI LANKA': 'LK',
    'CAMBODIA': 'KH', 'MYANMAR': 'MM', 'LAOS': 'LA',
    'PERU': 'PE', 'CHILE': 'CL', 'ARGENTINA': 'AR',
    'MEXICO': 'MX', 'USA': 'US', 'FRANCE': 'FR', 'GERMANY': 'DE',
    'BELGIUM': 'BE', 'NETHERLANDS': 'NL', 'PORTUGAL': 'PT',
    'SPAIN': 'ES', 'GREECE': 'GR', 'MOROCCO': 'MA',
    'SWITZERLAND': 'CH', 'CHINA': 'CN', 'POLAND': 'PL',
    'BULGARIA': 'BG', 'CROATIA': 'HR', 'SERBIA': 'RS',
    'UZBEKISTAN': 'UZ', 'KAZAKHSTAN': 'KZ', 'DENMARK': 'DK',
    'SENEGAL': 'SN', 'ISRAEL': 'IL', 'JORDAN': 'JO',
    'OMAN': 'OM', 'KUWAIT': 'KW', 'BAHRAIN': 'BH',
    'UNITED ARAB EMIRATES': 'AE', 'UAE': 'AE',
    'LEBANON': 'LB', 'IRAQ': 'IQ', 'DJIBOUTI': 'DJ',
    'CAMEROON': 'CM', 'IVORY COAST': 'CI', 'GHANA': 'GH',
    'GUINEA': 'GN', 'TANZANIA': 'TZ', 'UGANDA': 'UG',
    'MOZAMBIQUE': 'MZ', 'ZAMBIA': 'ZM', 'ZIMBABWE': 'ZW',
    'MADAGASCAR': 'MG', 'SEYCHELLES': 'SC', 'MAURITIUS': 'MU',
    'NEW ZEALAND': 'NZ', 'PAPUA NEW GUINEA': 'PG',
    'TRINIDAD AND TOBAGO': 'TT', 'BARBADOS': 'BB',
    'ECUADOR': 'EC', 'VENEZUELA': 'VE',
    'PANAMA': 'PA', 'COSTA RICA': 'CR', 'NICARAGUA': 'NI',
    'EL SALVADOR': 'SV', 'HONDURAS': 'HN', 'HAITI': 'HT',
    'DOMINICAN REPUBLIC': 'DO', 'PUERTO RICO': 'PR',
    'JAMAICA': 'JM',
}


def normalize(s):
    return re.sub(r'\s+', ' ', s.strip().upper()) if s else ''


def load_country_map(cursor):
    """country_code → country_id"""
    cursor.execute("SELECT id, country_code FROM country")
    m = {}
    for r in cursor.fetchall():
        m[r['country_code'].strip().upper()] = r['id']
    return m


def main():
    print("═══════════════════════════════════════════")
    print("  LogiTrack - 修复 pod_country_id（CSV 重建）")
    print("═══════════════════════════════════════════")

    if not os.path.exists(CSV_FILE):
        print(f"❌ 找不到 CSV: {CSV_FILE}")
        return

    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # 加载国家映射
    country_map = load_country_map(cursor)
    print(f"✅ 已加载 {len(country_map)} 个国家 (code→id)")

    # 构建扩展 country map（name → id，包括 EXTRA_NORM）
    country_by_name = {}
    for name_norm, code in EXTRA_NORM.items():
        cid = country_map.get(code)
        if cid:
            country_by_name[name_norm] = cid

    def resolve_country(raw_name):
        if not raw_name:
            return None
        norm = normalize(raw_name)
        # 1. 直接当 ISO 代码查
        cid = country_map.get(norm)
        if cid:
            return cid
        # 2. 按名称查
        cid = country_by_name.get(norm)
        if cid:
            return cid
        # 3. 模糊: 名称包含
        for k, v in country_by_name.items():
            if norm in k or k in norm:
                return v
        return None  # 无法解析 → 不更新

    # 加载所有 enquiry 的 reference_number → (id, current pod_country_id)
    cursor.execute("SELECT id, reference_number, pod_country_id FROM enquiry")
    all_enquiries = cursor.fetchall()
    ref_to_enquiry = {}
    for e in all_enquiries:
        if e['reference_number']:
            ref_to_enquiry[e['reference_number'].strip()] = e
    print(f"✅ 已加载 {len(ref_to_enquiry)} 条 enquiry（按 reference_number）")

    # 遍历 CSV 重建映射
    updated = 0
    skipped_no_match = 0
    skipped_same = 0
    skipped_no_country = 0
    error_count = 0

    # 检测文件编码
    encodings = ['utf-8-sig', 'gbk', 'latin1']
    file_encoding = 'utf-8-sig'
    for enc in encodings:
        try:
            with open(CSV_FILE, 'r', encoding=enc) as f:
                f.read(1024)
            file_encoding = enc
            break
        except Exception:
            continue

    print(f"  使用编码: {file_encoding}")

    with open(CSV_FILE, 'r', encoding=file_encoding, errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader)
        print(f"  CSV 列数: {len(header)}, POD COUNTRY 列: {header[COL_POD_COUNTRY] if len(header)>COL_POD_COUNTRY else '?'}")

        for row_num, row in enumerate(reader, 2):
            if len(row) <= max(COL_REFERENCE, COL_POD_COUNTRY):
                continue

            ref_raw = row[COL_REFERENCE].strip()
            pod_country_raw = row[COL_POD_COUNTRY].strip()

            if not ref_raw:
                continue

            enquiry = ref_to_enquiry.get(ref_raw)
            if not enquiry:
                skipped_no_match += 1
                continue

            # 只更新那些当前 pod_country_id = 11 (OT/OTHERS) 的记录
            # 或者直接全量更新（更安全，因为会覆盖成更精准的值）
            new_cid = resolve_country(pod_country_raw)

            if new_cid is None:
                skipped_no_country += 1
                continue

            if enquiry['pod_country_id'] == new_cid:
                skipped_same += 1
                continue

            try:
                cursor.execute(
                    "UPDATE enquiry SET pod_country_id=%s WHERE id=%s",
                    (new_cid, enquiry['id'])
                )
                # 更新本地缓存防止同 reference 多行重复处理
                enquiry['pod_country_id'] = new_cid
                updated += 1
                if updated % 500 == 0:
                    print(f"    … 已更新 {updated} 条")
            except Exception as e:
                error_count += 1
                if error_count <= 5:
                    print(f"  ⚠️  行 {row_num} [{ref_raw}]: {e}")

    conn.commit()

    print(f"\n═══════════════════════════════════════════")
    print(f"📊 修复结果")
    print(f"═══════════════════════════════════════════")
    print(f"  已更新:           {updated} 条")
    print(f"  无需更新 (相同):  {skipped_same} 条")
    print(f"  无法解析国家:     {skipped_no_country} 条")
    print(f"  未找到 enquiry:   {skipped_no_match} 条")
    print(f"  错误:             {error_count} 条")

    # 验证
    cursor.execute("SELECT COUNT(*) AS n FROM enquiry WHERE pod_country_id=11")
    still_ot = cursor.fetchone()['n']
    cursor.execute("SELECT COUNT(*) AS n FROM enquiry WHERE pod_country_id IS NOT NULL")
    total = cursor.fetchone()['n']
    print(f"\n  剩余 pod_country_id=OT: {still_ot} 条")
    print(f"  总 enquiry:            {total} 条")

    cursor.close()
    conn.close()
    print("✅ 完成")


if __name__ == '__main__':
    main()
