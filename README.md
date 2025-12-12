# LogiTrack Pro - 前后端分离架构

完整的物流询价管理系统，采用现代化的前后端分离架构，支持 MySQL 持久化存储。

## 🎯 快速开始

**完整部署指南**: 查看 [DEPLOYMENT.md](DEPLOYMENT.md)  
**数据库迁移**: 查看 [database/MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md)

## 项目结构

```
LogiTrack-/
├── logitrack-pro/          # 前端 (React + TypeScript + Vite)
│   ├── components/         # React 组件
│   ├── services/          # API 服务层
│   ├── App.tsx            # 主应用
│   └── package.json       # 前端依赖
│
├── backend/               # 后端 (Spring Boot + Java)
│   ├── src/main/java/     # Java 源代码
│   ├── src/main/resources/# 配置文件
│   ├── pom.xml           # Maven 依赖
│   ├── start-backend.sh  # 启动脚本
│   └── README.md         # 后端文档
│
├── database/              # 数据库脚本
│   ├── schema.sql        # MySQL 建表脚本
│   ├── import_csv.py     # CSV 数据导入
│   ├── setup-mysql.sh    # 自动化部署
│   └── MIGRATION_GUIDE.md# 迁移指南
│
├── Test.csv              # 原始数据文件
├── DEPLOYMENT.md         # 完整部署文档
└── README.md             # 本文件
```

## 技术栈

### 前端
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

### 后端
- **Java 17/21** - 编程语言
- **Spring Boot 3.2** - 应用框架
- **Spring Data JPA** - 数据访问
- **MySQL 8.0+** - 关系型数据库（生产）
- **H2 Database** - 内存数据库（开发/测试）
- **Maven** - 依赖管理
- **Lombok** - 简化代码

## 快速开始

### 前置要求

**前端:**
- Node.js 18+ 
- npm 或 yarn

**后端:**
- Java 17+
- Maven 3.6+
- MySQL 8.0+（生产环境）

### 🚀 方式一：使用 MySQL（推荐生产环境）

#### 1. 创建数据库和导入数据

```bash
# 自动化部署（推荐）
cd database
./setup-mysql.sh

# 或手动执行
mysql -u root -p123456 < database/schema.sql
cd database && python import_csv.py
```

#### 2. 启动后端

```bash
cd backend
./start-backend.sh
```

后端将运行在 `http://localhost:8080`，连接到 MySQL 数据库

#### 3. 启动前端

```bash
cd logitrack-pro
npm install
npm run dev
```

前端将运行在 `http://localhost:3000`

#### 4. 访问应用

浏览器打开: `http://localhost:3000`

### 💡 方式二：使用 H2 内存数据库（开发/测试）

如果暂时没有 MySQL，可以切换到 H2 内存数据库：

编辑 `backend/src/main/resources/application.properties`:
```properties
# 注释 MySQL 配置
#spring.datasource.url=jdbc:mysql://localhost:3306/logitrack
#spring.datasource.username=root
#spring.datasource.password=123456
#spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# 启用 H2 配置
spring.datasource.url=jdbc:h2:mem:logitrack
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.h2.console.enabled=true
```

然后正常启动后端即可。

**注意**: H2 数据在重启后会丢失。

## 架构说明

### 前后端交互流程

```
前端 (React)                    后端 (Spring Boot)
    │                                  │
    │  HTTP Request (Fetch API)       │
    │ ──────────────────────────────> │
    │                                  │
    │        /api/enquiries            │
    │                              Controller
    │                                  │
    │                              Service
    │                                  │
    │                              Repository
    │                                  │
    │  HTTP Response (JSON)            │
    │ <────────────────────────────── │
    │                              Database
```

### API 端点

所有 API 端点都以 `/api` 为前缀：

- `GET /api/enquiries` - 获取所有记录
- `POST /api/enquiries` - 创建新记录
- `PUT /api/enquiries/{id}` - 更新记录
- `DELETE /api/enquiries/{id}` - 删除记录

完整 API 文档请参考 `backend/README.md`

### 数据流

1. **用户操作** → 前端 React 组件
2. **调用 API** → `services/dataService.ts`
3. **HTTP 请求** → 后端 Spring Boot
4. **Controller** → 接收请求
5. **Service** → 处理业务逻辑
6. **Repository** → 数据库操作
7. **返回数据** → 通过 JSON 返回前端
8. **更新 UI** → React 重新渲染

## 配置

### 切换模式

前端可以在 Mock 数据和真实 API 之间切换：

编辑 `logitrack-pro/services/dataService.ts`:

```typescript
// 使用真实后端 API
const USE_MOCK_DATA = false;

// 使用 Mock 数据（无需后端）
const USE_MOCK_DATA = true;
```

### 修改端口

**后端端口** (默认 8080):

编辑 `backend/src/main/resources/application.properties`:
```properties
server.port=8081
```

**前端端口** (默认 5173):

编辑 `logitrack-pro/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000
  }
})
```

⚠️ 修改端口后，需要同步更新：
- 前端的 `dataService.ts` 中的 `API_BASE_URL`
- 后端的 `WebConfig.java` 中的 CORS 配置

