package com.logitrack.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logitrack.backend.dto.LoginRequestDTO;
import com.logitrack.backend.dto.LoginResponseDTO;
import com.logitrack.backend.entity.Role;
import com.logitrack.backend.entity.User;
import com.logitrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 认证服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * 用户登录
     */
    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        if (!user.getIsActive()) {
            throw new RuntimeException("用户已被禁用");
        }
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        
        // 更新最后登录时间
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        
        // 收集所有权限
        List<String> allPermissions = new ArrayList<>();
        Set<String> roleNames = new HashSet<>();
        
        for (Role role : user.getRoles()) {
            roleNames.add(role.getRoleCode());
            try {
                List<String> permissions = objectMapper.readValue(
                    role.getPermissions(), 
                    new TypeReference<List<String>>() {}
                );
                allPermissions.addAll(permissions);
            } catch (Exception e) {
                log.error("解析角色权限失败: {}", role.getRoleCode(), e);
            }
        }
        
        // 生成简单token（实际项目中应使用JWT）
        String token = generateToken(user.getId(), user.getUsername());
        
        return LoginResponseDTO.builder()
            .userId(user.getId())
            .username(user.getUsername())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .token(token)
            .roles(roleNames)
            .permissions(allPermissions)
            .loginTime(LocalDateTime.now())
            .build();
    }
    
    /**
     * 检查用户权限
     */
    public boolean hasPermission(Integer userId, String permission) {
        User user = userRepository.findById(userId)
            .orElse(null);
        
        if (user == null || !user.getIsActive()) {
            return false;
        }
        
        for (Role role : user.getRoles()) {
            try {
                List<String> permissions = objectMapper.readValue(
                    role.getPermissions(), 
                    new TypeReference<List<String>>() {}
                );
                
                // 检查精确匹配或通配符匹配
                for (String p : permissions) {
                    if (p.equals(permission)) {
                        return true;
                    }
                    // 支持通配符，例如 "enquiry:*" 匹配 "enquiry:create"
                    if (p.endsWith(":*") && permission.startsWith(p.substring(0, p.length() - 1))) {
                        return true;
                    }
                }
            } catch (Exception e) {
                log.error("解析角色权限失败: {}", role.getRoleCode(), e);
            }
        }
        
        return false;
    }
    
    /**
     * 检查用户是否有指定角色
     */
    public boolean hasRole(Integer userId, String roleCode) {
        User user = userRepository.findById(userId)
            .orElse(null);
        
        if (user == null || !user.getIsActive()) {
            return false;
        }
        
        return user.getRoles().stream()
            .anyMatch(role -> role.getRoleCode().equals(roleCode));
    }
    
    /**
     * 生成Token（简化版本，实际应使用JWT）
     */
    private String generateToken(Integer userId, String username) {
        return Base64.getEncoder().encodeToString(
            (userId + ":" + username + ":" + System.currentTimeMillis()).getBytes()
        );
    }
    
    /**
     * 验证Token（简化版本）
     */
    public Integer validateToken(String token) {
        try {
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            if (parts.length >= 3) {
                return Integer.parseInt(parts[0]);
            }
        } catch (Exception e) {
            log.error("Token验证失败", e);
        }
        return null;
    }
}
