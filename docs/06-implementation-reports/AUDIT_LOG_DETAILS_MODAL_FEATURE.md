# 审计日志变更详情弹窗功能实现

> **实现日期**: 2026-02-24  
> **功能**: 点击变更详情字段查看详细的修改信息  
> **状态**: ✅ 已完成

---

## 📋 功能简介

在操作日志（Audit Log）页面中，用户现在可以点击"变更详情"字段，弹出一个详细的信息窗口，显示：

- **操作基本信息**：日志ID、用户、角色、时间、操作类型等
- **变更摘要**：从数据库details字段提取的变更说明
- **字段变更详情**（UPDATE操作）：显示每个修改的字段，包括修改前后的值
- **新增数据**（CREATE操作）：显示新增的所有字段和值
- **删除数据**（DELETE操作）：显示被删除的所有字段和值
- **原始JSON数据**：高级用户可查看原始JSON格式的数据

---

## 🎯 功能特性

### 1. 智能弹窗展示

根据操作类型自动调整显示内容：

```
UPDATE 操作 → 显示修改前后对比
CREATE 操作 → 显示新增的数据
DELETE 操作 → 显示被删除的数据
```

### 2. 字段变更对比

- **修改前（红色背景）**：原始值
- **修改后（绿色背景）**：新值
- **中文标签**：自动转换成用户友好的中文字段名

示例：`quantity` → `数量`

### 3. 可视化展示

- 彩色标签区分操作类型（新增、修改、删除）
- 响应式设计，支持各种屏幕宽度
- 平滑的弹窗打开/关闭动画
- 可固定的头部和页脚

### 4. 高级功能

- **可折叠的原始JSON数据**：展开查看完整的JSON格式数据
- **复杂字段过滤**：自动隐藏offers/containerLines等复杂关联数据
- **容错处理**：JSON解析失败时优雅降级
- **超长内容自动换行**：防止界面被撑破

---

## 📁 实现文件

### 新增文件

#### 1. [components/settings/ChangeDetailsModal.tsx](ChangeDetailsModal.tsx)

**用途**：变更详情弹窗组件

**主要功能**：
- `parseJSON()`：安全的JSON解析
- `formatValue()`：格式化显示值
- `getChangedFields()`：对比两个对象，提取变更字段
- `getFieldLabel()`：将英文字段名转换为中文
- UI布局：使用Tailwind CSS实现响应式设计

**导出**：
```typescript
interface ChangeDetailsModalProps {
  isOpen: boolean;                    // 弹窗是否打开
  onClose: () => void;               // 关闭回调
  log: AuditLogItem | null;         // 审计日志数据
}

export const ChangeDetailsModal: React.FC<ChangeDetailsModalProps>
```

### 修改文件

#### 2. [components/settings/AuditLog.tsx](AuditLog.tsx)

**修改内容**：

1. **导入新组件**
   ```typescript
   import { Eye } from 'lucide-react';
   import ChangeDetailsModal from './ChangeDetailsModal';
   ```

2. **添加状态管理**
   ```typescript
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
   ```

3. **添加事件处理**
   ```typescript
   const handleOpenDetailsModal = (log: AuditLogItem) => {
     setSelectedLog(log);
     setIsModalOpen(true);
   };

   const handleCloseModal = () => {
     setIsModalOpen(false);
     setSelectedLog(null);
   };
   ```

4. **修改表格展示**
   - 将"变更详情"单元格改为可点击的按钮
   - 添加Eye图标（📌）表示可交互
   - 截断显示文本，完整内容在弹窗中显示

5. **集成弹窗组件**
   ```typescript
   <ChangeDetailsModal 
     isOpen={isModalOpen}
     onClose={handleCloseModal}
     log={selectedLog}
   />
   ```

---

## 🎨 UI/UX 设计

### 弹窗布局

