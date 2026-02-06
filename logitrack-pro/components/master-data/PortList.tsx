import React, { useState, useEffect, useMemo } from 'react';
import { masterDataApi } from '../../services/api';
import { Port, Country } from '../../types';
import { Edit, Trash2, Plus, Loader2, Save, X, Ship, Plane, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PortList: React.FC = () => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Partial<Port>>({});
  
  // Pagination and filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SEA' | 'AIR'>('ALL');
  const [filterCountry, setFilterCountry] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [portsData, countriesData] = await Promise.all([
        masterDataApi.getPorts(),
        masterDataApi.getCountries()
      ]);
      setPorts(portsData);
      setCountries(countriesData);
    } catch (err) {
      const errorMsg = 'Failed to load data';
      setError(errorMsg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const port = ports.find(p => p.id === id);
    if (!window.confirm(`Are you sure you want to delete port ${port?.portCode}?`)) return;
    
    try {
      await masterDataApi.deletePort(id);
      setPorts(ports.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert(`Failed to delete port ${port?.portCode}`);
    }
  };

  const handleEdit = (port: Port) => {
    setEditingPort(port);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPort({ isActive: true, portType: 'SEA' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await masterDataApi.savePort(editingPort as Port);
      if (editingPort.id) {
        setPorts(ports.map(p => p.id === saved.id ? saved : p));
      } else {
        setPorts([...ports, saved]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save port');
    }
  };

  // Filter and paginate ports with memoization for performance
  const filteredPorts = useMemo(() => {
    return ports.filter(port => {
      const matchesSearch = !searchTerm || 
        port.portCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        port.portName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (port.city && port.city.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'ALL' || port.portType === filterType;
      const matchesCountry = !filterCountry || port.countryCode === filterCountry;
      
      return matchesSearch && matchesType && matchesCountry;
    });
  }, [ports, searchTerm, filterType, filterCountry]);

  const totalPages = Math.ceil(filteredPorts.length / itemsPerPage);
  
  const paginatedPorts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPorts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPorts, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterCountry]);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Port Management</h1>
          <button
            onClick={handleAddNew}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Port
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
                placeholder="Search ports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            {/* Port Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              <option value="SEA">Sea Port</option>
              <option value="AIR">Airport</option>
            </select>
            
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
            
            {/* Results Info */}
            <div className="flex items-center justify-end text-sm text-gray-600">
              Showing {paginatedPorts.length} of {filteredPorts.length} ports
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Port Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPorts.map((port) => (
              <tr key={port.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{port.portCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{port.portName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    {port.portType === 'SEA' ? <Ship className="w-4 h-4 text-blue-500" /> : <Plane className="w-4 h-4 text-sky-500" />}
                    {port.portType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{port.countryCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{port.city}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${port.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {port.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-4">
                    <button 
                      onClick={() => handleEdit(port)} 
                      className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(port.id)} 
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
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
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
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editingPort.id ? 'Edit Port' : 'Add Port'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Port Code</label>
                  <input
                    type="text"
                    required
                    value={editingPort.portCode || ''}
                    onChange={e => setEditingPort({ ...editingPort, portCode: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Port Type</label>
                  <select
                    value={editingPort.portType || 'SEA'}
                    onChange={e => setEditingPort({ ...editingPort, portType: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  >
                    <option value="SEA">SEA</option>
                    <option value="AIR">AIR</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Port Name</label>
                  <input
                    type="text"
                    required
                    value={editingPort.portName || ''}
                    onChange={e => setEditingPort({ ...editingPort, portName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <select
                    value={editingPort.countryCode || ''}
                    onChange={e => setEditingPort({ ...editingPort, countryCode: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  >
                    <option value="">Select Country...</option>
                    {countries.map(c => (
                      <option key={c.countryCode} value={c.countryCode}>
                         {c.countryCode} - {c.countryNameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={editingPort.city || ''}
                    onChange={e => setEditingPort({ ...editingPort, city: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div className="col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPort.isActive ?? true}
                    onChange={e => setEditingPort({ ...editingPort, isActive: e.target.checked })}
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
    </div>
  );
};

export default PortList;
