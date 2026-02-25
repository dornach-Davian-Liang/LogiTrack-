package com.logitrack.backend.service;

import com.logitrack.backend.dto.AuditLogDTO;
import com.logitrack.backend.entity.AuditLog;
import com.logitrack.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 审计日志服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {
    
    private final AuditLogRepository auditLogRepository;
    
    /**
     * 创建审计日志
     */
    @Transactional
    public void createLog(AuditLog auditLog) {
        try {
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("保存审计日志失败", e);
        }
    }
    
    /**
     * 分页查询审计日志
     */
    public Page<AuditLogDTO> getAuditLogs(
        Integer userId,
        String action,
        String resourceType,
        LocalDateTime startTime,
        LocalDateTime endTime,
        int page,
        int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<AuditLog> logs = auditLogRepository.findByFilters(
            userId, action, resourceType, startTime, endTime, pageable
        );
        
        return logs.map(this::convertToDTO);
    }
    
    /**
     * 获取资源操作历史
     */
    public List<AuditLogDTO> getResourceHistory(String resourceType, String resourceId) {
        List<AuditLog> logs = auditLogRepository.findByResourceTypeAndResourceIdOrderByCreatedAtDesc(
            resourceType, resourceId
        );
        
        return logs.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * 获取用户操作日志
     */
    public Page<AuditLogDTO> getUserLogs(Integer userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> logs = auditLogRepository.findByUserId(userId, pageable);
        return logs.map(this::convertToDTO);
    }
    
    /**
     * 转换为DTO
     */
    private AuditLogDTO convertToDTO(AuditLog log) {
        AuditLogDTO dto = new AuditLogDTO();
        dto.setId(log.getId());
        dto.setUserId(log.getUserId());
        dto.setUsername(log.getUsername());
        dto.setUserRole(log.getUserRole()); // ✅ 新增
        dto.setCnPricingAdmin(log.getCnPricingAdmin()); // ✅ 新增
        dto.setAction(log.getAction());
        dto.setResourceType(log.getResourceType());
        dto.setResourceId(log.getResourceId());
        dto.setResourceName(log.getResourceName());
        dto.setOldValue(log.getOldValue());
        dto.setNewValue(log.getNewValue());
        dto.setDetails(log.getDetails()); // ✅ 新增
        dto.setIpAddress(log.getIpAddress());
        dto.setUserAgent(log.getUserAgent());
        dto.setRequestMethod(log.getRequestMethod());
        dto.setRequestUrl(log.getRequestUrl());
        dto.setStatus(log.getStatus());
        dto.setErrorMessage(log.getErrorMessage());
        dto.setDurationMs(log.getDurationMs());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
    
    /**
     * 清空所有审计日志
     */
    @Transactional
    public void clearAllLogs() {
        log.warn("清空所有审计日志");
        auditLogRepository.deleteAll();
    }
}
