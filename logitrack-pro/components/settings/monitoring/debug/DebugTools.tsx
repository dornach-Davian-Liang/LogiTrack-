import React, { useState, useEffect } from 'react';
import { Search, Network, Info, RefreshCw } from 'lucide-react';
import { monitorPyApi } from '../../../../services/monitorApi';

// ─── SkipChecker 测试区 ───────────────────────────────────────────────────────

interface SkipResult {
  skip: boolean;
  reason: string;
  matched_keyword: string;
  matched_name: string;
  skip_category: string;
}

const SkipCheckerTest: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SkipResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!subject.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await monitorPyApi.testSkipChecker(subject, body) as SkipResult;
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Search size={14} />
        SkipChecker 测试
      </div>
      <p className="text-xs text-gray-500">输入邮件主题和正文，判断是否需要跳过建询价单。</p>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="邮件主题（Subject）"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <textarea
          placeholder="邮件正文（可留空）"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <button
          onClick={handleTest}
          disabled={loading || !subject.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-40"
        >
          <Search size={13} />
          {loading ? '检测中...' : '执行检测'}
        </button>
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}
      {result && (
        <div className={`rounded-lg p-3 border text-sm ${
          result.skip ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        }`}>
          <div className="font-medium mb-1">
            {result.skip ? '⛔ 应跳过建单' : '✅ 可建询价单'}
          </div>
          {result.skip && (
            <div className="text-xs space-y-0.5 text-gray-600">
              {result.reason && <div>原因类别: <span className="font-mono">{result.reason}</span></div>}
              {result.skip_category && <div>跳过分类: {result.skip_category}</div>}
              {result.matched_keyword && <div>命中关键词: <span className="font-mono text-red-700">{result.matched_keyword}</span></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Router 测试区 ────────────────────────────────────────────────────────────

interface RouterResult {
  ok: boolean;
  instructions: Array<{
    to: string[];
    cc: string[];
    transport_mode: string;
    branch: string;
    risk_level: string;
    note?: string;
  }>;
  analysis_summary: Record<string, unknown>;
}

const RouterTest: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('{\n  "transport_mode": "SEA",\n  "branch_code": "SHA",\n  "destination": "UK",\n  "risk_level": "LOW"\n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouterResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    let analysis: Record<string, unknown>;
    try { analysis = JSON.parse(jsonInput); } catch { setError('JSON 格式错误'); return; }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await monitorPyApi.testRouter(analysis) as RouterResult;
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Network size={14} />
        Router 路由测试
      </div>
      <p className="text-xs text-gray-500">粘贴 AI 分析结果 JSON，查看路由匹配指令。</p>
      <textarea
        value={jsonInput}
        onChange={e => setJsonInput(e.target.value)}
        rows={6}
        className="w-full border border-gray-200 rounded px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-indigo-400"
        spellCheck={false}
      />
      <button
        onClick={handleTest}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-40"
      >
        <Network size={13} />
        {loading ? '匹配中...' : '执行路由'}
      </button>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}
      {result && (
        <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
          {result.instructions.length === 0 ? (
            <div className="text-sm text-gray-400">⚠️ 无路由指令（可能 Branch/Transport 未匹配）</div>
          ) : result.instructions.map((instr, i) => (
            <div key={i} className="text-xs space-y-0.5 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
              <div className="font-medium text-gray-700">
                [{i + 1}] {instr.transport_mode} · Branch: {instr.branch} · Risk: {instr.risk_level}
              </div>
              <div><span className="text-gray-400">TO: </span>{instr.to?.join(', ') || '—'}</div>
              <div><span className="text-gray-400">CC: </span>{instr.cc?.join(', ') || '—'}</div>
              {instr.note && <div className="text-gray-400">Note: {instr.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── 系统概要区 ───────────────────────────────────────────────────────────────

const SystemInfo: React.FC = () => {
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setInfo(await monitorPyApi.getSystemInfo());
    } catch (e: unknown) {
      setError('无法获取系统信息（Python 服务未运行）');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const Row: React.FC<{ label: string; value: unknown }> = ({ label, value }) => (
    <div className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-700 font-mono text-right max-w-[60%] break-all">
        {value === null || value === undefined ? '—'
          : Array.isArray(value) ? value.join(', ')
          : typeof value === 'object' ? JSON.stringify(value)
          : String(value)}
      </span>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Info size={14} />
          系统概要
        </div>
        <button onClick={load} disabled={loading} className="text-indigo-500 hover:text-indigo-700 disabled:opacity-40">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      {error && <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">{error}</div>}
      {info && (
        <div className="border border-gray-200 rounded-lg p-3 bg-white">
          <Row label="LLM 模型" value={info.llm_model} />
          <Row label="LLM Base URL" value={info.llm_base_url} />
          <Row label="VLM 模型" value={info.vlm_model} />
          <Row label="VLM 备用" value={info.vlm_fallback_model} />
          <Row label="轮询文件夹" value={info.poll_folders} />
          <Row label="轮询间隔" value={`${info.poll_interval}s`} />
          <Row label="LogiTrack 建单" value={info.logitrack_enabled ? '已启用' : '已禁用'} />
          <Row label="TEST 邮箱" value={info.test_forward_mailbox} />
          <Row label="已测邮件数" value={info.tested_emails_count} />
          {typeof info.skip_checker === 'object' && info.skip_checker !== null && (
            <>
              <Row label="SkipChecker subject关键词" value={(info.skip_checker as Record<string,unknown>).subject_keywords} />
              <Row label="SkipChecker body关键词" value={(info.skip_checker as Record<string,unknown>).body_keywords} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────

const DebugTools: React.FC = () => (
  <div className="space-y-6">
    <SkipCheckerTest />
    <hr className="border-gray-100" />
    <RouterTest />
    <hr className="border-gray-100" />
    <SystemInfo />
  </div>
);

export default DebugTools;
