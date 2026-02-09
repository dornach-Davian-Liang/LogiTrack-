package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Country/Port Statistics DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationStatDTO {
    private String name;  // Country or Port name
    private Integer count;
    private String percentage;
}
