# China Pricing Enquiry / Offer MySQL 数据库设计文档（正式版 / 精简冗余版 - 方案A）

- 当前日期：2026-01-15  
- 当前登录用户示例：`dornach-Davian-Liang`  
- 数据来源：CSV《China Pricing - Enquiry Record-working(Rate Enquiry Summary) - 副本.csv》
- 目标：将 CSV 询价数据规范化入库到 MySQL，支持后续前端录入、查询、统计与扩展  
---

## 1. 业务背景与关键规则确认（落库必须遵守）

### 1.1 核心实体
- **Enquiry（询价）**：一条询价记录就是一个独立可报价的运输方案记录。
- **Offer（报价）**：一条 enquiry 对应多次报价（1st/2nd/…），但 **同一个 enquiry 只能存在一种报价类型**（例如只允许 AIR 或只允许 OCEAN，不允许同一 enquiry 同时有 OCEAN 和 AIR 报价）。
- **Container Line（箱型明细）**：当 cargo_type 为 FCL 或存在箱型组合表达（例如 `1x40HC + 1x20DC`）时，必须拆分为箱型明细行。

### 1.2 Reference Number 生成规则（最终确认版）
参考样例：`CN2409404-ARS1` / `CN2409404-ARS2`

你已确认：
- Reference Number 中 `CN` 前缀 **不需要可配置**（是否加前缀是系统规则，不需要做成配置项）
- `monthly_sequence` 递增口径：按 **issue_date 所在月份**递增，从 1 开始
- `serial_number`：每条记录就是独立 enquiry（不会出现同 enquiry 多 serial 的子记录）

**建议生成逻辑（推荐）**
- `reference_month` = `DATE_FORMAT(issue_date, '%y%m')`，例如 2024-09 => `2409`
- `monthly_sequence`：当月从 1 递增（建议展示可补零，但数据库存 INT）
- `product_abbr`：由 `product_code` 映射缩写（dict_product.abbr），例如 `AIR-RAIL-SEA => ARS`
- `reference_number` 拼装建议：
  - 不带 CN：`{reference_month}{monthly_sequence}-{product_abbr}{serial_number_if_any}`
  - 带 CN：`CN{reference_month}{monthly_sequence}-{product_abbr}{serial_number_if_any}`
- 规则建议：`serial_number=0` 不拼尾号；`serial_number>0` 拼尾号（ARS1/ARS2）

### 1.3 数据输入/主数据约束（你确认）
- Volume / Quantity：统一导入为 **NULL + 原始文本保留**
- `sales_office`：下拉强制（必须来自主数据 dict_sales_office）
- `assigned_cn_office`：下拉强制（必须来自字典 dict_cn_office）
- POL/POD：强制选择主数据港口（port 表）
- port 同时包含 POL 与 POD；port 通过 `mode` 区分 AIR/SEA 等；仅 POD 需要映射 POD Country（但 port 仍保留 country_id，enquiry 只冗余存 pod_country_id）

---

## 2. ER 关系说明（实体关系图文字版）

### 2.1 关系概览
- `country 1 --- n port`
- `enquiry n --- 1 country`（sales_country）
- `enquiry n --- 1 dict_sales_office`（sales_office）
- `enquiry n --- 1 port`（POL）
- `enquiry n --- 1 port`（POD）
- `enquiry n --- 1 country`（POD Country：冗余保存，但来源于 pod_id -> port.country_id）
- `enquiry 1 --- n offer`
- `enquiry 1 --- n enquiry_container_line`
- `container_types 1 --- n enquiry_container_line`
- 下拉/字典项由 `dict_*` 表管理（product/cargo_type/category/assigned_cn_office/uom 等）

### 2.2 关键业务约束
- **Offer 类型唯一性**：同一个 `enquiry_id` 下，offer 只能有一种 `offer_type`  
  - 推荐通过 enquiry 表字段 `enquiry_offer_type` 固化（应用层校验）
- **POD Country 映射**：`enquiry.pod_country_id` = `port.country_id`（由 pod_id 决定）

---

## 3. 表结构设计（全量字段 + 中英说明）

> 命名原则：
- 表字段使用 snake_case
- 字典项字段通常使用 `_code`（若 code 做 PK），或使用 `_id`（若 id 做 PK）
- 对 CSV 可能出现非结构化内容（TBA/文本/脏数据），使用 `*_raw_text` 存原始值，结构化字段存 NULL

---

## 3.1 enquiry（询价主表）

### 3.1.1 字段清单（中英对照 + 说明）

