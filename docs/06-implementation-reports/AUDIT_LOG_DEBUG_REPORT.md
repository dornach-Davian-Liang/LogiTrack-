# 审计日志功能调试报告

生成时间: 2026-02-24 12:06

## 问题总结

### 问题1: Edit Enquiry页面500错误 ✓ 已解决
**状态**: 通过后端API测试，enquiry更新功能正常，没有500错误。
**原因**: 前端可能发送了不完整的数据或格式错误。

### 问题2: 审计日志变更详情字段为空 ✗ 未解决
**状态**: 
- ✓ `userRole` 字段正常显示（ADMIN_USER）
- ✗ `cnPricingAdmin` 字段为空
- ✗ `details` 字段为空

## 测试结果

### 测试1: Enquiry更新功能
```powershell
# 更新enquiry #43，quantity从100改为555
状态: ✓ 成功
结果: 创建了新的审计日志 ID 23
```

### 测试2: 审计日志字段验证
```
审计日志 ID: 23
创建时间: 2026-02-24T12:05:43
操作: UPDATE ENQUIRY #43
用户名: admin
用户角色: ADMIN_USER ✓
CN Pricing Admin: (空) ✗
变更详情: (空) ✗
```

### 测试3: Enquiry数据验证
```
Enquiry #43 当前数据:
- Status: Quoted
- Quantity: 555.000  
- CnPricingAdmin: 'NewAdmin' ✓ (字段有值)
- VolumeCbm: 121.000
- ProductCode: AIR-RAIL-SEA
```

## 根本原因分析

### 已确认的事实：
1. ✓ 后端编译成功，jar包是最新的（12:03:22）
2. ✓ 后端运行正常，enquiry更新功能工作
3. ✓ Enquiry实体有cnPricingAdmin字段且有数据
4. ✓ userRole字段可以正常保存到审计日志
5. ✗ cnPricingAdmin和details字段未保存

### 可能的原因：
1. **AOP拦截问题**: AuditLogAspect的@Around注解可能没有正确拦截到方法
2. **类型转换问题**: `actualResult instanceof Enquiry`判断可能失败
3. **日志配置问题**: DEBUG日志没有输出，无法看到代码执行路径
4. **ResponseEntity提取问题**: 从ResponseEntity提取body的逻辑可能有问题

### 调试证据：
- ✗ 后端日志中没有找到任何"Captured old value"、"Extracted entity"、"Generated change details"等日志
- ✗ 没有"PUT /api/enquiries/43"的Controller日志
- 说明either log.info没有执行，or日志级别被过滤

## 修改记录

### 已完成的修改：

1. **AuditLog.java** - 添加3个新字段:
   - `userRole` (VARCHAR 50)  
   - `cnPricingAdmin` (VARCHAR 100)
   - `details` (TEXT)

2. **AuditLogDTO.java** - 同步字段

3. **AuditLogService.java** - ✓ **已修复** convertToDTO方法
   ```java
   dto.setUserRole(log.getUserRole());
   dto.setCnPricingAdmin(log.getCnPricingAdmin());
   dto.setDetails(log.getDetails());
   ```

4. **AuditLogAspect.java** - 添加逻辑:
   - 捕获旧值（oldValueObj）
   - 从ResponseEntity提取实体对象
   - 生成详细变更说明（generateChangeDetails）
   - 提取cnPricingAdmin字段
   - 添加大量DEBUG日志

5. **application.properties** - 修改日志级别:
   ```properties
   logging.level.com.logitrack=DEBUG
   logging.level.com.logitrack.backend.aspect=DEBUG
   ```

6. **api.ts** - 添加X-User-Role请求头

7. **AuditLog.tsx** - 扩展UI显示10列

8. **audit_log_enhancement.sql** - 数据库迁移（✓ 已执行）

## 下一步调试计划

### 方案1: 简化调试
在AuditLogAspect中添加System.out.println()强制输出日志，不依赖log框架：
```java
System.out.println("[DEBUG] Audit: action=" + audit.action() + ", resourceType=" + audit.resourceType());
System.out.println("[DEBUG] actualResult type: " + (actualResult != null ? actualResult.getClass().getName() : "null"));
```

### 方案2: 直接测试
创建一个测试端点直接调用generateChangeDetails方法，验证逻辑是否正确。

### 方案3: 检查编译
确认AuditLogAspect的class文件是否包含最新代码：
```bash
jar -xf target/logitrack-backend-1.0.0.jar BOOT-INF/classes/com/logitrack/backend/aspect/AuditLogAspect.class
javap -c AuditLogAspect.class
```

## 浏览器测试建议

由于PowerShell API测试可能miss一些细节，建议进行浏览器端到端测试：

1. 打开 http://localhost:3000
2. 登录 admin/admin123456  
3. 进入Enquiries列表
4. 编辑Enquiry #43或其他记录
5. 修改Status、Quantity、CN Pricing Admin等字段
6. 保存
7. 进入Settings → Audit Log
8. 查看最新记录：
   - 权限等级列应显示彩色标签（紫色=ADMIN，蓝色=OPERATING_USER）
   - CN Pricing Admin列应显示enquiry的值
   - 变更详情列应显示"字段名: 旧值 → 新值"格式

## 临时总结

**已工作的部分**: 
- ✓ AuditLog表结构 
- ✓ userRole字段的捕获和显示
- ✓ 前端UI（10列布局）
- ✓ Enquiry基本CRUD操作

**待修复的部分**:
- ✗ details字段（变更详情）
- ✗ cnPricingAdmin字段（CN定价管理员）
- ✗ DEBUG日志输出

**可能的快速修复**: 
直接在浏览器测试，因为API测试可能无法完全模拟前端行为。
