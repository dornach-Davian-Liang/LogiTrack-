package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 已核验标记（业务人员补充数据后标记，排除后续质检报告）
 * 对应 data_quality_verified 表
 */
@Entity
@Table(name = "data_quality_verified")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DataQualityVerified {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 对应询价单的 ID */
    @Column(name = "enquiry_id", nullable = false, unique = true)
    private Long enquiryId;

    /** 核验操作人用户名 */
    @Column(name = "verified_by", nullable = false, length = 100)
    private String verifiedBy;

    /** 核验时间 */
    @Column(name = "verified_at", nullable = false)
    private LocalDateTime verifiedAt;

    /** 核验备注 */
    @Column(name = "note", length = 500)
    private String note;

    @PrePersist
    protected void onCreate() {
        if (this.verifiedAt == null) {
            this.verifiedAt = LocalDateTime.now();
        }
    }
}
