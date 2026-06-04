# 自动填询价单（Auto-Fill Enquiry）— 功能计划书

> **版本**: v1.4  
> **日期**: 2026-05-21（已按 2026-05-19 / 2026-05-21 实现情况同步）  
> **状态**: 已审核 ✅  
> **涉及项目**:  
> - `email-ai-automation` — 邮件 AI 自动化（数据源端）  
> - `LogiTrack` — 国际物流询价管理系统（数据消费端）

---

## 1. 功能目标

当 `email-ai-automation` 系统识别到 INQUIRY 类型邮件后，从 AI 提取的 `cargo_info` 及相关结构化数据，自动调用 LogiTrack REST API 创建询价单，减少人工录入，提升效率。

**核心价值**:
- 邮件到达 → AI 分析 → 自动建单，端到端自动化
- 缺失字段标记 `[AUTO-FILL INCOMPLETE]`，人工仅需补充少量信息
- 不阻断现有转发流程，建单失败不影响邮件路由

---

## 2. 现有基础（已完成部分）

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| AI 结构化输出 | `services/ai_analyzer.py` | ✅ 已完成 | 输出 `cargo_info`、`pol`、`pod`、`pod_country`、`transport_mode`、`branch_code` 等 |
| 字段映射器 | `services/logitrack_mapper.py` | ✅ 已完成 | `LogiTrackSchemaMapper.build_create_payload()` 将 AI 输出映射为 LogiTrack API payload |
| REST API 客户端 | `services/logitrack_client.py` | ✅ 已完成 | `LogiTrackClient.create_enquiry()` + 主数据查询接口 |
| DB 直连客户端 | `services/logitrack_db_client.py` | ✅ 已完成 | 直连 MySQL 查询主数据（备用方案） |
| 主流程集成 | `main.py` (line 228-260) | ✅ 已完成 | 步骤 9 已集成建单逻辑 |
| 定时导出 | `services/logitrack_exporter.py` | ✅ 已完成 | 每日查询 `[AUTO-FILL INCOMPLETE]` 记录，CSV 邮件通知 |
| SkipChecker | `services/skip_checker.py` | ✅ 已完成 | DG/混合运输等不建号的拦截 |

### 2.1 自动建单触发保护（2026-05-19 更新）

为避免对已建号询价重复建单，当前触发条件补充如下：

1. 只有 `is_inquiry=true` 且 `email_type="INQUIRY"` 的邮件才进入自动建单流程。
2. 如果 Subject 已含内部建号（如 `<CN2605138-S>` / `<CN2605115-A>` / `<CN2604201-AS>`），即使正文写有 `please quote` / `pls quote` / `kindly quote`，也必须视为已建号线程上的 `FOLLOW_UP`，**不得再次自动建单**。
3. 如果 Subject **不含**内部建号，但正文提及旧单号并同时提出新的独立箱型/路线/报价需求（如旧单 40HQ，当前新增 20GP），仍保持 `INQUIRY`，允许建新号。
4. 同一 `conversation_id` 下若出现**新的 `message_id` 且当前邮件仍被识别为 `INQUIRY`**，允许新建 REF；当前系统不再做“跨轮次 `conversation_id` 数据库去重”，避免误伤同线程中的全新报价场景。

这一保护规则来自 Sea-Completed 真实案例复盘，目标是把“重复建号风险”尽量前移到 AI 分类阶段解决，而不是等到建单后再人工清理。

---

## 3. 当前 AI 输出 Schema（数据源）

```json
{
  "transport_mode": "SEA|AIR|RAIL",
  "branch_code": "SHA|NGB|SZX|TAO|TSN|XMN|HKG|CKG",
  "pol": "Shanghai",
  "pod": "Rotterdam",
  "pol_country": "China",
  "pod_country": "Netherlands",
  "is_lcl": false,
  "is_dangerous_goods": false,
  "sender_ziegler_office": "Netherlands",
  "cargo_info": {
    "commodity": "Electronic components",
    "volume_cbm": 25.5,
    "gross_weight_kg": 18000,
    "net_weight_kg": 16500,
    "containers": { "20ft": 0, "40ft": 2, "40hq": 0, "45ft": 0 },
    "weight_per_ctn_kg": null,
    "ready_date": "2026-06-15",
    "hazardous_info": "",
    "incoterm": "FOB",
    "quantity": 500,
    "uom": "CTN"
  }
}
```

---

## 4. LogiTrack 询价单字段映射（核心设计）

### 4.1 字段映射表

