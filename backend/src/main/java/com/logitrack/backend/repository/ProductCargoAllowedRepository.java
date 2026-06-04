// filepath: repository/ProductCargoAllowedRepository.java
package com.logitrack.backend.repository;

import com.logitrack.backend.entity.ProductCargoAllowed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductCargoAllowedRepository extends JpaRepository<ProductCargoAllowed, ProductCargoAllowed.PK> {
    
    List<ProductCargoAllowed> findByProductCode(String productCode);
    
    @Query("SELECT pca.cargoTypeCode FROM ProductCargoAllowed pca WHERE pca.productCode = :productCode")
    List<String> findCargoTypeCodesByProductCode(@Param("productCode") String productCode);
}
