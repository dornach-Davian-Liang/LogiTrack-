# LogiTrack 项目启动指南

本文档面向本地/dev-container 环境，目标是提供可复现、能保证项目启动的步骤、命令与常见问题处理方法。

目录：
- 前提条件
- 启动一键脚本（推荐）
- 手动启动步骤（详细）
- 验证服务是否正常
- 常见问题与解决方法
- 参考脚本与文档

---

**前提条件**
- 操作系统：Linux（dev container 已配置）
- 已安装：Docker、Java 17、Maven、Node.js (16+)
- Docker 容器允许运行（用户有权限）

环境变量/端口：
- MySQL (docker) 3306
- 后端 Spring Boot: 8888
- 前端 Vite: 3000

---

## 一键启动（推荐）
仓库根目录下提供 `start-all.sh`，会按顺序启动 MySQL（若未运行）、后端、前端。

运行：
```bash
cd /workspaces/LogiTrack-
chmod +x start-all.sh
./start-all.sh
```

脚本会：
1. 启动 `database/start-mysql-docker.sh`（若容器未运行）
2. 构建后端（maven package）并以 `java -jar` 启动
3. 启动前端 (`npm run dev`)

首次部署注意：脚本中默认注释了导入 schema 的步骤（以免覆盖已有数据）。如需导入，请在脚本中取消注释并运行。

---

## 手动启动（按步骤详述）

### 1) 启动 MySQL（Docker）
仓库内已有脚本：
```bash
cd /workspaces/LogiTrack-/database
./start-mysql-docker.sh
```
等待容器启动并可连接（建议等待 10s）。

验证：
```bash
docker ps | grep logitrack-mysql
# or
docker exec -i logitrack-mysql mysql -uroot -pldf123 -e "SELECT 1;"
```

如果第一次部署需要初始化 schema：
```bash
docker exec -i logitrack-mysql mysql -uroot -pldf123 logitrack < /workspaces/LogiTrack-/database/schema_v2.sql
# 也可导入 demo 数据
# docker exec -i logitrack-mysql mysql -uroot -pldf123 logitrack < /workspaces/LogiTrack-/database/demo_data.sql
```

### 2) 构建并启动后端
```bash
cd /workspaces/LogiTrack-/backend
mvn clean package -DskipTests
# 杀掉旧进程（若有）
pkill -f "java -jar.*logitrack" || true
nohup java -jar target/logitrack-backend-1.0.0.jar --spring.profiles.active=mysql > backend/backend.log 2>&1 &
```

检查日志（实时）：
```bash
tail -f /workspaces/LogiTrack-/backend/backend.log
```
后端健康检查：
```bash
curl http://localhost:8888/actuator/health
# 期望: {"status":"UP"}
```

### 3) 启动前端
```bash
cd /workspaces/LogiTrack-/logitrack-pro
# 如未安装依赖
npm install
# 启动dev服务器
npm run dev > /tmp/frontend.log 2>&1 &
# 查看日志
tail -f /tmp/frontend.log
```
前端访问： http://localhost:3000

---

## 验证服务是否正常

后端 API 检查：
```bash
curl -s "http://localhost:8888/api/enquiries?page=0&size=1" | jq .
```
期望看到 `totalElements` 字段和 `content` 数组。

数据库检查：
```bash
docker exec -i logitrack-mysql mysql -uroot -pldf123 logitrack -e "SELECT COUNT(*) FROM enquiry;"
```

已有的验证脚本：
- `/workspaces/LogiTrack-/check-system-status.sh` — 快速检查所有服务与基础健康

---

## 常见问题与解决

1) 后端启动失败（编译错误）
- 解决：检查 `mvn` 输出，修复对应的 Java 代码或 Lombok 注解问题，重新打包。

2) MySQL 容器未启动或端口占用
- 解决：确认 docker 有权限并释放 3306 端口，或在 `database/start-mysql-docker.sh` 中调整端口映射。

3) 前端无法访问（vite 停止）
- 解决：查看 `/tmp/frontend.log`，若 `Stopped`，重新运行 `npm run dev`。如缺少依赖，执行 `npm install`。

4) 保存时报错如 `Column 'xxx' cannot be null`
- 解决：检查后端实体与数据库 schema 是否一致，并在 `EnquiryService` 中为必要字段提供默认值或前端保证传值。

---

## 参考文件/脚本
- `start-all.sh` — 一键启动脚本
- `check-system-status.sh` — 系统状态检测脚本
- `database/start-mysql-docker.sh` — 启动 MySQL 容器（仓库已有）
- `BROWSER_TEST_GUIDE.md` — UI 验证步骤
- `COMPLETION_REPORT_20260202.md` / `BUG_FIX_REPORT_20260202.md` — 修复与测试文档

---

若需要，我可以：
- 把 `start-all.sh` 注册为 `Makefile` 中的 `make start` 目标；
- 将启动脚本改为 systemd 服务（仅在需要长期运行时）；
- 为 CI 添加 schema 校验步骤。

请告知是否希望我现在：
- (A) 运行 `./start-all.sh` 启动所有服务（我可以做），
- (B) 或仅生成/保存本说明文件（已完成）。
