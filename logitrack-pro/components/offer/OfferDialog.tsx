// ============================================================
// OfferDialog — v3 报价弹窗 (含 Price Details 矩阵)
//
// 组合了:
//   - 报价元数据 (类型 / 日期 / 备注)
//   - PriceDetailsTable (价格行矩阵)
//   - ContainerDetailsDialog (容器弹窗, FCL/BUYER-CONSOL)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { X, DollarSign, Calendar, FileText, Package, Wand2 } from 'lucide-react';
import {
  Offer,
  OfferType,
  OfferPriceLine,
  OfferContainerDetail,
  OfferCreatePayload,
  ContainerTypeSelectOption,
} from '../../types';
import { masterDataApi, offerApi } from '../../services/api';
import { needsContainerDetails } from '../../constants';
import { PriceDetailsTable } from './PriceDetailsTable';
import { ContainerDetailsDialog } from './ContainerDetailsDialog';

// ----------------------------------
// Props
// ----------------------------------

interface OfferDialogProps {
  enquiryId: number;
  enquiryRefNumber: string;
  cargoTypeCode: string;
  existingOffer?: Offer;
  offersCount: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (offer: OfferCreatePayload, existingId?: number) => Promise<void>;
}

// Default container column TEU values
const CONTAINER_TEU: Record<string, number> = {
  '20GP': 1.0, '40GP': 2.0, '40HQ': 2.0, '40HC': 2.0, '45HQ': 2.25,
  '20RF': 1.0, '40RF': 2.0, '20OT': 1.0, '40OT': 2.0, '20FR': 1.0, '40FR': 2.0,
};

// ----------------------------------
// Component
// ----------------------------------

