package com.logitrack.backend.service;

import com.logitrack.backend.dto.*;
import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.repository.EnquiryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Comparison Service - handles period-to-period comparisons
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComparisonService {
    
    private final EnquiryRepository enquiryRepository;
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    
    /**
     * Compare multiple time periods (months or quarters).
     * 一次查询覆盖所有 period 的日期范围，然后在内存中按 period 分组，避免 N+1。
     */
    public ComparisonResultDTO comparePeriods(PeriodComparisonRequestDTO request) {
        log.info("Comparing periods: type={}, periods={}", request.getComparisonType(), request.getPeriods());
        
        if (request.getPeriods() == null || request.getPeriods().isEmpty()) {
            throw new IllegalArgumentException("At least one period must be specified");
        }
        
        String comparisonType = request.getComparisonType();
        if (!"MONTHLY".equalsIgnoreCase(comparisonType) && !"QUARTERLY".equalsIgnoreCase(comparisonType)) {
            throw new IllegalArgumentException("Comparison type must be MONTHLY or QUARTERLY");
        }
        
        // 1. 先解析所有 period 的起止日期
        List<LocalDate[]> dateRanges = new ArrayList<>();
        for (String period : request.getPeriods()) {
            LocalDate[] range = parsePeriodDateRange(period, comparisonType);
            dateRanges.add(range);
        }
        
        // 2. 计算全局起止日期，一次性查询
        LocalDate globalStart = dateRanges.stream().map(r -> r[0]).min(LocalDate::compareTo).get();
        LocalDate globalEnd   = dateRanges.stream().map(r -> r[1]).max(LocalDate::compareTo).get();
        List<Enquiry> allEnquiries = getFilteredEnquiries(globalStart, globalEnd,
                request.getCoreFlags(), request.getCnOffice(),
                request.getProductCodes(), request.getCountryIds());
        
        // 3. 内存按 period 分组计算
        List<PeriodStatsDTO> periodStats = new ArrayList<>();
        for (int i = 0; i < request.getPeriods().size(); i++) {
            String period = request.getPeriods().get(i);
            LocalDate start = dateRanges.get(i)[0];
            LocalDate end   = dateRanges.get(i)[1];
            List<Enquiry> periodEnquiries = allEnquiries.stream()
                    .filter(e -> e.getEnquiryReceivedDate() != null
                            && !e.getEnquiryReceivedDate().isBefore(start)
                            && !e.getEnquiryReceivedDate().isAfter(end))
                    .collect(Collectors.toList());
            periodStats.add(buildPeriodStats(period, start, end, periodEnquiries));
        }
        
        // Calculate change from previous period
        for (int i = 1; i < periodStats.size(); i++) {
            PeriodStatsDTO current = periodStats.get(i);
            PeriodStatsDTO previous = periodStats.get(i - 1);
            int change = calculatePercentageChange(
                current.getTotalEnquiries(), 
                previous.getTotalEnquiries()
            );
            current.setChangeFromPrevious(change);
        }
        
        // Build summary
        ComparisonResultDTO.ComparisonSummaryDTO summary = buildSummary(periodStats);
        
        // Build trend data for charting
        Map<String, List<Integer>> trendData = buildTrendData(periodStats);
        
        return ComparisonResultDTO.builder()
            .comparisonType(comparisonType)
            .periodStats(periodStats)
            .summary(summary)
            .trendData(trendData)
            .build();
    }
    
    /** 解析 period 字符串为起止日期 */
    private LocalDate[] parsePeriodDateRange(String period, String comparisonType) {
        if ("MONTHLY".equalsIgnoreCase(comparisonType)) {
            YearMonth yearMonth = YearMonth.parse(period, MONTH_FORMATTER);
            return new LocalDate[]{yearMonth.atDay(1), yearMonth.atEndOfMonth()};
        } else {
            String[] parts = period.split("-Q");
            if (parts.length != 2) {
                throw new IllegalArgumentException("Invalid quarter format: " + period + ". Expected format: YYYY-Q#");
            }
            int year = Integer.parseInt(parts[0]);
            int quarter = Integer.parseInt(parts[1]);
            if (quarter < 1 || quarter > 4) {
                throw new IllegalArgumentException("Quarter must be between 1 and 4");
            }
            int startMonth = (quarter - 1) * 3 + 1;
            LocalDate startDate = LocalDate.of(year, startMonth, 1);
            return new LocalDate[]{startDate, startDate.plusMonths(3).minusDays(1)};
        }
    }

    /** 根据已过滤的 enquiry 列表构建单个 period 统计 */
    private PeriodStatsDTO buildPeriodStats(String period, LocalDate startDate, LocalDate endDate,
                                             List<Enquiry> enquiries) {
        int total = enquiries.size();
        int quoted = (int) enquiries.stream()
                .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Quoted_Pending).count();
        int confirmed = (int) enquiries.stream()
                .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Secured).count();
        double conversionRate = total > 0 ? (double) confirmed / total * 100 : 0.0;
        return PeriodStatsDTO.builder()
                .period(period)
                .startDate(startDate.toString())
                .endDate(endDate.toString())
                .totalEnquiries(total)
                .quoted(quoted)
                .confirmed(confirmed)
                .conversionRate(Math.round(conversionRate * 10) / 10.0)
                .changeFromPrevious(null)
                .build();
    }
    
    /**
     * Get filtered enquiries (same logic as StatisticsService)
     */
    private List<Enquiry> getFilteredEnquiries(LocalDate startDate, LocalDate endDate, 
                                                List<String> coreFlags, String cnOffice,
                                                List<String> productCodes, List<Integer> countryIds) {
        List<Enquiry> enquiries = enquiryRepository.findByEnquiryReceivedDateBetween(startDate, endDate);
        
        if (coreFlags != null && !coreFlags.isEmpty()) {
            enquiries = enquiries.stream()
                .filter(e -> e.getCoreNonCore() != null && coreFlags.contains(e.getCoreNonCore().name()))
                .collect(Collectors.toList());
        }
        
        if (cnOffice != null && !cnOffice.isEmpty()) {
            enquiries = enquiries.stream()
                .filter(e -> cnOffice.equals(e.getAssignedCnOffice()))
                .collect(Collectors.toList());
        }
        
        if (productCodes != null && !productCodes.isEmpty()) {
            enquiries = enquiries.stream()
                .filter(e -> e.getProductCode() != null && productCodes.contains(e.getProductCode()))
                .collect(Collectors.toList());
        }
        
        return enquiries;
    }
    
    /**
     * Build summary statistics
     */
    private ComparisonResultDTO.ComparisonSummaryDTO buildSummary(List<PeriodStatsDTO> periodStats) {
        int grandTotal = periodStats.stream()
            .mapToInt(PeriodStatsDTO::getTotalEnquiries)
            .sum();
        
        int totalQuoted = periodStats.stream()
            .mapToInt(PeriodStatsDTO::getQuoted)
            .sum();
        
        int totalConfirmed = periodStats.stream()
            .mapToInt(PeriodStatsDTO::getConfirmed)
            .sum();
        
        double avgConversionRate = periodStats.stream()
            .mapToDouble(PeriodStatsDTO::getConversionRate)
            .average()
            .orElse(0.0);
        
        // Find best and worst periods by total enquiries
        PeriodStatsDTO best = periodStats.stream()
            .max(Comparator.comparingInt(PeriodStatsDTO::getTotalEnquiries))
            .orElse(null);
        
        PeriodStatsDTO worst = periodStats.stream()
            .min(Comparator.comparingInt(PeriodStatsDTO::getTotalEnquiries))
            .orElse(null);
        
        return ComparisonResultDTO.ComparisonSummaryDTO.builder()
            .grandTotal(grandTotal)
            .totalQuoted(totalQuoted)
            .totalConfirmed(totalConfirmed)
            .avgConversionRate(Math.round(avgConversionRate * 10) / 10.0)
            .bestPeriod(best != null ? best.getPeriod() : null)
            .worstPeriod(worst != null ? worst.getPeriod() : null)
            .build();
    }
    
    /**
     * Build trend data for charting
     */
    private Map<String, List<Integer>> buildTrendData(List<PeriodStatsDTO> periodStats) {
        Map<String, List<Integer>> trendData = new HashMap<>();
        
        List<Integer> totalEnquiries = periodStats.stream()
            .map(PeriodStatsDTO::getTotalEnquiries)
            .collect(Collectors.toList());
        
        List<Integer> quoted = periodStats.stream()
            .map(PeriodStatsDTO::getQuoted)
            .collect(Collectors.toList());
        
        List<Integer> confirmed = periodStats.stream()
            .map(PeriodStatsDTO::getConfirmed)
            .collect(Collectors.toList());
        
        trendData.put("totalEnquiries", totalEnquiries);
        trendData.put("quoted", quoted);
        trendData.put("confirmed", confirmed);
        
        return trendData;
    }
    
    /**
     * Calculate percentage change
     */
    private int calculatePercentageChange(int current, int previous) {
        if (previous == 0) {
            return current > 0 ? 100 : 0;
        }
        return (int) Math.round(((double) (current - previous) / previous) * 100);
    }
}