| LogiTrack 字段 | 数据来源 | 映射逻辑 | 可靠度 |
|---|---|---|---|
| `enquiryReceivedDate` | `parsed_email.date` | 邮件接收日期 | 🟢 高 |
| `enquiryCreatedDate` | 系统时间 | `datetime.now()` | 🟢 高 |
| `productCode` | `transport_mode` | SEA→SEA, AIR→AIR, RAIL→RAIL | 🟢 高 |
| `cargoTypeCode` | `transport_mode` + `is_lcl` | SEA+FCL→FCL, SEA+LCL→LCL, AIR→AIR | 🟢 高 |
| `status` | 固定值 | `"New"` | 🟢 高 |
| `salesCountryCode` | `sender_ziegler_office` → DB 查询 | Ziegler办事处国家 → sales_country 表匹配 | 🟡 中 |
| `salesPicId` | `salesCountryCode` → DB 查询 | 按国家找 Sales PIC | 🟡 中 |
| `salesOfficeId` | `salesPicId` 关联 | 从 PIC 记录关联 Office | 🟡 中 |
| `assignedCnOffice` | `branch_code` | SHA→SHANGHAI, NGB→NINGBO 等 | 🟢 高 |
| `senderEmail` | `parsed_email.sender` | 发件人邮箱 | 🟢 高 |
| `commodity` | `cargo_info.commodity` | 货物品名 | 🟢 高 |
| `volumeCbm` | `cargo_info.volume_cbm` | 体积（立方米） | 🟡 中 |
| `quantity` | `cargo_info.quantity` / `gross_weight_kg` | 数量（AIR/RAIL fallback 为重量） | 🟡 中 |
| `uom` | `cargo_info.uom` | 单位 KG/PCS/CTN/PLT/SET | 🟡 中 |
| `polIds` | `pol` + `pol_country` → port 表匹配 | 港口名/城市模糊匹配 | 🟡 中 |
| `podIds` | `pod` + `pod_country` → port 表匹配 | 港口名/城市模糊匹配 | 🟡 中 |
| `polCountry` | `pol_country` | 起运地国家 | 🟢 高 |
| `podCountry` | `pod_country` | 目的地国家 | 🟢 高 |
| `coreNonCore` | `pod_country` → router 判断 | Core 国家列表匹配 | 🟢 高 |
| `isOversizeCargo` | `cargo_info.hazardous_info` | 含 OOG/OVERSIZE 关键词 | 🟢 高 |
| `hazardousSpecialEquipment` | `is_dangerous_goods` + `cargo_info.hazardous_info` | DG 信息 | 🟢 高 |
| `exwLocation` | ⛔ 不自动填写 | 留空，由人工跟进补充（EXW 条款较少见，AI 提取不可靠） | — |
| `hasSpecificCargoReadyDate` | ⛔ 不自动填写 | 固定传 `false`，cargo ready 日期由人工确认后录入 | — |
| `cargoReadyDate` | ⛔ 不自动填写 | 留空，由人工跟进（ready_date 经常变更，AI 提取不可作为依据） | — |
| `cargoReadyDateDetails` | ⛔ 不自动填写 | 留空，由人工跟进 | — |
| `containerRows` | `cargo_info.containers` | FCL 时生成柜量行 | 🟢 高 |
| `createdBy` | 自动写入 | `EnquiryController` 自动读取 `X-Username: email-ai-bot` header 写入（已实现） | 🟢 高 |
| `remark` | 自动生成 | 包含 source, message_id, conversation_id, confidence, 缺失字段标记 | 🟢 高 |

### 4.2 字段分类策略

**A. 自动填写字段**（能填尽填，失败标记 INCOMPLETE）:
- `productCode`、`cargoTypeCode`、`status`、`assignedCnOffice`、`senderEmail`、`commodity`、`volumeCbm`、`quantity`、`uom`、`polIds`、`podIds`、`polCountry`、`podCountry`、`coreNonCore`、`containerRows`、`salesCountryCode`、`salesPicId`、`salesOfficeId`

**B. 人工跟进字段**（系统始终不填，前端提醒人工录入）:
- `exwLocation` — EXW 提货地（较少见，AI 不可靠）
- `hasSpecificCargoReadyDate` + `cargoReadyDate` + `cargoReadyDateDetails` — 货好时间须人工确认（经常变更，不应由 AI 决定）
- `category` — 货物品类分类（需人工主观判断）

**C. 建单失败处理**（当 A 类字段无法解析时）:
1. **payload 中省略该字段**（LogiTrack 后端可接受 null/optional）
2. **在 `remark` 末尾追加**: `[AUTO-FILL INCOMPLETE: salesPicId, polIds]`
3. **每日定时导出器**查询含此标记的记录，邮件通知人工补充

---

## 5. 开发计划（分阶段）

### Phase 1: LogiTrack 后端 API 适配（预计 0.5-1 天）

**目标**: 确保 LogiTrack 后端能正确接收 email-ai-automation 的自动建单请求

