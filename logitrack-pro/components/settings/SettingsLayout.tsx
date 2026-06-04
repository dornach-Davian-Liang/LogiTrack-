import React, { useState } from 'react';
import { Settings as SettingsIcon, ClipboardList, Users, Activity } from 'lucide-react';
import AuditLog from './AuditLog';
import UserManagement from './UserManagement';
import MonitoringDashboard from './monitoring/MonitoringDashboard';
import { useLanguage } from '../../i18n/LanguageContext';

type SettingsTab = 'audit-log' | 'user-management' | 'email-monitor';

export const SettingsLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('audit-log');
  const { translations: t } = useLanguage();

  const tabs = [
    {
      id: 'user-management' as const,
      label: t.settings.tabs.userManagement,
      icon: Users,
    },
    {
      id: 'audit-log' as const,
      label: t.settings.tabs.auditLog,
      icon: ClipboardList,
    },
    {
      id: 'email-monitor' as const,
      label: t.settings.tabs.emailMonitor,
      icon: Activity,
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* 标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon size={32} />
          {t.settings.title}
        </h1>
        <p className="text-gray-500 mt-1">{t.settings.subtitle}</p>
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
        {activeTab === 'email-monitor' && <MonitoringDashboard />}
      </div>
    </div>
  );
};

export default SettingsLayout;
