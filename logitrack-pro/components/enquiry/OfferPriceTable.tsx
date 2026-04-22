import React, { useState, useMemo } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  Offer,
  OfferPriceLine,
  OfferContainerDetail,
  PortSelectOption,
  ContainerTypeSelectOption,
  RouteGroup,
  SubMode,
} from '../../types';
import { needsContainerDetails } from '../../constants';

// ==========================================
// Default 4 container size columns (always shown for FCL/BUYER-CONSOL)
// ==========================================

const DEFAULT_SIZE_CODES = ['20GP', '40GP', '40HQ', '45HQ'];

/** Short display name for column headers */
function sizeLabel(code: string): string {
  const map: Record<string, string> = {
    '20GP': "20'", '40GP': "40'", '40HQ': "40'HQ", '45HQ': "45'",
    '20RF': "20'RF", '40RF': "40'RF", '20OT': "20'OT", '40OT': "40'OT",
    '20FR': "20'FR", '40FR': "40'FR",
  };
  return map[code] || code;
}

// ==========================================
// Props
// ==========================================

interface OfferPriceTableProps {
  offer: Offer;
  offerIndex: number;
  ports: PortSelectOption[];
  /** All container types from container_types DB table */
  containerTypes: ContainerTypeSelectOption[];
  /** Carrier names from dict_carrier DB table (active only) */
  carrierOptions: string[];
  /** Currency codes from dict_currency DB table (active only) */
  currencyOptions?: string[];
  routeGroups?: RouteGroup[];
  isMixed: boolean;
  isOversizeCargo: boolean;
  onOversizeCargoChange: (value: boolean) => void;
  onUpdatePriceLines: (offerIndex: number, priceLines: OfferPriceLine[]) => void;
  onUpdateOffer?: (offerIndex: number, field: keyof Offer, value: any) => void;
}

// ==========================================
// Helper: resolve port name
// ==========================================

function getPortLabel(portId: number, ports: PortSelectOption[]): string {
  const port = ports.find(p => Number(p.value) === portId);
  return port?.label || `Port#${portId}`;
}

// ==========================================
// Container Detail Edit Dialog (linked to container_types table)
// ==========================================

// ==========================================
// Add Container Type Picker (dropdown)
// ==========================================

interface AddContainerTypePickerProps {
  availableTypes: ContainerTypeSelectOption[];
  onSelect: (code: string) => void;
  onClose: () => void;
}

const AddContainerTypePicker: React.FC<AddContainerTypePickerProps> = ({
  availableTypes, onSelect, onClose,
}) => {
  if (availableTypes.length === 0) {
    return (
      <div className="absolute z-30 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-xs text-gray-500 w-56">
        All container types are already shown.
        <button type="button" onClick={onClose} className="ml-2 text-indigo-600 hover:underline">Close</button>
      </div>
    );
  }
  return (
    <div className="absolute z-30 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-56 max-h-48 overflow-y-auto">
      <div className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
        Add Container Type
      </div>
      {availableTypes.map(ct => {
        // label 格式: "20RF - 20' Reefer"
        const code = ct.label.split(' - ')[0] || ct.label;
        return (
          <button
            key={ct.value}
            type="button"
            onClick={() => { onSelect(code); onClose(); }}
            className="block w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            {ct.label}
            <span className="ml-1 text-gray-400">(TEU {ct.teuValue})</span>
          </button>
        );
      })}
    </div>
  );
};

// ==========================================
// Main Component
// ==========================================

