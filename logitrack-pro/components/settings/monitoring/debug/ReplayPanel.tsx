import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Trash2, AlertCircle, CheckCircle, RefreshCw, X, ChevronDown, ChevronRight } from 'lucide-react';
import { monitorApi, monitorPyApi, ProcessingLogDTO } from '../../../../services/monitorApi';

// ─── 共用类型 ─────────────────────────────────────────────────────────────────

interface ReplayResult {
  ok: boolean;
  conversation_id: string;
  subject: string;
  sender: string;
  analysis: Record<string, unknown>;
  skip_result: { skip: boolean; reason: string; matched_keyword: string; };
  routing: {
    instructions: Array<{ to: string[]; cc: string[]; transport_mode: string; branch: string; risk_level: string; note?: string; }>;
    routing_reason?: Record<string, unknown>;
  };
  note: string;
}

// ─── 重放结果展示 ─────────────────────────────────────────────────────────────

const ReplayResultPanel: React.FC<{ result: ReplayResult; onClear: () => void }> = ({ result, onClear }) => {
  const [showReason, setShowReason] = useState(false);
  const reason = result.routing?.routing_reason;
  return (
    <div className="space-y-3 border border-green-100 rounded-lg p-4 bg-green-50/20">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-sm text-gray-800">📧 {result.subject || '(无主题)'}</div>
          <div className="text-xs text-gray-500 mt-0.5">发件人: {result.sender || '—'}</div>
        </div>
        <button onClick={onClear} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>
      <div className="border border-gray-200 rounded p-3 bg-white">
        <div className="text-xs font-semibold text-gray-600 mb-1.5">🚧 SkipChecker</div>
        <div className="flex items-center gap-3">
          {result.skip_result.skip
            ? <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium flex items-center gap-1"><AlertCircle size={10} /> 跳过</span>
            : <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium flex items-center gap-1"><CheckCircle size={10} /> 可建单</span>}
          {result.skip_result.reason && <span className="text-xs text-gray-500">原因: {result.skip_result.reason}</span>}
          {result.skip_result.matched_keyword && <span className="text-xs text-gray-400">命中: 「{result.skip_result.matched_keyword}」</span>}
        </div>
      </div>
      <div className="border border-gray-200 rounded p-3 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-gray-600">📤 路由指令</div>
          {reason && (
            <button onClick={() => setShowReason(v => !v)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800">
              {showReason ? <ChevronDown size={11}/> : <ChevronRight size={11}/>} 路由决策说明
            </button>
          )}
        </div>
        {result.routing?.instructions?.length > 0 ? result.routing.instructions.map((instr, i) => (
          <div key={i} className="text-xs space-y-0.5 mb-2 last:mb-0 border-l-2 border-indigo-200 pl-2">
            <div className="text-gray-600 font-medium">[{i+1}] <span className="font-mono">{instr.transport_mode}</span> · Branch: <strong>{instr.branch}</strong> · <span className={instr.risk_level==='HIGH'?'text-red-600':instr.risk_level==='MEDIUM'?'text-yellow-600':'text-green-600'}>{instr.risk_level}</span></div>
            <div><span className="text-gray-400">TO: </span>{instr.to?.join(', ')||'—'}</div>
            <div><span className="text-gray-400">CC: </span>{instr.cc?.join(', ')||'—'}</div>
          </div>
        )) : <div className="text-xs text-gray-400">无转发指令</div>}
        {reason && showReason && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {reason.rule_triggered && <div><span className="text-gray-400">规则: </span><span className="font-mono font-semibold">{String(reason.rule_triggered)}</span></div>}
            {reason.is_core !== undefined && <div><span className="text-gray-400">Core: </span>{reason.is_core ? '✅ Yes' : '⚪ No'}</div>}
            {reason.core_basis && <div><span className="text-gray-400">依据: </span>{String(reason.core_basis)}</div>}
            {reason.branch_resolved && <div><span className="text-gray-400">Branch: </span><strong>{String(reason.branch_resolved)}</strong></div>}
            {reason.destination_country && <div><span className="text-gray-400">目的国: </span>{String(reason.destination_country)}</div>}
            {reason.fallback_used && <div className="col-span-2 text-yellow-600">⚠️ 使用了 fallback 路由</div>}
            {reason.rule_note && <div className="col-span-2 text-gray-500 italic">{String(reason.rule_note)}</div>}
          </div>
        )}
      </div>
      <div className="text-xs text-gray-400 italic">{result.note}</div>
    </div>
  );
};

// ─── 去重缓存管理 ─────────────────────────────────────────────────────────────

const DedupManager: React.FC = () => {
  type DedupRec = { conversation_id: string; subject: string; sender: string; folder: string; tested_at: string; email_type: string | null; is_inquiry: boolean | null };
  const [records, setRecords] = useState<DedupRec[]>([]);
  const [total, setTotal] = useState(0);
  const [shown, setShown] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async (kw = '') => {
    setLoading(true);
    setLoaded(false);
    try {
      const res = await monitorPyApi.searchDedup(kw, 30);
      setRecords(res.records);
      setTotal(res.total);
      setShown(res.shown);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleRemove = async (id: string, subject: string) => {
    if (!confirm(`确认从去重列表移除？\n「${subject}」\n移除后下次轮询将重新处理该邮件。`)) return;
    setRemoving(id);
    setMsg(null);
    try {
      const r = await monitorPyApi.removeDedup(id);
      setMsg({ type: 'ok', text: `✅ 已移除「${r.subject}」，缓存剩余 ${r.remaining} 条` });
      setRecords(prev => prev.filter(rec => rec.conversation_id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      setShown(prev => Math.max(0, prev - 1));
    } catch (e: unknown) {
      const txt = e instanceof Error ? e.message : String(e);
      setMsg({ type: 'err', text: txt.includes('404') ? '未在去重列表中找到（可能已被移除）' : `移除失败: ${txt}` });
    } finally { setRemoving(null); }
  };

  return (
    <div className="space-y-2">
      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="按主题或发件人关键字搜索..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load(keyword)}
          className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <button
          onClick={() => load(keyword)}
          disabled={loading}
          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-1"
        >
          {loading ? <RefreshCw size={11} className="animate-spin" /> : '搜索'}
        </button>
        {keyword && (
          <button
            onClick={() => { setKeyword(''); load(''); }}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded text-gray-500 hover:bg-gray-50"
            title="清除搜索"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* 统计行 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          共 <span className="font-medium text-gray-700">{total}</span> 条缓存
          {keyword && shown < total && <>，搜索到 <span className="font-medium text-indigo-600">{shown}</span> 条</>}
        </span>
        <button onClick={() => load(keyword)} className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700">
          <RefreshCw size={11} /> 刷新
        </button>
      </div>

      {/* 消息提示 */}
      {msg && (
        <div className={`text-xs rounded px-3 py-1.5 border ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* 列表 */}
      {!loaded ? (
        <div className="text-xs text-gray-400 animate-pulse py-3 text-center">加载中...</div>
      ) : records.length === 0 ? (
        <div className="text-xs text-gray-400 py-4 text-center">
          {keyword ? `未找到包含「${keyword}」的记录` : '去重列表为空（Python 服务未运行或暂无记录）'}
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {records.map(rec => (
            <div
              key={rec.conversation_id}
              className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-lg bg-gray-50 group hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {rec.email_type && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      {rec.email_type}
                    </span>
                  )}
                  {rec.folder && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-600">
                      {rec.folder}
                    </span>
                  )}
                  <span className="text-xs font-medium text-gray-700 truncate">{rec.subject || '(无主题)'}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {rec.sender && <span className="mr-2 truncate max-w-[180px] inline-block align-bottom">{rec.sender}</span>}
                  {rec.tested_at?.substring(0, 16).replace('T', ' ')}
                </div>
              </div>
              <button
                onClick={() => handleRemove(rec.conversation_id, rec.subject || '(无主题)')}
                disabled={removing === rec.conversation_id}
                title="从去重列表移除（使邮件可重新处理）"
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50 disabled:opacity-40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={11} /> 移除
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400">💡 移除后该邮件将在下次轮询时重新被处理（修复 "duplicate" 误判）。</p>
    </div>
  );
};

// ─── DB 日志选择器 ────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<string, string> = {
  INQUIRY: 'bg-blue-100 text-blue-700', BOOKING: 'bg-orange-100 text-orange-700',
  FOLLOW_UP: 'bg-gray-100 text-gray-500', COMPLAINT: 'bg-red-100 text-red-600',
};

const DbLogPicker: React.FC<{ onSelect: (log: ProcessingLogDTO) => void }> = ({ onSelect }) => {
  const [logs, setLogs] = useState<ProcessingLogDTO[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async (kw = '') => {
    setLoading(true);
    try {
      const res = await monitorApi.getLogs({ keyword: kw, page: 0, size: 10 });
      setLogs(res.content);
    } catch { setLogs([]); } finally { setLoading(false); setLoaded(true); }
  }, []);

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input type="text" placeholder="按主题关键词搜索..." value={keyword} onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key==='Enter' && load(keyword)}
          className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
        <button onClick={() => load(keyword)} disabled={loading}
          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-1">
          {loading ? <RefreshCw size={11} className="animate-spin"/> : '搜索'}
        </button>
      </div>
      {!loaded ? <div className="text-xs text-gray-400 animate-pulse">加载中...</div>
        : logs.length === 0
          ? <div className="text-xs text-gray-400 py-3 text-center">暂无日志（请检查后端服务是否运行）</div>
          : <div className="space-y-1 max-h-72 overflow-y-auto">{logs.map(log => (
              <button key={log.id} onClick={() => onSelect(log)}
                className="w-full text-left flex items-start gap-2 p-2.5 border border-gray-100 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {log.emailType && <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_STYLE[log.emailType]??'bg-gray-100 text-gray-500'}`}>{log.emailType}</span>}
                    <span className="text-xs text-gray-700 truncate font-medium">{log.subject||'(无主题)'}</span>
                  </div>
                  <div className="text-xs text-gray-400">{log.senderEmail} · {log.processedAt?.substring(0,16).replace('T',' ')}</div>
                </div>
                <span className="text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 flex items-center gap-1 mt-1">
                  <Play size={10}/> 测试路由
                </span>
              </button>
            ))}</div>
      }
    </div>
  );
};

// ─── 主面板 ──────────────────────────────────────────────────────────────────

type ActiveSection = 'db' | 'dedup';

const ReplayPanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('db');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ProcessingLogDTO | null>(null);

  const handleReplayFromLog = useCallback(async (log: ProcessingLogDTO) => {
    setSelectedLog(log);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const res = await monitorPyApi.replayFromLog({
        conversation_id: log.conversationId ?? String(log.id),
        subject: log.subject ?? '',
        sender: log.senderEmail ?? '',
        ai_analysis_json: log.aiAnalysisJson ?? '',
      }) as ReplayResult;
      setResult(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes('Not Found') || msg.includes('ECONNREFUSED') || msg.includes('502') || msg.includes('fetch')
        ? 'Python 监控服务未运行，请先在「🚀 服务管理」Tab 启动服务'
        : `重算失败: ${msg}`);
    } finally { setLoading(false); }
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-gray-700">🧪 邮件路由测试 & 去重管理</div>

      <div className="flex gap-0 border-b border-gray-200">
        {([
          { id: 'db' as ActiveSection, label: '📋 从处理日志选择' },
          { id: 'dedup' as ActiveSection, label: '🗑 去重缓存管理' },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${activeSection===tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeSection === 'db' && (
          <>
            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded px-3 py-2">
              💡 <strong>操作说明：</strong>从下方选择任意已处理邮件，系统将使用其 AI 分析数据重新计算 SkipChecker 和路由指令（不实际转发）。无需手动复制 conversationId。
            </div>
            <DbLogPicker onSelect={handleReplayFromLog} />
            {loading && selectedLog && (
              <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-3 py-2 animate-pulse">
                <RotateCcw size={14} className="animate-spin"/> 正在重算「{selectedLog.subject||'(无主题)'}」的路由...
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/><div>{error}</div>
              </div>
            )}
            {result && <ReplayResultPanel result={result} onClear={() => { setResult(null); setSelectedLog(null); }} />}
          </>
        )}
        {activeSection === 'dedup' && (
          <>
            <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-100 rounded px-3 py-2">
              💡 <strong>操作说明：</strong>去重列表（tested_emails.json）记录了已处理的邮件 ID。如某封邮件被误判为 "duplicate" 跳过，可在此移除记录，使其在下次轮询时重新被处理。
            </div>
            <DedupManager />
          </>
        )}
      </div>
    </div>
  );
};

export default ReplayPanel;