package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 港口/机场主数据实体类 - 匹配 MySQL port 表结构
 */
@Entity
@Table(name = "port")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Port {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "port_code", length = 10, nullable = false)
    private String portCode;
    
    @Column(name = "port_name", length = 200, nullable = false)
    private String portName;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "port_type", nullable = false)
    private PortType portType;
    
    @Column(name = "country_code", length = 2, columnDefinition = "char(2)")
    private String countryCode;
    
    @Column(name = "city", length = 100)
    private String city;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum PortType {
        AIR, SEA
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
