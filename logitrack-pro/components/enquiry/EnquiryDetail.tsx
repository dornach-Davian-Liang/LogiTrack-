import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Plus, Package, Ship, User, Calendar, FileText, DollarSign } from 'lucide-react';
import { Enquiry, Offer, ContainerTypeSelectOption, SalesPicSelectOption, Port, SelectOption, SalesOffice } from '../../types';
import { enquiryApi, offerApi, masterDataApi } from '../../services/api';
import OfferDialog from '../offer/OfferDialog';

interface EnquiryDetailProps {
  enquiryId: number;
  onBack: () => void;
  onEdit: (enquiry: Enquiry) => void;
  canManage: boolean;
}

type TabType = 'basic' | 'cargo' | 'route' | 'containers' | 'offers';

export const EnquiryDetail: React.FC<EnquiryDetailProps> = ({ enquiryId, onBack, onEdit, canManage }) => {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header - Enhanced Design */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 shadow-xl rounded-2xl overflow-hidden">
          <div className="px-8 py-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all duration-200 text-white hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">{enquiry.referenceNumber}</h1>
                  <p className="text-indigo-100 mt-1 text-sm font-medium">Enquiry Details & Management</p>
                </div>
              </div>
              {canManage && (
                <div className="flex gap-3">
                  <button
                    onClick={() => onEdit(enquiry)}
                    className="inline-flex items-center px-5 py-2.5 bg-white text-indigo-600 shadow-lg text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-200 hover:scale-105"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Enquiry
                  </button>
                </div>
              )}
            </div>
            
            {/* Status Bar - Enhanced */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-indigo-100 text-sm font-medium">Status:</span>
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg ${getStatusColor(enquiry.status)} shadow-sm`}>
                  {enquiry.status}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-indigo-100 text-sm font-medium">Booking:</span>
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg ${getBookingColor(enquiry.bookingConfirmed || 'Pending')} shadow-sm`}>
                  {enquiry.bookingConfirmed || 'Pending'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                <Calendar className="w-4 h-4 text-indigo-100" />
                <span className="text-indigo-100 text-sm font-medium">Created:</span>
                <span className="text-white text-sm font-semibold">{enquiry.enquiryReceivedDate || enquiry.createdAt?.split('T')[0] || '-'}</span>
              </div>
            </div>
          </div>
        </div>

      {/* Tabs - Enhanced Design */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <nav className="flex px-6 space-x-2" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('basic')}
              className={`${
                activeTab === 'basic'
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              } flex-1 py-4 px-4 border-b-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 rounded-t-lg group`}
            >
              <FileText className={`w-5 h-5 ${activeTab === 'basic' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span>Basic Info</span>
            </button>
            <button
              onClick={() => setActiveTab('cargo')}
              className={`${
                activeTab === 'cargo'
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              } flex-1 py-4 px-4 border-b-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 rounded-t-lg group`}
            >
              <Package className={`w-5 h-5 ${activeTab === 'cargo' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span>Cargo Details</span>
            </button>
            <button
              onClick={() => setActiveTab('route')}
              className={`${
                activeTab === 'route'
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              } flex-1 py-4 px-4 border-b-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 rounded-t-lg group`}
            >
              <Ship className={`w-5 h-5 ${activeTab === 'route' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span>Route Info</span>
            </button>
            <button
              onClick={() => setActiveTab('containers')}
              className={`${
                activeTab === 'containers'
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              } flex-1 py-4 px-4 border-b-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 rounded-t-lg group`}
            >
              <Package className={`w-5 h-5 ${activeTab === 'containers' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span>Container Lines</span>
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`${
                activeTab === 'offers'
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              } flex-1 py-4 px-4 border-b-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 rounded-t-lg group`}
            >
              <DollarSign className={`w-5 h-5 ${activeTab === 'offers' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span>Offers</span>
              <span className="ml-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">{offers.length}</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Basic Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Product Type</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.productCode} <span className="text-sm text-gray-600">({enquiry.productAbbr})</span></dd>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Sales Country</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.salesCountryCode}</dd>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Sales Office</dt>
                  <dd className="text-lg font-bold text-gray-900">
                    {salesOffice ? `${salesOffice.name}` : (enquiry.salesOfficeName || '-')}
                    {salesOffice && <span className="text-sm text-gray-600 block mt-1">Code: {salesOffice.code}</span>}
                  </dd>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-5 rounded-xl border border-yellow-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Sales PIC</dt>
                  <dd className="text-lg font-bold text-gray-900">{salesPic?.label || enquiry.salesPicName || '-'}</dd>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-5 rounded-xl border border-cyan-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-2">CN Pricing Admin</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.cnPricingAdmin || '-'}</dd>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-green-50 p-5 rounded-xl border border-teal-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2">Assigned CN Office</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.assignedCnOfficeCode || '-'}</dd>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-red-50 p-5 rounded-xl border border-rose-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Core Flag</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.coreFlag || '-'}</dd>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-5 rounded-xl border border-violet-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2">Category</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.categoryCode || '-'}</dd>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cargo' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Cargo Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Cargo Type</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.cargoTypeCode}</dd>
                </div>
                <div className="bg-gradient-to-br from-sky-50 to-cyan-50 p-5 rounded-xl border border-sky-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2">Commodity</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.commodity || '-'}</dd>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Volume</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.volumeCbm ? `${enquiry.volumeCbm} CBM` : '-'}</dd>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-5 rounded-xl border border-purple-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Quantity</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.quantity || '-'} {enquiry.quantityUomCode || ''}</dd>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl border border-indigo-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Total TEU</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.quantityTeu || '-'}</dd>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Cargo Ready Date</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.cargoReadyDate || '-'}</dd>
                </div>
                <div className="col-span-2 bg-gradient-to-br from-red-50 to-rose-50 p-5 rounded-xl border border-red-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Hazardous/Special Equipment</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{enquiry.hazSpecialEquipment || '-'}</dd>
                </div>
                <div className="col-span-2 bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border border-yellow-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-2">Additional Requirements</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{enquiry.additionalRequirement || '-'}</dd>
                </div>
                <div className="col-span-2 bg-gradient-to-br from-slate-50 to-gray-50 p-5 rounded-xl border border-slate-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Remark</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{enquiry.remark || '-'}</dd>
                </div>
                {enquiry.rejectedReason && (
                  <div className="col-span-2 bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-xl border-2 border-red-200 hover:shadow-md transition-shadow duration-200">
                    <dt className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Rejected Reason</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{enquiry.rejectedReason}</dd>
                  </div>
                )}
                {enquiry.actualReason && (
                  <div className="col-span-2 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-100 hover:shadow-md transition-shadow duration-200">
                    <dt className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Actual Reason</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{enquiry.actualReason}</dd>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'route' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Ship className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Route Information</h3>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between py-12">
                  {/* Port of Loading */}
                  <div className="text-center flex-1 transform hover:scale-105 transition-transform duration-200">
                    <div className="inline-block p-6 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-xl mb-4 relative">
                      <Ship className="w-12 h-12 text-white" />
                      <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-100">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Port of Loading</p>
                      <p className="text-xl font-bold text-gray-900 mb-2">
                        {getPortDisplayList(polPorts)}
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Port ID: <span className="font-mono font-semibold text-gray-700">{getPortIdList(enquiry.polIds?.length ? enquiry.polIds : (enquiry.polId ? [enquiry.polId] : []))}</span></p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="px-8">
                    <div className="relative">
                      <div className="text-6xl text-blue-400 font-light">→</div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-full opacity-20 animate-ping"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Port of Discharge */}
                  <div className="text-center flex-1 transform hover:scale-105 transition-transform duration-200">
                    <div className="inline-block p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl mb-4 relative">
                      <Ship className="w-12 h-12 text-white" />
                      <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
                      <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Port of Discharge</p>
                      <p className="text-xl font-bold text-gray-900 mb-2">
                        {getPortDisplayList(podPorts)}
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                        <p className="text-xs text-gray-500">Port ID: <span className="font-mono font-semibold text-gray-700">{getPortIdList(enquiry.podIds?.length ? enquiry.podIds : (enquiry.podId ? [enquiry.podId] : []))}</span></p>
                        <p className="text-xs text-gray-500">Country: <span className="font-semibold text-gray-700">{getCountryList(podPorts, enquiry.podCountryCode)}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'containers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Container Lines</h3>
                </div>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg">
                  <span className="text-sm font-semibold">Total TEU: </span>
                  <span className="text-2xl font-bold">{calculateTotalTeu().toFixed(2)}</span>
                </div>
              </div>
              {(enquiry.containerLines || []).length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No container lines</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Container Type</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">TEU/Unit</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Line TEU</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {(enquiry.containerLines || []).map((line, index) => (
                        <tr key={line.id || index} className="hover:bg-indigo-50/30 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                                <Package className="w-4 h-4 text-indigo-600" />
                              </div>
                              <span className="text-sm font-bold text-gray-900">
                                {line.containerCode || line.containerTypeCode || getContainerTypeMeta(line.containerTypeId)?.label || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                              {line.containerQty || line.quantity || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-semibold text-gray-600">
                              {line.teuPerUnit || line.teuValue || getContainerTypeMeta(line.containerTypeId)?.teuValue || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-base font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-lg">
                              {calculateLineTeu(line)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gradient-to-r from-indigo-600 to-purple-600">
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-sm font-bold text-white text-right">Grand Total:</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xl font-bold text-white bg-white/20 px-4 py-2 rounded-lg inline-block">
                            {calculateTotalTeu().toFixed(2)} TEU
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Offer History</h3>
                </div>
                {canManage && (
                  <button 
                    onClick={handleAddOffer}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg text-sm font-bold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Offer
                  </button>
                )}
              </div>
              {offers.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-dashed border-emerald-200">
                  <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-4">
                    <DollarSign className="h-16 w-16 text-emerald-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">No offers yet</p>
                  <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">Get started by creating your first offer for this enquiry</p>
                  {canManage && (
                    <button
                      onClick={handleAddOffer}
                      className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg text-sm font-bold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create First Offer
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {offers.map((offer, index) => (
                    <div key={offer.id} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-xl p-6 hover:shadow-xl hover:border-emerald-200 transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              Offer #{offer.sequenceNo || index + 1}
                            </span>
                            {offer.isLatest && (
                              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-sm">
                                ⭐ Latest
                              </span>
                            )}
                            {offer.isRejectedPrice && (
                              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-sm">
                                ✕ Rejected
                              </span>
                            )}
                          </div>
                          <div className="flex gap-6 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span>Type: <span className="font-semibold text-gray-900">{offer.offerType}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Sent: <span className="font-semibold text-gray-900">{offer.sentDate}</span></span>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 inline-block">
                            <p className="text-xs text-emerald-700 font-semibold mb-1 uppercase tracking-wide">Price</p>
                            <p className="text-3xl font-bold text-emerald-600">
                              {offer.priceText || `$${offer.price}`}
                            </p>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditOffer(offer)}
                              className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 hover:scale-110"
                              title="Edit Offer"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          </div>
                        )}
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
      {enquiry && canManage && (
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
    </div>
  );
};

export default EnquiryDetail;
