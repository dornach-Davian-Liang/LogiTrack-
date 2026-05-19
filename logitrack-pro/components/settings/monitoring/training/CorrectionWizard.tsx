/**
 * CorrectionWizard — 引导式路由纠错弹窗（3 步流程）
 *
 * Step 0：展示当前 AI 分析 + 路由结果，询问是否需要修正
 * Step 1：定位问题层级（AI 分析有误 / 路由规则有误 / 不确定）
 * Step 2A：AI 分析字段纠错 → 保存为训练案例
 * Step 2B：路由规则纠错 → PIC 邮箱下拉 + PUT /pyapi/routing 保存
 */
import React, { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Save, AlertTriangle, CheckCircle, Loader, Plus, Minus } from 'lucide-react';
import { monitorPyApi, ProcessingLogDTO } from '../../../../services/monitorApi';
import AiFieldEditor, { AiFields } from './AiFieldEditor';

interface Props {
  log: ProcessingLogDTO;
  onClose: () => void;
  onSaved?: () => void;
}

type Step = 'review' | 'locate' | 'ai-fix' | 'routing-fix';
type IssueType = 'ai' | 'routing' | 'unsure';

// ─── 路由结果展示 ──────────────────────────────────────────────────────────────

const RoutingPreview: React.FC<{ routing: unknown; loading?: boolean; label?: string }> = ({
  routing, loading, label = '路由预览',
}) => {
  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
      <Loader size={12} className="animate-spin" /> 计算路由...
    </div>
  );
  if (!routing) return null;

  const r = routing as Record<string, unknown>;
  const instructions: unknown[] = (r.instructions ?? r.routing_result ?? []) as unknown[];

  return (
    <div className="text-xs">
      <div className="font-medium text-gray-500 mb-1.5">{label}</div>
      {instructions.length === 0 ? (
        <div className="text-gray-400 italic">（无路由指令）</div>
      ) : (
        <div className="space-y-1.5">
          {instructions.map((ins, i) => {
            const obj = ins as Record<string, unknown>;
            return (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded px-3 py-2 space-y-1">
                {obj.branch && (
                  <div><span className="text-gray-400">Branch: </span><span className="font-medium">{String(obj.branch)}</span></div>
                )}
                {obj.rule_triggered && (
                  <div><span className="text-gray-400">规则: </span>{String(obj.rule_triggered)}</div>
                )}
                {obj.to && (
                  <div><span className="text-gray-400">TO: </span>
                    <span className="text-blue-700">{Array.isArray(obj.to) ? (obj.to as string[]).join(', ') : String(obj.to)}</span>
                  </div>
                )}
                {obj.cc && (
                  <div><span className="text-gray-400">CC: </span>
                    <span className="text-blue-600">{Array.isArray(obj.cc) ? (obj.cc as string[]).join(', ') : String(obj.cc)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── PIC 邮箱多选编辑器 ───────────────────────────────────────────────────────

const PicEmailEditor: React.FC<{
  label: string;
  emails: string[];
  options: string[];
  onChange: (emails: string[]) => void;
}> = ({ label, emails, options, onChange }) => {
  const [inputVal, setInputVal] = useState('');
  const unusedOptions = options.filter(o => !emails.includes(o));

  const add = (email: string) => {
    const e = email.trim().toLowerCase();
    if (e && !emails.includes(e)) onChange([...emails, e]);
    setInputVal('');
  };
  const remove = (email: string) => onChange(emails.filter(e => e !== email));

  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {emails.map(e => (
          <span key={e} className="flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
            {e}
            <button type="button" onClick={() => remove(e)} className="text-indigo-400 hover:text-indigo-700 ml-0.5">
              <Minus size={10} />
            </button>
          </span>
        ))}
        {emails.length === 0 && <span className="text-xs text-gray-400 italic">（未设置）</span>}
      </div>
      {unusedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {unusedOptions.map(o => (
            <button key={o} type="button" onClick={() => add(o)}
              className="flex items-center gap-0.5 text-xs text-gray-600 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 px-2 py-0.5 rounded-full border border-gray-200 transition-colors">
              <Plus size={10} /> {o}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-1">
        <input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(inputVal); } }}
          placeholder="手动输入邮箱 + Enter"
          className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <button type="button" onClick={() => add(inputVal)}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600">
          添加
        </button>
      </div>
    </div>
  );
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────

const CorrectionWizard: React.FC<Props> = ({ log, onClose, onSaved }) => {
  const [step, setStep] = useState<Step>('review');
  const [issueType, setIssueType] = useState<IssueType | null>(null);

  // AI 字段编辑
  const originalAi: AiFields = log.aiAnalysisJson ? JSON.parse(log.aiAnalysisJson) : {};
  const [editedFields, setEditedFields] = useState<AiFields>({ ...originalAi });
  const [correctionNote, setCorrectionNote] = useState('');

  // 路由预览
  const [simulatedRouting, setSimulatedRouting] = useState<unknown>(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  // AI 字段保存状态
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 路由规则纠错
  const [picOptions, setPicOptions] = useState<string[]>([]);
  const [routingTo, setRoutingTo] = useState<string[]>([]);
  const [routingCc, setRoutingCc] = useState<string[]>([]);
  const [routingNote, setRoutingNote] = useState('');
  const [routingSaving, setRoutingSaving] = useState(false);
  const [routingSavedOk, setRoutingSavedOk] = useState(false);
  const [routingSaveError, setRoutingSaveError] = useState<string | null>(null);

  // 加载 PIC 选项（进入 routing-fix 时）
  useEffect(() => {
    if (step === 'routing-fix' && picOptions.length === 0) {
      monitorPyApi.getPicOptions()
        .then(r => setPicOptions(r.emails))
        .catch(() => {});
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // 进入路由纠错时预填当前路由结果
  useEffect(() => {
    if (step === 'routing-fix' && originalRouting) {
      const insts = (originalRouting as { instructions?: { to?: string[]; cc?: string[] }[] }).instructions ?? [];
      if (insts.length > 0) {
        setRoutingTo(insts[0].to ?? []);
        setRoutingCc(insts[0].cc ?? []);
      }
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // 原始路由结果
  const originalRouting = log.routingJson ? JSON.parse(log.routingJson) : null;

  // ── 模拟路由 ──────────────────────────────────────────────────────────────
  const simulate = useCallback(async (fields: AiFields) => {
    setSimulating(true);
    setSimError(null);
    try {
      const res = await monitorPyApi.simulateRouting(fields as Record<string, unknown>);
      setSimulatedRouting(res.routing);
    } catch (e: unknown) {
      setSimError(e instanceof Error ? e.message : String(e));
      setSimulatedRouting(null);
    } finally {
      setSimulating(false);
    }
  }, []);

  const handleFieldChange = (fields: AiFields) => {
    setEditedFields(fields);
    // 自动触发路由预览（防抖简化为每次变更触发）
    simulate(fields);
  };

  // ── 构建训练案例 markdown_text ────────────────────────────────────────────
  const buildMarkdownText = () => {
    const subject = log.subject ?? '(无主题)';
    const sender = log.senderEmail ?? '(未知)';
    const outputJson = JSON.stringify(editedFields, null, 2);
    return [
      `### 训练案例: ${subject.substring(0, 60)}`,
      ``,
      `邮件内容：`,
      '```',
      `Subject: ${subject}`,
      `From: ${sender}`,
      '```',
      ``,
      `正确输出：`,
      '```json',
      outputJson,
      '```',
    ].join('\n');
  };

  // ── 保存训练案例 ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!correctionNote.trim()) {
      alert('请填写纠正说明后再保存');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await monitorPyApi.createTrainingCase({
        title: `纠正: ${(log.subject ?? '无主题').substring(0, 60)}`,
        markdown_text: buildMarkdownText(),
        correction_note: correctionNote,
        status: 'active',
      });
      setSavedOk(true);
      onSaved?.();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 className="font-semibold text-gray-900">🔧 路由纠错</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 邮件信息 */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 shrink-0">
          <div className="text-sm font-medium text-gray-800 truncate">📧 {log.subject ?? '(无主题)'}</div>
          <div className="text-xs text-gray-500 mt-0.5">{log.senderEmail}</div>
        </div>

        {/* 主体内容（可滚动） */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── Step 0: 审阅当前结果 ─────────────────────────────────────── */}
          {step === 'review' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* AI 分析摘要 */}
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-2">🤖 AI 分析结果</div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs space-y-1.5">
                    {[
                      ['类型', originalAi.email_type],
                      ['运输', originalAi.transport_mode],
                      ['Branch', originalAi.branch_code],
                      ['POL', originalAi.pol],
                      ['POD', originalAi.pod],
                      ['POD国家', originalAi.pod_country],
                      ['多起运', String(originalAi.multiple_origins ?? '—')],
                      ['DG', String(originalAi.is_dangerous_goods ?? '—')],
                      ['LCL', String(originalAi.is_lcl ?? '—')],
                      ['风险', `${originalAi.risk_level ?? '—'} (${originalAi.risk_score ?? 0})`],
                      ['置信度', originalAi.confidence],
                    ].map(([k, v]) => v != null && v !== undefined && (
                      <div key={String(k)} className="flex gap-2">
                        <span className="text-gray-400 w-16 shrink-0">{String(k)}</span>
                        <span className="text-gray-800 font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 路由结果 */}
                <div>
                  <RoutingPreview routing={originalRouting} label="📤 路由结果" />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="text-sm font-medium text-gray-700 mb-3">❓ 路由结果是否正确？</div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    <CheckCircle size={15} /> ✅ 正确，关闭
                  </button>
                  <button
                    onClick={() => setStep('locate')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    ❌ 需要修正 <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Step 1: 定位问题 ─────────────────────────────────────────── */}
          {step === 'locate' && (
            <>
              <div className="text-sm font-medium text-gray-700">❓ 问题出在哪里？</div>
              <div className="space-y-2">
                {([
                  {
                    type: 'ai' as IssueType,
                    title: '🤖 AI 分析有误',
                    desc: 'Branch、运输方式、POD 国家等字段识别错误\n→ 将生成 Few-shot 训练案例，优化 AI 下次分析',
                  },
                  {
                    type: 'routing' as IssueType,
                    title: '📋 路由规则有误',
                    desc: 'AI 分析正确，但收件人分配不对\n→ 将修改 pic_routing.json 路由配置',
                  },
                  {
                    type: 'unsure' as IssueType,
                    title: '🤔 不确定',
                    desc: '→ 打开 AI 字段编辑器，逐步调试路由结果',
                  },
                ]).map(({ type, title, desc }) => (
                  <button
                    key={type}
                    onClick={() => setIssueType(type)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      issueType === type
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800">{title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Step 2A: AI 字段纠错 ────────────────────────────────────── */}
          {step === 'ai-fix' && (
            <>
              {savedOk ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckCircle size={40} className="text-green-500" />
                  <div className="text-lg font-semibold text-gray-800">训练案例已保存！</div>
                  <div className="text-sm text-gray-500">下一轮邮件处理时将自动加载此案例。</div>
                  <button onClick={onClose} className="mt-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                    关闭
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    💡 仅修改需要纠正的字段，其余保持原值。修改后自动预览路由结果。
                  </div>

                  <AiFieldEditor initial={editedFields} onChange={handleFieldChange} />

                  {/* 路由预览 */}
                  <div className="border-t border-gray-200 pt-3">
                    <RoutingPreview routing={simulatedRouting} loading={simulating} label="🔍 修正后路由预览" />
                    {simError && (
                      <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertTriangle size={11} /> {simError}
                      </div>
                    )}
                  </div>

                  {/* 纠正说明 */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      📝 纠正说明 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={correctionNote}
                      onChange={e => setCorrectionNote(e.target.value)}
                      placeholder="请说明为什么这次 AI 分析出错，正确的判断依据是什么..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                    />
                  </div>

                  {saveError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> {saveError}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Step 2B: 路由规则纠错（PIC 邮箱下拉编辑器） ──────────── */}
          {step === 'routing-fix' && (
            <div className="space-y-4">
              {routingSavedOk ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckCircle size={40} className="text-green-500" />
                  <div className="text-lg font-semibold text-gray-800">路由配置已更新！</div>
                  <div className="text-sm text-gray-500">pic_routing.json 已保存，路由器已热重载，立即生效。</div>
                  <button onClick={onClose} className="mt-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                    关闭
                  </button>
                </div>
              ) : (
                <>
                  {/* 当前路由上下文 */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs space-y-1">
                    <div className="font-medium text-blue-700 mb-1">📋 当前路由上下文</div>
                    <div className="grid grid-cols-3 gap-2 text-gray-600">
                      <div><span className="text-gray-400">Branch: </span><span className="font-medium">{originalAi.branch_code ?? '—'}</span></div>
                      <div><span className="text-gray-400">Mode: </span><span className="font-medium">{originalAi.transport_mode ?? '—'}</span></div>
                      <div><span className="text-gray-400">POD: </span><span className="font-medium">{originalAi.pod_country ?? '—'}</span></div>
                    </div>
                  </div>

                  {/* TO 编辑 */}
                  <PicEmailEditor
                    label="TO 收件人"
                    emails={routingTo}
                    options={picOptions}
                    onChange={setRoutingTo}
                  />

                  {/* CC 编辑 */}
                  <PicEmailEditor
                    label="CC 抄送"
                    emails={routingCc}
                    options={picOptions}
                    onChange={setRoutingCc}
                  />

                  {/* 说明 */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      📝 修正说明 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={routingNote}
                      onChange={e => setRoutingNote(e.target.value)}
                      placeholder="说明为什么当前路由不对，例如：Chile 应由 SHA+NGB 共同处理..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                    />
                  </div>

                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    ⚠️ 此操作将更新 <code className="bg-amber-100 px-0.5 rounded">pic_routing.json</code> 中 {originalAi.branch_code ?? 'unknown'}-{originalAi.transport_mode} 的收件人配置，并自动热重载路由器。
                  </div>

                  {routingSaveError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                      保存失败: {routingSaveError}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>

        {/* 底部按钮 */}
        {!savedOk && !routingSavedOk && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-200 bg-gray-50 shrink-0">
            {/* 返回 */}
            {step !== 'review' ? (
              <button
                onClick={() => {
                  if (step === 'locate') setStep('review');
                  else setStep('locate');
                }}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft size={15} /> 返回
              </button>
            ) : (
              <div />
            )}

            {/* 下一步 / 保存 */}
            {step === 'locate' && (
              <button
                disabled={!issueType}
                onClick={() => {
                  if (issueType === 'ai' || issueType === 'unsure') {
                    simulate(editedFields);
                    setStep('ai-fix');
                  } else {
                    setStep('routing-fix');
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一步 <ChevronRight size={15} />
              </button>
            )}

            {step === 'ai-fix' && (
              <button
                disabled={saving || !correctionNote.trim()}
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? '保存中...' : '💾 保存为训练案例'}
              </button>
            )}

            {step === 'routing-fix' && (
              <button
                disabled={routingSaving || (!routingTo.length && !routingCc.length) || !routingNote.trim()}
                onClick={async () => {
                  if (!routingNote.trim()) { alert('请填写修正说明'); return; }
                  setRoutingSaving(true);
                  setRoutingSaveError(null);
                  try {
                    const branch = originalAi.branch_code ?? '';
                    const mode = (originalAi.transport_mode ?? 'SEA').toUpperCase();

                    // 更新 non_core（默认，因为 core 通常是特定国家）
                    const payload: Record<string, unknown> = {
                      [mode]: {
                        [branch]: {
                          non_core: { to: routingTo, cc: routingCc }
                        }
                      }
                    };
                    await fetch('/pyapi/routing', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    }).then(async r => { if (!r.ok) throw new Error(await r.text()); });
                    setRoutingSavedOk(true);
                    onSaved?.();
                  } catch (e: unknown) {
                    setRoutingSaveError(e instanceof Error ? e.message : String(e));
                  } finally {
                    setRoutingSaving(false);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {routingSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                {routingSaving ? '保存中...' : '💾 保存路由配置'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrectionWizard;
