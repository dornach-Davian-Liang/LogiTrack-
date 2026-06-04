// ============================================================
// LogiTrack Pro - Constants v3
// ============================================================

import type { ProductCode, EnquiryStatus, OfferType, SubMode, CoreNonCore } from './types';

// ==========================================
// Product definitions (7 types)
// ==========================================

export const PRODUCTS: ProductCode[] = [
  'AIR',
  'SEA',
  'SEA-AIR',
  'RAIL',
  'RAIL-SEA',
  'RAIL-AIR',
  'AIR-RAIL-SEA',
];

/** Reference-number abbreviation per product */
export const PRODUCT_ABBR: Record<ProductCode, string> = {
  AIR: 'A',
  SEA: 'S',
  'SEA-AIR': 'SA',
  RAIL: 'R',
  'RAIL-SEA': 'RS',
  'RAIL-AIR': 'RA',
  'AIR-RAIL-SEA': 'ARS',
};

/** Products that use Route-Group (mixed-mode) UI */
export const MIXED_MODE_PRODUCTS: ProductCode[] = [
  'SEA-AIR',
  'RAIL-SEA',
  'RAIL-AIR',
  'AIR-RAIL-SEA',
];

/** Sub-mode sequence per mixed product */
export const PRODUCT_SUBMODE_MAP: Record<string, SubMode[]> = {
  'SEA-AIR': ['SEA', 'AIR'],
  'RAIL-SEA': ['RAIL', 'SEA'],
  'RAIL-AIR': ['RAIL', 'AIR'],
  'AIR-RAIL-SEA': ['AIR', 'RAIL', 'SEA'],
};

// ==========================================
// Status definitions (5 values)
// ==========================================

export const STATUSES: EnquiryStatus[] = [
  'New',
  'Quoted & Pending',
  'Secured',
  'Lost',
  'Cancelled',
];

/** Color mapping for status badges */
export const STATUS_COLORS: Record<EnquiryStatus, string> = {
  'New': 'bg-blue-100 text-blue-800',
  'Quoted & Pending': 'bg-yellow-100 text-yellow-800',
  'Secured': 'bg-green-100 text-green-800',
  'Lost': 'bg-red-100 text-red-800',
  'Cancelled': 'bg-gray-100 text-gray-800',
};

// ==========================================
// Cargo / Offer types (4 values)
// ==========================================

export const OFFER_TYPES: OfferType[] = ['FCL', 'LCL', 'AIR', 'BUYER-CONSOL'];

/** Which cargo types need container info (in Offer Price Details) */
export const CONTAINER_CARGO_TYPES: OfferType[] = ['FCL', 'BUYER-CONSOL'];

// ==========================================
// Product → allowed Cargo Type matrix
// ==========================================

export const PRODUCT_CARGO_MAP: Record<ProductCode, OfferType[]> = {
  AIR:            ['AIR'],
  SEA:            ['FCL', 'LCL', 'BUYER-CONSOL'],
  'SEA-AIR':      ['LCL', 'AIR'],
  RAIL:           ['FCL', 'LCL'],
  'RAIL-SEA':     ['FCL', 'LCL'],
  'RAIL-AIR':     ['LCL', 'AIR'],
  'AIR-RAIL-SEA': ['FCL', 'LCL', 'AIR'],
};

// ==========================================
// Core / Non-Core
// ==========================================

export const CORE_STATUSES: CoreNonCore[] = ['Core', 'Non-Core'];

// ==========================================
// Category (scope of service)
// ==========================================

export const CATEGORIES = [
  { code: 'OCEAN_FREIGHT', label: 'Ocean Freight' },
  { code: 'OCEAN_FREIGHT_ORIGIN', label: 'Ocean Freight + Origin Charges & EXW' },
  { code: 'OCEAN_FREIGHT_ORIGIN_DEST', label: 'Ocean Freight + Origin Charges & EXW + Dest. Charges' },
  { code: 'OCEAN_FREIGHT_DEST', label: 'Ocean Freight + Dest. Charges' },
  { code: 'ORIGIN_CHARGES_EXW', label: 'Origin Charges & EXW' },
  { code: 'DEST_CHARGES', label: 'Dest. Charges' },
  { code: 'LCL', label: 'LCL' },
  { code: 'AIR_FREIGHT', label: 'Air Freight' },
  { code: 'AIR_FREIGHT_ORIGIN', label: 'Air Freight + Origin Charge & EXW' },
];

// ==========================================
// Quantity UOM
// ==========================================

export const QUANTITY_UNITS = ['KG', 'CBM', 'CTNS', 'PLTS', 'PKGS', 'PCS', 'SET'];

// ==========================================
// CN Offices (static, for filters/dropdowns)
// ==========================================

export const ASSIGNED_OFFICES = [
  'HONG KONG',
  'SHANGHAI',
  'SHENZHEN',
  'NINGBO',
  'QINGDAO',
  'XIAMEN',
  'TIANJIN',
  'DALIAN',
  'BEIJING',
];

// ==========================================
// Sub-mode → port type mapping
// ==========================================

export const SUBMODE_PORT_TYPE: Record<SubMode, 'AIR' | 'SEA'> = {
  AIR: 'AIR',
  SEA: 'SEA',
  RAIL: 'SEA', // RAIL uses sea-port codes
};

// ==========================================
// Helpers
// ==========================================

/** Is this product a mixed-mode product? */
export function isMixedProduct(code: ProductCode): boolean {
  return MIXED_MODE_PRODUCTS.includes(code);
}

/** Get allowed cargo types for a product */
export function getAllowedCargoTypes(productCode: ProductCode): OfferType[] {
  return PRODUCT_CARGO_MAP[productCode] || [];
}

/** Does this cargo type need container details? */
export function needsContainerDetails(offerType: OfferType): boolean {
  return CONTAINER_CARGO_TYPES.includes(offerType);
}
