package com.logitrack.backend.repository;

import com.logitrack.backend.entity.CnOffice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CnOfficeRepository extends JpaRepository<CnOffice, String> {
    
    List<CnOffice> findByIsActiveTrue();
    
    List<CnOffice> findByIsActiveTrueOrderByNameAsc();
}
