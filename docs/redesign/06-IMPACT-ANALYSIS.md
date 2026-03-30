# LogiTrack Pro 询价重构 — 需求变更影响分析

> **版本**: v2.0  
> **日期**: 2026-03-23

---

## 1. 影响矩阵总览

### 1.1 按模块分类

| 模块 | 文件数 | 影响等级 | 说明 |
|------|--------|----------|------|
| **数据库** | 1 迁移脚本 | 🔴 高 | schema 重大变更, 需清空数据 |
| **后端 Entity** | 修改 2, 新增 5, 删除 2 | 🔴 高 | Enquiry + Offer 重构 |
| **后端 Repository** | 新增 5, 删除 2 | 🟡 中 | 新表对应 Repository |
| **后端 Service** | 修改 3, 重写 1 | 🔴 高 | EnquiryService + OfferService |
| **后端 Controller** | 修改 3 | 🟡 中 | Dict/Offer/Master 控制器 |
| **前端类型** | types.ts 重大修改 | 🔴 高 | 影响全部组件 |
| **前端表单** | EnquiryForm.tsx 重构 | 🔴 高 | 核心组件 ~1450 行 |
| **前端 Offer** | 全部重写 | 🔴 高 | OfferDialog + OfferManagement |
| **前端列表** | EnquiryList 修改 | 🟡 中 | 列变更 |
| **前端详情** | EnquiryDetail 修改 | 🟡 中 | 字段变更 |
| **前端报表** | Dashboard 等修改 | 🟢 低 | 统计维度更新 |
| **AI 模块** | SQL 更新 | 🟡 中 | 10 个分析函数 |
| **新增组件** | 6 个 | 🔴 高 | 全新开发 |

### 1.2 按需求分类

| 需求 | 数据库 | 后端 | 前端 | AI | 报表 |
|------|--------|------|------|-----|------|
| #1 字段重命名 | — | — | 🟢 | — | — |
| #2 Product Type | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 |
| #3 Status | 🔴 | 🔴 | 🔴 | 🟡 | 🟡 |
| #4 Sales 级联 | 🟡 | 🟡 | 🟡 | — | — |
| #5 CN Office | — | — | — | — | — |
| #6 Cargo Type | 🔴 | 🔴 | 🔴 | 🟡 | 🟡 |
| #7 删除字段 | 🟡 | 🟡 | 🟡 | — | — |
| #8 多 POL/POD | — | — | — | — | — |
| #9 Cargo Info UI | — | — | 🟡 | — | — |
| #10 Route 混合模式 | 🔴 | 🔴 | 🔴 | — | — |
| #11 Offer 矩阵 | 🔴 | 🔴 | 🔴 | — | — |
| #12 CRD 复选框 | 🟢 | 🟢 | 🟢 | — | — |

---

## 2. 对 Dashboard / 报表模块的影响

### 2.1 统计维度变更

| 旧统计维度 | 新统计维度 | 影响的组件 |
|-----------|-----------|-----------|
| Status: New/Quoted/Cancelled | Status: New/Quoted & Pending/Secured/Lost/Cancelled | Dashboard, TrendChart, StatCard |
| Booking: Yes/Rejected/Pending/Invalid | 删除 (合并到 Status) | EnhancedDashboard, CNOfficePivotTable |
| Offer Type: OCEAN/AIR/OTHER | Offer Type: FCL/LCL/AIR/BUYER-CONSOL | — (Offer 级别, 非 Enquiry 级别) |
| Cargo Type: 含 RAIL/SEA | Cargo Type: AIR/FCL/LCL/BUYER-CONSOL | DashboardFilters, ComparisonReport |

### 2.2 需更新的报表组件

| 组件 | 变更 |
|------|------|
| `Dashboard.tsx` | 状态饼图从 3 色 → 5 色; 移除 booking 相关卡片 |
| `EnhancedDashboard.tsx` | 过滤面板: status 选项 5 种; cargo type 选项 4 种 |
| `DashboardFilters.tsx` | 删除 booking status 过滤; 新增 status 5 值过滤 |
| `CNOfficePivotTable.tsx` | 转化率计算: Secured/Total 替代 Confirmed/Total |
| `TrendChart.tsx` | 趋势线颜色/标签更新 |
| `ComparisonReport.tsx` | 对比维度更新 |

### 2.3 后端 SQL 示例变更

```sql
-- 旧: Dashboard 转化率
SELECT COUNT(CASE WHEN booking_confirmed = 'Yes' THEN 1 END) / COUNT(*) AS conversion_rate

-- 新: Dashboard 转化率
SELECT COUNT(CASE WHEN status = 'Secured' THEN 1 END) / COUNT(*) AS conversion_rate

-- 旧: 已报价数量
SELECT COUNT(*) WHERE status = 'Quoted'

-- 新: 已报价数量
SELECT COUNT(*) WHERE status = 'Quoted & Pending'

-- 新增: Lost 统计
SELECT COUNT(*) WHERE status = 'Lost' AS lost_count
```

---

## 3. 对 AI 问答模块的影响

### 3.1 受影响的分析函数

