package com.logitrack.backend.repository;

import com.logitrack.backend.entity.CnPricingAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CnPricingAdminRepository extends JpaRepository<CnPricingAdmin, Integer> {
    
    List<CnPricingAdmin> findByIsActiveTrueOrderByDisplayOrderAscNameAsc();
    
    Optional<CnPricingAdmin> findByName(String name);
    
    List<CnPricingAdmin> findAllByOrderByDisplayOrderAscNameAsc();
}
