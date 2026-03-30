// filepath: repository/OfferPriceLineRepository.java
package com.logitrack.backend.repository;

import com.logitrack.backend.entity.OfferPriceLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfferPriceLineRepository extends JpaRepository<OfferPriceLine, Long> {
    
    List<OfferPriceLine> findByOfferIdOrderBySortOrder(Long offerId);
}
