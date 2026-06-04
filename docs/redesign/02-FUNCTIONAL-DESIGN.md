# LogiTrack Pro 询价重构 — 功能设计完全版

> **版本**: v2.0  
> **日期**: 2026-03-23

---

## 目录

1. [数据库变更设计](#1-数据库变更设计)
2. [需求 1：系统自动生成字段](#2-需求-1系统自动生成字段)
3. [需求 2：Product Type 扩展](#3-需求-2product-type-扩展)
4. [需求 3：Status 状态重构](#4-需求-3status-状态重构)
5. [需求 4：Sales 销售信息重构](#5-需求-4sales-销售信息重构)
6. [需求 5：CN Office Grouping](#6-需求-5cn-office-grouping)
7. [需求 6：Cargo Type 重构 + Product-Cargo 关联](#7-需求-6cargo-type-重构)
8. [需求 7：删除字段](#8-需求-7删除字段)
9. [需求 8：多 POL/POD](#9-需求-8多-polpod)
10. [需求 9：Cargo Information 动态 UI](#10-需求-9cargo-information-动态-ui)
11. [需求 10：Route Information 混合模式](#11-需求-10route-information-混合模式)
12. [需求 11：Offer Price Details 矩阵](#12-需求-11offer-price-details-矩阵)
13. [需求 12：Cargo Ready Date 复选框](#13-需求-12cargo-ready-date)
14. [Product × Cargo 允许组合矩阵](#14-product--cargo-允许组合矩阵)
15. [完整数据库 DDL（新版）](#15-完整数据库-ddl新版)

---

## 1. 数据库变更设计

### 1.1 需要清空的数据表

由于需求涉及 enquiry 表结构较大变更（字段删除/新增/ENUM 修改），建议先清空以下业务数据表：

```sql
-- 清空业务数据（保留主数据和字典）
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_log;
TRUNCATE TABLE offer;
TRUNCATE TABLE enquiry_container_line;
TRUNCATE TABLE enquiry_pol;
TRUNCATE TABLE enquiry_pod;
TRUNCATE TABLE enquiry;
SET FOREIGN_KEY_CHECKS = 1;
```

### 1.2 字段变更总览

| 操作 | enquiry 表字段 | 说明 |
|------|---------------|------|
| **删除** | `cn_pricing_admin` | 需求 4：不再需要 |
| **删除** | `booking_confirmed` | 需求 3：由 status 替代 |
| **删除** | `rejected_reason` | 需求 7：由 lost/cancelled reason 替代 |
| **删除** | `actual_reason` | 需求 7：同上 |
| **删除** | `enquiry_offer_type` | 需求 6：Offer Type 移至 offer 表 |
| **修改** | `status` | ENUM 从 3 值改为 5 值 |
| **修改** | `cargo_type_code` | 删除 RAIL/SEA 选项 |
| **新增** | `cancelled_reason` | 需求 3 |
| **新增** | `cancelled_reason_text` | 需求 3 |
| **新增** | `lost_reason` | 需求 3 |
| **新增** | `lost_reason_text` | 需求 3 |
| **新增** | `has_specific_cargo_ready_date` | 需求 12 |
| **新增** | `exw_location` | 需求 6：Category=EXW 时的位置 |

### 1.3 新增表

| 表名 | 说明 |
|------|------|
| `enquiry_route_group` | 混合模式路由组（需求 10） |
| `enquiry_route_group_pol` | 路由组-POL 关联 |
| `enquiry_route_group_pod` | 路由组-POD 关联 |
| `offer_price_line` | Offer 价格明细（按港口对）（需求 11） |
| `offer_container_detail` | Offer 容器明细（需求 11） |
| `dict_cancelled_reason` | 取消原因字典（需求 3） |
| `dict_lost_reason` | 丢单原因字典（需求 3） |

### 1.4 修改表

| 表名 | 变更 |
|------|------|
| `dict_product` | 新增 RAIL-AIR, SEA-AIR, AIR-RAIL-SEA |
| `dict_cargo_type` | 删除 RAIL/SEA，新增 BUYER-CONSOL，修改 offer_type 映射 |
| `dict_category` | 新增 EXW_LOCATION |
| `offer` | 结构大幅重构（新增 offer_date，删除 price/priceText 等扁平字段） |

### 1.5 删除表

| 表名 | 原因 |
|------|------|
| `dict_cn_pricing_admin` | 需求 4：CN Pricing Admin 字段删除 |

---

## 2. 需求 1：系统自动生成字段

### 2.1 字段定义

| 字段 | 显示标签 | 行为 |
|------|----------|------|
| `enquiry_received_date` | Enquiry Received Date | 系统默认当天，用户**可修改** |
| `issue_date` | **Enquiry Created Date**（改名） | 系统自动生成，**不可修改** |
| `reference_number` | Reference Number | 系统自动生成，含产品缩写 |

### 2.2 Reference Number 生成规则（更新）

格式：`CN{YYMM}{SEQ}-{ABBR}{SERIAL}`

| Product Code | 缩写（abbr） | 示例 |
|---|---|---|
| AIR | A | CN2603001-A |
| SEA | S | CN2603001-S |
| RAIL | R | CN2603001-R |
| RAIL-SEA | RS | CN2603001-RS |
| RAIL-AIR | RA | CN2603001-RA |
| SEA-AIR | SA | CN2603001-SA |
| AIR-RAIL-SEA | ARS | CN2603001-ARS |

### 2.3 变更影响

- **前端**：EnquiryForm.tsx 中 `Issue Date` 标签 → `Enquiry Created Date`
- **后端**：无变动（字段名保持 `issue_date`）
- **数据库**：仅 `dict_product` 新增 3 条数据

---

## 3. 需求 2：Product Type 扩展

### 3.1 产品类型完整列表

| Product Code | 显示名称 | 缩写 | 模式 | 可选 Cargo Type |
|---|---|---|---|---|
| AIR | Air Freight | A | 普通 | AIR |
| SEA | Sea Freight | S | 普通 | FCL, LCL, BUYER-CONSOL |
| RAIL | Rail Freight | R | 普通 | FCL, LCL |
| RAIL-SEA | Rail-Sea Combined | RS | 混合 | FCL, LCL |
| RAIL-AIR | Rail-Air Combined | RA | 混合 | AIR, LCL |
| SEA-AIR | Sea-Air Combined | SA | 混合 | AIR, LCL |
| AIR-RAIL-SEA | Air-Rail-Sea Combined | ARS | 混合 | FCL, LCL, AIR |

### 3.2 普通模式 vs 混合模式

```
普通模式 (AIR / SEA / RAIL)
├── Route Information: 仅 1 组 (POL 多选 + POD 多选)
├── 无 Sub-mode 下拉
└── 无 [+ Add Route Group] 按钮

混合模式 (RAIL-SEA / RAIL-AIR / SEA-AIR / AIR-RAIL-SEA)
├── Route Information: 支持多组 (至少 1 组)
├── 每组有 Sub-mode 下拉 (AIR / SEA / RAIL)
├── 港口按 Sub-mode 过滤:
│   ├── AIR → 仅显示 port_type = 'AIR' 的机场
│   └── SEA / RAIL → 显示 port_type = 'SEA' 的海港（共用列表）
└── [+ Add Route Group] 蓝色按钮
```

### 3.3 混合模式允许的 Sub-mode

| Product Code | 允许的 Sub-modes |
|---|---|
| RAIL-SEA | RAIL, SEA |
| RAIL-AIR | RAIL, AIR |
| SEA-AIR | SEA, AIR |
| AIR-RAIL-SEA | AIR, RAIL, SEA |

### 3.4 数据库变更

```sql
-- 更新 dict_product
DELETE FROM dict_product;
INSERT INTO dict_product (code, name, abbr, is_active) VALUES
('AIR', 'Air Freight', 'A', 1),
('SEA', 'Sea Freight', 'S', 1),
('RAIL', 'Rail Freight', 'R', 1),
('RAIL-SEA', 'Rail-Sea Combined', 'RS', 1),
('RAIL-AIR', 'Rail-Air Combined', 'RA', 1),
('SEA-AIR', 'Sea-Air Combined', 'SA', 1),
('AIR-RAIL-SEA', 'Air-Rail-Sea Combined', 'ARS', 1);
```

---

## 4. 需求 3：Status 状态重构

### 4.1 状态枚举

| 旧状态 | 新状态 | 说明 |
|--------|--------|------|
| New | **New** | 新建 |
| Quoted | **Quoted & Pending** | 已报价待确认 |
| — | **Secured** | 已确认（替代 booking_confirmed=Yes） |
| — | **Lost** | 丢单（替代 booking_confirmed=Rejected） |
| Cancelled | **Cancelled** | 已取消 |

### 4.2 状态转换规则

```
New ──────────────> Quoted & Pending ──────> Secured
 │                       │                       
 │                       ├──────────────> Lost (需填 Lost Reason)
 │                       │
 └──────────────────────> Cancelled (需填 Cancelled Reason)
```

### 4.3 Lost Reason 下拉选项

| Code | 显示文本 |
|------|----------|
| CANCEL_NVOCC | Cancel Booking - arranged by other NVOCC |
| CANCEL_AIR | Cancel Booking - arranged by Air |
| CANCEL_SEA | Cancel Booking - arranged by Sea |
| CANCEL_TRAIN | Cancel Booking - arranged by Train |
| CANCEL_PO | Cancel Booking - PO Cancelled |
| PRODUCTION | Production problem |
| RATE_CHECK_INDICATION | Rate Checking - For indication only |
| RATE_CHECK_NO_FEEDBACK | Rate Checking - No feedback from customer |
| RATE_ISSUE_FREIGHT | Rate Issue-freight |
| RATE_ISSUE_LOCAL | Rate Issue-local charges |
| SPACE_ISSUE | Space Issue |
| OTHERS | Others - reason required (Free text) |

### 4.4 Cancelled Reason 下拉选项

| Code | 显示文本 |
|------|----------|
| HUMAN_ERROR | Human Error |
| WITHDRAW | Withdraw enquiry |
| OTHERS | Others - reason required (Free text) |

### 4.5 数据库变更

```sql
-- 1. 修改 enquiry.status
ALTER TABLE enquiry MODIFY COLUMN status 
  ENUM('New','Quoted & Pending','Secured','Lost','Cancelled') 
  NOT NULL DEFAULT 'New';

-- 2. 删除 booking_confirmed
ALTER TABLE enquiry DROP COLUMN booking_confirmed;

-- 3. 新增原因字段
ALTER TABLE enquiry 
  ADD COLUMN cancelled_reason VARCHAR(50) NULL COMMENT '取消原因代码',
  ADD COLUMN cancelled_reason_text TEXT NULL COMMENT '取消原因自由文本（Others时必填）',
  ADD COLUMN lost_reason VARCHAR(50) NULL COMMENT '丢单原因代码',
  ADD COLUMN lost_reason_text TEXT NULL COMMENT '丢单原因自由文本（Others时必填）';

-- 4. 创建原因字典表
CREATE TABLE dict_cancelled_reason (
  code VARCHAR(50) PRIMARY KEY,
  label VARCHAR(200) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
INSERT INTO dict_cancelled_reason (code, label, sort_order) VALUES
('HUMAN_ERROR', 'Human Error', 1),
('WITHDRAW', 'Withdraw enquiry', 2),
('OTHERS', 'Others - reason required (Free text)', 3);

CREATE TABLE dict_lost_reason (
  code VARCHAR(100) PRIMARY KEY,
  label VARCHAR(200) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
INSERT INTO dict_lost_reason (code, label, sort_order) VALUES
('CANCEL_NVOCC', 'Cancel Booking - arranged by other NVOCC', 1),
('CANCEL_AIR', 'Cancel Booking - arranged by Air', 2),
('CANCEL_SEA', 'Cancel Booking - arranged by Sea', 3),
('CANCEL_TRAIN', 'Cancel Booking - arranged by Train', 4),
('CANCEL_PO', 'Cancel Booking - PO Cancelled', 5),
('PRODUCTION', 'Production problem', 6),
('RATE_CHECK_INDICATION', 'Rate Checking - For indication only', 7),
('RATE_CHECK_NO_FEEDBACK', 'Rate Checking - No feedback from customer', 8),
('RATE_ISSUE_FREIGHT', 'Rate Issue-freight', 9),
('RATE_ISSUE_LOCAL', 'Rate Issue-local charges', 10),
('SPACE_ISSUE', 'Space Issue', 11),
('OTHERS', 'Others - reason required (Free text)', 12);
```

### 4.6 UI 行为

当用户将状态切换为 **Lost** 或 **Cancelled** 时：

1. 弹出 **StatusChangeDialog** 对话框
2. 显示对应的原因下拉列表（Lost → dict_lost_reason / Cancelled → dict_cancelled_reason）
3. 若用户选择 `Others`，则显示自由文本输入框（必填）
4. 用户点击**确认**后，状态更新 + 原因保存
5. 用户点击**取消**，状态回退

---

## 5. 需求 4：Sales 销售信息重构

### 5.1 字段变更

| 旧字段 | 新字段 | 说明 |
|--------|--------|------|
| `cn_pricing_admin` | **删除** | 不再需要 |
| `sales_country_code` | 改名显示为 **Z-Country / Agent** | 字段名不变 |
| sales_pic_id | Sales PIC（按 Country 过滤） | 保持不变 |
| sales_office_id | Sales Office（PIC → Office 自动映射） | 保持不变 |

### 5.2 级联逻辑

```
Step 1: 选择 Z-Country / Agent
         [AGENTS ▼]  ← 含搜索框，排序下拉
         数据源: SELECT DISTINCT sales_country_code FROM sales_pic WHERE is_active=1
         
Step 2: 选择 Sales PIC（动态过滤）
         [KAMRAN KHAN ▼]  ← 仅显示该 Country 下的 PIC
         数据源: SELECT * FROM sales_pic WHERE country_code = :selectedCountry
         
Step 3: Sales Office（自动映射）
         [A&A CARGO TRANSPORT]  ← 根据 PIC 自动填充
         逻辑: PIC.sales_office_id → dict_sales_office.name
         注: 一个 PIC 只属于一个 Office (1:1)
         ❗ 如果一个 PIC 对应多个 Office (数据异常)，显示第一个并警告
```

### 5.3 数据库变更

```sql
-- 删除 cn_pricing_admin 列
ALTER TABLE enquiry DROP COLUMN cn_pricing_admin;

-- 删除 dict_cn_pricing_admin 表
DROP TABLE IF EXISTS dict_cn_pricing_admin;
```

### 5.4 CSV 数据格式

来源：`Sales Contry+Office+salePic.csv`

| 列 5 | 列 6 | 列 7 |
|-------|------|------|
| SALESCOUNTRY | SALESOFFICE | SALESPIC |
| AGENTS | A&A CARGO TRANSPORT | KAMRAN KHAN |
| Z-BELGIUM | ZIEGLER BELGIUM | ANN ABRAMS |
| Z-CHINA | ZIEGLER HONG KONG | ANGEL TSE |

数据已导入 `sales_pic` + `dict_sales_office` 表。

---

## 6. 需求 5：CN Office Grouping

### 决策

- `assigned_cn_office_code`：**保留不变**
- `cn_office_grouping`：当前已不存在于 schema_v2 中，**无需操作**
- 后续自动组合功能（SHA+NGB、SZX+XMN）：**暂不实现**

---

## 7. 需求 6：Cargo Type 重构

### 7.1 Cargo Type 完整列表

| 旧值 | 新值 | 说明 |
|------|------|------|
| AIR | **AIR** | 保留 |
| FCL | **FCL** | 保留 |
| LCL | **LCL** | 保留 |
| RAIL | ~~删除~~ | Product 已区分 |
| SEA | ~~删除~~ | Product 已区分 |
| — | **BUYER-CONSOL** | 新增 |

### 7.2 Product × Cargo 允许组合矩阵

| Product \ Cargo | AIR | FCL | LCL | BUYER-CONSOL |
|-----------------|-----|-----|-----|--------------|
| **AIR** | ✅ | ❌ | ❌ | ❌ |
| **SEA** | ❌ | ✅ | ✅ | ✅ |
| **RAIL** | ❌ | ✅ | ✅ | ❌ |
| **RAIL-SEA** | ❌ | ✅ | ✅ | ❌ |
| **RAIL-AIR** | ✅ | ❌ | ✅ | ❌ |
| **SEA-AIR** | ✅ | ❌ | ✅ | ❌ |
| **AIR-RAIL-SEA** | ✅ | ✅ | ✅ | ❌ |

**实现方式**：前端在选择 Product Type 后，动态过滤可选的 Cargo Type 列表。

### 7.3 Offer Type 自动同步规则

| Cargo Type | Offer Type |
|------------|------------|
| AIR | AIR |
| FCL | FCL |
| LCL | LCL |
| BUYER-CONSOL | BUYER-CONSOL |

**Offer Type = Cargo Type**（直接同步），不再使用 OCEAN/OTHER 分类。

### 7.4 数据库变更

```sql
-- 更新 dict_cargo_type
DELETE FROM dict_cargo_type;
INSERT INTO dict_cargo_type (code, name, is_active) VALUES
('AIR', 'Air Freight', 1),
('FCL', 'Full Container Load', 1),
('LCL', 'Less Container Load', 1),
('BUYER-CONSOL', 'Buyer Consolidation', 1);

-- 注: 不再需要 offer_type 列于 dict_cargo_type（Offer Type = Cargo Type 直接映射）
ALTER TABLE dict_cargo_type DROP COLUMN IF EXISTS offer_type;
```

### 7.5 Category 增加选项

```sql
INSERT INTO dict_category (code, name, name_norm) VALUES
('EXW_LOCATION', 'EXW Location', 'exw location');
```

新增 enquiry 表字段：

```sql
ALTER TABLE enquiry ADD COLUMN exw_location VARCHAR(500) NULL 
  COMMENT 'EXW Location (自由文本, 当 category=EXW_LOCATION 时使用)';
```

---

## 8. 需求 7：删除字段

```sql
ALTER TABLE enquiry 
  DROP COLUMN rejected_reason,
  DROP COLUMN actual_reason;
```

原因：Lost/Cancelled 状态时已有专门的原因字段（需求 3），不再需要 post-mortem 字段。

---

## 9. 需求 8：多 POL/POD

### 当前状态

已实现，通过 `enquiry_pol` 和 `enquiry_pod` 关联表支持多对多。

### 本次确认

- 保留现有实现
- 与 Offer Price Details 配合：POL × POD 笛卡尔积自动生成报价行
- 混合模式下，每个 Route Group 有独立的 POL/POD 集合

---

## 10. 需求 9：Cargo Information 动态 UI

### 10.1 按 Cargo Type 切换字段

| Cargo Type | 显示字段 | 容器信息位置 |
|---|---|---|
| **FCL** | Commodity + Hazardous/Special | 移至 Offer → Price Details 弹窗 |
| **BUYER-CONSOL** | Commodity + Hazardous/Special | 移至 Offer → Price Details 弹窗 |
| **AIR** | Commodity + Volume(CBM) + Quantity + UOM + Hazardous/Special | 无容器列 |
| **LCL** | Commodity + Volume(CBM) + Quantity + UOM + Hazardous/Special | 无容器列 |

### 10.2 UI 设计

#### FCL / BUYER-CONSOL

```
┌─────────────────────────────────────────────────────┐
│ Cargo Information                                    │
│                                                      │
│ Cargo Type *              [FCL ▼]                    │
│ Commodity / Description   [Describe the cargo...]    │
│ Hazardous / Special Equip [DG class, UN No., ...]    │
│                                                      │
│ ⓘ Container details are in Offer → Price Details     │
└─────────────────────────────────────────────────────┘
```

#### AIR / LCL

```
┌─────────────────────────────────────────────────────┐
│ Cargo Information                                    │
│                                                      │
│ Cargo Type *              [LCL ▼]                    │
│ Commodity / Description   [Describe the cargo...]    │
│ Volume (CBM)              [120.5]                    │
│ Quantity                  [100]                      │
│ UOM                       [KG ▼]                     │
│ Hazardous / Special Equip [DG class, UN No., ...]    │
└─────────────────────────────────────────────────────┘
```

### 10.3 容器信息迁移

**当前位置**：`enquiry_container_line` 表（Enquiry 级别）
**新位置**：`offer_container_detail` 表（Offer Price Line 级别）

```
旧模型:
  Enquiry 1:N EnquiryContainerLine

新模型:
  Enquiry 1:N Offer 1:N OfferPriceLine 1:N OfferContainerDetail
```

**影响**：`enquiry_container_line` 表将废弃，由 `offer_container_detail` 替代。

---

## 11. 需求 10：Route Information 混合模式

### 11.1 普通模式（AIR / SEA / RAIL）

```
┌─────────────────────────────────────────────────────┐
│ Route Information                                    │
│                                                      │
│ Port of Loading (POL) *   [Ningbo ×] [Shanghai ×]    │
│ Port of Discharge (POD) *  [Hamburg ×] [Rotterdam ×]  │
│ POD Country               China (Auto-mapped)        │
└─────────────────────────────────────────────────────┘
```

- 使用现有的 `enquiry_pol` / `enquiry_pod` 表
- POL/POD 支持多选（标签 + 输入搜索）
- POD Country 根据选中的 POD 自动映射

### 11.2 混合模式（RAIL-SEA / RAIL-AIR / SEA-AIR / AIR-RAIL-SEA）

```
┌─────────────────────────────────────────────────────┐
│ Route Information (Mixed Mode)                       │
│                                                      │
│ ┌─ Route Group 1 ──────────────────────────────────┐ │
│ │ Sub-mode    [AIR ▼]                              │ │
│ │ 🔸 AIR mode — Airport ports only                  │ │
│ │ POL *       [PEK ×] [PVG ×]                      │ │
│ │ POD *       [NRT ×]                              │ │
│ │                                         [🗑 删除] │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Route Group 2 ──────────────────────────────────┐ │
│ │ Sub-mode    [SEA ▼]                              │ │
│ │ 🔹 SEA/Rail mode — Seaport list                   │ │
│ │ POL *       [CNNGB ×]                            │ │
│ │ POD *       [DEHAM ×] [NLRTM ×]                  │ │
│ │                                         [🗑 删除] │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ [+ Add Route Group]                                  │
│                                                      │
│ POD Country       Germany, Netherlands (Auto-mapped) │
└─────────────────────────────────────────────────────┘
```

### 11.3 数据库设计

```sql
-- 路由组主表
CREATE TABLE enquiry_route_group (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enquiry_id BIGINT NOT NULL,
  group_index INT NOT NULL DEFAULT 0 COMMENT '组序号（0开始）',
  sub_mode ENUM('AIR','SEA','RAIL') NOT NULL COMMENT '子运输模式',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enquiry_id) REFERENCES enquiry(id) ON DELETE CASCADE,
  UNIQUE KEY uk_enquiry_group (enquiry_id, group_index)
);

-- 路由组-POL 关联
CREATE TABLE enquiry_route_group_pol (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  route_group_id BIGINT NOT NULL,
  port_id INT NOT NULL,
  sequence INT NOT NULL DEFAULT 0,
  FOREIGN KEY (route_group_id) REFERENCES enquiry_route_group(id) ON DELETE CASCADE,
  FOREIGN KEY (port_id) REFERENCES port(id)
);

-- 路由组-POD 关联
CREATE TABLE enquiry_route_group_pod (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  route_group_id BIGINT NOT NULL,
  port_id INT NOT NULL,
  sequence INT NOT NULL DEFAULT 0,
  FOREIGN KEY (route_group_id) REFERENCES enquiry_route_group(id) ON DELETE CASCADE,
  FOREIGN KEY (port_id) REFERENCES port(id)
);
```

### 11.4 普通模式兼容方案

普通模式下（AIR/SEA/RAIL）：
- 仍使用 `enquiry_pol` / `enquiry_pod` 表（向后兼容）
- **不**创建 `enquiry_route_group` 记录
- Offer 生成时直接从 `enquiry_pol` × `enquiry_pod` 笛卡尔积

混合模式下：
- 使用 `enquiry_route_group` + `enquiry_route_group_pol` + `enquiry_route_group_pod`
- `enquiry_pol` / `enquiry_pod` 表不使用（或存储合并后的全集供搜索用）
- Offer 生成时按每个 Route Group 独立生成

### 11.5 港口过滤规则

| Sub-mode | 港口过滤 | API 调用 |
|----------|----------|----------|
| AIR | `port.port_type = 'AIR'` | `/api/dict/ports/search-v2?portType=AIR&keyword=` |
| SEA | `port.port_type = 'SEA'` | `/api/dict/ports/search-v2?portType=SEA&keyword=` |
| RAIL | `port.port_type = 'SEA'`（共用海港列表） | `/api/dict/ports/search-v2?portType=SEA&keyword=` |

---

## 12. 需求 11：Offer Price Details 矩阵

### 12.1 Offer 数据模型重构

```
旧模型:
  Enquiry 1:N Offer (每个 Offer = 一个价格)
      Offer: { offerType, sequenceNo, isLatest, price, priceText }

新模型:
  Enquiry 1:N Offer (每个 Offer = 一次报价，包含多个港口对的价格矩阵)
      Offer: { offerType, sequenceNo, isLatest, offerDate }
        └── 1:N OfferPriceLine (每个 POL-POD 对一行)
              OfferPriceLine: { polId, podId, subMode, perCbm, minCharge, localCharge, price }
                └── 1:N OfferContainerDetail (FCL/BUYER-CONSOL 专用)
                      OfferContainerDetail: { containerSizeType, containerType, qty, weight, price, teu }
```

### 12.2 数据库设计

```sql
-- Offer 主表（重构）
DROP TABLE IF EXISTS offer;
CREATE TABLE offer (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enquiry_id BIGINT NOT NULL,
  offer_type VARCHAR(20) NOT NULL COMMENT 'FCL/LCL/AIR/BUYER-CONSOL',
  sequence_no INT NOT NULL DEFAULT 1 COMMENT '报价序号',
  is_latest BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否最新报价',
  offer_date DATE NULL COMMENT '报价日期',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NULL,
  updated_by VARCHAR(100) NULL,
  FOREIGN KEY (enquiry_id) REFERENCES enquiry(id) ON DELETE CASCADE,
  INDEX idx_offer_enquiry (enquiry_id),
  INDEX idx_offer_latest (enquiry_id, is_latest)
);

-- Offer 价格明细行（每个 POL-POD 对一行）
CREATE TABLE offer_price_line (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  offer_id BIGINT NOT NULL,
  pol_id INT NOT NULL COMMENT 'FK → port',
  pod_id INT NOT NULL COMMENT 'FK → port',
  route_group_id BIGINT NULL COMMENT '混合模式时关联的路由组',
  sub_mode ENUM('AIR','SEA','RAIL') NULL COMMENT '混合模式时继承的子模式',
  -- 通用价格字段
  per_cbm DECIMAL(18,4) NULL COMMENT 'Per CBM 单价',
  min_charge DECIMAL(18,4) NULL COMMENT '最低收费',
  local_charge DECIMAL(18,4) NULL COMMENT '本地费用',
  price DECIMAL(18,4) NULL COMMENT '总价/AIR-LCL简化价格',
  price_text VARCHAR(500) NULL COMMENT '价格文本备注',
  is_rejected_price BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否被拒绝',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_id) REFERENCES offer(id) ON DELETE CASCADE,
  FOREIGN KEY (pol_id) REFERENCES port(id),
  FOREIGN KEY (pod_id) REFERENCES port(id),
  FOREIGN KEY (route_group_id) REFERENCES enquiry_route_group(id) ON DELETE SET NULL,
  INDEX idx_price_line_offer (offer_id),
  UNIQUE KEY uk_offer_pol_pod (offer_id, pol_id, pod_id, COALESCE(route_group_id, 0))
);

-- 容器明细（FCL/BUYER-CONSOL 专用）
CREATE TABLE offer_container_detail (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  offer_price_line_id BIGINT NOT NULL,
  container_size_type VARCHAR(20) NOT NULL COMMENT '箱型尺寸 (20GP, 40HQ, 45HQ 等)',
  container_type VARCHAR(20) NULL COMMENT '箱型类别 (GP, OT, FR, Tank, Reefer 等)',
  number_of_containers INT NOT NULL DEFAULT 0 COMMENT '箱量',
  cargo_weight_per_container DECIMAL(12,3) NULL COMMENT '每柜货重(吨)',
  container_price DECIMAL(18,4) NULL COMMENT '柜型报价',
  teu_value DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT 'TEU系数 (20=1, 40=2, 45=2.25)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_price_line_id) REFERENCES offer_price_line(id) ON DELETE CASCADE,
  INDEX idx_container_price_line (offer_price_line_id)
);
```

### 12.3 Price Details 表格 UI —— FCL / BUYER-CONSOL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Offer #1 (Latest)                                                          │
│ Offer Type: [FCL ▼]    Offer Date: [2026/03/20 📅]                         │
│                                                                             │
│ Price Details                                                               │
│ ┌──────────┬──────────┬──────┬──────┬───────┬──────┬─────────┬────────────┐ │
│ │ POL      │ POD      │ 20'  │ 40'  │ 40'HQ │ 45'  │ Per CBM │ Min Charge │...
│ ├──────────┼──────────┼──────┼──────┼───────┼──────┼─────────┼────────────┤ │
│ │ Ningbo   │ Hamburg  │ [30] │ [ ]  │ [ ]   │ [ ]  │ [ ]     │ [ ]        │...
│ │ Ningbo   │ Rotterdam│ [ ]  │ [55] │ [ ]   │ [ ]  │ [ ]     │ [ ]        │...
│ │ Shanghai │ Hamburg  │ [ ]  │ [ ]  │ [ ]   │ [ ]  │ [ ]     │ [ ]        │...
│ │ Shanghai │ Rotterdam│ [28] │ [ ]  │ [ ]   │ [ ]  │ [ ]     │ [ ]        │...
│ └──────────┴──────────┴──────┴──────┴───────┴──────┴─────────┴────────────┘ │
│                                                      [+ Add Container Type] │
│                                                                             │
│ ⓘ 空行（所有价格字段均为空）将在保存时自动删除                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**固定列**：POL | POD | 20' | 40' | 40'HQ | 45' | Per CBM | Min Charge | Local Charge | Container Type

**动态列**：点击 `[+ Add Container Type]` 新增柜型列（GP、OT、FR、Tank、Reefer 等）

**Container Details 弹窗**（点击任意柜型单元格）：

```
┌─────────────────────────────────────────┐
│ Container Details                        │
│                                          │
│ Container size type    [20'GP ▼]         │
│ Number of containers   [5]               │
│ Cargo weight / ctnr    [25.5] ton        │
│ Container Price        [_____]           │
│                                          │
│ TEU: 5.00 (= 1.00 × 5)   ← 自动计算     │
│                                          │
│ [Cancel]  [Confirm]                      │
└─────────────────────────────────────────┘
```

### 12.4 Price Details 表格 UI —— AIR / LCL

```
┌─────────────────────────────────────────────────────────────────┐
│ Offer #1 (Latest)                                               │
│ Offer Type: [AIR ▼]    Offer Date: [2026/03/20 📅]              │
│                                                                  │
│ Price Details                                                    │
│ ┌──────────┬──────────┬──────────┬────────────┬──────────────┐  │
│ │ POL      │ POD      │ Price    │ Min Charge │ Local Charge │  │
│ ├──────────┼──────────┼──────────┼────────────┼──────────────┤  │
│ │ PEK      │ NRT      │ [2.50]   │ [150]      │ [80]         │  │
│ │ PVG      │ NRT      │ [2.30]   │ [150]      │ [80]         │  │
│ └──────────┴──────────┴──────────┴────────────┴──────────────┘  │
│                                                                  │
│ 无 Container 列 / 无容器弹窗                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 12.5 混合模式特殊处理

混合模式下，每个 Route Group 单独生成 Price Lines：

```
Offer #1 (Latest) — RAIL-SEA Mixed Mode
Offer Type: [FCL ▼]    Offer Date: [2026/03/20 📅]

── Route Group 1 (RAIL) ──────────────────────
POL          POD            20'   40'   ...
CNNGB    →   KZALA          [30]  [ ]   ...

── Route Group 2 (SEA) ───────────────────────
POL          POD            20'   40'   ...
KZALA    →   DEHAM          [25]  [45]  ...
KZALA    →   NLRTM          [23]  [42]  ...
```

### 12.6 保存逻辑

1. **空行自动删除**：任何该港口对所有价格字段均为空的行 → 保存时自动剔除
2. **共享字段**：同一 Offer 下的所有 Price Lines 共享 `offer_date` 和 `offer_type`
3. **TEU 自动计算**：`line_teu = teu_value × number_of_containers`

---

## 13. 需求 12：Cargo Ready Date

### 13.1 字段设计

| 字段 | 类型 | 说明 |
|------|------|------|
| `has_specific_cargo_ready_date` | BOOLEAN DEFAULT 0 | 是否有明确的 CRD |
| `cargo_ready_date` | DATE | 具体日期 |
| `cargo_ready_date_raw_text` | VARCHAR(100) | **改名显示**: Cargo Ready Date Details (TBA/Week etc.) |

### 13.2 UI 逻辑

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│ ☐ Any Cargo Ready Date                               │
│                                                      │
│ [当勾选 ✅ 时:]                                       │
│ Cargo Ready Date *       [2026/03/20 📅]              │
│                                                      │
│ [未勾选时:]                                           │
│ (隐藏日期选择器, CRD = Enquiry Created Date)           │
│                                                      │
│ Cargo Ready Date Details (TBA/Week etc.)              │
│ [Always visible input field...]                       │
└─────────────────────────────────────────────────────┘
```

### 13.3 保存逻辑

| 勾选状态 | cargo_ready_date | has_specific_cargo_ready_date |
|----------|-----------------|-------------------------------|
| 未勾选 | = issue_date（创建日期） | 0 |
| 已勾选 | = 用户选择的日期 | 1 |

### 13.4 数据库变更

```sql
ALTER TABLE enquiry ADD COLUMN has_specific_cargo_ready_date 
  BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否有明确的 Cargo Ready Date';
```

---

## 14. Product × Cargo 允许组合矩阵

```
Products
├── AIR
│   └── AIR (唯一选项)
├── SEA
│   ├── FCL
│   ├── LCL
│   └── BUYER-CONSOL
├── RAIL
│   ├── FCL
│   └── LCL
├── RAIL-SEA
│   ├── FCL
│   └── LCL
├── RAIL-AIR
│   ├── AIR
│   └── LCL
├── SEA-AIR
│   ├── AIR
│   └── LCL
└── AIR-RAIL-SEA
    ├── AIR
    ├── FCL
    └── LCL
```

**前端实现**：`PRODUCT_CARGO_MAP` 常量

```typescript
const PRODUCT_CARGO_MAP: Record<ProductCode, CargoType[]> = {
  'AIR':          ['AIR'],
  'SEA':          ['FCL', 'LCL', 'BUYER-CONSOL'],
  'RAIL':         ['FCL', 'LCL'],
  'RAIL-SEA':     ['FCL', 'LCL'],
  'RAIL-AIR':     ['AIR', 'LCL'],
  'SEA-AIR':      ['AIR', 'LCL'],
  'AIR-RAIL-SEA': ['AIR', 'FCL', 'LCL'],
};
```

**行为**：
1. 用户选择 Product Type
2. Cargo Type 下拉列表自动过滤为允许的选项
3. 若当前 Cargo Type 不在允许列表中 → 自动切换为第一个允许选项
4. Offer Type 自动 = Cargo Type

---

## 15. 完整数据库 DDL（新版）

> 以下为 **schema_v3.sql** 的完整 DDL，包含所有变更。

```sql
-- ============================================================
-- LogiTrack Pro - MySQL 数据库表结构 v3
-- 日期: 2026-03-23
-- 变更摘要:
--   1. enquiry.status 改为 5 值枚举
--   2. 删除 booking_confirmed / cn_pricing_admin / rejected_reason / actual_reason / enquiry_offer_type
--   3. 新增 cancelled_reason / lost_reason / has_specific_cargo_ready_date / exw_location
--   4. dict_product 扩展至 7 种
--   5. dict_cargo_type 改为 4 种 (删 RAIL/SEA, 加 BUYER-CONSOL)
--   6. 新增 enquiry_route_group 系列表 (混合模式)
--   7. offer 表重构为 offer + offer_price_line + offer_container_detail
--   8. 删除 dict_cn_pricing_admin
--   9. 新增 dict_cancelled_reason / dict_lost_reason
-- ============================================================

-- === 基础字典表（不变）===

CREATE TABLE IF NOT EXISTS country (
  id INT PRIMARY KEY AUTO_INCREMENT,
  country_code CHAR(2) NOT NULL UNIQUE COMMENT 'ISO 3166-1 alpha-2',
  country_name_en VARCHAR(100) NOT NULL,
  country_name_cn VARCHAR(100) NULL,
  is_core BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否核心国家',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS port (
  id INT PRIMARY KEY AUTO_INCREMENT,
  port_code VARCHAR(20) NOT NULL,
  port_name VARCHAR(200) NOT NULL,
  port_type ENUM('AIR','SEA') NOT NULL DEFAULT 'SEA',
  country_code CHAR(2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_port_code (port_code),
  INDEX idx_port_country (country_code),
  INDEX idx_port_type (port_type)
);

CREATE TABLE IF NOT EXISTS dict_sales_office (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  name_norm VARCHAR(200) NOT NULL UNIQUE,
  country_code VARCHAR(20) NULL COMMENT '关联 sales_country_code',
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_pic (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  name_norm VARCHAR(200) NOT NULL,
  country_code VARCHAR(20) NOT NULL COMMENT '关联 sales_country_code',
  sales_office_id INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_office_id) REFERENCES dict_sales_office(id),
  UNIQUE KEY uk_pic_country_office (name_norm, country_code, sales_office_id)
);

CREATE TABLE IF NOT EXISTS container_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  container_code VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(100) NULL,
  teu_value DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  is_special BOOLEAN NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dict_cn_office (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1
);

-- dict_cargo_type v3 (4 种, 无 offer_type 列)
CREATE TABLE IF NOT EXISTS dict_cargo_type (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1
);

-- dict_product v3 (7 种)
CREATE TABLE IF NOT EXISTS dict_product (
  code VARCHAR(30) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  abbr VARCHAR(10) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS dict_uom (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS dict_category (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  name_norm VARCHAR(200) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1
);

-- === 原因字典表（新增）===

CREATE TABLE IF NOT EXISTS dict_cancelled_reason (
  code VARCHAR(50) PRIMARY KEY,
  label VARCHAR(200) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dict_lost_reason (
  code VARCHAR(100) PRIMARY KEY,
  label VARCHAR(200) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- === 业务核心表 ===

-- enquiry v3
CREATE TABLE IF NOT EXISTS enquiry (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  
  -- 基础信息
  reference_number VARCHAR(50) NOT NULL UNIQUE,
  enquiry_received_date DATE NOT NULL,
  issue_date DATE NOT NULL COMMENT '即 Enquiry Created Date',
  reference_month CHAR(4) NOT NULL COMMENT 'YYMM',
  monthly_sequence INT NOT NULL,
  serial_number INT NOT NULL DEFAULT 0,
  
  -- 产品 & 状态
  product_code VARCHAR(30) NOT NULL COMMENT 'FK → dict_product',
  product_abbr VARCHAR(10) NOT NULL,
  status ENUM('New','Quoted & Pending','Secured','Lost','Cancelled') NOT NULL DEFAULT 'New',
  
  -- 取消/丢单原因
  cancelled_reason VARCHAR(50) NULL COMMENT 'FK → dict_cancelled_reason',
  cancelled_reason_text TEXT NULL COMMENT 'Others 时的自由文本',
  lost_reason VARCHAR(100) NULL COMMENT 'FK → dict_lost_reason',
  lost_reason_text TEXT NULL COMMENT 'Others 时的自由文本',
  
  -- 销售信息（删除了 cn_pricing_admin）
  sales_country_code VARCHAR(20) NOT NULL COMMENT '如 AGENTS, Z-BELGIUM 等',
  sales_office_id INT NOT NULL COMMENT 'FK → dict_sales_office',
  sales_pic_id INT NULL COMMENT 'FK → sales_pic',
  
  -- CN 办公室
  assigned_cn_office_code VARCHAR(50) NOT NULL COMMENT 'FK → dict_cn_office',
  
  -- 货物信息
  cargo_type_code VARCHAR(20) NOT NULL COMMENT 'FK → dict_cargo_type (AIR/FCL/LCL/BUYER-CONSOL)',
  volume_cbm DECIMAL(12,3) NULL,
  volume_raw_text VARCHAR(100) NULL,
  quantity DECIMAL(12,3) NULL,
  quantity_raw_text VARCHAR(100) NULL,
  quantity_uom_code VARCHAR(20) NULL COMMENT 'FK → dict_uom',
  quantity_uom_raw_text VARCHAR(200) NULL,
  quantity_teu DECIMAL(12,3) NULL,
  quantity_teu_raw_text VARCHAR(100) NULL,
  commodity TEXT NULL,
  haz_special_equipment TEXT NULL COMMENT '危险品/特殊设备信息',
  
  -- 路线信息 (普通模式用, 混合模式用 route_group)
  pol_id INT NULL COMMENT 'Legacy, 普通模式保留兼容',
  pod_id INT NULL COMMENT 'Legacy, 普通模式保留兼容',
  pod_country_code CHAR(2) NULL COMMENT '自动映射',
  
  -- 核心/分类
  core_flag ENUM('CORE','NON_CORE') NULL,
  category_code VARCHAR(50) NULL COMMENT 'FK → dict_category',
  exw_location VARCHAR(500) NULL COMMENT 'EXW Location 自由文本',
  
  -- Cargo Ready Date
  has_specific_cargo_ready_date BOOLEAN NOT NULL DEFAULT 0,
  cargo_ready_date DATE NULL COMMENT '未勾选时 = issue_date',
  cargo_ready_date_raw_text VARCHAR(100) NULL COMMENT 'TBA/Week 等补充说明',
  
  -- 其他
  additional_requirement TEXT NULL,
  remark TEXT NULL,
  
  -- 预留字段
  reserve_field_1 VARCHAR(255) NULL,
  reserve_field_2 VARCHAR(255) NULL,
  reserve_field_3 VARCHAR(255) NULL,
  reserve_field_4 VARCHAR(255) NULL,
  reserve_field_5 VARCHAR(255) NULL,
  
  -- 审计
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NULL,
  updated_by VARCHAR(100) NULL,
  
  -- 索引
  INDEX idx_enquiry_reference_month (reference_month),
  INDEX idx_enquiry_status (status),
  INDEX idx_enquiry_product (product_code),
  INDEX idx_enquiry_cargo_type (cargo_type_code),
  INDEX idx_enquiry_sales_country (sales_country_code),
  INDEX idx_enquiry_cn_office (assigned_cn_office_code)
);

-- 多港口关联（普通模式）
CREATE TABLE IF NOT EXISTS enquiry_pol (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enquiry_id BIGINT NOT NULL,
  port_id INT NOT NULL,
  sequence INT NOT NULL DEFAULT 0,
  FOREIGN KEY (enquiry_id) REFERENCES enquiry(id) ON DELETE CASCADE,
  FOREIGN KEY (port_id) REFERENCES port(id),
  UNIQUE KEY uk_enquiry_pol (enquiry_id, port_id)
);

CREATE TABLE IF NOT EXISTS enquiry_pod (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enquiry_id BIGINT NOT NULL,
  port_id INT NOT NULL,
  sequence INT NOT NULL DEFAULT 0,
  FOREIGN KEY (enquiry_id) REFERENCES enquiry(id) ON DELETE CASCADE,
  FOREIGN KEY (port_id) REFERENCES port(id),
  UNIQUE KEY uk_enquiry_pod (enquiry_id, port_id)
);

-- 混合模式路由组
CREATE TABLE IF NOT EXISTS enquiry_route_group (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enquiry_id BIGINT NOT NULL,
  group_index INT NOT NULL DEFAULT 0,
  sub_mode ENUM('AIR','SEA','RAIL') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enquiry_id) REFERENCES enquiry(id) ON DELETE CASCADE,
  UNIQUE KEY uk_enquiry_group (enquiry_id, group_index)
);

CREATE TABLE IF NOT EXISTS enquiry_route_group_pol (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  route_group_id BIGINT NOT NULL,
  port_id INT NOT NULL,
  sequence INT NOT NULL DEFAULT 0,
  FOREIGN KEY (route_group_id) REFERENCES enquiry_route_group(id) ON DELETE CASCADE,
  FOREIGN KEY (port_id) REFERENCES port(id)
);

CREATE TABLE IF NOT EXISTS enquiry_route_group_pod (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  route_group_id BIGINT NOT NULL,
  port_id INT NOT NULL,
  sequence INT NOT NULL DEFAULT 0,
  FOREIGN KEY (route_group_id) REFERENCES enquiry_route_group(id) ON DELETE CASCADE,
  FOREIGN KEY (port_id) REFERENCES port(id)
);

-- Offer v3 (主表)
CREATE TABLE IF NOT EXISTS offer (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enquiry_id BIGINT NOT NULL,
  offer_type VARCHAR(20) NOT NULL COMMENT 'FCL/LCL/AIR/BUYER-CONSOL',
  sequence_no INT NOT NULL DEFAULT 1,
  is_latest BOOLEAN NOT NULL DEFAULT 0,
  offer_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NULL,
  updated_by VARCHAR(100) NULL,
  FOREIGN KEY (enquiry_id) REFERENCES enquiry(id) ON DELETE CASCADE,
  INDEX idx_offer_enquiry (enquiry_id),
  INDEX idx_offer_latest (enquiry_id, is_latest)
);

-- Offer 价格明细行
CREATE TABLE IF NOT EXISTS offer_price_line (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  offer_id BIGINT NOT NULL,
  pol_id INT NOT NULL,
  pod_id INT NOT NULL,
  route_group_id BIGINT NULL,
  sub_mode ENUM('AIR','SEA','RAIL') NULL,
  per_cbm DECIMAL(18,4) NULL,
  min_charge DECIMAL(18,4) NULL,
  local_charge DECIMAL(18,4) NULL,
  price DECIMAL(18,4) NULL COMMENT 'AIR/LCL 简化价格',
  price_text VARCHAR(500) NULL,
  is_rejected_price BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_id) REFERENCES offer(id) ON DELETE CASCADE,
  FOREIGN KEY (pol_id) REFERENCES port(id),
  FOREIGN KEY (pod_id) REFERENCES port(id),
  INDEX idx_price_line_offer (offer_id)
);

-- Offer 容器明细
CREATE TABLE IF NOT EXISTS offer_container_detail (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  offer_price_line_id BIGINT NOT NULL,
  container_size_type VARCHAR(20) NOT NULL COMMENT '20GP, 40HQ, 45HQ 等',
  container_type VARCHAR(20) NULL COMMENT 'GP, OT, FR, Tank, Reefer 等',
  number_of_containers INT NOT NULL DEFAULT 0,
  cargo_weight_per_container DECIMAL(12,3) NULL COMMENT '每柜货重(吨)',
  container_price DECIMAL(18,4) NULL COMMENT '柜型报价',
  teu_value DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT 'TEU系数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_price_line_id) REFERENCES offer_price_line(id) ON DELETE CASCADE,
  INDEX idx_container_price_line (offer_price_line_id)
);

-- === RBAC 表（不变）===

CREATE TABLE IF NOT EXISTS user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NULL,
  email VARCHAR(100) NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_code VARCHAR(50) NOT NULL UNIQUE,
  role_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  permissions TEXT NULL COMMENT 'JSON array of permission strings'
);

CREATE TABLE IF NOT EXISTS user_role (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100) NULL,
  old_value TEXT NULL,
  new_value TEXT NULL,
  details TEXT NULL,
  ip_address VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_username (username),
  INDEX idx_audit_resource (resource_type, resource_id),
  INDEX idx_audit_created (created_at)
);

-- === 初始数据 ===

-- Products v3
INSERT INTO dict_product (code, name, abbr, is_active) VALUES
('AIR', 'Air Freight', 'A', 1),
('SEA', 'Sea Freight', 'S', 1),
('RAIL', 'Rail Freight', 'R', 1),
('RAIL-SEA', 'Rail-Sea Combined', 'RS', 1),
('RAIL-AIR', 'Rail-Air Combined', 'RA', 1),
('SEA-AIR', 'Sea-Air Combined', 'SA', 1),
('AIR-RAIL-SEA', 'Air-Rail-Sea Combined', 'ARS', 1);

-- Cargo Types v3
INSERT INTO dict_cargo_type (code, name, is_active) VALUES
('AIR', 'Air Freight', 1),
('FCL', 'Full Container Load', 1),
('LCL', 'Less Container Load', 1),
('BUYER-CONSOL', 'Buyer Consolidation', 1);

-- Cancelled Reasons
INSERT INTO dict_cancelled_reason (code, label, sort_order) VALUES
('HUMAN_ERROR', 'Human Error', 1),
('WITHDRAW', 'Withdraw enquiry', 2),
('OTHERS', 'Others - reason required (Free text)', 3);

-- Lost Reasons
INSERT INTO dict_lost_reason (code, label, sort_order) VALUES
('CANCEL_NVOCC', 'Cancel Booking - arranged by other NVOCC', 1),
('CANCEL_AIR', 'Cancel Booking - arranged by Air', 2),
('CANCEL_SEA', 'Cancel Booking - arranged by Sea', 3),
('CANCEL_TRAIN', 'Cancel Booking - arranged by Train', 4),
('CANCEL_PO', 'Cancel Booking - PO Cancelled', 5),
('PRODUCTION', 'Production problem', 6),
('RATE_CHECK_INDICATION', 'Rate Checking - For indication only', 7),
('RATE_CHECK_NO_FEEDBACK', 'Rate Checking - No feedback from customer', 8),
('RATE_ISSUE_FREIGHT', 'Rate Issue-freight', 9),
('RATE_ISSUE_LOCAL', 'Rate Issue-local charges', 10),
('SPACE_ISSUE', 'Space Issue', 11),
('OTHERS', 'Others - reason required (Free text)', 12);

-- CN Offices
INSERT INTO dict_cn_office (code, name) VALUES
('SHANGHAI', 'Shanghai'), ('SHENZHEN', 'Shenzhen'),
('NINGBO', 'Ningbo'), ('HONG KONG', 'Hong Kong'),
('TIANJIN', 'Tianjin'), ('QINGDAO', 'Qingdao'),
('XIAMEN', 'Xiamen'), ('CN-MULTI', 'CN Multi-Office');

-- UOM
INSERT INTO dict_uom (code, name) VALUES
('KG', 'Kilogram'), ('PCS', 'Pieces'), ('CTN', 'Carton'),
('PLT', 'Pallet'), ('SET', 'Set');

-- Categories v3
INSERT INTO dict_category (code, name, name_norm) VALUES
('ORIGIN_CHARGES_EXW', 'Origin Charges (EXW)', 'origin charges (exw)'),
('OCEAN_FREIGHT', 'Ocean Freight', 'ocean freight'),
('AIR_FREIGHT', 'Air Freight', 'air freight'),
('AIR_FREIGHT_ORIGIN', 'Air Freight + Origin', 'air freight + origin'),
('OCEAN_FREIGHT_ORIGIN', 'Ocean Freight + Origin', 'ocean freight + origin'),
('LCL', 'LCL', 'lcl'),
('OCEAN_FREIGHT_ORIGIN_DEST', 'Ocean Freight + Origin + Dest', 'ocean freight + origin + dest'),
('DEST_CHARGES', 'Destination Charges', 'destination charges'),
('EXW_LOCATION', 'EXW Location', 'exw location');

-- Container Types
INSERT INTO container_types (container_code, teu_value, is_special) VALUES
('20GP', 1.00, 0), ('40GP', 2.00, 0), ('40HQ', 2.00, 0), ('40HC', 2.00, 0),
('45HQ', 2.25, 0), ('20RF', 1.00, 1), ('40RF', 2.00, 1),
('20OT', 1.00, 1), ('40OT', 2.00, 1), ('20FR', 1.00, 1), ('40FR', 2.00, 1);

-- RBAC 初始数据
INSERT INTO role (role_code, role_name, description, permissions) VALUES
('ADMIN_USER', 'Administrator', '全权限', '["enquiry:read","enquiry:create","enquiry:update","enquiry:delete","master:read","master:write","report:read","report:export","settings:read","settings:write","ai:read"]'),
('OPERATING_USER', 'Operating User', '操作用户', '["enquiry:read","enquiry:create","enquiry:update","master:read","master:write","report:read","ai:read"]'),
('NORMAL_USER', 'Normal User', '普通用户', '["enquiry:read"]');
```

---

## 16. V3 Phase 5 实施记录 — UI 功能测试与 Bug 修复 (2026-03-25)

> 本章节记录 V3 Phase 4-5 实际用户测试过程中发现并修复的所有功能问题，
> 作为设计文档的**实施补充**，确保设计与实现完全一致。

### 16.1 Offer Price Details 矩阵 — 实现细节补充

#### 16.1.1 `[+ Add Container Type]` 动态列功能

**设计文档 §12.3 原始规格**：提及 `[+ Add Container Type]` 按钮，但未详述交互细节。

**实际实现**（`OfferPriceTable.tsx`）：

| 特性 | 实现 |
|------|------|
| 默认列 | `20GP (20')`, `40GP (40')`, `40HQ (40'HQ)`, `45HQ (45')` — 4 列始终显示 |
| 添加入口 | 表格右下角 `[+ Add Container Type]` 按钮，点击弹出浮动选择器 |
| 可选箱型 | 从 `container_types` DB 表动态加载（11 条记录），排除已显示列 |
| 选择器展示 | 每项显示 `label + (TEU x.xx)`，如 "20RF - 20' Reefer (TEU 1.00)" |
| 新列行为 | 选中后即时添加为表格新列，列头带鼠标悬停红色 × 移除按钮 |
| 状态管理 | `extraSizeCodes: string[]` state 管理动态添加的列 |
| 数据持久化 | 已有数据中的非默认箱型列也会自动显示 |

#### 16.1.2 Total TEU 核算功能

**设计文档 §12.6 原始规格**：提及 `line_teu = teu_value × number_of_containers`。

**实际实现**：

| 层级 | 计算公式 | 展示位置 |
|------|----------|----------|
| 单行 TEU | `Σ(containerDetail.teuValue × containerDetail.numberOfContainers)` | 表格最右"Line TEU"列 |
| 总计 TEU | `Σ(所有 priceLine 的所有 containerDetail 的 TEU)` | 表头右上角 `📦 Total TEU: x.xx` badge |
| 弹窗 TEU | `teuFactor × numberOfContainers` | ContainerDetailDialog 蓝色提示区 |

**TEU 系数来源**：
- 优先使用 `container_types` DB 表的 `teu_value` 字段
- 通过 `containerTypes` prop 传入，由 `teuLookup: Record<string, number>` 缓存
- Fallback 默认值: 20GP=1.0, 40GP=2.0, 40HQ=2.0, 45HQ=2.25

#### 16.1.3 Container Types 数据库关联

**实现**：
- 前端 API: `masterDataApi.getContainerTypes()` → `ContainerTypeSelectOption[]`
- 后端 API: `GET /api/dict/container-types` → 11 条记录
- DTO 格式: `{ value: "1", label: "20GP - 20' General Purpose", teuValue: 1.00, isSpecial: false }`
- 前端接口: `ContainerTypeSelectOption extends SelectOption { teuValue: number; isSpecial: boolean }`

### 16.2 混合模式 Route Group — 实现问题与修复

#### 16.2.1 Route Group 分组显示修复

**问题**：Offer Price Details 中仅显示 "Route Group 1 (RAIL)"，Route Group 2 (SEA) 缺失。

**根因分析**：
- `RouteGroup` 接口的 `id` 字段为 `number | undefined`（新建时无 DB id）
- `generatePriceLinesFromPorts()` 使用 `rg.id` 作为 `routeGroupId`，结果为 `undefined`
- `OfferPriceTable` 按 `routeGroupId` 分组时，所有行的 `routeGroupId` 均为 `undefined`，被归入同一组

**修复方案**：
```typescript
// 修改前（错误）
routeGroupId: rg.id,        // undefined for new groups

// 修改后（正确）
routeGroupId: rg.groupIndex, // 0, 1, 2... always defined
```

- 同步修改 `OfferPriceTable` 分组匹配: `g.id === gid` → `g.groupIndex === gid`

#### 16.2.2 港口名称显示为 "Port#104" 问题

**问题**：Route Group 中选择的港口在 Price Details 表中显示为 `Port#104`。

**根因分析**：
- `RouteGroupEditor` 使用独立的 `portOptions` 状态管理港口选项
- 选中的港口 ID 未同步到 `EnquiryForm` 的 `ports` 状态
- `OfferPriceTable.getPortLabel()` 在 `ports` 中找不到对应 ID，fallback 为 `Port#${id}`

**修复方案**：
```typescript
// RouteGroupEditor onChange 回调中新增:
const allPortIds: number[] = [];
groups.forEach(rg => {
  (rg.polIds || []).forEach(id => allPortIds.push(Number(id)));
  (rg.podIds || []).forEach(id => allPortIds.push(Number(id)));
});
if (allPortIds.length > 0) {
  ensurePortsLoaded(allPortIds);  // 同步到主 ports 状态
}
```

### 16.3 Route Information UI — 混合模式布局优化

#### 16.3.1 三层 POL/POD 问题

**问题**：混合产品同时显示顶层 POL/POD 选择器 + Route Group 中各 Leg 的 POL/POD，造成三层选择器冗余。

**修复方案**：
```
非混合模式（SEA, AIR, RAIL）:
  ├─ POL 多选器
  ├─ POD 多选器
  ├─ POD Country - Auto Mapped
  └─ (无 Route Groups)

混合模式（RAIL-SEA, SEA-AIR 等）:
  ├─ (隐藏顶层 POL/POD)
  ├─ Route Groups Editor
  │   ├─ Leg 1 [RAIL] → POL(RAIL) + POD(RAIL)
  │   └─ Leg 2 [SEA]  → POL(SEA)  + POD(SEA)
  └─ POD Country - Auto Mapped（位于 Route Groups 下方）
```

#### 16.3.2 POD Country 自动映射

**问题**：Route Group 中选择的 POD 未触发 POD Country 国家映射。

**修复方案**：
```typescript
// RouteGroupEditor onChange 中新增:
const allPodIds: number[] = [];
groups.forEach(rg => {
  (rg.podIds || []).forEach(id => allPodIds.push(Number(id)));
});
if (allPodIds.length > 0) {
  updatePodCountries(allPodIds);  // 自动映射国家
}
```

- 多国显示格式: "Andorra, United Arab Emirates"（逗号分隔）

#### 16.3.3 POD Country 显示位置

**问题**：混合模式下 POD Country 显示在 Route Groups 上方，提示"Select POD in Route Groups below"但 Route Groups 在下面，用户体验不佳。

**修复方案**：
- 非混合模式: POD Country 在 POL/POD 选择器下方（原位）
- 混合模式: POD Country 移到 Route Groups 编辑器**下方**
- 提示文字: "Select POD in Route Groups above" → 引导方向正确

### 16.4 保存验证逻辑 — 混合模式兼容

#### 16.4.1 原始问题

**问题**：隐藏顶层 POL/POD 后，保存时验证 `polIds.length === 0` 失败，弹出 "Please select Port of Loading (POL)"。

#### 16.4.2 修复方案

```typescript
const mixed = isMixedProduct((formData.productCode || 'SEA') as ProductCode);

if (mixed) {
  // 混合模式: 验证每个 Route Group 的 POL/POD
  const rgs = formData.routeGroups || [];
  if (rgs.length === 0 || rgs.some(rg => !rg.polIds?.length)) {
    alert('Please select POL in each Route Group');
    return;
  }
  if (rgs.some(rg => !rg.podIds?.length)) {
    alert('Please select POD in each Route Group');
    return;
  }
  // 自动汇总: 所有 Route Group 的 polIds/podIds → 顶层
  formData.polIds = [...new Set(rgs.flatMap(rg => rg.polIds.map(Number)))];
  formData.podIds = [...new Set(rgs.flatMap(rg => rg.podIds.map(Number)))];
} else {
  // 普通模式: 原有验证逻辑
  if (!formData.polIds?.length) { alert('Please select POL'); return; }
  if (!formData.podIds?.length) { alert('Please select POD'); return; }
}
```

### 16.5 变更文件汇总

| 文件 | 操作 | 关键变更 |
|------|------|----------|
| `OfferPriceTable.tsx` | 重写 (543行) | 动态容器列、TEU 计算、DB 关联、分组显示修复 |
| `EnquiryForm.tsx` | 修改 (1437行) | 混合模式验证、POL/POD 条件显示、POD Country 位置调整、Route Group 联动 |
| `RouteGroupEditor.tsx` | 已有 (224行) | 无代码变更，通过 onChange 回调增强联动 |
| `types.ts` | 已有 | ContainerTypeSelectOption 接口 |
| `constants.ts` | 已有 | needsContainerDetails(), CONTAINER_CARGO_TYPES |
| `services/api.ts` | 已有 | masterDataApi.getContainerTypes() |
