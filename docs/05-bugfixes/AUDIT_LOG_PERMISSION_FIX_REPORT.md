# 审计日志权限修复报告

**修复时间**: 2026年2月25日  
**问题描述**: operator权限的账号可以查看settings的操作日志，这是不合理的  
**修复状态**: ✅ 已完成

---

## 📋 问题分析

### 问题表现
- operator角色（OPERATING_USER）可以访问Settings页面
- operator角色可以查看所有的审计日志（Audit Log）
- 这违反了最小权限原则，operator不应该有权限查看系统管理相关的操作记录

### 安全风险
1. **信息泄露**: operator可能看到管理员的操作记录
2. **权限过大**: operator拥有了不必要的审计日志查看权限
3. **合规风险**: 审计日志应该只有管理员能访问

---

## 🔧 修复方案

### 方案概述
采用前后端双重权限控制：
1. **前端**: 禁止operator角色访问Settings页面
2. **后端**: 在API层添加权限检查，拒绝非管理员的审计日志访问请求

---

## 📝 代码修改

### 1. 前端权限控制修改

**文件**: [logitrack-pro/App.tsx](logitrack-pro/App.tsx#L112)

**修改内容**:
```typescript
// 修改前
const canViewSettings = isAdmin || isOperatingUser;  // ✅ Admin和PRICING_ADMIN可见设置

// 修改后
const canViewSettings = isAdmin;  // ✅ 仅Admin可见设置（不包括operator）
```

**影响**:
- operator角色将无法在导航菜单中看到Settings选项
- 即使通过URL直接访问，也会被路由守卫拒绝

---

### 2. 后端权限控制修改

**文件**: [backend/src/main/java/com/logitrack/backend/controller/AuditLogController.java](backend/src/main/java/com/logitrack/backend/controller/AuditLogController.java)

#### 修改1: 添加导入
```java
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import java.util.Map;
```

#### 修改2: 添加权限检查方法
```java
/**
 * 检查用户是否有权限访问审计日志（仅ADMIN）
 */
private ResponseEntity<?> checkPermission(HttpServletRequest request) {
    String userRole = request.getHeader("X-User-Role");
    log.debug("检查审计日志访问权限 - userRole={}", userRole);
    
    // 只有ADMIN_USER可以访问审计日志
    if (!"ADMIN_USER".equals(userRole) && !"ADMIN".equals(userRole)) {
        log.warn("非管理员尝试访问审计日志 - userRole={}", userRole);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("error", "访问被拒绝：仅管理员可以查看审计日志"));
    }
    return null;
}
```

#### 修改3: 在所有endpoint中添加权限检查

对以下5个endpoint都添加了权限检查：

1. **GET /api/audit-logs** - 分页查询审计日志
2. **GET /api/audit-logs/resource-history** - 获取资源操作历史
3. **GET /api/audit-logs/user/{userId}** - 获取用户操作日志
4. **GET /api/audit-logs/export** - 导出审计日志
5. **POST /api/audit-logs/clear** - 清空所有审计日志

每个endpoint添加的代码示例：
```java
@GetMapping
public ResponseEntity<?> getAuditLogs(
    HttpServletRequest request,  // 新增参数
    // ... 其他参数
) {
    // 权限检查
    ResponseEntity<?> permissionCheck = checkPermission(request);
    if (permissionCheck != null) {
        return permissionCheck;
    }
    
    // 原有逻辑
    // ...
}
```

---

## 🛡️ 安全机制

### 多层防护
1. **前端路由守卫**: 阻止非授权角色访问Settings页面
2. **前端UI隐藏**: operator看不到Settings菜单项
3. **后端API拦截**: 即使绕过前端，后端也会拒绝请求
4. **权限验证**: 通过HTTP请求头中的`X-User-Role`字段验证

### 错误处理
- 非管理员访问时返回**403 Forbidden**
- 错误消息: "访问被拒绝：仅管理员可以查看审计日志"
- 后端日志记录所有未授权访问尝试

---

## ✅ 权限矩阵

| 功能 | ADMIN | OPERATOR | LOGIN_USER |
|------|-------|----------|------------|
| 访问Settings页面 | ✅ | ❌ | ❌ |
| 查看审计日志 | ✅ | ❌ | ❌ |
| 导出审计日志 | ✅ | ❌ | ❌ |
| 清空审计日志 | ✅ | ❌ | ❌ |
| 管理询价 | ✅ | ✅ | ❌ |
| 管理主数据 | ✅ | ✅ | ❌ |
| 查看报表 | ✅ | ✅ | ❌ |

---

## 🧪 测试建议

### 功能测试
1. **使用admin账号登录**
   - 应该能看到Settings菜单
   - 应该能访问审计日志页面
   - 应该能执行导出、清空等操作

2. **使用operator账号登录**
   - 不应该看到Settings菜单
   - 直接访问`/settings`应该自动跳转
   - API调用应该返回403错误

3. **使用普通用户登录**
   - 同样不应该看到Settings菜单
   - 同样无法访问API

### 安全测试
1. **尝试绕过前端**
   ```bash
   # operator用户尝试直接调用API
   curl -H "X-User-Role: OPERATING_USER" http://localhost:8080/api/audit-logs
   # 应该返回 403 Forbidden
   ```

2. **检查日志记录**
   - 查看后端日志，确认所有未授权访问都被记录

---

## 📊 影响范围

### 受影响的用户角色
- **OPERATING_USER (operator)**: 失去Settings访问权限

### 不受影响的功能
- ✅ operator仍可管理询价（Enquiry）
- ✅ operator仍可管理主数据（Master Data）
- ✅ operator仍可查看报表（Reports）
- ✅ operator的其他所有业务功能不受影响

---

## 🚀 部署说明

### 前端部署
```bash
cd logitrack-pro
npm run build
# 重启前端服务
npm start
```

### 后端部署
```bash
cd backend
mvn clean package -DskipTests
# 重启后端服务
java -jar target/logitrack-backend-1.0.0.jar
```

### 验证步骤
1. 使用operator账号登录
2. 确认看不到Settings菜单
3. 尝试访问 `/settings` 路由
4. 查看后端日志确认权限检查生效

---

## 📌 总结

✅ **问题已解决**: operator角色不再能访问审计日志  
✅ **安全加固**: 前后端双重权限验证  
✅ **符合原则**: 遵循最小权限原则  
✅ **向后兼容**: 不影响其他功能正常使用  

**备注**: 如果将来需要让operator查看特定类型的日志（如仅ENQUIRY相关），可以在后端添加更细粒度的过滤逻辑。
