package com.logitrack.backend.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.logitrack.backend.entity.AuditLog;
import com.logitrack.backend.entity.Enquiry;
import com.logitrack.backend.repository.EnquiryRepository;
import com.logitrack.backend.service.AuditLogService;
import com.logitrack.backend.service.EnquiryPortService;
import jakarta.servlet.http.HttpServletRequest;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * 审计日志拦截器
 */
@Aspect
@Component
@Slf4j
public class AuditLogAspect {
    
    private final AuditLogService auditLogService;
    private final EnquiryRepository enquiryRepository;
    private final EnquiryPortService enquiryPortService;
    // ✅ 配置ObjectMapper以处理循环引用
    private final ObjectMapper objectMapper;
    
    public AuditLogAspect(AuditLogService auditLogService,
                          EnquiryRepository enquiryRepository,
                          EnquiryPortService enquiryPortService) {
        this.auditLogService = auditLogService;
        this.enquiryRepository = enquiryRepository;
        this.enquiryPortService = enquiryPortService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // 忽略空值和未知属性
        this.objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
    }
    
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
        Object oldValueObj = null; // ✅ 提升变量作用域到方法级别
        
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
                
                // 提取用户角色（从请求头）
                String userRole = request.getHeader("X-User-Role");
                if (userRole != null) {
                    auditLog.setUserRole(userRole);
                }
                
                // 获取资源ID
                String resourceId = extractResourceId(joinPoint, audit.resourceIdParam());
                if (resourceId != null) {
                    auditLog.setResourceId(resourceId);
                }
                
