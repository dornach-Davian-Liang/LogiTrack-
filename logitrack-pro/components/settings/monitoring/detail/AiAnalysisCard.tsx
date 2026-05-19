import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ProcessingLogDTO } from '../../../../services/monitorApi';

interface Props {
  log: ProcessingLogDTO;
}

const TYPE_STYLE: Record<string, string> = {
  INQUIRY:   'bg-blue-100 text-blue-700',
  BOOKING:   'bg-orange-100 text-orange-700',
  FOLLOW_UP: 'bg-gray-100 text-gray-600',
  COMPLAINT: 'bg-red-100 text-red-700',
};

const RISK_STYLE: Record<string, string> = {
  LOW:    'text-green-600 font-semibold',
  MEDIUM: 'text-yellow-600 font-semibold',
  HIGH:   'text-red-600 font-semibold',
};

const Field: React.FC<{ label: string; children: React.ReactNode; span?: boolean }> = ({ label, children, span }) => (
  <div className={`flex flex-col gap-0.5 ${span ? 'sm:col-span-2' : ''}`}>
    <span className="text-xs text-gray-400">{label}</span>
    <span className="text-sm text-gray-700 break-words">{children}</span>
  </div>
);

function fmtContainers(containers: Record<string, number | null> | undefined): string {
  if (!containers) return '—';
  const parts = Object.entries(containers)
    .filter(([, v]) => v != null && v > 0)
    .map(([k, v]) => `${v}×${k}`);
  return parts.length ? parts.join(', ') : '—';
}

const AiAnalysisCard: React.FC<Props> = ({ log }) => {
  const [showExtended, setShowExtended] = useState(false);

  const conf = log.confidence != null ? (log.confidence * 100).toFixed(0) + '%' : '—';
  const typeStyle = log.emailType ? (TYPE_STYLE[log.emailType] ?? 'bg-gray-100 text-gray-600') : null;

  // 解析完整 AI JSON
  let ai: Record<string, unknown> = {};
  try { if (log.aiAnalysisJson) ai = JSON.parse(log.aiAnalysisJson); } catch { /* ignore */ }
  const cargo = (ai.cargo_info ?? {}) as Record<string, unknown>;

  // 货物摘要行
  const weightStr = cargo.gross_weight_kg != null ? `${cargo.gross_weight_kg} kg` : null;
  const volStr = cargo.volume_cbm != null ? `${cargo.volume_cbm} cbm` : null;
  const cargoSummaryParts = [weightStr, volStr].filter(Boolean);
  const containers = fmtContainers(cargo.containers as Record<string, number | null> | undefined);
  const isLcl = ai.is_lcl ? '是（LCL）' : ai.is_lcl === false ? '否（FCL）' : null;
  const isDg = ai.is_dangerous_goods === true ? '⚠️ 危险品' : null;
  const noSpecificCargo = ai.no_specific_cargo === true;
  const riskFlags = Array.isArray(ai.risk_flags) && ai.risk_flags.length > 0
    ? (ai.risk_flags as string[]).join(', ')
    : null;

  return (
    <div className="border border-indigo-100 rounded-lg p-4 bg-indigo-50/30">
      {/* 标题行 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-700">🤖 AI 分析</span>
        {log.emailType && typeStyle && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle}`}>{log.emailType}</span>
        )}
        {isDg && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{isDg}</span>}
        {noSpecificCargo && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">无具体货量</span>}
        {log.confidence != null && <span className="ml-auto text-xs text-gray-400">置信度 {conf}</span>}
      </div>

      {/* 核心字段（始终显示） */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mb-3">
        <Field label="运输方式">{log.transportMode || (ai.transport_mode as string) || '—'}</Field>
        <Field label="Branch">{log.branchCode || (ai.branch_code as string) || '—'}</Field>
        <Field label="风险等级">
          {log.riskLevel
            ? <span className={RISK_STYLE[log.riskLevel] ?? 'text-gray-600'}>
                {log.riskLevel}{log.riskScore != null ? ` (${log.riskScore})` : ''}
              </span>
            : '—'}
        </Field>
        <Field label="起运城市">{log.originCity || (ai.origin_city as string) || '—'}</Field>
        <Field label="目的地">{log.destination || (ai.destination as string) || '—'}</Field>
        <Field label="POL / POD">
          {[log.pol || (ai.pol as string), log.pod || (ai.pod as string)].filter(Boolean).join(' → ') || '—'}
        </Field>

        {/* 货物基础 */}
        {cargo.commodity != null && (
          <Field label="品名" span>{String(cargo.commodity)}</Field>
        )}
        {cargoSummaryParts.length > 0 && (
          <Field label="重量 / 体积">{cargoSummaryParts.join(' / ')}</Field>
        )}
        {containers !== '—' && (
          <Field label="箱型">{containers}</Field>
        )}
        {isLcl && <Field label="LCL / FCL">{isLcl}</Field>}
        {cargo.incoterm != null && (cargo.incoterm as string) && (
          <Field label="贸易条款">{String(cargo.incoterm)}</Field>
        )}
      </div>

      {/* 扩展字段（折叠） */}
      <button
        onClick={() => setShowExtended(v => !v)}
        className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mb-2"
      >
        {showExtended ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {showExtended ? '收起详情' : '展开更多字段'}
      </button>

      {showExtended && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 pt-2 border-t border-indigo-100">
          {/* §12.1 新增字段 */}
          {cargo.hs_code != null && (cargo.hs_code as string) && (
            <Field label="HS Code">{String(cargo.hs_code)}</Field>
          )}
          {cargo.cargo_ready_date_raw != null && (cargo.cargo_ready_date_raw as string) && (
            <Field label="货好日期">{String(cargo.cargo_ready_date_raw)}</Field>
          )}
          {cargo.cargo_dimensions != null && (cargo.cargo_dimensions as string) && (
            <Field label="货物尺寸" span>{String(cargo.cargo_dimensions)}</Field>
          )}
          {cargo.special_requirements != null && (cargo.special_requirements as string) && (
            <Field label="特殊要求" span>{String(cargo.special_requirements)}</Field>
          )}
          {(ai.quote_deadline as string | undefined) && (
            <Field label="报价截止日">{String(ai.quote_deadline)}</Field>
          )}
          {(ai.customer_reference as string | undefined) && (
            <Field label="客户单号">{String(ai.customer_reference)}</Field>
          )}

          {/* 其他 AI 输出 */}
          {(ai.pol_country as string | undefined) && (
            <Field label="POL 国家">{String(ai.pol_country)}</Field>
          )}
          {(ai.pod_country as string | undefined) && (
            <Field label="POD 国家">{String(ai.pod_country)}</Field>
          )}
          {riskFlags && (
            <Field label="风险标记" span>{riskFlags}</Field>
          )}
          {(ai.risk_summary as string | undefined) && (
            <Field label="风险说明" span>{String(ai.risk_summary)}</Field>
          )}
          {(ai.recommendation as string | undefined) && (
            <Field label="AI 建议" span>{String(ai.recommendation)}</Field>
          )}

          {/* 性能 */}
          <Field label="AI 耗时">
            {log.aiLatencyMs != null ? `${(log.aiLatencyMs / 1000).toFixed(1)}s` : '—'}
          </Field>
          <Field label="总耗时">
            {log.totalLatencyMs != null ? `${(log.totalLatencyMs / 1000).toFixed(1)}s` : '—'}
          </Field>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisCard;
