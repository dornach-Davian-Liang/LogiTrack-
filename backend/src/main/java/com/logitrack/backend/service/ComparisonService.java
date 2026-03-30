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
     * Compare multiple time periods (months or quarters)
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
        
        // Calculate statistics for each period
        List<PeriodStatsDTO> periodStats = new ArrayList<>();
        
        for (String period : request.getPeriods()) {
            PeriodStatsDTO stats = calculatePeriodStats(
                period, 
                comparisonType, 
                request.getCoreFlags(), 
                request.getCnOffice(),
                request.getProductCodes(),
                request.getCountryIds()
            );
            periodStats.add(stats);
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
    
    /**
     * Calculate statistics for a single period
     */
    private PeriodStatsDTO calculatePeriodStats(String period, String comparisonType, 
                                                 List<String> coreFlags, String cnOffice,
                                                 List<String> productCodes, List<Integer> countryIds) {
        LocalDate startDate;
        LocalDate endDate;
        
        if ("MONTHLY".equalsIgnoreCase(comparisonType)) {
            // Parse month: "2026-01"
            YearMonth yearMonth = YearMonth.parse(period, MONTH_FORMATTER);
            startDate = yearMonth.atDay(1);
            endDate = yearMonth.atEndOfMonth();
        } else {
            // Parse quarter: "2026-Q1"
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
            startDate = LocalDate.of(year, startMonth, 1);
            endDate = startDate.plusMonths(3).minusDays(1);
        }
        
        // Get filtered enquiries for this period
        List<Enquiry> enquiries = getFilteredEnquiries(startDate, endDate, coreFlags, cnOffice, productCodes, countryIds);
        
        int total = enquiries.size();
        int quoted = (int) enquiries.stream()
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Quoted_Pending)
            .count();
        int confirmed = (int) enquiries.stream()
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Secured)
            .count();
        
        double conversionRate = total > 0 ? (double) confirmed / total * 100 : 0.0;
        
        return PeriodStatsDTO.builder()
            .period(period)
            .startDate(startDate.toString())
            .endDate(endDate.toString())
            .totalEnquiries(total)
            .quoted(quoted)
            .confirmed(confirmed)
            .conversionRate(Math.round(conversionRate * 10) / 10.0) // Round to 1 decimal
            .changeFromPrevious(null) // Will be calculated later
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
