import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, RefreshCw, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { processApi, monitorPyApi, ProcessStatusDTO, PyApiStatus } from '../../../../services/monitorApi';
import { useLanguage } from '../../../../i18n/LanguageContext';

// ─── 运行模式配置 ─────────────────────────────────────────────────────────────

const MODE_OPTIONS = [
  {
    value: 'DRY_RUN',
    label: '🟢 DRY-RUN',
    descKey: 'modeDryRunDesc' as const,
    color: 'border-green-400 bg-green-50 text-green-800',
    activeColor: 'border-green-600 bg-green-600 text-white',
  },
  {
    value: 'TEST_FORWARD',
    label: '🟡 TEST-FORWARD',
    descKey: 'modeTestForwardDesc' as const,
    color: 'border-yellow-400 bg-yellow-50 text-yellow-800',
    activeColor: 'border-yellow-500 bg-yellow-500 text-white',
  },
  {
    value: 'LIVE',
    label: '🔴 LIVE',
    descKey: 'modeLiveDesc' as const,
    color: 'border-red-400 bg-red-50 text-red-800',
    activeColor: 'border-red-600 bg-red-600 text-white',
  },
];

// ─── 服务状态卡片 ─────────────────────────────────────────────────────────────

interface StatusBannerProps {
  status: ProcessStatusDTO | null;
  pyStatus: PyApiStatus | null;
  loading: boolean;
  pyApiOnline: boolean;
}

