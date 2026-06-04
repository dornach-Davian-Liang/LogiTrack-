# LogiTrack Pro — 功能演示数据样例

> **用途**：本文档提供用于演示系统各项功能的示例数据，可按照说明逐条输入系统进行功能展示。  
> **演示环境**：http://localhost:3000  
> **演示账号**：管理员账号 `admin` / 密码 `admin123456`

---

## 演示数据集 A：询价新建流程（5条典型询价）

### A-1：海运整箱 FCL — 电子产品出口德国

| 字段 | 样例数据 |
|-----|---------|
| **Enquiry Received Date** | 2026-03-04（今天） |
| **Issue Date** | 2026-03-04（系统自动） |
| **Product** | SEA（海运） |
| **Reference Number** | *由系统自动生成，预计：CN2603XXX-S* |
| **CN Pricing Admin** | Li Wei（示例：输入系统中已有的定价人员名） |
| **Sales Country** | DE（Germany / 德国） |
| **Sales Office** | Frankfurt Office |
| **Sales PIC** | Hans Müller（示例销售负责人） |
| **Assigned CN Office** | Shanghai（上海） |
| **Cargo Type** | FCL（整箱） |
| **Container Lines** | 40HQ × 2（高柜2个，共4 TEU） |
| **Volume (CBM)** | 120 |
| **Commodity** | Electronics / 消费电子产品 |
| **HAZ / Special** | 无 |
| **POL（起运港）** | CNSHA（上海）、CNNGB（宁波）*多港口示例* |
| **POD（目的港）** | DEHAM（汉堡）、DEBRE（不来梅）*多港口示例* |
| **POD Country** | DE（Germany）自动带出 |
| **Core / Non-Core** | CORE |
| **Category** | Contract |
| **Cargo Ready Date** | 2026-03-20 |
| **Status** | New |
| **Booking Confirmed** | Pending |
| **Remark** | 客户要求报汉堡和不来梅两个目的港价格，以最低价为准 |

**演示要点**：
- 演示多港口 POL / POD 选择
- 观察 TEU 自动计算（40HQ×2 = 4 TEU）
- 观察 Reference Number 的自动生成规律

---

### A-2：空运 AIR — 医疗设备出口美国

| 字段 | 样例数据 |
|-----|---------|
| **Enquiry Received Date** | 2026-03-03 |
| **Issue Date** | 2026-03-03 |
| **Product** | AIR（空运） |
| **CN Pricing Admin** | Zhang Min |
| **Sales Country** | US（United States / 美国） |
| **Sales Office** | New York Office |
| **Assigned CN Office** | Beijing（北京） |
| **Cargo Type** | AIR（空运货） |
| **Volume (CBM)** | 3.5 |
| **Quantity** | 850 |
| **Quantity Unit** | KG |
| **Commodity** | Medical Equipment / 医疗设备 |
| **HAZ / Special** | 部分物品含锂电池，IATA Class 9 |
| **POL（起运港）** | CNPEK（北京首都机场） |
| **POD（目的港）** | USJFK（纽约肯尼迪机场） |
| **Core / Non-Core** | CORE |
| **Category** | Spot |
| **Cargo Ready Date** | 2026-03-10 |
| **Status** | New |
| **Additional Requirement** | 请提供危险品处理报价，需要 MSDS 文件。有效期2周。 |

**演示要点**：
- 演示空运产品类型的填写
- 展示数量单位为 KG 的场景
- 展示危险品/特殊要求字段的用法

---

### A-3：铁海联运 RAIL-SEA — 机械设备出口波兰

| 字段 | 样例数据 |
|-----|---------|
| **Enquiry Received Date** | 2026-03-04 |
| **Issue Date** | 2026-03-04 |
| **Product** | RAIL-SEA（铁海联运） |
| **CN Pricing Admin** | Wang Fang |
| **Sales Country** | PL（Poland / 波兰） |
| **Sales Office** | Warsaw Office |
| **Assigned CN Office** | Chengdu（成都） |
| **Cargo Type** | FCL |
| **Container Lines** | 20GP × 4（4个20尺柜，共4 TEU） |
| **Commodity** | Machinery Parts / 机械配件 |
| **POL** | CNCTU（成都）→ 铁路至 CNSHA（上海）→ 海运 |
| **POD** | PLGDY（格但斯克） |
| **Core / Non-Core** | NON CORE |
| **Category** | Spot |
| **Status** | New |

**演示要点**：
- 展示铁海联运产品的选择
- 展示中西部内陆城市出发的业务场景

---

