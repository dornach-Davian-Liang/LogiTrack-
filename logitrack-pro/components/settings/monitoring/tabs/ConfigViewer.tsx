import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Link, ChevronDown, ChevronRight, Plus, X, Save, AlertTriangle } from 'lucide-react';
import { monitorPyApi } from '../../../../services/monitorApi';

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  graph: 'Microsoft Graph',
  llm: 'DeepSeek LLM',
  vlm: 'VLM 主用（七牛云）',
  vlm_fallback: 'VLM 备用',
  logitrack: 'LogiTrack API',
};

// ─── D1：API 连接状态 ─────────────────────────────────────────────────────────

interface ServiceCardProps {
  serviceKey: string;
  fields: Record<string, string | boolean | undefined | null>;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ serviceKey, fields }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latency_ms: number; detail: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await monitorPyApi.testConnection(serviceKey);
      setTestResult(res);
    } catch (e: unknown) {
      setTestResult({ ok: false, latency_ms: 0, detail: e instanceof Error ? e.message : String(e) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-sm text-gray-700">{SERVICE_LABELS[serviceKey] ?? serviceKey}</span>
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-1 px-3 py-1 text-xs border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50 disabled:opacity-40"
        >
          <Link size={11} />
          {testing ? '测试中...' : '测试连接'}
        </button>
      </div>

      {/* 字段列表 */}
      <div className="space-y-1">
        {Object.entries(fields).map(([k, v]) => (
          <div key={k} className="flex gap-2 text-xs">
            <span className="text-gray-400 w-28 flex-shrink-0">{k}:</span>
            <span className="font-mono text-gray-600 break-all">
              {v === null || v === undefined ? '—' : String(v)}
            </span>
          </div>
        ))}
      </div>

      {/* 测试结果 */}
      {testResult && (
        <div className={`mt-3 px-3 py-2 rounded text-xs border ${
          testResult.ok
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {testResult.ok ? '✅' : '❌'} {testResult.detail}
          {testResult.latency_ms > 0 && <span className="ml-2 text-gray-400">{testResult.latency_ms}ms</span>}
        </div>
      )}
    </div>
  );
};

const ApiConnectionPanel: React.FC<{ config: Record<string, unknown> }> = ({ config }) => {
  const services = config.services as Record<string, Record<string, unknown>> | undefined;
  if (!services) return <div className="text-sm text-gray-400">无配置数据</div>;

  const SERVICE_KEYS = ['graph', 'llm', 'vlm', 'vlm_fallback', 'logitrack'];

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-700">🔌 API 连接状态</div>
      <p className="text-xs text-gray-500">API 密钥仅展示后 4 位，不可编辑。</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {SERVICE_KEYS.map(key => {
          const svc = services[key] as Record<string, string | boolean | null> | undefined;
          if (!svc) return null;
          // 过滤掉 enabled 布尔字段，避免展示混乱
          const fields: Record<string, string | boolean | undefined | null> = {};
          Object.entries(svc).forEach(([k, v]) => {
            if (k !== 'enabled') fields[k] = v;
          });
          return <ServiceCard key={key} serviceKey={key} fields={fields} />;
        })}
      </div>
    </div>
  );
};

// ─── D2：运行参数 ─────────────────────────────────────────────────────────────

const RuntimeParamsPanel: React.FC<{ config: Record<string, unknown> }> = ({ config }) => {
  const rt = config.runtime as Record<string, unknown> | undefined;
  if (!rt) return null;

  const PARAM_LABELS: Record<string, { label: string; desc: string }> = {
    poll_interval:       { label: 'POLL_INTERVAL',       desc: '邮件轮询间隔（秒）' },
    logitrack_enabled:   { label: 'LOGITRACK_ENABLED',   desc: '自动建询价单开关' },
    temp_attachments_dir:{ label: 'TEMP_ATTACHMENTS_DIR',desc: '附件临时目录' },
    test_forward_mailbox:{ label: 'TEST_FORWARD_MAILBOX',desc: '测试转发收件箱' },
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-700">⚙️ 运行参数（只读）</div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 w-48">参数名</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 w-36">当前值</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">说明</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(PARAM_LABELS).map(([key, meta]) => (
              <tr key={key} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{meta.label}</td>
                <td className="px-4 py-2.5 font-semibold text-xs text-indigo-700">
                  {key === 'poll_interval'
                    ? `${rt[key]}s`
                    : key === 'logitrack_enabled'
                      ? (rt[key] ? '✅ 已启用' : '❌ 已禁用')
                      : String(rt[key] ?? '—')}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-400">{meta.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── D3：跳过规则编辑器 ──────────────────────────────────────────────────────

const CollapsibleSection: React.FC<{ title: string; count?: number; children: React.ReactNode }> = ({ title, count, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700"
      >
        <span>{title}{count !== undefined && <span className="ml-2 text-xs text-gray-400 font-normal">({count}条)</span>}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
};

// 单列关键词字段编辑器（chips + 新增输入框）
const KeywordListEditor: React.FC<{
  label: string;
  items: string[];
  placeholder?: string;
  onChange: (items: string[]) => void;
}> = ({ label, items, placeholder = '添加条目', onChange }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !items.includes(v)) { onChange([...items, v]); setInput(''); }
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-500">{label} ({items.length})</label>
      <div className="flex flex-wrap gap-1 min-h-[28px]">
        {items.length === 0 && <span className="text-xs text-gray-300 italic">(空)</span>}
        {items.map((kw, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded text-xs font-mono">
            {kw}
            <button onClick={() => remove(i)} className="text-orange-300 hover:text-orange-600"><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-300"
        />
        <button onClick={add} disabled={!input.trim()} className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 disabled:opacity-40">
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
};

// 跳过规则分类标题映射
const SKIP_CATEGORY_LABELS: Record<string, string> = {
  regular_customers: '常客（Regular Customers）',
  agent_enquiry:     '代理询价（Agent Enquiry）',
  non_core_biz:      '非核心地区（Non-Core Business）',
};
const SKIP_FIELD_LABELS: Record<string, string> = {
  keywords:              'keywords（主题+正文关键词）',
  sender_domains:        'sender_domains（发件人域名屏蔽）',
  destination_countries: 'destination_countries（目的地国家）',
  subject_body_keywords: 'subject_body_keywords（主题+正文关键词）',
};

const SkipRulesEditor: React.FC = () => {
  const [skipRules, setSkipRules] = useState<Record<string, unknown> | null>(null);
  const [edited, setEdited] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await monitorPyApi.getSkipRules();
      setSkipRules(r);
      setEdited(JSON.parse(JSON.stringify(r)));
    } catch (e: unknown) {
      setSaveMsg({ type: 'err', text: `加载失败: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!edited) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await monitorPyApi.saveSkipRules(edited);
      setSaveMsg({ type: 'ok', text: '✅ 跳过规则已保存，SkipChecker 缓存已热重载' });
      setSkipRules(JSON.parse(JSON.stringify(edited)));
    } catch (e: unknown) {
      setSaveMsg({ type: 'err', text: `保存失败: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setSaving(false);
    }
  };

  const resetEdits = () => {
    if (skipRules) { setEdited(JSON.parse(JSON.stringify(skipRules))); setSaveMsg(null); }
  };

  const isDirty = JSON.stringify(edited) !== JSON.stringify(skipRules);

  const setField = (category: string, field: string, items: string[]) => {
    setEdited(prev => ({
      ...prev!,
      [category]: { ...(prev![category] as Record<string, unknown>), [field]: items },
    }));
  };

  const getList = (category: string, field: string): string[] => {
    if (!edited) return [];
    const cat = edited[category] as Record<string, unknown> | undefined;
    if (!cat) return [];
    const val = cat[field];
    return Array.isArray(val) ? (val as string[]) : [];
  };

  if (loading) return <div className="text-sm text-gray-400 py-8 text-center">加载跳过规则...</div>;
  if (!edited) return <div className="text-sm text-yellow-700 bg-yellow-50 rounded px-4 py-3">⚠️ 跳过规则加载失败，请确认 Python 监控服务是否运行</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700">🚧 跳过规则编辑</div>
        <div className="flex gap-2">
          {isDirty && (
            <button onClick={resetEdits} className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded hover:bg-gray-50">
              撤销修改
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition-all ${
              isDirty ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save size={12} />
            {saving ? '保存中...' : isDirty ? '💾 保存规则' : '已是最新'}
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
          <AlertTriangle size={13} />
          有未保存的修改，保存后 SkipChecker 缓存立即热重载
        </div>
      )}

      {saveMsg && (
        <div className={`text-xs rounded px-3 py-2 ${saveMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {saveMsg.text}
        </div>
      )}

      {(['regular_customers', 'agent_enquiry', 'non_core_biz'] as const).map(category => {
        const catData = edited[category] as Record<string, unknown> | undefined;
        if (!catData) return null;
        const editableFields = Object.keys(catData).filter(k => !k.startsWith('_') && Array.isArray(catData[k]));
        const totalItems = editableFields.reduce((s, f) => s + (catData[f] as string[]).length, 0);
        return (
          <CollapsibleSection key={category} title={`🚧 ${SKIP_CATEGORY_LABELS[category] ?? category}`} count={totalItems}>
            <div className="space-y-4">
              {editableFields.map(field => (
                <KeywordListEditor
                  key={field}
                  label={SKIP_FIELD_LABELS[field] ?? field}
                  items={getList(category, field)}
                  placeholder={field === 'sender_domains' ? '添加域名（如 example.com）' : '添加关键词'}
                  onChange={items => setField(category, field, items)}
                />
              ))}
            </div>
          </CollapsibleSection>
        );
      })}
    </div>
  );
};

// ─── 路由配置编辑器 ───────────────────────────────────────────────────────────

// 可编辑的 emails 列（每行一个）
const EmailListEditor: React.FC<{
  label: string;
  emails: string[];
  onChange: (emails: string[]) => void;
}> = ({ label, emails, onChange }) => {
  const [newEmail, setNewEmail] = useState('');

  const add = () => {
    const e = newEmail.trim().toLowerCase();
    if (e && !emails.includes(e)) {
      onChange([...emails, e]);
      setNewEmail('');
    }
  };

  const remove = (i: number) => onChange(emails.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="flex flex-wrap gap-1 min-h-[28px]">
        {emails.length === 0 && <span className="text-xs text-gray-300 italic">（空）</span>}
        {emails.map((e, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-xs">
            {e}
            <button onClick={() => remove(i)} className="text-indigo-300 hover:text-indigo-600"><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="添加邮箱地址"
          className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
        />
        <button onClick={add} disabled={!newEmail.trim()} className="px-2 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 disabled:opacity-40">
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
};

// 行内文本新增辅助组件（用于 destination_rules 中 countries 添加）
const AddInlineItem: React.FC<{ placeholder: string; onAdd: (v: string) => void; accentClass?: string }> = ({ placeholder, onAdd, accentClass = '' }) => {
  const [v, setV] = useState('');
  const add = () => { const s = v.trim(); if (s) { onAdd(s); setV(''); } };
  return (
    <div className="flex gap-1.5 mt-1">
      <input
        value={v}
        onChange={e => setV(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && add()}
        placeholder={placeholder}
        className={`flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 ${accentClass}`}
      />
      <button onClick={add} disabled={!v.trim()} className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:opacity-40">
        <Plus size={11} />
      </button>
    </div>
  );
};

// 单 branch 编辑器（core + non_core 的 TO/CC）
// 对 SHA 和 NGB 的 core，额外渲染 destination_rules 国家级编辑区
const BranchEditor: React.FC<{
  mode: string;
  branch: string;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}> = ({ mode, branch, data, onChange }) => {
  const [open, setOpen] = useState(false);
  const getEmails = (bizKey: string, field: string): string[] => {
    const biz = (data[bizKey] ?? {}) as Record<string, unknown>;
    const val = biz[field];
    return Array.isArray(val) ? (val as string[]) : [];
  };
  const setEmails = (bizKey: string, field: string, emails: string[]) => {
    const biz = { ...((data[bizKey] ?? {}) as Record<string, unknown>), [field]: emails };
    onChange({ ...data, [bizKey]: biz });
  };

  // destination_rules 编辑器辅助（仅 SEA SHA/NGB）
  const hasDestRules = mode === 'SEA' && (branch === 'SHA' || branch === 'NGB');
  const coreData = (data['core'] ?? {}) as Record<string, unknown>;
  const destRules: Array<Record<string, unknown>> = hasDestRules && Array.isArray(coreData['destination_rules'])
    ? (coreData['destination_rules'] as Array<Record<string, unknown>>)
    : [];

  const setDestRules = (rules: Array<Record<string, unknown>>) => {
    const biz = { ...coreData, destination_rules: rules };
    onChange({ ...data, core: biz });
  };

  const updateRule = (idx: number, rule: Record<string, unknown>) => {
    const next = destRules.map((r, i) => i === idx ? rule : r);
    setDestRules(next);
  };

  const coreToCount = getEmails('core', 'to').length;
  const nonCoreToCount = getEmails('non_core', 'to').length;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700"
      >
        <span className="flex items-center gap-2">
          <span className="font-mono text-indigo-600">{branch}</span>
          <span className="text-xs text-gray-400 font-normal">Core TO:{coreToCount} · NonCore TO:{nonCoreToCount}</span>
          {hasDestRules && destRules.length > 0 && (
            <span className="text-xs text-purple-500 font-normal">· {destRules.length} 国家规则</span>
          )}
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className="p-4 space-y-4 border-t border-gray-100">
          {/* 通用 Core / Non-Core TO/CC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">Core（核心国家）</div>
              {hasDestRules && (
                <p className="text-xs text-gray-400">⚠️ SHA/NGB 默认 Core TO 为空是合法配置，国家命中走下方「国家级路由规则」，未命中时回退到 Managers。</p>
              )}
              <EmailListEditor label="TO" emails={getEmails('core','to')} onChange={e => setEmails('core','to',e)} />
              <EmailListEditor label="CC" emails={getEmails('core','cc')} onChange={e => setEmails('core','cc',e)} />
            </div>
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">Non-Core（非核心国家）</div>
              <EmailListEditor label="TO" emails={getEmails('non_core','to')} onChange={e => setEmails('non_core','to',e)} />
              <EmailListEditor label="CC" emails={getEmails('non_core','cc')} onChange={e => setEmails('non_core','cc',e)} />
            </div>
          </div>

          {/* destination_rules 国家级路由（仅 SHA/NGB SEA core） */}
          {hasDestRules && (
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                🗺 国家级 To PIC 规则（Core destination_rules）
              </div>
              {destRules.length === 0 && (
                <p className="text-xs text-gray-400 italic">暂无国家级规则</p>
              )}
              {destRules.map((rule, idx) => {
                const countries = Array.isArray(rule['countries']) ? (rule['countries'] as string[]) : [];
                const hasFclLcl = 'to_fcl' in rule || 'to_lcl' in rule;
                const toList    = Array.isArray(rule['to'])     ? (rule['to']     as string[]) : [];
                const toFclList = Array.isArray(rule['to_fcl']) ? (rule['to_fcl'] as string[]) : [];
                const toLclList = Array.isArray(rule['to_lcl']) ? (rule['to_lcl'] as string[]) : [];
                return (
                  <div key={idx} className="border border-purple-100 rounded-lg p-3 space-y-3 bg-purple-50/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-600">
                        规则 #{idx + 1} — {countries.join(', ') || '(无国家)'}
                      </span>
                    </div>

                    {/* Countries */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Countries</label>
                      <div className="flex flex-wrap gap-1">
                        {countries.map((c, ci) => (
                          <span key={ci} className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            {c}
                            <button
                              onClick={() => updateRule(idx, { ...rule, countries: countries.filter((_, i) => i !== ci) })}
                              className="text-purple-300 hover:text-purple-700"><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                      <AddInlineItem
                        placeholder="添加国家（如 France）"
                        onAdd={c => updateRule(idx, { ...rule, countries: [...countries, c] })}
                        accentClass="focus:ring-purple-300"
                      />
                    </div>

                    {/* TO / TO_FCL / TO_LCL */}
                    {hasFclLcl ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <EmailListEditor
                          label="TO (FCL)"
                          emails={toFclList}
                          onChange={e => updateRule(idx, { ...rule, to_fcl: e })}
                        />
                        <EmailListEditor
                          label="TO (LCL)"
                          emails={toLclList}
                          onChange={e => updateRule(idx, { ...rule, to_lcl: e })}
                        />
                      </div>
                    ) : (
                      <EmailListEditor
                        label="TO"
                        emails={toList}
                        onChange={e => updateRule(idx, { ...rule, to: e })}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-gray-400">⚠️ 修改后需点击"保存配置"才生效</p>
        </div>
      )}
    </div>
  );
};

// Core Countries 编辑器
const CoreCountriesEditor: React.FC<{
  countries: string[];
  onChange: (c: string[]) => void;
}> = ({ countries, onChange }) => {
  const [newCountry, setNewCountry] = useState('');
  const add = () => {
    const c = newCountry.trim();
    if (c && !countries.includes(c)) { onChange([...countries, c].sort()); setNewCountry(''); }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {countries.map((c, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded text-xs">
            {c}
            <button onClick={() => onChange(countries.filter((_, idx) => idx !== i))} className="text-green-300 hover:text-green-700"><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={newCountry}
          onChange={e => setNewCountry(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="添加国家（如 France）"
          className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-300"
        />
        <button onClick={add} disabled={!newCountry.trim()} className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-40">
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
};

// 主路由配置编辑器
const RoutingEditor: React.FC = () => {
  const [routing, setRouting] = useState<Record<string, unknown> | null>(null);
  const [edited, setEdited] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [activeMode, setActiveMode] = useState<'SEA' | 'AIR' | 'RAIL'>('SEA');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await monitorPyApi.getRouting();
      setRouting(r);
      setEdited(JSON.parse(JSON.stringify(r)));
    } catch (e: unknown) {
      setSaveMsg({ type: 'err', text: `加载失败: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!edited) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await monitorPyApi.saveRouting(edited);
      setSaveMsg({ type: 'ok', text: '✅ 配置已保存，路由器已热重载' });
      setRouting(JSON.parse(JSON.stringify(edited)));
    } catch (e: unknown) {
      setSaveMsg({ type: 'err', text: `保存失败: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setSaving(false);
    }
  };

  const resetEdits = () => {
    if (routing) { setEdited(JSON.parse(JSON.stringify(routing))); setSaveMsg(null); }
  };

  const isDirty = JSON.stringify(edited) !== JSON.stringify(routing);

  if (loading) return <div className="text-sm text-gray-400 py-8 text-center">加载路由配置...</div>;
  if (!edited) return <div className="text-sm text-yellow-700 bg-yellow-50 rounded px-4 py-3">⚠️ 路由配置加载失败，请确认 Python 监控服务是否运行</div>;

  const coreCountries = (edited.core_countries ?? []) as string[];
  const managers = (edited.managers ?? {}) as Record<string, string[]>;
  const modeData = (edited[activeMode] ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700">📌 PIC 路由规则编辑</div>
        <div className="flex gap-2">
          {isDirty && (
            <button onClick={resetEdits} className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded hover:bg-gray-50">
              撤销修改
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition-all ${
              isDirty ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save size={12} />
            {saving ? '保存中...' : isDirty ? '💾 保存配置' : '已是最新'}
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
          <AlertTriangle size={13} />
          有未保存的修改，保存后路由器立即热重载
        </div>
      )}

      {saveMsg && (
        <div className={`text-xs rounded px-3 py-2 ${saveMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {saveMsg.text}
        </div>
      )}

      {/* Core Countries */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">🌍 Core Countries（{coreCountries.length} 个）</span>
          <span className="text-xs text-gray-400">影响所有运输方式的 core/non_core 路由判断</span>
        </div>
        <CoreCountriesEditor
          countries={coreCountries}
          onChange={c => setEdited(prev => ({ ...prev!, core_countries: c }))}
        />
      </div>

      {/* Managers */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <span className="text-sm font-semibold text-gray-700">👤 Managers（主管邮箱）</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['SEA', 'AIR', 'RAIL'] as const).map(m => (
            <EmailListEditor
              key={m}
              label={m}
              emails={managers[m] ?? []}
              onChange={emails => setEdited(prev => ({
                ...prev!,
                managers: { ...(prev!.managers as Record<string, string[]>), [m]: emails }
              }))}
            />
          ))}
        </div>
      </div>

      {/* Branch PIC 编辑 */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">📤 Branch PIC 路由</span>
          <div className="flex gap-1">
            {(['SEA', 'AIR', 'RAIL'] as const).map(m => (
              <button key={m} onClick={() => setActiveMode(m)}
                className={`px-3 py-1 text-xs rounded font-medium border transition-all ${
                  activeMode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}>{m}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(modeData).map(([branch, branchData]) => (
            <BranchEditor
              key={branch}
              mode={activeMode}
              branch={branch}
              data={branchData as Record<string, unknown>}
              onChange={data => setEdited(prev => ({
                ...prev!,
                [activeMode]: { ...(prev![activeMode] as Record<string, unknown>), [branch]: data }
              }))}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        ⚠️ 路由配置可修改 TO/CC、Core Countries、Managers 和 SHA/NGB 的国家级 destination_rules。special_rules 仍需直接编辑 <code>data/pic_routing.json</code> 文件。
      </p>
    </div>
  );
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────

type ConfigTab = 'api' | 'rules' | 'routing';

const CONFIG_TABS: { id: ConfigTab; label: string }[] = [
  { id: 'routing', label: '📌 路由配置' },
  { id: 'api',     label: '🔌 API 连接' },
  { id: 'rules',   label: '📋 跳过规则' },
];

const ConfigViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('routing');
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cfg = await monitorPyApi.getConfig();
      setConfig(cfg);
    } catch (e: unknown) {
      setError('无法加载配置（Python 监控服务未运行？）');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* 子 Tab */}
      <div className="flex gap-1 border-b border-gray-200">
        {CONFIG_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === t.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center pr-1">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-4 py-3">⚠️ {error}</div>
      )}

      {/* 路由配置 Tab（独立加载） */}
      {activeTab === 'routing' && <RoutingEditor />}

      {/* API 连接 Tab */}
      {activeTab === 'api' && (
        loading && !config
          ? <div className="text-sm text-gray-400 py-8 text-center">加载中...</div>
          : config ? <ApiConnectionPanel config={config} /> : null
      )}

      {/* 跳过规则 Tab */}
      {activeTab === 'rules' && <SkipRulesEditor />}
    </div>
  );
};

export default ConfigViewer;
