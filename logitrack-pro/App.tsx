import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, FileSpreadsheet, Ship, Settings, Bell, Search, Menu, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { Enquiry, EnquiryListItem, EnquiryFormData } from './types';
import { enquiryApi } from './services/api';
import EnquiryList from './components/enquiry/EnquiryList';
import EnquiryForm from './components/enquiry/EnquiryForm';
import EnquiryDetail from './components/enquiry/EnquiryDetail';
import Login from './components/Login';

type ViewType = 'dashboard' | 'enquiry-list' | 'enquiry-form' | 'enquiry-detail';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  
  // Data State
  const [enquiries, setEnquiries] = useState<EnquiryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [editingEnquiry, setEditingEnquiry] = useState<Partial<Enquiry> | null>(null);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<number | null>(null);

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
        const response = await enquiryApi.list({ page: 1, pageSize: 10 });
        setEnquiries(response.content);
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
    setEnquiries([]);
    setCurrentView('dashboard');
  };

  const handleSaveEnquiry = async (enquiry: Enquiry) => {
    try {
        if (enquiry.id) {
            await enquiryApi.update(enquiry.id, enquiry);
        } else {
            await enquiryApi.create(enquiry as unknown as EnquiryFormData);
        }
        setEditingEnquiry(null);
        setCurrentView('enquiry-list');
        fetchData();
    } catch (err) {
        alert("Failed to save enquiry.");
        console.error('[App] Save error:', err);
    }
  };

  const handleViewDetail = (enquiry: Enquiry | EnquiryListItem) => {
    setSelectedEnquiryId(enquiry.id!);
    setCurrentView('enquiry-detail');
  };

  const handleEditEnquiry = (enquiry: Enquiry | EnquiryListItem) => {
    setEditingEnquiry(enquiry as Enquiry);
    setCurrentView('enquiry-form');
  };

  const handleNewEnquiry = () => {
    setEditingEnquiry(null);
    setCurrentView('enquiry-form');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'enquiry-list':
        return (
          <EnquiryList
            onViewDetail={handleViewDetail}
            onEdit={handleEditEnquiry}
            onNewEnquiry={handleNewEnquiry}
          />
        );
      case 'enquiry-form':
        return (
          <EnquiryForm
            initialData={editingEnquiry}
            onSubmit={handleSaveEnquiry}
            onCancel={() => setCurrentView('enquiry-list')}
          />
        );
      case 'enquiry-detail':
        return selectedEnquiryId ? (
          <EnquiryDetail
            enquiryId={selectedEnquiryId}
            onBack={() => setCurrentView('enquiry-list')}
            onEdit={handleEditEnquiry}
          />
        ) : null;
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6 pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-indigo-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-50 rounded-md p-3">
                <Ship className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Enquiries</dt>
                  <dd className="text-2xl font-bold text-gray-900">{enquiries.length}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Quoted</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {enquiries.filter(e => e.status === 'Quoted').length}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {enquiries.filter(e => e.status === 'Pending').length}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">New</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {enquiries.filter(e => e.status === 'New').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Recent Enquiries</h1>
        <button 
          onClick={handleNewEnquiry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add New Enquiry
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center bg-white rounded-lg shadow p-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="text-sm text-gray-500 ml-2">Loading data...</span>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 bg-white rounded-lg shadow p-8">
          <p>{error}</p>
          <button onClick={fetchData} className="mt-2 text-indigo-600 hover:underline">Retry</button>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center bg-white rounded-lg shadow p-8">
          <p className="text-gray-500">No enquiries found. Create your first one!</p>
          <button onClick={handleNewEnquiry} className="mt-4 text-indigo-600 hover:underline">
            Create New Enquiry
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enquiries.slice(0, 5).map((enquiry) => (
                <tr 
                  key={enquiry.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewDetail(enquiry)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {enquiry.referenceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {enquiry.customerCompanyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      enquiry.status === 'New' ? 'bg-blue-100 text-blue-800' :
                      enquiry.status === 'Quoted' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {enquiry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {enquiry.receivedDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="text-center pt-4">
        <button
          onClick={() => setCurrentView('enquiry-list')}
          className="text-indigo-600 hover:text-indigo-900 font-medium"
        >
          View All Enquiries →
        </button>
      </div>
    </div>
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
                  onClick={() => setCurrentView('enquiry-list')}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'enquiry-list' || currentView === 'enquiry-form' || currentView === 'enquiry-detail' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                >
                    <Ship className="mr-3 flex-shrink-0 h-6 w-6" />
                    Enquiries
                </button>
                <button 
                  onClick={handleNewEnquiry}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
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
                    <h2 className="text-xl font-semibold text-gray-900">
                      {currentView === 'dashboard' && 'Dashboard'}
                      {currentView === 'enquiry-list' && 'Enquiry Management'}
                      {currentView === 'enquiry-form' && (editingEnquiry ? 'Edit Enquiry' : 'New Enquiry')}
                      {currentView === 'enquiry-detail' && 'Enquiry Details'}
                    </h2>
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
            <div className="max-w-8xl mx-auto">
                {renderContent()}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;