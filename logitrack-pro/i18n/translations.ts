// ============================================================
// i18n Translations - 国际化翻译文件
// ============================================================

export type Language = 'zh' | 'en';

export interface Translations {
  // Common
  loading: string;
  retry: string;
  error: string;
  noData: string;
  refresh: string;
  save: string;
  cancel: string;
  confirm: string;
  export: string;
  import: string;
  delete: string;
  edit: string;
  add: string;
  back: string;
  close: string;
  search: string;
  all: string;

  // Dashboard
  dashboard: {
    title: string;
    subtitle: string;
    monthlyTrend: string;
    topCountries: string;
    topOrigins: string;
    topDestinations: string;
    cargoTypes: string;
    statusBreakdown: string;
    cnOfficeStats: string;
    selectMonth: string;
  };

  // Statistics
  statistics: {
    totalEnquiries: string;
    quoted: string;
    confirmed: string;
    pending: string;
    rejected: string;
    totalRevenue: string;
    avgPrice: string;
    costPerUnit: string;
  };

  // Enhanced Dashboard
  enhancedDashboard: {
    title: string;
    subtitle: string;
    filters: string;
    applyFilters: string;
    resetFilters: string;
    startDate: string;
    endDate: string;
    coreStatus: string;
    cnOffice: string;
    core: string;
    nonCore: string;
    filteredResults: string;
    noResults: string;
  };

  // Comparison Report
  comparisonReport: {
    title: string;
    subtitle: string;
    comparisonType: string;
    monthly: string;
    quarterly: string;
    selectPeriods: string;
    compare: string;
    maxPeriods: string;
    growthRate: string;
    declined: string;
    improved: string;
    stable: string;
    noComparison: string;
    selectAtLeastTwo: string;
  };

  // Common Dashboard Elements
  common: {
    all: string;
    shanghai: string;
    shenzhen: string;
    beijing: string;
    guangzhou: string;
    hongKong: string;
    yes: string;
    no: string;
    pending: string;
    rejected: string;
    invalid: string;
    month: string;
    year: string;
    quarter: string;
  };

  // Filters
  filters: {
    selectPeriod: string;
    selectCoreStatus: string;
    selectOffice: string;
    clearFilters: string;
    filterApplied: string;
    dataFilter: string;
    applied: string;
    collapse: string;
    expand: string;
    startDate: string;
    endDate: string;
    cnOffice: string;
    allOffices: string;
    applyFilter: string;
    clear: string;
    currentFilters: string;
    selectDateRange: string;
    product: string;
    allProducts: string;
    country: string;
    allCountries: string;
  };

  // Offices
  offices: {
    shanghai: string;
    shenzhen: string;
    beijing: string;
    guangzhou: string;
    hongkong: string;
    multiOffice: string;
  };

  // CN Office Statistics
  cnOfficeStats: {
    title: string;
    office: string;
    totalEnquiries: string;
    yes: string;
    rejected: string;
    invalid: string;
    pending: string;
    conversionRate: string;
    rank: string;
    action: string;
    officesCount: string;
    exportCSV: string;
    noData: string;
    yesDetails: string;
    rejectedDetails: string;
    invalidDetails: string;
    pendingDetails: string;
    clickToView: string;
  };

  // Audit Log - Change Details Modal
  changeDetails: {
    title: string;
    operationInfo: string;
    operationLogId: string;
    operationUser: string;
    userRole: string;
    operationTime: string;
    operationType: string;
    resourceType: string;
    resourceId: string;
    changeSummary: string;
    fieldChanges: string;
    field: string;
    before: string;
    after: string;
    newData: string;
    deletedData: string;
    noChangeInfo: string;
    rawData: string;
    beforeData: string;
    afterData: string;
    closeButton: string;
    noFieldChanges: string;
  };

  // Audit Log Actions
  auditActions: {
    CREATE: string;
    UPDATE: string;
    DELETE: string;
    VIEW: string;
    EXPORT: string;
    LOGIN: string;
    LOGOUT: string;
  };

  // Field Labels
  fieldLabels: {
    id: string;
    referenceNumber: string;
    status: string;
    enquiryReceivedDate: string;
    issueDate: string;
    productCode: string;
    productAbbr: string;
    salesCountryCode: string;
    salesOfficeId: string;
    salesPicId: string;
    cargoTypeCode: string;
    quantity: string;
    quantityUomCode: string;
    volumeCbm: string;
    quantityTeu: string;
    commodity: string;
    cnPricingAdmin: string;
    assignedCnOfficeCode: string;
    polId: string;
    podId: string;
    polIds: string;
    podIds: string;
    bookingConfirmed: string;
    remark: string;
    createdAt: string;
    updatedAt: string;
  };