```
┌─────────────────────────────────────────────────┐
│ 变更详情                                    ✕ │  ← 标题栏（蓝色渐变）
├─────────────────────────────────────────────────┤
│ 操作信息                                        │  ← 操作基本信息
│ ├─ 日志ID: 29                                  │
│ ├─ 用户: admin                                 │
│ ├─ 角色: Admin                                 │
│ └─ 时间: 2026-02-24 13:29:13                  │
│                                                 │
│ 变更摘要                                        │  ← 变更摘要（蓝色背景）
│ 数量(Quantity): 250.000 → 300.000              │
│ 状态(Status): New → Quoted                     │
│                                                 │
│ 字段变更详情                                    │  ← 字段对比（红绿对比）
│ ┌─────────────────────────────────────────┐   │
│ │ 字段: 数量(Quantity)                    │   │
│ │ 修改前 | 250.000   │ 修改后 | 300.000   │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ 📋 原始数据 (JSON) ▼                           │  ← 可折叠的原始数据
│                                                 │
├─────────────────────────────────────────────────┤
│                                  [关闭]         │  ← 页脚
└─────────────────────────────────────────────────┘
```

### 颜色方案

- **标题栏**：`bg-indigo-600` - 专业蓝色
- **修改前**：`bg-red-50 border-red-200` - 红色表示删除/旧值
- **修改后**：`bg-green-50 border-green-200` - 绿色表示新增/新值
- **摘要**：`bg-blue-50 border-blue-200` - 蓝色表示信息
- **删除**：`bg-red-50` - 红色
- **新增**：`bg-green-50` - 绿色

---

## 💡 使用示例

### 场景1：查看Enquiry修改记录

1. 登录系统（admin/admin123456）
2. 进入 Settings → 操作日志
3. 找到一条UPDATE类型的记录
4. 点击"变更详情"字段中的链接或Eye图标

**显示内容**：
```
操作信息
├─ 日志ID: 29
├─ 用户: admin
├─ 角色: ADMIN_USER
└─ 操作时间: 2026-02-24 13:29:13

变更摘要
└─ 数量(Quantity): 250.000 → 300.000; 状态(Status): New → Quoted

字段变更详情
├─ 数量(Quantity)
│  ├─ 修改前: 250.000
│  └─ 修改后: 300.000
├─ 状态(Status)
│  ├─ 修改前: New
│  └─ 修改后: Quoted
└─ CN定价管理员(CnPricingAdmin)
   ├─ 修改前: null
   └─ 修改后: FINAL_TEST
```

### 场景2：查看新增记录

点击CREATE类型的记录的变更详情

**显示内容**：
```
新增数据
├─ 参考编号: CN2601043-S
├─ 状态: New
├─ 数量: 200
├─ 产品代码: SEA
└─ ...其他字段
```

### 场景3：查看原始JSON

点击"📋 原始数据 (JSON)" 展开

**显示内容**：
```
修改前数据
{
  "id": 43,
  "quantity": 250.0,
  "status": "New",
  ...
}

修改后数据
{
  "id": 43,
  "quantity": 300.0,
  "status": "Quoted",
  ...
}
```

---

## 🔧 技术实现细节

### 关键函数

#### 1. getChangedFields()
```typescript
// 对比oldObj和newObj，返回所有变更的字段
// 排除offers和containerLines等复杂关联数据
// 返回格式: { field, oldVal, newVal }[]
```

**逻辑**：
- 收集两个对象的所有键
- 逐个比较值（使用JSON.stringify避免引用比较）
- 格式化为可读的字符串

#### 2. parseJSON()
```typescript
// 安全的JSON解析，异常时返回null而不是抛出错误
```

**优势**：
- 避免页面崩溃
- 支持部分JSON数据为空的情况

#### 3. getFieldLabel()
```typescript
// 将英文字段名映射为中文
// 如：productCode → '产品代码'
// 如果字段不在映射表中，直接返回原字段名
```

**支持的字段**：20+个常用字段

---

## 🚀 性能优化

### 1. 按需渲染
- 弹窗组件只在 `isOpen === true` 时才渲染
- 其他时候返回 `null`

