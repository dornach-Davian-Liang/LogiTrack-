-- ======================================================
-- CN Pricing Admin 字典表 + Country表增加is_core字段
-- 执行日期: 2026-02-26
-- ======================================================

-- 1. 创建 CN Pricing Admin 字典表
DROP TABLE IF EXISTS dict_cn_pricing_admin;
CREATE TABLE dict_cn_pricing_admin (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  name VARCHAR(100) NOT NULL UNIQUE COMMENT '管理员姓名',
  display_order INT NOT NULL DEFAULT 0 COMMENT '显示顺序',
  is_active BOOLEAN NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间戳',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间戳',
  KEY idx_name (name),
  KEY idx_active (is_active),
  KEY idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='CN定价管理员字典表';

-- 2. 初始化 CN Pricing Admin 数据
INSERT INTO dict_cn_pricing_admin (name, display_order, is_active) VALUES
('Janet Chan', 1, 1),
('Niki Guan', 2, 1),
('Susana Wong', 3, 1),
('Yuki Ying', 4, 1),
('Yvonne Ho', 5, 1);

-- 3. 在 Country 表增加 is_core 字段
ALTER TABLE country 
ADD COLUMN is_core BOOLEAN NOT NULL DEFAULT 0 COMMENT '是否为CORE国家' AFTER is_active;

-- 4. 更新 CORE 国家标记(基于提供的国家列表)
UPDATE country SET is_core = 1 WHERE 
    country_name_en IN (
        'China',
        'People''s Republic of China',
        'Belgium',
        'Denmark',
        'France',
        'Germany',
        'Italy',
        'ITALY',
        'Netherlands',
        'Spain',
        'Switzerland',
        'United Kingdom',
        'Israel',
        'South Africa'
    );

-- 5. 添加索引提高查询效率
CREATE INDEX idx_country_is_core ON country(is_core);

-- ======================================================
-- 验证脚本
-- ======================================================

-- 验证 CN Pricing Admin 数据
SELECT * FROM dict_cn_pricing_admin ORDER BY display_order;

-- 验证 CORE 国家
SELECT country_code, country_name_en, is_core 
FROM country 
WHERE is_core = 1 
ORDER BY country_name_en;

-- 统计
SELECT 
    COUNT(*) as total_admins,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_admins
FROM dict_cn_pricing_admin;

SELECT 
    COUNT(*) as total_countries,
    SUM(CASE WHEN is_core = 1 THEN 1 ELSE 0 END) as core_countries,
    SUM(CASE WHEN is_core = 0 THEN 1 ELSE 0 END) as non_core_countries
FROM country;
