// filepath: entity/OfferPriceLine.java
package com.logitrack.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 报价价格明细行实体 v3 - 匹配 offer_price_line 表
 * 每个 POL-POD 对一行
 */
@Entity
@Table(name = "offer_price_line")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfferPriceLine {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_id", nullable = false)
    private Offer offer;
    
    @Column(name = "route_group_id")
    private Long routeGroupId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "sub_mode")
    private EnquiryRouteGroup.SubMode subMode;
    
    @Column(name = "pol_id", nullable = false)
    private Integer polId;
    
    @Column(name = "pod_id", nullable = false)
    private Integer podId;
    
    @Column(name = "per_cbm", precision = 18, scale = 4)
    private BigDecimal perCbm;
    
    @Column(name = "min_charge", precision = 18, scale = 4)
    private BigDecimal minCharge;
    
    @Column(name = "local_charge", precision = 18, scale = 4)
    private BigDecimal localCharge;
    
    @Column(name = "price", precision = 18, scale = 4)
    private BigDecimal price;
    
    @Column(name = "price_text", length = 500)
    private String priceText;
    
    @Column(name = "carrier", length = 50)
    private String carrier;
    
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
    
    // 容器明细（FCL/BUYER-CONSOL）
    @OneToMany(mappedBy = "priceLine", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OfferContainerDetail> containerDetails = new ArrayList<>();
    
    // Transient 展示字段
    @Transient
    private String polName;
    
    @Transient
    private String podName;
}
