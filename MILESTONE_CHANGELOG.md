# LogiTrack 项目代码变更里程碑

本文档详细记录了 LogiTrack 项目从初始化到当前版本的所有重要代码变更和功能实现。

---

## 📋 目录

- [里程碑概览](#里程碑概览)
- [详细变更历史](#详细变更历史)
  - [M0: 项目初始化 (2025-11-24)](#m0-项目初始化-2025-11-24)
  - [M1: H2 到 MySQL 迁移 (2025-12-12)](#m1-h2-到-mysql-迁移-2025-12-12)
  - [M2: 部署文档完善 (2025-12-12)](#m2-部署文档完善-2025-12-12)
  - [M3: 数据库设计完善 (2026-01-26)](#m3-数据库设计完善-2026-01-26)
  - [M4: 询价表单对齐 (2026-01-30)](#m4-询价表单对齐-2026-01-30)
  - [M5: 多POL/POD支持 (2026-02-04)](#m5-多polpod支持-2026-02-04)
  - [M6: Dashboard报表模块 (2026-02-09)](#m6-dashboard报表模块-2026-02-09)
  - [M7: RBAC和审计日志 (2026-02-17)](#m7-rbac和审计日志-2026-02-17)
  - [M8: 性能优化 (2026-02-06)](#m8-性能优化-2026-02-06)
  - [M9: 用户管理增强 (2026-02-25)](#m9-用户管理增强-2026-02-25)
  - [M10: 前端Bug修复与功能优化 (2026-03-04)](#m10-前端bug修复与功能优化-2026-03-04)
  - [M11: 历史数据迁移与校验 (2026-03-03)](#m11-历史数据迁移与校验-2026-03-03)
  - [M12: 增强报表弹窗数据修复 (2026-03-04)](#m12-增强报表弹窗数据修复-2026-03-04)
  - [M13: 时期对比报告增强与趋势图表全面升级 (2026-03-04)](#m13-时期对比报告增强与趋势图表全面升级-2026-03-04)
  - [M14: AI 数据分析问答助手 Phase 1-2 (2026-03-12 ~ 2026-03-25)](#m14-ai-数据分析问答助手-phase-1-2-2026-03-12--2026-03-25)
  - [M18: V3 Phase 5 — 用户验收测试 & 功能修复 (2026-03-25)](#m18-v3-phase-5--用户验收测试--功能修复-2026-03-25)
  - [M22: 状态编辑 & 状态流转解锁 (2026-03-26)](#m22-状态编辑--状态流转解锁-2026-03-26)
  - [M23: 主数据重导入 & Status自动选择逻辑修正 (2026-03-27)](#m23-主数据重导入--status自动选择逻辑修正--polpod显示名称-2026-03-27)
  - [M24: 询价表单Bug修复 — 日期+CARRIER列+CORE联动+搜索 (2026-03-31)](#m24-询价表单-bug-修复--日期显示--carrier-列--pod-core-联动--sales-pic-搜索-2026-03-31)
  - [M25: Carrier主数据管理 & 表单分区重排 (2026-03-31)](#m25-carrier-主数据管理--表单分区重排--carrier-数据库驱动-2026-03-31)
  - [M26: 货币管理 & 动态柜型 & 询价列表过滤 & 多项Bug修复 (2026-04-09)](#m26-货币管理--动态柜型-extracontainers--询价列表过滤--多项bug修复-2026-04-09)
  - [M27: 全尺寸20尺柜型Weight支持 & Dashboard优化 & Detail展示增强 (2026-04-10)](#m27-全尺寸20尺柜型weight支持--dashboard优化--detail展示增强-2026-04-10)
  - [M28: RBAC权限重构 — 新增SALES\_MANAGER角色 & CN Pricing Operator权限缩小 (2026-04-13)](#m28-rbac权限重构--新增sales_manager角色--cn-pricing-operator权限缩小-2026-04-13)
  - [M29: 全量数据迁移 — Chinese Pricing CSV 导入 (2026-04-16)](#m29-全量数据迁移--chinese-pricing-csv-导入-2026-04-16)
  - [M30: 增量数据迁移 & 异常修复 — 新增 Office/PIC + 重试失败记录 (2026-04-16)](#m30-增量数据迁移--异常修复--新增-officepic--重试失败记录-2026-04-16)
  - [M31: 增量迁移 CN2604038+ & 状态同步 & 补录 Office/PIC & 重试 3 条异常 (2026-04-24)](#m31-增量迁移-cn2604038--状态同步--补录-officepic--重试-3-条异常-2026-04-24)
  - [M32: Enquiry 管理增强与关键缺陷修复（筛选/导出/权限/币种）(2026-04-23 ~ 2026-04-27)](#m32-enquiry-管理增强与关键缺陷修复筛选导出权限币种2026-04-23--2026-04-27)
  - [M33: Web 监控面板 Phase 1 — 基础设施 + Dashboard (2026-05-08)](#m33-web-监控面板-phase-1--基础设施--dashboard-2026-05-08)
  - [M35: Web 监控面板 Phase 3 — 调试控制面板 (2026-05-08)](#m35-web-监控面板-phase-3--调试控制面板-2026-05-08)
  - [M36: Web 监控面板 Phase 4 — 配置查看器 (2026-05-08)](#m36-web-监控面板-phase-4--配置查看器-2026-05-08)
  - [M37: Email AI UAT 路由 Bug 修复 + §12 AI 字段增强 + DRY-RUN 建单模式 (2026-05-11)](#m37-email-ai-uat-路由-bug-修复--12-ai-字段增强--dry-run-建单模式-2026-05-11)
  - [M38: Web 监控面板 Phase 5 — 服务管理 + 监控面板全面增强 + 路由配置编辑器 (2026-05-11)](#m38-web-监控面板-phase-5--服务管理--监控面板全面增强--路由配置编辑器-2026-05-11)
  - [M39: TEST_FORWARD UAT Bug 修复 + 邮件转发格式升级 (2026-05-13)](#m39-test_forward-uat-bug-修复--邮件转发格式升级-2026-05-13)
  - [M41: 已建号 FOLLOW_UP 边界修正 + Few-shot 训练状态同步 (2026-05-19)](#m41-已建号-follow_up-边界修正--few-shot-训练状态同步-2026-05-19)
  - [M42: AI 训练前端接入 + 远程访问验证脚本 (2026-05-19)](#m42-ai-训练前端接入--远程访问验证脚本-2026-05-19)
  - [M43: 监控补强 + 路由扩展性 + sender_name 解析增强 (2026-05-19)](#m43-监控补强--路由扩展性--sender_name-解析增强-2026-05-19)
  - [M46: 转发稳定性 + no_specific_cargo 边界 + sender_name 兜底收敛 (2026-05-20 ~ 2026-05-21)](#m46-转发稳定性--no_specific_cargo-边界--sender_name-兜底收敛-2026-05-20--2026-05-21)
  - [M47: LLM 成本控制与 LIVE 可靠性补强 (2026-05-21)](#m47-llm-成本控制与-live-可靠性补强-2026-05-21)
  - [M48: Enquiry 审核导出补强 + Category 扩展 + SZX-LCL 路由持久化 (2026-05-21)](#m48-enquiry-审核导出补强--category-扩展--szx-lcl-路由持久化-2026-05-21)

---

## 里程碑概览

| 里程碑 | 日期 | 提交Hash | 核心功能 | 影响文件数 |
|--------|------|----------|----------|-----------|
| M0 | 2025-11-24 | fe38692 | 项目初始化 | 1 |
| M1 | 2025-12-12 | 797a848 | H2 到 MySQL 迁移 | 50 |
| M2 | 2025-12-12 | e132520/1dc5f21 | 部署文档完善 | 2 |
| M3 | 2026-01-26 | a89aaa6 | 数据库设计完善 | 9 |
| M4 | 2026-01-30 | b8ec5d7/2cf0661 | 询价表单对齐 | 61 |
| M5 | 2026-02-04 | beb0d14 | 多POL/POD支持 | 78 |
| M6 | 2026-02-09 | c141c9a | Dashboard报表模块 | 24 |
| M7 | 2026-02-17 | 5b577e9 | RBAC和审计日志 | 62 |
| M8 | 2026-02-06 | a3b51e6 | 性能优化 | 6 |
| M9 | 2026-02-25 | 3d43cae | 用户管理增强 | 84 |
| M10 | 2026-03-04 | - | 前端Bug修复与功能优化 | 6 |
| M11 | 2026-03-03 | - | 历史数据迁移与多港口修复 | 5 |
| M12 | 2026-03-04 | - | 增强报表弹窗数据修复 | 4 |
| M13 | 2026-03-04 | - | 时期对比报告增强与趋势图表全面升级 | 3 |
| M14 | 2026-03-12 ~ 03-25 | - | AI 数据分析问答助手 Phase 1-2（Function Calling + Chat UI + Recharts 图表 + 报表跳转） | 7 |
| M14-V3 | 2026-03-01 ~ 03-25 | - | V3重大重构: 30天实施计划 Phase 1-3 (Day 1-25) | ~50 |
| M15 | 2026-03-26 | - | V3 Phase 4.1: 功能测试 + Bug修复 + 类型对齐 (Day 26-27) | 15 |
| M16 | 2026-03-24 | - | V3 Phase 4.2: 集成测试 + 回归 + 状态映射修复 (Day 28-29) | 8 |
| M17 | 2026-03-24 | - | V3 Phase 4.3: 最终审计 + 上线准备 (Day 30) | 7 |
| M18 | 2026-03-25 | - | V3 Phase 5: 用户验收测试 + OfferPriceTable 重写 + 混合模式修复 | 6 |
| M22 | 2026-03-26 | - | 状态编辑 & 状态流转解锁: Edit页Status/Reason可编辑 + 终态可回退 | 4 |
| M23 | 2026-03-27 | - | 主数据重导入 + Status自动选择基于实际报价 + POL/POD显示名称修复 | 4 |
| M24 | 2026-03-31 | - | 日期显示修复 + CARRIER列 + POD CORE联动 + Sales PIC搜索下拉 | 7 |
| M25 | 2026-03-31 | - | Carrier主数据CRUD管理页面 + Business Classification分区重排 + CARRIER数据库驱动 | 10 |
| M26 | 2026-04-09 | - | 货币管理全栈 + 动态柜型extraContainers + 询价列表POL/POD/Office过滤 + Ref#竞态修复 + Price Lines数据保持修复 + Route Groups端口预加载修复 | 12 |
| M27 | 2026-04-10 | - | 全系20尺柜型Weight输入支持（前端+后端+DB）+ Dashboard Recent Enquiries排序优化+KPI清除 + EnquiryDetail重量数据展示 | 6 |
| M28 | 2026-04-13 | - | RBAC权限重构：新增SALES_MANAGER角色，OPERATING_USER限制为不可Reports | 4 |
| M29 | 2026-04-16 | - | 全量数据迁移：Chinese Pricing CSV → MySQL，9,253/9,265 行成功 | 5 |
| M30 | 2026-04-16 | - | 增量迁移 + 异常修复：3 个 Office + 4 个 PIC，9 条异常全部 RESOLVED | 2 |
| M31 | 2026-04-24 | - | 增量迁移 CN2604038+(224行) + 状态同步 297 条 + 补录 3 Office/8 PIC + 重试 3 异常 | 2 |
| M32 | 2026-04-23 ~ 04-27 | - | Enquiry 管理增强：Created Date 筛选 + CN Office 多选 + XLSX 全字段导出 + Sender Email + 报表弹窗字段修复 + 权限修正 + 非 FCL 币种选择显示 | 17 |
| M33 | 2026-05-08 | - | Web 监控面板 Phase 1：MySQL 数据管线 + Python FastAPI 进程状态 API + Spring Boot 监控控制器 + 前端实时 Dashboard | 22 |
| M35 | 2026-05-08 | - | Web 监控面板 Phase 3：调试控制面板（模式切换 / 单封重放 / 日志级别 / SkipChecker & Router 测试）| 8 |
| M36 | 2026-05-08 | - | Web 监控面板 Phase 4：配置查看器（只读 API 状态 + 连接测试 + 跳过规则展示）| 4 |
| M37 | 2026-05-11 | - | Email AI UAT Bug 修复（GIF/VLM / CALLAO NON-CORE / AIR no_cargo）+ §12 AI 字段增强（6 新字段 + routing_reason）+ LOGITRACK_DRY_RUN 建单打印模式 | 7 |
| M38 | 2026-05-11 | - | Web 监控面板 Phase 5：服务管理 Tab（Spring Boot ProcessManager + ServiceControl UI）+ AiAnalysisCard/RoutingCard/LogDetailPanel/ReplayPanel 全面增强 + ConfigViewer 路由配置编辑器 | 14 |
| M39 | 2026-05-13 | - | TEST_FORWARD UAT Bug 修复（B23-B27）+ 邮件转发双模板（有/无 REF）+ HTML Body 升级 + 多分支路由合并 + 去重缓存热更新 + 邮件正文清突化 | 6 |
| M40 | 2026-05-15 | - | 附件随转发（B29）+ 杭州/浙江城市映射修正（B28/B30）+ 对话链去重改 message_id（B31）+ 多票货 B3 拆单架构（B32） | 5 |
| M41 | 2026-05-19 | - | Sea-Completed 真实案例复盘：已建号主题强制 FOLLOW_UP（B33）+ 同代理新箱型仍建新号 + Few-shot 外部化/训练 API 状态同步 | 4 |
| M42 | 2026-05-19 | - | LogiTrack 监控面板 AI 训练前端接入（Tab/模拟器/回归/纠错向导）+ 远程访问验证脚本与 502 排障结论沉淀 | 7 |
| M43 | 2026-05-19 | - | 监控面板 Ref/BCC 补强（B35/B36）+ 同对话链新询价建号边界修正（B34）+ 省份级 branch 回退与陕西分界（B37）+ sender_name 多来源解析器（B38） | 8 |
| M46 | 2026-05-20 ~ 05-21 | - | 自回复循环重复转发修复（B39）+ inline 签名图片误转发修复（B40）+ FCL 单/双柜型默认 1 柜（B41）+ sender_name 兜底改为 Sender（B42） | 6 |
| M47 | 2026-05-21 | - | LLM 备用 API + thinking=medium + Flash/Pro 混合升级策略 + LIVE 回复模板规范化 + Web 停启重载结论 | 4 |
| M48 | 2026-05-21 | - | Enquiry 管理多选筛选 + 后端 XLSX 导出升级 + Category 新选项 + SZX-LCL 路由拆分与配置持久化 | 12 |

---

## 详细变更历史

### M0: 项目初始化 (2025-11-24)

**提交信息**: `Initial commit`  
**提交Hash**: `fe38692`  
**作者**: Davian Liang  
**日期**: 2025-11-24 09:54:49 +0800

#### 📝 变更说明
创建项目仓库基础结构。

#### 📦 影响文件 (1个)
- `README.md`

---

### M1: H2 到 MySQL 迁移 (2025-12-12)

**提交信息**: `feat: 完整实现 LogiTrack 系统 - H2 到 MySQL 迁移`  
**提交Hash**: `797a848`  
**作者**: Davian Liang  
**日期**: 2025-12-12 08:41:30 +0000

#### 🎯 目标需求
将系统从嵌入式H2数据库迁移到生产级MySQL数据库，实现完整的物流询价管理系统。

#### ✨ 主要功能
1. **数据库迁移**
   - 从 H2 迁移到 MySQL 8.0 (Docker容器)
   - 设计完整的数据库Schema包含36个字段
   - 8个索引优化查询性能
   - 使用 HikariCP 连接池

2. **后端服务**
   - Spring Boot 3.2.0 + JPA/Hibernate
   - 完整的 CRUD 操作
   - RESTful API 设计
   - CORS 配置支持前后端通信

3. **前端应用**
   - React 19 + TypeScript + Vite
   - 响应式表单设计
   - 数据列表展示和筛选
   - Vite 代理解决跨域问题

4. **数据导入**
   - 成功导入 Test.csv (5条记录)
   - Python 脚本自动化导入
   - 数据验证和错误处理

#### 🔧 技术栈
- **数据库**: MySQL 8.0 (Docker)
- **后端**: Spring Boot 3.2.0, Java 21, Maven
- **前端**: React 19, TypeScript 5.8, Vite 6.4
- **ORM**: Hibernate, JPA
- **连接池**: HikariCP

#### 📦 影响文件 (50个)
**后端 (Backend)**
- `backend/pom.xml` - Maven依赖配置
- `backend/src/main/java/com/logitrack/backend/LogiTrackApplication.java` - 主应用类
- `backend/src/main/java/com/logitrack/backend/config/WebConfig.java` - CORS配置
- `backend/src/main/java/com/logitrack/backend/controller/EnquiryController.java` - 询价控制器
- `backend/src/main/java/com/logitrack/backend/entity/EnquiryRecord.java` - 询价实体
- `backend/src/main/java/com/logitrack/backend/repository/EnquiryRepository.java` - 数据仓库
- `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java` - 业务逻辑
- `backend/src/main/resources/application.properties` - 应用配置
- `backend/src/main/resources/application-mysql.properties` - MySQL配置

**前端 (Frontend)**
- `logitrack-pro/App.tsx` - 主应用组件
- `logitrack-pro/components/Form.tsx` - 表单组件
- `logitrack-pro/components/Login.tsx` - 登录组件
- `logitrack-pro/components/Table.tsx` - 表格组件
- `logitrack-pro/services/dataService.ts` - 数据服务
- `logitrack-pro/types.ts` - TypeScript类型定义
- `logitrack-pro/vite.config.ts` - Vite配置
- `logitrack-pro/package.json` - 依赖管理

**数据库 (Database)**
- `database/schema.sql` - 数据库Schema
- `database/import_csv.py` - CSV导入脚本
- `database/import_csv_pymysql.py` - PyMySQL导入脚本
- `database/create_table.py` - 创建表脚本
- `database/check_mysql.py` - MySQL检查脚本
- `database/start-mysql-docker.sh` - MySQL Docker启动脚本
- `database/setup-mysql.sh` - MySQL设置脚本

**文档 (Documentation)**
- `README.md` - 项目说明文档
- `DEPLOYMENT.md` - 部署指南
- `QUICKSTART.md` - 快速开始指南
- `MYSQL_MIGRATION_COMPLETE.md` - 迁移完成报告
- `STATUS_REPORT.md` - 状态报告

#### 🐛 已解决问题
1. CORS跨域配置 (支持3000和5173端口)
2. TypeScript字段名匹配 (前后端一致性)
3. Vite代理配置 (避免浏览器同源策略限制)
4. 数据保存逻辑 (区分创建和更新操作)

#### 📊 统计信息
- **新增代码**: 7,888+ 行
- **数据表字段**: 36个
- **数据库索引**: 8个
- **API端点**: 5个

---

### M2: 部署文档完善 (2025-12-12)

#### M2.1: 生产环境部署文档

**提交信息**: `docs: 添加完整的生产环境部署文档`  
**提交Hash**: `e132520`  
**作者**: Davian Liang  
**日期**: 2025-12-12 08:51:29 +0000

##### 📝 变更说明
添加详细的生产环境部署指南，涵盖从零开始的完整部署流程。

##### ✨ 文档内容
1. 从零开始的详细部署步骤
2. 所有依赖软件的安装指南
3. 数据库配置和优化建议
4. 前后端部署最佳实践
5. Nginx配置和SSL设置
6. 系统监控和健康检查
7. 故障排查和维护指南
8. 安全加固建议
9. 完整的部署检查清单

##### 📦 影响文件
- `PRODUCTION_DEPLOYMENT.md` (+1,003行)

#### M2.2: Windows 部署指南

**提交信息**: `docs: 添加 Windows 完整部署指南`  
**提交Hash**: `1dc5f21`  
**作者**: Davian Liang  
**日期**: 2025-12-12 09:31:54 +0000

##### 📝 变更说明
针对Windows环境的详细部署指南，解决Windows特有的配置问题。

##### ✨ 文档内容
1. 详细的软件安装步骤 (Java, Maven, Node.js, MySQL, Git, Python)
2. 从零开始的部署流程
3. 针对Windows环境的配置说明
4. 常见问题排查方案
5. 生产环境部署建议
6. 完整的验证检查清单

##### 📦 影响文件
- `WINDOWS_DEPLOYMENT_GUIDE.md` (+716行)

---

### M3: 数据库设计完善 (2026-01-26)

**提交信息**: `保存当前修改`  
**提交Hash**: `a89aaa6`  
**作者**: Davian Liang  
**日期**: 2026-01-26 02:37:20 +0000

#### 🎯 目标需求
导入真实业务数据，完善数据库设计。

#### ✨ 主要功能
1. **数据导入**
   - 导入中国定价询价记录 (14,438条数据)
   - 导入Excel工作簿数据
   - 数据验证和清洗

2. **配置优化**
   - 更新应用配置
   - MySQL Docker脚本权限设置

3. **快速测试**
   - 创建快速测试脚本
   - 验证数据导入结果

#### 📦 影响文件 (9个)
- `China Pricing - Enquiry Record-working(Rate Enquiry Summary).csv` (新增14,438条记录)
- `China Pricing - Enquiry Record-working.xlsx` (新增9.3MB)
- `PRODUCTION_DEPLOYMENT.md` (删除，-1,003行)
- `QUICKSTART.md` (更新)
- `backend/backend.log` (日志更新)
- `backend/src/main/resources/application.properties` (配置更新)
- `database/start-mysql-docker.sh` (权限设置)
- `logitrack-pro/vite.config.ts` (配置更新)
- `quick-test.sh` (新增快速测试脚本)

#### 📊 统计信息
- **导入数据**: 14,438条询价记录
- **Excel数据**: 9.3MB工作簿

---

### M4: 询价表单对齐 (2026-01-30)

#### M4.1: 数据库Schema对齐

**提交信息**: `feat(enquiry): align EnquiryForm with DB schema — product, cargo types, status, payload mapping, container line mapping`  
**提交Hash**: `b8ec5d7`  
**作者**: Davian Liang  
**日期**: 2026-01-30 07:30:24 +0000

##### 🎯 目标需求
重构数据库设计，实现前后端完全对齐，支持复杂的物流业务场景。

##### ✨ 主要功能

1. **数据库重构**
   - 从 `enquiry_record` 迁移到 `enquiry` 表
   - 规范化设计：分离主数据表
   - 支持多对多关系 (container_line关联表)
   - 完整的外键约束和索引

2. **主数据管理**
   - **产品类型** (product): FCL/LCL/AIR
   - **货物类型** (cargo_type): 普货/危险品/冷藏等
   - **箱型** (container_type): 20GP/40GP/40HQ等
   - **港口** (port): 42,020个全球港口
   - **销售** (sales_pic): 819个销售人员
   - **国家** (country): 234个国家
   - **办事处** (cn_office/sales_office)

3. **业务实体**
   - `Enquiry` - 询价主表
   - `EnquiryContainerLine` - 集装箱明细
   - `Offer` - 报价单
   - 支持状态流转: DRAFT → PENDING → QUOTED → WON/LOST

4. **前端重构**
   - 完整的询价表单 (EnquiryForm)
   - 询价列表 (EnquiryList)
   - 询价详情 (EnquiryDetail)
   - 报价管理 (OfferManagement)
   - 丰富的下拉选择和多选组件

5. **数据导入**
   - 导入机场代码 (34条)
   - 导入海港代码 (42,020条)
   - 导入销售人员 (819条)
   - 导入国家数据 (234条)
   - 自动化导入脚本和验证

##### 📦 影响文件 (61个)

**后端实体层**
- `backend/src/main/java/com/logitrack/backend/entity/Enquiry.java` (新增215行)
- `backend/src/main/java/com/logitrack/backend/entity/EnquiryContainerLine.java` (新增46行)
- `backend/src/main/java/com/logitrack/backend/entity/Offer.java` (新增77行)
- `backend/src/main/java/com/logitrack/backend/entity/Product.java` (新增30行)
- `backend/src/main/java/com/logitrack/backend/entity/CargoType.java` (新增35行)
- `backend/src/main/java/com/logitrack/backend/entity/ContainerType.java` (新增62行)
- `backend/src/main/java/com/logitrack/backend/entity/Port.java` (新增63行)
- `backend/src/main/java/com/logitrack/backend/entity/SalesPic.java` (新增58行)
- `backend/src/main/java/com/logitrack/backend/entity/Country.java` (新增52行)
- `backend/src/main/java/com/logitrack/backend/entity/CnOffice.java` (新增27行)
- `backend/src/main/java/com/logitrack/backend/entity/SalesOffice.java` (新增64行)

**后端Repository层**
- `backend/src/main/java/com/logitrack/backend/repository/EnquiryRepository.java` (重构)
- `backend/src/main/java/com/logitrack/backend/repository/OfferRepository.java` (新增)
- `backend/src/main/java/com/logitrack/backend/repository/ProductRepository.java` (新增)
- `backend/src/main/java/com/logitrack/backend/repository/CargoTypeRepository.java` (新增)
- `backend/src/main/java/com/logitrack/backend/repository/ContainerTypeRepository.java` (新增)
- `backend/src/main/java/com/logitrack/backend/repository/PortRepository.java` (新增)
- `backend/src/main/java/com/logitrack/backend/repository/SalesPicRepository.java` (新增)
- `backend/src/main/java/com/logitrack/backend/repository/CountryRepository.java` (新增)
- `backend/src/main/java/com/logitrack/backend/repository/CnOfficeRepository.java` (新增)
- `backend/src/main/java/com/logitrack/backend/repository/SalesOfficeRepository.java` (新增)

**后端Service层**
- `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java` (重构)

**后端Controller层**
- `backend/src/main/java/com/logitrack/backend/controller/EnquiryController.java` (重构)
- `backend/src/main/java/com/logitrack/backend/controller/DictController.java` (新增123行)

**前端组件**
- `logitrack-pro/App.tsx` (重大重构，440行变更)
- `logitrack-pro/components/enquiry/EnquiryForm.tsx` (新增824行)
- `logitrack-pro/components/enquiry/EnquiryList.tsx` (新增308行)
- `logitrack-pro/components/enquiry/EnquiryDetail.tsx` (新增276行)
- `logitrack-pro/components/offer/OfferManagement.tsx` (新增312行)

**前端服务**
- `logitrack-pro/services/api.ts` (重构，新增938行)
- `logitrack-pro/types.ts` (重构，新增391行)

**数据库**
- `database/schema.sql` (大幅更新，445行变更)
- `database/schema_v2.sql` (新增391行)
- `database/demo_data.sql` (新增126行)
- `database/import_enquiry_data.py` (新增664行)
- `database/import_master_data.py` (新增484行)
- `database/verify_import.sql` (新增139行)

**主数据文件**
- `AirportCode.csv` (34条机场代码)
- `SeaportCode.csv` (42,020条海港代码)
- `SALES.csv` (819个销售人员)
- `country.csv` (234个国家)

**文档**
- `enquiry_mysql_design_spec.md` (新增577行设计文档)
- `FEATURE_VERIFICATION_REPORT.md` (新增326行)
- `FRONTEND_REQUIREMENTS.md` (新增861行)
- `NEW_FEATURES_VERIFICATION_GUIDE.md` (新增269行)
- `database/IMPORT_REPORT.md` (新增206行)
- `database/README.md` (新增397行)

**测试文件**
- `logitrack-pro/diagnostic.html` (新增279行)
- `logitrack-pro/test-features.html` (新增521行)

##### 📊 统计信息
- **新增代码**: 53,674+ 行
- **删除代码**: 891 行
- **数据表**: 11+ 个
- **主数据**: 43,107 条记录
- **API端点**: 20+ 个

#### M4.2: 询价服务增强

**提交信息**: `feat(enquiry-service): generate referenceNumber, persist container lines, compute TEU; add repo helper`  
**提交Hash**: `2cf0661`  
**作者**: Davian Liang  
**日期**: 2026-01-30 07:53:15 +0000

##### 📝 变更说明
增强询价服务，自动生成参考编号，持久化集装箱明细，计算TEU。

##### ✨ 主要功能
1. **自动生成referenceNumber**
   - 格式: ENQ-YYYYMMDD-XXXXX
   - 按日期序列递增
   - 确保唯一性

2. **集装箱明细持久化**
   - 保存container line数据
   - 关联enquiry主记录
   - 支持批量操作

3. **TEU计算**
   - 20GP = 1 TEU
   - 40GP/40HQ = 2 TEU
   - 自动汇总计算

4. **Repository辅助方法**
   - 查询辅助函数
   - 批量操作支持
   - 事务管理

##### 📦 影响文件 (4个)
- `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java` (+118行)
- `backend/src/main/java/com/logitrack/backend/repository/EnquiryRepository.java` (+3行)
- `0` (临时文件)
- `logitrack-pro/0` (临时文件)

##### 📊 统计信息
- **新增代码**: 117行
- **优化查询**: 3个

---

### M5: 多POL/POD支持 (2026-02-04)

**提交信息**: `chore: save workspace changes`  
**提交Hash**: `beb0d14`  
**作者**: Davian Liang  
**日期**: 2026-02-04 08:38:32 +0000

#### 🎯 目标需求
支持一个询价单包含多个装货港(POL)和多个卸货港(POD)，优化用户体验和性能。

#### ✨ 主要功能

1. **数据库设计**
   - 新增 `enquiry_pol` 表 (装货港)
   - 新增 `enquiry_pod` 表 (卸货港)
   - 多对多关系支持
   - 复合索引优化查询

2. **后端增强**
   - `EnquiryPol` / `EnquiryPod` 实体
   - `EnquiryPolRepository` / `EnquiryPodRepository`
   - `EnquiryPortService` - 港口服务
   - 批量保存和查询优化
   - 主数据控制器 (MasterDataController)
   - 报价控制器 (OfferController)
   - 字典服务增强 (DictController)

3. **前端组件**
   - **主数据管理**
     - `PortList` - 港口列表 (233行)
     - `SalesPicList` - 销售人员列表 (236行)
     - `CountryList` - 国家列表 (190行)
     - `ContainerTypeList` - 箱型列表 (220行)
   - **表单增强**
     - `MultiSelect` - 多选组件 (141行)
     - `VirtualizedMultiSelect` - 虚拟化多选 (363行)
     - `Accordion` - 手风琴组件 (60行)
   - **询价模块**
     - `EnquiryForm` - 重构支持多POL/POD (1,610行)
     - `EnquiryDetail` - 详情页面优化 (595行)
     - `EnquiryList` - 列表页面优化 (100行)
   - **报价模块**
     - `OfferDialog` - 报价对话框 (296行)

4. **性能优化**
   - 虚拟化长列表渲染
   - 防抖搜索优化
   - 懒加载和按需加载
   - 批量API调用

5. **用户体验**
   - 数据连接修复
   - 更友好的错误提示
   - 加载状态显示
   - 响应式设计

#### 📦 影响文件 (78个)

**后端实体**
- `backend/src/main/java/com/logitrack/backend/entity/EnquiryPol.java` (新增30行)
- `backend/src/main/java/com/logitrack/backend/entity/EnquiryPod.java` (新增30行)
- `backend/src/main/java/com/logitrack/backend/entity/Enquiry.java` (更新7行)
- `backend/src/main/java/com/logitrack/backend/entity/EnquiryContainerLine.java` (更新6行)

**后端Repository**
- `backend/src/main/java/com/logitrack/backend/repository/EnquiryPolRepository.java` (新增33行)
- `backend/src/main/java/com/logitrack/backend/repository/EnquiryPodRepository.java` (新增33行)
- `backend/src/main/java/com/logitrack/backend/repository/EnquiryRepository.java` (更新21行)
- `backend/src/main/java/com/logitrack/backend/repository/SalesPicRepository.java` (更新3行)

**后端Service**
- `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java` (重构293行)
- `backend/src/main/java/com/logitrack/backend/service/EnquiryPortService.java` (新增111行)

**后端Controller**
- `backend/src/main/java/com/logitrack/backend/controller/EnquiryController.java` (更新39行)
- `backend/src/main/java/com/logitrack/backend/controller/MasterDataController.java` (新增278行)
- `backend/src/main/java/com/logitrack/backend/controller/OfferController.java` (新增106行)
- `backend/src/main/java/com/logitrack/backend/controller/DictController.java` (更新159行)

**后端DTO**
- `backend/src/main/java/com/logitrack/backend/dto/DictDTO.java` (新增159行)
- `backend/src/main/java/com/logitrack/backend/dto/ReferencePreview.java` (新增16行)

**前端组件**
- `logitrack-pro/App.tsx` (重构90行)
- `logitrack-pro/components/Accordion.tsx` (新增60行)
- `logitrack-pro/components/MultiSelect.tsx` (新增141行)
- `logitrack-pro/components/VirtualizedMultiSelect.tsx` (新增363行)
- `logitrack-pro/components/enquiry/EnquiryForm.tsx` (重构1,610行)
- `logitrack-pro/components/enquiry/EnquiryDetail.tsx` (重构595行)
- `logitrack-pro/components/enquiry/EnquiryList.tsx` (重构100行)
- `logitrack-pro/components/master-data/PortList.tsx` (新增233行)
- `logitrack-pro/components/master-data/SalesPicList.tsx` (新增236行)
- `logitrack-pro/components/master-data/CountryList.tsx` (新增190行)
- `logitrack-pro/components/master-data/ContainerTypeList.tsx` (新增220行)
- `logitrack-pro/components/offer/OfferDialog.tsx` (新增296行)

**前端服务**
- `logitrack-pro/services/api.ts` (重构328行)
- `logitrack-pro/types.ts` (更新29行)

**测试文件**
- `logitrack-pro/test-enquiry-create.html` (新增316行)
- `logitrack-pro/test-enquiry-list.html` (新增61行)
- `logitrack-pro/test-pod-mapping-fix.html` (新增298行)
- `test-all-fixes.html` (新增368行)
- `test-all-fixes.sh` (新增183行)
- `test-copy-increase.sh` (新增86行)
- `test-features.sh` (新增80行)
- `test-real-database.sh` (新增158行)
- `test-save-enquiry.sh` (新增64行)

**数据库**
- `database/schema_multi_ports.sql` (新增180行)
- `enquiry_mysql_design_spec.md` (更新2行)

**文档 (29个)**
- `BROWSER_MANUAL_TEST_GUIDE.md` (新增423行)
- `BROWSER_TEST_GUIDE.md` (新增287行)
- `BUGFIX_ANALYSIS_REPORT.md` (新增381行)
- `BUGFIX_DEBUG_SUMMARY.md` (新增366行)
- `BUGFIX_REPORT.md` (新增301行)
- `BUGFIX_REPORT_20260204.md` (新增434行)
- `BUG_FIX_COMPLETION_REPORT.md` (新增416行)
- `BUG_FIX_FINAL_REPORT.md` (新增304行)
- `BUG_FIX_REPORT_20260202.md` (新增267行)
- `CODESPACES_ACCESS_GUIDE.md` (新增197行)
- `CODE_CHANGES.md` (新增321行)
- `COMPLETION_REPORT_20260202.md` (新增321行)
- `COPY_INCREASE_FIX_REPORT.md` (新增130行)
- `DOCUMENTATION_INDEX.md` (新增361行)
- `E2E_TEST_REPORT_MULTIPORT.md` (新增290行)
- `FINAL_COMPLETION_REPORT.md` (新增466行)
- `FIXES_SUMMARY.md` (新增138行)
- `FRONTEND_IMPLEMENTATION_UPDATE.md` (新增510行)
- `MULTI_PORT_OPTIMIZATION_REPORT.md` (新增488行)
- `QUICK_COMPLETION_CHECKLIST.md` (新增351行)
- `QUICK_TEST_GUIDE.md` (新增164行)
- `SESSION_SUMMARY_20260128.md` (新增345行)
- `STARTUP.md` (新增153行)
- `TEST_CHECKLIST.md` (新增71行)
- `TEST_VERIFICATION.md` (新增212行)
- `TEST_VERIFICATION_REPORT_20260202.md` (新增360行)
- `VERIFICATION_START_HERE.md` (新增166行)
- `logitrack-pro/DATA_CONNECTION_FIX.md` (新增218行)
- `本地部署完整指南.md` (新增779行)

**脚本**
- `check-system-status.sh` (新增171行)
- `comprehensive-test.sh` (新增153行)
- `start-all.sh` (新增58行)

#### 📊 统计信息
- **新增代码**: 67,962+ 行
- **删除代码**: 997 行
- **净增长**: 66,965 行
- **数据表**: +2个 (enquiry_pol, enquiry_pod)
- **API端点**: +15个
- **前端组件**: +13个

---

### M6: Dashboard报表模块 (2026-02-09)

**提交信息**: `chore: update dev config and UI fixes`  
**提交Hash**: `c141c9a`  
**作者**: Davian  
**日期**: 2026-02-09 12:16:42 +0800

#### 🎯 目标需求
实现完整的Dashboard报表模块，提供数据统计、趋势分析和可视化展示。

#### ✨ 主要功能

1. **后端统计服务**
   - **DashboardStatsDTO** - 仪表盘统计数据
     - 总询价数
     - 待处理/已报价/已成交/已流失
     - 转化率计算
   - **MonthlyTrendDTO** - 月度趋势数据
     - 按月统计询价数量
     - TEU统计
     - 周期对比
   - **LocationStatDTO** - 地区统计
     - 按POL/POD统计
     - 按国家统计
     - TOP N排名
   - **StatusBreakdownDTO** - 状态分布
     - 各状态占比
     - 可视化支持
   - **DashboardOverviewDTO** - 概览数据
     - 聚合所有统计维度
     - 一次请求获取全部数据

2. **StatisticsService** - 统计服务
   - `getMonthlyTrend()` - 获取月度趋势
   - `getLocationStats()` - 获取地区统计
   - `getStatusBreakdown()` - 获取状态分布
   - `getDashboardStats()` - 获取仪表盘数据
   - `getDashboardOverview()` - 获取概览数据
   - 复杂SQL查询优化
   - 缓存支持

3. **StatisticsController** - 统计控制器
   - RESTful API设计
   - 参数验证
   - 异常处理
   - 98行实现

4. **前端Dashboard**
   - **Dashboard组件** (318行)
     - 统计卡片展示
     - 趋势图表
     - 地区分布
     - 状态饼图
   - **StatCard组件** (83行)
     - 统计卡片封装
     - 图标支持
     - 响应式设计
   - **reportApi服务** (101行)
     - API调用封装
     - 错误处理
     - TypeScript类型
   - 集成Chart.js/Recharts

5. **Vite配置优化**
   - 开发服务器配置
   - HMR优化
   - 构建优化

#### 📦 影响文件 (24个)

**后端DTO**
- `backend/src/main/java/com/logitrack/backend/dto/DashboardStatsDTO.java` (新增26行)
- `backend/src/main/java/com/logitrack/backend/dto/DashboardOverviewDTO.java` (新增23行)
- `backend/src/main/java/com/logitrack/backend/dto/MonthlyTrendDTO.java` (新增19行)
- `backend/src/main/java/com/logitrack/backend/dto/LocationStatDTO.java` (新增19行)
- `backend/src/main/java/com/logitrack/backend/dto/StatusBreakdownDTO.java` (新增18行)

**后端Service**
- `backend/src/main/java/com/logitrack/backend/service/StatisticsService.java` (新增244行)

**后端Controller**
- `backend/src/main/java/com/logitrack/backend/controller/StatisticsController.java` (新增98行)

**后端Repository**
- `backend/src/main/java/com/logitrack/backend/repository/EnquiryRepository.java` (更新4行)

**前端组件**
- `logitrack-pro/components/report/Dashboard.tsx` (新增318行)
- `logitrack-pro/components/report/StatCard.tsx` (新增83行)

**前端服务**
- `logitrack-pro/services/reportApi.ts` (新增101行)

**前端类型**
- `logitrack-pro/types.ts` (新增127行)

**前端配置**
- `logitrack-pro/vite.config.ts` (更新5行)

**主应用**
- `logitrack-pro/App.tsx` (更新15行)
- `logitrack-pro/components/enquiry/EnquiryDetail.tsx` (更新559行)
- `logitrack-pro/components/enquiry/EnquiryList.tsx` (更新8行)

**日志**
- `backend/backend.log` (新增208,338行)

**文档 (7个)**
- `CORE_DESIGN_QUICK_REFERENCE.md` (新增636行)
- `IMPLEMENTATION_ROADMAP.md` (新增541行)
- `README_REPORT_SETTINGS.md` (新增460行)
- `REPORT_MODULE_IMPLEMENTATION_REPORT.md` (新增436行)
- `REPORT_MODULE_QUICK_TEST_GUIDE.md` (新增368行)
- `REPORT_SETTINGS_DESIGN.md` (新增1,184行)
- `REPORT_SETTINGS_IMPLEMENTATION.md` (新增1,361行)

#### 📊 统计信息
- **新增代码**: 214,755+ 行 (主要是日志)
- **删除代码**: 236 行
- **业务代码**: 约1,500行
- **API端点**: +5个
- **前端组件**: +2个
- **统计维度**: 5个

---

### M7: RBAC和审计日志 (2026-02-17)

**提交信息**: `chore: commit latest changes`  
**提交Hash**: `5b577e9`  
**作者**: Davian  
**日期**: 2026-02-17 21:04:41 +0800

#### 🎯 目标需求
实现基于角色的访问控制(RBAC)和完整的审计日志系统，提升系统安全性和可追溯性。

#### ✨ 主要功能

1. **RBAC权限系统**
   - **User实体** (79行)
     - 用户名/密码/邮箱
     - 多角色支持
     - 启用/禁用状态
   - **Role实体** (62行)
     - 角色名称/代码
     - 权限列表
     - 继承关系
   - **角色定义**
     - SUPER_ADMIN - 超级管理员
     - SALES_MANAGER - 销售经理
     - SALES - 销售人员
     - OPERATOR - 操作员
     - GUEST - 访客
   - **权限定义**
     - enquiry:read/create/update/delete
     - report:view/export
     - user:manage
     - audit:view
     - system:config

2. **认证授权**
   - **AuthService** (159行)
     - 用户登录/登出
     - JWT Token生成
     - 密码加密 (BCrypt)
     - 会话管理
   - **AuthController** (69行)
     - 登录API
     - Token刷新
     - 密码修改
   - **LoginRequestDTO** / **LoginResponseDTO**
     - 请求响应封装
     - Token传输
   - **PasswordEncoderUtil** (22行)
     - 密码加密工具
     - BCrypt实现

3. **用户管理**
   - **UserService** (153行)
     - 用户CRUD
     - 角色分配
     - 密码重置
     - 批量操作
   - **UserController** (124行)
     - 用户管理API
     - 角色管理API
     - 权限检查
   - **UserDTO** (29行)
     - 用户数据传输
     - 安全信息过滤

4. **审计日志**
   - **AuditLog实体** (76行)
     - 操作用户
     - 操作类型 (CREATE/UPDATE/DELETE)
     - 操作对象 (entityType/entityId)
     - 操作前后数据 (JSON)
     - IP地址
     - 时间戳
   - **AuditLogAspect** (161行)
     - AOP切面实现
     - 自动记录操作
     - 异常捕获
     - 异步处理
   - **AuditLogService** (108行)
     - 日志查询
     - 按用户/类型/时间筛选
     - 分页支持
     - 导出功能
   - **AuditLogController** (69行)
     - 审计日志API
     - 查询接口
     - 导出接口
   - **AuditLogDTO** (33行)
     - 日志数据传输
     - 格式化输出

5. **报表增强**
   - **ComparisonService** (232行)
     - 周期对比分析
     - 同比/环比计算
     - 增长率统计
   - **StatisticsService** (194行)
     - 统计服务增强
     - Dashboard数据
     - CN办事处透视表数据
   - **DashboardFilterDTO** (41行)
     - 筛选条件封装
   - **CNOfficeStatDTO** (41行)
     - 办事处统计数据
   - **ComparisonResultDTO** (77行)
     - 对比结果数据
   - **PeriodComparisonRequestDTO** (42行)
     - 对比请求参数
   - **PeriodStatsDTO** (56行)
     - 周期统计数据

6. **前端增强**
   - **登录流程**
     - `Login.tsx` (更新39行)
     - Token存储
     - 自动跳转
   - **权限控制**
     - 路由守卫
     - 按钮权限
     - 菜单权限
   - **报表增强**
     - `ComparisonReport.tsx` (新增444行) - 对比报表
     - `CNOfficePivotTable.tsx` (新增271行) - 透视表
     - `EnhancedDashboard.tsx` (新增383行) - 增强仪表盘
     - `DashboardFilters.tsx` (新增218行) - 筛选器
     - `EnquiryListModal.tsx` (新增317行) - 询价列表弹窗
     - `TrendChart.tsx` (新增177行) - 趋势图表

7. **数据库Schema**
   - **RBAC表**
     - `users` - 用户表
     - `roles` - 角色表
     - `user_roles` - 用户角色关联表
     - `permissions` - 权限表
     - `role_permissions` - 角色权限关联表
   - **审计表**
     - `audit_log` - 审计日志表
   - **初始化脚本**
     - `database/schema_rbac_audit.sql` (新增158行)
     - `database/create_rbac_audit_tables.py` (新增81行)
     - `database/fix_user_roles.sql` (新增24行)
     - `database/update_passwords.sql` (新增9行)

8. **测试脚本**
   - `test-comparison.ps1` (新增131行) - 对比报表测试
   - `test-dashboard-enhanced.ps1` (新增80行) - Dashboard测试

#### 📦 影响文件 (62个)

**后端依赖**
- `backend/pom.xml` (新增12行)
  - Spring Security依赖
  - JWT依赖
  - BCrypt依赖

**后端实体**
- `backend/src/main/java/com/logitrack/backend/entity/User.java` (新增79行)
- `backend/src/main/java/com/logitrack/backend/entity/Role.java` (新增62行)
- `backend/src/main/java/com/logitrack/backend/entity/AuditLog.java` (新增76行)

**后端Repository**
- `backend/src/main/java/com/logitrack/backend/repository/UserRepository.java` (新增34行)
- `backend/src/main/java/com/logitrack/backend/repository/RoleRepository.java` (新增24行)
- `backend/src/main/java/com/logitrack/backend/repository/AuditLogRepository.java` (新增67行)
- `backend/src/main/java/com/logitrack/backend/repository/EnquiryRepository.java` (更新3行)

**后端Service**
- `backend/src/main/java/com/logitrack/backend/service/AuthService.java` (新增159行)
- `backend/src/main/java/com/logitrack/backend/service/UserService.java` (新增153行)
- `backend/src/main/java/com/logitrack/backend/service/AuditLogService.java` (新增108行)
- `backend/src/main/java/com/logitrack/backend/service/ComparisonService.java` (新增232行)
- `backend/src/main/java/com/logitrack/backend/service/StatisticsService.java` (新增194行)

**后端Controller**
- `backend/src/main/java/com/logitrack/backend/controller/AuthController.java` (新增69行)
- `backend/src/main/java/com/logitrack/backend/controller/UserController.java` (新增124行)
- `backend/src/main/java/com/logitrack/backend/controller/AuditLogController.java` (新增69行)
- `backend/src/main/java/com/logitrack/backend/controller/StatisticsController.java` (更新83行)
- `backend/src/main/java/com/logitrack/backend/controller/SystemController.java` (新增141行)
- `backend/src/main/java/com/logitrack/backend/controller/EnquiryController.java` (更新4行)

**后端AOP**
- `backend/src/main/java/com/logitrack/backend/aspect/AuditLogAspect.java` (新增161行)

**后端DTO**
- `backend/src/main/java/com/logitrack/backend/dto/LoginRequestDTO.java` (新增16行)
- `backend/src/main/java/com/logitrack/backend/dto/LoginResponseDTO.java` (新增28行)
- `backend/src/main/java/com/logitrack/backend/dto/UserDTO.java` (新增29行)
- `backend/src/main/java/com/logitrack/backend/dto/AuditLogDTO.java` (新增33行)
- `backend/src/main/java/com/logitrack/backend/dto/CNOfficeStatDTO.java` (新增41行)
- `backend/src/main/java/com/logitrack/backend/dto/ComparisonResultDTO.java` (新增77行)
- `backend/src/main/java/com/logitrack/backend/dto/DashboardFilterDTO.java` (新增41行)
- `backend/src/main/java/com/logitrack/backend/dto/DashboardStatsDTO.java` (更新1行)
- `backend/src/main/java/com/logitrack/backend/dto/MonthlyTrendDTO.java` (更新7行)
- `backend/src/main/java/com/logitrack/backend/dto/PeriodComparisonRequestDTO.java` (新增42行)
- `backend/src/main/java/com/logitrack/backend/dto/PeriodStatsDTO.java` (新增56行)

**后端工具类**
- `backend/src/main/java/com/logitrack/backend/util/PasswordEncoderUtil.java` (新增22行)

**数据库**
- `database/schema_rbac_audit.sql` (新增158行)
- `database/create_rbac_audit_tables.py` (新增81行)
- `database/fix_user_roles.sql` (新增24行)
- `database/update_passwords.sql` (新增9行)

**前端组件**
- `logitrack-pro/App.tsx` (重构300行)
- `logitrack-pro/components/Login.tsx` (更新39行)
- `logitrack-pro/components/VirtualizedMultiSelect.tsx` (更新26行)
- `logitrack-pro/components/enquiry/EnquiryDetail.tsx` (更新77行)
- `logitrack-pro/components/enquiry/EnquiryForm.tsx` (更新219行)
- `logitrack-pro/components/enquiry/EnquiryList.tsx` (更新88行)
- `logitrack-pro/components/report/CNOfficePivotTable.tsx` (新增271行)
- `logitrack-pro/components/report/ComparisonReport.tsx` (新增444行)
- `logitrack-pro/components/report/DashboardFilters.tsx` (新增218行)
- `logitrack-pro/components/report/EnhancedDashboard.tsx` (新增383行)
- `logitrack-pro/components/report/EnquiryListModal.tsx` (新增317行)
- `logitrack-pro/components/report/TrendChart.tsx` (新增177行)

**前端服务**
- `logitrack-pro/services/api.ts` (更新13行)
- `logitrack-pro/services/reportApi.ts` (新增77行)

**前端类型**
- `logitrack-pro/types.ts` (新增118行)

**前端依赖**
- `logitrack-pro/package.json` (更新6行)
- `logitrack-pro/package-lock.json` (更新697行)

**测试脚本**
- `test-comparison.ps1` (新增131行)
- `test-dashboard-enhanced.ps1` (新增80行)

**文档 (7个)**
- `COMPARISON_FEATURE_REPORT.md` (新增552行)
- `DASHBOARD_ENHANCED_REPORT.md` (新增397行)
- `FRONTEND_IMPLEMENTATION_REPORT.md` (新增465行)
- `FRONTEND_TEST_GUIDE.md` (新增227行)
- `RBAC_AUDIT_IMPLEMENTATION_REPORT.md` (新增726行)
- `RBAC_TEST_GUIDE.md` (新增320行)
- `REPORT_MODULE_COMPLETION_REPORT.md` (新增786行)

#### 📊 统计信息
- **新增代码**: 9,440+ 行
- **删除代码**: 233 行
- **净增长**: 9,207 行
- **数据表**: +6个 (users, roles, user_roles, permissions, role_permissions, audit_log)
- **API端点**: +12个
- **前端组件**: +6个
- **权限点**: 15+个
- **角色**: 5个

---

### M8: 性能优化 (2026-02-06)

**提交信息**: `Update: push latest code (auto)`  
**提交Hash**: `a3b51e6`  
**作者**: Davian  
**日期**: 2026-02-06 16:21:05 +0800

#### 🎯 目标需求
优化前端组件性能，特别是大数据量列表的渲染性能。

#### ✨ 主要功能

1. **虚拟化列表优化**
   - `PortList.tsx` (更新190行)
     - 虚拟滚动优化
     - 懒加载
     - 搜索防抖
   - `SalesPicList.tsx` (更新193行)
     - 分页优化
     - 缓存策略

2. **Vite配置优化**
   - HMR优化
   - 构建性能优化
   - 代码分割

3. **日志清理**
   - 清理大量日志文件 (减少41,061行)
   - 日志轮转配置

#### 📦 影响文件 (6个)
- `logitrack-pro/components/master-data/PortList.tsx` (更新190行)
- `logitrack-pro/components/master-data/SalesPicList.tsx` (更新193行)
- `logitrack-pro/vite.config.ts` (更新6行)
- `backend/backend.log` (大幅减少)
- `backend/backend-error.log` (新增空文件)
- `PERFORMANCE_OPTIMIZATION_REPORT.md` (新增371行)

#### 📊 统计信息
- **新增代码**: 11,446 行
- **删除代码**: 41,061 行
- **净减少**: 29,615 行 (主要是日志清理)
- **性能提升**: 列表渲染速度提升约60%

---

### M9: 用户管理增强 (2026-02-25)

**提交信息**: `chore: commit latest changes (auto)`  
**提交Hash**: `3d43cae`  
**作者**: Davian  
**日期**: 2026-02-25 17:46:22 +0800

#### 🎯 目标需求
完善用户管理、审计日志、国际化、日期选择器等核心功能，提升系统完整性和用户体验。

#### ✨ 主要功能

1. **用户管理增强**
   - **UserManagement组件** (496行)
     - 用户列表展示
     - 用户创建/编辑/删除
     - 角色分配
     - 密码重置
     - 批量操作
     - 搜索筛选
   - **UserController增强** (214行)
     - 完善API接口
     - 权限检查
     - 输入验证
   - **UserService增强** (43行)
     - 业务逻辑优化
     - 事务管理
   - **UserDTO增强** (1行)
     - 字段补充

2. **审计日志增强**
   - **AuditLog组件** (459行)
     - 日志列表展示
     - 高级筛选 (用户/类型/实体/时间)
     - 分页加载
     - 详情查看
     - 导出功能
   - **ChangeDetailsModal组件** (400行)
     - 变更详情弹窗
     - 前后对比展示
     - JSON格式化
     - 字段高亮
   - **AuditLogAspect增强** (205行)
     - 更精细的拦截逻辑
     - 敏感信息过滤
     - 性能优化
   - **AuditLogController增强** (109行)
     - 更多查询维度
     - 导出优化
   - **AuditLogService增强** (12行)
     - 查询优化
     - 缓存策略
   - **AuditLog实体增强** (9行)
     - 新增字段
   - **AuditLogDTO增强** (3行)
     - 字段映射
   - 数据库迁移: `audit_log_enhancement.sql` (31行)

3. **设置模块**
   - **SettingsLayout组件** (66行)
     - 设置页面布局
     - 标签页导航
     - 响应式设计
   - **settingsApi服务** (279行)
     - 用户管理API
     - 审计日志API
     - 系统设置API

4. **国际化 (i18n)**
   - **LanguageContext** (49行)
     - 语言上下文
     - 切换机制
   - **translations.ts** (997行)
     - 中英文翻译
     - 完整覆盖
   - **各组件集成**
     - EnquiryForm i18n
     - EnquiryListModal i18n
     - AuditLog i18n
     - Dashboard i18n
     - 60+ 个字段翻译

5. **日期选择器**
   - **DatePickerInput组件** (342行)
     - Material UI集成
     - 日期范围选择
     - 时区支持
     - 格式化显示
     - 验证逻辑
   - **EnquiryForm集成** (84行更新)
     - ETD/ETA日期选择
     - 验证增强
   - 修复时区偏移问题

6. **Dashboard增强**
   - **EnhancedDashboard** (52行更新)
     - 更丰富的统计维度
     - 动态筛选
   - **Dashboard基础版** (73行更新)
     - 基础统计展示
   - **DashboardFilters** (69行更新)
     - 筛选器优化
   - **EnquiryListModal** (46行更新)
     - 弹窗优化
     - 国际化

7. **报表增强**
   - **CNOfficePivotTable** (64行更新)
     - 透视表优化
     - 国际化
   - **ComparisonReport** (97行更新)
     - 对比报表优化
     - 图表优化
   - **StatisticsService** (30行更新)
     - 统计逻辑优化
   - **StatisticsServiceTest** (100行新增)
     - 单元测试

8. **头像功能**
   - **avatarUtils.ts** (84行)
     - 头像生成工具
     - 颜色算法
     - 缓存机制

9. **AWS部署**
   - **deploy-to-aws.ps1** (172行)
     - PowerShell部署脚本
     - 一键部署到EC2
   - **aws-deploy-app.sh** (295行)
     - Linux部署脚本
     - Docker支持
   - **aws-setup-server.sh** (163行)
     - 服务器初始化
     - 环境配置
   - **upload-to-ec2.ps1** (118行)
     - 文件上传工具
   - **check-env.ps1** (29行)
     - 环境检查
   - **logitrack-ops.sh** (293行)
     - 运维脚本
     - 启动/停止/重启/状态

10. **测试增强**
    - **test-audit-log.ps1** (165行)
      - 审计日志完整测试
    - **test-audit-log-simple.ps1** (115行)
      - 审计日志简单测试
    - **test-audit-log-fix.ps1** (166行)
      - 审计日志修复测试
    - **test-system.js** (211行)
      - Node.js系统测试

11. **前端主应用**
    - **App.tsx** (119行更新)
      - 国际化集成
      - 路由优化
      - 权限控制
    - **index.tsx** (5行更新)
      - React 19新特性
    - **types.ts** (3行更新)
      - 类型定义完善

12. **后端API增强**
    - **api.ts** (31行更新)
      - API增强
      - 错误处理
    - **AuthService** (31行新增方法)
      - Token刷新
      - 会话管理
    - **EnquiryService** (42行新增方法)
      - 业务逻辑增强

13. **配置文件**
    - **application.properties** (3行更新)
      - 日志配置
      - 性能配置

#### 📦 影响文件 (84个)

**后端 (Backend)**
- `backend/src/main/java/com/logitrack/backend/aspect/AuditLogAspect.java` (+205行)
- `backend/src/main/java/com/logitrack/backend/controller/AuditLogController.java` (+109行)
- `backend/src/main/java/com/logitrack/backend/controller/UserController.java` (+214行)
- `backend/src/main/java/com/logitrack/backend/dto/AuditLogDTO.java` (+3行)
- `backend/src/main/java/com/logitrack/backend/dto/CNOfficeStatDTO.java` (+20行)
- `backend/src/main/java/com/logitrack/backend/dto/UserDTO.java` (+1行)
- `backend/src/main/java/com/logitrack/backend/entity/AuditLog.java` (+9行)
- `backend/src/main/java/com/logitrack/backend/service/AuditLogService.java` (+12行)
- `backend/src/main/java/com/logitrack/backend/service/AuthService.java` (+31行)
- `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java` (+42行)
- `backend/src/main/java/com/logitrack/backend/service/StatisticsService.java` (+30行)
- `backend/src/main/java/com/logitrack/backend/service/UserService.java` (+43行)
- `backend/src/main/resources/application.properties` (更新3行)
- `backend/src/main/resources/db/migration/audit_log_enhancement.sql` (+31行)
- `backend/src/test/java/com/logitrack/backend/service/StatisticsServiceTest.java` (+100行)
- `backend/backend_debug.log` (新增10KB)

**前端组件 (Frontend Components)**
- `logitrack-pro/App.tsx` (+119行)
- `logitrack-pro/components/DatePickerInput.tsx` (+342行)
- `logitrack-pro/components/enquiry/EnquiryForm.tsx` (+84行)
- `logitrack-pro/components/report/CNOfficePivotTable.tsx` (+64行)
- `logitrack-pro/components/report/ComparisonReport.tsx` (+97行)
- `logitrack-pro/components/report/Dashboard.tsx` (+73行)
- `logitrack-pro/components/report/DashboardFilters.tsx` (+69行)
- `logitrack-pro/components/report/EnhancedDashboard.tsx` (+52行)
- `logitrack-pro/components/report/EnquiryListModal.tsx` (+46行)
- `logitrack-pro/components/settings/AuditLog.tsx` (+459行)
- `logitrack-pro/components/settings/ChangeDetailsModal.tsx` (+400行)
- `logitrack-pro/components/settings/SettingsLayout.tsx` (+66行)
- `logitrack-pro/components/settings/UserManagement.tsx` (+496行)

**前端国际化 (i18n)**
- `logitrack-pro/i18n/LanguageContext.tsx` (+49行)
- `logitrack-pro/i18n/translations.ts` (+997行)

**前端服务 (Services)**
- `logitrack-pro/services/api.ts` (+31行)
- `logitrack-pro/services/settingsApi.ts` (+279行)

**前端工具 (Utils)**
- `logitrack-pro/utils/avatarUtils.ts` (+84行)

**前端配置**
- `logitrack-pro/index.tsx` (更新5行)
- `logitrack-pro/types.ts` (更新3行)

**部署脚本 (Scripts)**
- `scripts/aws-deploy-app.sh` (+295行)
- `scripts/aws-setup-server.sh` (+163行)
- `scripts/check-env.ps1` (+29行)
- `scripts/logitrack-ops.sh` (+293行)
- `scripts/upload-to-ec2.ps1` (+118行)
- `deploy-to-aws.ps1` (+172行)

**测试脚本 (Tests)**
- `test-audit-log.ps1` (+165行)
- `test-audit-log-simple.ps1` (+115行)
- `test-audit-log-fix.ps1` (+166行)
- `test-system.js` (+211行)

**文档 (Documentation) - 38个**
- `ACCEPTANCE_TEST_CHECKLIST.md` (+682行)
- `AUDIT_LOG_DEBUG_REPORT.md` (+153行)
- `AUDIT_LOG_DETAILS_MODAL_FEATURE.md` (+412行)
- `AUDIT_LOG_E2E_TEST_REPORT.md` (+498行)
- `AUDIT_LOG_ENHANCEMENT_REPORT.md` (+236行)
- `AUDIT_LOG_FIX_REPORT_20260224.md` (+321行)
- `AUDIT_LOG_I18N_COMPLETE_REPORT.md` (+492行)
- `AUDIT_LOG_PERMISSION_FIX_REPORT.md` (+218行)
- `AUDIT_LOG_PORTIDS_FIX_REPORT.md` (+329行)
- `AUDIT_LOG_QUICK_START.md` (+131行)
- `AUDIT_LOG_TEST_SUMMARY.md` (+145行)
- `AWS_DEPLOYMENT_README.md` (+327行)
- `AWS_EC2_DEPLOYMENT_GUIDE.md` (+1,174行)
- `AWS_QUICK_REFERENCE.md` (+386行)
- `BUGFIX_EDIT_ENQUIRY_500_REPORT_20260225.md` (+357行)
- `BUGFIX_EDIT_ENQUIRY_FINAL_SUMMARY_20260225.md` (+420行)
- `BUGFIX_EDIT_ENQUIRY_QUICK_TEST.md` (+247行)
- `BUGFIX_TIMEZONE_OFFSET_REPORT.md` (+311行)
- `CODE_CHANGES_DETAIL.md` (+532行)
- `DATE_PICKER_DESIGN_GUIDE.md` (+396行)
- `DATE_PICKER_IMPLEMENTATION_COMPLETE.md` (+691行)
- `DATE_PICKER_REDESIGN_REPORT.md` (+247行)
- `DELIVERY_CHECKLIST_20260225.md` (+292行)
- `DEPLOYMENT_EXECUTION_GUIDE.md` (+320行)
- `ENQUIRY_EDIT_BUG_FIX_REPORT.md` (+169行)
- `ENQUIRY_LIST_MODAL_I18N_REPORT.md` (+314行)
- `FINAL_VERIFICATION_REPORT_20260225.md` (+272行)
- `FIND_AWS_KEYPAIR.md` (+151行)
- `I18N_COMPLETE_REPORT.md` (+302行)
- `IMPLEMENTATION_SUMMARY.md` (+558行)
- `OPERATOR_PERMISSIONS_ANALYSIS.md` (+364行)
- `PORTIDS_BEFORE_AFTER_COMPARISON.md` (+326行)
- `PORTIDS_DISPLAY_TEST_GUIDE.md` (+255行)
- `QUICK_REFERENCE.md` (+133行)
- `README_BUGFIX_COMPLETE_20260225.md` (+351行)
- `SESSION_PERSISTENCE_AND_AVATAR_FIX_REPORT.md` (+294行)
- `START_DEPLOYMENT_NOW.md` (+225行)
- `SYSTEM_STARTUP_VERIFICATION_20260225.md` (+283行)

#### 📊 统计信息
- **新增代码**: 19,449+ 行
- **删除代码**: 260 行
- **净增长**: 19,189 行
- **前端组件**: +7个
- **API端点**: +8个
- **国际化**: 中英文完整翻译
- **文档**: +38个 (13,000+行)

---

## 🔍 功能演进总览

### 数据库演进
1. **M1**: H2 → MySQL (enquiry_records)
2. **M4**: enquiry_records → enquiry + 主数据表 (11个表)
3. **M5**: 多POL/POD (enquiry_pol, enquiry_pod)
4. **M7**: RBAC + 审计 (users, roles, audit_log等, 6个表)
5. **M9**: 审计日志增强

**当前总表数**: 约20个表

### 后端演进
1. **M1**: 基础CRUD (1个实体, 1个Controller)
2. **M4**: 主数据管理 (11个实体, 3个Controller)
3. **M5**: 多港口支持 (13个实体, 5个Controller)
4. **M6**: 统计报表 (5个DTO, StatisticsService)
5. **M7**: RBAC + 审计 + 报表增强 (17个实体, 12个Controller)
6. **M9**: 用户管理 + 审计增强

**当前统计**:
- **实体**: 20+ 个
- **Controller**: 12+ 个
- **Service**: 10+ 个
- **Repository**: 20+ 个
- **DTO**: 30+ 个
- **API端点**: 60+ 个

### 前端演进
1. **M1**: 基础表单表格 (3个组件)
2. **M4**: 询价表单重构 (4个组件)
3. **M5**: 主数据管理 + 虚拟化 (13个组件)
4. **M6**: Dashboard报表 (2个组件)
5. **M7**: 报表增强 + 权限 (6个组件)
6. **M9**: 用户管理 + 审计日志 + i18n (7个组件)
7. **M10**: Bug修复 + 功能优化 (分页导航增强)

**当前统计**:
- **组件**: 40+ 个
- **页面**: 8+ 个
- **服务**: 6个 (api, reportApi, settingsApi, 及更多)
- **国际化**: 中英文完整支持
- **Bug修复率**: 100% (3/3主要问题)

### 文档演进
1. **M1**: 3个文档
2. **M2**: +2个部署文档
3. **M4**: +3个设计文档
4. **M5**: +29个实现报告
5. **M6**: +7个设计文档
6. **M7**: +7个实现报告
7. **M8**: +1个优化报告
8. **M9**: +38个完成报告
9. **M10**: +1个Bug修复报告

**当前统计**: 100+ 个Markdown文档 (M10 新增里程碑记录)

---

## 📈 代码统计汇总

### 总体统计
- **提交次数**: 15次重要提交
- **开发周期**: 2025-11-24 至 2026-03-04 (约3.3个月)
- **总代码行数**: 约41万行 (含文档和日志)
- **净业务代码**: 约10万行
- **文档**: 约3.1万行

### M10 更新统计
- **Bug修复**: 3个 (API响应、Null Safety、类型转换)
- **功能增强**: 分页导航按钮 (首页/末页)
- **修改文件**: 6个
- **总测试通过**: 24/24 关键用例

### 技术债务
- 日志文件过大 (已在M8清理) ✅
- API 空响应处理 (已在M10修复) ✅
- Null Safety 检查 (已在M10修复) ✅
- 测试覆盖率需提升
- 性能监控需加强 (虚拟化优化已在M5/M8完成)
- API文档需补充
- **待优化**: Sales PIC编辑表单country_code过滤逻辑 (M10确认为设计问题)

---

## 🎯 下一步规划
1. **完善测试** - 单元测试、集成测试、E2E测试
2. **性能优化** - 数据库查询优化、前端渲染优化
3. **监控告警** - 日志监控、性能监控、错误告警
4. **API文档** - Swagger/OpenAPI文档
5. **移动端适配** - 响应式优化、PWA支持
6. **数据分析** - BI集成、高级分析功能
7. **工作流引擎** - 询价流程自动化
8. **消息通知** - 邮件、站内信、推送

---

## 📞 联系方式
- **项目**: LogiTrack
- **作者**: Davian Liang
- **Git仓库**: [查看各分支提交历史]

---

---

### M10: 前端Bug修复与功能优化 (2026-03-04)

**状态**: 进行中  
**作者**: Davian Liang  
**日期**: 2026-03-04  

#### 🎯 目标需求
修复前端API响应处理和空值安全问题，优化用户界面交互体验，添加分页导航功能。

#### ✨ 主要功能

1. **API响应处理修复**
   - **问题**: Spring Boot DELETE/PUT 返回空响应体 (200/204)，导致 `response.json()` 失败，被误报为404错误
   - **解决方案**: 修改 `api.ts` 的 `request<T>()` 函数
     - 检查 Content-Length 头是否为 0
     - 检查 Content-Type 是否为 JSON
     - 空响应返回 `undefined` 而非尝试 JSON.parse()
   - **影响范围**: 所有主数据CRUD操作 (Port, SalesPic, Country, ContainerType)
   - **修复验证**: 所有DELETE操作功能测试通过 ✅

2. **Null Safety 修复**
   - **问题**: `SalesPicList.tsx` 搜索过滤器在 `salesOfficeCode` / `salesOfficeName` 为 null 时调用 `.toLowerCase()`，导致崩溃
   - **错误信息**: "Cannot read properties of null (reading 'toLowerCase')"
   - **解决方案**: 使用空值合并操作符 (Null Coalescing Operator)
     ```typescript
     (pic.salesOfficeCode ?? '').toLowerCase()
     (pic.salesOfficeName ?? '').toLowerCase()
     ```
   - **预防措施**: 已更新搜索过滤逻辑确保安全
   - **测试**: 搜索功能验证通过 ✅

3. **TypeScript类型修复**
   - **问题**: `EnquiryForm.tsx` Badge 组件接收 number 值，但 badge 属性要求 string
   - **报错**: `Type 'number | undefined' is not assignable to type 'string'`
   - **解决方案**: 添加 `.toString()` 转换
     ```typescript
     // 修改前
     badge={formData.offers?.length}
     // 修改后
     badge={formData.offers?.length?.toString()}
     ```
   - **验证**: TypeScript 编译通过 ✅

4. **分页导航功能增强**
   - **页面跳转按钮**
     - 添加 ChevronsLeft (⏮) 图标 - 跳转到第一页
     - 添加 ChevronsRight (⏭) 图标 - 跳转到最后一页
     - 正确的禁用状态逻辑
   - **受影响组件**
     - `PortList.tsx` - 港口管理
     - `SalesPicList.tsx` - 销售人员管理
   - **优化目标**: 支持 42,020+ 港口记录和 1,114+ 销售人员记录的快速导航

5. **Sales PIC 编辑表单问题分析** (根本原因确认)
   - **症状**: 编辑 Sales PIC 记录时，Sales Office 下拉框显示 "Select Office..." (空)
   - **根本原因**: 数据模型理解误区
     - `sales_pic.country_code` = 销售人员所在国家 (例: "CN")
     - `dict_sales_office.country_code` = 办事处所在国家 (例: "BE") 或 "AGENTS" 分类
     - 两个字段是**独立的**，不存在必然对应关系
   - **错误实现**: 按 `country_code` 过滤 offices 导致列表为空
     ```typescript
     // 错误逻辑
     availableOffices = salesOffices.filter(o => o.countryCode === pic.countryCode)
     // 结果：Davian (country_code="CN") 的 office (country_code="BE") 被过滤掉
     ```
   - **待修复**: 需要移除country_code过滤，直接显示所有办事处

#### 📊 数据库洞察
- `dict_sales_office` country_code 分布:
  - "AGENTS": 168 条 (80%)
  - "GB": 12 条, "OTHERS": 9 条, "CN": 7 条
  - 其他: BE, CH, DE, FR, GR, MA, NL, PL, TB, US 各1条
- `sales_pic.country_code` 为独立业务字段，与办事处国家无直接关系

#### 📦 影响文件 (6个)

**前端服务**
- `logitrack-pro/services/api.ts` (修改lines 55-120)
  - 新增响应体检查逻辑
  - 处理204/200无内容场景
  - 错误处理增强

**前端组件**
- `logitrack-pro/components/master-data/PortList.tsx` (修改)
  - 添加 ChevronsLeft/ChevronsRight 导入
  - 添加第一页/最后一页按钮
  - 按钮禁用状态逻辑

- `logitrack-pro/components/master-data/SalesPicList.tsx` (修改)
  - 搜索过滤器 null safety 修复
  - 添加 ChevronsLeft/ChevronsRight 导入
  - 添加第一页/最后一页按钮
  - 编辑函数调整 (部分)

- `logitrack-pro/components/enquiry/EnquiryForm.tsx` (修改)
  - Badge 类型转换修复 (line ~1161)
  - `.toString()` 添加

**测试验证**
- 功能测试脚本验证 (PowerShell)
  - CRUD 操作测试通过
  - DELETE 404 问题解决
  - 搜索功能测试通过

#### 📊 统计信息
- **修改文件**: 6个
- **代码行数**: ~100行修改
- **Bug修复**: 3个
- **功能增强**: 1个
- **测试通过**: ✅ 24/24 关键用例

#### 🔍 技术细节

**API 响应处理改进**
```typescript
// 新增响应体验证逻辑
const contentType = response.headers.get('content-type');
const contentLength = response.headers.get('content-length');
if (
  response.status === 204 ||
  contentLength === '0' ||
  !contentType ||
  !contentType.includes('json')
) {
  return undefined as unknown as T;
}
return response.json();
```

**Null Safety 模式**
```typescript
// 使用空值合并运算符
const searchLower = (value: string | null | undefined) => (value ?? '').toLowerCase();
// 应用于搜索过滤
const matchesSearch = !searchTerm || 
  searchLower(pic.salesOfficeCode).includes(searchTerm.toLowerCase()) ||
  searchLower(pic.salesOfficeName).includes(searchTerm.toLowerCase());
```

#### 🎯 下一步
1. 修复 Sales PIC 编辑表单预填充问题
   - 移除 country_code 过滤逻辑
   - 直接绑定所有可用办事处
   - 验证与测试

2. 完整的功能测试验证
   - 所有主数据模块CRUD
   - 分页导航功能
   - 表单编辑流程

3. 用户验收测试 (UAT)
   - 邮箱列表搜索功能
   - 表单交互体验
   - 性能基准测试

---

---

### M11: 历史数据迁移与校验 (2026-03-03)

**提交信息**: `data: 历史询价数据迁移 chinese Pricing.csv → MySQL`  
**提交Hash**: `-`  
**作者**: Davian Liang  
**日期**: 2026-03-03

#### 🎯 目标需求
将 `chinese Pricing.csv`（Tab分隔，9265行，2025年询价数据）正确迁移至 MySQL `logitrack` 数据库，替换之前错误的14,016条旧数据。

#### ✨ 主要工作

1. **清除旧错误数据**
   - 清空 `enquiry`（14,016行）、`offer`（13,156行）、`enquiry_pol`、`enquiry_pod`、`enquiry_container_line` 五张表
   - 重置 AUTO_INCREMENT

2. **新迁移脚本 `migrate_cn_pricing_v3.py`**
   - 适配新CSV格式：34列、Tab分隔，Col 10（`CN office Grouping`）跳过不导入
   - 数据质量规则：
     - `Quantity` 含逗号数字（如 `3,022.00`）→ 正确解析为浮点数
     - `Quantity` 非数字（TBA等）→ 写 NULL，保留 `quantity_raw_text`
     - `Quantity(Unit)` 仅 `KG` 和容器类型有效；其他 → NULL
     - `Cargo Ready Date` 为 `TBA`/`-` → 写 NULL，**不保留** `raw_text`
     - Unicode 智能引号（`'`/`'`）→ 自动替换为 ASCII `'`
     - `qty`/`unit` 列互换（19处）→ 自动检测并纠正
   - 容器类型处理：单柜型直接入 `enquiry_container_line`；多柜型（如 `20'GP/40'HQ`）按 TEU 算法拆分数量
   - 使用 `INSERT IGNORE` + re-select 模式处理主数据重复键冲突

3. **迁移结果**
   - `enquiry` 导入：**9,263 行**（成功率 99.98%）
   - `offer` 报价记录：9,440 行
   - `enquiry_container_line` 容器明细：3,542 行
   - 2条失败：1条为CSV源文件重复reference；1条为产品码外键约束（异常源数据）

4. **数据校验脚本 `validate_migration.py`**
   - 行数校验：期望 9,264，实际 9,263 ✅
   - 字段值抽样校验（500条）：无实质性差异（`UK` vs `United Kingdom` 属国家全名，正确）
   - 外键完整性：`broken_country`/`broken_pol`/`broken_pod`/`broken_offer`/`broken_ecl` 全部为 **0** ✅
   - TBA日期校验：`cargo_ready_date_raw_text` 为 NULL 的行 = 0 ✅

5. **多港口修复脚本 `fix_multiport.py`**
   - 问题：POL/POD 含 `/` 分隔多港口（如 `Felixstowe/Liverpool/Portbury/Southampton/Grangemouth`）被错误拼接为单个端口码
   - 修复：拆分所有 POL/POD 字符串，按顺序写入 `enquiry_pol`/`enquiry_pod` 关联表，`enquiry.pol_id`/`pod_id` 更新为第一个有效港口
   - 修复范围：多POL 53条、多POD 244条
   - 修复结果：
     - `enquiry_pol` 总行数：9,355
     - `enquiry_pod` 总行数：9,550
     - 更新 `enquiry.pol_id`：55条
     - 更新 `enquiry.pod_id`：263条
     - 新建拆分港口：57个

#### 📦 新增/修改文件 (5个)

| 文件 | 类型 | 说明 |
|------|------|------|
| `database/migrate_cn_pricing_v3.py` | 新增 | 主迁移脚本（951行） |
| `database/fix_multiport.py` | 新增 | 多港口拆分修复脚本 |
| `database/validate_migration.py` | 新增 | 数据校验脚本 |
| `database/analyze_quality_new.py` | 新增 | 数据质量分析脚本 |
| `database/chinese Pricing.csv` | 更新 | 源数据文件（9265行，2.2MB） |

#### 📊 统计信息
- **迁移行数**: 9,263 / 9,265（99.98%）
- **关联数据**: offer 9,440行 + container_line 3,542行 + pol 9,355行 + pod 9,550行
- **自动修复**: qty/unit互换 19处、TBA日期→NULL 7,628处、含逗号数量 1,452处
- **数据质量**: 外键一致性 100%，字段值校验通过

#### 🔍 关键技术细节

**容器TEU拆分算法**
```python
# 多柜型 (如 20'GP/40'GP, qty=2, TEU=3) → exact方法
for combo in iproduct(range(1, qty+1), repeat=n):
    if sum(combo) == qty:
        teu_sum = sum(combo[i] * teus[i] for i in range(n))
        if abs(teu_sum - teu) < 0.01:
            return list(zip(container_codes, combo))  # [(20GP,1),(40GP,1)]
```

**qty/unit互换检测**
```python
# unit是纯数字 且 qty是容器类型字符串 → 自动交换
if is_numeric_string(unit_s) and is_container_string(qty_s):
    qty_s, unit_s = unit_s, qty_s  # swap
```

**多港口拆分**
```python
# 'Felixstowe/Liverpool/Portbury' → seq插入enquiry_pod
for seq, port_name in enumerate(split_ports(pod_raw), start=1):
    pid = get_or_create_port(port_name)
    cursor.execute('INSERT IGNORE INTO enquiry_pod (enquiry_id, port_id, sequence) VALUES (%s,%s,%s)', (enq_id, pid, seq))
```

---

*本文档由代码提交历史自动生成，详细的代码变更请参考Git提交记录。*

---

### M12: 增强报表弹窗数据修复 (2026-03-04)

**作者**: Davian Liang  
**日期**: 2026-03-04

#### 🎯 目标需求
修复增强报表（增强报表页）CN Office 统计表格点击钻取弹窗的两个数据正确性 Bug，并提升弹窗加载性能。

#### 🐛 问题描述

**Bug 1 – Invalid 始终显示 0 条**
- **现象**：点击 SHENZHEN 行的 "Invalid" (6) 后，弹窗显示 "0 Records"。
- **根因**：`EnquiryListModal.tsx` 中 `getBackendStatus('invalid')` 返回 `''`（空字符串），前端过滤条件 `e.bookingConfirmed === ''` 永远无法匹配数据库中存储的 `'Invalid'` 字符串。

**Bug 2 – Confirmed 显示 213 而非 227**
- **现象**：统计表显示 SHENZHEN Confirmed = 227，点开弹窗只显示 213 条。
- **根因**：弹窗使用 `enquiryApi.list({ pageSize: 1000 })` 拉取数据，而该时间段内总询价数为 1107 条，超出 1000 的分页上限，导致 107 条记录从未被拉取；前端只在这 1000 条内过滤，漏算了剩余 107 条中的 14 条 SHENZHEN+Yes 记录。

**Bug 3 – 加载速度慢**
- **根因**：拉取 1000 条通用列表数据后在前端做多重 client-side 过滤，既浪费带宽又增加渲染耗时。

#### ✅ 修复方案

1. **新增后端 API `GET /api/statistics/office-enquiries`**
   - 接受参数：`officeName`、`bookingStatus`（Yes/Rejected/Invalid/Pending）、`startDate`、`endDate`，以及可选的 `coreFlags`、`products`、`countries`
   - 复用 `StatisticsService.getFilteredEnquiries()` 进行日期/产品/国家过滤，再追加 `officeName` 和 `bookingStatus` 精确匹配
   - 直接在数据库层完成全量过滤，无分页截断

2. **修复 `getBackendStatus('invalid')` 返回值**
   - 由错误的 `''` 改为正确的 `'Invalid'`

3. **`EnquiryListModal.tsx` 重构**
   - 移除旧的 `enquiryApi.list({ pageSize: 1000 })` + 客户端多重过滤逻辑
   - 改为调用新的 `reportApi.getOfficeEnquiries()` 接口，一次性从后端获取精确结果

#### 📦 影响文件 (4个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `backend/src/main/java/com/logitrack/backend/service/StatisticsService.java` | 新增方法 | 新增 `getOfficeEnquiries()` 方法，后端精确过滤 |
| `backend/src/main/java/com/logitrack/backend/controller/StatisticsController.java` | 新增 endpoint | 新增 `GET /api/statistics/office-enquiries` |
| `logitrack-pro/services/reportApi.ts` | 新增函数 | 新增 `getOfficeEnquiries()` 前端 API 调用 |
| `logitrack-pro/components/report/EnquiryListModal.tsx` | Bug修复 | 修复 `getBackendStatus('invalid')` 返回值 + 改用后端 API |

#### 📊 验证结果

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| SHENZHEN Invalid | 0 | **6** ✅ |
| SHENZHEN Confirmed | 213 | **227** ✅ |
| 数据加载方式 | 前端拉 1000 条 client-side 过滤 | 后端精确查询 |

#### 🔍 关键代码变更

**`getBackendStatus` 修复（EnquiryListModal.tsx）**
```typescript
// 修复前
case 'invalid':
  return '';  // ❌ 空字符串永远匹配不上 'Invalid'

// 修复后
case 'invalid':
  return 'Invalid';  // ✅ 正确映射
```

**新增后端 bookingStatus 过滤逻辑（StatisticsService.java）**
```java
// 按 bookingStatus 精确过滤（支持 null=Pending）
enquiries = enquiries.stream()
    .filter(e -> {
        Enquiry.BookingConfirmed bc = e.getBookingConfirmed();
        if ("Pending".equalsIgnoreCase(bookingStatus)) {
            return bc == null || bc == Enquiry.BookingConfirmed.Pending;
        } else if ("Invalid".equalsIgnoreCase(bookingStatus)) {
            return bc == Enquiry.BookingConfirmed.Invalid;
        }
        // ... Yes / Rejected
    }).collect(Collectors.toList());
```

### 2026-03-04: 时期对比报告功能增强与趋势图表升级

**功能改进**:
- **筛选条件拓展**: 在时期对比报告(`ComparisonReport.tsx`) 中加入了与增强报表一致的 `country`（目的国）和 `product`（产品）多选维度过滤，并透传给后端 `PeriodComparisonRequestDTO` 进行数据匹配。
- **趋势分析图表重构**: 在趋势图组件 (`TrendChart.tsx`) 中引入了更加直观且强大的 Recharts `ComposedChart`（混合图），整合了折线图和柱状图的展示（将总量、报价数、确认数作为柱状，把转化率作为折线双 Y 轴呈现），提高多指标对比直观度。
- **数据卡片展示**: 新增基于期内总量、转换率和整体增长趋势的 Insight 数据卡片，提供直观的指标文字总结分析。
- **双语支持**: 所有新加入的趋势图组件与筛选组件文本均基于环境的 `language` 动态计算支持全功能中英双语无缝切换。

---

### M13: 时期对比报告增强与趋势图表全面升级 (2026-03-04)

**作者**: Davian Liang  
**日期**: 2026-03-04

#### 🎯 目标需求
1. 在时期对比报告的筛选区域加入与增强报表页 Data Filter 一致的 Country（目的国）和 Product（产品）筛选维度
2. 为趋势分析图增加更多更清晰好看的图形类型
3. 设计更清晰的趋势分析，支持按月份/季度对比数据趋势
4. 趋势分析功能全面支持中英文双语切换

#### ✨ 主要功能

##### 1. 筛选条件优化（ComparisonReport.tsx）
- **UI 重构**：为筛选区域添加统一的 `数据筛选 / Data Filters` 标题栏和活跃筛选项数量徽章
- **产品筛选视觉升级**：由普通 checkbox 升级为 toggle-button 样式，选中状态高亮，与增强报表风格统一
- **国家搜索框**：在国家多选列表上方新增实时搜索输入框（支持中文名/英文名/国家代码模糊匹配），方便在数百个国家中快速定位
- **类型系统修复**：在 `types.ts` 的 `PeriodComparisonRequest` 接口中补充 `countryIds?: number[]` 和 `productCodes?: string[]` 字段，消除 TypeScript `TS2353` 编译错误

##### 2. 趋势图表全面升级（TrendChart.tsx）
全文重写，新增 6 种可切换图表类型：

| 类型 | 说明 |
|------|------|
| **综合图（Composed）** | 柱状（总量/报价/确认）+ 折线（转化率双 Y 轴），默认视图 |
| **面积图（Area）** | 渐变填充面积，三条序列叠加，视觉层次感强 |
| **折线图（Line）** | 双 Y 轴，实线 + 虚线区分，转化率单独右轴 |
| **柱状图（Bar）** | 分组柱状，交替透明度增强区分度 |
| **雷达图（Radar）** | 多边形对比，每个时期为一个雷达系列，适合多时期横向对比 |
| **增长率图（Growth）** | 绿/红双色柱状显示环比增长/下降，叠加总量折线辅助参考 |

##### 3. 趋势分析 Insight 卡片
底部 4 个指标卡片：
- **趋势走向**：首期→末期方向，上升📈 / 下降📉
- **转化效率**：平均转化率，≥25% 显示"表现优秀"
- **最佳时期**：highest 询价量时期 + 峰值数字
- **总量统计**：所有时期合计询价量

##### 4. 时期环比增长明细列表
图表下方新增带排名徽章的明细列表：
- **排名序号**：按询价量倒序排名
- **迷你进度条**：可视化展示当期占峰值的比例
- **环比徽章**：绿色 `+x%` / 红色 `-x%` 颜色区分增减
- **转化率**：紫色字体右对齐展示当期转化率

##### 5. 中英双语全覆盖
- 图表切换按钮标签全部双语化
- Insight 卡片文案、数据标签、提示词均响应 `useLanguage()` hook
- 首期环比标注（中文："首期"，英文："1st"）

#### 📦 影响文件 (3个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `logitrack-pro/components/report/TrendChart.tsx` | 全面重写 | 6种图表类型、Insight卡片、环比明细列表、中英双语 |
| `logitrack-pro/components/report/ComparisonReport.tsx` | 功能增强 | 筛选UI重构、产品toggle按钮、国家实时搜索、筛选项数量徽章 |
| `logitrack-pro/types.ts` | 类型补充 | `PeriodComparisonRequest` 新增 `countryIds` 和 `productCodes` 字段 |

#### 🔍 关键代码变更

**TrendChart.tsx — 新增图表类型**
```typescript
type ChartType = 'composed' | 'area' | 'line' | 'bar' | 'radar' | 'growth';

// 6 个切换按钮
const chartButtons: { type: ChartType; icon: React.ReactNode; label: string }[] = [
  { type: 'composed', icon: <Activity />, label: t.composedChart },
  { type: 'area',    icon: <Layers />,   label: t.areaChart },
  { type: 'line',    icon: <LineChartIcon />, label: t.lineChart },
  { type: 'bar',     icon: <BarChart3 />, label: t.barChart },
  { type: 'radar',   icon: <Radio />,    label: t.radarChart },
  { type: 'growth',  icon: <TrendingUp />, label: t.growthChart },
];
```

**TrendChart.tsx — 增长率图数据准备**
```typescript
const growthData = data.periodStats.map((stat, i) => {
  const prev = i > 0 ? data.periodStats[i - 1].totalEnquiries : null;
  const growthVal = prev !== null && prev > 0
    ? Number((((stat.totalEnquiries - prev) / prev) * 100).toFixed(1))
    : null;
  return { period: stat.period, [t.growthRate]: growthVal, total: stat.totalEnquiries };
});
```

**ComparisonReport.tsx — 国家搜索框**
```tsx
const filteredCountries = useMemo(() => {
  const q = countrySearch.trim().toLowerCase();
  if (!q) return availableCountries;
  return availableCountries.filter((c) => {
    const en = c.countryNameEn?.toLowerCase() ?? '';
    const cn = c.countryNameCn?.toLowerCase() ?? '';
    const code = c.countryCode?.toLowerCase() ?? '';
    return en.includes(q) || cn.includes(q) || code.includes(q);
  });
}, [availableCountries, countrySearch]);
```

**types.ts — 类型扩展**
```typescript
export interface PeriodComparisonRequest {
  comparisonType: ComparisonType;
  periods: string[];
  coreFlags?: ('CORE' | 'NON_CORE')[];
  cnOffice?: string;
  countryIds?: number[];    // ✅ 新增
  productCodes?: string[];  // ✅ 新增
}
```

---

### M14: AI 数据分析问答助手 Phase 1-2 (2026-03-12 ~ 2026-03-25)

**作者**: Davian Liang  
**日期**: 2026-03-12 ~ 2026-03-25  
**AI 模型**: DeepSeek V3 (`deepseek-chat`) / 备用 claude-sonnet-4-6 via n1n.ai

#### 🎯 目标需求
在 LogiTrack 系统中集成 AI 数据分析问答助手，实现以下四阶段功能路线图：

| 阶段 | 功能 | 状态 |
|------|------|------|
| Phase 1 | Function Calling 框架（后端 10 个分析函数） | ✅ 完成 |
| Phase 2 | Chat UI + Recharts 图表渲染 + 报表联动导航 | ✅ 完成 |
| Phase 3 | Text-to-SQL 自由查询（安全白名单层） | ⬜ 待开发 |
| Phase 4 | 多模型优化、缓存、流式响应 | ⬜ 待开发 |

---

#### ✨ Phase 1 — Function Calling 框架

##### 1.1 后端新增文件

**`AiChatController.java`**（新建）
```java
@RestController
@RequestMapping("/api/ai")
public class AiChatController {
    @GetMapping("/ping")   // AI 服务健康检查
    @PostMapping("/chat")  // 主对话入口（携带 history 上下文）
}
```

**`AiChatService.java`**（新建）
- 向 DeepSeek / claude API 发送带 Function Calling tools 描述的请求
- 解析 `tool_calls` 响应，调用 `AiAnalysisFunctions.call(funcName, argsJson)`
- 二次请求把函数返回值作为 `tool` 消息传回 AI 生成最终回答
- 返回 `AiChatResponse`（含 `reply`、`functionCalled`、`chartData`、`suggestions`）
- 双模型兼容：标准 OpenAI `tools` 格式（DeepSeek）与 Anthropic `tools` 格式（Claude）

**`AiAnalysisFunctions.java`**（新建，790 行）

实现 10 个统计分析函数：

| 函数名 | 功能描述 | 返回 chartData key |
|--------|----------|-------------------|
| `get_enquiry_overview` | 指定月份询价总览（含环比） | `month`, `totalEnquiries`, `confirmed`, `conversionRate` |
| `get_monthly_trend` | 最近 N 个月趋势序列 | `trend[]`（month/totalEnquiries/confirmed/conversionRate） |
| `get_conversion_rate` | 指定期间转化率 + 按办公室分组 | `byOffice[]` |
| `get_cargo_type_breakdown` | 货运类型构成（FCL/LCL/AIR） | `cargoTypeBreakdown[]`（cargoType/count/percentage） |
| `get_destination_analysis` | Top-N 目的国询价量排名 | `topDestinations[]`（country/count/percentage） |
| `get_cn_office_performance` | 各 CN 办公室询价量与转化率 | `cnOfficePerformance[]`（office/total/confirmed/conversionRate） |
| `get_period_comparison` | 多期（月/季度）询价量对比 | `periods[]`（period/totalEnquiries/confirmed/conversionRate） |
| `get_product_breakdown` | 产品类型分布（AIR/SEA/RAIL） | `productBreakdown[]`（product/count/percentage） |
| `get_core_vs_non_core` | CORE 与 NON-CORE 询价对比 | `CORE`/`NON_CORE` 对象（total/confirmed/conversionRate） |
| `get_cross_analysis` | 多维度交叉分析（办公室/货运类型/目的地/产品，支持多条件过滤） | `data[]`（group/total/quoted/confirmed/conversionRate） |

**`AiChatRequest.java` / `AiChatResponse.java`**（新建 DTO）
```java
public class AiChatResponse {
    private String reply;           // AI 自然语言回答
    private String functionCalled;  // 调用的函数名
    private String chartData;       // 函数返回值（JSON 字符串，用于前端图表）
    private List<String> suggestions; // AI 推荐的后续问题
    private String error;
}
```

##### 1.2 AI 安全防护规则（System Prompt）
- 严格限制：不返回客户姓名/联系方式/邮箱、不返回具体报价数字、不执行 SQL、不推断未来利润
- 数据来源：仅通过 10 个白名单函数，不直接访问数据库
- 边界回复：对超出范围的问题礼貌拒绝并建议替代问法

##### 1.3 前端 AI API 服务（新建）
**`services/aiApi.ts`**
```typescript
export interface ChatResponse {
  reply: string;
  functionCalled?: string;
  chartData?: string;
  suggestions?: string[];
  error?: string;
}
// aiApi.ping()  — 健康检查
// aiApi.chat({ message, history }) — 发送消息
```

##### 1.4 配置（`application.properties`）
```properties
# 当前激活：DeepSeek V3
ai.provider=deepseek
ai.api-key=sk-56e308880de742d38009ec392fbe458d
ai.model=deepseek-chat
ai.endpoint=https://api.deepseek.com/chat/completions
# 备用：claude-sonnet-4-6 via n1n.ai
# ai.model=claude-sonnet-4-6
# ai.endpoint=https://api.n1n.ai/v1/chat/completions
```

##### 1.5 测试结果
- **DeepSeek V3**：18/18 场景全部通过 ✅
- **claude-sonnet-4-6**：18/18 场景全部通过 ✅
- 测试场景覆盖：基础数据查询（B1-B3）、边界/幻觉防护（H1-H4）、安全防护（S1-S5）、复杂分析（C1-C4）

---

#### ✨ Phase 2 — Chat UI + Recharts 图表 + 报表联动导航

##### 2.1 新增主面板（新建）
**`components/ai/AIChatPanel.tsx`**
- 布局：顶部状态栏 + 消息列表区（`overflow-y-auto`）+ 快捷问题 + 底部输入框
- 状态管理：`messages: DisplayMessage[]`（含 `chartData`、`functionCalled`、`isLoading` 扩展字段）
- 历史上下文：自动过滤 welcome/loading 消息，传入 `history` 参数维持多轮对话
- 快捷问题：6 个预设问题按钮（本月总量、近6月趋势、CN办公室、FCL/LCL/AIR、CORE/NON-CORE、跨类型转化率）
- **导航 Prop**：
```typescript
interface AIChatPanelProps {
  onNavigateToDashboard?: (filter: Partial<DashboardFilterParams>) => void;
}
```
- **`buildDashboardFilter()` 辅助函数**：从 `chartData` JSON 自动提取日期范围，支持：
  - `trend[].month`（`YYYY-MM` 格式，取首尾月）
  - `periods[].period`（月度格式）
  - `period: "YYYY-MM-DD ~ YYYY-MM-DD"`（字符串切割）
  - `month: "YYYY-MM"`（单月视图）
  - 默认 fallback：最近 6 个月

##### 2.2 消息气泡（重写图表区域）
**`components/ai/MessageBubble.tsx`**

新增 `AiChartWidget` 组件，当助手回复含 `chartData` 时自动渲染对应图表：

**图表类型自动识别（`detectChartType`）**：

| 后端返回 key | 识别类型 | 渲染组件 |
|-------------|---------|----------|
| `trend[]` | `line-trend` | `LineTrendChart` |
| `periods[]` | `bar-comparison` | `BarComparisonChart` |
| `cargoTypeBreakdown[]` / `topDestinations[]` / `productBreakdown[]` | `bar-breakdown` | `CssBarChart` |
| `cnOfficePerformance[]` / `byOffice[]` / `offices[]` | `bar-office` | `CssBarChart` |
| `data[]`（交叉分析） | `bar-group` | `CssBarChart` |
| 无以上 key | `none`（有 onNavigate 时仍显示按钮） | — |

**三种图表组件**：

- **`LineTrendChart`**（Recharts `ComposedChart`）
  - 双 Y 轴：左轴询价量（蓝色柱 `#3B82F6` + 绿色柱 `#10B981`），右轴转化率（琥珀折线 `#F59E0B`）
  - X 轴：月份字符串，自定义 `CustomTooltip`
  
- **`BarComparisonChart`**（Recharts `ComposedChart`）
  - 与 `LineTrendChart` 相同布局，X 轴为 period 字符串
  
- **`CssBarChart`**（纯 CSS，替代 Recharts 水平柱图）
  - 用 `<div>` 进度条代替 SVG，兼容性更好、渲染必定可见
  - 双层进度条：蓝色（询价量）+ 绿色（已确认）+ 右侧转化率文字
  - 最多展示 10 条，自动截断

**`AiChartWidget` 布局结构**（由上至下）：
```
┌──────────────────────────────────────────┐
│ 📊 数据图表              （标题，无按钮） │
├──────────────────────────────────────────┤
│  图表内容（LineTrendChart / CssBarChart）│
├──────────────────────────────────────────┤
│ [🔗 前往报表详情] （footer，仅有回调时） │
└──────────────────────────────────────────┘
```
> **关键设计**：导航按钮位于 **底部 footer**，确保自动滚动后用户看到图表内容再看到按钮。

##### 2.3 App.tsx 导航回调（修改）
**`App.tsx`** — `case 'ai-chat'`：
```tsx
<AIChatPanel
  onNavigateToDashboard={(filter) => {
    if (filter.startDate && filter.endDate) {
      setEnhancedDashboardFilter({
        startDate: filter.startDate,
        endDate: filter.endDate,
        ...filter,
      });
    }
    setCurrentView('report-enhanced');
  }}
/>
```
- 点击「前往报表详情」→ 自动提取日期范围填入 `enhancedDashboardFilter` → 跳转增强报表视图
- `EnhancedDashboard` 的 `savedFilter` prop 会在挂载时自动应用筛选条件

---

#### 🐛 修复记录

| 问题 | 根因 | 修复方式 |
|------|------|----------|
| 图表不显示 | `detectChartType` 字段名与后端不匹配（`cargoBreakdown` vs `cargoTypeBreakdown` 等） | 补充所有后端实际返回 key 的识别逻辑 |
| 图表区域不可见 | 导航按钮在 widget 头部，聊天自动滚动使图表内容落在视口外 | 将按钮移至底部 footer |
| 水平柱图空白 | Recharts v3 `BarChart + layout="vertical"` SVG 尺寸计算异常 | 替换为纯 CSS 进度条（`CssBarChart`） |
| `buildDashboardFilter` 只支持 trend/periods | 其他 6 个函数返回 `period: "start ~ end"` 或 `month` 格式未处理 | 添加 `~` 分割和 `YYYY-MM` 单月格式解析 |

---

#### 📁 变更文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `backend/src/.../ai/AiChatController.java` | **新建** | REST 端点 `/api/ai/ping` + `/api/ai/chat` |
| `backend/src/.../ai/AiChatService.java` | **新建** | Function Calling 核心调度逻辑，双模型兼容 |
| `backend/src/.../ai/AiAnalysisFunctions.java` | **新建** | 10 个统计分析函数实现（790 行）|
| `backend/src/.../dto/AiChatRequest.java` | **新建** | 请求 DTO |
| `backend/src/.../dto/AiChatResponse.java` | **新建** | 响应 DTO（reply/functionCalled/chartData/suggestions）|
| `backend/src/main/resources/application.properties` | **修改** | AI provider/model/endpoint/api-key 配置 |
| `logitrack-pro/services/aiApi.ts` | **新建** | 前端 AI API 服务（ping + chat）|
| `logitrack-pro/components/ai/AIChatPanel.tsx` | **新建** | 主对话面板（含 onNavigateToDashboard prop + buildDashboardFilter）|
| `logitrack-pro/components/ai/MessageBubble.tsx` | **新建** | 对话气泡 + AiChartWidget + LineTrendChart + BarComparisonChart + CssBarChart |
| `logitrack-pro/App.tsx` | **修改** | ai-chat case 传入导航回调；enhancedDashboardFilter 联动 |
| `docs/AI_ASSISTANT_PROGRESS.md` | **新建** | AI 助手功能规划与进度文档 |

---

#### 📊 技术指标

| 指标 | 数值 |
|------|------|
| 新增后端代码行数 | ~1,050 行（Java）|
| 新增前端代码行数 | ~870 行（TSX/TS）|
| AI Function Calling 函数数量 | 10 个 |
| 测试通过率 | 18/18（DeepSeek V3 + claude-sonnet-4-6 各独立验证）|
| TypeScript 新增错误 | 0 |
| 支持图表类型 | 5 种（折线/柱状/对比柱/CSS进度条/交叉分组）|

---

### M14-V3: V3 重大重构 — 30天实施计划 Phase 1-3 (Day 1-25)

**日期**: 2026-03-01 ~ 2026-03-25
**核心功能**: 全面重构 LogiTrack 系统，对齐 V3 数据模型

#### 📝 变更说明 (详见各阶段文档)
- **Phase 1 (Day 1-10)**: 数据库迁移 (V3 5-状态模型)、全部 Entity/Repository/Service/Controller 更新、前端 types.ts + api.ts 重写、~190 TS 编译错误修复
- **Phase 2 (Day 11-16)**: 5个新 V3 UI 组件 (StatusChangeDialog, RouteGroupEditor, PriceDetailsTable, ContainerDetailsDialog, OfferDialog)
- **Phase 3 (Day 17-25)**: Offer 数据模型重构 (3 DTO)、Price Details 矩阵完善 (PortSearchInput, dual-mode)、Container Details 弹窗增强 (dropdown + summaries)、OfferDialog 自动生成、EnquiryDetail offers tab 增强

---

### M15: V3 Phase 4.1 — 功能测试 + Bug修复 + 类型对齐 (Day 26-27)

**日期**: 2026-03-26
**核心功能**: 功能测试、关键 Bug 修复、前后端类型一致性对齐

#### 📝 变更说明

##### 1. 遗留代码清理
- **OfferManagement.tsx** — 完全重写: 从 274 行遗留死代码 → V3 独立 Offer 管理面板 (表格 + OfferDialog 集成)

##### 2. 后端单元测试 (11 tests, all passing)
- **OfferServiceTest.java** (NEW) — 10 个测试方法:
  - `createOfferFromDTO`: 基础 FCL、空行过滤、容器详情、isLatest 管理
  - `updateOfferFromDTO`: 完整价格行替换
  - `deleteOffer`: 成功 + 未找到
  - `autoGeneratePriceLines`: 正常模式 POL×POD 笛卡尔积、空港口处理
  - `OfferCreateDTO.filterEmptyLines`: 空行过滤
- **StatisticsServiceTest.java** — 重写: 旧测试使用已删除的 `BookingConfirmed` 枚举, 改为 V3 5-状态模型

##### 3. JPA 枚举映射修复 (3 个 AttributeConverter)
| 转换器 | Java 枚举值 | 数据库值 |
|--------|------------|----------|
| `EnquiryStatusConverter` | `Quoted_Pending` | `Quoted & Pending` |
| `CoreNonCoreConverter` | `Non_Core` | `Non-Core` |
| `OfferTypeConverter` | `BUYER_CONSOL` | `BUYER-CONSOL` |

- `Enquiry.java`: `@Enumerated(EnumType.STRING)` → `@Convert(converter=...)` (status, coreNonCore, offerType)
- `Offer.java`: 同上 (offerType)

##### 4. Jackson JSON 序列化修复
- 3 个枚举类型添加 `@JsonValue` + `@JsonCreator` 注解
- 确保 JSON 输出与数据库 ENUM 值一致 (如 `"Quoted & Pending"` 而非 `"Quoted_Pending"`)

##### 5. line_teu 计算修复
- `OfferContainerDetail.lineTeu`: 从 `insertable=false, updatable=false` 改为可写
- `OfferService`: 新增 `detail.setLineTeu(teuValue * numberOfContainers)` 计算逻辑

##### 6. 前后端字段名对齐 (5 处不匹配)
| 前端旧字段名 | 后端实际字段名 | 影响文件 |
|--------------|---------------|---------|
| `cancelledText` | `cancelledReasonText` | types.ts |
| `lostText` | `lostReasonText` | types.ts |
| `quantityUom` | `uom` | types.ts, EnquiryDetail.tsx, EnquiryForm.tsx |
| `categoryCode` | `category` | types.ts, EnquiryDetail.tsx, EnquiryForm.tsx, Table.tsx |
| `additionalRequirement` | `cargoReadyDateDetails` | types.ts, EnquiryDetail.tsx, EnquiryForm.tsx, Table.tsx, Form.tsx |

##### 7. E2E API 测试验证
- ✅ 创建测试询价 (id=6, ref=CN2603002-S, status=New)
- ✅ 创建 FCL Offer (Container: 20GP×5, TEU=1.00, price=2000)
- ✅ 状态自动提升 (New → Quoted & Pending)
- ✅ 更新 Offer (类型变更 + 新增价格行)
- ✅ 删除 Offer (级联删除验证)

##### 8. 编译验证
- ✅ TypeScript: `tsc --noEmit` — 0 errors
- ✅ Vite build: 2366 modules → dist/ 生成成功
- ✅ Maven compile: clean (0 errors)
- ✅ Maven test: 11/11 pass, BUILD SUCCESS

#### 📁 变更文件清单
| 文件 | 状态 | 说明 |
|------|------|------|
| `OfferManagement.tsx` | **重写** | V3 offer 管理面板 |
| `OfferServiceTest.java` | **新建** | 10 个单元测试 |
| `StatisticsServiceTest.java` | **重写** | V3 状态模型测试 |
| `EnquiryStatusConverter.java` | **新建** | JPA Status 转换器 |
| `CoreNonCoreConverter.java` | **新建** | JPA CoreNonCore 转换器 |
| `OfferTypeConverter.java` | **新建** | JPA OfferType 转换器 |
| `Enquiry.java` | **修改** | @Convert + @JsonValue/@JsonCreator |
| `Offer.java` | **修改** | @Convert for offerType |
| `OfferContainerDetail.java` | **修改** | lineTeu 可写 |
| `OfferService.java` | **修改** | lineTeu 计算逻辑 |
| `types.ts` | **修改** | 5 个字段名修正 |
| `EnquiryDetail.tsx` | **修改** | 3 个字段引用修正 |
| `EnquiryForm.tsx` | **修改** | 3 个字段引用修正 |
| `Table.tsx` | **修改** | 1 个字段引用修正 |
| `Form.tsx` | **修改** | 1 个字段引用修正 |

---

### M16: V3 Phase 4.2 — 集成测试 + 回归 + 状态映射修复 (Day 28-29)

**日期**: 2026-03-24
**核心功能**: 全面集成审计、V3 状态/产品/货物类型映射修复

#### 📝 变更说明

##### 1. 后端 StatisticsService 状态键修复
- `buildStatusBreakdown()`: `e.getStatus().name()` → `e.getStatus().toJsonValue()`
  - 修复: JSON 键从 `"Quoted_Pending"` 变为 `"Quoted & Pending"`，与前端 `EnquiryStatus` 类型一致
- `getEnquiroesForOffice()`: 同上修复 `item.put("status", ...)` 逻辑

##### 2. Dashboard 状态标签/颜色映射 (3 个文件)
| 文件 | 修复内容 |
|------|---------|
| `EnhancedDashboard.tsx` | `'Quoted'`→`'Quoted & Pending'`, `'Confirmed'`→`'Secured'` (标签+颜色) |
| `Dashboard.tsx` | 同上 |
| `Table.tsx` | `StatusBadge` 组件: 旧3状态 → V3 5状态 |

##### 3. 搜索/筛选选项补全
| 文件 | 修复内容 |
|------|---------|
| `EnquiryList.tsx` | Cargo Type 下拉添加 `BUYER-CONSOL` |
| `ComparisonReport.tsx` | Product 选项添加 `RAIL-AIR`, `AIR-RAIL-SEA` |
| `DashboardFilters.tsx` | Product 选项添加 `RAIL-AIR`, `AIR-RAIL-SEA` |

##### 4. Legacy dataService.ts 清理
- 移除: `bookingConfirmed`, `rejectedReason`, `actualReason` (V3 不存在的字段)
- 修正: `additionalRequirement` → `cargoReadyDateDetails`
- 修正: `item.categoryCode` → `item.category`
- 修正: `item.quantityUomCode` → `item.uom`

##### 5. 验证结果
| 检查项 | 结果 |
|--------|------|
| TypeScript `tsc --noEmit` | **0 errors** |
| Vite build | **成功** (2366 modules) |
| Maven test | **11/11 pass, BUILD SUCCESS** |
| Dashboard API | `statusBreakdown` 键为 `"Quoted & Pending"` ✅ |
| Enquiry API | `status` 值为 `"Quoted & Pending"` ✅ |
| AI Chat | `get_enquiry_overview` 正常调用 ✅ |

#### 📁 变更文件清单
| 文件 | 状态 | 说明 |
|------|------|------|
| `StatisticsService.java` | **修改** | 2 处 `.name()` → `.toJsonValue()` |
| `EnhancedDashboard.tsx` | **修改** | V3 状态标签+颜色 |
| `Dashboard.tsx` | **修改** | V3 状态标签+颜色 |
| `Table.tsx` | **修改** | StatusBadge V3 5状态 |
| `EnquiryList.tsx` | **修改** | +BUYER-CONSOL 选项 |
| `ComparisonReport.tsx` | **修改** | +RAIL-AIR, AIR-RAIL-SEA |
| `DashboardFilters.tsx` | **修改** | +RAIL-AIR, AIR-RAIL-SEA |
| `dataService.ts` | **修改** | 移除废弃字段, 修正字段名 |

---

### M17: V3 Phase 4.3 — 最终审计 + 上线准备 (Day 30)

**日期**: 2026-03-24
**核心功能**: 最终生产就绪性审计、关键功能修复、上线清单

#### 📝 变更说明

##### 1. [CRITICAL] 询价列表筛选功能修复
- **问题**: `EnquiryController.getAllEnquiries()` 仅接受 `keyword` 参数，忽略前端发送的 `status`, `productCode`, `cargoTypeCode`, `salesCountryCode`, `assignedCnOffice`, `coreNonCore`, `dateFrom`, `dateTo` 等所有筛选参数 — **列表页所有筛选器均无效**
- **修复**:
  - 新建 `EnquirySpecification.java` — JPA Criteria API 动态条件查询
  - `EnquiryService.getEnquiriesFiltered()` — 新增带条件分页查询方法
  - `EnquiryController.getAllEnquiries()` — 添加 10 个 `@RequestParam`，支持 `sortDir` + `sortOrder` 双参数名

##### 2. [CRITICAL] 排序参数名修复
- **问题**: 前端发送 `sortDir`，后端期望 `sortOrder`，排序方向永远默认降序
- **修复**: 后端同时接受 `sortDir` 和 `sortOrder`，优先使用 `sortOrder`

##### 3. [CRITICAL] 统计端点 TODO 存根安全化
- **问题**: `/api/statistics/monthly`, `/country`, `/export` 返回 200 + 占位文本，可能导致前端解析错误
- **修复**: 改为返回 `501 Not Implemented`，前端不会误解析

##### 4. [MEDIUM] App.tsx 状态颜色 — 5 状态完整映射
- 从 3 分支扩展为 5 分支: New (蓝), Quoted & Pending (黄), Secured (绿), Lost (红), Cancelled (灰)

##### 5. [MEDIUM] EnquiryDetail 状态颜色统一
- 与 `constants.ts STATUS_COLORS` 一致: Quoted & Pending 从绿→黄, Lost 从黄→红, Cancelled 从红→灰

##### 6. [MEDIUM] 移除废弃 Containers 标签页
- `TabType` 从 5 个减为 4 个 (`basic | cargo | route | offers`)
- 删除 Container Lines 标签页按钮和内容面板

#### 📋 上线就绪检查清单

| 项目 | 状态 | 说明 |
|------|------|------|
| TypeScript 编译 | ✅ 0 errors | `tsc --noEmit` |
| Vite 生产构建 | ✅ 2366 modules | `npm run build` → dist/ |
| Maven 编译 | ✅ BUILD SUCCESS | `mvn compile` |
| 后端单元测试 | ✅ 11/11 pass | OfferServiceTest(10) + StatisticsServiceTest(1) |
| 后端 JAR 构建 | ✅ logitrack-backend-1.0.0.jar | `mvn package` |
| API 列表筛选 | ✅ status/cargo/keyword/sort 均生效 | E2E 验证 |
| Dashboard 状态键 | ✅ "Quoted & Pending" | `toJsonValue()` |
| AI 模块 | ✅ get_enquiry_overview 正常 | 已验证 Day 28-29 |
| 枚举映射 | ✅ 3 个 JPA Converter | Enquiry/Offer/CoreNonCore |
| JSON 序列化 | ✅ @JsonValue/@JsonCreator | 全部 3 个枚举 |
| 前端字段名 | ✅ 与后端 JSON 一致 | 5 处修正 (Day 26-27) |
| 状态标签/颜色 | ✅ V3 统一 | 6 组件使用 5-状态映射 |
| 产品选项 | ✅ 全 7 种 | 报表/筛选器 |
| 货物类型选项 | ✅ 全 4 种 (含 BUYER-CONSOL) | 列表筛选器 |

#### 📁 变更文件清单
| 文件 | 状态 | 说明 |
|------|------|------|
| `EnquirySpecification.java` | **新建** | JPA 动态条件查询 |
| `EnquiryService.java` | **修改** | +getEnquiriesFiltered() |
| `EnquiryController.java` | **修改** | +10 筛选参数, sortDir/sortOrder 兼容 |
| `StatisticsController.java` | **修改** | 3 个 TODO 存根 → 501 |
| `App.tsx` | **修改** | 5 状态颜色完整映射 |
| `EnquiryDetail.tsx` | **修改** | 统一颜色 + 移除 Containers 标签页 |

---

### M18: V3 Phase 5 — 用户验收测试 & 功能修复 (2026-03-25)

**日期**: 2026-03-25
**核心功能**: 用户验收测试中发现 9 个功能问题的完整修复，OfferPriceTable 组件重写，混合模式 Route Group 全面联动修复

#### 🎯 目标需求

用户在浏览器中进行实际操作测试（选择 RAIL-SEA 产品、创建 FCL 报价、填写容器明细），通过截图反馈发现以下三批共 9 个功能问题：

**第一批 — OfferPriceTable 功能缺失**:
1. `[+ Add Container Type]` 按钮缺失 — 无法添加特殊箱型列 (RF/OT/FR)
2. Total TEU 核算缺失 — 仅单个 Container Detail 有 TEU，无全局汇总
3. 容器类型未关联 DB — 硬编码字符串而非 `container_types` 表数据

**第二批 — 混合模式 Route Group 问题**:
4. Route Group 2 (SEA) 在 Price Details 中不显示 — 所有行归入 "Route Group 1"
5. 港口名显示为 Port#104 — Route Group 选中的港口未同步到主 ports 状态
6. 三层 POL/POD 冗余 — 混合模式同时显示顶层选择器和 Route Group 选择器
7. Route Group POD 未触发 POD Country 国家映射

**第三批 — 验证与布局**:
8. 保存失败 "Please select POL" — 隐藏顶层选择器后验证逻辑未适配
9. POD Country 混合模式下显示位置不当

#### ✨ 主要功能

##### 1. OfferPriceTable 组件完全重写 (543 行)

| 特性 | 实现 |
|------|------|
| 动态容器列 | 默认 4 列 (20GP/40GP/40HQ/45HQ) + `[+ Add Container Type]` 从 DB 加载更多 |
| AddContainerTypePicker | 浮动下拉选择器，显示 DB 中未添加的箱型 + TEU 值 |
| 可移除额外列 | 非默认列 hover 显示红色 × 按钮 |
| Total TEU | 表头右上角 `📦 Total TEU: x.xx` 徽章 |
| Line TEU | 每行最右列显示单行 TEU 合计 |
| ContainerDetailDialog | 弹窗编辑: 数量/货重/箱价 + 实时 TEU 计算 |
| TEU DB 关联 | `teuLookup` 从 `containerTypes` prop 构建 (来自 `container_types.teu_value`) |
| 混合模式分组 | 按 `routeGroupId` → `groupIndex` 分组，每组独立表格 + 图标标签 |
| 端口名解析 | `getPortLabel()` 从主 ports 状态解析 |

##### 2. Route Group 分组逻辑修复

- **根因**: `routeGroupId` 使用 `rg.id` (新建时为 `undefined`)，导致所有行归入同一组
- **修复**: 改用 `rg.groupIndex` (始终为 0, 1, 2... 有效值)
- **影响**: `EnquiryForm.generatePriceLinesFromPorts()` + `OfferPriceTable` 分组匹配

##### 3. 港口状态同步机制

- `RouteGroupEditor` onChange 回调中新增 `ensurePortsLoaded(allPortIds)`
- 将 Route Group 中所有选中的港口 ID 异步加载到 `EnquiryForm` 的 `ports` 状态
- 确保 `OfferPriceTable.getPortLabel()` 能正确解析港口名称

##### 4. Route Information 条件布局

- **非混合模式**: 显示顶层 POL/POD 多选器 + POD Country
- **混合模式**: 隐藏顶层 POL/POD → 仅显示 RouteGroupEditor + POD Country (位于 Route Groups 下方)
- 使用 `isMixedProduct()` 控制条件渲染

##### 5. 保存验证逻辑分支

- **混合模式**: 验证每个 Route Group 的 POL/POD → 自动汇总去重到顶层 `polIds/podIds` → 后端无需改动
- **普通模式**: 原有验证 polIds/podIds 非空

##### 6. POD Country 自动映射增强

- Route Group 变更时自动调用 `updatePodCountries(allPodIds)`
- 支持多国显示: "Andorra, United Arab Emirates" (逗号分隔)
- 混合模式提示文字: "Select POD in Route Groups above"

#### 📁 变更文件清单

| 文件 | 状态 | 行数 | 说明 |
|------|------|------|------|
| `OfferPriceTable.tsx` | **重写** | 543 | 动态容器列 + TEU 计算 + DB 关联 + 分组修复 |
| `EnquiryForm.tsx` | **修改** | 1437 | 混合模式验证 + UI 布局 + POD Country 联动 |
| `RouteGroupEditor.tsx` | 无变更 | 224 | 通过 onChange 回调增强联动 |
| `02-FUNCTIONAL-DESIGN.md` | **更新** | +150 | §16 V3 Phase 5 实施记录 |
| `03-FRONTEND-GUIDE.md` | **更新** | +200 | §9 前端实现记录 + Bug 修复总结 |
| `05-IMPLEMENTATION-PLAN.md` | **更新** | +40 | §9 阶段 5 测试修复清单 |

#### 📊 统计信息
- **修复 Bug**: 9 个
- **重写组件**: 1 个 (OfferPriceTable.tsx, 543 行)
- **修改组件**: 1 个 (EnquiryForm.tsx, ~150 行变更)
- **文档更新**: 3 个 redesign 文档 + MILESTONE_CHANGELOG
- **TypeScript 编译**: 0 errors
- **后端**: 无需改动 (API 已就绪)

#### 📋 验证检查清单

| 项目 | 状态 | 说明 |
|------|------|------|
| TypeScript 0 errors | ✅ | OfferPriceTable + EnquiryForm |
| 前端正常运行 | ✅ | Vite dev server port 3000 |
| 后端 API 正常 | ✅ | `/api/dict/container-types` 返回 11 条 |
| `[+ Add Container Type]` | ✅ | 从 DB 加载，选中添加列 |
| Total TEU 计算 | ✅ | 多行多容器汇总正确 |
| Route Group 分组 | ✅ | RAIL + SEA 独立表格 |
| 港口名称正确 | ✅ | 无 Port#104 |
| 混合模式无冗余 POL/POD | ✅ | 顶层隐藏 |
| POD Country 映射 | ✅ | Route Group 联动 |
| 保存验证通过 | ✅ | 混合模式 + 普通模式 |
---

## M20: UI 修复 + CORE 自动映射 + Edit/Copy/Increase 功能修复 (2026-03-26)

### 变更概述

针对 4 个问题的全面修复和测试，覆盖 UI 改名、Detail 页面展示、CORE/NON-CORE 自动映射、
以及 Edit/Copy/Increase 三大功能的 FK 约束错误修复。

### 问题 1: Oversize Cargo 复选框改名

**文件**: `OfferPriceTable.tsx`

- `"Oversize Cargo"` → `"Contains Oversized Cargo"`
- 仅标签文本修改，逻辑不变

### 问题 2: View Details 页面展示 Contains Oversized Cargo

**文件**: `EnquiryDetail.tsx`

- 在 Cargo Details tab 的 Hazardous 字段上方新增条件展示块
- 当 `enquiry.isOversizeCargo === true` 时显示醒目的 amber 色警示提示
- 展示文案: "⚠️ Contains Oversized Cargo"

### 问题 3: CORE / NON-CORE 自动映射

**文件**: `EnquiryForm.tsx`, `types.ts`

**实现逻辑**:
- `Country` 类型新增 `isCore?: boolean` 字段（后端已返回）
- `handleCountryChange()` 增强：选择 Sales Country 时自动查找 `allCountries` 匹配 `isCore`
  - 匹配到 country → `isCore ? 'Core' : 'Non-Core'`
  - 未匹配（AGENTS/OTHERS/TBA）→ `'Non-Core'`
- 设置 `coreFlagWarning` 提示用户自动映射结果（✅ Auto: Core / ⚠️ No match → Non-Core）
- 用户仍可手动覆盖

### 问题 4: Edit / Copy / Increase 功能修复

#### 4a. Edit (PUT) 修复

**文件**: `EnquiryService.java` — `updateEnquiry()` 完全重写

**根因**: 3 个独立问题
1. **Hibernate orphan 错误**: 直接 `save(enquiry)` 导致 `"all-delete-orphan was no longer referenced"`
   - **修复**: 改为操作 `existing`（managed entity），逐字段 set，保留 JPA 集合引用
2. **FK 约束（DELETE route groups）**: 删除 route groups 时 price lines 仍引用旧 ID
   - **修复**: 调整操作顺序 — 先 `offers.clear()` + `flush()` → 再删 route groups → 再建新的
3. **FK 约束（INSERT price lines）**: 旧 `routeGroupId` 值被原样插入但对应的 route group 已重建
   - **修复**: 更新模式下 **所有** price lines 的 `routeGroupId` 都通过 `sortOrder → groupIndexToIdMap` 重新映射

**关键代码流程**:
```
Step 1: existing.getOffers().clear() → saveAndFlush()   // 释放 FK 引用
Step 2: routeGroupRepository.deleteByEnquiryId() → flush()  // 安全删除
Step 3: saveRouteGroupsAndReturn() → groupIndexToIdMap      // 新建并映射
Step 4: for(pendingOffers) → map sortOrder → realId → add to existing
Step 5: enquiryRepository.save(existing)
```

#### 4b. Copy 修复

**文件**: `EnquiryList.tsx`

- 新增 `cleanChildIds()` 函数，深度清理所有子记录 ID
  - `routeGroups[].id = undefined, enquiryId = undefined`
  - `offers[].id = undefined`
  - `priceLines[].id = undefined, routeGroupId = undefined`
  - `containerDetails[].id = undefined`
- `handleCopy()` 和 `handleIncrease()` 都调用 `cleanChildIds()`

#### 4c. Increase 修复

**文件**: `EnquiryList.tsx`, `EnquiryForm.tsx`

- `handleIncrease()` 增传 `monthlySequence`, `serialNumber`, `productAbbr` 到 form data
  - `serialNumber > 0` 是后端判断 increase 模式的标志
- `handleSubmit()` 新建模式下仅在 `serialNumber <= 0 || undefined` 时删除 `refNumber`
  - increase 模式保留 `refNumber`，后端据此生成正确的 increase 编号

### API 测试结果 (CN2603015-RS, id=25)

| 操作 | 状态 | 验证结果 |
|------|------|----------|
| GET /api/enquiries/25 | ✅ 200 | 所有字段完整返回 |
| PUT /api/enquiries/25 (Edit) | ✅ 200 | 多字段修改持久化成功，routeGroupId 正确重映射 |
| POST /api/enquiries (Copy) | ✅ 201 | 新 ref=CN2603016-RS，子记录完整无 FK 错误 |
| POST /api/enquiries (Increase) | ✅ 201 | ref=CN2603015-RS1，serial=1 正确递增 |
| GET 验证 (Edit 后) | ✅ | core/oversize/commodity/category/hazardous/volume/qty/uom/remark 全部持久化 |

### 修改文件清单

| 文件 | 变更 |
|------|------|
| `OfferPriceTable.tsx` | "Oversize Cargo" → "Contains Oversized Cargo" |
| `EnquiryDetail.tsx` | 新增 Contains Oversized Cargo 条件展示块 |
| `EnquiryForm.tsx` | handleCountryChange 增加 CORE 自动映射 + handleSubmit increase 模式保留 refNumber |
| `EnquiryList.tsx` | 新增 cleanChildIds() + handleIncrease 传递 serialNumber/monthlySequence |
| `EnquiryService.java` | updateEnquiry() 完全重写（managed entity + 正确 FK 操作顺序） |
| `types.ts` | Country 接口新增 isCore 字段 |

---

## M22: 状态编辑 & 状态流转解锁 (2026-03-26)

> **核心问题**: Edit Enquiry 页面无法修改 Status 和 Reason；Enquiry Details 的 Change Status 弹窗对 Lost/Secured/Cancelled 等终态显示 "terminal state and cannot be changed"，无法回退状态。
> **测试数据**: CN2603018-ARS (id=29, 状态 Lost, lost_reason=CANCEL_NVOCC)

### 问题根因

| # | 问题 | 根因 |
|---|------|------|
| 1 | Edit 页面 Status 无法修改 | Status 下拉框有 `disabled={formData.offers.length > 0}` 条件 — CN2603018-ARS 有 1 条 offer，所以永远禁用 |
| 2 | Edit 页面 Reason 无法修改 | Lost Reason / Cancelled Reason 字段使用 `<input disabled />`，始终只读 |
| 3 | Details 页 Change Status 显示终态不可变 | `StatusChangeDialog` 的 `ALLOWED_TRANSITIONS` 对 Lost/Secured/Cancelled 配置为空数组 `[]` |
| 4 | 后端拒绝终态状态回退 | `validateStatusTransition()` 的 default 分支直接 throw "Cannot change status from: Lost" |

### 修复方案

#### 1. 前端 EnquiryForm.tsx — Status 始终可编辑 + Reason 下拉可修改

**文件**: `logitrack-pro/components/enquiry/EnquiryForm.tsx`

- **移除 Status 下拉框 disabled 条件** — 不再因有 offers 而禁用 Status 修改
- **新增 CancelledReasonDict / LostReasonDict 类型导入** — 用于 reason 下拉数据
- **loadMasterData() 新增加载 cancelledReasons、lostReasons** — 与 salesCountries 等一起 Promise.all 并行加载
- **Lost 状态**: 显示 Lost Reason 下拉 (dict_lost_reason) + Additional details 文本框，均可编辑
- **Cancelled 状态**: 显示 Cancelled Reason 下拉 (dict_cancelled_reason) + Additional details 文本框，均可编辑
- **Status 切换联动**: 从 Lost 切到其他状态时自动清空 lostReason/lostReasonText；从 Cancelled 切走时清空 cancelledReason/cancelledReasonText

#### 2. 前端 StatusChangeDialog.tsx — 允许终态回退

**文件**: `logitrack-pro/components/enquiry/StatusChangeDialog.tsx`

ALLOWED_TRANSITIONS 新增终态的可用转换：

```typescript
// 修改前
'Secured': [],
'Lost': [],
'Cancelled': [],

// 修改后
'Secured': ['Lost', 'Cancelled'],
'Lost': ['New', 'Quoted & Pending', 'Cancelled'],
'Cancelled': ['New', 'Quoted & Pending'],
```

#### 3. 后端 EnquiryService.java — validateStatusTransition 支持回退

**文件**: `backend/.../service/EnquiryService.java`

```java
// 新增规则：
case Secured:   → Lost (允许)
case Lost:      → New / Quoted & Pending (允许重新激活)
case Cancelled: → New / Quoted & Pending (允许重新激活)
// + 新增 from == to 检查（同状态不允许）
```

- **changeStatus() 清理逻辑**: 转到非 Lost/Cancelled 状态时，自动清空对应 reason 字段
  - → Lost: 清空 cancelledReason/cancelledReasonText
  - → Cancelled: 清空 lostReason/lostReasonText
  - → New/Quoted & Pending/Secured: 清空全部 reason 字段

### API 测试结果 (CN2603018-ARS, id=29)

| 操作 | 状态 | 验证 |
|------|------|------|
| PATCH Lost → Quoted & Pending | ✅ 200 | reason 字段已自动清空 |
| PATCH Quoted & Pending → Lost (带 reason) | ✅ 200 | reason 正确写入 |

### 状态流转规则（更新后）

```
New → Quoted & Pending → Secured
                      → Lost    → New / Quoted & Pending
                      → Cancelled → New / Quoted & Pending
Secured → Lost / Cancelled
任意状态 → Cancelled（始终允许）
```

### 修改文件清单

| 文件 | 变更 |
|------|------|
| `EnquiryForm.tsx` | Status 移除 disabled、加载 reason 字典、reason 下拉可编辑 |
| `StatusChangeDialog.tsx` | ALLOWED_TRANSITIONS 增加 Secured/Lost/Cancelled 的回退路径 |
| `EnquiryService.java` | validateStatusTransition 支持 Secured→Lost, Lost→New/Q&P, Cancelled→New/Q&P; changeStatus 清理 reason |

---

## M23: 主数据重导入 & Status自动选择逻辑修正 & POL/POD显示名称 (2026-03-27)

### 概述

本次变更包含三项：  
1. **Country + Port 表数据重导入** — 清空并从 `Country and Port.csv` 重新导入 96 个国家、163 个 SEA 港口、156 个 AIR 港口  
2. **Sales Country + Office + Pic 表数据重导入** — 清空并从 `Sales Contry+Office+salePic.csv` 重新导入 13 个销售国家、231 个办事处、592 个销售人员  
3. **Status 自动选择逻辑** — 改为根据 Offer 是否填写了实际报价 来判断（而非仅判断 Offer 是否存在），无论 cargoType 类型  
4. **POL/POD 显示名称** — 修复 `DictDTO.fromPort()` 不再重复拼接 countryCode，直接使用 CSV 中的 Display name

### 1. Country + Port 数据重导入

- **脚本**: `database/reimport_all_master_data.py`
- **CSV**: `Country and Port.csv` (Tab 分隔, SEA 在 parts[0,2,4,6], AIR 在 parts[13,15,17,19])
- **处理**: `SET FOREIGN_KEY_CHECKS = 0` → `TRUNCATE country, port` → 逐行导入 → `SET FOREIGN_KEY_CHECKS = 1`
- **结果**: 96 countries, 163 SEA ports, 156 AIR ports

### 2. Sales 数据重导入

- **CSV**: `Sales Contry+Office+salePic.csv` (逗号分隔: SALECOUNTRY, SALESOFFICE, SALESPIC)
- **处理**: 清空 `dict_sales_country`, `dict_sales_office`, `dict_sales_pic`, `sales_pic` → 逐行导入
- **结果**: 13 sales countries, 231 offices, 592 PICs
- **修复**: `dict_sales_office.name_norm` 改为 `CC:OFFICE_NAME` 格式避免跨国家重复; 移除 `sales_pic.uk_sales_pic_country_name` 唯一约束

### 3. Status 自动选择逻辑

**问题**: 原逻辑只要 Offer 存在就自动置为 "Quoted & Pending"，不区分是否填写了实际价格  
**修复**:

#### 前端 (`EnquiryForm.tsx`)
- 新增 `hasActualPricing(offers)` 辅助函数，检查任意 Offer 的 priceLines 是否含有实际价格值 (price > 0 / perCbm > 0 / minCharge > 0 / localCharge > 0 / priceText 非空 / containerPrice > 0)
- `useEffect` 监听 offers 变化：有报价 + status="New" → 自动切 "Quoted & Pending"；无报价 + status="Quoted & Pending" → 自动回退 "New"

#### 后端 (`OfferService.java`)
- 新增 `hasPricingInDTO(List<OfferPriceLineDTO>)` — 利用 `OfferPriceLineDTO.isEmpty()` 反转判断
- 新增 `hasPricingInLines(List<OfferPriceLine>)` — 检查 Entity 层价格字段
- `createOfferFromDTO` / `createOffer` 中仅当检测到实际报价数据时才将 status 从 New 升级为 Quoted_Pending

### 4. POL/POD 显示名称修复

**问题**: `DictDTO.fromPort()` 将 `portName + ", " + countryCode` 拼接，导致 "Durres, Albania, AL" 双重国家信息  
**修复**: `fromPort()` 直接返回 `portName` 作为 label，因 CSV Display name 已含国家名称

### 修改文件清单

| 文件 | 变更 |
|------|------|
| `database/reimport_all_master_data.py` | 新建：全量主数据重导入脚本 |
| `EnquiryForm.tsx` | Status 自动选择：基于 hasActualPricing() 判断而非 offers.length > 0；新增双向逻辑 |
| `OfferService.java` | 新增 hasPricingInDTO / hasPricingInLines 辅助方法；Status 升级仅在有实际报价时触发 |
| `DictDTO.java` | fromPort() 移除 countryCode 拼接，直接使用 portName 作为 label |

---

## M24: 询价表单 Bug 修复 — 日期显示 + CARRIER 列 + POD CORE 联动 + Sales PIC 搜索 (2026-03-31)

### 概述

针对用户反馈的 4 个前端/后端问题进行修复：Enquiry Created Date 在编辑模式显示异常、FCL/BUYER-CONSOL 价格表缺少 CARRIER 列、重新选择 POD Port 后 CORE/NON-CORE 不自动更新、Sales PIC 无搜索功能。

---

### 问题 1: Enquiry Created Date 编辑模式显示异常

**根因**: 后端返回 `LocalDateTime` 格式 `"2026-01-15T10:30:00"`，但 `<input type="date">` 要求 `"YYYY-MM-DD"` 格式，导致日期输入框在编辑模式下显示为空或异常。

**修复**:

**文件**: `logitrack-pro/components/enquiry/EnquiryForm.tsx`

- 新增 `normalizeDate(val)` 辅助函数（L103-L108），截取 ISO 字符串的日期部分：
  ```typescript
  const normalizeDate = (val: string | undefined): string => {
    if (!val) return '';
    if (val.includes('T')) return val.split('T')[0];   // "2026-01-15T10:30:00" → "2026-01-15"
    return val;
  };
  ```
- 在 `useEffect` 初始化 `formData` 时，对 `enquiryCreatedDate` 和 `enquiryReceivedDate` 统一调用 `normalizeDate()` 处理

---

### 问题 2: FCL/BUYER-CONSOL 价格明细表新增 CARRIER 列

**需求**: FCL 和 BUYER-CONSOL 类型的报价价格表需新增承运商 (CARRIER) 列，同时移除原有的 Per CBM 和 Min Charge 列。

**修复**:

#### 后端

**文件**: `backend/.../entity/OfferPriceLine.java`
- 新增字段：`@Column(name = "carrier", length = 50) private String carrier;`

**文件**: `backend/.../dto/OfferPriceLineDTO.java`
- 新增字段：`private String carrier;` — 注释"承运商 (FCL/BUYER-CONSOL 专用)"

**文件**: `backend/.../service/OfferService.java`
- DTO → Entity 映射增加 `line.setCarrier(lineDTO.getCarrier())`

#### 前端

**文件**: `logitrack-pro/types.ts`
- `OfferPriceLine` 接口新增 `carrier?: string;` 字段（L258）

**文件**: `logitrack-pro/components/enquiry/OfferPriceTable.tsx`
- FCL/BUYER-CONSOL 模式表头新增 CARRIER 列
- 每行新增 CARRIER 下拉选择器，初始使用硬编码 `CARRIER_OPTIONS`（后在 M25 改为 DB 驱动）
- FCL/BUYER-CONSOL 模式下移除 Per CBM、Min Charge 两列

---

### 问题 3: POD 变更后 CORE/NON-CORE 自动更新

**根因**: 在编辑模式中修改 POD Port 后，CORE/NON-CORE 标记不会自动重新计算。M20 已实现 Sales Country 变更时的 CORE 映射，但 POD 变更场景缺失。

**修复**:

**文件**: `logitrack-pro/components/enquiry/EnquiryForm.tsx`

- 在 `updatePodCountries()` 函数中（L656-L665）增加 CORE/NON-CORE 自动判断逻辑：
  ```typescript
  // 遍历所有 POD 国家 → 查 allCountries 匹配 isCore 属性
  // 任一 POD 国家为 Core → 整体 Core
  // 全部 Non-Core → 整体 Non-Core
  ```
- 自动设置 `formData.coreNonCore` 并更新 `coreFlagWarning` 提示（✅ Auto (POD Country): Core / Non-Core）
- 用户仍可手动覆盖选择

---

### 问题 4: Sales PIC 新增搜索功能

**需求**: Sales PIC 下拉列表人员数量多（592 人），无法快速定位，需要支持关键字搜索。

**修复**:

**新建文件**: `logitrack-pro/components/SearchableSelect.tsx`（163 行）

通用可搜索单选下拉组件，功能特性：
- `SearchableSelectOption` 接口：`{ value: string | number; label: string }`
- Props：`options`, `value`, `onChange`, `placeholder`, `disabled`, `required`, `className`
- 搜索框 `autoFocus`，`useMemo` 实时过滤选项
- 选中项显示 + "×" 清除按钮 + 下拉箭头
- 浮层内搜索输入 + 最大高度 240px 滚动列表
- 选中高亮（indigo-100）、支持 `required` 表单验证
- 点击外部自动关闭（`mousedown` 事件监听）

**文件**: `logitrack-pro/components/enquiry/EnquiryForm.tsx`
- 引入 `SearchableSelect` 组件
- 将 Sales PIC 的 `<select>` 替换为 `<SearchableSelect>`，支持输入关键字检索人员

---

### 修改文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `EnquiryForm.tsx` | **修改** | normalizeDate() 日期格式化 + SearchableSelect 替换 Sales PIC 下拉 + updatePodCountries CORE 判断 |
| `SearchableSelect.tsx` | **新建** | 通用可搜索单选下拉组件（163 行） |
| `OfferPriceTable.tsx` | **修改** | FCL/BUYER-CONSOL 新增 CARRIER 列、移除 Per CBM / Min Charge 列 |
| `OfferPriceLine.java` | **修改** | 新增 `carrier` 字段 (VARCHAR 50) |
| `OfferPriceLineDTO.java` | **修改** | 新增 `carrier` 字段 |
| `OfferService.java` | **修改** | DTO→Entity 映射增加 carrier |
| `types.ts` | **修改** | OfferPriceLine 新增 `carrier?: string` |

---

## M25: Carrier 主数据管理 & 表单分区重排 & CARRIER 数据库驱动 (2026-03-31)

### 概述

本次变更包含两项需求：
1. **Carrier 主数据管理** — 新建 `dict_carrier` 数据库表 + 后端 CRUD API + 前端管理页面，实现承运商列表的完整增删改查；同时将 OfferPriceTable 的 CARRIER 下拉从硬编码改为数据库驱动
2. **Business Classification 分区重排** — 将 Business Classification 区块从 Offer Information 之后移动到 Route Information 之后，符合表单填写的逻辑顺序

---

### 1. Carrier 主数据管理（端到端新功能）

#### 1.1 数据库

**新建表**: `dict_carrier`

```sql
CREATE TABLE dict_carrier (
  id INT AUTO_INCREMENT PRIMARY KEY,
  carrier_code VARCHAR(30) NOT NULL UNIQUE,  -- 承运商编码（如 MSC, COSCO）
  carrier_name VARCHAR(100) NOT NULL,        -- 承运商名称
  sort_order INT DEFAULT 0,                  -- 排序序号
  is_active TINYINT(1) DEFAULT 1,            -- 是否启用
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**种子数据**（10 条）：MSC, COSCO, ONE, CMA CGM, OOCL, EVERGREEN, HAPAG-LLOYD, HMM, YANG MING, CO-LOADER

#### 1.2 后端实体 + Repository

**新建文件**: `backend/.../entity/Carrier.java`
- JPA 实体，映射 `dict_carrier` 表
- 字段：`id` (Integer), `carrierCode` (varchar 30, unique), `carrierName` (varchar 100), `sortOrder` (int), `isActive` (boolean)
- `@PrePersist` / `@PreUpdate` 自动维护 `createdAt` / `updatedAt` 时间戳
- Lombok `@Data` / `@NoArgsConstructor` / `@AllArgsConstructor`

**新建文件**: `backend/.../repository/CarrierRepository.java`
- 继承 `JpaRepository<Carrier, Integer>`
- 查询方法：
  - `findByIsActiveTrueOrderBySortOrderAscCarrierNameAsc()` — 活跃承运商（供下拉使用）
  - `findAllByOrderBySortOrderAscCarrierNameAsc()` — 全量（管理页面使用）
  - `findByCarrierCode(String)` — 按编码查询

#### 1.3 后端 API 端点

**文件**: `backend/.../controller/MasterDataController.java`（新增 6 个端点）

| HTTP 方法 | 端点 | 说明 |
|-----------|------|------|
| `GET` | `/api/master/carriers` | 全量列表（按 sortOrder + name 排序） |
| `GET` | `/api/master/carriers/active` | 仅活跃承运商 |
| `GET` | `/api/master/carriers/{id}` | 按 ID 查询 |
| `POST` | `/api/master/carriers` | 新增承运商 |
| `PUT` | `/api/master/carriers/{id}` | 更新承运商（carrierCode, carrierName, sortOrder, isActive） |
| `DELETE` | `/api/master/carriers/{id}` | 删除承运商 |

**文件**: `backend/.../controller/DictController.java`（新增 1 个端点）
- `GET /api/dict/carriers` — 返回活跃承运商列表（字典接口兼容路径）

#### 1.4 前端类型 + API

**文件**: `logitrack-pro/types.ts`
- 新增 `Carrier` 接口：`{ id: number, carrierCode: string, carrierName: string, sortOrder: number, isActive: boolean }`

**文件**: `logitrack-pro/services/api.ts`
- `masterDataApi` 新增 4 个方法：

| 方法 | 端点 | 说明 |
|------|------|------|
| `getCarrierList()` | `GET /master/carriers` | 全量列表 |
| `getActiveCarriers()` | `GET /master/carriers/active` | 活跃列表 |
| `saveCarrier(carrier)` | `POST` / `PUT /master/carriers[/:id]` | 新增/更新（根据 id 判断） |
| `deleteCarrier(id)` | `DELETE /master/carriers/:id` | 删除 |

#### 1.5 前端管理页面

**新建文件**: `logitrack-pro/components/master-data/CarrierList.tsx`（228 行）

完整 CRUD 管理页面，遵循 `ContainerTypeList` 模式：
- **表格**: carrier_code, carrier_name, sort_order, 状态（Active/Inactive 标签）, 操作按钮（Edit/Delete）
- **模态表单**: carrierCode（自动转大写）, carrierName, sortOrder, isActive checkbox
- **交互**: Toast 成功/失败提示、加载状态、删除确认、空状态提示
- **图标**: `Ship` (lucide-react)

**文件**: `logitrack-pro/App.tsx`
- `ViewType` 联合类型新增 `'master-carriers'`
- 导入 `CarrierList` 组件 + `Ship` 图标
- 路由: `case 'master-carriers': return <CarrierList />`
- 侧边栏: Master Data 分组下新增 "Carriers" 按钮（Ship 图标）
- 页面标题: `'Carrier Management'`
- 权限: 纳入 `canManageMasterData` 视图列表

#### 1.6 OfferPriceTable CARRIER 改为数据库驱动

**文件**: `logitrack-pro/components/enquiry/OfferPriceTable.tsx`
- **移除**: 硬编码 `CARRIER_OPTIONS` 常量
- **新增**: `carrierOptions: string[]` prop（L41），注释 "Carrier names from dict\_carrier DB table (active only)"
- **修改**: CARRIER 下拉从 `CARRIER_OPTIONS.map()` 改为 `carrierOptions.map()`

**文件**: `logitrack-pro/components/enquiry/EnquiryForm.tsx`
- **新增**: `carrierOptions` state — `useState<string[]>([])`
- **加载**: `loadMasterData()` 中调用 `masterDataApi.getActiveCarriers()`，提取 `carrierCode` 列表，失败时回退到 10 项默认值
- **传递**: `<OfferPriceTable carrierOptions={carrierOptions} />` prop 传递

---

### 2. Business Classification 分区位置调整

**需求**: 用户反馈填完 Route Information 后需要紧接着填 Business Classification（含 CORE/NON-CORE、Category、Cargo Ready Date），原位置在 Offer Information 之后不符合填写习惯。

**修复**:

**文件**: `logitrack-pro/components/enquiry/EnquiryForm.tsx`

将 Business Classification `<AccordionItem>` 整块（约 95 行 JSX）从原位置（Offer Information 与 Additional Information 之间）移动到 Route Information 之后。

**调整前分区顺序**:
1. 基础信息 → 2. Sales → 3. Cargo → 4. Route → 5. Offer → 6. Business Classification → 7. Additional → 8. Status

**调整后分区顺序**:
1. 基础信息 → 2. Sales → 3. Cargo → **4. Route → 5. Business Classification** → 6. Offer → 7. Additional → 8. Status

Business Classification 区块包含：
- CORE / NON-CORE 选择（含 `coreFlagWarning` 自动映射提示）
- Category 下拉（8 个选项：Ocean Freight / Ocean Freight + Origin / Ocean Freight + Origin + Dest / Origin Charges / Dest Charges / LCL / Air Freight / Air Freight + Origin）
- Cargo Ready Date 复选框 + 日期选择器 + Details 文本框

---

### 3. 附带修复：additionalRequirements 类型缺失

**问题**: `FormData` 接口缺少 `additionalRequirements` 字段定义，导致 TypeScript 编译报错 `TS2339: Property 'additionalRequirements' does not exist on type 'FormData'`。

**修复**:
- `logitrack-pro/components/enquiry/EnquiryForm.tsx` — `FormData` 接口新增 `additionalRequirements?: string;`
- `logitrack-pro/types.ts` — `EnquiryFormData` 接口新增 `additionalRequirements?: string;`

---

### 修改文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `Carrier.java` | **新建** | JPA 实体 → dict_carrier 表 |
| `CarrierRepository.java` | **新建** | Spring Data JPA Repository |
| `MasterDataController.java` | **修改** | 新增 Carrier CRUD 6 端点 (/api/master/carriers) |
| `DictController.java` | **修改** | 新增 /api/dict/carriers 端点 |
| `CarrierList.tsx` | **新建** | Carrier 主数据 CRUD 管理页面（228 行） |
| `App.tsx` | **修改** | 新增 master-carriers 路由、侧边栏按钮、页面标题 |
| `types.ts` | **修改** | 新增 Carrier 接口 + EnquiryFormData.additionalRequirements |
| `api.ts` | **修改** | masterDataApi 新增 4 个 Carrier 方法 |
| `OfferPriceTable.tsx` | **修改** | 移除硬编码 CARRIER_OPTIONS，改为 carrierOptions prop |
| `EnquiryForm.tsx` | **修改** | 加载 carrier 数据 + 传递 prop + Business Classification 位置移动 + FormData.additionalRequirements |

### 数据库变更

| 操作 | 说明 |
|------|------|
| `CREATE TABLE dict_carrier` | 承运商字典表（id, carrier_code UK, carrier_name, sort_order, is_active, timestamps） |
| `INSERT 10 rows` | MSC / COSCO / ONE / CMA CGM / OOCL / EVERGREEN / HAPAG-LLOYD / HMM / YANG MING / CO-LOADER |

### API 测试结果

| 端点 | 状态 | 结果 |
|------|------|------|
| `GET /api/dict/carriers` | ✅ 200 | 返回 10 条活跃承运商 |
| `GET /api/master/carriers` | ✅ 200 | 返回 10 条全量承运商 |

### TypeScript 编译

- 本次变更引入的新错误：**0 个**
- 剩余预存 OfferType 类型不匹配错误：4 个（非本次引入，为历史遗留）

---

### M26: 货币管理 & 动态柜型 extraContainers & 询价列表过滤 & 多项Bug修复 (2026-04-09)

**日期**: 2026-04-09  
**影响文件**: 12 个

#### 📝 变更说明

本里程碑包含多个独立功能与 Bug 修复，累计完成于同一开发会话。

---

#### 1. 货币管理全栈功能

**需求**: Offer 报价需支持独立的集装箱运费货币（Container Currency）和本地费货币（Local Charge Currency），可在每个 Offer 级别单独选择。

##### 1.1 前端

**文件**: `logitrack-pro/types.ts`
- `Offer` 接口新增 `containerCurrency?: string` 和 `localChargeCurrency?: string` 字段

**文件**: `logitrack-pro/components/enquiry/OfferDialog.tsx`
- 新增两个 `<select>` 下拉（USD / CNY / EUR / GBP / JPY / AUD / SGD）分别控制 `containerCurrency` 和 `localChargeCurrency`
- 表单 `initialState` 默认值均为 `'USD'`

**文件**: `logitrack-pro/components/enquiry/OfferPriceTable.tsx`
- 表头显示各币种标识（Frg. Currency / Local Currency），从 props 传入
- 价格列标题附带对应货币符号

##### 1.2 后端

**文件**: `backend/src/main/java/com/logitrack/backend/entity/Offer.java`
- 新增 `containerCurrency VARCHAR(10) DEFAULT 'USD'` 字段
- 新增 `localChargeCurrency VARCHAR(10) DEFAULT 'USD'` 字段

**文件**: `backend/src/main/java/com/logitrack/backend/dto/OfferDTO.java`
- DTO 同步添加两个货币字段，确保序列化正确传递

##### 1.3 数据库

```sql
ALTER TABLE offer ADD COLUMN container_currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE offer ADD COLUMN local_charge_currency VARCHAR(10) DEFAULT 'USD';
```

---

#### 2. Ref Number 重复竞态条件修复

**问题**: 高并发或快速连续点击保存时，相同月份可能生成重复的 `ref_number`（如 `SH-2604-001` 出现两次），原因是 `sequence_number` 生成使用了非原子的 `MAX()+1` 查询。

**文件**: `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java`
- **修复**: 将序号生成逻辑改为数据库级 `SELECT ... FOR UPDATE` 悲观锁，或在事务内使用 `@Retryable` 重试机制，确保原子性
- 新增唯一约束校验：当检测到 `ref_number` 已存在时，自动递增序号并重试

**文件**: `backend/src/main/resources/db/migration`（或手动执行）
```sql
ALTER TABLE enquiry ADD UNIQUE INDEX uk_ref_number (ref_number);
```

---

#### 3. 动态柜型 extraContainers JSON 字段全栈支持

**需求**: 除标准四种柜型（20GP / 40GP / 40HQ / 45HQ）外，支持录入 20OT、20RF、20TANK、20FR、40OT、40RF 等特殊柜型，数量以 JSON 格式存储于数据库。

##### 3.1 后端

**文件**: `backend/src/main/java/com/logitrack/backend/entity/EnquiryContainerLine.java`
- 新增字段：
  ```java
  @Column(name = "extra_containers", columnDefinition = "TEXT")
  @Convert(converter = JsonMapConverter.class)
  private Map<String, Integer> extraContainers = new HashMap<>();
  ```
- `calculateLineTeu()` 方法同步更新：遍历 `extraContainers`，20 尺柜型按 1.0 TEU 计算，其他按 2.0 TEU

**文件**: `backend/src/main/java/com/logitrack/backend/config/JsonMapConverter.java`（新建）
- `AttributeConverter<Map<String, Integer>, String>` 实现，使用 Jackson `ObjectMapper` 进行序列化/反序列化

##### 3.2 前端

**文件**: `logitrack-pro/types.ts`
- `EnquiryContainerRow` 接口新增 `extraContainers?: Record<string, number>`

**文件**: `logitrack-pro/components/enquiry/CargoContainerTable.tsx`
- 支持动态新增柜型列（通过 `containerTypeOptions` 下拉选择并添加）
- 新增 `updateExtra()` 函数，更新 `extraContainers` Map 中对应 code 的数量
- 动态列可删除（从 `visibleExtraCodes` 移除）

##### 3.3 数据库

```sql
ALTER TABLE enquiry_container_line ADD COLUMN extra_containers TEXT NULL;
```

---

#### 4. 询价列表 Office / POL / POD 搜索过滤

**需求**: EnquiryList 需要支持按 Sales Office、POL 港口、POD 港口三个维度过滤，配合已有的 Status / Cargo Type 过滤使用。

##### 4.1 后端

**文件**: `backend/src/main/java/com/logitrack/backend/repository/EnquiryRepository.java`
- 新增 `findByFilters()` 方法，支持可选的 `salesOfficeId`、`polPortId`、`podPortId` 参数
- POL/POD 使用子查询：`WHERE e.id IN (SELECT enquiry_id FROM enquiry_pol WHERE port_id = :polPortId)`

**文件**: `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java`
- `getEnquiryList()` 透传新过滤参数到 Repository

**文件**: `backend/src/main/java/com/logitrack/backend/controller/EnquiryController.java`
- `GET /api/enquiries` 新增接受 `polPortId`、`podPortId`、`assignedCnOffice` 请求参数

##### 4.2 前端

**文件**: `logitrack-pro/services/api.ts`
- `EnquirySearchParams` 接口新增 `polPortId?: number`、`podPortId?: number`、`assignedCnOffice?: string`
- `enquiryApi.list()` 调用时透传新参数

**文件**: `logitrack-pro/components/enquiry/EnquiryList.tsx`
- Filter Bar 新增三个可搜索下拉组件（使用 `@headlessui/react` Combobox）：
  - **Sales Office**：显示名称，传值 `assignedCnOffice` 字符串
  - **POL**：港口名称搜索，传值 `polPortId` 数字
  - **POD**：港口名称搜索，传值 `podPortId` 数字
- 港口选项通过 `settingsApi.getPorts()` 预加载，Office 选项通过 `masterDataApi.getOffices()` 加载

---

#### 5. Price Lines 数据保留修复（routeGroupId → polId+podId+subMode）

**问题**: 刷新 Price Details 时，已填写的价格数据被清空，因为新生成的 Price Line 通过 `routeGroupId` 匹配旧数据，但服务端返回的数据可能不包含匹配的 `routeGroupId`，导致全部重置。

**文件**: `logitrack-pro/components/enquiry/EnquiryForm.tsx`
- **修复**: `generatePriceLinesFromPorts()` 函数中，旧 Price Line 的匹配策略从 `routeGroupId` 改为复合键 `polId + podId + subMode`
- 当找到匹配行时，保留原有的价格、运价文本、本地费、Carrier 及 `containerDetails`，仅更新端口名称和 `routeGroupId`

---

#### 6. Route Groups 编辑时港口选项缺失修复

**问题**: 打开 RouteGroupEditor 时，POL/POD 下拉中没有可选港口，因为 `portOptions` 初始化后尚未加载完成，组件已渲染完毕。

**文件**: `logitrack-pro/components/enquiry/RouteGroupEditor.tsx`
- **修复**: 在父组件 `EnquiryForm.tsx` 的 `loadMasterData()` 中提前加载完整港口列表，并将 `portOptions` 作为 prop 传递
- RouteGroupEditor 不再自行发起港口 API 请求，改为消费父组件传入的 `portOptions` prop

---

#### 修改文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `types.ts` | **修改** | Offer 新增货币字段；EnquiryContainerRow 新增 extraContainers |
| `OfferDialog.tsx` | **修改** | 新增货币选择下拉 |
| `OfferPriceTable.tsx` | **修改** | 表头显示币种标识 |
| `Offer.java` | **修改** | 新增两个货币字段 |
| `OfferDTO.java` | **修改** | DTO 同步货币字段 |
| `EnquiryContainerLine.java` | **修改** | 新增 extraContainers JSON 字段 + TEU 计算 |
| `JsonMapConverter.java` | **新建** | Map<String, Integer> ↔ JSON TEXT 转换器 |
| `EnquiryRepository.java` | **修改** | 新增 POL/POD/Office 子查询过滤 |
| `EnquiryService.java` | **修改** | 序号生成原子化修复 + 新过滤参数透传 |
| `EnquiryController.java` | **修改** | 新增过滤请求参数 |
| `api.ts` | **修改** | 新增搜索参数字段 |
| `EnquiryList.tsx` | **修改** | 新增 Office/POL/POD 可搜索下拉过滤器 |
| `EnquiryForm.tsx` | **修改** | Price Lines 保留修复 + 港口预加载 |
| `RouteGroupEditor.tsx` | **修改** | 改为消费父组件传入的 portOptions |
| `CargoContainerTable.tsx` | **修改** | 动态柜型列支持 |

#### 数据库变更

| 操作 | SQL |
|------|-----|
| Offer 货币字段 | `ALTER TABLE offer ADD COLUMN container_currency VARCHAR(10) DEFAULT 'USD'` |
| Offer 本地费货币 | `ALTER TABLE offer ADD COLUMN local_charge_currency VARCHAR(10) DEFAULT 'USD'` |
| 动态柜型 JSON | `ALTER TABLE enquiry_container_line ADD COLUMN extra_containers TEXT NULL` |
| Ref Number 唯一约束 | `ALTER TABLE enquiry ADD UNIQUE INDEX uk_ref_number (ref_number)` |

---

### M27: 全系20尺柜型Weight支持 & Dashboard优化 & Detail展示增强 (2026-04-10)

**日期**: 2026-04-10  
**影响文件**: 6 个

#### 📝 变更说明

本里程碑扩展了所有 20 尺特殊柜型（20OT、20RF、20TANK、20FR 等）的重量（Weight）录入与展示能力，同步修复了 Dashboard 页面的数据排序与展示问题。

---

#### 1. 所有 20 尺柜型支持 Weight 输入

**背景**: 原系统仅 `20GP` 默认柜型支持填写 Wt(KG)，其他 20 尺特殊柜型（通过 extraContainers 动态添加的）无法录入重量。

##### 1.1 类型定义

**文件**: `logitrack-pro/types.ts`
- `EnquiryContainerRow` 接口新增：
  ```typescript
  extraContainerWeights?: Record<string, number>;
  ```
  用于存储动态 20 尺柜型的重量数据（键为柜型代码，值为 KG 重量）。

##### 1.2 Container Information 录入表（CargoContainerTable）

**文件**: `logitrack-pro/components/enquiry/CargoContainerTable.tsx`
- **移除** `DEFAULT_COLS` 中 `showWeight: true` 的特殊属性，改为统一逻辑判断
- **新增** `is20FootType(code: string)` 纯函数：`return code.startsWith('20')`
- **新增** `updateExtraWeight(rowIdx, code, value)` 函数：更新 `extraContainerWeights[code]` 的值
- **表头更新**: 动态额外列中，凡是 `code.startsWith('20')` 的列，在数量列后额外渲染 `Wt(KG)` 表头
- **表体更新**: 动态额外列数据行中，20 尺柜型后渲染重量 `<input>` 输入框，`onChange` 调用 `updateExtraWeight`

##### 1.3 Price Details 录入表（OfferPriceTable）

**文件**: `logitrack-pro/components/enquiry/OfferPriceTable.tsx`

**表头部分**（Header）：
- 将 `const is20GP = code === '20GP'` 改为 `const is20Foot = code.startsWith('20')`
- 20 尺柜型列的 `colSpan` 从 `2`（Price + Num）改为 `3`（Price + Num + Wt）
- 追加 `Wt(KG)` 子标题

**表体部分**（Body）：
- 将 `const is20GP = code === '20GP'` 改为 `const is20Foot = code.startsWith('20')`
- 注释从 `"Weight (KG) — only for 20GP"` 更新为 `"Weight (KG) — for all 20-foot types"`
- 条件渲染从 `{is20GP && (...)}` 改为 `{is20Foot && (...)}`

##### 1.4 Price Lines 预填充同步（EnquiryForm）

**文件**: `logitrack-pro/components/enquiry/EnquiryForm.tsx`

`buildContainerDetailsFromRows()` 函数中，动态额外柜型循环段：
```typescript
// 修复前：无 cargoWeightPerContainer
// 修复后：
const extraWeights = row.extraContainerWeights || {};
const wt = code.startsWith('20') ? (extraWeights[code] || undefined) : undefined;
details.push({
  ...
  cargoWeightPerContainer: wt,
});
```
确保填写的重量随"刷新 Price Details"操作同步到 Price Lines 的 `cargoWeightPerContainer` 字段。

##### 1.5 后端实体（EnquiryContainerLine）

**文件**: `backend/src/main/java/com/logitrack/backend/entity/EnquiryContainerLine.java`
- 新增引入：`import com.logitrack.backend.config.JsonMapDoubleConverter;`
- 新增字段：
  ```java
  @Column(name = "extra_container_weights", columnDefinition = "TEXT")
  @Convert(converter = JsonMapDoubleConverter.class)
  private Map<String, Double> extraContainerWeights = new HashMap<>();
  ```

**文件**: `backend/src/main/java/com/logitrack/backend/config/JsonMapDoubleConverter.java`（新建）
- `AttributeConverter<Map<String, Double>, String>` 实现
- 专用于存储小数重量值（kg），与 `JsonMapConverter`（整数）相区分

##### 1.6 数据库迁移

**迁移文件**: `database/migration_20260126_extra_container_weights.sql`
```sql
ALTER TABLE enquiry_container_line
ADD COLUMN extra_container_weights TEXT NULL AFTER extra_containers;
```

---

#### 2. Enquiry Detail 详情页重量数据展示

**需求**: 在 `EnquiryDetail.tsx` 查看详情中，Container Information 和 Offer Price Lines 两处均需展示所有 20 尺柜型的重量数据。

**文件**: `logitrack-pro/components/enquiry/EnquiryDetail.tsx`

##### Container Information 表格
- **表头**：动态额外柜型列（`extra_containers`）中，20 尺柜型（`code.startsWith('20')`）在数量列后额外渲染 `Wt(KG)` 表头（`<th>`），使用 `<React.Fragment>` 包裹
- **表体**：同样逻辑，20 尺额外柜型后渲染重量数据单元格，显示 `row.extraContainerWeights?.[code]`，无数据时显示 `-`

##### Offer Price Lines 表格
- **表头**：`sortedSizeCodes.map()` 中，对 `is20Foot = code.startsWith('20')` 的列：
  - `colSpan` 从 `2` 改为 `3`
  - 子标题区追加 `<span>Wt</span>`
- **表体**：每个 20 尺柜类型的 `<React.Fragment>` 内，在 Price 和 Qty 单元格之后追加 Weight 单元格：
  ```tsx
  {is20Foot && (
    <td>
      {cd?.cargoWeightPerContainer != null && cd.cargoWeightPerContainer > 0
        ? Number(cd.cargoWeightPerContainer).toLocaleString()
        : <span className="text-gray-300">-</span>
      }
    </td>
  )}
  ```

---

#### 3. Dashboard Recent Enquiries 优化

**需求 1**: Recent Enquiries 列表改为显示最新创建或修改的数据（按 `updated_at` 降序）。  
**需求 2**: 清除 Recent Enquiries 上方的 KPI 统计卡片（Total / Quoted & Pending / Secured / New 四张卡片）。

**文件**: `logitrack-pro/App.tsx`

**变更 1 — 数据排序**：
```typescript
// 修复前
const response = await enquiryApi.list({ page: 0, pageSize: 10 });
// 修复后
const response = await enquiryApi.list({ page: 0, pageSize: 10, sortBy: 'updatedAt', sortOrder: 'desc' });
```
后端 SQL 结果：`ORDER BY e1_0.updated_at DESC LIMIT ?`（已验证）

**变更 2 — 移除 KPI 卡片**：
- 删除 `renderDashboard()` 中整个 KPI 卡片 `<div>` 区块（原约 65 行代码，含 4 张卡片：Total Enquiries / Quoted & Pending / Secured / New）
- `renderDashboard` 直接从 `<div className="flex justify-between items-center">` 标题行开始（即 Recent Enquiries 标题行）
- 同步移除已不再使用的 `FileSpreadsheet` 图标导入，清理无用 import

---

#### 修改文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `types.ts` | **修改** | ExtraContainerWeights 字段 |
| `CargoContainerTable.tsx` | **修改** | 动态 20 尺列显示 Wt 输入 + updateExtraWeight 函数 |
| `OfferPriceTable.tsx` | **修改** | Header + Body 20 尺列扩展为 colSpan=3 含 Weight 列 |
| `EnquiryForm.tsx` | **修改** | buildContainerDetailsFromRows 同步 extraContainerWeights |
| `EnquiryDetail.tsx` | **修改** | Container Info 和 Price Lines 均展示 20 尺 Weight |
| `EnquiryContainerLine.java` | **修改** | 新增 extraContainerWeights 字段 |
| `JsonMapDoubleConverter.java` | **新建** | Map<String, Double> ↔ JSON TEXT 转换器 |
| `App.tsx` | **修改** | fetchData 排序参数 + 删除 KPI 卡片块 |

#### 数据库变更

| 操作 | SQL |
|------|-----|
| 额外柜型重量列 | `ALTER TABLE enquiry_container_line ADD COLUMN extra_container_weights TEXT NULL AFTER extra_containers` |

#### 后端验证

Hibernate SQL 日志确认：
- `extra_container_weights` 字段已正常被 SELECT 和 INSERT/UPDATE
- Dashboard API 查询确认生成 `ORDER BY e1_0.updated_at DESC LIMIT ?, ?`

#### TypeScript 编译

- 本次变更引入的新错误：**0 个**

---

### M28: RBAC权限重构 — 新增 SALES\_MANAGER 角色 & CN Pricing Operator 权限缩小 (2026-04-13)

**日期**: 2026-04-13  
**影响文件**: 4 个

#### 📝 变更说明

**问题背景**: `OPERATING_USER`（CN Pricing Operator）原有权限过大，可应承询价管理、主数据管理、全部报表功能。用户要求将报表功能从该角色剔除，并新增一个中间层角色 `SALES_MANAGER` 承接原来的全量权限设计。

**设计目标**：

| 角色 | 询价管理 | 主数据 | 报表(Reports) | 系统设置 |
|------|---------|--------|--------------|------|
| `ADMIN_USER` | ✅ | ✅ | ✅ | ✅ |
| `SALES_MANAGER` (新增) | ✅ | ✅ | ✅ | ❌ |
| `OPERATING_USER` (权限缩小) | ✅ | ✅ | **❌ 不可见** | ❌ |
| `NORMAL_USER` | ❌ | ❌ | ❌ | ❌ |

---

#### 1. 前端权限逻辑重构

**文件**: `logitrack-pro/App.tsx`

**角色判断变更**（原注释: `后端返回的角色代码: ADMIN_USER, OPERATING_USER, NORMAL_USER`）：
```typescript
// 修改前
// 后端返回的角色代码: ADMIN_USER, OPERATING_USER, NORMAL_USER
const isAdmin = roles.includes('ADMIN_USER') || roles.includes('ADMIN');
const isOperatingUser = isAdmin || roles.includes('OPERATING_USER');  // 错误： isAdmin 隐含在内
const isLoginUser = !isAdmin && !isOperatingUser;

const canManageEnquiries = isAdmin || isOperatingUser;
const canManageMasterData = isAdmin || isOperatingUser;
const canViewReports = isAdmin || isOperatingUser;   // OPERATING_USER 之前可见 Reports
const canViewSettings = isAdmin;

// 修改后
// 后端返回的角色代码: ADMIN_USER, SALES_MANAGER, OPERATING_USER, NORMAL_USER
const isAdmin = roles.includes('ADMIN_USER') || roles.includes('ADMIN');
const isSalesManager = roles.includes('SALES_MANAGER');     // 新增
const isOperatingUser = roles.includes('OPERATING_USER');   // 不再隐含 isAdmin
const isLoginUser = !isAdmin && !isSalesManager && !isOperatingUser;

const canManageEnquiries = isAdmin || isSalesManager || isOperatingUser;
const canManageMasterData = isAdmin || isSalesManager || isOperatingUser;
const canViewReports = isAdmin || isSalesManager;   // OPERATING_USER 不可见 Reports
const canViewSettings = isAdmin;
```

**影响范围**：
- `OPERATING_USER` 登录后，左侧边栏不再显示 `Reports`（基础报表 / 增强报表 / 时期对比 / AI 数据助手）四个菜单
- `OPERATING_USER` 访问 `allowedViews`：`dashboard`, `enquiry-list`, `enquiry-detail`, `enquiry-form`, 主数据相关视图
- `SALES_MANAGER` 访问 `allowedViews`：全部（除 `settings`）

---

#### 2. 审计日志角色标签展示增强

**文件**: `logitrack-pro/components/settings/AuditLog.tsx`

- 角色标签颜色新增 `SALES_MANAGER` 极導绿色（`bg-emerald-100 text-emerald-800`）
- `SALES_MANAGER` 角色显示标签 `translations.auditLog.userRoles.salesManager`
- 角色区分匹配列表更新为 `['ADMIN_USER', 'SALES_MANAGER', 'OPERATING_USER', 'NORMAL_USER']`

```tsx
// 修改后的标签渲染逻辑
log.userRole === 'ADMIN_USER' ? 'bg-purple-100 text-purple-800' :
log.userRole === 'SALES_MANAGER' ? 'bg-emerald-100 text-emerald-800' :
log.userRole === 'OPERATING_USER' ? 'bg-blue-100 text-blue-800' :
'bg-gray-100 text-gray-800'
```

---

#### 3. 多语言翻译更新

**文件**: `logitrack-pro/i18n/translations.ts`

- **类型定义（TranslationSchema）**：`userRoles` 新增 `salesManager: string` 字段
- **中文翻译**：
  ```typescript
  userRoles: {
    admin: 'Admin',
    salesManager: 'Sales Manager',
    pricingAdmin: 'CN Pricing Operator',  // 修正：原为 'Pricing Admin'
    user: 'User',
  }
  ```
- **英文翻译**：同上

---

#### 4. 数据库新增 SALES\_MANAGER 角色

**迁移文件**: `database/migration_20260413_sales_manager_role.sql`

```sql
INSERT INTO role (role_code, role_name, description)
VALUES ('SALES_MANAGER', 'Sales Manager',
        'Sales Manager - enquiries + master data + reports, no settings')
ON DUPLICATE KEY UPDATE role_name='Sales Manager',
  description='Sales Manager - enquiries + master data + reports, no settings';
```

**执行结果**：`role` 表新增 id=4 记录，角色列表：

| id | role_code | role_name |
|----|-----------|----------|
| 1 | ADMIN_USER | Administrator |
| 2 | OPERATING_USER | Operating User |
| 3 | NORMAL_USER | Normal User |
| 4 | SALES_MANAGER | Sales Manager |

---

#### 使用说明

- 现有 `OPERATING_USER`（CN Pricing Operator）用2多个某些用户，登录后自动不再显示 Reports 菜单
- 需要报表权限的用户，在「系统设置 → 用户管理」中将其角色改为 `SALES_MANAGER`
- 后端无需修改：角色判断完全在前端在线完成；后端 API 未设置接口层权限校验，不受影响

---

#### 修改文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|说明|
| `App.tsx` | **修改** | 新增 `isSalesManager` 判断；重构权限常量；`canViewReports` 排除 OPERATING_USER |
| `AuditLog.tsx` | **修改** | SALES_MANAGER 角色标签显示支持 |
| `translations.ts` | **修改** | 类型 + 中英文均新增 salesManager 翻译；pricingAdmin 标签文本修正 |
| `migration_20260413_sales_manager_role.sql` | **新建** | DB INSERT SALES_MANAGER 角色 |

#### TypeScript 编译

- 本次变更引入的新错误：**0 个**

---

### M29: 全量数据迁移 — Chinese Pricing CSV 导入 (2026-04-16)

**日期**: 2026-04-16  
**类型**: 数据迁移 & 环境初始化  
**负责**: 数据迁移小组

#### 🎯 目标需求
将 Chinese Pricing CSV 数据（9,265 行）迁移到 LogiTrack Pro V3 数据库，建立历史询价数据基础。完成包括主数据补录、港口匹配、状态映射、货运类型转换在内的全面数据清洗和转换。

#### ✨ 主要功能

1. **Phase 0: 迁移环境准备 (setup_migration.py)**
   - 新增 756 个港口（SEA + AIR）
   - 补录 14 个缺失 port_code 合成港口
   - 新增 CMP (China Main Port) 主港作为汇聚港
   - 补录缺失箱型：BBK、BULK
   - 补录新 Office：ZIEGLER FRANCE (migration-only, is_active=0)、ZIEGLER XIAMEN、LEX ULUSLARARASI
   - 创建 NA PIC (id=593) 作为未匹配销售代表的占位符

2. **Phase 1-3: 主迁移 (migrate_v4.py)**
   - **CSV 数据源**: 9,265 行数据
   - **数据清洗**: 日期、数量、金额字段解析与转换
   - **状态映射**: 依据报价状态 + 业务决策，自动映射到 5 种数据库状态（New/Quoted&Pending/Secured/Lost/Cancelled）
   - **货运类型转换**: 
     - AIR 类型保持
     - RAIL 按数量单位决定转为 FCL (CNTR) 或 LCL (CBM/KG)
   - **港口多层匹配**: 7 层策略（精确代码/名称/城市 → 去空格 → 去标点 → 去后缀 → 逗号分割 → mapping 文件 → display_name）
   - **销售代表 & 办公室路由**: PIC mapping 文件优先，包含 office 覆盖指令，未匹配则用 NA
   - **报价处理**: 创建 Offer + OfferPriceLine，price_text 存原始报价文字供人工审核
   - **容器行处理**: 支持多行容器明细，自动修正 qty/unit 互换错误

3. **数据完整性检查**
   - FK 检查：销售代表与办公室无悬挂
   - 端口关联率：POL 99%，POD 97%

#### 📊 迁移结果
| 指标 | 数值 |
|------|------|
| **CSV 总行数** | 9,265 |
| **成功导入** | 9,253 (99.87%) |
| **跳过-TBA/空 office** | 11 (可接受) |
| **跳过-重复 ref#** | 1 |
| **真实错误** | 0 |
| **POL 匹配率** | 99% (9,331/9,343) |
| **POD 匹配率** | 97% (9,218/9,518) |
| **Offer 创建** | 8,974 |
| **价格行** | 8,720 |
| **容器行** | 2,742 |
| **FK 完整性** | 0 悬挂 |

#### 📊 数据分布
| 维度 | 分布 |
|------|------|
| **状态** | Secured=4,150 (43%)、Lost=4,700 (49%)、Cancelled=213 (2%)、Quoted&Pending=167 (2%)、New=20 (0.2%) |
| **货运类型** | AIR=4,502 (47%)、FCL=3,147 (33%)、LCL=1,601 (17%)、RAIL=3 (转换) |
| **主数据** | 港口=780、办公室=234、销售代表=596、箱型=18、国家=143 |

#### 📦 新增脚本
| 脚本 | 功能 | 行数 |
|------|------|------|
| `database/setup_migration.py` | Phase 0 环境准备，幂等设计可重复运行 | 532 |
| `database/migrate_v4.py` | Phase 1-3 主迁移、数据清洗、报告生成 | 1,280+ |

#### ⚙️ 技术要点

1. **港口匹配算法**: 
   - 为解决中文港口名称非标准问题，设计 7 层递进匹配
   - Mapping 文件对特殊港口提供显式映射
   - 支持城市多个港口的冗余解析

2. **状态自动映射**:
   - Decision 1: Quoted + Yes → Secured；Quoted + Rejected → Lost；空值 + Pending → Quoted & Pending
   - 支持用户覆盖，保存原始报价状态到 price_text

3. **数据冗余处理**:
   - TBA / "-" / 空 office 行安全跳过，不报错
   - 重复 ref# (CN2501433-R) 存入 duplicate_refs.csv 供审核
   - UOM 超长 (>20 字符) 自动截断，原值保存到 remark

4. **容器明细处理**:
   - CSV 单行包含多个容器时，按逗号/空格分割
   - 自动识别并修正 qty/unit 互换（如 "20GP x 4" vs "4 x 20GP"）
   - Container Line 与 Enquiry 的 1-N 关系

#### 📋 迁移执行步骤
```bash
# 1. 环境准备（幂等）
cd database
py setup_migration.py

# 2. 全量迁移
py migrate_v4.py

# 3. 验证
# - migration_errors.csv 为空（或仅 TBA office 记录）
# - migration_warnings.csv 列出警告（非致命）
# - 数据库中 enquiry 行数为 9,253
```

---

### M30: 增量数据迁移 & 异常修复 — 新增 Office/PIC + 重试失败记录 (2026-04-16)

**日期**: 2026-04-16  
**类型**: 增量迁移 & 异常恢复  
**负责**: 数据迁移小组

#### 🎯 目标需求
处理 Chinese Pricing CSV 中 CN2602217 及以后的新增数据（480 行），解决之前增量迁移中因缺少 3 个 Office 导致的 9 条异常记录，补录主数据并重试迁移。

#### ✨ 主要功能

1. **新增主数据**
   - **3 个 Office**:
     - PARTEX AEROMARINE LOGISTICS PVT LTD (id=236, sales_country=OT)
     - DYNAMEX FREIGHT LTD (id=237, sales_country=OT)
     - HAWK FREIGHT SERVICES (id=238, sales_country=OT)

   - **4 个 PIC (新增 + 更新)**:
     - BIKASH BHATTACHARJEE (id=598) → PARTEX AEROMARINE LOGISTICS PVT LTD
     - GULSHAN (id=599) → PARTEX AEROMARINE LOGISTICS PVT LTD
     - MICHAEL MWANGI (id=600) → DYNAMEX FREIGHT LTD
     - CRYSTAL LABORTE (id=214) → 更新关联 office: ON TIME → HAWK FREIGHT SERVICES

2. **异常恢复 (fix_exceptions.py)**
   - 从 migration_exceptions 表查询 PENDING 记录
   - 重新加载数据库缓存和 mapping 文件
   - 逐条调用 MigratorV4._process_row() 重新处理
   - 成功则标记 RESOLVED，失败则标记 FAILED + 保存错误信息

#### 📊 迁移结果
| 指标 | 数值 |
|------|------|
| **新增 CSV 行数 (CN2602217+)** | 480 |
| **已存在于 DB** | 412 (前次增量导入) |
| **异常记录** | 9 |
| **异常成功处理** | 9 (100%) |
| **异常失败处理** | 0 (0%) |
| **RESOLVED** | 9 |
| **FAILED** | 0 |
| **总 enquiry 数** | 9,674 |
| **FK 完整性** | PIC 悬挂 0，Office 悬挂 0 |

#### 📝 9 条异常恢复记录
| ref_number | 原因 | 重试结果 |
|-----------|------|----------|
| CN2603258-S | Office "DYNAMEX FREIGHT LTD" not found | ✅ RESOLVED |
| CN2603278-A | Office "HAWK FREIGHT SERVICES" not found | ✅ RESOLVED |
| CN2603322-S1 | Office "PARTEX AEROMARINE LOGISTICS PVT LTD" not found | ✅ RESOLVED |
| CN2603322-S2 | Office "PARTEX AEROMARINE LOGISTICS PVT LTD" not found | ✅ RESOLVED |
| CN2603323-AS1 | Office "PARTEX AEROMARINE LOGISTICS PVT LTD" not found | ✅ RESOLVED |
| CN2603323-AS2 | Office "PARTEX AEROMARINE LOGISTICS PVT LTD" not found | ✅ RESOLVED |
| CN2604009-S | Office "DYNAMEX FREIGHT LTD" not found | ✅ RESOLVED |
| CN2604021-A | Office "HAWK FREIGHT SERVICES" not found | ✅ RESOLVED |
| CN2604035-S | Office "PARTEX AEROMARINE LOGISTICS PVT LTD" not found | ✅ RESOLVED |

#### 📦 新增脚本
| 脚本 | 功能 |
|------|------|
| `database/fix_exceptions.py` | 补录主数据后重试 migration_exceptions 表中的 PENDING 记录，幂等设计 |

#### ⚙️ 技术要点

1. **幂等设计**:
   - fix_exceptions.py 可重复运行
   - 检查 office/pic 是否已存在，避免重复插入
   - 若 ref# 已在 enquiry 表中，直接标记 RESOLVED

2. **Office 字段约束**:
   - dict_sales_office 要求 name_norm (UNIQUE 归一化) 和 code (UNIQUE)
   - 自动生成 code = 各单词首字母组合，防冲突
   - sales_country_code 为 FK，无效国家改为 OT (OTHERS)

3. **异常恢复流程**:
   - Step 1: 添加 Office（检查已存在）
   - Step 2: 添加 PIC（检查已存在，自动关联 office）
   - Step 3: 重试 PENDING 异常（每条单独处理，捕获异常）

#### 📋 执行步骤
```bash
cd database
py fix_exceptions.py
```

---

### M31: 增量迁移 CN2604038+ & 状态同步 & 补录 Office/PIC & 重试 3 条异常 (2026-04-24)

**日期**: 2026-04-24  
**类型**: 增量迁移 & 主数据补录 & 异常恢复  
**负责**: 数据迁移小组

#### 🎯 目标需求
1. 将 CSV 中 `CN2604038` 及以后的 227 条新询价记录增量导入数据库
2. 对 2026 年以来的历史记录做一次全量状态同步（以 CSV 为准）
3. 补录截图提供的 3 个缺失 Office 及关联 PIC，解决 3 条 PENDING 异常

#### ✨ 主要工作

##### 1. 新脚本 `database/migrate_incremental.py`
三阶段增量迁移脚本，幂等设计，可重复运行：

| 阶段 | 动作 | 说明 |
|------|------|------|
| Phase 1 | 清除 demo 数据 | 删除 `enquiry.id > 18968` 的记录（本次无） |
| Phase 2 | 增量导入 | 仅导入 CSV 中 `ref >= 'CN2604038'` 且 DB 中不存在的行 |
| Phase 3 | 状态同步 | 对 `enquiry_created_date >= 2026-01-01` 的记录重新同步状态字段 |

技术细节：
- 通过 `importlib.util` 加载 `migrate_v4.py` 中的 `MigratorV4` 类，复用已验证的迁移逻辑
- Phase 2 每行调用 `migrator._process_row()`，失败写入 `migration_exceptions` 表
- Phase 3 根据 CSV 中 `QUOTATION STATUS` + `BOOKING CONFIRMED` 字段重新计算系统状态并更新

##### 2. Phase 2 结果（增量导入）
| 指标 | 数值 |
|------|------|
| CSV 新行范围 | CN2604038 ~ CN2604249 |
| 匹配行数 | 227 |
| 成功导入 | 224 |
| 失败写入 migration_exceptions | 3 |
| 失败原因 | 3 个 Office 在主数据中不存在 |

##### 3. Phase 3 结果（状态同步）
| 指标 | 数值 |
|------|------|
| DB 待对比记录（2026 年） | 1,742 |
| 状态实际变更 | 297 |
| Quoted & Pending → Lost | 250 |
| New → Lost | 19 |
| Quoted & Pending → Secured | 18 |
| New → Cancelled | 9 |
| Secured → Lost | 1 |

##### 4. 新脚本 `database/fix_m31.py`
补录截图中全部 Office 和 PIC 主数据，然后重试 3 条 PENDING 异常：

**新增 Office（3 个）**:
| Office | country_code | id |
|--------|-------------|-----|
| ATLAS LOGISTICS PVT LTD | AG | 239 |
| SOUTH ASIA SHIPPING & LOGISTICS (PVT.) LIMITED | AG | 240 |
| HECNY FRANCE | AG | 241 |

**已存在 Office（4 个，无需新增）**:
- ZIEGLER GERMANY (id=212, DE)
- ZIEGLER FELIXSTOWE (id=224, GB)
- PT FIDO (id=140, AG)
- PT SILKARGO INDONESIA (id=141, AG)

**新增 PIC（8 个）**:
| PIC | Office | id |
|-----|--------|----|
| PREMCHANDRA GUPTA | ATLAS LOGISTICS PVT LTD | 601 |
| THOMAS SCHRODER | ZIEGLER GERMANY | 602 |
| ASHLEY HARRIS | ZIEGLER FELIXSTOWE | 603 |
| MEHAK RAZAAQ | SOUTH ASIA SHIPPING & LOGISTICS (PVT.) LIMITED | 604 |
| SYLVAIN CHIRAT | HECNY FRANCE | 605 |
| BERND STEZYCKI | ZIEGLER GERMANY | 606 |
| MAULANA SAPTAJI | PT FIDO | 607 |
| ARIN PUTRI ADIWARDANI | PT SILKARGO INDONESIA | 608 |

**3 条异常全部恢复**:
| ref_number | 原因 | 结果 |
|-----------|------|------|
| CN2604039-A | Office "ATLAS LOGISTICS PVT LTD" not found | ✅ RESOLVED |
| CN2604154-S | Office "HECNY FRANCE" not found | ✅ RESOLVED |
| CN2604249-A | Office "SOUTH ASIA SHIPPING & LOGISTICS (PVT.) LIMITED" not found | ✅ RESOLVED |

#### 📊 最终数据库状态

| 指标 | 数值 |
|------|------|
| **总 enquiry 数** | **9,892** |
| Lost | 5,111 |
| Secured | 4,428 |
| Cancelled | 236 |
| Quoted & Pending | 106 |
| New | 11 |
| **Pending exceptions** | **0** |
| FK PIC 悬挂 | 0 |
| FK Office 悬挂 | 0 |

#### 📦 新增/修改文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `database/migrate_incremental.py` | 新增 | 三阶段增量迁移脚本（Phase 1/2/3） |
| `database/fix_m31.py` | 新增 | 补录 Office/PIC 主数据 + 重试 PENDING 异常 |

#### ⚙️ 技术要点

1. **MigratorV4 复用**：`migrate_incremental.py` 和 `fix_m31.py` 均通过 `importlib.util` 动态加载 `migrate_v4.py`，共享已验证的行处理逻辑，避免代码重复
2. **幂等设计**：两个脚本均可重复运行，已存在的数据自动跳过
3. **Office 主数据约束**：`dict_sales_office.name_norm` (UNIQUE) 取 `name.upper().strip()`；`code` 由名称各单词首字母拼接，冲突时自动添加序号
4. **country_code 映射**：AGENTS → `AG`，GERMANY → `DE`，UK → `GB`（均为 `dict_sales_country` 有效 code）

#### 📋 执行步骤
```bash
cd database
py migrate_incremental.py   # Phase 1-3 增量迁移 + 状态同步
py fix_m31.py               # 补录 Office/PIC + 重试 3 条异常
```

---

### M32: Enquiry 管理增强与关键缺陷修复（筛选/导出/权限/币种）(2026-04-23 ~ 2026-04-27)

**日期**: 2026-04-23 ~ 2026-04-27  
**类型**: 需求实现 + 缺陷修复 + 可用性增强  
**负责**: 前后端协同开发

#### 🎯 需求范围（去重整理）
本里程碑聚合 4 月下旬同一批 Enquiry 管理相关改动，已合并重复问题记录，仅保留最终生效方案：

1. Enquiry Management 新增 **Enquiry Created Date** 区间筛选
2. Enquiry Management 的 **Assigned CN Office** 从单选改为多选
3. Enquiry Management 按当前筛选条件导出 **XLSX**，并补齐导出字段
4. 权限调整：Manager / CN Pricing Operator 可管理询价并查看报表；仅 Admin 可管理主数据与设置
5. 报表弹窗（CN Office 详情）补齐 `refNumber`、`salesPicName`、`polName`、`podName`
6. Enquiry 新增 `senderEmail`（Sales Information 区域，非必填）并在详情展示
7. 站点 favicon 更新（ZAsia 品牌）
8. 修复报价币种交互：非 FCL/BUYER-CONSOL 类型也可选择并展示 Frg/Local 币种

#### ✨ 主要功能与修复

##### A. Enquiry 列表筛选能力增强
- 新增 `createdDateFrom/createdDateTo` 前后端参数贯通
- 后端按 `enquiryCreatedDate(LocalDateTime)` 做闭区间过滤（`to + 1 day` 上限）
- CN Office 支持逗号分隔多值，后端转 `IN (...)` 查询
- 前端筛选区升级：
  - Office 多选下拉（复选框）
  - Created Date 双日期选择器
  - Active tags 可逐项清除

##### B. XLSX 导出（按筛选条件）
- 新增 `xlsx` 依赖与导出按钮
- 导出逻辑按当前筛选条件重新拉取数据（高 pageSize）后生成工作簿
- 导出字段扩充为业务可读版本，包含：
  - Reference/Product/Cargo/Status
  - Sales Country/PIC/Office/Assigned CN Office
  - Sender Email/Core-NonCore/POL/POD/POD Country
  - Commodity/Volume/Quantity/UOM/Oversize/EXW/Cargo Ready Date/Remark/Offer Type
  - Received Date/Created Date/Offers Count/Latest Offer Date

##### C. 报表弹窗字段缺失修复
- `StatisticsService.getOfficeEnquiries()` 返回键名统一为前端需要的 `refNumber`
- 补充返回 `productAbbr`、`salesPicName`、`polName`、`podName`

##### D. Sender Email 全链路
- 实体新增 `sender_email` 映射字段
- 提供数据库迁移 SQL：`migration_add_sender_email.sql`
- 前端表单新增 Sender Email 输入（非必填）
- 详情页在有值时展示 Sender Email 卡片

##### E. 权限模型修正
- `canManageMasterData = isAdmin`
- `canViewReports = isAdmin || isSalesManager || isOperatingUser`
- 保持 NORMAL_USER 为询价只读路径

##### F. 报价币种交互修复（最终版）
- `OfferPriceTable` 中货币选择器从“仅 FCL/BUYER-CONSOL 可见”调整为“所有 offer type 可见”
- `EnquiryDetail` 中币种展示逻辑统一为所有 offer type 均显示 `Frg.` 与 `Local`（默认 USD）
- 与 LCL/AIR 的 Price Details 编辑行为对齐，避免“可保存不可见”

#### 🐛 重点缺陷闭环

1. **报表弹窗无 ref/salesPic/pol/pod**  
  根因：返回键名不一致 + 缺少关联字段装配。已修复并补齐。

2. **Created Date 筛选不生效（总页数不变）**  
  根因：后端筛选参数链路缺失。已补全 Controller → Service → Specification 并验证生效。

3. **XLSX 导出字段不完整**  
  根因：列表接口原始字段有限。通过服务层批量 enrich 派生字段并扩展导出列修复。

4. **非 FCL 报价无币种选择器**  
  根因：前端组件用 `isContainer` 条件限制了币种 UI。已移除限制并同步详情展示。

#### 📦 影响文件（17个）

**前端**
- `logitrack-pro/components/enquiry/EnquiryList.tsx`
- `logitrack-pro/components/enquiry/EnquiryForm.tsx`
- `logitrack-pro/components/enquiry/EnquiryDetail.tsx`
- `logitrack-pro/components/enquiry/OfferPriceTable.tsx`
- `logitrack-pro/App.tsx`
- `logitrack-pro/services/api.ts`
- `logitrack-pro/types.ts`
- `logitrack-pro/index.html`
- `logitrack-pro/public/favicon.svg`
- `logitrack-pro/package.json`
- `logitrack-pro/package-lock.json`

**后端**
- `backend/src/main/java/com/logitrack/backend/controller/EnquiryController.java`
- `backend/src/main/java/com/logitrack/backend/specification/EnquirySpecification.java`
- `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java`
- `backend/src/main/java/com/logitrack/backend/service/StatisticsService.java`
- `backend/src/main/java/com/logitrack/backend/entity/Enquiry.java`

**数据库**
- `database/migration_add_sender_email.sql`

#### ⚙️ 实现要点

1. **派生字段批量填充**（避免 N+1）
  - 在 `Enquiry` 增加 `@Transient`：`salesPicName/salesOfficeName/polName/podName`
  - 在 `EnquiryService` 增加 `enrichWithDerivedFields(List<Enquiry>)`
  - 使用批量 `findAllById` 聚合映射后回填

2. **创建时间筛选语义**
  - `createdDateFrom`: `>= from.atStartOfDay()`
  - `createdDateTo`: `< to.plusDays(1).atStartOfDay()`
  - 保证按自然日筛选，不受时分秒影响

3. **Office 多选传参与解析**
  - 前端数组 join 为逗号分隔字符串
  - 后端 split+trim 后走 `IN` 条件

4. **币种显示统一策略**
  - 编辑态和详情态均展示两种币种
  - 未设置时默认回落 `USD`

#### ✅ 验证结论（记录）
- 前端 TypeScript 校验无新增错误（关键文件已检查）
- 后端编译通过（`mvn compile`）
- 后端筛选 API 验证：`createdDateFrom/To` 生效，结果集与页数按筛选明显收缩
- 报表弹窗字段与详情币种显示按需求恢复

---

### M33: Web 监控面板 Phase 1 — 基础设施 + Dashboard (2026-05-08)

**日期**: 2026-05-08  
**计划书**: `email-ai-automation/docs/PLAN_WEB_MONITOR_DASHBOARD.md` Phase 1

#### 🎯 目标需求
为 email-ai-automation Python 服务搭建完整 Web 监控面板的基础数据管线与实时 Dashboard，支持在 LogiTrack 系统设置 → 邮件监控 Tab 中查看服务运行状态。

#### ✨ 主要功能

1. **MySQL 数据管线**
   - 新增 `email_processing_log` 表：每封邮件处理完写一行记录（34个字段，含 AI 分析结果、路由指令、LogiTrack 建单状态、性能耗时）
   - 新增 `email_monitor_status` 表：每轮轮询结束写状态快照（运行模式、累计统计、服务健康指示）
   - 迁移脚本：`database/migration_monitor.sql`

2. **Python 数据写入 (`services/monitor_db.py`)**
   - `write_processing_log()` — 异步安全写入邮件处理日志，失败只打警告不阻断主流程
   - `write_status_snapshot()` — 写入服务运行状态快照
   - 连接配置通过 `LOGITRACK_DB_*` 环境变量注入

3. **Python `main.py` 集成**
   - 在每封邮件处理的所有退出路径（早期跳过/非询价/成功/失败）写入处理日志
   - 统计字段：`_TOTAL_PROCESSED/_SKIPPED/_ERRORS/_FORWARDED/_LOGITRACK` 全局累计
   - `ai_latency_ms` 精准测量 AI 分析耗时

4. **Python FastAPI 监控 API (`services/monitor_api.py`)**
   - `GET /pyapi/status` — 实时进程状态（模式/统计/健康/上次轮询）
   - `GET /pyapi/status/health` — 各服务健康标签
   - `GET /pyapi/status/folders` — 轮询文件夹列表（占位）
   - `GET /pyapi/debug/system-info` — 系统概要
   - 绑定 `127.0.0.1:5100`，daemon 子线程启动，不影响主轮询

5. **Spring Boot 监控模块**
   - `EmailProcessingLog.java` / `EmailMonitorStatus.java` — JPA 实体
   - `EmailProcessingLogRepository` — 支持分页多条件查询 + 今日统计聚合
   - `EmailMonitorStatusRepository` — 最新状态快照查询
   - `MonitorService` — 业务逻辑：统计聚合 + 日志分页 + DTO 映射
   - `MonitorController` — REST 控制器：`/api/monitor/stats`、`/api/monitor/logs`、`/api/monitor/logs/recent`
   - `MonitorStatsDTO` / `ProcessingLogDTO` — 数据传输对象

6. **Vite 代理配置**
   - 新增 `/pyapi → http://localhost:5100` 代理，前端无跨域访问 Python FastAPI

7. **前端监控 Dashboard**
   - `services/monitorApi.ts` — 双源 API 服务（Spring Boot 历史 + Python FastAPI 实时）
   - `components/settings/monitoring/MonitoringDashboard.tsx` — 四 Tab 主容器（Phase 2-4 Tab 留占位）
   - `components/settings/monitoring/tabs/StatusOverview.tsx` — 实时状态 Dashboard
     - 6 张今日统计卡片（总处理/已处理/跳过/失败/已转发/已建单）
     - 运行状态面板（模式徽标/轮询间隔/上次轮询相对时间/持续运行时长/连续失败）
     - 服务健康指示器（Graph/LLM/VLM/LogiTrack 四路健康灯）
     - 本次启动累计统计（Python API 在线时显示）
     - 30 秒自动轮询刷新
   - `SettingsLayout.tsx` — 新增 "📊 邮件监控" Tab

#### 📦 影响文件 (22个)

**数据库**
- `database/migration_monitor.sql` (新增，建表脚本)
- `database/run_monitor_migration.py` (新增，执行脚本)

**Python (email-ai-automation)**
- `services/monitor_db.py` (新增，150行)
- `services/monitor_api.py` (新增，160行)
- `main.py` (更新，集成日志写入 + FastAPI 子线程 + 累计统计变量)
- `requirements.txt` (更新，添加 `pymysql`，`uvicorn[standard]`)

**Spring Boot 后端**
- `entity/EmailProcessingLog.java` (新增，110行)
- `entity/EmailMonitorStatus.java` (新增，85行)
- `repository/EmailProcessingLogRepository.java` (新增)
- `repository/EmailMonitorStatusRepository.java` (新增)
- `service/MonitorService.java` (新增，100行)
- `controller/MonitorController.java` (新增，90行)
- `dto/MonitorStatsDTO.java` (新增)
- `dto/ProcessingLogDTO.java` (新增)

**前端 (logitrack-pro)**
- `services/monitorApi.ts` (新增，170行)
- `components/settings/monitoring/MonitoringDashboard.tsx` (新增，65行)
- `components/settings/monitoring/tabs/StatusOverview.tsx` (新增，200行)
- `components/settings/SettingsLayout.tsx` (更新，新增 "📊 邮件监控" Tab)
- `vite.config.ts` (更新，新增 `/pyapi` 代理)

#### ✅ Phase 1 验收状态
- [x] MySQL 两张表建立成功，Python `monitor_db` 写入验证通过（log id: 2, status id: 2）
- [x] Python `monitor_api` 可导入，FastAPI 子线程启动逻辑就绪
- [x] Spring Boot 编译通过，`/api/monitor/stats` 返回 `todayTotal=2 runMode=DRY_RUN` ✅
- [x] 前端新增 `SettingsLayout` "邮件监控" Tab，TypeScript 监控模块无新增类型错误
- [x] 30 秒自动刷新 + Python API 不可用时降级展示历史数据

#### 📊 统计信息
- **新增代码**: ~1,200 行
- **新增 MySQL 表**: 2 个
- **新增 API 端点**: 6 个（Spring Boot 3 + Python FastAPI 4）
- **前端组件**: 3 个新增

---

### M35: Web 监控面板 Phase 3 — 调试控制面板 (2026-05-08)

**日期**: 2026-05-08  
**计划书**: `email-ai-automation/docs/PLAN_WEB_MONITOR_DASHBOARD.md` Phase 3

#### 🎯 目标需求
运行模式三态切换（DRY_RUN/TEST_FORWARD/LIVE）、邮件重放、日志级别控制、SkipChecker/Router 调试工具。

#### ✨ 主要功能

1. **Python 三态运行模式**
   - `config/settings.py`：新增 `test_forward_mailbox` 字段（`TEST_FORWARD_MAILBOX` 环境变量）
   - `main.py`：全局变量 `RUN_MODE`（DRY_RUN/TEST_FORWARD/LIVE）、`TEST_FORWARD` 布尔标志
   - `main.py`：新增 `--test-forward` 命令行参数
   - 转发逻辑：TEST_FORWARD 模式重定向到测试邮箱、添加 `[TEST-FORWARD]` 前缀
   - `main.py`：运行模式状态由 `RUN_MODE` 全局变量统一维护

2. **Python FastAPI 控制端点**（`monitor_api.py` 全面升级）
   - `POST /pyapi/control/mode` — 切换运行模式，动态修改 `main.py` 全局变量
   - `POST /pyapi/control/log-level` — 实时切换 Python 日志级别（DEBUG/INFO/WARNING/ERROR）
   - `POST /pyapi/control/poll-now` — 在后台线程立即触发一次轮询
   - `POST /pyapi/replay` — 从 `tested_emails.json` 重放邮件（重算 SkipChecker + Router，不真实转发）
   - `POST /pyapi/debug/skip-check` — SkipChecker 测试（subject + body → skip/reason/keyword）
   - `POST /pyapi/debug/router-test` — Router 路由测试（AI 分析 JSON → 转发指令列表）
   - `GET /pyapi/debug/system-info` — 系统概要（完善版：skip_checker 规则数/已测邮件数/模型配置）
   - Pydantic 请求体模型：`ModeRequest`、`LogLevelRequest`、`ReplayRequest`、`SkipCheckRequest`、`RouterTestRequest`

3. **前端 `ModeSwitch.tsx`**
   - 三按钮切换：DRY_RUN（绿）/ TEST_FORWARD（黄）/ LIVE（红）
   - 当前模式高亮显示
   - TEST_FORWARD 邮箱输入框
   - LIVE 切换二次确认弹窗（AlertTriangle 图标 + "确认切换到 LIVE" 按钮）
   - Python API 不在线时显示警告并禁用切换

4. **前端 `ReplayPanel.tsx`**
   - 输入 conversationId → 调用 `/pyapi/replay` → 展示 SkipChecker + 路由结果 + AI 分析摘要
   - Enter 键快速触发
   - 404 友好错误提示（"未找到，请检查是否曾经处理过"）
   - 结果清除按钮

5. **前端 `DebugTools.tsx`**（三合一组件）
   - **SkipChecker 测试**：subject/body 输入 → 结果卡片（绿色可建/红色跳过 + 命中关键词）
   - **Router 测试**：JSON 编辑器 → 转发指令列表（TO/CC/Branch/Risk 格式化展示）
   - **系统概要**：自动加载 Python API，展示模型配置/轮询文件夹/skip规则数/已测邮件数

6. **前端 `DebugControl.tsx`**（调试控制主面板）
   - 三子 Tab：🎛 运行控制 / 🔁 邮件重放 / 🔧 调试工具
   - 运行控制：ModeSwitch + 日志级别四按钮（DEBUG/INFO/WARNING/ERROR 颜色编码）+ 立即轮询按钮
   - 启动时从 `/pyapi/status` 读取当前模式并同步显示

7. **`MonitoringDashboard.tsx` 更新**
   - 移除 `DebugControlPlaceholder` 占位组件
   - 引入真实 `DebugControl` 组件

8. **`monitorApi.ts` 控制 API 补充**
   - `switchMode(mode, testMailbox?)` / `setLogLevel(level)` / `pollNow()`
   - `replay(conversationId)` / `testSkipChecker(subject, body)` / `testRouter(analysis)`

#### 📦 影响文件 (11个)

**Python (email-ai-automation)**
- `config/settings.py` (更新，新增 `test_forward_mailbox`)
- `main.py` (更新，三态模式变量 + `--test-forward` 参数 + TEST_FORWARD 转发逻辑)
- `services/monitor_api.py` (重写，从 160行 扩展至 ~320行，新增 8 个控制/调试端点)

**前端 (logitrack-pro)**
- `services/monitorApi.ts` (更新，补充 6 个 monitorPyApi 控制方法)
- `components/settings/monitoring/debug/ModeSwitch.tsx` (新增，~120行)
- `components/settings/monitoring/debug/ReplayPanel.tsx` (新增，~120行)
- `components/settings/monitoring/debug/DebugTools.tsx` (新增，~180行)
- `components/settings/monitoring/tabs/DebugControl.tsx` (新增，~135行)
- `components/settings/monitoring/MonitoringDashboard.tsx` (更新，引入 DebugControl)

#### ✅ Phase 3 验收状态
- [x] Python `monitor_api.py` 新增端点语法验证通过 ✅
- [x] `settings.test_forward_mailbox` 字段存在 ✅
- [x] `main.py` 全局 `RUN_MODE=DRY_RUN`, `TEST_FORWARD=False` 初始化正确 ✅
- [x] TypeScript 监控组件无新增类型错误 ✅
- [x] LIVE 切换二次确认弹窗实现
- [x] SkipChecker/Router 调试工具完整
- [x] 邮件重放从 tested_emails.json 缓存读取

#### 📊 统计信息
- **新增代码**: ~875 行
- **新增前端组件**: 4 个
- **新增 Python FastAPI 端点**: 8 个
- **Python 端点合计**: 12 个（Phase 1 基础 4 + Phase 3 新增 8）

--- Web 监控面板 Phase 2 — 处理日志列表 + 详情展开 (2026-05-08)

**日期**: 2026-05-08  
**计划书**: `email-ai-automation/docs/PLAN_WEB_MONITOR_DASHBOARD.md` Phase 2

#### 🎯 目标需求
可搜索、可筛选的处理日志列表，支持点击展开完整邮件处理链路详情（AI 分析 + 路由指令 + LogiTrack 建单状态）。

#### ✨ 主要功能

1. **Spring Boot DTO 补充字段**
   - `ProcessingLogDTO` 新增 `pol`、`pod`、`confidence` 三个字段
   - `MonitorService.toDTO()` 同步映射新字段
   - API `/api/monitor/logs` 返回字段已验证

2. **前端 `ProcessingLogs.tsx`**（日志列表主组件）
   - 可折叠筛选栏：时间范围（DatePicker）、文件夹（Sea/Air/Rail/Inbox）、处理结果（PROCESSED/SKIPPED/ERROR/FORWARDED）、邮件类型、发件人模糊匹配、主题关键词
   - 8 列表格：时间（绝对+相对）、文件夹（彩色标签）、发件人、主题（截断）、邮件类型徽标、处理结果徽标、建单状态、展开按钮
   - 内联行展开 `LogDetailPanel`（点击行切换展开/收起）
   - 分页控制（最多显示 7 页按钮，上/下翻页，首/尾页跳转）
   - 30s 手动刷新按钮 + 总条数显示

3. **前端 `AiAnalysisCard.tsx`**（AI 分析卡片）
   - 邮件类型徽标 + 置信度
   - 9 个字段网格：运输方式、Branch、风险等级（颜色编码）、起运城市、目的地、POL、POD、AI 耗时、总耗时
   - 风险等级颜色：LOW=绿、MEDIUM=黄、HIGH=红

4. **前端 `RoutingCard.tsx`**（路由指令卡片）
   - 转发状态徽标（DRY_RUN/NOT_FORWARDED/TEST_FORWARDED/FORWARDED/FAILED 五态）
   - TO/CC 收件人列表（JSON 解析后逗号展示）
   - 跳过原因（skip_reason）展示

5. **前端 `LogDetailPanel.tsx`**（展开详情面板）
   - 邮件头部（主题、发件人、处理时间、运行模式、文件夹）
   - `AiAnalysisCard`（当有 AI 分析结果时显示）
   - `RoutingCard`
   - LogiTrack 建单卡（ID/Ref/错误信息）
   - 支持内联模式（行内展开）和独立卡片模式

6. **`MonitoringDashboard.tsx` 更新**
   - 移除 `ProcessingLogsPlaceholder` 占位组件
   - 引入 `ProcessingLogs` 真实组件

7. **`monitorApi.ts` 类型补充**
   - `ProcessingLogDTO` 接口新增 `pol: string | null`、`pod: string | null`、`confidence: number | null`

#### 📦 影响文件 (8个)

**Spring Boot 后端**
- `dto/ProcessingLogDTO.java` (更新，新增 pol/pod/confidence)
- `service/MonitorService.java` (更新，toDTO() 映射新字段)

**前端 (logitrack-pro)**
- `services/monitorApi.ts` (更新，ProcessingLogDTO 接口新增3字段)
- `components/settings/monitoring/tabs/ProcessingLogs.tsx` (新增，~270行)
- `components/settings/monitoring/detail/AiAnalysisCard.tsx` (新增，~65行)
- `components/settings/monitoring/detail/RoutingCard.tsx` (新增，~60行)
- `components/settings/monitoring/detail/LogDetailPanel.tsx` (新增，~80行)
- `components/settings/monitoring/MonitoringDashboard.tsx` (更新，引入 ProcessingLogs)

#### ✅ Phase 2 验收状态
- [x] Spring Boot `/api/monitor/logs?size=3` 返回含 pol/pod/confidence 字段 ✅
- [x] 多条件筛选 API 验证：`folderName=Sea&processResult=PROCESSED` 返回 totalElements=2 ✅
- [x] 前端 TypeScript 类型检查：监控模块无新增错误 ✅
- [x] 后端编译通过（`mvn compile`，`mvn package -DskipTests`）✅
- [x] 日志列表分页展示（默认 20 条/页，支持翻页）
- [x] 筛选栏多维度筛选 + Enter 键快速搜索
- [x] 点击行内联展开详情（AI 分析 + 路由 + LogiTrack 三卡片）

#### 📊 统计信息
- **新增代码**: ~480 行
- **新增前端组件**: 4 个
- **新增 DTO 字段**: 3 个
- **后端 jar 已重新打包**

---

---

### M36: Web 监控面板 Phase 4 — 配置查看器 (2026-05-08)

**计划书**: `email-ai-automation/docs/PLAN_WEB_MONITOR_DASHBOARD.md` Phase 4  
**目标**: 在监控面板新增"⚙️ 配置查看"Tab，只读展示所有运行配置、连接状态测试及跳过/路由规则。

#### 🔧 修改文件

| 文件 | 变更 |
|------|------|
| `email-ai-automation/services/monitor_api.py` | 新增 3 个端点：GET /pyapi/config、GET /pyapi/config/rules、POST /pyapi/config/test-connection |
| `logitrack-pro/services/monitorApi.ts` | 新增 getConfig、getRules、testConnection 三个 API 方法 |
| `logitrack-pro/components/settings/monitoring/tabs/ConfigViewer.tsx` | 新建，包含 D1+D2+D3 三个功能区 |
| `logitrack-pro/components/settings/monitoring/MonitoringDashboard.tsx` | 引入真实 ConfigViewer，替换占位组件 |

#### 🎯 新增功能详情

##### D1 — API 连接状态（GET /pyapi/config）
- 展示 5 个服务的连接配置（Graph / LLM / VLM / VLM_Fallback / LogiTrack）
- API Key 自动脱敏（显示后 4 位），Tenant/Client ID 显示后 8 位
- 每个服务卡片带"🔗 测试连接"按钮 → POST /pyapi/config/test-connection
  - graph: 尝试 OAuth2 Token 获取
  - llm/vlm/vlm_fallback: HTTP GET base_url 可达性检测
  - logitrack: GET /api/monitor/stats 可达性
  - 返回: { ok, latency_ms, detail }，绿/红色内联结果显示

##### D2 — 运行参数（GET /pyapi/config → runtime 字段）
- 只读表格展示：POLL_INTERVAL / LOGITRACK_ENABLED / TEMP_ATTACHMENTS_DIR / TEST_FORWARD_MAILBOX
- 布尔值用 ✅/❌ 徽标显示

##### D3 — 跳过规则 & 路由配置（GET /pyapi/config/rules）
- skip_lists.json 按分类折叠展示，关键词 Badge 化
- PIC 路由摘要：Branch 列表 + Core Countries 数量及前10预览
- tested_emails 统计（总数 + 最近5条记录表格）
- 所有节使用 CollapsibleSection 可折叠组件

#### 📊 统计信息
- **新增代码**: ~320 行
- **新增前端组件**: 1 个（ConfigViewer.tsx）
- **新增 Python API 端点**: 3 个
- **Python 语法验证**: ✅ 通过
- **TypeScript 编译**: ✅ 无新增监控相关错误

---

### M37: Email AI UAT 路由 Bug 修复 + §12 AI 字段增强 + DRY-RUN 建单模式 (2026-05-11)

**日期**: 2026-05-11  
**系统**: `email-ai-automation` (Python)  
**关联文档**: `email-ai-automation/docs/PROJECT_STATUS_REPORT.md`, `docs/PLAN_AUTO_FILL_ENQUIRY.md §12`

#### 🎯 目标需求
基于 UAT 阶段发现的问题，修复 3 个路由/图片识别 Bug，新增 AI 字段提取增强（§12.1 六个新字段 + §12.2 routing_reason），并新增 LOGITRACK_DRY_RUN 打印模式（不实际建单）以支持安全 UAT 测试。

---

#### 🐛 Bug 修复（B20–B22）

##### B20 — GIF 内联图片 VLM 管线失效（`services/graph_client.py`）

**根本原因**: `fetch_unread_emails()` 方法在请求头中传递了 `Prefer: outlook.body-content-type="text"`，导致 Graph API 强制返回纯文本格式，邮件 `body.contentType` 始终为 `"text"` 而非 `"html"`。HTML 体缺失 → `cid:` 内联图片引用不可检测 → `get_inline_images()` 从不调用 → VLM 货量提取管线永远不触发。

**修复**: 从 `fetch_unread_emails()` 请求头中移除 `Prefer: outlook.body-content-type="text"` 一行。Graph API 现在默认返回 HTML body，VLM 管线正常触发。

**影响文件**: `services/graph_client.py`（移除 1 行请求头）

---

##### B21 — CALLAO（未知目的地）默认路由到 CORE（`services/router.py`）

**根本原因**: `get_routing()` 中 `is_core` 判断逻辑结尾 `else True`（当 destination_country 为空或不在规则表时默认为 CORE），导致秘鲁 CALLAO 等非主要航线目的地被错误路由到 CORE 规则。

**修复**: `else True` → `else False`，未知目的地默认为 NON-CORE，并标记 `core_basis = "default_non_core"`。

**影响文件**: `services/router.py`（~第104行，1 字符修改）

---

##### B22 — AIR no_cargo 使用错误路由规则（`services/router.py`）

**根本原因**: R5 规则（AIR + `no_specific_cargo=True`）的 no_cargo 分支调用了 `_get_air_special_instruction()`（tender_bid_air_domestic 专用规则），而非正常的 `_build_single_instruction()`，导致路由指令错误。

**修复**: R5 AIR no_cargo 分支改为调用 `_build_single_instruction(branch_code, is_core, routing_reason)` 走正常路由矩阵。

**影响文件**: `services/router.py`（R5 分支逻辑约5行）

---

#### ✨ 新功能

##### §12.1 — AI 分析新增 6 个提取字段（`services/ai_analyzer.py`）

在 `SYSTEM_PROMPT` 的 JSON output schema 中新增以下字段，提高建单 payload 完整率：

| 字段路径 | 说明 | 示例值 |
|----------|------|--------|
| `cargo_info.hs_code` | 海关 HS 编码（如邮件中提及） | `"8471.30"` |
| `cargo_info.cargo_ready_date_raw` | 货物备货日期原文 | `"end of May"` |
| `cargo_info.cargo_dimensions` | 货物尺寸/规格原文 | `"120*80*100 cm"` |
| `cargo_info.special_requirements` | 特殊要求数组 | `["DG", "TEMPERATURE_CONTROLLED"]` |
| `quote_deadline` | 报价截止日期（顶层字段） | `"2026-05-15"` |
| `customer_reference` | 客户 PO 或参考编号（顶层字段） | `"PO-20260501"` |

**影响文件**: `services/ai_analyzer.py`（SYSTEM_PROMPT JSON schema 部分）

---

##### §12.2 — 路由引擎新增 `routing_reason` 诊断字段（`services/router.py`）

`get_forward_instruction()` 返回值中新增 `routing_reason` 字典，记录完整路由决策链：

```python
routing_reason = {
    "is_core": bool,                  # CORE / NON-CORE 判断结果
    "core_basis": str,                # "pod_country|destination_country|default_non_core"
    "rule_triggered": str,            # "R2|R3|R4|R5|R6|normal"
    "rule_note": str,                 # 规则触发说明
    "branch_resolved": str,           # 最终 branch code
    "sender_is_ziegler": bool,        # 是否 Ziegler 发件人
    "destination_country": str,       # 解析出的目的国
    "destination_matched": bool,      # 是否匹配到 destination_rules
    "fallback_used": bool             # 是否使用了 fallback 规则
}
```

`main.py` 将 `routing_reason` 写入 `_mon["routing_json"]`，前端监控面板详情展开面板可展示完整路由链。

**影响文件**: `services/router.py`（`get_forward_instruction()` 末尾约30行）、`main.py`（`_mon["routing_json"]` 赋值处）

---

##### LOGITRACK_DRY_RUN 打印模式（`main.py` + `config/settings.py` + `.env`）

新增环境变量 `LOGITRACK_DRY_RUN`，UAT 阶段设为 `true` 时：
- 调用 `build_create_payload()` 构建建单 payload 但不实际调用 `create_enquiry()`
- 控制台打印 `🧾 LogiTrack DRY-RUN: 建单 payload（不实际创建）` + 完整 payload JSON
- 允许在生产 DB 环境下安全测试完整建单逻辑，不污染询价数据

**新增配置**: `.env` 中 `LOGITRACK_DRY_RUN=true`，`config/settings.py` 中 `logitrack_dry_run: bool`

**影响文件**: `main.py`（~第633-680行）、`config/settings.py`（+1行）、`.env`（+1行）

---

##### §12 计划文档更新（`docs/PLAN_AUTO_FILL_ENQUIRY.md`）

在 LogiTrack 计划书末尾新增 §12 章节：
- **§12.1**: 6 个新 AI 字段详细规格（字段名 / 类型 / 取值 / 映射目标）
- **§12.2**: `routing_reason` 字段设计（数据结构 / 监控展示 / 人工审核价值 / 实施步骤）

**影响文件**: `docs/PLAN_AUTO_FILL_ENQUIRY.md`（末尾追加 §12，约60行）

---

#### 📦 影响文件 (7个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `email-ai-automation/services/graph_client.py` | Bug Fix | 移除 `Prefer: text` 请求头 (B20) |
| `email-ai-automation/services/router.py` | Bug Fix + 新功能 | `is_core` 默认修复 (B21) + R5 分支修复 (B22) + `routing_reason` 字段 (§12.2) |
| `email-ai-automation/services/ai_analyzer.py` | 新功能 | SYSTEM_PROMPT 新增 6 个输出字段 (§12.1) |
| `email-ai-automation/main.py` | 新功能 | `LOGITRACK_DRY_RUN` 模式 + `routing_reason` 写入监控 |
| `email-ai-automation/config/settings.py` | 新功能 | 新增 `logitrack_dry_run` 配置项 |
| `email-ai-automation/.env` | 配置 | `LOGITRACK_DRY_RUN=true`，切换回生产 DB (`logitrack`) |
| `docs/PLAN_AUTO_FILL_ENQUIRY.md` | 文档 | 新增 §12 AI 字段增强计划 |

#### 📊 统计信息
- **Bug 修复**: 3 个（B20/B21/B22）
- **新增 AI 输出字段**: 6 个
- **新增路由诊断字段**: 1 个（`routing_reason`，包含 9 个子字段）
- **新增配置项**: 1 个（`LOGITRACK_DRY_RUN`）
- **Python 语法验证**: ✅ 全部通过（`py -c` 测试 ALL PASS）
- **UAT 模式**: TEST_FORWARD + 生产 DB + DRY_RUN（打印不建单）

#### ✅ 验收状态
- [x] B20 验证：Graph API 返回 HTML body，`cid:` 内联图片被检测，VLM 调用触发
- [x] B21 验证：未知目的地路由结果为 NON-CORE（`core_basis = "default_non_core"`）
- [x] B22 验证：AIR + no_cargo 走正常路由矩阵，不再触发 tender_bid_air_domestic 规则
- [x] §12.1 验证：DeepSeek 输出中包含新字段（有内容时提取，无内容时为 null）
- [x] §12.2 验证：`routing_json` 监控字段包含完整 `routing_reason` 子字典
- [x] DRY_RUN 验证：LOGITRACK_DRY_RUN=true 时控制台打印 payload，不调用建单 API
- [ ] GIF 内联图片 UAT：待 Inbox 测试邮件重新处理后验证 end-to-end

---

### M38: Web 监控面板 Phase 5 — 服务管理 + 监控面板全面增强 + 路由配置编辑器 (2026-05-11)

**日期**: 2026-05-11  
**系统**: `LogiTrack Pro 前端 (React)` + `Spring Boot 后端` + `email-ai-automation (Python)`  
**关联文档**: `email-ai-automation/docs/PROJECT_STATUS_REPORT.md`

#### 🎯 目标需求
在 M36 只读配置查看器基础上进行全面升级：
1. 新增 🚀 **服务管理 Tab** — 可在前端启动/停止 Python email-ai-automation 进程，配置运行模式和参数
2. 增强 **AI 分析卡片** — 展示完整 `aiAnalysisJson` 字段（货量/尺寸/HS Code/特殊要求等）
3. 增强 **路由指令卡片** — 展示 `routing_reason` 路由决策诊断面板（规则/CORE判断/发件人类型/fallback）
4. 增强 **LogiTrack 建单区** — DRY-RUN 模式下展示完整 payload（Sales PIC/Office/货型/POL/POD 等）
5. 增强 **调试重放面板** — 新增已测邮件快选列表 + 去重列表移除功能
6. 重构 **配置查看器** — 由只读改为3子标签（路由配置可编辑 + API连接测试 + 跳过规则）

---

#### ✨ 新功能详情

##### 1. 🚀 服务管理 Tab（`ServiceControl.tsx` 新建 + Spring Boot `ProcessManagerService`）

**前端** (`logitrack-pro/components/settings/monitoring/tabs/ServiceControl.tsx`)：
- **状态卡片 (StatusBanner)**：实时显示服务运行状态、PID、运行模式；绿色动态圆点（运行中）/ 红色（已停止）
- **启动参数配置 (LaunchConfig)**：
  - 运行模式选择：DRY_RUN / TEST_FORWARD / LIVE（三张卡片式选择器）
  - TEST_FORWARD 目标邮箱输入框
  - 轮询间隔滑块（30s / 60s / 120s / 300s 快捷按钮）
  - LogiTrack 建单模式切换（DRY-RUN 打印 / 实际建单）
- **运行时参数调整 (RuntimeControl)**（服务运行中时显示）：
  - 即时调整轮询间隔（无需重启，调用 `/pyapi/control/poll-interval`）
  - 即时切换 LogiTrack DRY-RUN 模式（调用 `/pyapi/control/logitrack-dry-run`）
- **启动/停止按钮**：调用 Spring Boot `/api/monitor/process/start` 或 `/stop`
- **轮询间隔**：服务停止时每 5 秒检查，运行时每 30 秒刷新

**后端** (`backend/...`):
- `ProcessManagerService.java`（新建）：
  - 维护 `volatile Process process` 单例
  - `start(StartRequestDTO)` — 构建 `ProcessBuilder` 命令行（含 `--mode`, `--poll-interval`, `--test-mailbox`，环境变量 `LOGITRACK_DRY_RUN`），启动 Python 进程，写 PID 文件
  - `stop()` — `process.destroy()` + PID 文件清除
  - `getStatus()` — 返回 running / pid / runMode / startTime / uptime
- `ProcessManagerController.java`（新建）：
  - `GET /api/monitor/process/status`
  - `POST /api/monitor/process/start`（请求体：`StartRequestDTO`）
  - `POST /api/monitor/process/stop`
- `application.properties`（新增）：`emailai.python.path`、`emailai.script.path`、`emailai.working.dir`
- `monitorApi.ts`（新增接口）：`processApi.getStatus()` / `processApi.start(req)` / `processApi.stop()`、`ProcessStatusDTO`、`StartRequestDTO` 接口定义

---

##### 2. AI 分析卡片增强（`AiAnalysisCard.tsx` 全面重写）

原版仅展示少量字段，现在解析完整 `aiAnalysisJson` 原始 JSON：

**核心区（始终显示）**：
| 字段 | 说明 |
|------|------|
| 运输方式 / Branch / 风险等级 | 原有字段，来源优先用 log 顶层字段，fallback 用 AI JSON |
| 起运城市 / 目的地 / POL→POD | 原有字段 |
| 品名 (commodity) | 来自 `cargo_info.commodity`（新增） |
| 重量 / 体积 | 来自 `cargo_info.gross_weight_kg` + `cargo_info.volume_cbm`（新增） |
| 箱型 (containers) | 来自 `cargo_info.containers`（新增） |
| LCL / FCL | 来自 `is_lcl` 布尔值（新增） |
| 贸易条款 (incoterm) | 来自 `cargo_info.incoterm`（新增） |

**扩展区（点击"展开更多字段"后显示）**（§12.1 新增字段）：
| 字段 | 说明 |
|------|------|
| HS Code | `cargo_info.hs_code` |
| 货好日期 | `cargo_info.cargo_ready_date_raw` |
| 货物尺寸 | `cargo_info.cargo_dimensions` |
| 特殊要求 | `cargo_info.special_requirements` |
| 报价截止日 | `quote_deadline`（顶层） |
| 客户单号 | `customer_reference`（顶层） |
| POL/POD 国家 | `pol_country` / `pod_country` |
| 风险标记 | `risk_flags` 数组 |
| 风险说明 | `risk_summary` |
| AI 建议 | `recommendation` |
| AI耗时 / 总耗时 | `aiLatencyMs` / `totalLatencyMs` |

标题行新增：危险品标记 (⚠️)、无具体货量提示、置信度百分比。

---

##### 3. 路由指令卡片增强（`RoutingCard.tsx` 全面重写）

**routing_reason 路由决策说明面板** (`RoutingReasonPanel`)：
- **规则徽章**：显示 `rule_triggered` 值（R2/R3/R4/R5/R6/normal），用颜色区分（蓝/紫/橙/红/黄/青）
- **CORE / Non-Core 标签**：来自 `is_core` 布尔值（✅ Core / ⚪ Non-Core）
- **发件人类型**：`sender_is_ziegler` → Ziegler 代理 / 外部客户
- **Fallback 警告**：`fallback_used === true` 时显示黄色警告 ⚠️
- **路由备注**：`rule_note` 文本
- **细节字段网格**：POL 国家 / POD 国家 / Branch / Core 依据 / 目的地规则命中

**路由指令卡片改进**：
- 当 `skipReason` 存在但无 `routing_reason` 时，显示说明提示："💡 此邮件被跳过规则过滤，未执行路由决策，因此无路由诊断信息（routing_reason 仅对实际路由的询价邮件生成）"
- `routing_reason` 展示区域可折叠，默认展开

---

##### 4. LogiTrack 建单区增强（`LogDetailPanel.tsx` 全面重写）

**DRY-RUN Payload 展示面板** (`DryRunPayloadPanel`)：
- 从 `routingJson.dry_run_payload` 提取结构化数据
- **关键字段网格（始终显示）**：Assigned CN Office / Sales Office / Sales PIC / 货型 / 商品 / POL/POD IDs / 发件人邮箱 / 询价接收日期 / 状态
- **其他字段（折叠展开）**：展示完整 payload 原始 JSON（深色代码块）
- **LogiTrack 建单状态徽章**逻辑增强：
  - `已建单` → 绿色 ✅
  - `DRY-RUN 提取信息` → 蓝色 🖨（有 dry_run_payload 时）
  - `已跳过（不触发建单）` → 灰色 ⏭（有 skipReason 但无 payload 时）
  - `— 未建单` → 灰色（其他情况）

---

##### 5. 调试重放面板增强（`ReplayPanel.tsx` 第二次全面重写，2026-05-13）

> **背景**：原 ReplayPanel 从 `tested_emails.json` 按 conversationId 查找邮件，但处理日志存在数据库，导致"Not Found"。本次重构对接 DB 处理日志，并彻底重写去重管理 UI。

**双标签重构**：

**标签 1 — 📋 从处理日志选择（`DbLogPicker` 组件）**：
- 关键字搜索框 + 搜索按钮（Enter 触发），调用 `GET /api/monitor/process-logs?keyword=…&page=0&size=10`
- 点击任意记录 → 直接调用 `POST /pyapi/replay/from-log`（携带 DB 中存储的 AI JSON），无需再从缓存查找
- 右侧展示 `ReplayResultPanel`（SkipChecker 结果 + 路由决策 + 可折叠 routing_reason 诊断）

**标签 2 — 🗑 去重缓存管理（`DedupManager` 组件）**：
- **关键字搜索**：`keyword` 输入框 + 搜索按钮，Enter 快捷键，✕ 清除；服务端按主题/发件人过滤
- 调用新增 `GET /pyapi/dedup/search?keyword=&limit=30` 端点（全量搜索，非仅 5 条最近记录）
- 统计行：显示"共 N 条缓存，搜索到 M 条"
- 每条记录：邮件类型标签 / 文件夹标签 / 主题 / 发件人 / 测试时间，鼠标悬停显示 🗑 移除按钮
- 点击 🗑 移除 → 调用 `DELETE /pyapi/dedup/{conversationId}` → 即时从列表中移除，显示剩余条数

**ProcessingLogs 表格增强（`ProcessingLogs.tsx`）**：
- 新增 ▶ 操作列（9 列网格），点击打开 `InlineReplay` 内嵌面板
- `InlineReplay` 组件：挂载即自动触发 `replayFromLog`，展示 SkipChecker + routing_reason，可关闭

**`POST /pyapi/replay/from-log` 新端点**：
- 请求体：`{ conversation_id, subject, sender, ai_analysis_json }` — 直接接收 DB 存储的 AI JSON
- 解析 JSON → 运行 SkipChecker → 运行 Router → 返回完整判断结果，不需要查 `tested_emails.json`

---

##### 6. 去重缓存全量搜索端点（`monitor_api.py`，2026-05-13）

新增 `GET /pyapi/dedup/search`：
- 参数：`keyword`（主题/发件人关键字，默认空字符串）、`limit`（最多返回条数，默认 20）
- 响应：`{ total, shown, keyword, records: [{conversation_id, subject, sender, folder, tested_at, email_type, is_inquiry}] }`
- 替代原 `GET /pyapi/rules` 仅返回 5 条的限制，支持真正的全量搜索过滤

---

##### 7. 配置查看器重构（`ConfigViewer.tsx` 全面重写，由只读变为可编辑）

由 2 区域只读展示 → **3 子标签可编辑**：

**★ 路由配置**（默认标签，可编辑）：
- `getRouting()` 加载 `pic_routing.json`，提取 `core_countries`、`managers_email`、`branch_to`、`branch_cc`
- **Core 国家列表**：可添加新国家 / 点击 ✕ 删除；展示当前全部 Core 目的国
- **Managers 邮件列表**：可添加/删除 manager 通知邮箱
- **Branch TO/CC 邮件配置**：按 Branch（HKG/SZX/SHA/PEK）× 模式（CORE/NON-CORE）展示和编辑收件人
- **保存按钮**：调用 `PUT /pyapi/routing` 保存变更（后端有字段白名单保护）

**♦ API 连接**（`ServiceCard` 组件）：
- 展示 5 个服务配置（Graph/LLM/VLM/VLM备用/LogiTrack），API key 只展示后4位
- 每个服务有"测试连接"按钮，调用 `/pyapi/test-connection/{service}` 显示延迟和结果

**📋 跳过规则**（只读）：
- 展示 `skip_rules`：keywords 列表 + `enabled` 标志 + `all_folders` 标志
- 展示 `non_inquiry_types` 跳过邮件类型列表

---

##### 8. Python 监控 API 新增端点（`monitor_api.py`）

| 端点 | 方法 | 功能 |
|------|------|------|
| `/pyapi/dedup/{conversation_id}` | DELETE | 从 `tested_emails.json` 移除指定 conversation_id |
| `/pyapi/dedup/search` | GET | 按关键字全量搜索去重缓存（支持主题/发件人过滤，替代 rules 5条限制）|
| `/pyapi/replay/from-log` | POST | 接受 AI JSON 直接重算 SkipChecker + Router（不依赖缓存文件）|
| `/pyapi/routing` | GET | 返回 `pic_routing.json` 结构化摘要（core_countries / managers_email / branch_to / branch_cc）|
| `/pyapi/routing` | PUT | 接受 JSON 写入 `pic_routing.json`（字段白名单保护，仅允许更新 core_countries/managers_email/branch_to/branch_cc）|
| `/pyapi/control/poll-interval` | POST | 即时修改运行中进程的轮询间隔 |
| `/pyapi/control/logitrack-dry-run` | POST | 即时切换 LOGITRACK_DRY_RUN 标志 |

---

##### 9. main.py 增强 — DRY-RUN payload 写入监控字段

```python
# main.py 约第660行
if settings.logitrack_dry_run and build_result.get("payload"):
    _mon["routing_json"]["dry_run_payload"] = build_result["payload"]
```

前端 `LogDetailPanel` 读取 `routingJson.dry_run_payload` 展示结构化建单信息。

---

#### 📦 影响文件 (17个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `logitrack-pro/components/settings/monitoring/tabs/ServiceControl.tsx` | **新建** | 服务管理 UI（状态卡片 + 启动配置 + 运行时控制） |
| `logitrack-pro/components/settings/monitoring/MonitoringDashboard.tsx` | 修改 | 新增 🚀 服务管理标签（第1个），默认 Tab 改为 service |
| `logitrack-pro/components/settings/monitoring/detail/AiAnalysisCard.tsx` | 重写 | 完整 aiAnalysisJson 解析，核心+扩展字段，"展开更多字段"折叠 |
| `logitrack-pro/components/settings/monitoring/detail/RoutingCard.tsx` | 重写 | routing_reason 路由决策面板，跳过邮件说明提示 |
| `logitrack-pro/components/settings/monitoring/detail/LogDetailPanel.tsx` | 重写 | DRY-RUN payload 展示，4种建单状态徽章，跳过邮件标签 |
| `logitrack-pro/components/settings/monitoring/debug/ReplayPanel.tsx` | **第二次重写** | 双标签（DB日志选择器 + 去重搜索管理），`/pyapi/replay/from-log` 直接重算 |
| `logitrack-pro/components/settings/monitoring/tabs/ProcessingLogs.tsx` | 修改 | 新增 ▶ 操作列 + `InlineReplay` 内嵌面板 |
| `logitrack-pro/components/settings/monitoring/tabs/ConfigViewer.tsx` | 重写 | 3子标签（路由配置可编辑 / API连接测试 / 跳过规则） |
| `logitrack-pro/services/monitorApi.ts` | 修改 | 新增 `replayFromLog` / `searchDedup` + processApi + removeDedup/getRouting/saveRouting 等共9个方法 |
| `backend/src/.../service/ProcessManagerService.java` | **新建** | Python 进程生命周期管理（start/stop/status） |
| `backend/src/.../controller/ProcessManagerController.java` | **新建** | REST 接口 /api/monitor/process/{status,start,stop} |
| `backend/src/main/resources/application.properties` | 修改 | 新增 emailai.python.path / emailai.script.path / emailai.working.dir |
| `email-ai-automation/services/monitor_api.py` | 修改 | 新增 7 个端点（DELETE dedup + GET dedup/search + POST replay/from-log + GET/PUT routing + POST control/*） |
| `email-ai-automation/main.py` | 修改 | dry_run_payload 写入 routing_json.dry_run_payload |
| `MILESTONE_CHANGELOG.md` | 文档 | M38 记录 + Phase 5 补充更新 |

#### 📊 统计信息
- **新建前端组件**: 1 个（ServiceControl.tsx）
- **完整重写组件**: 6 个（AiAnalysisCard / RoutingCard / LogDetailPanel / ReplayPanel×2 / ConfigViewer）
- **新建后端类**: 2 个（ProcessManagerService / ProcessManagerController）
- **新增 API 端点**: 7 个（Python）+ 3 个（Spring Boot）
- **新增 monitorApi 方法**: 9 个（processApi × 3 + monitorPyApi × 6）
- **前端编译**: ✅ No errors（TypeScript 严格模式）
- **Spring Boot 编译**: ✅ BUILD SUCCESS

#### ✅ 验收状态
- [x] 🚀 服务管理 Tab：成功显示并轮询 Spring Boot `/api/monitor/process/status`（HTTP 200）
- [x] AiAnalysisCard：品名/LCL-FCL/货务条款/重量体积在 UAT 页面正确显示
- [x] AiAnalysisCard："展开更多字段"折叠面板可交互
- [x] ConfigViewer 3子标签：路由配置/API连接/跳过规则均可切换
- [x] RoutingCard：skipped 邮件显示 💡 说明提示，routed 邮件显示 routing_reason 诊断面板
- [x] LogDetailPanel：跳过邮件显示"⏭ 已跳过"徽章，DRY-RUN 邮件显示 payload 面板
- [x] ReplayPanel DbLogPicker：从 DB 处理日志选择邮件，直接调用 `/pyapi/replay/from-log` 重算
- [x] ProcessingLogs ▶ 内嵌重放：点击按钮展开 InlineReplay，自动触发重算并展示结果
- [x] DedupManager 关键字搜索：`/pyapi/dedup/search?keyword=` 返回 35 条记录，服务端过滤正常（HTTP 200 验证）
- [x] DedupManager 去重移除：`DELETE /pyapi/dedup/{id}` 端点正常（24路由已验证）
- [ ] ConfigViewer 路由配置编辑：待验证保存功能

---


| `logitrack-pro/services/monitorApi.ts` | 修改 | 新增 processApi + removeDedup/getRouting/saveRouting/setPollInterval/setLogitrackDryRun |
| `backend/src/.../service/ProcessManagerService.java` | **新建** | Python 进程生命周期管理（start/stop/status） |
| `backend/src/.../controller/ProcessManagerController.java` | **新建** | REST 接口 /api/monitor/process/{status,start,stop} |
| `backend/src/main/resources/application.properties` | 修改 | 新增 emailai.python.path / emailai.script.path / emailai.working.dir |
| `email-ai-automation/services/monitor_api.py` | 修改 | 新增 5 个端点（DELETE dedup + GET/PUT routing + POST control/*） |
| `email-ai-automation/main.py` | 修改 | dry_run_payload 写入 routing_json.dry_run_payload |
| `MILESTONE_CHANGELOG.md` | 文档 | 新增 M38 记录 |

#### 📊 统计信息
- **新建前端组件**: 1 个（ServiceControl.tsx）
- **完整重写组件**: 5 个（AiAnalysisCard / RoutingCard / LogDetailPanel / ReplayPanel / ConfigViewer）
- **新建后端类**: 2 个（ProcessManagerService / ProcessManagerController）
- **新增 API 端点**: 5 个（Python）+ 3 个（Spring Boot）
- **新增 monitorApi 方法**: 7 个（processApi × 3 + monitorPyApi × 4）
- **前端编译**: ✅ No errors（TypeScript 严格模式）
- **Spring Boot 编译**: ✅ BUILD SUCCESS

#### ✅ 验收状态
- [x] 🚀 服务管理 Tab：成功显示并轮询 Spring Boot `/api/monitor/process/status`（HTTP 200）
- [x] AiAnalysisCard：品名/LCL-FCL/货务条款/重量体积在 UAT 页面正确显示
- [x] AiAnalysisCard："展开更多字段"折叠面板可交互
- [x] ConfigViewer 3子标签：路由配置/API连接/跳过规则均可切换
- [x] RoutingCard：skipped 邮件显示 💡 说明提示，routed 邮件显示 routing_reason 诊断面板
- [x] LogDetailPanel：跳过邮件显示"⏭ 已跳过"徽章，DRY-RUN 邮件显示 payload 面板
- [x] ReplayPanel 去重移除：待 Python 监控服务在线后验证 DELETE /pyapi/dedup 端点
- [ ] ConfigViewer 路由配置编辑：待 Python 监控服务在线后验证保存功能

---

### M39: TEST_FORWARD UAT Bug 修复 + 邮件转发格式升级 (2026-05-13)

**日期**: 2026-05-13  
**系统**: `email-ai-automation (Python)` + `Spring Boot 后端`  
**关联文档**: `email-ai-automation/docs/PROJECT_STATUS_REPORT.md`、`email-ai-automation_milestone.md`

#### 🎯 目标需求
系统进入 TEST_FORWARD 真实邮件转发测试阶段，UAT 期间发现 5 个问题并全部修复，同时升级邮件转发格式（双模板 + HTML body）和多分支路由合并逻辑。

---

#### 🐛 Bug 修复（B23–B27）

| 编号 | 问题 | 根因 | 状态 |
|---|---|---|---|
| B23 | LIVE 模式启动参数错误 | `ProcessManagerService.java` 传 `--live`，但 argparse 只识别 `--forward` | ✅已修复 |
| B24 | LIVE 模式子进程 EOFError | `_confirm_live_mode()` 调用 `input()` 在无 TTY 子进程中抛出 EOFError | ✅已修复 |
| B25 | UI 删除去重记录后内存不刷新 | `tracker = TestTracker()` 只在启动时加载，UI DELETE 只更新磁盘文件 | ✅已修复 |
| B26 | 多起运地只通知一个分支 PIC | `rizhao` 不在城市映射表；多条指令生成多封邮件（PIC 未合并） | ✅已修复 |
| B27 | 转发邮件无换行 + 暴露 AI 元数据 | Graph API `comment` 字段纯文本渲染；`_build_forward_comment()` 包含大量 AI 内部字段 | ✅已修复 |

#### ✨ 主要功能

##### 1. LIVE 模式参数与交互修复

**`backend/src/.../service/ProcessManagerService.java`**：
- LIVE 模式命令行参数 `--live` → `--forward`
- 注入环境变量 `LIVE_CONFIRMED=true`、`LIVE_OPERATOR=WebUI-{timestamp}` → 子进程绕过 `input()` 交互
- `stopProcess()` 改用 Java 17 `ProcessHandle` API（替代 PowerShell/taskkill，更可靠）

**`main.py`**：
- `_confirm_live_mode()` 检测 `os.environ.get("LIVE_CONFIRMED") == "true"` → 跳过 `input()` 调用

##### 2. 去重缓存热更新

**`services/test_tracker.py`**：
- 新增 `reload()` 方法：从磁盘重新加载 `data/tested_emails.json`，用于 UI 删除后即时生效

**`main.py`**：
- `process_new_emails()` 每轮开始处调用 `tracker.reload()`，确保 UI 侧的删除操作在下一轮就生效

##### 3. 邮件转发双模板

**`main.py`** 新增函数：

- **`_build_greeting_and_comment(analysis, instr, sender_name, ref_number)`**：
  - 模板 1（无 REF）：`Dear {name},\n\nThanks for your inquiry, will provide the best rate to you soonly.`
  - 模板 2（有 REF）：`Dear {name},\n\nThanks for the opportunity. Adding the reference {REF} in subject and our origin office will offer EXW charges to you shortly.`
  - 末尾追加 `_build_forward_comment()` 输出（目前仅 `[This is an automated reply from China Pricing AI]`）

- **`_build_ref_subject(original_subject, ref_number)`**：
  - 去掉原始多层 `Re:/FW:/Fwd:` 前缀（正则 `r'^(?:(?:RE|Re|FW|Fw|Fwd)\s*:\s*)+'`）
  - 格式：`FW: <CN2604217-S> 40HQ Shenzhen to Riyadh`

- **`_build_forward_comment()`**：精简为仅返回标识行 `[This is an automated reply from China Pricing AI]`，移除全部 Commodity/Note/Routing 等元数据

##### 4. HTML 邮件正文

**`services/graph_client.py`**：
- 新增 `_comment_to_html(comment: str) -> str`：将 `\n` 转 `<br>`，包裹带样式的 `<div>` 标签
- 新增 `_build_draft_html_body(comment, original_body) -> dict`：greeting HTML 在前，原邮件引用体在后
- `forward_email(message_id, to, cc, comment, subject=None)`：改为 `createForward` 草稿 → PATCH（toRecipients/ccRecipients/subject?/body HTML）→ send
- `reply_all_email(message_id, comment, extra_to, extra_cc, subject=None)`：改为 `createReplyAll` 草稿 → PATCH HTML body → send，不再通过 `comment` 参数传明文

##### 5. 多分支路由邮件合并

**`services/router.py`**：
- `_city_to_branch()` 补充：`rizhao→TAO`、`weihai→TAO`、`linyi→TAO`、`xingang→TSN`
- 新增静态方法 `_merge_instructions_by_mode(instructions)`：
  - 将同一运输方式（transport_mode）的多条指令合并为一条
  - TO 列表合并去重；CC 列表合并去重（排除已在 TO 中的地址）
  - branch 字段拼接（如 `TSN+TAO`）
  - 结果：多起运地（如天津+日照+青岛 SEA）只发送一封邮件，两个分支 PIC 都在 TO 中

---

#### 邮件最终格式（2026-05-13 确认）

```
[TEST-FORWARD] 或 (LIVE)
主题: FW: <CN2604217-S> 40HQ Shenzhen to Riyadh   ← 有 REF 时

正文:
Dear Nadine Grunnert,

Thanks for your inquiry, will provide the best rate to you soonly.

[This is an automated reply from China Pricing AI]

── 原邮件 ──
(原始邮件内容)
```

---

#### 📦 影响文件 (6个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `email-ai-automation/main.py` | 修改 | `sender_name` 提取 / `_build_greeting_and_comment()` / `_build_ref_subject()` / `_build_forward_comment()` 精简 / `tracker.reload()` |
| `email-ai-automation/services/test_tracker.py` | 修改 | 新增 `reload()` 方法 |
| `email-ai-automation/services/router.py` | 修改 | 补充城市→分支映射 / `_merge_instructions_by_mode()` |
| `email-ai-automation/services/graph_client.py` | 修改 | `_comment_to_html()` / `_build_draft_html_body()` / `forward_email()` HTML 重构 / `reply_all_email()` HTML 重构 |
| `backend/src/.../service/ProcessManagerService.java` | 修改 | LIVE 参数修正 / `LIVE_CONFIRMED` 环境变量 / `ProcessHandle` stop |
| `email-ai-automation_milestone.md` | 文档 | M11 会话补充（B23-B27 + 功能说明）|

#### 📊 统计信息
- **修复 Bug**: 5 个（B23–B27）
- **新增函数**: 4 个（`reload` / `_build_greeting_and_comment` / `_build_ref_subject` / `_merge_instructions_by_mode`）
- **重构函数**: 3 个（`_build_forward_comment` / `forward_email` / `reply_all_email`）
- **Python 语法检查**: ✅ OK（main.py / test_tracker.py）

#### ✅ 验收状态
- [x] `tracker.reload()` 测试：删除记录后 reload → `is_tested=False` PASS
- [x] `_comment_to_html()` 测试：输出包含 `<br>` 标签 PASS
- [x] ELOG 邮件去重删除：UI 删除 → remaining=59 PASS
- [x] Python 服务重启：新 PID 27880，TEST_FORWARD 模式确认
- [x] `_build_forward_comment()` 精简：仅返回自动回复标识，无元数据

---

### M40: 附件转发 + 浙江城市映射修正 + 多票货拆单 B3 (2026-05-15)

**日期**: 2026-05-15  
**系统**: `email-ai-automation (Python)`  
**关联文档**: `email-ai-automation/docs/PROJECT_STATUS_REPORT.md`、`email-ai-automation/milestone.md`

#### 🎯 目标需求

分析真实案例 "EXW CHINE TO CALLAO PORT FCL"（DB ID=12248）：
1. 邮件有两个起运地（青岛 + 浙江丽水），丽水不在城市映射表 → NGB PIC 漏发
2. 原始 PDF 附件未随转发邮件传递
3. 同一对话链后续新询价（新 message_id）被 conversationId 去重跳过
4. 多票货（两个起运地对应两票货物）应创建两个询价单，当前只建一个

---

#### 🐛 Bug 修复（B28–B32）

| 编号 | 问题 | 根因 | 状态 |
|---|---|---|---|
| B28 | 杭州（Hangzhou）路由到 NGB 而非 SHA | `_city_to_branch("hangzhou")` 返回 "NGB"（地理错误） | ✅已修复 |
| B29 | 转发/Reply All 邮件不携带原始附件 | `forward_email/reply_all_email` 无附件上传逻辑 | ✅已修复 |
| B30 | CALLAO 案例丽水 NGB PIC 漏发 | `_city_to_branch("lishui")=None` → fallback TAO → 合并后无 NGB | ✅已修复 |
| B31 | 对话链中新回复邮件被去重跳过 | `is_tested(conversationId)` 同链所有邮件共享一个 ID | ✅已修复 |
| B32 | 多票货（青岛+丽水）只建 1 个询价单 | 无多票拆分架构，单票处理流程 | ✅已修复 |

---

#### ✨ 主要功能

##### 1. 附件随转发邮件（B29）

**`services/graph_client.py`**：
- 新增 `_add_file_attachments_to_draft(draft_id, attachments)` 方法
  - 遍历本地文件路径列表，读取文件内容 base64 编码后调用 Graph `/attachments` 接口上传到草稿
  - 单文件 ≤ 3MB 直接上传；超限记录 warning 跳过
- `forward_email()` 新增 `attachments: list[str] = None` 参数
- `reply_all_email()` 新增 `attachments: list[str] = None` 参数

**`main.py`**：
- Step 1 下载附件后将本地路径列表存入 `attachments`
- Step 10 调用转发时传入 `attachments=attachments`

##### 2. 浙江城市映射修正（B28 + B30）

**`services/router.py`** `_city_to_branch()` 关键变化：

| 城市 | 修改前 | 修改后 | 说明 |
|------|--------|--------|------|
| hangzhou | NGB | SHA | 杭州属浙北，应走上海（沪杭甬一体） |
| jiaxing | — | SHA | 浙北嘉兴，靠近上海 |
| huzhou | — | SHA | 浙北湖州，靠近上海 |
| lishui | — | NGB | 浙南丽水，应走宁波 |
| taizhou | — | NGB | 浙南台州，应走宁波 |
| jinhua | — | NGB | 浙中金华，应走宁波 |
| quzhou | — | NGB | 浙西衢州，应走宁波 |
| zhoushan | — | NGB | 舟山港，属宁波港范围 |

同步更新：`main.py` Step 5.7 附件城市推断映射、`services/ai_analyzer.py` SYSTEM_PROMPT Branch 映射表。

**`main.py` Step 5.7**（上一会话已实现，本会话扩展）：
- 当 `branch_code=UNKNOWN` 时，扫描 `attachment_texts` 中的城市名
- 用上述城市映射表推断并覆盖 `branch_code`

**`services/ai_analyzer.py`**：
- SYSTEM_PROMPT Branch 映射表更新：
  - SHA: 上海/苏州/南京/无锡（沪苏）+ **杭州/嘉兴/湖州**（浙北）
  - NGB: 宁波/义乌/温州/舟山 + **丽水/台州/金华/衢州**（浙南/中）
  - 说明：杭州→SHA，宁波→NGB；附件中发货地地址也需提取

##### 3. 去重 key 改为 message_id（B31）

**`main.py` Step 0b**：
```python
# BEFORE:
if conv_id_check and tracker.is_tested(conv_id_check):
    logger.info("  ⏭️  此邮件已处理过，跳过")

# AFTER:
if message_id and tracker.is_tested(message_id):
    logger.info("  ⏭️  此邮件已处理过，跳过 (message_id)")
```

两处 `tracker.record_test()` 调用均改为 `conversation_id=message_id`（参数名不变，含义变为 message 唯一 ID）。

**效果**：同一对话链（conversationId 相同）中的每封新邮件（不同 message_id）将独立处理，不再因为对话链历史记录被跳过。

##### 4. 多票货 B3 拆单架构（B32）

**`services/ai_analyzer.py` schema 新增**：
```json
{
  "shipments": null
  // 多票时填写数组：
  // [{"origin_city": "Qingdao", "branch_code": "TAO", "commodity": "...",
  //   "containers": {...}, "gross_weight_kg": ..., "volume_cbm": ...,
  //   "incoterm": "...", "note": "..."}, ...]
  // 无法区分多票时保持 null
}
```

SYSTEM_PROMPT 新增"shipments 多票货拆分规则"章节，含完整 JSON 示例。

**`main.py` Step 8.5（新增）**：
```python
shipments = analysis.get("shipments")
shipment_tasks = []
if shipments and isinstance(shipments, list) and len(shipments) >= 2:
    for si, ship in enumerate(shipments):
        sub = copy.deepcopy(analysis)
        sub["origin_city"] = ship.get("origin_city")
        sub["branch_code"] = ship.get("branch_code")
        sub["multiple_origins"] = False
        sub["shipments"] = None
        sub_instructions = router.get_forward_instruction(sub, ...)
        shipment_tasks.append((sub, sub_instructions, sub_plan))
else:
    shipment_tasks.append((analysis, instructions, forward_plan))
```

**`main.py` Step 9-10（重构为循环）**：
- 遍历 `shipment_tasks`，每票独立：LogiTrack 建单（各自 REF）→ 独立发邮件
- 多票日志：`📦 票 [1/2]`、`📦 票 [2/2]`
- `_mon` 监控字典仅第一票（`_task_idx==0`）写入，防止重复

---

#### 设计讨论结论（附于本里程碑）

**Q1: 是否补全全国城市映射？**
- 结论：**不全补，按物流高频城市逐步扩展**
- 理由：AI 输出主要城市，300+ 城市维护成本远超收益
- 规划：后续按实际出现频率补充江苏内陆（changzhou/nantong）、广东东翼（huizhou）等

**Q2: 多票 B3 是否改为 B1（AI 全量多票输出）？**
- 结论：**保持 B3，不迁移到 B1**
- 理由：B3 完全向后兼容 + AI 低错误风险 + 95%+ 场景适用；B1 需全量重构 + AI 生成每票 26+ 字段错误率倍增 + fallback 能力丧失

---

#### 📦 影响文件 (5个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `email-ai-automation/services/router.py` | 修改 | `_city_to_branch()` 杭州/嘉兴/湖州→SHA；丽水/台州/金华/衢州/舟山→NGB |
| `email-ai-automation/services/graph_client.py` | 修改 | `_add_file_attachments_to_draft()`；`forward_email/reply_all_email` 新增 `attachments` 参数 |
| `email-ai-automation/services/ai_analyzer.py` | 修改 | Branch 映射表更新；`shipments` schema 字段 + 拆分规则 |
| `email-ai-automation/main.py` | 修改 | Step 5.7 附件城市推断；Step 0b 去重改 message_id；Step 8.5 多票拆单；Step 9-10 循环重构；record_test 改 message_id |
| `email-ai-automation/docs/PROJECT_STATUS_REPORT.md` | 文档 | M12 更新（v1.4）|

#### 📊 统计信息
- **修复 Bug**: 5 个（B28–B32）
- **新增方法**: 1 个（`_add_file_attachments_to_draft`）
- **新增代码块**: 2 个（Step 8.5 多票拆单、shipments schema）
- **重构范围**: main.py Step 9-10（单流程→循环）
- **Python 语法检查**: ✅ OK（main.py / router.py / ai_analyzer.py）

#### ✅ 验收状态
- [x] `_test_callao_routing.py`：Branch=TAO+NGB，TO 包含 tao.hhao + ngb.vli PASS
- [x] `_test_multi_shipment.py`：2票独立路由——票1(TAO)→tao PIC，票2(NGB)→ngb.vli PASS
- [x] `router.py` `_city_to_branch("hangzhou")="SHA"` PASS
- [x] `router.py` `_city_to_branch("lishui")="NGB"` PASS
- [x] main.py 语法检查 OK，ai_analyzer.py 语法检查 OK

---

### M41: 已建号 FOLLOW_UP 边界修正 + Few-shot 训练状态同步 (2026-05-19)

**日期**: 2026-05-19  
**系统**: `email-ai-automation (Python)`  
**关联文档**: `email-ai-automation/docs/PROJECT_STATUS_REPORT.md`、`email-ai-automation_milestone.md`、`docs/PLAN_AUTO_FILL_ENQUIRY.md`

#### 🎯 目标需求

复盘 Sea-Completed 两个真实案例，修正 `INQUIRY` / `FOLLOW_UP` 边界，避免已建号邮件被再次当成新询价自动建号：
1. `Re: <CN2605138-S> Mubea FCL 40ft Quote request` 被误判为新询价，存在重复建号风险
2. `20'GP Shenzhen to Riyadh` 这类“同代理但不同箱型”的新需求不能被错误并入旧单
3. 将真实案例沉淀为 Few-shot，作为后续训练面板的基准样本
4. 同步文档中的训练功能状态，避免继续把已落地能力写成“待实现”

---

#### 🐛 Bug 修复（B33）

| 编号 | 问题 | 根因 | 状态 |
|---|---|---|---|
| B33 | 已建号主题邮件被误判为 `INQUIRY`，触发重复建号/重复转发风险 | Prompt 过度强调“不要仅凭 Re: 判 FOLLOW_UP”，但没有把 `<CN...>` 主题建号信号设为更高优先级 | ✅已修复 |

---

#### ✨ 主要功能

##### 1. 已建号主题优先判 `FOLLOW_UP`

`services/ai_analyzer.py`：
- 在 `FOLLOW_UP` 定义中新增高优先级规则：Subject 含内部建号 `<CN...-S>` / `<CN...-A>` / `<CN...-AS>` 时，即使正文出现 `please quote` / `pls quote` / `kindly quote`，也视为已建号询价上的补充或修改请求
- 在“多轮对话处理指引”中新增 `重要B（已建号判 FOLLOW_UP）`

**业务效果**：
- 已建号询价上的 FCA/EXW/incoterm 追价、箱型调整、细节补充，不再进入新询价建号路径

##### 2. 用正反两个真实案例固化边界

`data/base_fewshot.json`：
- 新增 **案例23**：`<CN2605138-S>` 已建号追价请求 → `FOLLOW_UP`
- 新增 **案例24**：同代理对同路线追加 `20GP` 新箱型需求 → 仍为独立 `INQUIRY`
- 保留 **案例25**：内部同事把 chinapricing 拉入已有外部询价循环时，需从引用邮件抽取真实询价信息

**边界结论**：
- Subject **含内部 CN 编号**：优先按已建号处理，默认 `FOLLOW_UP`
- Subject **不含内部 CN 编号**：即使正文提及旧单号，只要当前邮件是独立新报价需求，仍可判 `INQUIRY`

##### 3. Few-shot 外部化状态同步

本次复盘同时确认训练架构已不再停留在计划阶段：
- `services/ai_analyzer.py` 已改为 `SYSTEM_PROMPT_TEMPLATE + {{FEWSHOT_CASES}}`
- `data/base_fewshot.json` 已承载基础案例
- `data/training_fewshot.json` 已作为后续纠错案例入口
- `services/monitor_api.py` 已提供 `training/cases`、`fewshot-stats`、`preview-prompt` 等训练接口

---

#### 📦 影响文件 (4个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `email-ai-automation/services/ai_analyzer.py` | 修改 | 已建号主题高优先级 `FOLLOW_UP` 规则 + 多轮对话规则补充 |
| `email-ai-automation/data/base_fewshot.json` | 修改 | 新增案例23/24，固化 FOLLOW_UP / 新询价边界 |
| `email-ai-automation/docs/PROJECT_STATUS_REPORT.md` | 文档 | 状态报告同步到 M13 / B33 / Few-shot 外部化现状 |
| `email-ai-automation/docs/PLAN_WEB_MONITOR_DASHBOARD.md` | 文档 | AI 训练计划补充“已实现状态”说明 |

#### 📊 统计信息
- **修复 Bug**: 1 个（B33）
- **新增真实 Few-shot 边界案例**: 2 个（案例23、案例24）
- **当前基础案例总数**: 25 个（base）
- **验证结果**: Case 1 已回归为 `FOLLOW_UP / is_inquiry=false`

#### ✅ 验收状态
- [x] Sea-Completed Case 1 根因定位完成：误判来自 prompt 边界缺口
- [x] `services/ai_analyzer.py` 已加入已建号主题优先规则
- [x] `data/base_fewshot.json` 已加入案例23/24
- [x] Case 1 定向验证通过：`email_type=FOLLOW_UP`、`is_inquiry=false`
- [x] 文档状态已同步，训练功能不再只按“待设计”描述

---

### M42: AI 训练前端接入 + 远程访问验证脚本 (2026-05-19)

**日期**: 2026-05-19  
**系统**: `logitrack-pro (React)` / `scripts`  
**关联文档**: `email-ai-automation/docs/PLAN_WEB_MONITOR_DASHBOARD.md`、`email-ai-automation/docs/PROJECT_STATUS_REPORT.md`、`docs/PLAN_AUTO_FILL_ENQUIRY.md`

#### 🎯 目标需求

把 Email AI Automation 已有的训练 API 真正接到 LogiTrack 监控前端，形成可操作的 AI 训练面板；同时沉淀本次远程访问排障结论，避免继续把 Vite 开发服务当成外网验收入口。

核心目标：
1. 在监控面板中新增 `🎯 AI 训练` 顶级入口
2. 打通训练案例库、路由模拟器、回归测试与日志详情纠错入口
3. 为远程联调补一份可执行验证脚本，明确 API/DB 连通性检查方式
4. 记录“外网 3000 访问应使用 preview/Nginx，而非依赖 Vite dev 外绑 IP”的部署结论

---

#### ✨ 主要功能

##### 1. AI 训练顶级 Tab 接入监控面板

`logitrack-pro/components/settings/monitoring/MonitoringDashboard.tsx`：
- 新增 `training` 顶级 Tab
- 将 `AITraining.tsx` 与服务管理、实时状态、处理日志、调试控制、配置查看并列挂载

`logitrack-pro/components/settings/monitoring/tabs/AITraining.tsx`：
- 集成 `FewShotStatusBar`、`TrainingCaseList`、`WhatIfSimulator`、`RegressionRunner`
- 保存训练案例后自动刷新 few-shot 统计，并触发回归刷新 tick
- 用 `CaseEditModal` 替代临时 prompt 式新增案例

##### 2. 日志详情纠错入口打通

`logitrack-pro/components/settings/monitoring/detail/LogDetailPanel.tsx`：
- 新增 `🔧 纠错` 按钮
- 直接挂载 `CorrectionWizard`
- 让处理日志中的单条邮件可以原地进入三步纠错流程，而不是脱离上下文手工录入

##### 3. 训练前端子能力可用化

已接入的组件包括：
- `FewShotStatusBar.tsx`：few-shot 统计、Prompt 预览、自动回归触发
- `TrainingCaseList.tsx`：案例列表、状态切换、详情查看
- `WhatIfSimulator.tsx`：独立路由模拟器，复用训练字段编辑器
- `RegressionRunner.tsx`：基于 `tested_emails.json` 的轻量级路由回归测试
- `CorrectionWizard.tsx`：从日志详情发起 AI 分析/路由规则纠错

##### 4. 服务层与远程联调工具补齐

`logitrack-pro/services/monitorApi.ts`：
- 补齐 training 相关 DTO 与 API 封装
- 前端统一通过 `monitorPyApi` 访问 `/pyapi/training/*`

`scripts/verify-remote-access.ps1`：
- 新增远程验证脚本
- 可按顺序检查：TCP 8080、`/api/enquiries` HTTP 状态、TCP 3306、MySQL 登录与示例查询
- 把“网络、端口、防火墙、MySQL host grant”排查步骤脚本化

---

#### 📦 影响文件 (7个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `logitrack-pro/components/settings/monitoring/MonitoringDashboard.tsx` | 修改 | 新增 `🎯 AI 训练` 顶级 Tab |
| `logitrack-pro/components/settings/monitoring/tabs/AITraining.tsx` | 新增/修改 | 集成案例库、模拟器、回归与新增案例弹窗 |
| `logitrack-pro/components/settings/monitoring/detail/LogDetailPanel.tsx` | 修改 | 从处理日志详情直接发起 `CorrectionWizard` |
| `logitrack-pro/components/settings/monitoring/training/FewShotStatusBar.tsx` | 新增/修改 | few-shot 统计、Prompt 预览、自动回归联动 |
| `logitrack-pro/components/settings/monitoring/training/RegressionRunner.tsx` | 新增/修改 | 路由回归运行与结果展示 |
| `logitrack-pro/services/monitorApi.ts` | 修改 | training 相关类型与 API 服务层补齐 |
| `scripts/verify-remote-access.ps1` | 新增 | 远程 API/DB 连通性验证脚本 |

#### 📊 统计信息
- **新增前端训练入口**: 1 个顶级 Tab
- **已接通训练子能力**: 4 个（状态栏、案例库、模拟器、回归测试）
- **日志内嵌纠错入口**: 1 个
- **远程验证脚本**: 1 个
- **编译验证**: `npm run build` 通过

#### 🧭 部署与访问结论

本次联调明确了一个重要约束：

- **Vite 开发服务适合本地开发，不应作为外网验收入口**
- 如果需要从其他机器访问前端，应优先使用：
  - `npm run build`
  - `npm run preview -- --host 0.0.0.0 --port 3000`
  - 或由 Nginx/80 反向代理静态资源与 `/api`
- 远程环境若出现 `502`，应先区分是“前端 dev server 暴露方式错误”还是“后端 API 不可达”，不要把问题统称为 API 故障

#### ✅ 验收状态
- [x] `MonitoringDashboard` 已出现 `🎯 AI 训练` 顶级入口
- [x] `AITraining` 已挂载案例库、模拟器、回归三类子页面
- [x] `LogDetailPanel` 已可直接打开 `CorrectionWizard`
- [x] 前端 training API 调用已统一封装到 `monitorApi.ts`
- [x] `npm run build` 通过，说明首轮集成可编译
- [x] 远程连通性检查脚本已补齐
- [x] 远程访问 502 的根因和推荐部署方式已沉淀到文档结论

---

### M43: 监控补强 + 路由扩展性 + sender_name 解析增强 (2026-05-19)

**日期**: 2026-05-19  
**系统**: `email-ai-automation (Python)` / `logitrack-pro (React)` / `backend (Spring Boot)`  
**关联文档**: `email-ai-automation/docs/PROJECT_STATUS_REPORT.md`、`email-ai-automation/docs/PLAN_WEB_MONITOR_DASHBOARD.md`、`docs/PLAN_AUTO_FILL_ENQUIRY.md`

#### 🎯 目标需求

在不破坏当前自动建单与监控链路的前提下，解决三类真实业务问题：

1. 同一对话链中的**新 `message_id` / 新报价场景**不能再被旧的 `conversation_id` 数据库去重误拦截；
2. 监控面板要能直接看到 **LogiTrack Ref**，并允许在 Web 服务管理页配置 **LIVE 审核 BCC**；
3. 路由规则要从“纯城市白名单”升级为“高频城市 + 省份级回退”，同时修复 `Sales Ocean NL` 这类共享邮箱导致的错误称呼。

#### ✨ 主要功能

##### 1. 同对话链新询价边界修正（B34）

`email-ai-automation/main.py`：
- Step 9 移除跨轮次 `conversation_id` 数据库去重
- 仅保留 `message_id` 去重 + 本轮 `_conv_ref_cache`
- 允许“同线程但新的 `message_id` 且仍为 INQUIRY”的邮件新建 REF

##### 2. 监控面板 Ref / BCC 能力补强（B35/B36）

`logitrack-pro/components/settings/monitoring/detail/LogDetailPanel.tsx`：
- 已建单成功时继续显示 `id + ref`
- 复用旧 REF 时新增 `复用 Ref` 展示，便于人工判断“新建/复用”

`logitrack-pro/components/settings/monitoring/tabs/ServiceControl.tsx`：
- LIVE 模式新增审核 BCC 输入框

`logitrack-pro/services/monitorApi.ts` + `backend/src/main/java/com/logitrack/backend/service/ProcessManagerService.java`：
- `processApi.start()` 新增 `auditBcc`
- Spring Boot 启动 Python 进程时注入 `LIVE_AUDIT_BCC`

##### 3. 路由扩展性增强（B37）

`email-ai-automation/services/router.py`：
- `_city_to_branch()` 升级为“高频城市精确匹配 + 省份级回退”双层策略
- 新增陕西分界：西安及以北 → TSN；西安以南 → SHA

`email-ai-automation/services/ai_analyzer.py`：
- Prompt 分支表同步加入湖北/湖南/陕西/甘肃/宁夏等覆盖说明
- 修复 Wuhan / Weinan 等内陆起运地此前落入 fallback manager 的问题

##### 4. sender_name 多来源解析器（B38）

`email-ai-automation/services/sender_name_resolver.py`：
- 新增独立解析模块，取代 `main.py` 中的简单规则
- 解析优先级：缓存 → Graph `displayName` → 多语言签名提取 → 邮箱前缀
- 支持英文/荷兰语/德语/西语/法语/印尼语 closing，兼容 `Jean-Pierre`、`O'Connor`、重音字符、括号昵称等姓名格式

`email-ai-automation/main.py`：
- 已接入新 resolver
- 解决 `Sales Ocean NL`、`Customer Service` 这类共享邮箱被误用于 `Dear ...` 的问题

#### 📦 影响文件 (8个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `email-ai-automation/main.py` | 修改 | 移除跨轮次 conversation 去重，接入 sender_name resolver |
| `email-ai-automation/services/router.py` | 修改 | 省份级回退 + 陕西分界规则 |
| `email-ai-automation/services/ai_analyzer.py` | 修改 | Branch Prompt 覆盖范围同步升级 |
| `email-ai-automation/services/sender_name_resolver.py` | 新增 | 多来源发件人姓名解析器 |
| `logitrack-pro/components/settings/monitoring/detail/LogDetailPanel.tsx` | 修改 | 新建/复用两种 Ref 展示 |
| `logitrack-pro/components/settings/monitoring/tabs/ServiceControl.tsx` | 修改 | LIVE 审核 BCC 输入框 |
| `logitrack-pro/services/monitorApi.ts` | 修改 | `processApi.start()` 支持 `auditBcc` |
| `backend/src/main/java/com/logitrack/backend/service/ProcessManagerService.java` | 修改 | 注入 `LIVE_AUDIT_BCC` 环境变量 |

#### ✅ 验收状态

- [x] 同对话链新 `message_id` 不再被旧 `conversation_id` 误拦截
- [x] 监控详情面板可显示复用/新建 Ref
- [x] LIVE 审核 BCC 已能从 Web 服务管理页下发
- [x] Weinan / Wuhan 相关路由已通过定向测试，`fallback_used=false`
- [x] sender_name 新解析器 22 个用例全部通过

---

### M46: 转发稳定性 + no_specific_cargo 边界 + sender_name 兜底收敛 (2026-05-20 ~ 2026-05-21)

**日期**: 2026-05-20 ~ 2026-05-21  
**系统**: `email-ai-automation (Python)`  
**关联文档**: `email-ai-automation/docs/PROJECT_STATUS_REPORT.md`、`docs/PLAN_AUTO_FILL_ENQUIRY.md`

#### 🎯 目标需求

基于真实 UAT 邮件复盘，解决 4 类高频且互相关联的问题：

1. Reply All 会把共享邮箱自己带入收件人，引发系统拾取自己已发送邮件继续二次处理；
2. 签名区的 logo / 社媒图标被误当成真实附件转发给客户；
3. FCL 邮件只写柜型不写数量时，经常被误判为 `no_specific_cargo=true` 而不建单；
4. sender_name 最后兜底仍会退回邮箱前缀或邮箱地址本身，造成错误的 `Dear ...` 称呼。

#### ✨ 主要功能

##### 1. 转发重复循环修复（B39）

`email-ai-automation/main.py`：
- 在邮件处理入口新增 self-sent 判断
- 若发件人就是共享邮箱自身，则直接跳过处理并避免再次转发

`email-ai-automation/services/graph_client.py`：
- `reply_all_email()` 在 PATCH 草稿时，主动从 `toRecipients/ccRecipients` 中移除共享邮箱自身
- 使 Reply All 不再回发给自己，从源头切断重复转发循环

##### 2. inline 签名图片误转发修复（B40）

`email-ai-automation/main.py`：
- 转发前只保留 `is_inline=False` 的真实文件附件
- `TEST_FORWARD` 路径不再对 `createForward` 草稿重复添加原始附件

结果：
- 原始 PDF/Excel 等真实附件继续随邮件转发
- logo、Facebook/Instagram 图标、签名图片不再作为独立附件暴露给客户

##### 3. FCL 单/双柜型默认 1 柜（B41）

`email-ai-automation/main.py`：
- 在 Step 5.6b 新增柜型默认数量推断
- 当 SEA/FCL 邮件只提到 1-2 种柜型（如 `20'GP rate`、`40HQ to Lagos`）但未写数量时，默认各 `1` 柜

`email-ai-automation/services/ai_analyzer.py`：
- Prompt 规则补充“单柜型/双柜型提及默认 1 柜”的明确说明

`email-ai-automation/services/skip_checker.py`：
- 若 `containers` 中有任意非零值，则强制 `no_specific_cargo=false`

##### 4. sender_name 兜底收敛（B42）

`email-ai-automation/services/sender_name_resolver.py`：
- 删除邮箱 local-part 兜底
- 删除未验证 displayName / 邮箱地址本身作为称呼回退的路径
- 无可靠来源时统一返回 `Sender`

`email-ai-automation/main.py`：
- `_build_greeting_and_comment()` 对空值再做一层防御，统一渲染 `Dear Sender,`
- Step 2b 将精化后的 `sender_name` 回写到 `parsed["sender_name"]`

`email-ai-automation/_test_resolver.py`：
- 将旧的邮箱前缀兜底断言改为 `Sender`

#### 📦 影响文件 (6个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `email-ai-automation/main.py` | 修改 | self-sent 跳过、真实附件过滤、Step 5.6b 柜型默认 1 柜、sender_name 回写与 greeting 防御 |
| `email-ai-automation/services/graph_client.py` | 修改 | Reply All 草稿剔除共享邮箱自身 |
| `email-ai-automation/services/ai_analyzer.py` | 修改 | Prompt 明确单/双柜型默认 1 柜规则 |
| `email-ai-automation/services/skip_checker.py` | 修改 | `containers` 非零时不再视为 `no_specific_cargo` |
| `email-ai-automation/services/sender_name_resolver.py` | 修改 | sender_name 兜底从“邮箱前缀/显示名”收敛为固定 `Sender` |
| `email-ai-automation/_test_resolver.py` | 修改 | sender_name 新边界用例同步更新 |

#### ✅ 验收状态

- [x] Reply All 不再把共享邮箱自己带回收件人列表
- [x] 系统不会再拾取自己已发送的邮件形成重复转发循环
- [x] inline 签名图片不会再作为独立附件转发给客户
- [x] `20'GP rate` / `40HQ` 一类 FCL 邮件不再被误判为 `no_specific_cargo`
- [x] sender_name 无可靠来源时统一输出 `Dear Sender,`
- [x] `_test_resolver.py` 26/26 全部通过

---

### M47: LLM 成本控制与 LIVE 可靠性补强 (2026-05-21)

**日期**: 2026-05-21  
**系统**: `email-ai-automation (Python)`  
**关联文档**: `email-ai-automation/docs/PLAN_WEB_MONITOR_DASHBOARD.md`、`docs/PLAN_AUTO_FILL_ENQUIRY.md`

#### 🎯 目标需求

在不降低 LIVE 模式召回率的前提下，解决两类运行问题：

1. DeepSeek-V4-Flash 主渠道成本较低，但主供应商通道存在不可用风险，需要可靠备用链路；
2. Flash 适合大多数标准询价，但高风险 / 多起运地 / 不确定结果不能直接用于 LIVE 模式路由与建单。

#### ✨ 主要功能

##### 1. LLM 备用 API 接入 + thinking=medium 验证

`email-ai-automation/.env`：
- 新增 `LLM_BACKUP_API_KEY` / `LLM_BACKUP_BASE_URL` / `LLM_BACKUP_MODEL`
- 新增 `LLM_THINKING_ENABLED=true` 与 `LLM_THINKING_EFFORT=medium`

`email-ai-automation/config/settings.py`：
- 新增备用 LLM 与 thinking 配置读取

`email-ai-automation/services/ai_analyzer.py`：
- 主 LLM 请求增加 `extra_body.thinking={type: enabled}`
- 同时传入 `reasoning_effort=medium`
- 主 API 连续失败后自动切换 `https://api.deepseek.com`

运行结论：
- `api.qnaigc.com` 上的 `DeepSeek-V4-Flash` 在本轮验证中出现 `no available channels for model DeepSeek-V4-Flash`
- `api.deepseek.com` 上的 `deepseek-v4-flash` 已验证可返回 `reasoning_content`，说明 thinking 模式可用

##### 2. Flash / Pro 混合升级策略（方案 A）

`email-ai-automation/.env`：
- 新增 `LLM_ESCALATION_ENABLED` / `LLM_ESCALATION_API_KEY` / `LLM_ESCALATION_BASE_URL` / `LLM_ESCALATION_MODEL=deepseek-v4-pro`

`email-ai-automation/config/settings.py` + `email-ai-automation/services/ai_analyzer.py`：
- 新增升级模型客户端
- Flash 成功返回后执行 `_should_escalate()`
- 若满足任一条件，则自动升级到 Pro 重新分析：
  - `confidence < 0.80`
  - `risk_level == HIGH`
  - `branch_code == UNKNOWN`
  - `multiple_origins == true`
  - 输出被截断
- 即使 Flash 是经由备用 API 成功返回，也会继续执行升级判断

策略结论：
- 该方案不会降低 LIVE 成功率，因为复杂邮件最终采用的是 Pro 结果；
- 简单明确邮件仍保留 Flash 低成本路径；
- 按会话内估算，混合方案相对纯 Pro 约节省 54% 成本。

##### 3. 当前 token 消耗结论沉淀

本轮对 `email-ai-automation` 当前提示词结构做了定量复盘：
- base few-shot: 25 个案例，约 `35173 chars`
- system prompt + few-shot + 邮件正文上限合计约 `17724 tokens`（未含输出与思考 token）

结论：
- 最大 token 消耗来自 few-shot 与系统规则，不属于可安全删除的“非必要步骤”；
- 对话链、附件文本、VLM 图片文本虽会增加消耗，但仍是 FOLLOW_UP 边界、branch 修正与 cargo 回填所需上下文；
- 当前没有可在不伤召回率前提下大幅裁剪的高消耗环节。

##### 4. LIVE 回复模板规范化 + 服务重启边界确认

`email-ai-automation/main.py`：
- 将有 REF / 无 REF 两种自动回复模板统一为句号结尾
- 移除模板中的尾随空格与多余空行，作为当前 LIVE 基线文案

运行边界结论：
- 通过 Web 面板停止再启动 Python 服务，会重新拉起新进程并加载修改后的 `email-ai-automation` 代码；
- 因此 Python 项目代码变更的生效边界是“服务重启”，无需重启 Spring Boot。

#### 📦 影响文件 (4个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `email-ai-automation/.env` | 修改 | 追加备用 LLM、thinking、升级模型配置 |
| `email-ai-automation/config/settings.py` | 修改 | 追加备用与升级模型 settings 字段 |
| `email-ai-automation/services/ai_analyzer.py` | 修改 | 实现 thinking、备用 API 与 Flash/Pro 混合升级策略 |
| `email-ai-automation/main.py` | 修改 | 规范化 LIVE 自动回复模板文案 |

#### ✅ 验收状态

- [x] 备用 API `deepseek-v4-flash` 已实际返回内容，并带出 `reasoning_content`
- [x] Flash 成功后仍可按条件升级到 `deepseek-v4-pro`
- [x] 备用 API 路径已纳入升级判断，不会绕过 Pro 兜底
- [x] LIVE 模式回复模板已完成语法与文案规范化
- [x] 已确认 Web 停止/启动服务即可加载最新 Python 代码

---

### M48: Enquiry 审核导出补强 + Category 扩展 + SZX-LCL 路由持久化 (2026-05-21)

**日期**: 2026-05-21  
**系统**: `LogiTrack (React/Spring Boot)` + `email-ai-automation (Python)`  
**关联文档**: `docs/PLAN_AUTO_FILL_ENQUIRY.md`、`email-ai-automation/docs/PROJECT_STATUS_REPORT.md`

#### 🎯 目标需求

围绕本轮跨项目联调，完成两类能力补强：

1. 在 LogiTrack 侧提升自动建单记录的人工审核效率，包括多选筛选、后端 XLSX 导出、Reason 下拉与 Category 值域补全；
2. 在 Email AI Automation 侧把 SEA/SZX 从单一路由拆为 FCL 与 LCL 两个分支，并让新的 branch key 能通过监控配置页持久化。

#### ✨ 主要功能

##### 1. Enquiry Management 多选筛选

`logitrack-pro/components/enquiry/EnquiryList.tsx`：
- `Status` 与 `Cargo Types` 从单选 `<select>` 改为复选框下拉
- 筛选参数改为数组，多选时显示选中数量

`logitrack-pro/services/api.ts` + `logitrack-pro/types.ts`：
- `status` / `cargoType` 前端参数支持数组
- 多选值统一转为逗号分隔字符串透传后端

`backend/src/main/java/com/logitrack/backend/specification/EnquirySpecification.java`：
- `status` 与 `cargoTypeCode` 从单值 `equal()` 扩展为支持多值 `IN (...)`

##### 2. XLSX 导出升级为后端生成

`backend/pom.xml`：
- 新增 `poi-ooxml 5.2.3`

`backend/src/main/java/com/logitrack/backend/service/EnquiryService.java`：
- 新增后端 Excel 导出能力
- 删除 `EXW Location`
- 新增 `Lost Reason` / `Cancelled Reason`
- 使用隐藏 `_dict` sheet + Data Validation 为两列提供下拉
- 将 `Lost Reason` / `Cancelled Reason` 挪到 `Status` 旁边

`backend/src/main/java/com/logitrack/backend/controller/EnquiryController.java`：
- 新增 `GET /api/enquiries/export-xlsx`

`logitrack-pro/components/enquiry/EnquiryList.tsx`：
- 导出逻辑从前端 `xlsx` 改为调用后端 `export-xlsx` 下载 blob

##### 3. Category 值域收敛与新选项补充

`logitrack-pro/components/enquiry/EnquiryForm.tsx`：
- 新增 `OCEAN_FREIGHT_DEST / Ocean Freight + Dest. Charges`

`logitrack-pro/constants.ts` + `logitrack-pro/services/api.ts`：
- 收敛旧版 `FREIGHT/ORIGIN_EXW` 常量
- 与当前 EnquiryForm 统一到 `OCEAN_FREIGHT*` / `AIR_FREIGHT*` 现行编码

##### 4. SZX-LCL 路由拆分与配置持久化

`email-ai-automation/services/router.py`：
- 参照 `HKG-LCL` 新增 `SZX-LCL` branch 重映射
- 当 `transport_mode=SEA`、`branch_code=SZX`、`is_lcl=true` 时切换到 `SZX-LCL`

`email-ai-automation/data/pic_routing.json`：
- 保持 `SZX` 作为 FCL 路由不变
- 新增 `SZX-LCL`
- `core` / `non_core` 均发给 `szx.seaops@zieglergroup.cn`
- `cc` 为 `hkg.cyip@zieglergroup.cn`、`susan.zhang@zieglergroup.cn`、`hkg.yho@zieglergroup.cn`

`email-ai-automation/services/monitor_api.py`：
- `PUT /pyapi/routing` 从“仅能更新已存在 branch”扩展为“允许在白名单字段内新增 branch key”
- 新 branch 保存后仍保留热重载能力

#### 📦 影响文件 (12个)

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `logitrack-pro/components/enquiry/EnquiryList.tsx` | 修改 | 多选筛选 + 后端 XLSX 导出入口 |
| `logitrack-pro/services/api.ts` | 修改 | 多选参数传递 + Category 回退字典收敛 |
| `logitrack-pro/types.ts` | 修改 | 查询参数类型兼容多值状态 |
| `backend/src/main/java/com/logitrack/backend/specification/EnquirySpecification.java` | 修改 | status/cargoTypeCode 支持 `IN (...)` |
| `backend/pom.xml` | 修改 | 增加 Apache POI 依赖 |
| `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java` | 修改 | 后端 XLSX 生成与下拉验证 |
| `backend/src/main/java/com/logitrack/backend/controller/EnquiryController.java` | 修改 | 新增 `export-xlsx` 端点 |
| `logitrack-pro/components/enquiry/EnquiryForm.tsx` | 修改 | 新增 `OCEAN_FREIGHT_DEST` 选项 |
| `logitrack-pro/constants.ts` | 修改 | Category 常量统一到当前值域 |
| `email-ai-automation/services/router.py` | 修改 | 新增 `SZX-LCL` 分支重映射 |
| `email-ai-automation/data/pic_routing.json` | 修改 | 新增 `SZX-LCL` 配置 |
| `email-ai-automation/services/monitor_api.py` | 修改 | 路由保存接口支持新增 branch |

#### ✅ 验收状态

- [x] Enquiry Management 支持 `Status` / `Cargo Types` 多选并走服务端筛选
- [x] 导出文件已改为后端生成，并支持 `Lost Reason` / `Cancelled Reason` 下拉
- [x] `Lost Reason` / `Cancelled Reason` 已移动到 `Status` 旁边
- [x] Category 下拉已补充 `Ocean Freight + Dest. Charges`
- [x] `SZX` 已拆分为 FCL (`SZX`) 与 LCL (`SZX-LCL`) 两条 SEA 路由
- [x] `PUT /pyapi/routing` 已支持保存新增 branch key，配置页可以持久化 `SZX-LCL`

---

