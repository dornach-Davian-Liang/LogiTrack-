package com.logitrack.backend.repository;

import com.logitrack.backend.entity.Currency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CurrencyRepository extends JpaRepository<Currency, Integer> {

    List<Currency> findByIsActiveTrueOrderBySortOrderAscCurrencyCodeAsc();

    List<Currency> findAllByOrderBySortOrderAscCurrencyCodeAsc();
}
