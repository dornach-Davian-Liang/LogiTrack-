import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { ProcessingLogDTO } from '../../../../services/monitorApi';
import AiAnalysisCard from './AiAnalysisCard';
import RoutingCard from './RoutingCard';
import CorrectionWizard from '../training/CorrectionWizard';

interface Props {
  log: ProcessingLogDTO;
  onClose?: () => void;
  /** 内嵌展开模式（table row 下展开）或独立卡片模式 */
  inline?: boolean;
}

function fmt(dt: string | null) {
  if (!dt) return '—';
  return dt.replace('T', ' ').substring(0, 19);
}

// ─── DRY-RUN Payload 展示 ────────────────────────────────────────────────────

interface DryRunPayloadProps {
  payload: Record<string, unknown>;
}

const FIELD_LABELS: Record<string, string> = {
  salesPic:          'Sales PIC',
  salesCountry:      'Sales Country',
  salesOffice:       'Sales Office',
  assignedCnOffice:  'Assigned CN Office',
  senderEmail:       'Sender Email',
  cargoTypeCode:     'Cargo Type',
  productCode:       'Product (FCL/LCL/AIR)',
  commodity:         '品名 (Commodity)',
  pols:              'POL(s)',
  pods:              'POD(s)',
  volumeCbm:         'Volume (CBM)',
  quantity:          'Quantity',
  uom:               'UOM',
  enquiryReceivedDate:    '询价接收日期',
  enquiryCreatedDate:     '询价创建时间',
  status:            '状态',
  polCountry:        'POL Country',
  podCountry:        'POD Country',
  coreNonCore:       'Core/Non-Core',
  missing_fields:    '缺失字段',
};

const DryRunPayloadPanel: React.FC<DryRunPayloadProps> = ({ payload }) => {
  const [showRaw, setShowRaw] = useState(false);

  const importantKeys = [
    'assignedCnOffice', 'salesPic', 'salesOffice', 'salesCountry',
    'cargoTypeCode', 'productCode', 'commodity',
    'pols', 'pods', 'polCountry', 'podCountry', 'coreNonCore',
    'volumeCbm', 'quantity', 'uom',
    'senderEmail', 'enquiryReceivedDate', 'status', 'missing_fields',
  ];

  const displayFields = importantKeys
    .filter(k => {
      const v = payload[k];
      if (k === 'missing_fields') return Array.isArray(v) && v.length > 0;
      return v != null && v !== '' && v !== null;
    })
    .map(k => ({ key: k, label: FIELD_LABELS[k] ?? k, value: payload[k] }));

  const otherFields = Object.entries(payload)
    .filter(([k]) => !importantKeys.includes(k) && k !== 'hasSpecificCargoReadyDate')
    .filter(([, v]) => v != null && v !== '');

  return (
    <div className="mt-2 space-y-2">
      {/* 关键字段网格 */}
      {displayFields.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
          {displayFields.map(({ key, label, value }) => (
            <div key={key} className={`flex flex-col gap-0.5 ${key === 'missing_fields' ? 'col-span-2 sm:col-span-3' : ''}`}>
              <span className="text-gray-400">{label}</span>
              <span className={`font-medium break-all ${key === 'missing_fields' ? 'text-amber-600' : 'text-gray-800'}`}>
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 其他字段（折叠） */}
      {otherFields.length > 0 && (
        <>
          <button
            onClick={() => setShowRaw(v => !v)}
            className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700"
          >
            {showRaw ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            {showRaw ? '收起完整 payload' : `展开完整 payload（另 ${otherFields.length} 个字段）`}
          </button>
          {showRaw && (
            <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-3 overflow-auto max-h-72 whitespace-pre-wrap">
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
};

// ─── 主组件 ──────────────────────────────────────────────────────────────────

const LogDetailPanel: React.FC<Props> = ({ log, onClose, inline = true }) => {
  // 解析 routingJson 获取 dry_run_payload
  let routingJson: Record<string, unknown> = {};
  try { if (log.routingJson) routingJson = JSON.parse(log.routingJson); } catch { /* ignore */ }
  const dryRunPayload = routingJson.dry_run_payload as Record<string, unknown> | undefined;

  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className={`bg-white ${inline ? 'border-x border-b border-indigo-100 rounded-b-lg' : 'rounded-lg border border-gray-200 shadow'}`}>
      <div className="p-4 space-y-3">
        {/* 邮件基本信息 */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm text-gray-800 truncate">
              📧 {log.subject || '(无主题)'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              发件人: {log.senderEmail || '—'}
              <span className="mx-2">·</span>
              处理时间: {fmt(log.processedAt)}
              {log.runMode && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">{log.runMode}</span>}
              {log.folderName && <span className="ml-2 text-gray-400">文件夹: {log.folderName}</span>}
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X size={16} />
            </button>
          )}
        </div>

        {/* AI 分析 */}
        {(log.isInquiry !== null || log.emailType || log.transportMode) && (
          <AiAnalysisCard log={log} />
        )}

        {/* 路由指令 */}
        <RoutingCard log={log} />

        {/* LogiTrack 建单 */}
        <div className="border border-purple-100 rounded-lg p-4 bg-purple-50/30">          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-700">🧾 LogiTrack 建单</span>
            {log.logitrackCreated
              ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">✅ 已建单</span>
              : dryRunPayload
                ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">🖨 DRY-RUN 提取信息</span>
                : log.skipReason
                  ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">⏭ 已跳过（不触发建单）</span>
                  : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">— 未建单</span>
            }
          </div>

          {log.logitrackCreated ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div><span className="text-xs text-gray-400">ID: </span>{log.logitrackId ?? '—'}</div>
              <div><span className="text-xs text-gray-400">Ref: </span><span className="font-mono text-purple-700">{log.logitrackRef ?? '—'}</span></div>
            </div>
          ) : log.logitrackRef ? (
            <div className="text-sm">
              <span className="text-xs text-gray-400">复用 Ref: </span>
              <span className="font-mono text-purple-700">{log.logitrackRef}</span>
              {log.logitrackError && <span className="ml-2 text-xs text-gray-400">({log.logitrackError})</span>}
            </div>
          ) : dryRunPayload ? (
            <DryRunPayloadPanel payload={dryRunPayload} />
          ) : log.logitrackError && !log.logitrackError.startsWith('[DRY-RUN]') ? (
            <div className="text-xs text-red-500 mt-1">{log.logitrackError}</div>
          ) : null}
        </div>

        {/* 纠错按钮 */}
        <div className="flex justify-end pt-1">
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
          >
            <Wrench size={12} /> 🔧 纠错
          </button>
        </div>
      </div>

      {/* 纠错向导弹窗 */}
      {showWizard && (
        <CorrectionWizard
          log={log}
          onClose={() => setShowWizard(false)}
          onSaved={() => setShowWizard(false)}
        />
      )}
    </div>
  );
};

export default LogDetailPanel;
