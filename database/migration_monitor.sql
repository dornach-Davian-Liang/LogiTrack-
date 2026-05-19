-- =============================================================
-- Email AI Automation — 监控模块数据库迁移脚本
-- Phase 1: 新增 email_processing_log + email_monitor_status 表
-- =============================================================

USE logitrack;

-- -------------------------------------------------------------
-- 邮件处理日志（每封邮件处理完写一行记录）
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_processing_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(500)       COMMENT '邮件对话链 ID（Graph API conversationId）',
    message_id      VARCHAR(500)       COMMENT '邮件唯一 ID（Graph API messageId）',
    folder_name     VARCHAR(100)       COMMENT '来源文件夹（Sea/Air/Inbox等）',
    subject         VARCHAR(500)       COMMENT '邮件主题',
    sender_email    VARCHAR(255)       COMMENT '发件人邮箱',
    received_at     DATETIME           COMMENT '邮件接收时间',
    processed_at    DATETIME NOT NULL  COMMENT '系统处理时间',

    -- AI 分析结果
    is_inquiry      TINYINT(1)         COMMENT '是否为询价邮件',
    email_type      VARCHAR(50)        COMMENT 'AI 分类（INQUIRY/BOOKING/FOLLOW_UP等）',
    transport_mode  VARCHAR(50)        COMMENT '运输方式（SEA/AIR/SEA+AIR等）',
    branch_code     VARCHAR(20)        COMMENT '分支机构代码（SHA/NGB/SZX等）',
    risk_level      VARCHAR(20)        COMMENT '风险等级（LOW/MEDIUM/HIGH）',
    risk_score      INT                COMMENT '风险评分（0-100）',
    origin_city     VARCHAR(200)       COMMENT '起运城市/地区',
    destination     VARCHAR(200)       COMMENT '目的地',
    pol             VARCHAR(200)       COMMENT 'AI 识别的装货港',
    pod             VARCHAR(200)       COMMENT 'AI 识别的卸货港',
    confidence      DECIMAL(3,2)       COMMENT 'AI 置信度（0.00-1.00）',

    -- 处理结果
    process_result  ENUM('PROCESSED','SKIPPED','ERROR','FORWARDED') NOT NULL COMMENT '处理结果',
    skip_reason     VARCHAR(200)       COMMENT '跳过原因（skip_checker命中/非询价/已处理等）',
    forward_status  ENUM('NOT_FORWARDED','DRY_RUN','TEST_FORWARDED','FORWARDED','FAILED') DEFAULT 'NOT_FORWARDED' COMMENT '转发状态',
    forward_to      TEXT               COMMENT 'TO 收件人列表 JSON',
    forward_cc      TEXT               COMMENT 'CC 收件人列表 JSON',

    -- LogiTrack 建单
    logitrack_created  TINYINT(1) DEFAULT 0 COMMENT '是否成功创建 LogiTrack 询价单',
    logitrack_id       INT                   COMMENT 'LogiTrack 询价单 ID',
    logitrack_ref      VARCHAR(50)           COMMENT 'LogiTrack 询价单参考编号',
    logitrack_error    VARCHAR(500)          COMMENT '建单失败原因',

    -- 完整 AI/路由数据
    ai_analysis_json   JSON               COMMENT '完整 AI 分析 JSON',
    routing_json       JSON               COMMENT '路由指令 JSON',

    -- 性能
    ai_latency_ms      INT               COMMENT 'AI 分析耗时（毫秒）',
    total_latency_ms   INT               COMMENT '单封邮件总处理耗时（毫秒）',

    -- 运行上下文
    run_mode           VARCHAR(20)       COMMENT '运行模式（DRY_RUN/TEST_FORWARD/LIVE）',

    INDEX idx_processed_at  (processed_at),
    INDEX idx_folder        (folder_name),
    INDEX idx_sender        (sender_email(100)),
    INDEX idx_result        (process_result),
    INDEX idx_conversation  (conversation_id(100)),
    INDEX idx_logitrack     (logitrack_created),
    INDEX idx_email_type    (email_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邮件 AI 处理日志';


-- -------------------------------------------------------------
-- 服务运行状态快照（每轮轮询结束时写一行快照）
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_monitor_status (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    recorded_at     DATETIME NOT NULL COMMENT '快照记录时间',

    -- 运行状态
    run_mode        VARCHAR(20)        COMMENT '运行模式（DRY_RUN/TEST_FORWARD/LIVE）',
    is_running      TINYINT(1)         COMMENT '服务是否运行中',
    poll_interval   INT                COMMENT '轮询间隔（秒）',
    last_poll_time  DATETIME           COMMENT '上次轮询时间',
    next_poll_time  DATETIME           COMMENT '下次轮询预计时间',
    uptime_seconds  BIGINT             COMMENT '服务已运行秒数',

    -- 本轮统计（当前轮询周期内）
    current_processed   INT DEFAULT 0  COMMENT '本轮处理邮件数',
    current_skipped     INT DEFAULT 0  COMMENT '本轮跳过邮件数',
    current_errors      INT DEFAULT 0  COMMENT '本轮失败邮件数',

    -- 累计统计（自服务启动以来）
    total_processed     BIGINT DEFAULT 0  COMMENT '累计处理总数',
    total_skipped       BIGINT DEFAULT 0  COMMENT '累计跳过总数',
    total_errors        BIGINT DEFAULT 0  COMMENT '累计失败总数',
    total_forwarded     BIGINT DEFAULT 0  COMMENT '累计转发总数',
    total_logitrack     BIGINT DEFAULT 0  COMMENT '累计建单总数',

    -- 告警信息
    consecutive_failures INT DEFAULT 0  COMMENT '连续失败次数',
    total_failures       INT DEFAULT 0  COMMENT '历史失败总次数',

    -- 各服务健康状态
    graph_api_ok    TINYINT(1)         COMMENT 'Microsoft Graph API 是否正常',
    llm_api_ok      TINYINT(1)         COMMENT 'LLM API（DeepSeek）是否正常',
    vlm_api_ok      TINYINT(1)         COMMENT 'VLM API（七牛云）是否正常',
    logitrack_ok    TINYINT(1)         COMMENT 'LogiTrack API 是否正常',

    INDEX idx_recorded (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邮件 AI 服务运行状态快照';
