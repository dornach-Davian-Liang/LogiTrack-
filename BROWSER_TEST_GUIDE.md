# 快速验证指南 - 浏览器UI测试

## 前置条件检查 ✅

所有服务都已就绪：
- ✅ 后端运行在 http://localhost:8888
- ✅ 前端运行在 http://localhost:3000
- ✅ 数据库包含13条enquiry记录（10条原有 + 3条新增）

## 验证步骤

### 步骤1: 打开应用并检查列表显示

1. **打开浏览器**
   - 访问: http://localhost:3000

2. **登录系统**（如果需要）
   - 使用系统账号登录

3. **导航到Enquiry Management**
   - 在左侧菜单或顶部导航栏找到 "Enquiry Management"
   - 点击进入列表页面

4. **验证列表显示**
   - 页面应该显示enquiry列表表格
   - 应该看到至少13条记录
   - 最上方应该显示最新创建的记录：
     * CN2602003-A (ID=21)
     * CN2602002-S (ID=20)
     * CN2602001-A (ID=19)

5. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 切换到 "Console" 标签
   - 应该看到类似以下的日志：
     ```
     [EnquiryList] API response: {
       totalElements: 13,
       totalPages: 1,
       contentLength: 13,
       firstItem: { id: 21, referenceNumber: "CN2602003-A", ... }
     }
     ```

### 步骤2: 通过UI创建第一条Enquiry

1. **点击"New Enquiry"按钮**
   - 在列表页面找到创建按钮
   - 应该打开enquiry创建表单

2. **填写基本信息**
   ```
   Sales PIC Name: 王五
   Issue Date: 2026-02-02（或今天日期）
   Product Code: SEA（从下拉框选择）
   Booking Party Name: 深圳物流公司
   Booking Country: CN
   Shipping Method: SEA
   Commodity: 机械设备
   ```

3. **添加Container Line**
   - 找到 "Container Lines" 部分
   - 点击 "Add Container" 按钮
   - 填写容器信息：
     * Container Type: 20GP（从下拉框选择，ID=1）
     * Quantity: 10
     * Raw Text: 10x20GP标准集装箱

4. **保存数据**
   - 点击页面底部的 "Save" 或 "Submit" 按钮
   - 观察是否有错误消息

5. **验证保存结果**
   - 应该显示成功消息（如"Enquiry saved successfully"）
   - 页面应该跳转到列表或详情页
   - 如果跳转到列表，新记录应该出现在最上方
   - 记录下新创建的ID和Reference Number

### 步骤3: 通过UI创建第二条Enquiry

1. **再次点击"New Enquiry"**

2. **填写基本信息**
   ```
   Sales PIC Name: 赵六
   Issue Date: 2026-02-02
   Product Code: AIR
   Booking Party Name: 广州进出口贸易
   Booking Country: CN
   Shipping Method: AIR
   Commodity: 电子元器件
   ```

3. **添加多个Container Lines**
   
   **第一个容器**:
   - Container Type: 40GP（ID=2）
   - Quantity: 5
   - Raw Text: 5x40GP

   **第二个容器**:
   - Container Type: 40HC（ID=3）
   - Quantity: 3
   - Raw Text: 3x40HC高柜

4. **保存并验证**
   - 点击 "Save"
   - 确认成功消息
   - 验证新记录出现在列表中

### 步骤4: 验证创建的数据

1. **在列表中查看新记录**
   - 列表现在应该显示15条记录（13条已有 + 2条新创建）
   - 找到你创建的两条记录
   - 验证以下字段显示正确：
     * Reference Number
     * Status（应该是"New"）
     * Issue Date
     * Product Code

2. **点击记录查看详情**
   - 点击任一新创建的记录
   - 应该打开EnquiryDetail页面
   - 验证5个Tab都能正常切换：
     * Basic Info
     * Cargo Info
     * Pricing
     * Offers
     * Container Lines

3. **检查Container Lines Tab**
   - 切换到 "Container Lines" tab
   - 应该看到你创建的容器行
   - 验证显示的数据：
     * Container Type/Code
     * Quantity
     * TEU per Unit
     * Total TEU
     * Raw Text

## 问题排查

### 问题1: 列表不显示数据

**症状**: 页面加载完成但列表为空

**排查步骤**:
1. 打开浏览器控制台（F12）
2. 检查是否有JavaScript错误（红色消息）
3. 切换到 "Network" 标签
4. 刷新页面
5. 找到 `/api/enquiries` 请求
6. 点击查看：
   - Status Code（应该是200）
   - Response（应该包含数据）

