// ============================================================
// LogiTrack Pro - 类型定义
// 完整的类型定义文件，适配 schema_v2 数据库设计
// ============================================================

// ==========================================
// 基础类型定义
// ==========================================

export type ProductType = 'AIR' | 'SEA' | 'RAIL' | 'TRUCK';
export type ProductCode = 'AIR' | 'SEA' | 'SEA-AIR' | 'RAIL' | 'RAIL-SEA';
export type EnquiryStatus = 'New' | 'Quoted' | 'Pending';
export type BookingStatus = 'Yes' | 'Rejected' | 'Pending' | '';
export type CoreStatus = 'CORE' | 'NON CORE' | '';
export type PortType = 'AIR' | 'SEA';
export type OfferType = 'OCEAN' | 'AIR' | 'OTHER';
export type CargoType = 'AIR' | 'FCL' | 'LCL' | 'RAIL' | 'SEA';

// ==========================================
// API 响应类型
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number?: number;  // Spring 标准字段
  page?: number;    // 兼容旧代码
  size: number;
  first?: boolean;
  last?: boolean;
}

// ==========================================
// 选择器类型
// ==========================================

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface PortSelectOption extends SelectOption {
  portCode: string;
  portType: PortType;
  countryCode: string;
}

export interface SalesPicSelectOption extends SelectOption {
  countryCode: string;
  officeId: number;
  officeName: string;
  officeCode: string;
}

export interface ContainerTypeSelectOption extends SelectOption {
  teuValue: number;
  isSpecial: boolean;
}

// ==========================================
// 主数据实体
// ==========================================

export interface Country {
  id: number;
  countryCode: string;
  countryNameEn: string;
  countryNameCn?: string;
  isActive: boolean;
}

export interface Port {
  id: number;
  portCode: string;
  portName: string;
  portType: PortType;
  countryCode: string;
  city?: string;
  isActive: boolean;
}

export interface SalesOffice {
  id: number;
  code: string;
  name: string;
  countryCode: string;
  isActive: boolean;
}

export interface SalesPic {
  id: number;
  name: string;
  countryCode: string;
  salesOfficeId: number;
  salesOfficeName: string;
  salesOfficeCode: string;
  isActive: boolean;
}

export interface ContainerType {
  id: number;
  containerCode: string;
  containerName: string;
  teuValue: number;
  lengthFeet: number;
  isSpecial: boolean;
  isActive: boolean;
}

export interface CnOffice {
  code: string;
  name: string;
  isActive: boolean;
}

// ==========================================
// 字典类型
// ==========================================

export interface CargoTypeDict {
  code: string;
  name: string;
  offerType: OfferType;
  isActive: boolean;
}

export interface ProductDict {
  code: string;
  name: string;
  abbr: string;
  isActive: boolean;
}

export interface UomDict {
  code: string;
  name: string;
  isActive: boolean;
}

export interface CategoryDict {
  code: string;
  name: string;
  isActive: boolean;
}

// ==========================================
// 集装箱行
// ==========================================

export interface ContainerLine {
  id?: number;
  enquiryId?: number;
  lineNumber?: number;
  containerTypeId: number;
  containerTypeCode?: string;
  containerCode?: string;  // 兼容旧代码
  containerQty?: number;   // 兼容旧代码
  quantity?: number;
  teuValue?: number;
  teuPerUnit?: number;     // 兼容旧代码
  lineTeu?: number;
  teuTotal?: number;       // 兼容旧代码
}

// ==========================================
// 报价实体
// ==========================================

export interface Offer {
  id: number;
  enquiryId: number;
  offerType: OfferType;
  sequenceNo?: number;
  sentDate: string;
  price?: number;
  priceText?: string;
  isBest?: boolean;
  isLatest?: boolean;
  isRejectedPrice?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OfferFormData {
  enquiryId: number;
  offerType: OfferType;
  sentDate: string;
  price?: number;
  priceText?: string;
}

// ==========================================
// 询价实体 (详细)
// ==========================================

export interface Enquiry {
  id: number;
  referenceNumber: string;
  enquiryReceivedDate: string;
  issueDate: string;
  referenceMonth: string;
  monthlySequence: number;
  serialNumber: number;
  productCode: ProductCode;
  productAbbr: string;
  status: EnquiryStatus;
  
  // 销售信息
  cnPricingAdmin: string;
  salesCountryCode: string;
  salesOfficeId?: number;
  salesOfficeName?: string;
  salesOfficeCode?: string;
  salesPicId?: number;
  salesPicName?: string;
  assignedCnOffice?: string;
  assignedCnOfficeCode?: string;  // 兼容旧代码
  
  // 货物信息
  cargoTypeCode: string;
  volumeCbm?: number;
  quantity?: number;
  quantityUom?: string;
  quantityUomCode?: string;  // 兼容旧代码
  quantityTeu?: number;
  commodity?: string;
  hazSpecialEquipment?: string;
  additionalRequirement?: string;
  
