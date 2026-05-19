import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, RefreshCw, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { processApi, monitorPyApi, ProcessStatusDTO } from '../../../../services/monitorApi';

// ─── 运行模式配置 ─────────────────────────────────────────────────────────────

const MODE_OPTIONS = [
  {
    value: 'DRY_RUN',
    label: '🟢 DRY-RUN',
    desc: '分析并计算路由，但不发送转发邮件',
    color: 'border-green-400 bg-green-50 text-green-800',
    activeColor: 'border-green-600 bg-green-600 text-white',
  },
  {
    value: 'TEST_FORWARD',
    label: '🟡 TEST-FORWARD',
    desc: '将邮件转发到测试邮箱，不影响真实客户',
    color: 'border-yellow-400 bg-yellow-50 text-yellow-800',
    activeColor: 'border-yellow-500 bg-yellow-500 text-white',
  },
  {
    value: 'LIVE',
    label: '🔴 LIVE',
    desc: '真实转发至客户 PIC，标记邮件已读',
    color: 'border-red-400 bg-red-50 text-red-800',
    activeColor: 'border-red-600 bg-red-600 text-white',
  },
];

// ─── 服务状态卡片 ─────────────────────────────────────────────────────────────

interface StatusBannerProps {
  status: ProcessStatusDTO | null;
  loading: boolean;
  pyApiOnline: boolean;
}

