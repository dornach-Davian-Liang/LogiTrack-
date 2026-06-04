# LogiTrack Pro - 快速参考指南

> **目标受众**: 已熟悉项目的开发人员  
> **更新时间**: 2026-02-28  
> **版本**: v2.0 完整版

---

## 🚀 30秒快速启动

```bash
# 终端1: 数据库
cd database && ./start-mysql-docker.sh

# 终端2: 后端 (8080)
cd backend && mvn clean package -DskipTests && java -jar target/*.jar

# 终端3: 前端 (3000)
cd logitrack-pro && npm install --legacy-peer-deps && npm run dev

# 浏览器访问
open http://localhost:3000
```

---

## � 核心配置

### 后端 (application.properties)

```properties
# 服务配置
server.port=8080
spring.application.name=logitrack-backend

# MySQL数据库
spring.datasource.url=jdbc:mysql://localhost:3306/logitrack
spring.datasource.username=root
spring.datasource.password=ldf123

# Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# HikariCP连接池
spring.datasource.hikari.maximum-pool-size=10
```

### 前端 (vite.config.ts)

```typescript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
```

---

## 🔐 RBAC权限系统

### 内置角色 (5个)

| 角色 | 权限 | 场景 |
|------|------|------|
| SUPER_ADMIN | 所有权限 | 系统管理员 |
| SALES_MANAGER | 销售管理+报表 | 销售主管 |
| SALES | 询价管理 | 销售专员 |
| OPERATOR | 数据操作 | 操作员 |
| GUEST | 只读权限 | 访客 |

### 权限点 (15+个)

```
enquiry:read         # 查看询价
enquiry:create       # 创建询价
enquiry:update       # 编辑询价
enquiry:delete       # 删除询价
report:view          # 查看报表
report:export        # 导出报表
user:manage          # 管理用户
audit:view           # 查看审计
system:config        # 系统配置
```

---

## 📊 主要特性

### 1️⃣ 询价管理

```javascript
// 创建询价
POST /api/enquiries
{
  "referenceNumber": "ENQ-20260228-00001",
  "productType": "FCL",
  "cargoType": "普货",
  "pols": [1, 2],              // 多装货港
  "pods": [3, 4],              // 多卸货港
  "containerLines": [
    { "containerType": "20GP", "quantity": 10 },
    { "containerType": "40GP", "quantity": 5 }
  ]
}

// 获取列表
GET /api/enquiries?page=0&size=20

// 更新
PUT /api/enquiries/123

// 删除
DELETE /api/enquiries/123
```

### 2️⃣ Dashboard报表

```javascript
// 获取仪表板数据
GET /api/statistics/dashboard-overview

// 条件查询
GET /api/statistics/period-comparison?startDate=2026-01-01&endDate=2026-02-28
```

### 3️⃣ 审计日志

```javascript
// 查看审计日志
GET /api/audit-logs?entityType=ENQUIRY&page=0&size=20

// 导出日志
GET /api/audit-logs/export?format=csv
```

### 4️⃣ 用户管理

```javascript
// 获取用户列表
GET /api/users?page=0&size=20

// 创建用户
POST /api/users
{ username, email, password, roles, enabled }

// 更新用户
PUT /api/users/123

// 删除用户
DELETE /api/users/123
```

---

## 🌐 国际化 (i18n)

### 支持语言
- 中文 (zh-CN)
- English (en-US)

### 前端使用

```typescript
const { language, t } = useContext(LanguageContext)

<h1>{t('enquiry.title')}</h1>

<button onClick={() => setLanguage('en')}>English</button>
<button onClick={() => setLanguage('zh')}>中文</button>
```

---

## 🧪 常见API端点

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/enquiries` | 获取询价列表 |
| POST | `/api/enquiries` | 创建询价 |
| PUT | `/api/enquiries/{id}` | 更新询价 |
| DELETE | `/api/enquiries/{id}` | 删除询价 |
| GET | `/api/users` | 获取用户列表 |
| POST | `/api/users` | 创建用户 |
| GET | `/api/audit-logs` | 获取审计日志 |
| GET | `/api/statistics/dashboard-overview` | Dashboard数据 |

---

## 🛠️ 开发命令

### 后端

```bash
mvn clean package -DskipTests    # 构建
java -jar target/*.jar            # 运行
mvn test                          # 测试
```

### 前端

```bash
npm install                       # 安装依赖
npm run dev                       # 开发服务器
npm run build                     # 生产构建
```

### 数据库

```bash
mysql -u root -p ldf123          # 连接
docker ps                         # 查看容器
docker logs logitrack-mysql      # 查看日志
```

---

## ❓ 快速故障排查

### 前后端连接失败

```bash
# 检查后端是否运行
curl http://localhost:8080

# 检查Vite代理配置
cat logitrack-pro/vite.config.ts | grep proxy
```

### 数据库连接失败

```bash
# 测试连接
mysql -h localhost -u root -p ldf123 -e "SELECT 1;"

# 重启MySQL
docker restart logitrack-mysql
```

### 权限拒绝

```bash
# 检查用户角色
curl http://localhost:8080/api/auth/current-user
```

---

## 📚 相关资源

| 资源 | 链接 |
|------|------|
| 详细启动 | [STARTUP.md](STARTUP.md) |
| 部署指南 | [../02-deployment/](../02-deployment/) |
| 功能设计 | [../03-features/](../03-features/) |
| 测试文档 | [../04-testing/](../04-testing/) |
| 代码变更 | [../../MILESTONE_CHANGELOG.md](../../MILESTONE_CHANGELOG.md) |

---

*快速参考完成于 2026-02-28*

