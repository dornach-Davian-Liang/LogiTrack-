package com.logitrack.backend.repository;

import com.logitrack.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    
    List<Product> findByIsActiveTrue();
    
    List<Product> findByIsActiveTrueOrderByNameAsc();
}
