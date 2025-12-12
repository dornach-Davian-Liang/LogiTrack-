export type ProductType = 'AIR' | 'SEA' | 'RAIL' | 'TRUCK';
export type EnquiryStatus = 'New' | 'Quoted' | 'Pending';
export type BookingStatus = 'Yes' | 'Rejected' | 'Pending' | '';
export type CoreStatus = 'CORE' | 'NON CORE';

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
  assignedCnOffices: string; // 修正：匹配后端字段名

  // Section 3: Cargo Details (Columns K-Q + X)
  cargoType: string; // e.g., AIR, LCL
  volumeCbm: number;
  quantity: number;
  quantityUnit: string; // KG, CTN
  quantityTeu?: number;
  commodity: string;
  hazSpecialEquipment?: string; // 修正：匹配后端字段名
  additionalRequirement?: string; // Column X

  // Section 4: Route (Columns R-T)
  pol: string; // Port of Loading
  pod: string; // Port of Discharge
  podCountry: string;
  
  // Section 5: Business Logic (Columns U-V)
  coreNonCore: string; // 修正：匹配后端字段名
  category: string; // 1. Freight, 2. Freight + Origin...

  // Section 6: Timeline & Pricing (Columns W, Y-AC)
  cargoReadyDate?: string;
  firstQuotationSent?: string; // 修正：匹配后端字段名
  firstOfferOceanFrg?: string; // 修正：匹配后端字段名
  firstOfferAirFrgKg?: string; // 修正：匹配后端字段名
  latestOfferOceanFrg?: string; // 修正：匹配后端字段名
  latestOfferAirFrgKg?: string; // 修正：匹配后端字段名

  // Section 7: Outcome (Columns AD-AG)
  bookingConfirmed: BookingStatus;
  remark?: string;
  rejectedReason?: string;
  actualReason?: string;
}