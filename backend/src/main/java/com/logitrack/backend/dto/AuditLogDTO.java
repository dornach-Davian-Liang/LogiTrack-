package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 审计日志DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDTO {
    private Long id;
    private Integer userId;
    private String username;
    private String action;
    private String resourceType;
    private String resourceId;
    private String resourceName;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private String userAgent;
    private String requestMethod;
    private String requestUrl;
    private String status;
    private String errorMessage;
    private Integer durationMs;
    private LocalDateTime createdAt;
}
