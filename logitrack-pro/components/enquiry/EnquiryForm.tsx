import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Plus, Trash2, ArrowRight } from 'lucide-react';
import { 
  Enquiry, 
  Offer,
  OfferPriceLine,
  OfferContainerDetail,
  RouteGroup,
  SalesPic, 
  Port, 
  Country, 
  SelectOption,
  SalesPicSelectOption,
  PortSelectOption,
  ContainerTypeSelectOption,
  OfferType,
  ProductCode,
  CancelledReasonDict,
  LostReasonDict,
} from '../../types';
import { enquiryApi, masterDataApi } from '../../services/api';
import { isMixedProduct, PRODUCT_CARGO_MAP, CONTAINER_CARGO_TYPES } from '../../constants';
import { Accordion, AccordionItem } from '../Accordion';
import { MultiSelect } from '../MultiSelect';
import { VirtualizedMultiSelect } from '../VirtualizedMultiSelect';
import { DatePickerInput } from '../DatePickerInput';
import { RouteGroupEditor } from './RouteGroupEditor';
import { OfferPriceTable } from './OfferPriceTable';
import { SearchableSelect } from '../SearchableSelect';
import { CargoContainerTable } from './CargoContainerTable';
import { EnquiryContainerRow } from '../../types';

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
  
  // Route groups for mixed-mode products
  routeGroups?: RouteGroup[];

  // Display / legacy fields not in Enquiry type
  cargoReadyDateRawText?: string;
  actualReason?: string;
  additionalRequirements?: string;

  // Container info at Enquiry level (FCL/BUYER-CONSOL)
  containerRows?: EnquiryContainerRow[];
}

