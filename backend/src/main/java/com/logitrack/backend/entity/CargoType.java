package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cargo 类型字典实体类 v3 - 匹配 dict_cargo_type 表
 */
@Entity
@Table(name = "dict_cargo_type")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CargoType {
    
    @Id
    @Column(name = "code", length = 20)
    private String code;
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    @Column(name = "needs_container", nullable = false)
    private Boolean needsContainer = false;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
