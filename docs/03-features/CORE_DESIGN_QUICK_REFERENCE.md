# LogiTrack Pro - Report & Settings 核心设计速查表

> **快速参考**: 核心功能、API、组件速查  
> **使用场景**: 项目讨论、代码实现、问题排查

---

## 快速导航

```
📋 设计文档体系
│
├─ REPORT_SETTINGS_DESIGN.md (功能设计)
│  ├─ 2.x Report 模块详细设计
│  │  ├─ 2.1 Dashboard (仪表板)
│  │  ├─ 2.2 Monthly Report (月度报表)
│  │  ├─ 2.3 Country Report (国家分析)
│  │  ├─ 2.4 Cargo Type Report (运输类型)
│  │  └─ 2.5 Export (导出)
│  │
│  ├─ 3.x Settings 模块详细设计
│  │  ├─ 3.2 国家管理
│  │  ├─ 3.3 港口管理
│  │  ├─ 3.4 销售办公室
│  │  ├─ 3.5 销售PIC
│  │  ├─ 3.6 箱型管理
│  │  ├─ 3.7 字典管理
│  │  ├─ 3.8 系统参数
│  │  └─ 3.9 操作日志
│  │
│  ├─ 4.x API 详细设计
│  └─ 5.x 前端组件结构
│
├─ REPORT_SETTINGS_IMPLEMENTATION.md (前端实现)
│  ├─ 1.x 类型定义 (TypeScript)
│  ├─ 2.x API 服务层
│  │  ├─ reportApi.ts
│  │  └─ settingsApi.ts
│  ├─ 3.x Report 组件
│  ├─ 4.x Settings 组件
│  ├─ 5.x 业务逻辑
│  └─ 6.x 路由配置
│
├─ IMPLEMENTATION_ROADMAP.md (实施计划)
│  ├─ Phase 1: MVP (第1周)
│  ├─ Phase 2: 完整报表 (第2周)
│  ├─ Phase 3: 导出和配置 (第3周)
│  ├─ Phase 4: 优化上线 (第4周)
│  ├─ 后端实现指南
│  ├─ 测试计划
│  └─ 成功标准
│
└─ CORE_DESIGN_QUICK_REFERENCE.md (本文档)
   ├─ API 速查表
   ├─ UI 模式速查
   ├─ 数据库查询
   ├─ 代码片段
   └─ 常见问题
```

---

## 1. API 速查表

### 1.1 Report API

#### Dashboard

| 方法 | 端点 | 参数 | 响应 |
|-----|------|------|------|
| GET | `/api/statistics/dashboard` | `month=202602` | `{ stats, charts }` |

**示例**:
```bash
curl "http://localhost:8080/api/statistics/dashboard?month=202602"
```

#### Monthly Report

| 方法 | 端点 | 参数 | 响应 |
|-----|------|------|------|
| GET | `/api/statistics/monthly` | `year=2026&month=02` | `{ month, summary, byCountry, byCargoType, ... }` |

```bash
curl "http://localhost:8080/api/statistics/monthly?year=2026&month=02"
```

#### Country Report

| 方法 | 端点 | 参数 | 响应 |
|-----|------|------|------|
| GET | `/api/statistics/by-country` | `countryCode=FR&startDate=2026-02-01&endDate=2026-02-09` | `{ countryCode, summary, cargoDistribution, ... }` |

```bash
curl "http://localhost:8080/api/statistics/by-country?countryCode=FR"
```

#### Export

| 方法 | 端点 | 请求体 | 响应 |
|-----|------|--------|------|
| POST | `/api/statistics/export` | `{ reportType, format, includeCharts, month }` | Binary (Excel/CSV) |

```bash
curl -X POST http://localhost:8080/api/statistics/export \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "monthly",
    "format": "xlsx",
    "includeCharts": true,
    "month": "202602"
  }' > report.xlsx
```

### 1.2 Settings API

#### 通用 CRUD 端点模式

```
GET    /api/settings/{resource}              # 列表 (含分页)
GET    /api/settings/{resource}/{id}         # 详情
POST   /api/settings/{resource}              # 新增
PUT    /api/settings/{resource}/{id}         # 更新
DELETE /api/settings/{resource}/{id}         # 删除
```

