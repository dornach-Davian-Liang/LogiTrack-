package com.logitrack.backend.repository;

import com.logitrack.backend.entity.EnquiryPol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnquiryPolRepository extends JpaRepository<EnquiryPol, Long> {
    
    /**
     * 根据询价ID查找所有起运港
     */
    List<EnquiryPol> findByEnquiryId(Long enquiryId);

    /**
     * 批量查询多个询价ID的起运港（避免 N+1）
     */
    List<EnquiryPol> findByEnquiryIdIn(java.util.Collection<Long> enquiryIds);
    
    @Modifying
    @Query("DELETE FROM EnquiryPol ep WHERE ep.enquiryId = :enquiryId")
    void deleteByEnquiryId(@Param("enquiryId") Long enquiryId);
}
