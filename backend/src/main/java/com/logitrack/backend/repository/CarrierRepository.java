package com.logitrack.backend.repository;

import com.logitrack.backend.entity.Carrier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarrierRepository extends JpaRepository<Carrier, Integer> {

    List<Carrier> findByIsActiveTrueOrderBySortOrderAscCarrierNameAsc();

    List<Carrier> findAllByOrderBySortOrderAscCarrierNameAsc();

    Optional<Carrier> findByCarrierCode(String carrierCode);
}
