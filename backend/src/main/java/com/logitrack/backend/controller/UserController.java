package com.logitrack.backend.controller;

import com.logitrack.backend.dto.UserDTO;
import com.logitrack.backend.entity.User;
import com.logitrack.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 用户管理控制器
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    
    private final UserService userService;
    
    /**
     * 获取所有用户
     */
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    
    /**
     * 获取单个用户
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Integer id) {
        try {
            UserDTO user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            log.error("获取用户失败: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * 创建用户
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> request) {
        try {
            User user = new User();
            user.setUsername((String) request.get("username"));
            user.setPassword((String) request.get("password"));
            user.setFullName((String) request.get("fullName"));
            user.setEmail((String) request.get("email"));
            user.setPhone((String) request.get("phone"));
            user.setIsActive(true);
            
            @SuppressWarnings("unchecked")
            Set<String> roleCodes = (Set<String>) request.get("roleCodes");
            
            UserDTO created = userService.createUser(user, roleCodes);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            log.error("创建用户失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 更新用户
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
        @PathVariable Integer id,
        @RequestBody Map<String, Object> request
    ) {
        try {
            User updateData = new User();
            if (request.containsKey("fullName")) {
                updateData.setFullName((String) request.get("fullName"));
            }
            if (request.containsKey("email")) {
                updateData.setEmail((String) request.get("email"));
            }
            if (request.containsKey("phone")) {
                updateData.setPhone((String) request.get("phone"));
            }
            if (request.containsKey("isActive")) {
                updateData.setIsActive((Boolean) request.get("isActive"));
            }
            if (request.containsKey("password")) {
                updateData.setPassword((String) request.get("password"));
            }
            
            @SuppressWarnings("unchecked")
            Set<String> roleCodes = (Set<String>) request.get("roleCodes");
            
            UserDTO updated = userService.updateUser(id, updateData, roleCodes);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("更新用户失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 删除用户
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "用户删除成功"));
        } catch (Exception e) {
            log.error("删除用户失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
