import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Plus, Package, Ship, User, Calendar } from 'lucide-react';
import { Enquiry, Offer } from '../../types';
import { enquiryApi, offerApi } from '../../services/api';

interface EnquiryDetailProps {
  enquiryId: number;
  onBack: () => void;
  onEdit: (enquiry: Enquiry) => void;
}

export const EnquiryDetail: React.FC<EnquiryDetailProps> = ({ enquiryId, onBack, onEdit }) => {
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [enquiryId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [enquiryData, offersData] = await Promise.all([
        enquiryApi.getById(enquiryId),
        offerApi.getByEnquiryId(enquiryId),
      ]);
      setEnquiry(enquiryData);
      setOffers(offersData);
    } catch (error) {
      console.error('Failed to load enquiry details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalTeu = () => {
    return (enquiry?.containerLines || []).reduce((sum, line) => sum + (line.lineTeu || 0), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Quoted': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Sent': return 'bg-purple-100 text-purple-800';
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Enquiry not found</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{enquiry.referenceNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">Enquiry Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(enquiry)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <span className={`px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-md ${getStatusColor(enquiry.status)}`}>
              {enquiry.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-indigo-600" />
              General Information
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Cargo Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{enquiry.cargoType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Received Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{enquiry.receivedDate}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{enquiry.issueDate}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Commodity</dt>
                <dd className="mt-1 text-sm text-gray-900">{enquiry.commodity || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Customer Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-indigo-600" />
              Customer Information
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{enquiry.customerCompanyName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                <dd className="mt-1 text-sm text-gray-900">{enquiry.customerContactPerson}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{enquiry.customerPhone || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{enquiry.customerEmail || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Route Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Ship className="w-5 h-5 mr-2 text-indigo-600" />
              Route Information
            </h2>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-sm text-gray-500">Port of Loading</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{enquiry.polName}</p>
                <p className="text-xs text-gray-500">{enquiry.polCode}</p>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="text-center flex-1">
                <p className="text-sm text-gray-500">Port of Discharge</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{enquiry.podName}</p>
                <p className="text-xs text-gray-500">{enquiry.podCode}</p>
              </div>
            </div>
          </div>

          {/* Container Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Container Details</h2>
            {(enquiry.containerLines || []).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No containers</p>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">TEU/Unit</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total TEU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(enquiry.containerLines || []).map((line, index) => (
                      <tr key={line.id || index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{line.containerTypeCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-center">{line.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-center">{line.teuValue}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-indigo-600 text-center">{line.lineTeu}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Total:</td>
                      <td className="px-4 py-3 text-sm font-bold text-indigo-600 text-center">{calculateTotalTeu().toFixed(2)} TEU</td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sales Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Sales Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">Sales Country</dt>
                <dd className="text-sm font-medium text-gray-900 mt-1">{enquiry.salesCountry}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Sales PIC</dt>
                <dd className="text-sm font-medium text-gray-900 mt-1">{enquiry.salesPicName}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Assigned Office</dt>
                <dd className="text-sm font-medium text-gray-900 mt-1">{enquiry.assignedCnOffices}</dd>
              </div>
            </dl>
          </div>

          {/* Offers Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-500">Offers ({offers.length})</h3>
              <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                <Plus className="w-4 h-4 inline mr-1" />
                New Offer
              </button>
            </div>
            {offers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No offers yet</p>
            ) : (
              <div className="space-y-2">
                {offers.map((offer) => (
                  <div key={offer.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Offer #{offer.offerSequence}</p>
                        <p className="text-xs text-gray-500">{offer.carrierName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(offer.status)}`}>
                        {offer.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-indigo-600 mt-2">${offer.totalAmount}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryDetail;
