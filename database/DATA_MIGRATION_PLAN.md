# Chinese Pricing CSV 数据迁移方案

> 文档日期：2026-02-28  
> 数据源文件：`China Pricing - Enquiry Record-working(Rate Enquiry Summary).csv`  
> 目标数据库：MySQL `logitrack`（基于 schema_v2.sql）

---

## 1. 数据源概况

| 项目 | 值 |
|---|---|
| 文件格式 | CSV（逗号分隔，UTF-8 BOM，含特殊字符需 errors='replace'） |
| 总行数 | 14,447 行（第1行=字段描述，第2行=列标题，有效数据行=14,040） |
| 有效列数 | 33 列（Col[0]~Col[32]），其余为空列 |
| 唯一 Reference Number | 14,040 条记录 |

### 1.1 CSV 列索引对照表

| 列索引 | CSV 列名 | 说明 |
|:---:|---|---|
| 0 | Enquiry Received Date | 询价接收日期 |
| 1 | Issue Date | 创建日期 |
| 2 | Reference Number | 询价编号 |
| 3 | Product | 产品类型 |
| 4 | Status (New/Quoted) | 状态 |
| 5 | CN Pricing Admin | CN定价管理员 |
| 6 | Sales Country | 销售国家 |
| 7 | Sales office | 销售办公室 |
| 8 | Sales PIC | 销售负责人 |
| 9 | Assigned CN Offices | 指派CN办公室 |
| 10 | Cargo Type | 运输类型 |
| 11 | Volume (CBM) | 体积 |
| 12 | Quantity | 数量 |
| 13 | Quantity (Unit) | 数量单位 |
| 14 | Quantity (TEU) | TEU |
| 15 | Commodity | 品名 |
| 16 | Haz, Special Equipment | 危险品/特殊设备 |
| 17 | POL | 起运港 |
| 18 | POD | 目的港 |
| 19 | POD Country | 目的港国家 |
| 20 | CORE / NON CORE | 核心标识 |
| 21 | Category | 分类 |
| 22 | Cargo Ready Date | 货好日期 |
| 23 | Additional Requirement | 附加要求 |
| 24 | 1st Quotation Sent | 首次报价发送日期 |
| 25 | 1st Offer: Ocean Frg | 首次海运报价 |
| 26 | 1st Offer: Air Frg/KG | 首次空运报价/KG |
| 27 | Lastest Offer: Ocean Frg | 最新海运报价 |
| 28 | Lastest Offer: Air Frg/KG | 最新空运报价/KG |
| 29 | Booking Confirmed | 订舱确认 |
| 30 | Remark | 备注 |
| 31 | Rejected Reason | 拒绝原因 |
| 32 | Actual Reason | 实际原因 |

---

## 2. 目标表结构与数据流向

数据迁移涉及 **4 张目标表**：

```
CSV Source
   │
   ├──▶ enquiry（询价主表）           ── 14,040 行
   │
   ├──▶ enquiry_pol（起运港关联表）    ── 通过 POL 列解析，写入 port 匹配
   │
   ├──▶ enquiry_pod（目的港关联表）    ── 通过 POD 列解析，写入 port 匹配
   │
   ├──▶ enquiry_container_line（箱型明细表） ── 从 Quantity(Unit) 中的柜型数据解析
   │
   └──▶ offer（报价子表）             ── 从4列报价数据解析
```

前置依赖（字典/主数据表，需预先初始化）：
- `country` — 国家表
- `port` — 港口/机场表
- `dict_sales_office` — 销售办公室字典
- `sales_pic` — 销售负责人表
- `dict_cn_office` — CN办公室字典
- `dict_cargo_type` — 运输类型字典
- `dict_product` — 产品字典
- `dict_uom` — 单位字典
- `dict_category` — 分类字典
- `container_types` — 箱型配置表

---

## 3. 字段映射详细规则

### 3.1 enquiry 主表字段映射

