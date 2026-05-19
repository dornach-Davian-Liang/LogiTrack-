// ============================================================
// LogiTrack Pro - API 服务层 (v3)
// Aligned with schema_v3 backend controllers
// ============================================================

import {
  Enquiry,
  EnquiryListItem,
  EnquiryFormData,
  EnquirySearchParams,
  EnquiryStatus,
  ReferencePreview,
  Offer,
  OfferPriceLine,
  OfferCreatePayload,
  Country,
  Port,
  SalesCountry,
  SalesOffice,
  SalesPic,
  ContainerType,
  Carrier,
  Currency,
  CnOffice,
  CargoTypeDict,
  ProductDict,
  UomDict,
  CategoryDict,
  CancelledReasonDict,
  LostReasonDict,
  StatusChangePayload,
  PagedResponse,
  PortType,
  SelectOption,
  PortSelectOption,
  SalesPicSelectOption,
  ContainerTypeSelectOption,
  LoginRequest,
  LoginResponse,
  ProductCode,
  CoreNonCore,
  DashboardStats,
  DashboardFilterParams,
  PeriodComparisonRequest,
  ComparisonResult,
  MonthlyReportData,
  CountryReportData,
  ExportOptions,
} from '../types';

// ==========================================
// 配置
// ==========================================

const API_BASE_URL = '/api';

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

  const token = localStorage.getItem('token');
  if (token) {
    (defaultHeaders as any)['Authorization'] = `Bearer ${token}`;
  }

  // 用户信息请求头 → 审计日志
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.username) {
        (defaultHeaders as any)['X-Username'] = user.username;
      }
      if (user.roles && user.roles.length > 0) {
        (defaultHeaders as any)['X-User-Role'] = user.roles[0];
      }
    } catch (e) {
      console.warn('[API] Failed to parse user info:', e);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorText = '';
    try {
      errorText = await response.text();
      console.error(`[API] Error ${response.status}:`, errorText);
    } catch (e) {
      console.error('[API] Failed to read error response:', e);
    }
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  // 204 No Content 或 空 body
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  if (
    response.status === 204 ||
    contentLength === '0' ||
    !contentType ||
    !contentType.includes('json')
  ) {
    return undefined as unknown as T;
  }

  return response.json();
}

// ==========================================
// 认证 API
// ==========================================

export const authApi = {
  login: async (payload: LoginRequest) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  checkPermission: async (userId: number, permission: string) =>
    request<{ allowed: boolean }>(
      `/auth/check-permission?userId=${userId}&permission=${encodeURIComponent(permission)}`
    ),
};

// ==========================================
// 主数据 / 字典 API
// ==========================================