| 字段名 | 类型 | 约束 | 中文名 | 英文含义/我的理解说明 |
|---|---|---|---|---|
| id | BIGINT | PK, AI | 主键 | 系统主键 |
| reference_number | VARCHAR(50) | UNIQUE, NOT NULL | 询价编号 | 自动生成唯一编号（用户不可编辑），例如 `2409404-ARS1` / `CN2409404-ARS1` |
| enquiry_received_date | DATE | NOT NULL | 收到询价日期 | 默认当天，用户可修改；CSV `Enquiry Received Date` |
| issue_date | DATE | NOT NULL | 创建日期（业务） | 默认当天，用户不可修改；用于生成 reference_month & monthly_sequence；CSV `Issue Date` |
| reference_month | CHAR(4) | NOT NULL | 引用月份(YYMM) | 从 issue_date 派生，如 2409 |
| monthly_sequence | INT | NOT NULL | 当月递增序号 | 按 issue_date 月份递增，从1开始（用于编号中的序号） |
| serial_number | INT | NOT NULL DEFAULT 0 | 尾部序号 | 对应 `-ARS1` 的 `1`；每条记录独立 enquiry，仅用于展示/排序/编号 |
| product_code | VARCHAR(30) | NOT NULL | 产品类型 | 下拉字典 dict_product.code，如 `AIR-RAIL-SEA` |
| product_abbr | VARCHAR(10) | NOT NULL | 产品缩写 | dict_product.abbr，如 `ARS`，用于生成 reference_number（可冗余存储以避免 join） |
| status | ENUM('New','Quoted','Cancelled') | NOT NULL DEFAULT 'New' | 状态 | New/Quoted/Cancelled；CSV `Status` |
| cn_pricing_admin | VARCHAR(100) | NOT NULL | CN定价管理员 | 默认登录用户名（不可更新）；CSV `CN Pricing Admin` |
| sales_country_id | INT | NOT NULL FK | 销售国家 | 外键 country(id)；CSV `Sales Country` |
| sales_office_id | INT | NOT NULL FK | 销售办公室 | 外键 dict_sales_office(id)；CSV `Sales office`（由 name 映射） |
| sales_pic | VARCHAR(100) | NULL | 销售负责人 | 自由文本；CSV `Sales PIC` |
| assigned_cn_office_code | VARCHAR(50) | NOT NULL FK | 指派CN办公室 | 外键 dict_cn_office(code)，强制下拉 |
<!-- | product_type | ENUM('AIR','SEA','RAIL') |NULL| 运输具体类型|强制下拉 -->
| cargo_type_code | VARCHAR(20) | NOT NULL FK | 运输类型 | 外键 dict_cargo_type(code)，强制下拉；决定报价类型唯一性 |
| volume_cbm | DECIMAL(12,3) | NULL | 体积(CBM) | 可解析数值写入；否则 NULL |
| volume_raw_text | VARCHAR(100) | NULL | 体积原始文本 | 保存 CSV 原始（TBA/异常/空） |
| quantity | DECIMAL(12,3) | NULL | 数量 | 可解析数值写入；否则 NULL |
| quantity_raw_text | VARCHAR(100) | NULL | 数量原始文本 | 保存 CSV 原始（TBA/逗号数字/异常） |
| quantity_uom_code | VARCHAR(20) | NULL FK | 数量单位 | dict_uom(code)：KG/PCS/CTN 等；箱型组合时可为空 |
| quantity_uom_raw_text | VARCHAR(200) | NULL | 数量单位原始文本 | 保存 CSV `Quantity(Unit)` 原始值（如 `1x40HC + 1x20DC`）用于解析 |
| quantity_teu | DECIMAL(12,3) | NULL | TEU | 若存在箱型明细，则按箱型汇总计算得到，可冗余保存 |
| quantity_teu_raw_text | VARCHAR(100) | NULL | TEU原始文本 | CSV 原始（TBA/空/异常），保留追溯 |
| commodity | TEXT | NULL | 品名 | CSV `Commodity` |
| haz_special_equipment | TEXT | NULL | 危险品/特殊设备 | CSV `Haz, Special Equipment` |
| pol_id | INT | NOT NULL FK | 起运港(POL) | 外键 port(id)，强制主数据下拉 |
| pod_id | INT | NOT NULL FK | 目的港(POD) | 外键 port(id)，强制主数据下拉 |
| pod_country_id | INT | NOT NULL FK | 目的港国家 | **仅 POD 映射**：写入时由 `pod_id -> port.country_id` 得到并冗余保存 |
| core_flag | ENUM('CORE','NON_CORE') | NULL | 核心标识 | CSV `CORE / NON CORE`（入库规范化 NON_CORE） |
| category_code | VARCHAR(50) | NULL FK | 分类 | dict_category(code)，如 Origin Charges & EXW / Ocean Freight 等 |
| cargo_ready_date | DATE | NULL | 货好日期 | 可解析日期则写入；否则为 NULL（不强制） |
| cargo_ready_date_raw_text | VARCHAR(100) | NULL | 货好日期原始文本 | 例如 TBA / Week 5 / End of Feb / “16,20 Jan” 等（替代 date+status+text 三字段） |
| additional_requirement | TEXT | NULL | 附加要求 | CSV `Additional Requirement`，>=200字符建议由应用校验 |
| booking_confirmed | ENUM('Yes','Rejected','Pending','Invalid') | NOT NULL DEFAULT 'Pending' | 订舱确认状态 | CSV `Booking Confirmed` |
| remark | TEXT | NULL | 备注 | CSV `Remark` |
| rejected_reason | TEXT | NULL | 拒绝原因 | CSV `Rejected Reason` |
| actual_reason | TEXT | NULL | 实际原因 | CSV `Actual Reason` |
| enquiry_offer_type | ENUM('OCEAN','AIR','OTHER') | NULL | 锁定报价类型 | 用于保证同一 enquiry 的 offer 只允许一种类型（应用层校验） |
| reserve_field_1..5 | VARCHAR(255) | NULL | 预留字段 | 预留扩展列（5列） |
| created_at | TIMESTAMP | NOT NULL | 创建时间戳 | 系统字段 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间戳 | 系统字段 |
| created_by | VARCHAR(100) | NULL | 创建人 | 默认登录用户 |
| updated_by | VARCHAR(100) | NULL | 更新人 | 最后修改用户 |

