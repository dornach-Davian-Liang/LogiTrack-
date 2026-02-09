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
 * Statistics Service - handles all statistical calculations and reporting
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsService {
    
    private final EnquiryRepository enquiryRepository;
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    
    /**
     * Get dashboard statistics for specified month
     * @param monthStr Format: YYYY-MM, if null uses current month
     * @return Complete dashboard statistics
     */
    public DashboardStatsDTO getDashboardStats(String monthStr) {
        log.info("Fetching dashboard stats for month: {}", monthStr);
        
        // Parse month or use current month
        YearMonth targetMonth = monthStr != null ? 
            YearMonth.parse(monthStr, MONTH_FORMATTER) : 
            YearMonth.now();
        
        // Get current month data
        List<Enquiry> currentMonthEnquiries = getEnquiriesByMonth(targetMonth);
        
        // Get previous month data for comparison
        YearMonth previousMonth = targetMonth.minusMonths(1);
        List<Enquiry> previousMonthEnquiries = getEnquiriesByMonth(previousMonth);
        
        // Build overview statistics
        DashboardOverviewDTO overview = buildOverview(currentMonthEnquiries, previousMonthEnquiries);
        
        // Build status breakdown
        Map<String, StatusBreakdownDTO> statusBreakdown = buildStatusBreakdown(currentMonthEnquiries);
        
        // Build monthly trend (last 12 months)
        List<MonthlyTrendDTO> monthlyTrend = buildMonthlyTrend(targetMonth);
        
        // Build location statistics
        List<LocationStatDTO> topCountries = buildTopCountries(currentMonthEnquiries);
        List<LocationStatDTO> topOrigins = buildTopPorts(currentMonthEnquiries, true);
        List<LocationStatDTO> topDestinations = buildTopPorts(currentMonthEnquiries, false);
        
        // Build cargo type statistics
        List<LocationStatDTO> cargoTypes = buildCargoTypes(currentMonthEnquiries);
        
        return DashboardStatsDTO.builder()
            .overview(overview)
            .statusBreakdown(statusBreakdown)
            .monthlyTrend(monthlyTrend)
            .topCountries(topCountries)
            .topOrigins(topOrigins)
            .topDestinations(topDestinations)
            .cargoTypes(cargoTypes)
            .build();
    }
    
    /**
     * Get enquiries for a specific month
     */
    private List<Enquiry> getEnquiriesByMonth(YearMonth month) {
        LocalDate startDate = month.atDay(1);
        LocalDate endDate = month.atEndOfMonth();
        return enquiryRepository.findByEnquiryReceivedDateBetween(startDate, endDate);
    }
    
    /**
     * Build overview statistics with month-over-month comparison
     */
    private DashboardOverviewDTO buildOverview(List<Enquiry> current, List<Enquiry> previous) {
        int totalCurrent = current.size();
        int totalPrevious = previous.size();
        
        int quotedCurrent = (int) current.stream()
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Quoted)
            .count();
        int quotedPrevious = (int) previous.stream()
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Quoted)
            .count();
        
        int pendingCurrent = (int) current.stream()
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.New)
            .count();
        
        int confirmedCurrent = (int) current.stream()
            .filter(e -> e.getBookingConfirmed() == Enquiry.BookingConfirmed.Yes)
            .count();
        int confirmedPrevious = (int) previous.stream()
            .filter(e -> e.getBookingConfirmed() == Enquiry.BookingConfirmed.Yes)
            .count();
        
        return DashboardOverviewDTO.builder()
            .totalEnquiries(totalCurrent)
            .quoted(quotedCurrent)
            .pending(pendingCurrent)
            .confirmed(confirmedCurrent)
            .totalEnquiriesChange(calculatePercentageChange(totalCurrent, totalPrevious))
            .quotedChange(calculatePercentageChange(quotedCurrent, quotedPrevious))
            .confirmedChange(calculatePercentageChange(confirmedCurrent, confirmedPrevious))
            .build();
    }
    
    /**
     * Build status breakdown statistics
     */
    private Map<String, StatusBreakdownDTO> buildStatusBreakdown(List<Enquiry> enquiries) {
        int total = enquiries.size();
        if (total == 0) {
            return new HashMap<>();
        }
        
        Map<String, Long> statusCounts = enquiries.stream()
            .collect(Collectors.groupingBy(e -> e.getStatus().name(), Collectors.counting()));
        
        Map<String, StatusBreakdownDTO> breakdown = new HashMap<>();
        statusCounts.forEach((status, count) -> {
            String percentage = String.format("%.1f", (count.doubleValue() / total) * 100);
            breakdown.put(status, StatusBreakdownDTO.builder()
                .count(count.intValue())
                .percentage(percentage)
                .build());
        });
        
        return breakdown;
    }
    
    /**
     * Build monthly trend for last N months
     */
    private List<MonthlyTrendDTO> buildMonthlyTrend(YearMonth currentMonth) {
        List<MonthlyTrendDTO> trend = new ArrayList<>();
        
        for (int i = 0; i < 12; i++) {
            YearMonth month = currentMonth.minusMonths(i);
            List<Enquiry> monthData = getEnquiriesByMonth(month);
            int count = monthData.size();
            
            // Calculate change from previous month
            Integer change = null;
            if (i < 11) {
                YearMonth prevMonth = month.minusMonths(1);
                List<Enquiry> prevMonthData = getEnquiriesByMonth(prevMonth);
                int prevCount = prevMonthData.size();
                change = calculatePercentageChange(count, prevCount);
            }
            
            trend.add(MonthlyTrendDTO.builder()
                .month(month.format(MONTH_FORMATTER))
                .count(count)
                .change(change)
                .build());
        }
        
        return trend;
    }
    
    /**
     * Build top countries statistics
     */
    private List<LocationStatDTO> buildTopCountries(List<Enquiry> enquiries) {
        int total = enquiries.size();
        if (total == 0) {
            return new ArrayList<>();
        }
        
        Map<String, Long> countryCounts = enquiries.stream()
            .filter(e -> e.getPodCountryCode() != null && !e.getPodCountryCode().isEmpty())
            .collect(Collectors.groupingBy(Enquiry::getPodCountryCode, Collectors.counting()));
        
        return countryCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(5)
            .map(entry -> LocationStatDTO.builder()
                .name(entry.getKey())
                .count(entry.getValue().intValue())
                .percentage(String.format("%.1f", (entry.getValue().doubleValue() / total) * 100))
                .build())
            .collect(Collectors.toList());
    }
    
    /**
     * Build top ports statistics (POL or POD)
     */
    private List<LocationStatDTO> buildTopPorts(List<Enquiry> enquiries, boolean isOrigin) {
        int total = enquiries.size();
        if (total == 0) {
            return new ArrayList<>();
        }
        
        // Note: This is simplified - in real implementation, you'd need to query enquiry_pol or enquiry_pod tables
        // For now, returning empty list as proper implementation requires join queries
        return new ArrayList<>();
    }
    
    /**
     * Build cargo type statistics
     */
    private List<LocationStatDTO> buildCargoTypes(List<Enquiry> enquiries) {
        int total = enquiries.size();
        if (total == 0) {
            return new ArrayList<>();
        }
        
        Map<String, Long> cargoTypeCounts = enquiries.stream()
            .filter(e -> e.getCargoTypeCode() != null && !e.getCargoTypeCode().isEmpty())
            .collect(Collectors.groupingBy(Enquiry::getCargoTypeCode, Collectors.counting()));
        
        return cargoTypeCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .map(entry -> LocationStatDTO.builder()
                .name(entry.getKey())
                .count(entry.getValue().intValue())
                .percentage(String.format("%.1f", (entry.getValue().doubleValue() / total) * 100))
                .build())
            .collect(Collectors.toList());
    }
    
    /**
     * Calculate percentage change between two values
     */
    private int calculatePercentageChange(int current, int previous) {
        if (previous == 0) {
            return current > 0 ? 100 : 0;
        }
        return (int) Math.round(((double) (current - previous) / previous) * 100);
    }
}