| 序号 | 任务 | 优先级 | 说明 |
|------|------|--------|------|
| 1.1 | ~~新增 API 认证中间件~~ | —— | **✅ 已确认无需新增**: 后端无 Spring Security 配置（仅 CORS 配置 `WebConfig.java`），所有 `/api/**` 接口公开。`X-Username` 通过 AuditLogAspect 自动记录 `createdBy`，`email-ai-bot` 直接传入 header 即可 |
| 1.2 | ~~新增 `/api/master/sales-countries`~~ | —— | **✅ 已存在**: `MasterDataController.java` line 226 `GET /api/master/sales-countries` 已实现，返回 `SalesCountry` 全量 |
| 1.3 | ~~新增 `/api/master/sales-pics`~~ | —— | **✅ 已存在**: `MasterDataController.java` line 165 `GET /api/master/sales-pics` 已实现，返回含 `salesOfficeId`/`salesOfficeName` 的 `SalesPicResponse` |
| 1.4 | ~~新增 `/api/master/ports`~~ | —— | **✅ 已存在**: `MasterDataController.java` line 87 `GET /api/master/ports` 已实现，返回 `Port` 含 `portCode/portName/portType/countryCode/city` |
| 1.5 | 验证 `POST /api/enquiries` 对可选字段的容错 | P0 | 确保 null/缺失字段不报 400，特别是 `salesPicId`, `polIds`, `podIds`；`hasSpecificCargoReadyDate=false`时 `cargoReadyDate=null` 不报错 |
| 1.6 | 确认 `createdBy` 自动写入机制 | —— | **✅ 已确认无需修改**: `EnquiryController.java` line 145-147 已实现自动读取 `X-Username` header 并写入 `createdBy`。`email-ai-automation` 仅需在请求 header 中传入 `X-Username: email-ai-bot` 即可 |
| 1.7 | 后端新增 `createdBy` 查询支持 | P0 | `EnquirySpecification.withFilters()` 及 `EnquiryController.getEnquiries()` 新增 `createdBy` 参数，供前端展示自动建单记录筛选（当前 Specification 无此过滤器，需新增） |
| 1.8 | 搞建测试用 LogiTrack DB 环境 | P0 | **Q5已确认**: 使用独立测试数据库（同机新建 `logitrack_test`），生产数据完全隔离 |

> **✅ Q1 已确认**: 后端无 Token 认证，直接调用即可。`X-Username: email-ai-bot` 传 header 用于审计追踪。  
> **✅ Q2 已确认**: `/api/master/sales-countries`、`/api/master/sales-pics`、`/api/master/ports` 三个端点均已存在，**Phase 1 后端适配工作量大幅缩减**。

### Phase 2: email-ai-automation 映射器完善（预计 2-3 天）

**目标**: 优化字段解析准确率，处理边界情况

| 序号 | 任务 | 优先级 | 说明 |
|------|------|--------|------|
| 2.1 | 完善 `logitrack_mapping.json` 配置文件 | P0 | 添加 `branch_sales_country_fallbacks`、`sender_domain_sales_country_fallbacks`、`country_default_sales_pic` 映射；增加 Ziegler 各国域名 → 国家 CODE 的完整对照表 |
| 2.2 | 港口匹配增强（别名表 + 多名称拆分） | P0 | 见第 §5（风险强化方案）详细设计 |
| 2.3 | Sales Country/PIC 解析三层 fallback | P0 | 见第 §5（风险强化方案）详细设计 |
| 2.4 | `no_specific_cargo=true` 跳过建单 | P0 | **Q7已确认**: SkipChecker 中新增此条件，skip=True 时不建单；但 SEA/FCL 邮件若已明确提到 1-2 种柜型（如 `20GP` / `40HQ`）且仅缺数量，按行业惯例默认各 1 柜，不视为 `no_specific_cargo` |
| 2.5 | 建单幂等性：`message_id` 为主，`conversation_id` 仅做本轮缓存 | P0 | **设计已更新**: 真实案例证明同一 `conversation_id` 下可能出现新的独立询价；当前仅保留 `message_id` 硬去重 + 进程内 `_conv_ref_cache`，不再做跨轮次 DB 级 conversation 去重 |
| 2.6 | 混合运输/多 POL 处理 | P1 | `multiple_origins=true` 时标记 `CN-MULTI`，不尝试解析单一 POL |
| 2.7 | 单元测试补充 | P1 | 针对 20+ 种典型邮件场景的映射测试（使用测试 DB 数据） |

### Phase 3: 环境配置（预计 0.5 天）

**目标**: 在同一台机器上配置开发测试环境（**Q4已确认：开发测试直接在 LogiTrack 本机进行**）

| 序号 | 任务 | 优先级 | 说明 |
|------|------|--------|------|
| 3.1 | ~~网络隔离/SSH 隐道~~ | —— | **✅ 跳过**: 同一台机器直接 `localhost:8080`，无需网络打通工作 |
| 3.2 | 在 LogiTrack 本机配置 Python 环境 | P0 | 安装 Python 3.9 + 项目依赖（`pip install -r requirements.txt`），如已安装则跳过 |
| 3.3 | 创建测试数据库 | P0 | `CREATE DATABASE logitrack_test;，导入主数据（国家/港口/PIC 表）但不导入生产询价单 |
| 3.4 | 配置 `.env` 环境变量 | P0 | `LOGITRACK_ENABLED=true`， `LOGITRACK_BASE_URL=http://localhost:8080`， `LOGITRACK_DB_NAME=logitrack_test`， `LOGITRACK_USERNAME=email-ai-bot` |

### 3.5 当前联调与远程访问补充（2026-05-19）

本轮跨项目联调新增两条环境结论，后续部署/验收应默认遵循：

1. **同机联调仍以 localhost 为主**
    - `email-ai-automation` 调用 LogiTrack API 时，仍优先使用 `http://localhost:8080`
    - MySQL 测试/生产连通性也优先走本机连接，减少网络变量干扰

