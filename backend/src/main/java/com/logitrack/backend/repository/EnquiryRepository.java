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
import java.time.LocalDateTime;
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

    /**
     * 使用 FOR UPDATE 悲观锁查询当月最大序号，防止并发创建时产生重复 ref_number。
     * 在同一事务中持有行锁直到提交，确保序号计算和插入的原子性。
     */
    @Query(value = "SELECT COALESCE(MAX(monthly_sequence), 0) FROM enquiry WHERE reference_month = :referenceMonth FOR UPDATE", nativeQuery = true)
    Integer findMaxMonthlySequenceForUpdate(@Param("referenceMonth") String referenceMonth);

    @Query("SELECT COALESCE(MAX(e.serialNumber), 0) FROM Enquiry e WHERE e.referenceMonth = :referenceMonth AND e.monthlySequence = :monthlySequence AND e.productAbbr = :productAbbr")
    Integer findMaxSerialNumber(@Param("referenceMonth") String referenceMonth,
                               @Param("monthlySequence") Integer monthlySequence,
                               @Param("productAbbr") String productAbbr);
    
    List<Enquiry> findByEnquiryReceivedDateBetween(LocalDate startDate, LocalDate endDate);

    // 数据质检：直接查询 AI 自动建单的询价单（created_by='email-ai-bot'，按创建时间过滤）
    @Query("SELECT e FROM Enquiry e WHERE e.createdBy = :createdBy AND e.enquiryCreatedDate >= :since ORDER BY e.enquiryCreatedDate DESC")
    List<Enquiry> findByCreatedBySince(@Param("createdBy") String createdBy, @Param("since") LocalDateTime since);
}
