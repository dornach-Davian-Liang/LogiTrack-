-- ============================================================
-- LogiTrack Pro - MySQL 数据库表结构 v2
-- 主要变更：
--   1. country 表保留 id，但业务表改用 country_code 关联
--   2. port 表增加 port_type (AIR/SEA)，通过 country_code 关联
--   3. dict_sales_office 增加 code（唯一）和 country_code
--   4. 新建 sales_pic 表（country_code + sales_office_id）
--   5. enquiry 表改用 country_code 关联，新增 sales_pic_id
-- 更新日期: 2026-01-28
-- ============================================================

CREATE DATABASE IF NOT EXISTS logitrack
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE logitrack;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 主数据表
-- ============================================================

-- 1.1 国家表（country_code 作为业务主键供关联）
DROP TABLE IF EXISTS country;
CREATE TABLE country (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键（内部用）',
  country_code CHAR(2) NOT NULL COMMENT '国家代码（ISO 3166-1 alpha-2，如 CN/FR/DE）',
  country_name_en VARCHAR(100) NOT NULL COMMENT '国家英文名',
  country_name_cn VARCHAR(100) NULL COMMENT '国家中文名',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_country_code (country_code),
  KEY idx_country_name (country_name_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='国家主数据';

-- 1.2 港口/机场表（增加 port_type，通过 country_code 关联）
DROP TABLE IF EXISTS port;
CREATE TABLE port (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  port_code VARCHAR(10) NOT NULL COMMENT '港口/机场编码（IATA 3字码或 UN/LOCODE 5字码）',
  port_name VARCHAR(200) NOT NULL COMMENT '展示名称',
  port_type ENUM('AIR','SEA') NOT NULL COMMENT '类型：AIR=机场，SEA=海港（RAIL 复用 SEA）',
  country_code CHAR(2) NULL COMMENT '所属国家代码（FK country.country_code）',
  city VARCHAR(100) NULL COMMENT '城市名',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_port_code_type (port_code, port_type),
  KEY idx_port_country (country_code),
  KEY idx_port_type (port_type),
  KEY idx_port_name (port_name),

  CONSTRAINT fk_port_country
    FOREIGN KEY (country_code) REFERENCES country(country_code)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='港口/机场主数据（AIR/SEA，RAIL复用SEA）';

-- 1.3 销售办公室字典表（增加 code 和 country_code）
DROP TABLE IF EXISTS dict_sales_office;
CREATE TABLE dict_sales_office (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  code VARCHAR(50) NOT NULL COMMENT '办公室代码（唯一，如 FR-ZF, BE-ZB, AG-AFS）',
  name VARCHAR(100) NOT NULL COMMENT '办公室名称（展示），如 ZIEGLER FRANCE',
  name_norm VARCHAR(120) NOT NULL COMMENT '名称规范化（TRIM+UPPER+多空格归一）',
  country_code CHAR(10) NULL COMMENT '所属国家代码（AGENTS/OTHERS/TBA 等特殊值也存这里）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
  remark VARCHAR(255) NULL COMMENT '备注',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_sales_office_code (code),
  UNIQUE KEY uk_sales_office_name_norm (name_norm),
  KEY idx_sales_office_country (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售办公室字典';

-- 1.4 销售负责人表（用户选 country + pic → 自动映射 office）
DROP TABLE IF EXISTS sales_pic;
CREATE TABLE sales_pic (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  name VARCHAR(100) NOT NULL COMMENT '销售负责人姓名',
  name_norm VARCHAR(120) NOT NULL COMMENT '规范化姓名（TRIM+UPPER）',
  country_code CHAR(10) NOT NULL COMMENT '所属销售国家代码（AGENTS/FRANCE/UK 等）',
  sales_office_id INT NOT NULL COMMENT '所属销售办公室ID（FK dict_sales_office）',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_sales_pic_country_name (country_code, name_norm),
  KEY idx_sales_pic_office (sales_office_id),

  CONSTRAINT fk_sales_pic_office
    FOREIGN KEY (sales_office_id) REFERENCES dict_sales_office(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售负责人（PIC）';

-- 1.5 箱型配置表
DROP TABLE IF EXISTS container_types;
CREATE TABLE container_types (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  container_code VARCHAR(20) NOT NULL COMMENT '箱型代码（如20GP/40HQ）',
  container_name VARCHAR(50) NOT NULL COMMENT '箱型名称',
  teu_value DECIMAL(6,2) NOT NULL COMMENT 'TEU折算值',
  length_feet INT NULL COMMENT '长度（英尺）',
  is_special BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否特殊箱型',
  description TEXT NULL COMMENT '描述',
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_container_code (container_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='集装箱类型配置';

-- ============================================================
-- 2. 字典/下拉配置表
-- ============================================================

DROP TABLE IF EXISTS dict_cn_office;
CREATE TABLE dict_cn_office (
  code VARCHAR(50) PRIMARY KEY COMMENT '代码',
  name VARCHAR(100) NOT NULL COMMENT '名称',
  is_active BOOLEAN NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='CN办公室字典';

DROP TABLE IF EXISTS dict_cargo_type;
CREATE TABLE dict_cargo_type (
  code VARCHAR(20) PRIMARY KEY COMMENT '代码：AIR/LCL/FCL/RAIL/SEA',
  name VARCHAR(100) NOT NULL COMMENT '名称',
  offer_type ENUM('OCEAN','AIR','OTHER') NOT NULL COMMENT '对应报价类型',
  is_active BOOLEAN NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运输类型字典';

DROP TABLE IF EXISTS dict_product;
CREATE TABLE dict_product (
  code VARCHAR(30) PRIMARY KEY COMMENT '产品代码',
  name VARCHAR(100) NOT NULL COMMENT '名称',
  abbr VARCHAR(10) NOT NULL COMMENT '缩写',
  is_active BOOLEAN NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品字典';

DROP TABLE IF EXISTS dict_uom;
CREATE TABLE dict_uom (
  code VARCHAR(20) PRIMARY KEY COMMENT '单位代码',
  name VARCHAR(100) NOT NULL COMMENT '名称',
  is_active BOOLEAN NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单位字典';

DROP TABLE IF EXISTS dict_category;
CREATE TABLE dict_category (
  code VARCHAR(50) PRIMARY KEY COMMENT '分类代码',
  name VARCHAR(100) NOT NULL COMMENT '分类名称',
  name_norm VARCHAR(100) NOT NULL COMMENT '规范化名称',
  is_active BOOLEAN NOT NULL DEFAULT 1,
  UNIQUE KEY uk_category_name_norm (name_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价分类字典';

-- ============================================================
-- 3. 询价主表（改用 country_code 关联，新增 sales_pic_id）
-- ============================================================

DROP TABLE IF EXISTS enquiry;
CREATE TABLE enquiry (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',

  reference_number VARCHAR(50) NOT NULL COMMENT '询价编号',
  enquiry_received_date DATE NOT NULL COMMENT '收到询价日期',
  issue_date DATE NOT NULL COMMENT '创建日期',

  reference_month CHAR(4) NOT NULL COMMENT 'YYMM',
  monthly_sequence INT NOT NULL COMMENT '当月序号',
  serial_number INT NOT NULL DEFAULT 0 COMMENT '编号尾部序号',

  product_code VARCHAR(30) NOT NULL COMMENT '产品类型',
  product_abbr VARCHAR(10) NOT NULL COMMENT '产品缩写',

  status ENUM('New','Quoted','Cancelled') NOT NULL DEFAULT 'New' COMMENT '状态',
  cn_pricing_admin VARCHAR(100) NOT NULL COMMENT 'CN定价管理员',

  -- 改用 country_code 关联
  sales_country_code CHAR(10) NOT NULL COMMENT '销售国家代码（AGENTS/FRANCE/UK 等）',
  sales_office_id INT NOT NULL COMMENT '销售办公室ID',
  sales_pic_id INT NULL COMMENT '销售负责人ID（FK sales_pic）',

  assigned_cn_office_code VARCHAR(50) NOT NULL COMMENT '指派CN办公室',
  cargo_type_code VARCHAR(20) NOT NULL COMMENT '运输类型',

  volume_cbm DECIMAL(12,3) NULL COMMENT '体积CBM',
  volume_raw_text VARCHAR(100) NULL COMMENT '体积原始文本',

  quantity DECIMAL(12,3) NULL COMMENT '数量',
  quantity_raw_text VARCHAR(100) NULL COMMENT '数量原始文本',

  quantity_uom_code VARCHAR(20) NULL COMMENT '数量单位',
  quantity_uom_raw_text VARCHAR(200) NULL COMMENT '数量单位原始文本',

  quantity_teu DECIMAL(12,3) NULL COMMENT 'TEU',
  quantity_teu_raw_text VARCHAR(100) NULL COMMENT 'TEU原始文本',

  commodity TEXT NULL COMMENT '品名',
  haz_special_equipment TEXT NULL COMMENT '危险品/特殊设备',

  pol_id INT NOT NULL COMMENT '起运港ID',
  pod_id INT NOT NULL COMMENT '目的港ID',
  pod_country_code CHAR(2) NULL COMMENT '目的港国家代码',

  core_flag ENUM('CORE','NON_CORE') NULL COMMENT 'CORE/NON_CORE',
  category_code VARCHAR(50) NULL COMMENT '分类',

  cargo_ready_date DATE NULL COMMENT '货好日期',
  cargo_ready_date_raw_text VARCHAR(100) NULL COMMENT '货好日期原始文本',

  additional_requirement TEXT NULL COMMENT '附加要求',

  booking_confirmed ENUM('Yes','Rejected','Pending','Invalid') NOT NULL DEFAULT 'Pending',
  remark TEXT NULL COMMENT '备注',
  rejected_reason TEXT NULL COMMENT '拒绝原因',
  actual_reason TEXT NULL COMMENT '实际原因',

  enquiry_offer_type ENUM('OCEAN','AIR','OTHER') NULL COMMENT '报价类型',

  reserve_field_1 VARCHAR(255) NULL,
  reserve_field_2 VARCHAR(255) NULL,
  reserve_field_3 VARCHAR(255) NULL,
  reserve_field_4 VARCHAR(255) NULL,
  reserve_field_5 VARCHAR(255) NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NULL,
  updated_by VARCHAR(100) NULL,

  UNIQUE KEY uk_reference_number (reference_number),
  KEY idx_issue_date (issue_date),
  KEY idx_reference_month_seq (reference_month, monthly_sequence),
  KEY idx_sales_country (sales_country_code),
  KEY idx_sales_office (sales_office_id),
  KEY idx_sales_pic (sales_pic_id),
  KEY idx_status (status),
  KEY idx_booking (booking_confirmed),
  KEY idx_pol (pol_id),
  KEY idx_pod (pod_id),
  KEY idx_pod_country (pod_country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价主表';

-- ============================================================
-- 4. 报价子表
-- ============================================================

DROP TABLE IF EXISTS offer;
CREATE TABLE offer (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  enquiry_id BIGINT NOT NULL COMMENT '询价ID',

  offer_type ENUM('OCEAN','AIR','OTHER') NOT NULL COMMENT '报价类型',
  sequence_no INT NOT NULL DEFAULT 1 COMMENT '报价次数',
  is_latest BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否最新报价',

  sent_date DATE NULL COMMENT '报价发送日期',
  sent_date_raw_text VARCHAR(100) NULL COMMENT '发送日期原始文本',

  price DECIMAL(18,4) NULL COMMENT '数值价格',
  price_text TEXT NULL COMMENT '报价原文',

  is_rejected_price BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否被拒报价',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
  ADD CONSTRAINT fk_enquiry_sales_office FOREIGN KEY (sales_office_id) REFERENCES dict_sales_office(id),
  ADD CONSTRAINT fk_enquiry_sales_pic    FOREIGN KEY (sales_pic_id)    REFERENCES sales_pic(id),
  ADD CONSTRAINT fk_enquiry_pol          FOREIGN KEY (pol_id)          REFERENCES port(id),
  ADD CONSTRAINT fk_enquiry_pod          FOREIGN KEY (pod_id)          REFERENCES port(id);

ALTER TABLE enquiry
  ADD CONSTRAINT fk_enquiry_assigned_cn_office FOREIGN KEY (assigned_cn_office_code) REFERENCES dict_cn_office(code),
  ADD CONSTRAINT fk_enquiry_cargo_type         FOREIGN KEY (cargo_type_code)        REFERENCES dict_cargo_type(code),
  ADD CONSTRAINT fk_enquiry_product            FOREIGN KEY (product_code)           REFERENCES dict_product(code),
  ADD CONSTRAINT fk_enquiry_uom                FOREIGN KEY (quantity_uom_code)      REFERENCES dict_uom(code),
  ADD CONSTRAINT fk_enquiry_category           FOREIGN KEY (category_code)          REFERENCES dict_category(code);

-- 注意：sales_country_code 不强制 FK，因为包含 AGENTS/OTHERS/TBA 等特殊值
-- pod_country_code 也不强制 FK，因为可能历史数据国家未录入

-- ============================================================
-- 7. 初始化字典数据
-- ============================================================

INSERT INTO dict_cn_office (code, name) VALUES
('SHANGHAI', 'Shanghai'),
('SHENZHEN', 'Shenzhen'),
('NINGBO', 'Ningbo'),
('HONG KONG', 'Hong Kong'),
('TIANJIN', 'Tianjin'),
('QINGDAO', 'Qingdao'),
('XIAMEN', 'Xiamen'),
('CN-MULTI', 'CN-Multi');

INSERT INTO dict_cargo_type (code, name, offer_type) VALUES
('AIR', 'Air Freight', 'AIR'),
('FCL', 'Full Container Load', 'OCEAN'),
('LCL', 'Less than Container Load', 'OCEAN'),
('RAIL', 'Rail Freight', 'OTHER'),
('SEA', 'Sea Freight', 'OCEAN');

INSERT INTO dict_product (code, name, abbr) VALUES
('AIR', 'Air Freight', 'A'),
('SEA', 'Sea Freight', 'S'),
('SEA-AIR', 'Sea-Air Combined', 'SA'),
('RAIL', 'Rail Freight', 'R'),
('RAIL-SEA', 'Rail-Sea Combined', 'RS'),
('RAIL-AIR', 'Rail-Air Combined', 'RA'),
('AIR-RAIL-SEA', 'Air-Rail-Sea Combined', 'ARS');

INSERT INTO dict_uom (code, name) VALUES
('KG', 'Kilogram'),
('PCS', 'Pieces'),
('CTN', 'Cartons'),
('PLT', 'Pallets'),
('SET', 'Sets');

INSERT INTO dict_category (code, name, name_norm) VALUES
('ORIGIN_CHARGES_EXW', 'Origin Charges & EXW', 'ORIGIN CHARGES & EXW'),
('OCEAN_FREIGHT', 'Ocean Freight', 'OCEAN FREIGHT'),
('AIR_FREIGHT', 'Air Freight', 'AIR FREIGHT'),
('AIR_FREIGHT_ORIGIN', 'Air Freight + Origin Charge & EXW', 'AIR FREIGHT + ORIGIN CHARGE & EXW'),
('OCEAN_FREIGHT_ORIGIN', 'Ocean Freight + Origin Charges & EXW', 'OCEAN FREIGHT + ORIGIN CHARGES & EXW'),
('LCL', 'LCL', 'LCL'),
('OCEAN_FREIGHT_ORIGIN_DEST', 'Ocean Freight + Origin Charges & EXW + Dest. Charges', 'OCEAN FREIGHT + ORIGIN CHARGES & EXW + DEST. CHARGES'),
('DEST_CHARGES', 'Dest. Charges', 'DEST. CHARGES');

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
SELECT 'Schema v2 created successfully!' AS status;
