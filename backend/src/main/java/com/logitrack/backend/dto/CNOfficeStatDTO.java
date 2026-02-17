package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CN Office statistics DTO for grouping enquiries by assigned office
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CNOfficeStatDTO {
    
    /**
     * CN Office name
     */
    private String officeName;
    
    /**
     * Total enquiries assigned to this office
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
    private String conversionRate;
}