### A-4：同一询价第二次报价（演示 Increase 功能准备）

> **先创建以下询价，作为后续 Increase 演示的基础**

| 字段 | 样例数据 |
|-----|---------|
| **Issue Date** | 2026-02-15（*注意：填写为上个月日期，演示历史记录*） |
| **Product** | SEA |
| **CN Pricing Admin** | Li Wei |
| **Sales Country** | NL（Netherlands / 荷兰） |
| **Sales Office** | Amsterdam Office |
| **Assigned CN Office** | Shanghai |
| **Cargo Type** | FCL |
| **Container Lines** | 40GP × 1（2 TEU） |
| **Commodity** | Furniture / 家具 |
| **POL** | CNSHA（上海） |
| **POD** | NLRTM（鹿特丹） |
| **Status** | Quoted |
| **Offer（手动添加）** | OCEAN，Seq 1，Is Latest ✅，Sent Date: 2026-02-16，Price: 1850 |

> **Increase 演示**：找到这条记录，点击 Increase → 演示新编号自动递增

---

### A-5：已确认的历史订单（演示报表和转化率用）

| 字段 | 样例数据 |
|-----|---------|
| **Issue Date** | 2026-01-10 |
| **Product** | SEA |
| **CN Pricing Admin** | Zhang Min |
| **Sales Country** | GB（United Kingdom / 英国） |
| **Sales Office** | London Office |
| **Assigned CN Office** | Shenzhen（深圳） |
| **Cargo Type** | FCL |
| **Container Lines** | 40HQ × 3（6 TEU） |
| **Commodity** | Garments / 服装 |
| **POL** | CNSZX（深圳） |
| **POD** | GBFXT（菲利克斯托） |
| **Core / Non-Core** | CORE |
| **Status** | Quoted |
| **Booking Confirmed** | Yes（✅ 已确认） |
| **Offer** | OCEAN，Seq 1，Is Latest ✅，Sent Date: 2026-01-12，Price: 2200 |
| **Remark** | 已确认订舱，ETA 2026-02-18 |

**演示要点**：
- 此记录 Booking Confirmed = Yes，在报表中会计入"Confirmed（已确认）"
- 演示转化率计算：Confirmed / Quoted

---

## 演示数据集 B：报表演示数据说明

以下是通过报表模块可展示的典型数字（基于系统实际数据）。

### B-1：标准Dashboard 月度数据示意

**查看月份：2026-02（2026年2月）**

| 指标 | 参考数值 | 说明 |
|-----|---------|-----|
| Total Enquiries | ~300 条 | 2月份收到的询价总量 |
| Quoted | ~180 条 | 已完成报价 |
| Pending | ~100 条 | 已报价但未确认结果 |
| Confirmed | ~60 条 | 已确认预订 |
| Conversion Rate | ~33% | 已确认/已报价 |

> **演示操作**：在 Report → Dashboard 页面，将月份切换至 2026-02，观察各指标变化

---

### B-2：增强报表过滤演示

**演示过滤组合 1**：只看上海办事处的核心业务

| 过滤项 | 设置值 |
|-------|------|
| Start Date | 2026-01-01 |
| End Date | 2026-03-31 |
| Core Status | CORE |
| CN Office | Shanghai |

**期望结果**：看到上海办事处一季度核心业务的询价数量和转化率。

---

**演示过滤组合 2**：全部办事处 VS 只看深圳

先不设过滤查看总量，再选 CN Office = Shenzhen，对比深圳占全国总量的比例。

---

### B-3：时期对比报告示范数据

**月度对比（选择最近4个月）**

| 时期 | 选择 |
|-----|-----|
| 2025-12 | ✅ 选中 |
| 2026-01 | ✅ 选中 |
| 2026-02 | ✅ 选中 |
| 2026-03 | ✅ 选中 |

对比类型：Monthly（月度对比）

**预期图表展示**：
- 折线图：4个月的询价趋势
- 环比增长率：每个月比上个月的变化%
- 雷达图：综合对比各月在询价量、报价率、确认率等维度的表现

---

**季度对比示范**

| 时期 | 选择 |
|-----|-----|
| 2025-Q3 | ✅ 选中 |
| 2025-Q4 | ✅ 选中 |
| 2026-Q1 | ✅ 选中 |

对比类型：Quarterly（季度对比）

---

## 演示数据集 C：Copy & Increase 功能演示脚本

### C-1：Copy 功能演示

**前提**：系统中已有询价记录（如 A-1 创建的那条）

