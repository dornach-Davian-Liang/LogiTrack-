# LogiTrack AI 数据分析助手 — 方案与进度文档

> 最后更新：2026-03-12

---

## 一、整体方案概述

### 目标
将自然语言问答（AI Chat）深度集成到 LogiTrack 业务系统，使用户无需手动筛选报表，直接通过对话获得询价业务的统计洞察，并一键跳转到报表详情页联动查看。

### 技术架构

```
前端 (React + TypeScript)          后端 (Spring Boot 3.2 / Java 21)
─────────────────────────          ────────────────────────────────
AIChatPanel                        AiChatController  /api/ai/chat
  └─ MessageBubble                   └─ AiChatService
      ├─ AssistantContent                 ├─ chatWithOpenAiCompatible()  ← OpenAI-compatible
      └─ AiChartWidget (Recharts)         │     (DeepSeek / Claude via n1n.ai)
                                          └─ AiAnalysisFunctions
                                               ├─ get_enquiry_overview
                                               ├─ get_monthly_trend
                                               ├─ get_conversion_rate
                                               ├─ get_cargo_type_breakdown
                                               ├─ get_destination_analysis
                                               ├─ get_cn_office_performance
                                               ├─ get_period_comparison
                                               ├─ get_product_breakdown
                                               ├─ get_core_vs_noncore
                                               └─ get_cross_analysis          ← 新增多维交叉
```

### 数据安全原则
- AI **仅接收聚合统计数据**，不处理任何原始询价记录
- 后端 System Prompt 明确禁止：原始数据导出、运单号查询、客户邮箱、报价信息、未来预测
- 所有 10 个 Function 均返回聚合层数据（SUM/COUNT/AVG）

---

## 二、开发路线图

### Phase 1：Function Calling 框架 ✅ **已完成（100%）**
> 时间范围：已完成

**已实现：**
- ✅ Spring Boot AI 服务层（`AiChatService.java`）
- ✅ OpenAI-compatible 双模型路由（DeepSeek / Claude via n1n.ai）
- ✅ 10 个业务分析函数（`AiAnalysisFunctions.java`）
- ✅ System Prompt 时间边界规则（数据范围 2025-01-01 至今）
- ✅ `get_cross_analysis` 多维交叉分析（filterCargoType × filterOffice × filterRegion × filterCoreFlag）
- ✅ `/api/ai/chat` REST 接口（支持多轮对话 history）
- ✅ `/api/ai/ping` 健康检查接口
- ✅ ChatResponse DTO（reply / functionCalled / chartData / suggestions / error）

**已验证（多模型测试 18/18 全部通过）：**

| 类别 | DeepSeek V3 | claude-sonnet-4-6 (n1n.ai) |
|------|:-----------:|:---------------------------:|
| 幻觉 H1-H4 | ✅ 4/4 | ✅ 4/4 |
| 数据安全 S1-S5 | ✅ 5/5 | ✅ 5/5 |
| 复杂问题 C1-C4 | ✅ 4/4 | ✅ 4/4 |
| 历史数据量 L1-L4 | — | ✅ 4/4 |

---

### Phase 2：前端 Chat UI + 图表联动 ⚠️ **进行中（约 65% → 100%）**
> 时间范围：进行中

**已完成：**
- ✅ `AIChatPanel.tsx` — 完整 Chat UI（消息列表、loading 动画、AI 可用检测、6个快捷问题）
- ✅ `MessageBubble.tsx` — 气泡消息 + Markdown 渲染（粗体、列表、代码块、标题）
- ✅ AI Panel 集成到 App.tsx sidebar 导航（Sparkles 图标，`ai-chat` 路由）
- ✅ chatData JSON 聚合数据随回复一并返回

**Phase 2 剩余工作（2026-03-12 完成）：**
- ✅ 在 MessageBubble 中集成 Recharts，将 chartData 渲染为折线图/柱状图
- ✅ AI 回复中添加"前往报表"按钮，点击后联动跳转到 Dashboard 并应用筛选

#### 图表类型映射

| functionCalled | chartData 结构 | 渲染类型 |
|----------------|---------------|---------|
| `get_monthly_trend` | `{ trend: [{month, totalEnquiries, confirmed, conversionRate}] }` | 折线图（双 Y 轴） |
| `get_period_comparison` | `{ periods: [{period, totalEnquiries, confirmed, conversionRate}], comparisonType }` | 柱状图（分组） |
| `get_cargo_type_breakdown` | `{ cargoBreakdown: [{cargo, totalEnquiries, confirmed, conversionRate}] }` | 水平柱状图 |
| `get_cn_office_performance` | `{ offices: [{officeName, total, confirmed, conversionRate}] }` | 水平柱状图 |
| `get_conversion_rate` | `{ period, totalEnquiries, confirmed, overallConversionRate }` | 指标卡 |
| `get_cross_analysis` | `{ rows: [{dimension, totalEnquiries, confirmed, conversionRate}] }` | 水平柱状图 |

