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
    newEnquiries: string;
    quotedPending: string;
    secured: string;
    lost: string;
    cancelled: string;
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

  // Settings Page (SettingsLayout + UserManagement)
  settings: {
    title: string;
    subtitle: string;
    tabs: {
      userManagement: string;
      auditLog: string;
      emailMonitor: string;
    };
    userManagement: {
      title: string;
      subtitle: string;
      refresh: string;
      createUser: string;
      searchPlaceholder: string;
      showInactive: string;
      unassigned: string;
      noData: string;
      tableHeaders: {
        username: string;
        fullName: string;
        email: string;
        role: string;
        cnOffice: string;
        status: string;
        actions: string;
      };
      statusActive: string;
      statusInactive: string;
      actions: {
        edit: string;
        disable: string;
        enable: string;
        resetPassword: string;
      };
      modal: {
        createTitle: string;
        editTitle: string;
      };
      form: {
        username: string;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        rolePlaceholder: string;
        cnOffice: string;
        cnOfficePlaceholder: string;
        password: string;
        generatePassword: string;
      };
      confirm: {
        disable: string;
        resetPassword: string;
      };
      errors: {
        requiredFields: string;
        passwordRequired: string;
        cnOfficeRequired: string;
        saveFailed: string;
        resetFailed: string;
        disableFailed: string;
        enableFailed: string;
      };
      passwordReveal: {
        title: string;
        usernameLabel: string;
        passwordLabel: string;
        warning: string;
        confirm: string;
      };
    };
  };

  // Email Monitoring Dashboard (all tabs)
  monitoring: {
    tabs: {
      service: string;
      overview: string;
      logs: string;
      debug: string;
      config: string;
      training: string;
      quality: string;
    };
    service: {
      checkingStatus: string;
      running: string;
      stopped: string;
      pid: string;
      mode: string;
      apiOffline: string;
      apiOnline: string;
      clickToStart: string;
      launchConfig: string;
      runMode: string;
      testMailbox: string;
      testMailboxPlaceholder: string;
      auditBcc: string;
      auditBccPlaceholder: string;
      auditBccHint: string;
      pollInterval: string;
      pollIntervalHint: string;
      logitrackMode: string;
      logitrackDryRunLabel: string;
      logitrackDryRunDesc: string;
      logitrackTestForwardLabel: string;
      logitrackTestForwardDesc: string;
      logitrackLiveLabel: string;
      logitrackLiveDesc: string;
      modeDryRunDesc: string;
      modeTestForwardDesc: string;
      modeLiveDesc: string;
      runtimeAdjust: string;
      runtimeAdjustTitle: string;
      applyChanges: string;
      applying: string;
      liveConfirmTitle: string;
      liveConfirmBody: string;
      liveConfirmCheck1: string;
      liveConfirmCheck2: string;
      liveConfirmCheck3: string;
      liveConfirmBtn: string;
      cancelBtn: string;
      startService: string;
      stopService: string;
      starting: string;
      stopping: string;
      fillTestMailbox: string;
      refreshStatus: string;
      infoStart: string;
      infoStop: string;
      infoMode: string;
      pyApiNotReady: string;
    };
    overview: {
      loading: string;
      running: string;
      stopped: string;
      pyApiUnavailable: string;
      unknown: string;
      normal: string;
      error: string;
      secondsAgo: string;
      minutesAgo: string;
      lastRefresh: string;
      autoRefresh: string;
      todayStats: string;
      todayTotal: string;
      todayProcessed: string;
      todaySkipped: string;
      todayErrors: string;
      todayForwarded: string;
      todayLogitrack: string;
      runStatus: string;
      pollInterval: string;
      lastPoll: string;
      uptime: string;
      consecutiveFails: string;
      failTimes: string;
      serviceHealth: string;
      healthSnapshot: string;
      sessionStats: string;
      totalProcessed: string;
      totalSkipped: string;
      totalErrors: string;
      totalForwarded: string;
      totalLogitrack: string;
    };
    logs: {
      filterTitle: string;
      startTime: string;
      endTime: string;
      folder: string;
      allFolders: string;
      processResult: string;
      allResults: string;
      emailType: string;
      allTypes: string;
      senderEmail: string;
      senderPlaceholder: string;
      keyword: string;
      keywordPlaceholder: string;
      search: string;
      clear: string;
      totalRecords: string;
      page: string;
      of: string;
      refresh: string;
      loading: string;
      noData: string;
      loadFailed: string;
      justNow: string;
      minutesAgo: string;
      hoursAgo: string;
      daysAgo: string;
      colTime: string;
      colFolder: string;
      colSender: string;
      colSubject: string;
      colType: string;
      colResult: string;
      colEnquiry: string;
      testRoute: string;
      noSubject: string;
      resultProcessed: string;
      resultSkipped: string;
      resultError: string;
      resultForwarded: string;
      replayTitle: string;
      replaySkip: string;
      replayCanCreate: string;
      replayReason: string;
      replayNoInstructions: string;
      replayRouteDecision: string;
      replayFallback: string;
      replayCalculating: string;
      replayServiceDown: string;
    };
    debug: {
      tabs: {
        mode: string;
        replay: string;
        tools: string;
      };
      logLevelControl: string;
      logLevelChanged: string;
      logLevelFailed: string;
      pollNow: string;
      pollNowTitle: string;
      pollTriggered: string;
      pollFailed: string;
      polling: string;
    };
    config: {
      tabRouting: string;
      tabApi: string;
      tabRules: string;
      apiConnections: string;
      apiKeyNote: string;
      testConnection: string;
      testing: string;
      runtimeParams: string;
      pollIntervalDesc: string;
      logitrackEnabledDesc: string;
      tempDirDesc: string;
      testMailboxDesc: string;
      enabled: string;
      disabled: string;
      skipRulesTitle: string;
      undoChanges: string;
      saving: string;
      saveChanges: string;
      saveSuccess: string;
      saveFailed: string;
      loadFailed: string;
      loadingSkipRules: string;
      skipRulesUnavailable: string;
      noConfig: string;
    };
    training: {
      tabs: {
        cases: string;
        simulator: string;
        regression: string;
      };
    };
    quality: {
      cronPresets: {
        daily9: string;
        daily18: string;
        every4h: string;
        hourly: string;
        custom: string;
      };
      tabs: {
        results: string;
        charts: string;
        history: string;
      };
      configSaved: string;
      saveFailed: string;
      runComplete: string;
      runFailed: string;
    };
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
    newEnquiries: '新建',
    quotedPending: '已报价待确认',
    secured: '已确认',
    lost: '已失去',
    cancelled: '已取消',
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
  },

  // Settings Page
  settings: {
    title: '系统设置',
    subtitle: '管理系统配置、主数据和操作日志',
    tabs: {
      userManagement: '👥 用户管理',
      auditLog: '📋 操作日志',
      emailMonitor: '📊 邮件监控',
    },
    userManagement: {
      title: '👥 用户管理',
      subtitle: '创建、编辑用户并管理权限',
      refresh: '刷新',
      createUser: '新增用户',
      searchPlaceholder: '搜索用户名/姓名/邮箱',
      showInactive: '显示已禁用用户',
      unassigned: '未分配',
      noData: '暂无用户数据',
      tableHeaders: {
        username: '用户名',
        fullName: '姓名',
        email: '邮箱',
        role: '角色',
        cnOffice: '归属办公室',
        status: '状态',
        actions: '操作',
      },
      statusActive: '启用',
      statusInactive: '禁用',
      actions: {
        edit: '编辑',
        disable: '禁用',
        enable: '启用',
        resetPassword: '重置密码',
      },
      modal: {
        createTitle: '新增用户',
        editTitle: '编辑用户',
      },
      form: {
        username: '用户名',
        fullName: '姓名',
        email: '邮箱',
        phone: '电话',
        role: '角色',
        rolePlaceholder: '请选择角色',
        cnOffice: '归属办公室 (Assigned CN Office)',
        cnOfficePlaceholder: '请选择归属办公室（必填）',
        password: '密码',
        generatePassword: '生成随机密码',
      },
      confirm: {
        disable: '确认禁用用户 {{username}} 吗？',
        resetPassword: '确认重置 {{username}} 的密码吗？',
      },
      errors: {
        requiredFields: '请填写用户名、姓名和角色',
        passwordRequired: '请设置初始密码',
        cnOfficeRequired: '请至少选择一个归属办公室',
        saveFailed: '保存失败',
        resetFailed: '重置失败',
        disableFailed: '禁用失败',
        enableFailed: '启用失败',
      },
      passwordReveal: {
        title: '用户已创建 — 请记录初始密码',
        usernameLabel: '用户名',
        passwordLabel: '初始密码',
        warning: '此密码仅显示一次，请立即记录',
        confirm: '已记录，关闭',
      },
    },
  },

  // Email Monitoring Dashboard
  monitoring: {
    tabs: {
      service: '🚀 服务管理',
      overview: '📊 实时状态',
      logs: '📋 处理日志',
      debug: '🛠 调试控制',
      config: '⚙️ 配置查看',
      training: '🎯 AI 训练',
      quality: '🔍 数据质检',
    },
    service: {
      checkingStatus: '检查服务状态...',
      running: '✅ 服务运行中',
      stopped: '⛔ 服务未运行',
      pid: 'PID:',
      mode: '模式:',
      apiOffline: '（监控 API 暂不可达）',
      apiOnline: '监控 API 在线',
      clickToStart: '点击下方按钮启动服务',
      launchConfig: '启动参数配置',
      runMode: '运行模式',
      testMailbox: 'TEST_FORWARD 目标邮箱',
      testMailboxPlaceholder: '转发到此邮箱进行测试，例如: your.name@zieglergroup.cn',
      auditBcc: 'LIVE 审核 BCC 邮箱',
      auditBccPlaceholder: '转发邮件同时 BCC 到此邮箱，留空则使用默认值',
      auditBccHint: '每封转发邮件将同时 BCC 到该邮箱以供审核（默认: davian.liang@zieglergroup.cn）',
      pollInterval: '轮询间隔（秒）',
      pollIntervalHint: '每隔此秒数检查一次新邮件（最小 10 秒，推荐 60 秒）',
      logitrackMode: 'CREATE_REF 建号模式',
      logitrackDryRunLabel: '🖨 DRY-RUN 打印',
      logitrackDryRunDesc: '构建建单 payload 但只打印日志，不实际写入 LogiTrack',
      logitrackTestForwardLabel: '🧪 测试建号',
      logitrackTestForwardDesc: '模拟建单并写入监控日志，但不真实调用 LogiTrack API',
      logitrackLiveLabel: '📝 实际建单',
      logitrackLiveDesc: '自动在 LogiTrack 中创建询价单（需 LOGITRACK_ENABLED=true）',
      modeDryRunDesc: '分析并计算路由，但不发送转发邮件',
      modeTestForwardDesc: '将邮件转发到测试邮箱，不影响真实客户',
      modeLiveDesc: '真实转发至客户 PIC，标记邮件已读',
      runtimeAdjust: '运行时调整',
      runtimeAdjustTitle: '运行时参数调整（即时生效，无需重启）',
      applyChanges: '✅ 应用更改',
      applying: '应用中...',
      liveConfirmTitle: '启动 LIVE 模式确认',
      liveConfirmBody: '⚠️ LIVE 模式将真实转发邮件给客户 PIC，并标记原邮件为已读。',
      liveConfirmCheck1: '路由规则已经过 TEST_FORWARD 验证',
      liveConfirmCheck2: 'pic_routing.json 配置准确无误',
      liveConfirmCheck3: '业务负责人已知悉并批准启用 LIVE 模式',
      liveConfirmBtn: '确认启动 LIVE',
      cancelBtn: '取消',
      startService: '▶ 启动服务',
      stopService: '■ 停止服务',
      starting: '启动中...',
      stopping: '停止中...',
      fillTestMailbox: '请填写 TEST_FORWARD 目标邮箱',
      refreshStatus: '刷新状态',
      infoStart: '启动行为：Spring Boot 以 ProcessBuilder 调用 python main.py，日志追加到 logs/app.log',
      infoStop: '停止行为：通过 PID 文件记录的进程 ID 执行 taskkill /F /PID {pid}',
      infoMode: '模式说明：运行模式控制邮件转发；CREATE_REF_MODE 独立控制建号为仅记录 / 测试建号 / 实际建号；若全局运行模式是 DRY_RUN，则建号仍强制不落库。',
      pyApiNotReady: '监控 API 暂不可达：服务进程已启动，但 FastAPI 监控端口 :5100 尚未就绪。通常在进程启动后约 3-5 秒可达。请稍后刷新。',
    },
    overview: {
      loading: '加载中...',
      running: '运行中',
      stopped: '已停止',
      pyApiUnavailable: 'Python API 不可用（展示历史数据）',
      unknown: '未知',
      normal: '正常',
      error: '异常',
      secondsAgo: '秒前',
      minutesAgo: '分钟前',
      lastRefresh: '最后刷新:',
      autoRefresh: '（每30秒自动刷新）',
      todayStats: '今日统计',
      todayTotal: '今日总处理',
      todayProcessed: '已处理',
      todaySkipped: '已跳过',
      todayErrors: '失败',
      todayForwarded: '已转发',
      todayLogitrack: '已建单',
      runStatus: '运行状态',
      pollInterval: '轮询间隔',
      lastPoll: '上次轮询',
      uptime: '持续运行',
      consecutiveFails: '连续失败',
      failTimes: '次',
      serviceHealth: '服务健康',
      healthSnapshot: '健康状态来自 DB 快照（实时 API 不可用）',
      sessionStats: '本次启动累计',
      totalProcessed: '累计处理',
      totalSkipped: '累计跳过',
      totalErrors: '累计失败',
      totalForwarded: '累计转发',
      totalLogitrack: '累计建单',
    },
    logs: {
      filterTitle: '筛选条件',
      startTime: '开始时间',
      endTime: '结束时间',
      folder: '文件夹',
      allFolders: '全部',
      processResult: '处理结果',
      allResults: '全部',
      emailType: '邮件类型',
      allTypes: '全部',
      senderEmail: '发件人',
      senderPlaceholder: '邮箱地址（模糊匹配）',
      keyword: '主题关键词',
      keywordPlaceholder: '主题模糊搜索',
      search: '查询',
      clear: '清除',
      totalRecords: '条记录',
      page: '第',
      of: '/',
      refresh: '刷新',
      loading: '加载中...',
      noData: '暂无数据',
      loadFailed: '加载日志失败，请检查后端服务是否运行',
      justNow: '刚刚',
      minutesAgo: '分钟前',
      hoursAgo: '小时前',
      daysAgo: '天前',
      colTime: '时间',
      colFolder: '文件夹',
      colSender: '发件人',
      colSubject: '主题',
      colType: '类型',
      colResult: '结果',
      colEnquiry: '建单',
      testRoute: '测试路由（重算 SkipChecker + 路由指令，不实际转发）',
      noSubject: '(无主题)',
      resultProcessed: '✅ 已处理',
      resultSkipped: '⏭️ 跳过',
      resultError: '❌ 失败',
      resultForwarded: '📤 已转发',
      replayTitle: '🧪 路由重算结果（不实际转发）',
      replaySkip: '⏭ 跳过',
      replayCanCreate: '✅ 可建单',
      replayReason: '原因:',
      replayNoInstructions: '无转发指令',
      replayRouteDecision: '🧭 路由决策',
      replayFallback: '⚠️ 使用了 fallback 路由',
      replayCalculating: '计算中...',
      replayServiceDown: 'Python 监控服务未运行，请先启动服务',
    },
    debug: {
      tabs: {
        mode: '🎛 运行控制',
        replay: '🔁 邮件重放',
        tools: '🔧 调试工具',
      },
      logLevelControl: '日志级别控制',
      logLevelChanged: '日志级别已切换到',
      logLevelFailed: '切换失败:',
      pollNow: '🔄 立即轮询',
      pollNowTitle: '立即触发轮询',
      pollTriggered: '✅ 轮询已触发，稍后查看实时状态Tab的结果',
      pollFailed: '触发失败:',
      polling: '触发中...',
    },
    config: {
      tabRouting: '路由配置',
      tabApi: 'API 连接',
      tabRules: '跳过规则',
      apiConnections: '🔌 API 连接状态',
      apiKeyNote: 'API 密钥仅展示后 4 位，不可编辑。',
      testConnection: '测试连接',
      testing: '测试中...',
      runtimeParams: '⚙️ 运行参数（只读）',
      pollIntervalDesc: '邮件轮询间隔（秒）',
      logitrackEnabledDesc: '自动建询价单开关',
      tempDirDesc: '附件临时目录',
      testMailboxDesc: '测试转发收件箱',
      enabled: '✅ 已启用',
      disabled: '❌ 已禁用',
      skipRulesTitle: '🚧 跳过规则编辑',
      undoChanges: '撤销修改',
      saving: '保存中...',
      saveChanges: '保存',
      saveSuccess: '✅ 跳过规则已保存，SkipChecker 缓存已热重载',
      saveFailed: '保存失败:',
      loadFailed: '加载失败:',
      loadingSkipRules: '加载跳过规则...',
      skipRulesUnavailable: '⚠️ 跳过规则加载失败，请确认 Python 监控服务是否运行',
      noConfig: '无配置数据',
    },
    training: {
      tabs: {
        cases: '📚 案例库',
        simulator: '🧪 路由模拟器',
        regression: '🔁 回归测试',
      },
    },
    quality: {
      cronPresets: {
        daily9: '每天 09:00',
        daily18: '每天 18:00',
        every4h: '每 4 小时',
        hourly: '每小时',
        custom: '自定义',
      },
      tabs: {
        results: '质检结果',
        charts: '趋势图表',
        history: '历史记录',
      },
      configSaved: '配置已保存',
      saveFailed: '保存失败',
      runComplete: '质检完成：共 {{total}} 条，{{incomplete}} 条有缺失字段',
      runFailed: '执行失败',
    },
  },
};

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
    newEnquiries: 'New',
    quotedPending: 'Quoted & Pending',
    secured: 'Secured',
    lost: 'Lost',
    cancelled: 'Cancelled',
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

  // Settings Page
  settings: {
    title: 'System Settings',
    subtitle: 'Manage system configuration, master data and audit logs',
    tabs: {
      userManagement: '👥 User Management',
      auditLog: '📋 Audit Log',
      emailMonitor: '📊 Email Monitor',
    },
    userManagement: {
      title: '👥 User Management',
      subtitle: 'Create and edit users, manage permissions',
      refresh: 'Refresh',
      createUser: 'Create User',
      searchPlaceholder: 'Search username / name / email',
      showInactive: 'Show disabled users',
      unassigned: 'Unassigned',
      noData: 'No user data',
      tableHeaders: {
        username: 'Username',
        fullName: 'Full Name',
        email: 'Email',
        role: 'Role',
        cnOffice: 'CN Office',
        status: 'Status',
        actions: 'Actions',
      },
      statusActive: 'Active',
      statusInactive: 'Disabled',
      actions: {
        edit: 'Edit',
        disable: 'Disable',
        enable: 'Enable',
        resetPassword: 'Reset Password',
      },
      modal: {
        createTitle: 'Create User',
        editTitle: 'Edit User',
      },
      form: {
        username: 'Username',
        fullName: 'Full Name',
        email: 'Email',
        phone: 'Phone',
        role: 'Role',
        rolePlaceholder: 'Select role',
        cnOffice: 'Assigned CN Office',
        cnOfficePlaceholder: 'Select CN office (required)',
        password: 'Password',
        generatePassword: 'Generate random password',
      },
      confirm: {
        disable: 'Confirm disabling user {{username}}?',
        resetPassword: 'Confirm resetting password for {{username}}?',
      },
      errors: {
        requiredFields: 'Please fill in username, full name and role',
        passwordRequired: 'Please set an initial password',
        cnOfficeRequired: 'Please select at least one CN office',
        saveFailed: 'Save failed',
        resetFailed: 'Reset failed',
        disableFailed: 'Disable failed',
        enableFailed: 'Enable failed',
      },
      passwordReveal: {
        title: 'User created — please record the initial password',
        usernameLabel: 'Username',
        passwordLabel: 'Initial Password',
        warning: 'This password is only shown once. Please record it now.',
        confirm: 'Recorded, close',
      },
    },
  },

  // Email Monitoring Dashboard
  monitoring: {
    tabs: {
      service: '🚀 Service',
      overview: '📊 Status',
      logs: '📋 Logs',
      debug: '🛠 Debug',
      config: '⚙️ Config',
      training: '🎯 AI Training',
      quality: '🔍 Data Quality',
    },
    service: {
      checkingStatus: 'Checking service status...',
      running: '✅ Service Running',
      stopped: '⛔ Service Stopped',
      pid: 'PID:',
      mode: 'Mode:',
      apiOffline: '(Monitor API unreachable)',
      apiOnline: 'Monitor API Online',
      clickToStart: 'Click the button below to start the service',
      launchConfig: 'Launch Configuration',
      runMode: 'Run Mode',
      testMailbox: 'TEST_FORWARD Target Mailbox',
      testMailboxPlaceholder: 'Forward to this mailbox for testing, e.g.: your.name@zieglergroup.cn',
      auditBcc: 'LIVE Audit BCC Mailbox',
      auditBccPlaceholder: 'BCC forwarded emails to this mailbox, leave empty for default',
      auditBccHint: 'Every forwarded email will be BCC\'d to this mailbox for audit (default: davian.liang@zieglergroup.cn)',
      pollInterval: 'Poll Interval (seconds)',
      pollIntervalHint: 'Check for new emails every N seconds (min 10s, recommend 60s)',
      logitrackMode: 'CREATE_REF Mode',
      logitrackDryRunLabel: '🖨 DRY-RUN Print',
      logitrackDryRunDesc: 'Build enquiry payload and log only, no actual write to LogiTrack',
      logitrackTestForwardLabel: '🧪 Test Create',
      logitrackTestForwardDesc: 'Simulate creation and log, but do not call the real LogiTrack API',
      logitrackLiveLabel: '📝 Live Create',
      logitrackLiveDesc: 'Automatically create enquiries in LogiTrack (requires LOGITRACK_ENABLED=true)',
      modeDryRunDesc: 'Analyze and calculate routing, but do not send forwarding emails',
      modeTestForwardDesc: 'Forward emails to test mailbox, no impact on real customers',
      modeLiveDesc: 'Forward to real customer PICs and mark emails as read',
      runtimeAdjust: 'Runtime Adjust',
      runtimeAdjustTitle: 'Runtime Parameter Adjustment (takes effect immediately, no restart needed)',
      applyChanges: '✅ Apply Changes',
      applying: 'Applying...',
      liveConfirmTitle: 'Confirm LIVE Mode Activation',
      liveConfirmBody: '⚠️ LIVE mode will forward emails to real customer PICs and mark originals as read.',
      liveConfirmCheck1: 'Routing rules have been verified with TEST_FORWARD',
      liveConfirmCheck2: 'pic_routing.json configuration is accurate',
      liveConfirmCheck3: 'Business owner is aware and has approved LIVE mode',
      liveConfirmBtn: 'Confirm Start LIVE',
      cancelBtn: 'Cancel',
      startService: '▶ Start Service',
      stopService: '■ Stop Service',
      starting: 'Starting...',
      stopping: 'Stopping...',
      fillTestMailbox: 'Please fill in TEST_FORWARD target mailbox',
      refreshStatus: 'Refresh Status',
      infoStart: 'Start behavior: Spring Boot calls python main.py via ProcessBuilder, logs appended to logs/app.log',
      infoStop: 'Stop behavior: Execute taskkill /F /PID {pid} using PID from the PID file',
      infoMode: 'Mode note: Run mode controls forwarding; CREATE_REF_MODE independently controls create-ref as log only / test create / live create; when global run mode is DRY_RUN, create-ref is still forced to stay non-persistent.',
      pyApiNotReady: 'Monitor API unreachable: Service process started but FastAPI port :5100 is not ready yet. Usually available 3-5 seconds after startup. Please refresh later.',
    },
    overview: {
      loading: 'Loading...',
      running: 'Running',
      stopped: 'Stopped',
      pyApiUnavailable: 'Python API unavailable (showing historical data)',
      unknown: 'Unknown',
      normal: 'OK',
      error: 'Error',
      secondsAgo: 's ago',
      minutesAgo: 'min ago',
      lastRefresh: 'Last refresh:',
      autoRefresh: '(auto-refresh every 30s)',
      todayStats: 'Today\'s Statistics',
      todayTotal: 'Total Processed',
      todayProcessed: 'Processed',
      todaySkipped: 'Skipped',
      todayErrors: 'Failed',
      todayForwarded: 'Forwarded',
      todayLogitrack: 'Enquiries Created',
      runStatus: 'Run Status',
      pollInterval: 'Poll Interval',
      lastPoll: 'Last Poll',
      uptime: 'Uptime',
      consecutiveFails: 'Consecutive Fails',
      failTimes: '',
      serviceHealth: 'Service Health',
      healthSnapshot: 'Health status from DB snapshot (live API unavailable)',
      sessionStats: 'Session Cumulative',
      totalProcessed: 'Total Processed',
      totalSkipped: 'Total Skipped',
      totalErrors: 'Total Failed',
      totalForwarded: 'Total Forwarded',
      totalLogitrack: 'Total Enquiries',
    },
    logs: {
      filterTitle: 'Filter Conditions',
      startTime: 'Start Time',
      endTime: 'End Time',
      folder: 'Folder',
      allFolders: 'All',
      processResult: 'Result',
      allResults: 'All',
      emailType: 'Email Type',
      allTypes: 'All',
      senderEmail: 'Sender',
      senderPlaceholder: 'Email address (fuzzy match)',
      keyword: 'Subject Keyword',
      keywordPlaceholder: 'Subject fuzzy search',
      search: 'Search',
      clear: 'Clear',
      totalRecords: 'records',
      page: 'Page',
      of: '/',
      refresh: 'Refresh',
      loading: 'Loading...',
      noData: 'No data',
      loadFailed: 'Failed to load logs, please check if backend is running',
      justNow: 'just now',
      minutesAgo: 'min ago',
      hoursAgo: 'hr ago',
      daysAgo: 'd ago',
      colTime: 'Time',
      colFolder: 'Folder',
      colSender: 'Sender',
      colSubject: 'Subject',
      colType: 'Type',
      colResult: 'Result',
      colEnquiry: 'Enquiry',
      testRoute: 'Test routing (recalculate SkipChecker + routing, no actual forwarding)',
      noSubject: '(no subject)',
      resultProcessed: '✅ Processed',
      resultSkipped: '⏭️ Skipped',
      resultError: '❌ Failed',
      resultForwarded: '📤 Forwarded',
      replayTitle: '🧪 Route Recalculation (no forwarding)',
      replaySkip: '⏭ Skip',
      replayCanCreate: '✅ Can Create',
      replayReason: 'Reason:',
      replayNoInstructions: 'No routing instructions',
      replayRouteDecision: '🧭 Routing Decision',
      replayFallback: '⚠️ Fallback routing used',
      replayCalculating: 'Calculating...',
      replayServiceDown: 'Python monitor service not running, please start service first',
    },
    debug: {
      tabs: {
        mode: '🎛 Run Control',
        replay: '🔁 Email Replay',
        tools: '🔧 Debug Tools',
      },
      logLevelControl: 'Log Level Control',
      logLevelChanged: 'Log level switched to',
      logLevelFailed: 'Switch failed:',
      pollNow: '🔄 Poll Now',
      pollNowTitle: 'Trigger Immediate Poll',
      pollTriggered: '✅ Poll triggered, check Status tab for results',
      pollFailed: 'Trigger failed:',
      polling: 'Triggering...',
    },
    config: {
      tabRouting: 'Routing Config',
      tabApi: 'API Connections',
      tabRules: 'Skip Rules',
      apiConnections: '🔌 API Connection Status',
      apiKeyNote: 'API keys show last 4 characters only. Not editable.',
      testConnection: 'Test Connection',
      testing: 'Testing...',
      runtimeParams: '⚙️ Runtime Parameters (Read-only)',
      pollIntervalDesc: 'Email poll interval (seconds)',
      logitrackEnabledDesc: 'Auto-create enquiry switch',
      tempDirDesc: 'Attachment temp directory',
      testMailboxDesc: 'Test forward mailbox',
      enabled: '✅ Enabled',
      disabled: '❌ Disabled',
      skipRulesTitle: '🚧 Skip Rules Editor',
      undoChanges: 'Undo Changes',
      saving: 'Saving...',
      saveChanges: 'Save',
      saveSuccess: '✅ Skip rules saved, SkipChecker cache hot-reloaded',
      saveFailed: 'Save failed:',
      loadFailed: 'Load failed:',
      loadingSkipRules: 'Loading skip rules...',
      skipRulesUnavailable: '⚠️ Failed to load skip rules, please check if Python monitor service is running',
      noConfig: 'No configuration data',
    },
    training: {
      tabs: {
        cases: '📚 Case Library',
        simulator: '🧪 Route Simulator',
        regression: '🔁 Regression Test',
      },
    },
    quality: {
      cronPresets: {
        daily9: 'Daily 09:00',
        daily18: 'Daily 18:00',
        every4h: 'Every 4 hours',
        hourly: 'Every hour',
        custom: 'Custom',
      },
      tabs: {
        results: 'Check Results',
        charts: 'Trend Charts',
        history: 'History',
      },
      configSaved: 'Configuration saved',
      saveFailed: 'Save failed',
      runComplete: 'Check complete: {{total}} total, {{incomplete}} with missing fields',
      runFailed: 'Execution failed',
    },
  },
};

// Get translations by language
export const getTranslations = (language: Language): Translations => {
  return language === 'zh' ? zhTranslations : enTranslations;
};
