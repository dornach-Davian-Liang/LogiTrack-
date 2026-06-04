import React, { useEffect, useState, useCallback } from 'react';
import { Activity, CheckCircle, XCircle, AlertTriangle, Clock, BarChart2, Bot, ArrowUpCircle } from 'lucide-react';
import { monitorApi, monitorPyApi, MonitorStatsDTO, PyApiStatus } from '../../../../services/monitorApi';
import { useLanguage } from '../../../../i18n/LanguageContext';

// ─── 小工具组件 ──────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string | null | undefined;
  color?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color = 'text-gray-800', icon, highlight }) => (
  <div className={`bg-white rounded-lg border p-4 flex flex-col gap-1 shadow-sm ${highlight ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      {icon}
      <span>{label}</span>
    </div>
    <div className={`text-2xl font-bold ${color}`}>{value ?? '—'}</div>
  </div>
);

interface HealthDotProps {
  label: string;
  status: boolean | null | string;
  textUnknown: string;
  textNormal: string;
  textError: string;
}

const HealthDot: React.FC<HealthDotProps> = ({ label, status, textUnknown, textNormal, textError }) => {
  let color = 'bg-gray-300';
  let text = textUnknown;
  if (status === true || status === 'ok') { color = 'bg-green-500'; text = textNormal; }
  else if (status === false || status === 'error') { color = 'bg-red-500'; text = textError; }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-gray-600">{label}</span>
      <span className={`text-xs font-medium ${status === true || status === 'ok' ? 'text-green-600' : status === false || status === 'error' ? 'text-red-600' : 'text-gray-400'}`}>{text}</span>
    </div>
  );
};

const RunModeBadge: React.FC<{ mode: string | null | undefined }> = ({ mode }) => {
  if (!mode) return <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">未知</span>;
  const map: Record<string, { label: string; color: string }> = {
    'DRY_RUN':      { label: '🟢 DRY-RUN',      color: 'bg-green-100 text-green-700' },
    'TEST_FORWARD': { label: '🟡 TEST-FORWARD',  color: 'bg-yellow-100 text-yellow-700' },
    'LIVE':         { label: '🔴 LIVE',           color: 'bg-red-100 text-red-700' },
  };
  const cfg = map[mode] ?? { label: mode, color: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>;
};

function fmtUptime(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtTime(iso: string | null | undefined, secondsAgo: string, minutesAgo: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}${secondsAgo}`;
    if (diff < 3600) return `${Math.floor(diff / 60)}${minutesAgo}`;
    return d.toLocaleString();
  } catch { return iso; }
}

// ─── 主组件 ─────────────────────────────────────────────────────────────────

