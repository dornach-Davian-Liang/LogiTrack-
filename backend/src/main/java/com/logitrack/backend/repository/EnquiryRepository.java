package com.logitrack.backend.repository;

import com.logitrack.backend.entity.Enquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnquiryRepository extends JpaRepository<Enquiry, Long>, JpaSpecificationExecutor<Enquiry> {
    
    Optional<Enquiry> findByReferenceNumber(String referenceNumber);
    
    List<Enquiry> findByStatus(Enquiry.EnquiryStatus status);
    
    List<Enquiry> findBySalesCountryCode(String salesCountryCode);
    
    Page<Enquiry> findBySalesCountryCode(String salesCountryCode, Pageable pageable);
    
    @Query("SELECT e FROM Enquiry e WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "e.referenceNumber LIKE %:keyword% OR " +
           "e.salesCountryCode LIKE %:keyword% OR " +
           "e.commodity LIKE %:keyword%)")
    Page<Enquiry> searchEnquiries(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT COUNT(e) FROM Enquiry e WHERE e.status = :status")
    long countByStatus(@Param("status") Enquiry.EnquiryStatus status);

    // Count enquiries by reference month (YYMM)
    long countByReferenceMonth(String referenceMonth);

    @Query("SELECT COALESCE(MAX(e.monthlySequence), 0) FROM Enquiry e WHERE e.referenceMonth = :referenceMonth")
    Integer findMaxMonthlySequence(@Param("referenceMonth") String referenceMonth);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Enquiry e WHERE e.referenceMonth = :referenceMonth ORDER BY e.monthlySequence DESC LIMIT 1")
    Optional<Enquiry> findLatestEnquiryByMonth(@Param("referenceMonth") String referenceMonth);

    @Query("SELECT COALESCE(MAX(e.serialNumber), 0) FROM Enquiry e WHERE e.referenceMonth = :referenceMonth AND e.monthlySequence = :monthlySequence AND e.productAbbr = :productAbbr")
    Integer findMaxSerialNumber(@Param("referenceMonth") String referenceMonth,
                               @Param("monthlySequence") Integer monthlySequence,
                               @Param("productAbbr") String productAbbr);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Enquiry e WHERE e.referenceMonth = :referenceMonth AND e.monthlySequence = :monthlySequence AND e.productAbbr = :productAbbr ORDER BY e.serialNumber DESC LIMIT 1")
    Optional<Enquiry> findLatestEnquiryByMonthSequenceProduct(@Param("referenceMonth") String referenceMonth,
                                                               @Param("monthlySequence") Integer monthlySequence,
                                                               @Param("productAbbr") String productAbbr);
    
    // For statistics - find enquiries by date range
    List<Enquiry> findByEnquiryReceivedDateBetween(LocalDate startDate, LocalDate endDate);
}
