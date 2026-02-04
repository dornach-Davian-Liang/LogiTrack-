import React, { useState, useEffect } from 'react';
import { masterDataApi } from '../../services/api';
import { SalesPic, Country, SalesOffice } from '../../types';
import { Edit, Trash2, Plus, Loader2, Save, X, User } from 'lucide-react';

const SalesPicList: React.FC = () => {
  const [salesPics, setSalesPics] = useState<SalesPic[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [salesOffices, setSalesOffices] = useState<SalesOffice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPic, setEditingPic] = useState<Partial<SalesPic>>({});

  // Derived state for form
  const [availableOffices, setAvailableOffices] = useState<SalesOffice[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
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
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (editingPic.countryCode) {
      setAvailableOffices(salesOffices.filter(o => o.countryCode === editingPic.countryCode));
    } else {
      setAvailableOffices([]);
    }
  }, [editingPic.countryCode, salesOffices]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this sales person?')) return;
    try {
      await masterDataApi.deleteSalesPic(id);
      setSalesPics(salesPics.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete sales person');
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
    } catch (err) {
      alert('Failed to save sales person');
      console.error(err);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales PIC Management</h1>
        <button
          onClick={handleAddNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Sales PIC
        </button>
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
            {salesPics.map((pic) => (
              <tr key={pic.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {pic.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pic.countryCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pic.salesOfficeName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pic.salesOfficeCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pic.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {pic.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(pic)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(pic.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                    value={editingPic.countryCode || ''}
                    onChange={e => setEditingPic({ ...editingPic, countryCode: e.target.value, salesOfficeId: undefined })}
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
                    disabled={!editingPic.countryCode}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 disabled:bg-gray-100"
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
    </div>
  );
};

export default SalesPicList;
