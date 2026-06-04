// ============================================================
// EnhancedDashboard - 增强版报表仪表板组件（带过滤功能）
// ============================================================

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock,
  XCircle,
  TrendingUp,
  Package,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { DashboardStatsWithFilter, DashboardFilterParams, CNOfficeStat, EnquiryListItem } from '../../types';
import { reportApi } from '../../services/reportApi';
import { useLanguage } from '../../i18n/LanguageContext';
import { StatCard } from './StatCard';
import { DashboardFilters } from './DashboardFilters';
import { CNOfficePivotTable } from './CNOfficePivotTable';
import { EnquiryListModal } from './EnquiryListModal';

interface EnhancedDashboardProps {
  onViewDetail?: (enquiry: EnquiryListItem, modalState?: { officeName: string; bookingStatus: 'yes' | 'rejected' | 'invalid' | 'pending' }) => void;
  onEdit?: (enquiry: EnquiryListItem, modalState?: { officeName: string; bookingStatus: 'yes' | 'rejected' | 'invalid' | 'pending' }) => void;
  canManage?: boolean;
  initialModalState?: { isOpen: boolean; officeName: string; bookingStatus: 'yes' | 'rejected' | 'invalid' | 'pending'; timestamp?: number } | null;
  onModalStateChange?: (state: { isOpen: boolean; officeName: string; bookingStatus: 'yes' | 'rejected' | 'invalid' | 'pending'; timestamp?: number } | null) => void;
  savedFilter?: DashboardFilterParams | null; // ✅ 新增：保存的过滤条件
  onFilterChange?: (filter: DashboardFilterParams | null) => void; // ✅ 新增：过滤条件变化回调
}