const StatusOverview: React.FC = () => {
  const [stats, setStats] = useState<MonitorStatsDTO | null>(null);
  const [pyStatus, setPyStatus] = useState<PyApiStatus | null>(null);
  const [pyError, setPyError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { translations: t } = useLanguage();
  const ov = t.monitoring.overview;

  const refresh = useCallback(async () => {
    try {
      const [s] = await Promise.all([monitorApi.getStats()]);
      setStats(s);
    } catch (e) {
      console.warn('[monitor] Spring Boot stats 获取失败:', e);
    }

    try {
      const py = await monitorPyApi.getStatus();
      setPyStatus(py);
      setPyError(false);
    } catch {
      setPyError(true);
    }

    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  // 合并 Python 实时状态 + Spring Boot 历史统计
  const runMode = pyStatus?.run_mode ?? stats?.runMode;
  const isRunning = pyStatus?.is_running ?? stats?.isRunning;
  const pollInterval = pyStatus?.poll_interval ?? stats?.pollInterval;
  const lastPoll = pyStatus?.last_poll_time ?? stats?.lastPollTime;
  const uptime = pyStatus?.uptime_seconds ?? stats?.uptimeSeconds;
  const health = pyStatus?.health;
  const consFail = pyStatus?.consecutive_failures ?? stats?.consecutiveFailures ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Activity className="animate-spin mr-2" size={20} />
        {ov.loading}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部：运行状态 + 刷新时间 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RunModeBadge mode={runMode} />
          {isRunning !== null && (
            <span className={`flex items-center gap-1 text-sm font-medium ${isRunning ? 'text-green-600' : 'text-gray-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              {isRunning ? ov.running : ov.stopped}
            </span>
          )}
          {pyError && (
              <span className="text-xs text-yellow-600 flex items-center gap-1">
              <AlertTriangle size={12} />
              {ov.pyApiUnavailable}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {lastRefresh ? `${ov.lastRefresh} ${fmtTime(lastRefresh.toISOString(), ov.secondsAgo, ov.minutesAgo)}` : ''}
          <span className="ml-2 text-gray-300">{ov.autoRefresh}</span>
        </span>
      </div>

      {/* 今日统计卡片 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">{ov.todayStats}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label={ov.todayTotal}     value={stats?.todayTotal}     color="text-blue-700"   icon={<BarChart2 size={14} />} />
          <StatCard label={ov.todayProcessed} value={stats?.todayProcessed} color="text-green-700"  icon={<CheckCircle size={14} />} />
          <StatCard label={ov.todaySkipped}   value={stats?.todaySkipped}   color="text-gray-600" />
          <StatCard label={ov.todayErrors}    value={stats?.todayErrors}    color="text-red-700"   highlight={(stats?.todayErrors ?? 0) > 0} icon={<XCircle size={14} />} />
          <StatCard label={ov.todayForwarded} value={stats?.todayForwarded} color="text-indigo-700" icon={<ArrowUpCircle size={14} />} />
          <StatCard label={ov.todayLogitrack} value={stats?.todayLogitrack} color="text-purple-700" icon={<Bot size={14} />} />
        </div>
      </div>

      {/* 运行状态 + 健康指示器 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 运行状态面板 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Clock size={15} />
            {ov.runStatus}
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>{ov.pollInterval}</span>
              <span className="font-medium">{pollInterval ? `${pollInterval}s` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>{ov.lastPoll}</span>
              <span className="font-medium">{fmtTime(lastPoll, ov.secondsAgo, ov.minutesAgo)}</span>
            </div>
            <div className="flex justify-between">
              <span>{ov.uptime}</span>
              <span className="font-medium">{fmtUptime(uptime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{ov.consecutiveFails}</span>
              <span className={`font-semibold ${consFail === 0 ? 'text-green-600' : consFail < 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                {consFail}{ov.failTimes}
              </span>
            </div>
          </div>
        </div>

        {/* 服务健康指示器 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Activity size={15} />
            {ov.serviceHealth}
          </h3>
          <div className="space-y-2">
            <HealthDot label="Microsoft Graph API" status={health?.graph_api ?? stats?.graphApiOk ?? null} textUnknown={ov.unknown} textNormal={ov.normal} textError={ov.error} />
            <HealthDot label="DeepSeek LLM"        status={health?.llm_api   ?? stats?.llmApiOk    ?? null} textUnknown={ov.unknown} textNormal={ov.normal} textError={ov.error} />
            <HealthDot label="VLM"                 status={health?.vlm_api   ?? stats?.vlmApiOk    ?? null} textUnknown={ov.unknown} textNormal={ov.normal} textError={ov.error} />
            <HealthDot label="LogiTrack API"        status={health?.logitrack ?? stats?.logitrackOk ?? null} textUnknown={ov.unknown} textNormal={ov.normal} textError={ov.error} />
          </div>
          {pyError && (
            <p className="text-xs text-gray-400 pt-1">{ov.healthSnapshot}</p>
          )}
        </div>
      </div>

      {/* 累计统计（仅在 Python 进程在线时显示） */}
      {pyStatus && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">{ov.sessionStats}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label={ov.totalProcessed} value={pyStatus.total_processed} color="text-blue-700" />
            <StatCard label={ov.totalSkipped}   value={pyStatus.total_skipped}   color="text-gray-600" />
            <StatCard label={ov.totalErrors}    value={pyStatus.total_errors}    color="text-red-600" highlight={pyStatus.total_errors > 0} />
            <StatCard label={ov.totalForwarded} value={pyStatus.total_forwarded} color="text-indigo-700" />
            <StatCard label={ov.totalLogitrack} value={pyStatus.total_logitrack} color="text-purple-700" />
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusOverview;
