package com.logitrack.backend.repository;

import com.logitrack.backend.entity.DataQualityVerified;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;

@Repository
public interface DataQualityVerifiedRepository extends JpaRepository<DataQualityVerified, Long> {

    /** 根据询价单 ID 查找核验记录 */
    Optional<DataQualityVerified> findByEnquiryId(Long enquiryId);

    /** 判断询价单是否已核验 */
    boolean existsByEnquiryId(Long enquiryId);

    /** 删除指定询价单的核验记录（撤销核验） */
    void deleteByEnquiryId(Long enquiryId);

    /** 批量查询已核验的询价单 ID 集合（避免 N+1） */
    @Query("SELECT v.enquiryId FROM DataQualityVerified v WHERE v.enquiryId IN :ids")
    Set<Long> findVerifiedEnquiryIds(@Param("ids") Collection<Long> ids);
}
