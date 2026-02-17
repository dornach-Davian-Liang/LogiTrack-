// ============================================================
// DashboardFilters - Dashboard 过滤组件
// ============================================================

import React, { useState } from 'react';
import { Filter, Calendar, Flag, Building2, X, Check } from 'lucide-react';
import { DashboardFilterParams } from '../../types';

interface DashboardFiltersProps {
  onApplyFilter: (filter: DashboardFilterParams) => void;
  onClearFilter: () => void;
  loading?: boolean;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  onApplyFilter,
  onClearFilter,
  loading = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCoreFlags, setSelectedCoreFlags] = useState<('CORE' | 'NON_CORE')[]>([]);
  const [cnOffice, setCnOffice] = useState('');

  const cnOffices = [
    { value: '', label: '全部办公室' },
    { value: 'SHANGHAI', label: '上海' },
    { value: 'SHENZHEN', label: '深圳' },
    { value: 'BEIJING', label: '北京' },
    { value: 'GUANGZHOU', label: '广州' },
    { value: 'HONG KONG', label: '香港' },
    { value: 'CN-MULTI', label: '多办公室' },
  ];

  const handleApply = () => {
    if (!startDate || !endDate) {
      alert('请选择开始和结束日期');
      return;
    }

    const filter: DashboardFilterParams = {
      startDate,
      endDate,
      coreFlags: selectedCoreFlags.length > 0 ? selectedCoreFlags : undefined,
      cnOffice: cnOffice || undefined,
    };

    onApplyFilter(filter);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCoreFlags([]);
    setCnOffice('');
    onClearFilter();
  };

  const toggleCoreFlag = (flag: 'CORE' | 'NON_CORE') => {
    setSelectedCoreFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const hasActiveFilters = startDate || endDate || selectedCoreFlags.length > 0 || cnOffice;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-900">数据过滤</span>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              已应用
            </span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showFilters ? '收起' : '展开'}
        </button>
      </div>

      {/* Filter Content */}
      {showFilters && (
        <div className="p-4 space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-1" />
                开始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-1" />
                结束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Core Flag */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Flag className="h-4 w-4 mr-1" />
              Core Flag
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => toggleCoreFlag('CORE')}
                className={`flex items-center px-4 py-2 border rounded-lg transition ${
                  selectedCoreFlags.includes('CORE')
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                }`}
              >
                {selectedCoreFlags.includes('CORE') && <Check className="h-4 w-4 mr-1" />}
                CORE
              </button>
              <button
                onClick={() => toggleCoreFlag('NON_CORE')}
                className={`flex items-center px-4 py-2 border rounded-lg transition ${
                  selectedCoreFlags.includes('NON_CORE')
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                }`}
              >
                {selectedCoreFlags.includes('NON_CORE') && <Check className="h-4 w-4 mr-1" />}
                NON CORE
              </button>
            </div>
          </div>

          {/* CN Office */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 mr-1" />
              中国办公室
            </label>
            <select
              value={cnOffice}
              onChange={(e) => setCnOffice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {cnOffices.map((office) => (
                <option key={office.value} value={office.value}>
                  {office.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleApply}
              disabled={loading || !startDate || !endDate}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition font-medium"
            >
              <Check className="h-4 w-4 mr-2" />
              应用过滤
            </button>
            <button
              onClick={handleClear}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
            >
              <X className="h-4 w-4 mr-2" />
              清除
            </button>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">当前过滤条件：</p>
              <div className="flex flex-wrap gap-2">
                {startDate && endDate && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    📅 {startDate} ~ {endDate}
                  </span>
                )}
                {selectedCoreFlags.map((flag) => (
                  <span key={flag} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    🏴 {flag}
                  </span>
                ))}
                {cnOffice && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                    🏢 {cnOffices.find((o) => o.value === cnOffice)?.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
