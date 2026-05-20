/**
 * 邮件 AI 监控 API 服务层
 *
 * 两类数据源:
 *  - Spring Boot  /api/monitor/*  — 历史数据（MySQL 查询）
 *  - Python FastAPI /pyapi/*       — 实时进程状态（通过 Vite 代理 → :5100）
 */

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export interface MonitorStatsDTO {
  // 今日统计
  todayTotal: number;
  todayProcessed: number;
  todaySkipped: number;
  todayErrors: number;
  todayForwarded: number;
  todayLogitrack: number;
  // 最新状态快照
  runMode: string | null;
  isRunning: boolean | null;
  pollInterval: number | null;
  lastPollTime: string | null;
  uptimeSeconds: number | null;
  consecutiveFailures: number | null;
  graphApiOk: boolean | null;
  llmApiOk: boolean | null;
  vlmApiOk: boolean | null;
  logitrackOk: boolean | null;
}

export interface ProcessingLogDTO {
  id: number;
  conversationId: string | null;
  folderName: string | null;
  subject: string | null;
  senderEmail: string | null;
  processedAt: string;
  isInquiry: boolean | null;
  emailType: string | null;
  transportMode: string | null;
  branchCode: string | null;
  riskLevel: string | null;
  riskScore: number | null;
  originCity: string | null;
  destination: string | null;
  pol: string | null;
  pod: string | null;
  confidence: number | null;
  processResult: string;
  skipReason: string | null;
  forwardStatus: string | null;
  logitrackCreated: boolean | null;
  logitrackId: number | null;
  logitrackRef: string | null;
  logitrackError: string | null;
  aiAnalysisJson: string | null;
  routingJson: string | null;
  forwardTo: string | null;
  forwardCc: string | null;
  aiLatencyMs: number | null;
  totalLatencyMs: number | null;
  runMode: string | null;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PyApiStatus {
  run_mode: string;
  is_running: boolean;
  poll_interval: number;
  last_poll_time: string | null;
  start_time: string;
  uptime_seconds: number;
  current_processed: number;
  current_skipped: number;
  current_errors: number;
  total_processed: number;
  total_skipped: number;
  total_errors: number;
  total_forwarded: number;
  total_logitrack: number;
  consecutive_failures: number;
  total_failures: number;
  health: {
    graph_api: boolean | null;
    llm_api: boolean | null;
    vlm_api: boolean | null;
    logitrack: boolean | null;
  };
}

export interface PyApiHealth {
  graph_api: string;
  llm_api: string;
  vlm_api: string;
  logitrack: string;
  checked_at: string;
}

export interface LogSearchParams {
  folderName?: string;
  processResult?: string;
  emailType?: string;
  senderEmail?: string;
  keyword?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  size?: number;
}

// ─── 训练案例类型 ──────────────────────────────────────────────────────────

export interface TrainingCase {
  id: string;
  title: string;
  markdown_text: string;
  correction_note: string;
  status: 'active' | 'paused';
  created_at: string;
  updated_at?: string;
}

export interface FewshotStats {
  base_count: number;
  training_total: number;
  training_active: number;
  training_paused: number;
  base_mtime: string | null;
  training_mtime: string | null;
  estimated_tokens: number;
  warning: string | null;
}

export interface RegressionRouteDetail {
  id: string;
  subject: string;
  branch?: string;
  mode?: string;
  status: 'ok' | 'error';
  to?: string[];
  error?: string;
}

export interface RegressionResult {
  ok: boolean;
  total: number;
  inquiry_total: number;
  routed_ok: number;
  routing_errors: number;
  recall_rate: number;
  pass: boolean;
  errors: RegressionRouteDetail[];
  details: RegressionRouteDetail[];
  run_at: string;
}

export interface PromptPreview {
  ok: boolean;
  total_chars: number;
  estimated_tokens: number;
  base_count: number;
  training_active: number;
  preview: string;
  truncated: boolean;
}

// ─── Spring Boot API（历史数据）─────────────────────────────────────────────

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

export const monitorApi = {
  /** Dashboard 统计卡片 */
  getStats: () => request<MonitorStatsDTO>('/monitor/stats'),

  /** 处理日志分页查询 */
  getLogs: (params: LogSearchParams = {}) => {
    const query = buildQuery({
      folderName: params.folderName,
      processResult: params.processResult,
      emailType: params.emailType,
      senderEmail: params.senderEmail,
      keyword: params.keyword,
      startTime: params.startTime,
      endTime: params.endTime,
      page: params.page ?? 0,
      size: params.size ?? 20,
    });
    return request<PagedResponse<ProcessingLogDTO>>(`/monitor/logs${query}`);
  },

  /** 最近 20 条日志 */
  getRecentLogs: () => request<ProcessingLogDTO[]>('/monitor/logs/recent'),
};

// ─── Python FastAPI（实时进程状态）──────────────────────────────────────────

async function pyRequest<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const monitorPyApi = {
  /** 实时进程状态 */
  getStatus: () => pyRequest<PyApiStatus>('/pyapi/status'),

  /** 各服务健康状态 */
  getHealth: () => pyRequest<PyApiHealth>('/pyapi/status/health'),

  /** 系统概要 */
  getSystemInfo: () => pyRequest<Record<string, unknown>>('/pyapi/debug/system-info'),

  /** 切换运行模式 */
  switchMode: (mode: string, testMailbox?: string) =>
    fetch('/pyapi/control/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, test_mailbox: testMailbox }),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),

  /** 切换日志级别 */
  setLogLevel: (level: string) =>
    fetch('/pyapi/control/log-level', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),

  /** 立即触发轮询 */
  pollNow: () =>
    fetch('/pyapi/control/poll-now', { method: 'POST' })
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),

  /** 邮件重放（从 tested_emails.json 缓存） */
  replay: (conversationId: string) =>
    fetch('/pyapi/replay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId }),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),

  /** 从 DB 日志数据直接重算路由（不依赖 tested_emails.json 缓存） */
  replayFromLog: (data: { conversation_id: string; subject: string; sender: string; ai_analysis_json: string }) =>
    fetch('/pyapi/replay/from-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),

  /** SkipChecker 测试 */
  testSkipChecker: (subject: string, body: string) =>
    fetch('/pyapi/debug/skip-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body }),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),

  /** Router 路由测试 */
  testRouter: (analysis: Record<string, unknown>) =>
    fetch('/pyapi/debug/router-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis }),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),

  /** 只读配置（掩码） */
  getConfig: () => pyRequest<Record<string, unknown>>('/pyapi/config'),

  /** 跳过规则 + 路由摘要 + tested_emails 统计 */
  getRules: () => pyRequest<Record<string, unknown>>('/pyapi/config/rules'),

  /** 测试服务连通性 */
  testConnection: (service: string) =>
    fetch('/pyapi/config/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service }),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<{ ok: boolean; latency_ms: number; detail: string }>; }),

  /** 修改轮询间隔（秒） */
  setPollInterval: (interval: number) =>
    fetch('/pyapi/control/poll-interval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval }),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),

  /** 切换 LOGITRACK_DRY_RUN 建单模式 */
  setLogitrackDryRun: (enabled: boolean) =>
    fetch('/pyapi/control/logitrack-dry-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),

  /** 从去重列表（tested_emails.json）移除指定 conversation_id */
  removeDedup: (conversationId: string) =>
    fetch(`/pyapi/dedup/${encodeURIComponent(conversationId)}`, { method: 'DELETE' })
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<{ ok: boolean; removed: string; subject: string; remaining: number }>; }),

  /** 按关键字搜索去重缓存（全量搜索，服务端过滤） */
  searchDedup: (keyword = '', limit = 20) =>
    fetch(`/pyapi/dedup/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`)
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<{ total: number; shown: number; keyword: string; records: Array<{ conversation_id: string; subject: string; sender: string; folder: string; tested_at: string; email_type: string | null; is_inquiry: boolean | null }> }>; }),

  /** 读取完整 pic_routing.json */
  getRouting: () => pyRequest<Record<string, unknown>>('/pyapi/routing'),

  /** 保存 pic_routing.json 修改（仅 core_countries / managers / branch to|cc|destination_rules） */
  saveRouting: (payload: Record<string, unknown>) =>
    fetch('/pyapi/routing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<{ ok: boolean; message: string }>; }),

  /** 读取完整 skip_lists.json */
  getSkipRules: () => pyRequest<Record<string, unknown>>('/pyapi/skip-rules'),

  /** 保存 skip_lists.json 修改（仅 keywords / sender_domains / destination_countries 等白名单字段） */
  saveSkipRules: (payload: Record<string, unknown>) =>
    fetch('/pyapi/skip-rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<{ ok: boolean; message: string }>; }),

  // ── Training / Few-shot 管理 ─────────────────────────────────────────────

  /** 获取所有训练纠错案例 */
  listTrainingCases: () =>
    pyRequest<{ total: number; cases: TrainingCase[] }>('/pyapi/training/cases'),

  /** 新增训练纠错案例 */
  createTrainingCase: (payload: { title: string; markdown_text: string; correction_note?: string; status?: string }) =>
    fetch('/pyapi/training/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<{ ok: boolean; id: string; case: TrainingCase }>; }),

  /** 更新训练案例（部分字段） */
  updateTrainingCase: (id: string, payload: Partial<Pick<TrainingCase, 'title' | 'markdown_text' | 'correction_note' | 'status'>>) =>
    fetch(`/pyapi/training/cases/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<{ ok: boolean; case: TrainingCase }>; }),

  /** 暂停/恢复案例（active ↔ paused） */
  toggleTrainingCase: (id: string) =>
    fetch(`/pyapi/training/cases/${encodeURIComponent(id)}/pause`, { method: 'POST' })
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<{ ok: boolean; id: string; old_status: string; new_status: string }>; }),

  /** 删除训练案例 */
  deleteTrainingCase: (id: string) =>
    fetch(`/pyapi/training/cases/${encodeURIComponent(id)}`, { method: 'DELETE' })
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<{ ok: boolean; removed_id: string; title: string; remaining: number }>; }),

  /** What-If 路由模拟（给定 AI 字段 JSON → 返回路由结果） */
  simulateRouting: (analysis: Record<string, unknown>) =>
    fetch('/pyapi/training/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis }),
    }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<{ ok: boolean; routing: unknown }>; }),

  /** PIC 邮箱选项列表（从 pic_routing.json 提取） */
  getPicOptions: () =>
    pyRequest<{ emails: string[]; branches: string[] }>('/pyapi/training/pic-options'),

  /** Few-shot 统计信息 */
  getFewshotStats: () =>
    pyRequest<FewshotStats>('/pyapi/training/fewshot-stats'),

  /** 轻量级路由回归测试（复用已存储 AI 分析，不调用 LLM） */
  runRegression: () =>
    fetch('/pyapi/training/regression', { method: 'POST' })
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<RegressionResult>; }),

  /** 预览当前合并后 prompt 的前 N 字符 */
  previewPrompt: (chars = 2000) =>
    fetch(`/pyapi/training/preview-prompt?chars=${chars}`)
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() as Promise<PromptPreview>; }),
};

// ─── Spring Boot 进程管理 API ─────────────────────────────────────────────────

export interface ProcessStatusDTO {
  running: boolean;
  pid: number | null;
  runMode: string | null;
  startedAt: string | null;
  message: string;
}

export interface StartRequestDTO {
  runMode: string;           // DRY_RUN / TEST_FORWARD / LIVE
  pollInterval?: number;     // 秒
  logitrackDryRun?: boolean; // true=打印建单，false=实际建单
  testMailbox?: string;      // TEST_FORWARD 目标邮箱
  auditBcc?: string;         // LIVE 模式审核 BCC 邮箱
}

export const processApi = {
  /** 查询进程状态 */
  getStatus: () => request<ProcessStatusDTO>('/monitor/process/status'),

  /** 启动 email-ai-automation */
  start: (req: StartRequestDTO) =>
    fetch('/api/monitor/process/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.message ?? `HTTP ${r.status}`);
      return data as Record<string, unknown>;
    }),

  /** 停止 email-ai-automation */
  stop: () =>
    fetch('/api/monitor/process/stop', { method: 'POST' })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message ?? `HTTP ${r.status}`);
        return data as Record<string, unknown>;
      }),
};

