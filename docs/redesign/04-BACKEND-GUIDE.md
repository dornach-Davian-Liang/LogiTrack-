# LogiTrack Pro 询价重构 — 后端实现指南

> **版本**: v2.0  
> **日期**: 2026-03-23  
> **技术栈**: Spring Boot 3.2.0 + Java 17 + Spring Data JPA + MySQL 8.0

---

## 目录

1. [Entity 层变更](#1-entity-层变更)
2. [Repository 层变更](#2-repository-层变更)
3. [Service 层变更](#3-service-层变更)
4. [Controller 层变更](#4-controller-层变更)
5. [DTO 层设计](#5-dto-层设计)
6. [数据库迁移脚本](#6-数据库迁移脚本)
7. [AI 模块更新](#7-ai-模块更新)
8. [配置与兼容性](#8-配置与兼容性)

---

## 1. Entity 层变更

### 1.1 Enquiry.java — 主要变更

```java
package com.logitrack.backend.entity;

@Entity
@Table(name = "enquiry")
@Data @NoArgsConstructor @AllArgsConstructor
public class Enquiry {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === 基础信息 (不变) ===
    @Column(name = "reference_number", unique = true, nullable = false, length = 50)
    private String referenceNumber;

    @Column(name = "enquiry_received_date", nullable = false)
    private LocalDate enquiryReceivedDate;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;  // UI显示: "Enquiry Created Date"

    @Column(name = "reference_month", nullable = false, length = 4)
    private String referenceMonth;

    @Column(name = "monthly_sequence", nullable = false)
    private Integer monthlySequence;

    @Column(name = "serial_number", nullable = false)
    private Integer serialNumber = 0;

    // === 产品 & 状态 ===
    @Column(name = "product_code", nullable = false, length = 30)
    private String productCode;

    @Column(name = "product_abbr", nullable = false, length = 10)
    private String productAbbr;

    // 【变更】 ENUM 从 (New, Quoted, Cancelled) → 5 值
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EnquiryStatus status = EnquiryStatus.New;

    // 【新增】 取消/丢单原因
    @Column(name = "cancelled_reason", length = 50)
    private String cancelledReason;

    @Column(name = "cancelled_reason_text", columnDefinition = "TEXT")
    private String cancelledReasonText;

    @Column(name = "lost_reason", length = 100)
    private String lostReason;

    @Column(name = "lost_reason_text", columnDefinition = "TEXT")
    private String lostReasonText;

    // === 销售信息 ===
    // 【删除】 cnPricingAdmin 字段

    @Column(name = "sales_country_code", nullable = false, length = 20)
    private String salesCountryCode;

    @Column(name = "sales_office_id", nullable = false)
    private Integer salesOfficeId;

    @Column(name = "sales_pic_id")
    private Integer salesPicId;

    // === CN 办公室 ===
    @Column(name = "assigned_cn_office_code", nullable = false, length = 50)
    private String assignedCnOfficeCode;

    // === 货物信息 ===
    @Column(name = "cargo_type_code", nullable = false, length = 20)
    private String cargoTypeCode;  // AIR/FCL/LCL/BUYER-CONSOL

    @Column(name = "volume_cbm", precision = 12, scale = 3) private BigDecimal volumeCbm;
    @Column(name = "volume_raw_text", length = 100) private String volumeRawText;
    @Column(name = "quantity", precision = 12, scale = 3) private BigDecimal quantity;
    @Column(name = "quantity_raw_text", length = 100) private String quantityRawText;
    @Column(name = "quantity_uom_code", length = 20) private String quantityUomCode;
    @Column(name = "quantity_uom_raw_text", length = 200) private String quantityUomRawText;
    @Column(name = "quantity_teu", precision = 12, scale = 3) private BigDecimal quantityTeu;
    @Column(name = "quantity_teu_raw_text", length = 100) private String quantityTeuRawText;
    @Column(name = "commodity", columnDefinition = "TEXT") private String commodity;
    @Column(name = "haz_special_equipment", columnDefinition = "TEXT") private String hazSpecialEquipment;

    // === 路线信息 ===
    @Column(name = "pol_id") private Integer polId;  // Legacy (普通模式兼容)
    @Column(name = "pod_id") private Integer podId;  // Legacy (普通模式兼容)
    @Column(name = "pod_country_code", length = 2) private String podCountryCode;

    // === 核心/分类 ===
    @Enumerated(EnumType.STRING)
    @Column(name = "core_flag") private CoreFlag coreFlag;
    @Column(name = "category_code", length = 50) private String categoryCode;
    @Column(name = "exw_location", length = 500) private String exwLocation; // 【新增】

    // === Cargo Ready Date ===
    @Column(name = "has_specific_cargo_ready_date", nullable = false)
    private Boolean hasSpecificCargoReadyDate = false; // 【新增】
    @Column(name = "cargo_ready_date") private LocalDate cargoReadyDate;
    @Column(name = "cargo_ready_date_raw_text", length = 100) private String cargoReadyDateRawText;

    // === 其他 ===
    @Column(name = "additional_requirement", columnDefinition = "TEXT") private String additionalRequirement;
    @Column(name = "remark", columnDefinition = "TEXT") private String remark;
    @Column(name = "reserve_field_1") private String reserveField1;
    @Column(name = "reserve_field_2") private String reserveField2;
    @Column(name = "reserve_field_3") private String reserveField3;
    @Column(name = "reserve_field_4") private String reserveField4;
    @Column(name = "reserve_field_5") private String reserveField5;

    // === 关联 ===
    @OneToMany(mappedBy = "enquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequenceNo ASC")
    private List<Offer> offers = new ArrayList<>();

    // 【新增】 路由组 (混合模式)
    @OneToMany(mappedBy = "enquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("groupIndex ASC")
    private List<EnquiryRouteGroup> routeGroups = new ArrayList<>();

    // 【删除】 containerLines → 移至 Offer

    @Transient private List<Integer> polIds;
    @Transient private List<Integer> podIds;

    // === 审计 ===
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "created_by", length = 100) private String createdBy;
    @Column(name = "updated_by", length = 100) private String updatedBy;

    @PrePersist protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
```

### 1.2 枚举类型变更

```java
// === EnquiryStatus.java (重写) ===
public enum EnquiryStatus {
    New("New"),
    @JsonProperty("Quoted & Pending")
    QUOTED_PENDING("Quoted & Pending"),
    Secured("Secured"),
    Lost("Lost"),
    Cancelled("Cancelled");

    private final String value;
    EnquiryStatus(String value) { this.value = value; }
    @JsonValue public String getValue() { return value; }
    @JsonCreator
    public static EnquiryStatus fromValue(String value) {
        for (EnquiryStatus s : values()) {
            if (s.value.equals(value)) return s;
        }
        throw new IllegalArgumentException("Unknown status: " + value);
    }
}

// === OfferType.java (重写) ===
public enum OfferType {
    AIR, FCL, LCL, BUYER_CONSOL;

    @JsonCreator
    public static OfferType fromString(String value) {
        if ("BUYER-CONSOL".equals(value)) return BUYER_CONSOL;
        return valueOf(value);
    }
    @JsonValue
    public String toValue() {
        return this == BUYER_CONSOL ? "BUYER-CONSOL" : name();
    }
}

// === SubMode.java (新增) ===
public enum SubMode { AIR, SEA, RAIL; }

// === 删除 ===
// BookingConfirmed.java → 删除
```

### 1.3 新增 Entity

#### EnquiryRouteGroup.java

```java
@Entity @Table(name = "enquiry_route_group")
@Data @NoArgsConstructor
public class EnquiryRouteGroup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enquiry_id", nullable = false) @JsonBackReference
    private Enquiry enquiry;
    @Column(name = "group_index", nullable = false) private Integer groupIndex;
    @Enumerated(EnumType.STRING)
    @Column(name = "sub_mode", nullable = false) private SubMode subMode;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Transient private List<Integer> polIds = new ArrayList<>();
    @Transient private List<Integer> podIds = new ArrayList<>();
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
```

#### Offer.java (重构)

```java
@Entity @Table(name = "offer")
@Data @NoArgsConstructor
public class Offer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enquiry_id", nullable = false) @JsonBackReference
    private Enquiry enquiry;
    @Column(name = "offer_type", nullable = false, length = 20) private String offerType;
    @Column(name = "sequence_no", nullable = false) private Integer sequenceNo = 1;
    @Column(name = "is_latest", nullable = false) private Boolean isLatest = false;
    @Column(name = "offer_date") private LocalDate offerDate;  // 替代 sentDate
    @OneToMany(mappedBy = "offer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OfferPriceLine> priceLines = new ArrayList<>();
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "created_by") private String createdBy;
    @Column(name = "updated_by") private String updatedBy;
}
```

#### OfferPriceLine.java (新增)

```java
@Entity @Table(name = "offer_price_line")
@Data @NoArgsConstructor
public class OfferPriceLine {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_id", nullable = false) @JsonBackReference
    private Offer offer;
    @Column(name = "pol_id", nullable = false) private Integer polId;
    @Column(name = "pod_id", nullable = false) private Integer podId;
    @Column(name = "route_group_id") private Long routeGroupId;
    @Enumerated(EnumType.STRING)
    @Column(name = "sub_mode") private SubMode subMode;
    @Column(name = "per_cbm", precision = 18, scale = 4) private BigDecimal perCbm;
    @Column(name = "min_charge", precision = 18, scale = 4) private BigDecimal minCharge;
    @Column(name = "local_charge", precision = 18, scale = 4) private BigDecimal localCharge;
    @Column(name = "price", precision = 18, scale = 4) private BigDecimal price;
    @Column(name = "price_text", length = 500) private String priceText;
    @Column(name = "is_rejected_price", nullable = false) private Boolean isRejectedPrice = false;
    @OneToMany(mappedBy = "offerPriceLine", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OfferContainerDetail> containerDetails = new ArrayList<>();
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Transient private String polName;
    @Transient private String podName;
}
```

#### OfferContainerDetail.java (新增)

```java
@Entity @Table(name = "offer_container_detail")
@Data @NoArgsConstructor
public class OfferContainerDetail {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_price_line_id", nullable = false) @JsonBackReference
    private OfferPriceLine offerPriceLine;
    @Column(name = "container_size_type", nullable = false, length = 20) private String containerSizeType;
    @Column(name = "container_type", length = 20) private String containerType;
    @Column(name = "number_of_containers", nullable = false) private Integer numberOfContainers = 0;
    @Column(name = "cargo_weight_per_container", precision = 12, scale = 3) private BigDecimal cargoWeightPerContainer;
    @Column(name = "container_price", precision = 18, scale = 4) private BigDecimal containerPrice;
    @Column(name = "teu_value", nullable = false, precision = 5, scale = 2) private BigDecimal teuValue = BigDecimal.ONE;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Transient public BigDecimal getLineTeu() {
        return teuValue.multiply(BigDecimal.valueOf(numberOfContainers));
    }
}
```

#### 字典 Entity (新增)

```java
@Entity @Table(name = "dict_cancelled_reason") @Data
public class CancelledReason {
    @Id @Column(length = 50) private String code;
    @Column(nullable = false, length = 200) private String label;
    @Column(name = "sort_order") private Integer sortOrder;
}

@Entity @Table(name = "dict_lost_reason") @Data
public class LostReason {
    @Id @Column(length = 100) private String code;
    @Column(nullable = false, length = 200) private String label;
    @Column(name = "sort_order") private Integer sortOrder;
}
```

### 1.4 需删除的 Entity

| Entity | 文件 | 原因 |
|--------|------|------|
| CnPricingAdmin | CnPricingAdmin.java | 需求4删除 |
| EnquiryContainerLine | EnquiryContainerLine.java | 需求9移至Offer |

---

## 2. Repository 层变更

### 2.1 新增 Repository

```java
public interface EnquiryRouteGroupRepository extends JpaRepository<EnquiryRouteGroup, Long> {
    List<EnquiryRouteGroup> findByEnquiryIdOrderByGroupIndex(Long enquiryId);
    void deleteByEnquiryId(Long enquiryId);
}

public interface OfferPriceLineRepository extends JpaRepository<OfferPriceLine, Long> {
    List<OfferPriceLine> findByOfferIdOrderByPolIdAscPodIdAsc(Long offerId);
    void deleteByOfferId(Long offerId);
}

public interface OfferContainerDetailRepository extends JpaRepository<OfferContainerDetail, Long> {
    List<OfferContainerDetail> findByOfferPriceLineId(Long priceLineId);
}

public interface CancelledReasonRepository extends JpaRepository<CancelledReason, String> {
    List<CancelledReason> findAllByOrderBySortOrderAsc();
}

public interface LostReasonRepository extends JpaRepository<LostReason, String> {
    List<LostReason> findAllByOrderBySortOrderAsc();
}
```

### 2.2 删除 Repository

- CnPricingAdminRepository.java → 删除
- EnquiryContainerLineRepository.java → 删除

---

## 3. Service 层变更

### 3.1 EnquiryService — 核心变更

关键新增逻辑：

1. **状态变更验证** — Lost/Cancelled 必须填写原因
2. **Cargo Ready Date 默认值** — 未勾选时 CRD = issueDate
3. **路由组保存** — 混合模式下保存 Route Groups
4. **删除 containerLines 保存** — 容器信息移至 Offer

### 3.2 OfferService — 重大重构

关键新增逻辑：

1. **createOffer** — 接收 OfferCreateDTO（含 priceLines + containerDetails）
2. **savePriceLines** — 保存 Price Lines + Container Details + 过滤空行
3. **generatePriceLines** — 根据 POL×POD 笛卡尔积自动生成空白行
4. **混合模式** — 按 Route Group 分组生成

### 3.3 StatisticsService — SQL 变更

所有涉及以下查询条件的 SQL 需更新：
- `booking_confirmed = 'Yes'` → `status = 'Secured'`
- `booking_confirmed = 'Rejected'` → `status = 'Lost'`
- `status = 'Quoted'` → `status = 'Quoted & Pending'`

---

## 4. Controller 层变更

### 4.1 DictController — 新增端点

```java
@GetMapping("/cancelled-reasons")  // 新增
@GetMapping("/lost-reasons")       // 新增
// @GetMapping("/cn-pricing-admins") → 删除
```

### 4.2 OfferController — 重构

```java
@GetMapping("/enquiries/{id}/offers")                // 返回结构变化
@PostMapping("/enquiries/{id}/offers")               // 接收 OfferCreateDTO
@PutMapping("/offers/{id}")                          // 接收 OfferUpdateDTO
@DeleteMapping("/offers/{id}")                       // 不变
@GetMapping("/enquiries/{id}/offers/generate-lines") // 新增：生成空白行
```

---

## 5. DTO 层设计

```java
@Data public class OfferCreateDTO {
    @NotBlank private String offerType;
    private LocalDate offerDate;
    @NotEmpty private List<OfferPriceLineDTO> priceLines;
}

@Data public class OfferPriceLineDTO {
    @NotNull private Integer polId;
    @NotNull private Integer podId;
    private Long routeGroupId;
    private SubMode subMode;
    private BigDecimal perCbm, minCharge, localCharge, price;
    private String priceText;
    private Boolean isRejectedPrice = false;
    private List<OfferContainerDetailDTO> containerDetails = new ArrayList<>();
}

@Data public class OfferContainerDetailDTO {
    @NotBlank private String containerSizeType;
    private String containerType;
    @NotNull private Integer numberOfContainers;
    private BigDecimal cargoWeightPerContainer, containerPrice;
    @NotNull private BigDecimal teuValue;
}

@Data public class RouteGroupDTO {
    private Integer groupIndex;
    @NotNull private SubMode subMode;
    @NotEmpty private List<Integer> polIds;
    @NotEmpty private List<Integer> podIds;
}
```

---

## 6. 数据库迁移脚本

详见 `02-FUNCTIONAL-DESIGN.md` 第 15 节的完整 DDL，以及迁移脚本文件 `database/migration_v3_enquiry_redesign.sql`。

迁移步骤：
1. 清空业务数据
2. 删除旧表/字段
3. 修改 ENUM
4. 新增字段
5. 重建 offer 表
6. 新建 offer_price_line / offer_container_detail
7. 新建路由组表
8. 更新字典数据

---

## 7. AI 模块更新

### SQL 替换:
- `booking_confirmed = 'Yes'` → `status = 'Secured'`
- `booking_confirmed = 'Rejected'` → `status = 'Lost'`
- `status = 'Quoted'` → `status = 'Quoted & Pending'`
- Cargo type 统计: AIR/FCL/LCL/RAIL/SEA → AIR/FCL/LCL/BUYER-CONSOL

---

## 8. 编译检查清单

- [ ] Enquiry.java — 删除旧字段，新增字段
- [ ] Offer.java — 重构
- [ ] 新增 OfferPriceLine.java, OfferContainerDetail.java, EnquiryRouteGroup.java
- [ ] 新增 CancelledReason.java, LostReason.java
- [ ] 重写 EnquiryStatus.java, OfferType.java
- [ ] 删除 BookingConfirmed.java, CnPricingAdmin.java, EnquiryContainerLine.java
- [ ] 新增 Repository 接口
- [ ] 更新 EnquiryService.java
- [ ] 重写 OfferService.java
- [ ] 更新 StatisticsService.java SQL
- [ ] 更新 AiAnalysisFunctions.java SQL
- [ ] 更新 DictController.java, OfferController.java
- [ ] 新增 DTO 类