| 目标字段 | 来源列 | 映射/转换规则 |
|---|---|---|
| `reference_number` | Col[2] Reference Number | 直接写入（去前后空格） |
| `enquiry_received_date` | Col[0] Enquiry Received Date | 解析日期格式（`2 Jan 2024` → `2024-01-02`），失败则记录错误 |
| `issue_date` | Col[1] Issue Date | 同上解析日期 |
| `reference_month` | 派生自 issue_date | `DATE_FORMAT(issue_date, '%y%m')` → 如 `2401` |
| `monthly_sequence` | 派生 | 按 `reference_month` 分组递增（从CSV按顺序分配） |
| `serial_number` | 派生自 reference_number | 解析尾号：`CN2401006-A` → 0，`CN2401017-S1` → 1 |
| `product_code` | Col[3] Product | 直接映射 `dict_product.code`（AIR/SEA/RAIL/SEA-AIR/RAIL-SEA/RAIL-AIR/AIR-RAIL-SEA） |
| `product_abbr` | 派生自 product_code | 从 `dict_product.abbr` 查找（A/S/R/SA/RS/RA/ARS） |
| `status` | Col[4] Status | 清洗后映射：`New` → New，`Quoted` → Quoted，`Cancelled` → Cancelled |
| `cn_pricing_admin` | Col[5] CN Pricing Admin | 直接写入（TRIM） |
| `sales_country_code` | Col[6] Sales Country | 映射规则见 §3.1.1 |
| `sales_office_id` | Col[7] Sales office | 通过 `dict_sales_office.name_norm` 匹配获取ID |
| `sales_pic_id` | Col[8] Sales PIC | 通过 `sales_pic.name_norm + country_code` 匹配获取ID |
| `assigned_cn_office_code` | Col[9] Assigned CN Offices | 直接映射 `dict_cn_office.code`（UPPER+TRIM） |
| `cargo_type_code` | Col[10] Cargo Type | 直接映射 `dict_cargo_type.code`（AIR/FCL/LCL/RAIL/SEA） |
| `volume_cbm` | Col[11] Volume (CBM) | 尝试解析为 DECIMAL；成功则写入数值 |
| `volume_raw_text` | Col[11] Volume (CBM) | 如解析失败（TBA/文本），原始值存入 raw_text，volume_cbm=NULL |
| `quantity` | Col[12] Quantity | 尝试解析数值（移除逗号 `2,131.5` → `2131.5`） |
| `quantity_raw_text` | Col[12] Quantity | 解析失败时保存原始文本 |
| `quantity_uom_code` | Col[13] Quantity (Unit) | **仅当值为 `KG` 时**写入 `KG`；柜型和其他值不写入此字段 |
| `quantity_uom_raw_text` | Col[13] Quantity (Unit) | 始终保存原始值（用于追溯） |
| `quantity_teu` | Col[14] Quantity (TEU) | 尝试解析数值 |
| `quantity_teu_raw_text` | Col[14] Quantity (TEU) | 解析失败时保存原始文本 |
| `commodity` | Col[15] Commodity | 直接写入 |
| `haz_special_equipment` | Col[16] Haz, Special Equipment | 直接写入 |
| `pol_id` | Col[17] POL | **不直接写入 enquiry 表**，通过 enquiry_pol 表关联（见 §3.2） |
| `pod_id` | Col[18] POD | **不直接写入 enquiry 表**，通过 enquiry_pod 表关联（见 §3.2） |
| `pod_country_code` | Col[19] POD Country | 直接写入国家名（需清洗匹配）；复合国家如 `BELGIUM/FRANCE` 取第一个 |
| `core_flag` | Col[20] CORE / NON CORE | `CORE` → CORE，`NON CORE` → NON_CORE |
| `category_code` | Col[21] Category | 通过 `dict_category.name_norm`（UPPER+TRIM）匹配获取 code |
| `cargo_ready_date` | Col[22] Cargo Ready Date | 尝试解析日期，成功则写入 |
| `cargo_ready_date_raw_text` | Col[22] Cargo Ready Date | 无法解析（TBA/Week 5等）时存原始值 |
| `additional_requirement` | Col[23] Additional Requirement | 直接写入 |
| `booking_confirmed` | Col[29] Booking Confirmed | 规范化大小写：Yes/Rejected/Pending/Invalid |
| `remark` | Col[30] Remark | 直接写入 |
| `rejected_reason` | Col[31] Rejected Reason | 直接写入 |
| `actual_reason` | Col[32] Actual Reason | 直接写入 |
| `enquiry_offer_type` | 派生自 cargo_type_code | 从 `dict_cargo_type.offer_type` 写入（OCEAN/AIR/OTHER） |

