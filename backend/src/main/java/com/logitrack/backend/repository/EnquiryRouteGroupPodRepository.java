// filepath: repository/EnquiryRouteGroupPodRepository.java
package com.logitrack.backend.repository;

import com.logitrack.backend.entity.EnquiryRouteGroupPod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnquiryRouteGroupPodRepository extends JpaRepository<EnquiryRouteGroupPod, Long> {
    
    List<EnquiryRouteGroupPod> findByRouteGroupId(Long routeGroupId);
    
    void deleteByRouteGroupId(Long routeGroupId);
}
