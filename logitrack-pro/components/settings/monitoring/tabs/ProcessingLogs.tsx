import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronDown, ChevronRight, RefreshCw, X, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { monitorApi, monitorPyApi, ProcessingLogDTO, LogSearchParams } from '../../../../services/monitorApi';
import LogDetailPanel from '../detail/LogDetailPanel';

// ─── 常量 ────────────────────────────────────────────────────────────────────

const FOLDERS = ['Sea', 'Air', 'Rail', 'Inbox'];
const RESULTS = ['PROCESSED', 'SKIPPED', 'ERROR', 'FORWARDED'];
const EMAIL_TYPES = ['INQUIRY', 'BOOKING', 'FOLLOW_UP', 'COMPLAINT', 'OTHER'];

const RESULT_STYLE: Record<string, { cls: string; label: string }> = {
  PROCESSED:  { cls: 'bg-green-100 text-green-700',   label: '✅ 已处理' },
  SKIPPED:    { cls: 'bg-gray-100 text-gray-500',     label: '⏭️ 跳过' },
  ERROR:      { cls: 'bg-red-100 text-red-600',       label: '❌ 失败' },
  FORWARDED:  { cls: 'bg-blue-100 text-blue-700',     label: '📤 已转发' },
};

const FOLDER_STYLE: Record<string, string> = {
  Sea:   'bg-blue-50 text-blue-600',
  Air:   'bg-purple-50 text-purple-600',
  Rail:  'bg-green-50 text-green-600',
  Inbox: 'bg-gray-100 text-gray-500',
};

const TYPE_STYLE: Record<string, string> = {
  INQUIRY:   'bg-blue-100 text-blue-700',
  BOOKING:   'bg-orange-100 text-orange-700',
  FOLLOW_UP: 'bg-gray-100 text-gray-500',
  COMPLAINT: 'bg-red-100 text-red-600',
};

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function fmtTime(dt: string) {
  return dt.replace('T', ' ').substring(0, 16);
}

function relativeTime(dt: string): string {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  return `${Math.floor(hrs / 24)}天前`;
}

// ─── 初始筛选状态 ──────────────────────────────────────────────────────────────

const EMPTY_FILTERS: LogSearchParams = {
  folderName: '',
  processResult: '',
  emailType: '',
  senderEmail: '',
  keyword: '',
  startTime: '',
  endTime: '',
  page: 0,
  size: 20,
};

// ─── 筛选栏 ───────────────────────────────────────────────────────────────────

