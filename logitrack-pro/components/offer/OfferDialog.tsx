import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText } from 'lucide-react';
import { Offer, OfferType } from '../../types';

interface OfferDialogProps {
  enquiryId: number;
  enquiryReferenceNumber: string;
  cargoTypeCode: string;
  existingOffer?: Offer;
  offersCount: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (offer: Partial<Offer>) => Promise<void>;
}

export const OfferDialog: React.FC<OfferDialogProps> = ({
  enquiryId,
  enquiryReferenceNumber,
  cargoTypeCode,
  existingOffer,
  offersCount,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    offerType: '' as OfferType,
    sentDate: new Date().toISOString().split('T')[0],
    price: '',
    priceText: '',
    isRejectedPrice: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // 根据 cargoTypeCode 确定 offerType
  const determineOfferType = (cargo: string): OfferType => {
    if (cargo === 'AIR') return 'AIR';
    if (cargo === 'FCL' || cargo === 'LCL') return 'OCEAN';
    return 'OTHER';
  };

  useEffect(() => {
    if (isOpen) {
      if (existingOffer) {
        // 编辑现有报价
        setFormData({
          offerType: existingOffer.offerType,
          sentDate: existingOffer.sentDate || new Date().toISOString().split('T')[0],
          price: existingOffer.price?.toString() || '',
          priceText: existingOffer.priceText || '',
          isRejectedPrice: existingOffer.isRejectedPrice || false,
        });
      } else {
        // 新增报价 - 根据 cargoTypeCode 自动设置 offerType
        const offerType = determineOfferType(cargoTypeCode);
        setFormData({
          offerType,
          sentDate: new Date().toISOString().split('T')[0],
          price: '',
          priceText: '',
          isRejectedPrice: false,
        });
      }
      setError('');
    }
  }, [isOpen, existingOffer, cargoTypeCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.offerType) {
      setError('Offer type is required');
      return;
    }

    if (!formData.price && !formData.priceText) {
      setError('Either price amount or price text is required');
      return;
    }

    setIsSaving(true);
    try {
      const offerData: Partial<Offer> = {
        id: existingOffer?.id,
        enquiryId,
        offerType: formData.offerType,
        sequenceNo: existingOffer?.sequenceNo || offersCount + 1,
        sentDate: formData.sentDate,
        price: formData.price ? parseFloat(formData.price) : undefined,
        priceText: formData.priceText,
        isRejectedPrice: formData.isRejectedPrice,
        isLatest: true, // 新报价总是标记为最新
      };

      await onSave(offerData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save offer');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center">
            <DollarSign className="w-6 h-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {existingOffer ? 'Edit Offer' : 'Add Offer'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Read-only enquiry info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Enquiry Reference:</span>
              <span className="text-sm font-medium text-gray-900">{enquiryReferenceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cargo Type:</span>
              <span className="text-sm font-medium text-gray-900">{cargoTypeCode}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-4">
            {/* Offer Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.offerType}
                onChange={(e) => setFormData({ ...formData, offerType: e.target.value as OfferType })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={!!existingOffer} // 编辑时不允许修改类型
                required
              >
                <option value="">Select offer type</option>
                <option value="OCEAN">OCEAN</option>
                <option value="AIR">AIR</option>
                <option value="OTHER">OTHER</option>
              </select>
              {!existingOffer && (
                <p className="mt-1 text-xs text-gray-500">
                  Auto-detected from cargo type: {formData.offerType}
                </p>
              )}
            </div>

            {/* Sequence Number */}
            {existingOffer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Sequence
                </label>
                <input
                  type="text"
                  value={`#${existingOffer.sequenceNo}`}
                  disabled
                  className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                />
              </div>
            )}
            {!existingOffer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Sequence
                </label>
                <input
                  type="text"
                  value={`#${offersCount + 1} (Auto-increment)`}
                  disabled
                  className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                />
              </div>
            )}

            {/* Sent Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Sent Date
              </label>
              <input
                type="date"
                value={formData.sentDate}
                onChange={(e) => setFormData({ ...formData, sentDate: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Price Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Price Amount {formData.offerType === 'OCEAN' ? '(USD)' : '(per KG)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder={formData.offerType === 'OCEAN' ? '2500.00' : '5.50'}
                  className="w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formData.offerType === 'OCEAN' && 'Total ocean freight amount (all-in)'}
                {formData.offerType === 'AIR' && 'Unit price per kilogram'}
                {formData.offerType === 'OTHER' && 'Enter price amount'}
              </p>
            </div>

            {/* Price Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Price Text / Original Quote
              </label>
              <textarea
                value={formData.priceText}
                onChange={(e) => setFormData({ ...formData, priceText: e.target.value })}
                placeholder="Ocean freight: USD 2,500 all-in&#10;Including BAF, CAF..."
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the original quote text from carrier or your formatted quote
              </p>
            </div>

            {/* Is Rejected Price */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRejectedPrice"
                checked={formData.isRejectedPrice}
                onChange={(e) => setFormData({ ...formData, isRejectedPrice: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isRejectedPrice" className="ml-2 block text-sm text-gray-900">
                Mark as rejected offer
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : existingOffer ? 'Update Offer' : 'Save Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferDialog;
