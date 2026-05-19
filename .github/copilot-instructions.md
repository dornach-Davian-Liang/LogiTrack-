# LogiTrack Pro — Copilot Instructions

> 本文件为 GitHub Copilot 提供项目上下文，帮助生成更精准的代码建议。
> **本工作区包含两个关联项目**，请始终结合两个项目的上下文理解需求。

---

## 0. 双项目工作区说明

本工作区通过 `logitrack-workspace.code-workspace` 同时管理两个关联项目：

| 项目 | 根目录 | 语言/框架 | 端口 |
|------|--------|-----------|------|
| **LogiTrack Pro** | `C:\logitrack\LogiTrack--update-status-report-20260126023903\` | Java/Spring Boot + React/TypeScript | :8080 (API), :3000 (前端) |
| **Email AI Automation** | `C:\Users\Administrator\Desktop\email-ai-automation\` | Python 3.14 + FastAPI | :5100 (监控API) |

### 项目间集成关系

```
Email AI Automation (Python)
  │  MS Graph API → 拉取邮件
  │  AI 分析（DeepSeek LLM）→ 路由决策
  │  → POST /api/enquiries  →  LogiTrack Pro (Spring Boot :8080)
  │  → 写入 MySQL logitrack DB（共享）
  │  → FastAPI :5100 监控 API ← React 前端轮询
  │
  └── Spring Boot ProcessManagerService
        负责启动/停止 Python 进程（subprocess）
```

### 关键关联文件速查

| 关联点 | LogiTrack 侧 | Email AI 侧 |
|--------|-------------|-------------|
| 进程管理 | `backend/.../service/ProcessManagerService.java` | `main.py` (被启动的目标) |
| 监控 API 对接 | `backend/.../controller/ProcessManagerController.java` | `services/monitor_api.py` |
| 建单 API | `backend/.../controller/EnquiryController.java` | `services/logitrack_client.py` |
| 监控前端 | `logitrack-pro/components/settings/monitoring/` | — |
| 监控 API 服务层 | `logitrack-pro/services/monitorApi.ts` | — |
| 共享数据库 | MySQL `logitrack` (localhost:3306) | `services/monitor_db.py` |
| 里程碑文档 | `email-ai-automation_milestone.md` | `docs/PROJECT_STATUS_REPORT.md` |

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

---

## 10. Email AI Automation — 关联项目核心上下文

> 路径: `C:\Users\Administrator\Desktop\email-ai-automation\`  
> 在 Multi-Root Workspace 中名称为 **"Email AI Automation (Python)"**

### 10.1 技术栈

| 技术 | 版本/说明 |
|------|-----------|
| Python | 3.14（通过 `py` launcher 运行） |
| FastAPI | 监控 API，端口 5100，daemon 子线程启动 |
| httpx | HTTP 客户端（调用 Graph API / LLM / LogiTrack） |
| PyMySQL | 写入 MySQL 处理日志 |
| DeepSeek-chat | 主力 LLM，约 11s/封，用于路由决策 |

### 10.2 目录结构

```
email-ai-automation/
├── main.py                      # 主轮询入口（fetch→parse→AI→route→build→forward）
├── config/settings.py           # 所有环境变量（.env 读取）
├── services/
│   ├── graph_client.py          # MS Graph API（拉邮件/附件/转发/回复）
│   ├── email_parser.py          # HTML→纯文本 + VLM 集成
│   ├── ai_analyzer.py           # DeepSeek LLM + 22个 Few-shot Cases
│   ├── router.py                # PIC 路由引擎（10+层优先级规则）
│   ├── skip_checker.py          # 建号拦截（DG/混合/无货量）
│   ├── logitrack_client.py      # POST /api/enquiries 自动建单
│   ├── logitrack_mapper.py      # AI 输出 → LogiTrack payload 映射
│   ├── monitor_api.py           # FastAPI 监控服务（/pyapi/* 端点）
│   ├── monitor_db.py            # 写入 MySQL email_processing_log
│   ├── test_tracker.py          # 去重缓存（tested_emails.json）
│   └── vision_analyzer.py       # VLM 图片提取
└── data/
    ├── pic_routing.json          # PIC 路由配置（branch→国家→收件人）
    ├── tested_emails.json        # 已处理邮件去重记录
    └── logitrack_mapping.json    # LogiTrack 字段映射配置
