// ============================================================
// LogiTrack Pro - API 服务层
// 询价管理和报价管理的完整 API 接口
// ============================================================

import {
  Enquiry,
  EnquiryListItem,
  EnquiryFormData,
  EnquirySearchParams,
  EnquiryStatus,
  Offer,
  OfferFormData,
  ContainerLine,
  Country,
  Port,
  SalesOffice,
  SalesPic,
  ContainerType,
  CnOffice,
  CargoTypeDict,
  ProductDict,
  UomDict,
  CategoryDict,
  PagedResponse,
  ApiResponse,
  PortType,
  SelectOption,
  PortSelectOption,
  SalesPicSelectOption,
  ContainerTypeSelectOption,
} from '../types';

// ==========================================
// 配置
// ==========================================

const API_BASE_URL = '/api';
const USE_MOCK_DATA = true; // 开发时使用 mock 数据

// ==========================================
// 通用请求方法
// ==========================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ==========================================
// Mock 数据
// ==========================================

const MOCK_COUNTRIES: Country[] = [
  { id: 1, countryCode: 'FR', countryNameEn: 'FRANCE', countryNameCn: '法国', isActive: true },
  { id: 2, countryCode: 'UK', countryNameEn: 'UNITED KINGDOM', countryNameCn: '英国', isActive: true },
  { id: 3, countryCode: 'DE', countryNameEn: 'GERMANY', countryNameCn: '德国', isActive: true },
  { id: 4, countryCode: 'BE', countryNameEn: 'BELGIUM', countryNameCn: '比利时', isActive: true },
  { id: 5, countryCode: 'NL', countryNameEn: 'NETHERLANDS', countryNameCn: '荷兰', isActive: true },
  { id: 6, countryCode: 'CN', countryNameEn: 'CHINA', countryNameCn: '中国', isActive: true },
  { id: 7, countryCode: 'AGENTS', countryNameEn: 'AGENTS', isActive: true },
];

const MOCK_SALES_OFFICES: SalesOffice[] = [
  { id: 1, code: 'FR-ZF', name: 'ZIEGLER FRANCE', countryCode: 'FR', isActive: true },
  { id: 2, code: 'UK-ZU', name: 'ZIEGLER UK', countryCode: 'UK', isActive: true },
  { id: 3, code: 'DE-ZD', name: 'ZIEGLER GERMANY', countryCode: 'DE', isActive: true },
  { id: 4, code: 'BE-ZB', name: 'ZIEGLER BELGIUM', countryCode: 'BE', isActive: true },
  { id: 5, code: 'NL-ZN', name: 'ZIEGLER NETHERLANDS', countryCode: 'NL', isActive: true },
  { id: 6, code: 'AG-AFS', name: 'AGENTS FORWARDING', countryCode: 'AGENTS', isActive: true },
];

const MOCK_SALES_PICS: SalesPic[] = [
  { id: 1, name: 'JEAN DUPONT', countryCode: 'FR', salesOfficeId: 1, salesOfficeName: 'ZIEGLER FRANCE', salesOfficeCode: 'FR-ZF', isActive: true },
  { id: 2, name: 'MARIE MARTIN', countryCode: 'FR', salesOfficeId: 1, salesOfficeName: 'ZIEGLER FRANCE', salesOfficeCode: 'FR-ZF', isActive: true },
  { id: 3, name: 'JOHN SMITH', countryCode: 'UK', salesOfficeId: 2, salesOfficeName: 'ZIEGLER UK', salesOfficeCode: 'UK-ZU', isActive: true },
  { id: 4, name: 'JAMES BROWN', countryCode: 'UK', salesOfficeId: 2, salesOfficeName: 'ZIEGLER UK', salesOfficeCode: 'UK-ZU', isActive: true },
  { id: 5, name: 'HANS MUELLER', countryCode: 'DE', salesOfficeId: 3, salesOfficeName: 'ZIEGLER GERMANY', salesOfficeCode: 'DE-ZD', isActive: true },
  { id: 6, name: 'AGENT SMITH', countryCode: 'AGENTS', salesOfficeId: 6, salesOfficeName: 'AGENTS FORWARDING', salesOfficeCode: 'AG-AFS', isActive: true },
];