#### 冗余字段清理备注（enquiry）
- 删除了原方案中的：
  - `cargo_ready_date_status`
  - `cargo_ready_date_text`
- 替代方案：保留 `cargo_ready_date`（结构化） + `cargo_ready_date_raw_text`（原始），减少冗余并满足导入追溯。

---

### 3.1.2 建表 SQL（含索引）

```sql
CREATE TABLE enquiry (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',

  reference_number VARCHAR(50) NOT NULL COMMENT '询价编号（自动生成，唯一）',
  enquiry_received_date DATE NOT NULL COMMENT '收到询价日期（默认当天，用户可改）',
  issue_date DATE NOT NULL COMMENT '创建日期（默认当天，不可改，用于生成当月序号）',

  reference_month CHAR(4) NOT NULL COMMENT 'YYMM（由issue_date派生）',
  monthly_sequence INT NOT NULL COMMENT '当月递增序号（按issue_date月份从1开始）',
  serial_number INT NOT NULL DEFAULT 0 COMMENT '编号尾部序号，如ARS1的1',

  product_code VARCHAR(30) NOT NULL COMMENT '产品类型：SEA/AIR/RAIL-SEA/AIR-RAIL-SEA等',
  product_abbr VARCHAR(10) NOT NULL COMMENT '产品缩写：如 AIR-RAIL-SEA => ARS（可冗余存储用于生成reference_number）',

  status ENUM('New','Quoted','Cancelled') NOT NULL DEFAULT 'New' COMMENT '状态：New/Quoted/Cancelled',
  cn_pricing_admin VARCHAR(100) NOT NULL COMMENT 'CN定价管理员（默认登录用户，不可改）',

  sales_country_id INT NOT NULL COMMENT '销售国家ID（FK country）',
  sales_office_id INT NOT NULL COMMENT '销售办公室ID（FK dict_sales_office，按name映射）',
  sales_pic VARCHAR(100) NULL COMMENT '销售负责人（自由文本）',

  assigned_cn_office_code VARCHAR(50) NOT NULL COMMENT '指派CN办公室（FK dict_cn_office）',
  product_type ENUM('New','Quoted','Cancelled') NULL COMMENT '运输具体类型'
  cargo_type_code VARCHAR(20) NOT NULL COMMENT '运输类型：AIR/LCL/FCL/RAIL等（FK dict_cargo_type）',

  volume_cbm DECIMAL(12,3) NULL COMMENT '体积CBM（可为空）',
  volume_raw_text VARCHAR(100) NULL COMMENT '体积原始文本（TBA/异常时保存）',

  quantity DECIMAL(12,3) NULL COMMENT '数量（可为空）',
  quantity_raw_text VARCHAR(100) NULL COMMENT '数量原始文本（TBA/异常时保存）',

  quantity_uom_code VARCHAR(20) NULL COMMENT '数量单位（KG/PCS等；箱型组合时可为空）',
  quantity_uom_raw_text VARCHAR(200) NULL COMMENT '数量单位原始文本（如1x40HC+1x20DC）',

  quantity_teu DECIMAL(12,3) NULL COMMENT 'TEU（箱型汇总得到，可冗余）',
  quantity_teu_raw_text VARCHAR(100) NULL COMMENT 'TEU原始文本（TBA等）',

  commodity TEXT NULL COMMENT '品名/货物描述',
  haz_special_equipment TEXT NULL COMMENT '危险品/特殊设备',

  pol_id INT NOT NULL COMMENT '起运港ID（FK port）',
  pod_id INT NOT NULL COMMENT '目的港ID（FK port）',
  pod_country_id INT NOT NULL COMMENT '目的港国家ID（从POD映射，可冗余保存，保证历史一致性）',

  core_flag ENUM('CORE','NON_CORE') NULL COMMENT 'CORE/NON_CORE',
  category_code VARCHAR(50) NULL COMMENT '分类（建议字典）',

  cargo_ready_date DATE NULL COMMENT '货好日期（可解析则填）',
  cargo_ready_date_raw_text VARCHAR(100) NULL COMMENT '货好日期原始文本（TBA/Week 5/End of Feb等）',

  additional_requirement TEXT NULL COMMENT '附加要求（建议>=200字符由应用校验）',

  booking_confirmed ENUM('Yes','Rejected','Pending','Invalid') NOT NULL DEFAULT 'Pending' COMMENT '订舱确认状态',
  remark TEXT NULL COMMENT '备注',
  rejected_reason TEXT NULL COMMENT '拒绝原因',
  actual_reason TEXT NULL COMMENT '实际原因',

  enquiry_offer_type ENUM('OCEAN','AIR','OTHER') NULL COMMENT '锁定报价类型（保证同一enquiry只一种offer_type）',

  reserve_field_1 VARCHAR(255) NULL COMMENT '预留1',
  reserve_field_2 VARCHAR(255) NULL COMMENT '预留2',
  reserve_field_3 VARCHAR(255) NULL COMMENT '预留3',
  reserve_field_4 VARCHAR(255) NULL COMMENT '预留4',
  reserve_field_5 VARCHAR(255) NULL COMMENT '预留5',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间戳',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间戳',
  created_by VARCHAR(100) NULL COMMENT '创建人',
  updated_by VARCHAR(100) NULL COMMENT '更新人',

  UNIQUE KEY uk_reference_number (reference_number),
  KEY idx_issue_date (issue_date),
  KEY idx_reference_month_seq (reference_month, monthly_sequence),
  KEY idx_sales_country (sales_country_id),
  KEY idx_sales_office (sales_office_id),
  KEY idx_status (status),
  KEY idx_booking (booking_confirmed),
  KEY idx_pol (pol_id),
  KEY idx_pod (pod_id),
  KEY idx_pod_country (pod_country_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价主表';
```

