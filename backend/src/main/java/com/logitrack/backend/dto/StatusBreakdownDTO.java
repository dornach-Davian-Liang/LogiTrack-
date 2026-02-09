package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Status Breakdown Statistics DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusBreakdownDTO {
    private Integer count;
    private String percentage;
}