const MOCK_PORTS: Port[] = [
  { id: 1, portCode: 'CNSHA', portName: 'Shanghai', portType: 'SEA', countryCode: 'CN', city: 'Shanghai', isActive: true },
  { id: 2, portCode: 'CNSZX', portName: 'Shenzhen', portType: 'SEA', countryCode: 'CN', city: 'Shenzhen', isActive: true },
  { id: 3, portCode: 'CNNBO', portName: 'Ningbo', portType: 'SEA', countryCode: 'CN', city: 'Ningbo', isActive: true },
  { id: 4, portCode: 'HKHKG', portName: 'Hong Kong', portType: 'SEA', countryCode: 'CN', city: 'Hong Kong', isActive: true },
  { id: 5, portCode: 'FRLEH', portName: 'Le Havre', portType: 'SEA', countryCode: 'FR', city: 'Le Havre', isActive: true },
  { id: 6, portCode: 'GBFXT', portName: 'Felixstowe', portType: 'SEA', countryCode: 'UK', city: 'Felixstowe', isActive: true },
  { id: 7, portCode: 'DEHAM', portName: 'Hamburg', portType: 'SEA', countryCode: 'DE', city: 'Hamburg', isActive: true },
  { id: 8, portCode: 'NLRTM', portName: 'Rotterdam', portType: 'SEA', countryCode: 'NL', city: 'Rotterdam', isActive: true },
  { id: 9, portCode: 'BEANR', portName: 'Antwerp', portType: 'SEA', countryCode: 'BE', city: 'Antwerp', isActive: true },
  // 机场
  { id: 101, portCode: 'PVG', portName: 'Shanghai Pudong International', portType: 'AIR', countryCode: 'CN', city: 'Shanghai', isActive: true },
  { id: 102, portCode: 'HKG', portName: 'Hong Kong International', portType: 'AIR', countryCode: 'CN', city: 'Hong Kong', isActive: true },
  { id: 103, portCode: 'CDG', portName: 'Paris Charles de Gaulle', portType: 'AIR', countryCode: 'FR', city: 'Paris', isActive: true },
  { id: 104, portCode: 'LHR', portName: 'London Heathrow', portType: 'AIR', countryCode: 'UK', city: 'London', isActive: true },
  { id: 105, portCode: 'FRA', portName: 'Frankfurt Airport', portType: 'AIR', countryCode: 'DE', city: 'Frankfurt', isActive: true },
  { id: 106, portCode: 'AMS', portName: 'Amsterdam Schiphol', portType: 'AIR', countryCode: 'NL', city: 'Amsterdam', isActive: true },
];

const MOCK_CONTAINER_TYPES: ContainerType[] = [
  { id: 1, containerCode: '20GP', containerName: "20' General Purpose", teuValue: 1.00, lengthFeet: 20, isSpecial: false, isActive: true },
  { id: 2, containerCode: '40GP', containerName: "40' General Purpose", teuValue: 2.00, lengthFeet: 40, isSpecial: false, isActive: true },
  { id: 3, containerCode: '40HQ', containerName: "40' High Cube", teuValue: 2.00, lengthFeet: 40, isSpecial: false, isActive: true },
  { id: 4, containerCode: '40HC', containerName: "40' High Cube", teuValue: 2.00, lengthFeet: 40, isSpecial: false, isActive: true },
  { id: 5, containerCode: '45HQ', containerName: "45' High Cube", teuValue: 2.25, lengthFeet: 45, isSpecial: false, isActive: true },
  { id: 6, containerCode: '20RF', containerName: "20' Reefer", teuValue: 1.00, lengthFeet: 20, isSpecial: true, isActive: true },
  { id: 7, containerCode: '40RF', containerName: "40' Reefer", teuValue: 2.00, lengthFeet: 40, isSpecial: true, isActive: true },
  { id: 8, containerCode: '20OT', containerName: "20' Open Top", teuValue: 1.00, lengthFeet: 20, isSpecial: true, isActive: true },
  { id: 9, containerCode: '40OT', containerName: "40' Open Top", teuValue: 2.00, lengthFeet: 40, isSpecial: true, isActive: true },
  { id: 10, containerCode: '20FR', containerName: "20' Flat Rack", teuValue: 1.00, lengthFeet: 20, isSpecial: true, isActive: true },
  { id: 11, containerCode: '40FR', containerName: "40' Flat Rack", teuValue: 2.00, lengthFeet: 40, isSpecial: true, isActive: true },
];

const MOCK_CN_OFFICES: CnOffice[] = [
  { code: 'SHANGHAI', name: 'Shanghai', isActive: true },
  { code: 'SHENZHEN', name: 'Shenzhen', isActive: true },
  { code: 'NINGBO', name: 'Ningbo', isActive: true },
  { code: 'HONG KONG', name: 'Hong Kong', isActive: true },
  { code: 'TIANJIN', name: 'Tianjin', isActive: true },
  { code: 'QINGDAO', name: 'Qingdao', isActive: true },
  { code: 'XIAMEN', name: 'Xiamen', isActive: true },
  { code: 'CN-MULTI', name: 'CN-Multi', isActive: true },
];

const MOCK_CARGO_TYPES: CargoTypeDict[] = [
  { code: 'AIR', name: 'Air Freight', offerType: 'AIR', isActive: true },
  { code: 'FCL', name: 'Full Container Load', offerType: 'OCEAN', isActive: true },
  { code: 'LCL', name: 'Less than Container Load', offerType: 'OCEAN', isActive: true },
  { code: 'RAIL', name: 'Rail Freight', offerType: 'OTHER', isActive: true },
  { code: 'SEA', name: 'Sea Freight', offerType: 'OCEAN', isActive: true },
];