  // Audit Log Main Component
  auditLog: {
    title: string;
    subtitle: string;
    refresh: string;
    export: string;
    clear: string;
    clearConfirm: string;
    clearSuccess: string;
    clearFailed: string;
    exportFailed: string;
    filterTitle: string;
    startDate: string;
    endDate: string;
    username: string;
    usernamePlaceholder: string;
    operationType: string;
    resourceType: string;
    resourceTypePlaceholder: string;
    allTypes: string;
    search: string;
    reset: string;
    loading: string;
    noData: string;
    tableHeaders: {
      sequence: string;
      time: string;
      username: string;
      userRole: string;
      cnPricingAdmin: string;
      operation: string;
      resourceType: string;
      resourceName: string;
      changeDetails: string;
      status: string;
    };
    userRoles: {
      admin: string;
      salesManager: string;
      pricingAdmin: string;
      user: string;
    };
    statusLabels: {
      success: string;
      failure: string;
    };
    clickToViewDetails: string;
    pagination: {
      total: string;
      records: string;
      page: string;
      of: string;
      previous: string;
      next: string;
    };
  };

  // Error Messages
  errors: {
    loadingFailed: string;
    dataLoadFailed: string;
    filterFailed: string;
    compareFailed: string;
    networkError: string;
  };

  // Actions
  actions: {
    viewDetails: string;
    viewEnquiries: string;
    downloadReport: string;
    printReport: string;
    shareReport: string;
  };

  // Language Selection
  language: {
    title: string;
    chinese: string;
    english: string;
    select: string;
  };

  // Enquiry List Modal
  enquiryListModal: {
    title: string;
    totalRecords: string;
    searchPlaceholder: string;
    loading: string;
    loadFailed: string;
    retry: string;
    noData: string;
    noDataDesc: string;
    confirmed: string;
    rejected: string;
    invalid: string;
    pending: string;
    salesPerson: string;
    salesCountry: string;
    cargoType: string;
    product: string;
    route: string;
    receivedDate: string;
    teu: string;
    commodity: string;
    viewDetail: string;
    edit: string;
    close: string;
  };
}

