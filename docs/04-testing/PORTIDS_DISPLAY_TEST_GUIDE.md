# 港口数据显示优化 - 快速测试指南

## 🚀 快速开始

### 系统启动状态

✅ **前端**: http://localhost:3000  
✅ **后端**: http://localhost:8080  
✅ **编译**: 完全成功  

---

## 🔍 测试场景

### 场景 1: 查看多港口修改记录

**目标**: 验证港口 ID 是否正确显示为港口名称

**步骤**:

1. **登录系统**
   - URL: http://localhost:3000
   - 用户名: `admin`
   - 密码: `admin123456`

2. **进入审计日志**
   - 点击右上角 **Settings** (设置)
   - 选择 **Audit Log** (操作日志)

3. **查找港口相关修改**
   - 在表格中查找包含港口数据变更的行
   - 寻找 `resourceType` = "ENQUIRY" 且 `action` = "UPDATE" 的记录

4. **点击"变更详情"**
   - 在 `details` 列找到包含港口信息的行
   - 点击眼睛图标 👁️ 打开详情模态

5. **验证港口显示**
   
   **预期结果**:
   ```
   「字段变更详情」中应包含:
   
   字段: 起运港列表(POLs) 或 目的港列表(PODs)
   修改前: [ CNSHA Shanghai; CNNBO Ningbo; ... ]
   修改后: [ HKHKG Hong Kong; GBFXT Felixstowe; ... ]
   ```
   
   ✅ 成功: 显示港口代码和名称，而非纯数字  
   ❌ 失败: 仍显示 `[ 1, 2, 3 ]` 或 `[]`

---

### 场景 2: 新增询价含多港口

**目标**: 验证新增操作中的港口显示

**步骤**:

1. **创建新的多港口询价**
   - 进入 **Enquiry** (询价) 页面
   - 点击 **New Enquiry**
   - 在港口选择器中选择多个港口 (POL 和 POD)
   - 提交表单

2. **检查审计日志**
   - 进入 **Audit Log**
   - 查找刚创建的询价记录 (最新的 CREATE 操作)
   - 点击"变更详情"

3. **验证新增数据显示**
   
   **预期结果**:
   ```
   「新增数据」部分应包含:
   
   polIds: [ CNSHA Shanghai; CNSZX Shenzhen ]
   podIds: [ GBFXT Felixstowe ]
   ```
   
   ✅ 成功: 显示可读的港口名称  
   ❌ 失败: 显示数字 ID

---

### 场景 3: 港口信息不存在时的降级

**目标**: 验证系统处理未知港口 ID 的方式

**步骤**:

1. **检查数据库中的异常 ID**
   - 如果某些港口 ID 在系统中不存在
   - 打开任何包含该 ID 的审计日志

2. **观察显示结果**
   
   **预期结果**:
   ```
   已知港口: CNSHA Shanghai (正常显示)
   未知港口: ID:9999 (显示为 ID 备用值)
   
   示例: [ CNSHA Shanghai; ID:9999; HKHKG Hong Kong ]
   ```
   
   ✅ 成功: 自动降级，显示 `ID:xxxx`  
   ❌ 失败: 显示文本错误或崩溃

---

## 🔬 详细检查清单

### 前端功能检查

- [ ] 港口数据加载完成 (无加载卡顿)
- [ ] 港口 ID 转换为港口名称
- [ ] 多港口用分号分隔显示
- [ ] 空数组显示为 `[]`
- [ ] 单港口数据显示为 `[ CNSHA Shanghai ]`
- [ ] 多港口数据显示完整，没有截断
- [ ] 搜索结果中显示港口名称
- [ ] 原始 JSON 数据仍可展开查看

### 后端功能检查

- [ ] 审计日志表记录 podIds/polIds
- [ ] details 字段包含港口变更摘要
- [ ] 港口数组比较逻辑正确
- [ ] empty 数组处理正确

### 性能检查

- [ ] 模态窗口打开速度 < 2 秒
- [ ] 港口数据加载完成后无闪烁
- [ ] 关闭和重新打开不会重复加载 (缓存有效)
- [ ] 网络请求数量合理 (< 10 个)

---

## 📊 测试数据准备

### 在数据库中创建测试数据

```sql
-- 插入测试询价（包含多个港口）
INSERT INTO enquiry (
  reference_number, enquiry_received_date, issue_date, 
  reference_month, monthly_sequence, serial_number,
  product_code, product_abbr, status,
  cn_pricing_admin, sales_country_code, sales_office_id,
  sales_pic_id, assigned_cn_office_code, cargo_type_code,
  quantity, volume_cbm, commodity,
  pol_id, pod_id, cargo_ready_date,
  booking_confirmed, created_at, updated_at
) VALUES (
  'TEST-MULTI-PORT-001', '2026-02-24', '2026-02-24',
  '2602', 101, 0,
  'SEA', 'S', 'New',
  'TEST_ADMIN', 'CN', 1,
  1, 'SHANGHAI', 'FCL',
  100, 50.0, 'Test Cargo',
  1, 5, '2026-03-01',
  'Pending', NOW(), NOW()
);
```

---

## 🐛 常见问题排查

### Q1: 港口显示仍为数字
**排查步骤**:
1. 检查浏览器控制台是否有错误
2. 检查网络请求是否都成功 (Network 标签)
3. 检查 `portMap` 是否成功建立 (F12 打印变量)
4. 确认后端 `/api/dict/ports/search-v2` 正常工作

### Q2: 模态窗口内容为空
**排查步骤**:
1. 检查审计日志是否有 oldValue/newValue 数据
2. 检查 JSON 解析是否成功 (console.log)
3. 确认后端返回的数据格式正确

### Q3: 港口加载很慢
**排查步骤**:
1. 检查是否有网络延迟 (Network 标签)
2. 查看后端日志是否有 SQL 查询慢
3. 考虑添加港口列表缓存

---

## 📝 测试报告模板

```
测试日期: 2026-02-24
测试人员: [Your Name]
系统版本: v2.1.0

【测试结果总结】
✓ 场景 1 (多港口修改) - PASS / FAIL
✓ 场景 2 (新增询价) - PASS / FAIL
✓ 场景 3 (港口降级) - PASS / FAIL

【发现的问题】
1. [问题描述]
   重现步骤: ...
   实际结果: ...
   预期结果: ...
   截图: [attach]

【性能指标】
- 港口加载时间: [ms]
- 模态打开时间: [ms]
- 网络请求数: [count]

【备注】
[Any additional notes]
```

---

## 🎯 验收标准

✅ **必須完成**:
- [ ] 港口 ID 正确转换为港口名称
- [ ] 多港口显示完整无截断
- [ ] 空港口显示为 `[]`
- [ ] 无 JavaScript 错误或警告
- [ ] 前后端都已编译成功

⚠️ **应该但非必须**:
- [ ] 性能指标达到期望 (< 2s)
- [ ] 港口缓存工作正常
- [ ] 异常港口 ID 正确降级

❌ **不可接受**:
- [ ] 页面崩溃或卡死
- [ ] 港口数据显示错误或混乱
- [ ] 网络错误导致功能不可用

---

## 📞 支持

如有问题或需要进一步帮助，请提供:
1. **错误截图或视频**
2. **浏览器控制台错误日志**
3. **后端日志输出**
4. **具体重现步骤**

---

**测试准备完成** ✨

系统现已准备好进行测试。请按照上述步骤验证港口数据显示功能。