export const masterDataApi = {
  // ---- Dict lookups (GET /dict/...) ----

  /** 国家列表 (POD Country 等) */
  getAllCountries: async (): Promise<SelectOption[]> =>
    request<SelectOption[]>('/dict/countries'),

  /** 销售国家列表 (级联选择第一层) */
  getSalesCountries: async (): Promise<SelectOption[]> =>
    request<SelectOption[]>('/dict/sales-countries'),

  /** 按国家获取 Sales PIC 列表 (级联选择第二层) */
  getSalesPicsByCountry: async (countryCode: string): Promise<SalesPicSelectOption[]> =>
    request<SalesPicSelectOption[]>(`/dict/sales-pics?countryCode=${encodeURIComponent(countryCode)}`),

  /** 根据 picId 获取所属 Sales Office */
  getSalesOfficeByPicId: async (picId: number): Promise<SalesOffice | null> =>
    request<SalesOffice>(`/dict/sales-offices?picId=${picId}`),

  /** 按 Sales Office ID 获取信息 (兼容旧调用) */
  getSalesOfficeById: async (id: number): Promise<SalesOffice | null> =>
    request<SalesOffice>(`/master/sales-offices`).then((list: any) => {
      if (Array.isArray(list)) return list.find((o: SalesOffice) => o.id === id) || null;
      return list;
    }),

  /** 搜索港口 (按 mode + keyword) */
  searchPorts: async (portType: PortType, keyword: string): Promise<PortSelectOption[]> =>
    request<PortSelectOption[]>(
      `/dict/ports?mode=${encodeURIComponent(portType)}&query=${encodeURIComponent(keyword)}`
    ),

  /** 港口详情 */
  getPortById: async (id: number): Promise<Port | null> =>
    request<Port>(`/dict/ports/${id}`),

  /** 箱型列表 */
  getContainerTypes: async (): Promise<ContainerTypeSelectOption[]> =>
    request<ContainerTypeSelectOption[]>('/dict/container-types'),

  /** CN 办公室列表 */
  getCnOffices: async (): Promise<SelectOption[]> =>
    request<SelectOption[]>('/dict/cn-offices').catch(() => {
      // 如果 /dict/cn-offices 不存在，回退到硬编码
      const offices: CnOffice[] = [
        { code: 'SHANGHAI', name: 'Shanghai', isActive: true },
        { code: 'SHENZHEN', name: 'Shenzhen', isActive: true },
        { code: 'NINGBO', name: 'Ningbo', isActive: true },
        { code: 'HONG KONG', name: 'Hong Kong', isActive: true },
        { code: 'TIANJIN', name: 'Tianjin', isActive: true },
        { code: 'QINGDAO', name: 'Qingdao', isActive: true },
        { code: 'XIAMEN', name: 'Xiamen', isActive: true },
        { code: 'CN-MULTI', name: 'CN-Multi', isActive: true },
      ];
      return offices.filter(o => o.isActive).map(o => ({ value: o.code, label: o.name }));
    }),

  /** 货物类型列表 (可按 productCode 过滤) */
  getCargoTypes: async (productCode?: string): Promise<CargoTypeDict[]> =>
    request<CargoTypeDict[]>(
      `/dict/cargo-types${productCode ? '?productCode=' + encodeURIComponent(productCode) : ''}`
    ),

  /** 产品类型列表 */
  getProducts: async (): Promise<ProductDict[]> =>
    request<ProductDict[]>('/dict/products'),

  /** 单位列表 */
  getUoms: async (): Promise<SelectOption[]> =>
    request<SelectOption[]>('/dict/uoms').catch(() => {
      const uoms: UomDict[] = [
        { code: 'KG', name: 'Kilogram', isActive: true },
        { code: 'PCS', name: 'Pieces', isActive: true },
        { code: 'CTN', name: 'Cartons', isActive: true },
        { code: 'PLT', name: 'Pallets', isActive: true },
        { code: 'SET', name: 'Sets', isActive: true },
      ];
      return uoms.map(u => ({ value: u.code, label: u.name }));
    }),

  /** 分类列表 */
  getCategories: async (): Promise<SelectOption[]> =>
    request<SelectOption[]>('/dict/categories').catch(() => {
      const cats: CategoryDict[] = [
        { code: 'ORIGIN_CHARGES', name: 'Origin Charges', isActive: true },
        { code: 'EXW_LOCATION', name: 'EXW Location', isActive: true },
        { code: 'OCEAN_FREIGHT', name: 'Ocean Freight', isActive: true },
        { code: 'AIR_FREIGHT', name: 'Air Freight', isActive: true },
        { code: 'DEST_CHARGES', name: 'Dest. Charges', isActive: true },
        { code: 'SPECIAL', name: 'Special', isActive: true },
      ];
      return cats.map(c => ({ value: c.code, label: c.name }));
    }),

  /** 取消原因字典 */
  getCancelledReasons: async (): Promise<CancelledReasonDict[]> =>
    request<CancelledReasonDict[]>('/dict/cancelled-reasons'),

  /** 流失原因字典 */
  getLostReasons: async (): Promise<LostReasonDict[]> =>
    request<LostReasonDict[]>('/dict/lost-reasons'),

  // ---- Management CRUD (GET/POST/PUT/DELETE /master/...) ----

  getCountries: async (): Promise<Country[]> =>
    request<Country[]>('/master/countries'),

  saveCountry: async (country: Country): Promise<Country> => {
    const method = country.id ? 'PUT' : 'POST';
    const url = country.id ? `/master/countries/${country.id}` : '/master/countries';
    return request<Country>(url, { method, body: JSON.stringify(country) });
  },

  deleteCountry: async (id: number): Promise<void> =>
    request<void>(`/master/countries/${id}`, { method: 'DELETE' }),

  getPorts: async (): Promise<Port[]> =>
    request<Port[]>('/master/ports'),

  savePort: async (port: Port): Promise<Port> => {
    const method = port.id ? 'PUT' : 'POST';
    const url = port.id ? `/master/ports/${port.id}` : '/master/ports';
    return request<Port>(url, { method, body: JSON.stringify(port) });
  },

  deletePort: async (id: number): Promise<void> =>
    request<void>(`/master/ports/${id}`, { method: 'DELETE' }),

  getSalesPics: async (): Promise<SalesPic[]> =>
    request<SalesPic[]>('/master/sales-pics'),

  saveSalesPic: async (pic: SalesPic): Promise<SalesPic> => {
    const method = pic.id ? 'PUT' : 'POST';
    const url = pic.id ? `/master/sales-pics/${pic.id}` : '/master/sales-pics';
    return request<SalesPic>(url, { method, body: JSON.stringify(pic) });
  },

  deleteSalesPic: async (id: number): Promise<void> =>
    request<void>(`/master/sales-pics/${id}`, { method: 'DELETE' }),

  getSalesOffices: async (salesCountryCode?: string): Promise<SalesOffice[]> => {
    const params = salesCountryCode ? `?salesCountryCode=${salesCountryCode}` : '';
    return request<SalesOffice[]>(`/master/sales-offices${params}`);
  },

  saveSalesOffice: async (office: Partial<SalesOffice>): Promise<SalesOffice> => {
    const method = office.id ? 'PUT' : 'POST';
    const url = office.id ? `/master/sales-offices/${office.id}` : '/master/sales-offices';
    return request<SalesOffice>(url, { method, body: JSON.stringify(office) });
  },

  deleteSalesOffice: async (id: number): Promise<void> =>
    request<void>(`/master/sales-offices/${id}`, { method: 'DELETE' }),

  // Sales Country CRUD
  getSalesCountryList: async (): Promise<SalesCountry[]> =>
    request<SalesCountry[]>('/master/sales-countries'),

  saveSalesCountry: async (country: Partial<SalesCountry>): Promise<SalesCountry> => {
    const isNew = !country.code || country.code === (country as any)._originalCode;
    // For updates, use PUT with the code; for new, use POST
    if ((country as any)._isNew) {
      return request<SalesCountry>('/master/sales-countries', { method: 'POST', body: JSON.stringify(country) });
    }
    return request<SalesCountry>(`/master/sales-countries/${country.code}`, { method: 'PUT', body: JSON.stringify(country) });
  },

  createSalesCountry: async (country: Partial<SalesCountry>): Promise<SalesCountry> =>
    request<SalesCountry>('/master/sales-countries', { method: 'POST', body: JSON.stringify(country) }),

  updateSalesCountry: async (code: string, country: Partial<SalesCountry>): Promise<SalesCountry> =>
    request<SalesCountry>(`/master/sales-countries/${code}`, { method: 'PUT', body: JSON.stringify(country) }),

  deleteSalesCountry: async (code: string): Promise<void> =>
    request<void>(`/master/sales-countries/${code}`, { method: 'DELETE' }),

  getContainerTypeList: async (): Promise<ContainerType[]> =>
    request<ContainerType[]>('/master/container-types'),

  saveContainerType: async (ct: ContainerType): Promise<ContainerType> => {
    const method = ct.id ? 'PUT' : 'POST';
    const url = ct.id ? `/master/container-types/${ct.id}` : '/master/container-types';
    return request<ContainerType>(url, { method, body: JSON.stringify(ct) });
  },

  deleteContainerType: async (id: number): Promise<void> =>
    request<void>(`/master/container-types/${id}`, { method: 'DELETE' }),

  // ===== Carrier 承运商管理 =====
  getCarrierList: async (): Promise<Carrier[]> =>
    request<Carrier[]>('/master/carriers'),

  getActiveCarriers: async (): Promise<Carrier[]> =>
    request<Carrier[]>('/master/carriers/active'),

  saveCarrier: async (carrier: Carrier): Promise<Carrier> => {
    const method = carrier.id ? 'PUT' : 'POST';
    const url = carrier.id ? `/master/carriers/${carrier.id}` : '/master/carriers';
    return request<Carrier>(url, { method, body: JSON.stringify(carrier) });
  },

  deleteCarrier: async (id: number): Promise<void> =>
    request<void>(`/master/carriers/${id}`, { method: 'DELETE' }),

  // ===== Currency 货币管理 =====
  getCurrencyList: async (): Promise<Currency[]> =>
    request<Currency[]>('/master/currencies'),

  getActiveCurrencies: async (): Promise<Currency[]> =>
    request<Currency[]>('/master/currencies/active'),

  saveCurrency: async (currency: Currency): Promise<Currency> => {
    const method = currency.id ? 'PUT' : 'POST';
    const url = currency.id ? `/master/currencies/${currency.id}` : '/master/currencies';
    return request<Currency>(url, { method, body: JSON.stringify(currency) });
  },

  deleteCurrency: async (id: number): Promise<void> =>
    request<void>(`/master/currencies/${id}`, { method: 'DELETE' }),

  /** CN Pricing Admin 列表 (仅 active) */
  getCnPricingAdmins: async (): Promise<SelectOption[]> => {
    const admins = await request<any[]>('/master/cn-pricing-admins/active');
    return admins.map((a: any) => ({ value: a.name, label: a.name }));
  },
};

