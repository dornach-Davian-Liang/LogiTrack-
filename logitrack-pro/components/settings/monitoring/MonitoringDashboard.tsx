import React, { useState } from 'react';
import { Activity, FileText, Sliders, Settings2, PlayCircle, Target } from 'lucide-react';
import StatusOverview from './tabs/StatusOverview';
import ProcessingLogs from './tabs/ProcessingLogs';
import DebugControl from './tabs/DebugControl';
import ConfigViewer from './tabs/ConfigViewer';
import ServiceControl from './tabs/ServiceControl';
import AITraining from './tabs/AITraining';

// ─── Tab 定义 ─────────────────────────────────────────────────────────────────

type MonitorTab = 'overview' | 'logs' | 'debug' | 'config' | 'service' | 'training';

const TABS: { id: MonitorTab; label: string; icon: React.ReactNode }[] = [
  { id: 'service',  label: '🚀 服务管理',   icon: <PlayCircle size={16} /> },
  { id: 'overview', label: '📊 实时状态',   icon: <Activity size={16} /> },
  { id: 'logs',     label: '📋 处理日志',   icon: <FileText size={16} /> },
  { id: 'debug',    label: '🛠 调试控制',   icon: <Sliders size={16} /> },
  { id: 'config',    label: '⚙️ 配置查看',   icon: <Settings2 size={16} /> },
  { id: 'training',  label: '🎯 AI 训练',     icon: <Target size={16} /> },
];

// ─── 主容器 ───────────────────────────────────────────────────────────────────

const MonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MonitorTab>('service');

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
      </div>
    </div>
  );
};

export default MonitoringDashboard;
