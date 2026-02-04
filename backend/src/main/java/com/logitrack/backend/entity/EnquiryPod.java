package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 询价-目的港关联表（多对多）
 */
@Entity
@Table(name = "enquiry_pod")
@Data
public class EnquiryPod {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "enquiry_id", nullable = false)
    private Long enquiryId;
    
    @Column(name = "port_id", nullable = false)
    private Integer portId;
    
    @Column(name = "sequence", nullable = false)
    private Integer sequence = 1;  // 顺序，1=主要港口
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
