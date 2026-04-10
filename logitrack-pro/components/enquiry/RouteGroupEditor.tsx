// ============================================================
// RouteGroupEditor — v3 混合模式路由组编辑器
// 用于 SEA-AIR / RAIL-SEA / RAIL-AIR / AIR-RAIL-SEA 产品
// 每组有: sub-mode 下拉 + POL 多选 + POD 多选
// ============================================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Trash2, Anchor, Plane, TrainFront, ArrowRight } from 'lucide-react';
import { RouteGroup, SubMode, PortSelectOption, PortType, ProductCode } from '../../types';
import { masterDataApi } from '../../services/api';
import { PRODUCT_SUBMODE_MAP, isMixedProduct } from '../../constants';
import { VirtualizedMultiSelect } from '../VirtualizedMultiSelect';

interface RouteGroupEditorProps {
  productCode: ProductCode;
  routeGroups: RouteGroup[];
  onChange: (groups: RouteGroup[]) => void;
  disabled?: boolean;
}

/** Map sub-mode to port type for searching */
const SUB_MODE_PORT_TYPE: Record<SubMode, PortType> = {
  'AIR': 'AIR',
  'SEA': 'SEA',
  'RAIL': 'SEA', // Rail ports share the same seaport codes
};

const SUB_MODE_ICON: Record<SubMode, React.ReactNode> = {
  'AIR': <Plane size={14} />,
  'SEA': <Anchor size={14} />,
  'RAIL': <TrainFront size={14} />,
};

const SUB_MODE_COLORS: Record<SubMode, string> = {
  'AIR': 'bg-sky-50 border-sky-200 text-sky-700',
  'SEA': 'bg-blue-50 border-blue-200 text-blue-700',
  'RAIL': 'bg-amber-50 border-amber-200 text-amber-700',
};

