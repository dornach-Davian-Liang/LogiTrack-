-- 修复user_role关联
-- 确保用户和角色正确关联

-- 先清空现有关联
DELETE FROM user_role;

-- 重新插入关联
-- admin (id=1) -> ADMIN_USER (id=1)
INSERT INTO user_role (user_id, role_id, assigned_by) VALUES (1, 1, 'SYSTEM');

-- operator (id=2) -> OPERATING_USER (id=2)
INSERT INTO user_role (user_id, role_id, assigned_by) VALUES (2, 2, 'SYSTEM');

-- viewer (id=3) -> NORMAL_USER (id=3)
INSERT INTO user_role (user_id, role_id, assigned_by) VALUES (3, 3, 'SYSTEM');

-- 验证关联
SELECT 
    u.username,
    r.role_name,
    r.role_code
FROM user_role ur
JOIN user u ON ur.user_id = u.id
JOIN role r ON ur.role_id = r.id;
