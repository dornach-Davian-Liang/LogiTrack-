# 修复验证测试指南

## 🎯 测试目标

验证两个主要bug修复：
1. **POD Country自动映射** - 选择目的港后自动填充国家名称
2. **表单提交错误** - 修复500错误，成功保存询价记录

---

## 📋 前置条件

✅ 确认后端已启动: `http://localhost:8888/api/dict/countries` 返回200
✅ 确认前端已启动: `http://localhost:3000` 正常加载
✅ 浏览器打开开发者工具 (F12) 并切换到Console标签

---

## 🧪 测试场景1: POD Country自动映射

### 步骤1: 打开新建询价表单
1. 访问 `http://localhost:3000`
2. 点击"新建询价"或"创建新询价"按钮
3. 表单应该加载成功

### 步骤2: 填写销售信息
1. 找到"基本信息"部分 > "CN定价管理员" 字段
2. 选择任意选项（例如 "Admin" 或 "Manager"）
3. **新字段检查** ⭐: 应该看到"指定的CN办公室"下拉框
4. 选择任意办公室（例如 "ShangHai" 或 "Beijing"）

### 步骤3: 触发POD Country映射
1. 找到"销售信息"部分 > "销售国家"字段
2. 选择 **"Germany"**
3. 等待销售负责人列表加载
4. 在销售负责人中选择 **"ANN-KATHRIN ZEHM"** 或任意其他选项
5. 验证"销售办公室"字段自动填充

### 步骤4: 测试POD映射 ⭐ 关键
1. 找到"港口信息"部分 > "目的港(POD)"
2. 在搜索框输入 **"Abu Dhabi"** 或 **"Dubai"**
3. 从下拉列表选择 **"Abu Dhabi (AUH), AE"**
4. **关键验证**:
   - ✅ 下方"目的港国家(POD Country)"字段应该显示 **"United Arab Emirates"**
   - ✅ 控制台输出应该包含:
     ```
     updatePodCountries called with: ['2']
     Selected PODs: [...] (非空数组)
     Country codes: ['AE']
     Final country names: United Arab Emirates
     ```

### 预期结果
✅ POD Country字段自动显示选中港口所在的国家名称

### 如果失败
❌ 检查浏览器Console中的错误信息:
```
- "Selected PODs: []" → 类型转换失败
- "Country codes: []" → 国家代码提取失败  
- "Final country names: (空)" → 国家查找失败
```

---

## 🧪 测试场景2: 表单提交保存

### 步骤1: 完整填写表单
在之前的表单上，继续补充以下必需字段:

1. **基本信息** 部分:
   - ✅ CN定价管理员: 选择任意 (已完成)
   - ✅ 指定的CN办公室: 选择任意 (已完成)
   - ✅ 产品类型: 默认 "SEA" (不需要改动)
   - ✅ 货物类型: 默认 "FCL" (不需要改动)

2. **销售信息** 部分:
   - ✅ 销售国家: 选择 "Germany" (已完成)
   - ✅ 销售负责人: 选择任意 (已完成)
   - ✅ 销售办公室: 自动填充 (已完成)

3. **港口信息** 部分:
   - ✅ 起运港(POL): 选择任意港口 (例如 "Shanghai" 或 "Rotterdam")
   - ✅ 目的港(POD): 选择 "Abu Dhabi (AUH), AE" (已完成)
   - ✅ 目的港国家: 自动显示 (已完成)

4. **其他信息** 部分 (如果有):
   - 货物描述: 可选
   - 箱型信息: 可选

### 步骤2: 点击保存
1. 点击表单右上角的"保存"按钮
2. 检查Console输出

### 步骤3: 验证成功
**成功标志**:
- ✅ 表单消失，返回列表页面
- ✅ 新建的询价记录出现在列表中
- ✅ Console中没有红色错误信息
- ✅ 网络标签中的POST请求返回 **201** 或 **200** 状态码

### 如果提交失败

❌ **错误1**: 弹窗显示"请选择..."
- 原因: 某个必需字段未填写
- 解决: 根据提示填写缺失字段

❌ **错误2**: 弹窗显示"Failed to save enquiry"
- 检查Console错误:
  ```
  App.tsx:68 [App] Save error: Error: API Error: 500 - 
  ```
- 查看Network标签中POST请求的Response
- 可能的错误:
  ```json
  {
    "error": "Column 'XX_field' cannot be null",
    "type": "DataIntegrityViolationException"
  }
  ```
- 对照上表，填写所有必需字段

❌ **错误3**: 网络请求失败 (ERR_CONNECTION_REFUSED)
- 后端可能未启动
- 验证: `curl http://localhost:8888/api/dict/countries`
- 如果失败，启动后端:
  ```bash
  cd /workspaces/LogiTrack-/backend
  java -jar target/logitrack-backend-1.0.0.jar --spring.profiles.active=mysql
  ```

---

## 🔍 Console调试信息

### 正常流程的Console输出

```
[Page Load]
✅ Available ports: (34651) [{…}, {…}, …]
✅ Available allCountries: (233) [{…}, {…}, …]

[Select POD]
✅ updatePodCountries called with: ['2']
✅ Pod IDs as strings: ['2']
✅ Port 2: selected=true
✅ Selected PODs: [{value: 2, label: "Abu Dhabi (AUH), AE", countryCode: "AE", …}]
✅ Country codes: ['AE']
✅ Looking for country AE, found: {value: "AE", label: "United Arab Emirates"}
✅ Final country names: United Arab Emirates

[Submit Form]
✅ Form validation passed
✅ POST /api/enquiries with data: {...}
✅ Response Status: 201 Created
```

### 常见错误信息

```
❌ Selected PODs: []
   → 原因: 字符串/数字类型不匹配（旧代码）

❌ Final country names: (空或"未找到对应国家")
   → 原因: 国家代码提取失败或国家查询失败

❌ Error: API Error: 500
   → 原因: 后端缺少必需字段（见BUGFIX_ANALYSIS_REPORT.md）
```

---

## ✅ 完整检查清单

### 开发工具检查
- [ ] 后端服务运行中 (Port 8888)
- [ ] 前端服务运行中 (Port 3000)
- [ ] 浏览器Console打开
- [ ] Network标签可见（用于检查API调用）

### POD映射测试
- [ ] 能够选择目的港
- [ ] 选择后Console有 "updatePodCountries called" 日志
- [ ] 国家字段自动填充正确的国家名称
- [ ] 可以正确处理不同国家的港口

### 表单提交测试
- [ ] 所有必需字段都有提示（红色*号）
- [ ] 填写不完整时有验证提示
- [ ] 填写完整后能够成功提交
- [ ] 提交后返回列表页面
- [ ] 新记录出现在列表中

### 数据验证
- [ ] 提交的数据包含所有必需字段
- [ ] API返回201 Created状态码
- [ ] 返回的数据包含生成的ID和referenceNumber

---

## 📞 问题反馈

如果测试中遇到问题，请提供:

1. **Console错误信息** (完整的错误堆栈)
2. **Network标签截图** (POST请求的Request/Response)
3. **失败时的步骤** (重现问题的确切步骤)
4. **浏览器版本** 和 **操作系统**

---

**测试完成后请报告结果** ✅ 成功 / ❌ 失败 / ⚠️ 部分成功
