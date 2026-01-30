package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 询价主表实体类 - 匹配 MySQL enquiry 表结构
 */
@Entity
@Table(name = "enquiry")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Enquiry {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "reference_number", length = 50, unique = true, nullable = false)
    private String referenceNumber;
    
    @Column(name = "enquiry_received_date", nullable = false)
    private LocalDate enquiryReceivedDate;
    
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;
    
    @Column(name = "reference_month", length = 4, columnDefinition = "char(4)", nullable = false)
    private String referenceMonth;
    
    @Column(name = "monthly_sequence", nullable = false)
    private Integer monthlySequence;
    
    @Column(name = "serial_number", nullable = false)
    private Integer serialNumber = 0;
    
    @Column(name = "product_code", length = 30, nullable = false)
    private String productCode;
    
    @Column(name = "product_abbr", length = 10, nullable = false)
    private String productAbbr;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EnquiryStatus status = EnquiryStatus.New;
    
    @Column(name = "cn_pricing_admin", length = 100, nullable = false)
    private String cnPricingAdmin;
    
    // 销售信息 - 匹配数据库实际字段
    @Column(name = "sales_country_code", length = 10, columnDefinition = "char(10)", nullable = false)
    private String salesCountryCode;
    
    @Column(name = "sales_office_id", nullable = false)
    private Integer salesOfficeId;
    
    @Column(name = "sales_pic_id")
    private Integer salesPicId;
    
    // 货物信息
    @Column(name = "assigned_cn_office_code", length = 50, nullable = false)
    private String assignedCnOfficeCode;
    
    @Column(name = "cargo_type_code", length = 20, nullable = false)
    private String cargoTypeCode;
    
    @Column(name = "volume_cbm", precision = 12, scale = 3)
    private BigDecimal volumeCbm;
    
    @Column(name = "volume_raw_text", length = 100)
    private String volumeRawText;
    
    @Column(name = "quantity", precision = 12, scale = 3)
    private BigDecimal quantity;
    
    @Column(name = "quantity_raw_text", length = 100)
    private String quantityRawText;
    
    @Column(name = "quantity_uom_code", length = 20)
    private String quantityUomCode;
    
    @Column(name = "quantity_uom_raw_text", length = 200)
    private String quantityUomRawText;
    
    @Column(name = "quantity_teu", precision = 12, scale = 3)
    private BigDecimal quantityTeu;
    
    @Column(name = "quantity_teu_raw_text", length = 100)
    private String quantityTeuRawText;
    
    @Column(name = "commodity", columnDefinition = "TEXT")
    private String commodity;
    
    @Column(name = "haz_special_equipment", columnDefinition = "TEXT")
    private String hazSpecialEquipment;
    
    // 路线信息 - 外键关联
    @Column(name = "pol_id", nullable = false)
    private Integer polId;
    
    @Column(name = "pod_id", nullable = false)
    private Integer podId;
    
    @Column(name = "pod_country_code", length = 2, columnDefinition = "char(2)")
    private String podCountryCode;
    
    // 业务分类
    @Enumerated(EnumType.STRING)
    @Column(name = "core_flag")
    private CoreFlag coreFlag;
    
    @Column(name = "category_code", length = 50)
    private String categoryCode;
    
    @Column(name = "cargo_ready_date")
    private LocalDate cargoReadyDate;
    
    @Column(name = "cargo_ready_date_raw_text", length = 100)
    private String cargoReadyDateRawText;
    
    @Column(name = "additional_requirement", columnDefinition = "TEXT")
    private String additionalRequirement;
    
    // 结果状态
    @Enumerated(EnumType.STRING)
    @Column(name = "booking_confirmed", nullable = false)
    private BookingConfirmed bookingConfirmed = BookingConfirmed.Pending;
    
    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;
    
    @Column(name = "rejected_reason", columnDefinition = "TEXT")
    private String rejectedReason;
    
    @Column(name = "actual_reason", columnDefinition = "TEXT")
    private String actualReason;
    
    // 报价类型锁定
    @Enumerated(EnumType.STRING)
    @Column(name = "enquiry_offer_type")
    private OfferType enquiryOfferType;
    
    // 预留字段
    @Column(name = "reserve_field_1", length = 255)
    private String reserveField1;
    
    @Column(name = "reserve_field_2", length = 255)
    private String reserveField2;
    
    @Column(name = "reserve_field_3", length = 255)
    private String reserveField3;
    
    @Column(name = "reserve_field_4", length = 255)
    private String reserveField4;
    
    @Column(name = "reserve_field_5", length = 255)
    private String reserveField5;
    
    // 时间戳
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    // 关联关系
    @OneToMany(mappedBy = "enquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Offer> offers = new ArrayList<>();
    
    @OneToMany(mappedBy = "enquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EnquiryContainerLine> containerLines = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // 枚举定义
    public enum EnquiryStatus {
        New, Quoted, Cancelled
    }
    
    public enum BookingConfirmed {
        Yes, Rejected, Pending, Invalid
    }
    
    public enum CoreFlag {
        CORE, NON_CORE
    }
    
    public enum OfferType {
        OCEAN, AIR, OTHER
    }
}
