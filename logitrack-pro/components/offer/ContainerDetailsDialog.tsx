// ============================================================
// ContainerDetailsDialog — v3.1 容器详情弹窗
// 点击 PriceDetailsTable 中的柜型单元格时打开
// 填写: 数量、每柜货重、单价、柜型(下拉)
// TEU 自动计算
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, Package2 } from 'lucide-react';
import { OfferContainerDetail } from '../../types';

// Common container sub-types
const CONTAINER_SUB_TYPES = [
  { value: '', label: '— None —' },
  { value: 'GP', label: 'GP (General Purpose)' },
  { value: 'RF', label: 'RF (Reefer)' },
  { value: 'OT', label: 'OT (Open Top)' },
  { value: 'FR', label: 'FR (Flat Rack)' },
  { value: 'Tank', label: 'Tank' },
  { value: 'HC', label: 'HC (High Cube)' },
];

interface ContainerDetailsDialogProps {
  isOpen: boolean;
  containerCode: string;
  teuValue: number;
  existingDetail?: OfferContainerDetail;
  onConfirm: (detail: OfferContainerDetail) => void;
  onCancel: () => void;
}

export const ContainerDetailsDialog: React.FC<ContainerDetailsDialogProps> = ({
  isOpen,
  containerCode,
  teuValue,
  existingDetail,
  onConfirm,
  onCancel,
}) => {
  const [numberOfContainers, setNumberOfContainers] = useState(0);
  const [cargoWeightPerContainer, setCargoWeightPerContainer] = useState<number | undefined>();
  const [containerPrice, setContainerPrice] = useState<number | undefined>();
  const [containerType, setContainerType] = useState('');

  // Initialize from existing detail
  useEffect(() => {
    if (isOpen) {
      if (existingDetail) {
        setNumberOfContainers(existingDetail.numberOfContainers || 0);
        setCargoWeightPerContainer(existingDetail.cargoWeightPerContainer);
        setContainerPrice(existingDetail.containerPrice);
        setContainerType(existingDetail.containerType || '');
      } else {
        setNumberOfContainers(0);
        setCargoWeightPerContainer(undefined);
        setContainerPrice(undefined);
        setContainerType('');
      }
    }
  }, [isOpen, existingDetail]);

  const totalTeu = numberOfContainers * teuValue;
  const totalWeight = cargoWeightPerContainer ? numberOfContainers * cargoWeightPerContainer : 0;
  const totalCost = containerPrice ? numberOfContainers * containerPrice : 0;

  const handleConfirm = () => {
    const detail: OfferContainerDetail = {
      ...(existingDetail || {}),
      containerSizeType: containerCode,
      containerType: containerType || undefined,
      numberOfContainers,
      cargoWeightPerContainer,
      containerPrice,
      teuValue,
      lineTeu: totalTeu,
    };
    onConfirm(detail);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Package2 size={18} />
            <h3 className="text-sm font-semibold">Container Details — {containerCode}</h3>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Container Size Type (readonly) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Container Size Type
            </label>
            <input
              type="text"
              value={containerCode}
              disabled
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
            />
          </div>

          {/* Container Type (dropdown) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Container Type <span className="text-gray-400">(optional)</span>
            </label>
            <select
              value={containerType}
              onChange={(e) => setContainerType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
            >
              {CONTAINER_SUB_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Number of Containers */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Number of Containers <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={numberOfContainers}
              onChange={(e) => setNumberOfContainers(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
            />
          </div>

          {/* Cargo Weight per Container */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Cargo Weight / Container (ton)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={cargoWeightPerContainer ?? ''}
              onChange={(e) =>
                setCargoWeightPerContainer(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
              placeholder="Optional"
            />
          </div>

          {/* Container Price */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Container Price (USD)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={containerPrice ?? ''}
              onChange={(e) =>
                setContainerPrice(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
              placeholder="Optional"
            />
          </div>

          {/* Summary box */}
          <div className="p-3 bg-indigo-50 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-600 font-medium">
                TEU ({numberOfContainers} × {teuValue})
              </span>
              <span className="text-lg font-bold text-indigo-700">{totalTeu.toFixed(2)}</span>
            </div>
            {totalWeight > 0 && (
              <div className="flex items-center justify-between text-xs text-indigo-500">
                <span>Total Weight</span>
                <span className="font-semibold">{totalWeight.toLocaleString()} kg</span>
              </div>
            )}
            {totalCost > 0 && (
              <div className="flex items-center justify-between text-xs text-indigo-500">
                <span>Total Cost</span>
                <span className="font-semibold">${totalCost.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerDetailsDialog;