## 开发指南

### 添加新功能

1. **定义数据结构**
   - 前端: 更新 `types.ts`
   - 后端: 更新 `EnquiryRecord.java`

2. **创建 API 端点**
   - 在 `EnquiryController.java` 添加新方法

3. **更新前端服务**
   - 在 `dataService.ts` 添加 API 调用

4. **更新 UI 组件**
   - 修改相关 React 组件

### 调试技巧

**前端调试:**
- 使用浏览器开发者工具
- 查看 Network 标签页监控 API 请求

**后端调试:**
- 查看终端日志输出
- 访问 H2 控制台: `http://localhost:8080/h2-console`

**CORS 问题:**
- 确保后端 `WebConfig.java` 包含前端 URL
- 检查浏览器控制台的错误信息

## 构建生产版本

### 构建前端

```bash
cd logitrack-pro
npm run build
```

生成的文件在 `logitrack-pro/dist/` 目录

### 构建后端

```bash
cd backend
mvn clean package -DskipTests
```

生成的 JAR 文件: `backend/target/logitrack-backend-1.0.0.jar`

### 运行生产版本

```bash
# 运行后端
java -jar backend/target/logitrack-backend-1.0.0.jar

# 部署前端
# 将 dist/ 目录部署到 Nginx 或其他 Web 服务器
```

## 项目特性

✅ 现代化前后端分离架构  
✅ RESTful API 设计  
✅ TypeScript 类型安全  
✅ 响应式 UI 设计  
✅ CRUD 完整功能  
✅ 实时数据同步  
✅ 跨域资源共享 (CORS) 配置  
✅ 数据验证和错误处理  
✅ MySQL 持久化存储（生产）  
✅ H2 内存数据库（开发/测试）  
✅ CSV 数据导入支持  
✅ 完整的数据表结构（33 字段）  
✅ 自动化部署脚本  
✅ HikariCP 连接池优化  

## 常见问题

### 1. MySQL 连接失败

```bash
# 测试 MySQL 连接
cd backend
./test-mysql-connection.sh

# 检查 MySQL 服务
sudo systemctl status mysql
```

详细排查: 参见 [DEPLOYMENT.md](DEPLOYMENT.md) 故障排除章节

### 2. 前端无法连接后端

- 确保后端已启动 (`http://localhost:8080`)
- 检查 `dataService.ts` 中 `USE_MOCK_DATA = false`
- 检查浏览器控制台的 CORS 错误
- 验证 API 端点: `curl http://localhost:8080/api/enquiries`

### 3. CSV 数据导入失败

```bash
# 使用 Python 脚本导入
cd database
pip install pandas mysql-connector-python
python import_csv.py
```

常见原因:
- 日期格式不正确（应为 "2-Jan-24" 格式）
- CSV 编码问题（需要 UTF-8）
- 数值字段中包含逗号分隔符

### 4. 表不存在错误

```bash
# 重新创建表
mysql -u root -p123456 logitrack < database/schema.sql

# 验证表存在
mysql -u root -p123456 logitrack -e "SHOW TABLES;"
```

### 5. 编译错误

**前端:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**后端:**
```bash
cd backend
mvn clean install
```

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [DEPLOYMENT.md](DEPLOYMENT.md) | 完整部署指南，包含系统要求、配置详解、故障排除 |
| [database/MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md) | MySQL 迁移步骤、数据导入、备份恢复 |
| [backend/README.md](backend/README.md) | 后端 API 文档、架构说明 |
| [logitrack-pro/README.md](logitrack-pro/README.md) | 前端组件说明、开发指南 |

## 后续改进建议

- [x] 集成 MySQL 数据库持久化
- [x] CSV 数据批量导入
- [x] 完整的 33 字段表结构
- [ ] 添加用户认证和授权 (JWT)
- [ ] 实现分页和高级搜索
- [ ] 添加数据导出功能 (Excel/PDF)
- [ ] 添加单元测试和集成测试
- [ ] 实现文件上传功能
- [ ] 添加数据统计和图表
- [ ] 实现 WebSocket 实时通知
- [ ] 配置 Redis 缓存
- [ ] 数据库读写分离

## 数据库字段说明

系统支持完整的 33 个字段，完全匹配 CSV 文件结构：

**核心字段**: 询价日期、签发日期、参考编号、产品、状态  
**人员管理**: 定价管理员、销售国家、销售办公室、销售负责人  
**货物信息**: 货物类型、体积、数量、商品名、危险品标识  
**路线信息**: 起运港(POL)、目的港(POD)、目的国家  
**报价信息**: 首次报价、最新报价（海运/空运）  
**业务分类**: CORE/NON CORE、服务类别  
**状态跟踪**: 预订确认、拒绝原因、实际原因

完整字段列表请参考 `database/schema.sql`

## 许可证

MIT License

## 支持

如有问题，请查看：
- 📖 完整部署文档: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🗄️ 数据库迁移: [database/MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md)
- 🔧 后端 API: [backend/README.md](backend/README.md)
- 🎨 前端组件: [logitrack-pro/README.md](logitrack-pro/README.md)