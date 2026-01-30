package com.logitrack.backend.repository;

import com.logitrack.backend.entity.Port;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortRepository extends JpaRepository<Port, Integer> {
    
    List<Port> findByCountryCode(String countryCode);
    
    List<Port> findByCountryCodeAndIsActiveTrue(String countryCode);
    
    List<Port> findByPortType(Port.PortType portType);
    
    @Query("SELECT p FROM Port p WHERE p.countryCode = :countryCode AND p.isActive = true ORDER BY p.portName ASC")
    List<Port> findActivePortsByCountry(@Param("countryCode") String countryCode);
    
    @Query("SELECT p FROM Port p WHERE p.portName LIKE %:keyword% OR p.portCode LIKE %:keyword%")
    List<Port> searchPorts(@Param("keyword") String keyword);
}
