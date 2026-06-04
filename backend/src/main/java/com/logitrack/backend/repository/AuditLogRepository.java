package com.logitrack.backend.repository;

import com.logitrack.backend.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 审计日志数据访问层
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    /**
     * 根据用户ID查找审计日志
     */
    Page<AuditLog> findByUserId(Integer userId, Pageable pageable);
    
    /**
     * 根据用户名查找审计日志
     */
    Page<AuditLog> findByUsername(String username, Pageable pageable);
    
    /**
     * 根据操作类型查找审计日志
     */
    Page<AuditLog> findByAction(String action, Pageable pageable);
    
    /**
     * 根据资源类型查找审计日志
     */
    Page<AuditLog> findByResourceType(String resourceType, Pageable pageable);
    
    /**
     * 根据时间范围查找审计日志
     */
    Page<AuditLog> findByCreatedAtBetween(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);
    
    /**
     * 复杂查询：支持多条件筛选
     */
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:userId IS NULL OR a.userId = :userId) AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:resourceType IS NULL OR a.resourceType = :resourceType) AND " +
           "(:startTime IS NULL OR a.createdAt >= :startTime) AND " +
           "(:endTime IS NULL OR a.createdAt <= :endTime)")
    Page<AuditLog> findByFilters(
        @Param("userId") Integer userId,
        @Param("action") String action,
        @Param("resourceType") String resourceType,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime,
        Pageable pageable
    );
    
    /**
     * 查找特定资源的操作历史
     */
    List<AuditLog> findByResourceTypeAndResourceIdOrderByCreatedAtDesc(String resourceType, String resourceId);
}
