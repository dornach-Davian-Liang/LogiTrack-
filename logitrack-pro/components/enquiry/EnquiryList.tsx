import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Eye, Edit, Copy, Trash2, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, TrendingUp, X } from 'lucide-react';
import { Enquiry, EnquiryListItem, EnquiryStatus, SelectOption, PortSelectOption } from '../../types';
import { enquiryApi, masterDataApi } from '../../services/api';

interface EnquiryListProps {
  onViewDetail: (enquiry: Enquiry) => void;
  onEdit: (enquiry: Enquiry) => void;
  onNewEnquiry: () => void;
  canCreate: boolean;
  canManage: boolean;
}

export const EnquiryList: React.FC<EnquiryListProps> = ({ onViewDetail, onEdit, onNewEnquiry, canCreate, canManage }) => {
  const [enquiries, setEnquiries] = useState<EnquiryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | ''>('');
  const [cargoTypeFilter, setCargoTypeFilter] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  const [polFilter, setPolFilter] = useState<number | null>(null);
  const [podFilter, setPodFilter] = useState<number | null>(null);
  const [polLabel, setPolLabel] = useState('');
  const [podLabel, setPodLabel] = useState('');

  // Office options
  const [officeOptions, setOfficeOptions] = useState<SelectOption[]>([]);

  // Port search state for POL/POD filters
  const [polSearchTerm, setPolSearchTerm] = useState('');
  const [podSearchTerm, setPodSearchTerm] = useState('');
  const [polSearchResults, setPolSearchResults] = useState<PortSelectOption[]>([]);
  const [podSearchResults, setPodSearchResults] = useState<PortSelectOption[]>([]);
  const [showPolDropdown, setShowPolDropdown] = useState(false);
  const [showPodDropdown, setShowPodDropdown] = useState(false);
  const polRef = useRef<HTMLDivElement>(null);
  const podRef = useRef<HTMLDivElement>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Load office options on mount
  useEffect(() => {
    masterDataApi.getCnOffices().then(setOfficeOptions).catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (polRef.current && !polRef.current.contains(e.target as Node)) setShowPolDropdown(false);
      if (podRef.current && !podRef.current.contains(e.target as Node)) setShowPodDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced port search
  const searchPortsDebounced = useCallback((term: string, setter: (r: PortSelectOption[]) => void) => {
    if (term.length < 2) { setter([]); return; }
    const timer = setTimeout(async () => {
      try {
        // Search all port types (SEA + AIR)
        const [seaResults, airResults] = await Promise.all([
          masterDataApi.searchPorts('SEA', term),
          masterDataApi.searchPorts('AIR', term),
        ]);
        setter([...seaResults, ...airResults]);
      } catch { setter([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanup = searchPortsDebounced(polSearchTerm, setPolSearchResults);
    return cleanup;
  }, [polSearchTerm]);

  useEffect(() => {
    const cleanup = searchPortsDebounced(podSearchTerm, setPodSearchResults);
    return cleanup;
  }, [podSearchTerm]);

  useEffect(() => {
    fetchEnquiries();
  }, [currentPage, pageSize, searchTerm, statusFilter, cargoTypeFilter, officeFilter, polFilter, podFilter]);

  const fetchEnquiries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await enquiryApi.list({
        page: Math.max(0, currentPage - 1),
        pageSize,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        cargoType: cargoTypeFilter || undefined,
        assignedCnOffice: officeFilter || undefined,
        polPortId: polFilter || undefined,
        podPortId: podFilter || undefined,
      });
      console.log('[EnquiryList] API response:', {
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        contentLength: response.content?.length,
        firstItem: response.content?.[0]
      });
      setEnquiries(response.content);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError('Failed to load enquiries');
      console.error('[EnquiryList] Error loading enquiries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;
    
    try {
      await enquiryApi.delete(id);
      fetchEnquiries();
    } catch (err) {
      alert('Failed to delete enquiry');
      console.error(err);
    }
  };

  /** 深度清理子记录的 ID，确保 copy/increase 创建全新记录 */
  const cleanChildIds = (enquiryData: any) => {
    // 清理 route groups
    if (enquiryData.routeGroups) {
      enquiryData.routeGroups = enquiryData.routeGroups.map((rg: any, idx: number) => ({
        ...rg,
        id: undefined,
        enquiryId: undefined,
        groupIndex: rg.groupIndex ?? idx,
      }));
    }
    // 清理 offers → priceLines → containerDetails
    if (enquiryData.offers) {
      enquiryData.offers = enquiryData.offers.map((offer: any) => ({
        ...offer,
        id: undefined,
        priceLines: (offer.priceLines || []).map((pl: any) => ({
          ...pl,
          id: undefined,
          routeGroupId: undefined, // 新建时由后端回填
          containerDetails: (pl.containerDetails || []).map((cd: any) => ({
            ...cd,
            id: undefined,
          })),
        })),
      }));
    }
    return enquiryData;
  };

  const handleCopy = async (enquiry: EnquiryListItem) => {
    try {
      console.log('[handleCopy] enquiry:', enquiry);
      if (!enquiry.id) {
        alert('Invalid enquiry: missing ID');
        console.error('[handleCopy] enquiry missing id:', enquiry);
        return;
      }
      
      // ✅ 先加载完整的Enquiry数据（包含polIds/podIds等）
      const fullEnquiry = await enquiryApi.getById(enquiry.id);
      
      const today = new Date().toISOString().split('T')[0];
      const copied = cleanChildIds({
        ...fullEnquiry,
        id: undefined,
        refNumber: undefined,
        status: 'New' as EnquiryStatus,
        enquiryReceivedDate: today,
        enquiryCreatedDate: today,
      });
      onEdit(copied as Enquiry);
    } catch (err) {
      alert('Failed to copy enquiry');
      console.error('[handleCopy] error:', err);
    }
  };

  const handleIncrease = async (enquiry: EnquiryListItem) => {
    try {
      console.log('[handleIncrease] enquiry:', enquiry);
      if (!enquiry.id) {
        alert('Invalid enquiry: missing ID');
        console.error('[handleIncrease] enquiry missing id:', enquiry);
        return;
      }
      
      // ✅ 先加载完整的Enquiry数据（包含polIds/podIds等）
      const fullEnquiry = await enquiryApi.getById(enquiry.id);
      const preview = await enquiryApi.getIncreaseReference(enquiry.id);
      const copied = cleanChildIds({
        ...fullEnquiry,
        id: undefined,
        refNumber: preview.referenceNumber,
        monthlySequence: preview.monthlySequence,
        serialNumber: preview.serialNumber,  // > 0 tells backend this is an increase
        productAbbr: preview.productAbbr,
        status: 'New' as EnquiryStatus,
        enquiryReceivedDate: new Date().toISOString().split('T')[0],
        enquiryCreatedDate: fullEnquiry.enquiryCreatedDate,
      });
      onEdit(copied as Enquiry);
    } catch (err) {
      alert('Failed to generate increase reference');
      console.error('[handleIncrease] error:', err);
    }
  };

  const getStatusColor = (status: EnquiryStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Quoted & Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Secured': return 'bg-green-100 text-green-800';
      case 'Lost': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Enquiry Management</h1>
        {canCreate && (
          <button
            onClick={onNewEnquiry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Enquiry
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Row 1: Search, Status, CargoType, PageSize */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EnquiryStatus | '')}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="New">New</option>
            <option value="Quoted & Pending">Quoted & Pending</option>
            <option value="Secured">Secured</option>
            <option value="Lost">Lost</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={cargoTypeFilter}
            onChange={(e) => setCargoTypeFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Cargo Types</option>
            <option value="FCL">FCL</option>
            <option value="LCL">LCL</option>
            <option value="AIR">AIR</option>
            <option value="BUYER-CONSOL">BUYER-CONSOL</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>

        {/* Row 2: Office, POL, POD filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          {/* Office Filter */}
          <select
            value={officeFilter}
            onChange={(e) => { setOfficeFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Offices</option>
            {officeOptions.map(o => (
              <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
            ))}
          </select>

          {/* POL Search Filter */}
          <div ref={polRef} className="relative">
            <div className="flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={polLabel || "Filter by POL..."}
                  value={polSearchTerm}
                  onChange={(e) => { setPolSearchTerm(e.target.value); setShowPolDropdown(true); }}
                  onFocus={() => { if (polSearchTerm.length >= 2) setShowPolDropdown(true); }}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${polFilter ? 'pr-8 bg-indigo-50 border-indigo-300' : ''}`}
                />
                {polFilter && (
                  <button
                    type="button"
                    onClick={() => { setPolFilter(null); setPolLabel(''); setPolSearchTerm(''); setCurrentPage(1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {showPolDropdown && polSearchResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {polSearchResults.map(port => (
                  <button
                    key={String(port.value)}
                    type="button"
                    onClick={() => {
                      setPolFilter(Number(port.value));
                      setPolLabel(port.label);
                      setPolSearchTerm('');
                      setShowPolDropdown(false);
                      setCurrentPage(1);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 border-b border-gray-50 last:border-0"
                  >
                    <span className="font-medium">{port.portCode}</span>
                    <span className="text-gray-500 ml-1">- {port.label.replace(port.portCode + ' - ', '')}</span>
                    <span className="text-xs text-gray-400 ml-1 uppercase">({port.portType})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* POD Search Filter */}
          <div ref={podRef} className="relative">
            <div className="flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={podLabel || "Filter by POD..."}
                  value={podSearchTerm}
                  onChange={(e) => { setPodSearchTerm(e.target.value); setShowPodDropdown(true); }}
                  onFocus={() => { if (podSearchTerm.length >= 2) setShowPodDropdown(true); }}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${podFilter ? 'pr-8 bg-indigo-50 border-indigo-300' : ''}`}
                />
                {podFilter && (
                  <button
                    type="button"
                    onClick={() => { setPodFilter(null); setPodLabel(''); setPodSearchTerm(''); setCurrentPage(1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {showPodDropdown && podSearchResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {podSearchResults.map(port => (
                  <button
                    key={String(port.value)}
                    type="button"
                    onClick={() => {
                      setPodFilter(Number(port.value));
                      setPodLabel(port.label);
                      setPodSearchTerm('');
                      setShowPodDropdown(false);
                      setCurrentPage(1);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 border-b border-gray-50 last:border-0"
                  >
                    <span className="font-medium">{port.portCode}</span>
                    <span className="text-gray-500 ml-1">- {port.label.replace(port.portCode + ' - ', '')}</span>
                    <span className="text-xs text-gray-400 ml-1 uppercase">({port.portType})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active filter tags */}
        {(officeFilter || polFilter || podFilter) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {officeFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-800">
                Office: {officeOptions.find(o => String(o.value) === officeFilter)?.label || officeFilter}
                <button onClick={() => { setOfficeFilter(''); setCurrentPage(1); }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            )}
            {polFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                POL: {polLabel}
                <button onClick={() => { setPolFilter(null); setPolLabel(''); setCurrentPage(1); }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            )}
            {podFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                POD: {podLabel}
                <button onClick={() => { setPodFilter(null); setPodLabel(''); setCurrentPage(1); }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Loading enquiries...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
            <button onClick={fetchEnquiries} className="mt-2 text-indigo-600 hover:underline">
              Retry
            </button>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No enquiries found</p>
            {canCreate && (
              <button onClick={onNewEnquiry} className="mt-2 text-indigo-600 hover:underline">
                Create your first enquiry
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {enquiry.refNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {enquiry.productCode || enquiry.productAbbr || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {enquiry.cargoTypeCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(enquiry.status)}`}>
                        {enquiry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {enquiry.enquiryReceivedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onViewDetail(enquiry as any)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => onEdit(enquiry as any)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopy(enquiry)}
                              className="text-green-600 hover:text-green-900"
                              title="Copy"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleIncrease(enquiry)}
                              className="text-teal-600 hover:text-teal-900"
                              title="Increase"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(enquiry.id!)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      title="First Page"
                    >
                      <ChevronsLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      title="Previous Page"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      title="Next Page"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      title="Last Page"
                    >
                      <ChevronsRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnquiryList;
