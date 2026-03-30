// filepath: entity/LostReason.java
package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 丢单原因字典实体 v3 - 匹配 dict_lost_reason 表
 */
@Entity
@Table(name = "dict_lost_reason")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LostReason {
    
    @Id
    @Column(name = "code", length = 100)
    private String code;
    
    @Column(name = "label", length = 200, nullable = false)
    private String label;
    
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
