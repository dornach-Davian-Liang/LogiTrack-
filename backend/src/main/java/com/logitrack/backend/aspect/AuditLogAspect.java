package com.logitrack.backend.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logitrack.backend.entity.AuditLog;
import com.logitrack.backend.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.LocalDateTime;

/**
 * 审计日志拦截器
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogAspect {
    
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * 审计注解
     */
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface Audit {
        String action(); // CREATE, UPDATE, DELETE, VIEW, EXPORT
        String resourceType(); // ENQUIRY, OFFER, COUNTRY, PORT等
        String resourceIdParam() default ""; // 资源ID参数名
    }
    
    /**
     * 拦截带有@Audit注解的方法
     */
    @Around("@annotation(audit)")
    public Object logAudit(ProceedingJoinPoint joinPoint, Audit audit) throws Throwable {
        long startTime = System.currentTimeMillis();
        AuditLog auditLog = new AuditLog();
        
        try {
            // 获取HTTP请求信息
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                
                // 设置基本信息
                auditLog.setAction(audit.action());
                auditLog.setResourceType(audit.resourceType());
                auditLog.setIpAddress(getClientIp(request));
                auditLog.setUserAgent(request.getHeader("User-Agent"));
                auditLog.setRequestMethod(request.getMethod());
                auditLog.setRequestUrl(request.getRequestURI());
                
                // 从请求头或参数中获取用户信息（暂时使用简单方式）
                String username = request.getHeader("X-Username");
                if (username == null) {
                    username = "system";
                }
                auditLog.setUsername(username);
                
                // 获取资源ID
                String resourceId = extractResourceId(joinPoint, audit.resourceIdParam());
                if (resourceId != null) {
                    auditLog.setResourceId(resourceId);
                }
            }
            
            // 执行目标方法
            Object result = joinPoint.proceed();
            
            // 记录成功
            auditLog.setStatus("SUCCESS");
            
            // 记录新值（对于CREATE和UPDATE操作）
            if ("CREATE".equals(audit.action()) || "UPDATE".equals(audit.action())) {
                try {
                    auditLog.setNewValue(objectMapper.writeValueAsString(result));
                } catch (Exception e) {
                    log.warn("序列化新值失败", e);
                }
            }
            
            long duration = System.currentTimeMillis() - startTime;
            auditLog.setDurationMs((int) duration);
            
            // 异步保存审计日志
            auditLogService.createLog(auditLog);
            
            return result;
            
        } catch (Exception e) {
            // 记录失败
            auditLog.setStatus("FAILED");
            auditLog.setErrorMessage(e.getMessage());
            
            long duration = System.currentTimeMillis() - startTime;
            auditLog.setDurationMs((int) duration);
            
            // 异步保存审计日志
            auditLogService.createLog(auditLog);
            
            throw e;
        }
    }
    
    /**
     * 提取资源ID
     */
    private String extractResourceId(ProceedingJoinPoint joinPoint, String paramName) {
        if (paramName == null || paramName.isEmpty()) {
            return null;
        }
        
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] parameterNames = signature.getParameterNames();
            Object[] args = joinPoint.getArgs();
            
            for (int i = 0; i < parameterNames.length; i++) {
                if (parameterNames[i].equals(paramName)) {
                    return String.valueOf(args[i]);
                }
            }
        } catch (Exception e) {
            log.warn("提取资源ID失败", e);
        }
        
        return null;
    }
    
    /**
     * 获取客户端真实IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
