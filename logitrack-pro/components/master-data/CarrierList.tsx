import React, { useState, useEffect } from 'react';
import { masterDataApi } from '../../services/api';
import { Carrier } from '../../types';
import { Edit, Trash2, Plus, Loader2, Save, X, Ship } from 'lucide-react';
import Toast, { useToast, parseApiError } from '../common/Toast';

const CarrierList: React.FC = () => {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Partial<Carrier>>({});
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await masterDataApi.getCarrierList();
      setCarriers(data);
    } catch (err) {
      setError('Failed to load carriers');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this carrier?')) return;
    try {
      await masterDataApi.deleteCarrier(id);
      setCarriers(carriers.filter(c => c.id !== id));
      showToast('Carrier deleted successfully', 'success');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to delete carrier'), 'error');
    }
  };

  const handleEdit = (carrier: Carrier) => {
    setEditingCarrier(carrier);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCarrier({ isActive: true, sortOrder: carriers.length + 1 });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await masterDataApi.saveCarrier(editingCarrier as Carrier);
      if (editingCarrier.id) {
        setCarriers(carriers.map(c => c.id === saved.id ? saved : c));
      } else {
        setCarriers([...carriers, saved]);
      }
      setIsModalOpen(false);
      showToast(
        editingCarrier.id ? 'Carrier updated successfully' : 'Carrier created successfully',
        'success'
      );
    } catch (err) {
      showToast(parseApiError(err, 'Failed to save carrier'), 'error');
      console.error(err);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Carrier Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage shipping carriers for FCL/BUYER-CONSOL price details</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Carrier
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {carriers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  No carriers found. Click "Add Carrier" to create one.
                </td>
              </tr>
            ) : (
              carriers.map((carrier) => (
                <tr key={carrier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Ship className="w-4 h-4 text-gray-400" />
                    {carrier.carrierCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{carrier.carrierName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{carrier.sortOrder}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${carrier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {carrier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(carrier)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(carrier.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCarrier.id ? 'Edit Carrier' : 'Add Carrier'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Carrier Code <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs text-gray-400 font-normal">(max 30 chars)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={editingCarrier.carrierCode || ''}
                    onChange={e => setEditingCarrier({ ...editingCarrier, carrierCode: e.target.value.toUpperCase() })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder="e.g. MSC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Carrier Name <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs text-gray-400 font-normal">(max 100 chars)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={editingCarrier.carrierName || ''}
                    onChange={e => setEditingCarrier({ ...editingCarrier, carrierName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder="e.g. Mediterranean Shipping Company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCarrier.sortOrder ?? 0}
                    onChange={e => setEditingCarrier({ ...editingCarrier, sortOrder: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingCarrier.isActive ?? true}
                    onChange={e => setEditingCarrier({ ...editingCarrier, isActive: e.target.checked })}
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  );
};

export default CarrierList;
