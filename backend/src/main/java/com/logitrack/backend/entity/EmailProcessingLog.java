package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 邮件 AI 处理日志实体
 * 对应 email_processing_log 表
 */
@Entity
@Table(name = "email_processing_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailProcessingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", length = 500)
    private String conversationId;

    @Column(name = "message_id", length = 500)
    private String messageId;

    @Column(name = "folder_name", length = 100)
    private String folderName;

    @Column(name = "subject", length = 500)
    private String subject;

    @Column(name = "sender_email", length = 255)
    private String senderEmail;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Column(name = "processed_at", nullable = false)
    private LocalDateTime processedAt;

    // AI 分析结果
    @Column(name = "is_inquiry")
    private Boolean isInquiry;

    @Column(name = "email_type", length = 50)
    private String emailType;

    @Column(name = "transport_mode", length = 50)
    private String transportMode;

    @Column(name = "branch_code", length = 20)
    private String branchCode;

    @Column(name = "risk_level", length = 20)
    private String riskLevel;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "origin_city", length = 200)
    private String originCity;

    @Column(name = "destination", length = 200)
    private String destination;

    @Column(name = "pol", length = 200)
    private String pol;

    @Column(name = "pod", length = 200)
    private String pod;

    @Column(name = "confidence")
    private Double confidence;

    // 处理结果
    @Column(name = "process_result", nullable = false, length = 20)
    private String processResult; // PROCESSED/SKIPPED/ERROR/FORWARDED

    @Column(name = "skip_reason", length = 200)
    private String skipReason;

    @Column(name = "forward_status", length = 20)
    private String forwardStatus; // NOT_FORWARDED/DRY_RUN/TEST_FORWARDED/FORWARDED/FAILED

    @Column(name = "forward_to", columnDefinition = "TEXT")
    private String forwardTo;

    @Column(name = "forward_cc", columnDefinition = "TEXT")
    private String forwardCc;

    // LogiTrack 建单
    @Column(name = "logitrack_created")
    private Boolean logitrackCreated;

    @Column(name = "logitrack_id")
    private Integer logitrackId;

    @Column(name = "logitrack_ref", length = 50)
    private String logitrackRef;

    @Column(name = "logitrack_error", length = 500)
    private String logitrackError;

    // 完整 AI/路由数据
    @Column(name = "ai_analysis_json", columnDefinition = "JSON")
    private String aiAnalysisJson;

    @Column(name = "routing_json", columnDefinition = "JSON")
    private String routingJson;

    // 性能
    @Column(name = "ai_latency_ms")
    private Integer aiLatencyMs;

    @Column(name = "total_latency_ms")
    private Integer totalLatencyMs;

    // 运行模式
    @Column(name = "run_mode", length = 20)
    private String runMode;
}
