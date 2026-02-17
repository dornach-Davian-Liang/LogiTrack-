package com.logitrack.backend.controller;

import com.logitrack.backend.dto.AuditLogDTO;
import com.logitrack.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 审计日志控制器
 */
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@Slf4j
public class AuditLogController {
    
    private final AuditLogService auditLogService;
    
    /**
     * 分页查询审计日志
     */
    @GetMapping
    public ResponseEntity<Page<AuditLogDTO>> getAuditLogs(
        @RequestParam(required = false) Integer userId,
        @RequestParam(required = false) String action,
        @RequestParam(required = false) String resourceType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<AuditLogDTO> logs = auditLogService.getAuditLogs(
            userId, action, resourceType, startTime, endTime, page, size
        );
        return ResponseEntity.ok(logs);
    }
    
    /**
     * 获取资源操作历史
     */
    @GetMapping("/resource-history")
    public ResponseEntity<List<AuditLogDTO>> getResourceHistory(
        @RequestParam String resourceType,
        @RequestParam String resourceId
    ) {
        List<AuditLogDTO> logs = auditLogService.getResourceHistory(resourceType, resourceId);
        return ResponseEntity.ok(logs);
    }
    
    /**
     * 获取用户操作日志
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<AuditLogDTO>> getUserLogs(
        @PathVariable Integer userId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<AuditLogDTO> logs = auditLogService.getUserLogs(userId, page, size);
        return ResponseEntity.ok(logs);
    }
}