---

## 3.2 offer（报价子表）

### 3.2.1 字段清单（中英对照 + 说明）

| 字段名 | 类型 | 约束 | 中文名 | 英文含义/我的理解说明 |
|---|---|---|---|---|
| id | BIGINT | PK, AI | 主键 | 报价记录主键 |
| enquiry_id | BIGINT | NOT NULL, FK | 询价ID | 外键关联 enquiry.id |
| offer_type | ENUM('OCEAN','AIR','OTHER') | NOT NULL | 报价类型 | 同一 enquiry 下必须一致（只允许一种类型） |
| sequence_no | INT | NOT NULL DEFAULT 1 | 报价次数 | 1=1st，2=2nd… |
| is_latest | BOOLEAN | NOT NULL DEFAULT 0 | 是否最新 | 最新一条报价标记 true |
| sent_date | DATE | NULL | 报价发送日期 | 可解析日期则写入；否则 NULL |
| sent_date_raw_text | VARCHAR(100) | NULL | 报价发送日期原文 | 例如 TBA / Week 5 / Jan（替代 date+status+text 三字段） |
| price | DECIMAL(18,4) | NULL | 数值价格 | 能解析则写入（如 3.45）；无法解析则 NULL |
| price_text | VARCHAR(200) | NULL | 报价原文 | 无法结构化或带附加说明（如 `USD3.45 ALL IN`、`USD4300/5005/6750`） |
| is_rejected_price | BOOLEAN | NOT NULL DEFAULT 0 | 是否无效/被拒报价（可选） | 可用于标记“该报价导致Rejected”，不强制 |
| created_at | TIMESTAMP | NOT NULL | 创建时间戳 | 系统字段 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间戳 | 系统字段 |

