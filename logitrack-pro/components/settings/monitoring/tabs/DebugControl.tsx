import React, { useState, useEffect } from 'react';
import { monitorPyApi } from '../../../../services/monitorApi';
import ModeSwitch from '../debug/ModeSwitch';
import ReplayPanel from '../debug/ReplayPanel';
import DebugTools from '../debug/DebugTools';

// ─── 日志级别控制 ─────────────────────────────────────────────────────────────

const LOG_LEVELS = [
  { level: 'DEBUG',   cls: 'bg-gray-100 text-gray-600 hover:bg-gray-200',       activeCls: 'bg-gray-700 text-white' },
  { level: 'INFO',    cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100',         activeCls: 'bg-blue-600 text-white' },
  { level: 'WARNING', cls: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',   activeCls: 'bg-yellow-500 text-white' },
  { level: 'ERROR',   cls: 'bg-red-50 text-red-700 hover:bg-red-100',            activeCls: 'bg-red-600 text-white' },
];

const LogLevelControl: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const setLevel = async (level: string) => {
    setLoading(true);
    setMsg(null);
    try {
      await monitorPyApi.setLogLevel(level);
      setCurrentLevel(level);
      setMsg(`日志级别已切换到 ${level}`);
    } catch (e: unknown) {
      setMsg(`切换失败: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-700">日志级别控制</div>
      <div className="flex flex-wrap gap-2">
        {LOG_LEVELS.map(({ level, cls, activeCls }) => (
          <button
            key={level}
            onClick={() => setLevel(level)}
            disabled={loading}
            className={`px-4 py-2 rounded font-medium text-sm transition-all disabled:opacity-40
              ${currentLevel === level ? activeCls : cls}`}
          >
            {level}
          </button>
        ))}
      </div>
      {msg && (
        <div className={`text-xs rounded px-3 py-1.5 ${
          msg.startsWith('切换失败')
            ? 'bg-red-50 text-red-600 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {msg}
        </div>
      )}
    </div>
  );
};

// ─── 立即轮询按钮 ─────────────────────────────────────────────────────────────

const PollNowButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handlePoll = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await monitorPyApi.pollNow();
      setMsg('✅ 轮询已触发，稍后查看实时状态Tab的结果');
    } catch (e: unknown) {
      setMsg(`触发失败: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-gray-700">立即触发轮询</div>
      <div className="flex items-center gap-3">
        <button
          onClick={handlePoll}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-40"
        >
          {loading ? '触发中...' : '🔄 立即轮询'}
        </button>
        {msg && <span className="text-xs text-gray-600">{msg}</span>}
      </div>
    </div>
  );
};

// ─── 主面板（Tab 切换：模式/日志/重放/工具） ──────────────────────────────────

type DebugTab = 'mode' | 'replay' | 'tools';

const DEBUG_TABS: { id: DebugTab; label: string }[] = [
  { id: 'mode',   label: '🎛 运行控制' },
  { id: 'replay', label: '🔁 邮件重放' },
  { id: 'tools',  label: '🔧 调试工具' },
];

const DebugControl: React.FC = () => {
  const [tab, setTab] = useState<DebugTab>('mode');
  const [currentMode, setCurrentMode] = useState<string | null>(null);

  useEffect(() => {
    monitorPyApi.getStatus()
      .then(s => setCurrentMode((s as unknown as Record<string, unknown>).run_mode as string ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      {/* 子 Tab 导航 */}
      <div className="flex gap-1 border-b border-gray-200">
        {DEBUG_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              tab === t.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 pt-1">
        {tab === 'mode' && (
          <>
            <ModeSwitch currentMode={currentMode} onModeChanged={setCurrentMode} />
            <hr className="border-gray-100" />
            <LogLevelControl />
            <hr className="border-gray-100" />
            <PollNowButton />
          </>
        )}
        {tab === 'replay' && <ReplayPanel />}
        {tab === 'tools'  && <DebugTools />}
      </div>
    </div>
  );
};

export default DebugControl;