**演示步骤**：
1. 在询价列表找到 A-1 创建的询价（参考编号如 `CN2603XXX-S`）
2. 点击**绿色复制图标**
3. 系统打开新表单，观察：
   - 所有字段已预填（POL、POD、货物信息等）
   - Reference Number 为空（待保存时生成新编号）
   - Issue Date 已更新为今天
   - Status 已重置为 New
4. 可以修改一个字段（如 Commodity 改为 "Sporting Goods / 体育用品"）
5. 保存 → 观察新的 Reference Number 已生成

**说明口径**：
> "Copy 功能可以在接到类似询价时，快速复用历史路线和人员配置，避免重复录入，节省约 80% 的填写时间。"

---

### C-2：Increase 功能演示

**前提**：使用 A-4 创建的询价（上个月的荷兰鹿特丹业务）

**演示步骤**：
1. 在询价列表找到 A-4 创建的询价（参考编号如 `CN2602XXX-S`）
2. 点击**青色递增图标**
3. 系统打开新表单，观察：
   - 所有字段已预填（与 Copy 相同）
   - Reference Number **已自动更新为递增编号**，如原来是 `CN2602015-S`，现在变为 `CN2602015-S-2`
   - 这体现了该业务与上一次询价的**编号关联关系**
4. 在 Enquiry Received Date 中填入今天日期
5. 保存

**说明口径**：
> "Increase 功能用于同一条业务线的持续跟进。例如客户每月固定来询当月海运价格，通过 Increase 可以保持所有询价编号的系统性关联，方便后续追溯该客户该路线上的历史价格走势。"

---

## 演示数据集 D：审计日志演示

按以下顺序操作后，可在 Settings → Audit Log 中查看完整的操作记录：

| 步骤 | 操作 | 预期日志内容 |
|-----|-----|------------|
| 1 | 登录系统（admin 账号） | `LOGIN` - User: admin |
| 2 | 新建 A-1 询价并保存 | `CREATE` - ENQUIRY - CN2603XXX-S |
| 3 | 编辑 A-1 询价，修改 Commodity 字段 | `UPDATE` - ENQUIRY - 变更摘要含 "commodity: Electronics → Sporting Goods" |
| 4 | Copy A-1 询价并保存 | `CREATE` - ENQUIRY - 新编号 |
| 5 | 删除测试用的临时询价 | `DELETE` - ENQUIRY - 被删除的编号 |

**查看审计日志操作**：
1. 在左侧菜单点击 **Settings**
2. 选择 **Audit Log（操作日志）** 标签
3. 在时间范围筛选器中选择今天
4. 点击刷新，可以看到上述所有操作记录
5. 点击任意一条 UPDATE 记录右侧的查看图标，可展开 **字段变更详情**，精确显示哪个字段从什么值改为什么值

---

## 演示数据集 E：主数据管理演示

### 新增港口演示

**步骤**：
1. 进入 Master Data → Ports（港口）
2. 点击 **+ Add Port**
3. 填入以下数据：

| 字段 | 数据 |
|-----|-----|
| Port Code（港口代码） | CNLYU（示例测试用港口） |
| Port Name EN（英文名） | Lianyungang Test Port |
| Country（国家） | CN（China） |

4. 保存后在列表中搜索 "CNLYU" 验证
5. 返回询价表单，在 POL 搜索框中输入 "Lianyungang"，验证刚添加的港口可以被选到
6. 演示完毕后可删除该测试数据

---

## 快速演示检查清单

演示前确认以下系统状态：

- [ ] 后端服务已启动（访问 http://localhost:8080/api/health 有响应）
- [ ] 前端已启动（访问 http://localhost:3000 可看到登录页）
- [ ] 数据库有数据（登录后首页显示 Total Enquiries > 0）
- [ ] 至少有 2 个用户账号（可演示不同角色的权限差异）
- [ ] 演示路径备好：Chrome / Edge 浏览器，建议屏幕分辨率 1920×1080 以上

## 演示时间估算

| 演示模块 | 建议时间 |
|---------|---------|
| 登录与权限介绍 | 3 分钟 |
| 询价列表与搜索 | 5 分钟 |
| 新建一条完整询价（A-1）| 10 分钟 |
| 添加报价、状态变更 | 5 分钟 |
| Copy & Increase 功能 | 5 分钟 |
| 报表仪表板（标准+增强）| 8 分钟 |
| 时期对比报告 | 5 分钟 |
| 审计日志演示 | 4 分钟 |
| **合计** | **约 45 分钟** |

---

*演示数据样例文档，最后更新：2026年3月*
