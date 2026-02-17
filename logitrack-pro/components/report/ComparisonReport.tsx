// ============================================================
// ComparisonReport - 时期对比报告组件
// ============================================================

import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Flag,
  Building2,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  Download,
} from 'lucide-react';
import {
  ComparisonType,
  PeriodComparisonRequest,
  ComparisonResult,
  PeriodStats,
} from '../../types';
import { reportApi } from '../../services/reportApi';
import { TrendChart } from './TrendChart';

export const ComparisonReport: React.FC = () => {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('MONTHLY');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [coreFlags, setCoreFlags] = useState<('CORE' | 'NON_CORE')[]>([]);
  const [cnOffice, setCnOffice] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cnOffices = [
    { value: '', label: '全部' },
    { value: 'SHANGHAI', label: '上海' },
    { value: 'SHENZHEN', label: '深圳' },
    { value: 'BEIJING', label: '北京' },
    { value: 'GUANGZHOU', label: '广州' },
    { value: 'HONG KONG', label: '香港' },
  ];

  // 生成可选时期
  const generatePeriodOptions = (): string[] => {
    const options: string[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    if (comparisonType === 'MONTHLY') {
      // 最近 12 个月
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        options.push(`${year}-${month}`);
      }
    } else {
      // 最近 8 个季度
      for (let i = 7; i >= 0; i--) {
        const yearOffset = Math.floor(i / 4);
        const quarter = 4 - (i % 4);
        const year = currentYear - yearOffset;
        options.push(`${year}-Q${quarter}`);
      }
    }

    return options.reverse();
  };

  const formatPeriodLabel = (period: string): string => {
    if (comparisonType === 'MONTHLY') {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
    } else {
      return period.replace('-Q', ' 年第 ') + ' 季度';
    }
  };

  const togglePeriod = (period: string) => {
    setSelectedPeriods((prev) => {
      if (prev.includes(period)) {
        return prev.filter((p) => p !== period);
      } else if (prev.length < 6) {
        return [...prev, period].sort();
      } else {
        alert('最多只能选择 6 个时期');
        return prev;
      }
    });
  };

  const toggleCoreFlag = (flag: 'CORE' | 'NON_CORE') => {
    setCoreFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const handleCompare = async () => {
    if (selectedPeriods.length < 2) {
      alert('请至少选择 2 个时期进行对比');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: PeriodComparisonRequest = {
        comparisonType,
        periods: selectedPeriods,
        coreFlags: coreFlags.length > 0 ? coreFlags : undefined,
        cnOffice: cnOffice || undefined,
      };

      const data = await reportApi.comparePeriods(request);
      setResult(data);
    } catch (err) {
      setError('对比失败，请重试');
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedPeriods([]);
    setCoreFlags([]);
    setCnOffice('');
    setResult(null);
    setError(null);
  };

  const exportToCSV = () => {
    if (!result) return;

    const headers = ['时期', '总询价数', '已报价', '已确认', '转化率', '环比变化'];
    const rows = result.periodStats.map((stat) => [
      stat.period,
      stat.totalEnquiries,
      stat.quoted,
      stat.confirmed,
      `${stat.conversionRate.toFixed(1)}%`,
      stat.changeFromPrevious ? `${stat.changeFromPrevious > 0 ? '+' : ''}${stat.changeFromPrevious.toFixed(1)}%` : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      '汇总',
      `总计,${result.summary.grandTotal}`,
      `平均转化率,${result.summary.avgConversionRate.toFixed(1)}%`,
      `最佳时期,${result.summary.bestPeriod}`,
      `最差时期,${result.summary.worstPeriod}`,
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `period_comparison_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const periodOptions = generatePeriodOptions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-7 w-7 mr-2 text-blue-600" />
            时期对比报告
          </h2>
          <p className="text-sm text-gray-500 mt-1">分析不同时期的业务表现趋势</p>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
        {/* Comparison Type */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
            <Calendar className="h-4 w-4 mr-1" />
            对比类型
          </label>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setComparisonType('MONTHLY');
                setSelectedPeriods([]);
              }}
              className={`flex-1 px-4 py-3 border-2 rounded-lg transition font-medium ${
                comparisonType === 'MONTHLY'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
              }`}
            >
              📅 月度对比
            </button>
            <button
              onClick={() => {
                setComparisonType('QUARTERLY');
                setSelectedPeriods([]);
              }}
              className={`flex-1 px-4 py-3 border-2 rounded-lg transition font-medium ${
                comparisonType === 'QUARTERLY'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
              }`}
            >
              📊 季度对比
            </button>
          </div>
        </div>

        {/* Period Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            选择时期 ({selectedPeriods.length}/6)
          </label>
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
            {periodOptions.map((period) => (
              <button
                key={period}
                onClick={() => togglePeriod(period)}
                className={`px-3 py-2 text-sm rounded-lg border transition ${
                  selectedPeriods.includes(period)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-4">
          {/* Core Flag */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Flag className="h-4 w-4 mr-1" />
              Core Flag（可选）
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => toggleCoreFlag('CORE')}
                className={`flex-1 px-3 py-2 text-sm border rounded-lg transition ${
                  coreFlags.includes('CORE')
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                CORE
              </button>
              <button
                onClick={() => toggleCoreFlag('NON_CORE')}
                className={`flex-1 px-3 py-2 text-sm border rounded-lg transition ${
                  coreFlags.includes('NON_CORE')
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                NON CORE
              </button>
            </div>
          </div>

          {/* CN Office */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 mr-1" />
              中国办公室（可选）
            </label>
            <select
              value={cnOffice}
              onChange={(e) => setCnOffice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {cnOffices.map((office) => (
                <option key={office.value} value={office.value}>
                  {office.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={handleCompare}
            disabled={loading || selectedPeriods.length < 2}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition font-semibold"
          >
            {loading ? '分析中...' : '开始对比'}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-semibold"
          >
            重置
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">总询价数</p>
              <p className="text-3xl font-bold text-gray-900">{result.summary.grandTotal}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">平均转化率</p>
              <p className="text-3xl font-bold text-green-600">
                {result.summary.avgConversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1 flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                最佳时期
              </p>
              <p className="text-2xl font-bold text-green-600">{result.summary.bestPeriod}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-1 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                最差时期
              </p>
              <p className="text-2xl font-bold text-red-600">{result.summary.worstPeriod}</p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">详细对比</h3>
              <button
                onClick={exportToCSV}
                className="flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                <Download className="h-4 w-4 mr-1" />
                导出 CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      时期
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      总询价数
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      已报价
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      已确认
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      转化率
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      环比变化
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.periodStats.map((stat) => (
                    <tr key={stat.period} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{stat.period}</p>
                          <p className="text-xs text-gray-500">
                            {stat.startDate} ~ {stat.endDate}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {stat.totalEnquiries}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {stat.quoted}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-green-600 font-medium">
                        {stat.confirmed}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-600">
                          {stat.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {stat.changeFromPrevious !== undefined && stat.changeFromPrevious !== null ? (
                          <span
                            className={`inline-flex items-center text-sm font-medium ${
                              stat.changeFromPrevious >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {stat.changeFromPrevious >= 0 ? (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-1" />
                            )}
                            {stat.changeFromPrevious > 0 ? '+' : ''}
                            {stat.changeFromPrevious.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trend Chart */}
          <TrendChart data={result} comparisonType={comparisonType} />
        </div>
      )}
    </div>
  );
};
