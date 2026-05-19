// filepath: repository/EnquiryRouteGroupPolRepository.java
package com.logitrack.backend.repository;

import com.logitrack.backend.entity.EnquiryRouteGroupPol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnquiryRouteGroupPolRepository extends JpaRepository<EnquiryRouteGroupPol, Long> {
    
    List<EnquiryRouteGroupPol> findByRouteGroupId(Long routeGroupId);

    /**
     * 批量查询多个路由组ID的起运港（避免 N+1）
     */
    List<EnquiryRouteGroupPol> findByRouteGroupIdIn(java.util.Collection<Long> routeGroupIds);
    
    void deleteByRouteGroupId(Long routeGroupId);
}
