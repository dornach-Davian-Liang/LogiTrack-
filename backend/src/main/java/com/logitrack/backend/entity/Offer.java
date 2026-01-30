package com.logitrack.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 报价子表实体类 - 匹配 MySQL offer 表结构
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
    
    @Enumerated(EnumType.STRING)
    @Column(name = "offer_type", nullable = false)
    private OfferType offerType;
    
    @Column(name = "sequence_no", nullable = false)
    private Integer sequenceNo = 1;
    
    @Column(name = "is_latest", nullable = false)
    private Boolean isLatest = false;
    
    @Column(name = "sent_date")
    private LocalDate sentDate;
    
    @Column(name = "sent_date_raw_text", length = 100)
    private String sentDateRawText;
    
    @Column(name = "price", precision = 18, scale = 4)
    private BigDecimal price;
    
    @Column(name = "price_text", columnDefinition = "TEXT")
    private String priceText;
    
    @Column(name = "is_rejected_price", nullable = false)
    private Boolean isRejectedPrice = false;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum OfferType {
        OCEAN, AIR, OTHER
    }
}
