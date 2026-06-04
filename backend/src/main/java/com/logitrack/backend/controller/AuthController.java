package com.logitrack.backend.controller;

import com.logitrack.backend.dto.LoginRequestDTO;
import com.logitrack.backend.dto.LoginResponseDTO;
import com.logitrack.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthService authService;
    
    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        try {
            LoginResponseDTO response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("登录失败: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * 检查权限
     */
    @GetMapping("/check-permission")
    public ResponseEntity<Map<String, Boolean>> checkPermission(
        @RequestParam Integer userId,
        @RequestParam String permission
    ) {
        boolean hasPermission = authService.hasPermission(userId, permission);
        Map<String, Boolean> result = new HashMap<>();
        result.put("hasPermission", hasPermission);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 验证Token
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        Integer userId = authService.validateToken(token);
        
        Map<String, Object> result = new HashMap<>();
        result.put("valid", userId != null);
        result.put("userId", userId);
        
        return ResponseEntity.ok(result);
    }
}
