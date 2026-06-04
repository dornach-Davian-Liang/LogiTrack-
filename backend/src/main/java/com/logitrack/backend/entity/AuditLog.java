package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 审计日志实体类
 */
@Entity
@Table(name = "audit_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id")
    private Integer userId;
    
    @Column(name = "username", nullable = false, length = 50)
    private String username;
    
    @Column(name = "user_role", length = 50)
    private String userRole; // ADMIN, PRICING_ADMIN, OPERATING_USER等
    
    @Column(name = "cn_pricing_admin", length = 100)
    private String cnPricingAdmin; // 记录enquiry的CN Pricing Admin字段
    
    @Column(name = "action", nullable = false, length = 50)
    private String action; // CREATE, UPDATE, DELETE, VIEW, EXPORT, LOGIN, LOGOUT
    
    @Column(name = "resource_type", nullable = false, length = 50)
    private String resourceType; // ENQUIRY, OFFER, COUNTRY, PORT等
    
    @Column(name = "resource_id", length = 50)
    private String resourceId;
    
    @Column(name = "resource_name")
    private String resourceName;
    
    @Column(name = "old_value", columnDefinition = "JSON")
    private String oldValue;
    
    @Column(name = "new_value", columnDefinition = "JSON")
    private String newValue;
    
    @Column(name = "details", columnDefinition = "TEXT")
    private String details; // 详细的变更说明，如："修改了字段: status (New → Quoted), quantity (10 → 15)"
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "user_agent", length = 500)
    private String userAgent;
    
    @Column(name = "request_method", length = 10)
    private String requestMethod;
    
    @Column(name = "request_url", length = 500)
    private String requestUrl;
    
    @Column(name = "status", length = 20)
    private String status = "SUCCESS"; // SUCCESS, FAILED
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "duration_ms")
    private Integer durationMs;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
