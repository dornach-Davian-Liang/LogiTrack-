package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 销售负责人实体类 - 匹配 MySQL sales_pic 表结构
 */
@Entity
@Table(name = "sales_pic")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesPic {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    @Column(name = "name_norm", length = 120, nullable = false)
    private String nameNorm;
    
    @Column(name = "country_code", length = 10, columnDefinition = "char(10)", nullable = false)
    private String countryCode;
    
    @Column(name = "sales_office_id", nullable = false)
    private Integer salesOfficeId;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (nameNorm == null && name != null) {
            nameNorm = name.toUpperCase().trim();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
