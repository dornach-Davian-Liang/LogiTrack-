# LogiTrack Pro - 快速启动指南

## 🎯 项目概述

LogiTrack Pro 是一个现代化的物流询价管理系统，采用前后端分离架构：
- **前端**: React + TypeScript + Vite
- **后端**: Spring Boot + Java + MySQL Database

## 📋 前置要求

### 前端
- Node.js 18+ 
- npm 或 yarn

### 后端
- Java 17+
- Maven 3.6+
- MySQL 8.0+ (或 Docker)

## 🚀 快速启动（3步）

> ⚠️ **重要**: 请确保在项目根目录 `/workspaces/LogiTrack-` 执行以下命令

### 快捷方式: 一键检查系统状态

```bash
# 在项目根目录执行
./quick-test.sh
```

这个脚本会自动检查MySQL、后端和前端的状态，并显示启动步骤。

### 第 0 步: 准备MySQL数据库

```bash
# 如果使用Docker（推荐）
cd database
./start-mysql-docker.sh
./setup-mysql.sh

# MySQL连接信息:
# 主机: localhost
# 端口: 3306
# 数据库: logitrack
# 用户: root
# 密码: ldf123
```

### 第 1 步: 启动后端

```bash
# 确保在项目根目录
cd /workspaces/LogiTrack-

# 启动后端
cd backend
chmod +x start-backend.sh
./start-backend.sh
```

后端将运行在 `http://localhost:8080`

✅ 看到 "Started LogiTrackApplication" 表示启动成功

### 第 2 步: 启动前端

**打开新终端窗口**，然后：

```bash
# 确保在项目根目录
cd /workspaces/LogiTrack-

# 启动前端
cd logitrack-pro
npm install    # 仅首次需要
npm run dev
```

前端将运行在 `http://localhost:5173`

## 🌐 访问应用

打开浏览器访问: **http://localhost:5173**

默认登录：点击登录按钮即可进入（演示模式）

## 📊 功能演示

系统启动后自动包含 5 条示例数据，你可以：

- ✏️ 创建新的询价记录
- 📝 编辑现有记录
- 📋 复制记录
- 🔍 搜索和筛选
- 📈 查看统计仪表板

## 🔧 常见问题

### 1. 端口被占用

**后端 8080 端口冲突**:
```bash
# 修改 backend/src/main/resources/application.properties
server.port=8081

# 同时修改前端 logitrack-pro/services/dataService.ts
const API_BASE_URL = 'http://localhost:8081/api/enquiries'
```

**前端 5173 端口冲突**:
```bash
# 修改 logitrack-pro/vite.config.ts
export default defineConfig({
  server: { port: 3000 }
})
```

### 2. 前端无法连接后端

检查清单：
- ✓ 后端是否已启动 (`http://localhost:8080/api/enquiries`)
- ✓ `dataService.ts` 中 `USE_MOCK_DATA` 是否为 `false`
- ✓ 浏览器控制台是否有 CORS 错误

### 3. Maven 构建失败

```bash
cd backend
mvn clean
mvn install
```

### 4. npm 安装失败

```bash
cd logitrack-pro
rm -rf node_modules package-lock.json
npm install
```

## 📚 API 测试

测试后端 API 是否正常：

```bash
# 获取所有记录
curl http://localhost:8080/api/enquiries

# 创建新记录
curl -X POST http://localhost:8080/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "referenceNumber": "TEST001",
    "product": "SEA",
    "status": "New",
    "salesCountry": "USA"
  }'
```

## 🛠️ 开发工具

### MySQL 数据库

使用Docker连接:
```bash
docker exec -it logitrack-mysql mysql -uroot -pldf123 logitrack
```

连接信息:
- 主机: localhost
- 端口: 3306
- 数据库: logitrack
- 用户名: root
- 密码: ldf123

### 热重载

- 前端: Vite 自动热重载
- 后端: Spring DevTools 自动重启

## 📂 项目结构

```
LogiTrack-/
├── backend/                    # Spring Boot 后端
│   ├── src/main/java/
│   │   └── com/logitrack/backend/
│   │       ├── controller/     # REST API
│   │       ├── service/        # 业务逻辑
│   │       ├── repository/     # 数据访问
│   │       ├── entity/         # 数据模型
│   │       └── config/         # 配置类
│   ├── pom.xml                # Maven 依赖
│   └── start-backend.sh       # 启动脚本
│
└── logitrack-pro/             # React 前端
    ├── components/            # UI 组件
    ├── services/             # API 调用
    ├── App.tsx               # 主应用
    └── package.json          # npm 依赖
```

## 🎨 技术亮点

✅ 前后端完全分离  
✅ RESTful API 设计  
✅ TypeScript 类型安全  
✅ 响应式 UI  
✅ CRUD 完整功能  
✅ 实时数据同步  
✅ CORS 跨域支持  
✅ MySQL 持久化存储  
✅ Docker 容器化部署  

## 📖 详细文档

- 后端详细文档: `backend/README.md`
- 前端详细文档: `logitrack-pro/README.md`
- 项目架构说明: `README.md`

## 🆘 获取帮助

如遇问题：

1. 检查后端日志: 终端输出
2. 检查前端日志: 浏览器控制台 (F12)
3. 查看详细文档: `backend/README.md` 和 `logitrack-pro/README.md`

## 🎉 下一步

现在你可以：

1. 🔍 浏览现有的示例数据
2. ➕ 创建新的询价记录
3. ✏️ 编辑和更新记录
4. 🔎 使用搜索功能
5. 📊 查看统计数据

祝使用愉快！ 🚀
