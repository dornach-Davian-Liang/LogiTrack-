package com.logitrack.backend.repository;

import com.logitrack.backend.entity.Offer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {
    
    List<Offer> findByEnquiryId(Long enquiryId);
    
    Page<Offer> findByEnquiryId(Long enquiryId, Pageable pageable);
    
    List<Offer> findByIsLatestTrue();
    
    long countByEnquiryId(Long enquiryId);
}
