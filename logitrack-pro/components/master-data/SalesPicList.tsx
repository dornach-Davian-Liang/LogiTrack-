import React, { useState, useEffect, useMemo } from 'react';
import { masterDataApi } from '../../services/api';
import { SalesPic, SalesCountry, SalesOffice } from '../../types';
import {
  Edit, Trash2, Plus, Loader2, Save, X, User, Search,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Globe, Building2, Users
} from 'lucide-react';
import Toast, { useToast, parseApiError } from '../common/Toast';

type TabType = 'countries' | 'offices' | 'pics';

// ==================== Reusable Pagination ====================
const Pagination: React.FC<{ current: number; total: number; onChange: (p: number) => void }> = ({ current, total, onChange }) => {
  if (total <= 1) return null;
  return (
    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
      <div className="text-sm text-gray-700">Page {current} of {total}</div>
      <div className="flex gap-2">
        <button onClick={() => onChange(1)} disabled={current === 1}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        {Array.from({ length: Math.min(5, total) }, (_, i) => {
          let p: number;
          if (total <= 5) p = i + 1;
          else if (current <= 3) p = i + 1;
          else if (current >= total - 2) p = total - 4 + i;
          else p = current - 2 + i;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`px-3 py-1 border rounded-md ${current === p ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 hover:bg-gray-50'}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
          Next <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => onChange(total)} disabled={current === total}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ==================== Main Component ====================
const SalesPicList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('countries');
  const [salesCountries, setSalesCountries] = useState<SalesCountry[]>([]);
  const [salesOffices, setSalesOffices] = useState<SalesOffice[]>([]);
  const [salesPics, setSalesPics] = useState<SalesPic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [countriesData, officesData, picsData] = await Promise.all([
        masterDataApi.getSalesCountryList(),
        masterDataApi.getSalesOffices(),
        masterDataApi.getSalesPics(),
      ]);
      setSalesCountries(countriesData);
      setSalesOffices(officesData);
      setSalesPics(picsData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'countries', label: 'Sales Countries', icon: <Globe className="w-4 h-4" />, count: salesCountries.length },
    { key: 'offices', label: 'Sales Offices', icon: <Building2 className="w-4 h-4" />, count: salesOffices.length },
    { key: 'pics', label: 'Sales PICs', icon: <Users className="w-4 h-4" />, count: salesPics.length },
  ];

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Sales Management</h1>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
              activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {activeTab === 'countries' && (
        <CountriesTab countries={salesCountries} offices={salesOffices}
          setCountries={setSalesCountries} showToast={showToast} />
      )}
      {activeTab === 'offices' && (
        <OfficesTab offices={salesOffices} countries={salesCountries} pics={salesPics}
          setOffices={setSalesOffices} showToast={showToast} />
      )}
      {activeTab === 'pics' && (
        <PicsTab pics={salesPics} countries={salesCountries} offices={salesOffices}
          setPics={setSalesPics} showToast={showToast} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  );
};

// ==================== Countries Tab ====================
const CountriesTab: React.FC<{
  countries: SalesCountry[];
  offices: SalesOffice[];
  setCountries: React.Dispatch<React.SetStateAction<SalesCountry[]>>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ countries, offices, setCountries, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<SalesCountry> & { _isNew?: boolean }>({});
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    countries.filter(c =>
      !search || c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
    ), [countries, search]);

  const handleAdd = () => {
    setEditing({ code: '', name: '', sortOrder: countries.length + 1, isActive: true, _isNew: true });
    setIsModalOpen(true);
  };

  const handleEdit = (c: SalesCountry) => {
    setEditing({ ...c });
    setIsModalOpen(true);
  };

  const handleDelete = async (code: string) => {
    const c = countries.find(x => x.code === code);
    const officeCount = offices.filter(o => o.salesCountryCode === code).length;
    if (officeCount > 0) {
      showToast(`Cannot delete "${c?.name}" — ${officeCount} office(s) still reference it. Delete those offices first.`, 'error');
      return;
    }
    if (!window.confirm(`Delete sales country "${c?.name}" (${code})?`)) return;
    try {
      await masterDataApi.deleteSalesCountry(code);
      setCountries(prev => prev.filter(x => x.code !== code));
      showToast(`"${c?.name}" deleted`, 'success');
    } catch (err) {
      showToast(parseApiError(err, 'Delete failed'), 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let saved: SalesCountry;
      if (editing._isNew) {
        saved = await masterDataApi.createSalesCountry({
          code: editing.code, name: editing.name,
          sortOrder: editing.sortOrder ?? 0, isActive: editing.isActive ?? true,
        });
        setCountries(prev => [...prev, saved]);
        showToast(`"${saved.name}" created`, 'success');
      } else {
        saved = await masterDataApi.updateSalesCountry(editing.code!, {
          name: editing.name, sortOrder: editing.sortOrder, isActive: editing.isActive,
        });
        setCountries(prev => prev.map(c => c.code === saved.code ? saved : c));
        showToast(`"${saved.name}" updated`, 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(parseApiError(err, 'Save failed'), 'error');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Search countries..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <button onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Country
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sort Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offices</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(c => {
              const officeCount = offices.filter(o => o.salesCountryCode === c.code).length;
              return (
                <tr key={c.code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.sortOrder}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{officeCount}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-indigo-900" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.code)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No countries found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editing._isNew ? 'Add Sales Country' : 'Edit Sales Country'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code</label>
                  <input type="text" required maxLength={50} value={editing.code || ''} disabled={!editing._isNew}
                    onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 disabled:bg-gray-100"
                    placeholder="e.g. CN, UK, US" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input type="text" required maxLength={100} value={editing.name || ''}
                    onChange={e => setEditing({ ...editing, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder="e.g. CHINA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                  <input type="number" value={editing.sortOrder ?? 0}
                    onChange={e => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" checked={editing.isActive ?? true}
                    onChange={e => setEditing({ ...editing, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <label className="ml-2 text-sm text-gray-900">Active</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ==================== Offices Tab ====================
const OfficesTab: React.FC<{
  offices: SalesOffice[];
  countries: SalesCountry[];
  pics: SalesPic[];
  setOffices: React.Dispatch<React.SetStateAction<SalesOffice[]>>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ offices, countries, pics, setOffices, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<SalesOffice> & { _isNew?: boolean }>({});
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filtered = useMemo(() =>
    offices.filter(o => {
      const matchSearch = !search ||
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        (o.code || '').toLowerCase().includes(search.toLowerCase());
      const matchCountry = !filterCountry || o.salesCountryCode === filterCountry;
      return matchSearch && matchCountry;
    }), [offices, search, filterCountry]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * itemsPerPage;
    return filtered.slice(s, s + itemsPerPage);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search, filterCountry]);

  const handleAdd = () => {
    setEditing({ name: '', salesCountryCode: filterCountry || '', isActive: true, _isNew: true });
    setIsModalOpen(true);
  };

  const handleEdit = (o: SalesOffice) => {
    setEditing({ ...o });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const o = offices.find(x => x.id === id);
    const picCount = pics.filter(p => p.salesOfficeId === id).length;
    if (picCount > 0) {
      showToast(`Cannot delete "${o?.name}" — ${picCount} PIC(s) still reference it. Delete those PICs first.`, 'error');
      return;
    }
    if (!window.confirm(`Delete sales office "${o?.name}"?`)) return;
    try {
      await masterDataApi.deleteSalesOffice(id);
      setOffices(prev => prev.filter(x => x.id !== id));
      showToast(`"${o?.name}" deleted`, 'success');
    } catch (err) {
      showToast(parseApiError(err, 'Delete failed'), 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<SalesOffice> = {
        name: editing.name!,
        salesCountryCode: editing.salesCountryCode,
        isActive: editing.isActive ?? true,
        remark: editing.remark,
      };
      if (!editing._isNew) {
        payload.id = editing.id;
      }
      const saved = await masterDataApi.saveSalesOffice(payload);
      if (editing._isNew) {
        setOffices(prev => [...prev, saved]);
        showToast(`"${saved.name}" created`, 'success');
      } else {
        setOffices(prev => prev.map(o => o.id === saved.id ? saved : o));
        showToast(`"${saved.name}" updated`, 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(parseApiError(err, 'Save failed'), 'error');
    }
  };

  const countryName = (code?: string) => countries.find(c => c.code === code)?.name || code || '-';

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search offices..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option value="">All Countries</option>
            {countries.map(c => (
              <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
            ))}
          </select>
          <div className="flex items-center text-sm text-gray-500">
            {filtered.length} office(s)
          </div>
        </div>
        <button onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Office
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PICs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginated.map(o => {
              const picCount = pics.filter(p => p.salesOfficeId === o.id).length;
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" /> {o.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{o.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{countryName(o.salesCountryCode)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{picCount}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${o.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {o.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => handleEdit(o)} className="text-indigo-600 hover:text-indigo-900" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(o.id)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No offices found</td></tr>
            )}
          </tbody>
        </table>
        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editing._isNew ? 'Add Sales Office' : 'Edit Sales Office'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sales Country</label>
                  <select value={editing.salesCountryCode || ''} required
                    onChange={e => setEditing({ ...editing, salesCountryCode: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                    <option value="">Select Country...</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Office Name</label>
                  <input type="text" required maxLength={100} value={editing.name || ''}
                    onChange={e => setEditing({ ...editing, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder="e.g. SHANGHAI OFFICE" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Remark</label>
                  <input type="text" maxLength={255} value={editing.remark || ''}
                    onChange={e => setEditing({ ...editing, remark: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" checked={editing.isActive ?? true}
                    onChange={e => setEditing({ ...editing, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <label className="ml-2 text-sm text-gray-900">Active</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ==================== PICs Tab ====================
const PicsTab: React.FC<{
  pics: SalesPic[];
  countries: SalesCountry[];
  offices: SalesOffice[];
  setPics: React.Dispatch<React.SetStateAction<SalesPic[]>>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ pics, countries, offices, setPics, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<SalesPic>>({});
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterOffice, setFilterOffice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter offices by selected country in modal
  const modalOffices = useMemo(() => {
    if (!editing.salesCountryCode) return offices;
    return offices.filter(o => o.salesCountryCode === editing.salesCountryCode);
  }, [offices, editing.salesCountryCode]);

  // Filter offices in the filter bar by selected country filter
  const filterableOffices = useMemo(() => {
    if (!filterCountry) return offices;
    return offices.filter(o => o.salesCountryCode === filterCountry);
  }, [offices, filterCountry]);

  const filtered = useMemo(() =>
    pics.filter(p => {
      const matchSearch = !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        (p.salesOfficeName ?? '').toLowerCase().includes(search.toLowerCase());
      const matchCountry = !filterCountry || p.salesCountryCode === filterCountry;
      const matchOffice = !filterOffice || p.salesOfficeId === Number(filterOffice);
      return matchSearch && matchCountry && matchOffice;
    }), [pics, search, filterCountry, filterOffice]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * itemsPerPage;
    return filtered.slice(s, s + itemsPerPage);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search, filterCountry, filterOffice]);

  const handleAdd = () => {
    setEditing({ isActive: true, salesCountryCode: filterCountry || '' });
    setIsModalOpen(true);
  };

  const handleEdit = (p: SalesPic) => {
    setEditing({ ...p });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const p = pics.find(x => x.id === id);
    if (!window.confirm(`Delete "${p?.name}"?`)) return;
    try {
      await masterDataApi.deleteSalesPic(id);
      setPics(prev => prev.filter(x => x.id !== id));
      showToast(`"${p?.name}" deleted`, 'success');
    } catch (err) {
      showToast(parseApiError(err, 'Delete failed'), 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const office = offices.find(o => o.id === Number(editing.salesOfficeId));
      const picToSave = {
        ...editing,
        salesOfficeName: office?.name,
        salesOfficeCode: office?.code,
      } as SalesPic;
      const saved = await masterDataApi.saveSalesPic(picToSave);
      if (editing.id) {
        setPics(prev => prev.map(p => p.id === saved.id ? saved : p));
        showToast(`"${saved.name}" updated`, 'success');
      } else {
        setPics(prev => [...prev, saved]);
        showToast(`"${saved.name}" created`, 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(parseApiError(err, 'Save failed'), 'error');
    }
  };

  const countryName = (code: string) => countries.find(c => c.code === code)?.name || code;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search PICs..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <select value={filterCountry} onChange={e => { setFilterCountry(e.target.value); setFilterOffice(''); }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option value="">All Countries</option>
            {countries.map(c => (
              <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
            ))}
          </select>
          <select value={filterOffice} onChange={e => setFilterOffice(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option value="">All Offices</option>
            {filterableOffices.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <div className="flex items-center text-sm text-gray-500">
            {filtered.length} PIC(s)
          </div>
        </div>
        <button onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add PIC
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Office</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginated.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" /> {p.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{countryName(p.salesCountryCode)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{p.salesOfficeName || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <div className="flex items-center justify-end gap-4">
                    <button onClick={() => handleEdit(p)} className="text-indigo-600 hover:text-indigo-900" title="Edit"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No PICs found</td></tr>
            )}
          </tbody>
        </table>
        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editing.id ? 'Edit Sales PIC' : 'Add Sales PIC'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sales Country</label>
                  <select value={editing.salesCountryCode || ''} required
                    onChange={e => setEditing({ ...editing, salesCountryCode: e.target.value, salesOfficeId: undefined as any })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                    <option value="">Select Country...</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sales Office</label>
                  <select value={editing.salesOfficeId || ''} required
                    onChange={e => setEditing({ ...editing, salesOfficeId: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                    <option value="">Select Office...</option>
                    {modalOffices.map(o => (
                      <option key={o.id} value={o.id}>{o.name}{o.code ? ` (${o.code})` : ''}</option>
                    ))}
                  </select>
                  {editing.salesCountryCode && modalOffices.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">No offices for this country. Add one in the Offices tab first.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input type="text" required maxLength={100} value={editing.name || ''}
                    onChange={e => setEditing({ ...editing, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" checked={editing.isActive ?? true}
                    onChange={e => setEditing({ ...editing, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <label className="ml-2 text-sm text-gray-900">Active</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesPicList;