#### 3.1.1 Sales Country 映射规则

CSV 中 Sales Country 有 14 个唯一值，映射到 `sales_country_code`：

| CSV 值 | sales_country_code |
|---|---|
| AGENTS | AGENTS |
| BELGIUM | BE |
| CHINA | CN |
| FRANCE | FR |
| GERMANY | DE |
| GREECE | GR |
| MOROCCO | MA |
| NETHERLANDS | NL |
| OTHERS | OTHERS |
| POLAND | PL |
| SOUTH_AFRICA | ZA |
| SWITZERLAND | CH |
| UK | GB |
| USA | US |

> 注：`AGENTS` 和 `OTHERS` 为特殊值，不对应 ISO 国家代码。

---

### 3.2 enquiry_pol / enquiry_pod（港口关联表）

由于系统采用多港口支持（schema_multi_ports.sql），POL 和 POD 通过关联表写入：

#### POL 处理（Col[17]）

| 处理逻辑 | 说明 |
|---|---|
| 单港口（如 `HKG`、`PVG`） | 在 `port` 表中匹配 `port_code`，匹配成功 → 写入 `enquiry_pol(enquiry_id, port_id, sequence=1)` |
| 多港口（如 `CAN/SZX`） | 按 `/` 拆分，依次匹配 port，写入多条 `enquiry_pol`，sequence 递增 |
| 城市名（如 `Shanghai`、`Chengdu`） | 需建立城市名到 port_code 的映射表，匹配后写入 |
| 匹配失败 | 记录到错误日志，enquiry 的 `pol_id` 字段（兼容字段）置 NULL |

#### POD 处理（Col[18]）

| 处理逻辑 | 说明 |
|---|---|
| 单港口（如 `KHI`、`AMS`） | 匹配 `port.port_code` → 写入 `enquiry_pod` |
| 地址+邮编（如 `200040 shanghai`、`100022, Beijing`） | 需解析城市名，映射到最近的港口/机场 |
| 多港口（如包含 `/` 分隔） | 按 `/` 拆分，逐一匹配 |
| 匹配失败 | 记录到错误日志，优先保存原始文本，后续人工修正 |

> **POD 数据质量说明**：POD 列有 1,196 个唯一值，大量为完整地址（含邮编），需要建立地址 → 港口的映射索引或人工校对。

---

### 3.3 enquiry_container_line（箱型明细表）

**触发条件**：Quantity (Unit) 列（Col[13]）中包含柜型数据。

#### 3.3.1 单位分类规则

| 分类 | 识别规则 | 处理 |
|---|---|---|
| **KG** | 值为 `KG` | 写入 `enquiry.quantity_uom_code = 'KG'`，**不写入** container_line |
| **柜型** | 包含 `GP/HQ/HC/OT/FR/RF/NOR/TANK/REEFER/FT/DC/OOG/BULK/SOC` 等关键字 | 解析柜型+数量 → 写入 `enquiry_container_line` |
| **误填数据** | 纯数字（如 `1`、`5`、`557.4`、`300` 等）或 `TBA` | **不写入** quantity_uom_code，也不写入 container_line |

#### 3.3.2 柜型解析规则

CSV 中柜型表达形式多样，需要统一解析：

**模式 A：单一柜型**
- `40'GP` → container_code=`40GP`, qty=数量取自 Quantity 列
- `20'GP` → container_code=`20GP`
- `40'HQ` → container_code=`40HQ`
- `40'FR` → container_code=`40FR`

**模式 B：多柜型（`/` 分隔，无数量前缀）**
- `20'GP/40'GP` → 各1个（需结合 Quantity 列判断，或默认各1）
- `20'GP/40'GP/40'HQ` → 各1个

**模式 C：多柜型（带数量前缀）**
- `2*40HQ + 4*20GP` → 40HQ×2, 20GP×4
- `3*40GP+1*20GP` → 40GP×3, 20GP×1
- `1x 40'HC + 1x 20'DC` → 40HC×1, 20DC×1

