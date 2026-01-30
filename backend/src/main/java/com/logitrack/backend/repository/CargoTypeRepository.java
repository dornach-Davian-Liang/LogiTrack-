package com.logitrack.backend.repository;

import com.logitrack.backend.entity.CargoType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CargoTypeRepository extends JpaRepository<CargoType, String> {
    
    List<CargoType> findByIsActiveTrue();
    
    List<CargoType> findByOfferType(CargoType.OfferType offerType);
    
    List<CargoType> findByOfferTypeAndIsActiveTrue(CargoType.OfferType offerType);
}
