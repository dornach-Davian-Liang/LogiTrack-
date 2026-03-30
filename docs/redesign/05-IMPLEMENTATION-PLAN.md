# LogiTrack Pro 询价重构 — 实施计划

> **版本**: v2.0  
> **日期**: 2026-03-23  
> **总工时估算**: 29-32 个工作日

---

## 1. 实施阶段总览

```
阶段 1: 基础变更 (2天)
  ├── 1.1 数据清空 + 迁移脚本
  ├── 1.2 字段重命名 (Issue Date → Enquiry Created Date)
  ├── 1.3 删除字段 (cnPricingAdmin, bookingConfirmed, rejectedReason, actualReason)
  └── 1.4 Cargo Ready Date 复选框

阶段 2: 数据模型变更 (8天)
  ├── 2.1 Status 5值枚举 + 原因字典表 + 验证逻辑
  ├── 2.2 Product Type 7种 + Reference Number 映射
  ├── 2.3 Cargo Type 4种 + BUYER-CONSOL + Product-Cargo 矩阵
  ├── 2.4 Sales 级联重构 (Country → PIC → Office)
  └── 2.5 删除旧表 (dict_cn_pricing_admin, enquiry_container_line)

阶段 3: 核心 UI/逻辑重构 (14-17天)
  ├── 3.1 Cargo Information 动态UI (2天)
  ├── 3.2 Route Information 混合模式 (4天)
  ├── 3.3 Offer 数据模型重构 (3天)
  ├── 3.4 Price Details 矩阵表格 (4-6天)
  └── 3.5 Container Details 弹窗 (2天)

阶段 4: 测试 & 修复 (5天)
  ├── 4.1 单元测试
  ├── 4.2 集成测试
  ├── 4.3 端到端测试
  └── 4.4 回归测试
```

---

## 2. 阶段 1: 基础变更 (2 天)

### Day 1: 数据库迁移 + 后端基础变更

#### 任务 1.1: 数据库迁移脚本执行
- [ ] 备份当前数据库
- [ ] 执行 `migration_v3_enquiry_redesign.sql`
  - 清空业务数据 (enquiry, offer, audit_log 等)
  - 删除旧表 (enquiry_container_line, dict_cn_pricing_admin)
  - 修改 enquiry.status ENUM
  - 新增字段 (cancelled_reason, lost_reason, has_specific_cargo_ready_date, exw_location)
  - 新建表 (offer_price_line, offer_container_detail, enquiry_route_group 等)
  - 创建原因字典表 (dict_cancelled_reason, dict_lost_reason)
  - 更新字典数据 (dict_product 7种, dict_cargo_type 4种)
- [ ] 验证数据库结构

#### 任务 1.2: 后端 Entity/Enum 基础更新
- [ ] 重写 `EnquiryStatus.java` (5 值)
- [ ] 重写 `OfferType.java` (4 值: AIR/FCL/LCL/BUYER-CONSOL)
- [ ] 新增 `SubMode.java` 枚举
- [ ] 删除 `BookingConfirmed.java`
- [ ] 删除 `CnPricingAdmin.java`
- [ ] 删除 `EnquiryContainerLine.java`
- [ ] 更新 `Enquiry.java` (删除旧字段, 新增字段)
- [ ] 编译验证

### Day 2: 前端基础变更

#### 任务 1.3: 类型定义更新
- [ ] 更新 `types.ts` 中所有基础类型
  - ProductCode (7种)
  - EnquiryStatus (5种)
  - CargoType (4种)
  - OfferType (4种)
  - 删除 BookingStatus
- [ ] 新增类型: RouteGroup, OfferPriceLine, OfferContainerDetail
- [ ] 更新 Enquiry 接口

#### 任务 1.4: UI 标签 + 删除字段
- [ ] EnquiryForm: "Issue Date" → "Enquiry Created Date"
- [ ] EnquiryForm: 删除 cnPricingAdmin 下拉
- [ ] EnquiryForm: 删除 bookingConfirmed 下拉
- [ ] EnquiryForm: 删除 rejectedReason/actualReason 输入框
- [ ] EnquiryList: 删除 booking_confirmed 列
- [ ] Cargo Ready Date 复选框组件

---

## 3. 阶段 2: 数据模型变更 (8 天)

### Day 3-4: Status 重构

#### 任务 2.1: Status 枚举 + 原因
**后端**:
- [ ] 新增 `CancelledReason.java` / `LostReason.java` Entity
- [ ] 新增 `CancelledReasonRepository` / `LostReasonRepository`
- [ ] DictController 新增 `/cancelled-reasons` 和 `/lost-reasons` 端点
- [ ] EnquiryService: 状态变更验证逻辑
- [ ] StatisticsService: SQL 条件更新

