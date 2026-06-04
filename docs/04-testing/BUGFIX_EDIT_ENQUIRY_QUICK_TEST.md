# Edit Enquiry 500 错误修复 - 快速测试指南

**修复日期**: 2026-02-25  
**修复版本**: v2.0  
**状态**: ✅ 已部署

---

## 🚀 快速开始

### 1️⃣ 代码修改已完成

修复了以下3个文件的必填字段保留逻辑：

```
✅ logitrack-pro/App.tsx (handleSaveEnquiry)
✅ logitrack-pro/components/enquiry/EnquiryForm.tsx (handleSubmit)
✅ backend/src/main/java/com/logitrack/backend/service/EnquiryService.java (updateEnquiry)
```

### 2️⃣ 启动应用

```bash
# 后端
cd backend && mvn clean package
java -jar target/logitrack-backend.jar

# 前端
cd logitrack-pro && npm install && npm start
```

### 3️⃣ 立即测试

访问 http://localhost:3000

---

## 📝 关键测试场景

### 场景1️⃣：单字段修改

```
1. 打开任意 Enquiry 编辑页面
2. 修改 Quantity 字段 (100 → 555)
3. 点击 Save

预期: ✓ 保存成功，返回列表
结果: __________
```

### 场景2️⃣：多字段修改（★ 关键测试）

```
1. 打开 Enquiry 编辑页面
2. 同时修改以下字段：
   ☑ Quantity (100 → 200)
   ☑ Commodity (添加/修改)
   ☑ Sales Country (下拉选择)
   ☑ CN Pricing Admin (下拉选择)
   ☑ Port of Loading (多选)
3. 点击 Save

预期: ✓ 所有字段保存成功，无 500 错误
结果: __________
```

### 场景3️⃣：港口字段修改

```
1. 打开编辑页面
2. 修改 Port of Loading (POL)
3. 修改 Port of Discharge (POD)
4. 点击 Save

预期: ✓ 港口数据正确保存
结果: __________
```

### 场景4️⃣：验证数据持久化

```
1. 执行场景2的修改和保存
2. 返回列表后再次点击编辑该条记录
3. 查看是否能看到修改后的值

预期: ✓ 修改后的值仍在表单中
结果: __________
```

---

## 🔍 验证步骤

### 前端日志检查 (F12 → Console)

```javascript
// 应该看到这样的日志
[App] Updating enquiry ID: 43
[App] Data to update: {
  id: 43,
  salesOfficeId: 1,
  salesPicId: 5,
  quantity: 200,
  commodity: "修改后的商品描述",
  polIds: [15, 30],
  podIds: [45],
  ...其他字段
}

// 不应该看到
❌ Error 500
❌ API Error
❌ undefined values
```

### 数据库验证

```sql
-- 查询相应的 Enquiry 记录
SELECT id, quantity, commodity, pol_id, pod_id, 
       sales_office_id, sales_pic_id, cn_pricing_admin
FROM enquiry
WHERE id = 43;

-- 验证修改后的值是否存在数据库中
```

---

## 📊 修复内容快速参考

### 前端修复 (3处)

#### 1. App.tsx - handleSaveEnquiry
- ✅ 添加 `polId` 和 `podId` 保留  
- ✅ 添加 `referenceMonth/serialNumber` 保留  
- ✅ 添加 `productCode/productAbbr` 保留  
- ✅ 添加 `status/issueDate/enquiryReceivedDate` 保留  
- ✅ 添加 `bookingConfirmed` 保留  

**位置**: [App.tsx L129-175](logitrack-pro/App.tsx#L129-L175)

```typescript
// 关键代码
polId: enquiry.polId || enquiry.polIds?.[0] || editingEnquiry?.polId,
podId: enquiry.podId || enquiry.podIds?.[0] || editingEnquiry?.podId,
```

#### 2. EnquiryForm.tsx - handleSubmit
- ✅ 添加 `salesPicId` 保留  
- ✅ 添加 `polId/podId` 单值保留  

**位置**: [EnquiryForm.tsx L645-668](logitrack-pro/components/enquiry/EnquiryForm.tsx#L645-L668)

```typescript
// 关键代码
enquiryToSubmit.salesPicId = enquiryToSubmit.salesPicId || initialData?.salesPicId;
enquiryToSubmit.polId = enquiryToSubmit.polId || enquiryToSubmit.polIds?.[0] || initialData?.polId;
```

### 后端修复 (1处)

#### 3. EnquiryService.java - updateEnquiry
- ✅ 扩展必填字段保留检查  
- ✅ 包含：productCode, status, cnPricingAdmin, salesCountryCode, salesOfficeId, salesPicId, assignedCnOfficeCode, cargoTypeCode, issueDate, enquiryReceivedDate, polId, podId

**位置**: [EnquiryService.java L307-420](backend/src/main/java/com/logitrack/backend/service/EnquiryService.java#L307-L420)

```java
// 关键代码（示例）
if (enquiry.getProductCode() == null || enquiry.getProductCode().isEmpty()) {
    enquiry.setProductCode(existing.getProductCode());
}
if (enquiry.getSalesPicId() == null) {
    enquiry.setSalesPicId(existing.getSalesPicId());
}
```

---

## ✅ 验收标准清单

- [ ] 编辑单个字段 → 保存 → ✓ 成功
- [ ] 编辑多个字段 → 保存 → ✓ 成功
- [ ] 修改港口信息 → 保存 → ✓ 港口数据正确
- [ ] 修改销售信息 → 保存 → ✓ 销售数据正确
- [ ] 修改后再次编辑 → ✓ 显示修改后的值
- [ ] 浏览器控制台 → ✗ 无 500 错误
- [ ] 浏览器控制台 → ✓ 显示调试日志
- [ ] 数据库验证 → ✓ 修改内容已持久化

---

## 🆘 故障排除

### 如果仍然看到 500 错误

```
1. 检查浏览器控制台的具体错误信息
2. 查看后端日志文件：
   - file: application.log
   - 搜索: "ERROR" 或 "500"
3. 确保后端数据库连接正常
4. 验证后端代码变更是否已编译
```

### 如果修改未保存

```
1. 检查浏览器 Network 标签
   - 确保 PUT 请求收到 200 OK 响应
2. 查看后端日志中 updateEnquiry 方法的日志输出
3. 查询数据库验证数据是否实际更新
4. 检查是否有触发器或其他业务逻辑干扰
```

### 如果控制台无日志输出

```
1. 确认浏览器控制台已打开 (F12)
2. 检查 Console 标签（不是 Network 或 Source）
3. 检查是否应用了浏览器过滤
4. 检查是否有 DevTools 的日志级别限制
```

---

## 📞 技术支持

| 问题 | 检查项 | 联系方式 |
|------|--------|---------|
| 500 错误 | 后端日志 | 检查 application.log |
| 数据未保存 | 数据库查询 | 执行 SELECT 语句 |
| 界面无反应 | 浏览器工具 | F12 → Console/Network |

---

## 📚 相关文档

- [完整修复报告](BUGFIX_EDIT_ENQUIRY_500_REPORT_20260225.md)
- [BUG FIX 完成报告](BUG_FIX_COMPLETION_REPORT.md)
- [审计日志调试报告](AUDIT_LOG_DEBUG_REPORT.md)

---

**更新时间**: 2026-02-25  
**状态**: ✅ 修复完成，待测试验证
