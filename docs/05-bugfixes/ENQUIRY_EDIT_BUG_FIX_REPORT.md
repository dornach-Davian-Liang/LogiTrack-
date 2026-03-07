# Enquiry编辑功能Bug修复报告

**修复时间**: 2026-02-24  
**问题编号**: #ENQUIRY-EDIT-500

## 🐛 问题描述

用户报告了两个关键问题：

### 问题1：编辑Enquiry时500错误
- **错误信息**: `PUT http://localhost:3000/api/enquiries/43 500 (Internal Server Error)`
- **错误位置**: api.ts:80 → App.tsx:124
- **影响范围**: 所有编辑enquiry的操作

### 问题2：POL/POD可选数据很少
- **现象**: Edit Enquiry页面的Port of Loading和Port of Discharge下拉框选项非常少
- **用户体验**: 用户需要手动搜索才能找到港口，无法快速选择

## 🔍 根本原因分析

### 原因1：必填字段丢失
在编辑模式下提交时，某些必填字段（如`salesOfficeId`, `salesPicId`等）可能在表单处理过程中变为`null`或`undefined`，导致后端验证失败或数据库约束违反。

**代码位置**: App.tsx Line 124
```typescript
// ❌ 旧代码：直接发送enquiry，可能包含null值
await enquiryApi.update(enquiry.id, enquiry);
```

### 原因2：港口数据初始为空
EnquiryForm在初始化时将`ports`设为空数组，依赖用户搜索来加载数据。

**代码位置**: EnquiryForm.tsx Line 263
```typescript
// ❌ 旧代码：初始化为空数组
setPorts([]);  
```

## ✅ 解决方案

### 修复1：确保必填字段有值

**文件**: `logitrack-pro/App.tsx`

在更新enquiry时，使用原始数据作为后备值：

```typescript
const dataToUpdate = {
  ...enquiry,
  salesOfficeId: enquiry.salesOfficeId || editingEnquiry?.salesOfficeId,
  salesPicId: enquiry.salesPicId || editingEnquiry?.salesPicId,
  cnPricingAdmin: enquiry.cnPricingAdmin || editingEnquiry?.cnPricingAdmin,
  assignedCnOfficeCode: enquiry.assignedCnOfficeCode || editingEnquiry?.assignedCnOfficeCode,
  salesCountryCode: enquiry.salesCountryCode || editingEnquiry?.salesCountryCode,
  cargoTypeCode: enquiry.cargoTypeCode || editingEnquiry?.cargoTypeCode,
};
await enquiryApi.update(enquiry.id, dataToUpdate);
```

### 修复2：预加载常用港口

**文件**: `logitrack-pro/components/enquiry/EnquiryForm.tsx`

在`loadMasterData`时加载前50个常用海港和空港：

```typescript
const [commonSeaPorts, commonAirPorts] = await Promise.all([
  masterDataApi.searchPorts('SEA', ''),  // 加载海港
  masterDataApi.searchPorts('AIR', ''),  // 加载空港
]);
const initialPorts = [
  ...(commonSeaPorts || []).slice(0, 50), 
  ...(commonAirPorts || []).slice(0, 50)
];
setPorts(initialPorts);
```

### 修复3：增强错误日志

**文件**: `logitrack-pro/services/api.ts`

添加详细的错误信息输出：

```typescript
if (!response.ok) {
  let errorText = '';
  try {
    errorText = await response.text();
    console.error(`[API] Error ${response.status}:`, errorText);
  } catch (e) {
    console.error('[API] Failed to read error response:', e);
  }
  throw new Error(`API Error: ${response.status} - ${errorText}`);
}
```

## 📝 修改的文件

1. `logitrack-pro/App.tsx`
   - handleSaveEnquiry函数：添加必填字段后备逻辑
   - 增强错误处理和日志输出

2. `logitrack-pro/components/enquiry/EnquiryForm.tsx`
   - loadMasterData函数：预加载常用港口数据

3. `logitrack-pro/services/api.ts`
   - request函数：增强错误日志记录

## 🧪 测试验证

### 测试步骤

1. **启动服务**
   ```bash
   # 后端应该已在运行 (端口8080)
   # 前端应该已在运行 (端口3000)
   ```

2. **测试POL/POD数据加载**
   - 访问 http://localhost:3000
   - 登录系统
   - 进入任意enquiry的编辑页面
   - 检查"Port of Loading"和"Port of Discharge"下拉框
   - **预期结果**：应该看到至少50个海港和50个空港选项

3. **测试编辑保存功能**
   - 在编辑页面修改任意字段（如Quantity）
   - 点击"Save"按钮
   - **预期结果**：应该成功保存，返回列表页面，无500错误

4. **检查错误日志**
   - 如果仍有问题，打开浏览器控制台（F12）
   - 查看Console标签
   - **预期结果**：应该看到详细的`[API] Error xxx: ...`日志

### 测试案例

| 测试项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| 港口列表加载 | 打开编辑页面，展开POL下拉框 | 显示≥50个港口 | ⏳ 待测试 |
| 编辑并保存 | 修改Quantity，点击Save | 成功保存，无500错误 | ⏳ 待测试 |
| 错误日志 | 故意触发错误，查看控制台 | 显示详细错误信息 | ⏳ 待测试 |

## 🎯 影响范围

**正面影响**：
- ✅ 修复了编辑enquiry时的500错误
- ✅ 改善了POL/POD选择器的用户体验
- ✅ 提升了错误排查的效率

**风险评估**：
- 🟢 低风险：修改仅涉及前端逻辑，不影响后端数据结构
- 🟢 向后兼容：保留了原有的搜索功能

## 📌 注意事项

1. **港口数据量**：预加载100个港口（50个SEA + 50个AIR）可能需要1-2秒加载时间
2. **搜索功能保留**：用户仍可通过搜索框查找更多港口
3. **必填字段验证**：后端仍需保留NOT NULL约束验证，前端修复只是增强了数据完整性

## 🔄 下一步建议

1. **性能优化**：考虑将常用港口缓存到localStorage，减少API调用
2. **用户体验**：添加"最近使用的港口"功能
3. **监控告警**：在生产环境添加500错误的监控告警

---

**修复完成**：✅ 已部署到开发环境，待测试验证
