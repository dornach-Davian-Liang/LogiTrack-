// filepath: repository/SalesCountryRepository.java
package com.logitrack.backend.repository;

import com.logitrack.backend.entity.SalesCountry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesCountryRepository extends JpaRepository<SalesCountry, String> {
    
    List<SalesCountry> findByIsActiveTrueOrderBySortOrderAsc();
}
