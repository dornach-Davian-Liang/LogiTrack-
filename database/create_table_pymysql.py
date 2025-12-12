#!/usr/bin/env python3
"""
使用 pymysql 创建 MySQL 数据表
"""

import pymysql
import sys

# 数据库配置
MYSQL_HOST = '127.0.0.1'
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'ldf123'
MYSQL_DB = 'logitrack'

print("\n" + "="*60)
print("LogiTrack Pro - 创建 MySQL 表结构")
print("="*60)

try:
    # 连接 MySQL
    print(f"\n1. 连接到 MySQL ({MYSQL_HOST})...")
    conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        charset='utf8mb4'
    )
    print("   ✅ 连接成功")
    
    cursor = conn.cursor()
    
    # 读取 SQL 脚本
    print("\n2. 读取建表脚本...")
    with open('schema.sql', 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    # 分割并执行 SQL 语句
    print("\n3. 创建表结构...")
    
    # 先删除表（如果存在）
    cursor.execute("DROP TABLE IF EXISTS enquiry_records")
    print("   ✅ 清理旧表")
    
    # 提取 CREATE TABLE 语句
    create_table_start = sql_script.find("CREATE TABLE")
    create_table_end = sql_script.find(";", create_table_start) + 1
    create_table_sql = sql_script[create_table_start:create_table_end]
    
    cursor.execute(create_table_sql)
    print("   ✅ 创建表 enquiry_records")
    
    # 创建索引
    print("\n4. 创建索引...")
    indexes = [
        "CREATE INDEX idx_reference_number ON enquiry_records(reference_number)",
        "CREATE INDEX idx_status ON enquiry_records(status)",
        "CREATE INDEX idx_sales_country ON enquiry_records(sales_country)",
        "CREATE INDEX idx_booking_confirmed ON enquiry_records(booking_confirmed)",
        "CREATE INDEX idx_enquiry_date ON enquiry_records(enquiry_received_date)",
        "CREATE INDEX idx_product ON enquiry_records(product)",
        "CREATE INDEX idx_pol_pod ON enquiry_records(pol, pod)",
        "CREATE INDEX idx_created_at ON enquiry_records(created_at)"
    ]
    
    for idx_sql in indexes:
        try:
            cursor.execute(idx_sql)
            print(f"   ✅ {idx_sql.split('CREATE INDEX ')[1].split(' ON')[0]}")
        except pymysql.err.OperationalError as e:
            if e.args[0] == 1061:  # Duplicate key name
                print(f"   ⚠️  索引已存在，跳过")
            else:
                raise
    
    conn.commit()
    
    # 验证表结构
    print("\n5. 验证表结构...")
    cursor.execute("DESCRIBE enquiry_records")
    columns = cursor.fetchall()
    print(f"   ✅ 表创建成功，包含 {len(columns)} 个字段")
    
    print("\n   字段列表:")
    for col in columns[:10]:
        print(f"      - {col[0]} ({col[1]})")
    if len(columns) > 10:
        print(f"      ... 还有 {len(columns) - 10} 个字段")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*60)
    print("✅ 表结构创建完成！")
    print("="*60)
    
except pymysql.Error as err:
    print(f"\n❌ 数据库错误: {err}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ 发生错误: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