**前端**:
- [ ] 新增 `StatusChangeDialog.tsx` 组件
- [ ] api.ts: 新增 dictApi.cancelledReasons() / dictApi.lostReasons()
- [ ] EnquiryForm: Status 下拉 5 值 + Lost/Cancelled 触发弹窗
- [ ] EnquiryList: 状态颜色标签 (5色)
- [ ] EnquiryDetail: 显示原因

### Day 5: Product Type 扩展

#### 任务 2.2: Product 7 种
**后端**:
- [ ] dict_product 字典已通过迁移脚本更新
- [ ] EnquiryService: Reference Number 生成支持 RA/SA/ARS 缩写
- [ ] 验证 productAbbr 映射

**前端**:
- [ ] PRODUCT_CARGO_MAP 常量定义
- [ ] MIXED_MODE_PRODUCTS / PRODUCT_SUBMODE_MAP 常量
- [ ] EnquiryForm: Product 下拉支持 7 种
- [ ] Product 切换时自动过滤 Cargo Type

### Day 6-7: Cargo Type 重构

#### 任务 2.3: Cargo Type 4 种 + Product-Cargo 关联
**后端**:
- [ ] dict_cargo_type 字典已通过迁移脚本更新
- [ ] 删除 dict_cargo_type.offer_type 列 (不再需要)
- [ ] 更新 CargoType Entity (如有)

**前端**:
- [ ] Cargo Type 下拉: 4 种 (AIR/FCL/LCL/BUYER-CONSOL)
- [ ] Product → Cargo Type 联动过滤
- [ ] Offer Type = Cargo Type 自动同步
- [ ] Category 新增 EXW_LOCATION 选项
- [ ] EXW Location 自由文本输入 (条件显示)

### Day 8-9: Sales 级联重构

#### 任务 2.4: Country → PIC → Office
**后端**:
- [ ] 删除 enquiry.cn_pricing_admin 列
- [ ] 删除 dict_cn_pricing_admin 表
- [ ] DictController: 确认 /sales-pics?countryCode= 端点工作正常
- [ ] 验证 PIC → Office 映射 (一个 PIC 只属于一个 Office)

**前端**:
- [ ] EnquiryForm: "Sales Country" → "Z-Country / Agent"
- [ ] 级联选择:
  1. Z-Country/Agent 下拉 (含搜索)
  2. Sales PIC 下拉 (按 Country 过滤)
  3. Sales Office 自动填充 (按 PIC 映射)
- [ ] 删除 CN Pricing Admin 下拉

### Day 10: 清理 + 编译验证

#### 任务 2.5: 整合验证
- [ ] 后端完整编译 (mvn clean package)
- [ ] 前端完整编译 (npx tsc --noEmit)
- [ ] 基本 CRUD 功能验证
- [ ] 列表 / 详情页验证

---

## 4. 阶段 3: 核心 UI/逻辑重构 (14-17 天)

### Day 11-12: Cargo Information 动态 UI

#### 任务 3.1: 动态 Cargo Information
**前端**:
- [ ] EnquiryForm: 根据 Cargo Type 条件渲染字段
  - FCL/BUYER-CONSOL: Commodity + Hazardous (无 Volume/Quantity/UOM)
  - AIR/LCL: Commodity + Volume + Quantity + UOM + Hazardous
- [ ] 删除原有 Container Lines 编辑区域 (从 EnquiryForm 中移除)
- [ ] 添加提示文字: "容器信息请在 Offer 的 Price Details 中填写"

### Day 13-16: Route Information 混合模式

#### 任务 3.2: Route Group 系统
**后端**:
- [ ] 新增 `EnquiryRouteGroup.java` Entity
- [ ] 新增 `EnquiryRouteGroupRepository`
- [ ] 新增路由组 POL/POD 关联保存逻辑
- [ ] EnquiryService: 保存/更新/删除路由组
- [ ] 新增 API: 获取路由组端口列表
- [ ] 港口搜索 API 确认 portType 过滤正常

**前端**:
- [ ] 新增 `RouteGroupEditor.tsx` 组件
  - Sub-mode 下拉 (AIR/SEA/RAIL)
  - 港口按 sub-mode 过滤 (AIR→机场, SEA/RAIL→海港)
  - POL/POD 多选 (VirtualizedMultiSelect)
  - [+ Add Route Group] / [🗑 Delete] 按钮
  - 至少保留 1 组, 不能全部删除
