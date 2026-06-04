package com.logitrack.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 容器明细 DTO (FCL / BUYER-CONSOL 专用)
 * 对应 offer_container_detail 表
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfferContainerDetailDTO {

    /** 柜型尺寸: 20GP, 40GP, 40HQ, 45GP, 20OT, 20FR 等 */
    @NotBlank(message = "Container size type is required")
    private String containerSizeType;

    /** 柜型: GP, OT, FR, Tank, Reefer 等 (可选) */
    private String containerType;

    /** 柜量 */
    @NotNull(message = "Number of containers is required")
    @Min(value = 0, message = "Number of containers must be >= 0")
    private Integer numberOfContainers = 0;

    /** 每柜货重 (吨) */
    private BigDecimal cargoWeightPerContainer;

    /** 柜价 */
    private BigDecimal containerPrice;

    /** TEU 系数: 20'=1.0, 40'/40'HQ/45'=2.0 */
    @NotNull(message = "TEU value is required")
    private BigDecimal teuValue;
}
