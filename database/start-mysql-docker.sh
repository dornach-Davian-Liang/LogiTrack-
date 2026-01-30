#!/bin/bash

# 使用 Docker 快速启动 MySQL 数据库

set -e

RESET=0
if [ "${1:-}" = "--reset" ]; then
    RESET=1
fi

echo "=========================================="
echo "启动 MySQL Docker 容器"
echo "=========================================="
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装或未运行"
    exit 1
fi

echo "✅ Docker 已安装"

# 说明
if [ $RESET -eq 1 ]; then
    echo "⚠️  --reset 已启用：将删除旧容器并重新初始化数据库（会清空数据）"
    echo ""
fi

# 确保数据卷存在（用于持久化 /var/lib/mysql）
MYSQL_VOLUME="logitrack-mysql-data"
if ! docker volume ls | awk 'NR>1 {print $2}' | grep -qx "${MYSQL_VOLUME}"; then
    echo "💾 创建 MySQL 数据卷: ${MYSQL_VOLUME}"
    docker volume create "${MYSQL_VOLUME}" >/dev/null
fi

# 如果容器已存在：默认复用并启动；只有 --reset 才删除重建
if docker ps -a | awk 'NR>1 {print $NF}' | grep -qx logitrack-mysql; then
    if [ $RESET -eq 1 ]; then
        echo "🗑️  删除旧的 MySQL 容器..."
        docker stop logitrack-mysql 2>/dev/null || true
        docker rm logitrack-mysql 2>/dev/null || true
    else
        if docker ps | awk 'NR>1 {print $NF}' | grep -qx logitrack-mysql; then
            echo "✅ MySQL 容器已在运行（复用现有容器与数据卷）"
        else
            echo "🚀 启动已存在的 MySQL 容器（复用现有数据卷）..."
            docker start logitrack-mysql >/dev/null
        fi
    fi
fi

# 若容器不存在则创建
if ! docker ps -a | awk 'NR>1 {print $NF}' | grep -qx logitrack-mysql; then
        echo "🚀 创建并启动 MySQL 8.0 容器..."
        docker run -d \
            --restart unless-stopped \
            --name logitrack-mysql \
            -v "${MYSQL_VOLUME}:/var/lib/mysql" \
            -e MYSQL_ROOT_PASSWORD=ldf123 \
            -e MYSQL_DATABASE=logitrack \
            -e MYSQL_CHARACTER_SET_SERVER=utf8mb4 \
            -e MYSQL_COLLATION_SERVER=utf8mb4_unicode_ci \
            -p 3306:3306 \
            mysql:8.0 \
            --character-set-server=utf8mb4 \
            --collation-server=utf8mb4_unicode_ci \
            --default-authentication-plugin=mysql_native_password
fi

if [ $? -eq 0 ]; then
    echo "✅ MySQL 容器启动成功"
else
    echo "❌ 容器启动失败"
    exit 1
fi

# 等待 MySQL 就绪
echo ""
echo "⏳ 等待 MySQL 初始化（约 30 秒）..."
echo "   (首次运行需要下载镜像，可能需要更长时间)"

# 检查容器状态
for i in {1..60}; do
    if docker exec logitrack-mysql mysqladmin ping -h localhost -u root -pldf123 2>/dev/null | grep -q "mysqld is alive"; then
        echo ""
        echo "✅ MySQL 已就绪！"
        break
    fi
    
    if [ $i -eq 60 ]; then
        echo ""
        echo "❌ MySQL 启动超时"
        echo "查看日志: docker logs logitrack-mysql"
        exit 1
    fi
    
    echo -n "."
    sleep 1
done

# 测试连接
echo ""
echo "🔍 测试数据库连接..."
docker exec logitrack-mysql mysql -uroot -pldf123 -e "SELECT VERSION();"
if [ $? -eq 0 ]; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
    exit 1
fi

# 显示信息
echo ""
echo "=========================================="
echo "✅ MySQL 已启动并就绪！"
echo "=========================================="
echo ""
echo "📋 连接信息:"
echo "   主机: localhost"
echo "   端口: 3306"
echo "   用户: root"
echo "   密码: ldf123"
echo "   数据库: logitrack"
echo ""
echo "🔧 管理命令:"
echo "   查看日志: docker logs logitrack-mysql"
echo "   进入容器: docker exec -it logitrack-mysql bash"
echo "   连接数据库: docker exec -it logitrack-mysql mysql -uroot -pldf123 logitrack"
echo "   停止容器: docker stop logitrack-mysql"
echo "   删除容器: docker rm logitrack-mysql"
echo ""
echo "🚀 下一步:"
echo "   cd /workspaces/LogiTrack-/database && ./setup-mysql.sh"
echo ""