| 函数 | 影响 | 变更内容 |
|------|------|----------|
| `get_enquiry_overview` | 🟡 | SQL: booking_confirmed → status |
| `get_monthly_trend` | 🟡 | SQL: 新增 Secured/Lost 计数列 |
| `get_conversion_rate` | 🟡 | conversion = Secured / Total |
| `get_cargo_type_breakdown` | 🟡 | 类型: RAIL/SEA → BUYER-CONSOL |
| `get_destination_analysis` | 🟢 | 轻微: 移除 booking 条件 |
| `get_cn_office_performance` | 🟡 | SQL: 转化率计算更新 |
| `get_period_comparison` | 🟡 | SQL: 对比维度更新 |
| `get_product_breakdown` | 🟡 | 产品: 5→7 种 |
| `get_core_vs_noncore` | 🟢 | 轻微: 统计条件更新 |
| `get_cross_analysis` | 🟡 | 多维度: 新增 status/cargoType 选项 |

### 3.2 工具函数描述更新

AI 工具函数的 `description` 需要更新，告知 LLM 新的状态枚举值和 Cargo Type 选项。否则 LLM 可能仍使用旧值进行查询。

### 3.3 安全考量

AI 模块使用预定义 SQL 模板，不存在 SQL 注入风险。但需确保新的枚举值在 SQL 模板中被正确引用（使用参数化查询或白名单）。

---

## 4. 对 RBAC / 审计模块的影响

### 4.1 RBAC 权限

| 功能 | 变更 | 权限影响 |
|------|------|----------|
| 状态变更 (Lost/Cancelled) | 需要填写原因 | 建议: OPERATING_USER 可以设置 Quoted/Secured; 仅 ADMIN 可以设置 Lost/Cancelled |
| Offer 创建 | 新结构 (Price Lines) | 权限不变: enquiry:create/update |
| Route Group 管理 | 新功能 | 继承 enquiry:create/update 权限 |
| dict_cn_pricing_admin | 已删除 | 主数据管理界面移除此入口 |

> 注: 当前 RBAC 实现较简单 (3 角色 + 权限字符串列表), 上述建议仅供参考。如需更细粒度的权限控制, 可在后续迭代中实现。

### 4.2 审计日志

审计日志 (@Audit AOP) 需确保:
- 新增字段 (cancelled_reason, lost_reason 等) 能在 old/new value JSON 中正确记录
- 路由组变更能被追踪
- Offer 的 Price Lines 变更能被追踪

---

## 5. 对搜索 / 列表的影响

### 5.1 EnquiryList 列变更

| 列 | 操作 | 说明 |
|----|------|------|
| Status | 修改 | 3→5 种状态 + 颜色标签 |
| Booking Confirmed | **删除** | 不再需要 |
| Offer Type | **删除** | 移到 Offer 详情 |
| CN Pricing Admin | **删除** | 字段已删除 |
| Product | 修改 | 支持 7 种 |
| Cargo Type | 修改 | 支持 4 种 |

### 5.2 搜索过滤参数

```typescript
// 旧
interface EnquirySearchParams {
  status?: ('New' | 'Quoted' | 'Cancelled')[];
  cargoTypes?: ('AIR' | 'FCL' | 'LCL' | 'RAIL' | 'SEA')[];
  bookingStatus?: string[];  // → 删除
}

// 新
interface EnquirySearchParams {
  status?: ('New' | 'Quoted & Pending' | 'Secured' | 'Lost' | 'Cancelled')[];
  cargoTypes?: ('AIR' | 'FCL' | 'LCL' | 'BUYER-CONSOL')[];
  productCodes?: ('AIR' | 'SEA' | 'RAIL' | 'RAIL-SEA' | 'RAIL-AIR' | 'SEA-AIR' | 'AIR-RAIL-SEA')[];
}
```

后端 `EnquiryRepository` 的动态查询也需同步更新。

---

## 6. 对主数据管理模块的影响

### 6.1 受影响的管理页面

| 页面 | 变更 |
|------|------|
| 国家管理 (CountryList) | 无变化 |
| 港口管理 (PortList) | 无变化 (port_type 已存在) |
| 销售 PIC 管理 (SalesPicList) | 无变化 (数据结构不变) |
| 容器类型管理 (ContainerTypeList) | 可能需新增 Reefer/Tank 等类型 |
| **CN Pricing Admin** | **删除此管理入口** |

### 6.2 App.tsx 导航菜单

```typescript
// 删除: master-cn-pricing-admins 菜单项 (如果存在)
// 其他菜单无变化
```

---

## 7. 对数据导出的影响

### 7.1 报表导出

`StatisticsController.export` 端点需要更新导出模板:
- 状态列: 支持 5 种值
- 删除 booking_confirmed 列
- 新增 cancelled_reason / lost_reason 列
- Cargo Type 值域更新

### 7.2 CSV 导出格式

如果系统支持 CSV 导出, 列头和值域需同步更新。

---

## 8. 向后兼容性风险

### 8.1 破坏性变更列表

