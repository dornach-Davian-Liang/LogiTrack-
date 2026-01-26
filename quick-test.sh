#!/bin/bash

echo "======================================"
echo "LogiTrack Pro - 系统状态检查"
echo "======================================"
echo ""

# 检查MySQL
echo "1️⃣  检查MySQL容器..."
if docker ps | grep -q logitrack-mysql; then
    echo "   ✅ MySQL容器正在运行"
elif docker ps -a | grep -q logitrack-mysql; then
    echo "   ⚠️  MySQL容器已停止，正在启动..."
    docker start logitrack-mysql
    sleep 5
    echo "   ✅ MySQL容器已启动"
else
    echo "   ❌ MySQL容器不存在，请运行: cd database && ./start-mysql-docker.sh"
    exit 1
fi

# 检查后端
echo ""
echo "2️⃣  检查后端服务..."
if ps aux | grep -q "[j]ava.*logitrack"; then
    echo "   ✅ 后端正在运行 (端口 8080)"
else
    echo "   ℹ️  后端未运行"
    echo "   启动命令: cd /workspaces/LogiTrack-/backend && ./start-backend.sh"
fi

# 检查前端依赖
echo ""
echo "3️⃣  检查前端依赖..."
if [ -d "/workspaces/LogiTrack-/logitrack-pro/node_modules" ]; then
    echo "   ✅ 前端依赖已安装"
else
    echo "   ℹ️  前端依赖未安装"
    echo "   安装命令: cd /workspaces/LogiTrack-/logitrack-pro && npm install"
fi

echo ""
echo "======================================"
echo "📝 快速启动步骤:"
echo "======================================"
echo ""
echo "1. 确保在项目根目录: cd /workspaces/LogiTrack-"
echo ""
echo "2. 启动MySQL (如果未运行):"
echo "   cd database"
echo "   ./start-mysql-docker.sh"
echo ""
echo "3. 启动后端:"
echo "   cd /workspaces/LogiTrack-/backend"
echo "   ./start-backend.sh"
echo ""
echo "4. 启动前端 (新终端):"
echo "   cd /workspaces/LogiTrack-/logitrack-pro"
echo "   npm install  # 仅首次需要"
echo "   npm run dev"
echo ""
echo "5. 访问应用: http://localhost:5173"
echo ""
