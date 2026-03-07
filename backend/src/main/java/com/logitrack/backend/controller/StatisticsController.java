package com.logitrack.backend.controller;

import com.logitrack.backend.dto.*;
import com.logitrack.backend.service.ComparisonService;
import com.logitrack.backend.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Statistics Controller - handles all reporting and statistics endpoints
 */
@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@Slf4j
public class StatisticsController {
    
    private final StatisticsService statisticsService;
    private final ComparisonService comparisonService;
    
    /**
     * GET /api/statistics/dashboard - Get dashboard statistics
     * @param month Optional month parameter in format YYYY-MM
     * @return Dashboard statistics including overview, status breakdown, trends, etc.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(
            @RequestParam(required = false) String month) {
        
        log.info("GET /api/statistics/dashboard - month={}", month);
        
        try {
            DashboardStatsDTO stats = statisticsService.getDashboardStats(month);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching dashboard statistics", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * GET /api/statistics/dashboard/filtered - Get filtered dashboard statistics
     * Supports date range, core flag, and CN office filtering
     * 
     * @param startDate Start date (YYYY-MM-DD)
     * @param endDate End date (YYYY-MM-DD)
     * @param coreFlags Optional list of core flags (comma-separated: CORE,NON CORE)
     * @param cnOffice Optional CN office filter
     * @param products Optional list of product codes (AIR,SEA,SEA-AIR,RAIL,RAIL-SEA)
     * @param countries Optional list of country codes (FR,UK,DE,...)
     * @return Filtered dashboard statistics
     */
    @GetMapping("/dashboard/filtered")
    public ResponseEntity<?> getFilteredDashboardStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<String> coreFlags,
            @RequestParam(required = false) String cnOffice,
            @RequestParam(required = false) List<String> products,
            @RequestParam(required = false) List<String> countries) {
        
        log.info("GET /api/statistics/dashboard/filtered - startDate={}, endDate={}, coreFlags={}, cnOffice={}, products={}, countries={}", 
                 startDate, endDate, coreFlags, cnOffice, products, countries);
        
        try {
            DashboardFilterDTO filter = DashboardFilterDTO.builder()
                .startDate(startDate)
                .endDate(endDate)
                .coreFlags(coreFlags)
                .cnOffice(cnOffice)
                .products(products)
                .countries(countries)
                .build();
            
            DashboardStatsDTO stats = statisticsService.getDashboardStatsWithFilter(filter);
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid filter parameters: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Invalid parameters",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error fetching filtered dashboard statistics", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Internal server error",
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * GET /api/statistics/office-enquiries - 获取特定办公室 + 预订状态的询价列表（用于增强报表弹窗钻取）
     * 解决前端 pageSize=1000 截断导致数据不全以及 Invalid=0 的问题
     *
     * @param officeName    CN Office 代码 (如 SHENZHEN)
     * @param bookingStatus 预订状态：Yes / Rejected / Invalid / Pending
     * @param startDate     开始日期 (YYYY-MM-DD, 必填)
     * @param endDate       结束日期 (YYYY-MM-DD, 必填)
     * @param coreFlags     可选核心标记列表
     * @param products      可选产品列表
     * @param countries     可选国家列表
     */
    @GetMapping("/office-enquiries")
    public ResponseEntity<?> getOfficeEnquiries(
            @RequestParam String officeName,
            @RequestParam String bookingStatus,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<String> coreFlags,
            @RequestParam(required = false) List<String> products,
            @RequestParam(required = false) List<String> countries) {

        log.info("GET /api/statistics/office-enquiries - office={}, status={}, start={}, end={}",
                 officeName, bookingStatus, startDate, endDate);

        try {
            DashboardFilterDTO filter = DashboardFilterDTO.builder()
                    .startDate(startDate)
                    .endDate(endDate)
                    .coreFlags(coreFlags)
                    .products(products)
                    .countries(countries)
                    .build();

            List<java.util.Map<String, Object>> result =
                    statisticsService.getOfficeEnquiries(officeName, bookingStatus, filter);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching office enquiries", e);
            return ResponseEntity.internalServerError().body(
                    java.util.Map.of("error", "Internal server error", "message", e.getMessage())
            );
        }
    }

    /**
     * GET /api/statistics/monthly - Get monthly report
     * @param year Year parameter
     * @param month Month parameter (1-12)
     * @return Monthly report data
     */
    @GetMapping("/monthly")
    public ResponseEntity<?> getMonthlyReport(
            @RequestParam int year,
            @RequestParam int month) {
        
        log.info("GET /api/statistics/monthly - year={}, month={}", year, month);
        
        // TODO: Implement monthly report logic
        return ResponseEntity.ok().body(Map.of(
            "message", "Monthly report endpoint - implementation pending",
            "year", year,
            "month", month
        ));
    }
    
    /**
     * GET /api/statistics/country - Get country-based report
     * @param countryCode Optional country code filter
     * @return Country report data
     */
    @GetMapping("/country")
    public ResponseEntity<?> getCountryReport(
            @RequestParam(required = false) String countryCode) {
        
        log.info("GET /api/statistics/country - countryCode={}", countryCode);
        
        // TODO: Implement country report logic
        return ResponseEntity.ok().body(Map.of(
            "message", "Country report endpoint - implementation pending",
            "countryCode", countryCode != null ? countryCode : "all"
        ));
    }
    
    /**
     * POST /api/statistics/export - Export report data
     * @param exportOptions Export configuration
     * @return Export file or export ID
     */
    @PostMapping("/export")
    public ResponseEntity<?> exportReport(@RequestBody Map<String, Object> exportOptions) {
        
        log.info("POST /api/statistics/export - options={}", exportOptions);
        
        // TODO: Implement export logic
        return ResponseEntity.ok().body(Map.of(
            "message", "Export endpoint - implementation pending",
            "exportId", "EXP-" + System.currentTimeMillis()
        ));
    }
    
    /**
     * POST /api/statistics/comparison - Compare multiple time periods
     * Supports monthly and quarterly comparisons
     * 
     * @param request Comparison request with periods and filters
     * @return Comparison result with period statistics and trends
     */
    @PostMapping("/comparison")
    public ResponseEntity<?> comparePeriods(@RequestBody PeriodComparisonRequestDTO request) {
        
        log.info("POST /api/statistics/comparison - type={}, periods={}", 
                 request.getComparisonType(), request.getPeriods());
        
        try {
            ComparisonResultDTO result = comparisonService.comparePeriods(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid comparison request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Invalid request",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error performing period comparison", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Internal server error",
                "message", e.getMessage()
            ));
        }
    }
}