#### 具体资源

**😅 国家**:
```bash
GET  /api/settings/countries?page=0&size=20&keyword=fr
POST /api/settings/countries
     { "countryCode": "FR", "countryNameEn": "France", ... }
PUT  /api/settings/countries/FR
     { "countryNameEn": "France", "isActive": true }
DELETE /api/settings/countries/FR
```

**🏭 港口**:
```bash
GET  /api/settings/ports?page=0&size=20&portType=SEA&countryCode=FR
GET  /api/settings/ports/search?keyword=shanghai&type=SEA
POST /api/settings/ports
     { "portCode": "CNSHA", "portName": "Shanghai", ... }
```

**💼 销售办公室**:
```bash
GET  /api/settings/sales-offices?page=0&size=20&countryCode=FR
POST /api/settings/sales-offices
     { "code": "FR-ZF", "name": "ZIEGLER FRANCE", ... }
```

**👥 销售PIC**:
```bash
GET  /api/settings/sales-pics?page=0&size=20&countryCode=FR
GET  /api/settings/sales-pics/by-country/FR
POST /api/settings/sales-pics
     { "name": "John Doe", "countryCode": "FR", "officeId": 1 }
```

**📦 箱型**:
```bash
GET  /api/settings/container-types?page=0&size=20
POST /api/settings/container-types
     { "containerCode": "40HQ", "containerName": "40'HC", "teuValue": 2.3 }
```

**📚 字典**:
```bash
GET  /api/settings/dict/{dictType}?page=0&size=20
     # dictType: product|cargoType|uom|category|cnOffice|coreFlag
POST /api/settings/dict/product
     { "code": "AIR", "name": "Air Freight", "abbr": "AIR" }
```

---

## 2. UI 模式速查

### 2.1 Dashboard 卡片样式

```typescript
// 基础卡片
<StatCard
  title="Today's Enquiries"
  value={12}
  change={+2}
  icon={<TrendingUp />}
  color="blue"
/>

// 百分比卡片
<StatCard
  title="Completion Rate"
  value="72%"
  format="percentage"
  icon={<BarChart3 />}
/>

// 带对比的卡片
<StatCard
  title="Total (Month)"
  value={328}
  comparison="vs last year: +15%"
/>
```

### 2.2 通用表格模式

```typescript
// 列表页通用模式
<MasterDataList
  title="Country Management"
  data={countries}
  columns={[
    { key: 'countryCode', label: 'Code' },
    { key: 'countryNameEn', label: 'Name' },
    { 
      key: 'isActive', 
      label: 'Status',
      render: (val) => val ? '✅' : '❌'
    },
  ]}
  onAdd={() => setShowForm(true)}
  onEdit={(item) => editItem(item)}
  onDelete={(item) => deleteItem(item)}
  searchableFields={['countryCode', 'countryNameEn']}
/>
```

### 2.3 表单模式

```typescript
// 通用表单对话框
<MasterDataForm
  title="Add Country"
  initialData={editingItem}
  fields={[
    { 
      name: 'countryCode',
      label: 'Code',
      type: 'text',
      required: true,
      maxLength: 2
    },
    { 
      name: 'countryNameEn',
      label: 'English Name',
      type: 'text',
      required: true
    },
    { 
      name: 'isActive',
      label: 'Active',
      type: 'checkbox'
    },
  ]}
  onSave={(data) => saveCountry(data)}
  onCancel={() => setShowForm(false)}
/>
```

### 2.4 级联选择模式

```typescript
// 销售国家 → 销售PIC 级联
const handleCountryChange = async (countryCode: string) => {
  // 1. 清空下级选择
  setFormData({...formData, salesPicId: null, officeId: null});
  
  // 2. 加载下级数据
  const pics = await salesPicApi.getByCountry(countryCode);
  setSalesPicOptions(pics);
};

const handlePicChange = (picId: number) => {
  // 自动映射办公室
  const pic = salesPicOptions.find(p => p.id === picId);
  setFormData({
    ...formData,
    salesPicId: picId,
    officeId: pic.officeId
  });
};
```

---

## 3. 数据库查询速查

### 3.1 Dashboard 统计查询

