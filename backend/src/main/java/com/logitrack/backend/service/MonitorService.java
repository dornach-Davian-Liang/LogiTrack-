package com.logitrack.backend.service;

import com.logitrack.backend.dto.MonitorStatsDTO;
import com.logitrack.backend.dto.ProcessingLogDTO;
import com.logitrack.backend.entity.EmailMonitorStatus;
import com.logitrack.backend.entity.EmailProcessingLog;
import com.logitrack.backend.repository.EmailMonitorStatusRepository;
import com.logitrack.backend.repository.EmailProcessingLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitorService {

    private final EmailProcessingLogRepository logRepo;
    private final EmailMonitorStatusRepository statusRepo;

    /**
     * 获取 Dashboard 统计数据（今日 + 最新状态快照）
     */
    public MonitorStatsDTO getStats() {
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);

        long todayTotal = logRepo.countByProcessedAtAfter(todayStart);
        long todayLogitrack = logRepo.countLogitrackCreatedAfter(todayStart);

        long todayProcessed = 0, todaySkipped = 0, todayErrors = 0, todayForwarded = 0;
        List<Object[]> resultCounts = logRepo.countByResultAfter(todayStart);
        for (Object[] row : resultCounts) {
            String result = (String) row[0];
            long count = (Long) row[1];
            switch (result) {
                case "PROCESSED" -> todayProcessed = count;
                case "SKIPPED" -> todaySkipped = count;
                case "ERROR" -> todayErrors = count;
                case "FORWARDED" -> todayForwarded = count;
            }
        }

        MonitorStatsDTO dto = new MonitorStatsDTO();
        dto.setTodayTotal(todayTotal);
        dto.setTodayProcessed(todayProcessed);
        dto.setTodaySkipped(todaySkipped);
        dto.setTodayErrors(todayErrors);
        dto.setTodayForwarded(todayForwarded);
        dto.setTodayLogitrack(todayLogitrack);

        // 最新状态快照
        Optional<EmailMonitorStatus> latest = statusRepo.findTopByOrderByRecordedAtDesc();
        latest.ifPresent(s -> {
            dto.setRunMode(s.getRunMode());
            dto.setIsRunning(s.getIsRunning());
            dto.setPollInterval(s.getPollInterval());
            dto.setLastPollTime(s.getLastPollTime());
            dto.setUptimeSeconds(s.getUptimeSeconds());
            dto.setConsecutiveFailures(s.getConsecutiveFailures());
            dto.setGraphApiOk(s.getGraphApiOk());
            dto.setLlmApiOk(s.getLlmApiOk());
            dto.setVlmApiOk(s.getVlmApiOk());
            dto.setLogitrackOk(s.getLogitrackOk());
        });

        return dto;
    }

    /**
     * 分页查询处理日志
     */
    public Page<ProcessingLogDTO> getLogs(
            String folderName, String processResult, String emailType,
            String senderEmail, String keyword,
            LocalDateTime startTime, LocalDateTime endTime,
            int page, int size) {

        // 添加通配符用于 LIKE 查询
        String senderFilter = senderEmail != null && !senderEmail.isBlank()
                ? "%" + senderEmail + "%" : null;
        String keywordFilter = keyword != null && !keyword.isBlank()
                ? "%" + keyword + "%" : null;
        String folderFilter = folderName != null && !folderName.isBlank() ? folderName : null;
        String resultFilter = processResult != null && !processResult.isBlank() ? processResult : null;
        String typeFilter = emailType != null && !emailType.isBlank() ? emailType : null;

        Page<EmailProcessingLog> pageResult = logRepo.search(
                folderFilter, resultFilter, typeFilter,
                senderFilter, keywordFilter,
                startTime, endTime,
                PageRequest.of(page, size)
        );

        return pageResult.map(this::toDTO);
    }

    /**
     * 获取最近 20 条日志（Dashboard 快速预览）
     */
    public List<ProcessingLogDTO> getRecentLogs() {
        return logRepo.findTop20ByOrderByProcessedAtDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── 内部映射 ──────────────────────────────────────────────────────────────

    private ProcessingLogDTO toDTO(EmailProcessingLog e) {
        ProcessingLogDTO d = new ProcessingLogDTO();
        d.setId(e.getId());
        d.setConversationId(e.getConversationId());
        d.setFolderName(e.getFolderName());
        d.setSubject(e.getSubject());
        d.setSenderEmail(e.getSenderEmail());
        d.setProcessedAt(e.getProcessedAt());
        d.setIsInquiry(e.getIsInquiry());
        d.setEmailType(e.getEmailType());
        d.setTransportMode(e.getTransportMode());
        d.setBranchCode(e.getBranchCode());
        d.setRiskLevel(e.getRiskLevel());
        d.setRiskScore(e.getRiskScore());
        d.setOriginCity(e.getOriginCity());
        d.setDestination(e.getDestination());
        d.setPol(e.getPol());
        d.setPod(e.getPod());
        d.setConfidence(e.getConfidence());
        d.setProcessResult(e.getProcessResult());
        d.setSkipReason(e.getSkipReason());
        d.setForwardStatus(e.getForwardStatus());
        d.setLogitrackCreated(e.getLogitrackCreated());
        d.setLogitrackId(e.getLogitrackId());
        d.setLogitrackRef(e.getLogitrackRef());
        d.setLogitrackError(e.getLogitrackError());
        d.setAiAnalysisJson(e.getAiAnalysisJson());
        d.setRoutingJson(e.getRoutingJson());
        d.setForwardTo(e.getForwardTo());
        d.setForwardCc(e.getForwardCc());
        d.setAiLatencyMs(e.getAiLatencyMs());
        d.setTotalLatencyMs(e.getTotalLatencyMs());
        d.setRunMode(e.getRunMode());
        return d;
    }
}
