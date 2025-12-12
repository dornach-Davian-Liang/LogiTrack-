#!/bin/bash

# MySQL 连接测试脚本

echo "=========================================="
echo "MySQL 连接测试"
echo "=========================================="
echo ""

# 检查 MySQL 服务
echo "1. 检查 MySQL 服务状态..."
if command -v mysql &> /dev/null; then
    echo "   ✅ MySQL 客户端已安装"
else
    echo "   ❌ MySQL 客户端未安装"
    echo "   请先安装: sudo apt-get install mysql-client"
    exit 1
fi

# 测试本地 MySQL 连接
echo ""
echo "2. 测试 MySQL 连接 (localhost:3306)..."
mysql -h localhost -P 3306 -u root -pldf123 -e "SELECT 1" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ MySQL 连接成功"
else
    echo "   ❌ MySQL 连接失败"
    echo "   请确保:"
    echo "   - MySQL 服务正在运行"
    echo "   - 用户名: root"
    echo "   - 密码: 123456"
    echo "   - 端口: 3306"
    exit 1
fi

# 检查数据库是否存在
echo ""
echo "3. 检查 logitrack 数据库..."
mysql -h localhost -P 3306 -u root -pldf123 -e "USE logitrack; SELECT 1" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ logitrack 数据库存在"
else
    echo "   ❌ logitrack 数据库不存在"
    echo "   请先执行: mysql -u root -pldf123 < database/schema.sql"
    exit 1
fi

# 检查表是否存在
echo ""
echo "4. 检查 enquiry_records 表..."
TABLE_EXISTS=$(mysql -h localhost -P 3306 -u root -pldf123 logitrack -e "SHOW TABLES LIKE 'enquiry_records';" 2>/dev/null | grep enquiry_records)
if [ -n "$TABLE_EXISTS" ]; then
    echo "   ✅ enquiry_records 表存在"
    
    # 查询记录数
    RECORD_COUNT=$(mysql -h localhost -P 3306 -u root -pldf123 logitrack -e "SELECT COUNT(*) FROM enquiry_records;" -s -N 2>/dev/null)
    echo "   📊 当前记录数: $RECORD_COUNT"
else
    echo "   ❌ enquiry_records 表不存在"
    echo "   请先执行: mysql -u root -pldf123 < database/schema.sql"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ MySQL 环境检查完成！可以启动后端服务"
echo "=========================================="
echo ""
echo "启动命令: cd backend && ./start-backend.sh"
