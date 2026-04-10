# LogiTrack Pro — Copilot Instructions

> 本文件为 GitHub Copilot 提供项目上下文，帮助生成更精准的代码建议。

---

## 1. 项目概述

LogiTrack Pro 是一个**国际物流询价管理系统**，用于管理从客户询价到报价反馈的完整生命周期，支持 FCL / LCL / AIR 三种货运类型，覆盖全球港口和机场。

---

## 2. 系统架构

前后端分离三层架构：

```
React SPA (Vite :3000)
   ↓  /api/*  (Vite proxy → :8080)
Spring Boot REST API (:8080)
   ↓  JDBC / JPA (HikariCP)
MySQL 8.0 (:3306)
```

---

## 3. 技术栈

### 3.1 前端 (`logitrack-pro/`)

| 技术              | 版本   | 用途             |
|-------------------|--------|------------------|
| React             | 19.x   | UI 框架          |
| TypeScript        | 5.8    | 类型安全         |
| Vite              | 6.x    | 构建 / 开发服务器 |
| Tailwind CSS      | 3.4    | 样式             |
| Lucide React      | 0.554  | 图标             |
| Recharts          | 3.7    | 图表可视化       |
| React DatePicker  | 9.1    | 日期选择器       |
| Headless UI       | 2.2    | 无样式组件库     |
| React Window      | 1.8    | 虚拟滚动         |

### 3.2 后端 (`backend/`)

| 技术                  | 版本   | 用途             |
|-----------------------|--------|------------------|
| Java                  | 17     | 编程语言         |
| Spring Boot           | 3.2.0  | 应用框架         |
| Spring Data JPA       | —      | ORM / 数据访问   |
| Hibernate             | 6.x    | JPA 实现         |
| MySQL                 | 8.0    | 生产数据库       |
| H2                    | —      | 开发/测试数据库  |
| Maven                 | 3.6+   | 构建工具         |
| Lombok                | —      | 减少样板代码     |
| BCrypt                | —      | 密码加密         |
| Spring AOP            | —      | 审计日志切面     |
| Jackson               | —      | JSON 序列化      |

### 3.3 AI 集成

| 技术               | 说明                                   |
|--------------------|----------------------------------------|
| DeepSeek V3/Claude | 双模型路由，OpenAI-compatible 接口     |
| Function Calling   | 10 个业务分析函数                      |

---

## 4. 项目目录结构

```
LogiTrack/
├── .github/                # GitHub 配置
│   └── copilot-instructions.md
│
├── logitrack-pro/          # ===== React 前端 =====
│   ├── index.html          # 入口 HTML
│   ├── vite.config.ts      # Vite 配置（含 /api proxy）
│   ├── tailwind.config.js  # Tailwind 配置
│   ├── tsconfig.json       # TypeScript 配置
│   ├── package.json        # 依赖清单
│   ├── types.ts            # 全局 TypeScript 类型定义
│   ├── App.tsx             # 主应用 + 路由
│   ├── services/           # API 服务层
│   │   ├── api.ts          #   询价 / 报价 CRUD
│   │   ├── reportApi.ts    #   报表统计 API
│   │   ├── aiApi.ts        #   AI 问答 API
│   │   └── settingsApi.ts  #   系统设置 API
│   └── components/         # 业务组件
│       ├── enquiry/        #   询价模块
│       ├── offer/          #   报价模块
│       ├── report/         #   报表仪表板
│       ├── ai/             #   AI 问答面板
│       ├── master-data/    #   主数据管理
│       ├── settings/       #   系统设置 / 审计日志
│       └── common/         #   通用组件
│
├── backend/                # ===== Spring Boot 后端 =====
│   ├── pom.xml             # Maven 配置
│   └── src/main/java/com/logitrack/backend/
│       ├── entity/         #   17+ JPA 实体
│       ├── repository/     #   Spring Data JPA 仓库
│       ├── service/        #   业务逻辑层
│       ├── controller/     #   REST 控制器
│       ├── ai/             #   AI 模块（AiChatService, AiAnalysisFunctions）
│       ├── dto/            #   数据传输对象
│       └── config/         #   CORS、Web 配置
│
├── database/               # ===== 数据库脚本 & 迁移 =====
│   ├── schema.sql          #   建表脚本
│   ├── schema_v2.sql       #   V2 建表脚本
│   ├── migration_*.sql     #   迁移脚本
│   ├── import_csv.py       #   CSV 数据导入
│   ├── import_enquiry_data.py  # 询价数据导入
│   ├── import_master_data.py   # 主数据导入
│   └── demo_data.sql       #   演示数据
│
├── docs/                   # ===== 文档体系 =====
│   ├── 01-getting-started/ #   快速开始
│   ├── 02-architecture/    #   架构设计
│   ├── 03-features/        #   功能规格
│   ├── 04-api/             #   API 文档
│   ├── 05-database/        #   数据库文档
│   ├── 06-implementation-reports/ # 实施报告
│   └── redesign/           #   重构设计
│
├── scripts/                # 运维脚本
├── start-all.ps1           # Windows 一键启动
├── start-all.sh            # Linux 一键启动
├── *.csv                   # 源数据 CSV（港口、国家、销售等）
└── README.md               # 项目说明
```

---

## 5. 主要业务模块

### 5.1 询价管理（Enquiry）

核心业务模块，管理从客户询价到报价反馈的完整生命周期。