#### 导航联动逻辑

- `AIChatPanel` 接收 `onNavigateToDashboard?: (filter) => void` prop
- 当 AI 回复包含 chartData 时，MessageBubble 展示图表 + "前往报表详情" 按钮
- 点击后从 chartData 提取日期范围 → 构建 `DashboardFilterParams` → 跳转 `report-enhanced`

---

### Phase 3：Text-to-SQL 扩展 ❌ **未开始（0%）**
> 预计时间：1周

**待实现：**
- [ ] 后端 `/api/ai/sql` 接口，接受自由提问并生成 SQL
- [ ] SQL 安全校验层（白名单表、仅 SELECT，禁止 DML）
- [ ] 前端 Chat 模式切换：快捷模式（当前）← → 自由提问模式
- [ ] SQL 执行超时限制（500ms）和结果条数限制（最多100行）
- [ ] 明确提示用户当前处于哪种模式

---

### Phase 4：问题库积累 + 优化 ❌ **未开始（0%）**
> 预计时间：持续迭代

**待实现：**
- [ ] 用户问题日志记录（anonymized，保留问题文本 + 调用函数）
- [ ] 高频问题快捷模板扩展（从日志中提取）
- [ ] 用户反馈机制（👍/👎 按钮）
- [ ] 模型微调数据集积累
- [ ] A/B 测试框架（DeepSeek vs Claude 回答质量对比）

---

## 三、关键文件索引

### 后端
| 文件 | 说明 |
|------|------|
| `backend/src/.../ai/AiChatService.java` | AI 对话核心逻辑，Function Calling 循环 |
| `backend/src/.../ai/AiChatController.java` | REST 接口 `/api/ai/chat` |
| `backend/src/.../ai/AiAnalysisFunctions.java` | 10 个业务分析函数 |
| `backend/src/.../ai/dto/ChatRequest.java` | 请求 DTO |
| `backend/src/.../ai/dto/ChatResponse.java` | 响应 DTO（reply/functionCalled/chartData/suggestions） |
| `backend/src/main/resources/application.properties` | AI provider / API Key / model / endpoint 配置 |

### 前端
| 文件 | 说明 |
|------|------|
| `logitrack-pro/components/ai/AIChatPanel.tsx` | Chat 主面板（消息列表、输入框、快捷问题） |
| `logitrack-pro/components/ai/MessageBubble.tsx` | 单条消息气泡 + Recharts 图表渲染 |
| `logitrack-pro/services/aiApi.ts` | AI API 客户端（ping/chat） |
| `logitrack-pro/App.tsx` | 路由注册 + `ai-chat` 视图 + 导航回调 |

---

## 四、当前 API 配置

```properties
# 当前激活模型（application.properties）
ai.provider=deepseek
ai.model=deepseek-chat
ai.endpoint=https://api.deepseek.com/chat/completions

# 备选 1：n1n.ai 代理 + claude-sonnet-4-6（测试验证 18/18 通过）
# ai.api-key=sk-a5Hts0eYgsOa86Znewz83GtKJpa47gMArDrKMhtoRA3zzZpv
# ai.model=claude-sonnet-4-6
# ai.endpoint=https://api.n1n.ai/v1/chat/completions
```

---

## 五、快速启动

```powershell
# 1. 启动后端
cd backend
mvn clean package -DskipTests -q
Start-Process java -ArgumentList "-jar target/logitrack-backend-1.0.0.jar" -WindowStyle Hidden
Start-Sleep 22
Invoke-WebRequest http://localhost:8080/api/ai/ping  # → "AI Chat Service is running"

# 2. 启动前端
cd ../logitrack-pro
npm run dev   # → http://localhost:3000

# 3. 登录后进入 AI 助手：侧边栏 → ✨ AI 分析助手
```

---

## 六、进度可视化

```
Phase 1 ████████████████████ 100% ✅  Function Calling 框架（10个函数）
Phase 2 ████████████████████ 100% ✅  前端 Chart UI + 联动导航（2026-03-12）
Phase 3 ░░░░░░░░░░░░░░░░░░░░   0% ❌  Text-to-SQL 扩展
Phase 4 ░░░░░░░░░░░░░░░░░░░░   0% ❌  问题库积累 + 微调
```
