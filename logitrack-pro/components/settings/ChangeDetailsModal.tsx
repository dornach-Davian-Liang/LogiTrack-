import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { masterDataApi } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

interface ChangeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: {
    id: number;
    username: string;
    userRole?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    createdAt: string;
    oldValue?: string;
    newValue?: string;
    details?: string;
  } | null;
}

interface PortInfo {
  id: number;
  portCode: string;
  portName: string;
}

/**
 * 解析JSON字符串，容错处理
 */
const parseJSON = (jsonStr: string | undefined): any => {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
};

/**
 * 格式化数组中的港口ID为港口名称
 */
const formatPortArray = (portIds: any[], portMap: Map<number, PortInfo>): string => {
  if (!Array.isArray(portIds) || portIds.length === 0) {
    return '[]';
  }
  
  const portNames = portIds
    .map(id => {
      const port = portMap.get(Number(id));
      return port ? `${port.portCode} ${port.portName}` : `ID:${id}`;
    })
    .join('; ');
  
  return `[ ${portNames} ]`;
};

/**
 * 格式化JSON对象为可读的格式
 */
const formatValue = (value: any, fieldName?: string, portMap?: Map<number, PortInfo>, yesText: string = '是', noText: string = '否'): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? yesText : noText;
  
  // 处理港口数组字段
  if (Array.isArray(value) && (fieldName === 'podIds' || fieldName === 'polIds')) {
    if (portMap) {
      return formatPortArray(value, portMap);
    }
    // 如果还没有加载港口数据，显示临时值
    return value.length === 0 ? '[]' : `[ ${value.join(', ')} ]`;
  }
  
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

/**
 * 对比两个对象，返回变更的字段
 */
const getChangedFields = (oldObj: any, newObj: any, portMap?: Map<number, PortInfo>, yesText?: string, noText?: string): Array<{ field: string; oldVal: string; newVal: string }> => {
  const changes: Array<{ field: string; oldVal: string; newVal: string }> = [];
  
  if (!oldObj || !newObj || typeof oldObj !== 'object' || typeof newObj !== 'object') {
    return changes;
  }

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  
  allKeys.forEach(key => {
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    
    // 跳过offers和containerLines这样的复杂关联数据
    if (key === 'offers' || key === 'containerLines') {
      return;
    }
    
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: key,
        oldVal: formatValue(oldVal, key, portMap, yesText, noText),
        newVal: formatValue(newVal, key, portMap, yesText, noText)
      });
    }
  });
  
  return changes;
};

/**
 * 获取字段标签 - 使用翻译
 */
const getFieldLabel = (field: string, fieldLabels: any): string => {
  return fieldLabels[field] || field;
};

