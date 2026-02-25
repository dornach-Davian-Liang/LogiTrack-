package com.logitrack.backend.controller;

import com.logitrack.backend.dto.UserDTO;
import com.logitrack.backend.entity.Role;
import com.logitrack.backend.entity.User;
import com.logitrack.backend.repository.RoleRepository;
import com.logitrack.backend.service.UserService;
import com.logitrack.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashSet;
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
    private final AuthService authService;
    private final RoleRepository roleRepository;

    private Integer resolveAdminUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        Integer userId = authService.resolveUserIdFromAuthHeader(authHeader);
        if (userId == null) {
            return null;
        }
        return authService.isAdmin(userId) ? userId : null;
    }

    private ResponseEntity<?> unauthorizedResponse() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "未授权：请先登录"));
    }

    private ResponseEntity<?> forbiddenResponse() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("error", "访问被拒绝：仅管理员可操作"));
    }

    private Set<String> parseRoleCodes(Object roleCodesObj) {
        if (roleCodesObj == null) {
            return new HashSet<>();
        }
        if (roleCodesObj instanceof Set) {
            return new HashSet<>((Set<String>) roleCodesObj);
        }
        if (roleCodesObj instanceof List) {
            List<?> rawList = (List<?>) roleCodesObj;
            Set<String> result = new HashSet<>();
            for (Object item : rawList) {
                if (item != null) {
                    result.add(String.valueOf(item));
                }
            }
            return result;
        }
        return new HashSet<>();
    }

    private String generateTemporaryPassword() {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            sb.append(alphabet.charAt(random.nextInt(alphabet.length())));
        }
        return sb.toString();
    }
    
    /**
     * 获取所有用户
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers(
        HttpServletRequest request,
        @RequestParam(defaultValue = "false") boolean includeInactive
    ) {
        Integer adminUserId = resolveAdminUserId(request);
        if (adminUserId == null) {
            String authHeader = request.getHeader("Authorization");
            return authService.resolveUserIdFromAuthHeader(authHeader) == null
                ? unauthorizedResponse()
                : forbiddenResponse();
        }

        List<UserDTO> users = userService.getUsers(includeInactive);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 获取单个用户
     */
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<?> getUserById(HttpServletRequest request, @PathVariable Integer id) {
        Integer adminUserId = resolveAdminUserId(request);
        if (adminUserId == null) {
            String authHeader = request.getHeader("Authorization");
            return authService.resolveUserIdFromAuthHeader(authHeader) == null
                ? unauthorizedResponse()
                : forbiddenResponse();
        }
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
    public ResponseEntity<?> createUser(
        HttpServletRequest request,
        @RequestBody Map<String, Object> body
    ) {
        Integer adminUserId = resolveAdminUserId(request);
        if (adminUserId == null) {
            String authHeader = request.getHeader("Authorization");
            return authService.resolveUserIdFromAuthHeader(authHeader) == null
                ? unauthorizedResponse()
                : forbiddenResponse();
        }
        try {
            User user = new User();
            user.setUsername((String) body.get("username"));
            user.setPassword((String) body.get("password"));
            user.setFullName((String) body.get("fullName"));
            user.setEmail((String) body.get("email"));
            user.setPhone((String) body.get("phone"));
            user.setIsActive(true);
            user.setCreatedBy(String.valueOf(adminUserId));
            user.setUpdatedBy(String.valueOf(adminUserId));
            
            Set<String> roleCodes = parseRoleCodes(body.get("roleCodes"));
            
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
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<?> updateUser(
        HttpServletRequest request,
        @PathVariable Integer id,
        @RequestBody Map<String, Object> body
    ) {
        Integer adminUserId = resolveAdminUserId(request);
        if (adminUserId == null) {
            String authHeader = request.getHeader("Authorization");
            return authService.resolveUserIdFromAuthHeader(authHeader) == null
                ? unauthorizedResponse()
                : forbiddenResponse();
        }
        try {
            User updateData = new User();
            if (body.containsKey("fullName")) {
                updateData.setFullName((String) body.get("fullName"));
            }
            if (body.containsKey("email")) {
                updateData.setEmail((String) body.get("email"));
            }
            if (body.containsKey("phone")) {
                updateData.setPhone((String) body.get("phone"));
            }
            if (body.containsKey("isActive")) {
                updateData.setIsActive((Boolean) body.get("isActive"));
            }
            if (body.containsKey("password")) {
                updateData.setPassword((String) body.get("password"));
            }
            
            boolean updateRoles = body.containsKey("roleCodes");
            Set<String> roleCodes = updateRoles ? parseRoleCodes(body.get("roleCodes")) : new HashSet<>();
            
            updateData.setUpdatedBy(String.valueOf(adminUserId));
            UserDTO updated = userService.updateUser(id, updateData, roleCodes, updateRoles);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("更新用户失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 删除用户
     */
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<?> deleteUser(HttpServletRequest request, @PathVariable Integer id) {
        Integer adminUserId = resolveAdminUserId(request);
        if (adminUserId == null) {
            String authHeader = request.getHeader("Authorization");
            return authService.resolveUserIdFromAuthHeader(authHeader) == null
                ? unauthorizedResponse()
                : forbiddenResponse();
        }
        try {
            if (adminUserId.equals(id)) {
                return ResponseEntity.badRequest().body(Map.of("error", "不能禁用当前登录用户"));
            }
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "用户删除成功"));
        } catch (Exception e) {
            log.error("删除用户失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 获取角色列表
     */
    @GetMapping("/roles")
    public ResponseEntity<?> getRoles(HttpServletRequest request) {
        Integer adminUserId = resolveAdminUserId(request);
        if (adminUserId == null) {
            String authHeader = request.getHeader("Authorization");
            return authService.resolveUserIdFromAuthHeader(authHeader) == null
                ? unauthorizedResponse()
                : forbiddenResponse();
        }

        List<Map<String, String>> roles = new ArrayList<>();
        for (Role role : roleRepository.findAll()) {
            roles.add(Map.of(
                "roleCode", role.getRoleCode(),
                "roleName", role.getRoleName()
            ));
        }
        return ResponseEntity.ok(roles);
    }

    /**
     * 重置用户密码（生成临时密码）
     */
    @PostMapping("/{id:\\d+}/reset-password")
    public ResponseEntity<?> resetPassword(HttpServletRequest request, @PathVariable Integer id) {
        Integer adminUserId = resolveAdminUserId(request);
        if (adminUserId == null) {
            String authHeader = request.getHeader("Authorization");
            return authService.resolveUserIdFromAuthHeader(authHeader) == null
                ? unauthorizedResponse()
                : forbiddenResponse();
        }

        try {
            String tempPassword = generateTemporaryPassword();
            userService.resetPassword(id, tempPassword);
            return ResponseEntity.ok(Map.of(
                "message", "密码重置成功",
                "temporaryPassword", tempPassword
            ));
        } catch (Exception e) {
            log.error("重置密码失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
