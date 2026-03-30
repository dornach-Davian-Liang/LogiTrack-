// filepath: repository/EnquiryRouteGroupRepository.java
package com.logitrack.backend.repository;

import com.logitrack.backend.entity.EnquiryRouteGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnquiryRouteGroupRepository extends JpaRepository<EnquiryRouteGroup, Long> {
    
    List<EnquiryRouteGroup> findByEnquiryIdOrderByGroupIndex(Long enquiryId);
    
    void deleteByEnquiryId(Long enquiryId);
}
