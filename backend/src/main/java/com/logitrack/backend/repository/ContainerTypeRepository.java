package com.logitrack.backend.repository;

import com.logitrack.backend.entity.ContainerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContainerTypeRepository extends JpaRepository<ContainerType, Integer> {
    
    List<ContainerType> findByIsActiveTrue();
    
    List<ContainerType> findByIsActiveTrueOrderByContainerCodeAsc();
    
    /** 全量查询（含 inactive），按 containerCode 字母序 — 供管理页面使用 */
    List<ContainerType> findAllByOrderByContainerCodeAsc();
    
    Optional<ContainerType> findByContainerCode(String containerCode);
}