const MOCK_PRODUCTS: ProductDict[] = [
  { code: 'AIR', name: 'Air Freight', abbr: 'A', isActive: true },
  { code: 'SEA', name: 'Sea Freight', abbr: 'S', isActive: true },
  { code: 'SEA-AIR', name: 'Sea-Air Combined', abbr: 'SA', isActive: true },
  { code: 'RAIL', name: 'Rail Freight', abbr: 'R', isActive: true },
  { code: 'RAIL-SEA', name: 'Rail-Sea Combined', abbr: 'RS', isActive: true },
];

const MOCK_UOMS: UomDict[] = [
  { code: 'KG', name: 'Kilogram', isActive: true },
  { code: 'PCS', name: 'Pieces', isActive: true },
  { code: 'CTN', name: 'Cartons', isActive: true },
  { code: 'PLT', name: 'Pallets', isActive: true },
  { code: 'SET', name: 'Sets', isActive: true },
];

const MOCK_CATEGORIES: CategoryDict[] = [
  { code: 'ORIGIN_CHARGES_EXW', name: 'Origin Charges & EXW', isActive: true },
  { code: 'OCEAN_FREIGHT', name: 'Ocean Freight', isActive: true },
  { code: 'AIR_FREIGHT', name: 'Air Freight', isActive: true },
  { code: 'AIR_FREIGHT_ORIGIN', name: 'Air Freight + Origin Charge & EXW', isActive: true },
  { code: 'OCEAN_FREIGHT_ORIGIN', name: 'Ocean Freight + Origin Charges & EXW', isActive: true },
  { code: 'LCL', name: 'LCL', isActive: true },
  { code: 'DEST_CHARGES', name: 'Dest. Charges', isActive: true },
];

// Mock 询价数据
let MOCK_ENQUIRIES: Enquiry[] = [
  {
    id: 1,
    referenceNumber: 'CN2601001-S',
    enquiryReceivedDate: '2026-01-15',
    issueDate: '2026-01-15',
    referenceMonth: '2601',
    monthlySequence: 1,
    serialNumber: 0,
    productCode: 'SEA',
    productAbbr: 'S',
    status: 'Quoted',
    cnPricingAdmin: 'Susana Wong',
    salesCountryCode: 'FR',
    salesOfficeId: 1,
    salesOfficeName: 'ZIEGLER FRANCE',
    salesOfficeCode: 'FR-ZF',
    salesPicId: 1,
    salesPicName: 'JEAN DUPONT',
    assignedCnOfficeCode: 'SHANGHAI',
    cargoTypeCode: 'FCL',
    volumeCbm: 120.5,
    quantity: 2,
    quantityUomCode: 'CTN',
    quantityTeu: 4.0,
    commodity: 'Electronics components for automotive industry',
    polId: 1,
    polName: 'Shanghai',
    polCode: 'CNSHA',
    podId: 5,
    podName: 'Le Havre',
    podCode: 'FRLEH',
    podCountryCode: 'FR',
    podCountryName: 'FRANCE',
    coreFlag: 'CORE',
    categoryCode: 'OCEAN_FREIGHT',
    cargoReadyDate: '2026-01-20',
    bookingConfirmed: 'Pending',
    containerLines: [
      { id: 1, enquiryId: 1, containerTypeId: 3, containerCode: '40HQ', containerQty: 2, teuPerUnit: 2.0, teuTotal: 4.0 },
    ],
    offers: [
      { id: 1, enquiryId: 1, offerType: 'OCEAN', sequenceNo: 1, isLatest: true, sentDate: '2026-01-16', price: 2500, priceText: 'USD 2,500 all-in', isRejectedPrice: false },
    ],
  },
  {
    id: 2,
    referenceNumber: 'CN2601002-A',
    enquiryReceivedDate: '2026-01-16',
    issueDate: '2026-01-16',
    referenceMonth: '2601',
    monthlySequence: 2,
    serialNumber: 0,
    productCode: 'AIR',
    productAbbr: 'A',
    status: 'New',
    cnPricingAdmin: 'Susana Wong',
    salesCountryCode: 'UK',
    salesOfficeId: 2,
    salesOfficeName: 'ZIEGLER UK',
    salesOfficeCode: 'UK-ZU',
    salesPicId: 3,
    salesPicName: 'JOHN SMITH',
    assignedCnOfficeCode: 'HONG KONG',
    cargoTypeCode: 'AIR',
    volumeCbm: 2.5,
    quantity: 350,
    quantityUomCode: 'KG',
    commodity: 'LED lighting fixtures',
    polId: 102,
    polName: 'Hong Kong International',
    polCode: 'HKG',
    podId: 104,
    podName: 'London Heathrow',
    podCode: 'LHR',
    podCountryCode: 'UK',
    podCountryName: 'UNITED KINGDOM',
    coreFlag: 'NON_CORE',
    categoryCode: 'AIR_FREIGHT_ORIGIN',
    cargoReadyDate: '2026-01-25',
    bookingConfirmed: 'Pending',
  },
  {
    id: 3,
    referenceNumber: 'CN2601003-S',
    enquiryReceivedDate: '2026-01-17',
    issueDate: '2026-01-17',
    referenceMonth: '2601',
    monthlySequence: 3,
    serialNumber: 0,
    productCode: 'SEA',
    productAbbr: 'S',
    status: 'Quoted',
    cnPricingAdmin: 'Susana Wong',
    salesCountryCode: 'DE',
    salesOfficeId: 3,
    salesOfficeName: 'ZIEGLER GERMANY',
    salesOfficeCode: 'DE-ZD',
    salesPicId: 5,
    salesPicName: 'HANS MUELLER',
    assignedCnOfficeCode: 'NINGBO',
    cargoTypeCode: 'FCL',
    volumeCbm: 66.0,
    quantity: 1,
    quantityUomCode: 'CTN',
    quantityTeu: 2.0,
    commodity: 'Furniture parts',
    polId: 3,
    polName: 'Ningbo',
    polCode: 'CNNBO',
    podId: 7,
    podName: 'Hamburg',
    podCode: 'DEHAM',
    podCountryCode: 'DE',
    podCountryName: 'GERMANY',
    coreFlag: 'CORE',
    categoryCode: 'OCEAN_FREIGHT_ORIGIN',
    cargoReadyDate: '2026-01-22',
    bookingConfirmed: 'Yes',
    remark: 'Regular customer - priority handling',
    containerLines: [
      { id: 2, enquiryId: 3, containerTypeId: 3, containerCode: '40HQ', containerQty: 1, teuPerUnit: 2.0, teuTotal: 2.0 },
    ],
    offers: [
      { id: 2, enquiryId: 3, offerType: 'OCEAN', sequenceNo: 1, isLatest: false, sentDate: '2026-01-18', price: 1800, priceText: 'USD 1,800', isRejectedPrice: false },
      { id: 3, enquiryId: 3, offerType: 'OCEAN', sequenceNo: 2, isLatest: true, sentDate: '2026-01-19', price: 1650, priceText: 'USD 1,650 negotiated', isRejectedPrice: false },
    ],
  },
];