export const ChangeDetailsModal: React.FC<ChangeDetailsModalProps> = ({ isOpen, onClose, log }) => {
  const { language, translations } = useLanguage();
  const [portMap, setPortMap] = useState<Map<number, PortInfo>>(new Map());
  const [portsLoading, setPortsLoading] = useState(false);
  
  // 加载港口数据（包括海港和空港）
  useEffect(() => {
    if (!isOpen || !log) return;
    
    const loadPorts = async () => {
      try {
        setPortsLoading(true);
        // 加载海港
        const seaPorts = await masterDataApi.searchPorts('SEA', '');
        // 加载空港
        const airPorts = await masterDataApi.searchPorts('AIR', '');
        
        const ports = [...seaPorts, ...airPorts];
        const map = new Map<number, PortInfo>();
        
        // 需要为每个港口获取详细信息来获取portCode和portName
        for (const port of ports) {
          const portId = Number(port.value);
          if (Number.isNaN(portId)) {
            continue;
          }

          const portDetail = await masterDataApi.getPortById(portId);
          if (portDetail) {
            map.set(portId, {
              id: portDetail.id,
              portCode: portDetail.portCode,
              portName: portDetail.portName
            });
          }
        }
        
        setPortMap(map);
      } catch (error) {
        console.error('Failed to load ports:', error);
      } finally {
        setPortsLoading(false);
      }
    };
    
    loadPorts();
  }, [isOpen, log]);
  
  if (!isOpen || !log) {
    return null;
  }

  const oldData = parseJSON(log.oldValue);
  const newData = parseJSON(log.newValue);
  const yesText = translations.common.yes;
  const noText = translations.common.no;
  const changedFields = getChangedFields(oldData, newData, portMap, yesText, noText);
  const detailsFromField = log.details;

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  const getActionLabel = (action: string) => {
    const actionKey = action as keyof typeof translations.auditActions;
    return translations.auditActions[actionKey] || action;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-bold text-white">{translations.changeDetails.title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-indigo-700 rounded-md p-1 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* 操作基本信息 */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{translations.changeDetails.operationInfo}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">{translations.changeDetails.operationLogId}</p>
                <p className="text-sm font-semibold text-gray-900">{log.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{translations.changeDetails.operationUser}</p>
                <p className="text-sm font-semibold text-gray-900">{log.username}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{translations.changeDetails.userRole}</p>
                <p className="text-sm font-semibold text-gray-900">{log.userRole || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{translations.changeDetails.operationTime}</p>
                <p className="text-sm font-semibold text-gray-900">{formatDateTime(log.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{translations.changeDetails.operationType}</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getActionLabel(log.action)}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{translations.changeDetails.resourceType}</p>
                <p className="text-sm font-semibold text-gray-900">{log.resourceType}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-600 mb-1">{translations.changeDetails.resourceId}</p>
                <p className="text-sm font-semibold text-gray-900">{log.resourceId || '-'}</p>
              </div>
            </div>
          </div>

          {/* 变更详情摘要（来自details字段） */}
          {detailsFromField && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{translations.changeDetails.changeSummary}</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {detailsFromField}
              </p>
            </div>
          )}

          {/* 如果是UPDATE操作，显示字段变更详情 */}
          {log.action === 'UPDATE' && changedFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">{translations.changeDetails.fieldChanges}</h3>
              <div className="space-y-3">
                {changedFields.map((change, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="grid grid-cols-3 gap-4">
                      {/* 字段名 */}
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">{translations.changeDetails.field}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {getFieldLabel(change.field, translations.fieldLabels)}
                        </p>
                      </div>

                      {/* 原值 */}
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wider mb-2 text-red-600">{translations.changeDetails.before}</p>
                        <div className="bg-red-50 rounded p-2 min-h-12 flex items-center border border-red-200">
                          <p className="text-sm text-gray-700 break-words font-mono">
                            {change.oldVal}
                          </p>
                        </div>
                      </div>

                      {/* 新值 */}
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wider mb-2 text-green-600">{translations.changeDetails.after}</p>
                        <div className="bg-green-50 rounded p-2 min-h-12 flex items-center border border-green-200">
                          <p className="text-sm text-gray-700 break-words font-mono font-semibold">
                            {change.newVal}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 如果是CREATE操作，显示新增的数据 */}
          {log.action === 'CREATE' && newData && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">{translations.changeDetails.newData}</h3>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(newData).map(([key, value]) => {
                    // 跳过复杂数据
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                      return null;
                    }
                    return (
                      <div key={key} className="border-b border-green-100 pb-3 last:border-b-0">
                        <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                          {getFieldLabel(key, translations.fieldLabels)}
                        </p>
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {formatValue(value, key, portMap, yesText, noText)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 如果是DELETE操作，显示删除的数据 */}
          {log.action === 'DELETE' && oldData && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">{translations.changeDetails.deletedData}</h3>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(oldData).map(([key, value]) => {
                    // 跳过复杂数据
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                      return null;
                    }
                    return (
                      <div key={key} className="border-b border-red-100 pb-3 last:border-b-0">
                        <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                          {getFieldLabel(key, translations.fieldLabels)}
                        </p>
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {formatValue(value, key, portMap, yesText, noText)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 如果没有任何变更数据 */}
          {log.action !== 'CREATE' && log.action !== 'DELETE' && changedFields.length === 0 && !detailsFromField && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm text-yellow-700">{translations.changeDetails.noChangeInfo}</p>
            </div>
          )}

          {/* 原始JSON数据（高级用户） */}
          {(log.oldValue || log.newValue) && (
            <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <summary className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-indigo-600">
                📋 {translations.changeDetails.rawData}
              </summary>
              <div className="mt-4 space-y-4">
                {log.oldValue && (
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-2">{translations.changeDetails.beforeData}</p>
                    <pre className="bg-white border border-gray-200 rounded p-3 overflow-x-auto text-xs text-gray-700 max-h-64 overflow-y-auto">
                      {log.oldValue}
                    </pre>
                  </div>
                )}
                {log.newValue && (
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-2">{translations.changeDetails.afterData}</p>
                    <pre className="bg-white border border-gray-200 rounded p-3 overflow-x-auto text-xs text-gray-700 max-h-64 overflow-y-auto">
                      {log.newValue}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        {/* 页脚 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition text-sm font-medium"
          >
            {translations.changeDetails.closeButton}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeDetailsModal;
