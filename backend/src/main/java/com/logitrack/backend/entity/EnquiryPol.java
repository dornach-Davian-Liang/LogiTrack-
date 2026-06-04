package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 询价-起运港关联表 v3
 */
@Entity
@Table(name = "enquiry_pol")
@Data
@NoArgsConstructor
public class EnquiryPol {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "enquiry_id", nullable = false)
    private Long enquiryId;
    
    @Column(name = "port_id", nullable = false)
    private Integer portId;
}
