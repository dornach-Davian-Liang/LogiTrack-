package com.logitrack.backend.repository;

import com.logitrack.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 角色数据访问层
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    
    /**
     * 根据角色代码查找角色
     */
    Optional<Role> findByRoleCode(String roleCode);
    
    /**
     * 查找所有激活的角色
     */
    Iterable<Role> findByIsActive(Boolean isActive);
}
