// ============================================================
// EnquiryListModal - CN Office状态详情弹窗
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, Eye, Edit, Search, Loader2 } from 'lucide-react';
import { EnquiryListItem, BookingStatus, DashboardFilterParams } from '../../types';
import { reportApi } from '../../services/reportApi';
import { useLanguage } from '../../i18n/LanguageContext';

interface EnquiryListModalProps {
  isOpen: boolean;
  onClose: () => void;
  officeName: string;
  bookingStatus: 'yes' | 'rejected' | 'invalid' | 'pending';
  onViewDetail: (enquiry: EnquiryListItem) => void;
  onEdit: (enquiry: EnquiryListItem) => void;
  canManage: boolean;
  filter?: DashboardFilterParams | null; // ✅ 新增：当前 Data Filter 条件
}

export const EnquiryListModal: React.FC<EnquiryListModalProps> = ({
  isOpen,
  onClose,
  officeName,
  bookingStatus,
  onViewDetail,
  onEdit,
  canManage,
  filter,
}) => {
  const { language, translations } = useLanguage();
  const [enquiries, setEnquiries] = useState<EnquiryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 映射前端status到后端BookingStatus字符串
  const getBackendStatus = (status: string): BookingStatus => {
    switch (status) {
      case 'yes':
        return 'Yes';
      case 'rejected':
        return 'Rejected';
      case 'invalid':
        return 'Invalid';  // ✅ 修复：之前错误返回空字符串导致 Invalid 始终为0
      case 'pending':
        return 'Pending';
      default:
        return 'Pending';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'yes':
        return translations.enquiryListModal.confirmed;
      case 'rejected':
        return translations.enquiryListModal.rejected;
      case 'invalid':
        return translations.enquiryListModal.invalid;
      case 'pending':
        return translations.enquiryListModal.pending;
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'yes':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'invalid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEnquiries();
    }
  }, [isOpen, officeName, bookingStatus, filter]);

  const fetchEnquiries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendStatus = getBackendStatus(bookingStatus);
      console.log('[Modal] Fetching office enquiries via backend API:', {
        officeName,
        bookingStatus,
        backendStatus,
        filter,
      });

      // ✅ 修复：使用专用后端 API，后端精确过滤，避免 pageSize=1000 截断问题
      if (!filter?.startDate || !filter?.endDate) {
        setEnquiries([]);
        return;
      }

      const items = await reportApi.getOfficeEnquiries({
        officeName,
        bookingStatus: backendStatus,
        startDate: filter.startDate,
        endDate: filter.endDate,
        coreFlags: filter.coreFlags,
        products: filter.products,
        countries: filter.countries,
      });

      console.log('[Modal] Backend returned:', items.length, 'records');
      setEnquiries(items as unknown as EnquiryListItem[]);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
      setError(translations.enquiryListModal.loadFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEnquiries = searchTerm
    ? enquiries.filter((e) =>
        e.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.salesPicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.commodity?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : enquiries;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-y-0 right-0 max-w-4xl w-full bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              {officeName} - {getStatusLabel(bookingStatus)}
            </h2>
            <p className="text-sm text-indigo-100 mt-1">
              {language === 'zh' ? `共 ${filteredEnquiries.length} 条${translations.enquiryListModal.totalRecords}` : `${filteredEnquiries.length} ${translations.enquiryListModal.totalRecords}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-indigo-800 rounded-lg transition text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={translations.enquiryListModal.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">{translations.enquiryListModal.loading}</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 bg-red-50 rounded-lg p-6">
              {error}
              <button
                onClick={fetchEnquiries}
                className="mt-2 text-indigo-600 hover:underline block mx-auto"
              >
                {translations.enquiryListModal.retry}
              </button>
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">{translations.enquiryListModal.noData}</p>
              <p className="text-sm mt-2">{translations.enquiryListModal.noDataDesc}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEnquiries.map((enquiry) => (
                <div
                  key={enquiry.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Reference Number */}
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {enquiry.referenceNumber}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(bookingStatus)}`}>
                          {getStatusLabel(bookingStatus)}
                        </span>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {enquiry.status}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">{translations.enquiryListModal.salesPerson}:</span>
                          <span className="text-gray-900 font-medium">{enquiry.salesPicName}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">{translations.enquiryListModal.salesCountry}:</span>
                          <span className="text-gray-900">{enquiry.salesCountryCode}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">{translations.enquiryListModal.cargoType}:</span>
                          <span className="text-gray-900">{enquiry.cargoTypeCode}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">{translations.enquiryListModal.product}:</span>
                          <span className="text-gray-900">{enquiry.productAbbr}</span>
                        </div>
                        <div className="flex items-center col-span-2">
                          <span className="text-gray-500 w-24">{translations.enquiryListModal.route}:</span>
                          <span className="text-gray-900">
                            {enquiry.polName} → {enquiry.podName}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">{translations.enquiryListModal.receivedDate}:</span>
                          <span className="text-gray-900">{enquiry.enquiryReceivedDate}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">{translations.enquiryListModal.teu}:</span>
                          <span className="text-gray-900">{enquiry.quantityTeu || '-'}</span>
                        </div>
                      </div>

                      {/* Commodity */}
                      {enquiry.commodity && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">{translations.enquiryListModal.commodity}:</span>
                          <span className="text-gray-700 ml-2">{enquiry.commodity}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          onViewDetail(enquiry);
                          // 不关闭弹窗，由父组件管理状态
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title={translations.enquiryListModal.viewDetail}
                      >
                        <Eye className="h-5 w-5 text-gray-600" />
                      </button>
                      {canManage && (
                        <button
                          onClick={() => {
                            onEdit(enquiry);
                            // 不关闭弹窗，由父组件管理状态
                          }}
                          className="p-2 hover:bg-indigo-50 rounded-lg transition"
                          title={translations.enquiryListModal.edit}
                        >
                          <Edit className="h-5 w-5 text-indigo-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
          >
            {translations.enquiryListModal.close}
          </button>
        </div>
      </div>
    </div>
  );
};
