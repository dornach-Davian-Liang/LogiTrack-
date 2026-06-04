
import React, { useState, useEffect } from 'react';
import { EnquiryRecord } from '../types';
import { PRODUCTS, STATUSES, CATEGORIES, CORE_STATUSES, QUANTITY_UNITS, ASSIGNED_OFFICES } from '../constants';
import { Save, Calendar, User, Box, MapPin, DollarSign, CheckCircle, FileText, Info, Truck } from 'lucide-react';

interface FormProps {
  initialData?: EnquiryRecord | null;
  onSubmit: (data: EnquiryRecord) => void;
  onCancel: () => void;
}

const Form: React.FC<FormProps> = ({ initialData, onSubmit, onCancel }) => {
  const defaultData: Partial<EnquiryRecord> = {
    enquiryReceivedDate: new Date().toISOString().split('T')[0],
    enquiryCreatedDate: new Date().toISOString().split('T')[0],
    status: 'New',
    product: 'AIR',
    coreNonCore: 'Non-Core',
    category: CATEGORIES[0].code,
    quantityUnit: 'KG',
    salesCountry: '',
    salesOffice: '',
    salesPic: '',
    assignedCnOffice: '',
    cargoType: '',
    pol: '',
    pod: '',
    podCountry: '',
    volumeCbm: 0,
    quantity: 0,
    commodity: '',
  };

  const [formData, setFormData] = useState<Partial<EnquiryRecord>>(defaultData);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recordToSave = {
      ...defaultData,
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
    } as EnquiryRecord;
    
    onSubmit(recordToSave);
  };

  // Reusable Styled Components for cleaner JSX
  const SectionCard = ({ children, icon: Icon, title, description }: { children: React.ReactNode, icon: any, title: string, description?: string }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8 transition-all duration-300 hover:shadow-md">
      <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-indigo-600">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-8 sm:grid-cols-6">
        {children}
      </div>
    </div>
  );

  const InputGroup = ({ label, name, type = "text", colSpan = "sm:col-span-2", required = false, placeholder = "", options = null, step }: { label: string, name: string, type?: string, colSpan?: string, required?: boolean, placeholder?: string, options?: string[], step?: string }) => (
    <div className={colSpan}>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        {options ? (
           <div className="relative">
              <select
                name={name}
                required={required}
                className="appearance-none block w-full bg-slate-50 text-slate-700 border border-slate-200 rounded-lg py-2.5 px-4 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 ease-in-out"
                onChange={handleChange}
                // @ts-ignore
                value={formData[name] || ''}
              >
                {!options.includes('') && <option value="" disabled>Select...</option>}
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
           </div>
        ) : (
          <input
            type={type}
            name={name}
            required={required}
            step={step}
            className="block w-full bg-slate-50 text-slate-700 border border-slate-200 rounded-lg py-2.5 px-4 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 ease-in-out placeholder-slate-400"
            placeholder={placeholder}
            onChange={handleChange}
            // @ts-ignore
            value={formData[name] || ''}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-100/50 min-h-full flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-8 py-4 flex justify-between items-center">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                {initialData ? <FileText className="w-5 h-5 text-indigo-600" /> : <FileText className="w-5 h-5 text-indigo-600" />}
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {initialData ? `Edit Record ${initialData.referenceNumber}` : 'New Enquiry'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Fill in the details below to create a new logistics record.</p>
            </div>
        </div>
        <div className="flex gap-3">
            <button onClick={onCancel} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors focus:ring-4 focus:ring-slate-100">
                Cancel
            </button>
            <button onClick={handleSubmit} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/40 transition-all focus:ring-4 focus:ring-indigo-500/20 flex items-center gap-2">
                <Save className="w-4 h-4" />
                <span>Save Record</span>
            </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
            <form className="space-y-2">
                
                <SectionCard icon={Info} title="General Information" description="Basic reference and product details">
                    <InputGroup label="Reference Number" name="referenceNumber" required placeholder="CN24..." />
                    <InputGroup label="Product" name="product" options={PRODUCTS} />
                    <InputGroup label="Status" name="status" options={STATUSES} />
                    <InputGroup label="Received Date" name="enquiryReceivedDate" type="date" colSpan="sm:col-span-3" />
                    <InputGroup label="Created Date" name="enquiryCreatedDate" type="date" colSpan="sm:col-span-3" />
                </SectionCard>

                <SectionCard icon={User} title="Sales & Assignment" description="Internal ownership and routing">
                    <InputGroup label="Sales Country" name="salesCountry" colSpan="sm:col-span-2" />
                    <InputGroup label="Sales Office" name="salesOffice" colSpan="sm:col-span-2" />
                    <InputGroup label="Sales PIC" name="salesPic" colSpan="sm:col-span-2" />
                    <InputGroup label="Assigned CN Office" name="assignedCnOffice" options={ASSIGNED_OFFICES} colSpan="sm:col-span-3" />
                </SectionCard>

                <SectionCard icon={Box} title="Cargo Details" description="Physical characteristics of the shipment">
                    <InputGroup label="Cargo Type" name="cargoType" placeholder="General / LCL" />
                    <InputGroup label="Commodity" name="commodity" />
                    <InputGroup label="Volume (CBM)" name="volumeCbm" type="number" step="0.001" />
                    
                    <div className="sm:col-span-3 flex gap-4">
                        <div className="flex-1">
                             <InputGroup label="Quantity" name="quantity" type="number" colSpan="w-full" />
                        </div>
                        <div className="w-1/3">
                             <InputGroup label="Unit" name="quantityUnit" options={QUANTITY_UNITS} colSpan="w-full" />
                        </div>
                    </div>
                    <InputGroup label="Haz / Special Equipment" name="hazSpecialEquipment" placeholder="Class / UN No." colSpan="sm:col-span-3" />
                    <InputGroup label="Cargo Ready Date Details" name="cargoReadyDateDetails" placeholder="Additional details..." colSpan="sm:col-span-3" />
                </SectionCard>

                <SectionCard icon={MapPin} title="Route Information" description="Origin and Destination">
                    <InputGroup label="Port of Loading (POL)" name="pol" placeholder="e.g. HKG" colSpan="sm:col-span-2" />
                    <InputGroup label="Port of Discharge (POD)" name="pod" placeholder="e.g. LAX" colSpan="sm:col-span-2" />
                    <InputGroup label="POD Country" name="podCountry" colSpan="sm:col-span-2" />
                </SectionCard>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SectionCard icon={DollarSign} title="Business & Pricing" description="Financial classification and offers">
                        <InputGroup label="Core Status" name="coreNonCore" options={CORE_STATUSES} colSpan="sm:col-span-3" />
                        <InputGroup label="Category" name="category" options={CATEGORIES.map(c => c.code)} colSpan="sm:col-span-3" />
                        
                        <div className="sm:col-span-6 border-t border-slate-100 my-2"></div>

                        <InputGroup label="Cargo Ready Date" name="cargoReadyDate" type="date" colSpan="sm:col-span-3" />
                        <InputGroup label="1st Quote Date" name="firstQuotationSent" type="date" colSpan="sm:col-span-3" />
                        
                        <InputGroup label="1st Offer (Ocean)" name="firstOfferOceanFrg" colSpan="sm:col-span-3" />
                        <InputGroup label="1st Offer (Air)" name="firstOfferAirFrgKg" colSpan="sm:col-span-3" />
                        
                        <InputGroup label="Latest Offer (Ocean)" name="latestOfferOceanFrg" colSpan="sm:col-span-3" />
                        <InputGroup label="Latest Offer (Air)" name="latestOfferAirFrgKg" colSpan="sm:col-span-3" />
                    </SectionCard>

                    <SectionCard icon={CheckCircle} title="Remarks" description="Internal notes">
                        <InputGroup label="Remark" name="remark" placeholder="General notes..." colSpan="sm:col-span-6" />
                    </SectionCard>
                </div>

            </form>
            <div className="h-12"></div>
        </div>
      </div>
    </div>
  );
};

export default Form;
