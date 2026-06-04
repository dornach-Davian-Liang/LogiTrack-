// filepath: repository/CancelledReasonRepository.java
package com.logitrack.backend.repository;

import com.logitrack.backend.entity.CancelledReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CancelledReasonRepository extends JpaRepository<CancelledReason, String> {
    
    List<CancelledReason> findAllByOrderBySortOrderAsc();
}