let MOCK_ID_COUNTER = 4;
let MOCK_OFFER_ID_COUNTER = 4;

// ==========================================
// 主数据 API
// ==========================================

export const masterDataApi = {
  /** 获取销售国家列表 (用于级联选择第一层) */
  getSalesCountries: async (): Promise<SelectOption[]> => {
    if (USE_MOCK_DATA) {
      // 从 sales_pic 表获取不重复的国家代码
      const countryCodes = [...new Set(MOCK_SALES_PICS.map(p => p.countryCode))];
      return countryCodes.map(code => {
        const country = MOCK_COUNTRIES.find(c => c.countryCode === code);
        return {
          value: code,
          label: country?.countryNameEn || code,
        };
      });
    }
    return request<SelectOption[]>('/master/sales-countries');
  },

  /** 获取销售 PIC 列表 (按国家过滤，用于级联选择第二层) */
  getSalesPicsByCountry: async (countryCode: string): Promise<SalesPicSelectOption[]> => {
    if (USE_MOCK_DATA) {
      return MOCK_SALES_PICS
        .filter(p => p.countryCode === countryCode && p.isActive)
        .map(p => ({
          value: p.id,
          label: p.name,
          countryCode: p.countryCode,
          officeId: p.salesOfficeId,
          officeName: p.salesOfficeName || '',
          officeCode: p.salesOfficeCode || '',
        }));
    }
    return request<SalesPicSelectOption[]>(`/master/sales-pics?countryCode=${countryCode}`);
  },

  /** 获取销售办公室信息 */
  getSalesOfficeById: async (id: number): Promise<SalesOffice | null> => {
    if (USE_MOCK_DATA) {
      return MOCK_SALES_OFFICES.find(o => o.id === id) || null;
    }
    return request<SalesOffice>(`/master/sales-offices/${id}`);
  },

  /** 获取港口列表 (按类型过滤，支持搜索) */
  searchPorts: async (portType: PortType, keyword: string): Promise<PortSelectOption[]> => {
    if (USE_MOCK_DATA) {
      const filtered = MOCK_PORTS.filter(p => 
        p.portType === portType && 
        p.isActive &&
        (keyword.length < 2 || 
          p.portCode.toLowerCase().includes(keyword.toLowerCase()) ||
          p.portName.toLowerCase().includes(keyword.toLowerCase()) ||
          p.city?.toLowerCase().includes(keyword.toLowerCase()))
      );
      return filtered.slice(0, 50).map(p => ({
        value: p.id,
        label: `[${p.portCode}] ${p.portName}${p.countryCode ? `, ${p.countryCode}` : ''}`,
        portCode: p.portCode,
        portType: p.portType,
        countryCode: p.countryCode,
      }));
    }
    return request<PortSelectOption[]>(`/master/ports?type=${portType}&keyword=${encodeURIComponent(keyword)}`);
  },

  /** 获取港口详情 */
  getPortById: async (id: number): Promise<Port | null> => {
    if (USE_MOCK_DATA) {
      return MOCK_PORTS.find(p => p.id === id) || null;
    }
    return request<Port>(`/master/ports/${id}`);
  },

  /** 获取箱型列表 */
  getContainerTypes: async (): Promise<ContainerTypeSelectOption[]> => {
    if (USE_MOCK_DATA) {
      return MOCK_CONTAINER_TYPES
        .filter(c => c.isActive)
        .map(c => ({
          value: c.id,
          label: `${c.containerCode} - ${c.containerName}`,
          teuValue: c.teuValue,
          isSpecial: c.isSpecial,
        }));
    }
    return request<ContainerTypeSelectOption[]>('/master/container-types');
  },

  /** 获取 CN 办公室列表 */
  getCnOffices: async (): Promise<SelectOption[]> => {
    if (USE_MOCK_DATA) {
      return MOCK_CN_OFFICES
        .filter(o => o.isActive)
        .map(o => ({ value: o.code, label: o.name }));
    }
    return request<SelectOption[]>('/master/cn-offices');
  },

  /** 获取货物类型列表 */
  getCargoTypes: async (): Promise<CargoTypeDict[]> => {
    if (USE_MOCK_DATA) {
      return MOCK_CARGO_TYPES.filter(c => c.isActive);
    }
    return request<CargoTypeDict[]>('/master/cargo-types');
  },

  /** 获取产品类型列表 */
  getProducts: async (): Promise<ProductDict[]> => {
    if (USE_MOCK_DATA) {
      return MOCK_PRODUCTS.filter(p => p.isActive);
    }
    return request<ProductDict[]>('/master/products');
  },

  /** 获取单位列表 */
  getUoms: async (): Promise<SelectOption[]> => {
    if (USE_MOCK_DATA) {
      return MOCK_UOMS
        .filter(u => u.isActive)
        .map(u => ({ value: u.code, label: u.name }));
    }
    return request<SelectOption[]>('/master/uoms');
  },

  /** 获取分类列表 */
  getCategories: async (): Promise<SelectOption[]> => {
    if (USE_MOCK_DATA) {
      return MOCK_CATEGORIES
        .filter(c => c.isActive)
        .map(c => ({ value: c.code, label: c.name }));
    }
    return request<SelectOption[]>('/master/categories');
  },
};