export const EnquiryForm: React.FC<EnquiryFormProps> = ({ initialData, onSubmit, onCancel }) => {
  // Helper function: convert Date to local ISO string (avoid UTC timezone issues)
  const getLocalDateISO = (date?: Date): string => {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState<FormData>({
    status: 'New',
    enquiryReceivedDate: getLocalDateISO(),
    enquiryCreatedDate: getLocalDateISO(),
    productCode: 'SEA',
    cargoTypeCode: 'FCL',
    offers: [],
    polIds: [],
    podIds: [],
    // 必需字段默认值
    assignedCnOffice: '',
    salesCountryCode: '',
    salesOfficeId: 0,
    salesPicId: 0,
    ...initialData,
  });

  const [salesCountries, setSalesCountries] = useState<SelectOption[]>([]); // 销售国家（用于下拉框）
  const [allCountries, setAllCountries] = useState<Country[]>([]); // 所有国家（完整对象）
  const [salesPics, setSalesPics] = useState<SalesPicSelectOption[]>([]);
  const [ports, setPorts] = useState<PortSelectOption[]>([]);
  const [cnOffices, setCnOffices] = useState<SelectOption[]>([]);
  const [products, setProducts] = useState<SelectOption[]>([]);
  const [cargoTypes, setCargoTypes] = useState<SelectOption[]>([]);
  const [containerTypesOpts, setContainerTypesOpts] = useState<ContainerTypeSelectOption[]>([]);
  const [carrierOptions, setCarrierOptions] = useState<string[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<string[]>(['USD', 'EUR', 'GBP', 'CNY', 'HKD', 'VND']);
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false); // 防止双击/竞争提交
  const [isPortSearching, setIsPortSearching] = useState(false); // ✅ 新增：港口搜索加载状态
  const [referencePreview, setReferencePreview] = useState('');
  const [isReferenceLoading, setIsReferenceLoading] = useState(false);
  const [coreFlagWarning, setCoreFlagWarning] = useState(''); // CORE flag自动计算警告
  const [cancelledReasons, setCancelledReasons] = useState<CancelledReasonDict[]>([]);
  const [lostReasons, setLostReasons] = useState<LostReasonDict[]>([]);

  useEffect(() => {
    loadMasterData();
  }, []);

  // ✅ 辅助函数：将 LocalDateTime 格式 "2026-01-15T10:30:00" 转为 date input 所需的 "YYYY-MM-DD"
  const normalizeDate = (val: string | undefined): string | undefined => {
    if (!val) return val;
    // 如果包含 'T'，取 T 前面的日期部分
    if (val.includes('T')) return val.split('T')[0];
    return val;
  };

  useEffect(() => {
    if (initialData) {

      setFormData(prev => ({
        ...prev,
        ...initialData,
        // ✅ 修复日期格式：确保 <input type="date"> 能正确显示
        enquiryCreatedDate: normalizeDate(initialData.enquiryCreatedDate) || normalizeDate(prev.enquiryCreatedDate),
        enquiryReceivedDate: normalizeDate(initialData.enquiryReceivedDate) || normalizeDate(prev.enquiryReceivedDate),
        // ✅ 修复：使用 polIds/podIds 数组
        polIds: initialData.polIds && initialData.polIds.length > 0 
          ? initialData.polIds 
          : prev.polIds,
        podIds: initialData.podIds && initialData.podIds.length > 0 
          ? initialData.podIds 
          : prev.podIds,
      }));

      if (initialData.salesCountryCode) {
        handleCountryChange(initialData.salesCountryCode);
      }

      // ✅ 补齐已选港口，确保选择框能显示名称
      const selectedPortIds = Array.from(new Set([
        ...(initialData.polIds || []),
        ...(initialData.podIds || []),
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
    // ✅ 修复：使用完整的podIds数组
    const podIdsToUse = initialData?.podIds && initialData.podIds.length > 0 
      ? initialData.podIds 
      : [];
    
    if (podIdsToUse.length > 0 && ports.length > 0 && allCountries.length > 0) {
      updatePodCountries(podIdsToUse);
    }
  }, [ports, allCountries, initialData?.podIds]);

  useEffect(() => {
    // 如果是编辑模式，不获取预览
    if (formData.id) return;
    
    // 如果已有保存的编号，显示该编号
    if (formData.refNumber) {
      setReferencePreview(formData.refNumber);
      return;
    }
    
    // 如果缺少必要信息，清空预览
    if (!formData.enquiryCreatedDate || !formData.productCode) {
      setReferencePreview('');
      return;
    }

    // 从后端获取下一个编号预览
    let active = true;
    setIsReferenceLoading(true);
    
    const timer = setTimeout(() => {
      enquiryApi.getNextReference(
        formData.enquiryCreatedDate!,
        formData.productCode!,
      )
        .then(preview => {
          if (!active) return;
          setReferencePreview(preview.referenceNumber);
          // 同时更新相关字段
          setFormData(prev => ({
            ...prev,
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
  }, [formData.enquiryCreatedDate, formData.productCode]);

  // 判断offers中是否有实际填写了报价的行
  const hasActualPricing = (offers: Offer[] | undefined): boolean => {
    if (!offers || offers.length === 0) return false;
    return offers.some(offer =>
      (offer.priceLines || []).some(line => {
        const hasPrice =
          (line.price != null && line.price > 0) ||
          (line.perCbm != null && line.perCbm > 0) ||
          (line.minCharge != null && line.minCharge > 0) ||
          (line.localCharge != null && line.localCharge > 0) ||
          (line.priceText != null && line.priceText.trim().length > 0) ||
          (line.carrier != null && line.carrier.trim().length > 0);
        const hasContainerPrice = (line.containerDetails || []).some(
          d => d.containerPrice != null && d.containerPrice > 0
        );
        return hasPrice || hasContainerPrice;
      })
    );
  };

  // 监听offers变化，根据是否填写了报价自动切换Status
  useEffect(() => {
    const hasPricing = hasActualPricing(formData.offers);
    if (hasPricing && formData.status === 'New') {
      console.log('[EnquiryForm] Pricing detected, auto-setting status to Quoted & Pending');
      setFormData(prev => ({
        ...prev,
        status: 'Quoted & Pending',
      }));
    } else if (!hasPricing && formData.status === 'Quoted & Pending') {
      console.log('[EnquiryForm] No pricing detected, auto-setting status to New');
      setFormData(prev => ({
        ...prev,
        status: 'New',
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
        cnOfficesData,
        containerTypesData,
        cancelledReasonsData,
        lostReasonsData,
      ] = await Promise.all([
        masterDataApi.getSalesCountries(),
        masterDataApi.getCountries(),
        masterDataApi.getCnOffices(),
        masterDataApi.getContainerTypes(),
        masterDataApi.getCancelledReasons(),
        masterDataApi.getLostReasons(),
      ]);
      setSalesCountries(salesCountriesData);
      setAllCountries(allCountriesData);
      setCnOffices(cnOfficesData);
      setContainerTypesOpts(containerTypesData || []);
      setCancelledReasons(cancelledReasonsData || []);
      setLostReasons(lostReasonsData || []);

      // ✅ 加载 Carrier 列表 (active)
      try {
        const carriers = await masterDataApi.getActiveCarriers();
        setCarrierOptions(carriers.map(c => c.carrierCode));
      } catch (carrierErr) {
        console.error('Failed to load carriers:', carrierErr);
        // fallback to default
        setCarrierOptions(['MSC', 'COSCO', 'ONE', 'CMA', 'OOCL', 'EVERGREEN', 'HAPAG-LLOYD', 'HMM', 'YANG MING', 'CO-LOADER']);
      }

      // ✅ 加载 Currency 列表 (active)
      try {
        const currencies = await masterDataApi.getActiveCurrencies();
        if (currencies.length > 0) {
          setCurrencyOptions(currencies.map(c => c.currencyCode));
        }
      } catch {
        // keep default USD/EUR/GBP/CNY/HKD/VND
      }
      
      // ✅ 修复：初始加载常用港口（前50个），避免编辑时下拉框空白
      try {
        const [commonSeaPorts, commonAirPorts] = await Promise.all([
          masterDataApi.searchPorts('SEA', ''),  // 加载海港
          masterDataApi.searchPorts('AIR', ''),  // 加载空港
        ]);
        const initialPorts = [...(commonSeaPorts || []).slice(0, 50), ...(commonAirPorts || []).slice(0, 50)];
        console.log('[EnquiryForm] Loaded initial ports:', initialPorts.length);
        // ✅ 修复竞争条件：合并而非替换，避免覆盖 ensurePortsLoaded 已加载的选中港口
        setPorts(prev => {
          const merged = new Map(prev.map(p => [String(p.value), p]));
          initialPorts.forEach(p => merged.set(String(p.value), p));
          return Array.from(merged.values());
        });
      } catch (portErr) {
        console.error('Failed to load initial ports:', portErr);
        setPorts([]);  // 失败时仍然设置空数组
      }
      
      // 设置产品类型选项 (V3: 7 products)
      setProducts([
        { value: 'AIR', label: 'AIR' },
        { value: 'SEA', label: 'SEA' },
        { value: 'RAIL', label: 'RAIL' },
        { value: 'SEA-AIR', label: 'SEA-AIR' },
        { value: 'RAIL-SEA', label: 'RAIL-SEA' },
        { value: 'RAIL-AIR', label: 'RAIL-AIR' },
        { value: 'AIR-RAIL-SEA', label: 'AIR-RAIL-SEA (ARS)' },
      ]);
      
      // 设置货物类型选项 (V3: 4 cargo types)
      setCargoTypes([
        { value: 'FCL', label: 'FCL' },
        { value: 'LCL', label: 'LCL' },
        { value: 'AIR', label: 'AIR' },
        { value: 'BUYER-CONSOL', label: 'BUYER-CONSOL' },
      ]);
    } catch (error) {
      console.error('Failed to load master data:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Product → Cargo Type 联动过滤
      if (field === 'productCode') {
        const allowed = PRODUCT_CARGO_MAP[value as ProductCode] || ['FCL','LCL','AIR','BUYER-CONSOL'];
        const filteredCargo = allowed.map(c => ({ value: c, label: c }));
        setCargoTypes(filteredCargo);
        // 如果当前 cargoTypeCode 不在允许列表中，重置为第一个
        if (!allowed.includes(updated.cargoTypeCode || '')) {
          updated.cargoTypeCode = allowed[0];
        }
      }
      return updated;
    });
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
    // CORE / NON-CORE 自动映射：从 allCountries 查找 isCore
    let autoCore: string | undefined = undefined;
    if (countryCode && allCountries.length > 0) {
      const matched = allCountries.find(c => c.countryCode.toUpperCase() === countryCode.toUpperCase());
      if (matched) {
        autoCore = (matched as any).isCore ? 'Core' : 'Non-Core';
        setCoreFlagWarning(`✅ Auto: ${autoCore}`);
      } else {
        // AGENTS / OTHERS / TBA → Non-Core
        autoCore = 'Non-Core';
        setCoreFlagWarning('⚠️ No country match → Non-Core');
      }
    } else {
      setCoreFlagWarning('');
    }

    setFormData(prev => ({
      ...prev,
      salesCountryCode: countryCode,
      salesPicId: undefined,
      salesPicName: undefined,
      salesOfficeId: undefined,
      salesOfficeName: undefined,
      ...(autoCore ? { coreNonCore: autoCore as any } : {}),
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
    if (formData.refNumber) {
      return formData.refNumber;
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

  // TODO: Container details moved to Offer price lines in v3

  // ── Helper: 从 Container Information 行生成预填的 containerDetails ──
  const buildContainerDetailsFromRows = (): OfferContainerDetail[] => {
    const row = (formData.containerRows && formData.containerRows.length > 0)
      ? formData.containerRows[0]
      : null;
    if (!row) return [];

    // Build TEU lookup from containerTypesOpts (DB values)
    const teuMap: Record<string, number> = {};
    containerTypesOpts.forEach(ct => {
      const code = ct.label.split(' - ')[0] || ct.label;
      teuMap[code] = ct.teuValue;
    });
    // Defaults
    if (!teuMap['20GP']) teuMap['20GP'] = 1.0;
    if (!teuMap['40GP']) teuMap['40GP'] = 2.0;
    if (!teuMap['40HQ']) teuMap['40HQ'] = 2.0;
    if (!teuMap['45HQ']) teuMap['45HQ'] = 2.0;

    const details: OfferContainerDetail[] = [];

    // Default columns
    const defaultMapping: { code: string; qty: number | undefined; weight?: number | undefined }[] = [
      { code: '20GP', qty: row.qty20, weight: row.weight20 },
      { code: '40GP', qty: row.qty40 },
      { code: '40HQ', qty: row.qty40hq },
      { code: '45HQ', qty: row.qty45 },
    ];
    for (const { code, qty, weight } of defaultMapping) {
      if (qty && qty > 0) {
        const teuFactor = teuMap[code] || 1;
        details.push({
          containerSizeType: code,
          numberOfContainers: qty,
          cargoWeightPerContainer: weight || undefined,
          teuValue: teuFactor,
          lineTeu: qty * teuFactor,
        });
      }
    }

    // Extra dynamic columns
    const extras = row.extraContainers || {};
    const extraWeights = row.extraContainerWeights || {};
    for (const [code, qty] of Object.entries(extras)) {
      if (qty && qty > 0) {
        const teuFactor = teuMap[code] || (code.startsWith('20') ? 1.0 : 2.0);
        const wt = code.startsWith('20') ? (extraWeights[code] || undefined) : undefined;
        details.push({
          containerSizeType: code,
          numberOfContainers: qty,
          cargoWeightPerContainer: wt,
          teuValue: teuFactor,
          lineTeu: qty * teuFactor,
        });
      }
    }

    return details;
  };

  // ── Helper: 根据当前POL/POD选择，生成 PriceLine 笛卡尔积 ──
  const generatePriceLinesFromPorts = (): OfferPriceLine[] => {
    const lines: OfferPriceLine[] = [];
    const productCode = formData.productCode || 'SEA';
    const mixed = isMixedProduct(productCode as ProductCode);

    // Pre-fill container details from Container Information table
    const prefillDetails = buildContainerDetailsFromRows();

    if (mixed && formData.routeGroups && formData.routeGroups.length > 0) {
      // 混合模式: 每个 RouteGroup 单独生成
      formData.routeGroups.forEach(rg => {
        (rg.polIds || []).forEach(polId => {
          (rg.podIds || []).forEach(podId => {
            lines.push({
              polId: Number(polId),
              podId: Number(podId),
              routeGroupId: rg.groupIndex,  // 临时存放 groupIndex，提交时由handleSubmit处理
              subMode: rg.subMode,
              sortOrder: rg.groupIndex,     // 用sortOrder携带分组序号，后端用此关联真实ID
              containerDetails: prefillDetails.map(d => ({ ...d })),
            });
          });
        });
      });
    } else {
      // 普通模式: polIds × podIds
      (formData.polIds || []).forEach(polId => {
        (formData.podIds || []).forEach(podId => {
          lines.push({
            polId: Number(polId),
            podId: Number(podId),
            containerDetails: prefillDetails.map(d => ({ ...d })),
          });
        });
      });
    }
    return lines;
  };

  // Offer 管理函数
  const addOffer = () => {
    // Get local date (not UTC) to avoid timezone offset issues
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 自动生成 PriceLine 行 (POL×POD)
    const priceLines = generatePriceLinesFromPorts();

    const newOffer: Offer = {
      id: Date.now(),
      enquiryId: formData.id || 0,
      offerType: (formData.cargoTypeCode as OfferType) || 'FCL',
      sequenceNo: (formData.offers || []).length + 1,
      offerDate: localDateStr,
      isLatest: true,
      priceLines,
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

  /** 更新 Offer 内的 PriceLines（由 OfferPriceTable 调用） */
  const updateOfferPriceLines = (offerIndex: number, priceLines: OfferPriceLine[]) => {
    const offers = [...(formData.offers || [])];
    offers[offerIndex] = { ...offers[offerIndex], priceLines };
    setFormData(prev => ({ ...prev, offers }));
  };

  /** 重新生成某个 Offer 的 PriceLines（保留已有价格数据） */
  const regeneratePriceLines = (offerIndex: number) => {
    const offer = (formData.offers || [])[offerIndex];
    if (!offer) return;
    const freshLines = generatePriceLinesFromPorts();
    // 尝试保留已有的价格数据
    // 使用 polId + podId + subMode 匹配（而不是 routeGroupId，因为已有数据的
    // routeGroupId 是数据库ID，而新生成行的 routeGroupId 是 groupIndex，两者不一致）
    const merged = freshLines.map(fl => {
      const existing = offer.priceLines.find(
        el => el.polId === fl.polId && el.podId === fl.podId &&
              (el.subMode || '') === (fl.subMode || '')
      );
      if (existing) {
        // 合并 containerDetails：以新生成的为基准，保留已有价格数据
        const mergedDetails = mergeContainerDetails(
          fl.containerDetails || [],
          existing.containerDetails || [],
        );
        // 保留已有价格数据，但使用新的路由结构字段和合并后的容器详情
        return {
          ...fl,
          ...existing,
          containerDetails: mergedDetails,
          routeGroupId: fl.routeGroupId,
          sortOrder: fl.sortOrder,
          subMode: fl.subMode,
        };
      }
      return fl;
    });
    updateOfferPriceLines(offerIndex, merged);
  };

  /**
   * 合并 containerDetails 数组:
   * - 保留 existing 中已有价格数据的条目
   * - 添加 fresh 中新出现的容器类型（如新增的 20'OT, 40'HC）
   * - 移除 fresh 中不再存在的容器类型
   */
  const mergeContainerDetails = (
    freshDetails: OfferContainerDetail[],
    existingDetails: OfferContainerDetail[],
  ): OfferContainerDetail[] => {
    return freshDetails.map(fd => {
      const ex = existingDetails.find(
        ed => ed.containerSizeType === fd.containerSizeType
      );
      if (ex) {
        // 保留已有价格数据，用新的数量/TEU 更新
        return {
          ...ex,
          numberOfContainers: fd.numberOfContainers,
          cargoWeightPerContainer: fd.cargoWeightPerContainer ?? ex.cargoWeightPerContainer,
          teuValue: fd.teuValue,
          lineTeu: fd.lineTeu,
        };
      }
      // 新增的容器类型
      return fd;
    });
  };

  const removeOffer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      offers: (prev.offers || []).filter((_, i) => i !== index),
    }));
  };

  // POD Country 自动映射 + CORE Flag自动计算
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
        const country = allCountries.find(c => String(c.countryCode).toUpperCase() === String(code).toUpperCase());
        console.log(`Looking for country ${code}, found:`, country);
        return country?.countryNameEn;
      })
      .filter(Boolean)
      .join(', ');
    
    console.log('Final country names:', countryNames);
    
    // NOTE: isCore removed from Country in v3 — user must set Core/Non-Core manually
    
    // ✅ 根据 POD 国家的 isCore 属性自动计算 CORE/NON-CORE
    let autoCore: string | undefined = undefined;
    if (countryCodes.length > 0 && allCountries.length > 0) {
      // 如果任何 POD 国家是 Core，则整体为 Core
      const hasCoreCountry = countryCodes.some(code => {
        const country = allCountries.find(c => String(c.countryCode).toUpperCase() === String(code).toUpperCase());
        return country && (country as any).isCore === true;
      });
      autoCore = hasCoreCountry ? 'Core' : 'Non-Core';
      setCoreFlagWarning(`✅ Auto (POD Country): ${autoCore}`);
    }

    setFormData(prev => ({
      ...prev,
      podIds: podIdStrings.map(id => parseInt(id, 10)), // 存储为数字数组
      podCountry: countryNames || '未找到对应国家', // 显示所有国家名称
      ...(autoCore ? { coreNonCore: autoCore as any } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 同步防重复提交：useRef 不依赖 React 渲染周期，双击时第二次立即返回
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
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
      if (!formData.assignedCnOffice) {
        alert('Please select Assigned CN Office');
        setIsLoading(false);
        return;
      }

      // 验证 Cargo Ready Date 二选一
      if (formData.hasSpecificCargoReadyDate && !formData.cargoReadyDate) {
        alert('Please fill in Cargo Ready Date or check "No Cargo Ready Date Provided"');
        setIsLoading(false);
        return;
      }

      // 验证容器信息（FCL/BUYER-CONSOL 时至少一个柜型 > 0）
      if (CONTAINER_CARGO_TYPES.includes(formData.cargoTypeCode || '')) {
        const containerRows = formData.containerRows || [];
        const hasAnyContainer = containerRows.some(r =>
          (r.qty20 || 0) > 0 || (r.qty40 || 0) > 0 || (r.qty40hq || 0) > 0 || (r.qty45 || 0) > 0 ||
          Object.values(r.extraContainers || {}).some(v => (v || 0) > 0)
        );
        if (!hasAnyContainer) {
          alert('At least one container type must have Number of containers > 0');
          setIsLoading(false);
          return;
        }
      }

      // 验证港口选择
      const mixed = isMixedProduct((formData.productCode || 'SEA') as ProductCode);
      if (mixed) {
        // 混合模式：验证 route groups 中的 POL/POD
        const rgs = formData.routeGroups || [];
        const hasEmptyPol = rgs.some(rg => !rg.polIds || rg.polIds.length === 0);
        const hasEmptyPod = rgs.some(rg => !rg.podIds || rg.podIds.length === 0);
        if (rgs.length === 0 || hasEmptyPol) {
          alert('Please select POL in each Route Group');
          setIsLoading(false);
          return;
        }
        if (hasEmptyPod) {
          alert('Please select POD in each Route Group');
          setIsLoading(false);
          return;
        }
        // 自动汇总 route group 的 polIds/podIds 到顶层
        const allPolIds: number[] = [];
        const allPodIds: number[] = [];
        rgs.forEach(rg => {
          (rg.polIds || []).forEach(id => allPolIds.push(Number(id)));
          (rg.podIds || []).forEach(id => allPodIds.push(Number(id)));
        });
        formData.polIds = [...new Set(allPolIds)];
        formData.podIds = [...new Set(allPodIds)];
      } else {
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
      }

      // 构建提交数据
      let enquiryToSubmit: any = {
        ...formData,
        polIds: formData.polIds || [],
        podIds: formData.podIds || [],
      };

      // 确保 enquiryCreatedDate 是 LocalDateTime 格式 (后端需要 "yyyy-MM-ddTHH:mm:ss")
      if (enquiryToSubmit.enquiryCreatedDate && !enquiryToSubmit.enquiryCreatedDate.includes('T')) {
        enquiryToSubmit.enquiryCreatedDate = enquiryToSubmit.enquiryCreatedDate + 'T00:00:00';
      }

      // Container details moved to Offer price lines in v3
      delete enquiryToSubmit.containerLines;

      // 处理offers：新建时发送必要字段，编辑时避免覆盖已有offers
      if (enquiryToSubmit.offers && Array.isArray(enquiryToSubmit.offers)) {
        if (formData.id) {
          // 编辑模式：发送offers，后端会正确处理合并
            enquiryToSubmit.offers = enquiryToSubmit.offers.map((offer: any) => ({
              id: offer.id || undefined,
              offerType: offer.offerType,
              sequenceNo: offer.sequenceNo,
              isLatest: offer.isLatest ?? false,
              offerDate: offer.offerDate || null,
              remark: offer.remark || null,
              containerCurrency: offer.containerCurrency || null,
              localChargeCurrency: offer.localChargeCurrency || null,
              priceLines: (offer.priceLines || []).map((pl: any) => ({
                ...pl,
                // 编辑已有数据时保留真实 routeGroupId（数据库ID较大），新行的 groupIndex 值设为 null
                routeGroupId: (typeof pl.routeGroupId === 'number' && pl.routeGroupId > 100) ? pl.routeGroupId : null,
              })),
            }));
        } else {
          // 新建模式：routeGroupId 全部设为 null，用 sortOrder 携带 groupIndex 给后端关联
          enquiryToSubmit.offers = enquiryToSubmit.offers.map((offer: any) => ({
            offerType: offer.offerType,
            sequenceNo: offer.sequenceNo,
            isLatest: offer.isLatest ?? false,
            offerDate: offer.offerDate || null,
            remark: offer.remark || null,
            containerCurrency: offer.containerCurrency || null,
            localChargeCurrency: offer.localChargeCurrency || null,
            priceLines: (offer.priceLines || []).map((pl: any) => ({
              ...pl,
              routeGroupId: null,  // ← 新建时不传 routeGroupId，避免 FK 错误
              sortOrder: pl.sortOrder ?? pl.routeGroupId ?? 0,  // 用 sortOrder 携带分组序号
            })),
          }));
        }
      }

      // ✅ 保留 polIds 和 podIds（后端需要处理多港口）
      // 不删除这些字段，让后端接收并处理

      // 编辑模式：确保必需字段都已包含，防止 NOT NULL 约束错误
      if (formData.id) {
        // ✅ 保留原有的必需字段值（如果新值为空则使用旧值）
        enquiryToSubmit.refNumber = enquiryToSubmit.refNumber || initialData?.refNumber;
        enquiryToSubmit.productCode = enquiryToSubmit.productCode || initialData?.productCode;
        enquiryToSubmit.productAbbr = enquiryToSubmit.productAbbr || initialData?.productAbbr;
        enquiryToSubmit.status = enquiryToSubmit.status || initialData?.status || 'New';
        enquiryToSubmit.salesCountryCode = enquiryToSubmit.salesCountryCode || initialData?.salesCountryCode;
        enquiryToSubmit.salesOfficeId = enquiryToSubmit.salesOfficeId || initialData?.salesOfficeId;
        enquiryToSubmit.salesPicId = enquiryToSubmit.salesPicId || initialData?.salesPicId;
        enquiryToSubmit.assignedCnOffice = enquiryToSubmit.assignedCnOffice || initialData?.assignedCnOffice;
        enquiryToSubmit.cargoTypeCode = enquiryToSubmit.cargoTypeCode || initialData?.cargoTypeCode;
        enquiryToSubmit.enquiryCreatedDate = enquiryToSubmit.enquiryCreatedDate || initialData?.enquiryCreatedDate;
        enquiryToSubmit.enquiryReceivedDate = enquiryToSubmit.enquiryReceivedDate || initialData?.enquiryReceivedDate;
      } else {
        // 新建模式：Increase 保留 refNumber（serialNumber > 0 标识 increase），普通新建删除
        const isIncrease = enquiryToSubmit.serialNumber && enquiryToSubmit.serialNumber > 0;
        if (!isIncrease) {
          delete enquiryToSubmit.refNumber;
        }
      }

      onSubmit(enquiryToSubmit as Enquiry);
    } catch (error) {
      console.error('Failed to save enquiry:', error);
      alert('Failed to save enquiry');
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white shadow rounded-lg p-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {formData.id ? `Edit Enquiry #${formData.refNumber}` : 'New Enquiry'}
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
                {!formData.refNumber && (referencePreview ? 'Auto-generated in real-time' : 'Auto-generated after selecting Product Type')}
              </p>
            </div>

            <div>
              <DatePickerInput
                label="Enquiry Received Date"
                value={formData.enquiryReceivedDate}
                max={getLocalDateISO()}
                onChange={(date) => {
                  const todayStr = getLocalDateISO();
                  if (date > todayStr) {
                    alert('询价接收日期不能晚于今天之后的日期');
                    return;
                  }
                  handleChange('enquiryReceivedDate', date);
                }}
                required
                placeholder="YYYY/MM/DD"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Enquiry Created Date</label>
              <input
                type="date"
                value={formData.enquiryCreatedDate}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Product Type <span className="text-red-500 font-bold">*</span></label>
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

            {/* TODO: CN Pricing Admin removed in v3 */}
          </div>
        </AccordionItem>

        {/* 2. Sales Information */}
        <AccordionItem title="Sales Information ⭐" defaultExpanded={true} badge="Cascade" required>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700">Z-Country / Agent <span className="text-red-500 font-bold">*</span></label>
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
                <label className="block text-sm font-medium text-gray-700">Sales PIC <span className="text-red-500 font-bold">*</span></label>
                <SearchableSelect
                  options={salesPics.map(pic => ({
                    value: Number(pic.value),
                    label: pic.label,
                  }))}
                  value={formData.salesPicId || ''}
                  onChange={(val) => handleSalesPicChange(Number(val))}
                  placeholder="Search Sales PIC..."
                  disabled={!formData.salesCountryCode}
                  required
                />
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
                <label className="block text-sm font-medium text-gray-700">Assigned CN Office <span className="text-red-500 font-bold">*</span></label>
                <select
                  value={formData.assignedCnOffice || ''}
                  onChange={(e) => handleChange('assignedCnOffice', e.target.value)}
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

        {/* 3. Cargo Information — V3 需求9: 按 CargoType 动态显示字段 */}
        <AccordionItem title="Cargo Information" defaultExpanded={true}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cargo Type <span className="text-red-500 font-bold">*</span></label>
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

              {/* AIR/LCL 额外显示 Volume, Quantity, UOM */}
              {!CONTAINER_CARGO_TYPES.includes(formData.cargoTypeCode || '') && (
                <>
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
                </>
              )}
            </div>

            {/* AIR/LCL: Quantity + UOM */}
            {!CONTAINER_CARGO_TYPES.includes(formData.cargoTypeCode || '') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    value={formData.uom || ''}
                    onChange={(e) => handleChange('uom', e.target.value)}
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
            )}

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
                value={formData.hazardousSpecialEquipment || ''}
                onChange={(e) => handleChange('hazardousSpecialEquipment', e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="DG class, UN No., special equipment..."
              />
            </div>

            {/* FCL/BUYER-CONSOL: 容器信息表格 */}
            {CONTAINER_CARGO_TYPES.includes(formData.cargoTypeCode || '') && (
              <CargoContainerTable
                rows={formData.containerRows || [{ qty20: 0, qty40: 0, qty40hq: 0, qty45: 0 }]}
                onChange={(rows) => handleChange('containerRows', rows)}
                containerTypes={containerTypesOpts}
                isOversizeCargo={formData.isOversizeCargo || false}
                onOversizeCargoChange={(val) => setFormData(prev => ({ ...prev, isOversizeCargo: val }))}
              />
            )}
          </div>
        </AccordionItem>

        {/* TODO: Container details moved to Offer price lines in v3 */}

        {/* 4. Route Information */}
        <AccordionItem title="Route Information" defaultExpanded={true} required>
          <div className="space-y-4">
            {/* Top-level POL/POD: only for non-mixed products */}
            {!isMixedProduct((formData.productCode || 'SEA') as ProductCode) && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <VirtualizedMultiSelect
                    label="Port of Loading (POL)"
                    options={ports.map(p => ({
                      value: p.value,
                      label: p.label,
                      searchText: p.label
                    }))}
                    value={formData.polIds || []}
                    onChange={(values) => handleChange('polIds', values.map(v => Number(v)))}
                    placeholder="Search and select ports of loading..."
                    required
                    maxSelections={10}
                    itemHeight={36}
                    listHeight={600}
                    showCount={false}
                    onSearch={handlePortSearch}
                    isSearching={isPortSearching}
                  />

                  <VirtualizedMultiSelect
                    label="Port of Discharge (POD)"
                    options={ports.map(p => ({
                      value: p.value,
                      label: p.label,
                      searchText: p.label
                    }))}
                    value={formData.podIds || []}
                    onChange={(values) => {
                      const podIds = values.map(v => Number(v));
                      handleChange('podIds', podIds);
                      if (podIds.length > 0) {
                        updatePodCountries(podIds);
                      } else {
                        setCoreFlagWarning('');
                        setFormData(prev => ({
                          ...prev,
                          podIds: [],
                          podCountry: undefined,
                          coreNonCore: undefined,
                        }));
                      }
                    }}
                    placeholder="Search and select ports of discharge..."
                    required
                    maxSelections={10}
                    itemHeight={36}
                    listHeight={600}
                    showCount={false}
                    onSearch={handlePortSearch}
                    isSearching={isPortSearching}
                  />
                </div>
              </>
            )}

            {/* POD Country for non-mixed: show above route groups */}
            {!isMixedProduct((formData.productCode || 'SEA') as ProductCode) && (
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
                      value={formData.podCountry || 'Please select POD first'}
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
            )}

            {/* Route Group Editor for mixed-mode products */}
            {isMixedProduct(formData.productCode || 'SEA') && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <RouteGroupEditor
                  productCode={formData.productCode || 'SEA'}
                  routeGroups={formData.routeGroups || []}
                  onChange={(groups) => {
                    handleChange('routeGroups', groups);
                    // Ensure route group ports are loaded into main ports state
                    const allPortIds: number[] = [];
                    groups.forEach(rg => {
                      (rg.polIds || []).forEach(id => allPortIds.push(Number(id)));
                      (rg.podIds || []).forEach(id => allPortIds.push(Number(id)));
                    });
                    if (allPortIds.length > 0) {
                      ensurePortsLoaded(allPortIds);
                    }
                    // Auto-map POD Country from route group PODs
                    const allPodIds: number[] = [];
                    groups.forEach(rg => {
                      (rg.podIds || []).forEach(id => allPodIds.push(Number(id)));
                    });
                    if (allPodIds.length > 0) {
                      updatePodCountries(allPodIds);
                    }
                  }}
                />

                {/* POD Country for mixed: show BELOW route groups */}
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
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
                        value={formData.podCountry || 'Select POD in Route Groups above'}
                        disabled
                        className="mt-1 block w-full rounded-md border-blue-300 bg-blue-100 text-blue-900 shadow-sm font-medium"
                        placeholder="Auto-filled based on selected POD"
                      />
                      <p className="mt-1 text-xs text-blue-700">
                        💡 This field auto-maps country from POD selected in Route Groups.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AccordionItem>

        {/* 5. Business Classification */}
        <AccordionItem title="Business Classification" defaultExpanded={true}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CORE / NON-CORE
                {coreFlagWarning && (
                  <span className={`ml-2 text-xs ${coreFlagWarning.includes('⚠️') ? 'text-yellow-600' : 'text-green-600'}`}>
                    {coreFlagWarning}
                  </span>
                )}
              </label>
              <select
                value={formData.coreNonCore || ''}
                onChange={(e) => {
                  handleChange('coreNonCore', e.target.value);
                  setCoreFlagWarning(''); // 清除警告，表示用户已手动选择
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select...</option>
                <option value="Core">Core</option>
                <option value="Non-Core">Non-Core</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={formData.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select category</option>
                <option value="OCEAN_FREIGHT">Ocean Freight</option>
                <option value="OCEAN_FREIGHT_ORIGIN">Ocean Freight + Origin Charges &amp; EXW</option>
                <option value="OCEAN_FREIGHT_ORIGIN_DEST">Ocean Freight + Origin Charges &amp; EXW + Dest. Charges</option>
                <option value="ORIGIN_CHARGES_EXW">Origin Charges &amp; EXW</option>
                <option value="DEST_CHARGES">Dest. Charges</option>
                <option value="LCL">LCL</option>
                <option value="AIR_FREIGHT">Air Freight</option>
                <option value="AIR_FREIGHT_ORIGIN">Air Freight + Origin Charge &amp; EXW</option>
              </select>
            </div>

            {/* Cargo Ready Date — 二选一逻辑 */}
            <div className="md:col-span-3 space-y-3">
              {/* 复选框: No Cargo Ready Date Provided（勾选 = 没有具体日期 = hasSpecificCargoReadyDate=false） */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasSpecificCargoReadyDate === false || formData.hasSpecificCargoReadyDate === undefined}
                    onChange={(e) => {
                      const noCrdProvided = e.target.checked;
                      handleChange('hasSpecificCargoReadyDate', !noCrdProvided);
                      if (noCrdProvided) {
                        // 勾选"没有具体日期"→ CRD = 创建日期
                        handleChange('cargoReadyDate', formData.enquiryCreatedDate || getLocalDateISO());
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">No Cargo Ready Date Provided</span>
                </label>
              </div>

              {/* 日期选择器: 始终显示，但勾选"No CRD"时禁用(置灰) */}
              <DatePickerInput
                label={formData.hasSpecificCargoReadyDate ? "Cargo Ready Date *" : "Cargo Ready Date (disabled)"}
                value={formData.cargoReadyDate || ''}
                onChange={(date) => handleChange('cargoReadyDate', date)}
                placeholder="YYYY/MM/DD"
                disabled={!formData.hasSpecificCargoReadyDate}
              />

              {/* Cargo Ready Date Details: 勾选 No CRD 时显示 */}
              {(!formData.hasSpecificCargoReadyDate) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cargo Ready Date Details (TBA/Week etc.)</label>
                  <input
                    type="text"
                    value={formData.cargoReadyDateDetails || ''}
                    onChange={(e) => handleChange('cargoReadyDateDetails', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g. TBA, Week 5, End of Feb, Any time"
                  />
                </div>
              )}
            </div>
          </div>
        </AccordionItem>

        {/* 6. Offer Information */}
        <AccordionItem title="Offer Information" badge={formData.offers?.length?.toString()} defaultExpanded={true}>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Offer Type *</label>
                        <select
                          value={offer.offerType}
                          onChange={(e) => updateOffer(index, 'offerType', e.target.value)}
                          className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        >
                          {(PRODUCT_CARGO_MAP[(formData.productCode || 'SEA') as ProductCode] || ['FCL','LCL','AIR','BUYER-CONSOL']).map(ct => (
                            <option key={ct} value={ct}>{ct}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Offer Date *</label>
                        <DatePickerInput
                          value={offer.offerDate}
                          max={getLocalDateISO()}
                          onChange={(date) => {
                            const todayStr = getLocalDateISO();
                            if (date > todayStr) {
                              alert('报价日期不能晚于今天之后的日期');
                              return;
                            }
                            updateOffer(index, 'offerDate', date);
                          }}
                          placeholder="YYYY/MM/DD"
                          required
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => regeneratePriceLines(index)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-300 rounded px-2 py-1.5 hover:bg-indigo-50 transition-colors"
                          title="Regenerate price lines from current POL/POD selection"
                        >
                          ↻ Refresh Price Lines
                        </button>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Remark</label>
                        <textarea
                          value={offer.remark || ''}
                          onChange={(e) => updateOffer(index, 'remark', e.target.value)}
                          rows={2}
                          className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Offer notes..."
                        />
                      </div>
                    </div>

                    {/* V3 Price Details table */}
                    <OfferPriceTable
                      offer={offer}
                      offerIndex={index}
                      ports={ports}
                      containerTypes={containerTypesOpts}
                      carrierOptions={carrierOptions}
                      currencyOptions={currencyOptions}
                      routeGroups={formData.routeGroups}
                      isMixed={isMixedProduct((formData.productCode || 'SEA') as ProductCode)}
                      onUpdatePriceLines={updateOfferPriceLines}
                      isOversizeCargo={formData.isOversizeCargo || false}
                      onOversizeCargoChange={(val) => setFormData(prev => ({ ...prev, isOversizeCargo: val }))}
                      onUpdateOffer={updateOffer}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </AccordionItem>

        {/* 7. Additional Information */}
        <AccordionItem title="Additional Information" defaultExpanded={true}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Requirements</label>
              <textarea
                value={formData.additionalRequirements || ''}
                onChange={(e) => handleChange('additionalRequirements', e.target.value)}
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

        {/* 8. Status & Result */}
        <AccordionItem title="Status & Result" defaultExpanded={true}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status <span className="text-red-500 font-bold">*</span></label>
                <select
                  value={formData.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    handleChange('status', newStatus);
                    // 切换到非 Lost/Cancelled 时清空对应 reason
                    if (newStatus !== 'Lost') {
                      handleChange('lostReason', '');
                      handleChange('lostReasonText', '');
                    }
                    if (newStatus !== 'Cancelled') {
                      handleChange('cancelledReason', '');
                      handleChange('cancelledReasonText', '');
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="New">New</option>
                  <option value="Quoted & Pending">Quoted &amp; Pending</option>
                  <option value="Secured">Secured</option>
                  <option value="Lost">Lost</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {formData.status === 'Lost' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lost Reason <span className="text-red-500 font-bold">*</span></label>
                  <select
                    value={formData.lostReason || ''}
                    onChange={(e) => handleChange('lostReason', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">-- Select reason --</option>
                    {lostReasons.map((r) => (
                      <option key={r.code} value={r.code}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {formData.lostReason === 'OTHERS' ? 'Please specify *' : 'Additional details'}
                  </label>
                  <input
                    type="text"
                    value={formData.lostReasonText || ''}
                    onChange={(e) => handleChange('lostReasonText', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder={formData.lostReason === 'OTHERS' ? 'Please describe the reason...' : 'Optional notes'}
                  />
                </div>
              </div>
            )}

            {formData.status === 'Cancelled' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cancelled Reason <span className="text-red-500 font-bold">*</span></label>
                  <select
                    value={formData.cancelledReason || ''}
                    onChange={(e) => handleChange('cancelledReason', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">-- Select reason --</option>
                    {cancelledReasons.map((r) => (
                      <option key={r.code} value={r.code}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {formData.cancelledReason === 'OTHERS' ? 'Please specify *' : 'Additional details'}
                  </label>
                  <input
                    type="text"
                    value={formData.cancelledReasonText || ''}
                    onChange={(e) => handleChange('cancelledReasonText', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder={formData.cancelledReason === 'OTHERS' ? 'Please describe the reason...' : 'Optional notes'}
                  />
                </div>
              </div>
            )}
          </div>
        </AccordionItem>
      </Accordion>

      {/* 底部操作按钮区域 */}
      <div className="flex justify-end gap-3 bg-white shadow rounded-lg p-4 mt-4 border-t border-gray-200 sticky bottom-0 z-10">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-6 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Enquiry'}
        </button>
      </div>
    </form>
  );
};

export default EnquiryForm;
