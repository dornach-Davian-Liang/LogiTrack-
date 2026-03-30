// filepath: repository/LostReasonRepository.java
package com.logitrack.backend.repository;

import com.logitrack.backend.entity.LostReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LostReasonRepository extends JpaRepository<LostReason, String> {
    
    List<LostReason> findAllByOrderBySortOrderAsc();
}
