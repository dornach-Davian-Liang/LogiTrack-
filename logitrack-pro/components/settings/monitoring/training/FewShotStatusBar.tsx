import React, { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, RefreshCw, Eye, X, CheckCircle, XCircle, Loader } from 'lucide-react';
import { monitorPyApi, FewshotStats, PromptPreview, RegressionResult } from '../../../../services/monitorApi';

interface Props {
  /** 外部触发刷新时自增 */
  refreshTick?: number;
  /** 外部通知：刚刚保存了一个案例，自动触发回归 */
  autoRegressionTick?: number;
}

// ─── Prompt 预览模态框 ────────────────────────────────────────────────────────
const PromptPreviewModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [data, setData] = useState<PromptPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chars, setChars] = useState(2000);

  const load = async (c: number) => {
    setLoading(true); setError(null);
    try { setData(await monitorPyApi.previewPrompt(c)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(chars); }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 shrink-0">
          <h3 className="font-semibold text-gray-900">👁 Prompt 预览（注入 Few-shot 后）</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        {data && !loading && (
          <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50 flex gap-4 text-xs text-gray-500 shrink-0">
            <span>总长度: <strong className="text-gray-700">{data.total_chars.toLocaleString()} 字符</strong></span>
            <span>估算 token: <strong className="text-gray-700">{data.estimated_tokens.toLocaleString()}</strong></span>
            <span>基础案例: <strong className="text-gray-700">{data.base_count}</strong></span>
            <span>训练案例: <strong className="text-green-700">{data.training_active}</strong></span>
            {data.truncated && <span className="text-amber-600">（预览已截断，仅显示前 {chars} 字符）</span>}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && <div className="flex items-center gap-2 text-sm text-gray-400"><Loader size={14} className="animate-spin" /> 构建 prompt...</div>}
          {error && <div className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{error}</div>}
          {data && !loading && (
            <pre className="text-xs font-mono bg-gray-900 text-green-300 rounded-lg p-4 whitespace-pre-wrap overflow-auto">
              {data.preview}
            </pre>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">预览字符数:</span>
            {[1000, 2000, 5000, 10000].map(n => (
              <button key={n} onClick={() => { setChars(n); load(n); }}
                className={`px-2 py-1 text-xs rounded border transition-colors ${chars === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                {n >= 1000 ? `${n / 1000}K` : n}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100">关闭</button>
        </div>
      </div>
    </div>
  );
};

// ─── 回归结果徽章 ─────────────────────────────────────────────────────────────
const RegressionBadge: React.FC<{ result: RegressionResult | null; running: boolean }> = ({ result, running }) => {
  if (running) return (
    <span className="flex items-center gap-1 text-xs text-purple-500">
      <Loader size={11} className="animate-spin" /> 回归中...
    </span>
  );
  if (!result) return null;
  const pct = Math.round(result.recall_rate * 100);
  return result.pass
    ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle size={11} /> 回归 {pct}%</span>
    : <span className="flex items-center gap-1 text-xs text-red-600"><XCircle size={11} /> 回归 {pct}% ⚠️</span>;
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────
const FewShotStatusBar: React.FC<Props> = ({ refreshTick = 0, autoRegressionTick = 0 }) => {
  const [stats, setStats] = useState<FewshotStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [regResult, setRegResult] = useState<RegressionResult | null>(null);
  const [regRunning, setRegRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await monitorPyApi.getFewshotStats();
      setStats(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const runRegression = async () => {
    setRegRunning(true);
    try {
      const r = await monitorPyApi.runRegression();
      setRegResult(r);
    } catch { /* silent */ }
    finally { setRegRunning(false); }
  };

  useEffect(() => { load(); }, [refreshTick]);

  // 外部保存案例后自动触发回归
  useEffect(() => {
    if (autoRegressionTick > 0) runRegression();
  }, [autoRegressionTick]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return (
    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
      <AlertTriangle size={13} /> 无法加载 Few-shot 状态: {error}
    </div>
  );

  if (!stats) return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-400">
      <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
      {loading ? '加载中...' : '—'}
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs">
        <BookOpen size={14} className="text-indigo-500 shrink-0" />
        <span className="text-indigo-700 font-medium">Few-shot 状态</span>

        <div className="flex items-center gap-1.5 text-gray-600">
          <span className="text-gray-400">基础案例</span>
          <span className="font-semibold text-indigo-700">{stats.base_count}</span>
        </div>

        <span className="text-gray-300">|</span>

        <div className="flex items-center gap-1.5 text-gray-600">
          <span className="text-gray-400">训练案例</span>
          <span className={`font-semibold ${stats.training_active > 0 ? 'text-green-600' : 'text-gray-400'}`}>
            {stats.training_active} 活跃
          </span>
          {stats.training_paused > 0 && (
            <span className="text-gray-400">/ {stats.training_paused} 暂停</span>
          )}
        </div>

        <span className="text-gray-300">|</span>

        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="text-gray-400">估算 token</span>
          <span className="font-medium">{stats.estimated_tokens.toLocaleString()}</span>
        </div>

        {stats.training_mtime && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400">最后更新 {stats.training_mtime}</span>
          </>
        )}

        <span className="text-gray-300">|</span>
        <RegressionBadge result={regResult} running={regRunning} />

        {/* 按钮组 */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-700 border border-indigo-200 rounded px-2 py-0.5 hover:bg-indigo-50 transition-colors"
            title="预览注入后 Prompt"
          >
            <Eye size={11} /> 预览 Prompt
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="text-indigo-400 hover:text-indigo-600 transition-colors"
            title="刷新"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {stats.warning && (
          <div className="w-full flex items-center gap-1.5 text-amber-600 mt-1">
            <AlertTriangle size={12} />
            <span>{stats.warning}</span>
          </div>
        )}
      </div>

      {showPreview && <PromptPreviewModal onClose={() => setShowPreview(false)} />}
    </>
  );
};

export default FewShotStatusBar;

