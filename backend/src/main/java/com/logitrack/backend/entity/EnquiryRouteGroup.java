// filepath: entity/EnquiryRouteGroup.java
package com.logitrack.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 混合模式路线组实体 v3 - 匹配 enquiry_route_group 表
 */
@Entity
@Table(name = "enquiry_route_group")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnquiryRouteGroup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "enquiry_id", nullable = false)
    private Long enquiryId;
    
    @Column(name = "group_index", nullable = false)
    private Integer groupIndex = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "sub_mode", nullable = false)
    private SubMode subMode;
    
    @Transient
    private List<Integer> polIds = new ArrayList<>();
    
    @Transient
    private List<Integer> podIds = new ArrayList<>();
    
    public enum SubMode {
        AIR, SEA, RAIL
    }
}
