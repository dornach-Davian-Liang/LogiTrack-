package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 销售 PIC 实体类 v3 - 匹配 dict_sales_pic 表
 */
@Entity
@Table(name = "dict_sales_pic")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesPic {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    @Column(name = "sales_country_code", length = 50, nullable = false)
    private String salesCountryCode;
    
    @Column(name = "sales_office_id", nullable = false)
    private Integer salesOfficeId;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
