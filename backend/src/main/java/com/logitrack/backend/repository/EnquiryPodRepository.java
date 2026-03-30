package com.logitrack.backend.repository;

import com.logitrack.backend.entity.EnquiryPod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnquiryPodRepository extends JpaRepository<EnquiryPod, Long> {
    
    /**
     * 根据询价ID查找所有目的港
     */
    List<EnquiryPod> findByEnquiryId(Long enquiryId);
    
    @Modifying
    @Query("DELETE FROM EnquiryPod ep WHERE ep.enquiryId = :enquiryId")
    void deleteByEnquiryId(@Param("enquiryId") Long enquiryId);
}
