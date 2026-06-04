package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 邮件处理日志列表项 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingLogDTO {

    private Long id;
    private String conversationId;
    private String folderName;
    private String subject;
    private String senderEmail;
    private LocalDateTime processedAt;

    // AI 分析摘要
    private Boolean isInquiry;
    private String emailType;
    private String transportMode;
    private String branchCode;
    private String riskLevel;
    private Integer riskScore;
    private String originCity;
    private String destination;
    private String pol;
    private String pod;
    private Double confidence;

    // 处理结果
    private String processResult;
    private String skipReason;
    private String forwardStatus;

    // LogiTrack 建单
    private Boolean logitrackCreated;
    private Integer logitrackId;
    private String logitrackRef;
    private String logitrackError;

    // 完整 JSON（详情展开用）
    private String aiAnalysisJson;
    private String routingJson;
    private String forwardTo;
    private String forwardCc;

    // 性能
    private Integer aiLatencyMs;
    private Integer totalLatencyMs;
    private String runMode;
}
