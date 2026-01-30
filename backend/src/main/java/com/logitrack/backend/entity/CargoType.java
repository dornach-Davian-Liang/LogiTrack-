package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 运输类型字典实体类 - 匹配 MySQL dict_cargo_type 表结构
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
    
    @Enumerated(EnumType.STRING)
    @Column(name = "offer_type", nullable = false)
    private OfferType offerType;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    public enum OfferType {
        OCEAN, AIR, OTHER
    }
}
