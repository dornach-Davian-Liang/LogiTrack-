-- ============================================================
-- LogiTrack 测试数据库初始化脚本
-- 用途: 为 email-ai-automation 自动建单功能创建隔离测试环境
-- 使用方法: mysql -u root -p < setup_test_db.sql
-- 注意: 不会影响生产库 logitrack
-- ============================================================

-- 1. 创建测试数据库
CREATE DATABASE IF NOT EXISTS logitrack_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE logitrack_test;

-- 2. 从生产库复制主数据表结构 + 数据
--    只复制只读的主数据，不复制询价单等业务数据

-- 国家主数据
CREATE TABLE IF NOT EXISTS country LIKE logitrack.country;
INSERT IGNORE INTO country SELECT * FROM logitrack.country;

-- 港口/机场主数据
CREATE TABLE IF NOT EXISTS port LIKE logitrack.port;
INSERT IGNORE INTO port SELECT * FROM logitrack.port;

-- 销售国家字典
CREATE TABLE IF NOT EXISTS dict_sales_country LIKE logitrack.dict_sales_country;
INSERT IGNORE INTO dict_sales_country SELECT * FROM logitrack.dict_sales_country;

-- 销售办公室字典
CREATE TABLE IF NOT EXISTS dict_sales_office LIKE logitrack.dict_sales_office;
INSERT IGNORE INTO dict_sales_office SELECT * FROM logitrack.dict_sales_office;

-- 销售 PIC 字典（两张：dict_sales_pic 和 sales_pic）
CREATE TABLE IF NOT EXISTS dict_sales_pic LIKE logitrack.dict_sales_pic;
INSERT IGNORE INTO dict_sales_pic SELECT * FROM logitrack.dict_sales_pic;

CREATE TABLE IF NOT EXISTS sales_pic LIKE logitrack.sales_pic;
INSERT IGNORE INTO sales_pic SELECT * FROM logitrack.sales_pic;

-- 产品代码字典（enquiry FK 依赖）
CREATE TABLE IF NOT EXISTS dict_product LIKE logitrack.dict_product;
INSERT IGNORE INTO dict_product SELECT * FROM logitrack.dict_product;

-- 允许的产品/货物类型关联
CREATE TABLE IF NOT EXISTS dict_product_cargo_allowed LIKE logitrack.dict_product_cargo_allowed;
INSERT IGNORE INTO dict_product_cargo_allowed SELECT * FROM logitrack.dict_product_cargo_allowed;

-- 货物类型字典（enquiry FK 依赖）
CREATE TABLE IF NOT EXISTS dict_cargo_type LIKE logitrack.dict_cargo_type;
INSERT IGNORE INTO dict_cargo_type SELECT * FROM logitrack.dict_cargo_type;

-- 容器类型字典
CREATE TABLE IF NOT EXISTS container_types LIKE logitrack.container_types;
INSERT IGNORE INTO container_types SELECT * FROM logitrack.container_types;

-- 其他 dict 表（状态/原因等）
CREATE TABLE IF NOT EXISTS dict_cancelled_reason LIKE logitrack.dict_cancelled_reason;
INSERT IGNORE INTO dict_cancelled_reason SELECT * FROM logitrack.dict_cancelled_reason;

CREATE TABLE IF NOT EXISTS dict_lost_reason LIKE logitrack.dict_lost_reason;
INSERT IGNORE INTO dict_lost_reason SELECT * FROM logitrack.dict_lost_reason;

CREATE TABLE IF NOT EXISTS dict_carrier LIKE logitrack.dict_carrier;
INSERT IGNORE INTO dict_carrier SELECT * FROM logitrack.dict_carrier;

CREATE TABLE IF NOT EXISTS dict_currency LIKE logitrack.dict_currency;
INSERT IGNORE INTO dict_currency SELECT * FROM logitrack.dict_currency;

CREATE TABLE IF NOT EXISTS dict_cn_office LIKE logitrack.dict_cn_office;
INSERT IGNORE INTO dict_cn_office SELECT * FROM logitrack.dict_cn_office;

CREATE TABLE IF NOT EXISTS dict_cn_pricing_admin LIKE logitrack.dict_cn_pricing_admin;
INSERT IGNORE INTO dict_cn_pricing_admin SELECT * FROM logitrack.dict_cn_pricing_admin;

-- 3. 创建业务表结构（空表，仅用于测试建单）

-- 询价主表
CREATE TABLE IF NOT EXISTS enquiry LIKE logitrack.enquiry;

-- 询价装载港关联表
CREATE TABLE IF NOT EXISTS enquiry_pol LIKE logitrack.enquiry_pol;

-- 询价卸货港关联表
CREATE TABLE IF NOT EXISTS enquiry_pod LIKE logitrack.enquiry_pod;

-- 询价箱型行明细
CREATE TABLE IF NOT EXISTS enquiry_container_line LIKE logitrack.enquiry_container_line;

-- 询价路由组（多路线模式）
CREATE TABLE IF NOT EXISTS enquiry_route_group LIKE logitrack.enquiry_route_group;
CREATE TABLE IF NOT EXISTS enquiry_route_group_pol LIKE logitrack.enquiry_route_group_pol;
CREATE TABLE IF NOT EXISTS enquiry_route_group_pod LIKE logitrack.enquiry_route_group_pod;

-- offer（报价）相关表
CREATE TABLE IF NOT EXISTS offer LIKE logitrack.offer;
CREATE TABLE IF NOT EXISTS offer_container_detail LIKE logitrack.offer_container_detail;
CREATE TABLE IF NOT EXISTS offer_price_line LIKE logitrack.offer_price_line;

-- 审计日志（可选）
CREATE TABLE IF NOT EXISTS audit_log LIKE logitrack.audit_log;

-- 用户/角色（供 X-Username 审计用，可选）
CREATE TABLE IF NOT EXISTS `user` LIKE logitrack.`user`;
CREATE TABLE IF NOT EXISTS `role` LIKE logitrack.`role`;
CREATE TABLE IF NOT EXISTS user_role LIKE logitrack.user_role;

-- 4. 插入测试用 bot 账号（供 createdBy 追踪）
INSERT IGNORE INTO `user` (username, password, full_name, email, is_active)
VALUES ('email-ai-bot', '$2a$10$placeholder', 'Email AI Bot', 'ai-bot@zieglergroup.cn', 1);

-- 5. 重置自增序列（避免与生产库冲突）
ALTER TABLE enquiry AUTO_INCREMENT = 1;
ALTER TABLE offer AUTO_INCREMENT = 1;
ALTER TABLE audit_log AUTO_INCREMENT = 1;

-- 6. 验证
SELECT 'logitrack_test 数据库初始化完成' AS status;
SELECT TABLE_NAME, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'logitrack_test'
ORDER BY TABLE_NAME;