export const OfferDialog: React.FC<OfferDialogProps> = ({
  enquiryId,
  enquiryRefNumber,
  cargoTypeCode,
  existingOffer,
  offersCount,
  isOpen,
  onClose,
  onSave,
}) => {
  // ---- State ----
  const [offerType, setOfferType] = useState<OfferType>('' as OfferType);
  const [offerDate, setOfferDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');
  const [priceLines, setPriceLines] = useState<OfferPriceLine[]>([]);
  const [containerTypes, setContainerTypes] = useState<ContainerTypeSelectOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Container details dialog state
  const [containerDialogOpen, setContainerDialogOpen] = useState(false);
  const [containerDialogLineIdx, setContainerDialogLineIdx] = useState(0);
  const [containerDialogCode, setContainerDialogCode] = useState('');
  const [containerDialogDetail, setContainerDialogDetail] = useState<OfferContainerDetail | undefined>();

  // ---- Determine offerType from cargoTypeCode ----
  const determineOfferType = (cargo: string): OfferType => {
    if (cargo === 'AIR') return 'AIR';
    if (cargo === 'FCL') return 'FCL';
    if (cargo === 'LCL') return 'LCL';
    return 'BUYER-CONSOL';
  };

  // ---- Load container types once ----
  useEffect(() => {
    masterDataApi.getContainerTypes().then(setContainerTypes).catch(() => {});
  }, []);

  // ---- Reset form when dialog opens ----
  useEffect(() => {
    if (isOpen) {
      if (existingOffer) {
        setOfferType(existingOffer.offerType);
        setOfferDate(existingOffer.offerDate || new Date().toISOString().split('T')[0]);
        setRemark(existingOffer.remark || '');
        setPriceLines(existingOffer.priceLines || []);
      } else {
        const ot = determineOfferType(cargoTypeCode);
        setOfferType(ot);
        setOfferDate(new Date().toISOString().split('T')[0]);
        setRemark('');
        setPriceLines([]);
        // Auto-generate price lines for new offers
        offerApi.generatePriceLines(enquiryId).then((lines) => {
          if (lines.length > 0) setPriceLines(lines);
        }).catch(() => {});
      }
      setError('');
    }
  }, [isOpen, existingOffer, cargoTypeCode, enquiryId]);

  // ---- Container dialog handlers ----
  const handleOpenContainerDialog = useCallback(
    (lineIndex: number, containerCode: string, detail?: OfferContainerDetail) => {
      setContainerDialogLineIdx(lineIndex);
      setContainerDialogCode(containerCode);
      setContainerDialogDetail(detail);
      setContainerDialogOpen(true);
    },
    []
  );

  const handleConfirmContainer = useCallback(
    (detail: OfferContainerDetail) => {
      setPriceLines((prev) => {
        return prev.map((line, i) => {
          if (i !== containerDialogLineIdx) return line;
          const existing = (line.containerDetails || []).filter(
            (d) => d.containerSizeType !== detail.containerSizeType
          );
          // Only add if numberOfContainers > 0
          const updated = detail.numberOfContainers > 0
            ? [...existing, detail]
            : existing;
          return { ...line, containerDetails: updated };
        });
      });
      setContainerDialogOpen(false);
    },
    [containerDialogLineIdx]
  );

  // ---- Filter empty price lines before saving ----
  // Keep lines that have valid port IDs or any price/container data
  const filterEmptyLines = (lines: OfferPriceLine[]): OfferPriceLine[] => {
    return lines.filter((line) => {
      // Keep if it has valid ports (from auto-generate)
      const hasValidPorts = (line.polId && line.polId > 0) || (line.podId && line.podId > 0);
      const hasPrice =
        (line.price && line.price > 0) ||
        (line.perCbm && line.perCbm > 0) ||
        (line.minCharge && line.minCharge > 0) ||
        (line.localCharge && line.localCharge > 0) ||
        line.priceText;
      const hasContainers = (line.containerDetails || []).some((d) => d.numberOfContainers > 0);
      return hasValidPorts || hasPrice || hasContainers;
    });
  };

  // ---- Auto-generate price lines from enquiry POL×POD ----
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAutoGenerate = async () => {
    if (priceLines.length > 0 && !confirm('This will replace current price lines. Continue?')) {
      return;
    }
    setIsGenerating(true);
    try {
      const generated = await offerApi.generatePriceLines(enquiryId);
      if (generated.length === 0) {
        setError('No POL/POD found on the enquiry. Please add ports first.');
      } else {
        setPriceLines(generated);
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate price lines');
    } finally {
      setIsGenerating(false);
    }
  };

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!offerType) {
      setError('Offer type is required');
      return;
    }

    setIsSaving(true);
    try {
      const filteredLines = filterEmptyLines(priceLines);

      const payload: OfferCreatePayload = {
        offerType,
        offerDate,
        cargoTypeCode,
        remark,
        sequenceNo: existingOffer?.sequenceNo || offersCount + 1,
        isLatest: true,
        priceLines: filteredLines,
      };

      await onSave(payload, existingOffer?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save offer');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isFCL = needsContainerDetails(offerType);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 max-h-[92vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <h2 className="text-lg font-semibold">
                {existingOffer ? 'Edit Offer' : 'New Offer'}
              </h2>
              <span className="text-sm text-white/70">— {enquiryRefNumber}</span>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Meta fields row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Offer Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Offer Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value as OfferType)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                  disabled={!!existingOffer}
                  required
                >
                  <option value="">Select...</option>
                  <option value="FCL">FCL</option>
                  <option value="LCL">LCL</option>
                  <option value="AIR">AIR</option>
                  <option value="BUYER-CONSOL">BUYER-CONSOL</option>
                </select>
              </div>

              {/* Sequence */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sequence</label>
                <input
                  type="text"
                  value={`#${existingOffer?.sequenceNo || offersCount + 1}`}
                  disabled
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                />
              </div>

              {/* Offer Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Offer Date
                </label>
                <input
                  type="date"
                  value={offerDate}
                  onChange={(e) => setOfferDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                />
              </div>

              {/* Cargo Type (readonly) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo Type</label>
                <input
                  type="text"
                  value={cargoTypeCode}
                  disabled
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                />
              </div>
            </div>

            {/* Remark */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <FileText className="w-3 h-3 inline mr-1" />
                Remark
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter remark for this offer..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
              />
            </div>

            {/* Price Details Section */}
            <div className="border-t border-gray-200 pt-4">
              {/* Auto-generate button */}
              {offerType && (
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Price Details</h3>
                  <button
                    type="button"
                    onClick={handleAutoGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    {isGenerating ? 'Generating...' : 'Auto-Generate from POL×POD'}
                  </button>
                </div>
              )}

              {/* Price Details Matrix Table */}
              {offerType && (
                <PriceDetailsTable
                  offerType={offerType}
                  priceLines={priceLines}
                  onChange={setPriceLines}
                  containerTypes={containerTypes}
                  onOpenContainerDialog={isFCL ? handleOpenContainerDialog : undefined}
                />
              )}

              {!offerType && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Please select an Offer Type to configure price lines.
                </div>
              )}
            </div>
          </form>

          {/* Footer (fixed) */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
            <div className="text-xs text-gray-500">
              {priceLines.length} price line{priceLines.length !== 1 ? 's' : ''} configured
              {isFCL && (
                <span className="ml-2">
                  | {priceLines.reduce((s, l) => s + (l.containerDetails || []).reduce((cs, d) => cs + (d.numberOfContainers || 0), 0), 0)} containers
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any)}
                disabled={isSaving}
                className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    Saving...
                  </>
                ) : (
                  existingOffer ? 'Update Offer' : 'Save Offer'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Container Details sub-dialog */}
      <ContainerDetailsDialog
        isOpen={containerDialogOpen}
        containerCode={containerDialogCode}
        teuValue={CONTAINER_TEU[containerDialogCode] || 1.0}
        existingDetail={containerDialogDetail}
        onConfirm={handleConfirmContainer}
        onCancel={() => setContainerDialogOpen(false)}
      />
    </>
  );
};

export default OfferDialog;
