# LogiTrack 项目文档结构说明

## 📁 文档组织结构

为了更好地管理项目文档，我们已将所有文档按功能和类型重新组织到以下目录结构中：

```
LogiTrack/
├── README.md                          # 项目总览
├── MILESTONE_CHANGELOG.md             # 代码变更里程碑（详细记录）
├── docs/                              # 文档目录
│   ├── 01-getting-started/            # 快速开始指南
│   │   ├── QUICKSTART.md              # 快速开始
│   │   ├── QUICK_REFERENCE.md         # 快速参考
│   │   ├── STARTUP.md                 # 启动指南
│   │   └── 本地部署完整指南.md         # 中文部署指南
│   │
│   ├── 02-deployment/                 # 部署相关文档
│   │   ├── DEPLOYMENT.md              # 部署指南
│   │   ├── SERVER_REQUIREMENTS.md     # 服务器需求说明
│   │   ├── WINDOWS_DEPLOYMENT_GUIDE.md # Windows部署
│   │   ├── AWS_DEPLOYMENT_README.md   # AWS部署
│   │   ├── AWS_EC2_DEPLOYMENT_GUIDE.md # AWS EC2详细指南
│   │   ├── AWS_QUICK_REFERENCE.md     # AWS快速参考
│   │   ├── DEPLOYMENT_EXECUTION_GUIDE.md # 部署执行指南
│   │   ├── START_DEPLOYMENT_NOW.md    # 立即开始部署
│   │   ├── FIND_AWS_KEYPAIR.md        # 查找AWS密钥
│   │   ├── CODESPACES_ACCESS_GUIDE.md # Codespaces指南
│   │   └── DELIVERY_CHECKLIST_20260225.md # 交付检查清单
│   │
│   ├── 03-features/                   # 功能设计文档
│   │   ├── CORE_DESIGN_QUICK_REFERENCE.md # 核心设计参考
│   │   ├── DATE_PICKER_DESIGN_GUIDE.md # 日期选择器设计
│   │   ├── REPORT_SETTINGS_DESIGN.md  # 报表设置设计
│   │   ├── enquiry_mysql_design_spec.md # 询价数据库设计
│   │   ├── FRONTEND_REQUIREMENTS.md   # 前端需求
│   │   ├── TECHNICAL_ARCHITECTURE.md  # 技术架构说明
│   │   ├── OPERATOR_PERMISSIONS_ANALYSIS.md # 操作员权限分析
│   │   ├── AUDIT_LOG_QUICK_START.md   # 审计日志快速开始
│   │   └── SERVER_ROLE_EXPLANATION_DMZ_IP_MAPPING.md # 服务器角色说明
│   │
│   ├── 04-testing/                    # 测试相关文档
│   │   ├── TEST_CHECKLIST.md          # 测试检查清单
│   │   ├── TEST_VERIFICATION.md       # 测试验证
│   │   ├── ACCEPTANCE_TEST_CHECKLIST.md # 验收测试清单
│   │   ├── BROWSER_TEST_GUIDE.md      # 浏览器测试
│   │   ├── BROWSER_MANUAL_TEST_GUIDE.md # 手动测试
│   │   ├── FRONTEND_TEST_GUIDE.md     # 前端测试
│   │   ├── RBAC_TEST_GUIDE.md         # RBAC测试
│   │   ├── QUICK_TEST_GUIDE.md        # 快速测试
│   │   ├── REPORT_MODULE_QUICK_TEST_GUIDE.md # 报表模块测试
│   │   ├── AUDIT_LOG_TEST_SUMMARY.md  # 审计日志测试总结
│   │   ├── PORTIDS_DISPLAY_TEST_GUIDE.md # 港口ID显示测试
│   │   ├── BUGFIX_EDIT_ENQUIRY_QUICK_TEST.md # Bug修复快速测试
│   │   ├── NEW_FEATURES_VERIFICATION_GUIDE.md # 新功能验证
│   │   ├── VERIFICATION_START_HERE.md # 验证起点
│   │   └── SYSTEM_STARTUP_VERIFICATION_20260225.md # 系统启动验证
│   │
│   ├── 05-bugfixes/                   # Bug修复报告
│   │   ├── BUGFIX_REPORT.md           # Bug修复报告
│   │   ├── BUGFIX_ANALYSIS_REPORT.md  # Bug分析报告
│   │   ├── BUGFIX_DEBUG_SUMMARY.md    # 调试总结
│   │   ├── BUGFIX_REPORT_20260204.md  # 2月4日Bug修复
│   │   ├── BUG_FIX_REPORT_20260202.md # 2月2日Bug修复
│   │   ├── BUG_FIX_FINAL_REPORT.md    # 最终Bug修复
│   │   ├── BUG_FIX_COMPLETION_REPORT.md # Bug修复完成
│   │   ├── COPY_INCREASE_FIX_REPORT.md # 复制增加修复
│   │   ├── ENQUIRY_EDIT_BUG_FIX_REPORT.md # 询价编辑修复
│   │   ├── BUGFIX_TIMEZONE_OFFSET_REPORT.md # 时区偏移修复
│   │   ├── BUGFIX_EDIT_ENQUIRY_500_REPORT_20260225.md # 500错误修复
│   │   ├── BUGFIX_EDIT_ENQUIRY_FINAL_SUMMARY_20260225.md # 最终总结
│   │   ├── README_BUGFIX_COMPLETE_20260225.md # Bug修复完成说明
│   │   ├── AUDIT_LOG_FIX_REPORT_20260224.md # 审计日志修复
│   │   ├── AUDIT_LOG_PORTIDS_FIX_REPORT.md # 审计日志港口ID修复
│   │   └── AUDIT_LOG_PERMISSION_FIX_REPORT.md # 审计日志权限修复
│   │
│   └── 06-implementation-reports/      # 实现报告
│       ├── MYSQL_MIGRATION_COMPLETE.md # MySQL迁移完成
│       ├── IMPLEMENTATION_ROADMAP.md   # 实现路线图
│       ├── IMPLEMENTATION_SUMMARY.md   # 实现总结
│       ├── FRONTEND_IMPLEMENTATION_REPORT.md # 前端实现
│       ├── FRONTEND_IMPLEMENTATION_UPDATE.md # 前端实现更新
│       ├── REPORT_MODULE_IMPLEMENTATION_REPORT.md # 报表模块实现
│       ├── REPORT_MODULE_COMPLETION_REPORT.md # 报表模块完成
│       ├── REPORT_SETTINGS_IMPLEMENTATION.md # 报表设置实现
│       ├── RBAC_AUDIT_IMPLEMENTATION_REPORT.md # RBAC审计实现
│       ├── DASHBOARD_ENHANCED_REPORT.md # Dashboard增强
│       ├── COMPARISON_FEATURE_REPORT.md # 对比功能
│       ├── MULTI_PORT_OPTIMIZATION_REPORT.md # 多港口优化
│       ├── PERFORMANCE_OPTIMIZATION_REPORT.md # 性能优化
│       ├── DATE_PICKER_IMPLEMENTATION_COMPLETE.md # 日期选择器实现
│       ├── DATE_PICKER_REDESIGN_REPORT.md # 日期选择器重设计
│       ├── I18N_COMPLETE_REPORT.md     # 国际化完成
│       ├── ENQUIRY_LIST_MODAL_I18N_REPORT.md # 询价列表国际化
│       ├── AUDIT_LOG_I18N_COMPLETE_REPORT.md # 审计日志国际化
│       ├── AUDIT_LOG_ENHANCEMENT_REPORT.md # 审计日志增强
│       ├── AUDIT_LOG_DETAILS_MODAL_FEATURE.md # 审计日志详情弹窗
│       ├── AUDIT_LOG_DEBUG_REPORT.md   # 审计日志调试
│       ├── AUDIT_LOG_E2E_TEST_REPORT.md # 审计日志E2E测试
│       ├── SESSION_PERSISTENCE_AND_AVATAR_FIX_REPORT.md # 会话持久化
│       ├── PORTIDS_BEFORE_AFTER_COMPARISON.md # 港口ID对比
│       ├── E2E_TEST_REPORT_MULTIPORT.md # 多港口E2E测试
│       ├── FEATURE_VERIFICATION_REPORT.md # 功能验证
│       ├── TEST_VERIFICATION_REPORT_20260202.md # 测试验证报告
│       ├── COMPLETION_REPORT_20260202.md # 完成报告
│       ├── FINAL_COMPLETION_REPORT.md  # 最终完成报告
│       ├── FINAL_VERIFICATION_REPORT_20260225.md # 最终验证报告
│       ├── QUICK_COMPLETION_CHECKLIST.md # 快速完成清单
│       ├── FIXES_SUMMARY.md            # 修复总结
│       ├── CODE_CHANGES.md             # 代码变更
│       ├── CODE_CHANGES_DETAIL.md      # 代码变更详情
│       ├── STATUS_REPORT.md            # 状态报告
│       ├── SESSION_SUMMARY_20260128.md # 会话总结
│       ├── README_REPORT_SETTINGS.md   # 报表设置说明
│       ├── DOCUMENTATION_INDEX.md      # 文档索引(旧)
│       └── CN_ADMIN_AND_CORE_IMPLEMENTATION_REPORT_20260226.md # CN管理员实现
│
├── backend/                           # 后端代码
├── logitrack-pro/                     # 前端代码
├── database/                          # 数据库脚本
└── scripts/                           # 运维脚本
```

