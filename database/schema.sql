-- ============================================================
-- LogiTrack Pro - MySQL 数据库表结构（正式版）
-- 根据 enquiry_mysql_design_spec.md 设计
-- 数据来源：China Pricing - Enquiry Record-working(Rate Enquiry Summary).csv
-- 更新日期: 2026-01-26
-- ============================================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS logitrack
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE logitrack;

-- 关闭外键检查，方便重复执行（DROP/CREATE 顺序不再受限）
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 主数据表（先创建，被其他表引用）
-- ============================================================

-- 1.1 国家表
DROP TABLE IF EXISTS country;
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

-- 1.2 港口/机场/站点表（去掉mode过滤，支持全部值域选择）
DROP TABLE IF EXISTS port;
CREATE TABLE port (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  port_code VARCHAR(120) NOT NULL COMMENT '港口/机场/站点编码（系统内唯一，支持组合港口）',
  port_name VARCHAR(200) NOT NULL COMMENT '展示名称，如 Hong Kong / Qingdao / PVG',
  country_id INT NULL COMMENT '所属国家ID（用于统计）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间戳',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间戳',

  UNIQUE KEY uk_port_code (port_code),
  KEY idx_port_country (country_id),

  CONSTRAINT fk_port_country
    FOREIGN KEY (country_id) REFERENCES country(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='港口/机场/站点主数据（含POL/POD）';

-- 1.3 销售办公室字典表
DROP TABLE IF EXISTS dict_sales_office;
CREATE TABLE dict_sales_office (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  name VARCHAR(100) NOT NULL COMMENT '办公室名称（下拉显示），例如 ZIEGLER FRANCE',
  name_norm VARCHAR(120) NOT NULL COMMENT '名称规范化（用于唯一性与匹配，TRIM+UPPER+多空格归一）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
  remark VARCHAR(255) NULL COMMENT '备注',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间戳',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间戳',
  UNIQUE KEY uk_sales_office_name_norm(name_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售办公室字典（按name维护）';

-- 1.4 箱型配置表
DROP TABLE IF EXISTS container_types;
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

-- ============================================================
-- 2. 字典/下拉配置表
-- ============================================================

-- 2.1 CN办公室下拉
DROP TABLE IF EXISTS dict_cn_office;
CREATE TABLE dict_cn_office (
  code VARCHAR(50) PRIMARY KEY COMMENT '代码，如SHENZHEN/HONGKONG/SHANGHAI',
  name VARCHAR(100) NOT NULL COMMENT '名称（展示）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='CN办公室字典';

-- 2.2 运输类型下拉（简化版，去掉mode过滤）
DROP TABLE IF EXISTS dict_cargo_type;
CREATE TABLE dict_cargo_type (
  code VARCHAR(20) PRIMARY KEY COMMENT '代码：AIR/LCL/FCL/RAIL/SEA等',
  name VARCHAR(100) NOT NULL COMMENT '名称（展示）',
  offer_type ENUM('OCEAN','AIR','OTHER') NOT NULL COMMENT '该cargo_type对应的报价类型',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运输类型字典';

-- 2.3 产品下拉（SEA-AIR/AIR-RAIL-SEA等）
DROP TABLE IF EXISTS dict_product;
CREATE TABLE dict_product (
  code VARCHAR(30) PRIMARY KEY COMMENT '产品代码：SEA/AIR/SEA-AIR/AIR-RAIL-SEA等',
  name VARCHAR(100) NOT NULL COMMENT '名称（展示）',
  abbr VARCHAR(10) NOT NULL COMMENT '缩写：用于生成reference_number，如ARS',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品字典';

-- 2.4 单位字典（KG/PCS等）
DROP TABLE IF EXISTS dict_uom;
CREATE TABLE dict_uom (
  code VARCHAR(20) PRIMARY KEY COMMENT '单位代码：KG/PCS/CTN等',
  name VARCHAR(100) NOT NULL COMMENT '名称（展示）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单位字典';

-- 2.5 分类字典（增加name_norm规范化字段）
DROP TABLE IF EXISTS dict_category;
CREATE TABLE dict_category (
  code VARCHAR(50) PRIMARY KEY COMMENT '分类代码（可直接用英文短语或内部码）',
  name VARCHAR(100) NOT NULL COMMENT '分类名称（展示）',
  name_norm VARCHAR(100) NOT NULL COMMENT '规范化名称（UPPER+TRIM，用于匹配）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  UNIQUE KEY uk_category_name_norm (name_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价分类字典（Category）';

-- ============================================================
-- 3. 询价主表
-- ============================================================

DROP TABLE IF EXISTS enquiry;
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

  -- Status 增加 Cancelled
  status ENUM('New','Quoted','Cancelled') NOT NULL DEFAULT 'New' COMMENT '状态：New/Quoted/Cancelled',
  cn_pricing_admin VARCHAR(100) NOT NULL COMMENT 'CN定价管理员（默认登录用户，不可改）',

  sales_country_id INT NOT NULL COMMENT '销售国家ID（FK country）',
  sales_office_id INT NOT NULL COMMENT '销售办公室ID（FK dict_sales_office，按name映射）',
  sales_pic VARCHAR(100) NULL COMMENT '销售负责人（自由文本）',

  assigned_cn_office_code VARCHAR(50) NOT NULL COMMENT '指派CN办公室（FK dict_cn_office）',
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

  -- Booking Confirmed 增加 Invalid
  booking_confirmed ENUM('Yes','Rejected','Pending','Invalid') NOT NULL DEFAULT 'Pending' COMMENT '订舱确认状态',
  remark TEXT NULL COMMENT '备注',
  rejected_reason TEXT NULL COMMENT '拒绝原因',
  actual_reason TEXT NULL COMMENT '实际原因',

  -- 简化 offer_type 枚举
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

-- ============================================================
-- 4. 报价子表
-- ============================================================

DROP TABLE IF EXISTS offer;
CREATE TABLE offer (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  enquiry_id BIGINT NOT NULL COMMENT '询价ID（FK enquiry）',

  -- 简化 offer_type 枚举
  offer_type ENUM('OCEAN','AIR','OTHER') NOT NULL COMMENT '报价类型（同一enquiry只允许一种）',
  sequence_no INT NOT NULL DEFAULT 1 COMMENT '报价次数：1=1st，2=2nd...',
  is_latest BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否最新报价',

  sent_date DATE NULL COMMENT '报价发送日期（可解析则填）',
  sent_date_raw_text VARCHAR(100) NULL COMMENT '报价发送日期原始文本（TBA/Week 5/Jan等）',

  price DECIMAL(18,4) NULL COMMENT '可解析数值价格（解析失败则NULL）',
  price_text TEXT NULL COMMENT '报价原文（如USD3.45 ALL IN、USD4300/5005/6750；可能很长）',

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

-- ============================================================
-- 5. 箱型明细表
-- ============================================================

DROP TABLE IF EXISTS enquiry_container_line;
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

-- ============================================================
-- 6. 外键约束（enquiry 表）
-- ============================================================

ALTER TABLE enquiry
  ADD CONSTRAINT fk_enquiry_sales_country FOREIGN KEY (sales_country_id) REFERENCES country(id),
  ADD CONSTRAINT fk_enquiry_sales_office  FOREIGN KEY (sales_office_id)  REFERENCES dict_sales_office(id),
  ADD CONSTRAINT fk_enquiry_pol          FOREIGN KEY (pol_id)           REFERENCES port(id),
  ADD CONSTRAINT fk_enquiry_pod          FOREIGN KEY (pod_id)           REFERENCES port(id),
  ADD CONSTRAINT fk_enquiry_pod_country  FOREIGN KEY (pod_country_id)   REFERENCES country(id);

-- 字典外键（强制下拉）
ALTER TABLE enquiry
  ADD CONSTRAINT fk_enquiry_assigned_cn_office FOREIGN KEY (assigned_cn_office_code) REFERENCES dict_cn_office(code),
  ADD CONSTRAINT fk_enquiry_cargo_type         FOREIGN KEY (cargo_type_code)        REFERENCES dict_cargo_type(code),
  ADD CONSTRAINT fk_enquiry_product            FOREIGN KEY (product_code)           REFERENCES dict_product(code),
  ADD CONSTRAINT fk_enquiry_uom                FOREIGN KEY (quantity_uom_code)      REFERENCES dict_uom(code),
  ADD CONSTRAINT fk_enquiry_category           FOREIGN KEY (category_code)          REFERENCES dict_category(code);

-- ============================================================
-- 7. 初始化字典数据
-- ============================================================

-- 7.1 CN办公室
INSERT INTO dict_cn_office (code, name) VALUES
('SHANGHAI', 'Shanghai'),
('SHENZHEN', 'Shenzhen'),
('NINGBO', 'Ningbo'),
('HONG KONG', 'Hong Kong'),
('TIANJIN', 'Tianjin'),
('QINGDAO', 'Qingdao'),
('XIAMEN', 'Xiamen'),
('CN-MULTI', 'CN-Multi');

-- 7.2 运输类型（简化offer_type）
INSERT INTO dict_cargo_type (code, name, offer_type) VALUES
('AIR', 'Air Freight', 'AIR'),
('FCL', 'Full Container Load', 'OCEAN'),
('LCL', 'Less than Container Load', 'OCEAN'),
('RAIL', 'Rail Freight', 'OTHER'),
('SEA', 'Sea Freight', 'OCEAN');

-- 7.3 产品类型
INSERT INTO dict_product (code, name, abbr) VALUES
('AIR', 'Air Freight', 'A'),
('SEA', 'Sea Freight', 'S'),
('SEA-AIR', 'Sea-Air Combined', 'SA'),
('RAIL', 'Rail Freight', 'R'),
('RAIL-SEA', 'Rail-Sea Combined', 'RS'),
('RAIL-AIR', 'Rail-Air Combined', 'RA'),
('AIR-RAIL-SEA', 'Air-Rail-Sea Combined', 'ARS');

-- 7.4 单位
INSERT INTO dict_uom (code, name) VALUES
('KG', 'Kilogram'),
('PCS', 'Pieces'),
('CTN', 'Cartons'),
('PLT', 'Pallets'),
('SET', 'Sets');

-- 7.5 分类（规范化name_norm）
INSERT INTO dict_category (code, name, name_norm) VALUES
('ORIGIN_CHARGES_EXW', 'Origin Charges & EXW', 'ORIGIN CHARGES & EXW'),
('OCEAN_FREIGHT', 'Ocean Freight', 'OCEAN FREIGHT'),
('AIR_FREIGHT', 'Air Freight', 'AIR FREIGHT'),
('AIR_FREIGHT_ORIGIN', 'Air Freight + Origin Charge & EXW', 'AIR FREIGHT + ORIGIN CHARGE & EXW'),
('OCEAN_FREIGHT_ORIGIN', 'Ocean Freight + Origin Charges & EXW', 'OCEAN FREIGHT + ORIGIN CHARGES & EXW'),
('LCL', 'LCL', 'LCL'),
('OCEAN_FREIGHT_ORIGIN_DEST', 'Ocean Freight + Origin Charges & EXW + Dest. Charges', 'OCEAN FREIGHT + ORIGIN CHARGES & EXW + DEST. CHARGES'),
('DEST_CHARGES', 'Dest. Charges', 'DEST. CHARGES');

-- 7.6 箱型配置
INSERT INTO container_types (container_code, container_name, teu_value, length_feet, is_special) VALUES
('20GP', '20\' General Purpose', 1.00, 20, 0),
('40GP', '40\' General Purpose', 2.00, 40, 0),
('40HQ', '40\' High Cube', 2.00, 40, 0),
('40HC', '40\' High Cube', 2.00, 40, 0),
('45HQ', '45\' High Cube', 2.25, 45, 0),
('20RF', '20\' Reefer', 1.00, 20, 1),
('40RF', '40\' Reefer', 2.00, 40, 1),
('20OT', '20\' Open Top', 1.00, 20, 1),
('40OT', '40\' Open Top', 2.00, 40, 1),
('20FR', '20\' Flat Rack', 1.00, 20, 1),
('40FR', '40\' Flat Rack', 2.00, 40, 1);

-- ============================================================
-- 验证
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
SELECT 'Schema created successfully!' AS status;
