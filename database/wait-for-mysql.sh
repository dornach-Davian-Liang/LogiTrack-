#!/bin/bash

echo "=========================================="
echo "LogiTrack Pro - MySQL 启动等待脚本"
echo "=========================================="
echo ""
echo "📋 当前状态: MySQL 服务未运行"
echo ""
echo "🔧 请在 Windows 上执行以下操作:"
echo ""
echo "方法 1: 通过服务管理器"
echo "  1. 按 Win + R"
echo "  2. 输入: services.msc"
echo "  3. 找到 'MySQL' 或 'MySQL80' 服务"
echo "  4. 右键点击 → 启动"
echo ""
echo "方法 2: 通过命令行（以管理员身份运行 CMD）"
echo "  net start MySQL80"
echo "  # 或"
echo "  net start MySQL"
echo ""
echo "方法 3: 检查 MySQL 安装路径"
echo "  通常在: C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin"
echo "  运行: mysqld.exe"
echo ""
echo "=========================================="
echo "⏳ 等待 MySQL 启动..."
echo "=========================================="
echo ""
echo "按 Ctrl+C 取消等待"
echo ""

# 等待 MySQL 启动
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    # 尝试连接 MySQL
    python3 -c "
import mysql.connector
import sys
hosts = ['localhost', '127.0.0.1', 'host.docker.internal']
try:
    with open('/etc/resolv.conf', 'r') as f:
        for line in f:
            if 'nameserver' in line:
                hosts.append(line.split()[1])
                break
except:
    pass

for host in hosts:
    try:
        conn = mysql.connector.connect(
            host=host,
            port=3306,
            user='root',
            password='ldf123',
            connect_timeout=2
        )
        print(f'SUCCESS:{host}')
        conn.close()
        sys.exit(0)
    except:
        pass
sys.exit(1)
" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        RESULT=$(python3 -c "
import mysql.connector
hosts = ['localhost', '127.0.0.1', 'host.docker.internal']
try:
    with open('/etc/resolv.conf', 'r') as f:
        for line in f:
            if 'nameserver' in line:
                hosts.append(line.split()[1])
                break
except:
    pass

for host in hosts:
    try:
        conn = mysql.connector.connect(
            host=host,
            port=3306,
            user='root',
            password='ldf123',
            connect_timeout=2
        )
        print(host)
        conn.close()
        break
    except:
        pass
" 2>/dev/null)
        
        echo ""
        echo "=========================================="
        echo "✅ MySQL 已启动！"
        echo "=========================================="
        echo ""
        echo "连接主机: $RESULT"
        echo ""
        
        # 自动运行检查脚本
        echo "🔍 运行完整检查..."
        python3 /workspaces/LogiTrack-/database/check_mysql.py
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "=========================================="
            echo "🚀 准备开始数据迁移"
            echo "=========================================="
            echo ""
            read -p "是否立即开始迁移？(y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo ""
                echo "🔄 开始数据迁移..."
                cd /workspaces/LogiTrack-/database
                bash setup-mysql.sh
            else
                echo ""
                echo "✅ 手动迁移命令:"
                echo "   cd /workspaces/LogiTrack-/database"
                echo "   bash setup-mysql.sh"
            fi
        fi
        
        exit 0
    fi
    
    # 显示进度
    if [ $((ATTEMPT % 5)) -eq 0 ]; then
        echo "等待中... ($ATTEMPT/$MAX_ATTEMPTS 秒)"
    fi
    
    sleep 1
done

echo ""
echo "=========================================="
echo "❌ 超时: MySQL 未能在 $MAX_ATTEMPTS 秒内启动"
echo "=========================================="
echo ""
echo "请检查:"
echo "1. MySQL 是否已正确安装"
echo "2. MySQL 服务是否能够正常启动"
echo "3. 查看 MySQL 错误日志"
echo ""
echo "详细指南: database/WINDOWS_MYSQL_SETUP.md"
exit 1
