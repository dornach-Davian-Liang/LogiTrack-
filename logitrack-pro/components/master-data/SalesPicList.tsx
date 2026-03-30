import React, { useState, useEffect, useMemo } from 'react';
import { masterDataApi } from '../../services/api';
import { SalesPic, Country, SalesOffice } from '../../types';
import { Edit, Trash2, Plus, Loader2, Save, X, User, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Toast, { useToast, parseApiError } from '../common/Toast';

const SalesPicList: React.FC = () => {
  const [salesPics, setSalesPics] = useState<SalesPic[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [salesOffices, setSalesOffices] = useState<SalesOffice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPic, setEditingPic] = useState<Partial<SalesPic>>({});
  const { toast, showToast, closeToast } = useToast();

  // Derived state for form
  const [availableOffices, setAvailableOffices] = useState<SalesOffice[]>([]);
  
  // Pagination and filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterOffice, setFilterOffice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [picsData, countriesData, officesData] = await Promise.all([
        masterDataApi.getSalesPics(),
        masterDataApi.getCountries(),
        masterDataApi.getSalesOffices()
      ]);
      setSalesPics(picsData);
      setCountries(countriesData);
      setSalesOffices(officesData);
    } catch (err) {
      const errorMsg = 'Failed to load data';
      setError(errorMsg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // salesOffices 加载完成后同步到 availableOffices（始终展示全部，不按国家过滤）
    setAvailableOffices(salesOffices);
  }, [salesOffices]);

  const handleDelete = async (id: number) => {
    const pic = salesPics.find(p => p.id === id);
    if (!window.confirm(`Are you sure you want to delete ${pic?.name}?`)) return;
    
    try {
      await masterDataApi.deleteSalesPic(id);
      setSalesPics(salesPics.filter(p => p.id !== id));
      showToast(`${pic?.name} deleted successfully`, 'success');
    } catch (err) {
      console.error(err);
      showToast(parseApiError(err, `Failed to delete ${pic?.name}`), 'error');
    }
  };

  const handleEdit = (pic: SalesPic) => {
    setEditingPic(pic);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPic({ isActive: true });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Enrich with office details before saving if changed
      const office = salesOffices.find(o => o.id === Number(editingPic.salesOfficeId));
      const picToSave = {
        ...editingPic,
        salesOfficeName: office?.name || editingPic.salesOfficeName,
        salesOfficeCode: office?.code || editingPic.salesOfficeCode
      } as SalesPic;

      const saved = await masterDataApi.saveSalesPic(picToSave);
      if (editingPic.id) {
        setSalesPics(salesPics.map(p => p.id === saved.id ? saved : p));
      } else {
        setSalesPics([...salesPics, saved]);
      }
      setIsModalOpen(false);
      showToast(editingPic.id ? 'Sales PIC updated successfully' : 'Sales PIC created successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast(parseApiError(err, 'Failed to save sales PIC'), 'error');
    }
  };

  // Filter and paginate sales PICs with memoization for performance
  const filteredPics = useMemo(() => {
    return salesPics.filter(pic => {
      const matchesSearch = !searchTerm || 
        pic.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pic.salesOfficeCode ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pic.salesOfficeName ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCountry = !filterCountry || pic.salesCountryCode === filterCountry;
      const matchesOffice = !filterOffice || (pic.salesOfficeCode ?? '') === filterOffice;
      
      return matchesSearch && matchesCountry && matchesOffice;
    });
  }, [salesPics, searchTerm, filterCountry, filterOffice]);

  const totalPages = Math.ceil(filteredPics.length / itemsPerPage);
  
  const paginatedPics = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPics.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPics, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCountry, filterOffice]);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Sales PIC Management</h1>
          <button
            onClick={handleAddNew}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Sales PIC
          </button>
        </div>
        
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sales PICs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            {/* Country Filter */}
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Countries</option>
              {countries.map(c => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.countryCode} - {c.countryNameEn}
                </option>
              ))}
            </select>
            
            {/* Office Filter */}
            <select
              value={filterOffice}
              onChange={(e) => setFilterOffice(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Offices</option>
              {salesOffices.map(o => (
                <option key={o.id} value={o.code}>
                  {o.code} - {o.name}
                </option>
              ))}
            </select>
            
            {/* Results Info */}
            <div className="flex items-center justify-end text-sm text-gray-600">
              Showing {paginatedPics.length} of {filteredPics.length} PICs
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPics.map((pic) => (
              <tr key={pic.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {pic.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pic.salesCountryCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pic.salesOfficeName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pic.salesOfficeCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pic.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {pic.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-4">
                    <button 
                      onClick={() => handleEdit(pic)} 
                      className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(pic.id)} 
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border rounded-md ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editingPic.id ? 'Edit Sales PIC' : 'Add Sales PIC'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <select
                    value={editingPic.salesCountryCode || ''}
                    onChange={e => setEditingPic({ ...editingPic, salesCountryCode: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  >
                    <option value="">Select Country...</option>
                    {countries.map(c => (
                      <option key={c.countryCode} value={c.countryCode}>
                        {c.countryNameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sales Office</label>
                  <select
                    value={editingPic.salesOfficeId || ''}
                    onChange={e => setEditingPic({ ...editingPic, salesOfficeId: Number(e.target.value) })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  >
                    <option value="">Select Office...</option>
                    {availableOffices.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                  </select>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={editingPic.name || ''}
                    onChange={e => setEditingPic({ ...editingPic, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPic.isActive ?? true}
                    onChange={e => setEditingPic({ ...editingPic, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  );
};

export default SalesPicList;
