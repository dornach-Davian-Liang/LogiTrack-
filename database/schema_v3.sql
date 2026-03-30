-- ============================================================
-- LogiTrack Pro - MySQL 数据库表结构 v3（需求重构版）
-- 根据 Master Prompt 规格文档设计
-- 更新日期: 2026-03-24
-- ============================================================
-- 执行说明：
--   1. 清空旧 enquiry/offer 相关表并重新创建
--   2. 保留 country, port, container_types, dict_sales_office 等已有主数据
--   3. dict_product / dict_cargo_type 等表重建
--   4. 从 sales_pic 迁移数据到 dict_sales_pic
--   5. 新建 dict_sales_country（从已有 sales 数据聚合）
-- ============================================================

CREATE DATABASE IF NOT EXISTS logitrack
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE logitrack;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- STEP 0: 清除旧 enquiry / offer 相关业务表
-- ============================================================
DROP TABLE IF EXISTS offer_container_detail;
DROP TABLE IF EXISTS offer_price_line;
DROP TABLE IF EXISTS offer;
DROP TABLE IF EXISTS enquiry_route_group_pod;
DROP TABLE IF EXISTS enquiry_route_group_pol;
DROP TABLE IF EXISTS enquiry_route_group;
DROP TABLE IF EXISTS enquiry_container_line;
DROP TABLE IF EXISTS enquiry_pod;
DROP TABLE IF EXISTS enquiry_pol;
DROP TABLE IF EXISTS enquiry;

-- 清除旧字典表（将重建）
DROP TABLE IF EXISTS dict_product_cargo_allowed;
DROP TABLE IF EXISTS dict_cancelled_reason;
DROP TABLE IF EXISTS dict_lost_reason;

