package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Statistics for a single time period
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeriodStatsDTO {
    
    /**
     * Period label (e.g., "2026-01", "2026-Q1")
     */
    private String period;
    
    /**
     * Period start date
     */
    private String startDate;
    
    /**
     * Period end date
     */
    private String endDate;
    
    /**
     * Total enquiries in this period
     */
    private Integer totalEnquiries;
    
    /**
     * Number of quoted enquiries
     */
    private Integer quoted;
    
    /**
     * Number of confirmed bookings
     */
    private Integer confirmed;
    
    /**
     * Conversion rate (confirmed / total * 100%)
     */
    private Double conversionRate;
    
    /**
     * Percentage change from previous period (if applicable)
     */
    private Integer changeFromPrevious;
}
