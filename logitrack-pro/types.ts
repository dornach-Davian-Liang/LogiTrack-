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
  
  // 路线信息 (支持多港口)
  polIds?: number[];  // 多个起运港ID
  polId?: number;  // 兼容单港口
  polCode?: string;
  polName?: string;
  polPortType?: string;
  podIds?: number[];  // 多个目的港ID
  podId?: number;  // 兼容单港口
  podCode?: string;
  podName?: string;
  podCountryCode?: string;
  podCountryName?: string;
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

export interface ReferencePreview {
  referenceNumber: string;
  referenceMonth: string;
  monthlySequence: number;
  serialNumber: number;
  productAbbr: string;
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
  assignedCnOfficeCode?: string;  // CN Office代码
  commodity?: string;  // 商品描述
}

// ==========================================
// 询价表单数据
// ==========================================

export interface EnquiryFormData {
  referenceNumber?: string;  // 参考编号
  referenceMonth?: string;   // 参考月份（YYMM）
  monthlySequence?: number;  // 月度序号
  serialNumber?: number;     // 序列号
  productAbbr?: string;      // 产品缩写
  
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
  polIds?: number[];  // 多个起运港ID
  polId?: number;  // 兼容单港口（后端可能需要）
  podIds?: number[];  // 多个目的港ID
  podId?: number;  // 兼容单港口（后端可能需要）
  podCountryCode?: string;  // POD国家代码
  podCountryName?: string;  // POD国家名称（自动映射）
  
  coreNonCore?: CoreStatus;
  coreFlag?: string;  // 兼容旧代码
  categoryCode?: string;
  cargoReadyDate?: string;
  cargoReadyDateRawText?: string;  // 兼容旧代码
  additionalRequirement?: string;  // 附加要求
  
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
  assignedCnOfficeCode?: string;  // CN Office筛选
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

// ==========================================
// Report 统计类型
// ==========================================
// Report Module Types
// ==========================================

export interface DashboardOverview {
  totalEnquiries: number;
  quoted: number;
  pending: number;
  confirmed: number;
  totalEnquiriesChange: number;
  quotedChange: number;
  confirmedChange: number;
}

export interface StatusBreakdown {
  count: number;
  percentage: string;
}

export interface MonthlyTrend {
  month: string;
  count: number;
  change?: number;
}

export interface LocationStat {
  name?: string;
  country?: string;
  port?: string;
  type?: string;
  count: number;
  percentage?: string;
}

// ==========================================
// Dashboard 过滤和对比类型
// ==========================================

export interface DashboardFilterParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  coreFlags?: ('CORE' | 'NON_CORE')[];
  cnOffice?: string;
}

export interface CNOfficeStat {
  officeName: string;
  totalEnquiries: number;
  yes: number;        // 已确认 (Booking Confirmed = 'Yes')
  rejected: number;   // 已拒绝 (Booking Confirmed = 'Rejected')
  invalid: number;    // 无效 (Booking Confirmed = 'Invalid')
  pending: number;    // 待定 (Booking Confirmed = 'Pending')
  conversionRate: number;
}

export interface DashboardStatsWithFilter extends DashboardStats {
  cnOfficeStats?: CNOfficeStat[];
  filterApplied?: DashboardFilterParams;
}

export type ComparisonType = 'MONTHLY' | 'QUARTERLY';

export interface PeriodComparisonRequest {
  comparisonType: ComparisonType;
  periods: string[]; // ["2026-01", "2026-02"] or ["2025-Q4", "2026-Q1"]
  coreFlags?: ('CORE' | 'NON_CORE')[];
  cnOffice?: string;
}

export interface PeriodStats {
  period: string;
  startDate: string;
  endDate: string;
  totalEnquiries: number;
  quoted: number;
  confirmed: number;
  conversionRate: number;
  changeFromPrevious?: number; // percentage
}

export interface ComparisonSummary {
  grandTotal: number;
  avgConversionRate: number;
  bestPeriod: string;
  worstPeriod: string;
}

export interface ComparisonResult {
  periodStats: PeriodStats[];
  summary: ComparisonSummary;
  trendData: {
    [key: string]: number[]; // 'totalEnquiries', 'quoted', 'confirmed'
  };
}

// ==========================================
// RBAC 类型定义
// ==========================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  username: string;
  fullName?: string;
  email?: string;
  roles: string[];
  permissions: string[];
  token: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  roles: Role[];
  createdAt?: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: string[];
}

export interface AuditLog {
  id: number;
  userId: number;
  username: string;
  operation: string;
  resourceType: string;
  resourceId?: number;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  executionTime?: number;
  status: 'SUCCESS' | 'FAILED';
}

export interface DashboardStats {
  overview: DashboardOverview;
  statusBreakdown: { [status: string]: StatusBreakdown };
  monthlyTrend: MonthlyTrend[];
  topCountries: LocationStat[];
  topOrigins: LocationStat[];
  topDestinations: LocationStat[];
  cargoTypes: LocationStat[];
}

export interface MonthlyReportData {
  month: string;
  summary: {
    totalEnquiries: number;
    quotedCount: number;
    bookingConfirmedCount: number;
    rejectionCount: number;
    bookingRate: string;
    quoteRate: string;
  };
  byCountry: Array<{
    countryCode: string;
    countryName: string;
    enquiryCount: number;
    quotedCount: number;
    bookedCount: number;
    conversionRate: string;
  }>;
  byCargoType: Array<{
    cargoType: string;
    enquiryCount: number;
    percentage: string;
    quotedCount: number;
    bookedCount: number;
  }>;
  bySalesOffice: Array<{
    officeId: number;
    officeName: string;
    enquiryCount: number;
    quotedCount: number;
    conversionRate: string;
  }>;
  bookingStatus: Array<{
    status: string;
    count: number;
    percentage: string;
  }>;
}

export interface CountryReportData {
  countryCode: string;
  countryName: string;
  summary: {
    totalEnquiries: number;
    quotedCount: number;
    bookedCount: number;
    conversionRate: string;
  };
  cargoDistribution: Array<{
    type: string;
    percentage: number;
    count: number;
  }>;
  bookingStatusDistribution: Array<{
    status: string;
    percentage: number;
    count: number;
  }>;
  topPics: Array<{
    picId: number;
    picName: string;
    enquiryCount: number;
    quotedCount: number;
    conversionRate: string;
  }>;
  trend30Days: Array<{
    date: string;
    count: number;
  }>;
}

export interface ExportOptions {
  reportType: 'monthly' | 'country' | 'cargoType' | 'office';
  format: 'xlsx' | 'csv';
  includeCharts: boolean;
  month?: string;
  countryCode?: string;
  startDate?: string;
  endDate?: string;
}