// ============================================================
// LogiTrack Pro - Type Definitions v3
// Aligned with schema_v3 database design
// ============================================================

// ==========================================
// Base Type Unions
// ==========================================

/** 7 product types */
export type ProductCode =
  | 'AIR'
  | 'SEA'
  | 'SEA-AIR'
  | 'RAIL'
  | 'RAIL-SEA'
  | 'RAIL-AIR'
  | 'AIR-RAIL-SEA';

/** 5-value status (DB stores "Quoted & Pending") */
export type EnquiryStatus =
  | 'New'
  | 'Quoted & Pending'
  | 'Secured'
  | 'Lost'
  | 'Cancelled';

/** 4 cargo / offer types (DB stores "BUYER-CONSOL") */
export type OfferType = 'FCL' | 'LCL' | 'AIR' | 'BUYER-CONSOL';

/** Port physical mode */
export type PortType = 'AIR' | 'SEA' | 'RAIL';

/** Route-group sub-mode for mixed products */
export type SubMode = 'AIR' | 'SEA' | 'RAIL';

/** Core / Non-Core (DB stores "Non-Core") */
export type CoreNonCore = 'Core' | 'Non-Core';

// ==========================================
// API Response Wrappers
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
  number?: number;
  page?: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

// ==========================================
// Select-option shapes
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
// Master-data entities
// ==========================================

