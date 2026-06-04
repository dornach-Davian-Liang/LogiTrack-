package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * 登录响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {
    private Integer userId;
    private String username;
    private String fullName;
    private String email;
    private String token;
    private Set<String> roles;
    private List<String> permissions;
    private LocalDateTime loginTime;
    private Set<String> cnOffices;
}
