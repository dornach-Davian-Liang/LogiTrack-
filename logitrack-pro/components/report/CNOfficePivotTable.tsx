// ============================================================
// CNOfficePivotTable - CN Office 统计数据表
// ============================================================

import React, { useState } from 'react';
import { Building2, TrendingUp, TrendingDown, Download, ChevronRight } from 'lucide-react';
import { CNOfficeStat } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface CNOfficePivotTableProps {
  data: CNOfficeStat[];
  onRowClick?: (office: CNOfficeStat) => void;
  onStatusCardClick?: (office: CNOfficeStat, status: 'yes' | 'rejected' | 'invalid' | 'pending') => void;
}

export const CNOfficePivotTable: React.FC<CNOfficePivotTableProps> = ({ data, onRowClick, onStatusCardClick }) => {
  const { language, translations } = useLanguage();
  const [expandedOffice, setExpandedOffice] = useState<string | null>(null);
  
  const sortedData = [...data].sort((a, b) => b.totalEnquiries - a.totalEnquiries);
  const totalEnquiries = sortedData.reduce((sum, item) => sum + item.totalEnquiries, 0);
  const totalYes = sortedData.reduce((sum, item) => sum + item.yes, 0);
  const totalRejected = sortedData.reduce((sum, item) => sum + item.rejected, 0);
  const totalInvalid = sortedData.reduce((sum, item) => sum + item.invalid, 0);
  const totalPending = sortedData.reduce((sum, item) => sum + item.pending, 0);
  
  const normalizeRate = (value: number | string | null | undefined) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const parsed = Number.parseFloat(String(value ?? 0));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const avgConversionRate = totalEnquiries > 0
    ? sortedData.reduce((sum, item) => sum + normalizeRate(item.conversionRate) * item.totalEnquiries, 0) / totalEnquiries
    : 0;

  const exportToCSV = () => {
    const headers = [
      translations.cnOfficeStats.office,
      translations.cnOfficeStats.totalEnquiries,
      translations.cnOfficeStats.yes,
      translations.cnOfficeStats.rejected,
      translations.cnOfficeStats.invalid,
      translations.cnOfficeStats.pending,
      translations.cnOfficeStats.conversionRate
    ];
    const rows = sortedData.map((item) => [
      item.officeName,
      item.totalEnquiries,
      item.yes,
      item.rejected,
      item.invalid,
      item.pending,
      `${normalizeRate(item.conversionRate).toFixed(1)}%`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cn_office_stats_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'yes':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'invalid':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">{translations.cnOfficeStats.noData}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">{translations.cnOfficeStats.title}</h3>
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
            {sortedData.length} {translations.cnOfficeStats.officesCount}
          </span>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
        >
          <Download className="h-4 w-4 mr-1" />
          {translations.cnOfficeStats.exportCSV}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3 p-4 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">{translations.cnOfficeStats.totalEnquiries}</p>
          <p className="text-2xl font-bold text-gray-900">{totalEnquiries}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-green-600 mb-1 font-semibold">{translations.cnOfficeStats.yes}</p>
          <p className="text-2xl font-bold text-green-600">{totalYes}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-red-600 mb-1 font-semibold">{translations.cnOfficeStats.rejected}</p>
          <p className="text-2xl font-bold text-red-600">{totalRejected}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-yellow-600 mb-1 font-semibold">{translations.cnOfficeStats.invalid}</p>
          <p className="text-2xl font-bold text-yellow-600">{totalInvalid}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1 font-semibold">{translations.cnOfficeStats.pending}</p>
          <p className="text-2xl font-bold text-gray-600">{totalPending}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                {translations.cnOfficeStats.rank}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {translations.cnOfficeStats.office}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {translations.cnOfficeStats.totalEnquiries}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {translations.cnOfficeStats.yes}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {translations.cnOfficeStats.rejected}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {translations.cnOfficeStats.invalid}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {translations.cnOfficeStats.pending}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {translations.cnOfficeStats.conversionRate}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                {translations.cnOfficeStats.action}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map((item, index) => {
              const conversionRate = normalizeRate(item.conversionRate);
              const percentage = totalEnquiries > 0
                ? ((item.totalEnquiries / totalEnquiries) * 100).toFixed(1)
                : '0.0';

              return (
                <React.Fragment key={item.officeName}>
                  <tr 
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => {
                      setExpandedOffice(expandedOffice === item.officeName ? null : item.officeName);
                      onRowClick?.(item);
                    }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 font-bold">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.officeName}</p>
                        <p className="text-xs text-gray-500">{percentage}% of total</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-gray-900 cursor-pointer hover:text-indigo-600">
                        {item.totalEnquiries}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor('yes')} cursor-pointer hover:opacity-80`}>
                        {item.yes}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor('rejected')} cursor-pointer hover:opacity-80`}>
                        {item.rejected}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor('invalid')} cursor-pointer hover:opacity-80`}>
                        {item.invalid}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor('pending')} cursor-pointer hover:opacity-80`}>
                        {item.pending}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expandedOffice === item.officeName ? 'rotate-90' : ''}`} />
                    </td>
                  </tr>
                  {expandedOffice === item.officeName && (
                    <tr className="bg-blue-50 border-b border-gray-200">
                      <td colSpan={9} className="p-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div 
                            onClick={() => onStatusCardClick?.(item, 'yes')}
                            className="bg-white p-3 rounded border border-green-200 cursor-pointer hover:bg-green-50 hover:shadow-md transition"
                          >
                            <p className="text-xs text-gray-600 mb-1">{translations.cnOfficeStats.yesDetails}</p>
                            <p className="text-2xl font-bold text-green-600">{item.yes}</p>
                            <p className="text-xs text-green-600 font-medium mt-2">{translations.cnOfficeStats.clickToView}</p>
                          </div>
                          <div 
                            onClick={() => onStatusCardClick?.(item, 'rejected')}
                            className="bg-white p-3 rounded border border-red-200 cursor-pointer hover:bg-red-50 hover:shadow-md transition"
                          >
                            <p className="text-xs text-gray-600 mb-1">{translations.cnOfficeStats.rejectedDetails}</p>
                            <p className="text-2xl font-bold text-red-600">{item.rejected}</p>
                            <p className="text-xs text-red-600 font-medium mt-2">{translations.cnOfficeStats.clickToView}</p>
                          </div>
                          <div 
                            onClick={() => onStatusCardClick?.(item, 'invalid')}
                            className="bg-white p-3 rounded border border-yellow-200 cursor-pointer hover:bg-yellow-50 hover:shadow-md transition"
                          >
                            <p className="text-xs text-gray-600 mb-1">{translations.cnOfficeStats.invalidDetails}</p>
                            <p className="text-2xl font-bold text-yellow-600">{item.invalid}</p>
                            <p className="text-xs text-yellow-600 font-medium mt-2">{translations.cnOfficeStats.clickToView}</p>
                          </div>
                          <div 
                            onClick={() => onStatusCardClick?.(item, 'pending')}
                            className="bg-white p-3 rounded border border-gray-300 cursor-pointer hover:bg-gray-50 hover:shadow-md transition"
                          >
                            <p className="text-xs text-gray-600 mb-1">{translations.cnOfficeStats.pendingDetails}</p>
                            <p className="text-2xl font-bold text-gray-600">{item.pending}</p>
                            <p className="text-xs text-gray-600 font-medium mt-2">{translations.cnOfficeStats.clickToView}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
