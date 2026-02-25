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
     * Get dashboard statistics with advanced filtering
     * Supports date range, core flag, and CN office filtering
     * 
     * @param filter Dashboard filter parameters
     * @return Complete dashboard statistics filtered by parameters
     */
    public DashboardStatsDTO getDashboardStatsWithFilter(DashboardFilterDTO filter) {
        log.info("Fetching filtered dashboard stats: startDate={}, endDate={}, coreFlags={}, cnOffice={}", 
                 filter.getStartDate(), filter.getEndDate(), filter.getCoreFlags(), filter.getCnOffice());
        
        // Validate date range
        if (filter.getStartDate() == null || filter.getEndDate() == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }
        
        if (filter.getStartDate().isAfter(filter.getEndDate())) {
            throw new IllegalArgumentException("Start date must be before or equal to end date");
        }
        
        // Get filtered enquiries for current period
        List<Enquiry> currentEnquiries = getFilteredEnquiries(
            filter.getStartDate(), 
            filter.getEndDate(), 
            filter.getCoreFlags(), 
            filter.getCnOffice()
        );
        
        // Calculate previous period dates for comparison
        long daysBetween = filter.getEndDate().toEpochDay() - filter.getStartDate().toEpochDay() + 1;
        LocalDate previousEndDate = filter.getStartDate().minusDays(1);
        LocalDate previousStartDate = previousEndDate.minusDays(daysBetween - 1);
        
        // Get previous period data
        List<Enquiry> previousEnquiries = getFilteredEnquiries(
            previousStartDate, 
            previousEndDate, 
            filter.getCoreFlags(), 
            filter.getCnOffice()
        );
        
        // Build overview statistics
        DashboardOverviewDTO overview = buildOverview(currentEnquiries, previousEnquiries);
        
        // Build status breakdown
        Map<String, StatusBreakdownDTO> statusBreakdown = buildStatusBreakdown(currentEnquiries);
        
        // Build monthly trend for the selected date range
        List<MonthlyTrendDTO> monthlyTrend = buildFilteredMonthlyTrend(
            filter.getStartDate(), 
            filter.getEndDate(), 
            filter.getCoreFlags(), 
            filter.getCnOffice()
        );
        
        // Build location statistics
        List<LocationStatDTO> topCountries = buildTopCountries(currentEnquiries);
        List<LocationStatDTO> topOrigins = buildTopPorts(currentEnquiries, true);
        List<LocationStatDTO> topDestinations = buildTopPorts(currentEnquiries, false);
        
        // Build cargo type statistics
        List<LocationStatDTO> cargoTypes = buildCargoTypes(currentEnquiries);
        
        // Build CN Office breakdown (new feature)
        List<CNOfficeStatDTO> cnOfficeStats = buildCNOfficeStats(currentEnquiries);
        
        return DashboardStatsDTO.builder()
            .overview(overview)
            .statusBreakdown(statusBreakdown)
            .monthlyTrend(monthlyTrend)
            .topCountries(topCountries)
            .topOrigins(topOrigins)
            .topDestinations(topDestinations)
            .cargoTypes(cargoTypes)
            .cnOfficeStats(cnOfficeStats)
            .build();
    }
    
    /**
     * Get filtered enquiries based on all filter criteria
     */
    private List<Enquiry> getFilteredEnquiries(LocalDate startDate, LocalDate endDate, 
                                                List<String> coreFlags, String cnOffice) {
        // Get all enquiries in date range
        List<Enquiry> enquiries = enquiryRepository.findByEnquiryReceivedDateBetween(startDate, endDate);
        
        // Apply core flag filter
        if (coreFlags != null && !coreFlags.isEmpty()) {
            enquiries = enquiries.stream()
                .filter(e -> e.getCoreFlag() != null && coreFlags.contains(e.getCoreFlag().name()))
                .collect(Collectors.toList());
        }
        
        // Apply CN office filter
        if (cnOffice != null && !cnOffice.isEmpty()) {
            enquiries = enquiries.stream()
                .filter(e -> cnOffice.equals(e.getAssignedCnOfficeCode()))
                .collect(Collectors.toList());
        }
        
        return enquiries;
    }
    
    /**
     * Build monthly trend for filtered date range
     */
    private List<MonthlyTrendDTO> buildFilteredMonthlyTrend(LocalDate startDate, LocalDate endDate,
                                                             List<String> coreFlags, String cnOffice) {
        List<MonthlyTrendDTO> trend = new ArrayList<>();
        
        YearMonth currentMonth = YearMonth.from(startDate);
        YearMonth endMonth = YearMonth.from(endDate);
        
        while (!currentMonth.isAfter(endMonth)) {
            LocalDate monthStart = currentMonth.atDay(1);
            LocalDate monthEnd = currentMonth.atEndOfMonth();
            
            // Adjust to filter boundaries
            if (monthStart.isBefore(startDate)) monthStart = startDate;
            if (monthEnd.isAfter(endDate)) monthEnd = endDate;
            
            List<Enquiry> monthEnquiries = getFilteredEnquiries(monthStart, monthEnd, coreFlags, cnOffice);
            
            int quoted = (int) monthEnquiries.stream()
                .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Quoted)
                .count();
            
            int confirmed = (int) monthEnquiries.stream()
                .filter(e -> e.getBookingConfirmed() == Enquiry.BookingConfirmed.Yes)
                .count();
            
            trend.add(MonthlyTrendDTO.builder()
                .month(currentMonth.format(MONTH_FORMATTER))
                .totalEnquiries(monthEnquiries.size())
                .quoted(quoted)
                .confirmed(confirmed)
                .build());
            
            currentMonth = currentMonth.plusMonths(1);
        }
        
        return trend;
    }
    
    /**
     * Build CN Office statistics grouping
     */
    private List<CNOfficeStatDTO> buildCNOfficeStats(List<Enquiry> enquiries) {
        // Use a simple class to accumulate stats
        class OfficeStats {
            int total = 0;
            int quoted = 0;
            int confirmed = 0;
            int yes = 0;
            int rejected = 0;
            int invalid = 0;
            int pending = 0;
        }
        
        Map<String, OfficeStats> officeMap = new HashMap<>();
        
        for (Enquiry e : enquiries) {
            String office = e.getAssignedCnOfficeCode();
            if (office == null || office.isEmpty()) {
                office = "Unassigned";
            }
            
            OfficeStats stats = officeMap.computeIfAbsent(office, k -> new OfficeStats());
            stats.total++;
            
            if (e.getStatus() == Enquiry.EnquiryStatus.Quoted) {
                stats.quoted++;
            }
            
            Enquiry.BookingConfirmed bookingConfirmed = e.getBookingConfirmed();
            if (bookingConfirmed == null) {
                stats.pending++;
            } else {
                switch (bookingConfirmed) {
                    case Yes:
                        stats.confirmed++;
                        stats.yes++;
                        break;
                    case Rejected:
                        stats.rejected++;
                        break;
                    case Invalid:
                        stats.invalid++;
                        break;
                    case Pending:
                    default:
                        stats.pending++;
                        break;
                }
            }
        }
        
        // Convert to DTO list with conversion rates
        return officeMap.entrySet().stream()
            .map(entry -> {
                OfficeStats stats = entry.getValue();
                double conversionRate = stats.total > 0 
                    ? (double) stats.confirmed / stats.total * 100 
                    : 0.0;
                return CNOfficeStatDTO.builder()
                    .officeName(entry.getKey())
                    .totalEnquiries(stats.total)
                    .quoted(stats.quoted)
                    .confirmed(stats.confirmed)
                    .yes(stats.yes)
                    .rejected(stats.rejected)
                    .invalid(stats.invalid)
                    .pending(stats.pending)
                    .conversionRate(String.format("%.1f%%", conversionRate))
                    .build();
            })
            .sorted((a, b) -> b.getTotalEnquiries() - a.getTotalEnquiries())
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
