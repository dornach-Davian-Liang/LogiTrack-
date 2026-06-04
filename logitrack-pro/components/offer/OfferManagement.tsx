import React, { useState, useCallback } from 'react';
import { Plus, Edit, Trash2, DollarSign, Calendar, FileText, Star, Package } from 'lucide-react';
import { Offer, OfferCreatePayload } from '../../types';
import { offerApi } from '../../services/api';
import { OfferDialog } from './OfferDialog';

/**
 * OfferManagement v3 — 独立报价管理面板
 * 用于 EnquiryDetail 的 Offers 标签页外，
 * 也可作为独立管理页面使用（如后台批量管理）
 *
 * 渲染 Offer 表格列表 + 复用 OfferDialog 进行创建/编辑
 */

interface OfferManagementProps {
  enquiryId: number;
  enquiryRefNumber: string;
  cargoTypeCode: string;
  offers: Offer[];
  onOffersUpdate: () => void;
  canManage?: boolean;
}

const OFFER_TYPE_COLORS: Record<string, string> = {
  'FCL': 'bg-blue-100 text-blue-700',
  'LCL': 'bg-green-100 text-green-700',
  'AIR': 'bg-purple-100 text-purple-700',
  'BUYER-CONSOL': 'bg-orange-100 text-orange-700',
};

export const OfferManagement: React.FC<OfferManagementProps> = ({
  enquiryId,
  enquiryRefNumber,
  cargoTypeCode,
  offers,
  onOffersUpdate,
  canManage = true,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | undefined>(undefined);

  const handleAddOffer = () => {
    setEditingOffer(undefined);
    setIsDialogOpen(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setIsDialogOpen(true);
  };

  const handleDeleteOffer = async (offerId: number) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      await offerApi.delete(offerId);
      onOffersUpdate();
    } catch (error) {
      console.error('Failed to delete offer:', error);
    }
  };

  const handleSaveOffer = useCallback(async (payload: OfferCreatePayload, existingId?: number) => {
    if (existingId) {
      await offerApi.update(existingId, payload);
    } else {
      await offerApi.create(enquiryId, payload);
    }
    setIsDialogOpen(false);
    onOffersUpdate();
  }, [enquiryId, onOffersUpdate]);

  const totalContainers = (offer: Offer) =>
    (offer.priceLines || []).reduce((s, l) =>
      s + (l.containerDetails || []).reduce((cs, d) => cs + (d.numberOfContainers || 0), 0), 0);

  const totalTeu = (offer: Offer) =>
    (offer.priceLines || []).reduce((s, l) =>
      s + (l.containerDetails || []).reduce((cs, d) => cs + (d.numberOfContainers || 0) * (d.teuValue || 0), 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Offers ({offers.length})
          </h3>
        </div>
        {canManage && (
          <button
            onClick={handleAddOffer}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Offer
          </button>
        )}
      </div>

      {/* Offer Table */}
      {offers.length === 0 ? (
        <div className="bg-white shadow rounded-xl p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">No offers created yet</p>
          {canManage && (
            <button
              onClick={handleAddOffer}
              className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
            >
              Create your first offer →
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Offer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Routes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Containers</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remark</th>
                {canManage && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offers.map((offer) => {
                const ctrs = totalContainers(offer);
                const teu = totalTeu(offer);
                const isFCL = offer.offerType === 'FCL' || offer.offerType === 'BUYER-CONSOL';
                return (
                  <tr key={offer.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">#{offer.sequenceNo}</span>
                        {offer.isLatest && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${OFFER_TYPE_COLORS[offer.offerType] || 'bg-gray-100 text-gray-700'}`}>
                        {offer.offerType}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {offer.offerDate || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span>{offer.priceLines?.length || 0} line(s)</span>
                        {offer.priceLines?.length > 0 && (
                          <span className="text-xs text-gray-400" title={offer.priceLines.slice(0, 3).map(l => `${l.polName || '?'} → ${l.podName || '?'}`).join(', ')}>
                            ({offer.priceLines.slice(0, 2).map(l => l.polName || '?').join(', ')}{offer.priceLines.length > 2 ? '...' : ''})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {isFCL && ctrs > 0 ? (
                        <div className="flex items-center gap-1.5 text-indigo-600">
                          <Package className="w-3.5 h-3.5" />
                          <span>{ctrs} ctrs / {teu.toFixed(1)} TEU</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[180px]" title={offer.remark || ''}>
                      {offer.remark || '—'}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEditOffer(offer)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Offer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer.id!)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Offer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* OfferDialog v3 */}
      <OfferDialog
        enquiryId={enquiryId}
        enquiryRefNumber={enquiryRefNumber}
        cargoTypeCode={cargoTypeCode}
        existingOffer={editingOffer}
        offersCount={offers.length}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveOffer}
      />
    </div>
  );
};

export default OfferManagement;
