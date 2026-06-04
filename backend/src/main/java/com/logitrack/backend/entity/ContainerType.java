package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 箱型配置实体类 - 匹配 MySQL container_types 表结构
 */
@Entity
@Table(name = "container_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContainerType {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "container_code", length = 20, unique = true, nullable = false)
    private String containerCode;
    
    @Column(name = "container_name", length = 50, nullable = false)
    private String containerName;
    
    @Column(name = "teu_value", precision = 6, scale = 2, nullable = false)
    private BigDecimal teuValue;
    
    @Column(name = "length_feet")
    private Integer lengthFeet;
    
    @Column(name = "is_special", nullable = false)
    private Boolean isSpecial = false;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
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
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
