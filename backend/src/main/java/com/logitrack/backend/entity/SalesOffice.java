package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 销售办公室字典实体类 - 匹配 MySQL dict_sales_office 表结构
 */
@Entity
@Table(name = "dict_sales_office")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesOffice {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "code", length = 50, unique = true, nullable = false)
    private String code;
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    @Column(name = "name_norm", length = 120, unique = true, nullable = false)
    private String nameNorm;
    
    @Column(name = "country_code", length = 10, columnDefinition = "char(10)")
    private String countryCode;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
    
    @Column(name = "remark", length = 255)
    private String remark;
    
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