2. **前端远程访问不要依赖 Vite 开发服务外绑 IP**
    - 若需从其他机器访问 LogiTrack 前端进行 UAT，建议使用：
      - `npm run build`
      - `npm run preview -- --host 0.0.0.0 --port 3000`
      - 或 Nginx/80 反向代理
    - 不建议把 Vite dev server 直接当成外网访问入口，否则容易出现看似“502/服务不可用”的假象，干扰 Auto-Fill 联调判断

3. **新增远程连通性检查脚本**
    - `scripts/verify-remote-access.ps1` 可用于验证：
      - TCP 8080 是否可达
      - `GET /api/enquiries` 是否返回 200
      - TCP 3306 是否可达
      - MySQL 登录与示例查询是否通过
    - 若脚本在 MySQL 步骤失败，通常不是 Auto-Fill 逻辑问题，而是 `bind-address`、防火墙或 MySQL host grant 未放通

### 3.6 当前 LLM 成本控制与可靠性补充（2026-05-21）

本轮围绕 `email-ai-automation` 的 LLM 运行方式做了新的联调结论，这些结论会直接影响 Auto-Fill 的稳定性判断：

1. **当前生产假设不应再依赖单一 DeepSeek 渠道**
  - 实测 `api.qnaigc.com` 上的 `DeepSeek-V4-Flash` 出现过 `no available channels for model DeepSeek-V4-Flash`
  - 因此当前基线已增加备用链路：`https://api.deepseek.com / deepseek-v4-flash`
  - Auto-Fill 与邮件路由共用同一份 AI 结构化输出，所以该备用链路同时是“自动建单可靠性”的组成部分，而非仅影响聊天质量

2. **当前推荐模型策略为：Flash + thinking=medium 先跑，复杂邮件自动升级到 Pro**
  - Flash 路径负责大多数标准询价，控制成本
  - 当出现以下任一条件时，自动升级到 `deepseek-v4-pro` 重新分析：
    - `confidence < 0.80`
    - `risk_level == HIGH`
    - `branch_code == UNKNOWN`
    - `multiple_origins == true`
    - 输出被截断
  - 该策略不会降低 LIVE 模式召回率，因为复杂邮件最终使用的是 Pro 结果，而不是勉强接受 Flash 结果

3. **当前 token 消耗的最大头部是必要上下文，不宜强裁**
  - 25 个 base few-shot 已达到约 `35173 chars`
  - system prompt + few-shot + 邮件正文上限合计约 `17724 tokens`（未含输出与思考 token）
  - 当前没有发现可以在不伤害 FOLLOW_UP 判定、branch 修正或 cargo 回填准确率前提下安全删除的“大块非必要 token”

4. **代码变更的生效边界已确认**
  - 当 `email-ai-automation` 代码被修改后，只要通过 Web 面板或进程管理逻辑执行“停止服务 → 启动服务”，新 Python 进程就会加载最新代码
  - Auto-Fill 的行为变更无需为此重启 Spring Boot；Spring Boot 仅负责重拉 Python 进程

### 3.7 当前消费端补强（2026-05-21）

本轮与 LogiTrack 消费端联调，新增了三类直接服务 Auto-Fill 审核/补全流程的能力：

1. **Enquiry Management 列表筛选已支持更细粒度人工复核**
  - `Status` 与 `Cargo Types` 已从单选改为多选
  - 前端通过逗号分隔参数透传，后端 `EnquirySpecification` 已支持多值 `IN (...)` 查询
  - 对自动建单记录做“状态交叉复核”与“货型批量排查”时，不再需要重复切换单值筛选

2. **XLSX 导出已升级为后端生成，适合人工离线补全**
  - 导出链路已从前端 `xlsx` 临时拼表迁移到后端 Apache POI 生成
  - 导出文件删除 `EXW Location`，新增 `Lost Reason` / `Cancelled Reason`
  - 两列支持 Excel Data Validation 下拉，并已调整到 `Status` 旁边，便于业务人员对状态与原因联动复核

3. **Category 值域已向当前 EnquiryForm 收敛，并补充海运目的港费用场景**
  - Category 下拉新增 `OCEAN_FREIGHT_DEST`（`Ocean Freight + Dest. Charges`）
  - `constants.ts` 与 `getCategories()` 回退值已统一到 `OCEAN_FREIGHT*` / `AIR_FREIGHT*` 这一套现行编码
  - 这意味着 Auto-Fill 后续若要在消费端补充 category，不再受旧版 `FREIGHT` / `ORIGIN_EXW` 历史常量干扰

### Phase 4: LogiTrack 前后端“自动建单”标识功能（预计 1-1.5 天）

**目标**: 利用现有 `createdBy` 字段区分人工建单与自动建单，支持筛选和补全（Q6已确认）

> **方案决策**: 使用现有 `Enquiry.createdBy` 字段，自动建单时传入 `X-Username: email-ai-bot`，后端自动写入 `createdBy = "email-ai-bot"`。
> **优点**: 无需新增 DB 字段、无需修改实体类，利用已有字段即可区分来源。

