import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ProcessingLogDTO } from '../../../../services/monitorApi';

interface Props {
  log: ProcessingLogDTO;
}

const FORWARD_STYLE: Record<string, { cls: string; label: string }> = {
  DRY_RUN:        { cls: 'bg-gray-100 text-gray-500',   label: '🚫 DRY-RUN（未转发）' },
  NOT_FORWARDED:  { cls: 'bg-gray-100 text-gray-500',   label: '—  未转发' },
  TEST_FORWARDED: { cls: 'bg-yellow-100 text-yellow-700', label: '🧪 测试转发' },
  FORWARDED:      { cls: 'bg-green-100 text-green-700',  label: '✅ 已转发' },
  FAILED:         { cls: 'bg-red-100 text-red-600',      label: '❌ 转发失败' },
};

const RecipientList: React.FC<{ label: string; raw: string | null }> = ({ label, raw }) => {
  if (!raw) return <div className="text-xs text-gray-400">{label}: —</div>;
  let items: string[] = [];
  try { items = JSON.parse(raw); } catch { items = [raw]; }
  return (
    <div>
      <span className="text-xs text-gray-400">{label}: </span>
      <span className="text-sm text-gray-700 break-all">{items.join(', ') || '—'}</span>
    </div>
  );
};

// ─── routing_reason 展示 ────────────────────────────────────────────────────

interface RoutingReasonProps {
  reason: Record<string, unknown>;
}

const RULE_STYLE: Record<string, string> = {
  normal:       'bg-blue-50 text-blue-700 border-blue-200',
  R2:           'bg-purple-50 text-purple-700 border-purple-200',
  R3:           'bg-orange-50 text-orange-700 border-orange-200',
  R4:           'bg-red-50 text-red-700 border-red-200',
  'R4-HIGH':    'bg-red-50 text-red-700 border-red-200',
  R5:           'bg-yellow-50 text-yellow-700 border-yellow-200',
  R6:           'bg-teal-50 text-teal-700 border-teal-200',
};

const RoutingReasonPanel: React.FC<RoutingReasonProps> = ({ reason }) => {
  const rule = String(reason.rule_triggered ?? 'normal');
  const ruleStyle = RULE_STYLE[rule] ?? 'bg-gray-50 text-gray-600 border-gray-200';
  const isCore = reason.is_core;
  const coreLabel = isCore === true ? '✅ Core' : isCore === false ? '⚪ Non-Core' : null;
  const fallback = reason.fallback_used === true ? '⚠️ 使用了 fallback 路由' : null;
  const senderZiegler = reason.sender_is_ziegler === true ? '✅ Ziegler 代理' : reason.sender_is_ziegler === false ? '外部客户' : null;

  return (
    <div className="mt-3 p-3 bg-white rounded-lg border border-green-100 space-y-2">
      <div className="text-xs font-semibold text-gray-600 mb-1">🧭 路由决策说明</div>
      <div className="flex flex-wrap gap-2 items-center">
        {/* 规则 */}
        <span className={`px-2 py-0.5 rounded border text-xs font-mono font-semibold ${ruleStyle}`}>
          规则: {rule}
        </span>
        {/* Core/Non-Core */}
        {coreLabel && (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${isCore ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {coreLabel}
          </span>
        )}
        {/* 发件人类型 */}
        {senderZiegler && (
          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
            发件人: {senderZiegler}
          </span>
        )}
        {/* Fallback 警告 */}
        {fallback && (
          <span className="px-2 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
            {fallback}
          </span>
        )}
      </div>

      {/* 路由备注 */}
      {reason.rule_note && String(reason.rule_note).trim() && (
        <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5">
          {String(reason.rule_note)}
        </div>
      )}

      {/* 细节字段 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
        {reason.pol_country != null && (
          <div><span className="text-gray-400">POL 国家: </span><span className="text-gray-700">{String(reason.pol_country) || '—'}</span></div>
        )}
        {reason.destination_country != null && (
          <div><span className="text-gray-400">POD 国家: </span><span className="text-gray-700">{String(reason.destination_country) || '—'}</span></div>
        )}
        {reason.branch_resolved != null && (
          <div><span className="text-gray-400">Branch: </span><span className="text-gray-700 font-mono">{String(reason.branch_resolved)}</span></div>
        )}
        {reason.core_basis != null && reason.core_basis !== 'not_applicable' && (
          <div><span className="text-gray-400">Core 依据: </span><span className="text-gray-700">{String(reason.core_basis)}</span></div>
        )}
        {reason.destination_matched != null && (
          <div><span className="text-gray-400">目的地规则: </span><span className="text-gray-700">{reason.destination_matched ? '命中' : '未命中'}</span></div>
        )}
      </div>
    </div>
  );
};

const RoutingCard: React.FC<Props> = ({ log }) => {
  const fwd = log.forwardStatus ? (FORWARD_STYLE[log.forwardStatus] ?? null) : null;
  const [showReason, setShowReason] = useState(true);

  // 解析 routingJson
  let routingJson: Record<string, unknown> = {};
  try { if (log.routingJson) routingJson = JSON.parse(log.routingJson); } catch { /* ignore */ }
  const routingReason = routingJson.routing_reason as Record<string, unknown> | undefined;

  return (
    <div className="border border-green-100 rounded-lg p-4 bg-green-50/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-700">📤 路由指令</span>
        {fwd && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${fwd.cls}`}>
            {fwd.label}
          </span>
        )}
        {routingReason && (
          <button
            onClick={() => setShowReason(v => !v)}
            className="ml-auto flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
          >
            {showReason ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            路由决策说明
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        <RecipientList label="TO" raw={log.forwardTo} />
        <RecipientList label="CC" raw={log.forwardCc} />
      </div>
      {log.skipReason && (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-gray-400">
            跳过原因: <span className="text-gray-600 font-mono">{log.skipReason}</span>
          </div>
          {!routingReason && (
            <div className="text-xs text-gray-400 italic">
              💡 此邮件被跳过规则过滤，未执行路由决策，因此无路由诊断信息（routing_reason 仅对实际路由的询价邮件生成）
            </div>
          )}
        </div>
      )}
      {routingReason && showReason && <RoutingReasonPanel reason={routingReason} />}
    </div>
  );
};

export default RoutingCard;
