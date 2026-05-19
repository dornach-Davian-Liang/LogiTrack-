-- Migration: Allow auto-fill enquiries with unresolved sales fields
-- Phase 1.5: 允许 email-ai-automation 自动建单时 sales 字段为 NULL
-- 当这些字段无法自动解析时，由人工在 [AUTO-FILL INCOMPLETE] 标记后跟进补充
--
-- 生产库运行: mysql -u root -p logitrack       < migration_autofill_nullable.sql
-- 测试库运行: mysql -u root -p logitrack_test   < migration_autofill_nullable.sql
-- ============================================================

-- 1. sales_country_code: 允许 NULL（自动建单时可能无法解析发件方国家）
ALTER TABLE enquiry
    MODIFY COLUMN sales_country_code VARCHAR(50) NULL COMMENT 'Sales country code; nullable for auto-filled enquiries';

-- 2. sales_pic_id: 允许 NULL（销售负责人须人工确认）
ALTER TABLE enquiry
    MODIFY COLUMN sales_pic_id INT NULL COMMENT 'Sales PIC ID; nullable for auto-filled enquiries';

-- 3. sales_office_id: 允许 NULL（关联 PIC，同步为 NULL）
ALTER TABLE enquiry
    MODIFY COLUMN sales_office_id INT NULL COMMENT 'Sales office ID; nullable for auto-filled enquiries';

-- 验证结果
SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'enquiry'
  AND COLUMN_NAME IN ('sales_country_code', 'sales_pic_id', 'sales_office_id')
ORDER BY COLUMN_NAME;
