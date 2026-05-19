// filepath: repository/EnquiryRouteGroupPodRepository.java
package com.logitrack.backend.repository;

import com.logitrack.backend.entity.EnquiryRouteGroupPod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnquiryRouteGroupPodRepository extends JpaRepository<EnquiryRouteGroupPod, Long> {
    
    List<EnquiryRouteGroupPod> findByRouteGroupId(Long routeGroupId);

    /**
     * 批量查询多个路由组ID的目的港（避免 N+1）
     */
    List<EnquiryRouteGroupPod> findByRouteGroupIdIn(java.util.Collection<Long> routeGroupIds);
    
    void deleteByRouteGroupId(Long routeGroupId);
}
