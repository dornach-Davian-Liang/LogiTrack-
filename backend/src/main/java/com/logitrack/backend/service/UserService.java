package com.logitrack.backend.service;

import com.logitrack.backend.dto.UserDTO;
import com.logitrack.backend.entity.Role;
import com.logitrack.backend.entity.User;
import com.logitrack.backend.repository.RoleRepository;
import com.logitrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 用户管理服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    /**
     * 获取所有用户
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * 获取用户列表（可包含禁用用户）
     */
    public List<UserDTO> getUsers(boolean includeInactive) {
        List<User> users;
        if (includeInactive) {
            users = userRepository.findAll();
        } else {
            users = java.util.stream.StreamSupport.stream(
                userRepository.findByIsActive(true).spliterator(),
                false
            ).collect(Collectors.toList());
        }

        return users.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * 根据ID获取用户
     */
    public UserDTO getUserById(Integer id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
        return convertToDTO(user);
    }
    
    /**
     * 根据用户名获取用户
     */
    public UserDTO getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
        return convertToDTO(user);
    }
    
    /**
     * 创建用户
     */
    @Transactional
    public UserDTO createUser(User user, Set<String> roleCodes) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        
        // 加密密码
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // 分配角色
        if (roleCodes != null && !roleCodes.isEmpty()) {
            Set<Role> roles = roleCodes.stream()
                .map(code -> roleRepository.findByRoleCode(code)
                    .orElseThrow(() -> new RuntimeException("角色不存在: " + code)))
                .collect(Collectors.toSet());
            user.setRoles(roles);
        }
        
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }
    
    /**
     * 更新用户
     */
    @Transactional
    public UserDTO updateUser(Integer id, User updateData, Set<String> roleCodes, boolean updateRoles) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        // 更新基本信息
        if (updateData.getFullName() != null) {
            user.setFullName(updateData.getFullName());
        }
        if (updateData.getEmail() != null) {
            user.setEmail(updateData.getEmail());
        }
        if (updateData.getPhone() != null) {
            user.setPhone(updateData.getPhone());
        }
        if (updateData.getIsActive() != null) {
            user.setIsActive(updateData.getIsActive());
        }
        if (updateData.getUpdatedBy() != null) {
            user.setUpdatedBy(updateData.getUpdatedBy());
        }
        
        // 更新密码（如果提供）
        if (updateData.getPassword() != null && !updateData.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updateData.getPassword()));
        }
        
        // 更新角色
        if (updateRoles) {
            Set<Role> roles = roleCodes.stream()
                .map(code -> roleRepository.findByRoleCode(code)
                    .orElseThrow(() -> new RuntimeException("角色不存在: " + code)))
                .collect(Collectors.toSet());
            user.setRoles(roles);
        }
        
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }
    
    /**
     * 删除用户
     */
    @Transactional
    public void deleteUser(Integer id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setIsActive(false);
        userRepository.save(user);
    }

    /**
     * 重置用户密码
     */
    @Transactional
    public void resetPassword(Integer id, String newPassword) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    
    /**
     * 转换为DTO
     */
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setIsActive(user.getIsActive());
        dto.setLastLoginAt(user.getLastLoginAt());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setCreatedBy(user.getCreatedBy());
        dto.setUpdatedBy(user.getUpdatedBy());
        dto.setRoleCodes(user.getRoles().stream()
            .map(Role::getRoleCode)
            .collect(Collectors.toSet()));
        dto.setRoleNames(user.getRoles().stream()
            .map(Role::getRoleName)
            .collect(Collectors.toSet()));
        return dto;
    }
}
