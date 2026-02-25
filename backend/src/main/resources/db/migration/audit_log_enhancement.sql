-- ================================================
-- 审计日志表字段扩展 SQL 脚本
-- 执行时间: 2026-02-24
-- ================================================

USE logitrack;

-- 添加新字段
ALTER TABLE audit_log 
  ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) COMMENT '用户角色：ADMIN_USER, OPERATING_USER, NORMAL_USER',
  ADD COLUMN IF NOT EXISTS cn_pricing_admin VARCHAR(100) COMMENT 'Enquiry的CN Pricing Admin字段值',
  ADD COLUMN IF NOT EXISTS details TEXT COMMENT '详细变更说明，格式: 字段名: 旧值 → 新值';

-- 验证表结构
DESC audit_log;

-- 查看最近5条审计日志（验证）
SELECT 
  id,
  created_at,
  username,
  user_role,
  cn_pricing_admin,
  action,
  resource_type,
  resource_id,
  details,
  status
FROM audit_log
ORDER BY created_at DESC
LIMIT 5;
