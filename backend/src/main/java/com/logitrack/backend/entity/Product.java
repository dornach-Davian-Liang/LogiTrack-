package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 产品字典实体类 v3 - 匹配 dict_product 表
 */
@Entity
@Table(name = "dict_product")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    
    @Id
    @Column(name = "code", length = 20)
    private String code;
    
    @Column(name = "abbr", length = 10, nullable = false)
    private String abbr;
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    @Column(name = "is_mixed", nullable = false)
    private Boolean isMixed = false;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
