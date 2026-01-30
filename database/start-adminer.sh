#!/bin/bash

# 启动 Adminer（MySQL 可视化 UI），并确保与 MySQL 在同一 Docker 网络内

set -euo pipefail

NET_NAME="logitrack-net"
MYSQL_CONTAINER="logitrack-mysql"
ADMINER_CONTAINER="adminer"
ADMINER_PORT="8080"

echo "=========================================="
echo "启动 Adminer（MySQL 可视化界面）"
echo "=========================================="
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker 未安装或未运行"
  exit 1
fi

echo "✅ Docker 已安装"

# 确保 MySQL 容器存在
if ! docker ps -a | awk 'NR>1 {print $NF}' | grep -qx "${MYSQL_CONTAINER}"; then
  echo "❌ 未找到 MySQL 容器: ${MYSQL_CONTAINER}"
  echo "   请先执行: ./start-mysql-docker.sh"
  exit 1
fi

# 若 MySQL 未运行则启动
if ! docker ps | awk 'NR>1 {print $NF}' | grep -qx "${MYSQL_CONTAINER}"; then
  echo "🚀 MySQL 未运行，正在启动..."
  docker start "${MYSQL_CONTAINER}" >/dev/null
fi

echo "✅ MySQL 容器正在运行"

# 确保 Adminer 登录用户存在（避免 root 策略/密码输入错误导致 Access denied）
echo "👤 确保数据库用户 'adminer' 已创建并授权..."
docker exec -i "${MYSQL_CONTAINER}" mysql -uroot -pldf123 -e "\
CREATE USER IF NOT EXISTS 'adminer'@'%' IDENTIFIED BY 'ldf123';\
GRANT ALL PRIVILEGES ON logitrack.* TO 'adminer'@'%';\
FLUSH PRIVILEGES;\
" >/dev/null

# 创建/复用网络
if ! docker network ls | awk 'NR>1 {print $2}' | grep -qx "${NET_NAME}"; then
  echo "🌐 创建 Docker 网络: ${NET_NAME}"
  docker network create "${NET_NAME}" >/dev/null
else
  echo "🌐 Docker 网络已存在: ${NET_NAME}"
fi

# 将 MySQL 连接到网络，并设置别名 db（Adminer Server 填 db 即可）
echo "🔗 连接 MySQL 到网络并设置别名 'db'..."
docker network connect --alias db "${NET_NAME}" "${MYSQL_CONTAINER}" 2>/dev/null || true

# 重建 Adminer 容器（保证网络与端口正确）
if docker ps -a | awk 'NR>1 {print $NF}' | grep -qx "${ADMINER_CONTAINER}"; then
  echo "🗑️  删除旧 Adminer 容器..."
  docker rm -f "${ADMINER_CONTAINER}" >/dev/null 2>&1 || true
fi

echo "🚀 启动 Adminer 容器..."
docker run -d \
  --restart unless-stopped \
  --name "${ADMINER_CONTAINER}" \
  --network "${NET_NAME}" \
  -p "${ADMINER_PORT}:8080" \
  adminer >/dev/null

echo ""
echo "=========================================="
echo "✅ Adminer 已启动"
echo "=========================================="
echo ""
echo "🌍 访问地址: http://localhost:${ADMINER_PORT}"
echo ""
echo "🔐 推荐登录信息:"
echo "   Server: db"
echo "   User: adminer"
echo "   Password: ldf123"
echo "   Database: logitrack"
echo ""
echo "（如果你在 Codespaces/远程环境，需要在 VS Code 的 Ports 面板转发 ${ADMINER_PORT} 端口。）"
