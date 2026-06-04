-- ============================================================
-- LogiTrack Pro - Demo 数据（10条询价记录）
-- 用于测试和演示
-- ============================================================

USE logitrack;

-- 插入10条demo enquiry记录
INSERT INTO enquiry (
    reference_number,
    enquiry_received_date,
    issue_date,
    reference_month,
    monthly_sequence,
    serial_number,
    product_code,
    product_abbr,
    status,
    cn_pricing_admin,
    sales_country_code,
    sales_office_id,
    sales_pic_id,
    assigned_cn_office_code,
    cargo_type_code,
    volume_cbm,
    quantity,
    quantity_uom_code,
    commodity,
    pol_id,
    pod_id,
    pod_country_code,
    core_flag,
    category_code,
    cargo_ready_date,
    booking_confirmed,
    enquiry_offer_type
) VALUES
-- 1. 海运 FCL - 上海到安特卫普
('CN2601001-S', '2026-01-02', '2026-01-02', '2601', 1, 1, 'SEA', 'S', 'Quoted', 'DEMO_ADMIN', 
 'AGENTS', 1, 1, 'SHANGHAI', 'FCL', 25.5, 1, 'CTN', 'Electronic Components', 
 6042, 1928, 'BE', 'CORE', 'OCEAN_FREIGHT', '2026-01-15', 'Yes', 'OCEAN'),

-- 2. 空运 - 法兰克福到伦敦
('CN2601002-A', '2026-01-03', '2026-01-03', '2601', 2, 2, 'AIR', 'A', 'Quoted', 'DEMO_ADMIN',
 'AGENTS', 2, 2, 'HONG KONG', 'AIR', 2.5, 150, 'KG', 'Medical Supplies',
 21, 25, 'GB', 'CORE', 'AIR_FREIGHT', '2026-01-10', 'Yes', 'AIR'),

-- 3. 海运 LCL - 深圳到汉堡
('CN2601003-S', '2026-01-05', '2026-01-05', '2601', 3, 3, 'SEA', 'S', 'Quoted', 'DEMO_ADMIN',
 'AGENTS', 3, 3, 'SHENZHEN', 'LCL', 8.0, 500, 'KG', 'Garments and Textiles',
 6115, 7911, 'DE', 'NON_CORE', 'OCEAN_FREIGHT', '2026-01-20', 'Pending', 'OCEAN'),

-- 4. 海运 FCL - 宁波到勒阿弗尔
('CN2601004-S', '2026-01-06', '2026-01-06', '2601', 4, 4, 'SEA', 'S', 'Quoted', 'DEMO_ADMIN',
 'AGENTS', 4, 4, 'NINGBO', 'FCL', 67.0, 2, 'CTN', 'Furniture',
 5926, 14711, 'FR', 'CORE', 'OCEAN_FREIGHT_ORIGIN', '2026-01-25', 'Yes', 'OCEAN'),

-- 5. 空运 - 法兰克福到伦敦 (紧急)
('CN2601005-A', '2026-01-07', '2026-01-07', '2601', 5, 5, 'AIR', 'A', 'Quoted', 'DEMO_ADMIN',
 'AGENTS', 5, 5, 'SHANGHAI', 'AIR', 0.5, 25, 'KG', 'Urgent Spare Parts',
 21, 25, 'GB', 'CORE', 'AIR_FREIGHT_ORIGIN', '2026-01-08', 'Yes', 'AIR'),

-- 6. 海运 FCL - 上海到南安普顿
('CN2601006-S', '2026-01-08', '2026-01-08', '2601', 6, 6, 'SEA', 'S', 'New', 'DEMO_ADMIN',
 'AGENTS', 1, 1, 'SHANGHAI', 'FCL', 55.0, 2, 'CTN', 'Machinery Parts',
 6042, 20336, 'GB', 'CORE', 'OCEAN_FREIGHT', '2026-02-01', 'Pending', 'OCEAN'),

-- 7. 海运 LCL - 深圳到鹿特丹
('CN2601007-S', '2026-01-10', '2026-01-10', '2601', 7, 7, 'SEA', 'S', 'Quoted', 'DEMO_ADMIN',
 'AGENTS', 2, 2, 'SHENZHEN', 'LCL', 12.0, 800, 'KG', 'Toys and Games',
 6115, 28354, 'NL', 'NON_CORE', 'OCEAN_FREIGHT', '2026-01-28', 'Rejected', 'OCEAN'),

