import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { 
  Enquiry, 
  ContainerLine, 
  SalesPic, 
  Port, 
  Country, 
  ContainerType,
  SelectOption,
  SalesPicSelectOption,
  PortSelectOption,
  ContainerTypeSelectOption,
} from '../../types';
import { enquiryApi, masterDataApi } from '../../services/api';

interface EnquiryFormProps {
  initialData?: Partial<Enquiry> | null;
  onSubmit: (enquiry: Enquiry) => void;
  onCancel: () => void;
}

// Extended form data type with all form fields
interface FormData extends Partial<Enquiry> {
  cargoType?: string;
  receivedDate?: string;
  salesCountry?: string;
  customerCompanyName?: string;
  customerContactPerson?: string;
  customerPhone?: string;
  customerEmail?: string;
  assignedCnOffices?: string;
}

export const EnquiryForm: React.FC<EnquiryFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<FormData>({
    status: 'New',
    receivedDate: new Date().toISOString().split('T')[0],
    issueDate: new Date().toISOString().split('T')[0],
    cargoType: 'FCL',
    cargoTypeCode: 'FCL',
    containerLines: [],
    bookingConfirmed: 'Pending',
    ...initialData,
  });

  const [countries, setCountries] = useState<SelectOption[]>([]);
  const [salesPics, setSalesPics] = useState<SalesPicSelectOption[]>([]);
  const [ports, setPorts] = useState<PortSelectOption[]>([]);
  const [products, setProducts] = useState<SelectOption[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, string>>({});
  const [containerTypes, setContainerTypes] = useState<ContainerTypeSelectOption[]>([]);
  const [cnOffices, setCnOffices] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const [countriesData, productsData, containerTypesData, cnOfficesData] = await Promise.all([
        masterDataApi.getSalesCountries(),
        masterDataApi.getProducts(),
        masterDataApi.getContainerTypes(),
        masterDataApi.getCnOffices(),
      ]);
      setCountries(countriesData);
      // Map products to select options and keep abbr map for reference number generation server-side
      setProducts(productsData.map(p => ({ value: p.code, label: p.name })));
      const pm: Record<string, string> = {};
      productsData.forEach(p => { pm[p.code] = p.abbr; });
      setProductsMap(pm);
      setContainerTypes(containerTypesData);
      setCnOffices(cnOfficesData);
      // Load initial ports (SEA by default)
      const portsData = await masterDataApi.searchPorts('SEA', '');
      setPorts(portsData);
    } catch (error) {
      console.error('Failed to load master data:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle country change - load sales pics for that country
  const handleCountryChange = async (countryCode: string) => {
    setFormData(prev => ({
      ...prev,
      salesCountryCode: countryCode,
      salesPicId: undefined,
      salesPicName: undefined,
      salesOfficeId: undefined,
      salesOfficeName: undefined,
    }));

    if (countryCode) {
      try {
        const pics = await masterDataApi.getSalesPicsByCountry(countryCode);
        setSalesPics(pics);
      } catch (error) {
        console.error('Failed to load sales pics:', error);
        setSalesPics([]);
      }
    } else {
      setSalesPics([]);
    }
  };

  const handleSalesPicChange = (salesPicId: number) => {
    const selectedPic = salesPics.find(p => Number(p.value) === salesPicId);
    if (selectedPic) {
      setFormData(prev => ({
        ...prev,
        salesPicId,
        salesPicName: selectedPic.label,
        salesOfficeId: selectedPic.officeId,
        salesOfficeName: selectedPic.officeName,
        salesOfficeCode: selectedPic.officeCode,
      }));
    }
  };

  const addContainerLine = () => {
    const firstType = containerTypes[0];
    const newLine: ContainerLine = {
      id: Date.now(),
      enquiryId: formData.id || 0,
      containerTypeId: firstType ? Number(firstType.value) : 1,
      containerTypeCode: '20GP',
      quantity: 1,
      teuValue: firstType?.teuValue || 1,
      lineTeu: firstType?.teuValue || 1,
    };
    setFormData(prev => ({
      ...prev,
      containerLines: [...(prev.containerLines || []), newLine],
    }));
  };

  const updateContainerLine = (index: number, field: keyof ContainerLine, value: any) => {
    const lines = [...(formData.containerLines || [])];
    lines[index] = { ...lines[index], [field]: value };

    // Auto-calculate TEU
    if (field === 'containerTypeId' || field === 'quantity') {
      const containerType = containerTypes.find(ct => Number(ct.value) === lines[index].containerTypeId);
      if (containerType) {
        lines[index].teuValue = containerType.teuValue;
        lines[index].lineTeu = (lines[index].quantity || 0) * containerType.teuValue;
      }
    }

    setFormData(prev => ({ ...prev, containerLines: lines }));
  };

  const removeContainerLine = (index: number) => {
    setFormData(prev => ({
      ...prev,
      containerLines: (prev.containerLines || []).filter((_, i) => i !== index),
    }));
  };

  const calculateTotalTeu = () => {
    return (formData.containerLines || []).reduce((sum, line) => sum + (line.lineTeu || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Build payload mapped to backend/DB field names (EnquiryFormData)
      const payload: any = {
        enquiryReceivedDate: formData.receivedDate,
        issueDate: formData.issueDate,
        productCode: formData.productCode,
        status: formData.status,

        cnPricingAdmin: formData.cnPricingAdmin,
        salesCountryCode: formData.salesCountryCode,
        salesPicId: formData.salesPicId,
        salesOfficeId: formData.salesOfficeId,
        assignedCnOfficeCode: formData.assignedCnOfficeCode,

        cargoTypeCode: formData.cargoTypeCode || formData.cargoType,
        volumeCbm: formData.volumeCbm,
        quantity: formData.quantity,
        quantityUomCode: formData.quantityUomCode,
        commodity: formData.commodity,
        hazSpecialEquipment: formData.hazSpecialEquipment,

        polId: formData.polId,
        podId: formData.podId,

        coreFlag: formData.coreFlag,
        categoryCode: formData.categoryCode,
        cargoReadyDate: formData.cargoReadyDate,
        cargoReadyDateRawText: formData.cargoReadyDateRawText,

        additionalRequirement: formData.additionalRequirement,
        bookingConfirmed: formData.bookingConfirmed || 'Pending',
        remark: formData.remark,
        rejectedReason: formData.rejectedReason,
        actualReason: formData.actualReason,
      };

      // Map container lines to backend-friendly fields
      if (formData.containerLines && formData.containerLines.length) {
        payload.containerLines = formData.containerLines.map((line: any) => ({
          containerTypeId: line.containerTypeId,
          // both legacy & normalized names
          quantity: line.quantity || line.containerQty || 1,
          containerQty: line.quantity || line.containerQty || 1,
          teuValue: line.teuValue || line.teuPerUnit,
          lineTeu: line.lineTeu || line.teuTotal || ((line.quantity || 0) * (line.teuValue || 0)),
        }));
      }

      // Product abbr is resolved server-side; front-end only sends productCode
      onSubmit(payload as Enquiry);
    } catch (error) {
      console.error('Failed to save enquiry:', error);
      alert('Failed to save enquiry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {formData.id ? 'Edit Enquiry' : 'New Enquiry'}
          </h2>
          <p className="text-sm text-gray-500">Fill in the details below to create a new logistics record.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Enquiry'}
          </button>
        </div>
      </div>

      {/* General Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center text-indigo-600 font-bold mr-3">1</span>
          General Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reference Number *</label>
            <input
              type="text"
              value={formData.referenceNumber || 'Auto-generated'}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Product *</label>
            <select
              value={formData.productCode || ''}
              onChange={(e) => handleChange('productCode', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Product</option>
              {products.map(p => (
                <option key={String(p.value)} value={String(p.value)}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cargo Type *</label>
            <select
              value={formData.cargoTypeCode || formData.cargoType}
              onChange={(e) => handleChange('cargoTypeCode', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="AIR">AIR</option>
              <option value="FCL">FCL</option>
              <option value="LCL">LCL</option>
              <option value="RAIL">RAIL</option>
              <option value="SEA">SEA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="New">New</option>
              <option value="Quoted">Quoted</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Received Date *</label>
            <input
              type="date"
              value={formData.receivedDate}
              onChange={(e) => handleChange('receivedDate', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Issue Date *</label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => handleChange('issueDate', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Sales & Assignment */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center text-indigo-600 font-bold mr-3">2</span>
          Sales & Assignment
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sales Country *</label>
            <select
              value={formData.salesCountryCode || ''}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Country</option>
              {countries.map(country => (
                <option key={String(country.value)} value={String(country.value)}>{country.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sales PIC *</label>
            <select
              value={formData.salesPicId || ''}
              onChange={(e) => handleSalesPicChange(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              disabled={!formData.salesCountryCode}
            >
              <option value="">Select Sales PIC</option>
              {salesPics.map(pic => (
                <option key={String(pic.value)} value={Number(pic.value)}>{pic.label} - {pic.officeName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sales Office</label>
            <input
              type="text"
              value={formData.salesOfficeName || ''}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              placeholder="Auto-filled from Sales PIC"
            />
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center text-indigo-600 font-bold mr-3">3</span>
          Customer Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              value={formData.customerCompanyName || ''}
              onChange={(e) => handleChange('customerCompanyName', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Person</label>
            <input
              type="text"
              value={formData.customerContactPerson || ''}
              onChange={(e) => handleChange('customerContactPerson', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={formData.customerPhone || ''}
              onChange={(e) => handleChange('customerPhone', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.customerEmail || ''}
              onChange={(e) => handleChange('customerEmail', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Container Lines */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center text-indigo-600 font-bold mr-3">4</span>
            Container Details
          </h3>
          <button
            type="button"
            onClick={addContainerLine}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Container
          </button>
        </div>

        {(formData.containerLines || []).length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <p>No containers added yet. Click "Add Container" to start.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(formData.containerLines || []).map((line, index) => (
              <div key={line.id} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <select
                    value={line.containerTypeId}
                    onChange={(e) => updateContainerLine(index, 'containerTypeId', Number(e.target.value))}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    {containerTypes.map(ct => (
                      <option key={String(ct.value)} value={Number(ct.value)}>{ct.label} ({ct.teuValue} TEU)</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={line.quantity || 1}
                    onChange={(e) => updateContainerLine(index, 'quantity', Number(e.target.value))}
                    min="1"
                    placeholder="Quantity"
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />

                  <input
                    type="number"
                    value={line.teuValue || 0}
                    disabled
                    className="rounded-md border-gray-300 bg-gray-100 shadow-sm"
                    placeholder="TEU per unit"
                  />

                  <input
                    type="number"
                    value={line.lineTeu || 0}
                    disabled
                    className="rounded-md border-gray-300 bg-gray-100 shadow-sm font-semibold"
                    placeholder="Total TEU"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeContainerLine(index)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="flex justify-end text-sm font-medium text-gray-700 pt-2 border-t">
              <span>Total TEU: <span className="text-indigo-600 text-lg font-bold">{calculateTotalTeu().toFixed(2)}</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Route Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center text-indigo-600 font-bold mr-3">5</span>
          Route Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Port of Loading (POL) *</label>
            <select
              value={formData.polId || ''}
              onChange={(e) => {
                const port = ports.find(p => Number(p.value) === Number(e.target.value));
                handleChange('polId', Number(e.target.value));
                handleChange('polName', port?.label);
                handleChange('polCode', port?.portCode);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select POL</option>
              {ports
                .filter(p => formData.cargoType === 'AIR' ? p.portType === 'AIR' : p.portType === 'SEA')
                .map(port => (
                  <option key={String(port.value)} value={Number(port.value)}>{port.label}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Port of Discharge (POD) *</label>
            <select
              value={formData.podId || ''}
              onChange={(e) => {
                const port = ports.find(p => Number(p.value) === Number(e.target.value));
                handleChange('podId', Number(e.target.value));
                handleChange('podName', port?.label);
                handleChange('podCode', port?.portCode);
                handleChange('podCountryCode', port?.countryCode);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select POD</option>
              {ports
                .filter(p => formData.cargoType === 'AIR' ? p.portType === 'AIR' : p.portType === 'SEA')
                .map(port => (
                  <option key={String(port.value)} value={Number(port.value)}>{port.label}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cargo Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center text-indigo-600 font-bold mr-3">6</span>
          Cargo Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Volume (CBM)</label>
            <input
              type="number"
              step="0.01"
              value={formData.volumeCbm || ''}
              onChange={(e) => handleChange('volumeCbm', e.target.value ? Number(e.target.value) : null)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 120.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              step="0.01"
              value={formData.quantity || ''}
              onChange={(e) => handleChange('quantity', e.target.value ? Number(e.target.value) : null)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <select
              value={formData.quantityUomCode || ''}
              onChange={(e) => handleChange('quantityUomCode', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Unit</option>
              <option value="KG">KG</option>
              <option value="PCS">PCS</option>
              <option value="CTN">CTN</option>
              <option value="PLT">PLT</option>
              <option value="SET">SET</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Commodity / Goods Description</label>
          <textarea
            value={formData.commodity || ''}
            onChange={(e) => handleChange('commodity', e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Describe the goods being shipped..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Hazardous / Special Equipment</label>
          <textarea
            value={formData.hazSpecialEquipment || ''}
            onChange={(e) => handleChange('hazSpecialEquipment', e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="DG class, UN number, special equipment requirements..."
          />
        </div>
      </div>

      {/* Business Classification */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center text-indigo-600 font-bold mr-3">7</span>
          Business Classification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">CORE / NON-CORE</label>
            <select
              value={formData.coreFlag || ''}
              onChange={(e) => handleChange('coreFlag', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select...</option>
              <option value="CORE">CORE</option>
              <option value="NON_CORE">NON-CORE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={formData.categoryCode || ''}
              onChange={(e) => handleChange('categoryCode', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Category</option>
              <option value="OCEAN_FREIGHT">Ocean Freight</option>
              <option value="AIR_FREIGHT">Air Freight</option>
              <option value="RAIL_FREIGHT">Rail Freight</option>
              <option value="MULTIMODAL">Multimodal</option>
              <option value="PROJECT">Project Cargo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Assigned CN Office *</label>
            <select
              value={formData.assignedCnOfficeCode || ''}
              onChange={(e) => handleChange('assignedCnOfficeCode', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Office</option>
              {cnOffices.map(office => (
                <option key={String(office.value)} value={String(office.value)}>{office.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cargo Ready Date</label>
            <input
              type="date"
              value={formData.cargoReadyDate || ''}
              onChange={(e) => handleChange('cargoReadyDate', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Or Cargo Ready Text (TBA/Week...)</label>
            <input
              type="text"
              value={formData.cargoReadyDateRawText || ''}
              onChange={(e) => handleChange('cargoReadyDateRawText', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., TBA, Week 5, End of Feb"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center text-indigo-600 font-bold mr-3">8</span>
          Additional Information
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700">Additional Requirement</label>
          <textarea
            value={formData.additionalRequirement || ''}
            onChange={(e) => handleChange('additionalRequirement', e.target.value)}
            rows={3}
            maxLength={2000}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Special requirements, delivery instructions, etc."
          />
          <p className="mt-1 text-xs text-gray-500">Max 2000 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Remark</label>
          <textarea
            value={formData.remark || ''}
            onChange={(e) => handleChange('remark', e.target.value)}
            rows={3}
            maxLength={2000}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Internal notes or remarks..."
          />
        </div>
      </div>

      {/* Status & Result (Show when editing) */}
      {formData.id && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center text-indigo-600 font-bold mr-3">9</span>
            Status & Result
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Booking Confirmed</label>
              <select
                value={formData.bookingConfirmed || 'Pending'}
                onChange={(e) => handleChange('bookingConfirmed', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="Pending">Pending</option>
                <option value="Yes">Yes</option>
                <option value="Rejected">Rejected</option>
                <option value="Invalid">Invalid</option>
              </select>
            </div>
          </div>

          {formData.bookingConfirmed === 'Rejected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Rejected Reason</label>
              <textarea
                value={formData.rejectedReason || ''}
                onChange={(e) => handleChange('rejectedReason', e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Reason for rejection..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Actual Reason</label>
            <textarea
              value={formData.actualReason || ''}
              onChange={(e) => handleChange('actualReason', e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Actual reason for booking status..."
            />
          </div>
        </div>
      )}
    </form>
  );
};

export default EnquiryForm;
