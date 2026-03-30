// ============================================================
// StatusChangeDialog — v3 状态变更弹窗
// New → Quoted & Pending → Secured / Lost / Cancelled
// Lost / Cancelled 需要选择原因 + 可选自由文本
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  EnquiryStatus,
  CancelledReasonDict,
  LostReasonDict,
  StatusChangePayload,
} from '../../types';
import { masterDataApi, enquiryApi } from '../../services/api';

interface StatusChangeDialogProps {
  isOpen: boolean;
  enquiryId: number;
  currentStatus: EnquiryStatus;
  onClose: () => void;
  onStatusChanged: (newStatus: EnquiryStatus) => void;
}

/** Allowed transitions from each status */
const ALLOWED_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  'New': ['Quoted & Pending', 'Cancelled'],
  'Quoted & Pending': ['Secured', 'Lost', 'Cancelled'],
  'Secured': ['Lost', 'Cancelled'],
  'Lost': ['New', 'Quoted & Pending', 'Cancelled'],
  'Cancelled': ['New', 'Quoted & Pending'],
};

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  'New': 'New',
  'Quoted & Pending': 'Quoted & Pending',
  'Secured': 'Secured',
  'Lost': 'Lost',
  'Cancelled': 'Cancelled',
};

const STATUS_ICON_COLORS: Record<EnquiryStatus, string> = {
  'New': 'text-blue-500',
  'Quoted & Pending': 'text-amber-500',
  'Secured': 'text-emerald-500',
  'Lost': 'text-red-500',
  'Cancelled': 'text-gray-500',
};

const STATUS_BG_COLORS: Record<EnquiryStatus, string> = {
  'New': 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  'Quoted & Pending': 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  'Secured': 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  'Lost': 'bg-red-50 border-red-200 hover:bg-red-100',
  'Cancelled': 'bg-gray-50 border-gray-200 hover:bg-gray-100',
};

export const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  isOpen,
  enquiryId,
  currentStatus,
  onClose,
  onStatusChanged,
}) => {
  const [targetStatus, setTargetStatus] = useState<EnquiryStatus | null>(null);
  const [reason, setReason] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [cancelledReasons, setCancelledReasons] = useState<CancelledReasonDict[]>([]);
  const [lostReasons, setLostReasons] = useState<LostReasonDict[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load reason dictionaries
  useEffect(() => {
    if (isOpen) {
      masterDataApi.getCancelledReasons().then(setCancelledReasons).catch(() => {});
      masterDataApi.getLostReasons().then(setLostReasons).catch(() => {});
      // Reset state
      setTargetStatus(null);
      setReason('');
      setReasonText('');
      setError('');
    }
  }, [isOpen]);

  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || [];
  const needsReason = targetStatus === 'Lost' || targetStatus === 'Cancelled';
  const reasonList = targetStatus === 'Lost' ? lostReasons : cancelledReasons;
  const isOthers = reason === 'OTHERS' || reason === 'Others';

  const handleSubmit = async () => {
    if (!targetStatus) return;

    // Validate reason for Lost/Cancelled
    if (needsReason && !reason) {
      setError(`Please select a reason for "${targetStatus}"`);
      return;
    }
    if (needsReason && isOthers && !reasonText.trim()) {
      setError('Please provide details for "Others" reason');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload: StatusChangePayload = {
        status: targetStatus,
        reason: needsReason ? reason : undefined,
        reasonText: needsReason && reasonText.trim() ? reasonText.trim() : undefined,
      };
      await enquiryApi.changeStatus(enquiryId, payload);
      onStatusChanged(targetStatus);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to change status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Change Enquiry Status</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current status */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">Current:</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_BG_COLORS[currentStatus]}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${STATUS_ICON_COLORS[currentStatus].replace('text-', 'bg-')}`} />
              {STATUS_LABEL[currentStatus]}
            </span>
          </div>

          {/* No transitions available */}
          {allowedTargets.length === 0 && (
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg text-gray-600">
              <AlertTriangle size={18} />
              <span>This enquiry is in a terminal state and cannot be changed.</span>
            </div>
          )}

          {/* Target status selection */}
          {allowedTargets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Move to:</label>
              <div className="grid gap-2">
                {allowedTargets.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setTargetStatus(s); setReason(''); setReasonText(''); setError(''); }}
                    className={`flex items-center px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      targetStatus === s
                        ? 'ring-2 ring-indigo-400 border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full mr-3 ${STATUS_ICON_COLORS[s].replace('text-', 'bg-')}`} />
                    <span className="font-medium text-gray-800">{STATUS_LABEL[s]}</span>
                    {targetStatus === s && (
                      <CheckCircle size={18} className="ml-auto text-indigo-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reason dropdown (Lost / Cancelled only) */}
          {needsReason && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setError(''); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                >
                  <option value="">-- Select reason --</option>
                  {reasonList.map((r) => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Free-text for "Others" or optional supplementary text */}
              {(isOthers || reason) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isOthers ? 'Please specify' : 'Additional details'}{' '}
                    {isOthers && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={reasonText}
                    onChange={(e) => { setReasonText(e.target.value); setError(''); }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    placeholder={isOthers ? 'Please describe the reason...' : 'Optional notes'}
                  />
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            {allowedTargets.length > 0 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!targetStatus || isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    Updating...
                  </>
                ) : (
                  'Confirm Change'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusChangeDialog;
