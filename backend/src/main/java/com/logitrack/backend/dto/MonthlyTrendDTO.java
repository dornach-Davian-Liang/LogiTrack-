package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Monthly Trend Statistics DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyTrendDTO {
    private String month;  // Format: YYYY-MM
    private Integer count;  // Total enquiries (legacy field name)
    private Integer change;  // Percentage change from previous month
    
    // Enhanced fields for detailed trend analysis
    private Integer totalEnquiries;  // Total enquiries in the month
    private Integer quoted;  // Number of quoted enquiries
    private Integer confirmed;  // Number of confirmed bookings
}
