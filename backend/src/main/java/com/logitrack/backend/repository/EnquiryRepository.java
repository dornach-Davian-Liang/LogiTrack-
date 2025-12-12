package com.logitrack.backend.repository;

import com.logitrack.backend.entity.EnquiryRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnquiryRepository extends JpaRepository<EnquiryRecord, String> {
    
    Optional<EnquiryRecord> findByReferenceNumber(String referenceNumber);
    
    List<EnquiryRecord> findByStatus(String status);
    
    List<EnquiryRecord> findBySalesCountry(String salesCountry);
    
    List<EnquiryRecord> findByBookingConfirmed(String bookingConfirmed);
}