  // 路线信息
  polId?: number;
  polCode?: string;
  polName?: string;
  polPortType?: string;
  podId?: number;
  podCode?: string;
  podName?: string;
  podCountryCode?: string;
  podCountryName?: string;  // 添加缺失字段
  podPortType?: string;
  
  // 业务逻辑
  coreNonCore?: CoreStatus;
  coreFlag?: string;  // 兼容旧代码
  categoryCode?: string;
  categoryName?: string;
  cargoReadyDate?: string;
  cargoReadyDateRawText?: string;  // 兼容旧代码
  
  // 报价信息 (汇总)
  firstQuotationSent?: string;
  firstOfferOceanFrg?: string;
  firstOfferAirFrgKg?: string;
  latestOfferOceanFrg?: string;
  latestOfferAirFrgKg?: string;
  
  // 结果
  bookingConfirmed: BookingStatus;
  remark?: string;
  rejectedReason?: string;
  actualReason?: string;
  
  // 关联数据
  containerLines?: ContainerLine[];
  offers?: Offer[];
  
  // 时间戳
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 询价列表项 (简化版)
// ==========================================

export interface EnquiryListItem {
  id: number;
  referenceNumber: string;
  enquiryReceivedDate: string;
  issueDate?: string;
  status: EnquiryStatus;
  productCode?: ProductCode;
  productAbbr?: string;
  salesCountryCode: string;
  salesPicName?: string;
  salesOfficeName?: string;
  cargoTypeCode: string;
  polCode?: string;
  polName?: string;
  podCode?: string;
  podName?: string;
  podCountryName?: string;
  quantityTeu?: number;
  bookingConfirmed: BookingStatus;
  offersCount?: number;
  offerCount?: number;  // 兼容旧代码
  latestOfferDate?: string;
  latestOfferPrice?: string;
}

// ==========================================
// 询价表单数据
// ==========================================

export interface EnquiryFormData {
  enquiryReceivedDate: string;
  issueDate: string;
  productCode: ProductCode;
  status: EnquiryStatus;
  
  cnPricingAdmin: string;
  salesCountryCode: string;
  salesPicId?: number;
  salesOfficeId?: number;
  assignedCnOffice?: string;
  assignedCnOfficeCode?: string;  // 兼容旧代码
  
  cargoTypeCode: string;
  volumeCbm?: number;
  quantity?: number;
  quantityUom?: string;
  quantityUomCode?: string;  // 兼容旧代码
  commodity?: string;
  hazSpecialEquipment?: string;
  additionalRequirement?: string;
  
  polId?: number;
  podId?: number;
  
  coreNonCore?: CoreStatus;
  coreFlag?: string;  // 兼容旧代码
  categoryCode?: string;
  cargoReadyDate?: string;
  cargoReadyDateRawText?: string;  // 兼容旧代码
  
  bookingConfirmed: BookingStatus;
  remark?: string;
  rejectedReason?: string;
  actualReason?: string;
  
  containerLines?: ContainerLine[];
}

// ==========================================
// 询价搜索参数
// ==========================================

export interface EnquirySearchParams {
  referenceNumber?: string;
  keyword?: string;  // 添加关键字搜索
  status?: EnquiryStatus;
  productCode?: ProductCode;
  salesCountryCode?: string;
  salesCountryCodes?: string[];  // 多选国家
  salesPicId?: number;
  cargoTypeCode?: string;
  cargoTypes?: string[];  // 多选货物类型
  bookingConfirmed?: BookingStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// ==========================================
// 旧版兼容类型
// ==========================================

// Mapping the CSV columns to a clean data structure
export interface EnquiryRecord {
  id: string;
  // Section 1: General Info (Columns A-E)
  enquiryReceivedDate: string;
  issueDate: string;
  referenceNumber: string; // e.g., CN2401006-A
  product: ProductType;
  status: EnquiryStatus;
  
  // Section 2: Sales & Admin (Columns F-J)
  cnPricingAdmin: string;
  salesCountry: string;
  salesOffice: string;
  salesPic: string; // Person In Charge
  assignedCnOffices: string;

  // Section 3: Cargo Details (Columns K-Q + X)
  cargoType: string; // e.g., AIR, LCL
  volumeCbm: number;
  quantity: number;
  quantityUnit: string; // KG, CTN
  quantityTeu?: number;
  commodity: string;
  hazSpecialEquipment?: string;
  additionalRequirement?: string; // Column X

  // Section 4: Route (Columns R-T)
  pol: string; // Port of Loading
  pod: string; // Port of Discharge
  podCountry: string;
  
  // Section 5: Business Logic (Columns U-V)
  coreNonCore: string;
  category: string; // 1. Freight, 2. Freight + Origin...

  // Section 6: Timeline & Pricing (Columns W, Y-AC)
  cargoReadyDate?: string;
  firstQuotationSent?: string;
  firstOfferOceanFrg?: string;
  firstOfferAirFrgKg?: string;
  latestOfferOceanFrg?: string;
  latestOfferAirFrgKg?: string;

  // Section 7: Outcome (Columns AD-AG)
  bookingConfirmed: BookingStatus;
  remark?: string;
  rejectedReason?: string;
  actualReason?: string;
}