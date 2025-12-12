#!/usr/bin/env python3
"""
MySQL 连接检查工具 - 支持多种主机配置
"""

import sys

try:
    import mysql.connector
except ImportError:
    print("❌ 请先安装依赖: pip install mysql-connector-python")
    sys.exit(1)

def check_connection(host, port, user, password, db=None):
    """测试 MySQL 连接"""
    try:
        config = {
            'host': host,
            'port': port,
            'user': user,
            'password': password,
            'connect_timeout': 5
        }
        if db:
            config['database'] = db
            
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        
        # 测试查询
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        return True, version
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("MySQL 连接检查工具")
    print("=" * 60)
    print()
    
    # 数据库配置
    user = 'root'
    password = 'ldf123'
    port = 3306
    database = 'logitrack'
    
    # 尝试不同的主机地址
    hosts = [
        ('localhost', 'localhost（本地）'),
        ('127.0.0.1', '127.0.0.1（本地回环）'),
        ('host.docker.internal', 'host.docker.internal（Docker Desktop）'),
    ]
    
    # 尝试从 WSL 获取 Windows 主机 IP
    try:
        with open('/etc/resolv.conf', 'r') as f:
            for line in f:
                if 'nameserver' in line:
                    wsl_host = line.split()[1]
                    hosts.append((wsl_host, f'{wsl_host}（WSL2 Windows 主机）'))
                    break
    except:
        pass
    
    print("🔍 尝试连接到 MySQL...")
    print()
    
    success_host = None
    
    for host, description in hosts:
        print(f"测试 {description}...", end=' ')
        success, result = check_connection(host, port, user, password)
        
        if success:
            print(f"✅ 成功")
            print(f"   MySQL 版本: {result}")
            success_host = host
            break
        else:
            print(f"❌ 失败")
            # print(f"   错误: {result}")
    
    if not success_host:
        print()
        print("=" * 60)
        print("❌ 无法连接到 MySQL 服务器")
        print("=" * 60)
        print()
        print("请检查:")
        print("1. MySQL 服务是否在 Windows 上运行")
        print("   - 打开 services.msc，找到 MySQL 服务")
        print("   - 或运行: net start MySQL80")
        print()
        print("2. 用户名和密码是否正确")
        print(f"   - 当前用户名: {user}")
        print(f"   - 当前密码: {password}")
        print()
        print("3. MySQL 是否监听 0.0.0.0")
        print("   - 编辑 my.ini，设置 bind-address = 0.0.0.0")
        print()
        print("4. 防火墙是否允许端口 3306")
        print()
        print("详细指南: 查看 database/WINDOWS_MYSQL_SETUP.md")
        return False
    
    print()
    print("=" * 60)
    print("✅ MySQL 连接成功！")
    print("=" * 60)
    print()
    
    # 检查数据库
    print("🔍 检查数据库...")
    success, result = check_connection(success_host, port, user, password, database)
    
    if success:
        print(f"✅ 数据库 '{database}' 存在")
        
        # 检查表
        try:
            conn = mysql.connector.connect(
                host=success_host,
                port=port,
                user=user,
                password=password,
                database=database
            )
            cursor = conn.cursor()
            
            cursor.execute("SHOW TABLES LIKE 'enquiry_records'")
            if cursor.fetchone():
                print(f"✅ 表 'enquiry_records' 存在")
                
                # 统计记录数
                cursor.execute("SELECT COUNT(*) FROM enquiry_records")
                count = cursor.fetchone()[0]
                print(f"📊 当前记录数: {count}")
            else:
                print(f"❌ 表 'enquiry_records' 不存在")
                print(f"   请运行: mysql -u {user} -p{password} {database} < database/schema.sql")
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"❌ 检查表失败: {e}")
    else:
        print(f"❌ 数据库 '{database}' 不存在")
        print(f"   错误: {result}")
        print()
        print("创建数据库:")
        print(f"   mysql -u {user} -p{password} -e \"CREATE DATABASE {database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\"")
        return False
    
    print()
    print("=" * 60)
    print("🎯 下一步操作")
    print("=" * 60)
    print()
    
    # 更新配置文件建议
    print(f"📝 请更新后端配置文件:")
    print(f"   文件: backend/src/main/resources/application.properties")
    print()
    print(f"   spring.datasource.url=jdbc:mysql://{success_host}:{port}/{database}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true")
    print(f"   spring.datasource.username={user}")
    print(f"   spring.datasource.password={password}")
    print()
    
    print("✅ 所有检查完成！")
    print()
    
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