#### 冗余字段清理备注（offer）
- 删除了原方案中的：
  - `sent_date_status`（用 `sent_date_raw_text` 表达非标准日期）
  - `currency`、`uom_code`（你要求认为冗余）
- 说明：删除后会降低结构化能力（比如无法直接统计不同币种/计价单位），但满足你“精简字段”的要求。建议后续如要统计，再通过解析 `price_text` 或新增结构化字段回补。

### 3.2.2 建表 SQL（含约束/索引）

```sql
CREATE TABLE offer (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  enquiry_id BIGINT NOT NULL COMMENT '询价ID（FK enquiry）',

  offer_type ENUM('OCEAN','AIR','OTHER') NOT NULL COMMENT '报价类型（同一enquiry只允许一种）',
  sequence_no INT NOT NULL DEFAULT 1 COMMENT '报价次数：1=1st，2=2nd...',
  is_latest BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否最新报价',

  sent_date DATE NULL COMMENT '报价发送日期（可解析则填）',
  sent_date_raw_text VARCHAR(100) NULL COMMENT '报价发送日期原始文本（TBA/Week 5/Jan等）',

  price DECIMAL(18,4) NULL COMMENT '可解析数值价格（解析失败则NULL）',
  price_text VARCHAR(200) NULL COMMENT '报价原文（如USD3.45 ALL IN、USD4300/5005/6750）',

  is_rejected_price BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否无效/被拒报价（可选字段）',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间戳',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间戳',

  KEY idx_offer_enquiry (enquiry_id),
  KEY idx_offer_latest (enquiry_id, is_latest),
  KEY idx_offer_type (offer_type),

  CONSTRAINT fk_offer_enquiry
    FOREIGN KEY (enquiry_id) REFERENCES enquiry(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价子表';
```

---

## 3.3 enquiry_container_line（箱型明细表）

用于将 `Quantity(Unit)` 规范化为箱型组合并支撑 TEU 计算。

```sql
CREATE TABLE enquiry_container_line (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  enquiry_id BIGINT NOT NULL COMMENT '询价ID',
  container_type_id INT NOT NULL COMMENT '箱型ID',
  container_qty INT NOT NULL COMMENT '箱量',
  raw_text VARCHAR(200) NULL COMMENT '原始片段',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间戳',

  UNIQUE KEY uk_enquiry_container (enquiry_id, container_type_id),
  KEY idx_container_enquiry (enquiry_id),

  CONSTRAINT fk_ecl_enquiry
    FOREIGN KEY (enquiry_id) REFERENCES enquiry(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_ecl_container_type
    FOREIGN KEY (container_type_id) REFERENCES container_types(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价箱型明细';
```

---

## 3.4 主数据表（全量输出：country / port / dict_sales_office / container_types）

### 3.4.1 country（国家表）
```sql
CREATE TABLE country (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  country_code VARCHAR(10) NOT NULL COMMENT '国家代码（建议ISO，如CN/FR/DE）',
  country_name_en VARCHAR(100) NOT NULL COMMENT '国家英文名',
  country_name_cn VARCHAR(100) NULL COMMENT '国家中文名',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间戳',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间戳',
  UNIQUE KEY uk_country_code (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='国家主数据';
```

### 3.4.2 dict_sales_office（销售办公室字典表，方案A：只有name）
> 说明：你目前只有 `Sales office` 的 name（如 `ZIEGLER FRANCE`），因此：
- 字典表以 `name` 维护
- 使用 `name_norm` 做唯一键与导入匹配（避免大小写/空格不一致导致重复）

```sql
CREATE TABLE dict_sales_office (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  name VARCHAR(100) NOT NULL COMMENT '办公室名称（下拉显示），例如 ZIEGLER FRANCE',
  name_norm VARCHAR(120) NOT NULL COMMENT '名称规范化（用于唯一性与匹配，如TRIM+UPPER+多空格归一）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
  remark VARCHAR(255) NULL COMMENT '备注',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间戳',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间戳',
  UNIQUE KEY uk_sales_office_name_norm(name_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售办公室字典（按name维护）';
```

### 3.4.3 port（港口/机场/站点表：包含POL/POD）
> 说明：
- 同一张 port 表同时服务于 POL 与 POD
- 支持全部值域选择（去掉 mode 过滤）
- 仅 POD 需要映射 country：`enquiry.pod_country_id = port.country_id`  
  （port 表仍保留 country_id；只是 enquiry 不存 pol_country_id）

