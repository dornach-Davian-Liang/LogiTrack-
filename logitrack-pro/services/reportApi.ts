// ============================================================
// LogiTrack Pro - Report API 服务
// 报表统计数据接口
// ============================================================

import {
  DashboardStats,
  DashboardStatsWithFilter,
  DashboardFilterParams,
  ComparisonResult,
  PeriodComparisonRequest,
  MonthlyReportData,
  CountryReportData,
  ExportOptions,
} from '../types';

const API_BASE_URL = '/api';

/**
 * Report API 服务
 */
export const reportApi = {
  /**
   * 获取仪表板统计数据
   */
  getDashboardStats: async (month?: string): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    
    const response = await fetch(
      `${API_BASE_URL}/statistics/dashboard?${params}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    return response.json();
  },

  /**
   * 获取月度报表数据
   */
  getMonthlyReport: async (year: string, month: string): Promise<MonthlyReportData> => {
    const response = await fetch(
      `${API_BASE_URL}/statistics/monthly?year=${year}&month=${month}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch monthly report');
    }
    return response.json();
  },

  /**
   * 获取国家分析报表
   */
  getCountryReport: async (
    countryCode?: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<CountryReportData> => {
    const url = new URL(`${API_BASE_URL}/statistics/by-country`, window.location.origin);
    if (countryCode) url.searchParams.append('countryCode', countryCode);
    if (params?.startDate) url.searchParams.append('startDate', params.startDate);
    if (params?.endDate) url.searchParams.append('endDate', params.endDate);
    
    const response = await fetch(url.toString(), { method: 'GET' });
    if (!response.ok) {
      throw new Error('Failed to fetch country report');
    }
    return response.json();
  },

  /**
   * 导出报表
   */
  exportReport: async (options: ExportOptions): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/statistics/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export report');
    }
    return response.blob();
  },

  /**
   * 下载导出文件
   */
  downloadExport: async (options: ExportOptions): Promise<void> => {
    const blob = await reportApi.exportReport(options);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${options.reportType}-${new Date().toISOString().split('T')[0]}.${options.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * 获取过滤后的仪表板统计数据
   */
  getFilteredDashboardStats: async (
    filter: DashboardFilterParams
  ): Promise<DashboardStatsWithFilter> => {
    const params = new URLSearchParams();
    params.append('startDate', filter.startDate);
    params.append('endDate', filter.endDate);
    
    if (filter.coreFlags && filter.coreFlags.length > 0) {
      filter.coreFlags.forEach(flag => params.append('coreFlags', flag));
    }
    
    if (filter.cnOffice) {
      params.append('cnOffice', filter.cnOffice);
    }

    if (filter.products && filter.products.length > 0) {
      filter.products.forEach(p => params.append('products', p));
    }

    if (filter.countries && filter.countries.length > 0) {
      filter.countries.forEach(c => params.append('countries', c));
    }
    
    const response = await fetch(
      `${API_BASE_URL}/statistics/dashboard/filtered?${params}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch filtered dashboard stats');
    }
    const data = await response.json();
    
    // 数据适配：如果后端返回的是旧格式，转换为新格式
    if (data.cnOfficeStats && Array.isArray(data.cnOfficeStats)) {
      data.cnOfficeStats = data.cnOfficeStats.map((office: any) => {
        // 如果已经包含新格式字段，直接返回
        if ('yes' in office || 'rejected' in office) {
          return office;
        }
        
        // 否则，从旧格式转换
        return {
          officeName: office.officeName,
          totalEnquiries: office.totalEnquiries,
          yes: office.confirmed ?? 0,        // 将confirmed映射到yes
          rejected: office.rejected ?? 0,
          invalid: office.invalid ?? 0,
          pending: office.pending ?? (office.totalEnquiries - (office.quoted ?? 0)),
          conversionRate: office.conversionRate ?? 0,
        };
      });
    }
    
    return data;
  },

  /**
   * 获取特定 CN Office + 预订状态的询价列表（增强报表弹窗专用）
   * 后端精确过滤，解决 pageSize 截断 / Invalid=0 问题
   */
  getOfficeEnquiries: async (params: {
    officeName: string;
    bookingStatus: string;
    startDate: string;
    endDate: string;
    coreFlags?: string[];
    products?: string[];
    countries?: string[];
  }): Promise<Record<string, unknown>[]> => {
    const urlParams = new URLSearchParams();
    urlParams.append('officeName', params.officeName);
    urlParams.append('bookingStatus', params.bookingStatus);
    urlParams.append('startDate', params.startDate);
    urlParams.append('endDate', params.endDate);

    if (params.coreFlags && params.coreFlags.length > 0) {
      params.coreFlags.forEach(f => urlParams.append('coreFlags', f));
    }
    if (params.products && params.products.length > 0) {
      params.products.forEach(p => urlParams.append('products', p));
    }
    if (params.countries && params.countries.length > 0) {
      params.countries.forEach(c => urlParams.append('countries', c));
    }

    const response = await fetch(
      `${API_BASE_URL}/statistics/office-enquiries?${urlParams}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch office enquiries');
    }
    return response.json();
  },

  /**
   * 时期对比分析
   */
  comparePeriods: async (
    request: PeriodComparisonRequest
  ): Promise<ComparisonResult> => {
    const response = await fetch(
      `${API_BASE_URL}/statistics/comparison`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to compare periods');
    }
    return response.json();
  },
};