### 2. 事件处理
- 使用局部状态管理，避免不必要的重新渲染
- 关闭弹窗时明确清空 `selectedLog`

### 3. 数据处理
- JSON解析缓存（通过 `parseJSON()` 函数）
- 字段对比只在 `UPDATE` 操作时执行
- 自动过滤复杂关联数据，减少显示内容

### 4. DOM优化
- 使用 `max-h-64 overflow-y-auto` 限制原始JSON显示高度
- 避免无限长的列表渲染

---

## 📝 中文字段名映射表

支持的字段及其中文名称：

| 英文字段 | 中文名称 |
|---------|---------|
| id | ID |
| referenceNumber | 参考编号 |
| status | 状态 |
| enquiryReceivedDate | 询价收到日期 |
| issueDate | 发行日期 |
| productCode | 产品代码 |
| productAbbr | 产品缩写 |
| salesCountryCode | 销售国家 |
| salesOfficeId | 销售办公室 |
| salesPicId | 销售PIC |
| cargoTypeCode | 货物类型 |
| quantity | 数量 |
| quantityUomCode | 数量单位 |
| volumeCbm | 体积(CBM) |
| quantityTeu | TEU |
| commodity | 商品 |
| cnPricingAdmin | CN定价管理员 |
| assignedCnOfficeCode | 分配CN办公室 |
| polId | 起运港ID |
| podId | 目的港ID |
| bookingConfirmed | 预订确认 |
| remark | 备注 |

---

## ✅ 测试清单

- [x] 点击变更详情字段能打开弹窗
- [x] UPDATE操作显示字段对比
- [x] CREATE操作显示新增数据
- [x] DELETE操作显示删除数据
- [x] 原始JSON数据可正常显示
- [x] 弹窗能正常关闭
- [x] 响应式设计，支持小屏幕
- [x] 长文本自动换行
- [x] 中文字段名正确显示
- [x] JSON解析异常处理

---

## 🔮 后续优化建议

### 1. 增强功能

- **搜索过滤**：在变更详情中搜索特定字段
- **导出功能**：将变更详情导出为PDF或CSV
- **对比高亮**：字符级别的差异高亮（如Diff工具）
- **变更历史链**：显示同一资源的多条变更记录的对比

### 2. UI/UX改进

- **暗黑模式**：支持系统暗黑模式
- **自定义列宽**：用户可调整表格列宽
- **快捷键**：ESC关闭弹窗，↕️上下导航查看其他记录
- **预加载**：列表悬停时预加载弹窗数据

### 3. 性能优化

- **虚拟滚动**：处理超大JSON数据
- **代码分割**：拆分ChangeDetailsModal为单独的chunk
- **防抖处理**：点击事件防抖，避免重复打开

### 4. 数据增强

- **用户头像**：显示操作用户的头像
- **操作原因**：添加操作备注/原因字段
- **批量操作**：显示批量操作的汇总信息
- **关联审计**：链接到相关的其他审计日志

---

## 🐛 已知限制

1. **复杂关联**：自动过滤offers/containerLines，不显示具体内容
2. **大型JSON**：超过10KB的JSON可能显示不完整
3. **二进制数据**：无法显示二进制或加密数据
4. **时区**：所有时间按本地时区显示

---

## 📞 支持

如遇问题，请检查：

1. 浏览器控制台是否有错误
2. 网络请求是否成功（F12 → Network）
3. 后端是否正常运行

---

## ✨ 总结

本功能通过以下特点改进了审计日志的用户体验：

1. **可视化展示**：用颜色区分修改前后，清晰明了
2. **智能自适应**：根据操作类型自动调整显示内容
3. **详细信息**：既提供摘要也提供原始数据，满足不同用户需求
4. **易于使用**：一键打开弹窗，无需额外操作
5. **容错设计**：优雅处理异常情况，不影响应用稳定性

---

**实现完成时间**: 2026-02-24  
**文件数量**: 1个新增 + 1个修改  
**代码行数**: ~400行  
**编译状态**: ✅ 成功
