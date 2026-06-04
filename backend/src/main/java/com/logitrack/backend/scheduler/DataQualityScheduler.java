package com.logitrack.backend.scheduler;

import com.logitrack.backend.dto.QualityCheckResultDTO;
import com.logitrack.backend.entity.DataQualityCheckConfig;
import com.logitrack.backend.service.DataQualityCheckService;
import com.logitrack.backend.service.QualityReportMailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;

/**
 * AI 建单数据质检定时调度器
 *
 * 采用 SchedulingConfigurer 模式，支持从数据库动态读取 CRON 表达式，
 * 调用 refreshSchedule() 后无需重启即可热更新定时频率。
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataQualityScheduler implements SchedulingConfigurer {

    private final DataQualityCheckService checkService;
    private final QualityReportMailService mailService;
    private final TaskScheduler taskScheduler;

    /** 当前正在运行的调度任务引用，用于取消和重新注册 */
    private ScheduledFuture<?> scheduledFuture;

    /** 当前使用的 CRON 表达式（缓存，避免重复重建） */
    private String currentCron = null;

    // ======================================================================
    // SchedulingConfigurer 实现（Spring 启动时注册定时任务）
    // ======================================================================

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        taskRegistrar.setTaskScheduler(taskScheduler);
        taskRegistrar.addTriggerTask(
            this::executeCheck,
            triggerContext -> {
                DataQualityCheckConfig cfg = checkService.getConfig();
                if (!Boolean.TRUE.equals(cfg.getEnabled())) {
                    // 未启用：不调度，返回 null 表示不触发
                    return null;
                }
                try {
                    return new CronTrigger(cfg.getCronExpression())
                        .nextExecution(triggerContext);
                } catch (Exception e) {
                    log.error("[QualityScheduler] Invalid CRON '{}': {}", cfg.getCronExpression(), e.getMessage());
                    return null;
                }
            }
        );
        log.info("[QualityScheduler] Registered trigger task (dynamic CRON from DB).");
    }

    // ======================================================================
    // 核心执行方法
    // ======================================================================

    /**
     * 执行一次完整质检流程（定时触发 或 手动触发均调此方法）。
     * 执行链: runCheck → groupByRecipient → sendGlobalReport + sendRouteBasedReports
     */
    public List<QualityCheckResultDTO> executeCheck() {
        DataQualityCheckConfig cfg = checkService.getConfig();
        log.info("[QualityScheduler] Starting quality check, scope={}d", cfg.getCheckScopeDays());

        List<QualityCheckResultDTO> results;
        try {
            results = checkService.runCheck(cfg.getCheckScopeDays());
        } catch (Exception e) {
            log.error("[QualityScheduler] runCheck failed: {}", e.getMessage(), e);
            return List.of();
        }

        if (results.isEmpty()) {
            log.info("[QualityScheduler] No AI-created records in scope, skip mail.");
            return results;
        }

        // 计算字段统计（热力图数据源）
        Map<String, Integer> fieldStats = checkService.computeFieldStats(results);

        int globalSent = 0;
        int routeSent  = 0;

        // --- 全局报告 ---
        try {
            List<String> globalRecipients = checkService.getConfigDTO().getGlobalRecipients();
            globalSent = mailService.sendGlobalReport(
                globalRecipients, results, fieldStats, cfg.getCheckScopeDays());
        } catch (Exception e) {
            log.error("[QualityScheduler] sendGlobalReport failed: {}", e.getMessage(), e);
        }

        // --- 路由分发报告（按 forward_to 分组）---
        if (Boolean.TRUE.equals(cfg.getRouteBasedEnabled())) {
            try {
                Map<String, List<QualityCheckResultDTO>> grouped =
                    checkService.groupByRouteRecipient(results);
                routeSent = mailService.sendRouteBasedReports(grouped);
            } catch (Exception e) {
                log.error("[QualityScheduler] sendRouteBasedReports failed: {}", e.getMessage(), e);
            }
        }

        // 更新 history 记录：已发送 + 收件人数
        try {
            checkService.updateLatestHistoryReportSent(globalSent, routeSent);
        } catch (Exception e) {
            log.warn("[QualityScheduler] updateLatestHistoryReportSent failed: {}", e.getMessage());
        }

        log.info("[QualityScheduler] Done. results={}, globalSent={}, routeSent={}",
            results.size(), globalSent, routeSent);
        return results;
    }
}
