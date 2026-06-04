-- =============================================================
-- 数据质检模块迁移脚本
-- 版本: v1.0
-- 日期: 2026-05-21
-- 说明: 新增 AI 建单数据质检相关表（不修改任何已有表）
-- =============================================================

-- 1. 质检配置表（全系统单行配置，id=1）
CREATE TABLE IF NOT EXISTS data_quality_check_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enabled TINYINT NOT NULL DEFAULT 0 COMMENT '是否启用定时质检',
    cron_expression VARCHAR(50) NOT NULL DEFAULT '0 0 9 * * ?' COMMENT 'Spring CRON 表达式',
    check_scope_days INT NOT NULL DEFAULT 7 COMMENT '检查最近N天的AI建单数据',
    global_recipients JSON COMMENT '全局通知邮箱数组，如 ["a@b.com","c@d.com"]',
    route_based_enabled TINYINT NOT NULL DEFAULT 0 COMMENT '是否同时按路由指令分发报告',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI建单数据质检配置';

-- 插入默认配置（id=1），测试阶段全局收件人为 davian.liang@zieglergroup.cn
INSERT INTO data_quality_check_config (id, enabled, global_recipients, route_based_enabled)
VALUES (1, 0, '["davian.liang@zieglergroup.cn"]', 0)
ON DUPLICATE KEY UPDATE id = id;

-- 2. 质检执行历史表
CREATE TABLE IF NOT EXISTS data_quality_check_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    executed_at DATETIME NOT NULL COMMENT '本次执行时间',
    check_scope_days INT NOT NULL COMMENT '本次检查范围（天）',
    total_checked INT NOT NULL DEFAULT 0 COMMENT '总检查条数',
    total_complete INT NOT NULL DEFAULT 0 COMMENT '字段完整条数',
    total_incomplete INT NOT NULL DEFAULT 0 COMMENT '有缺失字段条数',
    completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '完整率百分比',
    field_stats_json JSON COMMENT '各字段缺失计数，如 {"category_code":14,"sales_pic_id":8}',
    report_sent TINYINT NOT NULL DEFAULT 0 COMMENT '是否已发送邮件报告',
    global_recipients_count INT NOT NULL DEFAULT 0 COMMENT '全局收件人数量',
    route_recipients_count INT NOT NULL DEFAULT 0 COMMENT '路由分发收件人数量',
    error_message VARCHAR(500) COMMENT '执行异常信息',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI建单数据质检执行历史';

-- 3. 已核验标记表
CREATE TABLE IF NOT EXISTS data_quality_verified (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    enquiry_id BIGINT NOT NULL COMMENT '对应的询价单 ID',
    verified_by VARCHAR(100) NOT NULL COMMENT '核验人用户名',
    verified_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '核验时间',
    note VARCHAR(500) COMMENT '核验备注',
    UNIQUE KEY uk_enquiry_id (enquiry_id),
    CONSTRAINT fk_dqv_enquiry FOREIGN KEY (enquiry_id) REFERENCES enquiry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='已核验标记表（排除后续质检报告）';
