import React, { useState, useEffect } from 'react';
import { masterDataApi } from '../../services/api';
import { Currency } from '../../types';
import { Edit, Trash2, Plus, Loader2, DollarSign } from 'lucide-react';
import Toast, { useToast, parseApiError } from '../common/Toast';

const CurrencyList: React.FC = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Currency>>({});
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await masterDataApi.getCurrencyList();
      setCurrencies(data);
    } catch (err) {
      showToast('Failed to load currencies', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditing({ isActive: true, sortOrder: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (c: Currency) => {
    setEditing({ ...c });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this currency?')) return;
    try {
      await masterDataApi.deleteCurrency(id);
      setCurrencies(currencies.filter(c => c.id !== id));
      showToast('Currency deleted', 'success');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to delete currency'), 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeOk = (editing.currencyCode || '').trim().length > 0;
    const nameOk = (editing.currencyName || '').trim().length > 0;
    if (!codeOk || !nameOk) {
      showToast('Code and Name are required', 'error');
      return;
    }
    try {
      const saved = await masterDataApi.saveCurrency(editing as Currency);
      if (editing.id) {
        setCurrencies(currencies.map(c => c.id === saved.id ? saved : c));
        showToast('Currency updated', 'success');
      } else {
        setCurrencies([...currencies, saved]);
        showToast('Currency created', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(parseApiError(err, 'Failed to save currency'), 'error');
    }
  };

  if (isLoading) return (
    <div className="flex justify-center p-8">
      <Loader2 className="animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Currency Management</h1>
        <button
          onClick={handleAddNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Currency
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currencies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No currencies yet</td>
              </tr>
            )}
            {currencies.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  {c.currencyCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.currencyName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.sortOrder}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id!)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editing.id ? 'Edit Currency' : 'New Currency'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={editing.currencyCode || ''}
                  onChange={e => setEditing({ ...editing, currencyCode: e.target.value.toUpperCase() })}
                  maxLength={10}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. USD"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency Name</label>
                <input
                  type="text"
                  value={editing.currencyName || ''}
                  onChange={e => setEditing({ ...editing, currencyName: e.target.value })}
                  maxLength={50}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. US Dollar"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={editing.sortOrder ?? 0}
                  onChange={e => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="currency-active"
                  checked={editing.isActive ?? true}
                  onChange={e => setEditing({ ...editing, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                />
                <label htmlFor="currency-active" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyList;