const StatusBanner: React.FC<StatusBannerProps> = ({ status, pyStatus, loading, pyApiOnline }) => {
  const { translations: t } = useLanguage();
  const svc = t.monitoring.service;
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
        <RefreshCw className="animate-spin text-gray-400" size={20} />
        <span className="text-gray-500 text-sm">{svc.checkingStatus}</span>
      </div>
    );
  }

  const running = status?.running ?? false;

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
      running
        ? 'border-green-400 bg-green-50'
        : 'border-red-300 bg-red-50'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`w-4 h-4 rounded-full ${running ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
        <div>
          <div className={`font-semibold text-base ${running ? 'text-green-800' : 'text-red-800'}`}>
            {running ? svc.running : svc.stopped}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {running && status?.pid && <span>{svc.pid} {status.pid}　</span>}
            {running && status?.runMode && (
              <span>
                {svc.mode} <strong>{status.runMode}</strong>
              </span>
            )}
            {running && pyApiOnline && pyStatus?.create_ref_mode && (
              <span className="ml-2">
                · {svc.logitrackMode} <strong>{pyStatus.create_ref_mode}</strong>
              </span>
            )}
            {running && !pyApiOnline && <span className="ml-2 text-yellow-600">{svc.apiOffline}</span>}
            {!running && svc.clickToStart}
          </div>
        </div>
      </div>
      {running && pyApiOnline && (
        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-300">
          {svc.apiOnline}
        </span>
      )}
    </div>
  );
};

// ─── 参数配置面板 ─────────────────────────────────────────────────────────────

interface LaunchConfigProps {
  runMode: string;
  setRunMode: (v: string) => void;
  pollInterval: number;
  setPollInterval: (v: number) => void;
  createRefMode: string;
  setCreateRefMode: (v: string) => void;
  testMailbox: string;
  setTestMailbox: (v: string) => void;
  auditBcc: string;
  setAuditBcc: (v: string) => void;
  disabled?: boolean;
}

const LaunchConfig: React.FC<LaunchConfigProps> = ({
  runMode, setRunMode, pollInterval, setPollInterval,
  createRefMode, setCreateRefMode, testMailbox, setTestMailbox,
  auditBcc, setAuditBcc,
  disabled,
}) => {
  const { translations: t } = useLanguage();
  const svc = t.monitoring.service;
  return (
  <div className={`space-y-5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    {/* 运行模式 */}
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700">{svc.runMode}</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {MODE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setRunMode(opt.value)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              runMode === opt.value ? opt.activeColor : opt.color + ' hover:opacity-80'
            }`}
          >
            <div className="font-medium text-sm">{opt.label}</div>
            <div className={`text-xs mt-0.5 ${runMode === opt.value ? 'opacity-80' : 'opacity-60'}`}>
              {svc[opt.descKey]}
            </div>
          </button>
        ))}
      </div>
    </div>

    {/* TEST 邮箱（仅 TEST_FORWARD 模式显示） */}
    {runMode === 'TEST_FORWARD' && (
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-700">
          {svc.testMailbox} <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={testMailbox}
          onChange={e => setTestMailbox(e.target.value)}
          placeholder={svc.testMailboxPlaceholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>
    )}

    {/* LIVE 审核 BCC 邮箱（仅 LIVE 模式显示） */}
    {runMode === 'LIVE' && (
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-700">
          {svc.auditBcc}
        </label>
        <input
          type="email"
          value={auditBcc}
          onChange={e => setAuditBcc(e.target.value)}
          placeholder={svc.auditBccPlaceholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <p className="text-xs text-gray-400">{svc.auditBccHint}</p>
      </div>
    )}

    {/* 轮询间隔 */}
    <div className="space-y-1">
      <label className="text-sm font-semibold text-gray-700">{svc.pollInterval}</label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={10}
          max={3600}
          value={pollInterval}
          onChange={e => setPollInterval(Math.max(10, parseInt(e.target.value) || 60))}
          className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <span className="text-xs text-gray-500">
          {svc.pollIntervalHint}
        </span>
      </div>
      <div className="flex gap-2">
        {[30, 60, 120, 300].map(s => (
          <button
            key={s}
            onClick={() => setPollInterval(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              pollInterval === s
                ? 'border-indigo-500 bg-indigo-500 text-white'
                : 'border-gray-300 text-gray-600 hover:border-indigo-400'
            }`}
          >
            {s}s
          </button>
        ))}
      </div>
    </div>

    {/* LogiTrack 建单模式 */}
    <div className="space-y-1">
      <label className="text-sm font-semibold text-gray-700">{svc.logitrackMode}</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={() => setCreateRefMode('DRY_RUN')}
          className={`p-3 rounded-lg border-2 text-sm transition-all ${
            createRefMode === 'DRY_RUN'
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-gray-200 text-gray-600 hover:border-blue-300'
          }`}
        >
          <div className="font-medium">{svc.logitrackDryRunLabel}</div>
          <div className={`text-xs mt-0.5 ${createRefMode === 'DRY_RUN' ? 'opacity-80' : 'text-gray-400'}`}>
            {svc.logitrackDryRunDesc}
          </div>
        </button>
        <button
          onClick={() => setCreateRefMode('TEST_FORWARD')}
          className={`p-3 rounded-lg border-2 text-sm transition-all ${
            createRefMode === 'TEST_FORWARD'
              ? 'border-yellow-500 bg-yellow-500 text-white'
              : 'border-gray-200 text-gray-600 hover:border-yellow-300'
          }`}
        >
          <div className="font-medium">{svc.logitrackTestForwardLabel}</div>
          <div className={`text-xs mt-0.5 ${createRefMode === 'TEST_FORWARD' ? 'opacity-80' : 'text-gray-400'}`}>
            {svc.logitrackTestForwardDesc}
          </div>
        </button>
        <button
          onClick={() => setCreateRefMode('LIVE')}
          className={`p-3 rounded-lg border-2 text-sm transition-all ${
            createRefMode === 'LIVE'
              ? 'border-purple-500 bg-purple-500 text-white'
              : 'border-gray-200 text-gray-600 hover:border-purple-300'
          }`}
        >
          <div className="font-medium">{svc.logitrackLiveLabel}</div>
          <div className={`text-xs mt-0.5 ${createRefMode === 'LIVE' ? 'opacity-80' : 'text-gray-400'}`}>
            {svc.logitrackLiveDesc}
          </div>
        </button>
      </div>
    </div>
  </div>
  );
};

// ─── 运行时参数调整（服务已运行时） ──────────────────────────────────────────

interface RuntimeControlProps {
  currentPollInterval: number | null;
  currentCreateRefMode: string | null;
  onRefresh?: () => void;
}

