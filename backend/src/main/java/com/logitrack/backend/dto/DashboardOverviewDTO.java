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
    private Integer newEnquiries;
    private Integer quotedPending;
    private Integer secured;
    private Integer lost;
    private Integer cancelled;
    // Legacy fields kept for backward compat
    private Integer quoted;
    private Integer pending;
    private Integer confirmed;
    private Integer totalEnquiriesChange;
    private Integer quotedChange;
    private Integer confirmedChange;
}
