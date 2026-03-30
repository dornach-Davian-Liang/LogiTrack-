package com.logitrack.backend.repository;

import com.logitrack.backend.entity.SalesPic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesPicRepository extends JpaRepository<SalesPic, Integer> {
    
    List<SalesPic> findByIsActiveTrue();
    
    List<SalesPic> findBySalesCountryCode(String salesCountryCode);
    
    List<SalesPic> findBySalesCountryCodeAndIsActiveTrue(String salesCountryCode);
    
    @Query("SELECT sp FROM SalesPic sp WHERE sp.salesCountryCode = :countryCode AND sp.isActive = true ORDER BY sp.name ASC")
    List<SalesPic> findActiveSalesPicsByCountry(@Param("countryCode") String countryCode);
    
    @Query("SELECT DISTINCT sp.salesCountryCode FROM SalesPic sp WHERE sp.isActive = true ORDER BY sp.salesCountryCode ASC")
    List<String> findDistinctCountryCodes();
    
    List<SalesPic> findBySalesOfficeId(Integer salesOfficeId);
}