| 序号 | 任务 | 优先级 | 说明 |
|------|------|--------|------|
| 4.1 | 后端：`EnquirySpecification` + Controller 新增 `createdBy` 过滤 | P0 | `withFilters()` 新增 `String createdBy` 参数，支持 `WHERE created_by = ?`；Controller `getEnquiries()` 新增 `@RequestParam` 传递 |
| 4.2 | 前端：列表页新增“来源”列 | P0 | `EnquiryList.tsx` 新增 `来源` 列：`createdBy == "email-ai-bot"` 显示 `🤖 自动`，其他显示 `👤 人工`，含筛选开关 |
| 4.3 | 前端：列表页新增“待补全”快捷筛选 | P0 | 筛选 `createdBy = "email-ai-bot"` 且 `remark` 含 `[AUTO-FILL INCOMPLETE]` 的记录，高亮提示 |
| 4.4 | 前端：询价详情页显示自动建单来源信息 | P1 | `EnquiryDetail.tsx` 或 `EnquiryForm.tsx` 展示 `source=email-ai-automation`、`confidence`、`message_id`（从 `remark` 解析） |
| 4.5 | 前端：待补全字段高亮 | P1 | 编辑表单中，缺失字段（从 `remark` 解析 `AUTO-FILL INCOMPLETE` 列表）显示橙色边框提示 |

### Phase 5: 集成测试与回归验证（预计 2 天）

**目标**: 在测试 DB 上端到端验证，确保不影响现有路由转发流程

| 序号 | 任务 | 优先级 | 说明 |
|------|------|--------|------|
| 5.1 | Dry-Run 模式验证 | P0 | `LOGITRACK_ENABLED=true` + `DRY_RUN=true`，打印 payload 但不实际建单 |
| 5.2 | 10 封历史 INQUIRY 端到端测试（测试 DB） | P0 | **Q5已确认**: 使用独立测试 DB，从 `data/tested_emails.json` 选取典型 INQUIRY |
| 5.3 | 幂等性测试：同邮件重复轮询 | P0 | **Q4已更新**: 验证相同 `message_id` 第二次轮询时不重复建单；同一 `conversation_id` 下若出现新的 `message_id` 且仍为独立新询价，允许新建 REF |
| 5.4 | `no_specific_cargo=true` 拦截验证 | P0 | **Q7已确认**: 真正无货量邮件不建单；但 SEA/FCL 单/双柜型未写数量的场景必须验证“不被误拦截” |
| 5.5 | 缺失字段统计分析 | P1 | 统计哪些字段最常缺失，针对性完善 mapping.json |
| 5.6 | 回归测试 | P0 | 确认路由/转发/SkipChecker 逻辑未受影响（INQUIRY 召回率仍 100%） |
| 5.7 | 导出器验证 | P1 | 验证每日 `[AUTO-FILL INCOMPLETE]` 邮件通知正常 |

### Phase 6: 生产部署与监控（预计 0.5-1 天）

**目标**: 切换至生产 DB，同机器部署后正式上线

| 序号 | 任务 | 优先级 | 说明 |
|------|------|--------|------|
| 6.1 | 两系统迁移至同一机器 | P0 | **Q3已确认**: 生产阶段同机器部署，`LOGITRACK_BASE_URL=http://localhost:8080` |
| 6.2 | 切换生产 DB 环境变量 | P0 | 替换测试 DB 凭据为生产库 |
| 6.3 | 开启 `LOGITRACK_ENABLED=true`，关闭 DRY_RUN | P0 | 正式上线 |
| 6.4 | 日志监控 | P0 | 关注 `🧾 LogiTrack 建单成功/失败` 日志 |
| 6.5 | 告警规则 | P1 | 连续建单失败 3+ 次触发邮件告警（已有 `services/alert.py` 基础） |
| 6.6 | 第一周人工复查 | P1 | 每日查看自动建单列表，抽查字段准确度，补充 mapping 规则 |

---

## 5. 风险强化方案（详细设计）

> **核心原则（已确认）**: 凡是通过 SkipChecker 的 INQUIRY 邮件（非 DG/混合运输/无货量），**系统统一建单**，不因 AI 置信度低或字段匹配失败而阻断。无法解析的字段标记 `[INCOMPLETE]`，由人工跟进补充。

### 5.1 风险一：AI 提取字段准确率不足

**问题根因**: AI 对非结构化邮件的解析存在歧义，`cargo_info` 中的字段可能为空或格式不一致。

#### 措施一 — 字段级验证 + 缺失字段精细标注

| 字段 | 验证规则 | 失败处理 |
|------|----------|----------|
| `commodity` | 非空字符串 | 标记 `[INCOMPLETE: commodity]`，填入 `destination` 或留空 |
| `volumeCbm` / `containers` | FCL 时至少一项不为空 | 标记 `[INCOMPLETE: cargo_quantity]` |
| `polIds` / `podIds` | 不为 null | 标记 `[INCOMPLETE: polIds/podIds]` |
| `salesPicId` | 不为 null | 标记 `[INCOMPLETE: salesPicId]` |

所有缺失字段汇总到 `remark` 末尾：
```
[AUTO-FILL INCOMPLETE: polIds, salesPicId] confidence=0.82
```

#### 措施二 — AI 输出后处理规范化（`_normalize_cargo_info()`）

在 `AIAnalyzer.analyze()` 返回后对 `cargo_info` 做规范化：
- `volume_cbm` 字符串转 float（如 `"25.5 CBM"` → `25.5`）
- `containers` 确保四个 key 存在（缺省补 `0`）
- `commodity` 超过 500 字符时截断

