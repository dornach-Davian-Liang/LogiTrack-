package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReferencePreview {
    private String referenceNumber;
    private String referenceMonth;
    private Integer monthlySequence;
    private Integer serialNumber;
    private String productAbbr;
}
