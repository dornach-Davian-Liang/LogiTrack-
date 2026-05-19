/**
 * WhatIfSimulator — 独立路由模拟器
 *
 * 允许用户输入任意 AI 分析字段，即时查看路由结果，无需依附具体邮件日志。
 * 与 CorrectionWizard 中的字段编辑器共用 AiFieldEditor 组件。
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, ChevronDown, ChevronUp, AlertCircle, Loader } from 'lucide-react';
import { monitorPyApi } from '../../../../services/monitorApi';
import AiFieldEditor, { AiFields } from './AiFieldEditor';

// ─── 默认模板（预填常见字段） ───────────────────────────────────────────────
const DEFAULT_FIELDS: AiFields = {
  email_type: 'INQUIRY',
  is_inquiry: true,
  transport_mode: 'SEA',
  branch_code: 'SHA',
  pod_country: '',
  pod: '',
  pol: '',
  origin_city: '',
  multiple_origins: false,
  is_lcl: false,
  is_dangerous_goods: false,
  no_specific_cargo: false,
  risk_level: 'LOW',
  sender_ziegler_office: '',
};

// ─── 路由结果展示 ────────────────────────────────────────────────────────────
interface RoutingInstruction {
  to?: string[];
  cc?: string[];
  branch?: string;
  rule_triggered?: string;
  note?: string;
  [k: string]: unknown;
}

const RouteResultCard: React.FC<{
  instructions: RoutingInstruction[];
  elapsed?: number;
}> = ({ instructions, elapsed }) => {
  if (instructions.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
        <AlertCircle size={14} /> 路由结果为空（无匹配规则）
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {elapsed != null && (
        <div className="text-xs text-gray-400">⚡ 耗时 {elapsed} ms</div>
      )}
      {instructions.map((ins, i) => (
        <div key={i} className="border border-indigo-100 bg-indigo-50/40 rounded-lg px-4 py-3 text-sm space-y-1.5">
          {ins.branch && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-indigo-700 text-base">📍 {ins.branch}</span>
              {ins.rule_triggered && (
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                  规则: {ins.rule_triggered}
                </span>
              )}
            </div>
          )}
          {ins.to && ins.to.length > 0 && (
            <div className="text-sm">
              <span className="text-gray-500 text-xs font-medium mr-2">TO:</span>
              <span className="text-blue-700 font-medium">{ins.to.join(', ')}</span>
            </div>
          )}
          {ins.cc && ins.cc.length > 0 && (
            <div className="text-sm">
              <span className="text-gray-500 text-xs font-medium mr-2">CC:</span>
              <span className="text-blue-600">{ins.cc.join(', ')}</span>
            </div>
          )}
          {ins.note && (
            <div className="text-xs text-gray-500 italic mt-1">💡 {ins.note}</div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────
const WhatIfSimulator: React.FC = () => {
  const [fields, setFields] = useState<AiFields>({ ...DEFAULT_FIELDS });
  const [result, setResult] = useState<RoutingInstruction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | undefined>();
  const [autoRun, setAutoRun] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const simulate = useCallback(async (f: AiFields) => {
    setLoading(true);
    setError(null);
    const t0 = Date.now();
    try {
      const res = await monitorPyApi.simulateRouting(f as Record<string, unknown>);
      const routing = res.routing as { instructions?: RoutingInstruction[] } | RoutingInstruction[];
      const instructions: RoutingInstruction[] = Array.isArray(routing)
        ? routing
        : (routing as { instructions?: RoutingInstruction[] }).instructions ?? [];
      setResult(instructions);
      setElapsed(Date.now() - t0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = useCallback((f: AiFields) => {
    setFields(f);
    if (!autoRun) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => simulate(f), 600);
  }, [autoRun, simulate]);

  // 首次加载自动运行一次
  useEffect(() => { simulate(fields); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    const fresh = { ...DEFAULT_FIELDS };
    setFields(fresh);
    setResult(null);
    setError(null);
    setElapsed(undefined);
    simulate(fresh);
  };

  return (
    <div className="space-y-4">
      {/* 顶部说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
        🧪 <strong>路由模拟器</strong> — 修改下方字段，即时查看当前路由配置的分发结果。不影响任何真实数据。
      </div>

      {/* 字段编辑区（可折叠） */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowEditor(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
        >
          <span>⚙️ AI 分析字段</span>
          <div className="flex items-center gap-3">
            {/* 自动运行开关 */}
            <label
              className="flex items-center gap-1.5 text-xs font-normal text-gray-500 cursor-pointer"
              onClick={e => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={autoRun}
                onChange={e => setAutoRun(e.target.checked)}
                className="rounded"
              />
              自动运行
            </label>
            {showEditor ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>
        {showEditor && (
          <div className="p-4 border-t border-gray-200">
            <AiFieldEditor initial={fields} onChange={handleChange} />
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={() => simulate(fields)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
          {loading ? '计算中...' : '▶ 运行模拟'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <RotateCcw size={13} /> 重置
        </button>
      </div>

      {/* 结果区 */}
      <div className="border border-gray-200 rounded-xl p-4 min-h-20">
        <div className="text-xs font-medium text-gray-500 mb-3">📤 路由结果</div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader size={14} className="animate-spin" /> 计算路由...
          </div>
        )}
        {error && !loading && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <AlertCircle size={12} /> {error}
          </div>
        )}
        {!loading && !error && result !== null && (
          <RouteResultCard instructions={result} elapsed={elapsed} />
        )}
        {!loading && !error && result === null && (
          <div className="text-sm text-gray-400">点击「运行模拟」查看路由结果</div>
        )}
      </div>
    </div>
  );
};

export default WhatIfSimulator;
