// ============================================================
// ComparisonReport - 时期对比报告组件
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
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
  Globe,
  Package,
  Search,
  Filter,
} from 'lucide-react';
import {
  ComparisonType,
  PeriodComparisonRequest,
  ComparisonResult,
  PeriodStats,
  Country,
} from '../../types';
import { reportApi } from '../../services/reportApi';
import { masterDataApi } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { TrendChart } from './TrendChart';

export const ComparisonReport: React.FC = () => {
  const { language, translations } = useLanguage();
  const [comparisonType, setComparisonType] = useState<ComparisonType>('MONTHLY');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [coreFlags, setCoreFlags] = useState<('Core' | 'Non_Core')[]>([]);
  const [cnOffice, setCnOffice] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);
  const [countrySearch, setCountrySearch] = useState('');

  const PRODUCT_OPTIONS = [
    { value: 'AIR', label: 'AIR' },
    { value: 'SEA', label: 'SEA' },
    { value: 'SEA-AIR', label: 'SEA-AIR' },
    { value: 'RAIL', label: 'RAIL' },
    { value: 'RAIL-SEA', label: 'RAIL-SEA' },
    { value: 'RAIL-AIR', label: 'RAIL-AIR' },
    { value: 'AIR-RAIL-SEA', label: 'AIR-RAIL-SEA' },
  ];

  // 根据搜索词过滤国家列表
  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return availableCountries;
    return availableCountries.filter((c) => {
      const en = c.countryNameEn?.toLowerCase() ?? '';
      const cn = c.countryNameCn?.toLowerCase() ?? '';
      const code = c.countryCode?.toLowerCase() ?? '';
      return en.includes(q) || cn.includes(q) || code.includes(q);
    });
  }, [availableCountries, countrySearch]);

  useEffect(() => {
    masterDataApi.getCountries().then(setAvailableCountries).catch(() => setAvailableCountries([]));
  }, []);

  const cnOffices = [
    { value: '', label: language === 'zh' ? '全部' : 'All' },
    { value: 'SHANGHAI', label: language === 'zh' ? '上海' : 'Shanghai' },
    { value: 'SHENZHEN', label: language === 'zh' ? '深圳' : 'Shenzhen' },
    { value: 'BEIJING', label: language === 'zh' ? '北京' : 'Beijing' },
    { value: 'GUANGZHOU', label: language === 'zh' ? '广州' : 'Guangzhou' },
    { value: 'HONG KONG', label: language === 'zh' ? '香港' : 'Hong Kong' },
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
      if (language === 'zh') {
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
      } else {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      }
    } else {
      if (language === 'zh') {
        return period.replace('-Q', ' 年第 ') + ' 季度';
      } else {
        return period.replace('-Q', ' Q');
      }
    }
  };

  const togglePeriod = (period: string) => {
    setSelectedPeriods((prev) => {
      if (prev.includes(period)) {
        return prev.filter((p) => p !== period);
      } else if (prev.length < 6) {
        return [...prev, period].sort();
      } else {
        alert(translations.comparisonReport.maxPeriods);
        return prev;
      }
    });
  };

  const toggleProduct = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product) ? prev.filter((p) => p !== product) : [...prev, product]
    );
  };

  const toggleCountry = (countryCode: string) => {
    setSelectedCountries((prev) =>
      prev.includes(countryCode) ? prev.filter((c) => c !== countryCode) : [...prev, countryCode]
    );
  };

  const toggleCoreFlag = (flag: 'Core' | 'Non_Core') => {
    setCoreFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const handleCompare = async () => {
    if (selectedPeriods.length < 2) {
      alert(translations.comparisonReport.selectAtLeastTwo);
      return;
    }

    setLoading(true);
    setError(null);

    try {
        const countryIds = selectedCountries
          .map((code) => availableCountries.find((c) => c.countryCode === code)?.id)
          .filter(id => id !== undefined) as number[];

        const request: PeriodComparisonRequest = {
          comparisonType,
          periods: selectedPeriods,
          coreFlags: coreFlags.length > 0 ? coreFlags : undefined,
          cnOffice: cnOffice || undefined,
          countryIds: countryIds.length > 0 ? countryIds : undefined,
          productCodes: selectedProducts.length > 0 ? selectedProducts : undefined,        };
      const data = await reportApi.comparePeriods(request);
      setResult(data);
    } catch (err) {
      setError(translations.errors.compareFailed);
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedPeriods([]);
    setCoreFlags([]);
    setCnOffice('');
    setSelectedProducts([]);
    setSelectedCountries([]);
    setCountrySearch('');
    setResult(null);
    setError(null);
  };

  const exportToCSV = () => {
    if (!result) return;

    const headers = language === 'zh' 
      ? ['时期', '总询价数', '已报价', '已确认', '转化率', '环比变化']
      : ['Period', 'Total', 'Quoted', 'Confirmed', 'Conversion Rate', 'MoM Change'];
    
    const rows = result.periodStats.map((stat) => [
      stat.period,
      stat.totalEnquiries,
      stat.quoted,
      stat.confirmed,
      `${stat.conversionRate.toFixed(1)}%`,
      stat.changeFromPrevious ? `${stat.changeFromPrevious > 0 ? '+' : ''}${stat.changeFromPrevious.toFixed(1)}%` : 'N/A',
    ]);

    const summaryLabel = language === 'zh' ? '汇总' : 'Summary';
    const avgConversionLabel = language === 'zh' ? '平均转化率' : 'Average Conversion Rate';
    const bestPeriodLabel = language === 'zh' ? '最佳时期' : 'Best Period';
    const worstPeriodLabel = language === 'zh' ? '最差时期' : 'Worst Period';
    const totalLabel = language === 'zh' ? '总计' : 'Total';

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      summaryLabel,
      `${totalLabel},${result.summary.grandTotal}`,
      `${avgConversionLabel},${result.summary.avgConversionRate.toFixed(1)}%`,
      `${bestPeriodLabel},${result.summary.bestPeriod}`,
      `${worstPeriodLabel},${result.summary.worstPeriod}`,
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
            {translations.comparisonReport.title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{translations.comparisonReport.subtitle}</p>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
        {/* Comparison Type */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
            <Calendar className="h-4 w-4 mr-1" />
            {translations.comparisonReport.comparisonType}
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
              📅 {translations.comparisonReport.monthly}
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
              📊 {translations.comparisonReport.quarterly}
            </button>
          </div>
        </div>

        {/* Period Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            {translations.comparisonReport.selectPeriods} ({selectedPeriods.length}/6)
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

        {/* Filters Section Header */}
        <div className="flex items-center gap-2 pt-1">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">
            {language === 'zh' ? '数据筛选' : 'Data Filters'}
          </span>
          {(coreFlags.length > 0 || cnOffice || selectedProducts.length > 0 || selectedCountries.length > 0) && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
              {[coreFlags.length, cnOffice ? 1 : 0, selectedProducts.length, selectedCountries.length].reduce((a, b) => a + b, 0)}{' '}
              {language === 'zh' ? '项已选' : 'active'}
            </span>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Core Flag */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Flag className="h-4 w-4 mr-1 text-gray-500" />
              Core Flag
              <span className="ml-1 text-xs text-gray-400">({language === 'zh' ? '可选' : 'Optional'})</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => toggleCoreFlag('Core')}
                className={`flex-1 px-3 py-2 text-sm border-2 rounded-lg transition font-medium ${
                  coreFlags.includes('Core')
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                }`}
              >
                CORE
              </button>
              <button
                onClick={() => toggleCoreFlag('Non_Core')}
                className={`flex-1 px-3 py-2 text-sm border-2 rounded-lg transition font-medium ${
                  coreFlags.includes('Non_Core')
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                }`}
              >
                NON CORE
              </button>
            </div>
          </div>

          {/* CN Office */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 mr-1 text-gray-500" />
              {translations.enhancedDashboard.cnOffice}
              <span className="ml-1 text-xs text-gray-400">({language === 'zh' ? '可选' : 'Optional'})</span>
            </label>
            <select
              value={cnOffice}
              onChange={(e) => setCnOffice(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              {cnOffices.map((office) => (
                <option key={office.value} value={office.value}>
                  {office.label}
                </option>
              ))}
            </select>
          </div>

          {/* Product Code */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Package className="h-4 w-4 mr-1 text-gray-500" />
              {language === 'zh' ? '产品类型' : 'Product Type'}
              {selectedProducts.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                  {selectedProducts.length}
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
              {PRODUCT_OPTIONS.map((prod) => (
                <label
                  key={prod.value}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer text-sm border transition-all ${
                    selectedProducts.includes(prod.value)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(prod.value)}
                    onChange={() => toggleProduct(prod.value)}
                    className="sr-only"
                  />
                  {prod.label}
                </label>
              ))}
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 mr-1 text-gray-500" />
              {language === 'zh' ? '目的国' : 'Country'}
              {selectedCountries.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                  {selectedCountries.length}
                </span>
              )}
            </label>
            {availableCountries.length > 0 ? (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                {/* Country search */}
                <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
                  <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder={language === 'zh' ? '搜索国家...' : 'Search countries...'}
                    className="w-full text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  />
                  {countrySearch && (
                    <button onClick={() => setCountrySearch('')} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  )}
                </div>
                <div className="max-h-36 overflow-y-auto p-1.5 grid grid-cols-2 gap-0.5">
                  {filteredCountries.map((c) => (
                    <label
                      key={c.countryCode}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs transition-colors ${
                        selectedCountries.includes(c.countryCode)
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCountries.includes(c.countryCode)}
                        onChange={() => toggleCountry(c.countryCode)}
                        className="rounded border-gray-300 text-blue-600 w-3 h-3 flex-shrink-0"
                      />
                      <span className="truncate" title={language === 'zh' && c.countryNameCn ? c.countryNameCn : c.countryNameEn}>
                        {language === 'zh' && c.countryNameCn ? c.countryNameCn : c.countryNameEn}
                      </span>
                    </label>
                  ))}
                  {filteredCountries.length === 0 && (
                    <span className="col-span-2 text-xs text-gray-400 text-center py-2">
                      {language === 'zh' ? '无匹配结果' : 'No results'}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 py-2">{language === 'zh' ? '加载中...' : 'Loading countries...'}</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={handleCompare}
            disabled={loading || selectedPeriods.length < 2}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition font-semibold"
          >
            {loading ? (language === 'zh' ? '分析中...' : 'Analyzing...') : translations.comparisonReport.compare}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-semibold"
          >
            {translations.filters.clearFilters}
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
              <p className="text-sm text-gray-600 mb-1">{translations.statistics.totalEnquiries}</p>
              <p className="text-3xl font-bold text-gray-900">{result.summary.grandTotal}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">{language === 'zh' ? '平均转化率' : 'Avg Conversion Rate'}</p>
              <p className="text-3xl font-bold text-green-600">
                {result.summary.avgConversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1 flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                {language === 'zh' ? '最佳时期' : 'Best Period'}
              </p>
              <p className="text-2xl font-bold text-green-600">{result.summary.bestPeriod}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-1 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {language === 'zh' ? '最差时期' : 'Worst Period'}
              </p>
              <p className="text-2xl font-bold text-red-600">{result.summary.worstPeriod}</p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{language === 'zh' ? '详细对比' : 'Detailed Comparison'}</h3>
              <button
                onClick={exportToCSV}
                className="flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                <Download className="h-4 w-4 mr-1" />
                {translations.actions.downloadReport}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      {language === 'zh' ? '时期' : 'Period'}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      {translations.statistics.totalEnquiries}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      {translations.statistics.quoted}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      {translations.statistics.confirmed}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      {language === 'zh' ? '转化率' : 'Conversion Rate'}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      {language === 'zh' ? '环比变化' : 'MoM Change'}
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