**可能的原因**:
- API返回数据但前端没有正确渲染
- 字段映射问题导致数据无法显示
- 组件渲染错误

**解决方案**:
1. 查看控制台的 `[EnquiryList] API response` 日志
2. 如果有日志但没数据，检查EnquiryList.tsx的字段映射
3. 如果没有日志，检查api.ts中的enquiry API配置

### 问题2: 保存时报错

**症状**: 点击Save后显示错误消息或500错误

**排查步骤**:
1. 查看错误消息的详细内容
2. 打开Network标签
3. 找到POST /api/enquiries请求
4. 查看Response中的错误详情

**可能的错误和解决方案**:

| 错误消息 | 原因 | 解决方案 |
|---------|------|---------|
| "container_qty cannot be null" | 容器数量未填写 | 确保Quantity字段有值 |
| "containerTypeId is required" | 未选择容器类型 | 从下拉框选择Container Type |
| "Network Error" | 后端未运行 | 重启后端服务 |
| "401 Unauthorized" | 登录已过期 | 重新登录 |

**如果遇到新的错误**:
1. 复制完整的错误消息
2. 检查后端日志: `tail -f /workspaces/LogiTrack-/backend/backend.log`
3. 查找对应的错误堆栈信息

### 问题3: Container Lines不显示

**症状**: Enquiry创建成功，但Container Lines tab为空

**排查步骤**:
1. 在列表页面点击记录查看详情
2. 切换到Container Lines tab
3. 查看控制台是否有错误
4. 在Network标签中查找 `/api/enquiries/{id}` 请求
5. 验证响应中是否包含 `containerLines` 数组

**解决方案**:
- 如果API响应包含containerLines但不显示，检查EnquiryDetail组件的渲染逻辑
- 如果API响应不包含containerLines，检查后端是否正确保存了数据

## 验证清单

请在完成测试后勾选：

### 基本功能
- [ ] 列表页面能正常加载
- [ ] 列表显示13条（或更多）enquiry记录
- [ ] 最新的3条记录（ID 19-21）显示在列表中
- [ ] 分页功能正常工作
- [ ] 筛选功能正常工作

### 创建功能
- [ ] "New Enquiry" 按钮能正常打开表单
- [ ] 所有必填字段都有清晰标识
- [ ] Container Type下拉框有数据
- [ ] 能添加Container Line
- [ ] 能添加多个Container Lines
- [ ] 保存成功并显示确认消息
- [ ] 新记录出现在列表中

### 详情页面
- [ ] 点击列表记录能打开详情页
- [ ] 5个Tab都能正常切换
- [ ] Basic Info tab显示正确信息
- [ ] Container Lines tab显示容器数据
- [ ] 容器数据包含所有字段（type, qty, TEU等）

### 数据完整性
- [ ] 新创建的记录有正确的Reference Number
- [ ] Status字段显示"New"
- [ ] Container Lines数量正确
- [ ] TEU计算正确

## 成功标准

所有测试通过的标准：
1. ✅ 能看到列表中的13条（或更多）记录
2. ✅ 能通过UI成功创建2条新enquiry
3. ✅ 新创建的enquiry包含正确的container lines
4. ✅ 详情页面所有tab都能正常显示
5. ✅ 没有500错误或JavaScript错误

## 测试数据记录

请记录你创建的enquiry信息：

### 第一条Enquiry
- ID: ________________
- Reference Number: ________________
- Sales PIC Name: 王五
- Booking Party: 深圳物流公司
- Container Lines: 1条（10x20GP）
- 保存结果: ☐ 成功 ☐ 失败

### 第二条Enquiry
- ID: ________________
- Reference Number: ________________
- Sales PIC Name: 赵六
- Booking Party: 广州进出口贸易
- Container Lines: 2条（5x40GP + 3x40HC）
- 保存结果: ☐ 成功 ☐ 失败

## 完成后

如果所有测试都通过：
- ✅ 两个bug都已修复
- ✅ 系统功能正常
- ✅ 可以正常使用

如果遇到问题：
1. 记录详细的错误信息
2. 截图保存错误页面
3. 复制控制台的错误日志
4. 查看后端日志文件

---

**预计测试时间**: 15-20分钟  
**难度级别**: 简单  
**前提知识**: 基本的Web应用操作