export interface Country {
  id: number;
  countryCode: string;
  countryNameEn: string;
  countryNameCn?: string;
  isActive: boolean;
  isCore?: boolean;
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

export interface SalesCountry {
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SalesOffice {
  id: number;
  code: string;
  name: string;
  salesCountryCode?: string;
  countryCode: string;
  nameNorm?: string;
  remark?: string;
  isActive: boolean;
}

export interface SalesPic {
  id: number;
  name: string;
  salesCountryCode: string;
  salesOfficeId: number;
  salesOfficeName?: string;
  salesOfficeCode?: string;
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

export interface Carrier {
  id: number;
  carrierCode: string;
  carrierName: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Currency {
  id?: number;
  currencyCode: string;
  currencyName: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CnOffice {
  code: string;
  name: string;
  isActive: boolean;
}

// ==========================================
// Dictionary entities (v3)
// ==========================================

export interface ProductDict {
  code: string;
  name: string;
  abbr: string;
  isMixed: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface CargoTypeDict {
  code: string;
  name: string;
  needsContainer: boolean;
  isActive: boolean;
}

export interface SalesCountryDict {
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CancelledReasonDict {
  code: string;
  label: string;
  sortOrder: number;
}

export interface LostReasonDict {
  code: string;
  label: string;
  sortOrder: number;
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
// Route Group (v3 mixed-mode support)
// ==========================================

export interface RouteGroup {
  id?: number;
  enquiryId?: number;
  groupIndex: number;
  subMode: SubMode;
  polIds: number[];
  podIds: number[];
  polNames?: string[];
  podNames?: string[];
}

// ==========================================
// Offer + Price Lines + Container Details (v3)
// ==========================================

export interface OfferContainerDetail {
  id?: number;
  offerPriceLineId?: number;
  containerSizeType: string;
  containerType?: string;
  numberOfContainers: number;
  cargoWeightPerContainer?: number;
  containerPrice?: number;
  teuValue: number;
  lineTeu?: number;
}

export interface OfferPriceLine {
  id?: number;
  offerId?: number;
  routeGroupId?: number;
  subMode?: SubMode;
  polId: number;
  podId: number;
  perCbm?: number;
  minCharge?: number;
  localCharge?: number;
  price?: number;
  priceText?: string;
  carrier?: string;
  sortOrder?: number;
  containerDetails?: OfferContainerDetail[];
  polName?: string;
  podName?: string;
}

export interface Offer {
  id?: number;
  enquiryId?: number;
  sequenceNo: number;
  isLatest: boolean;
  offerType: OfferType;
  offerDate?: string;
  remark?: string;
  containerCurrency?: string;
  localChargeCurrency?: string;
  priceLines: OfferPriceLine[];
  createdAt?: string;
  updatedAt?: string;
}

/** DTO payload for creating/updating an offer (matches backend OfferCreateDTO) */
export interface OfferCreatePayload {
  offerType: OfferType;
  offerDate?: string;
  cargoTypeCode?: string;
  remark?: string;
  sequenceNo?: number;
  isLatest?: boolean;
  containerCurrency?: string;
  localChargeCurrency?: string;
  priceLines: OfferPriceLine[];
}

// ==========================================
// Enquiry (full detail, v3)
// ==========================================

export interface Enquiry {
  id: number;
  refNumber: string;
  enquiryReceivedDate: string;
  enquiryCreatedDate: string;
  productCode: ProductCode;
  productAbbr?: string;
  status: EnquiryStatus;

  cancelledReason?: string;
  cancelledReasonText?: string;
  lostReason?: string;
  lostReasonText?: string;

  salesCountryCode: string;
  salesPicId?: number;
  salesPicName?: string;
  salesOfficeId?: number;
  salesOfficeName?: string;
  salesOfficeCode?: string;
  assignedCnOffice?: string;
  senderEmail?: string;

  cargoTypeCode: string;
  offerType?: OfferType;
  volumeCbm?: number;
  quantity?: number;
  uom?: string;
  commodity?: string;
  hazardousSpecialEquipment?: string;
  isOversizeCargo?: boolean;
  exwLocation?: string;

  polIds?: number[];
  podIds?: number[];
  polCountry?: string;
  podCountry?: string;

  routeGroups?: RouteGroup[];

  coreNonCore?: CoreNonCore;
  category?: string;
  hasSpecificCargoReadyDate?: boolean;
  cargoReadyDate?: string;
  cargoReadyDateDetails?: string;
  remark?: string;

  offers?: Offer[];

  containerRows?: EnquiryContainerRow[];

  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// Enquiry list item (slim projection)
// ==========================================

export interface EnquiryListItem {
  id: number;
  refNumber: string;
  enquiryReceivedDate: string;
  enquiryCreatedDate?: string;
  status: EnquiryStatus;
  productCode?: ProductCode;
  productAbbr?: string;
  salesCountryCode: string;
  salesPicName?: string;
  salesOfficeName?: string;
  cargoTypeCode: string;
  commodity?: string;
  assignedCnOffice?: string;
  senderEmail?: string;
  coreNonCore?: CoreNonCore;
  polName?: string;
  podName?: string;
  podCountry?: string;
  offersCount?: number;
  latestOfferDate?: string;
  createdBy?: string;
}

// ==========================================
// Enquiry form data (create / update payload)
// ==========================================

// ==========================================
// Enquiry Container Row (Cargo Information level)
// ==========================================

export interface EnquiryContainerRow {
  id?: number;
  qty20: number;
  weight20?: number;
  qty40: number;
  weight40?: number;
  qty40hq: number;
  weight40hq?: number;
  qty45: number;
  weight45?: number;
  cntrTypeId?: number;
  cntrTypeCode?: string;
  lineTeu?: number; // computed
  /** Dynamic extra container quantities keyed by container code, e.g. { '20RF': 3, '40OT': 1 } */
  extraContainers?: Record<string, number>;
  /** Dynamic extra container weights keyed by container code, e.g. { '20OT': 150, '20RF': 200 } */
  extraContainerWeights?: Record<string, number>;
}

export interface EnquiryFormData {
  enquiryReceivedDate: string;
  enquiryCreatedDate: string;
  productCode: ProductCode;
  status?: EnquiryStatus;

  salesCountryCode: string;
  salesPicId?: number;
  salesOfficeId?: number;
  assignedCnOffice?: string;
  senderEmail?: string;

  cargoTypeCode: string;
  offerType?: OfferType;
  volumeCbm?: number;
  quantity?: number;
  uom?: string;
  commodity?: string;
  hazardousSpecialEquipment?: string;
  isOversizeCargo?: boolean;
  exwLocation?: string;

  polIds?: number[];
  podIds?: number[];
  polCountry?: string;
  podCountry?: string;

  routeGroups?: RouteGroup[];

  coreNonCore?: CoreNonCore;
  category?: string;
  hasSpecificCargoReadyDate?: boolean;
  cargoReadyDate?: string;
  cargoReadyDateDetails?: string;
  additionalRequirements?: string;
  remark?: string;

  containerRows?: EnquiryContainerRow[];
}

export interface ReferencePreview {
  referenceNumber: string;
  referenceMonth?: string;
  monthlySequence?: number;
  serialNumber?: number;
  productAbbr?: string;
}

// ==========================================
// Search / filter params
// ==========================================

export interface EnquirySearchParams {
  keyword?: string;
  status?: EnquiryStatus | string;
  productCode?: ProductCode | string;
  cargoTypeCode?: string;
  salesCountryCode?: string;
  assignedCnOffice?: string;
  coreNonCore?: CoreNonCore;
  polPortId?: number;
  podPortId?: number;
  dateFrom?: string;
  dateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  createdBy?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// ==========================================
// Status-change payload
// ==========================================

export interface StatusChangePayload {
  status: EnquiryStatus;
  reason?: string;
  reasonText?: string;
}

// ==========================================
// Legacy / CSV record type (kept for Table.tsx compat)
// ==========================================

export interface EnquiryRecord {
  id: string;
  enquiryReceivedDate: string;
  enquiryCreatedDate: string;
  referenceNumber: string;
  product: string;
  status: EnquiryStatus;
  salesCountry: string;
  salesOffice: string;
  salesPic: string;
  assignedCnOffice: string;
  cargoType: string;
  volumeCbm: number;
  quantity: number;
  quantityUnit: string;
  commodity: string;
  hazSpecialEquipment?: string;
  cargoReadyDateDetails?: string;
  pol: string;
  pod: string;
  podCountry: string;
  coreNonCore: string;
  category: string;
  cargoReadyDate?: string;
  firstQuotationSent?: string;
  firstOfferOceanFrg?: string;
  firstOfferAirFrgKg?: string;
  latestOfferOceanFrg?: string;
  latestOfferAirFrgKg?: string;
  remark?: string;
}

// ==========================================
// Report / Dashboard types
// ==========================================

export interface DashboardOverview {
  totalEnquiries: number;
  newEnquiries?: number;
  quotedPending?: number;
  secured?: number;
  lost?: number;
  cancelled?: number;
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
  count?: number;
  totalEnquiries?: number;
  quoted?: number;
  confirmed?: number;
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

export interface DashboardFilterParams {
  startDate: string;
  endDate: string;
  coreFlags?: ('Core' | 'Non_Core')[];
  cnOffice?: string;
  products?: string[];
  countries?: string[];
}

export interface CNOfficeStat {
  officeName: string;
  totalEnquiries: number;
  quoted: number;
  confirmed: number;
  yes: number;
  rejected: number;
  invalid: number;
  pending: number;
  conversionRate: string;
}

export interface DashboardStats {
  overview: DashboardOverview;
  statusBreakdown: { [status: string]: StatusBreakdown };
  monthlyTrend: MonthlyTrend[];
  topCountries: LocationStat[];
  topOrigins: LocationStat[];
  topDestinations: LocationStat[];
  cargoTypes: LocationStat[];
  cnOfficeStats?: CNOfficeStat[];
}

export interface DashboardStatsWithFilter extends DashboardStats {
  filterApplied?: DashboardFilterParams;
}

export type ComparisonType = 'MONTHLY' | 'QUARTERLY';

export interface PeriodComparisonRequest {
  comparisonType: ComparisonType;
  periods: string[];
  coreFlags?: ('Core' | 'Non_Core')[];
  cnOffice?: string;
  countryIds?: number[];
  productCodes?: string[];
}

export interface PeriodStats {
  period: string;
  startDate: string;
  endDate: string;
  totalEnquiries: number;
  quoted: number;
  confirmed: number;
  conversionRate: number;
  changeFromPrevious?: number;
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
  trendData: { [key: string]: number[] };
}

// ==========================================
// RBAC types
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
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  executionTime?: number;
  status: 'SUCCESS' | 'FAILED';
}

// ==========================================
// Monthly / Country report data
// ==========================================

export interface MonthlyReportData {
  month: string;
  summary: {
    totalEnquiries: number;
    quotedCount: number;
    securedCount: number;
    lostCount: number;
    cancelledCount: number;
    conversionRate: string;
    quoteRate: string;
  };
  byCountry: Array<{
    countryCode: string;
    countryName: string;
    enquiryCount: number;
    quotedCount: number;
    securedCount: number;
    conversionRate: string;
  }>;
  byCargoType: Array<{
    cargoType: string;
    enquiryCount: number;
    percentage: string;
    quotedCount: number;
    securedCount: number;
  }>;
  bySalesOffice: Array<{
    officeId: number;
    officeName: string;
    enquiryCount: number;
    quotedCount: number;
    conversionRate: string;
  }>;
}

export interface CountryReportData {
  countryCode: string;
  countryName: string;
  summary: {
    totalEnquiries: number;
    quotedCount: number;
    securedCount: number;
    conversionRate: string;
  };
  cargoDistribution: Array<{
    type: string;
    percentage: number;
    count: number;
  }>;
  statusDistribution: Array<{
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
