# Report 模块快速测试指南

## 🎯 测试目标

验证 Report Dashboard 功能正常工作，且不影响现有页面功能。

---

## ⚡ 快速开始

### 前置条件
- ✅ MySQL 数据库运行中
- ✅ 数据库已导入测试数据
- ✅ Node.js 和 JDK 已安装

### 1. 启动后端服务

Windows PowerShell:
```powershell
cd c:\logitrack\LogiTrack--update-status-report-20260126023903\backend
.\mvnw.cmd clean install
.\mvnw.cmd spring-boot:run
```

等待看到类似输出：
```
Started LogiTrackApplication in X.XXX seconds (JVM running for X.XXX)
```

### 2. 启动前端服务

新开一个 PowerShell 窗口：
```powershell
cd c:\logitrack\LogiTrack--update-status-report-20260126023903\logitrack-pro
npm install
npm run dev
```

等待看到：
```
  ➜  Local:   http://localhost:5173/
```

---

## 🧪 测试步骤

### 测试 1: 访问 Report Dashboard ✅

1. 打开浏览器访问 `http://localhost:5173`
2. 登录系统（如需要）
3. 在左侧边栏找到 "Reports" 菜单项（带图表图标 📊）
4. 点击 "Reports"

**预期结果**:
- 页面切换到 Report Dashboard
- 侧边栏 "Reports" 菜单高亮显示
- 页面标题显示 "报表仪表板"

**如果失败**: 检查浏览器控制台是否有错误

---

### 测试 2: 数据加载 ✅

在 Report Dashboard 页面：

1. 观察页面是否显示加载状态（转圈图标）
2. 等待数据加载完成

**预期结果**:
- 显示4个总览卡片：
  - 总询价数（蓝色边框）
  - 已报价（绿色边框）
  - 待处理（黄色边框）
  - 已确认（紫色边框）
- 每个卡片显示数字和趋势图标

**如果加载失败**:
- 检查后端是否正常运行
- 打开浏览器开发者工具 (F12)
- 查看 Network 标签页，找到 `/api/statistics/dashboard` 请求
- 检查响应状态码和数据

---

### 测试 3: 月份选择 ✅

1. 找到页面右上角的月份选择下拉框
2. 点击下拉框，查看是否有最近12个月的选项
3. 选择不同的月份

**预期结果**:
- 下拉框显示最近12个月（格式：2025年2月）
- 选择不同月份后，页面数据重新加载
- 数据根据选择的月份更新

---

### 测试 4: 刷新功能 ✅

1. 找到页面右上角的 "刷新" 按钮
2. 点击刷新按钮

**预期结果**:
- 页面显示加载状态
- 数据重新加载
- 显示最新数据

---

### 测试 5: 详细统计展示 ✅

检查以下统计区域是否正常显示：

1. **状态分布区**（左侧）
   - 显示各状态及其数量
   - 显示百分比
   - 进度条可视化

2. **月度趋势区**（右侧）
   - 显示最近6个月数据
   - 显示月份和数量
   - 显示环比变化（上升/下降图标）

3. **地理分布区**（3列）
   - 热门国家 Top 5
   - 主要起运港 Top 5（可能为空）
   - 主要目的港 Top 5（可能为空）

4. **货物类型分布区**
   - 显示各货物类型卡片
   - 显示数量和百分比

**预期结果**: 所有区域正常显示，布局整齐

---

### 测试 6: 原有功能不受影响 ✅

依次测试以下菜单项，确保功能正常：

1. **Dashboard（原有仪表板）**
   - 点击侧边栏 "Dashboard"
   - 检查是否显示原有的 KPI 卡片和最近询价列表
   - ✅ 正常 / ❌ 异常

2. **Enquiries（询价管理）**
   - 点击侧边栏 "Enquiries"
   - 检查询价列表是否正常显示
   - 尝试创建新询价
   - 尝试查看询价详情
   - ✅ 正常 / ❌ 异常

3. **Master Data（主数据）**
   - 点击 "Countries" - 检查国家列表
   - 点击 "Ports" - 检查港口列表
   - 点击 "Sales PICs" - 检查销售人员列表
   - 点击 "Container Types" - 检查箱型列表
   - ✅ 所有正常 / ❌ 有异常

**预期结果**: 所有原有功能正常工作，无影响

---

### 测试 7: 错误处理 ✅

模拟错误场景：

1. **后端断开测试**
   - 停止后端服务（Ctrl+C）
   - 在前端刷新 Report Dashboard
   - 观察是否显示错误提示

   **预期结果**: 显示红色错误提示框，提供"重试"按钮

2. **恢复测试**
   - 重新启动后端服务
   - 点击 "重试" 按钮
   - 观察数据是否恢复正常加载

   **预期结果**: 数据正常加载

---

