package com.logitrack.backend.repository;

import com.logitrack.backend.entity.DataQualityCheckHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DataQualityCheckHistoryRepository extends JpaRepository<DataQualityCheckHistory, Long> {

    /** 最近 N 条执行历史，用于前端列表展示 */
    List<DataQualityCheckHistory> findTop30ByOrderByExecutedAtDesc();

    /** 查询指定时间段内的历史（用于趋势图） */
    @Query("SELECT h FROM DataQualityCheckHistory h WHERE h.executedAt >= :since ORDER BY h.executedAt ASC")
    List<DataQualityCheckHistory> findSince(@Param("since") LocalDateTime since);
}
