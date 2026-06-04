package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * AI 建单数据质检执行历史
 * 对应 data_quality_check_history 表
 */
@Entity
@Table(name = "data_quality_check_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DataQualityCheckHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 本次质检执行时间 */
    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;

    /** 本次检查范围（天） */
    @Column(name = "check_scope_days", nullable = false)
    private Integer checkScopeDays;

    /** 总检查条数 */
    @Column(name = "total_checked", nullable = false)
    private Integer totalChecked = 0;

    /** 字段完整条数 */
    @Column(name = "total_complete", nullable = false)
    private Integer totalComplete = 0;

    /** 有缺失字段条数 */
    @Column(name = "total_incomplete", nullable = false)
    private Integer totalIncomplete = 0;

    /** 完整率百分比，如 85.71 */
    @Column(name = "completion_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal completionRate = BigDecimal.ZERO;

    /**
     * 各字段缺失计数（JSON 字符串）
     * 格式: {"category_code":14,"sales_pic_id":8,"pol_id":5}
     */
    @Column(name = "field_stats_json", columnDefinition = "JSON")
    private String fieldStatsJson;

    /** 是否已发送邮件报告 */
    @Column(name = "report_sent", nullable = false)
    private Boolean reportSent = false;

    /** 全局收件人数量 */
    @Column(name = "global_recipients_count", nullable = false)
    private Integer globalRecipientsCount = 0;

    /** 路由分发收件人数量（distinct 邮箱数） */
    @Column(name = "route_recipients_count", nullable = false)
    private Integer routeRecipientsCount = 0;

    /** 执行时异常信息（正常为 null） */
    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