```

### 10.3 运行模式

| 模式 | 启动参数 | 行为 |
|------|----------|------|
| DRY_RUN | （无参数） | 只分析，不转发，不建单，不标记已读 |
| TEST_FORWARD | `--test-forward` | 转发到测试邮箱，建单（测试库），不标记已读 |
| LIVE | `--forward` + `LIVE_CONFIRMED=true` env | 真实转发（Reply All）+ 标记已读 + 建单（生产库）|

**Spring Boot 通过 `ProcessManagerService.java` 启动 Python 进程**，注入相应参数和环境变量。

### 10.4 关键 API 端点（FastAPI :5100）

| 端点 | 功能 |
|------|------|
| `GET /pyapi/status` | 实时进程状态（模式/运行时间/统计） |
| `POST /pyapi/control/mode` | 切换运行模式（DRY_RUN/TEST_FORWARD/LIVE）|
| `POST /pyapi/replay` | 单封邮件重放 |
| `GET /pyapi/dedup/search` | 搜索去重缓存 |
| `DELETE /pyapi/dedup/{id}` | 删除去重记录（立即生效，main.py 每轮调用 `tracker.reload()`）|
| `GET /pyapi/routing` | 获取 pic_routing.json 摘要 |
| `PUT /pyapi/routing` | 更新路由配置（白名单字段保护）|
| `POST /pyapi/training/cases` | 创建 AI 训练案例（路由纠错）|
| `POST /pyapi/training/inject` | 注入训练案例到 Few-shot |
| `POST /pyapi/training/regression` | 回归测试验证 |

### 10.5 邮件处理流程（main.py）

```
Step 1: Graph API 拉取未读邮件
Step 1.5: 提取 cid: 内联图片（VLM 管线）
Step 2: 解析邮件（HTML→文本，噪音清理）
Step 3: 去重检查（tracker.is_tested()）
Step 4: 构建 AI 输入（含 VLM 图片文本）
Step 5: DeepSeek LLM 分析（返回 26+ 字段）
Step 5.5: VLM 货量回填（内联图片 no_specific_cargo 修正）
Step 6: 非询价邮件跳过
Step 7: SkipChecker（DG/混合/无货量 → 不建单）
Step 8: 路由匹配（router.get_forward_instruction()）
Step 9: LogiTrack 自动建单（失败不阻断转发）
Step 10: 执行转发（TEST_FORWARD→forward_email, LIVE→reply_all_email）
Step 11: 标记已读（仅 LIVE）
Step 12: 写入 tested_emails.json
```

### 10.6 转发邮件格式

```
主题（有 REF）: FW: <CN2604217-S> 40HQ Shenzhen to Riyadh
主题（无 REF）: 原主题不变

正文:
Dear {发件人姓名},

Thanks for your inquiry, will provide the best rate to you soonly.
（或有 REF 时: Thanks for the opportunity. Adding the reference {REF}...）

[This is an automated reply from China Pricing AI]

── 原邮件引用（HTML 格式）──
```

### 10.7 PIC 路由优先级（router.py）

```
Priority 0: 混合运输（SEA+AIR）→ Curtis + Yvonne
Priority 1: 进口中国（POD = China/HK）→ 按 POD 城市推断 branch
Priority 2: 非中国起运（POL≠China/HK）→ SEA→Curtis; AIR→Susana
Priority 3: Tender/Bid（HIGH risk）→ 通用路由矩阵
Priority 5: 无具体货量 → SEA→Curtis+Yvonne+SZhang
Priority 6: 非 Ziegler 发件人 + SHA/NGB + Core → Vivian Li
Priority 7: Ziegler 发件人 → 按 sender_office 国家路由
Priority 8-10: 正常路由 → 按 POD 国家匹配
```

### 10.8 多起运地合并逻辑

当 `multiple_origins=True` 时，`_merge_instructions_by_mode()` 将同运输方式的多条指令合并为一封邮件（TO/CC 去重合并，branch 拼接如 `TSN+TAO`）。

### 10.9 数据库表（共享 logitrack 库）

| 表名 | 用途 |
|------|------|
| `email_processing_log` | 每封邮件处理记录（AI 分析 + 路由指令 + 建单结果）|
| `email_monitor_status` | 服务运行状态快照（定时写入）|

### 10.10 启动命令

```powershell
cd C:\Users\Administrator\Desktop\email-ai-automation

# DRY-RUN（默认）
py main.py

# TEST-FORWARD（转发到测试邮箱）
py main.py --test-forward

# LIVE（真实转发，需二次确认）
$env:LIVE_CONFIRMED="true"; py main.py --forward

# 单次执行
py main.py --once
```