                // ✅ 对于UPDATE操作，捕获旧值和详细变更
                if ("UPDATE".equals(audit.action()) && "ENQUIRY".equals(audit.resourceType()) && resourceId != null) {
                    try {
                        Long enquiryId = Long.parseLong(resourceId);
                        Optional<Enquiry> existingOpt = enquiryRepository.findById(enquiryId);
                        if (existingOpt.isPresent()) {
                            Enquiry oldEnquiry = existingOpt.get();
                            hydratePortArrays(oldEnquiry);
                            oldValueObj = oldEnquiry;
                            // ✅ 转换单值字段为数组格式，便于前端显示
                            normalizePortFields(oldEnquiry);
                            auditLog.setOldValue(objectMapper.writeValueAsString(oldValueObj));
                            log.debug("Captured old value for Enquiry {}", enquiryId);
                        }
                    } catch (Exception e) {
                        log.error("Failed to capture old value for UPDATE operation", e);
                    }
                }
            }
            
            // 执行目标方法
            Object result = joinPoint.proceed();
            
            // 记录成功
            auditLog.setStatus("SUCCESS");
            
            // ✅ 提取实际的实体对象（如果是ResponseEntity包装的）
            Object actualResult = result;
            if (result instanceof org.springframework.http.ResponseEntity) {
                actualResult = ((org.springframework.http.ResponseEntity<?>) result).getBody();
                log.debug("Extracted entity from ResponseEntity: {}", actualResult != null ? actualResult.getClass().getSimpleName() : "null");
            }
            
            // 记录新值（对于CREATE和UPDATE操作）
            if ("CREATE".equals(audit.action()) || "UPDATE".equals(audit.action())) {
                try {
                    // ✅ 转换单值字段为数组格式，便于前端显示
                    if (actualResult instanceof Enquiry) {
                        Enquiry newEnquiry = (Enquiry) actualResult;
                        hydratePortArrays(newEnquiry);
                        normalizePortFields(newEnquiry);
                    }
                    auditLog.setNewValue(objectMapper.writeValueAsString(actualResult));
                    
                    // ✅ 对于UPDATE操作，生成详细的变更说明
                    if ("UPDATE".equals(audit.action()) && oldValueObj != null && actualResult != null) {
                        String details = generateChangeDetails(oldValueObj, actualResult);
                        auditLog.setDetails(details);
                        log.debug("Generated change details for audit log: {}", details);
                    }
                    
                    // ✅ 提取CN Pricing Admin字段（仅对ENQUIRY）
                    if ("ENQUIRY".equals(audit.resourceType()) && actualResult instanceof Enquiry) {
                        Enquiry enquiry = (Enquiry) actualResult;
                        if (enquiry.getCnPricingAdmin() != null) {
                            auditLog.setCnPricingAdmin(enquiry.getCnPricingAdmin());
                            log.debug("Set CN Pricing Admin: {}", enquiry.getCnPricingAdmin());
                        }
                    }
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
     * 从多港口关联表加载 polIds/podIds，避免旧值误显示为空数组
     */
    private void hydratePortArrays(Enquiry enquiry) {
        if (enquiry == null || enquiry.getId() == null) {
            return;
        }

        try {
            List<Integer> polIds = enquiryPortService.getPolIds(enquiry.getId());
            List<Integer> podIds = enquiryPortService.getPodIds(enquiry.getId());
            enquiry.setPolIds(polIds != null ? polIds : new ArrayList<>());
            enquiry.setPodIds(podIds != null ? podIds : new ArrayList<>());
        } catch (Exception e) {
            log.warn("Failed to hydrate port arrays for enquiry {}", enquiry.getId(), e);
        }
    }

    /**
     * 规范化港口字段：将单值 polId/podId 同步到数组 polIds/podIds
     * 这样审计日志中 oldValue/newValue 都能稳定包含数组字段
     */
    private void normalizePortFields(Enquiry enquiry) {
        if (enquiry == null) {
            return;
        }

        List<Integer> normalizedPolIds = new ArrayList<>();
        if (enquiry.getPolIds() != null && !enquiry.getPolIds().isEmpty()) {
            normalizedPolIds.addAll(enquiry.getPolIds());
        } else if (enquiry.getPolId() != null) {
            normalizedPolIds.add(enquiry.getPolId());
        }
        enquiry.setPolIds(normalizedPolIds);

        List<Integer> normalizedPodIds = new ArrayList<>();
        if (enquiry.getPodIds() != null && !enquiry.getPodIds().isEmpty()) {
            normalizedPodIds.addAll(enquiry.getPodIds());
        } else if (enquiry.getPodId() != null) {
            normalizedPodIds.add(enquiry.getPodId());
        }
        enquiry.setPodIds(normalizedPodIds);
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
    
    /**
     * 生成详细的变更说明（对比旧值和新值）
     */
    private String generateChangeDetails(Object oldValue, Object newValue) {
        if (!(oldValue instanceof Enquiry) || !(newValue instanceof Enquiry)) {
            return null;
        }
        
        Enquiry oldEnq = (Enquiry) oldValue;
        Enquiry newEnq = (Enquiry) newValue;
        
        List<String> changes = new ArrayList<>();
        
        // 比较常用字段
        compareField(changes, "状态(Status)", oldEnq.getStatus(), newEnq.getStatus());
        compareField(changes, "产品代码(ProductCode)", oldEnq.getProductCode(), newEnq.getProductCode());
        compareField(changes, "货物类型(CargoType)", oldEnq.getCargoTypeCode(), newEnq.getCargoTypeCode());
        compareField(changes, "数量(Quantity)", oldEnq.getQuantity(), newEnq.getQuantity());
        compareField(changes, "体积(VolumeCbm)", oldEnq.getVolumeCbm(), newEnq.getVolumeCbm());
        compareField(changes, "TEU", oldEnq.getQuantityTeu(), newEnq.getQuantityTeu());
        compareField(changes, "销售国家(SalesCountry)", oldEnq.getSalesCountryCode(), newEnq.getSalesCountryCode());
        compareField(changes, "销售办公室(SalesOffice)", oldEnq.getSalesOfficeId(), newEnq.getSalesOfficeId());
        compareField(changes, "销售PIC", oldEnq.getSalesPicId(), newEnq.getSalesPicId());
        compareField(changes, "CN定价管理员(CnPricingAdmin)", oldEnq.getCnPricingAdmin(), newEnq.getCnPricingAdmin());
        compareField(changes, "分配CN办公室(AssignedCnOffice)", oldEnq.getAssignedCnOfficeCode(), newEnq.getAssignedCnOfficeCode());
        compareField(changes, "起运港(POL)", oldEnq.getPolId(), newEnq.getPolId());
        compareField(changes, "目的港(POD)", oldEnq.getPodId(), newEnq.getPodId());
        
        // ✅ 比较多港口数组字段（如果存在）
        comparePortArrayField(changes, "起运港列表(POLs)", oldEnq.getPolIds(), newEnq.getPolIds());
        comparePortArrayField(changes, "目的港列表(PODs)", oldEnq.getPodIds(), newEnq.getPodIds());
        
        compareField(changes, "货物就绪日期(CargoReadyDate)", oldEnq.getCargoReadyDate(), newEnq.getCargoReadyDate());
        compareField(changes, "预订确认(BookingConfirmed)", oldEnq.getBookingConfirmed(), newEnq.getBookingConfirmed());
        compareField(changes, "备注(Remark)", oldEnq.getRemark(), newEnq.getRemark());
        
        if (changes.isEmpty()) {
            return "无字段变更";
        }
        
        return String.join("; ", changes);
    }
    
    /**
     * 比较港口数组字段的变更
     */
    private void comparePortArrayField(List<String> changes, String fieldName, List<Integer> oldVal, List<Integer> newVal) {
        // 处理null或空列表
        boolean oldEmpty = oldVal == null || oldVal.isEmpty();
        boolean newEmpty = newVal == null || newVal.isEmpty();
        
        if (oldEmpty && newEmpty) {
            return; // 都为空，无变更
        }
        
        String oldStr = oldEmpty ? "[]" : oldVal.toString();
        String newStr = newEmpty ? "[]" : newVal.toString();
        
        if (!oldStr.equals(newStr)) {
            changes.add(String.format("%s: %s → %s", fieldName, oldStr, newStr));
        }
    }
    
    /**
     * 比较单个字段的变更
     */
    private void compareField(List<String> changes, String fieldName, Object oldVal, Object newVal) {
        // 处理null值
        String oldStr = oldVal != null ? oldVal.toString() : "null";
        String newStr = newVal != null ? newVal.toString() : "null";
        
        if (!oldStr.equals(newStr)) {
            changes.add(String.format("%s: %s → %s", fieldName, oldStr, newStr));
        }
    }
}
