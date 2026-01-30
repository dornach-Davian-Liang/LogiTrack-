import { EnquiryRecord } from '../types';

// ==========================================
// CONFIGURATION
// ==========================================
// Set this to false when your Spring Boot backend is running
const USE_MOCK_DATA = false; 
const API_BASE_URL = '/api/enquiries'; // Use relative path for Vite proxy

// ==========================================
// MOCK DATA (Fallback)
// ==========================================
let MOCK_DB: EnquiryRecord[] = [
  {
    id: '1',
    enquiryReceivedDate: '2024-01-02',
    issueDate: '2024-01-02',
    referenceNumber: 'CN2401006-A',
    product: 'AIR',
    status: 'Quoted',
    cnPricingAdmin: 'Susana Wong',
    salesCountry: 'CHINA',
    salesOffice: 'ZIEGLER HONG KONG',
    salesPic: 'PHILIP WONG',
    assignedCnOffices: 'HONG KONG',
    cargoType: 'AIR',
    volumeCbm: 0.27,
    quantity: 116.0,
    quantityUnit: 'KG',
    commodity: 'RFID Sticker',
    pol: 'HKG',
    pod: 'KHI',
    podCountry: 'PAKISTAN',
    coreNonCore: 'NON CORE',
    category: '4. Origin Charges/EXW',
    cargoReadyDate: '2024-01-02',
    firstQuotationSent: '2024-01-02',
    firstOfferAirFrgKg: 'USD3.35 ALL IN',
    bookingConfirmed: 'Yes',
    remark: 'SO#750-12140009'
  },
  {
    id: '2',
    enquiryReceivedDate: '2024-01-02',
    issueDate: '2024-01-02',
    referenceNumber: 'CN2401007-A',
    product: 'AIR',
    status: 'Quoted',
    cnPricingAdmin: 'Susana Wong',
    salesCountry: 'CHINA',
    salesOffice: 'ZIEGLER HONG KONG',
    salesPic: 'PHILIP WONG',
    assignedCnOffices: 'HONG KONG',
    cargoType: 'AIR',
    volumeCbm: 2.76,
    quantity: 408.0,
    quantityUnit: 'KG',
    commodity: 'Plastic Hangers',
    pol: 'HKG',
    pod: 'LHE',
    podCountry: 'PAKISTAN',
    coreNonCore: 'NON CORE',
    category: '4. Origin Charges/EXW',
    cargoReadyDate: '2024-01-02',
    firstQuotationSent: '2024-01-02',
    firstOfferAirFrgKg: 'USD3.35 ALL IN',
    bookingConfirmed: 'Yes',
    remark: 'SO#750-12140007'
  },
  {
    id: '3',
    enquiryReceivedDate: '2024-01-02',
    issueDate: '2024-01-02',
    referenceNumber: 'CN2401008-A',
    product: 'AIR',
    status: 'Quoted',
    cnPricingAdmin: 'Susana Wong',
    salesCountry: 'UK',
    salesOffice: 'ZIEGLER COLNBROOK',
    salesPic: 'STEWART BROOK',
    assignedCnOffices: 'HONG KONG',
    cargoType: 'AIR',
    volumeCbm: 17.203,
    quantity: 2131.5,
    quantityUnit: 'KG',
    commodity: 'LED Masks',
    pol: 'HKG',
    pod: 'LHE',
    podCountry: 'PAKISTAN',
    coreNonCore: 'NON CORE',
    category: '4. Origin Charges/EXW',
    cargoReadyDate: '2024-01-03',
    firstQuotationSent: '2024-01-02',
    firstOfferAirFrgKg: 'USD4.57',
    bookingConfirmed: 'Yes'
  },
  {
    id: '4',
    enquiryReceivedDate: '2024-01-02',
    issueDate: '2024-01-02',
    referenceNumber: 'CN2401009-A',
    product: 'AIR',
    status: 'Quoted',
    cnPricingAdmin: 'Susana Wong',
    salesCountry: 'FRANCE',
    salesOffice: 'ZIEGLER FRANCE',
    salesPic: 'SANDRINE JUILLIEN',
    assignedCnOffices: 'HONG KONG',
    cargoType: 'AIR',
    volumeCbm: 0.219,
    quantity: 69.5,
    quantityUnit: 'KG',
    commodity: 'Brand Reminder',
    pol: 'HKG',
    pod: 'NTE',
    podCountry: 'FRANCE',
    coreNonCore: 'CORE',
    category: '4. Origin Charges/EXW',
    cargoReadyDate: '2024-01-02',
    firstQuotationSent: '2024-01-02',
    firstOfferAirFrgKg: 'HKD44.52',
    bookingConfirmed: 'Yes'
  },
  {
    id: '5',
    enquiryReceivedDate: '2024-01-02',
    issueDate: '2024-01-02',
    referenceNumber: 'CN2401010-A',
    product: 'AIR',
    status: 'Quoted',
    cnPricingAdmin: 'Susana Wong',
    salesCountry: 'NETHERLANDS',
    salesOffice: 'ZIEGLER NETHERLANDS',
    salesPic: 'JACO VAN DIJK',
    assignedCnOffices: 'SHANGHAI',
    cargoType: 'AIR',
    volumeCbm: 0.49,
    quantity: 39.0,
    quantityUnit: 'KG',
    commodity: 'TBA',
    pol: 'PVG',
    pod: 'AMS',
    podCountry: 'NETHERLANDS',
    coreNonCore: 'CORE',
    category: '1. Freight',
    cargoReadyDate: 'TBA',
    firstQuotationSent: '2024-01-02',
    firstOfferAirFrgKg: 'USD3.38',
    bookingConfirmed: 'Yes'
  }
];

