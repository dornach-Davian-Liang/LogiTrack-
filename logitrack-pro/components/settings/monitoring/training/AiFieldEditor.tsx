/**
 * AiFieldEditor — AI 分析字段编辑器
 *
 * 展示当前 AI 分析 JSON 的关键字段，允许用户修改。
 * 支持下拉选择（branch、transport_mode、pod_country）和开关（布尔值）。
 */
import React, { useEffect, useState } from 'react';
import { monitorPyApi } from '../../../../services/monitorApi';

// ─── AI 可编辑字段定义 ────────────────────────────────────────────────────────

export interface AiFields {
  email_type?: string;
  is_inquiry?: boolean;
  transport_mode?: string;
  branch_code?: string;
  origin_city?: string;
  pol?: string;
  pod?: string;
  pod_country?: string;
  pol_country?: string;
  multiple_origins?: boolean;
  is_lcl?: boolean;
  is_dangerous_goods?: boolean;
  no_specific_cargo?: boolean;
  risk_level?: string;
  sender_ziegler_office?: string;
  [key: string]: unknown;
}

const EMAIL_TYPES = ['INQUIRY', 'BOOKING', 'FOLLOW_UP', 'QUOTE_REPLY', 'INFO', 'OTHER'];
const TRANSPORT_MODES = ['SEA', 'AIR', 'RAIL', 'SEA+AIR'];
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];

interface Props {
  initial: AiFields;
  onChange: (fields: AiFields) => void;
}

const AiFieldEditor: React.FC<Props> = ({ initial, onChange }) => {
  const [fields, setFields] = useState<AiFields>({ ...initial });
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    monitorPyApi.getPicOptions()
      .then(r => setBranches(r.branches))
      .catch(() => {});
  }, []);

  const set = (key: keyof AiFields, val: unknown) => {
    const next = { ...fields, [key]: val };
    setFields(next);
    onChange(next);
  };

  const selectCls = 'border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white w-full';
  const inputCls = 'border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white w-full';

  return (
    <div className="space-y-4">
      {/* 第一组：邮件分类 */}
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">📧 邮件分类</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">邮件类型 (email_type)</label>
            <select className={selectCls} value={fields.email_type ?? ''} onChange={e => set('email_type', e.target.value)}>
              <option value="">—</option>
              {EMAIL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">是否询价 (is_inquiry)</label>
            <select className={selectCls} value={String(fields.is_inquiry ?? '')} onChange={e => set('is_inquiry', e.target.value === 'true')}>
              <option value="">—</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
        </div>
      </div>

      {/* 第二组：运输信息 */}
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">🚢 运输信息</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">运输方式 (transport_mode)</label>
            <select className={selectCls} value={fields.transport_mode ?? ''} onChange={e => set('transport_mode', e.target.value)}>
              <option value="">—</option>
              {TRANSPORT_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">分支 (branch_code)</label>
            <select className={selectCls} value={fields.branch_code ?? ''} onChange={e => set('branch_code', e.target.value)}>
              <option value="">—</option>
              {branches.map(b => <option key={b}>{b}</option>)}
              {/* 常用候补 */}
              {['SHA', 'SZX', 'NGB', 'TSN', 'TAO', 'HKG', 'CAN', 'XIY', 'CDG']
                .filter(b => !branches.includes(b))
                .map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">起运港 (pol)</label>
            <input className={inputCls} value={fields.pol ?? ''} onChange={e => set('pol', e.target.value)} placeholder="如 Shanghai" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">目的港 (pod)</label>
            <input className={inputCls} value={fields.pod ?? ''} onChange={e => set('pod', e.target.value)} placeholder="如 Rotterdam" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">起运地城市 (origin_city)</label>
            <input className={inputCls} value={fields.origin_city ?? ''} onChange={e => set('origin_city', e.target.value)} placeholder="如 Shanghai, Qingdao" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">POD 国家 (pod_country)</label>
            <input className={inputCls} value={fields.pod_country ?? ''} onChange={e => set('pod_country', e.target.value)} placeholder="如 Morocco" />
          </div>
        </div>
      </div>

      {/* 第三组：布尔标记 */}
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">🏷️ 货物标记</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { key: 'multiple_origins', label: '多起运地' },
            { key: 'is_lcl',           label: 'LCL 散货' },
            { key: 'is_dangerous_goods', label: '危险品 DG' },
            { key: 'no_specific_cargo',  label: '无具体货量' },
          ] as { key: keyof AiFields; label: string }[]).map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{label}</label>
              <select className={selectCls} value={String(fields[key] ?? '')} onChange={e => set(key, e.target.value === 'true')}>
                <option value="">—</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* 第四组：风险 */}
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">⚠️ 风险</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">风险级别 (risk_level)</label>
            <select className={selectCls} value={fields.risk_level ?? ''} onChange={e => set('risk_level', e.target.value)}>
              <option value="">—</option>
              {RISK_LEVELS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">发件人 Ziegler 办公室</label>
            <input className={inputCls} value={fields.sender_ziegler_office ?? ''} onChange={e => set('sender_ziegler_office', e.target.value)} placeholder="如 Germany" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiFieldEditor;
