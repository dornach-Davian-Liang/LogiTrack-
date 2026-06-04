package com.logitrack.backend.repository;

import com.logitrack.backend.entity.DataQualityCheckConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DataQualityCheckConfigRepository extends JpaRepository<DataQualityCheckConfig, Integer> {
    // 全系统单行配置，id=1，直接用 findById(1) 即可
}