```sql
CREATE TABLE port (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  port_code VARCHAR(20) NOT NULL COMMENT '港口/机场/站点编码（系统内唯一）',
  port_name VARCHAR(100) NOT NULL COMMENT '展示名称，如 Hong Kong / Qingdao / PVG',
  country_id INT NULL COMMENT '所属国家ID（POD映射使用；POL不要求映射，但保留用于统计）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间戳',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间戳',

  UNIQUE KEY uk_port_code (port_code),
  KEY idx_port_country (country_id),

  CONSTRAINT fk_port_country
    FOREIGN KEY (country_id) REFERENCES country(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='港口/机场/站点主数据（含POL/POD）';
```

### 3.4.4 container_types（箱型配置表）
```sql
CREATE TABLE container_types (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  container_code VARCHAR(20) NOT NULL COMMENT '箱型代码（如20GP/40HQ/40HC/20DC等）',
  container_name VARCHAR(50) NOT NULL COMMENT '箱型名称（展示用）',
  teu_value DECIMAL(6,2) NOT NULL COMMENT 'TEU折算值（20尺=1，40尺=2等）',
  length_feet INT NULL COMMENT '长度（英尺）',
  is_special BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否特殊箱型（OOG/FA等）',
  description TEXT NULL COMMENT '描述/备注',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间戳',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间戳',

  UNIQUE KEY uk_container_code (container_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='集装箱类型配置';
```

---

## 3.5 字典/下拉配置表（推荐，用于强制下拉与可维护）

> 说明：这些字典表通过 **enquiry 表中的 code 字段**做外键关联（可选启用 FK 约束）。
- `assigned_cn_office_code` -> `dict_cn_office.code`
- `cargo_type_code` -> `dict_cargo_type.code`
- `product_code` -> `dict_product.code`
- `quantity_uom_code` -> `dict_uom.code`
- `category_code` -> `dict_category.code`

### 3.5.1 dict_cn_office（CN办公室下拉）
```sql
CREATE TABLE dict_cn_office (
  code VARCHAR(50) PRIMARY KEY COMMENT '代码，如SHENZHEN/HONGKONG/SHANGHAI',
  name VARCHAR(100) NOT NULL COMMENT '名称（展示）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='CN办公室字典';
```

### 3.5.2 dict_cargo_type（运输类型下拉）
> `offer_type` 用于锁定报价类型唯一性（简化为 OCEAN/AIR/OTHER）
```sql
CREATE TABLE dict_cargo_type (
  code VARCHAR(20) PRIMARY KEY COMMENT '代码：AIR/LCL/FCL/RAIL/SEA等',
  name VARCHAR(100) NOT NULL COMMENT '名称（展示）',
  offer_type ENUM('OCEAN','AIR','OTHER') NOT NULL COMMENT '该cargo_type对应的报价类型（用于锁定offer_type）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运输类型字典';
```

### 3.5.3 dict_product（产品下拉：SEA-AIR/AIR-RAIL-SEA等）
```sql
CREATE TABLE dict_product (
  code VARCHAR(30) PRIMARY KEY COMMENT '产品代码：SEA/AIR/SEA-AIR/AIR-RAIL-SEA等',
  name VARCHAR(100) NOT NULL COMMENT '名称（展示）',
  abbr VARCHAR(10) NOT NULL COMMENT '缩写：用于生成reference_number，如ARS',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品字典';
```

### 3.5.4 dict_uom（单位字典：KG/PCS等）
```sql
CREATE TABLE dict_uom (
  code VARCHAR(20) PRIMARY KEY COMMENT '单位代码：KG/PCS/CTN等',
  name VARCHAR(100) NOT NULL COMMENT '名称（展示）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单位字典';
```

### 3.5.5 dict_category（分类字典）
> 增加 `name_norm` 用于规范化匹配（UPPER+TRIM）
```sql
CREATE TABLE dict_category (
  code VARCHAR(50) PRIMARY KEY COMMENT '分类代码（可直接用英文短语或内部码）',
  name VARCHAR(100) NOT NULL COMMENT '分类名称（展示）',
  name_norm VARCHAR(100) NOT NULL COMMENT '规范化名称（UPPER+TRIM，用于匹配）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  UNIQUE KEY uk_category_name_norm (name_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价分类字典（Category）';
```

---

## 4. 外键约束汇总（建议）

> 说明：字典 FK 可选启用（推荐启用以实现“强制下拉”）。