const StatusBanner: React.FC<StatusBannerProps> = ({ status, loading, pyApiOnline }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
        <RefreshCw className="animate-spin text-gray-400" size={20} />
        <span className="text-gray-500 text-sm">检查服务状态...</span>
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
            {running ? '✅ 服务运行中' : '⛔ 服务未运行'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {running && status?.pid && <span>PID: {status.pid}　</span>}
            {running && status?.runMode && (
              <span>
                模式: <strong>{status.runMode}</strong>
                {!pyApiOnline && <span className="ml-2 text-yellow-600">（监控 API 暂不可达）</span>}
              </span>
            )}
            {!running && '点击下方按钮启动服务'}
          </div>
        </div>
      </div>
      {running && pyApiOnline && (
        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-300">
          监控 API 在线
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
  logitrackDryRun: boolean;
  setLogitrackDryRun: (v: boolean) => void;
  testMailbox: string;
  setTestMailbox: (v: string) => void;
  auditBcc: string;
  setAuditBcc: (v: string) => void;
  disabled?: boolean;
}

const LaunchConfig: React.FC<LaunchConfigProps> = ({
  runMode, setRunMode, pollInterval, setPollInterval,
  logitrackDryRun, setLogitrackDryRun, testMailbox, setTestMailbox,
  auditBcc, setAuditBcc,
  disabled,
}) => (
  <div className={`space-y-5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    {/* 运行模式 */}
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700">运行模式</label>
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
              {opt.desc}
            </div>
          </button>
        ))}
      </div>
    </div>

    {/* TEST 邮箱（仅 TEST_FORWARD 模式显示） */}
    {runMode === 'TEST_FORWARD' && (
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-700">
          TEST_FORWARD 目标邮箱 <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={testMailbox}
          onChange={e => setTestMailbox(e.target.value)}
          placeholder="转发到此邮箱进行测试，例如: your.name@zieglergroup.cn"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>
    )}

    {/* LIVE 审核 BCC 邮箱（仅 LIVE 模式显示） */}
    {runMode === 'LIVE' && (
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-700">
          LIVE 审核 BCC 邮箱
        </label>
        <input
          type="email"
          value={auditBcc}
          onChange={e => setAuditBcc(e.target.value)}
          placeholder="转发邮件同时 BCC 到此邮箱，留空则使用默认值"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <p className="text-xs text-gray-400">每封转发邮件将同时 BCC 到该邮箱以供审核（默认: davian.liang@zieglergroup.cn）</p>
      </div>
    )}

    {/* 轮询间隔 */}
    <div className="space-y-1">
      <label className="text-sm font-semibold text-gray-700">轮询间隔（秒）</label>
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
          每隔此秒数检查一次新邮件（最小 10 秒，推荐 60 秒）
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
      <label className="text-sm font-semibold text-gray-700">LogiTrack 建单模式</label>
      <div className="flex gap-3">
        <button
          onClick={() => setLogitrackDryRun(true)}
          className={`flex-1 p-3 rounded-lg border-2 text-sm transition-all ${
            logitrackDryRun
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-gray-200 text-gray-600 hover:border-blue-300'
          }`}
        >
          <div className="font-medium">🖨 DRY-RUN 打印</div>
          <div className={`text-xs mt-0.5 ${logitrackDryRun ? 'opacity-80' : 'text-gray-400'}`}>
            构建建单 payload 但只打印日志，不实际写入 LogiTrack
          </div>
        </button>
        <button
          onClick={() => setLogitrackDryRun(false)}
          className={`flex-1 p-3 rounded-lg border-2 text-sm transition-all ${
            !logitrackDryRun
              ? 'border-purple-500 bg-purple-500 text-white'
              : 'border-gray-200 text-gray-600 hover:border-purple-300'
          }`}
        >
          <div className="font-medium">📝 实际建单</div>
          <div className={`text-xs mt-0.5 ${!logitrackDryRun ? 'opacity-80' : 'text-gray-400'}`}>
            自动在 LogiTrack 中创建询价单（需 LOGITRACK_ENABLED=true）
          </div>
        </button>
      </div>
    </div>
  </div>
);

// ─── 运行时参数调整（服务已运行时） ──────────────────────────────────────────

interface RuntimeControlProps {
  currentPollInterval: number | null;
  currentDryRun: boolean | null;
}

const RuntimeControl: React.FC<RuntimeControlProps> = ({ currentPollInterval, currentDryRun }) => {
  const [pollInterval, setPollInterval] = useState(currentPollInterval ?? 60);
  const [dryRun, setDryRun] = useState(currentDryRun ?? true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await Promise.all([
        monitorPyApi.setPollInterval(pollInterval),
        monitorPyApi.setLogitrackDryRun(dryRun),
      ]);
      setMsg({ type: 'ok', text: `✅ 已应用：轮询间隔 ${pollInterval}s，建单模式 ${dryRun ? 'DRY-RUN' : '实际建单'}` });
    } catch (e: unknown) {
      setMsg({ type: 'err', text: `失败: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Settings size={14} />
        运行时参数调整（即时生效，无需重启）
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 轮询间隔 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">轮询间隔（秒）</label>
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

        {/* 建单模式 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">LogiTrack 建单模式</label>
          <div className="flex gap-2">
            <button onClick={() => setDryRun(true)}
              className={`px-3 py-1.5 text-xs rounded-lg border ${dryRun ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-300'}`}>
              🖨 DRY-RUN
            </button>
            <button onClick={() => setDryRun(false)}
              className={`px-3 py-1.5 text-xs rounded-lg border ${!dryRun ? 'border-purple-500 bg-purple-500 text-white' : 'border-gray-300 text-gray-600 hover:border-purple-300'}`}>
              📝 实际建单
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={apply}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-all"
      >
        {loading ? '应用中...' : '✅ 应用更改'}
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

const LiveConfirmModal: React.FC<LiveConfirmModalProps> = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={24} />
        <div>
          <div className="font-bold text-gray-900 text-base">启动 LIVE 模式确认</div>
          <div className="text-sm text-gray-600 mt-2 space-y-1">
            <p>⚠️ <strong>LIVE 模式将真实转发邮件给客户 PIC</strong>，并标记原邮件为已读。</p>
            <p>请确认：</p>
            <ul className="list-disc ml-5 space-y-1 text-sm">
              <li>路由规则已经过 TEST_FORWARD 验证</li>
              <li>pic_routing.json 配置准确无误</li>
              <li>业务负责人已知悉并批准启用 LIVE 模式</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold"
        >
          确认启动 LIVE
        </button>
      </div>
    </div>
  </div>
);

// ─── 主组件 ──────────────────────────────────────────────────────────────────

const ServiceControl: React.FC = () => {
  const [status, setStatus] = useState<ProcessStatusDTO | null>(null);
  const [pyApiOnline, setPyApiOnline] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  // 启动参数
  const [runMode, setRunMode] = useState('TEST_FORWARD');
  const [pollInterval, setPollInterval] = useState(60);
  const [logitrackDryRun, setLogitrackDryRun] = useState(true);
  const [testMailbox, setTestMailbox] = useState('');
  const [auditBcc, setAuditBcc] = useState('');

  // 操作状态
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await processApi.getStatus();
      setStatus(s);
    } catch {
      setStatus({ running: false, pid: null, runMode: null, startedAt: null, message: '状态查询失败' });
    }
    try {
      await monitorPyApi.getStatus();
      setPyApiOnline(true);
    } catch {
      setPyApiOnline(false);
    }
    setStatusLoading(false);
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
        logitrackDryRun,
        testMailbox: runMode === 'TEST_FORWARD' ? testMailbox : undefined,
        auditBcc: runMode === 'LIVE' && auditBcc.trim() ? auditBcc.trim() : undefined,
      });
      setActionMsg({ type: 'ok', text: `✅ 服务已启动 (PID: ${result.pid ?? '?'})，模式: ${runMode}` });
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
          <StatusBanner status={status} loading={statusLoading} pyApiOnline={pyApiOnline} />
        </div>
        <button
          onClick={refreshStatus}
          disabled={statusLoading}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 mt-0"
          title="刷新状态"
        >
          <RefreshCw size={16} className={statusLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 启动参数区（服务未运行时显示） */}
      {!running && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">启动参数配置</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <LaunchConfig
            runMode={runMode}
            setRunMode={setRunMode}
            pollInterval={pollInterval}
            setPollInterval={setPollInterval}
            logitrackDryRun={logitrackDryRun}
            setLogitrackDryRun={setLogitrackDryRun}
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
            {actionLoading ? '启动中...' : '▶ 启动服务'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition-all shadow-sm"
          >
            <Square size={16} />
            {actionLoading ? '停止中...' : '■ 停止服务'}
          </button>
        )}

        {runMode === 'TEST_FORWARD' && !testMailbox.trim() && !running && (
          <span className="flex items-center gap-1 text-xs text-yellow-600 self-center">
            <AlertTriangle size={12} />
            请填写 TEST_FORWARD 目标邮箱
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
            <span className="text-xs text-gray-400 font-medium">运行时调整</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <RuntimeControl
            currentPollInterval={null}
            currentDryRun={null}
          />
        </div>
      )}

      {/* 服务运行中但 PyAPI 不可用时的提示 */}
      {running && !pyApiOnline && (
        <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <strong>⚠️ 监控 API 暂不可达</strong>：服务进程已启动（PID: {status?.pid}），但 FastAPI 监控端口 :5100 尚未就绪。
          通常在进程启动后约 3-5 秒可达。请稍后刷新。
        </div>
      )}

      {/* 说明 */}
      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 space-y-1 border border-gray-100">
        <div><strong>启动行为</strong>：Spring Boot 以 ProcessBuilder 调用 <code>C:\Python314\python.exe main.py</code>，日志追加到 <code>logs/app.log</code></div>
        <div><strong>停止行为</strong>：通过 PID 文件记录的进程 ID 执行 <code>taskkill /F /PID {'{pid}'}</code></div>
        <div><strong>模式说明</strong>：LOGITRACK_DRY_RUN 与运行模式相互独立 — TEST_FORWARD 控制邮件转发目标，DRY-RUN 建单控制是否实际写入 LogiTrack</div>
      </div>
    </div>
  );
};

export default ServiceControl;