| 变更 | 风险等级 | 影响范围 |
|------|----------|----------|
| enquiry.status ENUM 修改 | 🔴 高 | 必须执行迁移脚本 |
| 删除 booking_confirmed | 🔴 高 | 所有引用此字段的代码 |
| 删除 enquiry_container_line 表 | 🟡 中 | 容器信息迁移到 Offer |
| offer 表结构重建 | 🔴 高 | 所有 Offer 相关代码 |
| OfferType ENUM 修改 | 🟡 中 | 后端枚举 + 前端类型 |
| dict_cargo_type.offer_type 列删除 | 🟡 中 | 依赖此列的查询 |

### 8.2 缓解措施

1. **先执行迁移脚本**, 再部署新代码
2. **清空业务数据**避免数据不一致
3. **后端编译验证**确保所有引用更新
4. **前端 TypeScript 编译**自动发现类型错误
5. **全面测试**覆盖所有变更点

---

## 9. 文件变更清单

### 9.1 数据库文件

| 文件 | 操作 |
|------|------|
| `database/migration_v3_enquiry_redesign.sql` | **新增** |
| `database/schema_v3.sql` | **新增** (完整 DDL) |

### 9.2 后端 Java 文件

| 文件路径 | 操作 |
|----------|------|
| `entity/Enquiry.java` | **修改** (重大) |
| `entity/Offer.java` | **修改** (重大) |
| `entity/EnquiryStatus.java` | **重写** |
| `entity/OfferType.java` | **重写** |
| `entity/SubMode.java` | **新增** |
| `entity/EnquiryRouteGroup.java` | **新增** |
| `entity/OfferPriceLine.java` | **新增** |
| `entity/OfferContainerDetail.java` | **新增** |
| `entity/CancelledReason.java` | **新增** |
| `entity/LostReason.java` | **新增** |
| `entity/BookingConfirmed.java` | **删除** |
| `entity/CnPricingAdmin.java` | **删除** |
| `entity/EnquiryContainerLine.java` | **删除** |
| `repository/EnquiryRouteGroupRepository.java` | **新增** |
| `repository/OfferPriceLineRepository.java` | **新增** |
| `repository/OfferContainerDetailRepository.java` | **新增** |
| `repository/CancelledReasonRepository.java` | **新增** |
| `repository/LostReasonRepository.java` | **新增** |
| `repository/CnPricingAdminRepository.java` | **删除** |
| `repository/EnquiryContainerLineRepository.java` | **删除** |
| `service/EnquiryService.java` | **修改** (中等) |
| `service/OfferService.java` | **重写** |
| `service/StatisticsService.java` | **修改** (SQL) |
| `service/ComparisonService.java` | **修改** (SQL) |
| `service/AiAnalysisFunctions.java` | **修改** (SQL) |
| `controller/DictController.java` | **修改** |
| `controller/OfferController.java` | **修改** |
| `controller/MasterDataController.java` | **修改** (轻微) |
| `controller/EnquiryController.java` | **修改** (轻微) |
| `dto/OfferCreateDTO.java` | **新增** |
| `dto/OfferUpdateDTO.java` | **新增** |
| `dto/OfferPriceLineDTO.java` | **新增** |
| `dto/OfferContainerDetailDTO.java` | **新增** |
| `dto/RouteGroupDTO.java` | **新增** |

### 9.3 前端 TypeScript 文件

| 文件路径 | 操作 |
|----------|------|
| `types.ts` | **修改** (重大) |
| `constants/enquiry.ts` | **新增** |
| `services/api.ts` | **修改** (中等) |
| `components/enquiry/EnquiryForm.tsx` | **修改** (重大) |
| `components/enquiry/EnquiryList.tsx` | **修改** (中等) |
| `components/enquiry/EnquiryDetail.tsx` | **修改** (中等) |
| `components/enquiry/StatusChangeDialog.tsx` | **新增** |
| `components/enquiry/RouteGroupEditor.tsx` | **新增** |
| `components/enquiry/CargoReadyDateField.tsx` | **新增** |
| `components/offer/OfferDialog.tsx` | **重写** |
| `components/offer/OfferManagement.tsx` | **修改** (中等) |
| `components/offer/PriceDetailsTable.tsx` | **新增** |
| `components/offer/ContainerDetailsDialog.tsx` | **新增** |
| `components/offer/DynamicColumnManager.tsx` | **新增** |
| `components/report/Dashboard.tsx` | **修改** (轻微) |
| `components/report/EnhancedDashboard.tsx` | **修改** (轻微) |
| `components/report/DashboardFilters.tsx` | **修改** (轻微) |
| `components/report/CNOfficePivotTable.tsx` | **修改** (轻微) |
| `App.tsx` | **修改** (轻微) |

### 9.4 文件统计

| 操作 | 后端 | 前端 | 数据库 | 文档 | 合计 |
|------|------|------|--------|------|------|
| 新增 | 15 | 7 | 2 | 6 | 30 |
| 修改 | 10 | 10 | — | — | 20 |
| 删除 | 5 | — | — | — | 5 |
| **合计** | **30** | **17** | **2** | **6** | **55** |