### 测试 8: API 端点测试 ✅

使用浏览器或 Postman 测试 API：

#### 测试 Dashboard API
```bash
# 获取当前月份统计
GET http://localhost:8080/api/statistics/dashboard

# 获取指定月份统计
GET http://localhost:8080/api/statistics/dashboard?month=2025-01
```

**预期响应** (JSON):
```json
{
  "overview": {
    "totalEnquiries": 120,
    "quoted": 80,
    "pending": 30,
    "confirmed": 10,
    "totalEnquiriesChange": 15,
    "quotedChange": 10,
    "confirmedChange": 5
  },
  "statusBreakdown": {
    "New": { "count": 30, "percentage": "25.0" },
    "Quoted": { "count": 80, "percentage": "66.7" },
    "Confirmed": { "count": 10, "percentage": "8.3" }
  },
  "monthlyTrend": [...],
  "topCountries": [...],
  "topOrigins": [],
  "topDestinations": [],
  "cargoTypes": [...]
}
```

---

## 🐛 常见问题

### Q1: 页面显示空数据或 0
**可能原因**: 
- 数据库没有对应月份的数据
- 数据库连接失败

**解决方法**:
1. 检查数据库中 `enquiry` 表是否有数据
2. 检查 `enquiry` 表的 `received_date` 字段是否有当前月份的记录
3. 尝试选择其他月份

### Q2: API 请求失败 (404)
**可能原因**: 
- 后端服务未启动
- 端口冲突

**解决方法**:
1. 检查后端控制台输出
2. 确认后端运行在 `http://localhost:8080`
3. 检查防火墙设置

### Q3: 前端编译错误
**可能原因**: 
- 依赖未安装
- TypeScript 类型错误

**解决方法**:
```bash
# 清理并重新安装依赖
rm -rf node_modules
rm package-lock.json
npm install

# 检查类型错误
npm run build
```

### Q4: 侧边栏没有 "Reports" 菜单项
**可能原因**: 
- App.tsx 未正确更新
- 浏览器缓存

**解决方法**:
1. 硬刷新浏览器 (Ctrl+Shift+R)
2. 清除浏览器缓存
3. 检查 App.tsx 是否有 report-dashboard 路由

---

## 📊 测试检查清单

打印此清单并逐项勾选：

### 前端功能
- [ ] Report Dashboard 页面可访问
- [ ] 侧边栏 "Reports" 菜单正常工作
- [ ] 加载状态显示
- [ ] 总览卡片正确显示
- [ ] 月份选择器可用
- [ ] 刷新按钮可用
- [ ] 状态分布正确显示
- [ ] 月度趋势正确显示
- [ ] 地理分布正确显示
- [ ] 货物类型分布正确显示
- [ ] 错误处理正常

### 原有功能不受影响
- [ ] Dashboard（原有）正常
- [ ] Enquiry List 正常
- [ ] Enquiry Form 正常
- [ ] Enquiry Detail 正常
- [ ] Master Data - Countries 正常
- [ ] Master Data - Ports 正常
- [ ] Master Data - Sales PICs 正常
- [ ] Master Data - Container Types 正常

### 后端功能
- [ ] StatisticsController 正常启动
- [ ] `/api/statistics/dashboard` 返回正确数据
- [ ] 月份参数正常工作
- [ ] 数据计算正确（环比、占比）
- [ ] 错误处理正常（500 错误）

### 代码质量
- [ ] 前端无编译错误
- [ ] 前端无 TypeScript 错误
- [ ] 后端无编译错误
- [ ] 无控制台警告

---

## ✅ 测试通过标准

所有以下条件满足即为测试通过：
1. ✅ Report Dashboard 页面正常访问和显示
2. ✅ 所有统计数据正确显示
3. ✅ 月份选择和刷新功能正常
4. ✅ 原有页面功能不受影响
5. ✅ 无前端编译错误
6. ✅ 无后端运行错误
7. ✅ API 端点返回正确数据

---

## 📝 测试记录模板

**测试人员**: _______________  
**测试日期**: _______________  
**测试环境**: 
- OS: Windows / Linux / Mac
- 浏览器: Chrome / Firefox / Edge
- 前端版本: _______________
- 后端版本: _______________

**测试结果**:
- 前端功能: ✅ 通过 / ❌ 失败
- 原有功能: ✅ 通过 / ❌ 失败
- 后端功能: ✅ 通过 / ❌ 失败

**发现的问题**:
1. _______________
2. _______________
3. _______________

**备注**: _______________

---

## 🚀 下一步

测试通过后：
1. 提交代码到 Git 仓库
2. 创建 Pull Request
3. 进行代码审查
4. 合并到主分支
5. 部署到测试环境
6. 进行完整回归测试

---

**文档版本**: 1.0  
**最后更新**: 2025-02-05