```sql
-- 今日新增
SELECT COUNT(*) as count 
FROM enquiry 
WHERE DATE(issue_date) = CURDATE();

-- 待报价数量
SELECT COUNT(*) as count 
FROM enquiry 
WHERE status = 'New';

-- 月度完成率
SELECT CONCAT(
  ROUND(
    SUM(CASE WHEN status='Quoted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
    2
  ), 
  '%'
) as completion_rate
FROM enquiry 
WHERE reference_month = DATE_FORMAT(CURDATE(), '%y%m');

-- TOP 国家
SELECT 
  sales_country_code as country_code,
  COUNT(*) as count
FROM enquiry
WHERE reference_month = DATE_FORMAT(CURDATE(), '%y%m')
GROUP BY sales_country_code
ORDER BY count DESC
LIMIT 1;
```

### 3.2 月度报表查询

```sql
-- 按国家统计
SELECT
  e.sales_country_code,
  c.country_name_en,
  COUNT(*) as total,
  SUM(CASE WHEN e.status='Quoted' THEN 1 ELSE 0 END) as quoted,
  SUM(CASE WHEN e.booking_confirmed='Yes' THEN 1 ELSE 0 END) as booked,
  ROUND(
    SUM(CASE WHEN e.status='Quoted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
    2
  ) as conversion_rate
FROM enquiry e
LEFT JOIN country c ON e.sales_country_code = c.country_code
WHERE e.reference_month = ?
GROUP BY e.sales_country_code
ORDER BY total DESC
LIMIT 15;

-- 按运输类型统计
SELECT
  cargo_type_code,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / 
    (SELECT COUNT(*) FROM enquiry WHERE reference_month = ?), 2
  ) as percentage
FROM enquiry
WHERE reference_month = ?
GROUP BY cargo_type_code
ORDER BY count DESC;

-- 近 30 天趋势
SELECT 
  DATE(issue_date) as date,
  COUNT(*) as count
FROM enquiry
WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(issue_date)
ORDER BY date;
```

### 3.3 性能优化索引

```sql
-- 创建索引提升查询性能
CREATE INDEX idx_enquiry_status ON enquiry(status);
CREATE INDEX idx_enquiry_issue_date ON enquiry(issue_date);
CREATE INDEX idx_enquiry_ref_month ON enquiry(reference_month);
CREATE INDEX idx_enquiry_sales_country ON enquiry(sales_country_code);
CREATE INDEX idx_enquiry_booking ON enquiry(booking_confirmed);
CREATE INDEX idx_offer_enquiry_latest ON offer(enquiry_id, is_latest);

-- 查询执行计划
EXPLAIN SELECT ... FROM enquiry WHERE reference_month = '2602' ...;
```

---

## 4. 前端代码片段

### 4.1 API 调用示例

```typescript
// 获取 Dashboard 统计
import { reportApi } from '@/services/reportApi';

const DashboardComponent = () => {
  useEffect(() => {
    reportApi.getDashboardStats('202602')
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);
};

// 导出报表
const handleExport = async () => {
  await reportApi.downloadExport({
    reportType: 'monthly',
    format: 'xlsx',
    includeCharts: true,
    month: '202602'
  });
};
```

### 4.2 状态管理示例

```typescript
// 使用 React Context 管理设置状态
const SettingsContext = React.createContext();

export const SettingsProvider = ({ children }) => {
  const [countries, setCountries] = useState([]);
  const [ports, setPorts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCountries = async () => {
    setIsLoading(true);
    const data = await countryApi.getList();
    setCountries(data.content);
    setIsLoading(false);
  };

  return (
    <SettingsContext.Provider value={{ countries, ports, loadCountries }}>
      {children}
    </SettingsContext.Provider>
  );
};

// 在组件中使用
const CountryList = () => {
  const { countries, loadCountries } = useContext(SettingsContext);
  
  useEffect(() => {
    loadCountries();
  }, []);
  
  return <div>{...}</div>;
};
```

### 4.3 错误处理示例

```typescript
try {
  const data = await reportApi.getDashboardStats();
  setStats(data);
} catch (error) {
  if (error instanceof TypeError) {
    setError('Network error: ' + error.message);
  } else {
    setError('Failed to load statistics');
  }
  console.error('[Error]', error);
}
```

