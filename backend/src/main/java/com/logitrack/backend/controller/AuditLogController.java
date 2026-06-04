package com.logitrack.backend.controller;

import com.logitrack.backend.dto.AuditLogDTO;
import com.logitrack.backend.service.AuditLogService;
import com.logitrack.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 审计日志控制器
 */
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@Slf4j
public class AuditLogController {
    
    private final AuditLogService auditLogService;
    private final AuthService authService;
    
    /**
     * 检查用户是否有权限访问审计日志（仅ADMIN）
     */
    private ResponseEntity<?> checkPermission(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        Integer userId = authService.resolveUserIdFromAuthHeader(authHeader);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "未授权：请先登录"));
        }

        if (!authService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "访问被拒绝：仅管理员可以查看审计日志"));
        }
        return null;
    }
    
    /**
     * 分页查询审计日志
     */
    @GetMapping
    public ResponseEntity<?> getAuditLogs(
        HttpServletRequest request,
        @RequestParam(required = false) Integer userId,
        @RequestParam(required = false) String action,
        @RequestParam(required = false) String resourceType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        // 权限检查
        ResponseEntity<?> permissionCheck = checkPermission(request);
        if (permissionCheck != null) {
            return permissionCheck;
        }
        
        Page<AuditLogDTO> logs = auditLogService.getAuditLogs(
            userId, action, resourceType, startTime, endTime, page, size
        );
        return ResponseEntity.ok(logs);
    }
    
    /**
     * 获取资源操作历史
     */
    @GetMapping("/resource-history")
    public ResponseEntity<?> getResourceHistory(
        HttpServletRequest request,
        @RequestParam String resourceType,
        @RequestParam String resourceId
    ) {
        // 权限检查
        ResponseEntity<?> permissionCheck = checkPermission(request);
        if (permissionCheck != null) {
            return permissionCheck;
        }
        
        List<AuditLogDTO> logs = auditLogService.getResourceHistory(resourceType, resourceId);
        return ResponseEntity.ok(logs);
    }
    
    /**
     * 获取用户操作日志
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserLogs(
        HttpServletRequest request,
        @PathVariable Integer userId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        // 权限检查
        ResponseEntity<?> permissionCheck = checkPermission(request);
        if (permissionCheck != null) {
            return permissionCheck;
        }
        
        Page<AuditLogDTO> logs = auditLogService.getUserLogs(userId, page, size);
        return ResponseEntity.ok(logs);
    }

    /**
     * 导出审计日志 (简化版：返回JSON)
     */
    @GetMapping("/export")
    public ResponseEntity<?> exportAuditLogs(
        HttpServletRequest request,
        @RequestParam(required = false) Integer userId,
        @RequestParam(required = false) String action,
        @RequestParam(required = false) String resourceType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime
    ) {
        // 权限检查
        ResponseEntity<?> permissionCheck = checkPermission(request);
        if (permissionCheck != null) {
            return permissionCheck;
        }
        
        try {
            log.info("导出审计日志 - userId={}, action={}, resourceType={}, startTime={}, endTime={}", 
                userId, action, resourceType, startTime, endTime);
            
            // 获取所有日志(不分页，用于导出)
            Page<AuditLogDTO> logs = auditLogService.getAuditLogs(
                userId, action, resourceType, startTime, endTime, 0, Integer.MAX_VALUE
            );
            
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=audit-logs.json")
                .body(logs.getContent());
        } catch (Exception e) {
            log.error("导出审计日志失败", e);
            return ResponseEntity.status(500).body("导出失败: " + e.getMessage());
        }
    }

    /**
     * 清空所有审计日志
     */
    @PostMapping("/clear")
    public ResponseEntity<?> clearAuditLogs(HttpServletRequest request) {
        // 权限检查
        ResponseEntity<?> permissionCheck = checkPermission(request);
        if (permissionCheck != null) {
            return permissionCheck;
        }
        
        try {
            log.warn("清空所有审计日志");
            auditLogService.clearAllLogs();
            return ResponseEntity.ok().body(Map.of(
                "message", "审计日志已清空"
            ));
        } catch (Exception e) {
            log.error("清空审计日志失败", e);
            return ResponseEntity.status(500).body("清空失败: " + e.getMessage());
        }
    }
}
