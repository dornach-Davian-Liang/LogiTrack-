# LogiTrack Pro - Report & Settings 实施路线图

> **项目**: Report 和 Settings 功能开发  
> **版本**: v1.0  
> **日期**: 2026-02-09  
> **周期**: 3-4 周  

---

## 快速参考

### 📚 文档导航

| 文档 | 内容 | 对象 |
|-----|------|------|
| **REPORT_SETTINGS_DESIGN.md** | 功能设计、UI/UX、数据库逻辑 | 产品经理、设计师 |
| **REPORT_SETTINGS_IMPLEMENTATION.md** | 前端代码框架、类型定义、服务层 | 前端开发 |
| **本文档** | 实施路线图、后端指南、测试计划 | 全体开发 |

---

## Phase 1: MVP 基础功能 (第1周)

### 目标
完成最核心的Report Dashboard和Settings国家/港口管理

### 前端任务
- [ ] 创建 `/components/report` 目录结构
- [ ] 创建 `/components/settings` 目录结构
- [ ] 添加 `services/reportApi.ts`
- [ ] 添加 `services/settingsApi.ts`
- [ ] 实现 Dashboard.tsx
  - [ ] StatCard 组件
  - [ ] 基础统计数据展示
  - [ ] 月份选择器
- [ ] 实现 CountryManagement.tsx
- [ ] 实现 PortManagement.tsx
- [ ] 添加路由配置

### 后端任务
- [ ] POST `/api/statistics/dashboard` - 获取仪表板数据
  ```java
  @GetMapping("/statistics/dashboard")
  public ResponseEntity<DashboardStatsDTO> getDashboardStats(
    @RequestParam(required = false) String month
  ) {
    // 实现逻辑
  }
  ```

- [ ] POST `/api/settings/countries/*` - CRUD 操作
  ```java
  @RestController
  @RequestMapping("/api/settings/countries")
  public class CountryController {
    @GetMapping
    @PostMapping
    @PutMapping("/{code}")
    @DeleteMapping("/{code}")
  }
  ```

- [ ] POST `/api/settings/ports/*` - CRUD 操作
  ```java
  @RestController
  @RequestMapping("/api/settings/ports")
  public class PortController {
    @GetMapping
    @GetMapping("/search")
    @PostMapping
    @PutMapping("/{id}")
    @DeleteMapping("/{id}")
  }
  ```

- [ ] 创建 Service 层
  ```java
  @Service
  public class StatisticsService {
    public DashboardStatsDTO getDashboardStats(String month);
    public MonthlyReportDTO getMonthlyReport(String year, String month);
  }
  
  @Service
  public class CountryService {
    // CRUD 方法
  }
  
  @Service
  public class PortService {
    // CRUD 方法
  }
  ```

### 数据库任务
- [ ] 添加必要的索引用于统计查询
  ```sql
  CREATE INDEX idx_enquiry_status ON enquiry(status);
  CREATE INDEX idx_enquiry_issue_date ON enquiry(issue_date);
  CREATE INDEX idx_enquiry_ref_month ON enquiry(reference_month);
  CREATE INDEX idx_offer_latest ON offer(enquiry_id, is_latest);
  ```

- [ ] 创建统计视图或存储过程 (可选)

### 测试任务
- [ ] 单元测试：API 数据格式
- [ ] 集成测试：Dashboard 统计数据准确性
- [ ] E2E 测试：国家/港口 CRUD 流程

### 验收标准
✅ Dashboard 展示 8 张统计卡片，数据准确
✅ 国家管理完整 CRUD 可用
✅ 港口管理完整 CRUD 可用
✅ 所有 API 响应符合契约

---

## Phase 2: 完整报表功能 (第2周)

### 目标
完成各类报表的详细实现和图表展示

### 前端任务
- [ ] 实现图表组件
  - [ ] `StatusPieChart.tsx` (状态分布)
  - [ ] `TrendLineChart.tsx` (趋势折线)
  - [ ] `CargoTypeBarChart.tsx` (运输类型)
  - [ ] `CountryRankChart.tsx` (国家排名)
  - 使用 **Recharts** 或 **Chart.js**

- [ ] 实现 `MonthlyReport.tsx`
  - [ ] 月份选择
  - [ ] 统计概览卡片
  - [ ] 按国家表格
  - [ ] 按运输类型表格
  - [ ] 按办公室表格

- [ ] 实现 `CountryReport.tsx`
  - [ ] 国家选择
  - [ ] 国家业绩排名
  - [ ] 选中国家的详细分析
  - [ ] 销售PIC排名
  - [ ] 趋势图

- [ ] 添加 `ExportDialog.tsx`
  - [ ] 导出格式选择
  - [ ] 日期范围选择
  - [ ] 导出前预览

