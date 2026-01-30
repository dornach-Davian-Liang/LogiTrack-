package com.logitrack.backend.repository;

import com.logitrack.backend.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CountryRepository extends JpaRepository<Country, Integer> {
    
    List<Country> findByIsActiveTrue();
    
    List<Country> findByIsActiveTrueOrderByCountryNameEnAsc();
    
    Optional<Country> findByCountryCode(String countryCode);
}