// Chinese Translations
export const zhTranslations: Translations = {
  // Common
  loading: '加载中...',
  retry: '重试',
  error: '错误',
  noData: '暂无数据',
  refresh: '刷新',
  save: '保存',
  cancel: '取消',
  confirm: '确认',
  export: '导出',
  import: '导入',
  delete: '删除',
  edit: '编辑',
  add: '添加',
  back: '返回',
  close: '关闭',
  search: '搜索',
  all: '全部',

  // Dashboard
  dashboard: {
    title: '报表仪表板',
    subtitle: '实时数据概览与统计分析',
    monthlyTrend: '每月趋势',
    topCountries: '热门国家',
    topOrigins: '热门始发地',
    topDestinations: '热门目的地',
    cargoTypes: '货物类型',
    statusBreakdown: '状态分布',
    cnOfficeStats: '中国办事处统计',
    selectMonth: '选择月份',
  },

  // Statistics
  statistics: {
    totalEnquiries: '总询问数',
    quoted: '已报价',
    confirmed: '已确认',
    pending: '待处理',
    rejected: '已拒绝',
    totalRevenue: '总收入',
    avgPrice: '平均价格',
    costPerUnit: '单位成本',
  },

  // Enhanced Dashboard
  enhancedDashboard: {
    title: '增强报表',
    subtitle: '高级过滤与数据分析',
    filters: '过滤器',
    applyFilters: '应用过滤',
    resetFilters: '重置过滤',
    startDate: '开始日期',
    endDate: '结束日期',
    coreStatus: '核心状态',
    cnOffice: '中国办事处',
    core: '核心',
    nonCore: '非核心',
    filteredResults: '过滤结果',
    noResults: '无匹配结果',
  },

  // Comparison Report
  comparisonReport: {
    title: '时期对比报告',
    subtitle: '多时期数据对比分析',
    comparisonType: '对比类型',
    monthly: '月度',
    quarterly: '季度',
    selectPeriods: '选择时期',
    compare: '对比',
    maxPeriods: '最多只能选择 6 个时期',
    growthRate: '增长率',
    declined: '下降',
    improved: '提高',
    stable: '稳定',
    noComparison: '请选择至少 2 个时期进行对比',
    selectAtLeastTwo: '请选择至少 2 个时期',
  },

  // Common Dashboard Elements
  common: {
    all: '全部',
    shanghai: '上海',
    shenzhen: '深圳',
    beijing: '北京',
    guangzhou: '广州',
    hongKong: '香港',
    yes: '是',
    no: '否',
    pending: '待处理',
    rejected: '已拒绝',
    invalid: '无效',
    month: '月',
    year: '年',
    quarter: '季度',
  },

  // Filters
  filters: {
    selectPeriod: '选择时期',
    selectCoreStatus: '选择核心状态',
    selectOffice: '选择办事处',
    clearFilters: '清除过滤',
    filterApplied: '已应用过滤',
    dataFilter: '数据过滤',
    applied: '已应用',
    collapse: '收起',
    expand: '展开',
    startDate: '开始日期',
    endDate: '结束日期',
    cnOffice: '中国办公室',
    allOffices: '全部办公室',
    applyFilter: '应用过滤',
    clear: '清除',
    currentFilters: '当前过滤条件:',
    selectDateRange: '请选择开始和结束日期',
    product: '产品类型',
    allProducts: '全部产品',
    country: '国家',
    allCountries: '全部国家',
  },

  // Offices
  offices: {
    shanghai: '上海',
    shenzhen: '深圳',
    beijing: '北京',
    guangzhou: '广州',
    hongkong: '香港',
    multiOffice: '多办公室',
  },

  // CN Office Statistics
  cnOfficeStats: {
    title: 'CN Office 统计',
    office: '办公室',
    totalEnquiries: '总询价数',
    yes: 'Yes',
    rejected: 'Rejected',
    invalid: 'Invalid',
    pending: 'Pending',
    conversionRate: '转化率',
    rank: '排名',
    action: '操作',
    officesCount: '个办公室',
    exportCSV: '导出 CSV',
    noData: '暂无办公室统计数据',
    yesDetails: '已确认(Yes)',
    rejectedDetails: '已拒绝(Rejected)',
    invalidDetails: '无效(Invalid)',
    pendingDetails: '待定(Pending)',
    clickToView: '点击查看详细数据 →',
  },

  // Audit Log - Change Details Modal
  changeDetails: {
    title: '变更详情',
    operationInfo: '操作信息',
    operationLogId: '操作日志ID',
    operationUser: '操作用户',
    userRole: '用户角色',
    operationTime: '操作时间',
    operationType: '操作类型',
    resourceType: '资源类型',
    resourceId: '资源ID',
    changeSummary: '变更摘要',
    fieldChanges: '字段变更详情',
    field: '字段',
    before: '修改前',
    after: '修改后',
    newData: '新增数据',
    deletedData: '删除数据',
    noChangeInfo: '暂无详细变更信息',
    rawData: '原始数据 (JSON)',
    beforeData: '修改前数据',
    afterData: '修改后数据',
    closeButton: '关闭',
    noFieldChanges: '无字段变更',
  },

  // Audit Log Actions
  auditActions: {
    CREATE: '新增',
    UPDATE: '修改',
    DELETE: '删除',
    VIEW: '查看',
    EXPORT: '导出',
    LOGIN: '登录',
    LOGOUT: '退出',
  },

  // Field Labels
  fieldLabels: {
    id: 'ID',
    referenceNumber: '参考编号',
    status: '状态',
    enquiryReceivedDate: '询价收到日期',
    issueDate: '发行日期',
    productCode: '产品代码',
    productAbbr: '产品缩写',
    salesCountryCode: '销售国家',
    salesOfficeId: '销售办公室',
    salesPicId: '销售PIC',
    cargoTypeCode: '货物类型',
    quantity: '数量',
    quantityUomCode: '数量单位',
    volumeCbm: '体积(CBM)',
    quantityTeu: 'TEU',
    commodity: '商品',
    cnPricingAdmin: 'CN定价管理员',
    assignedCnOfficeCode: '分配CN办公室',
    polId: '起运港(POL)',
    podId: '目的港(POD)',
    polIds: '起运港列表(POLs)',
    podIds: '目的港列表(PODs)',
    bookingConfirmed: '预订确认',
    remark: '备注',
    createdAt: '创建时间',
    updatedAt: '更新时间',
  },

  // Audit Log Main Component
  auditLog: {
    title: '操作日志 (Audit Log)',
    subtitle: '系统所有操作记录',
    refresh: '刷新',
    export: '导出',
    clear: '清空',
    clearConfirm: '确认要清空所有审计日志吗？此操作无法撤销！',
    clearSuccess: '审计日志已清空',
    clearFailed: '清空日志失败，请重试',
    exportFailed: '导出失败，请重试',
    filterTitle: '筛选条件',
    startDate: '开始日期',
    endDate: '结束日期',
    username: '用户名',
    usernamePlaceholder: '输入用户名',
    operationType: '操作类型',
    resourceType: '资源类型',
    resourceTypePlaceholder: '如: 港口, 国家',
    allTypes: '全部',
    search: '查询',
    reset: '重置',
    loading: '加载中...',
    noData: '暂无审计日志',
    tableHeaders: {
      sequence: '#',
      time: '时间',
      username: '用户名',
      userRole: '权限等级',
      cnPricingAdmin: 'CN Pricing Admin',
      operation: '操作',
      resourceType: '资源类型',
      resourceName: '资源名',
      changeDetails: '变更详情',
      status: '状态',
    },
    userRoles: {
      admin: 'Admin',
      salesManager: 'Sales Manager',
      pricingAdmin: 'CN Pricing Operator',
      user: 'User',
    },
    statusLabels: {
      success: '成功',
      failure: '失败',
    },
    clickToViewDetails: '点击查看详细变更信息',
    pagination: {
      total: '共',
      records: '条记录',
      page: '第',
      of: '/',
      previous: '上一页',
      next: '下一页',
    },
  },

  // Error Messages
  errors: {
    loadingFailed: '加载失败',
    dataLoadFailed: '加载统计数据失败',
    filterFailed: '应用过滤失败',
    compareFailed: '对比失败',
    networkError: '网络错误',
  },

  // Actions
  actions: {
    viewDetails: '查看详情',
    viewEnquiries: '查看询问',
    downloadReport: '下载报表',
    printReport: '打印报表',
    shareReport: '分享报表',
  },

  // Language Selection
  language: {
    title: '语言',
    chinese: '中文',
    english: 'English',
    select: '选择语言',
  },
  // Enquiry List Modal
  enquiryListModal: {
    title: '询价记录',
    totalRecords: '条询价记录',
    searchPlaceholder: '搜索编号、销售人员、商品...',
    loading: '加载中...',
    loadFailed: '加载数据失败',
    retry: '重试',
    noData: '暂无数据',
    noDataDesc: '没有找到符合条件的询价记录',
    confirmed: '已确认',
    rejected: '已拒绝',
    invalid: '无效',
    pending: '待定',
    salesPerson: '销售人员',
    salesCountry: '销售国家',
    cargoType: '货物类型',
    product: '产品',
    route: '路线',
    receivedDate: '接收日期',
    teu: 'TEU',
    commodity: '商品',
    viewDetail: '查看详情',
    edit: '编辑',
    close: '关闭',
  },};

