import React, { useState, useEffect } from 'react';
import { masterDataApi } from '../../services/api';
import { Country } from '../../types';
import { Edit, Trash2, Plus, Loader2, Save, X } from 'lucide-react';

const CountryList: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Partial<Country>>({});

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setIsLoading(true);
    try {
      const data = await masterDataApi.getCountries();
      setCountries(data);
    } catch (err) {
      setError('Failed to load countries');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this country?')) return;
    try {
      await masterDataApi.deleteCountry(id);
      setCountries(countries.filter(c => c.id !== id));
    } catch (err) {
      alert('Failed to delete country');
    }
  };

  const handleEdit = (country: Country) => {
    setEditingCountry(country);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCountry({ isActive: true });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await masterDataApi.saveCountry(editingCountry as Country);
      if (editingCountry.id) {
        setCountries(countries.map(c => c.id === saved.id ? saved : c));
      } else {
        setCountries([...countries, saved]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to save country');
      console.error(err);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Country Management</h1>
        <button
          onClick={handleAddNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Country
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">English Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chinese Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {countries.map((country) => (
              <tr key={country.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{country.countryCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{country.countryNameEn}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{country.countryNameCn}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${country.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {country.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(country)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(country.id)} className="text-red-600 hover:text-red-900">
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
              <h2 className="text-xl font-bold text-gray-900">{editingCountry.id ? 'Edit Country' : 'Add Country'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country Code</label>
                  <input
                    type="text"
                    required
                    value={editingCountry.countryCode || ''}
                    onChange={e => setEditingCountry({ ...editingCountry, countryCode: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">English Name</label>
                  <input
                    type="text"
                    required
                    value={editingCountry.countryNameEn || ''}
                    onChange={e => setEditingCountry({ ...editingCountry, countryNameEn: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chinese Name</label>
                  <input
                    type="text"
                    value={editingCountry.countryNameCn || ''}
                    onChange={e => setEditingCountry({ ...editingCountry, countryNameCn: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingCountry.isActive ?? true}
                    onChange={e => setEditingCountry({ ...editingCountry, isActive: e.target.checked })}
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

export default CountryList;
