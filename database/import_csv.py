#!/usr/bin/env python3
"""
LogiTrack Pro - CSV 数据导入脚本
将 Test.csv 数据导入到 MySQL 数据库
"""

import csv
import mysql.connector
from datetime import datetime
import uuid
import sys

# MySQL 连接配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'ldf123',  # 请修改为您的 MySQL 密码
    'database': 'logitrack',
    'charset': 'utf8mb4'
}

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
            return None

def parse_decimal(value_str):
    """解析数字，移除逗号"""
    if not value_str or value_str.strip() == '':
        return None
    try:
        # 移除逗号和空格
        cleaned = value_str.replace(',', '').strip()
        return float(cleaned)
    except ValueError:
        return None

def clean_string(value):
    """清理字符串"""
    if not value or value.strip() == '':
        return None
    return value.strip()

def import_csv_to_mysql(csv_file_path):
    """导入 CSV 文件到 MySQL"""
    
    print(f"开始导入 CSV 文件: {csv_file_path}")
    
    # 连接数据库
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ 成功连接到 MySQL 数据库")
    except mysql.connector.Error as e:
        print(f"❌ 数据库连接失败: {e}")
        sys.exit(1)
    
    # 准备 SQL 插入语句
    insert_sql = """
    INSERT INTO enquiry_records (
        id,
        enquiry_received_date,
        issue_date,
        reference_number,
        product,
        status,
        cn_pricing_admin,
        sales_country,
        sales_office,
        sales_pic,
        assigned_cn_offices,
        cargo_type,
        volume_cbm,
        quantity,
        quantity_unit,
        quantity_teu,
        commodity,
        haz_special_equipment,
        pol,
        pod,
        pod_country,
        core_non_core,
        category,
        cargo_ready_date,
        additional_requirement,
        first_quotation_sent,
        first_offer_ocean_frg,
        first_offer_air_frg_kg,
        latest_offer_ocean_frg,
        latest_offer_air_frg_kg,
        booking_confirmed,
        remark,
        rejected_reason,
        actual_reason
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s
    )
    """
    
    # 读取并导入 CSV
    imported_count = 0
    error_count = 0
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            csv_reader = csv.DictReader(csvfile)
            
            for row in csv_reader:
                try:
                    # 生成 UUID
                    record_id = str(uuid.uuid4())
                    
                    # 准备数据
                    data = (
                        record_id,
                        parse_date(row.get('Enquiry Received Date')),
                        parse_date(row.get('Issue Date')),
                        clean_string(row.get('Reference Number')),
                        clean_string(row.get('Product')),
                        clean_string(row.get('Status\n(New/Quoted )')),
                        clean_string(row.get('CN Pricing Admin')),
                        clean_string(row.get('Sales Country')),
                        clean_string(row.get(' Sales office')),
                        clean_string(row.get('Sales PIC')),
                        clean_string(row.get('Assigned CN Offices')),
                        clean_string(row.get('Cargo Type')),
                        parse_decimal(row.get('Volume (CBM)')),
                        parse_decimal(row.get('Quantity')),
                        clean_string(row.get('Quantity\n(Unit)')),
                        parse_decimal(row.get('Quantity\n(TEU)')),
                        clean_string(row.get('Commodity')),
                        clean_string(row.get('Haz, Special Equipment \n(if relevant)')),
                        clean_string(row.get('POL')),
                        clean_string(row.get('POD')),
                        clean_string(row.get('POD Country')),
                        clean_string(row.get('CORE / NON CORE (formula locked, please just copy and past to the next record)')),
                        clean_string(row.get('Category : \n1. Freight\n2. Freight + Origin Charge/EXW\n3. Freight + Origin Charge/EXW+Dest. Charges\n4. Origin Charges/EXW\n5. LCL')),
                        parse_date(row.get('Cargo Ready Date')),
                        clean_string(row.get('Additional Requirement')),
                        parse_date(row.get('1st Quotation Sent')),
                        clean_string(row.get('1st Offer:\nOcean Frg')),
                        clean_string(row.get('1st Offer:\nAir Frg/KG')),
                        clean_string(row.get('Lastest Offer:\nOcean Frg')),
                        clean_string(row.get('Lastest Offer:\nAir Frg/KG')),
                        clean_string(row.get('Booking Confirmed \n(Yes/Rejected/Pending)')),
                        clean_string(row.get('Remark')),
                        clean_string(row.get('Rejected Reason')),
                        clean_string(row.get('Actual Reason \n(to be discussed)'))
                    )
                    
                    # 执行插入
                    cursor.execute(insert_sql, data)
                    imported_count += 1
                    print(f"✅ 已导入: {row.get('Reference Number')}")
                    
                except Exception as e:
                    error_count += 1
                    print(f"❌ 导入失败 {row.get('Reference Number', 'Unknown')}: {e}")
        
        # 提交事务
        conn.commit()
        print(f"\n{'='*50}")
        print(f"导入完成！")
        print(f"成功: {imported_count} 条")
        print(f"失败: {error_count} 条")
        print(f"{'='*50}")
        
    except FileNotFoundError:
        print(f"❌ 文件不存在: {csv_file_path}")
    except Exception as e:
        print(f"❌ 导入过程出错: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()
        print("数据库连接已关闭")

if __name__ == '__main__':
    csv_file = '/workspaces/LogiTrack-/Test.csv'
    
    print("=" * 50)
    print("LogiTrack Pro - CSV 数据导入工具")
    print("=" * 50)
    print(f"数据库: {DB_CONFIG['database']}")
    print(f"主机: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print(f"用户: {DB_CONFIG['user']}")
    print("=" * 50)
    print("\n⚠️  请确保:")
    print("1. MySQL 服务已启动")
    print("2. 已运行 schema.sql 创建表结构")
    print("3. 修改了脚本中的数据库密码")
    print()
    
    input("按 Enter 键开始导入...")
    
    import_csv_to_mysql(csv_file)
