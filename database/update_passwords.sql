-- 更新用户密码为正确的BCrypt哈希值
-- 密码: admin123456
-- BCrypt哈希: $2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr/mbUdMJvs/kSWBW

UPDATE `user` SET `password` = '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr/mbUdMJvs/kSWBW' WHERE `username` = 'admin';
UPDATE `user` SET `password` = '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr/mbUdMJvs/kSWBW' WHERE `username` = 'operator';
UPDATE `user` SET `password` = '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr/mbUdMJvs/kSWBW' WHERE `username` = 'viewer';

SELECT username, email, full_name FROM `user`;
