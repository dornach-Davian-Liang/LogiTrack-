# LogiTrack Pro - 详细启动指南

> **适合人群**: 初次接触项目的开发人员  
> **更新时间**: 2026-02-28  
> **版本**: v2.0 完整版

---

## 📋 目录

1. [前置要求](#前置要求)
2. [方式选择](#方式选择)
3. [方式一：Docker完整启动](#方式一docker完整启动-推荐)
4. [方式二：本地MySQL启动](#方式二本地mysql启动)
5. [启动验证](#启动验证)
6. [系统特性说明](#系统特性说明)
7. [常见问题](#常见问题)
8. [进阶配置](#进阶配置)

---

## 前置要求

### 系统要求

| 项目 | 最低要求 | 推荐配置 |
|------|----------|--------|
| **OS** | Windows/Linux/macOS | Windows 10+ / Ubuntu 20.04+ |
| **CPU** | 2核 | 4核+ |
| **内存** | 4GB | 8GB+ |
| **硬盘** | 10GB | 20GB+ |

### 软件要求

```bash
# 检查是否已安装

# Java 17+ (必需)
java -version

# Maven 3.6+ (必需)
mvn --version

# Node.js 18+ (必需)
node --version
npm --version

# MySQL 8.0+ (可选，可用Docker)
mysql --version

# Docker (可选，推荐用于MySQL)
docker --version
```

---

## 方式选择

```
┌─ 新手或快速装机? ─────────→ 方式一 (Docker) ✨ 推荐
│
├─ 已有本地MySQL? ─────────→ 方式二 (本地MySQL)
│
├─ 开发调试需求? ──────────→ 方式一 (Docker)
│
└─ 生产部署? ────────────→ 查看 docs/02-deployment/
```

---

## 方式一：Docker完整启动（推荐）

### 步骤1：克隆仓库

```bash
# 进入项目目录
cd LogiTrack-update-status-report-20260126023903
ls -la  # 验证项目结构
```

### 步骤2：启动MySQL（Docker）

```bash
cd database
chmod +x start-mysql-docker.sh
./start-mysql-docker.sh

# 验证MySQL运行
docker ps | grep logitrack-mysql
mysql -h 127.0.0.1 -u root -p ldf123 -e "SELECT 1;"
```

Windows PowerShell 如未安装 `bash`，请使用本地 MySQL：

```powershell
mysql -u root -pldf123 -e "CREATE DATABASE IF NOT EXISTS logitrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -pldf123 --database=logitrack --execute="source C:/logitrack/LogiTrack--update-status-report-20260126023903/database/schema.sql"
```

### 步骤3：启动后端（8080端口）

```bash
cd backend
mvn clean package -DskipTests  # 首次需要1-2分钟
java -jar target/logitrack-backend-1.0.0.jar

# 看到 "Started LogiTrackApplication" 表示成功
# 健康检查
curl http://localhost:8080/api/enquiries
```

### 步骤4：启动前端（3000端口）

```bash
# 新终端窗口
cd logitrack-pro
npm install --legacy-peer-deps  # 仅首次需要
npm run dev

# 看到 "Local: http://localhost:3000" 表示成功
```

### 步骤5：访问应用

打开浏览器访问: http://localhost:3000

---

## 方式二：本地MySQL启动

### 前置条件

已在本地安装MySQL 8.0+:

```bash
mysql --version
```

### 步骤1-2：创建数据库

```bash
mysql -u root -p

CREATE DATABASE logitrack CHARACTER SET utf8mb4;
CREATE USER 'logitrack'@'localhost' IDENTIFIED BY 'ldf123';
GRANT ALL PRIVILEGES ON logitrack.* TO 'logitrack'@'localhost';
FLUSH PRIVILEGES;
```

### 步骤3-5：导入Schema并启动

```bash
cd database
mysql -u root -p ldf123 logitrack < schema.sql

# 然后执行步骤3-4启动后端和前端
```

---

## 启动验证

### 验证清单

```bash
✅ MySQL检查
mysql -u root -p ldf123 logitrack -e "SELECT COUNT(*) FROM enquiry;"

✅ 后端检查
curl http://localhost:8080/api/enquiries

✅ API检查
curl http://localhost:8080/api/enquiries

✅ 前端检查
curl http://localhost:3000

✅ 浏览器访问
http://localhost:3000 (应该看到应用界面)
```

### 功能测试

| 功能 | 操作步骤 | 预期结果 |
|------|----------|----------|
| 访问首页 | 打开 http://localhost:3000 | 看到Dashboard |
| 语言切换 | 点击右上角语言按钮 | 能切换中文/English |
| 创建询价 | Create Enquiry → 填表 → Save | 新记录出现 |
| 编辑询价 | 列表 → Edit → 修改 → Save | 修改成功 |
| 查看报表 | Reports → Dashboard | 看到统计数据 |
| 用户管理 | Settings → Users | 看到用户列表 |
| 审计日志 | Settings → Audit Log | 看到操作记录 |

---

## 常见问题

### Q1: Docker未运行

```bash
# Windows/macOS: 打开Docker Desktop
# Ubuntu: sudo systemctl start docker
```

### Q2: MySQL容器启动失败

```bash
docker pull mysql:8.0
docker restart logitrack-mysql
```

### Q3: 后端编译失败

```bash
export MAVEN_OPTS="-Xmx2G"
mvn clean install -DskipTests
```

### Q4: 前端依赖失败

```bash
npm cache clean --force
npm install
```

### Q5: 端口被占用

```bash
# 查找进程
lsof -i :8080
kill -9 <PID>
```

---

## 进阶配置

### 修改数据库连接

编辑 `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://your-host:3306/logitrack
spring.datasource.username=your-user
spring.datasource.password=your-password
```

### 修改端口

```properties
server.port=8000
```

### 调整日志级别

```properties
logging.level.com.logitrack=DEBUG
logging.level.org.springframework.web=INFO
```

---

## 🎉 启动成功标志

```
┌──────────────────────────────────────┐
│ ✅ MySQL 运行在 localhost:3306      │
│ ✅ 后端 http://localhost:8080       │
│ ✅ Dashboard 返回数据               │
│ ✅ 前端 http://localhost:3000       │
│ ✅ Vite 热更新正常                  │
│ ✅ 浏览器能正常加载                 │
│ ✅ 能正常登录并查看数据             │
│ ✅ 所有核心功能可用                 │
└──────────────────────────────────────┘
```

---

## 📚 下一步

- 📖 阅读功能文档：[../03-features/](../03-features/)
- 🧪 运行测试套件：[../04-testing/](../04-testing/)
- 🚀 部署线上环境：[../02-deployment/](../02-deployment/)
- 📝 了解代码历史：[../../MILESTONE_CHANGELOG.md](../../MILESTONE_CHANGELOG.md)

---

*详细启动指南完成于 2026-02-28*
