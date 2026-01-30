package com.logitrack.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 询价箱型明细实体类 - 匹配 MySQL enquiry_container_line 表结构
 */
@Entity
@Table(name = "enquiry_container_line")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnquiryContainerLine {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enquiry_id", nullable = false)
    private Enquiry enquiry;
    
    @Column(name = "container_type_id", nullable = false)
    private Integer containerTypeId;
    
    @Column(name = "container_qty", nullable = false)
    private Integer containerQty;
    
    @Column(name = "raw_text", length = 200)
    private String rawText;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
