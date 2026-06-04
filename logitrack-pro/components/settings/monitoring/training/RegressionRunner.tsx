/**
 * RegressionRunner — 路由回归测试触发器 + 结果展示
 *
 * 调用 POST /pyapi/training/regression，复用 tested_emails.json 已存储的
 * AI 分析结果，用当前路由配置重跑路由，统计 INQUIRY 召回率。
 * 不调用 LLM，秒级完成。
 */
import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, AlertTriangle, Loader, ChevronDown, ChevronRight } from 'lucide-react';
import { monitorPyApi, RegressionResult, RegressionRouteDetail } from '../../../../services/monitorApi';

const RegressionRunner: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RegressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showErrors, setShowErrors] = useState(true);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await monitorPyApi.runRegression();
      setResult(res);
      // 有错误时自动展开错误列表
      if (res.routing_errors > 0) setShowErrors(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const recallPct = result ? Math.round(result.recall_rate * 100) : null;

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-sm text-purple-700">
        🔁 <strong>路由回归测试</strong> — 使用 <code className="bg-purple-100 px-1 rounded">tested_emails.json</code> 中已存储的
        AI 分析结果，用当前路由配置重新运行路由，检验 INQUIRY 召回率是否 100%。
        <span className="ml-1 text-purple-500 text-xs">（不调用 LLM，通常秒级完成）</span>
      </div>

      {/* 运行按钮 */}
      <button
        onClick={run}
        disabled={running}
        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        {running
          ? <><Loader size={14} className="animate-spin" /> 运行中...</>
          : <><Play size={14} /> ▶ 运行路由回归</>
        }
      </button>

      {/* 错误 */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {/* 结果 */}
      {result && (
        <div className="space-y-3">
          {/* 总结卡片 */}
          <div className={`rounded-xl p-4 border-2 ${
            result.pass
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {result.pass
                ? <CheckCircle size={22} className="text-green-500 shrink-0" />
                : <XCircle size={22} className="text-red-500 shrink-0" />
              }
              <div>
                <div className={`text-base font-semibold ${result.pass ? 'text-green-700' : 'text-red-700'}`}>
                  {result.pass ? '✅ 回归通过' : '❌ 回归未通过'}
                </div>
                <div className="text-xs text-gray-500">
                  运行于 {result.run_at?.replace('T', ' ').substring(0, 19)}
                </div>
              </div>
              <div className={`ml-auto text-3xl font-bold ${result.pass ? 'text-green-600' : 'text-red-600'}`}>
                {recallPct}%
              </div>
            </div>

            {/* 统计数字 */}
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: '总记录', value: result.total, color: 'text-gray-700' },
                { label: 'INQUIRY', value: result.inquiry_total, color: 'text-blue-700' },
                { label: '路由成功', value: result.routed_ok, color: 'text-green-700' },
                { label: '路由失败', value: result.routing_errors, color: result.routing_errors > 0 ? 'text-red-700' : 'text-gray-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/70 rounded-lg py-2">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 路由失败详情 */}
          {result.routing_errors > 0 && (
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowErrors(v => !v)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
              >
                {showErrors ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                ❌ 路由失败 ({result.routing_errors} 条)
              </button>
              {showErrors && (
                <div className="divide-y divide-red-100">
                  {result.errors.map(r => <ErrorRow key={r.id} row={r} />)}
                </div>
              )}
            </div>
          )}

          {/* 路由成功详情 */}
          {result.details.length > 0 && (
            <div className="border border-green-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowDetails(v => !v)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-green-50 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
              >
                {showDetails ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                ✅ 路由成功 ({result.details.length} 条)
              </button>
              {showDetails && (
                <div className="divide-y divide-green-50 max-h-64 overflow-y-auto">
                  {result.details.map(r => <SuccessRow key={r.id} row={r} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── 行组件 ────────────────────────────────────────────────────────────────

const ErrorRow: React.FC<{ row: RegressionRouteDetail }> = ({ row }) => (
  <div className="px-4 py-2.5 text-sm">
    <div className="font-medium text-gray-800 truncate">{row.subject}</div>
    <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
      <span>Branch: {row.branch ?? '?'}</span>
      <span>Mode: {row.mode ?? '?'}</span>
    </div>
    <div className="text-xs text-red-600 mt-0.5">{row.error}</div>
  </div>
);

const SuccessRow: React.FC<{ row: RegressionRouteDetail }> = ({ row }) => (
  <div className="px-4 py-2 flex items-center gap-3 text-xs">
    <div className="flex-1 min-w-0">
      <div className="text-sm text-gray-700 truncate">{row.subject}</div>
      <div className="text-gray-400 mt-0.5">
        Branch: {row.branch ?? '?'} · {row.mode ?? '?'}
      </div>
    </div>
    <div className="text-blue-600 text-xs truncate max-w-48" title={row.to?.join(', ')}>
      → {row.to?.join(', ') ?? '—'}
    </div>
  </div>
);

export default RegressionRunner;