const RuntimeControl: React.FC<RuntimeControlProps> = ({ currentPollInterval, currentCreateRefMode, onRefresh }) => {
  const [pollInterval, setPollInterval] = useState(currentPollInterval ?? 60);
  const [createRefMode, setCreateRefMode] = useState(currentCreateRefMode ?? 'DRY_RUN');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { translations: t } = useLanguage();
  const svc = t.monitoring.service;

  useEffect(() => {
    if (currentPollInterval != null) {
      setPollInterval(currentPollInterval);
    }
  }, [currentPollInterval]);

  useEffect(() => {
    if (currentCreateRefMode) {
      setCreateRefMode(currentCreateRefMode);
    }
  }, [currentCreateRefMode]);

  const apply = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await Promise.all([
        monitorPyApi.setPollInterval(pollInterval),
        monitorPyApi.setCreateRefMode(createRefMode),
      ]);
      setMsg({ type: 'ok', text: `✅ ${pollInterval}s / CREATE_REF: ${createRefMode}` });
      // 应用成功后立即刷新顶部状态横幅，不等 15 秒自动刷新
      setTimeout(() => onRefresh?.(), 600);
    } catch (e: unknown) {
      setMsg({ type: 'err', text: `${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Settings size={14} />
        {svc.runtimeAdjustTitle}
      </div>

      <div className="space-y-3">
        {/* 轮询间隔 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">{svc.pollInterval}</label>
          <div className="flex items-center gap-2">
            <input
              type="number" min={10} max={3600}
              value={pollInterval}
              onChange={e => setPollInterval(Math.max(10, parseInt(e.target.value) || 60))}
              className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <div className="flex gap-1">
              {[30, 60, 120].map(s => (
                <button key={s} onClick={() => setPollInterval(s)}
                  className={`px-2 py-1 text-xs rounded border ${pollInterval === s ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300 text-gray-500 hover:border-indigo-300'}`}>
                  {s}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 建单模式（3-mode） */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">{svc.logitrackMode}</label>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCreateRefMode('DRY_RUN')}
              className={`px-3 py-1.5 text-xs rounded-lg border ${createRefMode === 'DRY_RUN' ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-300'}`}>
              {svc.logitrackDryRunLabel}
            </button>
            <button onClick={() => setCreateRefMode('TEST_FORWARD')}
              className={`px-3 py-1.5 text-xs rounded-lg border ${createRefMode === 'TEST_FORWARD' ? 'border-yellow-500 bg-yellow-500 text-white' : 'border-gray-300 text-gray-600 hover:border-yellow-300'}`}>
              {svc.logitrackTestForwardLabel}
            </button>
            <button onClick={() => setCreateRefMode('LIVE')}
              className={`px-3 py-1.5 text-xs rounded-lg border ${createRefMode === 'LIVE' ? 'border-purple-500 bg-purple-500 text-white' : 'border-gray-300 text-gray-600 hover:border-purple-300'}`}>
              {svc.logitrackLiveLabel}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={apply}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-all"
      >
        {loading ? svc.applying : svc.applyChanges}
      </button>

      {msg && (
        <div className={`text-xs rounded px-3 py-2 ${
          msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {msg.text}
        </div>
      )}
    </div>
  );
};

// ─── LIVE 确认弹窗 ────────────────────────────────────────────────────────────

interface LiveConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const LiveConfirmModal: React.FC<LiveConfirmModalProps> = ({ onConfirm, onCancel }) => {
  const { translations: t } = useLanguage();
  const svc = t.monitoring.service;
  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={24} />
        <div>
          <div className="font-bold text-gray-900 text-base">{svc.liveConfirmTitle}</div>
          <div className="text-sm text-gray-600 mt-2 space-y-1">
            <p>{svc.liveConfirmBody}</p>
            <p>Please confirm:</p>
            <ul className="list-disc ml-5 space-y-1 text-sm">
              <li>{svc.liveConfirmCheck1}</li>
              <li>{svc.liveConfirmCheck2}</li>
              <li>{svc.liveConfirmCheck3}</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          {svc.cancelBtn}
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold"
        >
          {svc.liveConfirmBtn}
        </button>
      </div>
    </div>
  </div>
  );
};

// ─── 主组件 ──────────────────────────────────────────────────────────────────

const ServiceControl: React.FC = () => {
  const [status, setStatus] = useState<ProcessStatusDTO | null>(null);
  const [pyStatus, setPyStatus] = useState<PyApiStatus | null>(null);
  const [pyApiOnline, setPyApiOnline] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const { translations: t } = useLanguage();
  const svc = t.monitoring.service;

  // 启动参数
  const [runMode, setRunMode] = useState('TEST_FORWARD');
  const [pollInterval, setPollInterval] = useState(60);
  const [createRefMode, setCreateRefMode] = useState('DRY_RUN');
  const [testMailbox, setTestMailbox] = useState('');
  const [auditBcc, setAuditBcc] = useState('');

  // 操作状态
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const s = await processApi.getStatus();
      setStatus(s);
    } catch {
      setStatus({ running: false, pid: null, runMode: null, startedAt: null, message: 'Status query failed' });
    }
    try {
      const py = await monitorPyApi.getStatus();
      setPyStatus(py);
      setPyApiOnline(true);
      setRunMode(py.run_mode ?? 'DRY_RUN');
      setPollInterval(py.poll_interval ?? 60);
      setCreateRefMode(py.create_ref_mode ?? 'DRY_RUN');
    } catch {
      setPyStatus(null);
      setPyApiOnline(false);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const timer = setInterval(refreshStatus, 15_000);
    return () => clearInterval(timer);
  }, [refreshStatus]);

  const doStart = async () => {
    if (runMode === 'LIVE') {
      setShowLiveConfirm(true);
      return;
    }
    await executeStart();
  };

  const executeStart = async () => {
    setShowLiveConfirm(false);
    setActionLoading(true);
    setActionMsg(null);
    try {
      const result = await processApi.start({
        runMode,
        pollInterval,
        createRefMode,
        testMailbox: runMode === 'TEST_FORWARD' ? testMailbox : undefined,
        auditBcc: runMode === 'LIVE' && auditBcc.trim() ? auditBcc.trim() : undefined,
      });
      setActionMsg({ type: 'ok', text: `✅ 服务已启动 (PID: ${result.pid ?? '?'})，运行模式: ${runMode}，CREATE_REF: ${createRefMode}` });
      setTimeout(refreshStatus, 3000);
    } catch (e: unknown) {
      setActionMsg({ type: 'err', text: `启动失败: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const result = await processApi.stop();
      setActionMsg({ type: 'ok', text: `✅ ${(result as Record<string, unknown>).message ?? '服务已停止'}` });
      setTimeout(refreshStatus, 2000);
    } catch (e: unknown) {
      setActionMsg({ type: 'err', text: `停止失败: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setActionLoading(false);
    }
  };

  const running = status?.running ?? false;

  return (
    <div className="space-y-5">
      {/* LIVE 确认弹窗 */}
      {showLiveConfirm && (
        <LiveConfirmModal
          onConfirm={executeStart}
          onCancel={() => setShowLiveConfirm(false)}
        />
      )}

      {/* 服务状态卡片 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <StatusBanner status={status} pyStatus={pyStatus} loading={statusLoading} pyApiOnline={pyApiOnline} />
        </div>
        <button
          onClick={refreshStatus}
          disabled={statusLoading}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 mt-0"
        title={svc.refreshStatus}
        >
          <RefreshCw size={16} className={statusLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 启动参数区（服务未运行时显示） */}
      {!running && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">{svc.launchConfig}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <LaunchConfig
            runMode={runMode}
            setRunMode={setRunMode}
            pollInterval={pollInterval}
            setPollInterval={setPollInterval}
            createRefMode={createRefMode}
            setCreateRefMode={setCreateRefMode}
            testMailbox={testMailbox}
            setTestMailbox={setTestMailbox}
            auditBcc={auditBcc}
            setAuditBcc={setAuditBcc}
          />
        </div>
      )}

      {/* 启动/停止按钮 */}
      <div className="flex gap-3">
        {!running ? (
          <button
            onClick={doStart}
            disabled={actionLoading || (runMode === 'TEST_FORWARD' && !testMailbox.trim())}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition-all shadow-sm"
          >
            <Play size={16} />
            {actionLoading ? svc.starting : svc.startService}
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition-all shadow-sm"
          >
            <Square size={16} />
            {actionLoading ? svc.stopping : svc.stopService}
          </button>
        )}

        {runMode === 'TEST_FORWARD' && !testMailbox.trim() && !running && (
            <span className="flex items-center gap-1 text-xs text-yellow-600 self-center">
              <AlertTriangle size={12} />
              {svc.fillTestMailbox}
            </span>
        )}
      </div>

      {/* 操作结果 */}
      {actionMsg && (
        <div className={`flex items-start gap-2 text-sm rounded-lg px-4 py-3 ${
          actionMsg.type === 'ok'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {actionMsg.type === 'ok'
            ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            : <XCircle size={16} className="mt-0.5 flex-shrink-0" />}
          {actionMsg.text}
        </div>
      )}

      {/* 运行时参数调整（服务运行中时显示） */}
      {running && pyApiOnline && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">{svc.runtimeAdjust}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <RuntimeControl
            currentPollInterval={pyStatus?.poll_interval ?? null}
            currentCreateRefMode={pyStatus?.create_ref_mode ?? null}
            onRefresh={refreshStatus}
          />
        </div>
      )}

      {/* 服务运行中但 PyAPI 不可用时的提示 */}
      {running && !pyApiOnline && (
        <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <strong>⚠️ {svc.apiOffline}</strong>: {svc.pyApiNotReady}
        </div>
      )}

      {/* 说明 */}
      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 space-y-1 border border-gray-100">
        <div><strong>Start</strong>: {svc.infoStart}</div>
        <div><strong>Stop</strong>: {svc.infoStop}</div>
        <div><strong>Mode</strong>: {svc.infoMode}</div>
      </div>
    </div>
  );
};

export default ServiceControl;
