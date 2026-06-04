package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Complete Dashboard Statistics DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private DashboardOverviewDTO overview;
    private Map<String, StatusBreakdownDTO> statusBreakdown;
    private List<MonthlyTrendDTO> monthlyTrend;
    private List<LocationStatDTO> topCountries;
    private List<LocationStatDTO> topOrigins;
    private List<LocationStatDTO> topDestinations;
    private List<LocationStatDTO> cargoTypes;
    private List<CNOfficeStatDTO> cnOfficeStats;  // New: CN Office breakdown
}
