// ============================================================
// PriceDetailsTable — v3.1 报价矩阵表格
//
// FCL / BUYER-CONSOL 模式:
//   POL | POD | 20' | 40' | 40'HQ | ... | PerCBM | MinCharge | LocalCharge | PriceText
//   (柜型列可点击触发 ContainerDetailsDialog)
//
// AIR / LCL 模式:
//   POL | POD | Price | PerCBM | MinCharge | LocalCharge | PriceText
//
// 混合模式 (Route Group):
//   分组显示行, 每组头部显示 sub-mode 标签
//
// POL/POD: 带端口搜索的小型 autocomplete
// ============================================================

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Package, Search, Layers } from 'lucide-react';
import {
  OfferPriceLine,
  OfferContainerDetail,
  OfferType,
  PortType,
  PortSelectOption,
  ContainerTypeSelectOption,
  SubMode,
} from '../../types';
import { masterDataApi } from '../../services/api';
import { needsContainerDetails } from '../../constants';

// ----------------------------------
// Types
// ----------------------------------

interface ContainerColumn {
  containerCode: string;
  containerName: string;
  teuValue: number;
}

interface PriceDetailsTableProps {
  offerType: OfferType;
  priceLines: OfferPriceLine[];
  onChange: (lines: OfferPriceLine[]) => void;
  containerTypes?: ContainerTypeSelectOption[];
  /** Callback to open ContainerDetailsDialog for a cell */
  onOpenContainerDialog?: (lineIndex: number, containerCode: string, detail?: OfferContainerDetail) => void;
  disabled?: boolean;
}

// ----------------------------------
// Default container columns
// ----------------------------------
const DEFAULT_CONTAINER_COLS: ContainerColumn[] = [
  { containerCode: '20GP', containerName: "20'", teuValue: 1.0 },
  { containerCode: '40GP', containerName: "40'", teuValue: 2.0 },
  { containerCode: '40HQ', containerName: "40'HQ", teuValue: 2.0 },
];

// Sub-mode label colors
const SUB_MODE_COLORS: Record<string, string> = {
  AIR: 'bg-sky-100 text-sky-700 border-sky-200',
  SEA: 'bg-blue-100 text-blue-700 border-blue-200',
  RAIL: 'bg-amber-100 text-amber-700 border-amber-200',
};

// ----------------------------------
// PortSearchInput — inline port search widget
// ----------------------------------
interface PortSearchInputProps {
  value: string;          // display text (port name)
  portId: number;
  portType?: PortType;
  placeholder: string;
  disabled?: boolean;
  onSelect: (portId: number, portName: string) => void;
}

