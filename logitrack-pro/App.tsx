import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, PlusCircle, Ship, Settings, Bell, Search, Menu, LogOut, Loader2, RefreshCw, Globe, Anchor, Users, Box, BarChart3, Filter, TrendingUp, Sparkles, DollarSign } from 'lucide-react';
import { Enquiry, EnquiryListItem, EnquiryFormData, LoginResponse } from './types';
import { enquiryApi } from './services/api';
import { useLanguage } from './i18n/LanguageContext';
import { getAvatarDataUrl } from './utils/avatarUtils';
import EnquiryList from './components/enquiry/EnquiryList';
import EnquiryForm from './components/enquiry/EnquiryForm';
import EnquiryDetail from './components/enquiry/EnquiryDetail';
import CountryList from './components/master-data/CountryList';
import PortList from './components/master-data/PortList';
import SalesPicList from './components/master-data/SalesPicList';
import ContainerTypeList from './components/master-data/ContainerTypeList';
import CarrierList from './components/master-data/CarrierList';
import CurrencyList from './components/master-data/CurrencyList';
import Login from './components/Login';
import Dashboard from './components/report/Dashboard';
import { EnhancedDashboard } from './components/report/EnhancedDashboard';
import { ComparisonReport } from './components/report/ComparisonReport';
import { SettingsLayout } from './components/settings/SettingsLayout';
import { AIChatPanel } from './components/ai/AIChatPanel';

type ViewType = 'dashboard' | 'enquiry-list' | 'enquiry-form' | 'enquiry-detail' | 'master-countries' | 'master-ports' | 'master-sales-pics' | 'master-container-types' | 'master-carriers' | 'master-currencies' | 'report-dashboard' | 'report-enhanced' | 'report-comparison' | 'ai-chat' | 'settings';