---

## 📚 快速导航

### 新手入门
1. 阅读 [README.md](../README.md) 了解项目概况
2. 阅读 [MILESTONE_CHANGELOG.md](../MILESTONE_CHANGELOG.md) 了解开发历史
3. 跟随 [docs/01-getting-started/QUICKSTART.md](01-getting-started/QUICKSTART.md) 开始使用

### 部署项目
- **Windows**: [docs/02-deployment/WINDOWS_DEPLOYMENT_GUIDE.md](02-deployment/WINDOWS_DEPLOYMENT_GUIDE.md)
- **AWS**: [docs/02-deployment/AWS_EC2_DEPLOYMENT_GUIDE.md](02-deployment/AWS_EC2_DEPLOYMENT_GUIDE.md)
- **通用**: [docs/02-deployment/DEPLOYMENT.md](02-deployment/DEPLOYMENT.md)
- **服务器需求**: [docs/02-deployment/SERVER_REQUIREMENTS.md](02-deployment/SERVER_REQUIREMENTS.md)

### 开发指南
- **功能设计**: [docs/03-features/](03-features/)
- **测试**: [docs/04-testing/](04-testing/)
- **实现报告**: [docs/06-implementation-reports/](06-implementation-reports/)
- **技术架构**: [docs/03-features/TECHNICAL_ARCHITECTURE.md](03-features/TECHNICAL_ARCHITECTURE.md)