---

## 5. 常见问题 (FAQ)

### Q1: Report 和 Settings 的区别是什么？
**A**: 
- **Report**: 数据分析和展示 (只读)
- **Settings**: 系统配置和主数据维护 (CRUD)

### Q2: 销售国家→PIC 的级联逻辑在哪儿实现？
**A**: 
- **前端**: `CascadeSelect.tsx` 中处理 UI 更新
- **后端**: PIC 通过外键关联销售国家，前端通过 API 过滤

### Q3: Excel 导出的大小限制是多少？
**A**: 
- 单个 Sheet: 最多 1,048,576 行
- 建议分页导出或后台异步任务处理

### Q4: 统计数据的更新频率是多少？
**A**: 
- **Dashboard**: 实时查询 (不缓存)
- **月度报表**: 可缓存至月底
- 考虑使用 Redis 缓存减少数据库查询

### Q5: 如何处理大量数据的查询性能？
**A**: 
- 添加恰当的数据库索引
- 使用分页查询
- 考虑物化视图或预聚合
- 在 Redis 中缓存热数据

### Q6: 权限如何控制？
**A**: 当前为简化版 (仅登录验证)，生产环境需实现 RBAC:
```java
@RequiresRole("CN_ADMIN")
@GetMapping("/statistics/export")
public ResponseEntity<?> export(...) {
  // 权限检查
}
```

### Q7: 审计日志如何实现？
**A**: 使用 Spring AOP 拦截：
```java
@Aspect
@Component
public class AuditAspect {
  @Around("@annotation(Auditable)")
  public Object audit(ProceedingJoinPoint pjp) {
    // 记录操作前后的数据变化
    return pjp.proceed();
  }
}
```

### Q8: 如何处理导出过程中的错误？
**A**: 
- 提供重试机制
- 在后台任务中生成文件
- 用户可下载或通过邮件接收
- 设置文件有效期和自动清理

### Q9: 移动端如何适配 Report 页面？
**A**:
- 使用响应式设计 (Tailwind)
- 图表库支持响应式 (Recharts)
- 提供表格横向滚动
- 简化移动端的 UI

### Q10: 性能基准是什么？
**A**:
- Dashboard API: < 500ms
- 月度报表 API: < 2s
- 导出 1000 行 Excel: < 5s
- 前端 TTI: < 3s

---

## 6. 关键检查清单

### 开发前检查
- [ ] 后端 API 已设计并文档化
- [ ] 前端类型定义完成
- [ ] 数据库索引已添加
- [ ] 界面原型已确认

### 代码审查检查
- [ ] API 返回格式符合契约
- [ ] 错误处理完善
- [ ] 类型定义准确
- [ ] 无 console.log 遗留
- [ ] 代码注释充分

### 测试检查
- [ ] 单元测试覆盖率 ≥ 70%
- [ ] 所有 API 端点已测试
- [ ] 边界条件已测试
- [ ] 大数据集性能已测试

### 部署前检查
- [ ] 数据库迁移脚本已准备
- [ ] 环境配置已完善
- [ ] API 文档已更新
- [ ] 备份和回滚方案已制定

---

## 7. 快速命令参考

### 数据库操作
```bash
# 创建索引
mysql -u root -p logitrack < create_indices.sql

# 备份数据库
mysqldump -u root -p logitrack > backup.sql

# 恢复数据库
mysql -u root -p logitrack < backup.sql
```

### 前端开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test
```

### 后端开发
```bash
# 编译
mvn clean compile

# 运行测试
mvn test

# 启动应用
mvn spring-boot:run

# 打包
mvn clean package
```

---

## 8. 相关链接和资源

### 文档
- 📄 完整功能设计: `REPORT_SETTINGS_DESIGN.md`
- 💻 前端实现指南: `REPORT_SETTINGS_IMPLEMENTATION.md`  
- 🚀 实施路线图: `IMPLEMENTATION_ROADMAP.md`

### 外部资源
- 📊 Recharts 文档: https://recharts.org
- 🎨 Tailwind CSS: https://tailwindcss.com
- 📦 Apache POI: https://poi.apache.org

---

**记住这个速查表，开发效率翻倍！** ⚡

