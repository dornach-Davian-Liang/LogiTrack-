# LogiTrack Pro 询价重构 — 前端实现指南

> **版本**: v2.0  
> **日期**: 2026-03-23  
> **技术栈**: React 19 + TypeScript 5.8 + Vite 6.2

---

## 目录

1. [类型定义变更](#1-类型定义变更)
2. [常量定义变更](#2-常量定义变更)
3. [API 服务层变更](#3-api-服务层变更)
4. [组件变更清单](#4-组件变更清单)
5. [EnquiryForm 重构详解](#5-enquiryform-重构详解)
6. [新增组件设计](#6-新增组件设计)
7. [Offer 模块重构](#7-offer-模块重构)
8. [其他模块影响](#8-其他模块影响)

---

## 1. 类型定义变更

### 文件: `logitrack-pro/types.ts`

### 1.1 基础类型更新

```typescript
// ===== 变更前 =====
export type ProductCode = 'AIR' | 'SEA' | 'SEA-AIR' | 'RAIL' | 'RAIL-SEA';
export type EnquiryStatus = 'New' | 'Quoted' | 'Pending';
export type BookingStatus = 'Yes' | 'Rejected' | 'Pending' | 'Invalid' | '';
export type CargoType = 'AIR' | 'FCL' | 'LCL' | 'RAIL' | 'SEA';
export type OfferType = 'OCEAN' | 'AIR' | 'OTHER';

// ===== 变更后 =====
export type ProductCode = 'AIR' | 'SEA' | 'RAIL' | 'RAIL-SEA' | 'RAIL-AIR' | 'SEA-AIR' | 'AIR-RAIL-SEA';
export type EnquiryStatus = 'New' | 'Quoted & Pending' | 'Secured' | 'Lost' | 'Cancelled';
export type CargoType = 'AIR' | 'FCL' | 'LCL' | 'BUYER-CONSOL';
export type OfferType = 'AIR' | 'FCL' | 'LCL' | 'BUYER-CONSOL';
export type SubMode = 'AIR' | 'SEA' | 'RAIL';

// ===== 删除 =====
// BookingStatus 类型删除（不再需要）
```

### 1.2 新增类型

```typescript
// ===== 原因相关 =====
export interface CancelledReason {
  code: string;
  label: string;
  sortOrder: number;
}

export interface LostReason {
  code: string;
  label: string;
  sortOrder: number;
}

// ===== 路由组（混合模式）=====
export interface RouteGroup {
  id?: number;
  groupIndex: number;
  subMode: SubMode;
  polIds: number[];
  podIds: number[];
}

// ===== Offer 重构相关 =====
export interface Offer {
  id?: number;
  enquiryId: number;
  offerType: OfferType;
  sequenceNo: number;
  isLatest: boolean;
  offerDate: string | null;     // ISO date string
  priceLines: OfferPriceLine[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OfferPriceLine {
  id?: number;
  offerId?: number;
  polId: number;
  podId: number;
  polName?: string;             // 前端显示用
  podName?: string;             // 前端显示用
  routeGroupId?: number | null;
  subMode?: SubMode | null;
  perCbm?: number | null;
  minCharge?: number | null;
  localCharge?: number | null;
  price?: number | null;
  priceText?: string | null;
  isRejectedPrice: boolean;
  containerDetails: OfferContainerDetail[];
}

export interface OfferContainerDetail {
  id?: number;
  offerPriceLineId?: number;
  containerSizeType: string;    // '20GP', '40HQ', '45HQ' 等
  containerType?: string;       // 'GP', 'OT', 'FR', 'Tank' 等
  numberOfContainers: number;
  cargoWeightPerContainer?: number;
  containerPrice?: number;
  teuValue: number;             // TEU 系数
  lineTeu?: number;             // 计算值 = teuValue × numberOfContainers
}

export interface OfferFormData {
  offerType: OfferType;
  offerDate: string | null;
  priceLines: OfferPriceLineFormData[];
}

export interface OfferPriceLineFormData {
  polId: number;
  podId: number;
  routeGroupId?: number | null;
  subMode?: SubMode | null;
  perCbm?: string;              // 表单中用 string
  minCharge?: string;
  localCharge?: string;
  price?: string;
  priceText?: string;
  containerDetails: OfferContainerDetailFormData[];
}

export interface OfferContainerDetailFormData {
  containerSizeType: string;
  containerType?: string;
  numberOfContainers: string;
  cargoWeightPerContainer: string;
  containerPrice: string;
  teuValue: number;
}
```

### 1.3 Enquiry 接口更新

```typescript
export interface Enquiry {
  id?: number;
  
  // 基础信息
  referenceNumber: string;
  enquiryReceivedDate: string;
  issueDate: string;              // 显示为 "Enquiry Created Date"
  referenceMonth: string;
  monthlySequence: number;
  serialNumber: number;
  
  // 产品 & 状态
  productCode: ProductCode;
  productAbbr: string;
  status: EnquiryStatus;
  
  // 取消/丢单原因（新增）
  cancelledReason?: string | null;
  cancelledReasonText?: string | null;
  lostReason?: string | null;
  lostReasonText?: string | null;
  
  // 销售信息（删除 cnPricingAdmin）
  salesCountryCode: string;
  salesOfficeId: number;
  salesPicId?: number | null;
  
  // CN 办公室
  assignedCnOfficeCode: string;
  
  // 货物信息
  cargoTypeCode: CargoType;
  volumeCbm?: number | null;
  volumeRawText?: string;
  quantity?: number | null;
  quantityRawText?: string;
  quantityUomCode?: string;
  quantityUomRawText?: string;
  quantityTeu?: number | null;
  quantityTeuRawText?: string;
  commodity?: string;
  hazSpecialEquipment?: string;
  
  // 路线信息
  polId?: number;                 // Legacy
  podId?: number;                 // Legacy
  polIds: number[];
  podIds: number[];
  podCountryCode?: string;
  routeGroups?: RouteGroup[];     // 混合模式用
  
  // 核心/分类
  coreFlag?: 'CORE' | 'NON_CORE';
  categoryCode?: string;
  exwLocation?: string;           // 新增
  
  // Cargo Ready Date
  hasSpecificCargoReadyDate: boolean;  // 新增
  cargoReadyDate?: string | null;
  cargoReadyDateRawText?: string;      // 改名显示: Cargo Ready Date Details
  
  // 其他
  additionalRequirement?: string;
  remark?: string;
  
  // 关联
  offers?: Offer[];
  
  // 审计
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
```

### 1.4 删除的类型/字段

```typescript
// 删除 BookingStatus 类型
// Enquiry 中删除以下字段:
//   - cnPricingAdmin
//   - bookingConfirmed
//   - rejectedReason
//   - actualReason
//   - enquiryOfferType
//   - containerLines (移至 Offer)
```

---

## 2. 常量定义变更

### 文件: 新建 `logitrack-pro/constants/enquiry.ts`

```typescript
// ===== Product-Cargo 组合矩阵 =====
export const PRODUCT_CARGO_MAP: Record<string, string[]> = {
  'AIR':          ['AIR'],
  'SEA':          ['FCL', 'LCL', 'BUYER-CONSOL'],
  'RAIL':         ['FCL', 'LCL'],
  'RAIL-SEA':     ['FCL', 'LCL'],
  'RAIL-AIR':     ['AIR', 'LCL'],
  'SEA-AIR':      ['AIR', 'LCL'],
  'AIR-RAIL-SEA': ['AIR', 'FCL', 'LCL'],
};

// ===== 混合模式判断 =====
export const MIXED_MODE_PRODUCTS: string[] = [
  'RAIL-SEA', 'RAIL-AIR', 'SEA-AIR', 'AIR-RAIL-SEA'
];

export const isMixedMode = (productCode: string): boolean => {
  return MIXED_MODE_PRODUCTS.includes(productCode);
};

// ===== 混合模式允许的 Sub-modes =====
export const PRODUCT_SUBMODE_MAP: Record<string, string[]> = {
  'RAIL-SEA':     ['RAIL', 'SEA'],
  'RAIL-AIR':     ['RAIL', 'AIR'],
  'SEA-AIR':      ['SEA', 'AIR'],
  'AIR-RAIL-SEA': ['AIR', 'RAIL', 'SEA'],
};

// ===== 容器类型显示需求 =====
export const CONTAINER_CARGO_TYPES: string[] = ['FCL', 'BUYER-CONSOL'];
export const SIMPLE_CARGO_TYPES: string[] = ['AIR', 'LCL'];

export const isContainerType = (cargoType: string): boolean => {
  return CONTAINER_CARGO_TYPES.includes(cargoType);
};

// ===== 状态颜色映射 =====
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'New':               { bg: 'bg-blue-100',   text: 'text-blue-800' },
  'Quoted & Pending':  { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Secured':           { bg: 'bg-green-100',  text: 'text-green-800' },
  'Lost':              { bg: 'bg-red-100',    text: 'text-red-800' },
  'Cancelled':         { bg: 'bg-gray-100',   text: 'text-gray-800' },
};

// ===== 默认容器列 (FCL/BUYER-CONSOL Price Table) =====
export const DEFAULT_CONTAINER_COLUMNS = [
  { key: '20', label: "20'" },
  { key: '40', label: "40'" },
  { key: '40HQ', label: "40'HQ" },
  { key: '45', label: "45'" },
];
```

---

## 3. API 服务层变更

### 文件: `logitrack-pro/services/api.ts`

### 3.1 新增 API 方法

```typescript
// ===== 字典 API 扩展 =====
export const dictApi = {
  // ...existing methods...
  
  // 新增: 获取取消原因列表
  cancelledReasons: async (): Promise<CancelledReason[]> => {
    const res = await fetch('/api/dict/cancelled-reasons');
    return res.json();
  },
  
  // 新增: 获取丢单原因列表
  lostReasons: async (): Promise<LostReason[]> => {
    const res = await fetch('/api/dict/lost-reasons');
    return res.json();
  },
};

// ===== Offer API 重构 =====
export const offerApi = {
  listByEnquiry: async (enquiryId: number): Promise<Offer[]> => {
    const res = await fetch(`/api/enquiries/${enquiryId}/offers`);
    return res.json();
  },
  
  create: async (enquiryId: number, data: OfferFormData): Promise<Offer> => {
    const res = await fetch(`/api/enquiries/${enquiryId}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  
  update: async (offerId: number, data: Partial<OfferFormData>): Promise<Offer> => {
    const res = await fetch(`/api/offers/${offerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  
  delete: async (offerId: number): Promise<void> => {
    await fetch(`/api/offers/${offerId}`, { method: 'DELETE' });
  },
  
  // 新增: 根据港口对自动生成空白 Price Lines
  generatePriceLines: async (enquiryId: number): Promise<OfferPriceLine[]> => {
    const res = await fetch(`/api/enquiries/${enquiryId}/offers/generate-lines`);
    return res.json();
  },
};
```

### 3.2 删除的 API 方法

```typescript
// 删除: cnPricingAdmins 相关
// masterApi.cnPricingAdmins → 删除

// 修改: enquiryApi.create / update 的 payload 不再包含:
//   - cnPricingAdmin
//   - bookingConfirmed  
//   - rejectedReason
//   - actualReason
//   - enquiryOfferType
//   - containerLines (移到 Offer)
```

---

## 4. 组件变更清单

### 4.1 需修改的组件

| 组件 | 文件 | 变更类型 | 说明 |
|------|------|----------|------|
| **EnquiryForm** | `components/enquiry/EnquiryForm.tsx` | **重大重构** | 核心变更：Product-Cargo联动、Status/Sales/Route/Cargo动态UI |
| **EnquiryList** | `components/enquiry/EnquiryList.tsx` | 中等 | 列更新：删除bookingConfirmed，新状态列，颜色标签 |
| **EnquiryDetail** | `components/enquiry/EnquiryDetail.tsx` | 中等 | 字段同步更新 |
| **OfferManagement** | `components/offer/OfferManagement.tsx` | **重大重构** | 报价列表+Price Details矩阵 |
| **OfferDialog** | `components/offer/OfferDialog.tsx` | **重大重构** | 全新UI：Price Details表格+Container弹窗 |
| **Dashboard** | `components/report/Dashboard.tsx` | 轻微 | 状态统计更新 |
| **EnhancedDashboard** | `components/report/EnhancedDashboard.tsx` | 轻微 | 统计字段更新 |
| **App.tsx** | `App.tsx` | 轻微 | 导航菜单无变化，类型引用更新 |

### 4.2 需新增的组件

| 组件 | 文件 | 说明 |
|------|------|------|
| **StatusChangeDialog** | `components/enquiry/StatusChangeDialog.tsx` | Lost/Cancelled原因选择弹窗 |
| **RouteGroupEditor** | `components/enquiry/RouteGroupEditor.tsx` | 混合模式路由组编辑器 |
| **PriceDetailsTable** | `components/offer/PriceDetailsTable.tsx` | POL×POD矩阵价格表格 |
| **ContainerDetailsDialog** | `components/offer/ContainerDetailsDialog.tsx` | 容器详情弹窗 |
| **DynamicColumnManager** | `components/offer/DynamicColumnManager.tsx` | 动态添加Container Type列 |
| **CargoReadyDateField** | `components/enquiry/CargoReadyDateField.tsx` | Cargo Ready Date 复选框+日期组合 |

### 4.3 可删除的内容

| 内容 | 文件位置 | 原因 |
|------|----------|------|
| cnPricingAdmin 下拉 | EnquiryForm.tsx | 需求4删除 |
| bookingConfirmed 下拉 | EnquiryForm.tsx | 需求3替代 |
| rejectedReason 输入框 | EnquiryForm.tsx | 需求7删除 |
| actualReason 输入框 | EnquiryForm.tsx | 需求7删除 |
| Container Lines 区域 | EnquiryForm.tsx | 需求9移至Offer |
| enquiryOfferType | 代码中所有引用 | 需求6替代 |

---

## 5. EnquiryForm 重构详解

### 5.1 表单区块布局（新版）

```
┌─────────────────────────────────────────────────────────────┐
│ 🔵 Basic Information                                         │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Reference Number     [CN2603012-RS] (Auto)              │  │
│ │ Enquiry Received Date [2026/03/20 📅] (Editable)        │  │
│ │ Enquiry Created Date  [2026/03/20] (Read-only)          │  │
│ │ Product Type *        [SEA ▼]                           │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ 🟢 Sales Information                                         │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Z-Country / Agent *  [AGENTS ▼] (Searchable)            │  │
│ │ Sales PIC *          [KAMRAN KHAN ▼] (Filtered)         │  │
│ │ Sales Office         [A&A CARGO TRANSPORT] (Auto)       │  │
│ │ Assigned CN Office * [SHANGHAI ▼]                       │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ 🟡 Cargo Information        (动态 UI — 由 Cargo Type 决定)    │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Cargo Type *          [FCL ▼] (Filtered by Product)     │  │
│ │ Commodity/Description [...] (Always)                    │  │
│ │ [FCL/BUYER-CONSOL: ⓘ 容器信息在 Offer 中]                │  │
│ │ [AIR/LCL: Volume(CBM) + Quantity + UOM]                 │  │
│ │ Hazardous/Special     [...] (Always)                    │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ 🔴 Route Information        (普通/混合模式切换)                 │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ [普通模式: 单组 POL/POD]                                  │  │
│ │ [混合模式: RouteGroupEditor × N]                         │  │
│ │ POD Country          [Germany] (Auto-mapped)            │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ 🔶 Offer Information                                         │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ [+ Add Offer]                                           │  │
│ │ Offer #1 (Latest)                                       │  │
│ │   Offer Type [FCL ▼]  Offer Date [📅]                   │  │
│ │   <PriceDetailsTable />                                 │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ 🟣 Other Information                                         │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Core/Non-core        [CORE ▼]  Category [▼]             │  │
│ │ [Category=EXW: EXW Location input]                      │  │
│ │ ☐ Any Cargo Ready Date                                  │  │
│ │ [✅ 时: CRD Date Picker]                                 │  │
│ │ CRD Details (TBA/Week etc.) [...]                       │  │
│ │ Additional Requirement [...]                            │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│                                                              │
│ 📝 Remark                                                    │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ [Enter remarks here...]                                 │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ Status: [New ▼] → 切换到 Lost/Cancelled 时弹出原因对话框       │
│                                                              │
│ [Cancel]  [Save Enquiry]                                     │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 关键交互逻辑

#### 5.2.1 Product Type 变更联动

```typescript
const handleProductChange = (productCode: ProductCode) => {
  setFormData(prev => {
    const allowedCargoTypes = PRODUCT_CARGO_MAP[productCode] || [];
    const newCargoType = allowedCargoTypes.includes(prev.cargoTypeCode) 
      ? prev.cargoTypeCode 
      : allowedCargoTypes[0] as CargoType;
    
    return {
      ...prev,
      productCode,
      cargoTypeCode: newCargoType,
      // 混合模式切换到普通模式时清空 routeGroups
      routeGroups: isMixedMode(productCode) 
        ? (prev.routeGroups?.length ? prev.routeGroups : [createDefaultRouteGroup(productCode)])
        : undefined,
    };
  });
};
```

#### 5.2.2 Sales 级联选择

```typescript
// Step 1: Country 变更 → 加载该国家的 PIC 列表
const handleSalesCountryChange = async (countryCode: string) => {
  setFormData(prev => ({ ...prev, salesCountryCode: countryCode, salesPicId: null, salesOfficeId: 0 }));
  const pics = await dictApi.salesPics(countryCode);
  setFilteredSalesPics(pics);
};

// Step 2: PIC 变更 → 自动填充 Office
const handleSalesPicChange = (picId: number) => {
  const pic = filteredSalesPics.find(p => p.id === picId);
  setFormData(prev => ({ 
    ...prev, 
    salesPicId: picId,
    salesOfficeId: pic?.salesOfficeId || 0,
  }));
};
```

#### 5.2.3 Cargo Type 变更联动

```typescript
const handleCargoTypeChange = (cargoType: CargoType) => {
  setFormData(prev => ({
    ...prev,
    cargoTypeCode: cargoType,
    // AIR/LCL 时保留 volume/quantity 字段
    // FCL/BUYER-CONSOL 时清空 volume/quantity 字段
    ...(isContainerType(cargoType) ? {
      volumeCbm: null,
      quantity: null,
      quantityUomCode: '',
    } : {}),
  }));
};
```

#### 5.2.4 Status 变更 + 原因弹窗

```typescript
const handleStatusChange = (newStatus: EnquiryStatus) => {
  if (newStatus === 'Lost' || newStatus === 'Cancelled') {
    // 弹出原因选择对话框
    setStatusChangeDialog({
      open: true,
      targetStatus: newStatus,
    });
  } else {
    setFormData(prev => ({ ...prev, status: newStatus }));
  }
};

// StatusChangeDialog 确认回调
const handleStatusChangeConfirm = (reason: string, reasonText?: string) => {
  const { targetStatus } = statusChangeDialog;
  setFormData(prev => ({
    ...prev,
    status: targetStatus,
    ...(targetStatus === 'Lost' ? { lostReason: reason, lostReasonText: reasonText } : {}),
    ...(targetStatus === 'Cancelled' ? { cancelledReason: reason, cancelledReasonText: reasonText } : {}),
  }));
  setStatusChangeDialog({ open: false, targetStatus: null });
};
```

#### 5.2.5 Cargo Ready Date 逻辑

```typescript
const handleCrdCheckboxChange = (checked: boolean) => {
  setFormData(prev => ({
    ...prev,
    hasSpecificCargoReadyDate: checked,
    cargoReadyDate: checked ? prev.cargoReadyDate : prev.issueDate, // 未勾选时用创建日期
  }));
};
```

---

## 6. 新增组件设计

### 6.1 StatusChangeDialog

```typescript
// components/enquiry/StatusChangeDialog.tsx

interface StatusChangeDialogProps {
  open: boolean;
  targetStatus: 'Lost' | 'Cancelled';
  onConfirm: (reason: string, reasonText?: string) => void;
  onCancel: () => void;
}

// UI 结构:
// ┌──────────────────────────────────────┐
// │ Change Status to [Lost/Cancelled]     │
// │                                       │
// │ Reason *  [Select reason ▼]           │
// │                                       │
// │ [当选择 Others:]                       │
// │ Please specify * [____________]       │
// │                                       │
// │ [Cancel]  [Confirm]                   │
// └──────────────────────────────────────┘
```

**实现要点**：
- 从 `dictApi.lostReasons()` 或 `dictApi.cancelledReasons()` 加载选项
- 选择 `OTHERS` 时显示必填文本框
- 必须选择原因才能点击 Confirm
- Cancel 按钮回退状态

### 6.2 RouteGroupEditor

```typescript
// components/enquiry/RouteGroupEditor.tsx

interface RouteGroupEditorProps {
  productCode: ProductCode;
  routeGroups: RouteGroup[];
  onChange: (groups: RouteGroup[]) => void;
  allPorts: Port[];
}

// UI 结构 (每个 Route Group):
// ┌─ Route Group {N} ─────────────────────────┐
// │ Sub-mode    [AIR ▼]                       │
// │ 🔸 AIR mode — Airport ports only           │
// │ POL *       [Multi-select with search]    │
// │ POD *       [Multi-select with search]    │
// │                                   [🗑 Delete] │
// └──────────────────────────────────────────┘
// [+ Add Route Group]
```

**实现要点**：
- 使用 `VirtualizedMultiSelect` 组件进行港口选择
- 根据 `subMode` 过滤港口列表：
  - AIR → `port.portType === 'AIR'`
  - SEA/RAIL → `port.portType === 'SEA'`
- Sub-mode 下拉选项从 `PRODUCT_SUBMODE_MAP[productCode]` 获取
- 至少保留 1 个 Route Group（不能全部删除）
- 添加时自动选择第一个未使用的 Sub-mode

### 6.3 PriceDetailsTable

```typescript
// components/offer/PriceDetailsTable.tsx

interface PriceDetailsTableProps {
  offerType: OfferType;
  priceLines: OfferPriceLineFormData[];
  onChange: (lines: OfferPriceLineFormData[]) => void;
  dynamicContainerColumns: string[]; // 动态添加的柜型列
  onAddContainerColumn: () => void;
}

// FCL/BUYER-CONSOL 时的表格列:
// POL | POD | 20' | 40' | 40'HQ | 45' | Per CBM | Min Charge | Local Charge | [动态柜型列...] | Container Type

// AIR/LCL 时的表格列:
// POL | POD | Price | Min Charge | Local Charge
```

**实现要点**：
- 表格行由 POL × POD 笛卡尔积自动生成
- 混合模式下按 Route Group 分组显示
- 柜型单元格可点击 → 弹出 `ContainerDetailsDialog`
- 动态列通过 `[+ Add Container Type]` 按钮添加
- 表格数据双向绑定，支持实时编辑

### 6.4 ContainerDetailsDialog

```typescript
// components/offer/ContainerDetailsDialog.tsx

interface ContainerDetailsDialogProps {
  open: boolean;
  detail: OfferContainerDetailFormData;
  containerTypes: ContainerType[];
  onConfirm: (detail: OfferContainerDetailFormData) => void;
  onCancel: () => void;
}

// UI 结构:
// ┌──────────────────────────────────────┐
// │ Container Details                     │
// │                                       │
// │ Container size type   [20'GP ▼]       │
// │ Number of containers  [5]             │
// │ Cargo weight / ctnr   [25.5] ton      │
// │ Container Price       [_____]         │
// │                                       │
// │ TEU: 5.00 (= 1.00 × 5)              │
// │                                       │
// │ [Cancel]  [Confirm]                   │
// └──────────────────────────────────────┘
```

**实现要点**：
- TEU 自动计算：`teuValue * numberOfContainers`
- Container size type 下拉从 `dictApi.containerTypes()` 获取
- Container Type 下拉：GP, OT, FR, Tank, Reefer 等
- 确认后更新对应 PriceLine 的 containerDetails 数组

### 6.5 CargoReadyDateField

```typescript
// components/enquiry/CargoReadyDateField.tsx

interface CargoReadyDateFieldProps {
  hasSpecificDate: boolean;
  cargoReadyDate: string | null;
  cargoReadyDateDetails: string;
  issueDate: string;
  onCheckboxChange: (checked: boolean) => void;
  onDateChange: (date: string) => void;
  onDetailsChange: (text: string) => void;
}

// UI 结构:
// ☐ Any Cargo Ready Date
// [✅ 时: Cargo Ready Date [📅]]
// Cargo Ready Date Details (TBA/Week etc.) [___________]
```

---

## 7. Offer 模块重构

### 7.1 OfferDialog 重写

**当前结构**（旧）：
- 简单表单：Offer Type + Sent Date + Price + Price Text

**新结构**：
```
┌─────────────────────────────────────────────────────────────┐
│ Offer #1                                                     │
│                                                              │
│ Offer Type *  [FCL ▼] (= Cargo Type, 可手动改)              │
│ Offer Date *  [2026/03/20 📅]                                │
│                                                              │
│ ┌─ Price Details ──────────────────────────────────────────┐ │
│ │ <PriceDetailsTable />                                    │ │
│ │                                                          │ │
│ │ [+ Add Container Type]  (仅 FCL/BUYER-CONSOL 显示)       │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ⓘ 空行保存时自动删除                                          │
│                                                              │
│ [Cancel]  [Save Offer]                                       │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 OfferManagement 更新

- 显示 Offer 列表时展示 `offerDate` 而非 `sentDate`
- 每个 Offer 展开后显示 Price Details 摘要（POL → POD | 价格概要）
- `[+ Add Offer]` 按钮创建新 Offer 时自动生成 Price Lines

### 7.3 Offer 保存逻辑

```typescript
const handleSaveOffer = async (formData: OfferFormData) => {
  // 1. 过滤空行（所有价格字段均为空的行）
  const nonEmptyLines = formData.priceLines.filter(line => {
    const hasPrice = line.price || line.perCbm || line.minCharge || line.localCharge;
    const hasContainers = line.containerDetails.some(d => d.numberOfContainers > 0);
    return hasPrice || hasContainers;
  });
  
  // 2. 提交
  const payload: OfferFormData = {
    ...formData,
    priceLines: nonEmptyLines,
  };
  
  if (editingOffer?.id) {
    await offerApi.update(editingOffer.id, payload);
  } else {
    await offerApi.create(enquiryId, payload);
  }
};
```

### 7.4 笛卡尔积生成

```typescript
// 普通模式
const generatePriceLines = (polIds: number[], podIds: number[]): OfferPriceLineFormData[] => {
  return polIds.flatMap(polId => 
    podIds.map(podId => ({
      polId,
      podId,
      perCbm: '',
      minCharge: '',
      localCharge: '',
      price: '',
      priceText: '',
      containerDetails: [],
    }))
  );
};

// 混合模式
const generateMixedPriceLines = (routeGroups: RouteGroup[]): OfferPriceLineFormData[] => {
  return routeGroups.flatMap(group => 
    group.polIds.flatMap(polId => 
      group.podIds.map(podId => ({
        polId,
        podId,
        routeGroupId: group.id,
        subMode: group.subMode,
        perCbm: '',
        minCharge: '',
        localCharge: '',
        price: '',
        priceText: '',
        containerDetails: [],
      }))
    )
  );
};
```

---

## 8. 其他模块影响

### 8.1 EnquiryList 变更

| 列名 | 变更 |
|------|------|
| Status | 从 New/Quoted/Cancelled → 5 种状态 + 颜色标签 |
| Booking Confirmed | **删除此列** |
| Offer Type | **删除此列**（移到 Offer 详情中） |
| CN Pricing Admin | **删除此列** |
| Product Type | 支持 7 种产品 |
| Cargo Type | 支持 4 种 |

### 8.2 EnquiryDetail 变更

- 删除 `CN Pricing Admin`、`Booking Confirmed`、`Rejected Reason`、`Actual Reason` 显示
- 新增 `Cancelled Reason` / `Lost Reason` 显示（仅相关状态时）
- 路由信息区分普通/混合模式展示
- Offer 详情显示 Price Details 矩阵摘要

### 8.3 Dashboard / Statistics 变更

**统计查询更新**：
- 旧 `booking_confirmed = 'Yes'` → 新 `status = 'Secured'`
- 旧 `booking_confirmed = 'Rejected'` → 新 `status = 'Lost'`
- 旧 `status = 'Quoted'` → 新 `status = 'Quoted & Pending'`
- 新增 `Secured` 和 `Lost` 的统计维度

**图表颜色更新**：
- 饼图/柱状图需支持 5 种状态的颜色区分

### 8.4 AI 模块影响

AI 分析函数 (`AiAnalysisFunctions.java`) 中的 SQL 查询需要更新：
- `booking_confirmed` 条件替换为 `status` 条件
- 新增 `Secured` 和 `Lost` 统计
- Cargo Type 统计移除 RAIL/SEA，新增 BUYER-CONSOL

### 8.5 搜索/过滤

`EnquirySearchParams` 需更新：
```typescript
export interface EnquirySearchParams {
  keyword?: string;
  status?: EnquiryStatus[];      // 从 3 种更新为 5 种
  productCodes?: ProductCode[];  // 从 5 种更新为 7 种
  cargoTypes?: CargoType[];      // 从 5 种更新为 4 种
  // bookingStatus 删除
  // ...rest unchanged
}
```

---

## 9. V3 Phase 5 前端实现记录 (2026-03-25)

> 本章节记录 V3 Phase 4-5 用户验收测试中发现的前端问题及完整修复方案。

### 9.1 OfferPriceTable 组件完整实现

**文件**: `components/enquiry/OfferPriceTable.tsx` (543 行)

#### 9.1.1 组件 Props

```typescript
interface OfferPriceTableProps {
  offer: Offer;
  offerIndex: number;
  ports: PortSelectOption[];
  containerTypes: ContainerTypeSelectOption[];  // 从 container_types DB 表加载
  routeGroups?: RouteGroup[];
  isMixed: boolean;
  onUpdatePriceLines: (offerIndex: number, priceLines: OfferPriceLine[]) => void;
}
```

#### 9.1.2 动态容器列管理

```
默认列: DEFAULT_SIZE_CODES = ['20GP', '40GP', '40HQ', '45HQ']

可动态添加: 20RF, 40RF, 20OT, 40OT, 20FR, 40FR, 40HC
(来自 container_types DB 表中未显示的记录)

列显示逻辑:
  visibleSizeCodes = DEFAULT + extraSizeCodes (用户添加) + 已有数据中的 sizeCode
```

**状态**:
```typescript
const [extraSizeCodes, setExtraSizeCodes] = useState<string[]>([]);
const [showAddType, setShowAddType] = useState(false);
const [editingCell, setEditingCell] = useState<{lineIdx: number; sizeCode: string} | null>(null);
```

#### 9.1.3 TEU 计算体系

```typescript
// TEU 查找表 (从 DB container_types 构建)
const teuLookup = useMemo(() => {
  const map: Record<string, number> = {};
  containerTypes.forEach(ct => {
    const code = ct.label.split(' - ')[0];
    map[code] = ct.teuValue;
  });
  return map;
}, [containerTypes]);

// 总计 TEU (所有行所有容器)
const totalTeu = useMemo(() => {
  let sum = 0;
  offer.priceLines.forEach(line => {
    (line.containerDetails || []).forEach(cd => {
      sum += (cd.teuValue || teuLookup[cd.containerSizeType] || 1) * (cd.numberOfContainers || 0);
    });
  });
  return sum;
}, [offer.priceLines, teuLookup]);
```

#### 9.1.4 混合模式分组渲染

```typescript
// 按 routeGroupId 分组 (使用 groupIndex 而非 id)
if (isMixed && routeGroups?.length > 0) {
  offer.priceLines.forEach((line, idx) => {
    const gid = line.routeGroupId;
    const rg = routeGroups.find(g => g.groupIndex === gid);  // ← 关键: groupIndex
    // ... 分组逻辑
  });
}

// 每组渲染独立表头:
// 🚂 Route Group 1 (RAIL)
// ⚓ Route Group 2 (SEA)
// ✈ Route Group 3 (AIR)
```

#### 9.1.5 子组件

**ContainerDetailDialog** — 单个容器 cell 编辑弹窗:
- 容器类型 (只读)
- 容器数量 (可编辑)
- 每箱货重 (可编辑, 吨)
- 箱价格 (可编辑)
- Line TEU 实时计算 (只读, = teuFactor × numberOfContainers)

**AddContainerTypePicker** — 浮动选择器:
- 显示未添加的箱型 (从 `containerTypes` props 过滤)
- 每项显示 label + TEU 值
- 选择后立即添加列并关闭

### 9.2 EnquiryForm Route Information 条件布局

**文件**: `components/enquiry/EnquiryForm.tsx`

#### 9.2.1 非混合模式 (SEA, AIR, RAIL)

```
Route Information *
├─ [POL 多选器] | [POD 多选器]    ← VirtualizedMultiSelect, async search
├─ POD Country - Auto Mapped      ← 蓝色提示框, 自动填充
└─ (无 Route Groups)
```

#### 9.2.2 混合模式 (RAIL-SEA, SEA-AIR, RAIL-AIR, AIR-RAIL-SEA)

```
Route Information *
├─ (隐藏 POL/POD 多选器)          ← 通过 isMixedProduct() 条件渲染
├─ Route Groups (RAIL → SEA)
│   ├─ Leg 1 [RAIL ▾]
│   │   ├─ POL (RAIL) 多选
│   │   └─ POD (RAIL) 多选
│   └─ Leg 2 [SEA ▾]
│       ├─ POL (SEA) 多选
│       └─ POD (SEA) 多选
├─ POD Country - Auto Mapped      ← 位于 Route Groups 下方
│   └─ "Andorra, United Arab Emirates"
└─ 图例: ✈ AIR = Airports  ⚓ SEA = Seaports  🚂 RAIL = Rail terminals
```

#### 9.2.3 Route Group → POD Country 联动

```typescript
// RouteGroupEditor onChange 回调增强:
onChange={(groups) => {
  handleChange('routeGroups', groups);
  
  // 1. 同步港口到主 ports 状态 (解决 Port#104 问题)
  const allPortIds = groups.flatMap(rg => [
    ...(rg.polIds || []).map(Number),
    ...(rg.podIds || []).map(Number),
  ]);
  if (allPortIds.length > 0) ensurePortsLoaded(allPortIds);
  
  // 2. 自动映射 POD Country
  const allPodIds = groups.flatMap(rg => (rg.podIds || []).map(Number));
  if (allPodIds.length > 0) updatePodCountries(allPodIds);
}}
```

### 9.3 保存验证逻辑增强

```typescript
// handleSubmit() 验证分支:
if (isMixedProduct) {
  // ① 验证每个 Route Group 都有 POL 和 POD
  // ② 自动汇总: allPolIds = Set(所有RG的polIds), allPodIds = Set(所有RG的podIds)
  // ③ 写入 formData.polIds / formData.podIds → 后端无需改动
} else {
  // 原有逻辑: polIds/podIds 非空校验
}
```

### 9.4 PriceLine 生成逻辑 (`generatePriceLinesFromPorts`)

```typescript
// 混合模式:
formData.routeGroups.forEach(rg => {
  rg.polIds × rg.podIds → PriceLine {
    polId, podId,
    routeGroupId: rg.groupIndex,  // ← 使用 groupIndex (0, 1, 2...)
    subMode: rg.subMode,          // ← 'RAIL' | 'SEA' | 'AIR'
    containerDetails: [],
  }
});

// 普通模式:
formData.polIds × formData.podIds → PriceLine {
  polId, podId, containerDetails: []
}
```

### 9.5 containerTypes 数据流

```
                DB container_types (11 records)
                        │
                        ▼
           GET /api/dict/container-types
                        │
                        ▼
        masterDataApi.getContainerTypes()
                        │
                        ▼
      EnquiryForm: containerTypesOpts state
                        │
                        ▼
    <OfferPriceTable containerTypes={containerTypesOpts} />
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
        teuLookup            availableToAdd
    (TEU系数查找表)        (可添加的箱型列表)
              │                   │
              ▼                   ▼
      TEU 计算逻辑        AddContainerTypePicker
```

### 9.6 Bug 修复总结 (Phase 5)

| # | 问题 | 根因 | 修复方案 | 影响文件 |
|---|------|------|----------|----------|
| 1 | Route Group 2 不显示 | `routeGroupId` 使用 `rg.id` (undefined) | 改用 `rg.groupIndex` | OfferPriceTable, EnquiryForm |
| 2 | 港口显示 Port#104 | Route Group 港口不在主 ports 状态 | `ensurePortsLoaded()` 同步 | EnquiryForm |
| 3 | 三层 POL/POD 冗余 | 混合模式未隐藏顶层选择器 | `isMixedProduct()` 条件渲染 | EnquiryForm |
| 4 | POD Country 未映射 | Route Group 变更未触发 country 查询 | onChange 回调中调用 `updatePodCountries()` | EnquiryForm |
| 5 | 保存时报错 "Select POL" | 混合模式 polIds 为空（隐藏了顶层选择器） | 区分验证逻辑 + 自动汇总 | EnquiryForm |
| 6 | POD Country 位置不当 | 混合模式下显示在 Route Groups 上方 | 移到 Route Groups 下方 | EnquiryForm |
| 7 | `[+ Add Container Type]` 缺失 | 初版 OfferPriceTable 无此功能 | 新增 AddContainerTypePicker 子组件 | OfferPriceTable |
| 8 | Total TEU 缺失 | 仅单行 ContainerDetail 有 TEU | 新增 totalTeu/lineTeu 计算 | OfferPriceTable |
| 9 | 容器类型未关联 DB | 硬编码字符串 "20'", "40'" | 改用 container_types DB 代码 | OfferPriceTable, EnquiryForm |
