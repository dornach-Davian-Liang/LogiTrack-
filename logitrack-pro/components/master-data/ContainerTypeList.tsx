import React, { useState, useEffect } from 'react';
import { masterDataApi } from '../../services/api';
import { ContainerType } from '../../types';
import { Edit, Trash2, Plus, Loader2, Save, X, Box } from 'lucide-react';
import Toast, { useToast, parseApiError } from '../common/Toast';

const ContainerTypeList: React.FC = () => {
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<Partial<ContainerType>>({});
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await masterDataApi.getContainerTypeList();
      setContainerTypes(data);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this container type?')) return;
    try {
      await masterDataApi.deleteContainerType(id);
      setContainerTypes(containerTypes.filter(c => c.id !== id));
      showToast('Container type deleted successfully', 'success');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to delete container type'), 'error');
    }
  };

  const handleEdit = (ct: ContainerType) => {
    setEditingType(ct);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingType({ isActive: true, isSpecial: false, teuValue: 1.0 });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await masterDataApi.saveContainerType(editingType as ContainerType);
      if (editingType.id) {
        setContainerTypes(containerTypes.map(c => c.id === saved.id ? saved : c));
      } else {
        setContainerTypes([...containerTypes, saved]);
      }
      setIsModalOpen(false);
      showToast(editingType.id ? 'Container type updated successfully' : 'Container type created successfully', 'success');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to save container type'), 'error');
      console.error(err);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Container Type Management</h1>
        <button
          onClick={handleAddNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Container Type
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TEU Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Length (ft)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {containerTypes.map((ct) => (
              <tr key={ct.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Box className="w-4 h-4 text-gray-400" />
                  {ct.containerCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ct.containerName}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ct.teuValue}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ct.lengthFeet}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ct.isSpecial ? 'Yes' : 'No'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ct.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {ct.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(ct)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(ct.id)} className="text-red-600 hover:text-red-900">
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
              <h2 className="text-xl font-bold text-gray-900">{editingType.id ? 'Edit Container Type' : 'Add Container Type'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Code
                    <span className="ml-1 text-xs text-gray-400 font-normal">(max 20 chars)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={editingType.containerCode || ''}
                    onChange={e => setEditingType({ ...editingType, containerCode: e.target.value.toUpperCase() })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder="e.g. 20GP"
                  />
                  <p className="mt-0.5 text-xs text-gray-400 text-right">{(editingType.containerCode || '').length}/20</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                    <span className="ml-1 text-xs text-gray-400 font-normal">(max 50 chars)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={editingType.containerName || ''}
                    onChange={e => setEditingType({ ...editingType, containerName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">TEU Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingType.teuValue || ''}
                    onChange={e => setEditingType({ ...editingType, teuValue: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Length (ft)</label>
                  <input
                    type="number"
                    required
                    value={editingType.lengthFeet || ''}
                    onChange={e => setEditingType({ ...editingType, lengthFeet: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={editingType.isSpecial ?? false}
                            onChange={e => setEditingType({ ...editingType, isSpecial: e.target.checked })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Special Type</label>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={editingType.isActive ?? true}
                            onChange={e => setEditingType({ ...editingType, isActive: e.target.checked })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Active</label>
                    </div>
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

export default ContainerTypeList;
