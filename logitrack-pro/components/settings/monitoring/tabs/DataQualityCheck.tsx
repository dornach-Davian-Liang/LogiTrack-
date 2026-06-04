import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, ReferenceLine,
} from 'recharts';
import {
  monitorApi,
  QualityCheckConfig,
  QualityCheckResult,
  QualityRunResponse,
  QualityCheckHistory,
  TrendPoint,
} from '../../../../services/monitorApi';
import { useLanguage } from '../../../../i18n/LanguageContext';

// ─── 字段友好名称映射（与后端 FIELD_LABELS 对应） ────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  category:            'Category',
  salesPicId:          'Sales PIC',
  polExists:           'POL',
  podExists:           'POD',
  assignedCnOffice:    'Assigned CN Office',
  salesCountryCode:    'Z-Country / Agent',
  cargoTypeCode:       'Cargo Type',
  productCode:         'Product Type',
  enquiryReceivedDate: 'Enquiry Received Date',
  commodity:           'Commodity',
  volumeQty:           'Volume / Quantity',
  coreNonCore:         'Core / Non-Core',
};

// ─── 子组件：统计卡片 ────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: string | number; color: string; sub?: string;
}> = ({ label, value, color, sub }) => (
  <div className={`bg-white rounded-lg border-l-4 p-4 shadow-sm`} style={{ borderLeftColor: color }}>
    <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    <div className="text-xs text-gray-500 mt-1">{label}</div>
    {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
  </div>
);

// ─── 子组件：缺失字段 Badge ──────────────────────────────────────────────────

const FieldBadge: React.FC<{ fieldKey: string }> = ({ fieldKey }) => (
  <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full mr-1 mb-1 whitespace-nowrap">
    {FIELD_LABELS[fieldKey] ?? fieldKey}
  </span>
);

// ─── 子组件：CRON 预设选择器 ────────────────────────────────────────────────

const CRON_PRESETS_STATIC = [
  { label: '', key: 'daily9',  value: '0 0 9 * * ?' },
  { label: '', key: 'daily18', value: '0 0 18 * * ?' },
  { label: '', key: 'every4h', value: '0 0 */4 * * ?' },
  { label: '', key: 'hourly',  value: '0 0 * * * ?' },
  { label: '', key: 'custom',  value: 'custom' },
];

// ─── 主组件 ─────────────────────────────────────────────────────────────────

const DataQualityCheck: React.FC = () => {
  const { translations: t } = useLanguage();
  const qc = t.monitoring.quality;
  const CRON_PRESETS = CRON_PRESETS_STATIC.map(p => ({
    ...p,
    label: qc.cronPresets[p.key as keyof typeof qc.cronPresets],
  }));
  // 配置
  const [config, setConfig] = useState<QualityCheckConfig>({
    enabled: false,
    cronExpression: '0 0 9 * * ?',
    checkScopeDays: 7,
    globalRecipients: [],
    routeBasedEnabled: false,
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [cronPreset, setCronPreset] = useState('0 0 9 * * ?');
  const [configExpanded, setConfigExpanded] = useState(true);

  // 质检结果
  const [runResponse, setRunResponse] = useState<QualityRunResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [resultDays, setResultDays] = useState(7);

  // 历史 & 趋势
  const [history, setHistory] = useState<QualityCheckHistory[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendDays, setTrendDays] = useState(30);

  // 表格筛选
  const [filterMissing, setFilterMissing] = useState('');
  const [filterRoute, setFilterRoute]   = useState('');
  const [showVerified, setShowVerified] = useState(false);
  const [verifyingId, setVerifyingId]   = useState<number | null>(null);

  // 活跃子 Tab
  const [subTab, setSubTab] = useState<'results' | 'charts' | 'history'>('results');

  // 当前操作用户（从本地取，与其他模块一致）
  const currentUser = localStorage.getItem('username') ?? 'unknown';

  // ─── 数据加载 ───────────────────────────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const cfg = await monitorApi.getQualityConfig();
      setConfig(cfg);
      const preset = CRON_PRESETS.find(p => p.value === cfg.cronExpression);
      setCronPreset(preset ? cfg.cronExpression : 'custom');
    } catch (e) {
      console.error('[QualityCheck] loadConfig error', e);
    } finally { setConfigLoading(false); }
  }, []);

  const loadResults = useCallback(async (days: number) => {
    setRunning(true);
    try {
      const resp = await monitorApi.getQualityResults(days);
      setRunResponse(resp);
    } catch (e) {
      console.error('[QualityCheck] loadResults error', e);
    } finally { setRunning(false); }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const hist = await monitorApi.getQualityHistory();
      setHistory(hist);
    } catch (e) { console.error('[QualityCheck] loadHistory error', e); }
  }, []);

  const loadTrend = useCallback(async (days: number) => {
    try {
      const trend = await monitorApi.getQualityTrend(days);
      setTrendData(trend);
    } catch (e) { console.error('[QualityCheck] loadTrend error', e); }
  }, []);

  useEffect(() => {
    loadConfig();
    loadResults(resultDays);
    loadHistory();
    loadTrend(trendDays);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 配置操作 ───────────────────────────────────────────────────────────────

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      const saved = await monitorApi.updateQualityConfig(config);
      setConfig(saved);
      alert(qc.configSaved);
    } catch (e) {
      alert(qc.saveFailed + ': ' + (e instanceof Error ? e.message : String(e)));
    } finally { setConfigSaving(false); }
  };

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || config.globalRecipients.includes(email)) return;
    setConfig(c => ({ ...c, globalRecipients: [...c.globalRecipients, email] }));
    setNewEmail('');
  };

  const removeEmail = (email: string) =>
    setConfig(c => ({ ...c, globalRecipients: c.globalRecipients.filter(e => e !== email) }));

  const handleCronPreset = (val: string) => {
    setCronPreset(val);
    if (val !== 'custom') setConfig(c => ({ ...c, cronExpression: val }));
  };

  // ─── 手动执行 ───────────────────────────────────────────────────────────────

  const handleRun = async () => {
    setRunning(true);
    try {
      const resp = await monitorApi.runQualityCheck();
      setRunResponse(resp);
      await loadHistory();
      await loadTrend(trendDays);
      alert(qc.runComplete.replace('{{total}}', String(resp.totalChecked)).replace('{{incomplete}}', String(resp.totalIncomplete)));
    } catch (e) {
      alert(qc.runFailed + ': ' + (e instanceof Error ? e.message : String(e)));
    } finally { setRunning(false); }
  };

  // ─── 核验操作 ───────────────────────────────────────────────────────────────

  const handleVerify = async (enquiryId: number) => {
    setVerifyingId(enquiryId);
    try {
      await monitorApi.markVerified(enquiryId, currentUser);
      setRunResponse(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          results: prev.results.map(r =>
            r.enquiryId === enquiryId
              ? { ...r, verified: true, verifiedBy: currentUser }
              : r
          ),
          totalIncomplete: prev.totalIncomplete - 1,
        };
      });
    } catch (e) {
      alert('核验失败: ' + (e instanceof Error ? e.message : String(e)));
    } finally { setVerifyingId(null); }
  };

  const handleUnverify = async (enquiryId: number) => {
    setVerifyingId(enquiryId);
    try {
      await monitorApi.unmarkVerified(enquiryId);
      setRunResponse(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          results: prev.results.map(r =>
            r.enquiryId === enquiryId
              ? { ...r, verified: false, verifiedBy: null }
              : r
          ),
          totalIncomplete: prev.totalIncomplete + 1,
        };
      });
    } catch (e) {
      alert('撤销失败: ' + (e instanceof Error ? e.message : String(e)));
    } finally { setVerifyingId(null); }
  };

  // ─── 表格筛选逻辑 ────────────────────────────────────────────────────────────

  const filteredResults: QualityCheckResult[] = (runResponse?.results ?? []).filter(r => {
    if (!showVerified && r.verified) return false;
    if (filterMissing && !r.missingFields.includes(filterMissing)) return false;
    if (filterRoute) {
      const allRecips = [...r.routeRecipients, ...r.routeCc].join(' ');
      if (!allRecips.toLowerCase().includes(filterRoute.toLowerCase())) return false;
    }
    return true;
  });

  // ─── 热力图数据 ─────────────────────────────────────────────────────────────

  const heatmapData = Object.entries(runResponse?.fieldStats ?? {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([key, count]) => ({
      field: FIELD_LABELS[key] ?? key,
      count,
      pct: runResponse && runResponse.totalChecked > 0
        ? Math.round(count * 100 / runResponse.totalChecked) : 0,
    }));

  // ─── 统计卡片数据 ────────────────────────────────────────────────────────────

  const total      = runResponse?.totalChecked ?? 0;
  const incomplete = runResponse?.totalIncomplete ?? 0;
  const complete   = total - incomplete;
  const rate       = total > 0 ? Math.round(complete * 100 / total) : 0;
  const rateColor  = rate >= 90 ? '#16a34a' : rate >= 70 ? '#d97706' : '#dc2626';

  // ─── 渲染 ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── 配置面板 ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-3.5 text-left"
          onClick={() => setConfigExpanded(e => !e)}
        >
          <span className="font-semibold text-gray-700 text-sm">⚙️ 质检配置</span>
          <span className="text-gray-400 text-xs">{configExpanded ? '▲ 收起' : '▼ 展开'}</span>
        </button>

        {configExpanded && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-4">
            {configLoading ? (
              <div className="text-gray-400 text-sm">加载配置中…</div>
            ) : (
              <>
                {/* 启用开关 + 路由分发 */}
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-indigo-600"
                      checked={config.enabled}
                      onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))}
                    />
                    <span className="text-sm text-gray-700">启用定时质检</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-indigo-600"
                      checked={config.routeBasedEnabled}
                      onChange={e => setConfig(c => ({ ...c, routeBasedEnabled: e.target.checked }))}
                    />
                    <span className="text-sm text-gray-700">路由分发（同时发送给路由收件人）</span>
                  </label>
                </div>

                {/* 定时频率 */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-600 w-20 shrink-0">定时频率</span>
                  <div className="flex flex-wrap gap-2">
                    {CRON_PRESETS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => handleCronPreset(p.value)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          (cronPreset === p.value || (p.value === 'custom' && cronPreset === 'custom'))
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                        }`}
                      >{p.label}</button>
                    ))}
                  </div>
                  {(cronPreset === 'custom' || !CRON_PRESETS.find(p => p.value === config.cronExpression && p.value !== 'custom')) && (
                    <input
                      type="text"
                      value={config.cronExpression}
                      onChange={e => setConfig(c => ({ ...c, cronExpression: e.target.value }))}
                      placeholder="0 0 9 * * ?"
                      className="border border-gray-300 rounded px-2 py-1.5 text-xs w-36 font-mono"
                    />
                  )}
                </div>

                {/* 检查天数 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-20 shrink-0">检查范围</span>
                  <input
                    type="number"
                    min={1} max={90}
                    value={config.checkScopeDays}
                    onChange={e => setConfig(c => ({ ...c, checkScopeDays: Number(e.target.value) }))}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm w-20"
                  />
                  <span className="text-sm text-gray-500">天内的 AI 自动创建询价单</span>
                </div>

                {/* 全局通知邮箱 */}
                <div className="space-y-2">
                  <span className="text-sm text-gray-600">全局通知邮箱</span>
                  <div className="flex flex-wrap gap-2 min-h-8">
                    {config.globalRecipients.map(email => (
                      <span
                        key={email}
                        className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full border border-indigo-200"
                      >
                        {email}
                        <button onClick={() => removeEmail(email)} className="text-indigo-400 hover:text-red-500 ml-0.5">✕</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addEmail()}
                      placeholder="输入邮箱后按回车添加"
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 max-w-xs"
                    />
                    <button
                      onClick={addEmail}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded"
                    >添加</button>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    onClick={handleSaveConfig}
                    disabled={configSaving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                  >{configSaving ? '保存中…' : '💾 保存配置'}</button>
                  <button
                    onClick={handleRun}
                    disabled={running}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                  >{running ? '⏳ 执行中…' : '▶ 立即执行'}</button>
                  <button
                    onClick={() => window.open(`/api/monitor/quality/preview?days=${resultDays}`, '_blank')}
                    className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm rounded-lg transition-colors"
                  >👁 预览报告</button>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-gray-500">检查范围</span>
                    <select
                      value={resultDays}
                      onChange={e => { setResultDays(Number(e.target.value)); loadResults(Number(e.target.value)); }}
                      className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                    >
                      {[3, 7, 14, 30].map(d => (
                        <option key={d} value={d}>最近 {d} 天</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── 统计卡片 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="总检查" value={total} color="#2563eb" sub={`最近 ${resultDays} 天`} />
        <StatCard label="字段完整" value={complete} color="#16a34a" />
        <StatCard label="有缺失" value={incomplete} color="#dc2626" />
        <StatCard label="完整率" value={`${rate}%`} color={rateColor} />
      </div>

      {/* ── 子 Tab 导航 ── */}
      <div className="flex gap-0 border-b border-gray-200">
        {([        
          { id: 'results', label: `📋 ${qc.tabs.results}` },
          { id: 'charts',  label: `📊 ${qc.tabs.charts}` },
          { id: 'history', label: `🕒 ${qc.tabs.history}` },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
              subTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* ══ 子 Tab：缺失记录 ══ */}
      {subTab === 'results' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* 筛选栏 */}
          <div className="flex flex-wrap gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <select
              value={filterMissing}
              onChange={e => setFilterMissing(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">全部缺失字段</option>
              {Object.entries(FIELD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              type="text"
              value={filterRoute}
              onChange={e => setFilterRoute(e.target.value)}
              placeholder="筛选路由收件人"
              className="border border-gray-300 rounded px-2 py-1.5 text-sm w-44"
            />
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={showVerified}
                onChange={e => setShowVerified(e.target.checked)}
                className="w-3.5 h-3.5 accent-indigo-600"
              />
              显示已核验
            </label>
          </div>

          {running ? (
            <div className="text-center py-12 text-gray-400 text-sm">⏳ 加载中…</div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {total === 0 ? '暂无 AI 建单记录' : '没有匹配的缺失记录 🎉'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left whitespace-nowrap">REF</th>
                    <th className="px-4 py-3 text-left">缺失字段</th>
                    <th className="px-4 py-3 text-left whitespace-nowrap">路由收件人</th>
                    <th className="px-4 py-3 text-left">邮件主题</th>
                    <th className="px-4 py-3 text-left whitespace-nowrap">状态</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredResults.map(r => (
                    <tr
                      key={r.enquiryId}
                      className={`transition-colors ${r.verified ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50'}`}
                    >
                      {/* REF */}
                      <td className="px-4 py-3 font-bold text-indigo-700 whitespace-nowrap">
                        {r.refNumber}
                      </td>
                      {/* 缺失字段 */}
                      <td className="px-4 py-3">
                        {r.isComplete ? (
                          <span className="text-green-600 text-xs">✓ 完整</span>
                        ) : (
                          <div className="flex flex-wrap gap-0.5">
                            {r.missingFields.map(f => <FieldBadge key={f} fieldKey={f} />)}
                          </div>
                        )}
                      </td>
                      {/* 路由收件人 */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.routeRecipients.length === 0 ? (
                            <span className="text-gray-300 text-xs">—</span>
                          ) : r.routeRecipients.map(email => (
                            <span key={email} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {email.split('@')[0]}
                            </span>
                          ))}
                        </div>
                      </td>
                      {/* 邮件主题 */}
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={r.emailSubject ?? ''}>
                        {r.emailSubject ?? '—'}
                      </td>
                      {/* 状态 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.verified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            ✅ 已核验
                            {r.verifiedBy && <span className="text-gray-400">by {r.verifiedBy}</span>}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            ⚠️ 待补充
                          </span>
                        )}
                      </td>
                      {/* 操作 */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {r.verified ? (
                          <button
                            onClick={() => handleUnverify(r.enquiryId)}
                            disabled={verifyingId === r.enquiryId}
                            className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 disabled:opacity-50"
                          >撤销</button>
                        ) : (
                          <button
                            onClick={() => handleVerify(r.enquiryId)}
                            disabled={verifyingId === r.enquiryId}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 bg-indigo-50 px-2 py-1 rounded"
                          >{verifyingId === r.enquiryId ? '…' : '✓ 核验'}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t">
                共 {filteredResults.length} 条记录
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ 子 Tab：统计图表 ══ */}
      {subTab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 字段缺失热力图 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              📊 字段缺失热力图
              <span className="ml-2 text-xs text-gray-400 font-normal">最近 {resultDays} 天</span>
            </h3>
            {heatmapData.length === 0 ? (
              <div className="text-center py-10 text-gray-300 text-sm">暂无缺失数据 🎉</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(heatmapData.length * 40, 200)}>
                <BarChart
                  data={heatmapData}
                  layout="vertical"
                  margin={{ top: 0, right: 50, left: 130, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100] as [number, number]} tickFormatter={v => `${v}%`}
                    tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="field" tick={{ fontSize: 12 }} width={125} />
                  <Tooltip
                    formatter={(value: number, _name: string, props: { payload?: { count?: number } }) =>
                      [`${value}% (${props.payload?.count ?? 0} 条)`, '缺失率']}
                  />
                  <Bar dataKey="pct" name="缺失率" radius={[0, 4, 4, 0]}
                    fill="#3b82f6"
                    label={{ position: 'right', fontSize: 11, fill: '#6b7280',
                      formatter: (v: number) => v > 0 ? `${v}%` : '' }}
                    background={{ fill: '#f3f4f6', radius: 4 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 质检趋势图 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                📈 完整率趋势
              </h3>
              <select
                value={trendDays}
                onChange={e => { setTrendDays(Number(e.target.value)); loadTrend(Number(e.target.value)); }}
                className="border border-gray-300 rounded px-2 py-1 text-xs"
              >
                {[7, 14, 30, 60].map(d => <option key={d} value={d}>最近 {d} 天</option>)}
              </select>
            </div>
            {trendData.length === 0 ? (
              <div className="text-center py-10 text-gray-300 text-sm">
                暂无历史数据<br/>
                <span className="text-xs">至少执行一次质检后可见趋势</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100] as [number, number]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, '完整率']} />
                  <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4"
                    label={{ value: '80%', fill: '#f59e0b', fontSize: 10 }} />
                  <Area
                    type="monotone" dataKey="completionRate" name="完整率"
                    stroke="#6366f1" fill="url(#gradRate)" strokeWidth={2}
                    dot={{ r: 3, fill: '#6366f1' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ══ 子 Tab：执行历史 ══ */}
      {subTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 text-xs text-gray-500 font-medium">
            最近 30 次执行记录
          </div>
          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">暂无执行历史</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left whitespace-nowrap">执行时间</th>
                    <th className="px-4 py-3 text-right">总检查</th>
                    <th className="px-4 py-3 text-right">完整</th>
                    <th className="px-4 py-3 text-right">缺失</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">完整率</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">邮件</th>
                    <th className="px-4 py-3 text-left">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map(h => {
                    const rate = Number(h.completionRate);
                    const rColor = rate >= 90 ? '#16a34a' : rate >= 70 ? '#d97706' : '#dc2626';
                    return (
                      <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                          {h.executedAt.replace('T', ' ').substring(0, 19)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{h.totalChecked}</td>
                        <td className="px-4 py-2.5 text-right text-green-600">{h.totalComplete}</td>
                        <td className="px-4 py-2.5 text-right text-red-600">{h.totalIncomplete}</td>
                        <td className="px-4 py-2.5 text-right font-bold" style={{ color: rColor }}>
                          {rate.toFixed(1)}%
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {h.reportSent ? (
                            <span className="text-xs text-green-600">
                              ✉️ {h.globalRecipientsCount + h.routeRecipientsCount} 人
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-red-500">
                          {h.errorMessage ?? ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataQualityCheck;
