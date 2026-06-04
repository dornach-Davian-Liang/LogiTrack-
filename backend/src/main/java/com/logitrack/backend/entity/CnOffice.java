package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CN办公室字典实体类 - 匹配 MySQL dict_cn_office 表结构
 */
@Entity
@Table(name = "dict_cn_office")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CnOffice {
    
    @Id
    @Column(name = "code", length = 50)
    private String code;
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
