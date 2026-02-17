import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Plus, Trash2, ArrowRight } from 'lucide-react';
import { 
  Enquiry, 
  ContainerLine, 
  Offer,
  SalesPic, 
  Port, 
  Country, 
  ContainerType,
  SelectOption,
  SalesPicSelectOption,
  PortSelectOption,
  ContainerTypeSelectOption,
  OfferType,
  ProductCode,
} from '../../types';
import { enquiryApi, masterDataApi } from '../../services/api';
import { Accordion, AccordionItem } from '../Accordion';
import { MultiSelect } from '../MultiSelect';
import { VirtualizedMultiSelect } from '../VirtualizedMultiSelect';

interface EnquiryFormProps {
  initialData?: Partial<Enquiry> | null;
  onSubmit: (enquiry: Enquiry) => void;
  onCancel: () => void;
}

// Extended form data type with all form fields
interface FormData extends Partial<Enquiry> {
  // 基础信息
  productCode?: ProductCode;
  
  // 路线信息 - 支持多港口
  polIds?: number[];
  podIds?: number[];
  
  // Offer 信息
  offers?: Offer[];
}

export const EnquiryForm: React.FC<EnquiryFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<FormData>({
    status: 'New',
    enquiryReceivedDate: new Date().toISOString().split('T')[0],
    issueDate: new Date().toISOString().split('T')[0],
    productCode: 'SEA',
    cargoTypeCode: 'FCL',
    containerLines: [],
    offers: [],
    polIds: [],
    podIds: [],
    bookingConfirmed: 'Pending',
    // 必需字段默认值
    assignedCnOfficeCode: '',
    cnPricingAdmin: '',
    salesCountryCode: '',
    salesOfficeId: 0,
    salesPicId: 0,
    ...initialData,
  });

  const [salesCountries, setSalesCountries] = useState<SelectOption[]>([]); // 销售国家（用于下拉框）
  const [allCountries, setAllCountries] = useState<SelectOption[]>([]); // 所有国家（用于POD映射）
  const [salesPics, setSalesPics] = useState<SalesPicSelectOption[]>([]);
  const [ports, setPorts] = useState<PortSelectOption[]>([]);
  const [containerTypes, setContainerTypes] = useState<ContainerTypeSelectOption[]>([]);
  const [cnOffices, setCnOffices] = useState<SelectOption[]>([]);
  const [products, setProducts] = useState<SelectOption[]>([]);
  const [cargoTypes, setCargoTypes] = useState<SelectOption[]>([]);
  const [cnPricingAdmins, setCnPricingAdmins] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPortSearching, setIsPortSearching] = useState(false); // ✅ 新增：港口搜索加载状态
  const [referencePreview, setReferencePreview] = useState('');
  const [isReferenceLoading, setIsReferenceLoading] = useState(false);

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    if (initialData) {

      const normalizedContainerLines = (initialData.containerLines || []).map(line => {
        const qty = line.containerQty ?? line.quantity ?? 0;
        const teuPerUnit = line.teuPerUnit ?? line.teuValue ?? 0;
        return {
          ...line,
          quantity: qty,
          teuValue: teuPerUnit,
          lineTeu: qty * teuPerUnit,
        };
      });

      setFormData(prev => ({
        ...prev,
        ...initialData,
        containerLines: normalizedContainerLines,
        // ✅ 修复：优先使用 polIds/podIds 数组，如果不存在则用单个值初始化
        polIds: initialData.polIds && initialData.polIds.length > 0 
          ? initialData.polIds 
          : (initialData.polId ? [initialData.polId] : prev.polIds),
        podIds: initialData.podIds && initialData.podIds.length > 0 
          ? initialData.podIds 
          : (initialData.podId ? [initialData.podId] : prev.podIds),
      }));

      if (initialData.salesCountryCode) {
        handleCountryChange(initialData.salesCountryCode);
      }

      // ✅ 补齐已选港口，确保选择框能显示名称
      const selectedPortIds = Array.from(new Set([
        ...(initialData.polIds || []),
        ...(initialData.podIds || []),
        initialData.polId,
        initialData.podId,
      ].filter((v): v is number => v !== null && v !== undefined).map(Number)));

      if (selectedPortIds.length > 0) {
        console.log('[EnquiryForm] Loading selected ports immediately:', selectedPortIds);
        // ✅ 直接加载，不等待ports
        ensurePortsLoaded(selectedPortIds);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData?.salesPicId && salesPics.length > 0) {
      handleSalesPicChange(initialData.salesPicId);
    }
  }, [salesPics, initialData?.salesPicId]);

  useEffect(() => {
    // ✅ 修复：使用完整的podIds数组而不是单个podId
    const podIdsToUse = initialData?.podIds && initialData.podIds.length > 0 
      ? initialData.podIds 
      : (initialData?.podId ? [initialData.podId] : []);
    
    if (podIdsToUse.length > 0 && ports.length > 0 && allCountries.length > 0) {
      updatePodCountries(podIdsToUse);
    }
  }, [ports, allCountries, initialData?.podIds, initialData?.podId]);

  useEffect(() => {
    // 如果是编辑模式，不获取预览
    if (formData.id) return;
    
    // 如果已有保存的编号，显示该编号
    if (formData.referenceNumber) {
      setReferencePreview(formData.referenceNumber);
      return;
    }
    
    // 如果缺少必要信息，清空预览
    if (!formData.issueDate || !formData.productCode) {
      setReferencePreview('');
      return;
    }

    // 从后端获取下一个编号预览
    let active = true;
    setIsReferenceLoading(true);
    
    const timer = setTimeout(() => {
      enquiryApi.getNextReference({
        issueDate: formData.issueDate,
        productCode: formData.productCode,
      })
        .then(preview => {
          if (!active) return;
          setReferencePreview(preview.referenceNumber);
          // 同时更新相关字段
          setFormData(prev => ({
            ...prev,
            referenceMonth: preview.referenceMonth,
            monthlySequence: preview.monthlySequence,
            serialNumber: preview.serialNumber,
            productAbbr: preview.productAbbr,
          }));
        })
        .catch(err => {
          if (!active) return;
          console.error('Failed to preview reference number:', err);
          setReferencePreview('');
        })
        .finally(() => {
          if (active) setIsReferenceLoading(false);
        });
    }, 300); // 防抖 300ms

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formData.issueDate, formData.productCode]);

  // 监听offers变化，自动更新Status为Quoted
  useEffect(() => {
    if (formData.offers && formData.offers.length > 0 && formData.status === 'New') {
      console.log('[EnquiryForm] Offers detected, auto-setting status to Quoted');
      setFormData(prev => ({
        ...prev,
        status: 'Quoted',
      }));
    }
  }, [formData.offers]);

  const mapPortToOption = (port: Port): PortSelectOption => ({
    value: port.id,
    label: port.portName || port.portCode || String(port.id),
    portCode: port.portCode,
    portType: port.portType,
    countryCode: port.countryCode || '',
  });

  // ✅ 补齐港口：确保已选港口在下拉框中显示
  const ensurePortsLoaded = (selectedPortIds: number[], basePortsList?: PortSelectOption[]) => {
    const currentPorts = basePortsList !== undefined ? basePortsList : ports;
    
    // ✅ 找出还没加载的港口IDs（如果currentPorts为空，则所有都需要加载）
    const portValueSet = new Set(currentPorts.map(p => String(p.value)));
    const missingIds = selectedPortIds.filter(id => !portValueSet.has(String(id)));
    
    // ✅ 如果没有缺失的港口，直接返回
    if (missingIds.length === 0 && currentPorts.length > 0) return;
    
    // 获取缺失的港口信息
    Promise.all(missingIds.map(id => masterDataApi.getPortById(id)))
      .then(results => {
        const newPorts = results
          .filter((p): p is Port => !!p)
          .map(mapPortToOption);
        
        if (newPorts.length > 0) {
          setPorts(prev => {
            const merged = new Map(prev.map(p => [String(p.value), p]));
            newPorts.forEach(p => merged.set(String(p.value), p));
            return Array.from(merged.values());
          });
        }
      })
      .catch(err => console.error('Failed to load selected ports:', err));
  };

  const loadMasterData = async () => {
    try {
      // ✅ 优化：基础数据和港口数据分开加载
      const [
        salesCountriesData,
        allCountriesData,
        containerTypesData,
        cnOfficesData,
      ] = await Promise.all([
        masterDataApi.getSalesCountries(),
        masterDataApi.getAllCountries(),
        masterDataApi.getContainerTypes(),
        masterDataApi.getCnOffices(),
      ]);
      setSalesCountries(salesCountriesData);
      setAllCountries(allCountriesData);
      setContainerTypes(containerTypesData);
      setCnOffices(cnOfficesData);
      
      // ✅ 优化：初始化空数组，编辑模式下的港口会在initialData的useEffect中加载
      // 新建模式则由VirtualizedMultiSelect的搜索触发加载
      setPorts([]);
      
      // 设置产品类型选项
      setProducts([
        { value: 'AIR', label: 'AIR' },
        { value: 'SEA', label: 'SEA' },
        { value: 'AIR-RAIL-SEA', label: 'AIR-RAIL-SEA (ARS)' },
        { value: 'RAIL', label: 'RAIL' },
        { value: 'RAIL-SEA', label: 'RAIL-SEA' },
      ]);
      
      // 设置货物类型选项
      setCargoTypes([
        { value: 'AIR', label: 'AIR' },
        { value: 'FCL', label: 'FCL' },
        { value: 'LCL', label: 'LCL' },
        { value: 'RAIL', label: 'RAIL' },
        { value: 'SEA', label: 'SEA' },
      ]);
      
      // 设置CN定价管理员选项（模拟字典数据）
      setCnPricingAdmins([
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'supervisor', label: 'Supervisor' },
        { value: 'analyst', label: 'Analyst' },
      ]);
    } catch (error) {
      console.error('Failed to load master data:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ 新增：异步港口搜索处理
  const handlePortSearch = async (searchTerm: string) => {
    try {
      setIsPortSearching(true);
      
      // 如果搜索词为空，只保留已选择的港口
      if (!searchTerm || searchTerm.trim() === '') {
        // 保持已选港口，清空搜索结果
        const selectedPortIds = Array.from(new Set([
          ...(formData.polIds || []),
          ...(formData.podIds || []),
        ]));
        
        if (selectedPortIds.length > 0) {
          const selectedPorts = await Promise.all(
            selectedPortIds.map(id => masterDataApi.getPortById(id))
          );
          setPorts(selectedPorts.filter((p): p is Port => !!p).map(mapPortToOption));
        } else {
          setPorts([]);
        }
        return;
      }
      
      // 搜索海港和空港
      const [seaPorts, airPorts] = await Promise.all([
        masterDataApi.searchPorts('SEA', searchTerm),
        masterDataApi.searchPorts('AIR', searchTerm),
      ]);
      
      // 合并结果并去重（保留已选港口）
      const searchResults = [...(seaPorts || []), ...(airPorts || [])];
      const selectedPortIds = Array.from(new Set([
        ...(formData.polIds || []),
        ...(formData.podIds || []),
      ]));
      
      // 确保已选港口在列表中
      const selectedPorts = await Promise.all(
        selectedPortIds
          .filter(id => !searchResults.some(p => p.value === id))
          .map(id => masterDataApi.getPortById(id))
      );
      
      const allPorts = [
        ...selectedPorts.filter((p): p is Port => !!p).map(mapPortToOption),
        ...searchResults,
      ];
      
      // 去重
      const uniquePorts = Array.from(
        new Map(allPorts.map(p => [String(p.value), p])).values()
      );
      
      setPorts(uniquePorts);
    } catch (error) {
      console.error('Failed to search ports:', error);
    } finally {
      setIsPortSearching(false);
    }
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

  // Reference Number 预览（实时从后端获取）
  const getReferenceDisplay = () => {
    // 如果已保存，显示实际的 Reference
    if (formData.referenceNumber) {
      return formData.referenceNumber;
    }
    // 如果正在加载
    if (isReferenceLoading) {
      return 'Generating...';
    }
    // 如果已获取预览，显示预览编号
    if (referencePreview) {
      return referencePreview;
    }
    // 等待用户选择产品类型和日期
    return 'Auto-generated on save';
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

  // Offer 管理函数
  const addOffer = () => {
    const newOffer: Offer = {
      id: Date.now(),
      enquiryId: formData.id || 0,
      offerType: 'OCEAN',
      sequenceNo: (formData.offers || []).length + 1,
      sentDate: new Date().toISOString().split('T')[0],
      priceText: '',
      isLatest: true,
    };
    
    // 将之前的 offer 设为非最新
    const updatedOffers = (formData.offers || []).map(o => ({ ...o, isLatest: false }));
    
    setFormData(prev => ({
      ...prev,
      offers: [...updatedOffers, newOffer],
    }));
  };

  const updateOffer = (index: number, field: keyof Offer, value: any) => {
    const offers = [...(formData.offers || [])];
    offers[index] = { ...offers[index], [field]: value };
    setFormData(prev => ({ ...prev, offers }));
  };

  const removeOffer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      offers: (prev.offers || []).filter((_, i) => i !== index),
    }));
  };

  // POD Country 自动映射
  const updatePodCountries = (podIds: (string | number)[]) => {
    console.log('updatePodCountries called with:', podIds);
    console.log('Available ports:', ports);
    console.log('Available allCountries:', allCountries);
    
    // 将podIds转换为字符串以便比较（MultiSelect返回字符串）
    const podIdStrings = podIds.map(id => String(id));
    console.log('Pod IDs as strings:', podIdStrings);
    
    // 从选中的POD中获取国家代码
    const selectedPods = ports.filter(p => {
      const portValueStr = String(p.value);
      const isSelected = podIdStrings.includes(portValueStr);
      console.log(`Port ${portValueStr}: selected=${isSelected}`);
      return isSelected;
    });
    console.log('Selected PODs:', selectedPods);
    
    const countryCodes = [...new Set(selectedPods.map(p => p.countryCode))];
    console.log('Country codes:', countryCodes);
    
    // 根据国家代码查找国家名称（使用完整国家列表）
    const countryNames = countryCodes
      .map(code => {
        const country = allCountries.find(c => String(c.value).toUpperCase() === String(code).toUpperCase());
        console.log(`Looking for country ${code}, found:`, country);
        return country?.label;
      })
      .filter(Boolean)
      .join(', ');
    
    console.log('Final country names:', countryNames);
    
    setFormData(prev => ({
      ...prev,
      podIds: podIdStrings.map(id => parseInt(id, 10)), // 存储为数字数组
      podCountryCode: countryCodes[0], // 存储第一个国家代码
      podCountryName: countryNames || '未找到对应国家', // 显示所有国家名称
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 验证必需字段
      if (!formData.salesCountryCode) {
        alert('Please select Sales Country');
        setIsLoading(false);
        return;
      }
      if (!formData.salesOfficeId) {
        alert('Please select Sales Office');
        setIsLoading(false);
        return;
      }
      if (!formData.cnPricingAdmin) {
        alert('Please select CN Pricing Admin');
        setIsLoading(false);
        return;
      }
      if (!formData.assignedCnOfficeCode) {
        alert('Please select Assigned CN Office');
        setIsLoading(false);
        return;
      }

      // 验证港口选择
      if (!formData.polIds || formData.polIds.length === 0) {
        alert('Please select Port of Loading (POL)');
        setIsLoading(false);
        return;
      }
      if (!formData.podIds || formData.podIds.length === 0) {
        alert('Please select Port of Discharge (POD)');
        setIsLoading(false);
        return;
      }

      // 构建提交数据：保留 polIds 和 podIds 数组
      let enquiryToSubmit: any = {
        ...formData,
        polId: formData.polIds?.[0],  // 兼容旧字段（保留第一个作为主港口）
        podId: formData.podIds?.[0],  // 兼容旧字段（保留第一个作为主港口）
        polIds: formData.polIds || [],  // ✅ 新增：发送完整的 POL ID 数组
        podIds: formData.podIds || [],  // ✅ 新增：发送完整的 POD ID 数组
      };

      // 清除containerLines的ID，防止后端detached entity异常，并映射字段名
      if (enquiryToSubmit.containerLines && Array.isArray(enquiryToSubmit.containerLines)) {
        enquiryToSubmit.containerLines = enquiryToSubmit.containerLines.map((line: any) => ({
          containerTypeId: line.containerTypeId,
          containerQty: line.quantity || line.containerQty || 1, // 映射quantity -> containerQty
          rawText: line.rawText || null,
          // 不发送这些前端字段到后端
          // id, enquiryId, teuValue, lineTeu等由后端处理
        }));
      }

      // 处理offers：新建时发送必要字段，编辑时避免覆盖已有offers
      if (enquiryToSubmit.offers && Array.isArray(enquiryToSubmit.offers)) {
        if (formData.id) {
          // 编辑模式：不通过Enquiry接口更新offers，避免覆盖与detached问题
            // ✅ 编辑模式下也需要发送offers，后端会正确处理合并
            enquiryToSubmit.offers = enquiryToSubmit.offers.map((offer: any) => ({
              id: offer.id || undefined,  // 保留ID如果有（用于更新）
              offerType: offer.offerType,
              sequenceNo: offer.sequenceNo,
              isLatest: offer.isLatest ?? false,
              sentDate: offer.sentDate || null,
              sentDateRawText: offer.sentDateRawText || null,
              price: offer.price ?? null,
              priceText: offer.priceText || null,
              isRejectedPrice: offer.isRejectedPrice ?? false,
            }));
        } else {
          // 新建模式：仅发送后端需要的字段（不带id/enquiryId）
          enquiryToSubmit.offers = enquiryToSubmit.offers.map((offer: any) => ({
            offerType: offer.offerType,
            sequenceNo: offer.sequenceNo,
            isLatest: offer.isLatest ?? false,
            sentDate: offer.sentDate || null,
            sentDateRawText: offer.sentDateRawText || null,
            price: offer.price ?? null,
            priceText: offer.priceText || null,
            isRejectedPrice: offer.isRejectedPrice ?? false,
          }));
        }
      }

      // ✅ 保留 polIds 和 podIds（后端需要处理多港口）
      // 不删除这些字段，让后端接收并处理

      // 编辑模式：确保必需字段都已包含，防止 NOT NULL 约束错误
      if (formData.id) {
        // 保留原有的必需字段值（如果新值为空则使用旧值）
        enquiryToSubmit.referenceNumber = enquiryToSubmit.referenceNumber || initialData?.referenceNumber;
        enquiryToSubmit.referenceMonth = enquiryToSubmit.referenceMonth || initialData?.referenceMonth;
        enquiryToSubmit.monthlySequence = enquiryToSubmit.monthlySequence ?? initialData?.monthlySequence;
        enquiryToSubmit.serialNumber = enquiryToSubmit.serialNumber ?? initialData?.serialNumber ?? 0;
        enquiryToSubmit.productCode = enquiryToSubmit.productCode || initialData?.productCode;
        enquiryToSubmit.productAbbr = enquiryToSubmit.productAbbr || initialData?.productAbbr;
        enquiryToSubmit.status = enquiryToSubmit.status || initialData?.status || 'New';
        enquiryToSubmit.cnPricingAdmin = enquiryToSubmit.cnPricingAdmin || initialData?.cnPricingAdmin;
        enquiryToSubmit.salesCountryCode = enquiryToSubmit.salesCountryCode || initialData?.salesCountryCode;
        enquiryToSubmit.salesOfficeId = enquiryToSubmit.salesOfficeId || initialData?.salesOfficeId;
        enquiryToSubmit.assignedCnOfficeCode = enquiryToSubmit.assignedCnOfficeCode || initialData?.assignedCnOfficeCode;
        enquiryToSubmit.cargoTypeCode = enquiryToSubmit.cargoTypeCode || initialData?.cargoTypeCode;
        enquiryToSubmit.issueDate = enquiryToSubmit.issueDate || initialData?.issueDate;
        enquiryToSubmit.enquiryReceivedDate = enquiryToSubmit.enquiryReceivedDate || initialData?.enquiryReceivedDate;
        enquiryToSubmit.bookingConfirmed = enquiryToSubmit.bookingConfirmed || initialData?.bookingConfirmed || 'Pending';
      } else {
        // 新建时由后端生成 Reference，避免并发冲突
        delete enquiryToSubmit.referenceNumber;
        if (!formData.serialNumber || !formData.monthlySequence || formData.serialNumber <= 0) {
          delete enquiryToSubmit.serialNumber;
          delete enquiryToSubmit.monthlySequence;
        }
      }

      onSubmit(enquiryToSubmit as Enquiry);
    } catch (error) {
      console.error('Failed to save enquiry:', error);
      alert('Failed to save enquiry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white shadow rounded-lg p-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {formData.id ? `Edit Enquiry #${formData.referenceNumber}` : 'New Enquiry'}
          </h2>
          <p className="text-sm text-gray-500">Please fill in the information below to create or update the enquiry.</p>
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

      <Accordion>
        {/* 1. 基础信息 */}
        <AccordionItem title="Basic Information" defaultExpanded={true} required>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Enquiry Reference</label>
              <input
                type="text"
                value={getReferenceDisplay()}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm font-semibold text-indigo-600"
                title="Auto-generated based on product type and date"
              />
              <p className="mt-1 text-xs text-gray-500">
                {!formData.referenceNumber && (referencePreview ? 'Auto-generated in real-time' : 'Auto-generated after selecting Product Type')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Enquiry Received Date *</label>
              <input
                type="date"
                value={formData.enquiryReceivedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const selectedDateStr = e.target.value;
                  const todayStr = new Date().toISOString().split('T')[0];
                  
                  if (selectedDateStr > todayStr) {
                    alert('询价接收日期不能晚于今天之后的日期');
                    return;
                  }
                  handleChange('enquiryReceivedDate', e.target.value);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Issue Date</label>
              <input
                type="date"
                value={formData.issueDate}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Product Type *</label>
              <select
                value={formData.productCode}
                onChange={(e) => handleChange('productCode', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                {products.map(product => (
                  <option key={String(product.value)} value={String(product.value)}>{product.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">CN Pricing Admin *</label>
              <select
                value={formData.cnPricingAdmin || ''}
                onChange={(e) => handleChange('cnPricingAdmin', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select admin</option>
                {cnPricingAdmins.map(admin => (
                  <option key={String(admin.value)} value={String(admin.value)}>{admin.label}</option>
                ))}
              </select>
            </div>
          </div>
        </AccordionItem>

        {/* 2. Sales Information */}
        <AccordionItem title="Sales Information ⭐" defaultExpanded={true} badge="Cascade" required>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sales Country *</label>
                <select
                  value={formData.salesCountryCode || ''}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select country</option>
                  {salesCountries.map(country => (
                    <option key={String(country.value)} value={String(country.value)}>{country.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center pb-2">
                <ArrowRight className="w-6 h-6 text-indigo-600" />
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
                    <option key={String(pic.value)} value={Number(pic.value)}>
                      {pic.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-indigo-50 p-3 rounded-md">
              <ArrowRight className="w-4 h-4 text-indigo-600" />
              <span>Auto-map Sales Office and Assigned CN Office</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sales Office (Auto-filled)</label>
                <input
                  type="text"
                  value={formData.salesOfficeName || ''}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                  placeholder="Auto-filled after selecting Sales PIC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned CN Office *</label>
                <select
                  value={formData.assignedCnOfficeCode || ''}
                  onChange={(e) => handleChange('assignedCnOfficeCode', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select office</option>
                  {cnOffices.map(office => (
                    <option key={String(office.value)} value={String(office.value)}>{office.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* 3. Cargo Information */}
        <AccordionItem title="Cargo Information" defaultExpanded={true}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cargo Type *</label>
                <select
                  value={formData.cargoTypeCode}
                  onChange={(e) => handleChange('cargoTypeCode', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  {cargoTypes.map(type => (
                    <option key={String(type.value)} value={String(type.value)}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Volume (CBM)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.volumeCbm || ''}
                  onChange={(e) => handleChange('volumeCbm', e.target.value ? Number(e.target.value) : null)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g. 120.5"
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
                  placeholder="e.g. 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">UOM</label>
                <select
                  value={formData.quantityUomCode || ''}
                  onChange={(e) => handleChange('quantityUomCode', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select UOM</option>
                  <option value="KG">KG</option>
                  <option value="PCS">PCS</option>
                  <option value="CTN">CTN</option>
                  <option value="PLT">PLT</option>
                  <option value="SET">SET</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Commodity / Description</label>
              <textarea
                value={formData.commodity || ''}
                onChange={(e) => handleChange('commodity', e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Describe the cargo..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hazardous / Special Equipment</label>
              <textarea
                value={formData.hazSpecialEquipment || ''}
                onChange={(e) => handleChange('hazSpecialEquipment', e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="DG class, UN No., special equipment..."
              />
            </div>
          </div>
        </AccordionItem>

        {/* 4. Container Lines */}
        <AccordionItem title="Container Lines">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Configure container types and quantities</p>
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
                <p>No container lines yet. Click "Add Container" to start.</p>
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
                          <option key={String(ct.value)} value={Number(ct.value)}>
                            {ct.label} ({ct.teuValue} TEU)
                          </option>
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
                        placeholder="TEU/Unit"
                      />

                      <input
                        type="number"
                        value={line.lineTeu || 0}
                        disabled
                        className="rounded-md border-gray-300 bg-gray-100 shadow-sm font-semibold"
                        placeholder="Line TEU"
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
        </AccordionItem>

        {/* 5. Route Information */}
        <AccordionItem title="Route Information" defaultExpanded={true} required>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VirtualizedMultiSelect
                label="Port of Loading (POL)"
                options={ports.map(p => ({
                  value: p.value,
                  label: p.label,
                  searchText: p.label // 支持搜索
                }))}
                value={formData.polIds || []}
                onChange={(values) => handleChange('polIds', values.map(v => Number(v)))}
                placeholder="Search and select ports of loading..."
                required
                maxSelections={10}  // 最多选择10个港口
                itemHeight={36}
                listHeight={600}
                showCount={false}
                onSearch={handlePortSearch} // ✅ 异步搜索
                isSearching={isPortSearching} // ✅ 搜索状态
              />

              <VirtualizedMultiSelect
                label="Port of Discharge (POD)"
                options={ports.map(p => ({
                  value: p.value,
                  label: p.label,
                  searchText: p.label // 支持搜索
                }))}
                value={formData.podIds || []}
                onChange={(values) => {
                  const podIds = values.map(v => Number(v));
                  handleChange('podIds', podIds);
                  if (podIds.length > 0) {
                    updatePodCountries(podIds);
                  }
                }}
                placeholder="Search and select ports of discharge..."
                required
                maxSelections={10}  // 最多选择10个港口
                itemHeight={36}
                listHeight={600}
                showCount={false}
                onSearch={handlePortSearch} // ✅ 异步搜索
                isSearching={isPortSearching} // ✅ 搜索状态
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-blue-900">
                    POD Country - Auto Mapped
                  </label>
                  <input
                    type="text"
                    value={formData.podCountryName || 'Please select POD first'}
                    disabled
                    className="mt-1 block w-full rounded-md border-blue-300 bg-blue-100 text-blue-900 shadow-sm font-medium"
                    placeholder="Auto-filled based on selected POD"
                  />
                  <p className="mt-1 text-xs text-blue-700">
                    💡 This field auto-maps country from selected POD.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* 6. Offer Information */}
        <AccordionItem title="Offer Information" badge={formData.offers?.length}>
          <div className="space-y-4">
            <button
              type="button"
              onClick={addOffer}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Add Offer
            </button>

            {(formData.offers || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p>No offers yet. Click "Add Offer" to start.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(formData.offers || []).map((offer, index) => (
                  <div key={offer.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Offer #{index + 1}
                        {offer.isLatest && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Latest</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOffer(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Offer Type *</label>
                        <select
                          value={offer.offerType}
                          onChange={(e) => updateOffer(index, 'offerType', e.target.value)}
                          className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        >
                          <option value="OCEAN">OCEAN</option>
                          <option value="AIR">AIR</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Offer Date *</label>
                        <input
                          type="date"
                          value={offer.sentDate}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            const selectedDateStr = e.target.value;
                            const todayStr = new Date().toISOString().split('T')[0];
                            
                            if (selectedDateStr > todayStr) {
                              alert('报价日期不能晚于今天之后的日期');
                              return;
                            }
                            updateOffer(index, 'sentDate', e.target.value);
                          }}
                          className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Offer Details</label>
                        <textarea
                          value={offer.priceText || ''}
                          onChange={(e) => updateOffer(index, 'priceText', e.target.value)}
                          rows={2}
                          className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="例如: USD 2,500.00 all-in"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AccordionItem>

        {/* 7. Business Classification */}
        <AccordionItem title="Business Classification">
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
                <option value="">Select category</option>
                <option value="FREIGHT">Freight</option>
                <option value="FREIGHT_ORIGIN_EXW">Freight + Origin Charge/EXW</option>
                <option value="FREIGHT_ORIGIN_DEST">Freight + Origin Charge/EXW+Dest. Charges</option>
                <option value="ORIGIN_EXW">Origin Charges/EXW</option>
                <option value="LCL">LCL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cargo Ready Date</label>
              <input
                type="date"
                value={formData.cargoReadyDate || ''}
                onChange={(e) => handleChange('cargoReadyDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Cargo Ready Date Text (TBA/Week...)</label>
              <input
                type="text"
                value={formData.cargoReadyDateRawText || ''}
                onChange={(e) => handleChange('cargoReadyDateRawText', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="例如: TBA, Week 5, End of Feb"
              />
            </div>
          </div>
        </AccordionItem>

        {/* 8. Additional Information */}
        <AccordionItem title="Additional Information">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Requirements</label>
              <textarea
                value={formData.additionalRequirement || ''}
                onChange={(e) => handleChange('additionalRequirement', e.target.value)}
                rows={3}
                maxLength={2000}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Special requirements, delivery notes, etc."
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
        </AccordionItem>

        {/* 9. Status & Result */}
        <AccordionItem title="Status & Result">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  disabled={formData.offers && formData.offers.length > 0}
                  title={formData.offers && formData.offers.length > 0 ? 'Status is auto-set to Quoted when offers exist' : ''}
                >
                  <option value="New">New</option>
                  <option value="Quoted">Quoted</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
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
                <select
                  value={formData.rejectedReason || ''}
                  onChange={(e) => handleChange('rejectedReason', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select reason</option>
                  <option value="Cancel Booking">Cancel Booking</option>
                  <option value="Rate Checking - For indication only">Rate Checking - For indication only</option>
                  <option value="Rate Checking - No feedback from customer">Rate Checking - No feedback from customer</option>
                  <option value="By Other NVOCC">By Other NVOCC</option>
                  <option value="Production problem">Production problem</option>
                  <option value="Rate Issue-freight">Rate Issue-freight</option>
                  <option value="Rate Issue-local charges">Rate Issue-local charges</option>
                  <option value="Space Issue">Space Issue</option>
                  <option value="Cancel Booking - Changed to Couriers">Cancel Booking - Changed to Couriers</option>
                  <option value="Cancel Booking - By Air">Cancel Booking - By Air</option>
                  <option value="Cancel Booking - By Sea">Cancel Booking - By Sea</option>
                  <option value="Cancel Booking - By Train">Cancel Booking - By Train</option>
                  <option value="Cancel Booking - PO Cancelled">Cancel Booking - PO Cancelled</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            )}

            {formData.id && (
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
            )}
          </div>
        </AccordionItem>
      </Accordion>
    </form>
  );
};

export default EnquiryForm;
