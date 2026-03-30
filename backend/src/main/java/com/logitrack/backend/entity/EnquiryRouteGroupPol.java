// filepath: entity/EnquiryRouteGroupPol.java
package com.logitrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 混合模式路线组起运港关联 v3 - 匹配 enquiry_route_group_pol 表
 */
@Entity
@Table(name = "enquiry_route_group_pol")
@Data
@NoArgsConstructor
public class EnquiryRouteGroupPol {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "route_group_id", nullable = false)
    private Long routeGroupId;
    
    @Column(name = "port_id", nullable = false)
    private Integer portId;
}
