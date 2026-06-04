// ============================================================
// CargoContainerTable — Enquiry-level container information table
//
// 当 CargoType 为 FCL 或 BUYER-CONSOL 时显示
// 默认列: 20' | Weight per 20'(KG) | 40' | 40'HQ | 45'
// 动态列: 通过 "Add Container Type" 下拉添加 (20RF, 40OT 等)
// 单行数据, Line TEU 自动计算, Total TEU 汇总
// ============================================================

import React, { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { EnquiryContainerRow, ContainerTypeSelectOption } from '../../types';

// ── Default columns (always shown) ──────────────────────
const DEFAULT_COLS = [
  { code: '20GP', label: "20'", teu: 1.0 },
  { code: '40GP', label: "40'", teu: 2.0 },
  { code: '40HQ', label: "40'HQ", teu: 2.0 },
  { code: '45HQ', label: "45'", teu: 2.0 },
];

/** Check if a container code is a 20-foot type (show weight) */
function is20FootType(code: string): boolean {
  return code.startsWith('20');
}

const DEFAULT_CODES = DEFAULT_COLS.map(c => c.code);

/** Map field key for default columns */
function defaultFieldKey(code: string): { qtyKey: keyof EnquiryContainerRow; weightKey?: keyof EnquiryContainerRow } {
  switch (code) {
    case '20GP': return { qtyKey: 'qty20', weightKey: 'weight20' };
    case '40GP': return { qtyKey: 'qty40' };
    case '40HQ': return { qtyKey: 'qty40hq' };
    case '45HQ': return { qtyKey: 'qty45' };
    default: return { qtyKey: 'qty20' }; // fallback
  }
}

/** Short display label */
function sizeLabel(code: string): string {
  const map: Record<string, string> = {
    '20GP': "20'", '40GP': "40'", '40HQ': "40'HQ", '45HQ': "45'",
    '20RF': "20'RF", '40RF': "40'RF", '20OT': "20'OT", '40OT': "40'OT",
    '20FR': "20'FR", '40FR': "40'FR", '20TANK': "20'Tank", '40TANK': "40'Tank",
    '40HC': "40'HC",
  };
  return map[code] || code;
}

// ── Props ────────────────────────────────────────────────

interface CargoContainerTableProps {
  rows: EnquiryContainerRow[];
  onChange: (rows: EnquiryContainerRow[]) => void;
  containerTypes: ContainerTypeSelectOption[];
  disabled?: boolean;
  isOversizeCargo?: boolean;
  onOversizeCargoChange?: (value: boolean) => void;
}

// ── TEU Calculation ──────────────────────────────────────

function calcTotalTeu(row: EnquiryContainerRow, extraCodes: string[], teuMap: Record<string, number>): number {
  let teu = 0;
  // Default columns
  teu += (row.qty20 || 0) * 1.0;
  teu += (row.qty40 || 0) * 2.0;
  teu += (row.qty40hq || 0) * 2.0;
  teu += (row.qty45 || 0) * 2.0;
  // Extra dynamic columns
  const extras = row.extraContainers || {};
  for (const code of extraCodes) {
    teu += (extras[code] || 0) * (teuMap[code] || (code.startsWith('20') ? 1.0 : 2.0));
  }
  return teu;
}

// ── Component ────────────────────────────────────────────

export const CargoContainerTable: React.FC<CargoContainerTableProps> = ({
  rows,
  onChange,
  containerTypes,
  disabled = false,
  isOversizeCargo = false,
  onOversizeCargoChange,
}) => {
  // Single row — take first or create empty
  const row: EnquiryContainerRow = rows.length > 0 ? rows[0] : {
    qty20: 0, qty40: 0, qty40hq: 0, qty45: 0,
  };

  // Dynamic extra columns added by user
  const [extraCols, setExtraCols] = useState<string[]>(() => {
    // Restore from existing data
    return Object.keys(row.extraContainers || {}).filter(c => !DEFAULT_CODES.includes(c));
  });
  const [showAddPicker, setShowAddPicker] = useState(false);

  // TEU lookup from DB container_types
  const teuMap = useMemo(() => {
    const map: Record<string, number> = {};
    containerTypes.forEach(ct => {
      const code = ct.label.split(' - ')[0] || ct.label;
      map[code] = ct.teuValue;
    });
    return map;
  }, [containerTypes]);

  const totalTeu = calcTotalTeu(row, extraCols, teuMap);

  // Available container types to add (not already shown)
  const availableToAdd = useMemo(() => {
    const visible = new Set([...DEFAULT_CODES, ...extraCols]);
    return containerTypes.filter(ct => {
      const code = ct.label.split(' - ')[0] || ct.label;
      return !visible.has(code);
    });
  }, [containerTypes, extraCols]);

  // ── Update helpers ────────────────────────────────────

  const updateField = (field: string, value: any) => {
    const updated = { ...row, [field]: value };
    updated.lineTeu = calcTotalTeu(updated, extraCols, teuMap);
    onChange([updated]);
  };

  const updateExtraQty = (code: string, qty: number) => {
    const extras = { ...(row.extraContainers || {}) };
    extras[code] = qty;
    const updated = { ...row, extraContainers: extras };
    updated.lineTeu = calcTotalTeu(updated, extraCols, teuMap);
    onChange([updated]);
  };

  const updateExtraWeight = (code: string, weight: number | undefined) => {
    const weights = { ...(row.extraContainerWeights || {}) };
    if (weight !== undefined) {
      weights[code] = weight;
    } else {
      delete weights[code];
    }
    const updated = { ...row, extraContainerWeights: weights };
    onChange([updated]);
  };

  const addColumn = (code: string) => {
    if (!extraCols.includes(code)) {
      setExtraCols([...extraCols, code]);
    }
    setShowAddPicker(false);
  };

  const removeColumn = (code: string) => {
    const newExtraCols = extraCols.filter(c => c !== code);
    setExtraCols(newExtraCols);
    // Clean up data
    const extras = { ...(row.extraContainers || {}) };
    delete extras[code];
    const updated = { ...row, extraContainers: extras };
    updated.lineTeu = calcTotalTeu(updated, Object.keys(extras), teuMap);
    onChange([updated]);
    // Auto-uncheck oversize when no FR/OT remain
    const FR_OT_CODES = ['20OT', '40OT', '20FR', '40FR'];
    if (isOversizeCargo && onOversizeCargoChange && !newExtraCols.some(c => FR_OT_CODES.includes(c))) {
      onOversizeCargoChange(false);
    }
  };

  // Check if any container has qty > 0
  const hasAnyContainer = (row.qty20 || 0) > 0 || (row.qty40 || 0) > 0 ||
    (row.qty40hq || 0) > 0 || (row.qty45 || 0) > 0 ||
    Object.values(row.extraContainers || {}).some(v => (v || 0) > 0);

  // ── Render ──────────────────────────────────────────

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Container Information</span>
        {/* Add Container Type button */}
        {!disabled && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddPicker(!showAddPicker)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition"
            >
              <Plus className="w-3 h-3" />
              Add Container Type
            </button>
            {showAddPicker && (
              <div className="absolute z-30 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-56 max-h-52 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  Select Container Type
                </div>
                {availableToAdd.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-400">All types already shown.</div>
                ) : (
                  availableToAdd.map(ct => {
                    const code = ct.label.split(' - ')[0] || ct.label;
                    const isDefault = code === '20GP';
                    return (
                      <button
                        key={String(ct.value)}
                        type="button"
                        onClick={() => addColumn(code)}
                        className="block w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        {isDefault ? `${code} « Default` : code}
                        <span className="ml-1 text-gray-400">(TEU {ct.teuValue})</span>
                      </button>
                    );
                  })
                )}
                <div className="border-t border-gray-100 mt-1 pt-1 px-3 pb-1">
                  <button type="button" onClick={() => setShowAddPicker(false)}
                    className="text-xs text-gray-400 hover:text-gray-600">Close</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {/* Default columns */}
              {DEFAULT_COLS.map(col => (
                <React.Fragment key={col.code}>
                  <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600 whitespace-nowrap min-w-[60px]">
                    {col.label}
                  </th>
                  {is20FootType(col.code) && (
                    <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-green-600 whitespace-nowrap min-w-[110px]">
                      Wt(KG)
                    </th>
                  )}
                </React.Fragment>
              ))}
              {/* Dynamic extra columns */}
              {extraCols.map(code => (
                <React.Fragment key={code}>
                  <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600 whitespace-nowrap min-w-[60px] relative group">
                    <span>{sizeLabel(code)}</span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeColumn(code)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] leading-none hidden group-hover:inline-flex items-center justify-center"
                        title={`Remove ${sizeLabel(code)}`}
                      >
                        ×
                      </button>
                    )}
                  </th>
                  {is20FootType(code) && (
                    <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-green-600 whitespace-nowrap min-w-[80px]">
                      Wt(KG)
                    </th>
                  )}
                </React.Fragment>
              ))}
              {/* Line TEU */}
              <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600 whitespace-nowrap min-w-[70px]">
                Line TEU
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-blue-50/40">
              {/* Default columns — qty + weight (for all 20-foot types) */}
              {DEFAULT_COLS.map(col => {
                const { qtyKey, weightKey } = defaultFieldKey(col.code);
                const show20Wt = is20FootType(col.code);
                return (
                  <React.Fragment key={col.code}>
                    <td className="border border-gray-200 px-1 py-1">
                      <input
                        type="number" min={0}
                        value={(row as any)[qtyKey] || ''}
                        onChange={e => updateField(qtyKey, e.target.value ? Number(e.target.value) : 0)}
                        className="w-full text-xs text-center rounded border-gray-300 py-0.5 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="—"
                        disabled={disabled}
                      />
                    </td>
                    {show20Wt && (
                      <td className="border border-gray-200 px-1 py-1">
                        <input
                          type="number" min={0} step={0.01}
                          value={weightKey ? ((row as any)[weightKey] || '') : ''}
                          onChange={e => { if (weightKey) updateField(weightKey, e.target.value ? Number(e.target.value) : undefined); }}
                          className="w-full text-xs text-center rounded border-gray-300 py-0.5 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="—"
                          disabled={disabled}
                        />
                      </td>
                    )}
                  </React.Fragment>
                );
              })}
              {/* Dynamic extra columns — qty + weight (for 20-foot types) */}
              {extraCols.map(code => (
                <React.Fragment key={code}>
                  <td className="border border-gray-200 px-1 py-1">
                    <input
                      type="number" min={0}
                      value={(row.extraContainers || {})[code] || ''}
                      onChange={e => updateExtraQty(code, e.target.value ? Number(e.target.value) : 0)}
                      className="w-full text-xs text-center rounded border-gray-300 py-0.5 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="—"
                      disabled={disabled}
                    />
                  </td>
                  {is20FootType(code) && (
                    <td className="border border-gray-200 px-1 py-1">
                      <input
                        type="number" min={0} step={0.01}
                        value={(row.extraContainerWeights || {})[code] || ''}
                        onChange={e => updateExtraWeight(code, e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full text-xs text-center rounded border-gray-300 py-0.5 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="—"
                        disabled={disabled}
                      />
                    </td>
                  )}
                </React.Fragment>
              ))}
              {/* Line TEU */}
              <td className="border border-gray-200 px-1 py-1 text-center font-medium text-indigo-600 bg-indigo-50/30">
                {totalTeu > 0 ? totalTeu.toFixed(2) : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total TEU */}
      <div className="flex items-center justify-end">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
          📦 Total TEU: {totalTeu.toFixed(2)}
        </span>
      </div>

      {/* Validation hint */}
      {!hasAnyContainer && (
        <p className="text-xs text-amber-600">⚠ At least one container type must have Number &gt; 0.</p>
      )}

      {/* Contains Oversized Cargo checkbox — only when FR/OT types are present */}
      {(() => {
        const FR_OT_CODES = ['20OT', '40OT', '20FR', '40FR'];
        const hasFRorOT = extraCols.some(code => FR_OT_CODES.includes(code));
        if (!hasFRorOT || !onOversizeCargoChange) return null;
        return (
          <div className="flex items-center mt-1">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isOversizeCargo}
                onChange={e => onOversizeCargoChange(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                disabled={disabled}
              />
              <span className="text-orange-700 font-medium">Contains Oversized Cargo</span>
            </label>
          </div>
        );
      })()}
    </div>
  );
};

export default CargoContainerTable;