interface FilterBarProps {
  filters: LogSearchParams;
  onChange: (f: LogSearchParams) => void;
  onSearch: () => void;
  onClear: () => void;
  loading: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, onSearch, onClear, loading }) => {
  const [open, setOpen] = useState(true);

  const set = (key: keyof LogSearchParams, val: string) =>
    onChange({ ...filters, [key]: val, page: 0 });

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800"
      >
        <Filter size={14} />
        筛选条件
        {open ? <ChevronDown size={14} className="ml-auto" /> : <ChevronRight size={14} className="ml-auto" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200">
          {/* 第一行 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">开始时间</label>
              <input
                type="date"
                value={filters.startTime?.substring(0, 10) ?? ''}
                onChange={e => set('startTime', e.target.value ? e.target.value + 'T00:00:00' : '')}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">结束时间</label>
              <input
                type="date"
                value={filters.endTime?.substring(0, 10) ?? ''}
                onChange={e => set('endTime', e.target.value ? e.target.value + 'T23:59:59' : '')}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">文件夹</label>
              <select
                value={filters.folderName ?? ''}
                onChange={e => set('folderName', e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
              >
                <option value="">全部</option>
                {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">处理结果</label>
              <select
                value={filters.processResult ?? ''}
                onChange={e => set('processResult', e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
              >
                <option value="">全部</option>
                {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {/* 第二行 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">邮件类型</label>
              <select
                value={filters.emailType ?? ''}
                onChange={e => set('emailType', e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
              >
                <option value="">全部</option>
                {EMAIL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">发件人</label>
              <input
                type="text"
                placeholder="邮箱地址（模糊匹配）"
                value={filters.senderEmail ?? ''}
                onChange={e => set('senderEmail', e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">主题关键词</label>
              <input
                type="text"
                placeholder="主题模糊搜索"
                value={filters.keyword ?? ''}
                onChange={e => set('keyword', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSearch()}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
              />
            </div>
          </div>
          {/* 操作按钮 */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onSearch}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              <Search size={13} />
              查询
            </button>
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-sm hover:bg-gray-100"
            >
              <X size={13} />
              清除
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── 内联路由测试结果 ─────────────────────────────────────────────────────────

interface InlineReplayProps {
  log: ProcessingLogDTO;
  onClose: () => void;
}

const InlineReplay: React.FC<InlineReplayProps> = ({ log, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    monitorPyApi.replayFromLog({
      conversation_id: log.conversationId ?? String(log.id),
      subject: log.subject ?? '',
      sender: log.senderEmail ?? '',
      ai_analysis_json: log.aiAnalysisJson ?? '',
    })
      .then(r => setResult(r as Record<string, unknown>))
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="border-x border-b border-yellow-200 bg-yellow-50/40 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-yellow-700">🧪 路由重算结果（不实际转发）</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>

      {loading && <div className="text-xs text-gray-400 animate-pulse">计算中...</div>}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          <AlertCircle size={13} />
          {error.includes('Not Found') ? 'Python 监控服务未运行，请先启动服务' : error}
        </div>
      )}

      {result && (
        <div className="space-y-2 text-xs">
          {/* SkipChecker */}
          <div className="flex items-center gap-3">
            {(result.skip_result as Record<string, unknown>)?.skip ? (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">⏭ 跳过</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
                <CheckCircle size={11} /> 可建单
              </span>
            )}
            {(result.skip_result as Record<string, unknown>)?.reason && (
              <span className="text-gray-500">原因: {String((result.skip_result as Record<string, unknown>).reason)}</span>
            )}
          </div>

          {/* 路由指令 */}
          {(() => {
            const instrs = ((result.routing as Record<string, unknown>)?.instructions ?? []) as Array<Record<string, unknown>>;
            if (!instrs.length) return <div className="text-gray-400">无转发指令</div>;
            return (
              <div className="space-y-1.5">
                {instrs.map((instr, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded px-3 py-2 space-y-0.5">
                    <div className="text-gray-500">[{i+1}] {String(instr.transport_mode ?? '')} · Branch: <strong>{String(instr.branch ?? '')}</strong> · Risk: <span className={instr.risk_level === 'HIGH' ? 'text-red-600' : instr.risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'}>{String(instr.risk_level ?? '')}</span></div>
                    <div><span className="text-gray-400">TO: </span>{(instr.to as string[])?.join(', ') || '—'}</div>
                    <div><span className="text-gray-400">CC: </span>{(instr.cc as string[])?.join(', ') || '—'}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* routing_reason */}
          {(() => {
            const reason = (result.routing as Record<string, unknown>)?.routing_reason as Record<string, unknown> | undefined;
            if (!reason) return null;
            return (
              <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 space-y-1">
                <div className="text-gray-500 font-medium">🧭 路由决策</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {reason.rule_triggered && <div><span className="text-gray-400">规则: </span><span className="font-mono">{String(reason.rule_triggered)}</span></div>}
                  {reason.is_core !== undefined && <div><span className="text-gray-400">Core: </span>{reason.is_core ? '✅ Yes' : '⚪ No'}</div>}
                  {reason.core_basis && <div><span className="text-gray-400">依据: </span>{String(reason.core_basis)}</div>}
                  {reason.branch_resolved && <div><span className="text-gray-400">Branch: </span><strong>{String(reason.branch_resolved)}</strong></div>}
                  {reason.fallback_used && <div className="col-span-2 text-yellow-600">⚠️ 使用了 fallback 路由</div>}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────

const ProcessingLogs: React.FC = () => {
  const [filters, setFilters] = useState<LogSearchParams>({ ...EMPTY_FILTERS });
  const [pendingFilters, setPendingFilters] = useState<LogSearchParams>({ ...EMPTY_FILTERS });
  const [logs, setLogs] = useState<ProcessingLogDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replayId, setReplayId] = useState<number | null>(null);   // 内联路由测试

  const fetchLogs = useCallback(async (f: LogSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await monitorApi.getLogs(f);
      setLogs(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError('加载日志失败，请检查后端服务是否运行');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => { fetchLogs(filters); }, []);

  const handleSearch = () => {
    const f = { ...pendingFilters, page: 0 };
    setFilters(f);
    fetchLogs(f);
    setExpandedId(null);
  };

  const handleClear = () => {
    const f = { ...EMPTY_FILTERS };
    setPendingFilters(f);
    setFilters(f);
    fetchLogs(f);
    setExpandedId(null);
    setReplayId(null);
  };

  const handlePageChange = (newPage: number) => {
    const f = { ...filters, page: newPage };
    setFilters(f);
    fetchLogs(f);
    setExpandedId(null);
    setReplayId(null);
  };

  const toggleExpand = (id: number) => {
    setReplayId(null);
    setExpandedId(prev => prev === id ? null : id);
  };

  const toggleReplay = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(null);
    setReplayId(prev => prev === id ? null : id);
  };

  const currentPage = filters.page ?? 0;

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <FilterBar
        filters={pendingFilters}
        onChange={setPendingFilters}
        onSearch={handleSearch}
        onClear={handleClear}
        loading={loading}
      />

      {/* 汇总行 + 刷新 */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          共 <span className="font-medium text-gray-700">{totalElements}</span> 条记录
          {totalPages > 1 && <>，第 {currentPage + 1} / {totalPages} 页</>}
        </span>
        <button
          onClick={() => fetchLogs(filters)}
          disabled={loading}
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* 日志表格 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* 表头 */}
        <div className="hidden md:grid grid-cols-[140px_70px_160px_1fr_80px_110px_70px_36px_36px] bg-gray-50 border-b border-gray-200 px-3 py-2 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span>时间</span>
          <span>文件夹</span>
          <span>发件人</span>
          <span>主题</span>
          <span>类型</span>
          <span>结果</span>
          <span>建单</span>
          <span title="测试路由"><Play size={11} /></span>
          <span></span>
        </div>

        {/* 数据行 */}
        {loading && logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">暂无数据</div>
        ) : (
          <div>
            {logs.map(log => (
              <React.Fragment key={log.id}>
                {/* 数据行 */}
                <div
                  onClick={() => toggleExpand(log.id)}
                  className={`grid grid-cols-[140px_70px_160px_1fr_80px_110px_70px_36px_36px] px-3 py-2.5 gap-2 border-b border-gray-100 text-sm cursor-pointer transition-colors
                    ${expandedId === log.id ? 'bg-indigo-50/60' : replayId === log.id ? 'bg-yellow-50/60' : 'hover:bg-gray-50'}`}
                >
                  {/* 时间 */}
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-xs text-gray-600">{fmtTime(log.processedAt)}</span>
                    <span className="text-xs text-gray-400">{relativeTime(log.processedAt)}</span>
                  </div>

                  {/* 文件夹 */}
                  <div className="flex items-start pt-0.5">
                    {log.folderName ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${FOLDER_STYLE[log.folderName] ?? 'bg-gray-100 text-gray-500'}`}>
                        {log.folderName}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </div>

                  {/* 发件人 */}
                  <div className="truncate text-xs text-gray-600 pt-0.5" title={log.senderEmail ?? ''}>
                    {log.senderEmail || '—'}
                  </div>

                  {/* 主题 */}
                  <div className="truncate text-xs text-gray-700 pt-0.5" title={log.subject ?? ''}>
                    {log.subject || '(无主题)'}
                  </div>

                  {/* 邮件类型 */}
                  <div className="flex items-start pt-0.5">
                    {log.emailType ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_STYLE[log.emailType] ?? 'bg-gray-100 text-gray-500'}`}>
                        {log.emailType}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </div>

                  {/* 处理结果 */}
                  <div className="flex items-start pt-0.5">
                    {(() => {
                      const s = RESULT_STYLE[log.processResult];
                      return s ? (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${s.cls}`}>{s.label}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">{log.processResult}</span>
                      );
                    })()}
                  </div>

                  {/* 建单状态 */}
                  <div className="flex items-start pt-0.5">
                    {log.logitrackCreated ? (
                      <span className="text-xs text-green-600 font-medium">
                        🧾 {log.logitrackRef || log.logitrackId || '✓'}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </div>

                  {/* 测试路由按钮 */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={e => toggleReplay(log.id, e)}
                      title="测试路由（重算 SkipChecker + 路由指令，不实际转发）"
                      className={`p-1 rounded transition-colors ${
                        replayId === log.id
                          ? 'bg-yellow-500 text-white'
                          : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                      }`}
                    >
                      <Play size={12} />
                    </button>
                  </div>

                  {/* 展开按钮 */}
                  <div className="flex items-center justify-center text-gray-400">
                    {expandedId === log.id
                      ? <ChevronDown size={14} className="text-indigo-500" />
                      : <ChevronRight size={14} />}
                  </div>
                </div>

                {/* 内联路由测试结果 */}
                {replayId === log.id && (
                  <InlineReplay log={log} onClose={() => setReplayId(null)} />
                )}

                {/* 展开详情 */}
                {expandedId === log.id && (
                  <LogDetailPanel
                    log={log}
                    inline
                    onClose={() => setExpandedId(null)}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-1">
          <button
            onClick={() => handlePageChange(0)}
            disabled={currentPage === 0}
            className="px-2 py-1 rounded text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            «
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-2 py-1 rounded text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            ‹
          </button>

          {/* 页码按钮（最多显示 7 页） */}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let p = i;
            if (totalPages > 7) {
              if (currentPage < 4) p = i;
              else if (currentPage > totalPages - 4) p = totalPages - 7 + i;
              else p = currentPage - 3 + i;
            }
            return (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-2.5 py-1 rounded text-sm border ${
                  p === currentPage
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p + 1}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="px-2 py-1 rounded text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            ›
          </button>
          <button
            onClick={() => handlePageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            className="px-2 py-1 rounded text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
};

export default ProcessingLogs;
