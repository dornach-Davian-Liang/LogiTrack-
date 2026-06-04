// filepath: entity/SalesCountry.java
package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 销售国家/Agent 字典实体 v3 - 匹配 dict_sales_country 表
 */
@Entity
@Table(name = "dict_sales_country")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesCountry {
    
    @Id
    @Column(name = "code", length = 50)
    private String code;
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
