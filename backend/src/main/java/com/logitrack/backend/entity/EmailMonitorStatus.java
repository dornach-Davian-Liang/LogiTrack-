package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 邮件 AI 服务运行状态快照实体
 * 对应 email_monitor_status 表
 */
@Entity
@Table(name = "email_monitor_status")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailMonitorStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    // 运行状态
    @Column(name = "run_mode", length = 20)
    private String runMode;

    @Column(name = "is_running")
    private Boolean isRunning;

    @Column(name = "poll_interval")
    private Integer pollInterval;

    @Column(name = "last_poll_time")
    private LocalDateTime lastPollTime;

    @Column(name = "next_poll_time")
    private LocalDateTime nextPollTime;

    @Column(name = "uptime_seconds")
    private Long uptimeSeconds;

    // 本轮统计
    @Column(name = "current_processed")
    private Integer currentProcessed;

    @Column(name = "current_skipped")
    private Integer currentSkipped;

    @Column(name = "current_errors")
    private Integer currentErrors;

    // 累计统计
    @Column(name = "total_processed")
    private Long totalProcessed;

    @Column(name = "total_skipped")
    private Long totalSkipped;

    @Column(name = "total_errors")
    private Long totalErrors;

    @Column(name = "total_forwarded")
    private Long totalForwarded;

    @Column(name = "total_logitrack")
    private Long totalLogitrack;

    // 告警
    @Column(name = "consecutive_failures")
    private Integer consecutiveFailures;

    @Column(name = "total_failures")
    private Integer totalFailures;

    // 服务健康状态
    @Column(name = "graph_api_ok")
    private Boolean graphApiOk;

    @Column(name = "llm_api_ok")
    private Boolean llmApiOk;

    @Column(name = "vlm_api_ok")
    private Boolean vlmApiOk;

    @Column(name = "logitrack_ok")
    private Boolean logitrackOk;
}