export const RouteGroupEditor: React.FC<RouteGroupEditorProps> = ({
  productCode,
  routeGroups,
  onChange,
  disabled = false,
}) => {
  const [portOptions, setPortOptions] = useState<Record<string, PortSelectOption[]>>({});
  const [isSearching, setIsSearching] = useState<Record<string, boolean>>({});
  const preloadedRef = useRef(false);

  // Get the expected sub-mode sequence for this product
  const subModeSequence = PRODUCT_SUBMODE_MAP[productCode] || [];

  // Initialize groups from product sub-mode sequence if empty
  const ensureGroups = useCallback((): RouteGroup[] => {
    if (routeGroups.length > 0) return routeGroups;
    return subModeSequence.map((sm, i) => ({
      groupIndex: i,
      subMode: sm as SubMode,
      polIds: [],
      podIds: [],
    }));
  }, [routeGroups, subModeSequence]);

  const groups = ensureGroups();

  // ── Pre-load port options for already-selected IDs (edit mode) ──
  useEffect(() => {
    if (preloadedRef.current) return;
    // Collect all unique portIds that need to be loaded
    const allIds = new Set<number>();
    groups.forEach(g => {
      (g.polIds || []).forEach(id => allIds.add(Number(id)));
      (g.podIds || []).forEach(id => allIds.add(Number(id)));
    });
    if (allIds.size === 0) return;
    preloadedRef.current = true;

    // Fetch all ports in parallel then build option maps
    Promise.all(
      Array.from(allIds).map(id =>
        masterDataApi.getPortById(id).catch(() => null)
      )
    ).then(ports => {
      const portMap: Record<number, PortSelectOption> = {};
      ports.forEach(p => {
        if (!p) return;
        portMap[p.id] = {
          value: p.id,
          label: `${p.portCode} - ${p.portName}`,
          portCode: p.portCode,
          portType: p.portType as PortType,
          countryCode: p.countryCode,
        };
      });

      const newOptions: Record<string, PortSelectOption[]> = {};
      groups.forEach((g, idx) => {
        const polKey = `${idx}-pol`;
        const podKey = `${idx}-pod`;
        const polOpts = (g.polIds || [])
          .map(id => portMap[Number(id)])
          .filter(Boolean) as PortSelectOption[];
        const podOpts = (g.podIds || [])
          .map(id => portMap[Number(id)])
          .filter(Boolean) as PortSelectOption[];
        if (polOpts.length > 0) newOptions[polKey] = polOpts;
        if (podOpts.length > 0) newOptions[podKey] = podOpts;
      });

      setPortOptions(prev => ({ ...prev, ...newOptions }));
    });
  }, [groups]);

  // Port search handler — also loads initial ports on empty search
  const handlePortSearch = useCallback(
    async (groupIndex: number, field: 'pol' | 'pod', searchTerm: string) => {
      const group = groups[groupIndex];
      if (!group) return;
      // Allow empty/short searches to load initial data
      if (searchTerm.length >= 1 && searchTerm.length < 2) return; // skip 1-char

      const key = `${groupIndex}-${field}`;
      setIsSearching((prev) => ({ ...prev, [key]: true }));

      try {
        const portType = SUB_MODE_PORT_TYPE[group.subMode];
        // Empty search → load top ports; otherwise search by term
        const results = await masterDataApi.searchPorts(portType, searchTerm || '');
        // Merge with existing options so pre-loaded selections aren't lost
        setPortOptions((prev) => {
          const existing = prev[key] || [];
          const existingIds = new Set(existing.map(o => String(o.value)));
          const merged = [
            ...existing,
            ...results.filter(r => !existingIds.has(String(r.value))),
          ];
          return { ...prev, [key]: merged };
        });
      } catch (err) {
        console.error('Port search failed:', err);
      } finally {
        setIsSearching((prev) => ({ ...prev, [key]: false }));
      }
    },
    [groups]
  );

  const updateGroup = (index: number, patch: Partial<RouteGroup>) => {
    const updated = groups.map((g, i) => (i === index ? { ...g, ...patch } : g));
    onChange(updated);
  };

  const addGroup = () => {
    // Determine next available sub-mode
    const usedModes = groups.map((g) => g.subMode);
    const nextMode = subModeSequence.find((sm) => !usedModes.includes(sm as SubMode));
    const newGroup: RouteGroup = {
      groupIndex: groups.length,
      subMode: (nextMode as SubMode) || 'SEA',
      polIds: [],
      podIds: [],
    };
    onChange([...groups, newGroup]);
  };

  const removeGroup = (index: number) => {
    if (groups.length <= 1) return; // Keep at least 1 group
    const updated = groups.filter((_, i) => i !== index).map((g, i) => ({ ...g, groupIndex: i }));
    onChange(updated);
  };

  if (!isMixedProduct(productCode)) {
    return null; // Only render for mixed products
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <ArrowRight size={16} className="text-indigo-500" />
          Route Groups
          <span className="text-xs font-normal text-gray-400">
            ({subModeSequence.join(' → ')})
          </span>
        </h4>
        {!disabled && groups.length < subModeSequence.length && (
          <button
            type="button"
            onClick={addGroup}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition"
          >
            <Plus size={14} /> Add Group
          </button>
        )}
      </div>

      <div className="space-y-3">
        {groups.map((group, idx) => {
          const polKey = `${idx}-pol`;
          const podKey = `${idx}-pod`;
          const polOpts = portOptions[polKey] || [];
          const podOpts = portOptions[podKey] || [];

          return (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${SUB_MODE_COLORS[group.subMode]} transition-colors`}
            >
              {/* Group header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    {SUB_MODE_ICON[group.subMode]}
                    Leg {idx + 1}
                  </span>
                  <select
                    value={group.subMode}
                    onChange={(e) => updateGroup(idx, { subMode: e.target.value as SubMode })}
                    disabled={disabled}
                    className="text-xs px-2 py-1 border border-current/20 rounded bg-white/80 font-medium"
                  >
                    {subModeSequence.map((sm) => (
                      <option key={sm} value={sm}>
                        {sm}
                      </option>
                    ))}
                  </select>
                </div>
                {!disabled && groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGroup(idx)}
                    className="text-red-400 hover:text-red-600 p-1"
                    title="Remove group"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* POL / POD selects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <VirtualizedMultiSelect
                  label={`POL (${group.subMode})`}
                  options={polOpts}
                  value={group.polIds || []}
                  onChange={(vals) => updateGroup(idx, { polIds: vals as number[] })}
                  onSearch={(term) => handlePortSearch(idx, 'pol', term)}
                  isSearching={isSearching[polKey]}
                  placeholder={`Search ${group.subMode === 'AIR' ? 'airports' : 'ports'}...`}
                  maxSelections={10}
                  disabled={disabled}
                />
                <VirtualizedMultiSelect
                  label={`POD (${group.subMode})`}
                  options={podOpts}
                  value={group.podIds || []}
                  onChange={(vals) => updateGroup(idx, { podIds: vals as number[] })}
                  onSearch={(term) => handlePortSearch(idx, 'pod', term)}
                  isSearching={isSearching[podKey]}
                  placeholder={`Search ${group.subMode === 'AIR' ? 'airports' : 'ports'}...`}
                  maxSelections={10}
                  disabled={disabled}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Plane size={12} /> AIR = Airports</span>
        <span className="flex items-center gap-1"><Anchor size={12} /> SEA = Seaports</span>
        <span className="flex items-center gap-1"><TrainFront size={12} /> RAIL = Rail terminals</span>
      </div>
    </div>
  );
};

export default RouteGroupEditor;
