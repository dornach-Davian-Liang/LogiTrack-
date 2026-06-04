// filepath: repository/OfferContainerDetailRepository.java
package com.logitrack.backend.repository;

import com.logitrack.backend.entity.OfferContainerDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfferContainerDetailRepository extends JpaRepository<OfferContainerDetail, Long> {
    
    List<OfferContainerDetail> findByPriceLineId(Long priceLineId);
}
