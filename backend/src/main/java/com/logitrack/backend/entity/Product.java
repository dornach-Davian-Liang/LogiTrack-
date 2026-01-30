package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 产品字典实体类 - 匹配 MySQL dict_product 表结构
 */
@Entity
@Table(name = "dict_product")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    
    @Id
    @Column(name = "code", length = 30)
    private String code;
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    @Column(name = "abbr", length = 10, nullable = false)
    private String abbr;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
