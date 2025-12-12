#!/usr/bin/env python3
"""
创建 MySQL 数据表
使用 Python 直接执行 SQL 脚本
"""

import mysql.connector
import sys
import os

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'ldf123'
}

print("\n" + "="*60)
print("LogiTrack Pro - MySQL 表结构创建")
print("="*60)

# 读取 SQL 脚本
sql_file = 'schema.sql'
if not os.path.exists(sql_file):
    print(f"❌ 找不到 {sql_file} 文件")
    sys.exit(1)

with open(sql_file, 'r', encoding='utf-8') as f:
    sql_script = f.read()

print(f"\n✅ 已读取 {sql_file}")

# 分割 SQL 语句
sql_statements = []
current_statement = []

for line in sql_script.split('\n'):
    # 跳过注释和空行
    line = line.strip()
    if not line or line.startswith('--'):
        continue
    
    current_statement.append(line)
    
    # 如果行以分号结束，表示一条语句完成
    if line.endswith(';'):
        stmt = ' '.join(current_statement)
        if stmt.strip() and not stmt.strip().startswith('/*'):
            sql_statements.append(stmt)
        current_statement = []

print(f"✅ 解析到 {len(sql_statements)} 条 SQL 语句")

try:
    # 连接到 MySQL（不指定数据库）
    print(f"\n1. 连接到 MySQL 服务器 ({DB_CONFIG['host']}:{DB_CONFIG['port']})...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    print("   ✅ 连接成功")
    
    # 创建数据库（如果不存在）
    print("\n2. 创建数据库 'logitrack'...")
    cursor.execute("CREATE DATABASE IF NOT EXISTS logitrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    print("   ✅ 数据库已创建或已存在")
    
    # 选择数据库
    cursor.execute("USE logitrack")
    
    # 执行 SQL 语句
    print("\n3. 创建表和索引...")
    for i, stmt in enumerate(sql_statements, 1):
        try:
            cursor.execute(stmt)
            # 识别语句类型
            stmt_type = stmt.split()[0].upper()
            if stmt_type == 'CREATE':
                if 'TABLE' in stmt.upper():
                    print(f"   ✅ [{i}/{len(sql_statements)}] 创建表")
                elif 'INDEX' in stmt.upper():
                    print(f"   ✅ [{i}/{len(sql_statements)}] 创建索引")
            else:
                print(f"   ✅ [{i}/{len(sql_statements)}] 执行成功")
        except mysql.connector.Error as err:
            # 忽略已存在的错误
            if err.errno == 1050:  # Table already exists
                print(f"   ⚠️  [{i}/{len(sql_statements)}] 表已存在，跳过")
            elif err.errno == 1061:  # Duplicate key name
                print(f"   ⚠️  [{i}/{len(sql_statements)}] 索引已存在，跳过")
            else:
                print(f"   ❌ [{i}/{len(sql_statements)}] 错误: {err}")
                raise
    
    conn.commit()
    
    # 验证表结构
    print("\n4. 验证表结构...")
    cursor.execute("DESCRIBE enquiry_records")
    columns = cursor.fetchall()
    print(f"   ✅ 表 'enquiry_records' 创建成功，包含 {len(columns)} 个字段")
    
    # 显示部分字段
    print("\n   前 10 个字段:")
    for col in columns[:10]:
        print(f"      - {col[0]} ({col[1]})")
    if len(columns) > 10:
        print(f"      ... 还有 {len(columns) - 10} 个字段")
    
    # 检查索引
    cursor.execute("SHOW INDEX FROM enquiry_records")
    indexes = cursor.fetchall()
    unique_indexes = set(idx[2] for idx in indexes)
    print(f"\n   ✅ 创建了 {len(unique_indexes)} 个索引")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*60)
    print("✅ 表结构创建完成！")
    print("="*60)
    print("\n下一步:")
    print("  python import_csv.py  # 导入 CSV 数据")
    
except mysql.connector.Error as err:
    print(f"\n❌ 数据库错误: {err}")
    print(f"   错误码: {err.errno}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ 发生错误: {e}")
    sys.exit(1)
