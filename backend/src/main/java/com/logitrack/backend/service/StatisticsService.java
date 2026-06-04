package com.logitrack.backend.service;

import com.logitrack.backend.dto.*;
import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.entity.EnquiryPol;
import com.logitrack.backend.entity.EnquiryPod;
import com.logitrack.backend.entity.Port;
import com.logitrack.backend.entity.SalesPic;
import com.logitrack.backend.repository.EnquiryRepository;
import com.logitrack.backend.repository.EnquiryPolRepository;
import com.logitrack.backend.repository.EnquiryPodRepository;
import com.logitrack.backend.repository.PortRepository;
import com.logitrack.backend.repository.SalesPicRepository;
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
    private final EnquiryPolRepository enquiryPolRepository;
    private final EnquiryPodRepository enquiryPodRepository;
    private final PortRepository portRepository;
    private final SalesPicRepository salesPicRepository;
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
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Quoted_Pending)
            .count();
        int quotedPrevious = (int) previous.stream()
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Quoted_Pending)
            .count();
        
        int pendingCurrent = (int) current.stream()
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.New)
            .count();
        
        int confirmedCurrent = (int) current.stream()
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Secured)
            .count();
        int confirmedPrevious = (int) previous.stream()
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Secured)
            .count();

        int lostCurrent = (int) current.stream()
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Lost)
            .count();
        int cancelledCurrent = (int) current.stream()
            .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Cancelled)
            .count();
        
        return DashboardOverviewDTO.builder()
            .totalEnquiries(totalCurrent)
            .newEnquiries(pendingCurrent)
            .quotedPending(quotedCurrent)
            .secured(confirmedCurrent)
            .lost(lostCurrent)
            .cancelled(cancelledCurrent)
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
            .collect(Collectors.groupingBy(e -> e.getStatus().toJsonValue(), Collectors.counting()));
        
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
     * Build monthly trend for last 12 months.
     * 一次查询 13 个月数据，在内存中按月分组，避免每月一次 DB 查询（N+1）。
     */
    private List<MonthlyTrendDTO> buildMonthlyTrend(YearMonth currentMonth) {
        // 查询 13 个月范围（12 个月 + 上一个月用于计算环比）
        YearMonth oldestMonth = currentMonth.minusMonths(12);
        LocalDate startDate = oldestMonth.atDay(1);
        LocalDate endDate = currentMonth.atEndOfMonth();
        List<Enquiry> allEnquiries = enquiryRepository.findByEnquiryReceivedDateBetween(startDate, endDate);

        // 按 YearMonth 分组统计数量
        Map<YearMonth, Long> countByMonth = allEnquiries.stream()
            .filter(e -> e.getEnquiryReceivedDate() != null)
            .collect(Collectors.groupingBy(
                e -> YearMonth.from(e.getEnquiryReceivedDate()),
                Collectors.counting()
            ));

        List<MonthlyTrendDTO> trend = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            YearMonth month = currentMonth.minusMonths(i);
            int count = countByMonth.getOrDefault(month, 0L).intValue();

            Integer change = null;
            if (i < 11) {
                int prevCount = countByMonth.getOrDefault(month.minusMonths(1), 0L).intValue();
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
            .filter(e -> e.getPodCountry() != null && !e.getPodCountry().isEmpty())
            .collect(Collectors.groupingBy(Enquiry::getPodCountry, Collectors.counting()));
        
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
        log.info("Fetching filtered dashboard stats: startDate={}, endDate={}, coreFlags={}, cnOffice={}, products={}, countries={}", 
                 filter.getStartDate(), filter.getEndDate(), filter.getCoreFlags(), filter.getCnOffice(),
                 filter.getProducts(), filter.getCountries());
        
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
            filter.getCnOffice(),
            filter.getProducts(),
            filter.getCountries()
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
            filter.getCnOffice(),
            filter.getProducts(),
            filter.getCountries()
        );
        
        // Build overview statistics
        DashboardOverviewDTO overview = buildOverview(currentEnquiries, previousEnquiries);
        
        // Build status breakdown
        Map<String, StatusBreakdownDTO> statusBreakdown = buildStatusBreakdown(currentEnquiries);
        
        // Build monthly trend for the selected date range（直接用已有数据，避免重复查询）
        List<MonthlyTrendDTO> monthlyTrend = buildFilteredMonthlyTrendFromData(
            filter.getStartDate(),
            filter.getEndDate(),
            currentEnquiries
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
                                                List<String> coreFlags, String cnOffice,
                                                List<String> products, List<String> countries) {
        // Get all enquiries in date range
        List<Enquiry> enquiries = enquiryRepository.findByEnquiryReceivedDateBetween(startDate, endDate);
        
        // Apply core flag filter
        if (coreFlags != null && !coreFlags.isEmpty()) {
            enquiries = enquiries.stream()
                .filter(e -> e.getCoreNonCore() != null && coreFlags.contains(e.getCoreNonCore().name()))
                .collect(Collectors.toList());
        }
        
        // Apply CN office filter
        if (cnOffice != null && !cnOffice.isEmpty()) {
            enquiries = enquiries.stream()
                .filter(e -> cnOffice.equals(e.getAssignedCnOffice()))
                .collect(Collectors.toList());
        }

        // Apply product filter
        if (products != null && !products.isEmpty()) {
            enquiries = enquiries.stream()
                .filter(e -> e.getProductCode() != null && products.contains(e.getProductCode()))
                .collect(Collectors.toList());
        }

        // Apply country filter
        if (countries != null && !countries.isEmpty()) {
            enquiries = enquiries.stream()
                .filter(e -> e.getSalesCountryCode() != null && countries.contains(e.getSalesCountryCode()))
                .collect(Collectors.toList());
        }
        
        return enquiries;
    }
    
    /**
     * Build monthly trend from already-fetched enquiry data (no DB query).
     */
    private List<MonthlyTrendDTO> buildFilteredMonthlyTrendFromData(LocalDate startDate, LocalDate endDate,
                                                                      List<Enquiry> allEnquiries) {
        Map<String, List<Enquiry>> byMonth = allEnquiries.stream()
                .filter(e -> e.getEnquiryReceivedDate() != null)
                .collect(Collectors.groupingBy(
                        e -> YearMonth.from(e.getEnquiryReceivedDate()).format(MONTH_FORMATTER)
                ));

        List<MonthlyTrendDTO> trend = new ArrayList<>();
        YearMonth currentMonth = YearMonth.from(startDate);
        YearMonth endMonth = YearMonth.from(endDate);

        while (!currentMonth.isAfter(endMonth)) {
            String key = currentMonth.format(MONTH_FORMATTER);
            List<Enquiry> monthEnquiries = byMonth.getOrDefault(key, java.util.Collections.emptyList());

            int quoted = (int) monthEnquiries.stream()
                    .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Quoted_Pending)
                    .count();

            int confirmed = (int) monthEnquiries.stream()
                    .filter(e -> e.getStatus() == Enquiry.EnquiryStatus.Secured)
                    .count();

            trend.add(MonthlyTrendDTO.builder()
                    .month(key)
                    .totalEnquiries(monthEnquiries.size())
                    .quoted(quoted)
                    .confirmed(confirmed)
                    .build());

            currentMonth = currentMonth.plusMonths(1);
        }

        return trend;
    }

    /**
     * Build monthly trend for filtered date range.
     * 一次性查询整个日期范围，然后在内存中按月分组，避免 N+1（每月一次 DB 查询）。
     */
    private List<MonthlyTrendDTO> buildFilteredMonthlyTrend(LocalDate startDate, LocalDate endDate,
                                                             List<String> coreFlags, String cnOffice,
                                                             List<String> products, List<String> countries) {
        List<Enquiry> allEnquiries = getFilteredEnquiries(startDate, endDate, coreFlags, cnOffice, products, countries);
        return buildFilteredMonthlyTrendFromData(startDate, endDate, allEnquiries);
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
            String office = e.getAssignedCnOffice();
            if (office == null || office.isEmpty()) {
                office = "Unassigned";
            }
            
            OfficeStats stats = officeMap.computeIfAbsent(office, k -> new OfficeStats());
            stats.total++;
            
            Enquiry.EnquiryStatus st = e.getStatus();
            if (st == Enquiry.EnquiryStatus.Quoted_Pending) {
                stats.quoted++;
                stats.pending++;
            } else if (st == Enquiry.EnquiryStatus.Secured) {
                stats.confirmed++;
                stats.yes++;
            } else if (st == Enquiry.EnquiryStatus.Lost) {
                stats.rejected++;
            } else if (st == Enquiry.EnquiryStatus.Cancelled) {
                stats.invalid++;
            } else {
                stats.pending++;
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
     * Get enquiries for a specific CN office and booking status (for modal drill-down)
     * 用于增强报表弹窗：按办公室 + 预订状态精确查询，避免前端分页截断问题
     *
     * @param officeName     CN Office 代码 (如 SHENZHEN)
     * @param bookingStatus  预订状态字符串：Yes / Rejected / Invalid / Pending
     * @param filter         日期范围及其他过滤条件
     * @return 匹配的询价列表（简化字段）
     */
    public List<Map<String, Object>> getOfficeEnquiries(String officeName,
                                                         String bookingStatus,
                                                         DashboardFilterDTO filter) {
        log.info("getOfficeEnquiries: office={}, status={}, start={}, end={}",
                officeName, bookingStatus, filter.getStartDate(), filter.getEndDate());

        // 1. 先按日期范围 + 其他条件过滤
        List<Enquiry> enquiries = getFilteredEnquiries(
                filter.getStartDate(),
                filter.getEndDate(),
                filter.getCoreFlags(),
                null,          // cnOffice 不在此过滤，下面单独处理
                filter.getProducts(),
                filter.getCountries()
        );

        // 2. 按 CN Office 过滤
        enquiries = enquiries.stream()
                .filter(e -> officeName.equals(e.getAssignedCnOffice()))
                .collect(Collectors.toList());

        // 3. 按 status 过滤 (v3: bookingStatus maps to EnquiryStatus)
        enquiries = enquiries.stream()
                .filter(e -> {
                    Enquiry.EnquiryStatus st = e.getStatus();
                    if ("Pending".equalsIgnoreCase(bookingStatus)) {
                        return st == Enquiry.EnquiryStatus.New || st == Enquiry.EnquiryStatus.Quoted_Pending;
                    } else if ("Yes".equalsIgnoreCase(bookingStatus) || "Secured".equalsIgnoreCase(bookingStatus)) {
                        return st == Enquiry.EnquiryStatus.Secured;
                    } else if ("Rejected".equalsIgnoreCase(bookingStatus) || "Lost".equalsIgnoreCase(bookingStatus)) {
                        return st == Enquiry.EnquiryStatus.Lost;
                    } else if ("Invalid".equalsIgnoreCase(bookingStatus) || "Cancelled".equalsIgnoreCase(bookingStatus)) {
                        return st == Enquiry.EnquiryStatus.Cancelled;
                    }
                    return false;
                })
                .collect(Collectors.toList());

        // 4. 转换为前端兼容格式（批量预加载，避免 N+1 查询）
        List<Long> enquiryIds = enquiries.stream().map(Enquiry::getId).collect(Collectors.toList());

        // 批量加载 salesPic 名称
        Set<Integer> picIds = enquiries.stream()
                .filter(e -> e.getSalesPicId() != null)
                .map(Enquiry::getSalesPicId)
                .collect(Collectors.toSet());
        Map<Integer, String> picNameMap = picIds.isEmpty() ? Collections.emptyMap() :
                salesPicRepository.findAllById(picIds).stream()
                        .collect(Collectors.toMap(SalesPic::getId, SalesPic::getName));

        // 批量加载 POL（每个询价取第一条）
        Map<Long, Integer> firstPolPortIdMap = enquiryPolRepository.findByEnquiryIdIn(enquiryIds).stream()
                .collect(Collectors.toMap(
                        EnquiryPol::getEnquiryId,
                        EnquiryPol::getPortId,
                        (a, b) -> a  // 保留第一条
                ));
        // 批量加载 POD（每个询价取第一条）
        Map<Long, Integer> firstPodPortIdMap = enquiryPodRepository.findByEnquiryIdIn(enquiryIds).stream()
                .collect(Collectors.toMap(
                        EnquiryPod::getEnquiryId,
                        EnquiryPod::getPortId,
                        (a, b) -> a  // 保留第一条
                ));

        // 批量加载港口显示名称
        Set<Integer> allPortIds = new HashSet<>(firstPolPortIdMap.values());
        allPortIds.addAll(firstPodPortIdMap.values());
        Map<Integer, String> portDisplayMap = allPortIds.isEmpty() ? Collections.emptyMap() :
                portRepository.findAllById(allPortIds).stream()
                        .collect(Collectors.toMap(Port::getId,
                                p -> p.getPortCode() + " - " + p.getPortName()));

        return enquiries.stream().map(e -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", e.getId());
            item.put("refNumber", e.getRefNumber());
            item.put("enquiryReceivedDate",
                    e.getEnquiryReceivedDate() != null ? e.getEnquiryReceivedDate().toString() : null);
            item.put("enquiryCreatedDate",
                    e.getEnquiryCreatedDate() != null ? e.getEnquiryCreatedDate().toString() : null);
            item.put("status", e.getStatus() != null ? e.getStatus().toJsonValue() : null);
            item.put("productCode", e.getProductCode());
            item.put("productAbbr", e.getProductAbbr());
            item.put("salesCountryCode", e.getSalesCountryCode());
            item.put("cargoTypeCode", e.getCargoTypeCode());
            item.put("commodity", e.getCommodity());
            item.put("assignedCnOffice", e.getAssignedCnOffice());

            // Sales PIC name（从预加载 map 取）
            String picName = picNameMap.get(e.getSalesPicId());
            if (picName != null) item.put("salesPicName", picName);

            // POL name（从预加载 map 取）
            Integer polPortId = firstPolPortIdMap.get(e.getId());
            if (polPortId != null) {
                String polDisplay = portDisplayMap.get(polPortId);
                if (polDisplay != null) item.put("polName", polDisplay);
            }

            // POD name（从预加载 map 取）
            Integer podPortId = firstPodPortIdMap.get(e.getId());
            if (podPortId != null) {
                String podDisplay = portDisplayMap.get(podPortId);
                if (podDisplay != null) item.put("podName", podDisplay);
            }

            return item;
        }).collect(Collectors.toList());
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