### Bug修复
- 查看 [docs/05-bugfixes/](05-bugfixes/) 了解已修复的问题

---

## 🔍 按主题查找文档

### 数据库相关
- [enquiry_mysql_design_spec.md](03-features/enquiry_mysql_design_spec.md) - 数据库设计
- [MYSQL_MIGRATION_COMPLETE.md](06-implementation-reports/MYSQL_MIGRATION_COMPLETE.md) - MySQL迁移
- [database/README.md](../database/README.md) - 数据库脚本说明

### 前端开发
- [FRONTEND_REQUIREMENTS.md](03-features/FRONTEND_REQUIREMENTS.md) - 前端需求
- [FRONTEND_IMPLEMENTATION_REPORT.md](06-implementation-reports/FRONTEND_IMPLEMENTATION_REPORT.md) - 前端实现
- [FRONTEND_TEST_GUIDE.md](04-testing/FRONTEND_TEST_GUIDE.md) - 前端测试

### 报表模块
- [REPORT_SETTINGS_DESIGN.md](03-features/REPORT_SETTINGS_DESIGN.md) - 报表设计
- [REPORT_MODULE_IMPLEMENTATION_REPORT.md](06-implementation-reports/REPORT_MODULE_IMPLEMENTATION_REPORT.md) - 报表实现
- [DASHBOARD_ENHANCED_REPORT.md](06-implementation-reports/DASHBOARD_ENHANCED_REPORT.md) - Dashboard

### 权限与审计
- [RBAC_AUDIT_IMPLEMENTATION_REPORT.md](06-implementation-reports/RBAC_AUDIT_IMPLEMENTATION_REPORT.md) - RBAC实现
- [AUDIT_LOG_ENHANCEMENT_REPORT.md](06-implementation-reports/AUDIT_LOG_ENHANCEMENT_REPORT.md) - 审计日志
- [RBAC_TEST_GUIDE.md](04-testing/RBAC_TEST_GUIDE.md) - RBAC测试

### 国际化
- [I18N_COMPLETE_REPORT.md](06-implementation-reports/I18N_COMPLETE_REPORT.md) - 国际化实现
- [ENQUIRY_LIST_MODAL_I18N_REPORT.md](06-implementation-reports/ENQUIRY_LIST_MODAL_I18N_REPORT.md) - 询价列表国际化
- [AUDIT_LOG_I18N_COMPLETE_REPORT.md](06-implementation-reports/AUDIT_LOG_I18N_COMPLETE_REPORT.md) - 审计日志国际化

### 性能优化
- [PERFORMANCE_OPTIMIZATION_REPORT.md](06-implementation-reports/PERFORMANCE_OPTIMIZATION_REPORT.md) - 性能优化
- [MULTI_PORT_OPTIMIZATION_REPORT.md](06-implementation-reports/MULTI_PORT_OPTIMIZATION_REPORT.md) - 多港口优化

---

## 📝 文档编写规范

### 命名规范
- 快速开始: `QUICKSTART.md`, `QUICK_*.md`
- 部署相关: `DEPLOYMENT*.md`, `*_DEPLOYMENT_*.md`
- 设计文档: `*_DESIGN*.md`
- 实现报告: `*_IMPLEMENTATION_*.md`, `*_REPORT.md`
- Bug修复: `BUGFIX_*.md`, `BUG_FIX_*.md`
- 测试文档: `TEST_*.md`, `*_TEST_*.md`

### 日期标记
- 格式: `*_YYYYMMDD.md`
- 示例: `BUGFIX_REPORT_20260204.md`

---

## 🔄 文档更新记录

- **2026-02-28**: 创建新的文档组织结构
- **2026-02-28**: 创建 MILESTONE_CHANGELOG.md 详细记录代码变更历史

---

## 📞 贡献指南

如需添加新文档，请：
1. 确定文档类型和目标受众
2. 选择合适的目录
3. 遵循命名规范
4. 更新本文档的索引

---

*注意：旧的 DOCUMENTATION_INDEX.md 已迁移，本文档是新的主索引。*
