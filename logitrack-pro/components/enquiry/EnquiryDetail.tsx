import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Plus, Package, Ship, User, Calendar, FileText, DollarSign, RefreshCw } from 'lucide-react';
import { Enquiry, Offer, OfferCreatePayload, ContainerTypeSelectOption, SalesPicSelectOption, Port, SelectOption, SalesOffice, OfferPriceLine, OfferContainerDetail } from '../../types';
import { enquiryApi, offerApi, masterDataApi } from '../../services/api';
import OfferDialog from '../offer/OfferDialog';
import StatusChangeDialog from './StatusChangeDialog';

interface EnquiryDetailProps {
  enquiryId: number;
  onBack: () => void;
  onEdit: (enquiry: Enquiry) => void;
  canManage: boolean;
}

type TabType = 'basic' | 'cargo' | 'route' | 'offers';

export const EnquiryDetail: React.FC<EnquiryDetailProps> = ({ enquiryId, onBack, onEdit, canManage }) => {
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | undefined>(undefined);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
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

      const polIds = enquiryData.polIds ?? [];
      const podIds = enquiryData.podIds ?? [];

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

  const handleSaveOffer = async (payload: OfferCreatePayload, existingId?: number) => {
    try {
      if (existingId) {
        await offerApi.update(existingId, payload);
      } else {
        await offerApi.create(enquiryId, payload);
      }
      await loadData();
    } catch (error) {
      console.error('Failed to save offer:', error);
      throw error;
    }
  };

  const handleDeleteOffer = async (offerId: number) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      await offerApi.delete(offerId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete offer:', error);
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

  // containerLines removed in v3 (now in Offer priceLines)
  const calculateTotalTeu = () => {
    return 0;
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
      case 'Quoted & Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Secured': return 'bg-green-100 text-green-800';
      case 'Lost': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
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
                  <h1 className="text-3xl font-bold text-white tracking-tight">{enquiry.refNumber}</h1>
                  <p className="text-indigo-100 mt-1 text-sm font-medium">Enquiry Details & Management</p>
                </div>
              </div>
              {canManage && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsStatusDialogOpen(true)}
                    className="inline-flex items-center px-5 py-2.5 bg-white/20 text-white border border-white/40 shadow-lg text-sm font-semibold rounded-xl hover:bg-white/30 transition-all duration-200 hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Change Status
                  </button>
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
              {/* bookingConfirmed removed in v3 */}
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
                {/* cnPricingAdmin removed in v3 */}
                <div className="bg-gradient-to-br from-teal-50 to-green-50 p-5 rounded-xl border border-teal-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2">Assigned CN Office</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.assignedCnOffice || '-'}</dd>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-red-50 p-5 rounded-xl border border-rose-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Core Flag</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.coreNonCore || '-'}</dd>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-5 rounded-xl border border-violet-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2">Category</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.category || '-'}</dd>
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
                  <dd className="text-lg font-bold text-gray-900">{enquiry.quantity || '-'} {enquiry.uom || ''}</dd>
                </div>
                {/* quantityTeu removed in v3 — TEU now computed from Offer priceLines */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Cargo Ready Date</dt>
                  <dd className="text-lg font-bold text-gray-900">{enquiry.cargoReadyDate || '-'}</dd>
                </div>
                {/* Contains Oversized Cargo indicator */}
                {enquiry.isOversizeCargo && (
                  <div className="col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-200 hover:shadow-md transition-shadow duration-200">
                    <dt className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Oversized Cargo</dt>
                    <dd className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        ⚠️ Contains Oversized Cargo
                      </span>
                    </dd>
                  </div>
                )}
                <div className="col-span-2 bg-gradient-to-br from-red-50 to-rose-50 p-5 rounded-xl border border-red-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Hazardous/Special Equipment</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{enquiry.hazardousSpecialEquipment || '-'}</dd>
                </div>
                <div className="col-span-2 bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border border-yellow-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-2">Additional Requirements</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{enquiry.cargoReadyDateDetails || '-'}</dd>
                </div>
                <div className="col-span-2 bg-gradient-to-br from-slate-50 to-gray-50 p-5 rounded-xl border border-slate-100 hover:shadow-md transition-shadow duration-200">
                  <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Remark</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{enquiry.remark || '-'}</dd>
                </div>

                {/* Container Information */}
                {enquiry.containerRows && enquiry.containerRows.length > 0 && (
                  <div className="col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl border border-indigo-200 hover:shadow-md transition-shadow duration-200">
                    <dt className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-3">Container Information</dt>
                    <dd>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-indigo-100/60">
                              <th className="border border-indigo-200 px-3 py-1.5 text-center font-semibold text-indigo-700">20'GP</th>
                              <th className="border border-indigo-200 px-3 py-1.5 text-center font-semibold text-indigo-700">Wt(KG)</th>
                              <th className="border border-indigo-200 px-3 py-1.5 text-center font-semibold text-indigo-700">40'GP</th>
                              <th className="border border-indigo-200 px-3 py-1.5 text-center font-semibold text-indigo-700">40'HQ</th>
                              <th className="border border-indigo-200 px-3 py-1.5 text-center font-semibold text-indigo-700">45'HQ</th>
                              {/* Dynamic extra container columns (with Wt for 20-foot types) */}
                              {enquiry.containerRows.some((r: any) => r.extraContainers && Object.keys(r.extraContainers).length > 0) &&
                                Object.keys(enquiry.containerRows[0]?.extraContainers || {}).map((code: string) => (
                                  <React.Fragment key={code}>
                                    <th className="border border-indigo-200 px-3 py-1.5 text-center font-semibold text-orange-700">{code}</th>
                                    {code.startsWith('20') && (
                                      <th className="border border-indigo-200 px-3 py-1.5 text-center font-semibold text-orange-700">Wt(KG)</th>
                                    )}
                                  </React.Fragment>
                                ))
                              }
                              <th className="border border-indigo-200 px-3 py-1.5 text-center font-semibold text-indigo-700">Total TEU</th>
                            </tr>
                          </thead>
                          <tbody>
                            {enquiry.containerRows.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-indigo-50/40">
                                <td className="border border-indigo-200 px-3 py-1.5 text-center font-medium text-gray-800 tabular-nums">{row.qty20 || 0}</td>
                                <td className="border border-indigo-200 px-3 py-1.5 text-center text-gray-700 tabular-nums">{row.weight20 != null ? Number(row.weight20).toLocaleString() : '-'}</td>
                                <td className="border border-indigo-200 px-3 py-1.5 text-center font-medium text-gray-800 tabular-nums">{row.qty40 || 0}</td>
                                <td className="border border-indigo-200 px-3 py-1.5 text-center font-medium text-gray-800 tabular-nums">{row.qty40hq || 0}</td>
                                <td className="border border-indigo-200 px-3 py-1.5 text-center font-medium text-gray-800 tabular-nums">{row.qty45 || 0}</td>
                                {/* Dynamic extra container values (with Wt for 20-foot types) */}
                                {row.extraContainers && Object.keys(row.extraContainers).length > 0 &&
                                  Object.entries(row.extraContainers).map(([code, qty]: [string, any]) => (
                                    <React.Fragment key={code}>
                                      <td className="border border-indigo-200 px-3 py-1.5 text-center font-medium text-orange-700 tabular-nums">{qty || 0}</td>
                                      {code.startsWith('20') && (
                                        <td className="border border-indigo-200 px-3 py-1.5 text-center text-orange-700 tabular-nums">
                                          {row.extraContainerWeights?.[code] != null ? Number(row.extraContainerWeights[code]).toLocaleString() : '-'}
                                        </td>
                                      )}
                                    </React.Fragment>
                                  ))
                                }
                                <td className="border border-indigo-200 px-3 py-1.5 text-center font-bold text-indigo-700 tabular-nums">{row.lineTeu != null ? Number(row.lineTeu).toFixed(1) : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </dd>
                  </div>
                )}

                {/* rejectedReason / actualReason removed in v3 */}
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
                        <p className="text-xs text-gray-500">Port ID: <span className="font-mono font-semibold text-gray-700">{getPortIdList(enquiry.polIds)}</span></p>
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
                        <p className="text-xs text-gray-500">Port ID: <span className="font-mono font-semibold text-gray-700">{getPortIdList(enquiry.podIds)}</span></p>
                        <p className="text-xs text-gray-500">Country: <span className="font-semibold text-gray-700">{getCountryList(podPorts, enquiry.podCountry)}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                <div className="space-y-6">
                  {offers.map((offer, index) => {
                    const isFCL = offer.offerType === 'FCL' || offer.offerType === 'BUYER-CONSOL';
                    // Collect all unique container size codes across all price lines
                    const allSizeCodes: string[] = [];
                    (offer.priceLines || []).forEach(pl => {
                      (pl.containerDetails || []).forEach(cd => {
                        if (cd.containerSizeType && !allSizeCodes.includes(cd.containerSizeType)) {
                          allSizeCodes.push(cd.containerSizeType);
                        }
                      });
                    });
                    // Ensure default order: 20GP, 40GP, 40HQ, 45HQ first
                    const defaultOrder = ['20GP', '40GP', '40HQ', '45HQ'];
                    const sortedSizeCodes = [
                      ...defaultOrder.filter(c => allSizeCodes.includes(c)),
                      ...allSizeCodes.filter(c => !defaultOrder.includes(c)),
                    ];

                    const sizeLabel = (code: string): string => {
                      const map: Record<string, string> = {
                        '20GP': "20'", '40GP': "40'", '40HQ': "40'HQ", '45HQ': "45'",
                        '20RF': "20'RF", '40RF': "40'RF", '20OT': "20'OT", '40OT': "40'OT",
                        '20FR': "20'FR", '40FR': "40'FR",
                      };
                      return map[code] || code;
                    };

                    const getDetail = (line: OfferPriceLine, sizeCode: string): OfferContainerDetail | undefined => {
                      return (line.containerDetails || []).find(d => d.containerSizeType === sizeCode);
                    };

                    // TEU/container counts are shown in Container Information section, not here

                    return (
                    <div key={offer.id} className="bg-white border-2 border-gray-100 rounded-xl shadow-md overflow-hidden">
                      {/* Offer Header */}
                      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                        <div className="flex items-center gap-3">
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
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                            offer.offerType === 'FCL' ? 'bg-blue-100 text-blue-700' :
                            offer.offerType === 'AIR' ? 'bg-purple-100 text-purple-700' :
                            offer.offerType === 'LCL' ? 'bg-green-100 text-green-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {offer.offerType}
                          </span>
                        </div>
                        {canManage && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditOffer(offer)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                              title="Edit Offer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOffer(offer.id!)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Delete Offer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Offer Meta Info */}
                      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Date:</span>
                            <span className="font-semibold text-gray-900">{offer.offerDate || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span>{offer.priceLines?.length || 0} price line(s)</span>
                          </div>
                          {/* Currency Display */}
                          {isFCL && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-gray-500">Frg.:</span>
                                <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-xs">{offer.containerCurrency || 'USD'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-500">Local:</span>
                                <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-xs">{offer.localChargeCurrency || 'USD'}</span>
                              </div>
                            </div>
                          )}
                          {!isFCL && (offer.containerCurrency || offer.localChargeCurrency) && (
                            <div className="flex items-center gap-3">
                              {offer.containerCurrency && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-500">Currency:</span>
                                  <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-xs">{offer.containerCurrency}</span>
                                </div>
                              )}
                              {offer.localChargeCurrency && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-500">Local:</span>
                                  <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-xs">{offer.localChargeCurrency}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {offer.remark && (
                          <div className="mt-2 text-sm text-gray-600 italic">
                            <span className="text-gray-500">Remark:</span> {offer.remark}
                          </div>
                        )}
                      </div>

                      {/* Full Price Details Table */}
                      {offer.priceLines?.length > 0 && (
                        <div className="px-6 py-4">
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold text-gray-600 whitespace-nowrap">POL</th>
                                  <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold text-gray-600 whitespace-nowrap">POD</th>
                                  {/* FCL/BUYER-CONSOL: container columns */}
                                  {isFCL && sortedSizeCodes.map(code => {
                                    const is20Foot = code.startsWith('20');
                                    return (
                                      <th key={code} colSpan={is20Foot ? 3 : 2} className="border border-gray-200 px-1 py-1 text-center font-semibold text-gray-600">
                                        <div>{sizeLabel(code)}</div>
                                        <div className="flex text-[9px] text-gray-400 font-normal justify-center gap-1">
                                          <span>Price</span>
                                          <span>Qty</span>
                                          {is20Foot && <span>Wt</span>}
                                        </div>
                                      </th>
                                    );
                                  })}
                                  {/* FCL: Carrier */}
                                  {isFCL && <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-600 whitespace-nowrap">Carrier</th>}
                                  {/* LCL/AIR: Price + Min Charge */}
                                  {!isFCL && <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-600 whitespace-nowrap">Price</th>}
                                  {!isFCL && <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-600 whitespace-nowrap">Min Charge</th>}
                                  <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-600 whitespace-nowrap">Local Charge</th>
                                </tr>
                              </thead>
                              <tbody>
                                {offer.priceLines.map((pl, plIdx) => (
                                  <tr key={plIdx} className="hover:bg-blue-50/40">
                                    <td className="border border-gray-200 px-2 py-1.5 text-gray-800 whitespace-nowrap font-medium">
                                      {pl.polName || `Port#${pl.polId}`}
                                    </td>
                                    <td className="border border-gray-200 px-2 py-1.5 text-gray-800 whitespace-nowrap font-medium">
                                      {pl.podName || `Port#${pl.podId}`}
                                    </td>
                                    {/* FCL container columns: Price / Qty */}
                                    {isFCL && sortedSizeCodes.map(code => {
                                      const cd = getDetail(pl, code);
                                      const is20Foot = code.startsWith('20');
                                      return (
                                        <React.Fragment key={code}>
                                          <td className="border border-gray-200 px-1.5 py-1.5 text-right text-gray-700 tabular-nums">
                                            {cd?.containerPrice != null && cd.containerPrice > 0
                                              ? cd.containerPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                              : <span className="text-gray-300">-</span>
                                            }
                                          </td>
                                          <td className="border border-gray-200 px-1.5 py-1.5 text-center text-gray-700 tabular-nums">
                                            {cd?.numberOfContainers != null && cd.numberOfContainers > 0
                                              ? cd.numberOfContainers
                                              : <span className="text-gray-300">-</span>
                                            }
                                          </td>
                                          {is20Foot && (
                                            <td className="border border-gray-200 px-1.5 py-1.5 text-right text-gray-700 tabular-nums">
                                              {cd?.cargoWeightPerContainer != null && cd.cargoWeightPerContainer > 0
                                                ? Number(cd.cargoWeightPerContainer).toLocaleString()
                                                : <span className="text-gray-300">-</span>
                                              }
                                            </td>
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                    {/* Carrier (FCL) */}
                                    {isFCL && (
                                      <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-700">{pl.carrier || <span className="text-gray-300">-</span>}</td>
                                    )}
                                    {/* Price (LCL/AIR) */}
                                    {!isFCL && (
                                      <td className="border border-gray-200 px-2 py-1.5 text-right text-gray-700 tabular-nums">
                                        {pl.price != null && Number(pl.price) > 0
                                          ? Number(pl.price).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                          : <span className="text-gray-300">-</span>
                                        }
                                      </td>
                                    )}
                                    {/* Min Charge (LCL/AIR) */}
                                    {!isFCL && (
                                      <td className="border border-gray-200 px-2 py-1.5 text-right text-gray-700 tabular-nums">
                                        {pl.minCharge != null && Number(pl.minCharge) > 0
                                          ? Number(pl.minCharge).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                          : <span className="text-gray-300">-</span>
                                        }
                                      </td>
                                    )}
                                    {/* Local Charge */}
                                    <td className="border border-gray-200 px-2 py-1.5 text-right text-gray-700 tabular-nums">
                                      {pl.localCharge != null && Number(pl.localCharge) > 0
                                        ? Number(pl.localCharge).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                        : <span className="text-gray-300">-</span>
                                      }
                                    </td>
                                  </tr>
                                ))}
                              </tbody>

                            </table>
                          </div>
                        </div>
                      )}

                      {/* No price lines state */}
                      {(!offer.priceLines || offer.priceLines.length === 0) && (
                        <div className="px-6 py-6 text-center text-gray-400 text-sm">
                          No price details configured for this offer.
                        </div>
                      )}
                    </div>
                    );
                  })}
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
          enquiryRefNumber={enquiry.refNumber}
          cargoTypeCode={enquiry.cargoTypeCode}
          existingOffer={editingOffer}
          offersCount={offers.length}
          isOpen={isOfferDialogOpen}
          onClose={() => setIsOfferDialogOpen(false)}
          onSave={handleSaveOffer}
        />
      )}

      {/* Status Change Dialog */}
      {enquiry && (
        <StatusChangeDialog
          isOpen={isStatusDialogOpen}
          enquiryId={enquiryId}
          currentStatus={enquiry.status}
          onClose={() => setIsStatusDialogOpen(false)}
          onStatusChanged={(newStatus) => {
            setEnquiry({ ...enquiry, status: newStatus });
            setIsStatusDialogOpen(false);
          }}
        />
      )}
      </div>
    </div>
  );
};

export default EnquiryDetail;