// ==========================================
// SERVICE METHODS
// ==========================================

export const api = {
  /**
   * Fetch all enquiry records
   */
  getAll: async (): Promise<EnquiryRecord[]> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network latency
      return [...MOCK_DB];
    }
    
    console.log('[dataService] Fetching from:', API_BASE_URL);
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
      });
      
      console.log('[dataService] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[dataService] Error response:', errorText);
        throw new Error(`Failed to fetch data: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[dataService] Raw data received:', data);
      
      // Handle paginated response from Spring Boot backend
      const records = data.content || data;
      console.log('[dataService] Extracted records:', records.length, 'items');
      
      // Map backend entity fields to frontend EnquiryRecord format
      const mappedRecords: EnquiryRecord[] = records.map((item: any) => ({
        id: String(item.id),
        enquiryReceivedDate: item.enquiryReceivedDate || '',
        issueDate: item.issueDate || '',
        referenceNumber: item.referenceNumber || '',
        product: item.productCode || item.productAbbr || 'SEA',
        status: item.status || 'New',
        cnPricingAdmin: item.cnPricingAdmin || '',
        salesCountry: item.salesCountryCode || '',
        salesOffice: item.salesOfficeCode || String(item.salesOfficeId || ''),
        salesPic: item.salesPicName || String(item.salesPicId || ''),
        assignedCnOffices: item.assignedCnOfficeCode || '',
        cargoType: item.cargoTypeCode || '',
        volumeCbm: item.volumeCbm || 0,
        quantity: item.quantity || 0,
        quantityUnit: item.quantityUomCode || '',
        quantityTeu: item.quantityTeu,
        commodity: item.commodity || '',
        hazSpecialEquipment: item.hazSpecialEquipment,
        additionalRequirement: item.additionalRequirement,
        pol: item.polCode || String(item.polId || ''),
        pod: item.podCode || String(item.podId || ''),
        podCountry: item.podCountryCode || '',
        coreNonCore: item.coreFlag === 'CORE' ? 'CORE' : (item.coreFlag === 'NON_CORE' ? 'NON CORE' : ''),
        category: item.categoryCode || '',
        cargoReadyDate: item.cargoReadyDate,
        firstQuotationSent: item.offers?.[0]?.sentDate,
        firstOfferOceanFrg: item.offers?.find((o: any) => o.offerType === 'OCEAN')?.priceText,
        firstOfferAirFrgKg: item.offers?.find((o: any) => o.offerType === 'AIR')?.priceText,
        bookingConfirmed: item.bookingConfirmed || 'Pending',
        remark: item.remark,
        rejectedReason: item.rejectedReason,
        actualReason: item.actualReason,
      }));
      
      return mappedRecords;
    } catch (error) {
      console.error('[dataService] Fetch error:', error);
      throw error;
    }
  },

  /**
   * Get single record by ID
   */
  getById: async (id: string): Promise<EnquiryRecord | undefined> => {
     if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_DB.find(item => item.id === id);
     }

     const response = await fetch(`${API_BASE_URL}/${id}`);
     if (!response.ok) throw new Error('Failed to fetch record');
     return response.json();
  },

  /**
   * Create a new record
   */
  create: async (record: Omit<EnquiryRecord, 'id'>): Promise<EnquiryRecord> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const newRecord = { ...record, id: Math.random().toString(36).substr(2, 9) };
      MOCK_DB = [newRecord, ...MOCK_DB];
      return newRecord;
    }

    console.log('[dataService] Creating record:', record);
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(record),
      });
      
      console.log('[dataService] Create response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[dataService] Create error:', errorText);
        throw new Error(`Failed to create record: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[dataService] Record created:', data);
      return data;
    } catch (error) {
      console.error('[dataService] Create error:', error);
      throw error;
    }
  },

  /**
   * Update an existing record
   */
  update: async (record: EnquiryRecord): Promise<EnquiryRecord> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800));
      MOCK_DB = MOCK_DB.map(item => item.id === record.id ? record : item);
      return record;
    }

    console.log('[dataService] Updating record:', record.id, record);
    try {
      const response = await fetch(`${API_BASE_URL}/${record.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(record),
      });
      
      console.log('[dataService] Update response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[dataService] Update error:', errorText);
        throw new Error(`Failed to update record: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[dataService] Record updated:', data);
      return data;
    } catch (error) {
      console.error('[dataService] Update error:', error);
      throw error;
    }
  },

  /**
   * Delete a record
   */
  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      MOCK_DB = MOCK_DB.filter(item => item.id !== id);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete record');
  }
};