**模式 D：带描述的柜型**
- `20 FT OPEN TOP` → 20OT
- `40 FLAT RACK` → 40FR
- `20'ISO TANK`/`20FT ISO Tank` → 20TANK（需在 container_types 补充）
- `40'HQ Reefer` → 40RF
- `20'Flexitank` → 需补充到 container_types

**柜型代码标准化映射表**：

| 原始表达 | 标准化 container_code |
|---|---|
| `40'GP` / `40GP` / `40'FT` / `40FT` / `40　GP` | 40GP |
| `20'GP` / `20GP` / `20'FT` / `20FT` / `20　GP` / `20'DC` / `20'DV` | 20GP |
| `40'HQ` / `40HQ` / `40'HC` / `40HC` / `40　HQ` | 40HQ |
| `45'HQ` / `45HQ` / `45*HQ` / `45　HQ` | 45HQ |
| `20'OT` / `20OT` / `20 FT OPEN TOP` / `20' open top` | 20OT |
| `40'OT` / `40OT` / `40'FT OT` | 40OT |
| `20'FR` / `20FR` / `20'FR OOG` | 20FR |
| `40'FR` / `40FR` / `40'FR (OOG)` / `40 FLAT RACK` / `40'FR OOG` | 40FR |
| `20'RF` / `20'REEFER` / `20 REEFER` | 20RF |
| `40'RF` / `40'RF (OOG)` / `40 REEFER` / `40 REFFER` / `40'HQ Reefer` | 40RF |
| `20'NOR` | 20NOR（需新增） |
| `40'NOR` | 40NOR（需新增） |
| `20' ISO TANK` / `20FT ISO Tank` / `20'TANK` / `20Tank` | 20TANK（需新增） |

#### 3.3.3 写入目标

```
enquiry_container_line:
  - enquiry_id: 关联的 enquiry.id
  - container_type_id: 通过 container_code 查找 container_types.id
  - container_qty: 解析得到的数量
  - raw_text: 原始 Quantity(Unit) 值
```

写入后回写 `enquiry.quantity_teu = SUM(container_qty × container_types.teu_value)`。

---

### 3.4 offer（报价子表）

4 列报价数据映射到 offer 表，规则如下：

#### 3.4.1 数据源列

| CSV列 | offer_type | sequence_no | is_latest |
|---|---|---|---|
| Col[25] 1st Offer: Ocean Frg | OCEAN | 1 | 根据是否有 Latest 决定 |
| Col[26] 1st Offer: Air Frg/KG | AIR | 1 | 根据是否有 Latest 决定 |
| Col[27] Lastest Offer: Ocean Frg | OCEAN | 2 | 1 (is_latest=true) |
| Col[28] Lastest Offer: Air Frg/KG | AIR | 2 | 1 (is_latest=true) |

#### 3.4.2 写入规则

对每条 enquiry 记录：

1. **确定 offer_type**：基于 `cargo_type_code` 映射的 `dict_cargo_type.offer_type`
   - AIR cargo → 只读取 Air Frg/KG 列（Col[26]、Col[28]）
   - FCL/LCL/SEA cargo → 只读取 Ocean Frg 列（Col[25]、Col[27]）
   - RAIL cargo → 根据实际数据判断（OTHER类型）

2. **1st Offer 写入**：
   ```
   若 1st Offer 列有值：
     offer.enquiry_id = enquiry.id
     offer.offer_type = 对应类型
     offer.sequence_no = 1
     offer.sent_date = 解析 Col[24] "1st Quotation Sent"
     offer.sent_date_raw_text = 原始值（无法解析时）
     offer.price = 尝试解析数值（如 USD3.35 → 3.35）
     offer.price_text = 原始报价文本（如 "USD3.35 ALL IN"）
     offer.is_latest = 若无 Latest Offer → 1，否则 → 0
   ```

3. **Latest Offer 写入**：
   ```
   若 Latest Offer 列有值：
     offer.enquiry_id = enquiry.id
     offer.offer_type = 对应类型
     offer.sequence_no = 2
     offer.price = 尝试解析数值
     offer.price_text = 原始报价文本
     offer.is_latest = 1
   同时更新 1st offer 的 is_latest = 0
   ```