```sql
-- enquiry -> 主数据
ALTER TABLE enquiry
  ADD CONSTRAINT fk_enquiry_sales_country FOREIGN KEY (sales_country_id) REFERENCES country(id),
  ADD CONSTRAINT fk_enquiry_sales_office  FOREIGN KEY (sales_office_id)  REFERENCES dict_sales_office(id),
  ADD CONSTRAINT fk_enquiry_pol          FOREIGN KEY (pol_id)           REFERENCES port(id),
  ADD CONSTRAINT fk_enquiry_pod          FOREIGN KEY (pod_id)           REFERENCES port(id),
  ADD CONSTRAINT fk_enquiry_pod_country  FOREIGN KEY (pod_country_id)   REFERENCES country(id);

-- enquiry -> 字典（强制下拉）
ALTER TABLE enquiry
  ADD CONSTRAINT fk_enquiry_assigned_cn_office FOREIGN KEY (assigned_cn_office_code) REFERENCES dict_cn_office(code),
  ADD CONSTRAINT fk_enquiry_cargo_type         FOREIGN KEY (cargo_type_code)        REFERENCES dict_cargo_type(code),
  ADD CONSTRAINT fk_enquiry_product            FOREIGN KEY (product_code)           REFERENCES dict_product(code),
  ADD CONSTRAINT fk_enquiry_uom                FOREIGN KEY (quantity_uom_code)      REFERENCES dict_uom(code),
  ADD CONSTRAINT fk_enquiry_category           FOREIGN KEY (category_code)          REFERENCES dict_category(code);
```

---

## 5. 索引设计（全量说明）

### 5.1 enquiry 推荐索引
- `uk_reference_number(reference_number)`：唯一定位
- `idx_reference_month_seq(reference_month, monthly_sequence)`：按月序号查询/生成编号检查
- `idx_issue_date(issue_date)`：按创建日期过滤
- `idx_sales_country(sales_country_id)`、`idx_sales_office(sales_office_id)`：按销售维度统计/筛选
- `idx_status(status)`：列表过滤
- `idx_booking(booking_confirmed)`：跟进状态筛选
- `idx_pol(pol_id)` / `idx_pod(pod_id)` / `idx_pod_country(pod_country_id)`：线路维度统计

### 5.2 offer 推荐索引
- `idx_offer_enquiry(enquiry_id)`：按询价查报价
- `idx_offer_latest(enquiry_id, is_latest)`：快速取最新报价
- `idx_offer_type(offer_type)`：按报价类型统计

---

## 6. 数据导入规则（CSV -> MySQL 字段映射表）

### 6.1 Enquiry 主表映射（CSV -> enquiry）