export const OfferPriceTable: React.FC<OfferPriceTableProps> = ({
  offer,
  offerIndex,
  ports,
  containerTypes,
  carrierOptions,
  currencyOptions = ['USD', 'EUR', 'GBP', 'CNY', 'HKD', 'VND'],
  routeGroups,
  isMixed,
  isOversizeCargo,
  onOversizeCargoChange,
  onUpdatePriceLines,
  onUpdateOffer,
}) => {
  const isContainer = needsContainerDetails(offer.offerType);
  const [showAddTypeGroup, setShowAddTypeGroup] = useState<string | null>(null);

  // ── Dynamic container columns (per route group) ───────
  // Key = groupKey string (e.g. "group-0-SEA" or "default"), Value = extra codes for that group
  const [extraSizeCodesByGroup, setExtraSizeCodesByGroup] = useState<Record<string, string[]>>({});

  /** Get the groupKey for a given route group */
  const getGroupKey = (groupId?: number, subMode?: SubMode): string => {
    if (groupId != null || subMode) return `group-${groupId ?? 'x'}-${subMode ?? 'x'}`;
    return 'default';
  };

  /** Get visible size codes for a specific group */
  const getVisibleSizeCodes = (groupKey: string, groupLines: OfferPriceLine[]): string[] => {
    const extras = extraSizeCodesByGroup[groupKey] || [];
    const codes = [...DEFAULT_SIZE_CODES, ...extras];
    // Also include any size codes found in existing data that aren't in the list
    groupLines.forEach(line => {
      (line.containerDetails || []).forEach(cd => {
        if (cd.containerSizeType && !codes.includes(cd.containerSizeType)) {
          codes.push(cd.containerSizeType);
        }
      });
    });
    return codes;
  };

  /** All visible size codes across all groups (for TEU calc & oversize detection) */
  const allVisibleSizeCodes = useMemo(() => {
    const codes = new Set<string>(DEFAULT_SIZE_CODES);
    Object.values(extraSizeCodesByGroup).forEach(extras => extras.forEach(c => codes.add(c)));
    offer.priceLines.forEach(line => {
      (line.containerDetails || []).forEach(cd => {
        if (cd.containerSizeType) codes.add(cd.containerSizeType);
      });
    });
    return [...codes];
  }, [extraSizeCodesByGroup, offer.priceLines]);

  // Build a TEU lookup from container_types DB table
  const teuLookup = useMemo(() => {
    const map: Record<string, number> = {};
    containerTypes.forEach(ct => {
      const code = ct.label.split(' - ')[0] || ct.label;
      map[code] = ct.teuValue;
    });
    // Fallback defaults
    if (!map['20GP']) map['20GP'] = 1.0;
    if (!map['40GP']) map['40GP'] = 2.0;
    if (!map['40HQ']) map['40HQ'] = 2.0;
    if (!map['45HQ']) map['45HQ'] = 2.0;
    return map;
  }, [containerTypes]);

  /** Get available types not yet shown in a specific group */
  const getAvailableToAdd = (groupKey: string, groupLines: OfferPriceLine[]): ContainerTypeSelectOption[] => {
    const visible = getVisibleSizeCodes(groupKey, groupLines);
    return containerTypes.filter(ct => {
      const code = ct.label.split(' - ')[0] || ct.label;
      return !visible.includes(code);
    });
  };

  // ── FR / OT detection for Oversize Cargo checkbox ─────
  const FR_OT_CODES = ['20OT', '40OT', '20FR', '40FR'];
  const hasFRorOT = useMemo(() => {
    return allVisibleSizeCodes.some(code => FR_OT_CODES.includes(code));
  }, [allVisibleSizeCodes]);

  // Auto-uncheck oversize when all FR/OT removed
  React.useEffect(() => {
    if (!hasFRorOT && isOversizeCargo) {
      onOversizeCargoChange(false);
    }
  }, [hasFRorOT]);

  // ── helpers ───────────────────────────────────────────

  const updatePriceLine = (lineIndex: number, field: keyof OfferPriceLine, value: any) => {
    const newLines = [...offer.priceLines];
    newLines[lineIndex] = { ...newLines[lineIndex], [field]: value };
    onUpdatePriceLines(offerIndex, newLines);
  };

  /** Update a single field within a containerDetail for a given line + sizeCode */
  const updateContainerField = (lineIndex: number, sizeCode: string, field: keyof OfferContainerDetail, value: any) => {
    const newLines = [...offer.priceLines];
    const line = { ...newLines[lineIndex] };
    const details = [...(line.containerDetails || [])];
    const idx = details.findIndex(d => d.containerSizeType === sizeCode);
    const teuFactor = teuLookup[sizeCode] || 1;
    if (idx >= 0) {
      const updated = { ...details[idx], [field]: value };
      updated.lineTeu = (updated.numberOfContainers || 0) * teuFactor;
      details[idx] = updated;
    } else {
      const newDetail: OfferContainerDetail = {
        containerSizeType: sizeCode,
        numberOfContainers: 0,
        teuValue: teuFactor,
        [field]: value,
      };
      newDetail.lineTeu = (newDetail.numberOfContainers || 0) * teuFactor;
      details.push(newDetail);
    }
    line.containerDetails = details;
    newLines[lineIndex] = line;
    onUpdatePriceLines(offerIndex, newLines);
  };

  const getContainerDetail = (line: OfferPriceLine, sizeCode: string): OfferContainerDetail | undefined => {
    return (line.containerDetails || []).find(d => d.containerSizeType === sizeCode);
  };

  const removePriceLine = (lineIndex: number) => {
    const newLines = offer.priceLines.filter((_, i) => i !== lineIndex);
    onUpdatePriceLines(offerIndex, newLines);
  };

  const removeContainerColumn = (sizeCode: string, groupKey: string) => {
    // Remove from this group's extras list
    setExtraSizeCodesByGroup(prev => ({
      ...prev,
      [groupKey]: (prev[groupKey] || []).filter(c => c !== sizeCode),
    }));
    // Also remove container details for this size from all lines
    const newLines = offer.priceLines.map(line => ({
      ...line,
      containerDetails: (line.containerDetails || []).filter(cd => cd.containerSizeType !== sizeCode),
    }));
    onUpdatePriceLines(offerIndex, newLines);
  };

  // ── empty state ───────────────────────────────────────

  if (offer.priceLines.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm border border-dashed border-gray-300 rounded mt-3">
        <p>No price lines yet.</p>
        <p className="text-xs mt-1">Select POL / POD in Route Information, then price lines are auto-generated.</p>
      </div>
    );
  }

  // ── group lines by route group (for mixed mode) ──────

  type GroupedLines = { groupId?: number; subMode?: SubMode; lines: { line: OfferPriceLine; globalIdx: number }[] };
  const groups: GroupedLines[] = [];

  if (isMixed && routeGroups && routeGroups.length > 0) {
    const groupMap = new Map<number | undefined, GroupedLines>();
    offer.priceLines.forEach((line, idx) => {
      const gid = line.routeGroupId;
      if (!groupMap.has(gid)) {
        const rg = routeGroups.find(g => g.groupIndex === gid);
        groupMap.set(gid, { groupId: gid, subMode: line.subMode || rg?.subMode, lines: [] });
      }
      groupMap.get(gid)!.lines.push({ line, globalIdx: idx });
    });
    groups.push(...groupMap.values());
  } else {
    groups.push({ lines: offer.priceLines.map((line, idx) => ({ line, globalIdx: idx })) });
  }

  // ── render ───────────────────────────────────────────

  return (
    <div className="mt-3 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Price Details</span>
          {isContainer && (
            <span className="text-[10px] text-gray-400">(enter price, number &amp; weight inline)</span>
          )}
        </div>
        {/* Currency selectors (FCL/BUYER-CONSOL only) */}
        {isContainer && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-gray-600">
              <span className="font-medium">Frg. Currency:</span>
              <select
                value={offer.containerCurrency || 'USD'}
                onChange={e => onUpdateOffer && onUpdateOffer(offerIndex, 'containerCurrency', e.target.value)}
                className="text-xs rounded border-gray-300 py-0.5 px-1 focus:border-indigo-500 focus:ring-indigo-500"
              >
                {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-1 text-xs text-gray-600">
              <span className="font-medium">Local Charge:</span>
              <select
                value={offer.localChargeCurrency || 'USD'}
                onChange={e => onUpdateOffer && onUpdateOffer(offerIndex, 'localChargeCurrency', e.target.value)}
                className="text-xs rounded border-gray-300 py-0.5 px-1 focus:border-indigo-500 focus:ring-indigo-500"
              >
                {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
        )}
      </div>

      {groups.map((group, gIdx) => {
        const groupKey = getGroupKey(group.groupId, group.subMode);
        const groupLines = group.lines.map(l => l.line);
        const groupVisibleSizeCodes = getVisibleSizeCodes(groupKey, groupLines);
        const groupAvailableToAdd = getAvailableToAdd(groupKey, groupLines);

        return (
        <div key={gIdx}>
          {/* Group header for mixed mode */}
          {isMixed && group.subMode && (
            <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1 border-b border-gray-200 pb-1">
              {group.subMode === 'AIR' ? '✈' : group.subMode === 'SEA' ? '⚓' : '🚂'}
              <span>Route Group {gIdx + 1} ({group.subMode})</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-600 w-32">POL</th>
                  <th className="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-600 w-32">POD</th>
                  {/* Inline container columns: Price / Number / Weight(all 20-foot types) for each size */}
                  {isContainer && groupVisibleSizeCodes.map(code => {
                    const is20Foot = code.startsWith('20');
                    return (
                      <th key={code} colSpan={is20Foot ? 3 : 2} className="border border-gray-200 px-1 py-1 text-center font-medium text-gray-600 relative group">
                        <div className="flex items-center justify-center gap-1">
                          <span>{sizeLabel(code)}</span>
                          {!DEFAULT_SIZE_CODES.includes(code) && (
                            <button
                              type="button"
                              onClick={() => removeContainerColumn(code, groupKey)}
                              className="w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[8px] leading-none hidden group-hover:inline-flex items-center justify-center"
                              title={`Remove ${sizeLabel(code)} column`}
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="flex text-[9px] text-gray-400 font-normal justify-center gap-0">
                          <span className="px-1">Price</span>
                          <span className="px-1">Num</span>
                          {is20Foot && <span className="px-1 text-green-500">Wt(KG)</span>}
                        </div>
                      </th>
                    );
                  })}
                  {/* FCL/BUYER-CONSOL: show CARRIER */}
                  {isContainer && (
                    <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600 w-28">CARRIER</th>
                  )}
                  {/* LCL/AIR: Price + Min Charge */}
                  {!isContainer && (
                    <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600 w-20">Price</th>
                  )}
                  {!isContainer && (
                    <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600 w-20">Min Charge</th>
                  )}
                  <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600 w-20">Local Charge</th>
                  <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {group.lines.map(({ line, globalIdx }) => {
                  return (
                    <tr key={globalIdx} className="hover:bg-blue-50/40">
                      <td className="border border-gray-200 px-2 py-1 text-gray-700 whitespace-nowrap truncate max-w-[140px]" title={getPortLabel(line.polId, ports)}>
                        {getPortLabel(line.polId, ports)}
                      </td>
                      <td className="border border-gray-200 px-2 py-1 text-gray-700 whitespace-nowrap truncate max-w-[140px]" title={getPortLabel(line.podId, ports)}>
                        {getPortLabel(line.podId, ports)}
                      </td>

                      {/* Inline container columns (FCL/BUYER-CONSOL only) — Price / Number / Weight(all 20-foot types) */}
                      {isContainer && groupVisibleSizeCodes.map(code => {
                        const cd = getContainerDetail(line, code);
                        const is20Foot = code.startsWith('20');
                        return (
                          <React.Fragment key={code}>
                            {/* Container Price */}
                            <td className="border border-gray-200 px-0.5 py-1">
                              <input
                                type="number" step="0.01" min={0}
                                value={cd?.containerPrice ?? ''}
                                onChange={e => updateContainerField(globalIdx, code, 'containerPrice', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-14 text-xs text-right rounded border-gray-300 py-0.5 focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="Price"
                              />
                            </td>
                            {/* Number of Containers */}
                            <td className="border border-gray-200 px-0.5 py-1">
                              <input
                                type="number" min={0}
                                value={cd?.numberOfContainers || ''}
                                onChange={e => updateContainerField(globalIdx, code, 'numberOfContainers', e.target.value ? Number(e.target.value) : 0)}
                                className="w-10 text-xs text-right rounded border-gray-300 py-0.5 focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="Num"
                              />
                            </td>
                            {/* Weight (KG) — for all 20-foot types */}
                            {is20Foot && (
                              <td className="border border-gray-200 px-0.5 py-1">
                                <input
                                  type="number" step="0.01" min={0}
                                  value={cd?.cargoWeightPerContainer ?? ''}
                                  onChange={e => updateContainerField(globalIdx, code, 'cargoWeightPerContainer', e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-14 text-xs text-right rounded border-gray-300 py-0.5 focus:border-indigo-500 focus:ring-indigo-500"
                                  placeholder="Wt"
                                />
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {/* CARRIER dropdown (FCL/BUYER-CONSOL only) */}
                      {isContainer && (
                        <td className="border border-gray-200 px-1 py-1">
                          <select
                            value={line.carrier || ''}
                            onChange={e => updatePriceLine(globalIdx, 'carrier', e.target.value || undefined)}
                            className="w-full text-xs rounded border-gray-300 py-0.5 focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="">—</option>
                            {carrierOptions.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                      )}

                      {/* Price (LCL/AIR only) */}
                      {!isContainer && (
                        <td className="border border-gray-200 px-1 py-1">
                          <input
                            type="number" step="0.01" min={0}
                            value={line.price ?? ''}
                            onChange={e => {
                              const v = e.target.value ? Number(e.target.value) : undefined;
                              updatePriceLine(globalIdx, 'price', v);
                            }}
                            className="w-full text-xs text-center rounded border-gray-300 py-0.5 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="—"
                          />
                        </td>
                      )}

                      {/* Min Charge (LCL/AIR only) */}
                      {!isContainer && (
                        <td className="border border-gray-200 px-1 py-1">
                          <input
                            type="number" step="0.01" min={0}
                            value={line.minCharge ?? ''}
                            onChange={e => updatePriceLine(globalIdx, 'minCharge', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full text-xs text-center rounded border-gray-300 py-0.5 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="—"
                          />
                        </td>
                      )}

                      {/* Local Charge */}
                      <td className="border border-gray-200 px-1 py-1">
                        <input
                          type="number" step="0.01" min={0}
                          value={line.localCharge ?? ''}
                          onChange={e => updatePriceLine(globalIdx, 'localCharge', e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full text-xs text-center rounded border-gray-300 py-0.5 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="—"
                        />
                      </td>

                      {/* Delete row */}
                      <td className="border border-gray-200 px-1 py-1 text-center">
                        <button type="button" onClick={() => removePriceLine(globalIdx)}
                          className="text-red-400 hover:text-red-600" title="Remove row">
                          <Trash2 className="w-3 h-3 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty row hint + Add Container Type (per group) */}
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-gray-400">
              ⓘ Empty rows (all price fields blank) will be auto-removed on save.
            </p>
            {isContainer && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAddTypeGroup(showAddTypeGroup === groupKey ? null : groupKey)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-300 rounded px-2 py-1 hover:bg-indigo-50 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Container Type
                </button>
                {showAddTypeGroup === groupKey && (
                  <AddContainerTypePicker
                    availableTypes={groupAvailableToAdd}
                    onSelect={(code) => setExtraSizeCodesByGroup(prev => ({
                      ...prev,
                      [groupKey]: [...(prev[groupKey] || []), code],
                    }))}
                    onClose={() => setShowAddTypeGroup(null)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        );
      })}

      {/* Oversize Cargo auto-uncheck handled by useEffect above; checkbox moved to CargoContainerTable */}
    </div>
  );
};
