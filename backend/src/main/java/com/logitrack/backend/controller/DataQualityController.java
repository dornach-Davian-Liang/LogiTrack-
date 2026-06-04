package com.logitrack.backend.controller;

import com.logitrack.backend.dto.QualityCheckConfigDTO;
import com.logitrack.backend.dto.QualityCheckResultDTO;
import com.logitrack.backend.entity.DataQualityCheckHistory;
import com.logitrack.backend.scheduler.DataQualityScheduler;
import com.logitrack.backend.service.DataQualityCheckService;
import com.logitrack.backend.service.QualityReportMailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI 建单数据质检 REST API
 * 路径前缀: /api/monitor/quality
 */
@RestController
@RequestMapping("/api/monitor/quality")
@RequiredArgsConstructor
@Slf4j
public class DataQualityController {

    private final DataQualityCheckService checkService;
    private final QualityReportMailService mailService;
    private final DataQualityScheduler scheduler;

    // ======================================================================
    // 配置
    // ======================================================================

    /**
     * GET /api/monitor/quality/config
     * 获取质检配置
     */
    @GetMapping("/config")
    public ResponseEntity<QualityCheckConfigDTO> getConfig() {
        try {
            return ResponseEntity.ok(checkService.getConfigDTO());
        } catch (Exception e) {
            log.error("[QualityAPI] getConfig error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * PUT /api/monitor/quality/config
     * 更新配置（CRON / 全局邮箱 / 启用开关 / 路由分发开关）
     */
    @PutMapping("/config")
    public ResponseEntity<QualityCheckConfigDTO> updateConfig(
            @RequestBody QualityCheckConfigDTO dto) {
        try {
            QualityCheckConfigDTO saved = checkService.saveConfig(dto);
            log.info("[QualityAPI] Config updated: enabled={}, cron={}",
                saved.getEnabled(), saved.getCronExpression());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("[QualityAPI] updateConfig error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ======================================================================
    // 执行 & 预览
    // ======================================================================

    /**
     * POST /api/monitor/quality/run
     * 手动触发一次质检（含邮件发送）
     * 返回: { results: [...], fieldStats: {...}, totalChecked: N, totalIncomplete: N }
     */
    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runCheck() {
        try {
            log.info("[QualityAPI] Manual run triggered.");
            List<QualityCheckResultDTO> results = scheduler.executeCheck();
            Map<String, Integer> fieldStats = checkService.computeFieldStats(results);
            long incomplete = results.stream()
                .filter(r -> !Boolean.TRUE.equals(r.getIsComplete())
                          && !Boolean.TRUE.equals(r.getVerified()))
                .count();
            Map<String, Object> resp = new HashMap<>();
            resp.put("results", results);
            resp.put("fieldStats", fieldStats);
            resp.put("totalChecked", results.size());
            resp.put("totalIncomplete", incomplete);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("[QualityAPI] run error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /api/monitor/quality/results?days=7
     * 获取当前质检结果（不发邮件，不写历史）
     */
    @GetMapping("/results")
    public ResponseEntity<Map<String, Object>> getResults(
            @RequestParam(defaultValue = "7") int days) {
        try {
            List<QualityCheckResultDTO> results = checkService.runCheck(days);
            Map<String, Integer> fieldStats = checkService.computeFieldStats(results);
            long incomplete = results.stream()
                .filter(r -> !Boolean.TRUE.equals(r.getIsComplete())
                          && !Boolean.TRUE.equals(r.getVerified()))
                .count();
            Map<String, Object> resp = new HashMap<>();
            resp.put("results", results);
            resp.put("fieldStats", fieldStats);
            resp.put("totalChecked", results.size());
            resp.put("totalIncomplete", incomplete);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("[QualityAPI] getResults error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /api/monitor/quality/preview?days=7
     * 预览全局报告 HTML（不发送邮件，前端可在 iframe 内展示）
     */
    @GetMapping(value = "/preview", produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> previewReport(
            @RequestParam(defaultValue = "7") int days) {
        try {
            List<QualityCheckResultDTO> results = checkService.runCheck(days);
            Map<String, Integer> fieldStats = checkService.computeFieldStats(results);
            String html = mailService.buildGlobalHtml(results, fieldStats, days);
            return ResponseEntity.ok(html);
        } catch (Exception e) {
            log.error("[QualityAPI] preview error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("<p>预览失败: " + e.getMessage() + "</p>");
        }
    }

    // ======================================================================
    // 历史 & 统计
    // ======================================================================

    /**
     * GET /api/monitor/quality/history
     * 最近 30 次执行历史（趋势图 & 历史面板）
     */
    @GetMapping("/history")
    public ResponseEntity<List<DataQualityCheckHistory>> getHistory() {
        try {
            return ResponseEntity.ok(checkService.getRecentHistory());
        } catch (Exception e) {
            log.error("[QualityAPI] getHistory error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /api/monitor/quality/field-stats?days=30
     * 字段缺失统计（热力图数据源）
     * 返回: { "category": 14, "salesPicId": 8, ... }
     */
    @GetMapping("/field-stats")
    public ResponseEntity<Map<String, Object>> getFieldStats(
            @RequestParam(defaultValue = "30") int days) {
        try {
            List<QualityCheckResultDTO> results = checkService.runCheck(days);
            Map<String, Integer> stats = checkService.computeFieldStats(results);
            // 同时返回字段中文标签（前端图表用）
            Map<String, Object> resp = new HashMap<>();
            resp.put("stats", stats);
            resp.put("labels", DataQualityCheckService.FIELD_LABELS);
            resp.put("totalChecked", results.size());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("[QualityAPI] getFieldStats error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /api/monitor/quality/trend?days=30
     * 每日完整率趋势（折线图数据源）
     * 返回: [{ date, totalChecked, totalIncomplete, completionRate }, ...]
     */
    @GetMapping("/trend")
    public ResponseEntity<List<Map<String, Object>>> getTrend(
            @RequestParam(defaultValue = "30") int days) {
        try {
            return ResponseEntity.ok(checkService.getTrendData(days));
        } catch (Exception e) {
            log.error("[QualityAPI] getTrend error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ======================================================================
    // 已核验标记
    // ======================================================================

    /**
     * POST /api/monitor/quality/verify/{enquiryId}
     * 标记询价单已核验（幂等）
     * Header: X-Username 当前操作人（前端传入，同其他接口约定）
     */
    @PostMapping("/verify/{enquiryId}")
    public ResponseEntity<Map<String, Object>> markVerified(
            @PathVariable Long enquiryId,
            @RequestHeader(value = "X-Username", defaultValue = "unknown") String username) {
        try {
            checkService.markVerified(enquiryId, username);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("enquiryId", enquiryId);
            resp.put("verifiedBy", username);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("[QualityAPI] markVerified error: enquiryId={}, {}", enquiryId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * DELETE /api/monitor/quality/verify/{enquiryId}
     * 撤销已核验标记
     */
    @DeleteMapping("/verify/{enquiryId}")
    public ResponseEntity<Map<String, Object>> unmarkVerified(
            @PathVariable Long enquiryId) {
        try {
            checkService.unmarkVerified(enquiryId);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("enquiryId", enquiryId);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("[QualityAPI] unmarkVerified error: enquiryId={}, {}", enquiryId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