// English Translations
export const enTranslations: Translations = {
  // Common
  loading: 'Loading...',
  retry: 'Retry',
  error: 'Error',
  noData: 'No data available',
  refresh: 'Refresh',
  save: 'Save',
  cancel: 'Cancel',
  confirm: 'Confirm',
  export: 'Export',
  import: 'Import',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  back: 'Back',
  close: 'Close',
  search: 'Search',
  all: 'All',

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Real-time data overview and statistical analysis',
    monthlyTrend: 'Monthly Trend',
    topCountries: 'Top Countries',
    topOrigins: 'Top Origins',
    topDestinations: 'Top Destinations',
    cargoTypes: 'Cargo Types',
    statusBreakdown: 'Status Breakdown',
    cnOfficeStats: 'CN Office Statistics',
    selectMonth: 'Select Month',
  },

  // Statistics
  statistics: {
    totalEnquiries: 'Total Enquiries',
    quoted: 'Quoted',
    confirmed: 'Confirmed',
    pending: 'Pending',
    rejected: 'Rejected',
    totalRevenue: 'Total Revenue',
    avgPrice: 'Average Price',
    costPerUnit: 'Cost Per Unit',
  },

  // Enhanced Dashboard
  enhancedDashboard: {
    title: 'Enhanced Report',
    subtitle: 'Advanced filtering and data analysis',
    filters: 'Filters',
    applyFilters: 'Apply Filters',
    resetFilters: 'Reset Filters',
    startDate: 'Start Date',
    endDate: 'End Date',
    coreStatus: 'Core Status',
    cnOffice: 'CN Office',
    core: 'Core',
    nonCore: 'Non-Core',
    filteredResults: 'Filtered Results',
    noResults: 'No matching results',
  },

  // Comparison Report
  comparisonReport: {
    title: 'Period Comparison Report',
    subtitle: 'Multi-period data comparison and analysis',
    comparisonType: 'Comparison Type',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    selectPeriods: 'Select Periods',
    compare: 'Compare',
    maxPeriods: 'A maximum of 6 periods can be selected',
    growthRate: 'Growth Rate',
    declined: 'Declined',
    improved: 'Improved',
    stable: 'Stable',
    noComparison: 'Please select at least 2 periods for comparison',
    selectAtLeastTwo: 'Please select at least 2 periods',
  },

  // Common Dashboard Elements
  common: {
    all: 'All',
    shanghai: 'Shanghai',
    shenzhen: 'Shenzhen',
    beijing: 'Beijing',
    guangzhou: 'Guangzhou',
    hongKong: 'Hong Kong',
    yes: 'Yes',
    no: 'No',
    pending: 'Pending',
    rejected: 'Rejected',
    invalid: 'Invalid',
    month: 'Month',
    year: 'Year',
    quarter: 'Quarter',
  },

  // Filters
  filters: {
    selectPeriod: 'Select Period',
    selectCoreStatus: 'Select Core Status',
    selectOffice: 'Select Office',
    clearFilters: 'Clear Filters',
    filterApplied: 'Filter Applied',
    dataFilter: 'Data Filter',
    applied: 'Applied',
    collapse: 'Collapse',
    expand: 'Expand',
    startDate: 'Start Date',
    endDate: 'End Date',
    cnOffice: 'CN Office',
    allOffices: 'All Offices',
    applyFilter: 'Apply Filter',
    clear: 'Clear',
    currentFilters: 'Current Filters:',
    selectDateRange: 'Please select start and end dates',
    product: 'Product',
    allProducts: 'All Products',
    country: 'Country',
    allCountries: 'All Countries',
  },

  // Offices
  offices: {
    shanghai: 'Shanghai',
    shenzhen: 'Shenzhen',
    beijing: 'Beijing',
    guangzhou: 'Guangzhou',
    hongkong: 'Hong Kong',
    multiOffice: 'Multi-Office',
  },

  // CN Office Statistics
  cnOfficeStats: {
    title: 'CN Office Statistics',
    office: 'Office',
    totalEnquiries: 'Total Enquiries',
    yes: 'Yes',
    rejected: 'Rejected',
    invalid: 'Invalid',
    pending: 'Pending',
    conversionRate: 'Conversion Rate',
    rank: 'Rank',
    action: 'Action',
    officesCount: 'Offices',
    exportCSV: 'Export CSV',
    noData: 'No office statistics available',
    yesDetails: 'Confirmed (Yes)',
    rejectedDetails: 'Rejected',
    invalidDetails: 'Invalid',
    pendingDetails: 'Pending',
    clickToView: 'Click to view details →',
  },

  // Audit Log - Change Details Modal
  changeDetails: {
    title: 'Change Details',
    operationInfo: 'Operation Information',
    operationLogId: 'Operation Log ID',
    operationUser: 'Operation User',
    userRole: 'User Role',
    operationTime: 'Operation Time',
    operationType: 'Operation Type',
    resourceType: 'Resource Type',
    resourceId: 'Resource ID',
    changeSummary: 'Change Summary',
    fieldChanges: 'Field Changes',
    field: 'Field',
    before: 'Before',
    after: 'After',
    newData: 'New Data',
    deletedData: 'Deleted Data',
    noChangeInfo: 'No detailed change information available',
    rawData: 'Raw Data (JSON)',
    beforeData: 'Before Data',
    afterData: 'After Data',
    closeButton: 'Close',
    noFieldChanges: 'No field changes',
  },

  // Audit Log Actions
  auditActions: {
    CREATE: 'Create',
    UPDATE: 'Update',
    DELETE: 'Delete',
    VIEW: 'View',
    EXPORT: 'Export',
    LOGIN: 'Login',
    LOGOUT: 'Logout',
  },

  // Field Labels
  fieldLabels: {
    id: 'ID',
    referenceNumber: 'Reference Number',
    status: 'Status',
    enquiryReceivedDate: 'Enquiry Received Date',
    issueDate: 'Issue Date',
    productCode: 'Product Code',
    productAbbr: 'Product Abbr',
    salesCountryCode: 'Sales Country',
    salesOfficeId: 'Sales Office',
    salesPicId: 'Sales PIC',
    cargoTypeCode: 'Cargo Type',
    quantity: 'Quantity',
    quantityUomCode: 'Quantity UOM',
    volumeCbm: 'Volume (CBM)',
    quantityTeu: 'TEU',
    commodity: 'Commodity',
    cnPricingAdmin: 'CN Pricing Admin',
    assignedCnOfficeCode: 'Assigned CN Office',
    polId: 'Port of Loading (POL)',
    podId: 'Port of Discharge (POD)',
    polIds: 'Ports of Loading (POLs)',
    podIds: 'Ports of Discharge (PODs)',
    bookingConfirmed: 'Booking Confirmed',
    remark: 'Remark',
    createdAt: 'Created At',
    updatedAt: 'Updated At',
  },

  // Audit Log Main Component
  auditLog: {
    title: 'Audit Log',
    subtitle: 'All system operation records',
    refresh: 'Refresh',
    export: 'Export',
    clear: 'Clear',
    clearConfirm: 'Are you sure to clear all audit logs? This action cannot be undone!',
    clearSuccess: 'Audit logs cleared successfully',
    clearFailed: 'Failed to clear logs, please try again',
    exportFailed: 'Export failed, please try again',
    filterTitle: 'Filter Conditions',
    startDate: 'Start Date',
    endDate: 'End Date',
    username: 'Username',
    usernamePlaceholder: 'Enter username',
    operationType: 'Operation Type',
    resourceType: 'Resource Type',
    resourceTypePlaceholder: 'e.g.: Port, Country',
    allTypes: 'All',
    search: 'Search',
    reset: 'Reset',
    loading: 'Loading...',
    noData: 'No audit logs',
    tableHeaders: {
      sequence: '#',
      time: 'Time',
      username: 'Username',
      userRole: 'User Role',
      cnPricingAdmin: 'CN Pricing Admin',
      operation: 'Operation',
      resourceType: 'Resource Type',
      resourceName: 'Resource Name',
      changeDetails: 'Change Details',
      status: 'Status',
    },
    userRoles: {
      admin: 'Admin',
      salesManager: 'Sales Manager',
      pricingAdmin: 'CN Pricing Operator',
      user: 'User',
    },
    statusLabels: {
      success: 'Success',
      failure: 'Failure',
    },
    clickToViewDetails: 'Click to view detailed change information',
    pagination: {
      total: 'Total',
      records: 'records',
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
    },
  },

  // Error Messages
  errors: {
    loadingFailed: 'Loading failed',
    dataLoadFailed: 'Failed to load statistics',
    filterFailed: 'Failed to apply filters',
    compareFailed: 'Failed to compare',
    networkError: 'Network error',
  },

  // Actions
  actions: {
    viewDetails: 'View Details',
    viewEnquiries: 'View Enquiries',
    downloadReport: 'Download Report',
    printReport: 'Print Report',
    shareReport: 'Share Report',
  },

  // Language Selection
  language: {
    title: 'Language',
    chinese: '中文',
    english: 'English',
    select: 'Select Language',
  },

  // Enquiry List Modal
  enquiryListModal: {
    title: 'Enquiry Records',
    totalRecords: 'Records',
    searchPlaceholder: 'Search reference, sales person, commodity...',
    loading: 'Loading...',
    loadFailed: 'Failed to load data',
    retry: 'Retry',
    noData: 'No Data',
    noDataDesc: 'No matching enquiry records found',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    invalid: 'Invalid',
    pending: 'Pending',
    salesPerson: 'Sales Person',
    salesCountry: 'Sales Country',
    cargoType: 'Cargo Type',
    product: 'Product',
    route: 'Route',
    receivedDate: 'Received Date',
    teu: 'TEU',
    commodity: 'Commodity',
    viewDetail: 'View Details',
    edit: 'Edit',
    close: 'Close',
  },
};

// Get translations by language
export const getTranslations = (language: Language): Translations => {
  return language === 'zh' ? zhTranslations : enTranslations;
};
