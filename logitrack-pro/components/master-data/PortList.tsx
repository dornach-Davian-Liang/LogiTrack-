import React, { useState, useEffect } from 'react';
import { masterDataApi } from '../../services/api';
import { Port, Country } from '../../types';
import { Edit, Trash2, Plus, Loader2, Save, X, Ship, Plane } from 'lucide-react';

const PortList: React.FC = () => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Partial<Port>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [portsData, countriesData] = await Promise.all([
        masterDataApi.getPorts(),
        masterDataApi.getCountries()
      ]);
      setPorts(portsData);
      setCountries(countriesData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this port?')) return;
    try {
      await masterDataApi.deletePort(id);
      setPorts(ports.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete port');
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
      alert('Failed to save port');
      console.error(err);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Port Management</h1>
        <button
          onClick={handleAddNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Port
        </button>
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
            {ports.map((port) => (
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
                  <button onClick={() => handleEdit(port)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(port.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
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
