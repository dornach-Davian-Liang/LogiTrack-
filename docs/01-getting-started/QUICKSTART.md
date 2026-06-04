# LogiTrack Pro - 快速启动指南

> **最后更新**: 2026-02-28 | **版本**: v2.0 完整版 | **状态**: ✅ 生产就绪

## 🎯 项目概述

LogiTrack Pro 是一个企业级物流询价管理系统，采用现代化的前后端分离架构。

### ✨ 核心功能
- 🔐 **RBAC权限系统** - 用户、角色、权限管理
- 📋 **询价管理** - 支持多港口(多POL/POD)的询价单
- 📊 **智能报表** - Dashboard、对比分析、趋势统计
- 🌍 **国际化支持** - 完整的中英文翻译
- 📅 **日期选择器** - 优化的日期/时间选择体验
- 📝 **审计日志** - 完整的操作审计和变更跟踪
- 🚀 **高性能** - 虚拟化列表、优化查询、缓存支持
- 👤 **用户管理** - 完整的用户生命周期管理

### 📱 技术栈

| 项目 | 技术 | 版本 |
|------|------|------|
| **前端** | React + TypeScript + Vite | React 19, TS 5.8, Vite 6.2 |
| **样式** | Tailwind CSS | 内置 |
| **图标** | Lucide React | 0.554.0 |
| **表格** | React Window | 1.8.10 |
| **图表** | Recharts | 3.7.0 |
| **日期** | React DatePicker | 9.1.0 |
| **后端** | Java + Spring Boot | Java 17+, Spring Boot 3.2 |
| **ORM** | JPA/Hibernate | Hibernate |
| **数据库** | MySQL | 8.0+ |
| **构建** | Maven | 3.6+ |

## 📋 前置要求

### 硬件要求
- CPU: 2核心及以上
- 内存: 4GB及以上
- 硬盘: 10GB空余空间

### 软件要求

**前端开发环境**
- Node.js 18+ 
- npm 8+ 或 yarn 3+

**后端开发环境**
- Java 17+ (推荐Java 21)
- Maven 3.6+
- MySQL 8.0+ 或 Docker

**系统工具**
- Git
- Docker (可选，用于MySQL容器)

## 🚀 快速启动（3步，5分钟搞定）

### Windows 一键启动（推荐）

在项目根目录执行：

```powershell
.\start-all.ps1
```

可选参数：

```powershell
# 首次初始化数据库表结构
.\start-all.ps1 -InitSchema

# 自动释放 8080/3000 端口占用后再启动
.\start-all.ps1 -ForceKillPorts

# 跳过 npm install（依赖已就绪时）
.\start-all.ps1 -SkipFrontendInstall
```

脚本内置常见问题兜底：
- 自动检查 Java/Maven/Node/npm/mysql 是否安装
- `npm install` 失败时自动回退到 `--legacy-peer-deps`
- 检测到 `react-is` 缺失时自动安装并重启前端
- 自动输出 `.logs` 日志路径用于排障

### 方式一：Docker + 一键启动（推荐）

#### 第0步：克隆仓库并检查环境

```bash
cd LogiTrack-update-status-report-20260126023903
# 或使用 git clone 命令

# 检查环境（可选）
java -version        # 需要Java 17+
mvn --version        # 需要Maven 3.6+
node --version       # 需要Node.js 18+
docker --version     # 可选，用于MySQL
```

#### 第1步：启动MySQL（Docker）

```bash
cd database
chmod +x start-mysql-docker.sh
./start-mysql-docker.sh
# 等待 "MySQL Server started" 消息
sleep 5
```

Windows PowerShell 如未安装 `bash`，请改用本地 MySQL 方式：

```powershell
mysql -u root -pldf123 -e "CREATE DATABASE IF NOT EXISTS logitrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -pldf123 --database=logitrack --execute="source C:/logitrack/LogiTrack--update-status-report-20260126023903/database/schema.sql"
```

MySQL连接信息:
- 主机: localhost
- 端口: 3306
- 数据库: logitrack
- 用户: root
- 密码: ldf123

#### 第2步：启动后端（8080端口）

```bash
cd backend

# 首次编译（耗时1-2分钟）
mvn clean package -DskipTests

# 启动应用
java -jar target/logitrack-backend-1.0.0.jar

# 看到以下消息表示启动成功:
# ✅ "Started LogiTrackApplication in X.XXX seconds"
# ✅ "HikariPool initialized with 5 connections"
```

