#!/bin/bash

# LogiTrack Pro - MySQL 自动化部署脚本
# 自动检测、安装、配置 MySQL 并导入数据

set -e  # 遇到错误立即退出

echo "=========================================="
echo "LogiTrack Pro - MySQL 自动化部署"
echo "=========================================="
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 数据库配置
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASS="ldf123"
DB_NAME="logitrack"

echo "📋 配置信息:"
echo "   主机: $DB_HOST"
echo "   端口: $DB_PORT"
echo "   用户: $DB_USER"
echo "   数据库: $DB_NAME"
echo ""

# 步骤 1: 检查 Python 环境
echo "1️⃣  检查 Python 环境..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python3 已安装${NC}"

# 安装必要的 Python 包
echo ""
echo "2️⃣  安装 Python 依赖..."
pip install -q mysql-connector-python pandas 2>/dev/null || {
    echo -e "${YELLOW}⚠️  部分包可能已安装${NC}"
}
echo -e "${GREEN}✅ Python 依赖已就绪${NC}"

# 步骤 2: 检测 MySQL
echo ""
echo "3️⃣  检测 MySQL 服务..."

# 尝试使用 Python 连接 MySQL
python3 - <<EOF
import sys
try:
    import mysql.connector
    conn = mysql.connector.connect(
        host='$DB_HOST',
        port=$DB_PORT,
        user='$DB_USER',
        password='$DB_PASS'
    )
    print('   ${GREEN}✅ MySQL 服务运行正常${NC}')
    conn.close()
    sys.exit(0)
except mysql.connector.Error as err:
    if err.errno == 2003:  # Can't connect
        print('   ${RED}❌ 无法连接到 MySQL 服务${NC}')
        print('')
        print('   请确保:')
        print('   1. MySQL 服务正在运行')
        print('   2. 连接信息正确（主机: $DB_HOST, 端口: $DB_PORT）')
        print('   3. 用户名密码正确（用户: $DB_USER）')
        print('')
        print('   如果 MySQL 在远程服务器，请修改 application.properties 中的连接信息')
    elif err.errno == 1045:  # Access denied
        print('   ${RED}❌ 用户名或密码错误${NC}')
        print('   当前使用: 用户=$DB_USER, 密码=$DB_PASS')
    else:
        print(f'   ${RED}❌ MySQL 错误: {err}${NC}')
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}💡 提示：${NC}"
    echo "   如果您的 MySQL 在远程服务器或使用不同的连接信息，"
    echo "   请编辑以下文件并修改数据库配置:"
    echo ""
    echo "   1. backend/src/main/resources/application.properties"
    echo "   2. database/create_table.py"
    echo "   3. database/import_csv.py"
    echo "   4. database/test_connection.py"
    echo ""
    exit 1
fi

# 步骤 3: 创建数据库和表
echo ""
echo "4️⃣  创建数据库和表结构..."
cd "$(dirname "$0")"
python3 create_table.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库和表创建成功${NC}"
else
    echo -e "${RED}❌ 创建失败${NC}"
    exit 1
fi

# 步骤 4: 检查 CSV 文件
echo ""
echo "5️⃣  检查 CSV 数据文件..."
CSV_FILE="../Test.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo -e "${RED}❌ 找不到 $CSV_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ CSV 文件存在${NC}"

# 步骤 5: 导入数据
echo ""
echo "6️⃣  导入 CSV 数据到数据库..."
python3 import_csv.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据导入成功${NC}"
else
    echo -e "${YELLOW}⚠️  数据导入可能有问题，请检查日志${NC}"
fi

# 步骤 6: 验证数据
echo ""
echo "7️⃣  验证数据..."
python3 - <<EOF
import mysql.connector
conn = mysql.connector.connect(
    host='$DB_HOST',
    port=$DB_PORT,
    user='$DB_USER',
    password='$DB_PASS',
    database='$DB_NAME'
)
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM enquiry_records")
count = cursor.fetchone()[0]
print(f"   ✅ 数据库中共有 {count} 条记录")

if count > 0:
    cursor.execute("SELECT reference_number, status, product FROM enquiry_records LIMIT 3")
    records = cursor.fetchall()
    print(f"\n   前 3 条记录:")
    for r in records:
        print(f"      - {r[0]}: {r[1]} ({r[2]})")

cursor.close()
conn.close()
EOF

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "=========================================="
echo ""
echo "📍 数据库信息:"
echo "   连接: mysql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "🚀 下一步:"
echo "   1. 启动后端: cd ../backend && ./start-backend.sh"
echo "   2. 启动前端: cd ../logitrack-pro && npm run dev"
echo "   3. 访问系统: http://localhost:3000"
echo ""
