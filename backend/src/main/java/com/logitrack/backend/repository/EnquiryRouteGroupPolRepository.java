// filepath: repository/EnquiryRouteGroupPolRepository.java
package com.logitrack.backend.repository;

import com.logitrack.backend.entity.EnquiryRouteGroupPol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnquiryRouteGroupPolRepository extends JpaRepository<EnquiryRouteGroupPol, Long> {
    
    List<EnquiryRouteGroupPol> findByRouteGroupId(Long routeGroupId);
    
    void deleteByRouteGroupId(Long routeGroupId);
}
