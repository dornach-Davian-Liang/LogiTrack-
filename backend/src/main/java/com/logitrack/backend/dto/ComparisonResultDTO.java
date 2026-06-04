package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Comparison result containing statistics for multiple periods
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComparisonResultDTO {
    
    /**
     * Comparison type: MONTHLY or QUARTERLY
     */
    private String comparisonType;
    
    /**
     * List of period statistics
     */
    private List<PeriodStatsDTO> periodStats;
    
    /**
     * Summary statistics across all periods
     */
    private ComparisonSummaryDTO summary;
    
    /**
     * Trend data points for charting
     * Key: metric name (totalEnquiries, quoted, confirmed)
     * Value: list of values for each period
     */
    private Map<String, List<Integer>> trendData;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComparisonSummaryDTO {
        /**
         * Grand total across all periods
         */
        private Integer grandTotal;
        
        /**
         * Total quoted across all periods
         */
        private Integer totalQuoted;
        
        /**
         * Total confirmed across all periods
         */
        private Integer totalConfirmed;
        
        /**
         * Average conversion rate across periods
         */
        private Double avgConversionRate;
        
        /**
         * Best performing period
         */
        private String bestPeriod;
        
        /**
         * Worst performing period
         */
        private String worstPeriod;
    }
}
