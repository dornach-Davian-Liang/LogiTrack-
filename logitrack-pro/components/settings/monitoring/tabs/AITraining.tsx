/**
 * AITraining — AI 训练管理 Tab
 *
 * 顶部：FewShotStatusBar（few-shot 用量概览 + autoRegressionTick 触发回归）
 * 子 Tab 1：训练案例库（TrainingCaseList）
 * 子 Tab 2：路由模拟器（WhatIfSimulator）
 * 子 Tab 3：回归测试（RegressionRunner）
 */
import React, { useState } from 'react';
import FewShotStatusBar from '../training/FewShotStatusBar';
import TrainingCaseList from '../training/TrainingCaseList';
import WhatIfSimulator from '../training/WhatIfSimulator';
import RegressionRunner from '../training/RegressionRunner';
import CaseEditModal from '../training/CaseEditModal';
import { monitorPyApi } from '../../../../services/monitorApi';

type SubTab = 'cases' | 'simulator' | 'regression';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'cases',      label: '📚 案例库' },
  { id: 'simulator',  label: '🧪 路由模拟器' },
  { id: 'regression', label: '🔁 回归测试' },
];

const AITraining: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('cases');
  const [refreshTick, setRefreshTick] = useState(0);
  const [regressionTick, setRegressionTick] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  const refresh = () => {
    setRefreshTick(t => t + 1);
    setRegressionTick(t => t + 1);  // 保存案例后自动触发回归
  };

  return (
    <div className="space-y-4">
      {/* Few-shot 状态栏（含 Prompt 预览 + 自动回归） */}
      <FewShotStatusBar refreshTick={refreshTick} autoRegressionTick={regressionTick} />

      {/* 子 Tab 导航 */}
      <div className="flex gap-0 border-b border-gray-200">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px ${
              subTab === t.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 子 Tab 内容 */}
      <div>
        {subTab === 'cases' && (
          <TrainingCaseList
            refreshTick={refreshTick}
            onAddCase={() => setShowAddModal(true)}
          />
        )}
        {subTab === 'simulator' && <WhatIfSimulator />}
        {subTab === 'regression' && <RegressionRunner />}
      </div>

      {/* 新建案例弹窗 */}
      {showAddModal && (
        <CaseEditModal
          mode="create"
          onSave={async (data) => {
            await monitorPyApi.createTrainingCase(data);
            refresh();
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default AITraining;

