package com.logitrack.backend.repository;

import com.logitrack.backend.entity.Enquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnquiryRepository extends JpaRepository<Enquiry, Long>, JpaSpecificationExecutor<Enquiry> {
    
    Optional<Enquiry> findByRefNumber(String refNumber);
    
    List<Enquiry> findByStatus(Enquiry.EnquiryStatus status);
    
    List<Enquiry> findBySalesCountryCode(String salesCountryCode);
    
    Page<Enquiry> findBySalesCountryCode(String salesCountryCode, Pageable pageable);
    
    @Query("SELECT e FROM Enquiry e WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "e.refNumber LIKE %:keyword% OR " +
           "e.salesCountryCode LIKE %:keyword% OR " +
           "e.commodity LIKE %:keyword%)")
    Page<Enquiry> searchEnquiries(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT COUNT(e) FROM Enquiry e WHERE e.status = :status")
    long countByStatus(@Param("status") Enquiry.EnquiryStatus status);

    long countByReferenceMonth(String referenceMonth);

    @Query("SELECT COALESCE(MAX(e.monthlySequence), 0) FROM Enquiry e WHERE e.referenceMonth = :referenceMonth")
    Integer findMaxMonthlySequence(@Param("referenceMonth") String referenceMonth);

    @Query("SELECT COALESCE(MAX(e.serialNumber), 0) FROM Enquiry e WHERE e.referenceMonth = :referenceMonth AND e.monthlySequence = :monthlySequence AND e.productAbbr = :productAbbr")
    Integer findMaxSerialNumber(@Param("referenceMonth") String referenceMonth,
                               @Param("monthlySequence") Integer monthlySequence,
                               @Param("productAbbr") String productAbbr);
    
    List<Enquiry> findByEnquiryReceivedDateBetween(LocalDate startDate, LocalDate endDate);
}