export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ 
  onViewDetail,
  onEdit,
  canManage = false,
  initialModalState = null,
  onModalStateChange,
  savedFilter = null, // ✅ 新增
  onFilterChange // ✅ 新增
}) => {
  const { language, translations } = useLanguage();
  const [stats, setStats] = useState<DashboardStatsWithFilter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFilter, setUseFilter] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false); // ✅ 新增：标记是否已初始化
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(initialModalState?.isOpen || false);
  const [selectedOffice, setSelectedOffice] = useState<string>(initialModalState?.officeName || '');
  const [selectedStatus, setSelectedStatus] = useState<'yes' | 'rejected' | 'invalid' | 'pending'>(initialModalState?.bookingStatus || 'yes');
  
  console.log('[EnhancedDashboard] Component rendered, modalOpen:', modalOpen, 'initialModalState:', initialModalState);

  const loadDefaultStats = async () => {
    // 默认显示当前月的数据
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const filter: DashboardFilterParams = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };

    await handleApplyFilter(filter);
  };

  useEffect(() => {
    // ✅ 如果有保存的过滤条件，使用保存的；否则加载默认数据
    if (savedFilter && !hasInitialized) {
      console.log('[EnhancedDashboard] Restoring saved filter:', savedFilter);
      handleApplyFilter(savedFilter);
      setHasInitialized(true);
    } else if (!hasInitialized) {
      loadDefaultStats();
      setHasInitialized(true);
    }
  }, [savedFilter, hasInitialized]);
  
  // 恢复弹窗状态 - 监听 initialModalState 和 modalOpen 状态
  useEffect(() => {
    // 只有在弹窗关闭状态下，且有 initialModalState 时才恢复
    if (initialModalState && initialModalState.isOpen && !modalOpen) {
      console.log('[EnhancedDashboard] Restoring modal state:', initialModalState);
      setModalOpen(true);
      setSelectedOffice(initialModalState.officeName);
      setSelectedStatus(initialModalState.bookingStatus);
    }
  }, [initialModalState, modalOpen]);

  const handleApplyFilter = async (filter: DashboardFilterParams) => {
    try {
      setLoading(true);
      setError(null);
      setUseFilter(true);
      const data = await reportApi.getFilteredDashboardStats(filter);
      setStats({ ...data, filterApplied: filter });
      // ✅ 通知父组件保存过滤条件
      onFilterChange?.(filter);
    } catch (err) {
      setError(translations.errors.dataLoadFailed);
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setUseFilter(false);
    // ✅ 清除保存的过滤条件
    onFilterChange?.(null);
    loadDefaultStats();
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">{translations.loading}</span>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadDefaultStats}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
        >
          {translations.retry}
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const { overview, statusBreakdown, monthlyTrend, topCountries, topOrigins, topDestinations, cargoTypes, cnOfficeStats } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{translations.enhancedDashboard.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {translations.enhancedDashboard.subtitle}
            {stats.filterApplied && (
              <span className="ml-2 text-blue-600">
                📅 {stats.filterApplied.startDate} ~ {stats.filterApplied.endDate}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <DashboardFilters
        onApplyFilter={handleApplyFilter}
        onClearFilter={handleClearFilter}
        loading={loading}
      />

      {/* Overview Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title={translations.statistics.totalEnquiries}
          value={overview.totalEnquiries}
          change={overview.totalEnquiriesChange}
          comparison={`${language === 'zh' ? '较上期' : 'vs period'} ${overview.totalEnquiriesChange >= 0 ? (language === 'zh' ? '增加' : 'increased') : (language === 'zh' ? '减少' : 'decreased')}`}
          icon={<FileText className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title={translations.statistics.newEnquiries}
          value={overview.newEnquiries ?? overview.pending}
          comparison={`${language === 'zh' ? '占比' : 'Rate'} ${overview.totalEnquiries > 0 ? (((overview.newEnquiries ?? overview.pending) / overview.totalEnquiries) * 100).toFixed(1) : 0}%`}
          icon={<FileText className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title={translations.statistics.quotedPending}
          value={overview.quotedPending ?? overview.quoted}
          comparison={`${language === 'zh' ? '占比' : 'Rate'} ${overview.totalEnquiries > 0 ? (((overview.quotedPending ?? overview.quoted) / overview.totalEnquiries) * 100).toFixed(1) : 0}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title={translations.statistics.secured}
          value={overview.secured ?? overview.confirmed}
          comparison={`${language === 'zh' ? '占比' : 'Rate'} ${overview.totalEnquiries > 0 ? (((overview.secured ?? overview.confirmed) / overview.totalEnquiries) * 100).toFixed(1) : 0}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title={translations.statistics.lost}
          value={overview.lost ?? 0}
          comparison={`${language === 'zh' ? '占比' : 'Rate'} ${overview.totalEnquiries > 0 ? (((overview.lost ?? 0) / overview.totalEnquiries) * 100).toFixed(1) : 0}%`}
          icon={<XCircle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title={translations.statistics.cancelled}
          value={overview.cancelled ?? 0}
          comparison={`${language === 'zh' ? '占比' : 'Rate'} ${overview.totalEnquiries > 0 ? (((overview.cancelled ?? 0) / overview.totalEnquiries) * 100).toFixed(1) : 0}%`}
          icon={<XCircle className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* CN Office Pivot Table */}
      {cnOfficeStats && cnOfficeStats.length > 0 && (
        <CNOfficePivotTable 
          data={cnOfficeStats}
          onRowClick={(office) => {
            console.log('Clicked office:', office);
            // 可以在这里添加导航到详细数据页面的逻辑
          }}
          onStatusCardClick={(office, status) => {
            console.log(`Opening modal for ${office.officeName} ${status}`);
            setSelectedOffice(office.officeName);
            setSelectedStatus(status);
            setModalOpen(true);
          }}
        />
      )}

      {/* Enquiry List Modal */}
      <EnquiryListModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          // ✅ 修复：关闭弹窗时保持过滤状态，只更新isOpen
          if (onModalStateChange && selectedOffice && selectedStatus) {
            onModalStateChange({
              isOpen: false,
              officeName: selectedOffice,
              bookingStatus: selectedStatus,
              timestamp: Date.now()
            });
          }
        }}
        officeName={selectedOffice}
        bookingStatus={selectedStatus}
        filter={stats?.filterApplied ?? null}
        onViewDetail={(enquiry) => {
          // 传递弹窗状态给父组件
          onViewDetail?.(enquiry, {
            officeName: selectedOffice,
            bookingStatus: selectedStatus
          });
          // 不关闭弹窗，由 App.tsx 保存状态
        }}
        onEdit={(enquiry) => {
          // 传递弹窗状态给父组件
          onEdit?.(enquiry, {
            officeName: selectedOffice,
            bookingStatus: selectedStatus
          });
          // 不关闭弹窗，由 App.tsx 保存状态
        }}
        canManage={canManage}
      />

      {/* Status Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{translations.dashboard.statusBreakdown}</h3>
          <div className="space-y-3">
            {Object.entries(statusBreakdown).map(([status, data]) => {
              const statusData = data as { count: number; percentage: string };
              const percentage = overview.totalEnquiries > 0 
                ? ((statusData.count / overview.totalEnquiries) * 100).toFixed(1) 
                : '0.0';
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
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
      <div className="grid grid-cols-1 gap-6">
        {/* Top Countries */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-500" />
            {translations.dashboard.topCountries}
          </h3>
          <div className="space-y-3">
            {topCountries.slice(0, 5).map((country, index) => (
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
      </div>

      {/* Cargo Types */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2 text-orange-500" />
          {translations.dashboard.cargoTypes}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cargoTypes.map((cargo) => {
            const percentage = overview.totalEnquiries > 0
              ? ((cargo.count / overview.totalEnquiries) * 100).toFixed(1)
              : '0.0';
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

export default EnhancedDashboard;
