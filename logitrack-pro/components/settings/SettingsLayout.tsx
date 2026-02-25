import React, { useState } from 'react';
import { Settings as SettingsIcon, ClipboardList, Users } from 'lucide-react';
import AuditLog from './AuditLog';
import UserManagement from './UserManagement';

type SettingsTab = 'audit-log' | 'user-management';

export const SettingsLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('audit-log');

  const tabs = [
    {
      id: 'user-management' as const,
      label: '👥 用户管理',
      icon: Users,
      description: '用户账号、权限与状态管理'
    },
    {
      id: 'audit-log' as const,
      label: '📋 操作日志',
      icon: ClipboardList,
      description: '系统操作审计日志'
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* 标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon size={32} />
          系统设置
        </h1>
        <p className="text-gray-500 mt-1">管理系统配置、主数据和操作日志</p>
      </div>

      {/* 选项卡导航 */}
      <div className="bg-white rounded-lg border-b border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="bg-white rounded-lg p-6">
        {activeTab === 'user-management' && <UserManagement />}
        {activeTab === 'audit-log' && <AuditLog />}
      </div>
    </div>
  );
};

export default SettingsLayout;