### 后端任务
- [ ] POST `/api/statistics/monthly` 接口
  ```java
  @GetMapping("/statistics/monthly")
  public ResponseEntity<MonthlyReportDTO> getMonthlyReport(
    @RequestParam String year,
    @RequestParam String month
  )
  ```

- [ ] POST `/api/statistics/by-country` 接口
  ```java
  @GetMapping("/statistics/by-country")
  public ResponseEntity<CountryReportDTO> getCountryReport(
    @RequestParam(required = false) String countryCode,
    @RequestParam(required = false) String startDate,
    @RequestParam(required = false) String endDate
  )
  ```

- [ ] 优化统计查询性能
  - 使用 SQL 聚合而非应用层计算
  - 考虑添加物化视图或定时任务预计算

### 完成 Settings 功能
- [ ] `SalesOfficeManagement.tsx`
- [ ] `SalesPicManagement.tsx` (含级联逻辑)
- [ ] 对应的后端 API

### 测试任务
- [ ] 单元测试：统计函数正确性
- [ ] 集成测试：各报表数据完整性
- [ ] 性能测试：大数据集下的查询时间

### 验收标准
✅ 月度报表正确显示所有统计指标
✅ 图表正确展示数据分布和趋势
✅ 销售PIC级联选择生效
✅ 报表响应时间 < 2s

---

## Phase 3: 导出和系统配置 (第3周)

### 前端任务
- [ ] 实现导出功能
  - [ ] 调用 `reportApi.exportReport()`
  - [ ] 处理文件下载
  - [ ] 导出进度提示

- [ ] 实现 `DictManagement.tsx`
  - [ ] 通用字典管理界面
  - [ ] 支持多种字典类型切换

- [ ] 实现 `SystemSettings.tsx`
  - [ ] 系统参数表单
  - [ ] 设置项保存

- [ ] 实现 `AuditLog.tsx`
  - [ ] 操作日志列表
  - [ ] 日期筛选
  - [ ] 日志导出

### 后端任务
- [ ] POST `/api/statistics/export` 导出接口
  ```java
  @PostMapping("/statistics/export")
  public ResponseEntity<byte[]> exportReport(@RequestBody ExportOptionsDTO options)
  ```
  - 生成 Excel 文件
  - 包含多个 Sheet
  - 可选图表

- [ ] `/api/settings/dict/{dictType}` 字典接口
  - CRUD 操作
  - 支持批量操作

- [ ] 操作日志记录
  - AOP 拦截 @Auditable 注解
  - 记录变更详情

- [ ] 审计日志查询接口
  ```java
  @GetMapping("/audit-logs")
  public ResponseEntity<Page<AuditLogDTO>> getAuditLogs(...)
  ```

### 数据库任务
- [ ] 创建审计日志表
  ```sql
  CREATE TABLE audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(100),
    operation VARCHAR(50),
    table_name VARCHAR(100),
    record_key VARCHAR(255),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] 添加必要的索引

### 测试任务
- [ ] 导出文件格式验证 (Excel结构、数据完整)
- [ ] 权限和日志功能测试
- [ ] 导出大数据集性能测试

### 验收标准
✅ Excel 文件格式正确，数据完整
✅ 字典管理完整可用
✅ 审计日志记录完整准确
✅ 系统参数可正常保存

---

## Phase 4: 优化与上线准备 (第4周)

### 前端优化
- [ ] 性能优化
  - [ ] 图表懒加载
  - [ ] 数据缓存策略
  - [ ] 虚拟滚动表格 (大量数据)

- [ ] 用户体验优化
  - [ ] 加载状态完善
  - [ ] 错误提示优化
  - [ ] 操作反馈完善

- [ ] 无障碍(Accessibility)
  - [ ] ARIA 标签
  - [ ] 键盘导航支持

### 后端优化
- [ ] 缓存策略
  - 使用 Redis 缓存热点数据
  - 设置合理的过期时间

- [ ] 查询优化
  - 分析慢查询
  - 添加适当索引
  - 考虑预聚合

- [ ] API 文档完善
  - Swagger/OpenAPI 文档
  - 错误码文档

### 部署准备
- [ ] 构建流程配置
  - Docker 镜像
  - CI/CD 流程

- [ ] 数据库迁移脚本
  - 新表创建
  - 索引建立
  - 存储过程部署

- [ ] 配置文件准备
  - 开发/测试/生产环境配置

### 测试完善
- [ ] 完整的 E2E 测试用例
- [ ] 性能基准测试
- [ ] 安全性测试

### 文档完善
- [ ] 用户手册
- [ ] API 文档
- [ ] 部署指南

### 验收标准
✅ 所有功能完整可用
✅ 性能指标达到要求 (API响应 < 2s)
✅ 代码覆盖率 > 70%
✅ 文档完善且清晰

---

## 后端实现指南

### API 契约示例

#### 1. Dashboard 统计

**请求**:
```bash
GET /api/statistics/dashboard?month=202602
```

**响应** (200 OK):
```json
{
  "stats": {
    "todayNewEnquiries": 12,
    "today_vs_yesterday": 2,
    "pendingQuotes": 45,
    ...
  },
  "charts": {
    "statusDistribution": [...],
    "trend30Days": [...],
    "cargoTypeDistribution": [...]
  }
}
```

#### 2. 报表导出

**请求**:
```bash
POST /api/statistics/export
Content-Type: application/json