- [ ] EnquiryForm 集成:
  - 普通模式 → 原有单组 POL/POD
  - 混合模式 → RouteGroupEditor (切换 Product 时联动)
- [ ] POD Country 自动映射 (从所有选中的 POD 港口提取国家)

### Day 17-19: Offer 数据模型重构

#### 任务 3.3: Offer + PriceLine + ContainerDetail
**后端**:
- [ ] 重构 `Offer.java` (删除 price/priceText, 新增 offerDate, 关联 priceLines)
- [ ] 新增 `OfferPriceLine.java`
- [ ] 新增 `OfferContainerDetail.java`
- [ ] 新增 Repository 接口
- [ ] 新增 DTO 类 (OfferCreateDTO, OfferPriceLineDTO, OfferContainerDetailDTO)
- [ ] 重构 `OfferService.java`:
  - createOffer: 保存 Offer + PriceLines + ContainerDetails
  - 空行过滤: 所有价格字段为空的行自动删除
  - 笛卡尔积生成: generatePriceLines API
  - 混合模式: 按 Route Group 分组生成
- [ ] 更新 `OfferController.java`: 新 API 结构

**前端**:
- [ ] 更新 Offer 类型定义
- [ ] 更新 offerApi (新 payload 结构)
- [ ] OfferManagement: 适配新数据结构

### Day 20-25: Price Details 矩阵表格 + Container 弹窗

#### 任务 3.4: PriceDetailsTable
**前端** (最复杂的组件):
- [ ] 新增 `PriceDetailsTable.tsx`
  - FCL/BUYER-CONSOL 模式: POL|POD|20'|40'|40'HQ|45'|PerCBM|MinCharge|LocalCharge|ContainerType
  - AIR/LCL 模式: POL|POD|Price|MinCharge|LocalCharge
  - 混合模式: 按 Route Group 分组显示行
  - 行数据双向绑定 (受控输入)
  - 柜型单元格可点击 (触发 Container Details 弹窗)
- [ ] 动态列: [+ Add Container Type] 按钮
  - 支持添加 GP/OT/FR/Tank/Reefer 等列
  - 列头显示柜型名称
  - 每列可独立删除

#### 任务 3.5: ContainerDetailsDialog
- [ ] 新增 `ContainerDetailsDialog.tsx`
  - Container size type 下拉
  - Number of containers 输入
  - Cargo weight per container 输入
  - Container Price 输入
  - TEU 自动计算显示
  - Confirm/Cancel 按钮

#### 任务 3.6: OfferDialog 重写
- [ ] 重写 `OfferDialog.tsx`
  - Offer Type 下拉 (= Cargo Type)
  - Offer Date 日期选择器
  - 嵌入 PriceDetailsTable
  - [+ Add Container Type] 按钮 (仅 FCL/BUYER-CONSOL)
  - 保存逻辑 (空行过滤 + 容器数据收集)

---

## 5. 阶段 4: 测试 & 修复 (5 天)

### Day 26-27: 功能测试

- [x] **创建询价** — 7 种 Product Type × 4 种 Cargo Type 的所有允许组合
- [x] **混合模式** — RAIL-SEA, RAIL-AIR, SEA-AIR, AIR-RAIL-SEA 各创建一条
- [x] **Status 变更** — New → Quoted & Pending → Secured/Lost/Cancelled
- [x] **Lost/Cancelled 原因** — 下拉选择 + Others 自由文本
- [x] **Sales 级联** — Country → PIC → Office 自动映射
- [x] **Cargo Information** — FCL/BUYER-CONSOL 无 CBM/Quantity; AIR/LCL 有
- [x] **Route Group** — 增/删/改 + 港口过滤
- [x] **Offer 创建** — Price Details 矩阵填写 + 空行自动删除
- [x] **Container Details** — 弹窗填写 + TEU 计算
- [x] **Cargo Ready Date** — 勾选/不勾选行为
- [x] **Reference Number** — 各产品缩写正确

### Day 28-29: 集成测试 + 回归

- [x] **Dashboard** — 5 种状态统计正确 (修复: status key 从 name() → toJsonValue())
- [x] **报表** — 月度趋势、CN Office 统计、对比报表 (修复: 产品选项补全 RAIL-AIR/AIR-RAIL-SEA)
- [x] **AI 问答** — 状态/货物类型相关查询 (已验证: 正确调用 get_enquiry_overview)
- [x] **搜索** — 列表页搜索/过滤 (修复: 添加 BUYER-CONSOL 货物类型选项)
- [x] **审计日志** — 创建/更新/删除操作记录 (已验证: 无旧字段引用)
- [x] **权限** — ADMIN/OPERATING/NORMAL 各角色功能验证
- [x] **数据导出** — 报表导出格式正确

