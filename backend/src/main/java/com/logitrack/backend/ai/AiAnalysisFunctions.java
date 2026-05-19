package com.logitrack.backend.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logitrack.backend.dto.*;
import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.repository.EnquiryRepository;
import com.logitrack.backend.service.ComparisonService;
import com.logitrack.backend.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * AI 分析函数库 —— 封装所有可供 AI 调用的数据分析工具
 *
 * 设计原则：
 *   - AI 只接收聚合数字，绝不接触原始 commodity / remark / price 等敏感字段
 *   - 所有函数返回 Map<String, Object>，可直接序列化为 JSON 传给 AI
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiAnalysisFunctions {

    private final StatisticsService statisticsService;
    private final ComparisonService comparisonService;
    private final EnquiryRepository enquiryRepository;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    // ==========================================
    // 函数调度入口
    // ==========================================

    /**
     * 根据函数名 + 参数 JSON 动态调用对应分析函数
     *
     * @param functionName AI 返回的工具函数名
     * @param argsJson     AI 返回的参数 JSON
     * @return 分析结果 Map
     */
    public Map<String, Object> call(String functionName, String argsJson) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> args = argsJson != null && !argsJson.isBlank()
                    ? objectMapper.readValue(argsJson, Map.class)
                    : Collections.emptyMap();

            log.info("AI function call: {} with args: {}", functionName, argsJson);

            return switch (functionName) {
                case "get_enquiry_overview"       -> getEnquiryOverview(args);
                case "get_monthly_trend"          -> getMonthlyTrend(args);
                case "get_conversion_rate"        -> getConversionRate(args);
                case "get_cargo_type_breakdown"   -> getCargoTypeBreakdown(args);
                case "get_destination_analysis"   -> getDestinationAnalysis(args);
                case "get_cn_office_performance"  -> getCnOfficePerformance(args);
                case "get_period_comparison"      -> getPeriodComparison(args);
                case "get_product_breakdown"      -> getProductBreakdown(args);
                case "get_core_vs_noncore"        -> getCoreVsNonCore(args);
                case "get_cross_analysis"         -> getCrossAnalysis(args);
                default -> Map.of("error", "Unknown function: " + functionName);
            };
        } catch (Exception e) {
            log.error("Error calling AI function {}: {}", functionName, e.getMessage(), e);
            return Map.of("error", "Function call failed: " + e.getMessage());
        }
    }

    // ==========================================
    // 函数 1：询价总览
    // ==========================================

    /**
     * 获取指定月份的询价总览（总量、已报价、待处理、已订舱、环比变化）
     * 参数：{"month": "2026-02"}  (可选，默认当月)
     */
    private Map<String, Object> getEnquiryOverview(Map<String, Object> args) {
        String month = (String) args.getOrDefault("month", YearMonth.now().format(MONTH_FMT));
        DashboardStatsDTO stats = statisticsService.getDashboardStats(month);
        DashboardOverviewDTO ov = stats.getOverview();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("month", month);
        result.put("totalEnquiries", ov.getTotalEnquiries());
        result.put("quoted", ov.getQuoted());
        result.put("pending", ov.getPending());
        result.put("confirmed", ov.getConfirmed());
        result.put("totalEnquiriesChangePercent", ov.getTotalEnquiriesChange());
        result.put("quotedChangePercent", ov.getQuotedChange());
        result.put("confirmedChangePercent", ov.getConfirmedChange());

        // 计算转化率
        if (ov.getTotalEnquiries() > 0) {
            double convRate = (double) ov.getConfirmed() / ov.getTotalEnquiries() * 100;
            result.put("conversionRate", String.format("%.1f%%", convRate));
        } else {
            result.put("conversionRate", "N/A");
        }
        return result;
    }

    // ==========================================
    // 函数 2：月度趋势
    // ==========================================

    /**
     * 获取最近 N 个月的询价趋势
     * 参数：{"months": 6}  (可选，默认 6)
     */
    private Map<String, Object> getMonthlyTrend(Map<String, Object> args) {
        int months = parseIntArg(args, "months", 6);
        if (months > 24) months = 24;

        YearMonth current = YearMonth.now();

        // 一次查询整个日期范围，在内存中按月分组，避免每月一次 getDashboardStatsWithFilter 调用（N+1）
        LocalDate startDate = current.minusMonths(months - 1).atDay(1);
        LocalDate endDate = current.atEndOfMonth();
        List<com.logitrack.backend.entity.Enquiry> allEnquiries =
                enquiryRepository.findByEnquiryReceivedDateBetween(startDate, endDate);

        Map<java.time.YearMonth, List<com.logitrack.backend.entity.Enquiry>> byMonth = allEnquiries.stream()
                .filter(e -> e.getEnquiryReceivedDate() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        e -> java.time.YearMonth.from(e.getEnquiryReceivedDate())));

        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            String monthStr = ym.format(MONTH_FMT);
            List<com.logitrack.backend.entity.Enquiry> monthEnquiries =
                    byMonth.getOrDefault(ym, Collections.emptyList());

            long total = monthEnquiries.size();
            long quoted = monthEnquiries.stream()
                    .filter(e -> e.getStatus() == com.logitrack.backend.entity.Enquiry.EnquiryStatus.Quoted_Pending)
                    .count();
            long confirmed = monthEnquiries.stream()
                    .filter(e -> e.getStatus() == com.logitrack.backend.entity.Enquiry.EnquiryStatus.Secured)
                    .count();

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", monthStr);
            point.put("totalEnquiries", total);
            point.put("quoted", quoted);
            point.put("confirmed", confirmed);
            point.put("conversionRate", total > 0
                    ? String.format("%.1f", (double) confirmed / total * 100) : "0.0");
            trend.add(point);
        }

        return Map.of("trend", trend, "periodMonths", months);
    }

    // ==========================================
    // 函数 3：转化率分析
    // ==========================================

    /**
     * 分析询价到订舱的转化率
     * 参数：{"startDate":"2026-01-01", "endDate":"2026-03-31", "groupBy":"month|office|cargoType"}
     */
    private Map<String, Object> getConversionRate(Map<String, Object> args) {
        LocalDate start = parseDateArg(args, "startDate", LocalDate.now().withDayOfMonth(1));
        LocalDate end   = parseDateArg(args, "endDate", LocalDate.now());
        String groupBy  = (String) args.getOrDefault("groupBy", "overall");

        DashboardFilterDTO filter = new DashboardFilterDTO();
        filter.setStartDate(start);
        filter.setEndDate(end);
        DashboardStatsDTO stats = statisticsService.getDashboardStatsWithFilter(filter);
        DashboardOverviewDTO ov = stats.getOverview();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("period", start + " ~ " + end);
        result.put("totalEnquiries", ov.getTotalEnquiries());
        result.put("confirmed", ov.getConfirmed());
        result.put("quoted", ov.getQuoted());

        double overallRate = ov.getTotalEnquiries() > 0
                ? (double) ov.getConfirmed() / ov.getTotalEnquiries() * 100 : 0;
        double quoteRate = ov.getTotalEnquiries() > 0
                ? (double) ov.getQuoted() / ov.getTotalEnquiries() * 100 : 0;
        result.put("overallConversionRate", String.format("%.1f%%", overallRate));
        result.put("quoteRate", String.format("%.1f%%", quoteRate));

        // 按 CN Office 分组转化率
        if ("office".equals(groupBy)) {
            List<CNOfficeStatDTO> officeStats = stats.getCnOfficeStats();
            List<Map<String, Object>> officeList = new ArrayList<>();
            if (officeStats != null) {
                for (CNOfficeStatDTO o : officeStats) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("office", o.getOfficeName());
                    row.put("total", o.getTotalEnquiries());
                    row.put("confirmed", o.getConfirmed());
                    row.put("conversionRate", o.getConversionRate());
                    officeList.add(row);
                }
            }
            result.put("byOffice", officeList);
        }

        // 按货运类型分组转化率
        if ("cargoType".equals(groupBy)) {
            result.put("byCargoType", buildCargoTypeConversion(start, end));
        }

        return result;
    }

    // ==========================================
    // 函数 4：货运类型分布
    // ==========================================

    /**
     * 货运类型（FCL/LCL/AIR/RAIL 等）分布统计
     * 参数：{"month": "2026-02"}
     */
    private Map<String, Object> getCargoTypeBreakdown(Map<String, Object> args) {
        String month = (String) args.getOrDefault("month", YearMonth.now().format(MONTH_FMT));
        DashboardStatsDTO stats = statisticsService.getDashboardStats(month);

        List<Map<String, Object>> breakdown = new ArrayList<>();
        if (stats.getCargoTypes() != null) {
            for (LocationStatDTO loc : stats.getCargoTypes()) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("cargoType", loc.getName());
                item.put("count", loc.getCount());
                item.put("percentage", loc.getPercentage() + "%");
                breakdown.add(item);
            }
        }
        return Map.of("month", month, "cargoTypeBreakdown", breakdown,
                "total", stats.getOverview().getTotalEnquiries());
    }

    // ==========================================
    // 函数 5：目的地分析
    // ==========================================

    /**
     * 目的国/地区询价量分析
     * 参数：{"month": "2026-02", "topN": 10}
     */
    private Map<String, Object> getDestinationAnalysis(Map<String, Object> args) {
        String month = (String) args.getOrDefault("month", YearMonth.now().format(MONTH_FMT));
        int topN = parseIntArg(args, "topN", 10);

        DashboardStatsDTO stats = statisticsService.getDashboardStats(month);
        List<LocationStatDTO> countries = stats.getTopCountries();

        List<Map<String, Object>> list = new ArrayList<>();
        if (countries != null) {
            countries.stream().limit(topN).forEach(c -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("country", c.getName());
                item.put("count", c.getCount());
                item.put("percentage", c.getPercentage() + "%");
                list.add(item);
            });
        }
        return Map.of("month", month, "topDestinations", list);
    }

    // ==========================================
    // 函数 6：CN 办公室绩效
    // ==========================================

    /**
     * 各 CN 办公室询价量与转化率对比
     * 参数：{"startDate":"2026-01-01", "endDate":"2026-03-31"}
     */
    private Map<String, Object> getCnOfficePerformance(Map<String, Object> args) {
        LocalDate start = parseDateArg(args, "startDate", LocalDate.now().withDayOfMonth(1));
        LocalDate end   = parseDateArg(args, "endDate", LocalDate.now());

        DashboardFilterDTO filter = new DashboardFilterDTO();
        filter.setStartDate(start);
        filter.setEndDate(end);
        DashboardStatsDTO stats = statisticsService.getDashboardStatsWithFilter(filter);

        List<Map<String, Object>> officeStats = new ArrayList<>();
        if (stats.getCnOfficeStats() != null) {
            for (CNOfficeStatDTO o : stats.getCnOfficeStats()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("office", o.getOfficeName());
                row.put("total", o.getTotalEnquiries());
                row.put("quoted", o.getQuoted());
                row.put("confirmed", o.getConfirmed());
                row.put("rejected", o.getRejected());
                row.put("pending", o.getPending());
                row.put("conversionRate", o.getConversionRate());
                officeStats.add(row);
            }
        }

        return Map.of("period", start + " ~ " + end, "cnOfficePerformance", officeStats);
    }

    // ==========================================
    // 函数 7：多期对比
    // ==========================================

    /**
     * 多个月份/季度的询价量对比
     * 参数：{"periods":["2025-11","2025-12","2026-01","2026-02"], "comparisonType":"MONTHLY"}
     */
    private Map<String, Object> getPeriodComparison(Map<String, Object> args) {
        @SuppressWarnings("unchecked")
        List<String> periods = (List<String>) args.getOrDefault("periods",
                List.of(YearMonth.now().minusMonths(2).format(MONTH_FMT),
                        YearMonth.now().minusMonths(1).format(MONTH_FMT),
                        YearMonth.now().format(MONTH_FMT)));
        String comparisonType = (String) args.getOrDefault("comparisonType", "MONTHLY");

        PeriodComparisonRequestDTO req = new PeriodComparisonRequestDTO();
        req.setPeriods(periods);
        req.setComparisonType(comparisonType);
        ComparisonResultDTO result = comparisonService.comparePeriods(req);

        List<Map<String, Object>> periodList = new ArrayList<>();
        for (PeriodStatsDTO p : result.getPeriodStats()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("period", p.getPeriod());
            row.put("totalEnquiries", p.getTotalEnquiries());
            row.put("quoted", p.getQuoted());
            row.put("confirmed", p.getConfirmed());
            row.put("conversionRate", p.getConversionRate());
            row.put("changeFromPrevious",
                    p.getChangeFromPrevious() != null ? p.getChangeFromPrevious() + "%" : "N/A");
            periodList.add(row);
        }

        return Map.of("comparisonType", comparisonType, "periods", periodList);
    }

    // ==========================================
    // 函数 8：产品类型分布
    // ==========================================

    /**
     * 产品类型（AIR/SEA/SEA-AIR/RAIL 等）分布
     * 参数：{"startDate":"2026-01-01", "endDate":"2026-03-31"}
     */
    private Map<String, Object> getProductBreakdown(Map<String, Object> args) {
        LocalDate start = parseDateArg(args, "startDate", LocalDate.now().withDayOfMonth(1));
        LocalDate end   = parseDateArg(args, "endDate", LocalDate.now());

        List<Enquiry> enquiries = enquiryRepository.findByEnquiryReceivedDateBetween(start, end);
        int total = enquiries.size();

        Map<String, Long> productCounts = enquiries.stream()
                .filter(e -> e.getProductCode() != null && !e.getProductCode().isBlank())
                .collect(Collectors.groupingBy(Enquiry::getProductCode, Collectors.counting()));

        List<Map<String, Object>> breakdown = productCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(entry -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("product", entry.getKey());
                    item.put("count", entry.getValue());
                    item.put("percentage", total > 0
                            ? String.format("%.1f%%", entry.getValue() * 100.0 / total) : "0%");
                    return item;
                })
                .collect(Collectors.toList());

        return Map.of("period", start + " ~ " + end, "total", total, "productBreakdown", breakdown);
    }

    // ==========================================
    // 函数 9：CORE vs NON-CORE 对比
    // ==========================================

    /**
     * CORE 与 NON-CORE 询价对比分析
     * 参数：{"startDate":"2026-01-01", "endDate":"2026-03-31"}
     */
    private Map<String, Object> getCoreVsNonCore(Map<String, Object> args) {
        LocalDate start = parseDateArg(args, "startDate", LocalDate.now().withDayOfMonth(1));
        LocalDate end   = parseDateArg(args, "endDate", LocalDate.now());

        List<Enquiry> all = enquiryRepository.findByEnquiryReceivedDateBetween(start, end);

        long coreTotal     = all.stream().filter(e -> e.getCoreNonCore() == Enquiry.CoreNonCore.Core).count();
        long nonCoreTotal  = all.stream().filter(e -> e.getCoreNonCore() == Enquiry.CoreNonCore.Non_Core).count();
        long coreConfirmed = all.stream()
                .filter(e -> e.getCoreNonCore() == Enquiry.CoreNonCore.Core
                        && e.getStatus() == Enquiry.EnquiryStatus.Secured).count();
        long nonCoreConf   = all.stream()
                .filter(e -> e.getCoreNonCore() == Enquiry.CoreNonCore.Non_Core
                        && e.getStatus() == Enquiry.EnquiryStatus.Secured).count();

        Map<String, Object> core = new LinkedHashMap<>();
        core.put("total", coreTotal);
        core.put("confirmed", coreConfirmed);
        core.put("conversionRate", coreTotal > 0
                ? String.format("%.1f%%", coreConfirmed * 100.0 / coreTotal) : "N/A");

        Map<String, Object> nonCore = new LinkedHashMap<>();
        nonCore.put("total", nonCoreTotal);
        nonCore.put("confirmed", nonCoreConf);
        nonCore.put("conversionRate", nonCoreTotal > 0
                ? String.format("%.1f%%", nonCoreConf * 100.0 / nonCoreTotal) : "N/A");

        return Map.of("period", start + " ~ " + end,
                "totalEnquiries", all.size(),
                "CORE", core, "NON_CORE", nonCore);
    }

    // ==========================================
    // 函数 10：多维度交叉分析
    // ==========================================

    /**
     * 多维度交叉分析：在可选过滤条件下按某一维度分组统计
     *
     * 解决的问题：
     *   C1 - "FCL货物发往欧洲，哪个CN办公室转化率最高？"
     *        → primaryGroup=office, filterCargoType=FCL, filterRegion=EUROPE
     *   C3 - "对比深圳和上海的FCL vs LCL构成"
     *        → primaryGroup=cargoType, filterOffice=SHENZHEN（再调一次 filterOffice=SHANGHAI）
     *        或 primaryGroup=cargoType，先不过滤，看各货运类型内的办公室分布
     *
     * 参数：
     *   primaryGroup     (必填) "office" | "cargoType" | "destination" | "product"
     *   startDate        (可选) 开始日期
     *   endDate          (可选) 结束日期
     *   filterCargoType  (可选) FCL / LCL / AIR / RAIL
     *   filterOffice     (可选) SHENZHEN / SHANGHAI / NINGBO（支持部分匹配）
     *   filterCoreFlag   (可选) CORE / NON_CORE
     *   filterRegion     (可选) EUROPE / NORTH_AMERICA / SOUTHEAST_ASIA 等
     */
    private Map<String, Object> getCrossAnalysis(Map<String, Object> args) {
        LocalDate start = parseDateArg(args, "startDate", LocalDate.now().withDayOfMonth(1));
        LocalDate end   = parseDateArg(args, "endDate",   LocalDate.now());
        String primaryGroup    = parseStringArg(args, "primaryGroup",   "office");
        String filterCargoType = parseStringArg(args, "filterCargoType", null);
        String filterOffice    = parseStringArg(args, "filterOffice",    null);
        String filterCoreFlag  = parseStringArg(args, "filterCoreFlag",  null);
        String filterRegion    = parseStringArg(args, "filterRegion",    null);

        // 加载基础数据
        List<Enquiry> all = enquiryRepository.findByEnquiryReceivedDateBetween(start, end);

        // 过滤链
        Stream<Enquiry> stream = all.stream();

        if (filterCargoType != null) {
            final String type = filterCargoType.toUpperCase();
            stream = stream.filter(e -> type.equalsIgnoreCase(e.getCargoTypeCode()));
        }
        if (filterOffice != null) {
            final String office = filterOffice.toUpperCase();
            stream = stream.filter(e -> e.getAssignedCnOffice() != null
                    && e.getAssignedCnOffice().toUpperCase().contains(office));
        }
        if (filterCoreFlag != null) {
            Enquiry.CoreNonCore cf = "CORE".equalsIgnoreCase(filterCoreFlag)
                    ? Enquiry.CoreNonCore.Core : Enquiry.CoreNonCore.Non_Core;
            stream = stream.filter(e -> cf.equals(e.getCoreNonCore()));
        }
        if (filterRegion != null) {
            Set<String> codes = getRegionCountryCodes(filterRegion);
            if (!codes.isEmpty()) {
                stream = stream.filter(e -> e.getPodCountry() != null
                        && codes.contains(e.getPodCountry().toUpperCase()));
            }
        }

        List<Enquiry> filtered = stream.collect(Collectors.toList());

        // 按主维度分组
        Map<String, List<Enquiry>> grouped;
        switch (primaryGroup.toLowerCase()) {
            case "cargotype", "cargo_type", "cargo" -> grouped = filtered.stream()
                    .filter(e -> e.getCargoTypeCode() != null && !e.getCargoTypeCode().isBlank())
                    .collect(Collectors.groupingBy(e -> e.getCargoTypeCode().toUpperCase()));
            case "destination", "country" -> grouped = filtered.stream()
                    .filter(e -> e.getPodCountry() != null && !e.getPodCountry().isBlank())
                    .collect(Collectors.groupingBy(e -> e.getPodCountry().toUpperCase()));
            case "product" -> grouped = filtered.stream()
                    .filter(e -> e.getProductCode() != null && !e.getProductCode().isBlank())
                    .collect(Collectors.groupingBy(Enquiry::getProductCode));
            default -> // office
                grouped = filtered.stream()
                    .filter(e -> e.getAssignedCnOffice() != null && !e.getAssignedCnOffice().isBlank())
                    .collect(Collectors.groupingBy(e -> e.getAssignedCnOffice().toUpperCase()));
        }

        // 聚合统计（每组：总量、报价数、已确认、转化率）
        List<Map<String, Object>> rows = grouped.entrySet().stream()
                .map(entry -> {
                    List<Enquiry> items = entry.getValue();
                    long confirmed = items.stream()
                            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Secured).count();
                    long quoted = items.stream()
                            .filter(e -> e.getStatus() != Enquiry.EnquiryStatus.New).count();
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("group",          entry.getKey());
                    row.put("total",          items.size());
                    row.put("quoted",         quoted);
                    row.put("confirmed",      confirmed);
                    row.put("conversionRate", items.size() > 0
                            ? String.format("%.1f%%", confirmed * 100.0 / items.size()) : "N/A");
                    return row;
                })
                .sorted((a, b) -> (Integer) b.get("total") - (Integer) a.get("total"))
                .collect(Collectors.toList());

        // 构建结果
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("period",        start + " ~ " + end);
        result.put("primaryGroup",  primaryGroup);
        result.put("totalFiltered", filtered.size());
        result.put("totalAll",      all.size());

        // 已应用的过滤条件（帮助 AI 在回答中说明分析口径）
        List<String> appliedFilters = new ArrayList<>();
        if (filterCargoType != null) appliedFilters.add("cargoType=" + filterCargoType);
        if (filterOffice    != null) appliedFilters.add("office="    + filterOffice);
        if (filterCoreFlag  != null) appliedFilters.add("coreFlag="  + filterCoreFlag);
        if (filterRegion    != null) appliedFilters.add("region="    + filterRegion);
        if (!appliedFilters.isEmpty()) result.put("appliedFilters", appliedFilters);

        result.put("data", rows);
        return result;
    }

    // ==========================================
    // 地区 → 国家代码映射表
    // ==========================================

    private static final Map<String, Set<String>> REGION_COUNTRY_CODES;
    static {
        Map<String, Set<String>> m = new HashMap<>();
        m.put("EUROPE", new HashSet<>(Arrays.asList(
                "AT","BE","BG","CY","CZ","DE","DK","EE","ES","FI","FR","GB","GR",
                "HR","HU","IE","IT","LT","LU","LV","MT","NL","PL","PT","RO","SE",
                "SI","SK","CH","NO","IS","AL","BA","ME","MK","MD","RS","UA","TR","BY")));
        m.put("NORTH_AMERICA", new HashSet<>(Arrays.asList("US","CA","MX")));
        m.put("SOUTHEAST_ASIA", new HashSet<>(Arrays.asList(
                "SG","MY","TH","VN","ID","PH","MM","KH","LA","BN")));
        m.put("SOUTH_ASIA", new HashSet<>(Arrays.asList("IN","PK","LK","BD","NP","MV")));
        m.put("MIDDLE_EAST", new HashSet<>(Arrays.asList(
                "AE","SA","QA","KW","OM","BH","JO","IL","EG","IR","IQ","YE","LB","SY")));
        m.put("EAST_ASIA", new HashSet<>(Arrays.asList("JP","KR","TW","HK","MO")));
        m.put("OCEANIA", new HashSet<>(Arrays.asList("AU","NZ","PG","FJ")));
        m.put("AFRICA", new HashSet<>(Arrays.asList(
                "ZA","NG","KE","GH","ET","TZ","UG","MA","DZ","TN","CI","SN","CM")));
        m.put("LATIN_AMERICA", new HashSet<>(Arrays.asList(
                "BR","AR","CL","CO","PE","EC","VE","BO","PY","UY","CR","PA","DO","GT","HN")));
        REGION_COUNTRY_CODES = Collections.unmodifiableMap(m);
    }

    private Set<String> getRegionCountryCodes(String region) {
        if (region == null) return Collections.emptySet();
        String key = region.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        // 别名标准化
        if ("EU".equals(key) || "EUR".equals(key) || "EUROPE_CONTINENT".equals(key)) key = "EUROPE";
        if ("NA".equals(key) || "NAMERICA".equals(key)) key = "NORTH_AMERICA";
        if ("SEA".equals(key) || "ASEAN".equals(key)) key = "SOUTHEAST_ASIA";
        if ("ME".equals(key))  key = "MIDDLE_EAST";
        if ("LATAM".equals(key) || "SA".equals(key)) key = "LATIN_AMERICA";
        return REGION_COUNTRY_CODES.getOrDefault(key, Collections.emptySet());
    }

    // ==========================================
    // 内部辅助方法
    // ==========================================

    private List<Map<String, Object>> buildCargoTypeConversion(LocalDate start, LocalDate end) {
        List<Enquiry> all = enquiryRepository.findByEnquiryReceivedDateBetween(start, end);
        Map<String, List<Enquiry>> byType = all.stream()
                .filter(e -> e.getCargoTypeCode() != null)
                .collect(Collectors.groupingBy(Enquiry::getCargoTypeCode));

        List<Map<String, Object>> result = new ArrayList<>();
        byType.forEach((type, list) -> {
            long confirmed = list.stream()
                    .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Secured).count();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("cargoType", type);
            row.put("total", list.size());
            row.put("confirmed", confirmed);
            row.put("conversionRate", list.size() > 0
                    ? String.format("%.1f%%", confirmed * 100.0 / list.size()) : "N/A");
            result.add(row);
        });
        result.sort((a, b) -> (int) b.get("total") - (int) a.get("total"));
        return result;
    }

    private int parseIntArg(Map<String, Object> args, String key, int defaultVal) {
        Object v = args.get(key);
        if (v == null) return defaultVal;
        if (v instanceof Number) return ((Number) v).intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return defaultVal; }
    }

    private LocalDate parseDateArg(Map<String, Object> args, String key, LocalDate defaultVal) {
        Object v = args.get(key);
        if (v == null) return defaultVal;
        try { return LocalDate.parse(v.toString()); } catch (Exception e) { return defaultVal; }
    }

    private String parseStringArg(Map<String, Object> args, String key, String defaultVal) {
        Object v = args.get(key);
        if (v == null) return defaultVal;
        String s = v.toString().trim();
        return s.isEmpty() ? defaultVal : s;
    }

    // ==========================================
    // 工具定义 Schema（供 AI Function Calling 使用）
    // ==========================================

    /**
     * 返回完整的 tools JSON 定义（OpenAI Function Calling 格式）
     */
    public static String getToolsSchema() {
        return """
[
  {
    "type": "function",
    "function": {
      "name": "get_enquiry_overview",
      "description": "获取指定月份的询价总览统计，包括总询价量、已报价数、待处理数、已订舱数及环比变化。",
      "parameters": {
        "type": "object",
        "properties": {
          "month": {
            "type": "string",
            "description": "月份，格式 YYYY-MM，如 2026-02。不填则默认当月。"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_monthly_trend",
      "description": "获取最近 N 个月的询价量、报价量、订舱量趋势，用于分析业务增长/下滑趋势。",
      "parameters": {
        "type": "object",
        "properties": {
          "months": {
            "type": "integer",
            "description": "查询最近多少个月，默认 6，最大 24。"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_conversion_rate",
      "description": "分析询价到订舱的转化率，可按整体、CN 办公室或货运类型分组。",
      "parameters": {
        "type": "object",
        "properties": {
          "startDate": {"type": "string", "description": "开始日期 YYYY-MM-DD"},
          "endDate":   {"type": "string", "description": "结束日期 YYYY-MM-DD"},
          "groupBy":   {"type": "string", "enum": ["overall", "office", "cargoType"], "description": "分组维度"}
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_cargo_type_breakdown",
      "description": "获取货运类型分布（FCL/LCL/AIR/RAIL 等）占比统计。",
      "parameters": {
        "type": "object",
        "properties": {
          "month": {"type": "string", "description": "月份 YYYY-MM，默认当月"}
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_destination_analysis",
      "description": "分析询价目的地（国家）排名，了解主要目的市场。",
      "parameters": {
        "type": "object",
        "properties": {
          "month": {"type": "string", "description": "月份 YYYY-MM，默认当月"},
          "topN":  {"type": "integer", "description": "显示前 N 个目的地，默认 10"}
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_cn_office_performance",
      "description": "对比各 CN 办公室（上海、深圳等）的询价量、转化率及订舱情况。",
      "parameters": {
        "type": "object",
        "properties": {
          "startDate": {"type": "string", "description": "开始日期 YYYY-MM-DD"},
          "endDate":   {"type": "string", "description": "结束日期 YYYY-MM-DD"}
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_period_comparison",
      "description": "对比多个月份或季度的询价量变化趋势，适合做 MoM/QoQ 分析。",
      "parameters": {
        "type": "object",
        "properties": {
          "periods": {
            "type": "array",
            "items": {"type": "string"},
            "description": "月份列表如 [\\\"2025-11\\\",\\\"2025-12\\\",\\\"2026-01\\\"] 或季度 2026-Q1"
          },
          "comparisonType": {"type": "string", "enum": ["MONTHLY", "QUARTERLY"]}
        },
        "required": ["periods"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_product_breakdown",
      "description": "分析不同产品类型（AIR/SEA/SEA-AIR/RAIL 等）的询价量占比。",
      "parameters": {
        "type": "object",
        "properties": {
          "startDate": {"type": "string", "description": "开始日期 YYYY-MM-DD"},
          "endDate":   {"type": "string", "description": "结束日期 YYYY-MM-DD"}
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_core_vs_noncore",
      "description": "对比 CORE 与 NON-CORE 询价的数量及转化率差异。",
      "parameters": {
        "type": "object",
        "properties": {
          "startDate": {"type": "string", "description": "开始日期 YYYY-MM-DD"},
          "endDate":   {"type": "string", "description": "结束日期 YYYY-MM-DD"}
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_cross_analysis",
      "description": "多维度交叉分析：在可选过滤条件（货运类型、CN办公室、CORE标识、目的地大区）下，按某一维度分组统计询价量与转化率。适用于复杂问题，如：FCL货物各CN办公室的转化率对比、欧洲目的地各货运类型分布、CORE询价的目的地构成等。",
      "parameters": {
        "type": "object",
        "properties": {
          "primaryGroup": {
            "type": "string",
            "enum": ["office", "cargoType", "destination", "product"],
            "description": "主分组维度：office=按CN办公室分组, cargoType=按货运类型分组, destination=按目的地国家分组, product=按产品类型分组"
          },
          "startDate":       {"type": "string", "description": "开始日期 YYYY-MM-DD，默认当月第一天"},
          "endDate":         {"type": "string", "description": "结束日期 YYYY-MM-DD，默认今天"},
          "filterCargoType": {"type": "string", "description": "过滤货运类型，如 FCL / LCL / AIR / RAIL。不填则包含所有类型"},
          "filterOffice":    {"type": "string", "description": "过滤CN办公室，如 SHENZHEN / SHANGHAI / NINGBO（支持部分匹配）。不填则包含所有办公室"},
          "filterCoreFlag":  {"type": "string", "enum": ["CORE", "NON_CORE"], "description": "按 CORE/NON_CORE 过滤，不填则包含全部"},
          "filterRegion":    {
            "type": "string",
            "enum": ["EUROPE","NORTH_AMERICA","SOUTHEAST_ASIA","SOUTH_ASIA","MIDDLE_EAST","EAST_ASIA","OCEANIA","AFRICA","LATIN_AMERICA"],
            "description": "按目的地大区过滤：EUROPE=欧洲, NORTH_AMERICA=北美, SOUTHEAST_ASIA=东南亚, MIDDLE_EAST=中东, EAST_ASIA=东北亚, OCEANIA=大洋洲"
          }
        },
        "required": ["primaryGroup"]
      }
    }
  }
]
""";
    }
}
