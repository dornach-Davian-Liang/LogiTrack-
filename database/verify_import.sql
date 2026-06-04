-- ============================================================
-- 数据导入验证 SQL
-- ============================================================

USE logitrack;

-- 1. 基本统计
SELECT '=== 基本统计 ===' as section;
SELECT 'enquiry 表' as table_name, COUNT(*) as count FROM enquiry
UNION ALL
SELECT 'offer 表', COUNT(*) FROM offer
UNION ALL
SELECT 'country 表', COUNT(*) FROM country
UNION ALL
SELECT 'port 表', COUNT(*) FROM port
UNION ALL
SELECT 'dict_sales_office 表', COUNT(*) FROM dict_sales_office;

-- 2. 按状态统计
SELECT '' as blank;
SELECT '=== 按状态统计 ===' as section;
SELECT status, COUNT(*) as count, 
       CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM enquiry), 2), '%') as percentage
FROM enquiry 
GROUP BY status 
ORDER BY count DESC;

-- 3. 按产品类型统计
SELECT '' as blank;
SELECT '=== 按产品类型统计 ===' as section;
SELECT product_code, COUNT(*) as count,
       CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM enquiry), 2), '%') as percentage
FROM enquiry 
GROUP BY product_code 
ORDER BY count DESC;

-- 4. 按订舱确认状态统计
SELECT '' as blank;
SELECT '=== 按订舱确认状态统计 ===' as section;
SELECT booking_confirmed, COUNT(*) as count,
       CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM enquiry), 2), '%') as percentage
FROM enquiry 
GROUP BY booking_confirmed 
ORDER BY count DESC;

-- 5. 按销售国家统计（前10）
SELECT '' as blank;
SELECT '=== 按销售国家统计 (前10) ===' as section;
SELECT c.country_name_en, COUNT(*) as count 
FROM enquiry e 
JOIN country c ON e.sales_country_id = c.id 
GROUP BY c.country_name_en 
ORDER BY count DESC 
LIMIT 10;

-- 6. 按报价类型统计
SELECT '' as blank;
SELECT '=== 按报价类型统计 ===' as section;
SELECT enquiry_offer_type, COUNT(*) as count,
       CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM enquiry), 2), '%') as percentage
FROM enquiry 
GROUP BY enquiry_offer_type 
ORDER BY count DESC;

-- 7. 按 Cargo Type 统计
SELECT '' as blank;
SELECT '=== 按 Cargo Type 统计 ===' as section;
SELECT cargo_type_code, COUNT(*) as count 
FROM enquiry 
GROUP BY cargo_type_code 
ORDER BY count DESC;

-- 8. 按月份统计（前12个月）
SELECT '' as blank;
SELECT '=== 按月份统计 (前12个月) ===' as section;
SELECT reference_month, COUNT(*) as count 
FROM enquiry 
GROUP BY reference_month 
ORDER BY reference_month DESC 
LIMIT 12;

-- 9. 有报价的询价数量
SELECT '' as blank;
SELECT '=== 报价统计 ===' as section;
SELECT 
    '有报价的询价' as category,
    COUNT(DISTINCT enquiry_id) as count
FROM offer
UNION ALL
SELECT 
    '总询价数',
    COUNT(*) 
FROM enquiry
UNION ALL
SELECT 
    '无报价的询价',
    COUNT(*) 
FROM enquiry 
WHERE id NOT IN (SELECT DISTINCT enquiry_id FROM offer);

-- 10. 示例数据
SELECT '' as blank;
SELECT '=== 示例数据 (前5条) ===' as section;
SELECT 
    e.reference_number,
    e.product_code,
    e.status,
    e.cargo_type_code,
    c.country_name_en as sales_country,
    so.name as sales_office,
    e.booking_confirmed,
    DATE_FORMAT(e.issue_date, '%Y-%m-%d') as issue_date
FROM enquiry e
JOIN country c ON e.sales_country_id = c.id
JOIN dict_sales_office so ON e.sales_office_id = so.id
LIMIT 5;

-- 11. 港口使用频率（前10）
SELECT '' as blank;
SELECT '=== 最常用港口 POL (前10) ===' as section;
SELECT 
    p.port_name,
    COUNT(*) as usage_count
FROM enquiry e
JOIN port p ON e.pol_id = p.id
GROUP BY p.port_name
ORDER BY usage_count DESC
LIMIT 10;

SELECT '' as blank;
SELECT '=== 最常用港口 POD (前10) ===' as section;
SELECT 
    p.port_name,
    COUNT(*) as usage_count
FROM enquiry e
JOIN port p ON e.pod_id = p.id
GROUP BY p.port_name
ORDER BY usage_count DESC
LIMIT 10;
