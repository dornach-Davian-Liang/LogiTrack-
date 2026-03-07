package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Dashboard filter parameters DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardFilterDTO {
    
    /**
     * Start date of the date range (inclusive)
     */
    private LocalDate startDate;
    
    /**
     * End date of the date range (inclusive)
     */
    private LocalDate endDate;
    
    /**
     * Core flag filter options: ["CORE", "NON CORE"]
     * If null or empty, include all
     */
    private List<String> coreFlags;
    
    /**
     * CN Office filter
     * If null or empty, include all offices
     */
    private String cnOffice;

    /**
     * Product code filter options: ["AIR", "SEA", "SEA-AIR", "RAIL", "RAIL-SEA"]
     * If null or empty, include all products
     */
    private List<String> products;

    /**
     * Country code filter options: ["FR", "UK", "DE", ...]
     * If null or empty, include all countries
     */
    private List<String> countries;
}
