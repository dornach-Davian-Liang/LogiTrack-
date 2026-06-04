package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * AI 建单数据质检配置（全系统单行，id=1）
 * 对应 data_quality_check_config 表
 */
@Entity
@Table(name = "data_quality_check_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DataQualityCheckConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** 是否启用定时质检 */
    @Column(name = "enabled", nullable = false)
    private Boolean enabled = false;

    /** Spring CRON 表达式，如 "0 0 9 * * ?" */
    @Column(name = "cron_expression", nullable = false, length = 50)
    private String cronExpression = "0 0 9 * * ?";

    /** 检查最近 N 天的 AI 建单数据 */
    @Column(name = "check_scope_days", nullable = false)
    private Integer checkScopeDays = 7;

    /** 全局通知邮箱数组（JSON 字符串），如 ["a@b.com"] */
    @Column(name = "global_recipients", columnDefinition = "JSON")
    private String globalRecipients;

    /** 是否同时按路由指令分发报告 */
    @Column(name = "route_based_enabled", nullable = false)
    private Boolean routeBasedEnabled = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
