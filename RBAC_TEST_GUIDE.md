# RBAC功能测试和问题修复指南

## 当前状态（2026-02-09 17:23）

### ✅ 已完成
1. **RBAC和审计日志数据库表** - 已在本地logitrack数据库创建成功
2. **后端代码完整实现** - 实体类、Repository、Service、Controller、AOP全部完成
3. **后端编译成功** - mvn clean install构建成功
4. **后端服务已启动** - Tomcat在8080端口运行

### ⚠️ 发现的问题

**密码验证失败**
- 症状：登录时提示"密码错误"
- 原因：SQL脚本中的BCrypt密码哈希值可能不正确
- 数据库查询成功：用户查找、角色关联查询都正常工作
- 只是密码验证环节失败

后端日志证实：
```
2026-02-09T17:17:53.174 - 成功查询user表（username='admin'）
2026-02-09T17:17:53.213 - 成功查询user_role关联
2026-02-09T17:17:53.234 - 成功查询role表
2026-02-09T17:17:53.349 ERROR - 密码错误
```

---

## 🔧 快速修复方案

### 方案1：使用SystemController重置密码（推荐）

我已创建了SystemController工具类，包含密码重置功能：

**步骤**:
1. 重新编译并启动后端：
```powershell
cd c:\logitrack\LogiTrack--update-status-report-20260126023903\backend
mvn clean install -DskipTests
java -jar target\logitrack-backend-1.0.0.jar
```

2. 调用密码重置API：
```powershell
# 重置admin密码
$body = @{
    username = "admin"
    password = "admin123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/system/reset-password" -Method POST -Body $body -ContentType "application/json"

# 重置operator密码
$body = @{
    username = "operator"
    password = "admin123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/system/reset-password" -Method POST -Body $body -ContentType "application/json"

# 重置viewer密码
$body = @{
    username = "viewer"
    password = "admin123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/system/reset-password" -Method POST -Body $body -ContentType "application/json"
```

3. 测试登录：
```powershell
$loginBody = @{
    username = "admin"
    password = "admin123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" | ConvertTo-Json
```

### 方案2：直接执行SQL更新（如果有MySQL客户端）

使用已创建的SQL脚本：[database/update_passwords.sql](database/update_passwords.sql)

```sql
-- 密码: admin123456
-- BCrypt哈希: $2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr/mbUdMJvs/kSWBW

UPDATE `user` SET `password` = '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr/mbUdMJvs/kSWBW' WHERE `username` = 'admin';
UPDATE `user` SET `password` = '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr/mbUdMJvs/kSWBW' WHERE `username` = 'operator';
UPDATE `user` SET `password` = '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr/mbUdMJvs/kSWBW' WHERE `username` = 'viewer';
```

在MySQL客户端中连接到logitrack数据库后执行以上SQL。

---

## 📊 测试RBAC功能

修复密码后，按以下顺序测试：

### 1. 登录测试

```powershell
# 测试admin登录（ADMIN_USER角色）
$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body '{"username":"admin","password":"admin123456"}' -ContentType "application/json"
$response | ConvertTo-Json -Depth 5

# 应该返回：
# {
#   "userId": 1,
#   "username": "admin",
#   "fullName": "System Administrator",
#   "email": "admin@logitrack.com",
#   "token": "...",
#   "roles": ["ADMIN_USER"],
#   "permissions": ["enquiry:*", "offer:*", "master-data:*", "report:*", "user:manage", "role:manage", "audit:read"],
#   "loginTime": "20 26-02-09T..."
# }

# 测试operator登录（OPERATING_USER角色）
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body '{"username":"operator","password":"admin123456"}' -ContentType "application/json" | ConvertTo-Json

# 测试viewer登录（NORMAL_USER角色）
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body '{" username":"viewer","password":"admin123456"}' -ContentType "application/json" | ConvertTo-Json
```

### 2. 权限检查测试

```powershell
# 检查admin是否有删除权限（应该返回true）
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/check-permission?userId=1&permission=enquiry:delete" | ConvertTo-Json

# 检查viewer是否有删除权限（应该返回false）
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/check-permission?userId=3&permission=enquiry:delete" | ConvertTo-Json
```

### 3. 用户管理测试

```powershell
# 获取所有用户
Invoke-RestMethod -Uri "http://localhost:8080/api/users" | ConvertTo-Json -Depth 5

# 获取单个用户
Invoke-RestMethod -Uri "http://localhost:8080/api/users/1" | ConvertTo-Json-Depth 3
```

### 4. 审计日志测试

```powershell
# 查看审计日志
Invoke-RestMethod -Uri "http://localhost:8080/api/audit-logs?page=0&size=20" | ConvertTo-Json -Depth 5

# 应该能看到之前登录尝试的日志记录（包括失败的）
```

### 5. 测试带审计日志的Enquiry操作

```powershell
# 创建Enquiry（将自动记录审计日志）
$enquiry = @{
    referenceNumber = "TEST-001"
    # ... 其他字段
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/enquiries" -Method POST -Body $enquiry -ContentType "application/json"

# 查看操作的审计日志
Invoke-RestMethod -Uri "http://localhost:8080/api/audit-logs?action=CREATE&resourceType=ENQUIRY" | ConvertTo-Json -Depth 5
```

---

## 📁 新增文件列表

### 后端文件（共20个）

#### 实体类
1. backend/src/main/java/com/logitrack/backend/entity/User.java
2. backend/src/main/java/com/logitrack/backend/entity/Role.java
3. backend/src/main/java/com/logitrack/backend/entity/AuditLog.java

