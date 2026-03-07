# New Enquiry 选项框测试清单

## 前端选项框测试场景

### 1. Sales Country 下拉框 ✅
- [ ] 显示14个销售国家（不是全部233个国家）
- [ ] 格式：国家代码 - 国家名称
- [ ] 示例：AGENTS、Belgium、Switzerland、China、France等

### 2. POD Country 自动映射（基于Port选择）
- [ ] 先选择一个 POD（港口）- 例如 Shanghai
- [ ] "目的港国家" 字段应自动填充为对应国家 - 例如 CHINA

### 3. Sales PIC 级联选择
- [ ] 选择 Sales Country（例如 France）
- [ ] Sales PIC 下拉框应只显示该国家的销售人员
- [ ] 当选择不同的 Sales Country 时，Sales PIC 应该更新

### 4. Container Type 下拉框
- [ ] 显示所有集装箱类型 (20GP, 40GP, 20HC 等)
- [ ] 格式：<code> - <name>
- [ ] 示例：20GP - 20' General Purpose
- [ ] 不显示空值或错误的格式

### 5. CN Offices 下拉框
- [ ] 显示中国办公室列表
- [ ] 格式：办公室代码 - 办公室名称
- [ ] 示例：Shanghai、Shenzhen、Beijing等

### 6. Ports 港口搜索
- [ ] 在 POL（装运港）或 POD（卸货港）输入港口代码
- [ ] 实时搜索港口
- [ ] 显示港口代码 + 名称 + 国家代码
- [ ] 格式示例：[CNSGH] SHANGHAI, CN

### 7. Cargo Type & Products
- [ ] 货物类型：AIR, FCL, LCL, RAIL, SEA
- [ ] 产品类型：AIR, SEA, AIR-RAIL-SEA, RAIL, RAIL-SEA

### 8. Console 日志检查
- [ ] 打开浏览器 Console
- [ ] 不应该有任何 404 或其他错误
- [ ] 应该看到 "返回 X 个..." 的消息

## 后端 API 响应格式验证

### ✅ 已验证的 API 端点:
- `/api/dict/countries` - 返回 {value, label} 格式
- `/api/dict/sales-countries` - 返回 {value, label} 格式  
- `/api/dict/container-types` - 返回 {value, label, teuValue, isSpecial} 格式
- `/api/dict/cn-offices` - 返回 {value, label} 格式
- `/api/dict/ports` - 返回 {value, label, portCode, portType, countryCode} 格式
- `/api/dict/cargo-types` - 返回 {value, label} 格式
- `/api/dict/products` - 返回 {value, label} 格式

## 修复完成

✅ 后端 DictDTO 已更新，支持嵌套 DTO (PortDTO, ContainerTypeDTO)
✅ DictController 已更新，返回正确的 DTO 类型
✅ 所有 API 端点现在返回格式化的 {value, label} 数据结构
✅ 额外字段（portCode, portType, countryCode, teuValue, isSpecial）已包含

## 下一步测试

1. 刷新浏览器 (Ctrl+F5)
2. 打开开发者工具 Console
3. 进入 New Enquiry 页面
4. 验证所有下拉框显示正确的数据
5. 测试级联选择（Sales Country -> Sales PIC）
6. 测试 POD Country 自动映射
7. 验证 Console 中没有 404 或其他错误
