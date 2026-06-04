package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 监控统计数据 DTO（Dashboard 概览卡片）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonitorStatsDTO {

    // 今日统计
    private long todayTotal;
    private long todayProcessed;
    private long todaySkipped;
    private long todayErrors;
    private long todayForwarded;
    private long todayLogitrack;

    // 最新状态快照
    private String runMode;
    private Boolean isRunning;
    private Integer pollInterval;
    private LocalDateTime lastPollTime;
    private Long uptimeSeconds;
    private Integer consecutiveFailures;

    // 服务健康（来自最新快照）
    private Boolean graphApiOk;
    private Boolean llmApiOk;
    private Boolean vlmApiOk;
    private Boolean logitrackOk;
}
