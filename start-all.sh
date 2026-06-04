#!/usr/bin/env bash
set -e

WORKSPACE="/workspaces/LogiTrack-"
cd "$WORKSPACE"

echo "== 启动 LogiTrack 项目（MySQL -> Backend -> Frontend）=="

# 1. 启动 MySQL Docker（仓库已有脚本）
if ! docker ps | grep -q "logitrack-mysql"; then
  echo "启动 MySQL 容器..."
  cd "$WORKSPACE/database"
  ./start-mysql-docker.sh
  echo "等待 MySQL 启动... 10s"
  sleep 10
else
  echo "MySQL 容器已在运行"
fi

# 2. 导入 schema（仅在需要时运行）
# 请在首次部署时解除下面注释
# echo "导入 schema..."
# docker exec -i logitrack-mysql mysql -uroot -pldf123 logitrack < database/schema_v2.sql

# 3. 构建并启动后端
cd "$WORKSPACE/backend"
if [ -f target/logitrack-backend-1.0.0.jar ]; then
  echo "后端 jar 已存在，跳过构建"
else
  echo "构建后端（maven）..."
  mvn clean package -DskipTests
fi
# 杀掉旧进程并启动
pkill -f "java -jar.*logitrack" || true
nohup java -jar target/logitrack-backend-1.0.0.jar --spring.profiles.active=mysql > backend.log 2>&1 &
echo "后端已启动（日志: backend/backend.log）"

# 4. 启动前端
cd "$WORKSPACE/logitrack-pro"
# 安装依赖（如 node_modules 缺失）
if [ ! -d node_modules ]; then
  echo "安装前端依赖..."
  npm install
fi
# 杀掉旧的 vite 进程并启动
pkill -9 vite || true
npm run dev > /tmp/frontend.log 2>&1 &
echo "前端已启动（Vite），日志: /tmp/frontend.log"

# 5. 简短等待并校验
sleep 5
echo "检查后端健康: http://localhost:8888/actuator/health"
curl -s http://localhost:8888/actuator/health || true

echo "检查前端访问: http://localhost:3000"
echo "查看前端日志 tail -n 20 /tmp/frontend.log"

echo "启动完成。若首次运行请按 STARTUP.md 中指导校验并导入 schema。"
