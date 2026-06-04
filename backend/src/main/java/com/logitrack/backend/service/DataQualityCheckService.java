package com.logitrack.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logitrack.backend.dto.QualityCheckConfigDTO;
import com.logitrack.backend.dto.QualityCheckResultDTO;
import com.logitrack.backend.entity.*;
import com.logitrack.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI 建单数据质检核心服务
 * 职责：扫描 AI 自动创建的询价单，检查必填字段缺漏，统计数据，管理核验状态。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataQualityCheckService {

    /**
     * 质检字段键名 → 业务友好名称（按缺失优先级排序）
     * 前端使用此 map 做 label 渲染，后端邮件 HTML 也用到。
     */
    public static final Map<String, String> FIELD_LABELS;
    static {
        Map<String, String> m = new LinkedHashMap<>();
        // 必填字段（高缺失率优先）
        m.put("category",            "Category");
        m.put("salesPicId",          "Sales PIC");
        m.put("polExists",           "POL");
        m.put("podExists",           "POD");
        m.put("assignedCnOffice",    "Assigned CN Office");
        m.put("salesCountryCode",    "Z-Country / Agent");
        m.put("cargoTypeCode",       "Cargo Type");
        m.put("productCode",         "Product Type");
        m.put("enquiryReceivedDate", "Enquiry Received Date");
        // 扩展字段
        m.put("commodity",           "Commodity");
        m.put("volumeQty",           "Volume / Quantity");
        m.put("coreNonCore",         "Core / Non-Core");
        FIELD_LABELS = Collections.unmodifiableMap(m);
    }

    private final EmailProcessingLogRepository logRepo;
    private final EnquiryRepository            enquiryRepo;
    private final EnquiryPolRepository         polRepo;
    private final EnquiryPodRepository         podRepo;
    private final DataQualityCheckConfigRepository  configRepo;
    private final DataQualityCheckHistoryRepository historyRepo;
    private final DataQualityVerifiedRepository     verifiedRepo;
    private final ObjectMapper objectMapper;

    // ======================================================================
    // 配置管理
    // ======================================================================

    /** 获取质检配置（若不存在则自动创建默认行） */
    public DataQualityCheckConfig getConfig() {
        return configRepo.findById(1).orElseGet(() -> {
            DataQualityCheckConfig cfg = new DataQualityCheckConfig();
            cfg.setId(1);
            cfg.setEnabled(false);
            cfg.setCronExpression("0 0 9 * * ?");
            cfg.setCheckScopeDays(7);
            cfg.setGlobalRecipients("[\"davian.liang@zieglergroup.cn\"]");
            cfg.setRouteBasedEnabled(false);
            return configRepo.save(cfg);
        });
    }

    /** 获取质检配置 DTO（供 Controller 返回前端） */
    public QualityCheckConfigDTO getConfigDTO() {
        DataQualityCheckConfig cfg = getConfig();
        return new QualityCheckConfigDTO(
            cfg.getEnabled(),
            cfg.getCronExpression(),
            cfg.getCheckScopeDays(),
            parseJsonArray(cfg.getGlobalRecipients()),
            cfg.getRouteBasedEnabled()
        );
    }

    /** 保存质检配置（前端提交时调用） */
    @Transactional
    public QualityCheckConfigDTO saveConfig(QualityCheckConfigDTO dto) {
        DataQualityCheckConfig cfg = getConfig();
        if (dto.getEnabled() != null)         cfg.setEnabled(dto.getEnabled());
        if (dto.getCronExpression() != null)  cfg.setCronExpression(dto.getCronExpression());
        if (dto.getCheckScopeDays() != null)  cfg.setCheckScopeDays(dto.getCheckScopeDays());
        if (dto.getGlobalRecipients() != null) {
            try { cfg.setGlobalRecipients(objectMapper.writeValueAsString(dto.getGlobalRecipients())); }
            catch (JsonProcessingException e) { log.warn("Serialize globalRecipients failed", e); }
        }
        if (dto.getRouteBasedEnabled() != null) cfg.setRouteBasedEnabled(dto.getRouteBasedEnabled());
        configRepo.save(cfg);
        return getConfigDTO();
    }

    // ======================================================================
    // 核心质检逻辑
    // ======================================================================

    /**
     * 执行质检扫描：查询最近 scopeDays 天内 AI 自动建单，
     * 检查必填字段缺失情况，写入执行历史，返回结果列表。
     *
     * @param scopeDays 检查范围（天）
     * @return 所有 AI 建单的质检结果（含完整和缺失的）
     */
    @Transactional
    public List<QualityCheckResultDTO> runCheck(int scopeDays) {
        LocalDateTime since = LocalDateTime.now().minusDays(scopeDays);

        // 直接从 enquiry 表查询：所有 AI 自动建单（created_by='email-ai-bot'）
        // 修复原因：部分 AI 建单因 _write_mon 静默失败未写入 email_processing_log，
        //          导致通过 email_processing_log 反查时漏计（59→53）。
        List<Enquiry> aiEnquiries = enquiryRepo.findByCreatedBySince("email-ai-bot", since);
        log.info("[DataQuality] scope={}d, AI-created enquiries found: {}", scopeDays, aiEnquiries.size());

        if (aiEnquiries.isEmpty()) {
            saveHistory(scopeDays, 0, 0, List.of(), null);
            return List.of();
        }

        List<Long> enquiryIds = aiEnquiries.stream()
            .map(Enquiry::getId)
            .collect(Collectors.toList());

        // 批量查询关联的 email_processing_log（Integer logitrack_id → Long enquiry.id）
        List<Integer> enquiryIdInts = enquiryIds.stream()
            .map(Long::intValue)
            .collect(Collectors.toList());
        Map<Long, EmailProcessingLog> logByEnquiryId = logRepo.findByLogitrackIdIn(enquiryIdInts)
            .stream()
            .collect(Collectors.toMap(
                l -> l.getLogitrackId().longValue(),
                l -> l,
                // 同一 enquiry_id 有多条日志时取最新一条
                (a, b) -> a.getProcessedAt().isAfter(b.getProcessedAt()) ? a : b
            ));

        // --- 批量加载 POL/POD 存在性 ---
        Set<Long> polExistIds = polRepo.findByEnquiryIdIn(enquiryIds).stream()
            .map(EnquiryPol::getEnquiryId).collect(Collectors.toSet());
        Set<Long> podExistIds = podRepo.findByEnquiryIdIn(enquiryIds).stream()
            .map(EnquiryPod::getEnquiryId).collect(Collectors.toSet());

        // --- 批量加载已核验状态 ---
        Set<Long> verifiedIds = verifiedRepo.findVerifiedEnquiryIds(enquiryIds);

        // --- 逐条构建质检结果 ---
        List<QualityCheckResultDTO> results = new ArrayList<>();
        for (Enquiry enquiry : aiEnquiries) {
            Long eid = enquiry.getId();
            EmailProcessingLog logEntry = logByEnquiryId.get(eid); // 可能为 null（_write_mon 失败时）

            List<String> missing = checkMissingFields(
                enquiry,
                polExistIds.contains(eid),
                podExistIds.contains(eid)
            );

            boolean isVerified = verifiedIds.contains(eid);
            DataQualityVerified verifiedRecord = null;
            if (isVerified) {
                verifiedRecord = verifiedRepo.findByEnquiryId(eid).orElse(null);
            }

            QualityCheckResultDTO dto = new QualityCheckResultDTO();
            dto.setEnquiryId(eid);
            dto.setRefNumber(enquiry.getRefNumber());
            dto.setLogId(logEntry != null ? logEntry.getId() : null);
            dto.setEmailSubject(logEntry != null ? logEntry.getSubject() : null);
            dto.setSenderEmail(logEntry != null ? logEntry.getSenderEmail() : null);
            // 日志缺失时降级使用 enquiry 创建时间
            dto.setProcessedAt(logEntry != null ? logEntry.getProcessedAt() : enquiry.getEnquiryCreatedDate());
            dto.setMissingFields(missing);
            dto.setIsComplete(missing.isEmpty());
            dto.setVerified(isVerified);
            dto.setVerifiedBy(verifiedRecord != null ? verifiedRecord.getVerifiedBy() : null);
            dto.setVerifiedAt(verifiedRecord != null ? verifiedRecord.getVerifiedAt() : null);
            dto.setRouteRecipients(logEntry != null ? parseJsonArray(logEntry.getForwardTo()) : List.of());
            dto.setRouteCc(logEntry != null ? parseJsonArray(logEntry.getForwardCc()) : List.of());
            results.add(dto);
        }

        // 已核验的不算入 incomplete
        long incomplete = results.stream()
            .filter(r -> !r.getIsComplete() && !r.getVerified())
            .count();
        saveHistory(scopeDays, results.size(), (int) incomplete, results, null);

        log.info("[DataQuality] Check done: total={}, incomplete={}", results.size(), incomplete);
        return results;
    }

    /**
     * 检查单条询价单的缺失必填字段。
     *
     * @param e            询价单实体
     * @param hasPolRecords 是否有 POL 记录
     * @param hasPodRecords 是否有 POD 记录
     * @return 缺失的字段键名列表（顺序与 FIELD_LABELS 一致）
     */
    private List<String> checkMissingFields(Enquiry e, boolean hasPolRecords, boolean hasPodRecords) {
        List<String> missing = new ArrayList<>();
        // 必填字段（高缺失率优先，与 FIELD_LABELS 顺序对应）
        if (isBlank(e.getCategory()))                                    missing.add("category");
        if (e.getSalesPicId() == null || e.getSalesPicId() <= 0)         missing.add("salesPicId");
        if (!hasPolRecords)                                               missing.add("polExists");
        if (!hasPodRecords)                                               missing.add("podExists");
        if (isBlank(e.getAssignedCnOffice()))                             missing.add("assignedCnOffice");
        if (isBlank(e.getSalesCountryCode()))                             missing.add("salesCountryCode");
        if (isBlank(e.getCargoTypeCode()))                                missing.add("cargoTypeCode");
        if (isBlank(e.getProductCode()))                                  missing.add("productCode");
        if (e.getEnquiryReceivedDate() == null)                          missing.add("enquiryReceivedDate");
        // 扩展字段
        if (isBlank(e.getCommodity()))                                    missing.add("commodity");
        boolean noVolume = (e.getVolumeCbm() == null || e.getVolumeCbm().compareTo(BigDecimal.ZERO) <= 0)
                        && (e.getQuantity()  == null || e.getQuantity().compareTo(BigDecimal.ZERO)   <= 0);
        if (noVolume)                                                      missing.add("volumeQty");
        if (e.getCoreNonCore() == null)                                   missing.add("coreNonCore");
        return missing;
    }

    // ======================================================================
    // 路由分组（邮件分发用）
    // ======================================================================

    /**
     * 按路由收件人分组：每个邮箱地址映射到其需要看的记录列表。
     * 只包含「有缺失且未核验」的记录。
     */
    public Map<String, List<QualityCheckResultDTO>> groupByRouteRecipient(
            List<QualityCheckResultDTO> results) {
        Map<String, List<QualityCheckResultDTO>> grouped = new LinkedHashMap<>();
        for (QualityCheckResultDTO r : results) {
            if (r.getIsComplete() || Boolean.TRUE.equals(r.getVerified())) continue;
            List<String> allRecipients = new ArrayList<>(r.getRouteRecipients());
            allRecipients.addAll(r.getRouteCc());
            for (String email : allRecipients) {
                if (email != null && !email.isBlank()) {
                    grouped.computeIfAbsent(
                        email.trim().toLowerCase(),
                        k -> new ArrayList<>()
                    ).add(r);
                }
            }
        }
        return grouped;
    }

    // ======================================================================
    // 统计数据（热力图 + 趋势图）
    // ======================================================================

    /**
     * 计算各字段缺失次数（热力图数据源）。
     * 已核验的记录不计入统计。
     */
    public Map<String, Integer> computeFieldStats(List<QualityCheckResultDTO> results) {
        Map<String, Integer> stats = new LinkedHashMap<>();
        FIELD_LABELS.keySet().forEach(key -> stats.put(key, 0));
        for (QualityCheckResultDTO r : results) {
            if (Boolean.TRUE.equals(r.getVerified())) continue;
            for (String field : r.getMissingFields()) {
                stats.merge(field, 1, Integer::sum);
            }
        }
        return stats;
    }

    /**
     * 从 data_quality_check_history 获取趋势图数据（最近 N 天）。
     * 每天取最后一次执行结果，返回 [{date, totalChecked, totalIncomplete, completionRate}]。
     */
    public List<Map<String, Object>> getTrendData(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<DataQualityCheckHistory> histories = historyRepo.findSince(since);
        // 按日期聚合：取每日最后一次
        Map<LocalDate, DataQualityCheckHistory> byDay = new LinkedHashMap<>();
        for (DataQualityCheckHistory h : histories) {
            LocalDate date = h.getExecutedAt().toLocalDate();
            byDay.merge(date, h,
                (old, nw) -> nw.getExecutedAt().isAfter(old.getExecutedAt()) ? nw : old);
        }
        return byDay.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(entry -> {
                Map<String, Object> point = new LinkedHashMap<>();
                point.put("date", entry.getKey().toString());
                point.put("totalChecked", entry.getValue().getTotalChecked());
                point.put("totalIncomplete", entry.getValue().getTotalIncomplete());
                point.put("completionRate", entry.getValue().getCompletionRate());
                return point;
            })
            .collect(Collectors.toList());
    }

    /** 获取最近 30 次执行历史（前端历史面板用） */
    public List<DataQualityCheckHistory> getRecentHistory() {
        return historyRepo.findTop30ByOrderByExecutedAtDesc();
    }

    // ======================================================================
    // 已核验标记管理
    // ======================================================================

    /** 标记某询价单已核验（幂等操作） */
    @Transactional
    public void markVerified(Long enquiryId, String verifiedBy) {
        if (!verifiedRepo.existsByEnquiryId(enquiryId)) {
            DataQualityVerified v = new DataQualityVerified();
            v.setEnquiryId(enquiryId);
            v.setVerifiedBy(verifiedBy != null && !verifiedBy.isBlank() ? verifiedBy : "system");
            verifiedRepo.save(v);
            log.info("[DataQuality] Marked verified: enquiryId={}", enquiryId);
        }
    }

    /** 撤销已核验标记 */
    @Transactional
    public void unmarkVerified(Long enquiryId) {
        verifiedRepo.deleteByEnquiryId(enquiryId);
        log.info("[DataQuality] Unmarked verified: enquiryId={}", enquiryId);
    }

    // ======================================================================
    // 历史记录辅助
    // ======================================================================

    /** 将最近一次历史记录标记为已发送报告 */
    @Transactional
    public void updateLatestHistoryReportSent(int globalCount, int routeCount) {
        historyRepo.findTop30ByOrderByExecutedAtDesc().stream()
            .findFirst()
            .ifPresent(h -> {
                h.setReportSent(true);
                h.setGlobalRecipientsCount(globalCount);
                h.setRouteRecipientsCount(routeCount);
                historyRepo.save(h);
            });
    }

    // ======================================================================
    // 私有工具方法
    // ======================================================================

    private void saveHistory(int scopeDays, int total, int incomplete,
                              List<QualityCheckResultDTO> results, String errorMsg) {
        int complete = total - incomplete;
        BigDecimal rate = total > 0
            ? BigDecimal.valueOf(complete * 100.0 / total).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        String fieldStatsJson;
        try { fieldStatsJson = objectMapper.writeValueAsString(computeFieldStats(results)); }
        catch (JsonProcessingException e) { fieldStatsJson = "{}"; }

        DataQualityCheckHistory h = new DataQualityCheckHistory();
        h.setExecutedAt(LocalDateTime.now());
        h.setCheckScopeDays(scopeDays);
        h.setTotalChecked(total);
        h.setTotalComplete(complete);
        h.setTotalIncomplete(incomplete);
        h.setCompletionRate(rate);
        h.setFieldStatsJson(fieldStatsJson);
        h.setReportSent(false);
        h.setGlobalRecipientsCount(0);
        h.setRouteRecipientsCount(0);
        h.setErrorMessage(errorMsg);
        historyRepo.save(h);
    }

    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            // fallback：逗号分隔字符串
            return Arrays.stream(json.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
