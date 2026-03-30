// filepath: entity/CancelledReason.java
package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 取消原因字典实体 v3 - 匹配 dict_cancelled_reason 表
 */
@Entity
@Table(name = "dict_cancelled_reason")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancelledReason {
    
    @Id
    @Column(name = "code", length = 50)
    private String code;
    
    @Column(name = "label", length = 200, nullable = false)
    private String label;
    
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
