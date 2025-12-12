package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 询价记录实体类 - 完全匹配 MySQL 表结构和 CSV 字段
 */
@Entity
@Table(name = "enquiry_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnquiryRecord {
    
    @Id
    @Column(name = "id", length = 36)
    private String id;
    
    // 日期字段
    @Column(name = "enquiry_received_date")
    private LocalDate enquiryReceivedDate;
    
    @Column(name = "issue_date")
    private LocalDate issueDate;
    
    @Column(name = "cargo_ready_date")
    private LocalDate cargoReadyDate;
    
    @Column(name = "first_quotation_sent")
    private LocalDate firstQuotationSent;
    
    // 基本信息
    @Column(name = "reference_number", length = 50, unique = true, nullable = false)
    private String referenceNumber;
    
    @Column(name = "product", length = 50)
    private String product;
    
    @Column(name = "status", length = 50)
    private String status;
    
    // 管理人员信息
    @Column(name = "cn_pricing_admin", length = 100)
    private String cnPricingAdmin;
    
    @Column(name = "sales_country", length = 100)
    private String salesCountry;
    
    @Column(name = "sales_office", length = 100)
    private String salesOffice;
    
    @Column(name = "sales_pic", length = 100)
    private String salesPic;
    
    @Column(name = "assigned_cn_offices", length = 100)
    private String assignedCnOffices;
    
    // 货物信息
    @Column(name = "cargo_type", length = 50)
    private String cargoType;
    
    @Column(name = "volume_cbm")
    private Double volumeCbm;
    
    @Column(name = "quantity")
    private Double quantity;
    
    @Column(name = "quantity_unit", length = 20)
    private String quantityUnit;
    
    @Column(name = "quantity_teu")
    private Double quantityTeu;
    
    @Column(name = "commodity")
    private String commodity;
    
    @Column(name = "haz_special_equipment", columnDefinition = "TEXT")
    private String hazSpecialEquipment;
    
    // 路线信息
    @Column(name = "pol", length = 10)
    private String pol;
    
    @Column(name = "pod", length = 10)
    private String pod;
    
    @Column(name = "pod_country", length = 100)
    private String podCountry;
    
    // 业务分类
    @Column(name = "core_non_core", length = 20)
    private String coreNonCore;
    
    @Column(name = "category", length = 100)
    private String category;
    
    // 需求和备注
    @Column(name = "additional_requirement", columnDefinition = "TEXT")
    private String additionalRequirement;
    
    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;
    
    // 报价信息
    @Column(name = "first_offer_ocean_frg", length = 100)
    private String firstOfferOceanFrg;
    
    @Column(name = "first_offer_air_frg_kg", length = 100)
    private String firstOfferAirFrgKg;
    
    @Column(name = "latest_offer_ocean_frg", length = 100)
    private String latestOfferOceanFrg;
    
    @Column(name = "latest_offer_air_frg_kg", length = 100)
    private String latestOfferAirFrgKg;
    
    // 预订状态
    @Column(name = "booking_confirmed", length = 20)
    private String bookingConfirmed;
    
    @Column(name = "rejected_reason", columnDefinition = "TEXT")
    private String rejectedReason;
    
    @Column(name = "actual_reason", columnDefinition = "TEXT")
    private String actualReason;
    
    // 时间戳
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (id == null || id.isEmpty()) {
            id = java.util.UUID.randomUUID().toString();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