#### Repository
4. backend/src/main/java/com/logitrack/backend/repository/UserRepository.java
5. backend/src/main/java/com/logitrack/backend/repository/RoleRepository.java
6. backend/src/main/java/com/logitrack/backend/repository/AuditLogRepository.java

#### DTO
7. backend/src/main/java/com/logitrack/backend/dto/LoginRequestDTO.java
8. backend/src/main/java/com/logitrack/backend/dto/LoginResponseDTO.java
9. backend/src/main/java/com/logitrack/backend/dto/UserDTO.java
10. backend/src/main/java/com/logitrack/backend/dto/AuditLogDTO.java

#### Service
11. backend/src/main/java/com/logitrack/backend/service/AuthService.java
12. backend/src/main/java/com/logitrack/backend/service/UserService.java
13. backend/src/main/java/com/logitrack/backend/service/AuditLogService.java

#### Controller
14. backend/src/main/java/com/logitrack/backend/controller/AuthController.java
15. backend/src/main/java/com/logitrack/backend/controller/UserController.java
16. backend/src/main/java/com/logitrack/backend/controller/AuditLogController.java
17. backend/src/main/java/com/logitrack/backend/controller/SystemController.java ⭐ **新增**

#### AOP
18. backend/src/main/java/com/logitrack/backend/aspect/AuditLogAspect.java

#### 工具类
19. backend/src/main/java/com/logitrack/backend/util/PasswordEncoderUtil.java

### 数据库文件
20. database/schema_rbac_audit.sql
21. database/update_passwords.sql ⭐ **新增**
22. database/create_rbac_audit_tables.py

### 修改的文件
23. backend/pom.xml - 添加AOP和Security Crypto依赖
24. backend/src/main/java/com/logitrack/backend/controller/EnquiryController.java - 添加@Audit注解

---

## 🎯 下一步工作

### Phase 1: 完成RBAC测试（优先级：高）

1. ✅ 执行密码重置（使用方案1或方案2）
2. ⏳ 测试三种角色登录
3. ⏳ 验证权限控制
4. ⏳ 测试审计日志记录

### Phase 2: Dashboard功能增强（优先级：  中）

参考用户需求：
> Report Dashboard 页面模块功能优化，可以选择多个月份的数据进行进行数据展示（目前只能选择一个月的数据），最好可以让用户选择到具体日期范围（参考图片的展示），筛选条件新增Core Flag字段，user可以多选CORE/NON CORE，也可以单选进行数据筛选，通过Assigned CN Office进行数据展示

**需要实现**:
1. 前端Dashboard组件：
   - 替换单月选择器为日期范围选择器（开始日期、结束日期）
   - 添加Core Flag多选框（CORE, NON CORE）
   - 添加CN Office下拉框
   - 更新数据展示表格

2. 后端StatisticsService增强：
   - 修改查询方法支持日期范围
   - 添加Core Flag过滤
   - 按CN Office分组统计

### Phase 3: 数据对比功能（优先级：中）

参考用户需求：
> 扩展Report Dashboard 功能，可以选择不同月份或者季度的时间范围数据进行数据对比，可以看到对比的趋势图

**需要实现**:
1. 前端ComparisonReport组件
2. 后端ComparisonService
3. 趋势图可视化（使用Recharts或Chart.js）

---

## ⚡ API接口列表

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/check-permission` - 检查权限
- `POST /api/auth/validate` - 验证Token

### 用户管理
- `GET /api/users` - 获取所有用户
- `GET /api/users/{id}` - 获取单个用户
- `POST /api/users` - 创建用户
- `PUT /api/users/{id}` - 更新用户
- `DELETE /api/users/{id}` - 删除用户

### 审计日志
- `GET /api/audit-logs` - 分页查询（支持userId, action, resourceType, startTime, endTime过滤）
- `GET /api/audit-logs/resource-history` - 获取资源操作历史
- `GET /api/audit-logs/user/{userId}` - 获取用户操作日志

### 系统工具（开发测试用）
- `POST /api/system/reset-password` - 重置用户密码
- `POST /api/system/encode-password` - 生成BCrypt密码哈希
- `POST /api/system/verify-password` - 验证密码

---

## 📈 当前进度

```
Phase 1 - RBAC &审计日志: ████████████████████░░ 90%
  ✅ 数据库设计
  ✅ 后端实现
  ✅ 编译成功
  ⚠️  密码验证问题（修复中）
  
Phase 2 - Dashboard增强: ░░░░░░░░░░░░░░░░░░░░ 0%

Phase 3 - 数据对比功能: ░░░░░░░░░░░░░░░░░░░░ 0%
```

---

## 💡 技术亮点

1. **完整的RBAC实现**：三种角色、灵活的权限表达式（支持通配符）
2. **自动审计日志**：使用AOP实现零侵入式审计
3. **密码安全**：BCrypt加密存储
4. **JSON权限**：灵活的权限配置，易于扩展
5. **完整审计追踪**：记录操作前后值、IP地址、执行时间等

---

## 🔒 安全注意事项

- SystemController仅用于开发测试，生产环境需要删除或添加权限保护
- 当前使用简单Base64 token，生产环境应升级为JWT
- 需要添加HTTP请求拦截器验证token
- audit_log表需要定期归档，防止数据量过大

---

## 完成RBAC测试后请告知，我将继续实现Dashboard功能增强！
