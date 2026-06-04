import React, { useState } from 'react';
import { Activity, FileText, Sliders, Settings2, PlayCircle, Target, ShieldCheck } from 'lucide-react';
import StatusOverview from './tabs/StatusOverview';
import ProcessingLogs from './tabs/ProcessingLogs';
import DebugControl from './tabs/DebugControl';
import ConfigViewer from './tabs/ConfigViewer';
import ServiceControl from './tabs/ServiceControl';
import AITraining from './tabs/AITraining';
import DataQualityCheck from './tabs/DataQualityCheck';
import { useLanguage } from '../../../i18n/LanguageContext';

// ─── Tab 定义 ─────────────────────────────────────────────────────────────────

type MonitorTab = 'overview' | 'logs' | 'debug' | 'config' | 'service' | 'training' | 'quality';

// ─── 主容器 ───────────────────────────────────────────────────────────────────

const MonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MonitorTab>('service');
  const { translations: t } = useLanguage();

  const TABS: { id: MonitorTab; label: string; icon: React.ReactNode }[] = [
    { id: 'service',  label: t.monitoring.tabs.service,   icon: <PlayCircle size={16} /> },
    { id: 'overview', label: t.monitoring.tabs.overview,  icon: <Activity size={16} /> },
    { id: 'logs',     label: t.monitoring.tabs.logs,      icon: <FileText size={16} /> },
    { id: 'debug',    label: t.monitoring.tabs.debug,     icon: <Sliders size={16} /> },
    { id: 'config',   label: t.monitoring.tabs.config,    icon: <Settings2 size={16} /> },
    { id: 'training', label: t.monitoring.tabs.training,  icon: <Target size={16} /> },
    { id: 'quality',  label: t.monitoring.tabs.quality,   icon: <ShieldCheck size={16} /> },
  ];

  return (
    <div className="space-y-4">
      {/* Tab 导航 */}
      <div className="flex flex-wrap gap-0 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="min-h-64">
        {activeTab === 'service'  && <ServiceControl />}
        {activeTab === 'overview' && <StatusOverview />}
        {activeTab === 'logs'     && <ProcessingLogs />}
        {activeTab === 'debug'    && <DebugControl />}
        {activeTab === 'config'   && <ConfigViewer />}
        {activeTab === 'training' && <AITraining />}
        {activeTab === 'quality'  && <DataQualityCheck />}
      </div>
    </div>
  );
};

export default MonitoringDashboard;
