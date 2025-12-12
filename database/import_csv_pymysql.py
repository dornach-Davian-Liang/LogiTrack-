#!/usr/bin/env python3
"""
使用 pymysql 将 CSV 数据导入到 MySQL 数据库
"""

import csv
import pymysql
from datetime import datetime
import uuid
import sys
import os

# 数据库配置
MYSQL_HOST = '127.0.0.1'
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'ldf123'
MYSQL_DB = 'logitrack'

def parse_date(date_str):
    """解析日期字符串"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        # 尝试解析 d-Mon-yy 格式 (如 2-Jan-24)
        return datetime.strptime(date_str.strip(), '%d-%b-%y').strftime('%Y-%m-%d')
    except ValueError:
        try:
            # 尝试其他格式
            return datetime.strptime(date_str.strip(), '%Y-%m-%d').strftime('%Y-%m-%d')
        except ValueError:
            print(f"   ⚠️  无法解析日期: {date_str}")
            return None

def parse_number(num_str):
    """解析数值字符串，移除逗号"""
    if not num_str or num_str.strip() == '':
        return None
    try:
        # 移除逗号
        cleaned = num_str.replace(',', '').strip()
        return float(cleaned)
    except ValueError:
        print(f"   ⚠️  无法解析数值: {num_str}")
        return None

def clean_string(s):
    """清理字符串"""
    if not s or s.strip() == '':
        return None
    return s.strip()

print("\n" + "="*60)
print("LogiTrack Pro - CSV 数据导入")
print("="*60)

# 检查 CSV 文件
csv_file = '../Test.csv'
if not os.path.exists(csv_file):
    print(f"\n❌ 找不到文件: {csv_file}")
    sys.exit(1)

print(f"\n✅ 找到 CSV 文件: {csv_file}")

try:
    # 连接数据库
    print(f"\n1. 连接到数据库 {MYSQL_DB}...")
    conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        charset='utf8mb4'
    )
    print("   ✅ 连接成功")
    
    cursor = conn.cursor()
    
    # 检查表是否存在
    cursor.execute("SHOW TABLES LIKE 'enquiry_records'")
    if not cursor.fetchone():
        print("\n❌ 表 'enquiry_records' 不存在")
        print("   请先运行: python create_table_pymysql.py")
        sys.exit(1)
    
    print("   ✅ 表 'enquiry_records' 存在")
    
    # 清空现有数据
    print("\n2. 清空现有数据...")
    cursor.execute("DELETE FROM enquiry_records")
    conn.commit()
    print("   ✅ 数据已清空")
    
    # 读取 CSV
    print(f"\n3. 读取 CSV 文件...")
    with open(csv_file, 'r', encoding='utf-8') as f:
        csv_reader = csv.DictReader(f)
        records = list(csv_reader)
    
    print(f"   ✅ 读取到 {len(records)} 条记录")
    
    # 准备插入语句
    insert_sql = """
    INSERT INTO enquiry_records (
        id, enquiry_received_date, issue_date, reference_number, product, status,
        cn_pricing_admin, sales_country, sales_office, sales_pic, assigned_cn_offices,
        cargo_type, volume_cbm, quantity, quantity_unit, quantity_teu, commodity,
        haz_special_equipment, pol, pod, pod_country, core_non_core, category,
        cargo_ready_date, additional_requirement, first_quotation_sent,
        first_offer_ocean_frg, first_offer_air_frg_kg, latest_offer_ocean_frg,
        latest_offer_air_frg_kg, booking_confirmed, remark, rejected_reason,
        actual_reason, created_at, updated_at
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
    )
    """
    
    # 导入数据
    print("\n4. 导入数据到数据库...")
    imported = 0
    failed = 0
    
    for idx, row in enumerate(records, 1):
        try:
            # 生成 UUID
            record_id = str(uuid.uuid4())
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # 准备数据
            data = (
                record_id,
                parse_date(row.get('Enquiry Received Date', '')),
                parse_date(row.get('Issue Date', '')),
                clean_string(row.get('Reference Number', '')),
                clean_string(row.get('Product', '')),
                clean_string(row.get('Status\n(New/Quoted )', '')),
                clean_string(row.get('CN Pricing Admin', '')),
                clean_string(row.get('Sales Country', '')),
                clean_string(row.get(' Sales office', '')),
                clean_string(row.get('Sales PIC', '')),
                clean_string(row.get('Assigned CN Offices', '')),
                clean_string(row.get('Cargo Type', '')),
                parse_number(row.get('Volume (CBM)', '')),
                parse_number(row.get('Quantity', '')),
                clean_string(row.get('Quantity\n(Unit)', '')),
                parse_number(row.get('Quantity\n(TEU)', '')),
                clean_string(row.get('Commodity', '')),
                clean_string(row.get('Haz, Special Equipment \n(if relevant)', '')),
                clean_string(row.get('POL', '')),
                clean_string(row.get('POD', '')),
                clean_string(row.get('POD Country', '')),
                clean_string(row.get('CORE / NON CORE (formula locked, please just copy and past to the next record)', '')),
                clean_string(row.get('Category : \n1. Freight\n2. Freight + Origin Charge/EXW\n3. Freight + Origin Charge/EXW+Dest. Charges\n4. Origin Charges/EXW\n5. LCL', '')),
                parse_date(row.get('Cargo Ready Date', '')),
                clean_string(row.get('Additional Requirement', '')),
                parse_date(row.get('1st Quotation Sent', '')),
                clean_string(row.get('1st Offer:\nOcean Frg', '')),
                clean_string(row.get('1st Offer:\nAir Frg/KG', '')),
                clean_string(row.get('Lastest Offer:\nOcean Frg', '')),
                clean_string(row.get('Lastest Offer:\nAir Frg/KG', '')),
                clean_string(row.get('Booking Confirmed \n(Yes/Rejected/Pending)', '')),
                clean_string(row.get('Remark', '')),
                clean_string(row.get('Rejected Reason', '')),
                clean_string(row.get('Actual Reason \n(to be discussed)', '')),
                now,
                now
            )
            
            cursor.execute(insert_sql, data)
            imported += 1
            print(f"   ✅ [{idx}/{len(records)}] {row.get('Reference Number', 'N/A')}")
            
        except Exception as e:
            failed += 1
            print(f"   ❌ [{idx}/{len(records)}] 失败: {e}")
            continue
    
    # 提交事务
    conn.commit()
    
    # 验证导入
    print(f"\n5. 验证导入结果...")
    cursor.execute("SELECT COUNT(*) FROM enquiry_records")
    count = cursor.fetchone()[0]
    print(f"   ✅ 数据库中共有 {count} 条记录")
    
    # 显示部分数据
    if count > 0:
        cursor.execute("SELECT reference_number, status, product, sales_country FROM enquiry_records LIMIT 5")
        sample_records = cursor.fetchall()
        print(f"\n   前 {len(sample_records)} 条记录:")
        for r in sample_records:
            print(f"      - {r[0]}: {r[1]} ({r[2]}) - {r[3]}")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*60)
    print(f"✅ 数据导入完成！")
    print(f"   成功: {imported} 条")
    print(f"   失败: {failed} 条")
    print("="*60)
    
    if imported > 0:
        print("\n🚀 下一步:")
        print("   1. 启动后端: cd ../backend && ./start-backend.sh")
        print("   2. 启动前端: cd ../logitrack-pro && npm run dev")
        print("   3. 访问系统: http://localhost:3000")
    
except pymysql.Error as err:
    print(f"\n❌ 数据库错误: {err}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ 发生错误: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
