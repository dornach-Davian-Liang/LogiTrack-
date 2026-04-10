package com.logitrack.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.logitrack.backend.config.JsonMapConverter;
import com.logitrack.backend.config.JsonMapDoubleConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 询价容器信息行 — Enquiry 级别的容器信息
 * 对应 enquiry_container_line 表
 *
 * 支持 FCL/BUYER-CONSOL 类型,每行包含:
 * - 四种柜型数量 (20'/40'/40'HQ/45')
 * - 20' 柜型可填写重量
 * - CNTR Type 下拉 (关联 container_types 表)
 * - Line TEU 自动计算
 */
@Entity
@Table(name = "enquiry_container_line")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnquiryContainerLine {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enquiry_id", nullable = false)
    private Enquiry enquiry;
    
    // 20' 柜型数量
    @Column(name = "qty_20", nullable = false)
    private Integer qty20 = 0;
    
    // 20' 重量 (KG)
    @Column(name = "weight_20", precision = 12, scale = 3)
    private BigDecimal weight20;
    
    // 40' 柜型数量
    @Column(name = "qty_40", nullable = false)
    private Integer qty40 = 0;
    
    // 40' 重量 (KG) — 后端保留字段,前端不显示
    @Column(name = "weight_40", precision = 12, scale = 3)
    private BigDecimal weight40;
    
    // 40'HQ 柜型数量
    @Column(name = "qty_40hq", nullable = false)
    private Integer qty40hq = 0;
    
    // 40'HQ 重量 (KG) — 后端保留字段,前端不显示
    @Column(name = "weight_40hq", precision = 12, scale = 3)
    private BigDecimal weight40hq;
    
    // 45' 柜型数量
    @Column(name = "qty_45", nullable = false)
    private Integer qty45 = 0;
    
    // 45' 重量 (KG) — 后端保留字段,前端不显示
    @Column(name = "weight_45", precision = 12, scale = 3)
    private BigDecimal weight45;
    
    // CNTR Type (关联 container_types 表 ID)
    @Column(name = "cntr_type_id")
    private Integer cntrTypeId;
    
    // CNTR Type code (冗余,方便显示)
    @Column(name = "cntr_type_code", length = 20)
    private String cntrTypeCode;
    
    // Line TEU (计算值)
    @Column(name = "line_teu", precision = 8, scale = 2)
    private BigDecimal lineTeu;
    
    // 动态额外容器类型 (JSON): e.g. {"20OT": 2, "40HC": 1}
    @Column(name = "extra_containers", columnDefinition = "TEXT")
    @Convert(converter = JsonMapConverter.class)
    private Map<String, Integer> extraContainers = new HashMap<>();
    
    // 动态额外容器重量 (JSON): e.g. {"20OT": 1500.5, "20RF": 2000.0}
    @Column(name = "extra_container_weights", columnDefinition = "TEXT")
    @Convert(converter = JsonMapDoubleConverter.class)
    private Map<String, Double> extraContainerWeights = new HashMap<>();
    
    // Legacy fields (保留兼容)
    @Column(name = "container_type_id")
    private Integer containerTypeId;
    
    @Column(name = "container_code", length = 20)
    private String containerCode;
    
    @Column(name = "container_qty")
    private Integer containerQty;
    
    @Column(name = "teu_per_unit", precision = 6, scale = 2)
    private BigDecimal teuPerUnit;
    
    @Column(name = "raw_text", length = 200)
    private String rawText;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        calculateLineTeu();
    }
    
    @PreUpdate
    protected void onUpdate() {
        calculateLineTeu();
    }
    
    private void calculateLineTeu() {
        double teu = (qty20 != null ? qty20 : 0) * 1.0
                   + (qty40 != null ? qty40 : 0) * 2.0
                   + (qty40hq != null ? qty40hq : 0) * 2.0
                   + (qty45 != null ? qty45 : 0) * 2.0;
        // Include dynamic extra containers in TEU calculation
        if (extraContainers != null) {
            for (Map.Entry<String, Integer> entry : extraContainers.entrySet()) {
                String code = entry.getKey();
                int qty = entry.getValue() != null ? entry.getValue() : 0;
                // 20-foot types = 1 TEU, others = 2 TEU
                double factor = code.startsWith("20") ? 1.0 : 2.0;
                teu += qty * factor;
            }
        }
        this.lineTeu = BigDecimal.valueOf(teu);
    }
}
