# LogiTrack Pro - Report & Settings 功能设计方案

> **版本**: v1.0  
> **日期**: 2026-02-09  
> **目标**: 完整的数据分析和系统配置功能

---

## 目录

1. [功能概述](#1-功能概述)
2. [Report 报表模块](#2-report-报表模块)
3. [Settings 设置模块](#3-settings-设置模块)
4. [API 设计](#4-api-设计)
5. [前端组件结构](#5-前端组件结构)
6. [实现优先级](#6-实现优先级)

---

## 1. 功能概述

### 1.1 Report 模块 - 核心价值

**目标**：为CN定价管理员提供+实时数据洞察、业务分析和决策支持

- 📊 **实时统计**: 关键业务指标一目了然
- 📈 **趋势分析**: 按时间维度展示业务发展
- 🗺️ **地理分析**: 按国家/地区的业务分布
- 🚚 **运输分析**: 按运输类型的市场占有率
- 📥 **数据导出**: Excel/CSV 格式批量下载
- 🎯 **效率评估**: 报价响应时间、转化率等

### 1.2 Settings 模块 - 核心价值

**目标**：维护系统基础数据，确保业务流程顺利运行

- 🌍 **主数据维护**: 国家、港口、销售人员等基础信息
- ⚙️ **系统配置**: 箱型、字典配置
- 👥 **权限管理**: 销售办公室、销售PIC的关联关系
- 📋 **数据校验**: 确保数据完整性和一致性

---

## 2. Report 报表模块

### 2.1 报表首页 - Dashboard

#### 2.1.1 统计卡片(4x3 网格)

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 仪表盘 / Dashboard                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🟦 今日新增询价      🟩 待报价数量        🟨 待订舱确认 🟪 月完成率
│ ┌──────────────────┐ ┌──────────────────┐ ┌─────────┐ ┌──────┐
│ │       12        │ │       45        │ │   28   │ │ 72% │
│ │    +2 vs昨日    │ │   ↑8 vs周初    │ │ ↓3 vs周初│ │+5p  │
│ └──────────────────┘ └──────────────────┘ └─────────┘ └──────┘
│  
│ 🟦 本月询价总数     🟩 本月报价完成    🟨 本月订舱率   🟪 平均报价天数
│ ┌──────────────────┐ ┌──────────────────┐ ┌─────────┐ ┌──────┐
│ │      328        │ │      287        │ │  85%   │ │ 2.1d │
│ │   vs去年 +15%   │ │   vs去年 +12%   │ │ vs月初 │ │ ↓0.3d│
│ └──────────────────┘ └──────────────────┘ └─────────┘ └──────┘
│
│ 🟦 询价TOP国家      🟩 询价TOP运输类型    🟨 销售办公室    🟪 报价拒绝率
│ ┌──────────────────┐ ┌──────────────────┐ ┌─────────┐ ┌──────┐
│ │    France       │ │     FCL         │ │   5    │ │  8%  │
│ │  (98 / 30%)     │ │   (165 / 50%)   │ │ 个站点  │ │ vs去年 │
│ └──────────────────┘ └──────────────────┘ └─────────┘ └──────┘
│
└─────────────────────────────────────────────────────────────┘
```

#### 2.1.2 统计详情

| 卡片 | SQL 查询 | 显示格式 |
|-----|---------|---------|
| **今日新增** | `COUNT(*) WHERE issue_date = TODAY()` | 数字 + 环比 |
| **待报价** | `COUNT(*) WHERE status = 'New'` | 数字 + 环比 |
| **待订舱确认** | `COUNT(*) WHERE booking_confirmed = 'Pending'` | 数字 + 环比 |
| **月完成率** | `Quoted / (New+Quoted) * 100%` | 百分比 |
| **本月总数** | `COUNT(*) WHERE reference_month = YYMM` | 数字 + 同比 |
| **月报价完成** | `COUNT(*) WHERE status='Quoted' AND reference_month=YYMM` | 数字 + 同比 |
| **订舱率** | `COUNT(booking_confirmed='Yes') / total * 100%` | 百分比 |
| **平均报价天数** | `AVG(DATEDIFF(latest_offer_date, issue_date))` | 天数 |
| **TOP国家** | TOP 1 by country | 文本 + 占比 |
| **TOP运输类型** | TOP 1 by cargo_type | 文本 + 占比 |
| **销售办公室数** | `DISTINCT(sales_office_id)` | 数字 |
| **拒绝率** | `COUNT(booking_confirmed='Rejected') / total * 100%` | 百分比 |

#### 2.1.3 Dashboard 图表(3个)

**📊 Chart 1: 询价状态分布(今月)**
```
饼图
- New: 30% (45)
- Quoted: 62% (92)  
- Cancelled: 8% (12)
```

**📈 Chart 2: 近30天询价趋势**
```
折线图
X轴: 日期 (YYYY-MM-DD)
Y轴: 询价数量
显示: 当月初至今的日均值
```

**📊 Chart 3: 运输类型分布**
```
水平柱状图
AIR: 25%
FCL: 45%
LCL: 15%
RAIL: 10%
SEA: 5%
```

#### 2.1.4 快捷操作栏

| 按钮 | 功能 | 跳转 |
|-----|------|-----|
| 📋 **查看月报** | 打开月度详细报表 | `/report/monthly` |
| 📊 **国家分析** | 按销售国家统计 | `/report/by-country` |
| 🚚 **运输分析** | 按运输类型统计 | `/report/by-cargo-type` |
| 📥 **导出报表** | Excel/CSV 导出 | 弹窗 |
| 🔄 **刷新统计** | 重新加载数据 | 实时 API 调用 |

---

### 2.2 月度报表 - Monthly Report

#### 2.2.1 页面布局

```
┌────────────────────────────────────────────────────────────┐
│ 📋 月度报表                  [2026年2月]  [上月] [下月]      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 📊 月度统计概览                                             │
│ ┌──────────────────┬──────────────────┬──────────────────┐ │
│ │ 总询价数: 328    │ 已报价: 287 (87%) │ 待报价: 41 (13%) │ │
│ │ 预期订舱: 282    │ 已确认: 238 (84%) │ 待确认: 44 (16%) │ │
│ │ 平均报价: 2.1天  │ 报价拒绝: 4 (1%) │ 报价率: 87%     │ │
│ └──────────────────┴──────────────────┴──────────────────┘ │
│                                                            │
│ 📈 按销售国家统计 (Top 15)                                  │
│ ┌────┬──────────┬────────┬────────┬────────┬────────┐    │
│ │ #  │ 国家     │ 询价数 │ 报价数 │ 订舱数 │ 转化率 │    │
│ ├────┼──────────┼────────┼────────┼────────┼────────┤    │
│ │ 1  │ FRANCE   │  98    │  85    │  72    │  86.7% │    │
│ │ 2  │ GERMANY  │  76    │  68    │  61    │  89.5% │    │
│ │ 3  │ UK       │  65    │  58    │  52    │  89.7% │    │
│ │... │          │        │        │        │        │    │
│ └────┴──────────┴────────┴────────┴────────┴────────┘    │
│                                                            │
│ 🚚 按运输类型统计                                           │
│ ┌──────────┬────────┬────────┬────────┬────────┐          │
│ │ 运输类型 │ 询价数 │ 报价数 │ 订舱数 │ 占比   │          │
│ ├──────────┼────────┼────────┼────────┼────────┤          │
│ │ FCL      │  165   │  145   │  128   │ 50.3%  │          │
│ │ LCL      │  80    │  68    │  59    │ 24.4%  │          │
│ │ AIR      │  50    │  48    │  44    │ 15.2%  │          │
│ │ RAIL     │  20    │  18    │  15    │  6.1%  │          │
│ │ SEA      │  13    │  8     │  6     │  4.0%  │          │
│ └──────────┴────────┴────────┴────────┴────────┘          │
│                                                            │
│ 💼 按销售办公室统计 (Top 10)                                │
│ ┌──────────────────┬────────┬────────┬────────┐           │
│ │ 销售办公室       │ 询价数 │ 报价数 │ 转化率 │           │
│ ├──────────────────┼────────┼────────┼────────┤           │
│ │ ZIEGLER FRANCE   │  98    │  85    │ 86.7%  │           │
│ │ ZIEGLER GERMANY  │  76    │  68    │ 89.5%  │           │
│ │ ZIEGLER UK       │  65    │  58    │ 89.7%  │           │
│ │...               │        │        │        │           │
│ └──────────────────┴────────┴────────┴────────┘           │
│                                                            │
│ 📊 按订舱状态统计                                           │
│ ┌──────────────┬────────┬────────┐                        │
│ │ 订舱状态     │ 数量   │ 占比   │                        │
│ ├──────────────┼────────┼────────┤                        │
│ │ Yes(已确认)  │  238   │ 72.6%  │                        │
│ │ Pending      │  44    │ 13.4%  │                        │
│ │ Rejected     │  34    │ 10.4%  │                        │
│ │ Invalid      │  12    │  3.7%  │                        │
│ └──────────────┴────────┴────────┘                        │
│                                                            │
│                                    [导出Excel] [打印]       │
└────────────────────────────────────────────────────────────┘
```

#### 2.2.2 统计表字段定义

**表 A: 按销售国家**

| 字段 | 说明 | SQL |
|-----|------|-----|
| 国家 | 销售国家代码 | `sales_country_code` |
| 询价数 | 该月该国家的询价总数 | `COUNT(*)` |
| 报价数 | 已报价的询价数 | `COUNT(*) WHERE status='Quoted'` |
| 订舱数 | 已确认订舱的数 | `COUNT(*) WHERE booking_confirmed='Yes'` |
| 转化率 | 报价数/询价数 | `报价数/询价数*100%` |
| 订舱率 | 订舱数/询价数 | `订舱数/询价数*100%` |

**表 B: 按运输类型**

| 字段 | 说明 | SQL |
|-----|------|-----|
| 运输类型 | cargo_type_code | `cargo_type_code` |
| 询价数 | 该类型的询价总数 | `COUNT(*)` |
| 报价数 | 已报价的数 | `COUNT(*) WHERE status='Quoted'` |
| 订舱数 | 已确认订舱的数 | `COUNT(*) WHERE booking_confirmed='Yes'` |
| 占比 | 该类型占全月的百分比 | `该类型询价数/全月询价数*100%` |

**表 C: 按销售办公室**

| 字段 | 说明 | SQL |
|-----|------|-----|
| 销售办公室 | sales_office.name | `name` |
| 询价数 | 该办公室的询价总数 | `COUNT(*)` |
| 报价数 | 已报价的数 | `COUNT(*) WHERE status='Quoted'` |
| 转化率 | 报价数/询价数 | `报价数/询价数*100%` |
| 订舱数 | 已确认订舱的数 | `COUNT(*) WHERE booking_confirmed='Yes'` |

**表 D: 按订舱状态**

| 字段 | 说明 | SQL |
|-----|------|-----|
| 订舱状态 | booking_confirmed 值 | `booking_confirmed` |
| 数量 | 该状态的询价数 | `COUNT(*)` |
| 占比 | 该状态占全月的百分比 | `该状态数/全月询价数*100%` |

---

### 2.3 国家分析报表 - Country Report

#### 2.3.1 页面结构

```
┌────────────────────────────────────────────────────────────┐
│ 🗺️ 国家分析报表                                             │
│ [日期范围] [2026-01-01] ~ [2026-02-09]  [查询]              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 📊 国家业绩排名 (按询价数)                                   │
│ ┌────┬──────────┬────────┬────────┬────────┬──────────┐   │
│ │ #  │ 国家     │ 询价数 │ 报价数 │ 订舱数 │ 近7天趋势│   │
│ ├────┼──────────┼────────┼────────┼────────┼──────────┤   │
│ │ 1  │ FRANCE   │  98    │  85    │  72    │ ↑ +5    │   │
│ │ 2  │ GERMANY  │  76    │  68    │  61    │ ↓ -2    │   │
│ │ 3  │ UK       │  65    │  58    │  52    │ → 0     │   │
│ │...                                                    │   │
│ └────┴──────────┴────────┴────────┴────────┴──────────┘   │
│                                                            │
│ 📈 选中国家: [FRANCE ▼]                                     │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 运输类型分布:            │ 订舱状态分布:              │  │
│ │ FCL: 45%                 │ Yes: 73%                  │  │
│ │ LCL: 30%                 │ Pending: 16%              │  │
│ │ AIR: 20%                 │ Rejected: 8%              │  │
│ │ 其他: 5%                 │ Invalid: 3%               │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ 💼 TOP 销售PIC (按该国)                                     │
│ ┌──────────────┬────────┬────────┬────────┐              │
│ │ 销售PIC      │ 询价数 │ 报价数 │ 转化率 │              │
│ ├──────────────┼────────┼────────┼────────┤              │
│ │ John Doe     │  40    │  35    │ 87.5%  │              │
│ │ Jane Smith   │  35    │  30    │ 85.7%  │              │
│ │ Marc Dupont  │  23    │  20    │ 86.9%  │              │
│ └──────────────┴────────┴────────┴────────┘              │
│                                                            │
│ 📅 趋势图 (近30天)                                          │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 折线图: 日期 vs 询价数                                │  │
│ │ [折线显示近30天的日均值]                              │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│                                 [导出Excel] [打印]        │
└────────────────────────────────────────────────────────────┘
```

---

### 2.4 运输类型分析 - Cargo Type Report

#### 2.4.1 详情表

| 运输类型 | 询价数 | 报价数 | 订舱确认 | 报价拒绝 | 平均报价天数 | 占比 |
|---------|--------|--------|---------|---------|------------|------|
| FCL | 165 | 145 | 128 | 5 | 2.1 | 50.3% |
| LCL | 80 | 68 | 59 | 3 | 2.4 | 24.4% |
| AIR | 50 | 48 | 44 | 1 | 1.8 | 15.2% |
| RAIL | 20 | 18 | 15 | 1 | 2.3 | 6.1% |
| SEA | 13 | 8 | 6 | 0 | 3.2 | 4.0% |

---

### 2.5 数据导出 - Export

#### 2.5.1 导出功能

```
┌──────────────────────────────────────┐
│ 📥 导出报表                           │
├──────────────────────────────────────┤
│                                      │
│ 📋 报表类型:                          │
│ ☑ 月度汇总       ☐ 国家分析         │
│ ☑ 运输类型分析   ☐ 办公室业绩       │
│                                      │
│ 📅 日期范围:                          │
│ 从 [2026-02-01] 至 [2026-02-09]    │
│                                      │
│ 📊 数据格式:                          │
│ ◉ Excel (.xlsx)  ○ CSV (.csv)       │
│ ◉ 包含图表       ○ 仅数据表          │
│                                      │
│ 🎨 其他选项:                          │
│ ☑ 包含汇总信息   ☑ 按国家分页        │
│                                      │
│            [取消]  [导出]             │
└──────────────────────────────────────┘
```

#### 2.5.2 导出格式

**Excel 结构** (多个 Sheet):
- Sheet 1: 月度汇总 (统计卡片 + 合计行)
- Sheet 2: 按国家统计 (详细表)
- Sheet 3: 按运输类型 (详细表)
- Sheet 4: 按办公室 (详细表)

---

## 3. Settings 设置模块

### 3.1 Settings 首页

#### 3.1.1 菜单结构

```
设置 / Settings
├── 👥 销售信息管理
│   ├── 国家 (Country)
│   ├── 港口 (Port)
│   ├── 销售办公室 (Sales Office)
│   └── 销售PIC (Sales PIC)
│
├── 📦 物流配置
│   └── 箱型管理 (Container Types)
│
├── 📚 字典管理
│   ├── 产品字典 (Dict Product)
│   ├── 运输类型 (Dict Cargo Type)
│   ├── 单位 (Dict UOM)
│   └── 分类 (Dict Category)
│
└── ⚙️ 系统配置
    ├── CN办公室 (CN Office)
    ├── 系统参数 (System Settings)
    └── 操作日志 (Audit Log)
```

#### 3.1.2 Dashboard 概览

```
┌────────────────────────────────────────────────────────┐
│ ⚙️ 系统设置                                             │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 📊 设置快览                                             │
│ ┌──────────┬──────────┬──────────┬──────────┐         │
│ │ 国家数   │ 港口数   │ 办公室数 │ PIC数    │         │
│ │    95    │   280    │   12     │   45     │         │
│ └──────────┴──────────┴──────────┴──────────┘         │
│                                                        │
│ 🔄 最近修改                                             │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [国家] 新增 NETHERLANDS (NL)         2026-02-09    │ │
│ │ [港口] 更新 SHANGHAI (CNSHA)         2026-02-08    │ │
│ │ [PIC]  删除 Tom Wilson              2026-02-07    │ │
│ │ [箱型] 新增 45HQ (1.875 TEU)         2026-02-06    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ 🚀 快速操作                                             │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│ │ + 国家 │ │ + 港口 │ │+ 办公室│ │ + PIC  │         │
│ └────────┘ └────────┘ └────────┘ └────────┘         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 3.2 国家管理

#### 3.2.1 列表视图

```
┌────────────────────────────────────────────────────────┐
│ 🌍 国家管理                    [+ 新增国家]  [刷新]     │
├────────────────────────────────────────────────────────┤
│ 搜索: [____________________]  启用状态: [全部 ▼]       │
├────────────────────────────────────────────────────────┤
│ ┌────┬──────────┬──────────────────┬────────┬────────┐│
│ │ #  │ 国家代码 │ 英文名           │ 中文名 │ 操作   ││
│ ├────┼──────────┼──────────────────┼────────┼────────┤│
│ │ 1  │ CN       │ China            │ 中国   │ ✓ ⊘  ││
│ │ 2  │ FR       │ France           │ 法国   │ ✓ ⊘  ││
│ │ 3  │ DE       │ Germany          │ 德国   │ ✓ ⊘  ││
│ │... │          │                  │        │        ││
│ └────┴──────────┴──────────────────┴────────┴────────┘│
│                              [编辑] [停用] [删除]      │
└────────────────────────────────────────────────────────┘
```

#### 3.2.2 新增/编辑弹窗

```
┌────────────────────────────────────┐
│ 🌍 新增国家                    [✖]   │
├────────────────────────────────────┤
│                                    │
│ 国家代码*:  [CN ]                  │
│             ⓘ ISO 3166-1 α-2 格式  │
│                                    │
│ 英文名*:    [China________________] │
│                                    │
│ 中文名:     [中国_______________]  │
│                                    │
│ 启用状态:   ☑ 是                   │
│                                    │
│           [取消]  [保存]           │
└────────────────────────────────────┘
```

#### 3.2.3 字段规格

| 字段 | 类型 | 必填 | 验证规则 |
|-----|------|-----|---------|
| country_code | 文本 | ✅ | 唯一、长度2、大写字母 |
| country_name_en | 文本 | ✅ | 最多100字符 |
| country_name_cn | 文本 | ❌ | 最多100字符 |
| is_active | 复选 | ✅ | 默认选中 |

---

### 3.3 港口管理

#### 3.3.1 列表视图

```
┌────────────────────────────────────────────────────────────┐
│ 🏭 港口管理              [+ 新增港口]  [刷新]              │
├────────────────────────────────────────────────────────────┤
│ 搜索: [____________________] 类型: [全部 ▼]  国家: [所有 ▼]│
├────────────────────────────────────────────────────────────┤
│ ┌────┬────────┬──────────────────┬──────┬────────┬────────┐│
│ │ #  │ 港口码 │ 港口名           │ 类型 │ 国家   │ 操作   ││
│ ├────┼────────┼──────────────────┼──────┼────────┼────────┤│
│ │ 1  │ CNSHA  │ Shanghai         │ SEA  │ China  │ ✓ ⊘  ││
│ │ 2  │ CNPVG  │ Pan Yu Container │ SEA  │ China  │ ✓ ⊘  ││
│ │ 3  │ PVG    │ Shanghai Pudong  │ AIR  │ China  │ ✓ ⊘  ││
│ │ 4  │ LE HAV │ Le Havre         │ SEA  │ France │ ✓ ⊘  ││
│ │... │        │                  │      │        │        ││
│ └────┴────────┴──────────────────┴──────┴────────┴────────┘│
│                              [编辑] [停用] [删除]         │
└────────────────────────────────────────────────────────────┘
```

#### 3.3.2 新增/编辑表单

```
┌────────────────────────────────────┐
│ 🏭 新增港口                   [✖]   │
├────────────────────────────────────┤
│                                    │
│ 港口代码*:  [CNSHA_____________]   │
│             ⓘ IATA/UN LOCODE 格式  │
│                                    │
│ 港口名*:    [Shanghai__________]   │
│                                    │
│ 港口类型*:  ◉ 海港(SEA)            │
│             ○ 机场(AIR)            │
│                                    │
│ 所属国家*:  [China ▼]              │
│                                    │
│ 城市:       [Shanghai__________]   │
│                                    │
│ 启用状态:   ☑ 是                   │
│                                    │
│           [取消]  [保存]           │
└────────────────────────────────────┘
```

#### 3.3.3 字段规格

| 字段 | 类型 | 必填 | 验证规则 |
|-----|------|-----|---------|
| port_code | 文本 | ✅ | 长度3-10、唯一 |
| port_name | 文本 | ✅ | 最多200字符 |
| port_type | 单选 | ✅ | AIR/SEA |
| country_code | 下拉 | ✅ | 从 country 表选择 |
| city | 文本 | ❌ | 最多100字符 |

---

### 3.4 销售办公室管理

#### 3.4.1 列表视图

```
┌────────────────────────────────────────────────────────────┐
│ 💼 销售办公室管理          [+ 新增办公室]  [刷新]          │
├────────────────────────────────────────────────────────────┤
│ 搜索: [____________________]  国家: [所有 ▼]              │
├────────────────────────────────────────────────────────────┤
│ ┌────┬────────────────────┬──────────┬────────┬────────────┐│
│ │ #  │ 办公室代码         │ 办公室名 │ 国家   │ PIC数      ││
│ ├────┼────────────────────┼──────────┼────────┼────────────┤│
│ │ 1  │ FR-ZF              │ ZIEGLER  │ France │ 3 人       ││
│ │ 2  │ DE-ZDE             │ ZIEGLER  │ Germany│ 2 人       ││
│ │ 3  │ BE-ZB              │ ZIEGLER  │ Belgium│ 1 人       ││
│ │... │                    │          │        │            ││
│ └────┴────────────────────┴──────────┴────────┴────────────┘│
│                              [编辑] [删除]                │
│                                                            │
│ █ FR-ZF (ZIEGLER FRANCE)             [展开]               │
│   ├─ John Doe                                             │
│   ├─ Jane Smith                                           │
│   └─ Marc Dupont                                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### 3.4.2 新增/编辑表单

```
┌────────────────────────────────────┐
│ 💼 新增销售办公室           [✖]     │
├────────────────────────────────────┤
│                                    │
│ 办公室代码*:  [FR-ZF_________]     │
│               ⓘ 如: DE-ZDE         │
│                                    │
│ 办公室名*:    [ZIEGLER FRANCE______]
│                                    │
│ 所属国家*:    [FRANCE ▼]           │
│                                    │
│ 备注:         [_________________]  │
│                                    │
│ 启用状态:     ☑ 是                 │
│                                    │
│           [取消]  [保存]           │
└────────────────────────────────────┘
```

---

### 3.5 销售PIC管理

#### 3.5.1 列表视图

```
┌────────────────────────────────────────────────────────────┐
│ 👥 销售PIC管理             [+ 新增PIC]  [刷新]             │
├────────────────────────────────────────────────────────────┤
│ 搜索: [____________________]  办公室: [所有 ▼]  国家: [全部 ▼]
├────────────────────────────────────────────────────────────┤
│ ┌────┬──────────────┬──────────────┬──────────┬────────────┐│
│ │ #  │ 销售PIC      │ 销售国家     │ 销售办公 │ 操作       ││
│ ├────┼──────────────┼──────────────┼──────────┼────────────┤│
│ │ 1  │ John Doe     │ FRANCE       │ FR-ZF    │ ✓ ⊘      ││
│ │ 2  │ Jane Smith   │ FRANCE       │ FR-ZF    │ ✓ ⊘      ││
│ │ 3  │ Marc Dupont  │ FRANCE       │ FR-ZF    │ ✓ ⊘      ││
│ │ 4  │ Hans Mueller │ GERMANY      │ DE-ZDE   │ ✓ ⊘      ││
│ │... │              │              │          │            ││
│ └────┴──────────────┴──────────────┴──────────┴────────────┘│
│                              [编辑] [停用] [删除]         │
└────────────────────────────────────────────────────────────┘
```

#### 3.5.2 新增/编辑表单

```
┌────────────────────────────────────┐
│ 👥 新增销售PIC              [✖]    │
├────────────────────────────────────┤
│                                    │
│ 销售PIC名字*:  [John Doe_____]     │
│                                    │
│ 销售国家*:     [FRANCE ▼]          │
│                ──────────────────  │
│ 销售办公室*:   [ZIEGLER FRANCE ▼]  │
│                (自动过滤，仅显示   │
│                 该国家的办公室)     │
│                                    │
│ 启用状态:      ☑ 是                │
│                                    │
│           [取消]  [保存]           │
└────────────────────────────────────┘
```

#### 3.5.3 级联逻辑

```
选择 [销售国家] → 系统过滤 [销售办公室] (仅显示该国家的办公室)
   ↓
选择 [销售办公室] → 系统自动映射到该办公室信息
```

---

### 3.6 箱型管理

#### 3.6.1 列表视图

```
┌────────────────────────────────────────────────────────────┐
│ 📦 箱型管理                 [+ 新增箱型]  [刷新]            │
├────────────────────────────────────────────────────────────┤
│ 搜索: [____________________]                              │
├────────────────────────────────────────────────────────────┤
│ ┌────┬────────────┬────────┬──────────┬────────┬────────┐ │
│ │ #  │ 箱型代码   │ 箱型名 │ TEU值    │ 特殊   │ 操作   │ │
│ ├────┼────────────┼────────┼──────────┼────────┼────────┤ │
│ │ 1  │ 20GP       │ 20'    │ 1.0      │ ○     │ ✓ ⊘  │ │
│ │ 2  │ 40GP       │ 40'    │ 2.0      │ ○     │ ✓ ⊘  │ │
│ │ 3  │ 40HQ       │ 40'HC  │ 2.3      │ ○     │ ✓ ⊘  │ │
│ │ 4  │ 45HQ       │ 45'HC  │ 2.5      │ ●     │ ✓ ⊘  │ │
│ │... │            │        │          │        │        │ │
│ └────┴────────────┴────────┴──────────┴────────┴────────┘ │
│                              [编辑] [停用] [删除]        │
└────────────────────────────────────────────────────────────┘
```

#### 3.6.2 新增/编辑表单

```
┌────────────────────────────────────┐
│ 📦 新增箱型                  [✖]    │
├────────────────────────────────────┤
│                                    │
│ 箱型代码*:  [40HQ__________]        │
│             ⓘ 如: 20GP, 40HQ       │
│                                    │
│ 箱型名*:    [40-feet HC_____]       │
│                                    │
│ TEU值*:     [2.3____________]       │
│                                    │
│ 长度(英尺):  [40_____________]      │
│                                    │
│ 特殊箱型:   ☐ 是                    │
│                                    │
│ 描述:       [________________]      │
│                                    │
│ 启用状态:   ☑ 是                    │
│                                    │
│           [取消]  [保存]           │
└────────────────────────────────────┘
```

---

### 3.7 字典管理

#### 3.7.1 统一字典管理界面

```
┌────────────────────────────────────────────────────────────┐
│ 📚 字典管理                 [选择字典 ▼]  [刷新]            │
├────────────────────────────────────────────────────────────┤
│ 当前字典: 产品字典 (Dict Product)                          │
│                                                            │
│ [+ 新增]  [导入]  [导出]                                   │
├────────────────────────────────────────────────────────────┤
│ ┌────┬────────┬──────────────────┬────────┬────────────┐  │
│ │ #  │ 代码   │ 名称             │ 缩写   │ 操作       │  │
│ ├────┼────────┼──────────────────┼────────┼────────────┤  │
│ │ 1  │ AIR    │ Air Freigh       │ AIR    │ ✓ ⊘     │  │
│ │ 2  │ SEA    │ Sea Freight      │ SEA    │ ✓ ⊘     │  │
│ │ 3  │ RAIL   │ Rail Transport   │ RAIL   │ ✓ ⊘     │  │
│ │... │        │                  │        │            │  │
│ └────┴────────┴──────────────────┴────────┴────────────┘  │
│                              [编辑] [删除]               │
│                                                            │
│ 字典类型:                                                  │
│ [产品] [运输类型] [单位] [分类] [其他]                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### 3.8 系统参数设置

#### 3.8.1 设置项

```
┌────────────────────────────────────────────┐
│ ⚙️ 系统参数设置            [保存设置]       │
├────────────────────────────────────────────┤
│                                            │
│ 📋 基础设置                                 │
│                                            │
│ 系统名称: [LogiTrack Pro__________]        │
│                                            │
│ 公司名称: [ZIEGLER GROUP________]          │
│                                            │
│ 默认语言: [English ▼]                      │
│                                            │
│ 时区: [UTC+8 (China Standard Time) ▼]     │
│                                            │
│ 📊 统计设置                                │
│                                            │
│ 报价响应时间警告阈值 (天): [3_____]        │
│                                            │
│ 月度报表自动生成: ☑ 是                    │
│ 生成日期: [每月____日]                     │
│                                            │
│ 📥 数据设置                                 │
│                                            │
│ 软删除启用: ☑ 是                          │
│ (删除记录后____天内可恢复)                 │
│                                            │
│ 数据备份周期: [每周一 ▼]                   │
│                                            │
│ 📧 通知设置                                 │
│                                            │
│ 启用邮件通知: ☑ 是                        │
│ 通知收件人: [admin@logitrack.com]         │
│                                            │
│           [取消]  [保存]                   │
└────────────────────────────────────────────┘
```

---

### 3.9 操作日志

#### 3.9.1 审计日志表

```
┌────────────────────────────────────────────────────────────┐
│ 📋 操作日志                 [日期范围] [用户] [操作] [查询]  │
├────────────────────────────────────────────────────────────┤
│ ┌────┬──────────┬──────┬─────────────┬──────┬──────────────┐│
│ │ #  │ 时间     │ 用户 │ 操作        │ 表名 │ 详情         ││
│ ├────┼──────────┼──────┼─────────────┼──────┼──────────────┤│
│ │ 1  │ 2026-... │ admin│ 新增        │ 港口 │ 港口码: AMSRD│
│ │ 2  │ 2026-... │ admin│ 修改        │ PIC  │ 名字: Tom → Jerry
│ │ 3  │ 2026-... │ admin│ 删除        │ 外币 │ ID: 45       ││
│ │ 4  │ 2026-... │ admin│ 启用/停用   │ 国家 │ 国家码: FR   ││
│ │... │          │      │             │      │              ││
│ └────┴──────────┴──────┴─────────────┴──────┴──────────────┘│
│                              [导出]  [清空]                 │
└────────────────────────────────────────────────────────────┘
```

---

## 4. API 设计

### 4.1 Report API

#### 4.1.1 Dashboard 统计接口

```
GET /api/statistics/dashboard
Query Params:
  - month (optional): YYMM 格式，默认当月
  
Response:
{
  "stats": {
    "todayNewEnquiries": 12,
    "today_vs_yesterday": 2,
    "pendingQuotes": 45,
    "pending_vs_week_ago": 8,
    "pendingBookings": 28,
    "pending_vs_week_ago": -3,
    "monthCompletionRate": "72%",
    "monthTotalEnquiries": 328,
    "monthTotalQuotes": 287,
    "monthQuoteRate": "87%",
    "monthBookingRate": "84%",
    "monthBookingCount": 238,
    "avgQuoteDays": "2.1",
    "topCountry": { "code": "FR", "name": "FRANCE", "count": 98 },
    "topCargoType": { "code": "FCL", "name": "FCL", "count": 165 },
    "officeCount": 5,
    "rejectionRate": "8%"
  },
  "charts": {
    "statusDistribution": [
      { "status": "New", "count": 41, "percentage": 12.5 },
      { "status": "Quoted", "count": 287, "percentage": 87.5 }
    ],
    "trend30Days": [
      { "date": "2026-02-01", "count": 8 },
      { "date": "2026-02-02", "count": 12 },
      ...
    ],
    "cargoTypeDistribution": [
      { "type": "FCL", "percentage": 50.3 },
      { "type": "LCL", "percentage": 24.4 },
      ...
    ]
  }
}
```

#### 4.1.2 月度报表接口

```
GET /api/statistics/monthly
Query Params:
  - year: 年份 (YYYY)
  - month: 月份 (MM)
  
Response:
{
  "month": "202602",
  "summary": {
    "totalEnquiries": 328,
    "quotedCount": 287,
    "bookingConfirmedCount": 238,
    "rejectionCount": 4,
    "bookingRate": "84%",
    "quoteRate": "87%"
  },
  "byCountry": [
    {
      "countryCode": "FR",
      "countryName": "FRANCE",
      "enquiryCount": 98,
      "quotedCount": 85,
      "bookedCount": 72,
      "conversionRate": "86.7%"
    },
    ...
  ],
  "byCargoType": [
    {
      "cargoType": "FCL",
      "enquiryCount": 165,
      "percentage": "50.3%",
      "quotedCount": 145,
      "bookedCount": 128
    },
    ...
  ],
  "bySalesOffice": [
    {
      "officeId": 1,
      "officeName": "ZIEGLER FRANCE",
      "enquiryCount": 98,
      "quotedCount": 85,
      "conversionRate": "86.7%"
    },
    ...
  ],
  "bookingStatus": [
    { "status": "Yes", "count": 238, "percentage": "72.6%" },
    { "status": "Pending", "count": 44, "percentage": "13.4%" },
    { "status": "Rejected", "count": 34, "percentage": "10.4%" }
  ]
}
```

#### 4.1.3 国家分析接口

```
GET /api/statistics/by-country
Query Params:
  - countryCode: 国家代码 (可选，不指定则返回全部)
  - startDate: 开始日期 (YYYY-MM-DD)
  - endDate: 结束日期 (YYYY-MM-DD)
  
Response:
{
  "countryCode": "FR",
  "countryName": "FRANCE",
  "summary": {
    "totalEnquiries": 98,
    "quotedCount": 85,
    "bookedCount": 72,
    "conversionRate": "86.7%"
  },
  "cargoDistribution": [
    { "type": "FCL", "percentage": 45.0, "count": 44 },
    { "type": "LCL", "percentage": 30.0, "count": 29 },
    ...
  ],
  "bookingStatusDistribution": [
    { "status": "Yes", "percentage": 73.0, "count": 71 },
    { "status": "Pending", "percentage": 16.0, "count": 15 },
    ...
  ],
  "topPics": [
    {
      "picId": 1,
      "picName": "John Doe",
      "enquiryCount": 40,
      "quotedCount": 35,
      "conversionRate": "87.5%"
    },
    ...
  ],
  "trend30Days": [
    { "date": "2026-02-01", "count": 5 },
    { "date": "2026-02-02", "count": 3 },
    ...
  ]
}
```

#### 4.1.4 导出报表接口

```
POST /api/statistics/export
Request Body:
{
  "reportType": "monthly",  // monthly|country|cargoType|office
  "format": "xlsx",  // xlsx|csv
  "includeCharts": true,
  "month": "202602",
  "countryCode": "FR",  // optional
  "startDate": "2026-02-01",
  "endDate": "2026-02-09"
}

Response:
Binary file (Excel/CSV)
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

---

### 4.2 Settings API

#### 4.2.1 国家管理 API

```
GET /api/settings/countries
Query Params:
  - page, size, keyword, isActive

POST /api/settings/countries
Request: { countryCode, countryNameEn, countryNameCn, isActive }

PUT /api/settings/countries/{countryCode}
Request: { countryNameEn, countryNameCn, isActive }

DELETE /api/settings/countries/{countryCode}
(检查外键约束)

GET /api/settings/countries/{countryCode}
(获取详情)
```

#### 4.2.2 港口管理 API

```
GET /api/settings/ports
Query Params:
  - page, size, keyword, portType (AIR|SEA), countryCode

POST /api/settings/ports
Request: { 
  portCode, portName, portType, countryCode, city, isActive 
}

PUT /api/settings/ports/{portId}
Request: { portName, countryCode, city, isActive }

DELETE /api/settings/ports/{portId}

GET /api/settings/ports/search
Query Params:
  - keyword (模糊搜索)
  - type (AIR|SEA)
```

#### 4.2.3 销售PIC API

```
GET /api/settings/sales-pics
Query Params:
  - page, size, keyword, countryCode, officeId

POST /api/settings/sales-pics
Request: { name, countryCode, officeId, isActive }

PUT /api/settings/sales-pics/{picId}
Request: { name, countryCode, officeId, isActive }

DELETE /api/settings/sales-pics/{picId}

GET /api/settings/sales-pics/by-country/{countryCode}
(获取该国家的所有PIC)
```

#### 4.2.4 箱型管理 API

```
GET /api/settings/container-types
Query Params:
  - page, size, keyword, isActive

POST /api/settings/container-types
Request: { containerCode, containerName, teuValue, lengthFeet, isSpecial }

PUT /api/settings/container-types/{containerId}
Request: { containerName, teuValue, lengthFeet, isSpecial, isActive }

DELETE /api/settings/container-types/{containerId}
```

#### 4.2.5 字典管理 API

```
GET /api/settings/dict/{dictType}
Query Params:
  - page, size, keyword, isActive
  dictType: product|cargoType|uom|category|cnOffice|coreFlag

POST /api/settings/dict/{dictType}
Request: { code, name, ... }

PUT /api/settings/dict/{dictType}/{code}
Request: { name, ... }

DELETE /api/settings/dict/{dictType}/{code}
```

---

## 5. 前端组件结构

### 5.1 Report 组件目录

```
components/
├── report/
│   ├── ReportLayout.tsx          (主布局)
│   ├── Dashboard.tsx             (仪表板)
│   ├── MonthlyReport.tsx          (月度报表)
│   ├── CountryReport.tsx          (国家分析)
│   ├── CargoTypeReport.tsx        (运输类型分析)
│   ├── ExportDialog.tsx           (导出弹窗)
│   ├── charts/
│   │   ├── StatusPieChart.tsx     (状态饼图)
│   │   ├── TrendLineChart.tsx     (趋势折线图)
│   │   ├── CargoTypeBarChart.tsx  (运输类型柱状图)
│   │   ├── CountryRankChart.tsx   (国家排名)
│   │   └── StatCard.tsx           (统计卡片)
│   └── tables/
│       ├── MonthlyTable.tsx       (月度表)
│       ├── CountryTable.tsx       (国家表)
│       └── CargoTypeTable.tsx     (运输类型表)
```

### 5.2 Settings 组件目录

```
components/
├── settings/
│   ├── SettingsLayout.tsx         (主布局)
│   ├── Dashboard.tsx              (概览)
│   ├── CountryManagement.tsx      (国家管理)
│   ├── PortManagement.tsx         (港口管理)
│   ├── SalesOfficeManagement.tsx  (销售办公室)
│   ├── SalesPicManagement.tsx     (销售PIC)
│   ├── ContainerTypeManagement.tsx (箱型)
│   ├── DictManagement.tsx         (字典)
│   ├── SystemSettings.tsx         (系统参数)
│   ├── AuditLog.tsx               (操作日志)
│   ├── common/
│   │   ├── MasterDataList.tsx     (通用列表)
│   │   ├── MasterDataForm.tsx     (通用表单)
│   │   ├── CascadeSelect.tsx      (级联选择)
│   │   └── BulkActions.tsx        (批量操作)
```

### 5.3 API 服务层扩展

```
services/
├── api.ts (已有)
├── reportApi.ts (新增)
│   ├── getDashboardStats()
│   ├── getMonthlyReport()
│   ├── getCountryReport()
│   ├── getCargoTypeReport()
│   └── exportReport()
└── settingsApi.ts (新增)
    ├── Country CRUD
    ├── Port CRUD
    ├── SalesOffice CRUD
    ├── SalesPic CRUD
    ├── ContainerType CRUD
    └── Dict CRUD
```

---

## 6. 实现优先级

### Phase 1 (MVP - 第1周)
- ✅ Report Dashboard (基础统计卡片)
- ✅ Monthly Report (表格版本)
- ✅ Settings > Country Management
- ✅ Settings > Port Management

### Phase 2 (第2周)
- ✅ Report Charts (图表完善)
- ✅ Country Report (国家分析)
- ✅ Settings > Sales PIC Management
- ✅ Settings > Container Type

### Phase 3 (第3周)
- ✅ Export Report (Excel导出)
- ✅ Settings > Dictionary Management
- ✅ Settings > System Configuration
- ✅ Audit Log

### Phase 4 (优化)
- 🔄 高级筛选
- 🔄 缓存优化
- 🔄 权限细化

---

## 附录: 数据库查询参考

### A. Dashboard 统计查询

```sql
-- 今日新增
SELECT COUNT(*) FROM enquiry WHERE DATE(issue_date) = CURDATE();

-- 待报价
SELECT COUNT(*) FROM enquiry WHERE status = 'New';

-- 月完成率
SELECT CONCAT(
  ROUND(SUM(CASE WHEN status='Quoted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2),
  '%'
) FROM enquiry WHERE reference_month = DATE_FORMAT(CURDATE(), '%y%m');

-- 近30天趋势
SELECT DATE(issue_date) as date, COUNT(*) as count
FROM enquiry
WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(issue_date)
ORDER BY date;
```

### B. 月度报表查询

```sql
-- 按国家统计
SELECT
  e.sales_country_code as country_code,
  c.country_name_en as country_name,
  COUNT(*) as total_enquiries,
  SUM(CASE WHEN e.status='Quoted' THEN 1 ELSE 0 END) as quoted_count,
  SUM(CASE WHEN e.booking_confirmed='Yes' THEN 1 ELSE 0 END) as booking_count,
  ROUND(SUM(CASE WHEN e.status='Quoted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as conversion_rate
FROM enquiry e
JOIN country c ON e.sales_country_code = c.country_code
WHERE e.reference_month = ?
GROUP BY e.sales_country_code
ORDER BY total_enquiries DESC;
```

---

**此方案可根据实际反馈进行调整。** 📝