-- 8. 空运 - 法兰克福机场
('CN2601008-A', '2026-01-12', '2026-01-12', '2601', 8, 8, 'AIR', 'A', 'Quoted', 'DEMO_ADMIN',
 'AGENTS', 3, 3, 'HONG KONG', 'AIR', 1.2, 80, 'KG', 'Pharmaceutical Products',
 21, 25, 'GB', 'CORE', 'AIR_FREIGHT', '2026-01-14', 'Yes', 'AIR'),

-- 9. 海运 FCL - 上海到安特卫普 (大货)
('CN2601009-S', '2026-01-15', '2026-01-15', '2601', 9, 9, 'SEA', 'S', 'Quoted', 'DEMO_ADMIN',
 'AGENTS', 4, 4, 'SHANGHAI', 'FCL', 134.0, 4, 'CTN', 'Solar Panels',
 6042, 1928, 'BE', 'CORE', 'OCEAN_FREIGHT_ORIGIN', '2026-02-10', 'Yes', 'OCEAN'),

-- 10. 海运 FCL - 取消的询价
('CN2601010-S', '2026-01-18', '2026-01-18', '2601', 10, 10, 'SEA', 'S', 'Cancelled', 'DEMO_ADMIN',
 'AGENTS', 5, 5, 'QINGDAO', 'FCL', 33.5, 1, 'CTN', 'Chemical Products (Non-DG)',
 5986, 7911, 'DE', 'NON_CORE', 'OCEAN_FREIGHT', '2026-02-05', 'Invalid', 'OCEAN');

-- 插入对应的 offer 记录
INSERT INTO offer (enquiry_id, offer_type, sequence_no, is_latest, sent_date, price, price_text) VALUES
(1, 'OCEAN', 1, 1, '2026-01-04', 2500.00, 'USD 2,500 per 40HQ'),
(2, 'AIR', 1, 1, '2026-01-04', 4.50, 'USD 4.50/kg ALL IN'),
(3, 'OCEAN', 1, 1, '2026-01-07', 65.00, 'USD 65/CBM'),
(4, 'OCEAN', 1, 0, '2026-01-08', 3200.00, 'USD 3,200 per 40HQ + THC'),
(4, 'OCEAN', 2, 1, '2026-01-09', 3000.00, 'USD 3,000 per 40HQ + THC (revised)'),
(5, 'AIR', 1, 1, '2026-01-07', 8.00, 'USD 8.00/kg EXPRESS'),
(6, 'OCEAN', 1, 1, '2026-01-10', 2800.00, 'USD 2,800 per 40HQ'),
(7, 'OCEAN', 1, 1, '2026-01-12', 55.00, 'USD 55/CBM LCL'),
(8, 'AIR', 1, 1, '2026-01-13', 5.20, 'USD 5.20/kg'),
(9, 'OCEAN', 1, 1, '2026-01-17', 2400.00, 'USD 2,400 per 40HQ x 4 = 9,600');

-- 验证
SELECT '--- 询价统计 ---' AS info;
SELECT status, COUNT(*) AS cnt FROM enquiry GROUP BY status;

SELECT '--- 报价统计 ---' AS info;
SELECT offer_type, COUNT(*) AS cnt, AVG(price) AS avg_price FROM offer GROUP BY offer_type;

SELECT '--- 询价样例 ---' AS info;
SELECT 
    e.reference_number,
    e.product_code,
    e.status,
    e.sales_country_code,
    sp.name AS sales_pic,
    so.code AS office_code,
    pol.port_name AS pol,
    pod.port_name AS pod,
    e.booking_confirmed
FROM enquiry e
LEFT JOIN sales_pic sp ON e.sales_pic_id = sp.id
LEFT JOIN dict_sales_office so ON e.sales_office_id = so.id
LEFT JOIN port pol ON e.pol_id = pol.id
LEFT JOIN port pod ON e.pod_id = pod.id
LIMIT 10;

SELECT 'Demo data inserted successfully!' AS status;
