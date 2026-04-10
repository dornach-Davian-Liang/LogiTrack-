package com.logitrack.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.logitrack.backend.converter.OfferTypeConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 报价主表实体类 v3 - 匹配 schema_v3 的 offer 表
 */
@Entity
@Table(name = "offer")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Offer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enquiry_id", nullable = false)
    private Enquiry enquiry;
    
    @Column(name = "sequence_no", nullable = false)
    private Integer sequenceNo = 1;
    
    @Column(name = "is_latest", nullable = false)
    private Boolean isLatest = true;
    
    @Convert(converter = OfferTypeConverter.class)
    @Column(name = "offer_type", nullable = false, columnDefinition = "ENUM('FCL','LCL','AIR','BUYER-CONSOL')")
    private Enquiry.OfferType offerType;
    
    @Column(name = "offer_date")
    private LocalDate offerDate;
    
    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @Column(name = "container_currency", length = 10)
    private String containerCurrency;

    @Column(name = "local_charge_currency", length = 10)
    private String localChargeCurrency;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // 价格明细行
    @OneToMany(mappedBy = "offer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OfferPriceLine> priceLines = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
