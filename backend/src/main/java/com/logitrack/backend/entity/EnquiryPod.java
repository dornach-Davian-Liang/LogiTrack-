package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 询价-目的港关联表 v3
 */
@Entity
@Table(name = "enquiry_pod")
@Data
@NoArgsConstructor
public class EnquiryPod {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "enquiry_id", nullable = false)
    private Long enquiryId;
    
    @Column(name = "port_id", nullable = false)
    private Integer portId;
}