#### 措施三 — 建单 audit 日志

每次建单结果写入 `logs/autofill_audit.jsonl`，供分析字段准确率：
```jsonl
{"ts":"2026-05-07T10:30:00","conversation_id":"AAA...","missing_fields":["polIds"],"confidence":0.92}
```

---

### 5.2 风险二：港口/PIC 匹配失败

**问题根因**: AI 输出自然语言城市名（如 `"Shekou"`, `"VLISSINGEN"`），与 DB 中标准港口名/代码不完全一致。**匹配失败时标记 INCOMPLETE，不使用假设性默认值**。

#### 措施一 — 港口别名表（写入 `logitrack_mapping.json`）

```json
"port_aliases": {
  "SHEKOU": "SHENZHEN", "YANTIAN": "SHENZHEN", "CHIWAN": "SHENZHEN",
  "SHA": "SHANGHAI", "NGB": "NINGBO", "TSN": "TIANJIN", "XMN": "XIAMEN",
  "NANSHA": "GUANGZHOU", "HUANGPU": "GUANGZHOU",
  "VLISSINGEN": "FLUSHING", "ANTWERPEN": "ANTWERP",
  "HAVRE": "LE HAVRE", "LE HAVRE": "LE HAVRE"
}
```

#### 措施二 — 五级降级匹配策略

```
L1: port.portCode 精确匹配
L2: port.portName 精确匹配（大小写不敏感）
L3: 别名表转换后重走 L1/L2
L4: port.city 子串匹配（单结果时采用）
L5: port.portName 子串匹配（单结果时采用）
↓ 全部失败 → 标记 [INCOMPLETE: polIds/podIds]，人工跟进
```

#### 措施三 — 建单幂等性（`message_id` 硬去重 + 本轮 `conversation_id` 缓存，2026-05-19 更新）

当前实现不再做“跨轮次 `conversation_id` 数据库查重”，原因是同一对话链下可能出现新的独立询价（新箱型 / 新路线 / 新报价需求），若继续按 `conversation_id` 全局拦截，会误伤真实新单。

当前策略为：

```python
# Step 0b
if message_id and tracker.is_tested(message_id):
  # 相同邮件不重复处理
  continue

# Step 9a
_existing_ref = _conv_ref_cache.get(conversation_id)
if _existing_ref:
  # 仅在同一轮次/同一批次处理中复用已有 REF，避免当轮重复建号
  reuse_ref(_existing_ref)
```

结论：
- **跨轮次唯一硬去重键**是 `message_id`
- **本轮内存级防重**使用 `_conv_ref_cache`
- **同一 `conversation_id` 下新的 `message_id`**，若当前邮件仍被识别为 `INQUIRY`，允许建新 REF

---

## 6. 系统交互架构

