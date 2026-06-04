package com.logitrack.backend.repository;

import com.logitrack.backend.entity.EmailProcessingLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmailProcessingLogRepository extends JpaRepository<EmailProcessingLog, Long> {

    // 今日处理总数
    @Query("SELECT COUNT(e) FROM EmailProcessingLog e WHERE e.processedAt >= :start")
    long countByProcessedAtAfter(@Param("start") LocalDateTime start);

    // 今日建单总数
    @Query("SELECT COUNT(e) FROM EmailProcessingLog e WHERE e.processedAt >= :start AND e.logitrackCreated = true")
    long countLogitrackCreatedAfter(@Param("start") LocalDateTime start);

    // 今日各处理结果统计
    @Query("SELECT e.processResult, COUNT(e) FROM EmailProcessingLog e " +
           "WHERE e.processedAt >= :start GROUP BY e.processResult")
    List<Object[]> countByResultAfter(@Param("start") LocalDateTime start);

    // 分页查询（支持多条件）
    @Query("SELECT e FROM EmailProcessingLog e WHERE " +
           "(:folderName IS NULL OR e.folderName = :folderName) AND " +
           "(:processResult IS NULL OR e.processResult = :processResult) AND " +
           "(:emailType IS NULL OR e.emailType = :emailType) AND " +
           "(:senderEmail IS NULL OR e.senderEmail LIKE :senderEmail) AND " +
           "(:keyword IS NULL OR e.subject LIKE :keyword) AND " +
           "(:startTime IS NULL OR e.processedAt >= :startTime) AND " +
           "(:endTime IS NULL OR e.processedAt <= :endTime) " +
           "ORDER BY e.processedAt DESC")
    Page<EmailProcessingLog> search(
            @Param("folderName") String folderName,
            @Param("processResult") String processResult,
            @Param("emailType") String emailType,
            @Param("senderEmail") String senderEmail,
            @Param("keyword") String keyword,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            Pageable pageable
    );

    // 最近 N 条记录
    List<EmailProcessingLog> findTop20ByOrderByProcessedAtDesc();

    // 数据质检：查询 AI 自动建单的所有日志（logitrack_created=true，时间倒序）
    @Query("SELECT e FROM EmailProcessingLog e WHERE e.logitrackCreated = true " +
           "AND e.processedAt >= :since ORDER BY e.processedAt DESC")
    List<EmailProcessingLog> findAiCreatedSince(@Param("since") LocalDateTime since);

    // 数据质检：通过 logitrack_id 批量查询日志（补全无日志链接的 AI 建单邮件信息）
    @Query("SELECT e FROM EmailProcessingLog e WHERE e.logitrackId IN :ids AND e.logitrackCreated = true")
    List<EmailProcessingLog> findByLogitrackIdIn(@Param("ids") List<Integer> ids);
}
