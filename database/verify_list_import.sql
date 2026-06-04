-- ============================================================
-- Quick Import Script for List.csv Data
-- Execute this directly in MySQL to import all sales data
-- ============================================================

-- First, verify you are in the correct database
SELECT DATABASE() AS current_database;

-- If not in logitrack, uncomment and run:
-- USE logitrack;

-- Check current counts before import
SELECT '=== BEFORE IMPORT ===' AS status;
SELECT 
  'Countries' AS type, 
  COUNT(*) AS count 
FROM country 
WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US')
UNION ALL
SELECT 'Offices', COUNT(*) FROM dict_sales_office
UNION ALL
SELECT 'PICs', COUNT(*) FROM sales_pic;

-- ============================================================
-- Now run: mysql -u root -p logitrack < import_sales_data_generated.sql
-- Or execute import_sales_data_generated.sql in MySQL Workbench
-- ============================================================

-- After import, verify results
SELECT '=== AFTER IMPORT (run after executing import_sales_data_generated.sql) ===' AS status;
SELECT 
  'Countries' AS type, 
  COUNT(*) AS count 
FROM country 
WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US')
UNION ALL
SELECT 'Offices', COUNT(*) FROM dict_sales_office WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US')
UNION ALL
SELECT 'PICs', COUNT(*) FROM sales_pic WHERE country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US');

-- Expected results:
-- Countries: 15 (or more if some already existed)
-- Offices: ~210
-- PICs: ~735

-- Detailed breakdown by country
SELECT '=== Breakdown by Country ===' AS status;
SELECT 
  c.country_code,
  c.country_name_en,
  COUNT(DISTINCT so.id) AS offices,
  COUNT(DISTINCT sp.id) AS pics
FROM country c
LEFT JOIN dict_sales_office so ON so.country_code = c.country_code
LEFT JOIN sales_pic sp ON sp.country_code = c.country_code
WHERE c.country_code IN ('AG', 'BE', 'CN', 'FR', 'DE', 'GR', 'MA', 'NL', 'OT', 'PL', 'ZA', 'CH', 'TB', 'GB', 'US')
GROUP BY c.country_code, c.country_name_en
ORDER BY pics DESC;
