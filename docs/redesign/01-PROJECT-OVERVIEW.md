# LogiTrack Pro 询价重构 — 项目总体概览

> **版本**: v2.0  
> **日期**: 2026-03-23  
> **状态**: 需求确认完成，进入开发准备阶段

---

## 1. 项目背景

LogiTrack Pro 是一套物流询价管理系统，用于管理中国到全球的物流询价/报价生命周期。系统于 2025 年 11 月启动，经历 13 个里程碑迭代至今，已具备完整的 CRUD、多港口支持、Dashboard 报表、RBAC 权限、审计日志、AI 数据分析等功能。

本次重构（v2.0）旨在优化核心询价流程，涵盖 **12 项需求变更**，使系统更贴合业务实际操作流程。

---

## 2. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **后端框架** | Spring Boot | 3.2.0 |
| **编程语言** | Java | 17 |
| **ORM** | Spring Data JPA / Hibernate | 6.x |
| **数据库** | MySQL | 8.0 |
| **前端框架** | React | 19.2 |
| **类型系统** | TypeScript | 5.8 |
| **构建工具** | Vite | 6.2 |
| **图表** | Recharts | 3.7 |
| **UI 组件** | Headless UI + Lucide Icons | 2.2 / 0.554 |
| **AI** | DeepSeek/Claude/Kimi (Tool-calling) | — |
| **密码加密** | Spring Security Crypto (BCrypt) | — |

---

## 3. 系统架构

```
┌────────────────────────────────────────────────┐
│                    Browser                      │
│         React 19 + TypeScript 5.8               │
│              Vite Dev Server :3000               │
└────────────────┬───────────────────────────────┘
                 │ /api/* (Vite Proxy)
                 ▼
┌────────────────────────────────────────────────┐
│              Spring Boot :8080                  │
│  ┌──────────┬──────────┬──────────┬──────────┐ │
│  │Controller│ Service  │Repository│  Entity  │ │
│  │  Layer   │  Layer   │  Layer   │  Layer   │ │
│  └──────────┴──────────┴──────────┴──────────┘ │
│  ┌──────────┬──────────┬──────────┐            │
│  │   AOP    │   RBAC   │    AI    │            │
│  │(AuditLog)│(Auth/JWT)│(LLM Chat)│            │
│  └──────────┴──────────┴──────────┘            │
└────────────────┬───────────────────────────────┘
                 │ JDBC (HikariCP)
                 ▼
┌────────────────────────────────────────────────┐
│            MySQL 8.0 (logitrack)                │
│  20+ 表 = 业务表 + 字典表 + RBAC表 + 审计表      │
└────────────────────────────────────────────────┘
```

---

## 4. 当前数据库表清单

### 4.1 业务核心表

| 表名 | 说明 | 关键关系 |
|------|------|----------|
| `enquiry` | 询价主表（50+ 字段） | 1:N → offer, container_line, pol, pod |
| `offer` | 报价表 | N:1 → enquiry |
| `enquiry_container_line` | 箱型明细 | N:1 → enquiry, N:1 → container_types |
| `enquiry_pol` | 询价-起运港关联 | N:1 → enquiry, N:1 → port |
| `enquiry_pod` | 询价-目的港关联 | N:1 → enquiry, N:1 → port |

### 4.2 主数据/字典表

| 表名 | 说明 | 记录数 |
|------|------|--------|
| `country` | 国家（ISO 3166） | ~234 |
| `port` | 港口/机场 | ~42,054 |
| `dict_sales_office` | 销售办公室 | ~280 |
| `sales_pic` | 销售 PIC | ~819 |
| `container_types` | 集装箱类型 | 11 |
| `dict_cn_office` | CN 办公室 | 8 |
| `dict_cargo_type` | 货运类型 | 5 → **改为 4** |
| `dict_product` | 产品类型 | 5 → **改为 7** |
| `dict_uom` | 计量单位 | 5 |
| `dict_category` | 询价分类 | 8 |
| `dict_cn_pricing_admin` | CN 定价管理员 | **将删除** |

### 4.3 系统表

| 表名 | 说明 |
|------|------|
| `user` | 用户（BCrypt 密码） |
| `role` | 角色（ADMIN/OPERATING/NORMAL） |
| `user_role` | 用户-角色关联 |
| `audit_log` | 操作审计日志 |

---

## 5. 当前文件结构

