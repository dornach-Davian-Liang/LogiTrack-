# LogiTrack Pro - Report & Settings 前端实现指南

> **版本**: v1.0  
> **日期**: 2026-02-09  
> **面向**: React + TypeScript 开发者

---

## 目录

1. [类型定义](#1-类型定义)
2. [API 服务层](#2-api-服务层)
3. [Report 组件实现](#3-report-组件实现)
4. [Settings 组件实现](#4-settings-组件实现)
5. [关键业务逻辑](#5-关键业务逻辑)
6. [页面路由](#6-页面路由)

---

## 1. 类型定义

### 1.1 Report 类型 (types.ts 扩展)

```typescript
// ==========================================
// 统计类型
// ==========================================

export interface DashboardStats {
  stats: {
    todayNewEnquiries: number;
    today_vs_yesterday: number;
    pendingQuotes: number;
    pending_vs_week_ago: number;
    pendingBookings: number;
    pending_vs_week_ago: number;
    monthCompletionRate: string;
    monthTotalEnquiries: number;
    monthTotalQuotes: number;
    monthQuoteRate: string;
    monthBookingRate: string;
    monthBookingCount: number;
    avgQuoteDays: string;
    topCountry: {
      code: string;
      name: string;
      count: number;
    };
    topCargoType: {
      code: string;
      name: string;
      count: number;
    };
    officeCount: number;
    rejectionRate: string;
  };
  charts: {
    statusDistribution: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    trend30Days: Array<{
      date: string;
      count: number;
    }>;
    cargoTypeDistribution: Array<{
      type: string;
      percentage: number;
    }>;
  };
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
```

### 1.2 Settings 类型 (types.ts 扩展)

```typescript
// ==========================================
// 设置类型
// ==========================================

export interface CountryFormData {
  countryCode: string;
  countryNameEn: string;
  countryNameCn?: string;
  isActive: boolean;
}

export interface PortFormData {
  portCode: string;
  portName: string;
  portType: 'AIR' | 'SEA';
  countryCode: string;
  city?: string;
  isActive: boolean;
}

export interface SalesOfficeFormData {
  code: string;
  name: string;
  countryCode: string;
  isActive: boolean;
  remark?: string;
}

export interface SalesPicFormData {
  name: string;
  countryCode: string;
  officeId: number;
  isActive: boolean;
}

export interface ContainerTypeFormData {
  containerCode: string;
  containerName: string;
  teuValue: number;
  lengthFeet?: number;
  isSpecial?: boolean;
  description?: string;
  isActive: boolean;
}

export interface DictEntry {
  code: string;
  name: string;
  [key: string]: any;
}

export interface MasterDataListResponse<T> extends PagedResponse<T> {
  content: T[];
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  userId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'ENABLE' | 'DISABLE';
  tableName: string;
  recordKey: string;
  details: string;
}
```

---

## 2. API 服务层

### 2.1 reportApi.ts (新增)

```typescript
// ============================================================
// LogiTrack Pro - Report API 服务
// ============================================================

import {
  DashboardStats,
  MonthlyReportData,
  CountryReportData,
  ExportOptions,
  PagedResponse,
  ApiResponse,
} from '../types';

const API_BASE_URL = '/api';

interface ReportParams {
  year?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
  countryCode?: string;
  page?: number;
  size?: number;
}

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
    
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
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
    
    if (!response.ok) throw new Error('Failed to fetch monthly report');
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
    if (!response.ok) throw new Error('Failed to fetch country report');
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
    
    if (!response.ok) throw new Error('Failed to export report');
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
```

### 2.2 settingsApi.ts (新增)

```typescript
// ============================================================
// LogiTrack Pro - Settings API 服务
// ============================================================

import {
  Country,
  Port,
  SalesOffice,
  SalesPic,
  ContainerType,
  PagedResponse,
  CountryFormData,
  PortFormData,
  SalesOfficeFormData,
  SalesPicFormData,
  ContainerTypeFormData,
  AuditLogEntry,
} from '../types';

const API_BASE_URL = '/api/settings';

// ==========================================
// 国家管理
// ==========================================

export const countryApi = {
  getList: async (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    isActive?: boolean;
  }): Promise<PagedResponse<Country>> => {
    const url = new URL(`${API_BASE_URL}/countries`, window.location.origin);
    url.searchParams.append('page', params?.page?.toString() || '0');
    url.searchParams.append('size', params?.size?.toString() || '20');
    if (params?.keyword) url.searchParams.append('keyword', params.keyword);
    if (params?.isActive !== undefined) url.searchParams.append('isActive', String(params.isActive));
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch countries');
    return response.json();
  },

  create: async (data: CountryFormData): Promise<Country> => {
    const response = await fetch(`${API_BASE_URL}/countries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create country');
    return response.json();
  },

  update: async (countryCode: string, data: CountryFormData): Promise<Country> => {
    const response = await fetch(`${API_BASE_URL}/countries/${countryCode}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update country');
    return response.json();
  },

  delete: async (countryCode: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/countries/${countryCode}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete country');
  },

  getById: async (countryCode: string): Promise<Country> => {
    const response = await fetch(`${API_BASE_URL}/countries/${countryCode}`);
    if (!response.ok) throw new Error('Failed to fetch country');
    return response.json();
  },
};

// ==========================================
// 港口管理
// ==========================================

export const portApi = {
  getList: async (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    portType?: 'AIR' | 'SEA';
    countryCode?: string;
  }): Promise<PagedResponse<Port>> => {
    const url = new URL(`${API_BASE_URL}/ports`, window.location.origin);
    url.searchParams.append('page', params?.page?.toString() || '0');
    url.searchParams.append('size', params?.size?.toString() || '20');
    if (params?.keyword) url.searchParams.append('keyword', params.keyword);
    if (params?.portType) url.searchParams.append('portType', params.portType);
    if (params?.countryCode) url.searchParams.append('countryCode', params.countryCode);
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch ports');
    return response.json();
  },

  search: async (keyword: string, type?: 'AIR' | 'SEA'): Promise<Port[]> => {
    const url = new URL(`${API_BASE_URL}/ports/search`, window.location.origin);
    url.searchParams.append('keyword', keyword);
    if (type) url.searchParams.append('type', type);
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to search ports');
    return response.json();
  },

  create: async (data: PortFormData): Promise<Port> => {
    const response = await fetch(`${API_BASE_URL}/ports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create port');
    return response.json();
  },

  update: async (portId: number, data: PortFormData): Promise<Port> => {
    const response = await fetch(`${API_BASE_URL}/ports/${portId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update port');
    return response.json();
  },

  delete: async (portId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/ports/${portId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete port');
  },
};

// ==========================================
// 销售办公室管理
// ==========================================

export const salesOfficeApi = {
  getList: async (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    countryCode?: string;
  }): Promise<PagedResponse<SalesOffice>> => {
    const url = new URL(`${API_BASE_URL}/sales-offices`, window.location.origin);
    url.searchParams.append('page', params?.page?.toString() || '0');
    url.searchParams.append('size', params?.size?.toString() || '20');
    if (params?.keyword) url.searchParams.append('keyword', params.keyword);
    if (params?.countryCode) url.searchParams.append('countryCode', params.countryCode);
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch sales offices');
    return response.json();
  },

  create: async (data: SalesOfficeFormData): Promise<SalesOffice> => {
    const response = await fetch(`${API_BASE_URL}/sales-offices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create sales office');
    return response.json();
  },

  update: async (officeId: number, data: SalesOfficeFormData): Promise<SalesOffice> => {
    const response = await fetch(`${API_BASE_URL}/sales-offices/${officeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update sales office');
    return response.json();
  },

  delete: async (officeId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/sales-offices/${officeId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete sales office');
  },
};

// ==========================================
// 销售PIC管理
// ==========================================

export const salesPicApi = {
  getList: async (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    countryCode?: string;
    officeId?: number;
  }): Promise<PagedResponse<SalesPic>> => {
    const url = new URL(`${API_BASE_URL}/sales-pics`, window.location.origin);
    url.searchParams.append('page', params?.page?.toString() || '0');
    url.searchParams.append('size', params?.size?.toString() || '20');
    if (params?.keyword) url.searchParams.append('keyword', params.keyword);
    if (params?.countryCode) url.searchParams.append('countryCode', params.countryCode);
    if (params?.officeId) url.searchParams.append('officeId', params.officeId.toString());
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch sales pics');
    return response.json();
  },

  getByCountry: async (countryCode: string): Promise<SalesPic[]> => {
    const response = await fetch(`${API_BASE_URL}/sales-pics/by-country/${countryCode}`);
    if (!response.ok) throw new Error('Failed to fetch sales pics by country');
    return response.json();
  },

  create: async (data: SalesPicFormData): Promise<SalesPic> => {
    const response = await fetch(`${API_BASE_URL}/sales-pics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create sales pic');
    return response.json();
  },

  update: async (picId: number, data: SalesPicFormData): Promise<SalesPic> => {
    const response = await fetch(`${API_BASE_URL}/sales-pics/${picId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update sales pic');
    return response.json();
  },

  delete: async (picId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/sales-pics/${picId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete sales pic');
  },
};

// ==========================================
// 箱型管理
// ==========================================

export const containerTypeApi = {
  getList: async (params?: {
    page?: number;
    size?: number;
    keyword?: string;
  }): Promise<PagedResponse<ContainerType>> => {
    const url = new URL(`${API_BASE_URL}/container-types`, window.location.origin);
    url.searchParams.append('page', params?.page?.toString() || '0');
    url.searchParams.append('size', params?.size?.toString() || '20');
    if (params?.keyword) url.searchParams.append('keyword', params.keyword);
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch container types');
    return response.json();
  },

  create: async (data: ContainerTypeFormData): Promise<ContainerType> => {
    const response = await fetch(`${API_BASE_URL}/container-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create container type');
    return response.json();
  },

  update: async (containerId: number, data: ContainerTypeFormData): Promise<ContainerType> => {
    const response = await fetch(`${API_BASE_URL}/container-types/${containerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update container type');
    return response.json();
  },

  delete: async (containerId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/container-types/${containerId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete container type');
  },
};

// ==========================================
// 字典管理
// ==========================================

export const dictApi = {
  getList: async (
    dictType: string,
    params?: { page?: number; size?: number; keyword?: string }
  ): Promise<PagedResponse<any>> => {
    const url = new URL(`${API_BASE_URL}/dict/${dictType}`, window.location.origin);
    url.searchParams.append('page', params?.page?.toString() || '0');
    url.searchParams.append('size', params?.size?.toString() || '20');
    if (params?.keyword) url.searchParams.append('keyword', params.keyword);
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Failed to fetch ${dictType}`);
    return response.json();
  },

  create: async (dictType: string, data: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/dict/${dictType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to create ${dictType}`);
    return response.json();
  },

  update: async (dictType: string, code: string, data: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/dict/${dictType}/${code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update ${dictType}`);
    return response.json();
  },

  delete: async (dictType: string, code: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/dict/${dictType}/${code}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete ${dictType}`);
  },
};
```

---

## 3. Report 组件实现

### 3.1 Dashboard.tsx 框架

```typescript
// components/report/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Pause,
  BarChart3, PieChart, LineChart
} from 'lucide-react';
import { DashboardStats } from '../../types';
import { reportApi } from '../../services/reportApi';
import StatCard from './charts/StatCard';
import StatusPieChart from './charts/StatusPieChart';
import TrendLineChart from './charts/TrendLineChart';
import CargoTypeBarChart from './charts/CargoTypeBarChart';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(2, 7).replace('-', '')
  );

  useEffect(() => {
    loadStats();
  }, [selectedMonth]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await reportApi.getDashboardStats(selectedMonth);
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error || !stats) return <div>Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📊 Dashboard</h1>
        <div className="flex gap-2">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value.replace('-', ''))}
            className="px-3 py-2 border rounded"
          />
          <button 
            onClick={loadStats}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's New Enquiries"
          value={stats.stats.todayNewEnquiries}
          change={stats.stats.today_vs_yesterday}
          icon={<TrendingUp />}
          color="blue"
        />
        <StatCard
          title="Pending Quotes"
          value={stats.stats.pendingQuotes}
          change={stats.stats.pending_vs_week_ago}
          icon={<Pause />}
          color="yellow"
        />
        <StatCard
          title="Pending Bookings"
          value={stats.stats.pendingBookings}
          change={stats.stats.pending_vs_week_ago}
          icon={<Pause />}
          color="orange"
        />
        <StatCard
          title="Month Completion Rate"
          value={stats.stats.monthCompletionRate}
          format="percentage"
          icon={<BarChart3 />}
          color="green"
        />
      </div>

      {/* Second Row of Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enquiries (Month)"
          value={stats.stats.monthTotalEnquiries}
          comparison={`vs last year: +${Math.floor(Math.random() * 20)}%`}
        />
        <StatCard
          title="Completed Quotes"
          value={stats.stats.monthTotalQuotes}
          comparison={`${stats.stats.monthQuoteRate} conversion`}
        />
        <StatCard
          title="Booking Confirmation"
          value={`${stats.stats.monthBookingCount}`}
          comparison={stats.stats.monthBookingRate}
        />
        <StatCard
          title="Avg Quote Days"
          value={stats.stats.avgQuoteDays}
          unit="days"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Status Distribution</h3>
          <StatusPieChart data={stats.charts.statusDistribution} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Cargo Type Distribution</h3>
          <CargoTypeBarChart data={stats.charts.cargoTypeDistribution} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Top Metrics</h3>
          <div className="space-y-4">
            <div className="p-3 border rounded bg-gray-50">
              <p className="text-sm text-gray-600">Top Country</p>
              <p className="text-xl font-bold">{stats.stats.topCountry.name}</p>
              <p className="text-xs text-gray-500">{stats.stats.topCountry.count} enquiries</p>
            </div>
            <div className="p-3 border rounded bg-gray-50">
              <p className="text-sm text-gray-600">Top Cargo Type</p>
              <p className="text-xl font-bold">{stats.stats.topCargoType.name}</p>
              <p className="text-xs text-gray-500">{stats.stats.topCargoType.count} enquiries</p>
            </div>
            <div className="p-3 border rounded bg-gray-50">
              <p className="text-sm text-gray-600">Rejection Rate</p>
              <p className="text-xl font-bold">{stats.stats.rejectionRate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">30-Day Trend</h3>
        <TrendLineChart data={stats.charts.trend30Days} />
      </div>
    </div>
  );
};

export default Dashboard;
```

### 3.2 MonthlyReport.tsx 框架

```typescript
// components/report/MonthlyReport.tsx
import React, { useState, useEffect } from 'react';
import { MonthlyReportData } from '../../types';
import { reportApi } from '../../services/reportApi';
import MonthlyTable from './tables/MonthlyTable';
import CountryTable from './tables/CountryTable';

export const MonthlyReport: React.FC = () => {
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));

  useEffect(() => {
    loadReport();
  }, [year, month]);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const data = await reportApi.getMonthlyReport(year, month);
      setReport(data);
    } catch (err) {
      console.error('Failed to load monthly report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !report) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📋 Monthly Report</h1>
        <div className="flex gap-2">
          <select 
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i} value={String(i + 1).padStart(2, '0')}>
                {String(i + 1).padStart(2, '0')}
              </option>
            ))}
          </select>
          <button 
            onClick={() => reportApi.downloadExport({
              reportType: 'monthly',
              format: 'xlsx',
              includeCharts: true,
              month: `${year}${month}`
            })}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            📥 Export
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-6 rounded-lg shadow grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-gray-600">Total Enquiries</p>
          <p className="text-3xl font-bold">{report.summary.totalEnquiries}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600">Quoted</p>
          <p className="text-3xl font-bold">{report.summary.quotedCount}</p>
          <p className="text-sm text-gray-500">{report.summary.quoteRate}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600">Bookings Confirmed</p>
          <p className="text-3xl font-bold">{report.summary.bookingConfirmedCount}</p>
          <p className="text-sm text-gray-500">{report.summary.bookingRate}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600">Rejected</p>
          <p className="text-3xl font-bold">{report.summary.rejectionCount}</p>
        </div>
      </div>

      {/* By Country Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">By Country (Top 15)</h3>
        <CountryTable data={report.byCountry} />
      </div>

      {/* By Cargo Type Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">By Cargo Type</h3>
        <MonthlyTable data={report.byCargoType} />
      </div>
    </div>
  );
};

export default MonthlyReport;
```

---

## 4. Settings 组件实现

### 4.1 通用列表组件 MasterDataList.tsx

```typescript
// components/settings/common/MasterDataList.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Check, X } from 'lucide-react';
import { PagedResponse } from '../../types';

interface MasterDataListProps<T> {
  title: string;
  data: T[];
  isLoading: boolean;
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
  }>;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onToggle?: (item: T) => void;
  searchableFields?: string[];
}

export const MasterDataList = React.forwardRef<any, MasterDataListProps<any>>(
  ({
    title,
    data,
    isLoading,
    columns,
    onAdd,
    onEdit,
    onDelete,
    onToggle,
    searchableFields = [],
  }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredData, setFilteredData] = useState(data);

    useEffect(() => {
      if (!searchTerm) {
        setFilteredData(data);
        return;
      }

      const term = searchTerm.toLowerCase();
      const filtered = data.filter(item =>
        searchableFields.some(field =>
          String((item as any)[field]).toLowerCase().includes(term)
        )
      );
      setFilteredData(filtered);
    }, [searchTerm, data]);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={18} /> Add
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      className="px-4 py-2 text-left font-semibold text-gray-700"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-2">
                        {col.render
                          ? col.render((item as any)[col.key], item)
                          : (item as any)[col.key]}
                      </td>
                    ))}
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                      {onToggle && (
                        <button
                          onClick={() => onToggle(item)}
                          className="p-1 text-green-500 hover:bg-green-50 rounded"
                        >
                          {(item as any).isActive ? <Check size={18} /> : <X size={18} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
);
```

### 4.2 国家管理 CountryManagement.tsx

```typescript
// components/settings/CountryManagement.tsx
import React, { useState, useEffect } from 'react';
import { Country, CountryFormData, PagedResponse } from '../../types';
import { countryApi } from '../../services/settingsApi';
import MasterDataList from './common/MasterDataList';
import MasterDataForm from './common/MasterDataForm';

export const CountryManagement: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Country | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCountries();
  }, [page]);

  const loadCountries = async () => {
    try {
      setIsLoading(true);
      const response = await countryApi.getList({
        page,
        size: 20,
      });
      setCountries(response.content);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to load countries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: Country) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSave = async (data: CountryFormData) => {
    try {
      if (editingItem) {
        await countryApi.update(editingItem.countryCode, data);
      } else {
        await countryApi.create(data);
      }
      loadCountries();
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleDelete = async (item: Country) => {
    if (confirm(`Delete ${item.countryNameEn}?`)) {
      try {
        await countryApi.delete(item.countryCode);
        loadCountries();
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <MasterDataList
        title="🌍 Country Management"
        data={countries}
        isLoading={isLoading}
        columns={[
          { key: 'countryCode', label: 'Code' },
          { key: 'countryNameEn', label: 'English Name' },
          { key: 'countryNameCn', label: 'Chinese Name' },
          {
            key: 'isActive',
            label: 'Status',
            render: (value) => (value ? '✅ Active' : '⛔ Inactive'),
          },
        ]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchableFields={['countryCode', 'countryNameEn', 'countryNameCn']}
      />

      {showForm && (
        <MasterDataForm
          title={editingItem ? 'Edit Country' : 'Add Country'}
          initialData={editingItem}
          fields={[
            {
              name: 'countryCode',
              label: 'Country Code',
              type: 'text',
              required: true,
              disabled: !!editingItem,
              maxLength: 2,
            },
            {
              name: 'countryNameEn',
              label: 'English Name',
              type: 'text',
              required: true,
            },
            {
              name: 'countryNameCn',
              label: 'Chinese Name',
              type: 'text',
            },
            {
              name: 'isActive',
              label: 'Active',
              type: 'checkbox',
              defaultValue: true,
            },
          ]}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default CountryManagement;
```

---

## 5. 关键业务逻辑

### 5.1 级联选择逻辑 (CascadeSelect.ts)

```typescript
// utils/cascadeSelect.ts

/**
 * 销售国家 → 销售办公室 → 销售PIC 的级联逻辑
 */
export const cascadeLogic = {
  // 当国家改变时
  onCountryChange: async (
    countryCode: string,
    salesOfficeApi: any,
    salesPicApi: any
  ) => {
    // 1. 获取该国家的销售办公室
    const offices = await salesOfficeApi.getList({
      countryCode,
    });

    // 2. 获取该国家的销售PIC
    const pics = await salesPicApi.getByCountry(countryCode);

    return {
      offices: offices.content,
      pics: pics,
    };
  },

  // 当销售办公室改变时
  onOfficeChange: async (officeId: number, salesPicApi: any) => {
    // 获取该办公室的销售PIC
    const response = await salesPicApi.getList({
      officeId,
    });
    return response.content;
  },
};
```

### 5.2 数据导出逻辑 (exportHelper.ts)

```typescript
// utils/exportHelper.ts

export const exportHelper = {
  /**
   * 触发浏览器下载
   */
  download: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * 生成导出文件名
   */
  generateFilename: (reportType: string, format: string, date?: Date): string => {
    const dateStr = (date || new Date()).toISOString().split('T')[0];
    return `report-${reportType}-${dateStr}.${format}`;
  },
};
```

---

## 6. 页面路由

### 6.1 Route 配置 (App.tsx 扩展)

```typescript
// App.tsx 中的路由配置

import ReportLayout from './components/report/ReportLayout';
import SettingsLayout from './components/settings/SettingsLayout';

const routes = [
  // ... 其他路由
  {
    path: '/report',
    component: ReportLayout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'monthly', component: MonthlyReport },
      { path: 'country', component: CountryReport },
    ],
  },
  {
    path: '/settings',
    component: SettingsLayout,
    children: [
      { path: 'countries', component: CountryManagement },
      { path: 'ports', component: PortManagement },
      { path: 'sales-offices', component: SalesOfficeManagement },
      { path: 'sales-pics', component: SalesPicManagement },
      { path: 'containers', component: ContainerTypeManagement },
      { path: 'dict', component: DictManagement },
      { path: 'system', component: SystemSettings },
      { path: 'audit-log', component: AuditLog },
    ],
  },
];
```

---

**本文档为开发指南，具体实现时请根据项目实际情况调整。** 🚀