- **前端**: `EnquiryForm.tsx`, `EnquiryList.tsx`, `EnquiryDetail.tsx`
- **后端**: `EnquiryController` → `EnquiryService` → `EnquiryRepository`
- **API 前缀**: `/api/enquiries`
- **关键实体**: `Enquiry`, `EnquiryContainerLine`, `EnquiryPol`, `EnquiryPod`
- **支持**: 多 POL/POD、多箱型、FCL/LCL/AIR

### 5.2 报价管理（Offer）

管理针对询价的报价响应。

- **前端**: `OfferDialog.tsx`, `OfferManagement.tsx`
- **后端**: `OfferController` → `OfferService`
- **API 前缀**: `/api/offers`

### 5.3 报表仪表板（Report Dashboard）

统计分析面板，含概览卡片、状态分布、月度趋势、国家排名等。

- **前端**: `components/report/Dashboard.tsx`, `StatCard.tsx`, `TrendChart.tsx`, `ComparisonReport.tsx`
- **后端**: `StatisticsController` → `StatisticsService`
- **DTO**: `DashboardStatsDTO`, `StatusBreakdownDTO`, `MonthlyTrendDTO`
- **API 前缀**: `/api/statistics`

### 5.4 RBAC 权限 & 审计日志

基于角色的访问控制 + AOP 自动审计日志。

- **后端**: `AuthController`, `AuditLogController`, `AuditLogAspect`
- **数据库表**: `user`, `role`, `user_role`, `audit_log`
- **密码**: BCrypt 加密
- **审计**: 通过 `@Audit` 注解 + Spring AOP 自动记录

### 5.5 主数据管理（Master Data / Settings）

国家、港口、销售办公室、Sales PIC、容器类型等字典数据的 CRUD。

- **前端**: `components/master-data/`, `components/settings/`
- **API 服务**: `settingsApi.ts`
- **API 前缀**: `/api/dict/*`, `/api/settings/*`
- **关键表**: `country`, `port`, `dict_sales_office`, `sales_pic`, `container_types`

### 5.6 AI 数据分析助手

自然语言问答。后端通过 Function Calling 调用统计函数，AI 生成文字 + 图表回复。

- **后端**: `AiChatController` → `AiChatService` → `AiAnalysisFunctions`
- **前端**: `components/ai/AIChatPanel.tsx`, `services/aiApi.ts`
- **API 前缀**: `/api/ai/chat`, `/api/ai/ping`
- **安全**: AI 仅接收聚合数字，不接触原始敏感字段
- **可用函数** (10个):
  - `get_enquiry_overview` — 询价总览
  - `get_monthly_trend` — 月度趋势
  - `get_cargo_type_breakdown` — 货运类型分布
  - `get_cn_office_performance` — CN 办公室绩效
  - `get_country_ranking` — 国家排名
  - `get_status_distribution` — 状态分布
  - 及其他分析函数

### 5.7 对比分析（Comparison）

多期、多维度数据对比。

- **后端**: `ComparisonService`
- **前端**: `ComparisonReport.tsx`

---

## 6. 设计模式 & 编码规范

### 6.1 后端

- **分层架构**: Controller → Service → Repository
- **DTO 模式**: 层间数据传输使用专用 DTO，不直接暴露 Entity
- **Repository 模式**: Spring Data JPA 接口
- **AOP 切面**: 审计日志自动记录
- **API 风格**: RESTful，JSON 响应
- **包结构**: `com.logitrack.backend.{entity,repository,service,controller,dto,ai,config}`

### 6.2 前端

- **组件化**: 按业务模块组织组件目录
- **服务层**: `services/` 目录封装所有 API 调用
- **类型安全**: 全局 `types.ts` 定义所有 TypeScript 接口
- **样式**: Tailwind CSS utility-first
- **状态管理**: React useState/useEffect（无 Redux）

### 6.3 数据库

- **命名**: 表名 snake_case，主键 `id` (auto_increment)
- **外键**: 引用相关表（如 `pod_country_id` → `country.id`）
- **字符集**: UTF-8 (utf8mb4)
- **字典表**: 前缀 `dict_`（如 `dict_sales_office`）

---

## 7. 启动方式

```bash
# 后端（需要 MySQL 运行）
cd backend
mvn clean package -DskipTests
java -jar target/logitrack-backend-1.0.0.jar

# 前端
cd logitrack-pro
npm install --legacy-peer-deps
npm run dev

# 一键启动
./start-all.ps1          # Windows
./start-all.sh           # Linux/Mac
```

- 前端: http://localhost:3000
- 后端: http://localhost:8080
- API proxy: 前端 `/api/*` → 后端 `:8080`

---

## 8. 数据库连接

默认配置（`application.properties` / `application.yml`）：

| 参数       | 值              |
|-----------|-----------------|
| Host      | localhost:3306  |
| Database  | logitrack       |
| User      | root            |
| Password  | ldf123          |

---

## 9. 关键文件速查

| 用途                  | 路径                                                  |
|-----------------------|-------------------------------------------------------|
| 全局类型定义          | `logitrack-pro/types.ts`                              |
| 前端主入口            | `logitrack-pro/App.tsx`                               |
| Vite 配置             | `logitrack-pro/vite.config.ts`                        |
| 后端 Maven 配置       | `backend/pom.xml`                                     |
| 后端应用配置          | `backend/src/main/resources/application.properties`   |
| 数据库建表脚本        | `database/schema.sql`, `database/schema_v2.sql`       |
| AI 分析函数           | `backend/src/.../ai/AiAnalysisFunctions.java`         |
| 审计切面              | `backend/src/.../config/AuditLogAspect.java`          |
| API 文档              | `docs/04-api/`                                        |
