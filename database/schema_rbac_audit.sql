-- ============================================================
-- LogiTrack - RBAC (Role-Based Access Control) and Audit Log Schema
-- 权限管理和审计日志数据库表结构
-- ============================================================

-- ==========================================
-- 1. 用户表 (User)
-- ==========================================
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(加密存储)',
  `full_name` VARCHAR(100) NOT NULL COMMENT '全名',
  `email` VARCHAR(100) COMMENT '邮箱',
  `phone` VARCHAR(20) COMMENT '电话',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否激活: 1=是, 0=否',
  `last_login_at` DATETIME COMMENT '最后登录时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` VARCHAR(50) COMMENT '创建人',
  `updated_by` VARCHAR(50) COMMENT '更新人',
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ==========================================
-- 2. 角色表 (Role)
-- ==========================================
CREATE TABLE IF NOT EXISTS `role` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '角色ID',
  `role_code` VARCHAR(30) NOT NULL UNIQUE COMMENT '角色代码: ADMIN_USER, OPERATING_USER, NORMAL_USER',
  `role_name` VARCHAR(50) NOT NULL COMMENT '角色名称',
  `description` VARCHAR(255) COMMENT '角色描述',
  `permissions` JSON COMMENT '权限列表 JSON',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否激活',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_role_code` (`role_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ==========================================
-- 3. 用户角色关联表 (User-Role)
-- ==========================================
CREATE TABLE IF NOT EXISTS `user_role` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `role_id` INT NOT NULL COMMENT '角色ID',
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  `assigned_by` VARCHAR(50) COMMENT '分配人',
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- ==========================================
-- 4. 审计日志表 (Audit Log)
-- ==========================================
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  `user_id` INT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型: CREATE, UPDATE, DELETE, VIEW, EXPORT, LOGIN, LOGOUT',
  `resource_type` VARCHAR(50) NOT NULL COMMENT '资源类型: ENQUIRY, OFFER, COUNTRY, PORT, USER, ROLE等',
  `resource_id` VARCHAR(50) COMMENT '资源ID',
  `resource_name` VARCHAR(255) COMMENT '资源名称/描述',
  `old_value` JSON COMMENT '修改前的值(JSON)',
  `new_value` JSON COMMENT '修改后的值(JSON)',
  `ip_address` VARCHAR(45) COMMENT 'IP地址',
  `user_agent` VARCHAR(500) COMMENT '用户代理',
  `request_method` VARCHAR(10) COMMENT '请求方法: GET, POST, PUT, DELETE',
  `request_url` VARCHAR(500) COMMENT '请求URL',
  `status` VARCHAR(20) DEFAULT 'SUCCESS' COMMENT '操作状态: SUCCESS, FAILED',
  `error_message` TEXT COMMENT '错误信息(如果失败)',
  `duration_ms` INT COMMENT '操作耗时(毫秒)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_username` (`username`),
  INDEX `idx_action` (`action`),
  INDEX `idx_resource_type` (`resource_type`),
  INDEX `idx_resource_id` (`resource_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- ==========================================
-- 5. 插入初始角色数据
-- ==========================================
INSERT INTO `role` (`role_code`, `role_name`, `description`, `permissions`) VALUES
('ADMIN_USER', 'Administrator', '管理员 - 拥有所有权限', JSON_ARRAY(
  'enquiry:create', 'enquiry:read', 'enquiry:update', 'enquiry:delete',
  'offer:create', 'offer:read', 'offer:update', 'offer:delete',
  'master-data:read', 'master-data:write',
  'report:read', 'report:export',
  'user:manage', 'role:manage', 'audit:read'
)),
('OPERATING_USER', 'Operating User', '操作员 - 可增改查询价，不可删除', JSON_ARRAY(
  'enquiry:create', 'enquiry:read', 'enquiry:update',
  'offer:create', 'offer:read', 'offer:update',
  'master-data:read',
  'report:read', 'report:export'
)),
('NORMAL_USER', 'Normal User', '普通用户 - 仅可查看询价', JSON_ARRAY(
  'enquiry:read',
  'offer:read',
  'master-data:read',
  'report:read'
));

-- ==========================================
-- 6. 插入初始管理员用户 (密码: admin123456)
-- ==========================================
-- 注意: 密码需要在应用层使用 BCrypt 加密
-- 这里使用明文密码仅供开发测试，生产环境需要加密
INSERT INTO `user` (`username`, `password`, `full_name`, `email`, `is_active`, `created_by`) VALUES
('admin', '$2a$10$N.zmdr6pN3UJr.R5YmDo8OC/7bU0CeFp1F1YtRqEHibKVNeVZSkCW', 'System Administrator', 'admin@logitrack.com', 1, 'SYSTEM'),
('operator', '$2a$10$N.zmdr6pN3UJr.R5YmDo8OC/7bU0CeFp1F1YtRqEHibKVNeVZSkCW', 'CN Pricing Operator', 'operator@logitrack.com', 1, 'SYSTEM'),
('viewer', '$2a$10$N.zmdr6pN3UJr.R5YmDo8OC/7bU0CeFp1F1YtRqEHibKVNeVZSkCW', 'Sales Viewer', 'viewer@logitrack.com', 1, 'SYSTEM');

-- ==========================================
-- 7. 分配用户角色
-- ==========================================
INSERT INTO `user_role` (`user_id`, `role_id`, `assigned_by`)
SELECT u.id, r.id, 'SYSTEM'
FROM `user` u, `role` r
WHERE (u.username = 'admin' AND r.role_code = 'ADMIN_USER')
   OR (u.username = 'operator' AND r.role_code = 'OPERATING_USER')
   OR (u.username = 'viewer' AND r.role_code = 'NORMAL_USER');

-- ==========================================
-- 8. 示例审计日志数据
-- ==========================================
INSERT INTO `audit_log` (`user_id`, `username`, `action`, `resource_type`, `resource_id`, `resource_name`, `status`) VALUES
(1, 'admin', 'CREATE', 'ENQUIRY', '1', 'CN2602014-S1', 'SUCCESS'),
(1, 'admin', 'UPDATE', 'ENQUIRY', '1', 'CN2602014-S1', 'SUCCESS'),
(2, 'operator', 'CREATE', 'OFFER', '1', 'Offer for CN2602014-S1', 'SUCCESS'),
(3, 'viewer', 'VIEW', 'ENQUIRY', '1', 'CN2602014-S1', 'SUCCESS');

-- ==========================================
-- 9. 查询示例
-- ==========================================
-- 查询用户及其角色
SELECT u.id, u.username, u.full_name, r.role_code, r.role_name
FROM user u
LEFT JOIN user_role ur ON u.id = ur.user_id
LEFT JOIN role r ON ur.role_id = r.id
WHERE u.is_active = 1;

-- 查询某用户的审计日志
SELECT * FROM audit_log 
WHERE username = 'admin' 
ORDER BY created_at DESC 
LIMIT 50;

-- 查询某资源的操作历史
SELECT * FROM audit_log 
WHERE resource_type = 'ENQUIRY' AND resource_id = '1' 
ORDER BY created_at DESC;
