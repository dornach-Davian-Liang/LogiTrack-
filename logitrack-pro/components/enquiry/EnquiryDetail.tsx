import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Plus, Package, Ship, User, Calendar, FileText, DollarSign } from 'lucide-react';
import { Enquiry, Offer, ContainerTypeSelectOption, SalesPicSelectOption, Port, SelectOption, SalesOffice } from '../../types';
import { enquiryApi, offerApi, masterDataApi } from '../../services/api';
import OfferDialog from '../offer/OfferDialog';

interface EnquiryDetailProps {
  enquiryId: number;
  onBack: () => void;
  onEdit: (enquiry: Enquiry) => void;
}

type TabType = 'basic' | 'cargo' | 'route' | 'containers' | 'offers';

export const EnquiryDetail: React.FC<EnquiryDetailProps> = ({ enquiryId, onBack, onEdit }) => {
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | undefined>(undefined);
  const [salesOffice, setSalesOffice] = useState<SalesOffice | null>(null);
  const [salesPic, setSalesPic] = useState<SalesPicSelectOption | null>(null);
  const [polPorts, setPolPorts] = useState<Port[]>([]);
  const [podPorts, setPodPorts] = useState<Port[]>([]);
  const [countries, setCountries] = useState<SelectOption[]>([]);
  const [containerTypes, setContainerTypes] = useState<ContainerTypeSelectOption[]>([]);

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

      const [allCountries, allContainerTypes, office, pics] = await Promise.all([
        masterDataApi.getAllCountries(),
        masterDataApi.getContainerTypes(),
        enquiryData.salesOfficeId ? masterDataApi.getSalesOfficeById(enquiryData.salesOfficeId) : Promise.resolve(null),
        enquiryData.salesCountryCode ? masterDataApi.getSalesPicsByCountry(enquiryData.salesCountryCode) : Promise.resolve([]),
      ]);

      const polIds = (enquiryData.polIds && enquiryData.polIds.length > 0)
        ? enquiryData.polIds
        : (enquiryData.polId ? [enquiryData.polId] : []);

      const podIds = (enquiryData.podIds && enquiryData.podIds.length > 0)
        ? enquiryData.podIds
        : (enquiryData.podId ? [enquiryData.podId] : []);

      const [polResults, podResults] = await Promise.all([
        Promise.all(polIds.map(id => masterDataApi.getPortById(Number(id)))),
        Promise.all(podIds.map(id => masterDataApi.getPortById(Number(id)))),
      ]);

      setCountries(allCountries || []);
      setContainerTypes(allContainerTypes || []);
      setSalesOffice(office || null);
      const matchedPic = (pics as SalesPicSelectOption[]).find(p => Number(p.value) === enquiryData.salesPicId) || null;
      setSalesPic(matchedPic);
      setPolPorts((polResults || []).filter((p): p is Port => !!p));
      setPodPorts((podResults || []).filter((p): p is Port => !!p));
    } catch (error) {
      console.error('Failed to load enquiry details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOffer = () => {
    setEditingOffer(undefined);
    setIsOfferDialogOpen(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setIsOfferDialogOpen(true);
  };

  const handleSaveOffer = async (offerData: Partial<Offer>) => {
    try {
      if (offerData.id) {
        // Update existing offer
        await offerApi.update(offerData.id, offerData);
      } else {
        // Create new offer
        await offerApi.create(offerData as any);
      }
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Failed to save offer:', error);
      throw error;
    }
  };

  const getContainerTypeMeta = (containerTypeId?: number) => {
    if (!containerTypeId) return null;
    return containerTypes.find(ct => Number(ct.value) === containerTypeId) || null;
  };

  const calculateLineTeu = (line: any) => {
    const qty = line.containerQty ?? line.quantity ?? 0;
    const meta = getContainerTypeMeta(line.containerTypeId);
    const teuPerUnit = line.teuPerUnit ?? line.teuValue ?? meta?.teuValue ?? 0;
    return line.lineTeu ?? line.teuTotal ?? (qty * teuPerUnit);
  };

  const calculateTotalTeu = () => {
    return (enquiry?.containerLines || []).reduce((sum, line) => sum + calculateLineTeu(line), 0);
  };

  const getPortDisplay = (port?: Port | null) => {
    if (!port) return '-';
    return port.portName;
  };

  const getPortDisplayList = (ports: Port[]) => {
    if (!ports || ports.length === 0) return '-';
    return ports.map(p => {
      const name = p.portName || p.portCode || String(p.id);
      // 去掉括号内的港口代码，仅显示城市名称
      return name.replace(/\s*\([^)]*\)/g, '').trim();
    }).join(', ');
  };

  const getPortIdList = (ids?: Array<string | number>) => {
    if (!ids || ids.length === 0) return '-';
    return ids.map(id => String(id)).join(', ');
  };

  const getCountryList = (ports: Port[], fallback?: string | null) => {
    const codes = ports.map(p => p.countryCode).filter(Boolean) as string[];
    if (codes.length === 0 && fallback) codes.push(fallback);
    const unique = Array.from(new Set(codes.map(c => String(c))));
    if (unique.length === 0) return '-';
    return unique.map(getCountryName).join(', ');
  };

  const getCountryName = (countryCode?: string | null) => {
    if (!countryCode) return '-';
    const match = countries.find(c => String(c.value).toUpperCase() === String(countryCode).toUpperCase());
    return match?.label || countryCode;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Quoted': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingColor = (booking: string) => {
    switch (booking) {
      case 'Yes': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
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
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{enquiry.referenceNumber}</h1>
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
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-500">Status: </span>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(enquiry.status)}`}>
              {enquiry.status}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Booking: </span>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getBookingColor(enquiry.bookingConfirmed || 'Pending')}`}>
              {enquiry.bookingConfirmed || 'Pending'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Created: </span>
            <span className="text-gray-900">{enquiry.enquiryReceivedDate || enquiry.createdAt?.split('T')[0] || '-'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('basic')}
              className={`${
                activeTab === 'basic'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('cargo')}
              className={`${
                activeTab === 'cargo'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Package className="w-4 h-4 mr-2" />
              Cargo Details
            </button>
            <button
              onClick={() => setActiveTab('route')}
              className={`${
                activeTab === 'route'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Ship className="w-4 h-4 mr-2" />
              Route Info
            </button>
            <button
              onClick={() => setActiveTab('containers')}
              className={`${
                activeTab === 'containers'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Package className="w-4 h-4 mr-2" />
              Container Lines
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`${
                activeTab === 'offers'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Offers ({offers.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Product Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.productCode} ({enquiry.productAbbr})</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sales Country</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.salesCountryCode}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sales Office</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {salesOffice ? `${salesOffice.name} (${salesOffice.code})` : (enquiry.salesOfficeName || '-')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sales PIC</dt>
                  <dd className="mt-1 text-sm text-gray-900">{salesPic?.label || enquiry.salesPicName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">CN Pricing Admin</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.cnPricingAdmin}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Assigned CN Office</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.assignedCnOfficeCode}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Core Flag</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.coreFlag || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.categoryCode || '-'}</dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'cargo' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Cargo Details</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cargo Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.cargoTypeCode}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Commodity</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.commodity || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Volume (CBM)</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.volumeCbm || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.quantity || '-'} {enquiry.quantityUomCode || ''}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total TEU</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.quantityTeu || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cargo Ready Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enquiry.cargoReadyDate || '-'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Hazardous/Special Equipment</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{enquiry.hazSpecialEquipment || '-'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Additional Requirements</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{enquiry.additionalRequirement || '-'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Remark</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{enquiry.remark || '-'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Rejected Reason</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{enquiry.rejectedReason || '-'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Actual Reason</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{enquiry.actualReason || '-'}</dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'route' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Route Information</h3>
              <div className="flex items-center justify-between py-8">
                <div className="text-center flex-1">
                  <div className="inline-block p-3 bg-indigo-100 rounded-full mb-3">
                    <Ship className="w-8 h-8 text-indigo-600" />
                  </div>
                  <p className="text-sm text-gray-500">Port of Loading</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {getPortDisplayList(polPorts)}
                  </p>
                  <p className="text-xs text-gray-500">ID: {getPortIdList(enquiry.polIds?.length ? enquiry.polIds : (enquiry.polId ? [enquiry.polId] : []))}</p>
                </div>
                <div className="text-4xl text-gray-400">→</div>
                <div className="text-center flex-1">
                  <div className="inline-block p-3 bg-green-100 rounded-full mb-3">
                    <Ship className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-500">Port of Discharge</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {getPortDisplayList(podPorts)}
                  </p>
                  <p className="text-xs text-gray-500">ID: {getPortIdList(enquiry.podIds?.length ? enquiry.podIds : (enquiry.podId ? [enquiry.podId] : []))}</p>
                  <p className="text-xs text-gray-500 mt-1">Country: {getCountryList(podPorts, enquiry.podCountryCode)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'containers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Container Lines</h3>
                <span className="text-sm text-gray-500">
                  Total: {calculateTotalTeu().toFixed(2)} TEU
                </span>
              </div>
              {(enquiry.containerLines || []).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No container lines</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Container Type</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">TEU/Unit</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Line TEU</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(enquiry.containerLines || []).map((line, index) => (
                      <tr key={line.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {line.containerCode || line.containerTypeCode || getContainerTypeMeta(line.containerTypeId)?.label || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {line.containerQty || line.quantity || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {line.teuPerUnit || line.teuValue || getContainerTypeMeta(line.containerTypeId)?.teuValue || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600 text-center">
                          {calculateLineTeu(line)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-900 text-right">Total:</td>
                      <td className="px-6 py-3 text-sm font-bold text-indigo-600 text-center">
                        {calculateTotalTeu().toFixed(2)} TEU
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Offer History</h3>
                <button 
                  onClick={handleAddOffer}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Offer
                </button>
              </div>
              {offers.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No offers yet</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Add Offer" to create the first offer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer, index) => (
                    <div key={offer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              Offer #{offer.sequenceNo || index + 1}
                            </span>
                            {offer.isLatest && (
                              <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                                Latest
                              </span>
                            )}
                            {offer.isRejectedPrice && (
                              <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                                Rejected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Type: {offer.offerType} | Sent: {offer.sentDate}
                          </p>
                          <p className="text-lg font-semibold text-indigo-600 mt-2">
                            {offer.priceText || `$${offer.price}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditOffer(offer)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Offer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Offer Dialog */}
      {enquiry && (
        <OfferDialog
          enquiryId={enquiryId}
          enquiryReferenceNumber={enquiry.referenceNumber}
          cargoTypeCode={enquiry.cargoTypeCode}
          existingOffer={editingOffer}
          offersCount={offers.length}
          isOpen={isOfferDialogOpen}
          onClose={() => setIsOfferDialogOpen(false)}
          onSave={handleSaveOffer}
        />
      )}
    </div>
  );
};

export default EnquiryDetail;
