#!/usr/bin/env python3
"""
LogiTrack Pro - 数据库配置助手
帮助用户配置和测试数据库连接
"""

import sys
import os

try:
    import mysql.connector
except ImportError:
    print("正在安装 mysql-connector-python...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "mysql-connector-python"])
    import mysql.connector

print("\n" + "="*60)
print("LogiTrack Pro - 数据库配置助手")
print("="*60)

print("\n当前配置的数据库连接信息:")
print("-" * 60)

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'ldf123',
    'database': 'logitrack'
}

print(f"  主机地址: {DB_CONFIG['host']}")
print(f"  端口: {DB_CONFIG['port']}")
print(f"  用户名: {DB_CONFIG['user']}")
print(f"  密码: {DB_CONFIG['password']}")
print(f"  数据库名: {DB_CONFIG['database']}")
print("-" * 60)

print("\n选项:")
print("  1. 使用当前配置测试连接")
print("  2. 修改配置")
print("  3. 退出")

choice = input("\n请选择 (1-3): ").strip()

if choice == '3':
    sys.exit(0)

if choice == '2':
    print("\n请输入新的配置（直接按回车保持原值）:")
    
    new_host = input(f"  主机地址 [{DB_CONFIG['host']}]: ").strip()
    if new_host:
        DB_CONFIG['host'] = new_host
    
    new_port = input(f"  端口 [{DB_CONFIG['port']}]: ").strip()
    if new_port:
        DB_CONFIG['port'] = int(new_port)
    
    new_user = input(f"  用户名 [{DB_CONFIG['user']}]: ").strip()
    if new_user:
        DB_CONFIG['user'] = new_user
    
    new_pass = input(f"  密码 [{DB_CONFIG['password']}]: ").strip()
    if new_pass:
        DB_CONFIG['password'] = new_pass
    
    new_db = input(f"  数据库名 [{DB_CONFIG['database']}]: ").strip()
    if new_db:
        DB_CONFIG['database'] = new_db
    
    print("\n更新后的配置:")
    print("-" * 60)
    print(f"  主机地址: {DB_CONFIG['host']}")
    print(f"  端口: {DB_CONFIG['port']}")
    print(f"  用户名: {DB_CONFIG['user']}")
    print(f"  密码: {DB_CONFIG['password']}")
    print(f"  数据库名: {DB_CONFIG['database']}")
    print("-" * 60)

# 测试连接
print("\n" + "="*60)
print("测试数据库连接...")
print("="*60)

print(f"\n➡️  连接到 {DB_CONFIG['host']}:{DB_CONFIG['port']}...")

try:
    # 先测试不指定数据库的连接
    conn = mysql.connector.connect(
        host=DB_CONFIG['host'],
        port=DB_CONFIG['port'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password']
    )
    print("✅ MySQL 服务器连接成功！")
    
    cursor = conn.cursor()
    cursor.execute("SELECT VERSION()")
    version = cursor.fetchone()[0]
    print(f"✅ MySQL 版本: {version}")
    
    # 检查数据库是否存在
    cursor.execute(f"SHOW DATABASES LIKE '{DB_CONFIG['database']}'")
    db_exists = cursor.fetchone()
    
    if db_exists:
        print(f"✅ 数据库 '{DB_CONFIG['database']}' 已存在")
    else:
        print(f"⚠️  数据库 '{DB_CONFIG['database']}' 不存在")
        create = input(f"\n是否创建数据库 '{DB_CONFIG['database']}'? (y/n): ").strip().lower()
        if create == 'y':
            cursor.execute(f"CREATE DATABASE {DB_CONFIG['database']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✅ 数据库 '{DB_CONFIG['database']}' 创建成功")
        else:
            print("⏭️  跳过数据库创建")
    
    cursor.close()
    conn.close()
    
    # 连接到指定数据库
    if db_exists or create == 'y':
        print(f"\n➡️  连接到数据库 '{DB_CONFIG['database']}'...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 检查表
        cursor.execute("SHOW TABLES LIKE 'enquiry_records'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            print("✅ 表 'enquiry_records' 已存在")
            cursor.execute("SELECT COUNT(*) FROM enquiry_records")
            count = cursor.fetchone()[0]
            print(f"✅ 当前有 {count} 条记录")
        else:
            print("⚠️  表 'enquiry_records' 不存在")
        
        cursor.close()
        conn.close()
    
    print("\n" + "="*60)
    print("✅ 数据库连接测试完成！")
    print("="*60)
    
    if choice == '2':
        print("\n配置已更新，请手动更新以下文件中的数据库配置:")
        print("  1. backend/src/main/resources/application.properties")
        print("  2. database/create_table.py")
        print("  3. database/import_csv.py")
        print("  4. database/test_connection.py")
        print("\n新配置:")
        print(f"  host={DB_CONFIG['host']}")
        print(f"  port={DB_CONFIG['port']}")
        print(f"  user={DB_CONFIG['user']}")
        print(f"  password={DB_CONFIG['password']}")
        print(f"  database={DB_CONFIG['database']}")
    
    print("\n下一步:")
    if not db_exists or not table_exists:
        print("  1. 创建表: python create_table.py")
        print("  2. 导入数据: python import_csv.py")
    else:
        print("  1. 启动后端: cd ../backend && ./start-backend.sh")
        print("  2. 启动前端: cd ../logitrack-pro && npm run dev")

except mysql.connector.Error as err:
    print(f"❌ 连接失败: {err}")
    print(f"   错误码: {err.errno}")
    
    if err.errno == 2003:
        print("\n可能的原因:")
        print("  • MySQL 服务未运行")
        print("  • 主机地址或端口不正确")
        print("  • 防火墙阻止连接")
        print("\n解决方法:")
        print("  • 检查 MySQL 服务状态")
        print("  • 验证连接信息")
        print("  • 如果 MySQL 在远程服务器，确保可以访问")
    elif err.errno == 1045:
        print("\n用户名或密码错误")
        print("  请重新运行此脚本并选择 '2. 修改配置'")
    
    sys.exit(1)

except Exception as e:
    print(f"❌ 发生错误: {e}")
    sys.exit(1)
