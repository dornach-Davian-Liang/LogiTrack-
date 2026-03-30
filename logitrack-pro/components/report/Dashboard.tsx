// ============================================================
// Dashboard - 报表仪表板组件
// ============================================================

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  DollarSign,
  Package,
  MapPin,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { DashboardStats } from '../../types';
import { reportApi } from '../../services/reportApi';
import { useLanguage } from '../../i18n/LanguageContext';
import { StatCard } from './StatCard';

interface DashboardProps {
  currentMonth?: string; // Format: YYYY-MM
}

export const Dashboard: React.FC<DashboardProps> = ({ currentMonth }) => {
  const { language, translations } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth || getCurrentMonth());

  useEffect(() => {
    loadStats();
  }, [selectedMonth]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportApi.getDashboardStats(selectedMonth);
      setStats(data);
    } catch (err) {
      setError(translations.errors.dataLoadFailed);
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  function getCurrentMonth(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">{translations.loading}</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">{error || translations.noData}</p>
        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
        >
          {translations.retry}
        </button>
      </div>
    );
  }

  const { overview, statusBreakdown, monthlyTrend, topCountries, topOrigins, topDestinations, cargoTypes } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{translations.dashboard.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{translations.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {generateMonthOptions(language)}
          </select>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {translations.refresh}
          </button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={translations.statistics.totalEnquiries}
          value={overview.totalEnquiries}
          change={overview.totalEnquiriesChange}
          comparison={`${language === 'zh' ? '较上月' : 'vs last month'} ${overview.totalEnquiriesChange >= 0 ? (language === 'zh' ? '增加' : 'increased') : (language === 'zh' ? '减少' : 'decreased')}`}
          icon={<FileText className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title={translations.statistics.quoted}
          value={overview.quoted}
          change={overview.quotedChange}
          comparison={`${language === 'zh' ? '报价率' : 'Quote Rate'} ${((overview.quoted / overview.totalEnquiries) * 100).toFixed(1)}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title={translations.statistics.pending}
          value={overview.pending}
          comparison={`${language === 'zh' ? '占比' : 'Percentage'} ${((overview.pending / overview.totalEnquiries) * 100).toFixed(1)}%`}
          icon={<Clock className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title={translations.statistics.confirmed}
          value={overview.confirmed}
          change={overview.confirmedChange}
          comparison={`${language === 'zh' ? '转化率' : 'Conversion Rate'} ${((overview.confirmed / overview.quoted) * 100 || 0).toFixed(1)}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Status Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{translations.dashboard.statusBreakdown}</h3>
          <div className="space-y-3">
            {Object.entries(statusBreakdown).map(([status, data]) => {
              const statusData = data as { count: number; percentage: string };
              const percentage = ((statusData.count / overview.totalEnquiries) * 100).toFixed(1);
              return (
                <div key={status} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {getStatusLabel(status, language)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {statusData.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(status)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{translations.dashboard.monthlyTrend}</h3>
          <div className="space-y-4">
            {monthlyTrend.slice(0, 6).map((item) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  {item.change !== undefined && (
                    <span className={`text-xs flex items-center ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : '▼'}
                      {Math.abs(item.change)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Countries */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-500" />
            {translations.dashboard.topCountries}
          </h3>
          <div className="space-y-3">
            {topCountries.map((country, index) => (
              <div key={`${index}-${country.country || country.name || 'country'}`} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                  <span className="text-sm text-gray-700">{country.country || country.name || '未知'}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{country.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Origins */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-green-500" />
            {translations.dashboard.topOrigins}
          </h3>
          <div className="space-y-3">
            {topOrigins.map((origin, index) => (
              <div key={`${index}-${origin.port || origin.name || 'origin'}`} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                  <span className="text-sm text-gray-700">{origin.port || origin.name || '未知'}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{origin.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Destinations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-purple-500" />
            {translations.dashboard.topDestinations}
          </h3>
          <div className="space-y-3">
            {topDestinations.map((dest, index) => (
              <div key={`${index}-${dest.port || dest.name || 'dest'}`} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                  <span className="text-sm text-gray-700">{dest.port || dest.name || '未知'}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{dest.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cargo Types */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2 text-orange-500" />
          {translations.dashboard.cargoTypes}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cargoTypes.map((cargo) => {
            const percentage = ((cargo.count / overview.totalEnquiries) * 100).toFixed(1);
            return (
              <div key={cargo.type || cargo.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="text-2xl font-bold text-gray-900">{cargo.count}</div>
                <div className="text-sm text-gray-600 mt-1">{cargo.type || cargo.name || '未分类'}</div>
                <div className="text-xs text-gray-500 mt-2">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getStatusLabel(status: string, language: string): string {
  const zhLabels: Record<string, string> = {
    'New': '新询价',
    'Quoted & Pending': '已报价/待确认',
    'Secured': '已确认',
    'Lost': '已流失',
    'Cancelled': '已取消',
  };
  
  const enLabels: Record<string, string> = {
    'New': 'New',
    'Quoted & Pending': 'Quoted & Pending',
    'Secured': 'Secured',
    'Lost': 'Lost',
    'Cancelled': 'Cancelled',
  };
  
  const labels = language === 'zh' ? zhLabels : enLabels;
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'New': 'bg-blue-500',
    'Quoted & Pending': 'bg-yellow-500',
    'Secured': 'bg-green-500',
    'Lost': 'bg-red-500',
    'Cancelled': 'bg-gray-500',
  };
  return colors[status] || 'bg-gray-500';
}

function generateMonthOptions(language: string): React.ReactElement[] {
  const options: React.ReactElement[] = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    let label: string;
    if (language === 'zh') {
      label = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    
    options.push(<option key={value} value={value}>{label}</option>);
  }
  
  return options;
}

export default Dashboard;
