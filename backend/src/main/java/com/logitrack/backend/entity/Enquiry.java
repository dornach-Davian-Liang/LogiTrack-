package com.logitrack.backend.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.logitrack.backend.converter.CoreNonCoreConverter;
import com.logitrack.backend.converter.EnquiryStatusConverter;
import com.logitrack.backend.converter.OfferTypeConverter;
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
 * 询价主表实体类 v3 - 匹配 schema_v3 的 enquiry 表
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
    
    @Column(name = "ref_number", length = 50, unique = true, nullable = false)
    private String refNumber;
    
    @Column(name = "enquiry_received_date", nullable = false)
    private LocalDate enquiryReceivedDate;
    
    @Column(name = "enquiry_created_date", nullable = false)
    private LocalDateTime enquiryCreatedDate;
    
    @Column(name = "product_code", length = 20, nullable = false)
    private String productCode;
    
    @Column(name = "cargo_type_code", length = 20, nullable = false)
    private String cargoTypeCode;
    
    // 状态 — 使用 AttributeConverter 处理 "Quoted & Pending" 中的特殊字符
    @Convert(converter = EnquiryStatusConverter.class)
    @Column(name = "status", nullable = false, columnDefinition = "ENUM('New','Quoted & Pending','Secured','Lost','Cancelled')")
    private EnquiryStatus status = EnquiryStatus.New;
    
    @Column(name = "cancelled_reason", length = 50)
    private String cancelledReason;
    
    @Column(name = "cancelled_reason_text", columnDefinition = "TEXT")
    private String cancelledReasonText;
    
    @Column(name = "lost_reason", length = 100)
    private String lostReason;
    
    @Column(name = "lost_reason_text", columnDefinition = "TEXT")
    private String lostReasonText;
    
    // 销售信息
    @Column(name = "sales_country_code", length = 50, nullable = false)
    private String salesCountryCode;
    
    @Column(name = "sales_pic_id", nullable = false)
    private Integer salesPicId;
    
    @Column(name = "sales_office_id", nullable = false)
    private Integer salesOfficeId;
    
    @Column(name = "assigned_cn_office", length = 100)
    private String assignedCnOffice;
    
    @Column(name = "sender_email", length = 200)
    private String senderEmail;
    
    // 货物信息
    @Column(name = "commodity", columnDefinition = "TEXT")
    private String commodity;
    
    @Column(name = "hazardous_special_equipment", columnDefinition = "TEXT")
    private String hazardousSpecialEquipment;
    
    @Column(name = "is_oversize_cargo", nullable = false)
    private Boolean isOversizeCargo = false;
    
    @Column(name = "volume_cbm", precision = 12, scale = 3)
    private BigDecimal volumeCbm;
    
    @Column(name = "quantity", precision = 12, scale = 3)
    private BigDecimal quantity;
    
    @Column(name = "uom", length = 20)
    private String uom;
    
    // 路线信息（普通模式冗余字段）
    @Column(name = "pol_country", length = 100)
    private String polCountry;
    
    @Column(name = "pod_country", length = 100)
    private String podCountry;
    
    @Column(name = "category", length = 50)
    private String category;
    
    @Column(name = "exw_location", length = 200)
    private String exwLocation;
    
    @Convert(converter = CoreNonCoreConverter.class)
    @Column(name = "core_non_core")
    private CoreNonCore coreNonCore;
    
    // Cargo Ready Date
    @Column(name = "has_specific_cargo_ready_date", nullable = false)
    private Boolean hasSpecificCargoReadyDate = false;
    
    @Column(name = "cargo_ready_date", nullable = false)
    private LocalDate cargoReadyDate;
    
    @Column(name = "cargo_ready_date_details", length = 500)
    private String cargoReadyDateDetails;
    
    // Offer 快捷字段
    @Convert(converter = OfferTypeConverter.class)
    @Column(name = "offer_type", columnDefinition = "ENUM('FCL','LCL','AIR','BUYER-CONSOL')")
    private OfferType offerType;
    
    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;
    
    // Reference Number 生成辅助字段
    @Column(name = "reference_month", length = 4, columnDefinition = "char(4)")
    private String referenceMonth;
    
    @Column(name = "monthly_sequence")
    private Integer monthlySequence;
    
    @Column(name = "serial_number", nullable = false)
    private Integer serialNumber = 0;
    
    @Column(name = "product_abbr", length = 10)
    private String productAbbr;
    
    // 审计
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // 关联关系
    @OneToMany(mappedBy = "enquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 50)
    private List<Offer> offers = new ArrayList<>();
    
    // Container rows (FCL/BUYER-CONSOL)
    @OneToMany(mappedBy = "enquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 50)
    private List<EnquiryContainerLine> containerRows = new ArrayList<>();
    
    // Transient 字段（不映射到数据库）
    @Transient
    private List<Integer> polIds = new ArrayList<>();
    
    @Transient
    private List<Integer> podIds = new ArrayList<>();
    
    @Transient
    private List<EnquiryRouteGroup> routeGroups = new ArrayList<>();

    // 派生展示字段（由服务层批量填充）
    @Transient
    private String salesPicName;

    @Transient
    private String salesOfficeName;

    @Transient
    private String polName;

    @Transient
    private String podName;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (enquiryCreatedDate == null) enquiryCreatedDate = LocalDateTime.now();
        if (cargoReadyDate == null) cargoReadyDate = enquiryCreatedDate.toLocalDate();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // v3 枚举定义
    public enum EnquiryStatus {
        New,
        @SuppressWarnings("unused")
        Quoted_Pending {
            @Override
            public String toString() { return "Quoted & Pending"; }
        },
        Secured,
        Lost,
        Cancelled;
        
        /** JSON 序列化值 = DB 存储值 */
        @JsonValue
        public String toJsonValue() {
            return switch (this) {
                case Quoted_Pending -> "Quoted & Pending";
                default -> name();
            };
        }
        
        @JsonCreator
        public static EnquiryStatus fromString(String value) {
            if (value == null) return null;
            return switch (value) {
                case "New" -> New;
                case "Quoted & Pending", "Quoted_Pending" -> Quoted_Pending;
                case "Secured" -> Secured;
                case "Lost" -> Lost;
                case "Cancelled" -> Cancelled;
                default -> throw new IllegalArgumentException("Unknown status: " + value);
            };
        }
    }
    
    public enum CoreNonCore {
        Core,
        @SuppressWarnings("unused")
        Non_Core {
            @Override
            public String toString() { return "Non-Core"; }
        };
        
        @JsonValue
        public String toJsonValue() {
            return switch (this) {
                case Non_Core -> "Non-Core";
                default -> name();
            };
        }
        
        @JsonCreator
        public static CoreNonCore fromString(String value) {
            if (value == null) return null;
            return switch (value) {
                case "Core" -> Core;
                case "Non-Core", "Non_Core" -> Non_Core;
                default -> throw new IllegalArgumentException("Unknown core/non-core: " + value);
            };
        }
    }
    
    public enum OfferType {
        FCL, LCL, AIR,
        @SuppressWarnings("unused")
        BUYER_CONSOL {
            @Override
            public String toString() { return "BUYER-CONSOL"; }
        };
        
        @JsonValue
        public String toJsonValue() {
            return switch (this) {
                case BUYER_CONSOL -> "BUYER-CONSOL";
                default -> name();
            };
        }
        
        @JsonCreator
        public static OfferType fromString(String value) {
            if (value == null) return null;
            return switch (value) {
                case "FCL" -> FCL;
                case "LCL" -> LCL;
                case "AIR" -> AIR;
                case "BUYER-CONSOL", "BUYER_CONSOL" -> BUYER_CONSOL;
                default -> throw new IllegalArgumentException("Unknown offer type: " + value);
            };
        }
    }
}
