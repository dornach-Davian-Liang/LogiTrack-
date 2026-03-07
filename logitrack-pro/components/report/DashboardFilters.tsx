// ============================================================
// DashboardFilters - Dashboard 过滤组件
// ============================================================

import React, { useState, useEffect } from 'react';
import { Filter, Calendar, Flag, Building2, X, Check, Package, Globe } from 'lucide-react';
import { DashboardFilterParams, Country } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { DatePickerInput } from '../DatePickerInput';
import { masterDataApi } from '../../services/api';

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
  const { language, translations } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCoreFlags, setSelectedCoreFlags] = useState<('CORE' | 'NON_CORE')[]>([]);
  const [cnOffice, setCnOffice] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);

  const PRODUCT_OPTIONS = [
    { value: 'AIR', label: 'AIR' },
    { value: 'SEA', label: 'SEA' },
    { value: 'SEA-AIR', label: 'SEA-AIR' },
    { value: 'RAIL', label: 'RAIL' },
    { value: 'RAIL-SEA', label: 'RAIL-SEA' },
  ];

  useEffect(() => {
    masterDataApi.getCountries().then(setAvailableCountries).catch(() => setAvailableCountries([]));
  }, []);

  const cnOffices = [
    { value: '', label: translations.filters.allOffices },
    { value: 'SHANGHAI', label: translations.offices.shanghai },
    { value: 'SHENZHEN', label: translations.offices.shenzhen },
    { value: 'BEIJING', label: translations.offices.beijing },
    { value: 'GUANGZHOU', label: translations.offices.guangzhou },
    { value: 'HONG KONG', label: translations.offices.hongkong },
    { value: 'CN-MULTI', label: translations.offices.multiOffice },
  ];

  const handleApply = () => {
    if (!startDate || !endDate) {
      alert(translations.filters.selectDateRange);
      return;
    }

    const filter: DashboardFilterParams = {
      startDate,
      endDate,
      coreFlags: selectedCoreFlags.length > 0 ? selectedCoreFlags : undefined,
      cnOffice: cnOffice || undefined,
      products: selectedProducts.length > 0 ? selectedProducts : undefined,
      countries: selectedCountries.length > 0 ? selectedCountries : undefined,
    };

    onApplyFilter(filter);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCoreFlags([]);
    setCnOffice('');
    setSelectedProducts([]);
    setSelectedCountries([]);
    onClearFilter();
  };

  const toggleCoreFlag = (flag: 'CORE' | 'NON_CORE') => {
    setSelectedCoreFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
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

  const hasActiveFilters = startDate || endDate || selectedCoreFlags.length > 0 || cnOffice || selectedProducts.length > 0 || selectedCountries.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-900">{translations.filters.dataFilter}</span>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              {translations.filters.applied}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showFilters ? translations.filters.collapse : translations.filters.expand}
        </button>
      </div>

      {/* Filter Content */}
      {showFilters && (
        <div className="p-4 space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <DatePickerInput
              label={translations.filters.startDate}
              value={startDate}
              onChange={(date) => setStartDate(date)}
              placeholder="YYYY/MM/DD"
            />
            <DatePickerInput
              label={translations.filters.endDate}
              value={endDate}
              onChange={(date) => setEndDate(date)}
              placeholder="YYYY/MM/DD"
            />
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
              {translations.filters.cnOffice}
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

          {/* Product */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Package className="h-4 w-4 mr-1" />
              {translations.filters.product}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => toggleProduct(p.value)}
                  className={`flex items-center px-3 py-1.5 border rounded-lg text-sm transition ${
                    selectedProducts.includes(p.value)
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {selectedProducts.includes(p.value) && <Check className="h-3 w-3 mr-1" />}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 mr-1" />
              {translations.filters.country}
            </label>
            {availableCountries.length > 0 ? (
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 grid grid-cols-2 gap-1">
                {availableCountries.map((c) => (
                  <label key={c.countryCode} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCountries.includes(c.countryCode)}
                      onChange={() => toggleCountry(c.countryCode)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-gray-700">{language === 'zh' && c.countryNameCn ? c.countryNameCn : c.countryNameEn}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">{translations.filters.allCountries}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleApply}
              disabled={loading || !startDate || !endDate}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition font-medium"
            >
              <Check className="h-4 w-4 mr-2" />
              {translations.filters.applyFilter}
            </button>
            <button
              onClick={handleClear}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
            >
              <X className="h-4 w-4 mr-2" />
              {translations.filters.clear}
            </button>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">{translations.filters.currentFilters}</p>
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
                {selectedProducts.map((prod) => (
                  <span key={prod} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                    📦 {prod}
                  </span>
                ))}
                {selectedCountries.map((code) => {
                  const found = availableCountries.find((c) => c.countryCode === code);
                  const label = found ? (language === 'zh' && found.countryNameCn ? found.countryNameCn : found.countryNameEn) : code;
                  return (
                    <span key={code} className="px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded">
                      🌍 {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
