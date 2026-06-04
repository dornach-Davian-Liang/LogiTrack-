package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 单条 AI 建单的质检结果 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QualityCheckResultDTO {

    // ---- 询价单基本信息 ----

    /** 询价单数据库 ID */
    private Long enquiryId;

    /** 询价单 REF 号，如 CN2605219-S */
    private String refNumber;

    /** 对应 email_processing_log 的 ID */
    private Long logId;

    /** 原始邮件主题 */
    private String emailSubject;

    /** 邮件发件人 */
    private String senderEmail;

    /** email_processing_log 的处理时间 */
    private LocalDateTime processedAt;

    // ---- 质检结果 ----

    /** 缺失的必填字段名称列表（英文 fieldKey，前端负责展示友好名称）*/
    private List<String> missingFields;

    /** 是否所有必填字段均完整 */
    private Boolean isComplete;

    /** 是否已被业务人员核验 */
    private Boolean verified;

    /** 核验人用户名 */
    private String verifiedBy;

    /** 核验时间 */
    private LocalDateTime verifiedAt;

    // ---- 路由信息（来自 email_processing_log）----

    /**
     * 路由收件人列表（解析自 forward_to JSON）
     * 示例: ["hkg.cyip@zieglergroup.cn", "hkg.yho@zieglergroup.cn"]
     */
    private List<String> routeRecipients;

    /**
     * 路由抄送列表（解析自 forward_cc JSON）
     */
    private List<String> routeCc;
}
