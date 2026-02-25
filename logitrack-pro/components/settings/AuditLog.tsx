import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Trash2, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
import { settingsApi } from '../../services/settingsApi';
import ChangeDetailsModal from './ChangeDetailsModal';
import { useLanguage } from '../../i18n/LanguageContext';

interface AuditLogItem {
  id: number;
  createdAt: string;
  username: string;
  userRole?: string; // 权限等级
  cnPricingAdmin?: string; // CN Pricing Admin字段
  action: string;
  resourceType: string;
  resourceName?: string;
  resourceId?: string;
  status: string;
  oldValue?: string;
  newValue?: string;
  details?: string; // 详细变更说明
}

interface AuditLogResponse {
  content: AuditLogItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export const AuditLog: React.FC = () => {
  const { language, translations } = useLanguage();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 分页状态
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // 弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  
  // 筛选状态
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    username: '',
    action: '',
    resourceType: ''
  });

  // 加载审计日志
  const fetchLogs = async (pageNum: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await settingsApi.getAuditLogs({
        page: pageNum,
        size,
        ...filters
      } as any);
      
      setLogs(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
      setPage(pageNum);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load audit logs';
      setError(errorMsg);
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(0);
  }, []);

  const handleFilter = () => {
    setPage(0);
    fetchLogs(0);
  };

  const handleResetFilter = () => {
    setFilters({
      startDate: '',
      endDate: '',
      username: '',
      action: '',
      resourceType: ''
    });
    setPage(0);
    // 重新加载时不带过滤条件
    setTimeout(() => fetchLogs(0), 0);
  };

  const handleRefresh = () => {
    fetchLogs(page);
  };

  const handleExport = async () => {
    try {
      await settingsApi.exportAuditLogs(filters);
    } catch (err) {
      console.error('Failed to export audit logs:', err);
      alert(translations.auditLog.exportFailed);
    }
  };

  const handleClear = async () => {
    if (!window.confirm(translations.auditLog.clearConfirm)) {
      return;
    }
    
    try {
      await settingsApi.clearAuditLogs();
      alert(translations.auditLog.clearSuccess);
      fetchLogs(0);
    } catch (err) {
      console.error('Failed to clear audit logs:', err);
      alert(translations.auditLog.clearFailed);
    }
  };

  // 处理打开变更详情弹窗
  const handleOpenDetailsModal = (log: AuditLogItem) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  // 处理关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  const handlePreviousPage = () => {
    if (page > 0) {
      fetchLogs(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      fetchLogs(page + 1);
    }
  };

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'VIEW': 'bg-gray-100 text-gray-800',
      'EXPORT': 'bg-purple-100 text-purple-800',
      'LOGIN': 'bg-indigo-100 text-indigo-800',
      'LOGOUT': 'bg-yellow-100 text-yellow-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'SUCCESS' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📋 {translations.auditLog.title}
          </h1>
          <p className="text-gray-500 mt-1">{translations.auditLog.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="ml-2">{translations.auditLog.refresh}</span>
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download size={16} />
            <span className="ml-2">{translations.auditLog.export}</span>
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
          >
            <Trash2 size={16} />
            <span className="ml-2">{translations.auditLog.clear}</span>
          </button>
        </div>
      </div>

      {/* 筛选条件 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{translations.auditLog.filterTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 开始日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translations.auditLog.startDate}
            </label>
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* 结束日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translations.auditLog.endDate}
            </label>
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* 用户名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translations.auditLog.username}
            </label>
            <input
              type="text"
              placeholder={translations.auditLog.usernamePlaceholder}
              value={filters.username}
              onChange={(e) => setFilters({ ...filters, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* 操作类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translations.auditLog.operationType}
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{translations.auditLog.allTypes}</option>
              <option value="CREATE">{translations.auditActions.CREATE}</option>
              <option value="UPDATE">{translations.auditActions.UPDATE}</option>
              <option value="DELETE">{translations.auditActions.DELETE}</option>
              <option value="VIEW">{translations.auditActions.VIEW}</option>
              <option value="EXPORT">{translations.auditActions.EXPORT}</option>
              <option value="LOGIN">{translations.auditActions.LOGIN}</option>
              <option value="LOGOUT">{translations.auditActions.LOGOUT}</option>
            </select>
          </div>

          {/* 资源类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translations.auditLog.resourceType}
            </label>
            <input
              type="text"
              placeholder={translations.auditLog.resourceTypePlaceholder}
              value={filters.resourceType}
              onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 按钮 */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
          >
            {translations.auditLog.search}
          </button>
          <button
            onClick={handleResetFilter}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm font-medium"
          >
            {translations.auditLog.reset}
          </button>
        </div>
      </div>

      {/* 错误消息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 表格 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 w-10">{translations.auditLog.tableHeaders.sequence}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{translations.auditLog.tableHeaders.time}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{translations.auditLog.tableHeaders.username}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{translations.auditLog.tableHeaders.userRole}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{translations.auditLog.tableHeaders.cnPricingAdmin}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{translations.auditLog.tableHeaders.operation}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{translations.auditLog.tableHeaders.resourceType}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{translations.auditLog.tableHeaders.resourceName}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{translations.auditLog.tableHeaders.changeDetails}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{translations.auditLog.tableHeaders.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b border-indigo-600"></div>
                      <span className="text-gray-600">{translations.auditLog.loading}</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    {translations.auditLog.noData}
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-500">{index + 1 + page * size}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                      {log.username}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {log.userRole ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          log.userRole === 'ADMIN_USER' ? 'bg-purple-100 text-purple-800' :
                          log.userRole === 'OPERATING_USER' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.userRole === 'ADMIN_USER' && translations.auditLog.userRoles.admin}
                          {log.userRole === 'OPERATING_USER' && translations.auditLog.userRoles.pricingAdmin}
                          {log.userRole === 'NORMAL_USER' && translations.auditLog.userRoles.user}
                          {!['ADMIN_USER', 'OPERATING_USER', 'NORMAL_USER'].includes(log.userRole) && log.userRole}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {log.cnPricingAdmin || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                        {translations.auditActions[log.action as keyof typeof translations.auditActions] || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {log.resourceType}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {log.resourceName || log.resourceId || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 max-w-md">
                      {log.details ? (
                        <button
                          onClick={() => handleOpenDetailsModal(log)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition text-xs font-medium"
                          title={translations.auditLog.clickToViewDetails}
                        >
                          <Eye size={14} />
                          <span className="truncate max-w-xs">{log.details}</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(log.status)}`}>
                        {log.status === 'SUCCESS' ? translations.auditLog.statusLabels.success : translations.auditLog.statusLabels.failure}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-sm text-gray-600">
          {translations.auditLog.pagination.total} <span className="font-semibold">{totalElements}</span> {translations.auditLog.pagination.records}，
          {translations.auditLog.pagination.page} <span className="font-semibold">{page + 1}</span> {translations.auditLog.pagination.of} <span className="font-semibold">{totalPages || 1}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={page === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            <span className="ml-1">{translations.auditLog.pagination.previous}</span>
          </button>
          <button
            onClick={handleNextPage}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-1">{translations.auditLog.pagination.next}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 变更详情弹窗 */}
      <ChangeDetailsModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        log={selectedLog}
      />
    </div>
  );
};

export default AuditLog;