**健康检查**
```bash
# 新窗口执行
curl http://localhost:8080/api/enquiries
# 应返回: JSON 列表数据（HTTP 200）
```

#### 第3步：启动前端（3000端口）

```bash
# 打开新终端窗口
cd logitrack-pro

# 首次安装依赖（耗时1-2分钟）
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev

# 看到以下消息表示启动成功:
# ✅ "VITE vX.X.X ready in XXX ms"
# ✅ "Local: http://localhost:3000"
```

### 🌐 访问应用

**前端**: http://localhost:3000  
**后端API**: http://localhost:8080  
**数据库**: localhost:3306 (MySQL)

## 🔐 首次登录

系统已预配置示例账户（可选，通常直接进入）：

| 账户 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 超级管理员 |
| sales | sales123 | 销售经理 |
| user | user123 | 普通用户 |

> 注意：首次启动时系统会自动创建示例数据

## 📊 系统功能快览

### 主要模块

1. **询价管理**
   - 创建、编辑、删除询价单
   - 支持多装货港(POL)和多卸货港(POD)
   - 自动计算TEU
   - 支持集装箱明细

2. **报表仪表板**
   - 关键指标统计
   - 周期对比分析  
   - 地区销售分析
   - 趋势图表展示

3. **用户管理**
   - 用户创建/编辑/删除
   - 角色分配
   - 权限管理
   - 批量操作

4. **审计日志**
   - 完整的操作记录
   - 前后对比展示
   - 高级搜索过滤
   - 导出功能

5. **主数据管理**
   - 港口管理
   - 销售人员管理
   - 国家/地区管理
   - 箱型管理

### 语言切换

系统支持中英文双语：
- 点击右上角语言按钮
- 选择中文(zh) 或 English(en)
- 即时切换，无需刷新

## ✅ 验证系统正常运行

### 功能测试列表

- [ ] 访问首页，看到Dashboard
- [ ] 创建新的询价单 (Create Enquiry)
- [ ] 填写完整表单（含多个POL/POD）
- [ ] 保存并验证数据已成功
- [ ] 编辑刚创建的询价单
- [ ] 切换到中文/英文，验证翻译
- [ ] 点击"Settings"进入用户管理
- [ ] 查看审计日志
- [ ] 检查Dashboard报表数据

## 🔧 常见问题

### Q1: MySQL连接失败

**错误信息**: `Connection refused: connect`

**解决方案**:
```bash
# 检查MySQL是否运行
docker ps | grep mysql

# 重启MySQL
docker restart logitrack-mysql
```

### Q2: 后端编译失败

**错误信息**: `BUILD FAILURE`

**解决方案**:
```bash
cd backend
mvn clean install -DskipTests

# 检查Java版本
java -version  # 需要17+
```

### Q3: 前端依赖问题

**错误信息**: `npm ERR! code ERESOLVE` 或 `Could not resolve "react-is"`

**解决方案**:
```bash
cd logitrack-pro
npm cache clean --force
npm install --legacy-peer-deps
npm install react-is --save --legacy-peer-deps
```

### Q4: 端口已被占用

**错误信息**: `Address already in use`

**解决方案**:
```bash
# 查找并关闭占用8080的进程
lsof -i :8080
kill -9 <PID>

# Windows PowerShell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Q5: Windows 一键脚本失败

**建议顺序**:
```powershell
# 1) 强制释放端口重试
.\start-all.ps1 -ForceKillPorts

# 2) 重新初始化表结构（首次或表缺失）
.\start-all.ps1 -InitSchema

# 3) 查看日志定位问题
Get-Content .\.logs\backend.err.log -Tail 80
Get-Content .\.logs\frontend.err.log -Tail 80
```

## 📚 相关文档

| 文档 | 用途 |
|------|------|
| [STARTUP.md](STARTUP.md) | 详细启动步骤 |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | 快速参考 |
| [../02-deployment/DEPLOYMENT.md](../02-deployment/DEPLOYMENT.md) | 生产部署 |
| [../../MILESTONE_CHANGELOG.md](../../MILESTONE_CHANGELOG.md) | 代码变更历史 |

---

*更新时间: 2026-02-28*  
*版本: v2.0*  
*维护者: LogiTrack Team*