const App: React.FC = () => {
  const { language, setLanguage, translations } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [previousView, setPreviousView] = useState<ViewType>('dashboard');  // 跟踪上一个视图用于返回
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(null);
  
  // Data State
  const [enquiries, setEnquiries] = useState<EnquiryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [editingEnquiry, setEditingEnquiry] = useState<Partial<Enquiry> | null>(null);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<number | null>(null);
  
  // Enhanced Dashboard Modal State (用于保持弹窗状态)
  const [enhancedDashboardModalState, setEnhancedDashboardModalState] = useState<{
    isOpen: boolean;
    officeName: string;
    bookingStatus: 'yes' | 'rejected' | 'invalid' | 'pending';
    timestamp?: number; // 添加时间戳用于强制更新
  } | null>(null);
  
  // ✅ 新增：保存增强报表的过滤条件
  const [enhancedDashboardFilter, setEnhancedDashboardFilter] = useState<any>(null);

  // Initial Data Load
  useEffect(() => {
    // ✅ 新增：在应用初始化时，从localStorage恢复登录状态
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        const user = JSON.parse(savedUser) as LoginResponse;
        setCurrentUser(user);
        setIsAuthenticated(true);
        console.log('[App] Restored user from localStorage:', user.username);
      } catch (err) {
        console.error('[App] Failed to restore user from localStorage:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []); // ✅ 仅在组件首次挂载时运行

  // 当认证状态改变时，加载数据
  useEffect(() => {
    if (isAuthenticated) {
        fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await enquiryApi.list({ page: 0, pageSize: 10, sortBy: 'updatedAt', sortOrder: 'desc' });
        setEnquiries(response.content);
    } catch (err) {
        console.error("Failed to fetch data", err);
        setError("Failed to load enquiries. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogin = (user: LoginResponse) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    // ✅ 存储用户信息到localStorage用于审计日志
    localStorage.setItem('user', JSON.stringify(user));
    if (user.token) {
      localStorage.setItem('token', user.token);
    }
    console.log('[App] User logged in and saved to localStorage:', user.username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setEnquiries([]);
    setCurrentView('dashboard');
    // ✅ 清除localStorage中的用户信息
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.log('[App] User logged out and localStorage cleared');
  };

  const roles = currentUser?.roles ?? [];
  // 后端返回的角色代码: ADMIN_USER, OPERATING_USER, NORMAL_USER
  const isAdmin = roles.includes('ADMIN_USER') || roles.includes('ADMIN');
  const isOperatingUser = isAdmin || roles.includes('OPERATING_USER');
  const isLoginUser = !isAdmin && !isOperatingUser;
  
  // Admin权限：可以访问所有功能
  const canManageEnquiries = isAdmin || isOperatingUser;
  const canManageMasterData = isAdmin || isOperatingUser;
  const canViewReports = isAdmin || isOperatingUser;
  const canViewSettings = isAdmin;  // ✅ 仅Admin可见设置（不包括operator）
  const displayName = currentUser?.username ?? 'User';
  const displayRole = roles[0] ?? 'LOGIN_USER';

  const allowedViews = useMemo(() => {
    const views: ViewType[] = ['dashboard', 'enquiry-list', 'enquiry-detail'];

    if (canManageEnquiries) {
      views.push('enquiry-form');
    }

    if (canManageMasterData) {
      views.push('master-countries', 'master-ports', 'master-sales-pics', 'master-container-types', 'master-carriers', 'master-currencies');
    }

    if (canViewReports) {
      views.push('report-dashboard', 'report-enhanced', 'report-comparison', 'ai-chat');
    }

    if (canViewSettings) {
      views.push('settings');
    }

    return new Set(views);
  }, [canManageEnquiries, canManageMasterData, canViewReports, canViewSettings]);

  useEffect(() => {
    if (!allowedViews.has(currentView)) {
      setCurrentView('dashboard');
    }
  }, [allowedViews, currentView]);

  const handleSaveEnquiry = async (enquiry: Enquiry) => {
    try {
        if (enquiry.id) {
            // ✅ 编辑模式：确保所有必填字段有值，防止NOT NULL约束错误
            const dataToUpdate = {
              ...enquiry,
              // 必填字段的保留逻辑 - 优先使用新值，否则使用原值
              salesOfficeId: enquiry.salesOfficeId || editingEnquiry?.salesOfficeId,
              salesPicId: enquiry.salesPicId || editingEnquiry?.salesPicId,
              assignedCnOffice: enquiry.assignedCnOffice || editingEnquiry?.assignedCnOffice,
              salesCountryCode: enquiry.salesCountryCode || editingEnquiry?.salesCountryCode,
              cargoTypeCode: enquiry.cargoTypeCode || editingEnquiry?.cargoTypeCode,
              polIds: enquiry.polIds || editingEnquiry?.polIds,
              podIds: enquiry.podIds || editingEnquiry?.podIds,
              refNumber: enquiry.refNumber || editingEnquiry?.refNumber,
              productCode: enquiry.productCode || editingEnquiry?.productCode,
              productAbbr: enquiry.productAbbr || editingEnquiry?.productAbbr,
              status: enquiry.status || editingEnquiry?.status || 'New',
              enquiryCreatedDate: enquiry.enquiryCreatedDate || editingEnquiry?.enquiryCreatedDate,
              enquiryReceivedDate: enquiry.enquiryReceivedDate || editingEnquiry?.enquiryReceivedDate,
            };
            console.log('[App] Updating enquiry ID:', enquiry.id);
            console.log('[App] Data to update:', dataToUpdate);
            await enquiryApi.update(enquiry.id, dataToUpdate);
        } else {
            await enquiryApi.create(enquiry as unknown as EnquiryFormData);
        }
        setEditingEnquiry(null);
        // 返回到之前的视图（可能是enquiry-list或report-enhanced）
        setCurrentView(previousView);
        // 不清除 enhancedDashboardModalState，让 EnhancedDashboard 恢复弹窗
        fetchData();
    } catch (err: any) {
        const errorMsg = err?.message || err?.toString() || 'Unknown error';
        alert(`Failed to save enquiry: ${errorMsg}`);
        console.error('[App] Save error:', err);
        // 输出更详细的错误信息
        if (err?.response) {
          console.error('[App] Error response:', err.response);
        }
    }
  };

  const handleViewDetail = (enquiry: Enquiry | EnquiryListItem, modalState?: { officeName: string; bookingStatus: 'yes' | 'rejected' | 'invalid' | 'pending' }) => {
    setPreviousView(currentView);  // 保存当前视图
    
    // 如果是从增强报表的弹窗进入，保存弹窗状态
    if (currentView === 'report-enhanced' && modalState) {
      console.log('[App] Saving modal state for view detail:', modalState);
      setEnhancedDashboardModalState({
        isOpen: true,
        officeName: modalState.officeName,
        bookingStatus: modalState.bookingStatus,
        timestamp: Date.now() // 添加时间戳强制更新
      });
    }
    
    setSelectedEnquiryId(enquiry.id!);
    setCurrentView('enquiry-detail');
  };

  const handleEditEnquiry = async (enquiry: Enquiry | EnquiryListItem, modalState?: { officeName: string; bookingStatus: 'yes' | 'rejected' | 'invalid' | 'pending' }) => {
    try {
      setPreviousView(currentView);  // 保存当前视图
      
      // 如果是从增强报表的弹窗进入，保存弹窗状态
      if (currentView === 'report-enhanced' && modalState) {
        console.log('[App] Saving modal state for edit:', modalState);
        setEnhancedDashboardModalState({
          isOpen: true,
          officeName: modalState.officeName,
          bookingStatus: modalState.bookingStatus,
          timestamp: Date.now() // 添加时间戳强制更新
        });
      }
      
      // ✅ 如果没有id，说明是Copy/Increase场景，数据已准备好，直接使用
      if (!enquiry.id) {
        console.log('📝 New enquiry (Copy/Increase), using provided data');
        setEditingEnquiry(enquiry as Enquiry);
        setCurrentView('enquiry-form');
        return;
      }
      
      // ✅ 如果有id，从getById获取完整数据（确保polIds/podIds完整）
      console.log('📥 Loading full enquiry data for edit:', enquiry.id);
      const fullEnquiry = await enquiryApi.getById(enquiry.id);
      console.log('✅ Full enquiry data loaded:', { 
        polIds: fullEnquiry.polIds, 
        podIds: fullEnquiry.podIds,
      });
      
      setEditingEnquiry(fullEnquiry);
      setCurrentView('enquiry-form');
    } catch (err) {
      console.error('Failed to load enquiry for edit:', err);
      alert('Failed to load enquiry details. Please try again.');
    }
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
            canCreate={canManageEnquiries}
            canManage={canManageEnquiries}
          />
        );
      case 'enquiry-form':
        return (
          <EnquiryForm
            initialData={editingEnquiry}
            onSubmit={async (enquiry) => {
              await handleSaveEnquiry(enquiry);
              // handleSaveEnquiry 会处理返回和fetchData
              // 保留 enhancedDashboardModalState，弹窗会在返回时自动恢复
            }}
            onCancel={() => {
              setCurrentView(previousView);
              // 保留 enhancedDashboardModalState，弹窗会在返回时自动恢复
            }}
          />
        );
      case 'enquiry-detail':
        return selectedEnquiryId ? (
          <EnquiryDetail
            enquiryId={selectedEnquiryId}
            onBack={() => {
              setCurrentView(previousView);
              // 保留 enhancedDashboardModalState，弹窗会在返回时自动恢复
            }}
            onEdit={handleEditEnquiry}
            canManage={canManageEnquiries}
          />
        ) : null;
      case 'master-countries':
        return <CountryList />;
      case 'master-ports':
        return <PortList />;
      case 'master-sales-pics':
        return <SalesPicList />;
      case 'master-container-types':
        return <ContainerTypeList />;
      case 'master-carriers':
        return <CarrierList />;
      case 'master-currencies':
        return <CurrencyList />;
      case 'report-dashboard':
        return <Dashboard />;
      case 'report-enhanced':
        console.log('[App] Rendering EnhancedDashboard with modalState:', enhancedDashboardModalState);
        return (
          <EnhancedDashboard 
            onViewDetail={handleViewDetail}
            onEdit={handleEditEnquiry}
            canManage={canManageEnquiries}
            initialModalState={enhancedDashboardModalState}
            onModalStateChange={(state) => {
              console.log('[App] Modal state changed:', state);
              setEnhancedDashboardModalState(state);
            }}
            savedFilter={enhancedDashboardFilter}
            onFilterChange={(filter) => {
              console.log('[App] Filter changed:', filter);
              setEnhancedDashboardFilter(filter);
            }}
          />
        );
      case 'report-comparison':
        return <ComparisonReport />;
      case 'ai-chat':
        return (
          <AIChatPanel
            onNavigateToDashboard={(filter) => {
              if (filter.startDate && filter.endDate) {
                setEnhancedDashboardFilter({
                  startDate: filter.startDate,
                  endDate: filter.endDate,
                  ...filter,
                });
              }
              setCurrentView('report-enhanced');
            }}
          />
        );
      case 'settings':
        return <SettingsLayout />;
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Recent Enquiries</h1>
        {canManageEnquiries && (
          <button 
            onClick={handleNewEnquiry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add New Enquiry
          </button>
        )}
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
          {canManageEnquiries && (
            <button onClick={handleNewEnquiry} className="mt-4 text-indigo-600 hover:underline">
              Create New Enquiry
            </button>
          )}
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
                    {enquiry.refNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {enquiry.commodity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      enquiry.status === 'New' ? 'bg-blue-100 text-blue-800' :
                      enquiry.status === 'Quoted & Pending' ? 'bg-yellow-100 text-yellow-800' :
                      enquiry.status === 'Secured' ? 'bg-green-100 text-green-800' :
                      enquiry.status === 'Lost' ? 'bg-red-100 text-red-800' :
                      enquiry.status === 'Cancelled' ? 'bg-gray-200 text-gray-600' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {enquiry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {enquiry.enquiryReceivedDate}
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
                {canManageMasterData && (
                  <>
                    <div className="pt-4 pb-2">
                        <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Master Data</p>
                    </div>
                    <button 
                      onClick={() => setCurrentView('master-countries')}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'master-countries' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Globe className="mr-3 flex-shrink-0 h-5 w-5" />
                        Countries
                    </button>
                    <button 
                      onClick={() => setCurrentView('master-ports')}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'master-ports' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Anchor className="mr-3 flex-shrink-0 h-5 w-5" />
                        Ports
                    </button>
                    <button 
                      onClick={() => setCurrentView('master-sales-pics')}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'master-sales-pics' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Users className="mr-3 flex-shrink-0 h-5 w-5" />
                        Sales Management
                    </button>
                    <button 
                      onClick={() => setCurrentView('master-container-types')}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'master-container-types' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Box className="mr-3 flex-shrink-0 h-5 w-5" />
                        Container Types
                    </button>
                    <button 
                      onClick={() => setCurrentView('master-carriers')}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'master-carriers' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Ship className="mr-3 flex-shrink-0 h-5 w-5" />
                        Carriers
                    </button>
                    <button 
                      onClick={() => setCurrentView('master-currencies')}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'master-currencies' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <DollarSign className="mr-3 flex-shrink-0 h-5 w-5" />
                        Currencies
                    </button>
                  </>
                )}
                {canManageEnquiries && (
                  <div className="pt-4 border-t border-slate-800 mt-4">
                    <button 
                      onClick={handleNewEnquiry}
                      className="group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-emerald-300 hover:bg-emerald-700 hover:text-white transition-colors"
                    >
                      <PlusCircle className="mr-3 flex-shrink-0 h-6 w-6" />
                      New Enquiry
                    </button>
                  </div>
                )}
                {canViewReports && (
                  <>
                    <div className="pt-4 pb-2">
                        <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reports</p>
                    </div>
                    <button 
                      onClick={() => setCurrentView('report-dashboard')}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'report-dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <BarChart3 className="mr-3 flex-shrink-0 h-5 w-5" />
                        基础报表
                    </button>
                    <button 
                      onClick={() => setCurrentView('report-enhanced')}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'report-enhanced' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Filter className="mr-3 flex-shrink-0 h-5 w-5" />
                        增强报表
                    </button>
                    <button 
                      onClick={() => setCurrentView('report-comparison')}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'report-comparison' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <TrendingUp className="mr-3 flex-shrink-0 h-5 w-5" />
                        时期对比
                    </button>
                    <button 
                      onClick={() => setCurrentView('ai-chat')}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'ai-chat' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Sparkles className="mr-3 flex-shrink-0 h-5 w-5" />
                        AI 数据助手
                    </button>
                  </>
                )}
                {canViewSettings && (
                  <button 
                    onClick={() => setCurrentView('settings')}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${currentView === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                  >
                      <Settings className="mr-3 flex-shrink-0 h-6 w-6" />
                      Settings
                  </button>
                )}
            </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-slate-800 p-4">
          <div className="flex items-center w-full">
            <div>
              <img 
                className="inline-block h-9 w-9 rounded-full" 
                src={getAvatarDataUrl(displayName, 36)} 
                alt={displayName}
                title={displayName}
              />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs font-medium text-slate-400">{displayRole}</p>
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
                      {currentView === 'master-countries' && 'Country Management'}
                      {currentView === 'master-ports' && 'Port Management'}
                      {currentView === 'master-sales-pics' && 'Sales Management'}
                      {currentView === 'master-container-types' && 'Container Type Management'}
                      {currentView === 'master-carriers' && 'Carrier Management'}
                      {currentView === 'master-currencies' && 'Currency Management'}
                      {currentView === 'report-dashboard' && '基础报表'}
                      {currentView === 'report-enhanced' && '增强报表'}
                      {currentView === 'report-comparison' && '时期对比报告'}
                      {currentView === 'ai-chat' && 'AI 数据分析助手'}
                      {currentView === 'settings' && '系统设置'}
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
                    {/* Language Switcher */}
                    <div className="relative group">
                        <button 
                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none flex items-center gap-1"
                            title="Language Settings"
                        >
                            <Globe className="h-5 w-5" />
                            <span className="text-xs font-semibold text-gray-600">{language.toUpperCase()}</span>
                        </button>
                        <div className="absolute right-0 mt-0 w-32 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <button
                                onClick={() => setLanguage('zh')}
                                className={`w-full text-left px-4 py-2 text-sm ${language === 'zh' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                中文
                            </button>
                            <button
                                onClick={() => setLanguage('en')}
                                className={`w-full text-left px-4 py-2 text-sm ${language === 'en' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                English
                            </button>
                        </div>
                    </div>
                    <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <Bell className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </div>

        <main className={`flex-1 overflow-hidden ${currentView === 'ai-chat' ? 'bg-gray-50' : 'overflow-y-auto p-8 bg-gray-100'}`}>
            {currentView === 'ai-chat' ? (
              renderContent()
            ) : (
              <div className="max-w-8xl mx-auto">
                  {renderContent()}
              </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;