```
│                    email-ai-automation (Python)                       │
│                                                                      │
│  MS Graph API                                                        │
│      │                                                               │
│      ▼                                                               │
│  ┌─────────┐    ┌──────────────┐    ┌────────────┐                  │
│  │  Email   │───▶│  AI Analyzer │───▶│   Router   │── 转发邮件      │
│  │  Parser  │    │  (DeepSeek)  │    │            │                  │
│  └─────────┘    └──────┬───────┘    └────────────┘                  │
│                         │                                            │
│                         │ analysis (cargo_info, pol, pod...)          │
│                         ▼                                            │
│                  ┌──────────────────┐                                │
│                  │  LogiTrack       │                                │
│                  │  SchemaMapper    │                                │
│                  │                  │                                │
│                  │ build_create_    │                                │
│                  │ payload()        │                                │
│                  └────────┬─────────┘                                │
│                           │ payload (JSON)                           │
│                           ▼                                          │
│                  ┌──────────────────┐          ┌──────────────────┐  │
│                  │  LogiTrack       │  REST    │  LogiTrack DB    │  │
│                  │  Client (API)    │─────────▶│  Client (备用)   │  │
│                  └────────┬─────────┘          └────────┬─────────┘  │
│                           │                             │            │
└───────────────────────────┼─────────────────────────────┼────────────┘
                            │ POST /api/enquiries          │ SELECT
                            ▼                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    LogiTrack Pro (Spring Boot + React)                │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  EnquiryController                                           │    │
│  │    POST /api/enquiries  ← 自动建单                           │    │
│  │    GET  /api/master/*   ← 主数据查询（港口/国家/PIC）         │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
│  ┌───────────────────────────▼──────────────────────────────────┐   │
│  │  MySQL (logitrack DB)                                         │   │
│  │    enquiry / enquiry_pol / enquiry_pod / enquiry_container    │   │
│  │    country / port / dict_sales_pic / dict_sales_office        │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │  React 前端 — 人工补充缺失字段                             │      │
│  │    EnquiryList → 筛选 [AUTO-FILL INCOMPLETE] 标记          │      │
│  │    EnquiryForm → 编辑补全                                  │      │
│  └───────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. 需确认 / 待决事项（已审核）

| # | 问题 | 决策结果 |
|---|------|----------|
| Q1 | LogiTrack 后端是否已有 Token 认证机制？ | ✅ **无 Token 认证**，所有 `/api/**` 公开。`X-Username: email-ai-bot` header 传入，`createdBy` 自动写入 |
| Q2 | 三个 master API 端点是否已存在？ | ✅ **均已存在**：`/api/master/sales-countries`、`/api/master/sales-pics`、`/api/master/ports` |
| Q3 | 网络架构？ | ✅ **开发测试直接在 LogiTrack 本机进行**，`localhost:8080`，无需网络打通 |
| Q4 | 是否需要重复建单检测？ | ✅ **需要**，但当前已更新为“`message_id` 硬去重 + 本轮 `_conv_ref_cache` 防重”；不再做跨轮次 `conversation_id` 全局查重，详见 §5.2 措施三 |
| Q5 | 自动建单是否需要审批流？测试数据库？ | ✅ **直接建单 `status=New`**；使用独立测试 DB `logitrack_test` 隔离 |
| Q6 | 前端是否需要自动建单标识/筛选？ | ✅ **需要**，利用现有 `createdBy` 字段，传 `X-Username: email-ai-bot`，前端按 `createdBy` 筛选 |
| Q7 | `no_specific_cargo=true` 是否建单？ | ✅ **暂不建单**，SkipChecker 拦截 |
| Q8 | `exwLocation`/`cargoReadyDate` 等字段是否自动填写？ | ✅ **不自动填写**，固定留空由人工跟进（详见 §4.2 B类字段） |
| Q9 | `createdBy` 方案 vs 新增 `isAutoFilled` 字段？ | ✅ **采用 `createdBy` 方案**：无需改动 DB/实体，`EnquiryController` 已自动从 `X-Username` header 写入，只需后端 Specification 新增 `createdBy` 过滤参数 |

| Q10 | `dict_sales_country` 的 `code` 字段格式？ | ✅ **2字母 ISO 格式**：`BE`/`CH`/`CN`/`DE`/`GB`/`GR`/`MA`/`NL`/`PL`/`US`/`ZA`/`AG`/`OT`。`sender_domain_sales_country_fallbacks` 使用此格式 |

---

## 8. 风险总览

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| AI 提取字段准确率不足 | 中 | 建单数据不准 | **§5.1 三项措施**：字段级精细标注、cargo_info 规范化后处理、audit 日志监控 |
| 港口匹配失败 | 中 | polIds/podIds 缺失 | **§5.2 措施一二**：港口别名表 + 五级降级匹配；失败标 INCOMPLETE |
| Sales PIC 解析失败 | 中 | salesPicId 缺失 | 现有 mapper 已有 sender_office 解析；失败标 INCOMPLETE，人工补充 |
| 测试数据污染生产 | 中 | 脏数据 | **独立测试 DB `logitrack_test`**，完全隔离（Q5确认） |
| 重复建单 | 低 | 数据冗余 | `message_id` 硬去重 + 本轮 `_conv_ref_cache` 防重；同线程新 `message_id` 新询价允许建新号（§5.2 措施三） |
| LogiTrack 后端响应异常 | 低 | 主流程延迟 | 20s 超时 + 捕获异常不阻断转发流程 |

---

## 9. 验收标准

- [ ] INQUIRY 邮件经 AI 分析后，LogiTrack 中成功创建对应询价单
- [ ] 建单 payload 字段准确率 ≥ 80%（以 10 封测试邮件验证）
- [ ] 缺失字段正确标记在 `remark` 中
- [ ] 建单失败不影响邮件转发流程
- [ ] 不产生重复询价单
- [ ] 每日导出报告正确发送
- [ ] 建单操作有完整审计日志

---

## 10. 时间线估算

| 阶段 | 内容 | 预计工时 |
|------|------|----------|
| Phase 1 | LogiTrack 后端适配（可选字段容错验证 + `createdBy` 过滤 + 测试 DB） | 0.5-1 天 |
| Phase 2 | Mapper 完善（别名表、normalize、幂等、no_specific_cargo 拦截） | 2-3 天 |
| Phase 3 | 环境配置（同机器，仅配置 `.env` + 测试 DB） | 0.5 天 |
| Phase 4 | LogiTrack 前端 `createdBy` 标识 + 筛选功能 | 1-1.5 天 |
| Phase 5 | 集成测试 + 回归验证（测试 DB） | 1-2 天 |
| Phase 6 | 切换生产 DB，正式上线 | 0.5 天 |
| **合计** | | **5.5-8.5 天** |

**开发顺序建议**: Phase 3 → Phase 1 → Phase 2 → Phase 5（先跑通基础链路）→ Phase 4 → Phase 6

---

## 11. 附录：已有代码入口

### email-ai-automation 端

```python
# main.py — 步骤 9 (line ~228-260)
if settings.logitrack_enabled:
    build_result = logitrack_mapper.build_create_payload(
        parsed, analysis, forward_plan,
        skip_result=skip_result, client=logitrack_client,
    )
    created = logitrack_client.create_enquiry(build_result["payload"])
```

### LogiTrack 后端

```java
// EnquiryController.java
@PostMapping
public ResponseEntity<Enquiry> createEnquiry(@RequestBody Enquiry enquiry) {
    // ... 创建逻辑
}
```

### 配置项（.env）

```bash
# email-ai-automation/.env（在 LogiTrack 本机运行）
LOGITRACK_ENABLED=true
LOGITRACK_BASE_URL=http://localhost:8080        # 同机器直连
LOGITRACK_USERNAME=email-ai-bot                # 写入 createdBy 字段
# 无需 LOGITRACK_TOKEN（后端无 Token 认证）
LOGITRACK_DB_HOST=127.0.0.1
LOGITRACK_DB_PORT=3306
LOGITRACK_DB_USER=logitrack
LOGITRACK_DB_PASSWORD=<测试 DB 密码>
LOGITRACK_DB_NAME=logitrack_test               # 独立测试数据库

# 生产切换时只需改：
# LOGITRACK_DB_NAME=logitrack
```

---

**v1.3 同步说明**: 在保留 v1.2 决策基础上，补充两项实现级边界同步：1）建单幂等性已收敛为“`message_id` 硬去重 + 本轮 `_conv_ref_cache`”，移除文档中旧的跨轮次 `conversation_id` 全局查重表述；2）`no_specific_cargo` 对 SEA/FCL 单/双柜型场景已增加业务边界：客户只写 `20GP` / `40HQ` 等柜型但未写数量时，默认各 `1` 柜，不应拦截自动建单。另：sender_name 当前兜底已统一为 `Sender`，仅影响转发称呼，不影响 Auto-Fill 字段映射。


---

## 12. AI 分析字段增强计划

> **背景**: 在 UAT 阶段发现 AI 分析输出的字段精度不足，且缺少路由决策说明，需要在后续迭代中增强。

### 12.1 AI 分析字段输出增强（更详细的结构化数据）

**目标**: 增加 AI 分析输出字段的详细程度，便于 LogiTrack 建单自动填写更多字段，并为人工审核提供更丰富的数据。

**待增强字段**（建议在 i_analyzer.py prompt 中新增提取要求）:

| 字段名 | 说明 | 示例值 | 用途 |
|--------|------|--------|------|
| commodity | 货物品名（英文标准名） | Electronic Components | LogiTrack 建单 / 人工审核 |
| hs_code | HS 编码（若邮件中有提及） | 8542.31 | LogiTrack 建单 / 合规 |
| cargo_ready_date_raw | 原文货好日期描述（不做解析） | "end of this month" | 人工确认 |
| incoterms | 贸易条款 | EXW, FOB, CIF | LogiTrack 建单 |
| cargo_dimensions | 货物尺寸/规格（若有） | "120x80x100cm/pallet" | 建单备注 |
| special_requirements | 特殊要求（危品、温控、保险等） | ["DG", "INSURANCE"] | 风险判断 / 建单标注 |
| quote_deadline | 报价截止日期（若有） | "2026-05-20" | 紧急度判断 |
| customer_reference | 客户参考号（PO号、Reference等） | "PO 24169, 24015" | 建单 / 邮件追踪 |

**实施要点**:
- 所有新字段均为 Optional，AI 无法提取时返回 
ull（不影响现有流程）
- cargo_ready_date_raw 仅保留原文描述，不做日期解析（避免幻觉）
- 新字段同步写入 email_processing_log.analysis_json（监控面板可查看）

---

### 12.2 路由决策说明字段（人工审核专用）

**目标**: 在 AI 分析结果中增加 
outing_reason 字段，记录为何做出当前路由决策，供人工审核和后续 AI 反馈改进使用。

**字段定义**:

`python
# 在 services/router.py get_forward_instruction() 返回值中新增
{
    "instructions": [...],
    "routing_reason": {
        "is_core": True/False,          # 是否核心国家/地区
        "core_basis": "pod_country",    # core 判断依据（pod_country / destination / default）
        "rule_triggered": "R5",         # 命中规则编号（R2/R3/R4/R5/R6/normal）
        "rule_note": "无具体货量 AIR → 正常 branch 路由",  # 规则描述
        "branch_resolved": "SZX",       # 最终生效的 branch
        "sender_is_ziegler": True,      # 是否 Ziegler 发件人
        "destination_matched": False,   # 是否命中 destination_rules
        "fallback_used": False,         # 是否使用了 fallback（managers）
    }
}
`

**监控面板展示**: 在邮件监控详情页（邮件监控面板的展开卡片中）显示 
outing_reason 的摘要信息，格式如:
`
路由决策: [NON-CORE] R5-正常路由 | Branch: SZX | AIR → TO: szx.slin
`

**人工审核价值**:
1. 快速定位路由错误的根本原因（是 AI 字段问题还是路由规则问题）
2. 积累错误案例 → 改进 AI prompt 或路由规则
3. 为未来 RLHF（人工反馈强化学习）提供训练信号

**实施步骤**:
1. 在 
outer.py 各分支中收集决策信息，最终注入 
outing_reason 字典
2. 在 main.py 将 
outing_reason 写入 _mon（监控字典）
3. 在 monitor_db.py 将 
outing_reason 存入 email_processing_log 表（JSON 字段）
4. 在前端监控面板的详情展开行中渲染 
outing_reason 摘要

---

> **优先级**: 低（Phase 5 集成测试后实施）  
> **更新时间**: 2026-05-11