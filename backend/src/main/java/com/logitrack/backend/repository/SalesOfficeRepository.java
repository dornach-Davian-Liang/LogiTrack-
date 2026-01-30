package com.logitrack.backend.repository;

import com.logitrack.backend.entity.SalesOffice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOfficeRepository extends JpaRepository<SalesOffice, Integer> {
    
    List<SalesOffice> findByIsActiveTrue();
    
    List<SalesOffice> findByIsActiveTrueOrderByNameAsc();
    
    List<SalesOffice> findByCountryCode(String countryCode);
    
    Optional<SalesOffice> findByCode(String code);
}
