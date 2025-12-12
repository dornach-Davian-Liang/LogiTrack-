import React from 'react';
import { EnquiryRecord } from '../types';
import { Edit, Plane, Ship, Truck, Train, Copy } from 'lucide-react';

interface TableProps {
  data: EnquiryRecord[];
  onEdit: (record: EnquiryRecord) => void;
  onCopy: (record: EnquiryRecord) => void;
}

const ProductIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'AIR': return <Plane className="w-4 h-4 text-sky-500" />;
    case 'SEA': return <Ship className="w-4 h-4 text-blue-600" />;
    case 'RAIL': return <Train className="w-4 h-4 text-orange-500" />;
    case 'TRUCK': return <Truck className="w-4 h-4 text-green-500" />;
    default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  let color = 'bg-gray-100 text-gray-800';
  if (status === 'Quoted') color = 'bg-blue-100 text-blue-800';
  if (status === 'New') color = 'bg-green-100 text-green-800';
  if (status === 'Pending') color = 'bg-yellow-100 text-yellow-800';
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color} whitespace-nowrap`}>
      {status}
    </span>
  );
};

const Table: React.FC<TableProps> = ({ data, onEdit, onCopy }) => {
  const thClass = "px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-r border-gray-100 last:border-0";
  const tdClass = "px-3 py-4 text-sm text-gray-500 whitespace-nowrap border-r border-gray-100 last:border-0 max-w-xs truncate";

  return (
    <div className="bg-white shadow border-b border-gray-200 sm:rounded-lg flex flex-col h-full">
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className={`${thClass} sticky left-0 bg-gray-50 z-20 shadow-r`}>Actions</th>
              <th className={thClass}>Enquiry Date</th>
              <th className={thClass}>Issue Date</th>
              <th className={thClass}>Ref Number</th>
              <th className={thClass}>Product</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>CN Admin</th>
              <th className={thClass}>Sales Country</th>
              <th className={thClass}>Sales Office</th>
              <th className={thClass}>Sales PIC</th>
              <th className={thClass}>Assigned CN Office</th>
              <th className={thClass}>Cargo Type</th>
              <th className={thClass}>Volume (CBM)</th>
              <th className={thClass}>Qty</th>
              <th className={thClass}>Unit</th>
              <th className={thClass}>TEU</th>
              <th className={thClass}>Commodity</th>
              <th className={thClass}>Haz/Special</th>
              <th className={thClass}>POL</th>
              <th className={thClass}>POD</th>
              <th className={thClass}>POD Country</th>
              <th className={thClass}>Core</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Cargo Ready</th>
              <th className={thClass}>Add. Req</th>
              <th className={thClass}>1st Quote Date</th>
              <th className={thClass}>1st Ocean</th>
              <th className={thClass}>1st Air</th>
              <th className={thClass}>Latest Ocean</th>
              <th className={thClass}>Latest Air</th>
              <th className={thClass}>Booking</th>
              <th className={thClass}>Remark</th>
              <th className={thClass}>Rejected Reason</th>
              <th className={thClass}>Actual Reason</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                {/* Actions Column - Sticky Left */}
                <td className={`${tdClass} sticky left-0 bg-white z-10 shadow-r border-r-2 border-gray-100`}>
                  <div className="flex items-center gap-2 px-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
                      title="Edit Record"
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded hover:bg-indigo-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onCopy(item); }} 
                      title="Copy to New Record"
                      className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 p-1.5 rounded hover:bg-emerald-100 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </td>

                <td className={tdClass}>{item.enquiryReceivedDate}</td>
                <td className={tdClass}>{item.issueDate}</td>
                <td className={`${tdClass} font-medium text-indigo-600`}>{item.referenceNumber}</td>
                <td className={tdClass}>
                   <div className="flex items-center gap-2">
                    <ProductIcon type={item.product} />
                    {item.product}
                  </div>
                </td>
                <td className={tdClass}><StatusBadge status={item.status} /></td>
                
                <td className={tdClass}>{item.cnPricingAdmin}</td>
                <td className={tdClass}>{item.salesCountry}</td>
                <td className={tdClass}>{item.salesOffice}</td>
                <td className={tdClass}>{item.salesPic}</td>
                <td className={tdClass}>{item.assignedCnOffice}</td>

                <td className={tdClass}>{item.cargoType}</td>
                <td className={tdClass}>{item.volumeCbm}</td>
                <td className={tdClass}>{item.quantity}</td>
                <td className={tdClass}>{item.quantityUnit}</td>
                <td className={tdClass}>{item.quantityTeu || '-'}</td>
                <td className={tdClass} title={item.commodity}>{item.commodity}</td>
                <td className={tdClass} title={item.specialRequirements}>{item.specialRequirements || '-'}</td>

                <td className={tdClass}>{item.pol}</td>
                <td className={tdClass}>{item.pod}</td>
                <td className={tdClass}>{item.podCountry}</td>

                <td className={tdClass}>
                    <span className={`text-xs font-medium ${item.isCore === 'CORE' ? 'text-green-600 bg-green-50 px-1 rounded' : 'text-gray-500'}`}>
                        {item.isCore}
                    </span>
                </td>
                <td className={tdClass} title={item.category}>{item.category}</td>
                
                <td className={tdClass}>{item.cargoReadyDate || '-'}</td>
                <td className={tdClass} title={item.additionalRequirement}>{item.additionalRequirement || '-'}</td>
                <td className={tdClass}>{item.firstQuotationSentDate || '-'}</td>
                <td className={tdClass}>{item.firstOfferOcean || '-'}</td>
                <td className={tdClass}>{item.firstOfferAir || '-'}</td>
                <td className={tdClass}>{item.latestOfferOcean || '-'}</td>
                <td className={tdClass}>{item.latestOfferAir || '-'}</td>
                
                <td className={tdClass}>
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.bookingConfirmed === 'Yes' ? 'bg-green-100 text-green-800' : 
                        item.bookingConfirmed === 'Rejected' ? 'bg-red-100 text-red-800' : 
                        item.bookingConfirmed === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-400'
                     }`}>
                      {item.bookingConfirmed || '-'}
                    </span>
                </td>
                <td className={tdClass} title={item.remark}>{item.remark || '-'}</td>
                <td className={tdClass} title={item.rejectedReason}>{item.rejectedReason || '-'}</td>
                <td className={tdClass} title={item.actualReason}>{item.actualReason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;