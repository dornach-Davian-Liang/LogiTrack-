import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, FileSpreadsheet, Ship, Settings, Bell, Search, Menu, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { EnquiryRecord } from './types';
import { api } from './services/dataService';
import Table from './components/Table';
import Form from './components/Form';
import Login from './components/Login';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'form'>('dashboard');
  
  // Data State
  const [records, setRecords] = useState<EnquiryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecord, setEditingRecord] = useState<EnquiryRecord | null>(null);

  // Initial Data Load
  useEffect(() => {
    if (isAuthenticated) {
        fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const data = await api.getAll();
        setRecords(data);
    } catch (err) {
        console.error("Failed to fetch data", err);
        setError("Failed to load enquiries. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRecords([]);
  };

  const handleSaveRecord = async (record: EnquiryRecord) => {
    setIsSaving(true);
    console.log('[App] Saving record:', record);
    console.log('[App] Editing record:', editingRecord);
    try {
        // Check if this is an update by seeing if the editingRecord has an id from the backend
        // (not a temporary client-generated id)
        const isUpdate = editingRecord && editingRecord.id && records.some(r => r.id === editingRecord.id);
        
        if (isUpdate) {
            // Update existing
            console.log('[App] Updating existing record:', record.id);
            const updated = await api.update(record);
            setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
        } else {
            // Create new - remove any temporary ID
            console.log('[App] Creating new record');
            const { id, ...newRecordData } = record;
            const created = await api.create(newRecordData as EnquiryRecord);
            setRecords(prev => [created, ...prev]);
        }
        setEditingRecord(null);
        setCurrentView('dashboard');
    } catch (err) {
        alert("Failed to save record. See console for details.");
        console.error('[App] Save error:', err);
    } finally {
        setIsSaving(false);
    }
  };

  const handleEditClick = (record: EnquiryRecord) => {
    setEditingRecord(record);
    setCurrentView('form');
  };

  const handleCopyRecord = (record: EnquiryRecord) => {
    // Create a copy of the record but remove the ID to treat it as new
    const { id, referenceNumber, ...rest } = record;
    
    const newRecord = {
        ...rest,
        referenceNumber: `${referenceNumber}-COPY`,
        enquiryReceivedDate: new Date().toISOString().split('T')[0],
        issueDate: new Date().toISOString().split('T')[0],
        status: 'New' as const,
        bookingConfirmed: 'Pending' as const
    } as EnquiryRecord;

    setEditingRecord(newRecord);
    setCurrentView('form');
  };

  const handleNewClick = () => {
    setEditingRecord(null);
    setCurrentView('form');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const filteredRecords = records.filter(r => 
    (r.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (r.salesCountry?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (r.status?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col fixed h-full bg-slate-900 text-white z-20">
        <div className="flex items-center justify-center h-16 bg-slate-950 shadow-md">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                <Ship className="w-6 h-6 text-indigo-400" />
                <span>LogiTrack</span>
            </div>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
            <nav className="mt-5 flex-1 px-2 space-y-1">
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                >
                    <LayoutDashboard className="mr-3 flex-shrink-0 h-6 w-6" />
                    Dashboard
                </button>
                <button 
                  onClick={handleNewClick}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'form' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                >
                    <PlusCircle className="mr-3 flex-shrink-0 h-6 w-6" />
                    New Enquiry
                </button>
                <button className="group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                    <FileSpreadsheet className="mr-3 flex-shrink-0 h-6 w-6" />
                    Reports
                </button>
                 <button className="group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                    <Settings className="mr-3 flex-shrink-0 h-6 w-6" />
                    Settings
                </button>
            </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-slate-800 p-4">
          <div className="flex items-center w-full">
            <div>
              <img className="inline-block h-9 w-9 rounded-full" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">Susana Wong</p>
              <p className="text-xs font-medium text-slate-400">CN Pricing Admin</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1 w-full h-screen overflow-hidden">
        
        {/* Top Header */}
        <div className="flex-shrink-0 flex h-16 bg-white shadow z-10">
            <button className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden">
                <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 px-8 flex justify-between">
                <div className="flex-1 flex items-center">
                    {currentView === 'dashboard' && (
                        <div className="w-full max-w-md relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                className="block w-full pl-10 sm:text-sm border-gray-300 rounded-full focus:ring-indigo-500 focus:border-indigo-500 border p-2 bg-gray-50" 
                                placeholder="Search reference, country or status..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </div>
                <div className="ml-4 flex items-center md:ml-6 gap-3">
                    <button 
                        onClick={fetchData} 
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <Bell className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </div>

        <main className="flex-1 overflow-y-auto p-8 bg-gray-100">
            <div className="max-w-8xl mx-auto h-full">
                {currentView === 'dashboard' ? (
                    <div className="space-y-6 pb-10 flex flex-col h-full">
                        
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 flex-shrink-0">
                            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-indigo-500">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-indigo-50 rounded-md p-3">
                                            <Ship className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Total Enquiries</dt>
                                                <dd className="text-2xl font-bold text-gray-900">{records.length}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-green-50 rounded-md p-3">
                                            <FileSpreadsheet className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Confirmed Bookings</dt>
                                                <dd className="text-2xl font-bold text-gray-900">
                                                    {records.filter(r => r.bookingConfirmed === 'Yes').length}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                             <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-yellow-500">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-yellow-50 rounded-md p-3">
                                            <Settings className="h-6 w-6 text-yellow-600" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Pending Quotes</dt>
                                                <dd className="text-2xl font-bold text-gray-900">
                                                    {records.filter(r => r.status === 'Pending' || r.status === 'New').length}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                             <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-red-500">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-red-50 rounded-md p-3">
                                            <Bell className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Urgent / New</dt>
                                                <dd className="text-2xl font-bold text-gray-900">
                                                    {records.filter(r => r.status === 'New').length}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 flex-shrink-0">
                            <h1 className="text-2xl font-bold text-gray-900">Recent Enquiries</h1>
                            <button 
                                onClick={handleNewClick}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Add New Record
                            </button>
                        </div>
                        
                        <div className="flex-1 min-h-0 relative">
                            {isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                        <span className="text-sm text-gray-500 mt-2">Loading data...</span>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-red-500">
                                        <p>{error}</p>
                                        <button onClick={fetchData} className="mt-2 text-indigo-600 hover:underline">Retry</button>
                                    </div>
                                </div>
                            ) : (
                                <Table 
                                    data={filteredRecords} 
                                    onEdit={handleEditClick} 
                                    onCopy={handleCopyRecord}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        {isSaving && (
                            <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
                                 <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                            </div>
                        )}
                        <Form 
                            initialData={editingRecord} 
                            onSubmit={handleSaveRecord} 
                            onCancel={() => setCurrentView('dashboard')} 
                        />
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;