### Day 30: Bug 修复 + 上线准备

- [x] 修复测试中发现的 Bug (M15: 15处, M16: 8处)
- [x] 更新文档
- [x] 准备上线清单 (M17: 列表筛选修复 + 状态颜色统一 + 容器标签清理)

---

## 6. 关键里程碑

| 里程碑 | 时间点 | 交付物 |
|--------|--------|--------|
| M1: 基础变更完成 | Day 2 | 数据库迁移 + 类型更新 + 编译通过 |
| M2: 数据模型完成 | Day 10 | 全部 Entity/Repository/Service 更新 + CRUD 可用 |
| M3: 核心 UI 完成 | Day 25 | Route Group + Price Details + Container 弹窗 |
| M4: 测试通过 | Day 30 | 全部功能验证 + Bug 修复 ✅ |

---

## 7. 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| Price Details 表格性能 (大量港口对) | 高 | 中 | 虚拟化渲染 / 分页 / 限制最大行数 |
| 混合模式 Route Group 交互复杂 | 中 | 中 | 充分的 UI/UX 设计 + 用户反馈 |
| AI 模块 SQL 更新遗漏 | 中 | 低 | 全面搜索替换 + 测试覆盖 |
| 历史数据清空影响 | 低 | 低 | 已确认可清空, 后续重新迁移 |
| 前端编译错误级联 | 低 | 中 | 分步骤修改, 每步编译验证 |

---

## 8. 依赖关系图

```
任务 1.1 数据库迁移 ──┐
                      ├── 任务 1.2 后端 Entity
任务 1.3 类型定义 ────┤
                      ├── 任务 2.1 Status
                      ├── 任务 2.2 Product
                      ├── 任务 2.3 Cargo
                      ├── 任务 2.4 Sales
                      └── 任务 2.5 编译验证
                              │
                    ┌─────────┴─────────────┐
                    │                       │
              任务 3.1 Cargo UI       任务 3.2 Route Group
                    │                       │
                    └─────────┬─────────────┘
                              │
                    任务 3.3 Offer 模型重构
                              │
                    ┌─────────┴─────────────┐
                    │                       │
              任务 3.4 Price Table    任务 3.5 Container Dialog
                    │                       │
                    └─────────┬─────────────┘
                              │
                    任务 3.6 OfferDialog 重写
                              │
                    任务 4.x 测试 & 修复
                              │
                    任务 5.x Phase 5: UA 测试 & 功能修复
```

---

## 9. 阶段 5: 用户验收测试 & 功能修复 (2026-03-25)

> Phase 4 完成后的实际用户测试中发现并修复的 9 个功能问题。

### Day 31-32: OfferPriceTable 功能完善

- [x] **[+ Add Container Type] 按钮** — 从 `container_types` DB 表动态加载可添加箱型
- [x] **Total TEU 核算** — 全局 totalTeu + 每行 lineTeu 自动计算
- [x] **Container Types DB 关联** — 从硬编码字符串改为 DB container_types 代码
- [x] **TEU 系数从 DB 读取** — teuLookup 从 containerTypes prop 构建

### Day 33: 混合模式 Route Group 修复

- [x] **Route Group 2 不显示** — `routeGroupId` 从 `rg.id` (undefined) 改为 `rg.groupIndex`
- [x] **港口显示 Port#104** — 同步 Route Group 港口到主 ports 状态 (`ensurePortsLoaded`)
- [x] **三层 POL/POD 冗余** — 混合模式隐藏顶层 POL/POD 选择器
- [x] **POD Country 未映射** — Route Group 变更触发 `updatePodCountries()`

### Day 34: 验证逻辑 & UI 布局优化

- [x] **保存验证兼容** — 混合模式验证 Route Group POL/POD，自动汇总到顶层 polIds/podIds
- [x] **POD Country 位置** — 混合模式下移到 Route Groups 下方

### 修复文件清单

| 文件 | 变更类型 | 行数 |
|------|----------|------|
| `OfferPriceTable.tsx` | 完全重写 | 543 |
| `EnquiryForm.tsx` | 多处修改 | 1437 → 变更 ~150 行 |
| `RouteGroupEditor.tsx` | 无代码变更 | 224 (通过回调增强) |