#### 3.4.3 价格解析规则

| 原始格式示例 | price (DECIMAL) | price_text |
|---|---|---|
| `USD3.35 ALL IN` | 3.35 | USD3.35 ALL IN |
| `USD4136` | 4136.00 | USD4136 |
| `HKD44.52` | 44.52 | HKD44.52 |
| `USD4300/5005/6750` | NULL（多值无法解析为单一数值） | USD4300/5005/6750 |
| `-` | NULL | - |
| 空 | 不写入 offer | — |

价格数值提取正则：`(?:USD|HKD|EUR|RMB|CNY)?\s*([0-9,]+\.?\d*)`

#### 3.4.4 统计

| 报价类型 | 有数据的记录数 |
|---|---|
| 1st Offer: Ocean Frg | 6,684 |
| 1st Offer: Air Frg/KG | 6,223 |
| Lastest Offer: Ocean Frg | 618 |
| Lastest Offer: Air Frg/KG | 175 |

---

## 4. 数据质量问题与清洗策略

### 4.1 关键数据质量问题

| 问题类别 | 详情 | 影响记录数 | 处理策略 |
|---|---|---|---|
| **Quantity(Unit) 误填** | 纯数字（1、5、557.4、300等）既非KG也非柜型 | 27 条 | 忽略不写入 quantity_uom_code，原始值保存到 raw_text |
| **POL 非标准值** | 城市名（Shanghai、Beijing等）、地址 | ~150 种 | 建立城市 → port_code 映射表 |
| **POD 地址格式** | 含邮编+城市名（200040 shanghai 等） | ~1000 种 | 提取城市名匹配港口，匹配失败记录错误 |
| **POD Country 复合值** | `BELGIUM/FRANCE`、`UK/NETHERLANDS` 等 | ~50 种 | 取第一个国家作为主 pod_country |
| **Sales office 异常值** | `-`、`?PAKISTAN CARGO SERVICE` 等 | 少量 | 写入 raw 字段，office_id 置 NULL 或创建占位记录 |
| **Booking Confirmed 大小写** | `invalid` vs `Invalid` | 少量 | 统一转换：UPPER 首字母 |
| **Category 大小写不一致** | `Origin charges & EXW` vs `Origin Charges & EXW` | 少量 | 通过 name_norm（UPPER+TRIM）匹配 |
| **日期格式** | `2 Jan 2024`、`TBA`、`Week 5`、`End of Feb` | 部分 | 可解析→DATE，不可解析→raw_text |
| **编码问题** | 含 `\xa0`（NBSP）等特殊字符 | 少量 | 全局替换为普通空格 |

---

## 5. 迁移执行步骤

### 步骤一：前置数据准备

确保以下字典/主数据表已初始化（通过 schema_v2.sql 初始化脚本）：

```sql
-- 1. dict_cn_office（8条记录）
-- SHANGHAI, SHENZHEN, NINGBO, HONG KONG, TIANJIN, QINGDAO, XIAMEN, CN-MULTI

-- 2. dict_cargo_type（5条记录）
-- AIR(AIR), FCL(OCEAN), LCL(OCEAN), RAIL(OTHER), SEA(OCEAN)

-- 3. dict_product（7条记录）
-- AIR(A), SEA(S), SEA-AIR(SA), RAIL(R), RAIL-SEA(RS), RAIL-AIR(RA), AIR-RAIL-SEA(ARS)

-- 4. dict_uom（5条记录）
-- KG, PCS, CTN, PLT, SET

-- 5. dict_category（9条记录，含大小写变体）

-- 6. container_types（11+条记录，需补充 NOR/TANK 等类型）

-- 7. country 表 — 需预导入所有涉及国家

-- 8. port 表 — 需预导入所有 POL/POD 涉及的港口/机场

-- 9. dict_sales_office — 需从CSV提取198个唯一值预导入

-- 10. sales_pic — 需从CSV提取所有唯一 PIC 预导入
```

### 步骤二：补充 container_types