| CSV列名 | 目标字段 | 解析/规则 |
|---|---|---|
| Enquiry Received Date | enquiry.enquiry_received_date | 解析日期；失败建议拒绝导入（必填） |
| Issue Date | enquiry.issue_date | 解析日期；失败拒绝导入（用于生成月序号） |
| Reference Number | enquiry.reference_number | 可直接入库；或忽略CSV按规则重算（二选一，推荐重算以保证一致） |
| (由Issue Date派生) | enquiry.reference_month | `YYMM` |
| (当月计数生成) | enquiry.monthly_sequence | 按 issue_date 月份递增 |
| (解析Reference尾号) | enquiry.serial_number | 从 reference_number 末尾解析：ARS1=>1；ARS=>0 |
| Product | enquiry.product_code | 必须匹配 dict_product.code |
| Product | enquiry.product_abbr | 从 dict_product.abbr 写入（冗余便于编号生成） |
| Status | enquiry.status | 映射 New/Quoted（清洗空格/大小写） |
| CN Pricing Admin | enquiry.cn_pricing_admin | 直接入库；为空可默认当前登录用户 |
| Sales Country | enquiry.sales_country_id | 映射 country.country_code（建议用code）失败拒绝导入 |
| Sales office | enquiry.sales_office_id | **按 name 映射 dict_sales_office.name_norm** 得到 id；失败拒绝导入 |
| Sales PIC | enquiry.sales_pic | 直接入库 |
| Assigned CN Offices | enquiry.assigned_cn_office_code | 映射 dict_cn_office.code，失败拒绝导入 |
| Cargo Type | enquiry.cargo_type_code | 映射 dict_cargo_type.code，失败拒绝导入 |
| Volume (CBM) | enquiry.volume_cbm / volume_raw_text | 解析成功写 volume_cbm，否则 volume_cbm=NULL 且 raw_text=原文 |
| Quantity | enquiry.quantity / quantity_raw_text | 同上 |
| Quantity (Unit) | enquiry.quantity_uom_code / quantity_uom_raw_text | 若为 KG/PCS 等映射 dict_uom；若为箱型组合则 uom_code=NULL，raw_text 保存并进入箱型解析 |
| Quantity (TEU) | enquiry.quantity_teu / quantity_teu_raw_text | 解析成功写数值，否则 NULL+raw_text；若有箱型明细，最终以箱型计算为准 |
| Commodity | enquiry.commodity | 直接入库 |
| Haz, Special Equipment | enquiry.haz_special_equipment | 直接入库 |
| POL | enquiry.pol_id | 映射 port.port_code（强制），失败拒绝导入 |
| POD | enquiry.pod_id | 映射 port.port_code（强制），失败拒绝导入 |
| POD Country | enquiry.pod_country_id | **从 pod_id 映射 port.country_id**（CSV值仅用于对账） |
| CORE / NON CORE | enquiry.core_flag | 规范化 NON CORE -> NON_CORE |
| Category | enquiry.category_code | 映射 dict_category.code（可先允许直接存原文，再补字典） |
| Cargo Ready Date | enquiry.cargo_ready_date / cargo_ready_date_raw_text | 可解析日期 => 写 cargo_ready_date；否则 cargo_ready_date=NULL 且 raw_text=原文（含TBA/Week 5等） |
| Additional Requirement | enquiry.additional_requirement | 直接入库 |
| Booking Confirmed | enquiry.booking_confirmed | 映射 Yes/Rejected/Pending（清洗空格） |
| Remark | enquiry.remark | 直接入库 |
| Rejected Reason | enquiry.rejected_reason | 直接入库 |
| Actual Reason | enquiry.actual_reason | 直接入库 |
| (由Cargo Type映射) | enquiry.enquiry_offer_type | 从 dict_cargo_type.offer_type 写入，用于约束 offer_type 唯一性 |

### 6.2 箱型明细导入规则（Quantity(Unit) -> enquiry_container_line）
- 触发条件：
  - cargo_type_code = FCL，或
  - quantity_uom_raw_text 包含箱型组合表达（如 `1x40HC + 1x20DC`）
- 解析失败：
  - container_line 不落库
  - 保留 quantity_uom_raw_text 并记录错误（建议有错误表/日志）

导入成功后：
- 更新 enquiry.quantity_teu = SUM(container_qty * container_types.teu_value)

### 6.3 Offer 导入规则（CSV 报价列 -> offer）
你业务规则：**同一 enquiry 只允许一种报价类型**，因此导入逻辑：
1) 由 `enquiry.enquiry_offer_type`（或 cargo_type 映射）确定报价类型
2) 只导入与该类型对应的报价列：
   - OCEAN：读取 Ocean Frg 列
   - AIR：读取 Air Frg/KG 列
3) 报价日期：
   - `1st Quotation Sent` -> offer.sent_date / sent_date_raw_text（sequence_no=1）
4) 最新报价：
   - CSV `Latest Offer` 有值时，插入 sequence_no=2, is_latest=1；并将 sequence_no=1 is_latest=0
5) 价格解析：
   - 能解析出数值则写入 offer.price（例如 `USD4.60` => 4.60）
   - 复杂文本（`USD3.45 ALL IN`、`USD4300/5005/6750`）写入 offer.price_text，price=NULL

> 冗余字段清理后的说明：由于删除了 currency/uom_code，建议把所有原始报价字符串完整写入 price_text，避免信息丢失。

---

## 7. 数据一致性与校验规则（建议在应用层实现）

1. `issue_date` 不允许更新  
2. `cn_pricing_admin` 默认当前登录用户且不允许更新  
3. `sales_office` 必须存在于 dict_sales_office（强制下拉）  
4. `assigned_cn_office`、`cargo_type` 必须存在字典且 is_active=1  
5. `pod_country_id` 必须等于 pod_id 所指 port.country_id（写入时自动赋值）  
6. 同一 enquiry 的 offer 只允许一种 offer_type，且必须等于 enquiry.enquiry_offer_type  

---

# 附录 A：实施顺序建议（避免导入失败）
1. 维护主数据：country、port、dict_sales_office、dict_cn_office、dict_cargo_type、dict_product、dict_uom、dict_category、container_types
2. 导入 enquiry（先落主表，原始值保留）
3. 解析并落 enquiry_container_line（如有）
4. 导入 offer（按 enquiry_offer_type 规则只取一种报价列）
5. 回写 quantity_teu（箱型汇总）