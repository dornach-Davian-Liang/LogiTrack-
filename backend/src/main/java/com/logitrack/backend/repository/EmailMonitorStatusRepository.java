package com.logitrack.backend.repository;

import com.logitrack.backend.entity.EmailMonitorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailMonitorStatusRepository extends JpaRepository<EmailMonitorStatus, Long> {

    // 获取最新一条状态快照
    Optional<EmailMonitorStatus> findTopByOrderByRecordedAtDesc();
}
