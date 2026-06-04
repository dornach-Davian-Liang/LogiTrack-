package com.logitrack.backend.controller;

import com.logitrack.backend.dto.MonitorStatsDTO;
import com.logitrack.backend.dto.ProcessingLogDTO;
import com.logitrack.backend.service.MonitorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 邮件 AI 监控控制器
 * 提供 /api/monitor/* 接口，供前端 Dashboard 查询历史数据
 */
@RestController
@RequestMapping("/api/monitor")
@RequiredArgsConstructor
@Slf4j
public class MonitorController {

    private final MonitorService monitorService;

    /**
     * GET /api/monitor/stats
     * Dashboard 统计卡片：今日处理数 + 最新状态快照
     */
    @GetMapping("/stats")
    public ResponseEntity<MonitorStatsDTO> getStats() {
        try {
            return ResponseEntity.ok(monitorService.getStats());
        } catch (Exception e) {
            log.error("获取监控统计失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /api/monitor/logs
     * 处理日志分页查询（支持多条件筛选）
     *
     * @param folderName    文件夹名（Sea/Air/Inbox 等）
     * @param processResult 处理结果（PROCESSED/SKIPPED/ERROR/FORWARDED）
     * @param emailType     邮件类型（INQUIRY/BOOKING 等）
     * @param senderEmail   发件人邮箱（模糊匹配）
     * @param keyword       主题关键词（模糊匹配）
     * @param startTime     开始时间
     * @param endTime       结束时间
     * @param page          页码（0-based，默认0）
     * @param size          每页条数（默认20）
     */
    @GetMapping("/logs")
    public ResponseEntity<Page<ProcessingLogDTO>> getLogs(
            @RequestParam(required = false) String folderName,
            @RequestParam(required = false) String processResult,
            @RequestParam(required = false) String emailType,
            @RequestParam(required = false) String senderEmail,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<ProcessingLogDTO> result = monitorService.getLogs(
                    folderName, processResult, emailType,
                    senderEmail, keyword, startTime, endTime,
                    page, Math.min(size, 100)
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("查询处理日志失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /api/monitor/logs/recent
     * 最近 20 条日志（Dashboard 快速预览）
     */
    @GetMapping("/logs/recent")
    public ResponseEntity<List<ProcessingLogDTO>> getRecentLogs() {
        try {
            return ResponseEntity.ok(monitorService.getRecentLogs());
        } catch (Exception e) {
            log.error("查询最近日志失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