// ==========================================
// 询价 API
// ==========================================

export const enquiryApi = {
  /** 获取询价列表 */
  getList: async (params?: EnquirySearchParams): Promise<PagedResponse<EnquiryListItem>> => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 300)); // 模拟延迟
      
      let filtered = [...MOCK_ENQUIRIES];
      
      // 应用筛选
      if (params?.keyword) {
        const kw = params.keyword.toLowerCase();
        filtered = filtered.filter(e => 
          e.referenceNumber.toLowerCase().includes(kw) ||
          e.commodity?.toLowerCase().includes(kw) ||
          e.salesPicName?.toLowerCase().includes(kw)
        );
      }
      // 兼容 search 参数
      if ((params as any)?.search) {
        const kw = ((params as any).search as string).toLowerCase();
        filtered = filtered.filter(e => 
          e.referenceNumber.toLowerCase().includes(kw) ||
          e.commodity?.toLowerCase().includes(kw) ||
          e.salesPicName?.toLowerCase().includes(kw)
        );
      }
      if (params?.status?.length) {
        filtered = filtered.filter(e => params.status!.includes(e.status));
      }
      // 兼容单个 status 参数
      if ((params as any)?.status && typeof (params as any).status === 'string') {
        filtered = filtered.filter(e => e.status === (params as any).status);
      }
      if (params?.cargoTypes?.length) {
        filtered = filtered.filter(e => params.cargoTypes!.includes(e.cargoTypeCode));
      }
      // 兼容单个 cargoType 参数
      if ((params as any)?.cargoType) {
        filtered = filtered.filter(e => e.cargoTypeCode === (params as any).cargoType);
      }
      if (params?.salesCountryCodes?.length) {
        filtered = filtered.filter(e => params.salesCountryCodes!.includes(e.salesCountryCode));
      }
      
      // 排序
      filtered.sort((a, b) => {
        const aDate = new Date(a.issueDate).getTime();
        const bDate = new Date(b.issueDate).getTime();
        return params?.sortDir === 'asc' ? aDate - bDate : bDate - aDate;
      });
      
      // 转换为列表项
      const items: EnquiryListItem[] = filtered.map(e => ({
        id: e.id!,
        referenceNumber: e.referenceNumber,
        enquiryReceivedDate: e.enquiryReceivedDate,
        issueDate: e.issueDate,
        status: e.status,
        productAbbr: e.productAbbr,
        salesCountryCode: e.salesCountryCode,
        salesOfficeName: e.salesOfficeName,
        salesPicName: e.salesPicName,
        cargoTypeCode: e.cargoTypeCode,
        polName: e.polName,
        podName: e.podName,
        podCountryName: e.podCountryName,
        quantityTeu: e.quantityTeu,
        bookingConfirmed: e.bookingConfirmed,
        latestOfferDate: e.offers?.find((o: Offer) => o.isLatest)?.sentDate,
        latestOfferPrice: e.offers?.find((o: Offer) => o.isLatest)?.priceText,
        offerCount: e.offers?.length || 0,
      }));
      
      const page = params?.page || (params as any)?.page || 0;
      const size = params?.size || (params as any)?.pageSize || 20;
      // 如果 page 是从1开始的，转换为从0开始
      const pageIndex = page > 0 && !(params as any)?.pageSize ? page : Math.max(0, page - 1);
      const start = pageIndex * size;
      const paged = items.slice(start, start + size);
      
      return {
        content: paged,
        totalElements: items.length,
        totalPages: Math.ceil(items.length / size),
        page: pageIndex,
        size,
        number: pageIndex, // 兼容 Spring Boot PagedResponse
      };
    }
    
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    return request<PagedResponse<EnquiryListItem>>(`/enquiries?${queryParams.toString()}`);
  },

  /** 获取询价详情 */
  getById: async (id: number): Promise<Enquiry> => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 200));
      const enquiry = MOCK_ENQUIRIES.find(e => e.id === id);
      if (!enquiry) throw new Error('Enquiry not found');
      return { ...enquiry };
    }
    return request<Enquiry>(`/enquiries/${id}`);
  },

  /** 创建询价 */
  create: async (data: EnquiryFormData): Promise<Enquiry> => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 500));
      
      // 获取关联数据
      const salesPic = MOCK_SALES_PICS.find(p => p.id === data.salesPicId);
      const salesOffice = salesPic ? MOCK_SALES_OFFICES.find(o => o.id === salesPic.salesOfficeId) : null;
      const pol = MOCK_PORTS.find(p => p.id === data.polId);
      const pod = MOCK_PORTS.find(p => p.id === data.podId);
      const podCountry = pod ? MOCK_COUNTRIES.find(c => c.countryCode === pod.countryCode) : null;
      const product = MOCK_PRODUCTS.find(p => p.code === data.productCode);
      
      // 生成编号
      const now = new Date();
      const refMonth = now.toISOString().slice(2, 4) + now.toISOString().slice(5, 7);
      const seq = MOCK_ENQUIRIES.filter(e => e.referenceMonth === refMonth).length + 1;
      const refNumber = `CN${refMonth}${String(seq).padStart(3, '0')}-${product?.abbr || 'X'}`;
      
      // 计算 TEU
      let quantityTeu = 0;
      if (data.containerLines?.length) {
        quantityTeu = data.containerLines.reduce((sum: number, line: ContainerLine) => 
          sum + ((line.quantity || 0) * (line.teuValue || 0)), 0);
      }
      
      const newEnquiry: Enquiry = {
        id: MOCK_ID_COUNTER++,
        referenceNumber: refNumber,
        enquiryReceivedDate: data.enquiryReceivedDate,
        issueDate: now.toISOString().split('T')[0],
        referenceMonth: refMonth,
        monthlySequence: seq,
        serialNumber: 0,
        productCode: data.productCode,
        productAbbr: product?.abbr || 'X',
        status: data.status || 'New',
        cnPricingAdmin: 'Susana Wong', // TODO: 从登录用户获取
        salesCountryCode: data.salesCountryCode,
        salesOfficeId: salesOffice?.id || 0,
        salesOfficeName: salesOffice?.name,
        salesOfficeCode: salesOffice?.code,
        salesPicId: data.salesPicId,
        salesPicName: salesPic?.name,
        assignedCnOfficeCode: data.assignedCnOfficeCode,
        cargoTypeCode: data.cargoTypeCode,
        volumeCbm: data.volumeCbm,
        quantity: data.quantity,
        quantityUomCode: data.quantityUomCode,
        quantityTeu,
        commodity: data.commodity,
        hazSpecialEquipment: data.hazSpecialEquipment,
        polId: data.polId,
        polName: pol?.portName,
        polCode: pol?.portCode,
        podId: data.podId,
        podName: pod?.portName,
        podCode: pod?.portCode,
        podCountryCode: pod?.countryCode,
        podCountryName: podCountry?.countryNameEn,
        coreFlag: data.coreFlag,
        categoryCode: data.categoryCode,
        cargoReadyDate: data.cargoReadyDate,
        cargoReadyDateRawText: data.cargoReadyDateRawText,
        additionalRequirement: data.additionalRequirement,
        bookingConfirmed: data.bookingConfirmed || 'Pending',
        remark: data.remark,
        containerLines: data.containerLines,
        offers: [],
      };
      
      MOCK_ENQUIRIES.unshift(newEnquiry);
      return newEnquiry;
    }
    
    return request<Enquiry>('/enquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** 更新询价 */
  update: async (id: number, data: Partial<EnquiryFormData>): Promise<Enquiry> => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 400));
      
      const index = MOCK_ENQUIRIES.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Enquiry not found');
      
      const existing = MOCK_ENQUIRIES[index];
      
      // 获取关联数据
      const salesPic = data.salesPicId ? MOCK_SALES_PICS.find(p => p.id === data.salesPicId) : null;
      const salesOffice = salesPic ? MOCK_SALES_OFFICES.find(o => o.id === salesPic.salesOfficeId) : null;
      const pol = data.polId ? MOCK_PORTS.find(p => p.id === data.polId) : null;
      const pod = data.podId ? MOCK_PORTS.find(p => p.id === data.podId) : null;
      const podCountry = pod ? MOCK_COUNTRIES.find(c => c.countryCode === pod.countryCode) : null;
      
      // 计算 TEU
      let quantityTeu = existing.quantityTeu;
      if (data.containerLines !== undefined) {
        quantityTeu = data.containerLines.reduce((sum: number, line: ContainerLine) => 
          sum + ((line.quantity || 0) * (line.teuValue || 0)), 0);
      }
      
      const updated: Enquiry = {
        ...existing,
        ...data,
        quantityTeu,
        salesOfficeId: salesOffice?.id || existing.salesOfficeId,
        salesOfficeName: salesOffice?.name || existing.salesOfficeName,
        salesOfficeCode: salesOffice?.code || existing.salesOfficeCode,
        salesPicName: salesPic?.name || existing.salesPicName,
        polName: pol?.portName || existing.polName,
        polCode: pol?.portCode || existing.polCode,
        podName: pod?.portName || existing.podName,
        podCode: pod?.portCode || existing.podCode,
        podCountryCode: pod?.countryCode || existing.podCountryCode,
        podCountryName: podCountry?.countryNameEn || existing.podCountryName,
        updatedAt: new Date().toISOString(),
      };
      
      MOCK_ENQUIRIES[index] = updated;
      return updated;
    }
    
    return request<Enquiry>(`/enquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /** 删除询价 */
  delete: async (id: number): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 300));
      MOCK_ENQUIRIES = MOCK_ENQUIRIES.filter(e => e.id !== id);
      return;
    }
    return request<void>(`/enquiries/${id}`, { method: 'DELETE' });
  },

  /** 复制询价为新询价 */
  copy: async (id: number): Promise<Enquiry> => {
    if (USE_MOCK_DATA) {
      const original = await enquiryApi.getById(id);
      const { 
        id: _id, 
        referenceNumber: _ref, 
        offers: _offers, 
        issueDate: _issue,
        createdAt: _ca,
        updatedAt: _ua,
        ...copyData 
      } = original;
      
      return enquiryApi.create({
        ...copyData,
        issueDate: new Date().toISOString().split('T')[0],
        polPortType: 'SEA',
        podPortType: 'SEA',
        status: 'New',
        bookingConfirmed: 'Pending',
      } as unknown as EnquiryFormData);
    }
    return request<Enquiry>(`/enquiries/${id}/copy`, { method: 'POST' });
  },

  /** 获取列表(别名) - 兼容组件调用 */
  list: async (params?: {
    page?: number;
    pageSize?: number;
    size?: number; 
    search?: string;
    keyword?: string;
    status?: EnquiryStatus | EnquiryStatus[];
    cargoType?: string;
    cargoTypes?: string[];
    salesCountryCode?: string;
    salesPicId?: number;
    polId?: number;
    podId?: number;
    coreFlag?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResponse<EnquiryListItem>> => {
    // 转换参数格式
    const convertedParams: EnquirySearchParams = {
      page: params?.page || 0,
      size: params?.pageSize || params?.size || 20,
      keyword: params?.search || params?.keyword,
      status: Array.isArray(params?.status) ? params.status[0] : params?.status,
      cargoTypes: params?.cargoType ? [params.cargoType] : params?.cargoTypes,
      salesCountryCode: params?.salesCountryCode,
      salesPicId: params?.salesPicId,
      dateFrom: params?.startDate,
      dateTo: params?.endDate,
      sortBy: params?.sortBy,
      sortDir: params?.sortOrder,
    };
    return enquiryApi.getList(convertedParams);
  },
};

// ==========================================
// 报价 API
// ==========================================

export const offerApi = {
  /** 获取询价的所有报价 */
  getByEnquiryId: async (enquiryId: number): Promise<Offer[]> => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 200));
      const enquiry = MOCK_ENQUIRIES.find(e => e.id === enquiryId);
      return enquiry?.offers || [];
    }
    return request<Offer[]>(`/enquiries/${enquiryId}/offers`);
  },

  /** 添加报价 */
  create: async (data: OfferFormData): Promise<Offer> => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 400));
      
      const enquiry = MOCK_ENQUIRIES.find(e => e.id === data.enquiryId);
      if (!enquiry) throw new Error('Enquiry not found');
      
      // 将之前的最新报价设为非最新
      if (enquiry.offers) {
        enquiry.offers.forEach((o: Offer) => {
          if (o.offerType === data.offerType) {
            o.isLatest = false;
          }
        });
      } else {
        enquiry.offers = [];
      }
      
      const sequenceNo = (enquiry.offers.filter((o: Offer) => o.offerType === data.offerType).length) + 1;
      
      const newOffer: Offer = {
        id: MOCK_OFFER_ID_COUNTER++,
        enquiryId: data.enquiryId,
        offerType: data.offerType,
        sequenceNo,
        isLatest: true,
        sentDate: data.sentDate || new Date().toISOString().split('T')[0],
        price: data.price,
        priceText: data.priceText,
        isRejectedPrice: false,
        createdAt: new Date().toISOString(),
      };
      
      enquiry.offers.push(newOffer);
      
      // 更新询价状态
      if (enquiry.status === 'New') {
        enquiry.status = 'Quoted';
      }
      
      return newOffer;
    }
    
    return request<Offer>(`/enquiries/${data.enquiryId}/offers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** 更新报价 */
  update: async (offerId: number, data: Partial<Offer>): Promise<Offer> => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 300));
      
      for (const enquiry of MOCK_ENQUIRIES) {
        const offerIndex = enquiry.offers?.findIndex((o: Offer) => o.id === offerId);
        if (offerIndex !== undefined && offerIndex >= 0 && enquiry.offers) {
          enquiry.offers[offerIndex] = {
            ...enquiry.offers[offerIndex],
            ...data,
            updatedAt: new Date().toISOString(),
          };
          return enquiry.offers[offerIndex];
        }
      }
      throw new Error('Offer not found');
    }
    
    return request<Offer>(`/offers/${offerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /** 删除报价 */
  delete: async (offerId: number): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 300));
      
      for (const enquiry of MOCK_ENQUIRIES) {
        if (enquiry.offers) {
          const index = enquiry.offers.findIndex((o: Offer) => o.id === offerId);
          if (index >= 0) {
            enquiry.offers.splice(index, 1);
            // 如果删除的是最新报价，将上一个设为最新
            if (enquiry.offers.length > 0) {
              const lastOffer = enquiry.offers[enquiry.offers.length - 1];
              lastOffer.isLatest = true;
            }
            return;
          }
        }
      }
      throw new Error('Offer not found');
    }
    
    return request<void>(`/offers/${offerId}`, { method: 'DELETE' });
  },
};

// ==========================================
// 统计 API
// ==========================================

export const statsApi = {
  /** 获取仪表盘统计数据 */
  getDashboardStats: async () => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 200));
      
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = today.slice(2, 4) + today.slice(5, 7);
      
      const todayNew = MOCK_ENQUIRIES.filter(e => e.issueDate === today).length;
      const newStatus = MOCK_ENQUIRIES.filter(e => e.status === 'New').length;
      const thisMonthTotal = MOCK_ENQUIRIES.filter(e => e.referenceMonth === thisMonth).length;
      const quoted = MOCK_ENQUIRIES.filter(e => e.status === 'Quoted').length;
      const confirmed = MOCK_ENQUIRIES.filter(e => e.bookingConfirmed === 'Yes').length;
      
      return {
        todayNew,
        pendingQuote: newStatus,
        thisMonthTotal,
        quoteRate: thisMonthTotal > 0 ? Math.round((quoted / thisMonthTotal) * 100) : 0,
        confirmRate: MOCK_ENQUIRIES.length > 0 ? Math.round((confirmed / MOCK_ENQUIRIES.length) * 100) : 0,
        statusDistribution: {
          New: newStatus,
          Quoted: quoted,
          Pending: MOCK_ENQUIRIES.filter(e => e.status === 'Pending').length,
        },
        cargoTypeDistribution: {
          AIR: MOCK_ENQUIRIES.filter(e => e.cargoTypeCode === 'AIR').length,
          FCL: MOCK_ENQUIRIES.filter(e => e.cargoTypeCode === 'FCL').length,
          LCL: MOCK_ENQUIRIES.filter(e => e.cargoTypeCode === 'LCL').length,
          RAIL: MOCK_ENQUIRIES.filter(e => e.cargoTypeCode === 'RAIL').length,
          SEA: MOCK_ENQUIRIES.filter(e => e.cargoTypeCode === 'SEA').length,
        },
      };
    }
    
    return request<any>('/stats/dashboard');
  },
};
