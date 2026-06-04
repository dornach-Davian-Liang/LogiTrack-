package com.logitrack.backend.controller;

import com.logitrack.backend.entity.Role;
import com.logitrack.backend.entity.User;
import com.logitrack.backend.repository.RoleRepository;
import com.logitrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 系统管理控制器 - 用于开发测试
 */
@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
@Slf4j
public class SystemController {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    /**
     * 重置用户密码（开发测试用）
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String newPassword = request.get("password");
        
        try {
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            // 加密密码
            String encodedPassword = passwordEncoder.encode(newPassword);
            user.setPassword(encodedPassword);
            userRepository.save(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "密码重置成功");
            response.put("username", username);
            response.put("encodedPassword", encodedPassword);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("重置密码失败", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 测试BCrypt密码加密
     */
    @PostMapping("/encode-password")
    public ResponseEntity<Map<String, String>> encodePassword(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        String encoded = passwordEncoder.encode(password);
        
        Map<String, String> response = new HashMap<>();
        response.put("original", password);
        response.put("encoded", encoded);
        response.put("matches", String.valueOf(passwordEncoder.matches(password, encoded)));
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 验证密码
     */
    @PostMapping("/verify-password")
    public ResponseEntity<Map<String, Object>> verifyPassword(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        
        try {
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            boolean matches = passwordEncoder.matches(password, user.getPassword());
            
            Map<String, Object> response = new HashMap<>();
            response.put("username", username);
            response.put("matches", matches);
            response.put("storedHash", user.getPassword());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("验证密码失败", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 修复用户角色关联（开发测试用）
     */
    @PostMapping("/fix-roles")
    public ResponseEntity<Map<String, Object>> fixUserRoles() {
        try {
            // admin -> ADMIN_USER
            User admin = userRepository.findByUsername("admin").orElseThrow();
            Role adminRole = roleRepository.findByRoleCode("ADMIN_USER").orElseThrow();
            admin.getRoles().clear();
            admin.getRoles().add(adminRole);
            userRepository.save(admin);
            
            // operator -> OPERATING_USER
            User operator = userRepository.findByUsername("operator").orElseThrow();
            Role operatorRole = roleRepository.findByRoleCode("OPERATING_USER").orElseThrow();
            operator.getRoles().clear();
            operator.getRoles().add(operatorRole);
            userRepository.save(operator);
            
            // viewer -> NORMAL_USER
            User viewer = userRepository.findByUsername("viewer").orElseThrow();
            Role viewerRole = roleRepository.findByRoleCode("NORMAL_USER").orElseThrow();
            viewer.getRoles().clear();
            viewer.getRoles().add(viewerRole);
            userRepository.save(viewer);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "用户角色关联修复成功");
            response.put("fixed", Map.of(
                "admin", adminRole.getRoleName(),
                "operator", operatorRole.getRoleName(),
                "viewer", viewerRole.getRoleName()
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("修复角色关联失败", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
