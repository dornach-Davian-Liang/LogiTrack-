// filepath: entity/ProductCargoAllowed.java
package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Product × Cargo Type 白名单关联实体 v3 - 匹配 dict_product_cargo_allowed 表
 */
@Entity
@Table(name = "dict_product_cargo_allowed")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(ProductCargoAllowed.PK.class)
public class ProductCargoAllowed {
    
    @Id
    @Column(name = "product_code", length = 20)
    private String productCode;
    
    @Id
    @Column(name = "cargo_type_code", length = 20)
    private String cargoTypeCode;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PK implements Serializable {
        private String productCode;
        private String cargoTypeCode;
    }
}