{
  "reportType": "monthly",
  "format": "xlsx",
  "includeCharts": true,
  "month": "202602"
}
```

**响应** (200 OK):
```
Binary: Excel file
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

### 后端技术栈

| 组件 | 推荐 | 说明 |
|-----|------|------|
| **报表生成** | Apache POI 或 EasyExcel | Excel 文件生成 |
| **缓存** | Redis | 热点数据缓存 |
| **任务调度** | Quartz | 定时预计算统计 |
| **文档** | Springfox/Springdoc | API 文档 |

---

## 测试计划

### 单元测试覆盖

```
✓ StatisticsService - 统计函数准确性
✓ CountryService - CRUD 操作
✓ PortService - 港口搜索
✓ 数据转换 DTO <-> Entity
✓ 导出文件生成
```

### 集成测试场景

```
✓ Dashboard 统计数据准确性 (100 条测试数据)
✓ 月度报表完整性 (按国家、运输类型、办公室)
✓ 导出 Excel 结构和内容验证
✓ 级联选择 (国家 → 办公室 → PIC)
✓ 权限控制
```

### 性能测试基准

| 指标 | 目标 | 场景 |
|-----|------|------|
| Dashboard 加载 | < 500ms | 100万调查数据 |
| 月度报表 | < 2s | 完整数据 |
| 导出 Excel | < 5s | 1000行数据 |

---

## 依赖项和风险

### 可能的阻碍

| 风险 | 概率 | 影响 | 缓解方案 |
|-----|------|------|---------|
| 统计查询性能不足 | 中 | 高 | 提前优化 SQL，考虑预聚合 |
| 级联逻辑复杂度高 | 低 | 中 | 详细文档，充分单元测试 |
| Excel 导出大文件超时 | 低 | 高 | 分页导出或后台任务 |

### 依赖关系

```
Frontend
├── reportApi.ts (依赖后端 API)
├── Charts library (Recharts/Chart.js)
└── UI components

Backend
├── Database (MySQL)
├── Excel library (POI/EasyExcel)
└── Cache (Redis, 可选)
```

---

## 成功标准

### 功能完成
- [x] Report Dashboard 呈现
- [x] Monthly Report 完整
- [x] Settings 主数据管理
- [x] Data Export 功能
- [x] Audit Log 记录

### 质量指标
- ✅ 代码覆盖率 ≥ 70%
- ✅ 无高危漏洞
- ✅ API 响应时间 < 2s (95th percentile)
- ✅ 前端包体积 < 500KB (gzip)

### 用户体验
- ✅ 界面直观易用
- ✅ 加载提示完善
- ✅ 错误提示清晰
- ✅ 移动适配合理

---

## 沟通和反馈

### 每周 Standup
- **周一**: Sprint 计划、任务分配
- **周三**: 进度同步、问题解决
- **周五**: 演示、反馈收集

### 代码审查
- PR 至少 2 人审查
- 必须通过 CI 检查
- 对接人员签名确认

---

## 附录：快速开始

### 前端本地开发

```bash
# 1. 添加类型定义 (types.ts)
# 2. 创建 API 服务
npm run dev

# 3. 访问开发页面
http://localhost:3000/report/dashboard
http://localhost:3000/settings/countries
```

### 后端本地开发

```bash
# 1. 创建 API 端点
# 2. 运行测试
mvn test

# 3. 启动应用
mvn spring-boot:run

# 4. 访问 Swagger
http://localhost:8080/swagger-ui.html
```

### 数据库初始化

```bash
# 创建必要的表和索引
mysql -u root -p logitrack < schema_additions.sql
```

---

## 项目跟踪 Template

```markdown
## Week 1 Progress
- [x] Frontend: Dashboard StatCard
- [ ] Backend: Dashboard API
- [ ] Database: Indices creation

## Issues
- 问题描述
  - 影响: 中等
  - 解决方案: ...

## Next Week
- 继续 Phase 2 实现...
```

---

**祝开发顺利！如有任何问题，参考上述文档或咨询项目组。** 🚀