```
LogiTrack/
├── backend/                       # Spring Boot 后端
│   ├── pom.xml
│   └── src/main/java/com/logitrack/backend/
│       ├── entity/                # 17 个 JPA 实体
│       ├── repository/            # Spring Data JPA 仓库
│       ├── service/               # 业务逻辑层
│       ├── controller/            # REST API 控制器
│       ├── config/                # CORS、Web 配置
│       └── resources/
│           └── application.properties
│
├── logitrack-pro/                 # React 前端
│   ├── types.ts                   # 类型定义（692 行）
│   ├── App.tsx                    # 主应用（749 行）
│   ├── services/                  # API 服务层
│   │   ├── api.ts                 # 主 API（1272 行）
│   │   ├── reportApi.ts           # 报表 API
│   │   ├── aiApi.ts               # AI API
│   │   └── settingsApi.ts         # 设置 API
│   ├── components/
│   │   ├── enquiry/               # 询价模块
│   │   │   ├── EnquiryForm.tsx    # 核心表单（1450 行）
│   │   │   ├── EnquiryList.tsx    # 列表
│   │   │   └── EnquiryDetail.tsx  # 详情
│   │   ├── offer/                 # 报价模块
│   │   ├── report/                # 报表模块
│   │   ├── ai/                    # AI 问答
│   │   ├── master-data/           # 主数据管理
│   │   ├── settings/              # 系统设置
│   │   └── common/                # 通用组件
│   └── vite.config.ts             # Vite 配置（代理）
│
├── database/                      # 数据库脚本
│   ├── schema_v2.sql              # V2 表结构
│   ├── migration_*.sql            # 迁移脚本
│   └── import_*.py                # 数据导入脚本
│
└── docs/                          # 文档
```

---

## 6. API 端点总览

### 6.1 核心业务 API

| 模块 | 前缀 | 端点数 | 说明 |
|------|------|--------|------|
| 询价 | `/api/enquiries` | 9 | CRUD + 编号生成 + 按状态查 |
| 报价 | `/api/enquiries/{id}/offers` | 4 | 报价 CRUD |
| 字典 | `/api/dict` | 17 | 所有下拉数据源 |
| 统计 | `/api/statistics` | 6 | 仪表板 + 报表 + 导出 |
| 主数据 | `/api/master` | 16 | 国家/港口/PIC/箱型 CRUD |
| 认证 | `/api/auth` | 3 | 登录 + 权限检查 |
| AI | `/api/ai` | 2 | 健康检查 + 问答 |

### 6.2 RBAC 权限矩阵

| 功能 | ADMIN | OPERATING | NORMAL |
|------|-------|-----------|--------|
| 查看询价列表 | ✅ | ✅ | ✅ |
| 创建/编辑询价 | ✅ | ✅ | ❌ |
| 删除询价 | ✅ | ❌ | ❌ |
| 主数据管理 | ✅ | ✅ | ❌ |
| 报表查看 | ✅ | ✅ | ❌ |
| AI 数据分析 | ✅ | ✅ | ❌ |
| 系统设置 | ✅ | ❌ | ❌ |
| 审计日志 | ✅ | ❌ | ❌ |

---

## 7. 本次重构范围

### 7.1 12 项需求变更总览

| # | 需求 | 变更类型 | 影响面 |
|---|------|----------|--------|
| 1 | Issue Date → Enquiry Created Date | UI 标签 | 低 |
| 2 | Product Type 扩展至 7 种 + 混合模式 | 数据模型 + UI | 高 |
| 3 | Status 重构（5 种状态 + 原因） | 数据模型 + UI + 后端 | 高 |
| 4 | 销售信息级联重构 | 数据模型 + UI | 中 |
| 5 | 删除 CN Office Grouping | 确认保留现状 | 无 |
| 6 | Cargo Type 重构 + Product-Cargo 关联 | 数据模型 + UI + 后端 | 高 |
| 7 | 删除 rejected_reason / actual_reason | 数据模型 | 低 |
| 8 | 多 POL/POD（已实现，确认扩展） | 确认 | 低 |
| 9 | Cargo Information 动态 UI | 前端 UI | 中 |
| 10 | Route Information 混合模式 | 新增数据模型 + UI | 高 |
| 11 | Offer Price Details 矩阵 | **完全重构** | **极高** |
| 12 | Cargo Ready Date 复选框 | UI + 数据模型 | 低 |

### 7.2 关键决策记录

| 决策项 | 决策结果 |
|--------|----------|
| AIR-RAIL-SEA 保留？ | ✅ 保留，缩写 ARS |
| 混合模式 Route Group 最少？ | 至少 1 组 |
| booking_confirmed 字段？ | 删除，用 Status 替代 |
| 销售级联顺序？ | Country → PIC → Office（PIC→Office 自动映射） |
| Product × Cargo 组合？ | 受限组合（见设计文档） |
| 未勾选 Cargo Ready Date？ | 存入创建日期值（非 NULL） |
| 历史数据？ | 清空后重做迁移 |

---

## 8. 预估工时

| 阶段 | 内容 | 天数 |
|------|------|------|
| 阶段 1 | 基础变更（字段重命名、删除） | 2 |
| 阶段 2 | 数据模型变更（Status/Sales/Product/Cargo） | 8 |
| 阶段 3 | 核心 UI 重构（Route/Cargo/Offer 矩阵） | 14-17 |
| 阶段 4 | 测试 & 修复 | 5 |
| **总计** | | **29-32 天** |