```sql
-- 补充CSV中出现但原始字典缺少的箱型
INSERT IGNORE INTO container_types (container_code, container_name, teu_value, length_feet, is_special) VALUES
('20NOR', '20'' Non-Operating Reefer', 1.00, 20, 1),
('40NOR', '40'' Non-Operating Reefer', 2.00, 40, 1),
('20TANK', '20'' ISO Tank', 1.00, 20, 1),
('40TANK', '40'' ISO Tank', 2.00, 40, 1),
('20DC', '20'' Dry Container', 1.00, 20, 0),
('20DV', '20'' Dry Van', 1.00, 20, 0),
('40FT', '40'' Flat', 2.00, 40, 0),
('20FT', '20'' Flat', 1.00, 20, 0);
```

### 步骤三：提取并导入 Sales Office

```sql
-- 从CSV提取所有唯一 Sales office 并导入
-- 脚本自动执行：TRIM+UPPER → name_norm，自动去重
INSERT IGNORE INTO dict_sales_office (name, name_norm)
SELECT DISTINCT TRIM(sales_office), UPPER(TRIM(sales_office))
FROM csv_staging
WHERE TRIM(sales_office) != '' AND TRIM(sales_office) != '-';
```

### 步骤四：提取并导入 Sales PIC

```sql
-- 从CSV提取所有唯一 Sales PIC，关联 country_code + sales_office_id
INSERT IGNORE INTO sales_pic (name, name_norm, country_code, sales_office_id)
SELECT DISTINCT 
  TRIM(sales_pic),
  UPPER(TRIM(sales_pic)),
  sales_country_code,
  so.id
FROM csv_staging s
JOIN dict_sales_office so ON UPPER(TRIM(s.sales_office)) = so.name_norm
WHERE TRIM(s.sales_pic) != '';
```

### 步骤五：导入 enquiry 主表

Python 迁移脚本逐行处理 CSV，执行以下操作：

1. 解析日期字段（enquiry_received_date, issue_date, cargo_ready_date）
2. 映射字典值（product_code, cargo_type_code, assigned_cn_office_code, category_code）
3. 解析 reference_number 得到 reference_month, monthly_sequence, serial_number
4. 解析数值字段（volume_cbm, quantity, quantity_teu）
5. 处理 Quantity(Unit)：仅 KG 写入 quantity_uom_code
6. 映射 sales_country_code, sales_office_id, sales_pic_id
7. 映射 core_flag：`NON CORE` → `NON_CORE`
8. 映射 booking_confirmed：统一大小写
9. 设置 enquiry_offer_type

### 步骤六：导入 enquiry_pol / enquiry_pod

对每条 enquiry：

```
1. 读取 POL 值
2. 按 "/" 分隔（如有多港口）
3. 逐个在 port 表匹配 port_code
4. 匹配成功 → INSERT INTO enquiry_pol(enquiry_id, port_id, sequence)
5. 匹配失败 → 记录错误日志

6. 读取 POD 值
7. 同样处理（含地址解析逻辑）
8. 写入 enquiry_pod
```

### 步骤七：导入 enquiry_container_line

对每条 Quantity(Unit) 包含柜型的记录：

```
1. 识别柜型表达模式（A/B/C/D）
2. 解析为 (container_code, qty) 列表
3. 标准化 container_code
4. 查找 container_types.id
5. INSERT INTO enquiry_container_line
6. 回写 enquiry.quantity_teu = SUM(qty × teu_value)
```

### 步骤八：导入 offer

对每条 enquiry：

```
1. 确定 offer_type（基于 cargo_type → dict_cargo_type.offer_type）
2. 如果 offer_type = AIR → 读取 Col[26] (1st Air) 和 Col[28] (Latest Air)
3. 如果 offer_type = OCEAN → 读取 Col[25] (1st Ocean) 和 Col[27] (Latest Ocean)
4. 1st Offer 有值：
   - INSERT offer(enquiry_id, offer_type, sequence_no=1, sent_date=Col[24], price_text=原始值, price=解析数值)
5. Latest Offer 有值：
   - INSERT offer(enquiry_id, offer_type, sequence_no=2, is_latest=1, price_text=原始值, price=解析数值)
   - UPDATE 1st offer SET is_latest=0
6. 仅有 1st Offer 时设置 is_latest=1
```

---

## 6. 迁移脚本架构

