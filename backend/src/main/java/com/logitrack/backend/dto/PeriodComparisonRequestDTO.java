package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Period comparison request parameters
 * Supports monthly and quarterly comparisons
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeriodComparisonRequestDTO {
    
    /**
     * Comparison type: "MONTHLY" or "QUARTERLY"
     */
    private String comparisonType;
    
    /**
     * List of periods to compare
     * For MONTHLY: format "2026-01", "2026-02", etc.
     * For QUARTERLY: format "2026-Q1", "2026-Q2", etc.
     */
    private List<String> periods;
    
    /**
     * Optional: Core flag filter
     */
    private List<String> coreFlags;
    
    /**
     * Optional: CN Office filter
     */
    private String cnOffice;
}
