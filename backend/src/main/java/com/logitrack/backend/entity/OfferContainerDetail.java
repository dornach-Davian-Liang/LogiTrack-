// filepath: entity/OfferContainerDetail.java
package com.logitrack.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 容器明细实体 v3 - 匹配 offer_container_detail 表
 * FCL/BUYER-CONSOL 专用
 */
@Entity
@Table(name = "offer_container_detail")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfferContainerDetail {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_price_line_id", nullable = false)
    private OfferPriceLine priceLine;
    
    @Column(name = "container_size_type", length = 20, nullable = false)
    private String containerSizeType;
    
    @Column(name = "container_type", length = 20)
    private String containerType;
    
    @Column(name = "number_of_containers", nullable = false)
    private Integer numberOfContainers = 0;
    
    @Column(name = "cargo_weight_per_container", precision = 12, scale = 3)
    private BigDecimal cargoWeightPerContainer;
    
    @Column(name = "container_price", precision = 18, scale = 4)
    private BigDecimal containerPrice;
    
    @Column(name = "teu_value", precision = 5, scale = 2, nullable = false)
    private BigDecimal teuValue;
    
    // line_teu = teu_value * number_of_containers (computed on save)
    @Column(name = "line_teu")
    private BigDecimal lineTeu;
}
