package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Dashboard Overview Statistics DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewDTO {
    private Integer totalEnquiries;
    private Integer quoted;
    private Integer pending;
    private Integer confirmed;
    private Integer totalEnquiriesChange;  // Percentage change from last month
    private Integer quotedChange;
    private Integer confirmedChange;
}
