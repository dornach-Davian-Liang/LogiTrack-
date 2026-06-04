-- Fix all NOT NULL constraints in enquiry table
ALTER TABLE enquiry MODIFY COLUMN reference_number varchar(50) NULL;
ALTER TABLE enquiry MODIFY COLUMN enquiry_received_date date NULL;
ALTER TABLE enquiry MODIFY COLUMN issue_date date NULL;
ALTER TABLE enquiry MODIFY COLUMN reference_month char(4) NULL;
ALTER TABLE enquiry MODIFY COLUMN monthly_sequence int NULL;
ALTER TABLE enquiry MODIFY COLUMN product_code varchar(30) NULL;
ALTER TABLE enquiry MODIFY COLUMN product_abbr varchar(10) NULL;
ALTER TABLE enquiry MODIFY COLUMN cn_pricing_admin varchar(100) NULL;
ALTER TABLE enquiry MODIFY COLUMN sales_office_id int NULL;
ALTER TABLE enquiry MODIFY COLUMN assigned_cn_office_code varchar(50) NULL;
ALTER TABLE enquiry MODIFY COLUMN cargo_type_code varchar(20) NULL;
ALTER TABLE enquiry MODIFY COLUMN pol_id int NULL;
ALTER TABLE enquiry MODIFY COLUMN pod_id int NULL;
ALTER TABLE enquiry MODIFY COLUMN pod_country_id int NULL;
ALTER TABLE enquiry MODIFY COLUMN pod_country_code char(2) NULL;

-- Verify changes
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='enquiry' AND COLUMN_NAME IN ('pod_country_id', 'pod_id', 'sales_office_id', 'cargo_type_code')
ORDER BY ORDINAL_POSITION;