-- ============================================================
-- STEP 1: 产品类型字典（重建）
-- ============================================================
DROP TABLE IF EXISTS dict_product;
CREATE TABLE dict_product (
  code       VARCHAR(20)  PRIMARY KEY,
  abbr       VARCHAR(10)  NOT NULL,
  name       VARCHAR(100) NOT NULL,
  is_mixed   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '是否混合模式',
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品类型字典 v3';

INSERT INTO dict_product VALUES
('AIR',         'A',   'Air Freight',          0, 1, 1),
('SEA',         'S',   'Sea Freight',          0, 1, 2),
('RAIL',        'R',   'Rail Freight',         0, 1, 3),
('RAIL-SEA',    'RS',  'Rail-Sea Combined',    1, 1, 4),
('RAIL-AIR',    'RA',  'Rail-Air Combined',    1, 1, 5),
('SEA-AIR',     'SA',  'Sea-Air Combined',     1, 1, 6),
('AIR-RAIL-SEA','ARS', 'Air-Rail-Sea Combined',1, 1, 7);

-- ============================================================
-- STEP 2: Cargo Type 字典（重建 — 结构变更: 去掉 offer_type, 加 needs_container）
-- ============================================================
DROP TABLE IF EXISTS dict_cargo_type;
CREATE TABLE dict_cargo_type (
  code            VARCHAR(20)  PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  needs_container TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'FCL/BUYER-CONSOL=1',
  is_active       TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Cargo 类型字典 v3';

INSERT INTO dict_cargo_type VALUES
('AIR',         'Air Freight',         0, 1),
('FCL',         'Full Container Load', 1, 1),
('LCL',         'Less Container Load', 0, 1),
('BUYER-CONSOL','Buyer Consolidation', 1, 1);

-- ============================================================
-- STEP 3: Product × Cargo Type 关联表
-- ============================================================
CREATE TABLE dict_product_cargo_allowed (
  product_code    VARCHAR(20) NOT NULL,
  cargo_type_code VARCHAR(20) NOT NULL,
  PRIMARY KEY (product_code, cargo_type_code),
  FOREIGN KEY (product_code)    REFERENCES dict_product(code),
  FOREIGN KEY (cargo_type_code) REFERENCES dict_cargo_type(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Product × Cargo Type 白名单';

INSERT INTO dict_product_cargo_allowed VALUES
('AIR',         'AIR'),
('SEA',         'FCL'), ('SEA',         'LCL'), ('SEA',         'BUYER-CONSOL'),
('RAIL',        'FCL'), ('RAIL',        'LCL'),
('RAIL-SEA',    'FCL'), ('RAIL-SEA',    'LCL'),
('RAIL-AIR',    'AIR'), ('RAIL-AIR',    'LCL'),
('SEA-AIR',     'AIR'), ('SEA-AIR',     'LCL'),
('AIR-RAIL-SEA','AIR'), ('AIR-RAIL-SEA','LCL');

-- ============================================================
-- STEP 4: 销售国家 dict_sales_country（新表，从已有数据聚合）
-- ============================================================
CREATE TABLE IF NOT EXISTS dict_sales_country (
  code       VARCHAR(50)  PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售国家/Agent 字典';

-- 从 sales_pic 和 country 表聚合数据
INSERT IGNORE INTO dict_sales_country (code, name, sort_order, is_active)
SELECT DISTINCT
    sp.country_code AS code,
    COALESCE(c.country_name_en, sp.country_code) AS name,
    CASE sp.country_code
        WHEN 'CN' THEN 1
        WHEN 'FR' THEN 2
        WHEN 'DE' THEN 3
        WHEN 'GB' THEN 4
        WHEN 'BE' THEN 5
        WHEN 'NL' THEN 6
        WHEN 'CH' THEN 7
        WHEN 'ZA' THEN 8
        WHEN 'US' THEN 9
        WHEN 'MA' THEN 10
        WHEN 'GR' THEN 11
        WHEN 'PL' THEN 12
        WHEN 'AG' THEN 90
        WHEN 'AGENTS' THEN 91
        WHEN 'TB' THEN 95
        WHEN 'OT' THEN 96
        WHEN 'OTHERS' THEN 97
        ELSE 50
    END AS sort_order,
    1 AS is_active
FROM sales_pic sp
LEFT JOIN country c ON sp.country_code = c.country_code
GROUP BY sp.country_code;

-- ============================================================
-- STEP 5: dict_sales_office — 确保有 sales_country_code 列
-- ============================================================
-- dict_sales_office 已存在，保留原数据，仅添加 sales_country_code 列
-- 注意：MySQL 不支持 ADD COLUMN IF NOT EXISTS，用procedure或忽略错误

-- 检查列是否存在再添加
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = 'logitrack'
                   AND TABLE_NAME = 'dict_sales_office'
                   AND COLUMN_NAME = 'sales_country_code');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE dict_sales_office ADD COLUMN sales_country_code VARCHAR(50) NULL AFTER name',
    'SELECT "sales_country_code column already exists" AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 用现有 country_code 列填充 sales_country_code（如果为空）
UPDATE dict_sales_office
SET sales_country_code = country_code
WHERE sales_country_code IS NULL AND country_code IS NOT NULL AND country_code != '';

-- ============================================================
-- STEP 6: dict_sales_pic（新表，从 sales_pic 迁移数据）
-- ============================================================
DROP TABLE IF EXISTS dict_sales_pic;
CREATE TABLE dict_sales_pic (
  id                 INT          PRIMARY KEY AUTO_INCREMENT,
  name               VARCHAR(100) NOT NULL,
  sales_country_code VARCHAR(50)  NOT NULL,
  sales_office_id    INT          NOT NULL,
  is_active          TINYINT(1)   NOT NULL DEFAULT 1,
  FOREIGN KEY (sales_country_code) REFERENCES dict_sales_country(code),
  FOREIGN KEY (sales_office_id)    REFERENCES dict_sales_office(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售 PIC 字典 v3';

-- 从旧 sales_pic 表迁移数据（保留原 ID 以便兼容）
INSERT INTO dict_sales_pic (id, name, sales_country_code, sales_office_id, is_active)
SELECT id, name, country_code, sales_office_id, is_active
FROM sales_pic;

-- ============================================================
-- STEP 7: 取消原因字典
-- ============================================================
CREATE TABLE dict_cancelled_reason (
  code       VARCHAR(50)  PRIMARY KEY,
  label      VARCHAR(200) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='取消原因字典';

INSERT INTO dict_cancelled_reason VALUES
('HUMAN_ERROR', 'Human Error',                            1),
('WITHDRAW',    'Withdraw enquiry',                       2),
('OTHERS',      'Others - reason required (Free text)',   3);

-- ============================================================
-- STEP 8: 丢单原因字典
-- ============================================================
CREATE TABLE dict_lost_reason (
  code       VARCHAR(100) PRIMARY KEY,
  label      VARCHAR(200) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='丢单原因字典';

INSERT INTO dict_lost_reason VALUES
('CANCEL_NVOCC',           'Cancel Booking - arranged by other NVOCC',  1),
('CANCEL_AIR',             'Cancel Booking - arranged by Air',           2),
('CANCEL_SEA',             'Cancel Booking - arranged by Sea',           3),
('CANCEL_TRAIN',           'Cancel Booking - arranged by Train',         4),
('CANCEL_PO',              'Cancel Booking - PO Cancelled',              5),
('PRODUCTION',             'Production problem',                         6),
('RATE_CHECK_INDICATION',  'Rate Checking - For indication only',        7),
('RATE_CHECK_NO_FEEDBACK', 'Rate Checking - No feedback from customer',  8),
('RATE_ISSUE_FREIGHT',     'Rate Issue-freight',                         9),
('RATE_ISSUE_LOCAL',       'Rate Issue-local charges',                  10),
('SPACE_ISSUE',            'Space Issue',                               11),
('OTHERS',                 'Others - reason required (Free text)',       12);

-- ============================================================
-- STEP 9: port 表 port_type 枚举扩展（加 RAIL）
-- ============================================================
ALTER TABLE port MODIFY COLUMN port_type ENUM('AIR','SEA','RAIL') NULL;

-- ============================================================
-- STEP 10: 询价主表（v3）
-- ============================================================
CREATE TABLE enquiry (
  id                            BIGINT       PRIMARY KEY AUTO_INCREMENT,
  ref_number                    VARCHAR(50)  NOT NULL UNIQUE,
  enquiry_received_date         DATE         NOT NULL,
  enquiry_created_date          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  product_code                  VARCHAR(20)  NOT NULL,
  cargo_type_code               VARCHAR(20)  NOT NULL,

  -- 状态
  status                        ENUM('New','Quoted & Pending','Secured','Lost','Cancelled')
                                             NOT NULL DEFAULT 'New',
  cancelled_reason              VARCHAR(50)  NULL,
  cancelled_reason_text         TEXT         NULL,
  lost_reason                   VARCHAR(100) NULL,
  lost_reason_text              TEXT         NULL,

  -- 销售信息
  sales_country_code            VARCHAR(50)  NOT NULL,
  sales_pic_id                  INT          NOT NULL,
  sales_office_id               INT          NOT NULL,
  assigned_cn_office            VARCHAR(100) NULL,

  -- 货物信息
  commodity                     TEXT         NULL,
  hazardous_special_equipment   TEXT         NULL,
  volume_cbm                    DECIMAL(12,3) NULL COMMENT 'AIR/LCL专用',
  quantity                      DECIMAL(12,3) NULL COMMENT 'AIR/LCL专用',
  uom                           VARCHAR(20)  NULL COMMENT 'AIR/LCL专用',

  -- 路线信息（普通模式 - 冗余快捷字段）
  pol_country                   VARCHAR(100) NULL,
  pod_country                   VARCHAR(100) NULL,
  category                      VARCHAR(50)  NULL,
  exw_location                  VARCHAR(200) NULL COMMENT 'Category=EXW时必填',
  core_non_core                 ENUM('Core','Non-Core') NULL,

  -- Cargo Ready Date
  has_specific_cargo_ready_date TINYINT(1)   NOT NULL DEFAULT 0,
  cargo_ready_date              DATE         NOT NULL COMMENT '默认=enquiry_created_date',
  cargo_ready_date_details      VARCHAR(500) NULL COMMENT 'TBA/Week备注',

  -- Offer 快捷字段
  offer_type                    ENUM('FCL','LCL','AIR','BUYER-CONSOL') NULL,

  remark                        TEXT         NULL,

  -- Reference Number 生成辅助字段（内部用）
  reference_month               CHAR(4)      NULL COMMENT 'YYMM',
  monthly_sequence              INT          NULL COMMENT '月度序号',
  serial_number                 INT          NOT NULL DEFAULT 0 COMMENT '子序号',
  product_abbr                  VARCHAR(10)  NULL COMMENT '产品缩写',

  -- 审计
  created_by                    VARCHAR(100) NULL,
  updated_by                    VARCHAR(100) NULL,
  created_at                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,

  -- 外键
  FOREIGN KEY (product_code)       REFERENCES dict_product(code),
  FOREIGN KEY (cargo_type_code)    REFERENCES dict_cargo_type(code),
  FOREIGN KEY (sales_country_code) REFERENCES dict_sales_country(code),
  FOREIGN KEY (sales_pic_id)       REFERENCES dict_sales_pic(id),
  FOREIGN KEY (sales_office_id)    REFERENCES dict_sales_office(id),

  -- 索引
  KEY idx_enquiry_status (status),
  KEY idx_enquiry_product (product_code),
  KEY idx_enquiry_sales_country (sales_country_code),
  KEY idx_enquiry_ref_month (reference_month, monthly_sequence)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价主表 v3';

-- ============================================================
-- STEP 11: 多港口关联表（普通模式）
-- ============================================================
CREATE TABLE enquiry_pol (
  id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  enquiry_id BIGINT NOT NULL,
  port_id    INT    NOT NULL,
  FOREIGN KEY (enquiry_id) REFERENCES enquiry(id) ON DELETE CASCADE,
  FOREIGN KEY (port_id)    REFERENCES port(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价起运港关联';

CREATE TABLE enquiry_pod (
  id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  enquiry_id BIGINT NOT NULL,
  port_id    INT    NOT NULL,
  FOREIGN KEY (enquiry_id) REFERENCES enquiry(id) ON DELETE CASCADE,
  FOREIGN KEY (port_id)    REFERENCES port(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='询价目的港关联';

-- ============================================================
-- STEP 12: Route Group（混合模式多组路线）
-- ============================================================
CREATE TABLE enquiry_route_group (
  id          BIGINT      PRIMARY KEY AUTO_INCREMENT,
  enquiry_id  BIGINT      NOT NULL,
  group_index INT         NOT NULL DEFAULT 0,
  sub_mode    ENUM('AIR','SEA','RAIL') NOT NULL,
  FOREIGN KEY (enquiry_id) REFERENCES enquiry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='混合模式路线组';

CREATE TABLE enquiry_route_group_pol (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  route_group_id BIGINT NOT NULL,
  port_id        INT    NOT NULL,
  FOREIGN KEY (route_group_id) REFERENCES enquiry_route_group(id) ON DELETE CASCADE,
  FOREIGN KEY (port_id)        REFERENCES port(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='混合模式路线组起运港';

CREATE TABLE enquiry_route_group_pod (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  route_group_id BIGINT NOT NULL,
  port_id        INT    NOT NULL,
  FOREIGN KEY (route_group_id) REFERENCES enquiry_route_group(id) ON DELETE CASCADE,
  FOREIGN KEY (port_id)        REFERENCES port(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='混合模式路线组目的港';

-- ============================================================
-- STEP 13: Offer 主表（v3 重构）
-- ============================================================
CREATE TABLE offer (
  id           BIGINT  PRIMARY KEY AUTO_INCREMENT,
  enquiry_id   BIGINT  NOT NULL,
  sequence_no  INT     NOT NULL DEFAULT 1,
  is_latest    TINYINT(1) NOT NULL DEFAULT 1,
  offer_type   ENUM('FCL','LCL','AIR','BUYER-CONSOL') NOT NULL,
  offer_date   DATE    NULL,
  remark       TEXT    NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enquiry_id) REFERENCES enquiry(id) ON DELETE CASCADE,
  KEY idx_offer_enquiry (enquiry_id),
  KEY idx_offer_latest (enquiry_id, is_latest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价主表 v3';

-- ============================================================
-- STEP 14: Offer 价格明细行
-- ============================================================
CREATE TABLE offer_price_line (
  id             BIGINT         PRIMARY KEY AUTO_INCREMENT,
  offer_id       BIGINT         NOT NULL,
  route_group_id BIGINT         NULL COMMENT '混合模式关联的子模式组',
  sub_mode       ENUM('AIR','SEA','RAIL') NULL,
  pol_id         INT            NOT NULL,
  pod_id         INT            NOT NULL,
  per_cbm        DECIMAL(18,4)  NULL,
  min_charge     DECIMAL(18,4)  NULL,
  local_charge   DECIMAL(18,4)  NULL,
  price          DECIMAL(18,4)  NULL COMMENT 'AIR/LCL简化价格',
  price_text     VARCHAR(500)   NULL,
  sort_order     INT            NOT NULL DEFAULT 0,
  FOREIGN KEY (offer_id)       REFERENCES offer(id) ON DELETE CASCADE,
  FOREIGN KEY (route_group_id) REFERENCES enquiry_route_group(id),
  FOREIGN KEY (pol_id)         REFERENCES port(id),
  FOREIGN KEY (pod_id)         REFERENCES port(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价价格明细行';

-- ============================================================
-- STEP 15: 容器明细（FCL/BUYER-CONSOL 专用）
-- ============================================================
CREATE TABLE offer_container_detail (
  id                         BIGINT         PRIMARY KEY AUTO_INCREMENT,
  offer_price_line_id        BIGINT         NOT NULL,
  container_size_type        VARCHAR(20)    NOT NULL COMMENT '20GP,40GP,40HQ,45HQ等',
  container_type             VARCHAR(20)    NULL     COMMENT 'GP,OT,FR,Tank等',
  number_of_containers       INT            NOT NULL DEFAULT 0,
  cargo_weight_per_container DECIMAL(12,3)  NULL     COMMENT '货重(吨)',
  container_price            DECIMAL(18,4)  NULL,
  teu_value                  DECIMAL(5,2)   NOT NULL COMMENT '20=1.0,40=2.0',
  line_teu                   DECIMAL(12,2)  GENERATED ALWAYS AS
                             (teu_value * number_of_containers) STORED,
  FOREIGN KEY (offer_price_line_id) REFERENCES offer_price_line(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='容器明细（FCL/BUYER-CONSOL）';

-- ============================================================
-- STEP 16: 清理旧表（不再需要的 v2 旧表）
-- ============================================================
-- 旧 dict 表（如果还存在）
DROP TABLE IF EXISTS dict_category;
DROP TABLE IF EXISTS dict_uom;
DROP TABLE IF EXISTS dict_cn_office;

-- ============================================================
-- 验证
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Schema v3 created successfully!' AS status;
SELECT COUNT(*) AS product_count FROM dict_product;
SELECT COUNT(*) AS cargo_type_count FROM dict_cargo_type;
SELECT COUNT(*) AS product_cargo_allowed_count FROM dict_product_cargo_allowed;
SELECT COUNT(*) AS cancelled_reason_count FROM dict_cancelled_reason;
SELECT COUNT(*) AS lost_reason_count FROM dict_lost_reason;
SELECT COUNT(*) AS sales_country_count FROM dict_sales_country;
SELECT COUNT(*) AS sales_pic_count FROM dict_sales_pic;