// ==========================================
// 询价 API
// ==========================================

export const enquiryApi = {
  /** 获取询价分页列表 */
  getList: async (params?: EnquirySearchParams): Promise<PagedResponse<EnquiryListItem>> => {
    const sp = new URLSearchParams();
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    if (params?.keyword) sp.set('keyword', params.keyword);
    if (params?.status) sp.set('status', params.status);
    if (params?.productCode) sp.set('productCode', params.productCode);
    if (params?.cargoTypeCode) sp.set('cargoTypeCode', params.cargoTypeCode);
    if (params?.salesCountryCode) sp.set('salesCountryCode', params.salesCountryCode);
    if (params?.assignedCnOffice) sp.set('assignedCnOffice', params.assignedCnOffice);
    if (params?.coreNonCore) sp.set('coreNonCore', params.coreNonCore);
    if (params?.polPortId) sp.set('polPortId', String(params.polPortId));
    if (params?.podPortId) sp.set('podPortId', String(params.podPortId));
    if (params?.dateFrom) sp.set('dateFrom', params.dateFrom);
    if (params?.dateTo) sp.set('dateTo', params.dateTo);
    if (params?.createdDateFrom) sp.set('createdDateFrom', params.createdDateFrom);
    if (params?.createdDateTo) sp.set('createdDateTo', params.createdDateTo);
    if (params?.createdBy) sp.set('createdBy', params.createdBy);
    if (params?.sortBy) sp.set('sortBy', params.sortBy);
    if (params?.sortDir) sp.set('sortDir', params.sortDir);
    const qs = sp.toString();
    return request<PagedResponse<EnquiryListItem>>(`/enquiries${qs ? '?' + qs : ''}`);
  },

  /** 获取询价详情 */
  getById: async (id: number): Promise<Enquiry> =>
    request<Enquiry>(`/enquiries/${id}`),

  /** 获取下一个参考编号预览 */
  getNextReference: async (issueDate: string, productCode: ProductCode): Promise<ReferencePreview> =>
    request<ReferencePreview>(
      `/enquiries/reference/next?issueDate=${encodeURIComponent(issueDate)}&productCode=${encodeURIComponent(productCode)}`
    ),

  /** 基于现有询价获取递增参考编号 */
  getIncreaseReference: async (enquiryId: number): Promise<ReferencePreview> =>
    request<ReferencePreview>(`/enquiries/${enquiryId}/reference/increase`),

  /** 创建询价 */
  create: async (data: EnquiryFormData): Promise<Enquiry> =>
    request<Enquiry>('/enquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 更新询价 */
  update: async (id: number, data: Partial<EnquiryFormData>): Promise<Enquiry> =>
    request<Enquiry>(`/enquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** 变更询价状态 (v3: New → Quoted & Pending → Secured / Lost / Cancelled) */
  changeStatus: async (id: number, payload: StatusChangePayload): Promise<Enquiry> =>
    request<Enquiry>(`/enquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  /** 删除询价 */
  delete: async (id: number): Promise<void> =>
    request<void>(`/enquiries/${id}`, { method: 'DELETE' }),

  /** 复制询价为新询价 (客户端实现) */
  copy: async (id: number): Promise<Enquiry> => {
    const original = await enquiryApi.getById(id);
    const {
      id: _id,
      refNumber: _ref,
      offers: _offers,
      createdAt: _ca,
      updatedAt: _ua,
      ...copyFields
    } = original;

    const today = new Date().toISOString().split('T')[0];
    return enquiryApi.create({
      ...copyFields,
      enquiryReceivedDate: today,
      enquiryCreatedDate: today,
      status: 'New',
    } as EnquiryFormData);
  },

  /** 获取列表 (兼容旧组件参数) */
  list: async (params?: {
    page?: number;
    pageSize?: number;
    size?: number;
    search?: string;
    keyword?: string;
    status?: EnquiryStatus | EnquiryStatus[];
    cargoType?: string;
    cargoTypeCode?: string;
    salesCountryCode?: string;
    salesPicId?: number;
    coreNonCore?: CoreNonCore;
    assignedCnOffice?: string;
    polPortId?: number;
    podPortId?: number;
    startDate?: string;
    endDate?: string;
    createdDateFrom?: string;
    createdDateTo?: string;
    createdBy?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResponse<EnquiryListItem>> => {
    const converted: EnquirySearchParams = {
      page: params?.page || 0,
      size: params?.pageSize || params?.size || 20,
      keyword: params?.search || params?.keyword || undefined,
      status: Array.isArray(params?.status) ? params.status[0] : (params?.status || undefined),
      cargoTypeCode: params?.cargoType || params?.cargoTypeCode || undefined,
      salesCountryCode: params?.salesCountryCode || undefined,
      coreNonCore: params?.coreNonCore || undefined,
      assignedCnOffice: params?.assignedCnOffice || undefined,
      polPortId: params?.polPortId || undefined,
      podPortId: params?.podPortId || undefined,
      dateFrom: params?.startDate || undefined,
      dateTo: params?.endDate || undefined,
      createdDateFrom: params?.createdDateFrom || undefined,
      createdDateTo: params?.createdDateTo || undefined,
      createdBy: params?.createdBy || undefined,
      sortBy: params?.sortBy || undefined,
      sortDir: params?.sortOrder,
    };
    return enquiryApi.getList(converted);
  },

  /** 获取所有询价 (无分页) */
  getAll: async (): Promise<Enquiry[]> =>
    request<Enquiry[]>('/enquiries/all'),
};

// ==========================================
// 报价 API (v3: priceLines + containerDetails)
// ==========================================

export const offerApi = {
  /** 获取询价的所有报价 */
  getByEnquiryId: async (enquiryId: number): Promise<Offer[]> =>
    request<Offer[]>(`/enquiries/${enquiryId}/offers`),

  /** 获取单个报价详情 */
  getById: async (offerId: number): Promise<Offer> =>
    request<Offer>(`/offers/${offerId}`),

  /** 创建报价 (DTO, 含 priceLines + containerDetails) */
  create: async (enquiryId: number, data: OfferCreatePayload): Promise<Offer> =>
    request<Offer>(`/enquiries/${enquiryId}/offers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 更新报价 (DTO, 全量替换 priceLines) */
  update: async (offerId: number, data: OfferCreatePayload): Promise<Offer> =>
    request<Offer>(`/offers/${offerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** 删除报价 */
  delete: async (offerId: number): Promise<void> =>
    request<void>(`/offers/${offerId}`, { method: 'DELETE' }),

  /** 自动生成价格行模板 (POL×POD 笛卡尔积) */
  generatePriceLines: async (enquiryId: number): Promise<OfferPriceLine[]> =>
    request<OfferPriceLine[]>(`/enquiries/${enquiryId}/generate-price-lines`, {
      method: 'POST',
    }),
};

// ==========================================
// 统计 API
// ==========================================

export const statsApi = {
  /** 仪表盘统计 (按月) */
  getDashboardStats: async (month?: string): Promise<DashboardStats> =>
    request<DashboardStats>(`/statistics/dashboard${month ? '?month=' + encodeURIComponent(month) : ''}`),

  /** 仪表盘统计 (带筛选) */
  getFilteredDashboard: async (params: DashboardFilterParams): Promise<DashboardStats> => {
    const sp = new URLSearchParams();
    if (params.startDate) sp.set('startDate', params.startDate);
    if (params.endDate) sp.set('endDate', params.endDate);
    if (params.coreFlags?.length) sp.set('coreFlags', params.coreFlags.join(','));
    if (params.cnOffice) sp.set('cnOffice', params.cnOffice);
    if (params.products?.length) sp.set('products', params.products.join(','));
    if (params.countries?.length) sp.set('countries', params.countries.join(','));
    return request<DashboardStats>(`/statistics/dashboard/filtered?${sp.toString()}`);
  },

  /** 办公室询价明细 */
  getOfficeEnquiries: async (params: {
    officeName: string;
    bookingStatus?: string;
    startDate?: string;
    endDate?: string;
    coreFlags?: string[];
    products?: string[];
    countries?: string[];
  }): Promise<any[]> => {
    const sp = new URLSearchParams();
    sp.set('officeName', params.officeName);
    if (params.bookingStatus) sp.set('bookingStatus', params.bookingStatus);
    if (params.startDate) sp.set('startDate', params.startDate);
    if (params.endDate) sp.set('endDate', params.endDate);
    if (params.coreFlags?.length) sp.set('coreFlags', params.coreFlags.join(','));
    if (params.products?.length) sp.set('products', params.products.join(','));
    if (params.countries?.length) sp.set('countries', params.countries.join(','));
    return request<any[]>(`/statistics/office-enquiries?${sp.toString()}`);
  },

  /** 月度报表 */
  getMonthlyReport: async (year: number, month: number): Promise<MonthlyReportData> =>
    request<MonthlyReportData>(`/statistics/monthly?year=${year}&month=${month}`),

  /** 国家报表 */
  getCountryReport: async (countryCode: string): Promise<CountryReportData> =>
    request<CountryReportData>(`/statistics/country?countryCode=${encodeURIComponent(countryCode)}`),

  /** 多期对比 */
  getComparison: async (payload: PeriodComparisonRequest): Promise<ComparisonResult> =>
    request<ComparisonResult>('/statistics/comparison', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** 导出报表 */
  exportReport: async (options: ExportOptions): Promise<Blob> => {
    const url = `${API_BASE_URL}/statistics/export`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },
};

// ==========================================
// 用户管理 API
// ==========================================

export const userApi = {
  getAll: async (includeInactive = false) =>
    request<any[]>(`/users?includeInactive=${includeInactive}`),

  getById: async (id: number) =>
    request<any>(`/users/${id}`),

  create: async (data: any) =>
    request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),

  update: async (id: number, data: any) =>
    request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: async (id: number) =>
    request<void>(`/users/${id}`, { method: 'DELETE' }),

  getRoles: async () =>
    request<any[]>('/users/roles'),

  resetPassword: async (id: number) =>
    request<any>(`/users/${id}/reset-password`, { method: 'POST' }),
};

// ==========================================
// 审计日志 API
// ==========================================

export const auditLogApi = {
  getList: async (params?: {
    userId?: number;
    action?: string;
    resourceType?: string;
    startTime?: string;
    endTime?: string;
    page?: number;
    size?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.userId) sp.set('userId', String(params.userId));
    if (params?.action) sp.set('action', params.action);
    if (params?.resourceType) sp.set('resourceType', params.resourceType);
    if (params?.startTime) sp.set('startTime', params.startTime);
    if (params?.endTime) sp.set('endTime', params.endTime);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    return request<any>(`/audit-logs?${sp.toString()}`);
  },

  getResourceHistory: async (resourceType: string, resourceId: number) =>
    request<any[]>(`/audit-logs/resource-history?resourceType=${resourceType}&resourceId=${resourceId}`),

  getByUser: async (userId: number, page = 0, size = 20) =>
    request<any>(`/audit-logs/user/${userId}?page=${page}&size=${size}`),

  export: async (params?: {
    userId?: number;
    action?: string;
    resourceType?: string;
    startTime?: string;
    endTime?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params?.userId) sp.set('userId', String(params.userId));
    if (params?.action) sp.set('action', params.action);
    if (params?.resourceType) sp.set('resourceType', params.resourceType);
    if (params?.startTime) sp.set('startTime', params.startTime);
    if (params?.endTime) sp.set('endTime', params.endTime);
    return request<any>(`/audit-logs/export?${sp.toString()}`);
  },
};