const PortSearchInput: React.FC<PortSearchInputProps> = ({
  value,
  portId,
  portType = 'SEA',
  placeholder,
  disabled,
  onSelect,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PortSelectOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await masterDataApi.searchPorts(portType, text);
        setResults(res.slice(0, 10));
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const handleSelect = (opt: PortSelectOption) => {
    onSelect(Number(opt.value), opt.label);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  // If port has a name, show it; otherwise show search input
  if (value && portId > 0 && !isOpen) {
    return (
      <div
        ref={wrapperRef}
        className={`flex items-center gap-1 px-1.5 py-1 text-xs border border-gray-200 rounded cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition group ${disabled ? 'bg-gray-50 cursor-default' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            setQuery('');
          }
        }}
        title={value}
      >
        <span className="truncate flex-1">{value}</span>
        {!disabled && <Search size={10} className="text-gray-300 group-hover:text-indigo-400 shrink-0" />}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          className="w-full px-1.5 py-1 text-xs border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-300 pr-6"
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={!disabled}
        />
        {isSearching && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 animate-spin h-3 w-3 border border-indigo-300 border-t-indigo-600 rounded-full" />
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-0.5 bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-auto">
          {results.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => handleSelect(opt)}
              className="block w-full text-left px-2 py-1.5 text-xs hover:bg-indigo-50 text-gray-700 border-b border-gray-50 last:border-0"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {isOpen && results.length === 0 && query.length >= 2 && !isSearching && (
        <div className="absolute z-30 top-full left-0 right-0 mt-0.5 bg-white border border-gray-200 rounded shadow-lg p-2 text-xs text-gray-400 text-center">
          No ports found
        </div>
      )}
    </div>
  );
};

// ----------------------------------
// Main Component
// ----------------------------------

export const PriceDetailsTable: React.FC<PriceDetailsTableProps> = ({
  offerType,
  priceLines,
  onChange,
  containerTypes = [],
  onOpenContainerDialog,
  disabled = false,
}) => {
  // Auto-detect container columns from existing data
  const initialCols = useMemo(() => {
    const existingCodes = new Set<string>();
    priceLines.forEach((line) => {
      (line.containerDetails || []).forEach((d) => {
        if (d.containerSizeType) existingCodes.add(d.containerSizeType);
      });
    });
    // Start with defaults, add any additional ones from data
    const cols = [...DEFAULT_CONTAINER_COLS];
    existingCodes.forEach((code) => {
      if (!cols.find((c) => c.containerCode === code)) {
        const ct = containerTypes.find((t) => String(t.value) === code);
        cols.push({
          containerCode: code,
          containerName: ct ? ct.label.split(' - ')[0] : code,
          teuValue: ct?.teuValue || (code.startsWith('20') ? 1.0 : 2.0),
        });
      }
    });
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only compute once on mount

  const [containerColumns, setContainerColumns] = useState<ContainerColumn[]>(initialCols);
  const isFCL = needsContainerDetails(offerType);

  // Determine port type from offer type
  const portType: PortType = offerType === 'AIR' ? 'AIR' : 'SEA';

  // ---- Group lines by route group (mixed-mode) ----
  const routeGroups = useMemo(() => {
    const hasRouteGroups = priceLines.some((l) => l.routeGroupId);
    if (!hasRouteGroups) return null;

    const groups = new Map<number, { subMode: SubMode; lines: { line: OfferPriceLine; globalIdx: number }[] }>();
    priceLines.forEach((line, idx) => {
      const gid = line.routeGroupId || 0;
      if (!groups.has(gid)) {
        groups.set(gid, { subMode: (line.subMode as SubMode) || 'SEA', lines: [] });
      }
      groups.get(gid)!.lines.push({ line, globalIdx: idx });
    });
    return groups;
  }, [priceLines]);

  // ---- Helpers ----

  /** Update a single price line field */
  const updateLine = useCallback(
    (index: number, field: keyof OfferPriceLine, value: any) => {
      const updated = priceLines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      );
      onChange(updated);
    },
    [priceLines, onChange]
  );

  /** Update POL or POD with id + name */
  const updatePort = useCallback(
    (index: number, type: 'pol' | 'pod', portId: number, portName: string) => {
      const updated = priceLines.map((line, i) =>
        i === index
          ? type === 'pol'
            ? { ...line, polId: portId, polName: portName }
            : { ...line, podId: portId, podName: portName }
          : line
      );
      onChange(updated);
    },
    [priceLines, onChange]
  );

  /** Add a new blank row */
  const addRow = useCallback(() => {
    const newLine: OfferPriceLine = {
      polId: 0,
      podId: 0,
      sortOrder: priceLines.length,
      containerDetails: [],
    };
    onChange([...priceLines, newLine]);
  }, [priceLines, onChange]);

  /** Remove a row */
  const removeRow = useCallback(
    (index: number) => {
      onChange(priceLines.filter((_, i) => i !== index));
    },
    [priceLines, onChange]
  );

  /** Add a new container type column */
  const addContainerColumn = useCallback(
    (ct: ContainerColumn) => {
      if (!containerColumns.find((c) => c.containerCode === ct.containerCode)) {
        setContainerColumns([...containerColumns, ct]);
      }
    },
    [containerColumns]
  );

  /** Remove a container type column */
  const removeContainerColumn = useCallback(
    (code: string) => {
      setContainerColumns(containerColumns.filter((c) => c.containerCode !== code));
      // Also clean up container details referencing this code
      const updated = priceLines.map((line) => ({
        ...line,
        containerDetails: (line.containerDetails || []).filter(
          (d) => d.containerSizeType !== code
        ),
      }));
      onChange(updated);
    },
    [containerColumns, priceLines, onChange]
  );

  /** Get the container detail for a line + container code */
  const getContainerDetail = (line: OfferPriceLine, containerCode: string): OfferContainerDetail | undefined => {
    return (line.containerDetails || []).find((d) => d.containerSizeType === containerCode);
  };

  /** Format a container cell display */
  const formatContainerCell = (detail?: OfferContainerDetail): string => {
    if (!detail || !detail.numberOfContainers) return '-';
    const price = detail.containerPrice ? ` @${detail.containerPrice}` : '';
    return `${detail.numberOfContainers}x${price}`;
  };

  // Available container types to add (not already in columns)
  const availableContainerTypes = useMemo(() => {
    const used = new Set(containerColumns.map((c) => c.containerCode));
    return containerTypes.filter((ct) => !used.has(String(ct.value)));
  }, [containerTypes, containerColumns]);

  // Total columns count for colSpan
  const totalCols = 3 + (isFCL ? containerColumns.length : 1) + 4 + (disabled ? 0 : 1);

  // ---- Render a single table row ----
  const renderRow = (line: OfferPriceLine, idx: number, linePortType?: PortType) => {
    const rowPortType = linePortType || portType;
    return (
      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
        <td className="px-2 py-1.5 text-gray-400">{idx + 1}</td>

        {/* POL — port search */}
        <td className="px-1 py-1">
          <PortSearchInput
            value={line.polName || ''}
            portId={line.polId || 0}
            portType={rowPortType}
            placeholder="Search POL..."
            disabled={disabled}
            onSelect={(id, name) => updatePort(idx, 'pol', id, name)}
          />
        </td>

        {/* POD — port search */}
        <td className="px-1 py-1">
          <PortSearchInput
            value={line.podName || ''}
            portId={line.podId || 0}
            portType={rowPortType}
            placeholder="Search POD..."
            disabled={disabled}
            onSelect={(id, name) => updatePort(idx, 'pod', id, name)}
          />
        </td>

        {/* FCL: Container cells (clickable) */}
        {isFCL &&
          containerColumns.map((col) => {
            const detail = getContainerDetail(line, col.containerCode);
            return (
              <td
                key={col.containerCode}
                className={`px-2 py-1.5 text-center cursor-pointer hover:bg-indigo-50/50 transition ${
                  detail?.numberOfContainers ? 'bg-indigo-50/30 font-medium text-indigo-700' : 'text-gray-400'
                }`}
                onClick={() => {
                  if (!disabled && onOpenContainerDialog) {
                    onOpenContainerDialog(idx, col.containerCode, detail);
                  }
                }}
                title="Click to edit container details"
              >
                {formatContainerCell(detail)}
              </td>
            );
          })}

        {/* AIR/LCL: Price field */}
        {!isFCL && (
          <td className="px-2 py-1.5">
            <input
              type="number"
              value={line.price ?? ''}
              onChange={(e) => updateLine(idx, 'price', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-1.5 py-1 text-xs text-right border border-gray-200 rounded focus:ring-1 focus:ring-indigo-300"
              placeholder="0.00"
              disabled={disabled}
            />
          </td>
        )}

        {/* PerCBM */}
        <td className="px-2 py-1.5">
          <input
            type="number"
            value={line.perCbm ?? ''}
            onChange={(e) => updateLine(idx, 'perCbm', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-1.5 py-1 text-xs text-right border border-gray-200 rounded focus:ring-1 focus:ring-indigo-300"
            placeholder="0.00"
            disabled={disabled}
          />
        </td>

        {/* MinCharge */}
        <td className="px-2 py-1.5">
          <input
            type="number"
            value={line.minCharge ?? ''}
            onChange={(e) => updateLine(idx, 'minCharge', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-1.5 py-1 text-xs text-right border border-gray-200 rounded focus:ring-1 focus:ring-indigo-300"
            placeholder="0.00"
            disabled={disabled}
          />
        </td>

        {/* LocalCharge */}
        <td className="px-2 py-1.5">
          <input
            type="number"
            value={line.localCharge ?? ''}
            onChange={(e) => updateLine(idx, 'localCharge', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-1.5 py-1 text-xs text-right border border-gray-200 rounded focus:ring-1 focus:ring-indigo-300"
            placeholder="0.00"
            disabled={disabled}
          />
        </td>

        {/* PriceText */}
        <td className="px-2 py-1.5">
          <input
            type="text"
            value={line.priceText || ''}
            onChange={(e) => updateLine(idx, 'priceText', e.target.value)}
            className="w-full px-1.5 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-300"
            placeholder="text"
            disabled={disabled}
          />
        </td>

        {/* Delete row */}
        {!disabled && (
          <td className="px-2 py-1.5">
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="text-gray-300 hover:text-red-500"
              title="Remove row"
            >
              <Trash2 size={13} />
            </button>
          </td>
        )}
      </tr>
    );
  };

  // ---- Render ----

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Package size={14} className="text-indigo-500" />
          Price Lines
          <span className="text-xs text-gray-400">({priceLines.length} rows)</span>
          {routeGroups && (
            <span className="flex items-center gap-1 ml-2 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              <Layers size={11} /> {routeGroups.size} groups
            </span>
          )}
        </h4>
        <div className="flex items-center gap-2">
          {/* Add container column (FCL only) */}
          {isFCL && availableContainerTypes.length > 0 && !disabled && (
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-md transition"
              >
                <Plus size={12} /> Add Column
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block max-h-60 overflow-auto">
                {availableContainerTypes.map((ct) => (
                  <button
                    key={String(ct.value)}
                    type="button"
                    onClick={() =>
                      addContainerColumn({
                        containerCode: String(ct.value),
                        containerName: ct.label.split(' - ')[0] || String(ct.value),
                        teuValue: ct.teuValue,
                      })
                    }
                    className="block w-full text-left px-3 py-2 text-xs hover:bg-purple-50 text-gray-700"
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add row */}
          {!disabled && (
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition"
            >
              <Plus size={12} /> Add Row
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2 py-2 text-left font-medium text-gray-600 w-8">#</th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[130px]">POL</th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[130px]">POD</th>

              {/* FCL: Container columns */}
              {isFCL &&
                containerColumns.map((col) => (
                  <th key={col.containerCode} className="px-2 py-2 text-center font-medium text-gray-600 min-w-[80px]">
                    <div className="flex items-center justify-center gap-1">
                      <span>{col.containerName}</span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => removeContainerColumn(col.containerCode)}
                          className="text-gray-300 hover:text-red-500 ml-1"
                          title="Remove column"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}

              {/* Common price columns */}
              {!isFCL && (
                <th className="px-2 py-2 text-right font-medium text-gray-600 min-w-[80px]">Price</th>
              )}
              <th className="px-2 py-2 text-right font-medium text-gray-600 min-w-[80px]">PerCBM</th>
              <th className="px-2 py-2 text-right font-medium text-gray-600 min-w-[80px]">MinCharge</th>
              <th className="px-2 py-2 text-right font-medium text-gray-600 min-w-[80px]">LocalCharge</th>
              <th className="px-2 py-2 text-right font-medium text-gray-600 w-12">PriceText</th>
              {!disabled && <th className="px-2 py-2 w-8" />}
            </tr>
          </thead>
          <tbody>
            {priceLines.length === 0 && (
              <tr>
                <td
                  colSpan={totalCols}
                  className="px-4 py-8 text-center text-gray-400 italic"
                >
                  No price lines. Click "Add Row" or "Auto-Generate" to start.
                </td>
              </tr>
            )}

            {/* Route Group mode — grouped rows */}
            {routeGroups
              ? Array.from(routeGroups.entries()).map(([gid, group]) => (
                  <React.Fragment key={gid}>
                    {/* Group header row */}
                    <tr className="bg-gradient-to-r from-gray-50 to-white">
                      <td colSpan={totalCols} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Layers size={12} className="text-purple-500" />
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${SUB_MODE_COLORS[group.subMode] || SUB_MODE_COLORS.SEA}`}>
                            {group.subMode}
                          </span>
                          <span className="text-xs text-gray-500">
                            Route Group #{gid} — {group.lines.length} line{group.lines.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Group data rows */}
                    {group.lines.map(({ line, globalIdx }) =>
                      renderRow(line, globalIdx, group.subMode === 'AIR' ? 'AIR' : 'SEA')
                    )}
                  </React.Fragment>
                ))
              : /* Normal mode — flat rows */
                priceLines.map((line, idx) => renderRow(line, idx))
            }
          </tbody>
        </table>
      </div>

      {/* Summary for FCL */}
      {isFCL && priceLines.length > 0 && (
        <div className="text-xs text-gray-500 flex items-center gap-4">
          <span>
            Total TEU:{' '}
            <span className="font-medium text-gray-700">
              {priceLines
                .reduce((sum, line) => {
                  const lineContainers = line.containerDetails || [];
                  return (
                    sum +
                    lineContainers.reduce(
                      (cs, d) => cs + (d.numberOfContainers || 0) * (d.teuValue || 0),
                      0
                    )
                  );
                }, 0)
                .toFixed(2)}
            </span>
          </span>
          <span>
            Total Containers:{' '}
            <span className="font-medium text-gray-700">
              {priceLines.reduce((sum, line) => {
                return (
                  sum +
                  (line.containerDetails || []).reduce(
                    (cs, d) => cs + (d.numberOfContainers || 0),
                    0
                  )
                );
              }, 0)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default PriceDetailsTable;