```
database/
├── migration/
│   ├── 01_prepare_master_data.sql       -- 补充字典、主数据
│   ├── 02_import_sales_offices.sql      -- 导入 Sales Office
│   ├── 03_import_sales_pics.sql         -- 导入 Sales PIC  
│   ├── 04_migrate_enquiry.py            -- Python 主迁移脚本
│   ├── 05_migrate_pol_pod.py            -- POL/POD 关联迁移
│   ├── 06_migrate_containers.py         -- 柜型明细迁移
│   ├── 07_migrate_offers.py             -- 报价数据迁移
│   ├── 08_post_migration_verify.sql     -- 迁移后验证
│   ├── container_code_mapping.json      -- 柜型代码标准化映射
│   ├── city_to_port_mapping.json        -- 城市名 → 港口代码映射
│   └── migration_error_log.csv          -- 错误记录
```

---

## 7. 验证与回退方案

### 7.1 迁移后验证

```sql
-- 1. 总记录数验证
SELECT COUNT(*) AS total_enquiry FROM enquiry;
-- 期望：14,040

-- 2. 报价数据验证
SELECT COUNT(*) AS total_offers FROM offer;
-- 期望：约 13,700（6,684 ocean + 6,223 air + 618 latest ocean + 175 latest air）

-- 3. 柜型明细验证
SELECT COUNT(*) AS total_containers FROM enquiry_container_line;

-- 4. POL/POD 验证
SELECT COUNT(*) AS total_pol FROM enquiry_pol;
SELECT COUNT(*) AS total_pod FROM enquiry_pod;

-- 5. 数据一致性校验
SELECT e.id, e.reference_number
FROM enquiry e
LEFT JOIN enquiry_pol ep ON e.id = ep.enquiry_id
WHERE ep.id IS NULL;
-- 期望：无结果（所有 enquiry 应有 POL）

-- 6. offer_type 一致性
SELECT e.id, e.reference_number, e.enquiry_offer_type, o.offer_type
FROM enquiry e
JOIN offer o ON e.id = o.enquiry_id
WHERE e.enquiry_offer_type != o.offer_type;
-- 期望：无结果
```

### 7.2 回退方案

```sql
-- 按反向依赖顺序清除迁移数据
DELETE FROM offer WHERE enquiry_id > 0;
DELETE FROM enquiry_container_line WHERE enquiry_id > 0;
DELETE FROM enquiry_pol WHERE enquiry_id > 0;
DELETE FROM enquiry_pod WHERE enquiry_id > 0;
DELETE FROM enquiry WHERE id > 0;
-- 重置自增序列
ALTER TABLE enquiry AUTO_INCREMENT = 1;
ALTER TABLE offer AUTO_INCREMENT = 1;
ALTER TABLE enquiry_container_line AUTO_INCREMENT = 1;
ALTER TABLE enquiry_pol AUTO_INCREMENT = 1;
ALTER TABLE enquiry_pod AUTO_INCREMENT = 1;
```

---

## 8. 风险与注意事项

| 风险 | 级别 | 缓解措施 |
|---|---|---|
| POL/POD 匹配率低 | 高 | POL 有 410 种、POD 有 1,196 种值，需预建完善的港口映射 |
| 柜型解析遗漏 | 中 | 150+ 种柜型表达，需全面的正则覆盖 + 人工校验 |
| 外键约束导致导入失败 | 中 | 迁移时暂时禁用 FK 检查（`SET FOREIGN_KEY_CHECKS = 0`） |
| 特殊字符编码 | 低 | 全局预处理：`\xa0` → 空格，确保 UTF-8 清洁 |
| 重复导入 | 低 | reference_number 有唯一约束，INSERT IGNORE 或 ON DUPLICATE KEY |

---

## 9. 预计时间线

| 阶段 | 工作内容 | 预计耗时 |
|---|---|---|
| 阶段一 | 主数据准备（字典、港口、办公室、PIC） | 1-2 天 |
| 阶段二 | 迁移脚本开发 + 单元测试 | 2-3 天 |
| 阶段三 | 试运行（导入前100条验证） | 0.5 天 |
| 阶段四 | 全量迁移执行 | 0.5 天 |
| 阶段五 | 数据验证与修复 | 1 天 |
| **总计** | | **5-7 天** |
