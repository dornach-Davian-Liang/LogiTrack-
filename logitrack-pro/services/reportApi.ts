// ============================================================
// LogiTrack Pro - Report API 服务
// 报表统计数据接口
// ============================================================

import {
  DashboardStats,
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
};
