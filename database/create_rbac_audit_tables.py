#!/usr/bin/env python3
"""
创建RBAC和审计日志表的Python脚本
"""
import pymysql
import sys

def create_rbac_audit_tables():
    """创建RBAC和审计日志表"""
    try:
        # 连接 MySQL
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='admin123456',
            database='logitrack',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        print("已连接到 MySQL 数据库")
        
        # 读取 SQL 文件
        with open('schema_rbac_audit.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # 分割成单独的语句
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]
        
        with connection.cursor() as cursor:
            for i, statement in enumerate(statements, 1):
                try:
                    cursor.execute(statement)
                    print(f"执行语句 {i}/{len(statements)}: 成功")
                except Exception as e:
                    print(f"执行语句 {i}/{len(statements)}: 失败 - {e}")
            
            connection.commit()
            print("\n所有表创建完成！")
        
        # 验证表是否创建成功
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES LIKE 'user'")
            if cursor.fetchone():
                print("✓ user 表创建成功")
            
            cursor.execute("SHOW TABLES LIKE 'role'")
            if cursor.fetchone():
                print("✓ role 表创建成功")
            
            cursor.execute("SHOW TABLES LIKE 'user_role'")
            if cursor.fetchone():
                print("✓ user_role 表创建成功")
            
            cursor.execute("SHOW TABLES LIKE 'audit_log'")
            if cursor.fetchone():
                print("✓ audit_log 表创建成功")
            
            # 查询角色和用户数据
            cursor.execute("SELECT COUNT(*) as count FROM role")
            role_count = cursor.fetchone()['count']
            print(f"\n角色数量: {role_count}")
            
            cursor.execute("SELECT COUNT(*) as count FROM user")
            user_count = cursor.fetchone()['count']
            print(f"用户数量: {user_count}")
        
        connection.close()
        print("\n数据库连接已关闭")
        return True
        
    except pymysql.MySQLError as e:
        print(f"MySQL 错误: {e}")
        return False
    except Exception as e:
        print(f"错误: {e}")
        return False

if __name__ == "__main__":
    success = create_rbac_audit_tables()
    sys.exit(0 if success else 1)
