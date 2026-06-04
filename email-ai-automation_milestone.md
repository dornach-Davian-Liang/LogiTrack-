# Email AI Automation — 项目里程碑 (更新: 2026-05-19)

## 项目概要
- **路径**: `d:\ziegler\项目文件\email-ai-automation\`
- **目的**: 自动分析 Ziegler Logistics 共享邮箱 `chinapricing@zieglergroup.cn` 的询价邮件，识别 INQUIRY 并按规则转发给对应 PIC
- **Python**: `D:\Program\Python3.9\python.exe`
- **代理**: 所有命令前需 `$env:NO_PROXY="*"`；控制台编码 `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` + `-X utf8`

---

## 核心 API / 凭据

| 服务 | API Key | Base URL | 模型 |
|---|---|---|---|
| LLM (主力) | LLM_API_KEY | https://api.deepseek.com | deepseek-chat |
| VLM 主用 | VLM_API_KEY | https://api.qnaigc.com/v1 | qwen-vl-max-2025-01-25 |
| VLM 备用 | VLM_FALLBACK_API_KEY | https://api.n1n.ai/v1 | qwen3-vl-plus |

**注意**: 七牛云可选用 `qwen/qwen3.6-plus`、`qwen/qwen3.5-plus`（现已可用）；n1n 备用可选 `gemini-3.1-flash-lite-preview`（现已可用）

---

## 项目文件架构

```
email-ai-automation/
├── main.py                    # 主轮询入口，生产运行
├── config/
│   └── settings.py            # 环境变量配置，含 LLM + VLM 双组配置
├── services/
│   ├── graph_client.py        # MS Graph API 客户端（邮件/附件/转发/发送）
│   ├── email_parser.py        # 邮件解析+噪音清理+AI输入构建，含图片VLM提取
│   ├── ai_analyzer.py         # LLM分析主模块，SYSTEM_PROMPT_TEMPLATE + base/training few-shot 动态加载
│   ├── router.py              # PIC路由引擎（含非Ziegler/Ziegler办事处路由）
│   ├── alert.py               # 失败告警（余额耗尽/超时/连续失败）
│   ├── test_tracker.py        # 已测邮件去重记录
│   ├── vision_analyzer.py     # VLM多模态服务（图片文字/表格提取）
│   ├── skip_checker.py        # 建号拦截（DG/混合运输/非具体货量等）
│   ├── logitrack_client.py    # LogiTrack REST API 客户端 [M7新增]
│   ├── logitrack_mapper.py    # AI结果→LogiTrack payload映射 [M7新增]
│   ├── logitrack_db_client.py # LogiTrack MySQL直连（备用主数据查询）[M7新增]
│   └── logitrack_exporter.py  # 待补全记录CSV导出邮件通知 [M7新增]
├── data/
│   ├── pic_routing.json       # PIC路由配置（含特殊规则）
│   ├── logitrack_mapping.json # LogiTrack字段映射配置（端口/国家/PIC）[M7新增]
│   ├── base_fewshot.json      # 基础 Few-shot 案例（当前 25 个）
│   ├── training_fewshot.json  # 训练/纠错 Few-shot 案例（监控面板可维护）
│   └── tested_emails.json     # 403条已测对话链ID（去重用）
├── scripts/
│   ├── live_test.py           # 只读真实邮件测试工具
│   ├── regression_test.py     # 回归测试（对比AI结果与历史基线）
│   ├── auto_learn.py          # 自动采样+Few-shot候选生成
│   └── phase5_dryrun_test.py  # LogiTrack建单集成测试 [M7新增]
├── docs/
│   ├── LOGITRACK_INTEGRATION.md  # LogiTrack集成设计文档
│   └── ENVIRONMENT_SETUP.md      # 环境变量配置指南
└── .env                       # 实际密钥（已含VLM+LogiTrack配置）
```

---

## 里程碑一览

### M1 — 基础分类系统（2026-04 早期）✅
- [x] MS Graph API 邮件接入（client_credentials 流）
- [x] HTML→纯文本、签名/引用噪音清理（`email_parser.py`）
- [x] DeepSeek LLM 分析，JSON 格式输出
- [x] 首批 14 个 Few-shot Cases（案例1-14）
- [x] INQUIRY 零漏判（核心目标）

### M2 — 知识扩充 & 告警（2026-04-19~20）✅
- [x] auto_learn.py 分层采样，自动生成 Few-shot 候选
- [x] 案例15（LCL SEA+AIR 多方式）、案例16（FOLLOW_UP 催进度）、案例17（INFO/OOO）、案例18（对话链有报价但当前为 INQUIRY）新增 → **共 18 个 Few-shot Cases**
- [x] 回归测试基线建立：403 条记录，seed=42，31 封样本
  - **INQUIRY 召回率 100%（6/6，零漏判）**
  - 总体准确率 83.9%，5处不一致均为非INQUIRY边界漂移
- [x] `services/alert.py` — FailureAlerter（余额耗尽/超时/连续失败检测）
- [x] 独立告警日志 `logs/alerts.log`

**优化教训（必读）**:
- ❌ 添加 FOLLOW_UP 边界规则 few-shot → 5/30 恶化至 7/30，已回滚
- ❌ SYSTEM_PROMPT 加边界判定表（markdown table）→ 恶化至 9/30，已回滚
- ❌ 主正文签名剥离误删引用中的费率信息 → QUOTE_REPLY 回退，已回滚
- ✅ 对话链条目适合独立噪音清理；主正文不做签名/引用剥离

### M3 — 非Ziegler代理路由（2026-04-21）✅

**需求**: SEA + SHA/NGB + Core目的地 + 非Ziegler发件人 → 统一路由给 Vivian Li，不走正常 destination_rules

**改动文件**:

#### `data/pic_routing.json`（special_rules 新增）
```json
"ziegler_domains": ["zieglergroup.cn", "zieglergroup.com"],
"non_ziegler_sea_sha_ngb_core": {
  "to": ["ngb.vli@zieglergroup.cn"],
  "cc": ["hkg.cyip@zieglergroup.cn", "susan.zhang@zieglergroup.cn", "hkg.yho@zieglergroup.cn"],
  "note": "Non-Ziegler agent + SHA/NGB + Core destination -> route to Vivian Li"
}
```

#### `services/router.py`
- 新增 `is_ziegler_sender(sender_email)` 方法：提取域名，检查是否在 ziegler_domains
- `get_routing()` 增加 `sender_email: str = ""` 参数
- 在 biz_key="core" 确定后、destination_rules 之前插入非Ziegler特殊路由块
- `get_forward_instruction()` + `_build_single_instruction()` 均透传 `sender_email`

#### `main.py` / `scripts/live_test.py`
- `router.get_forward_instruction(analysis, sender_email=sender)` 传入发件人

**验证**: 6个路由场景单元测试全通过，live_test 真实邮件验证通过

### M4 — Ziegler办事处国家路由（2026-04-21）✅

**需求**: SEA + SHA/NGB + Core + **Ziegler发件人** → 按发件人所在Ziegler办事处国家路由（而非POD国家）

**典型案例**: `sales.ocean.nl@zieglergroup.com`（荷兰）+ POD Marseille（法国）→ 应路由 `ngb.lshen`（Netherlands规则），而非 `demi.hua`（France规则）

**提取方式**: AI从邮件签名红框地址提取发件人国家（非邮件地址解析）

**改动文件**:

#### `services/ai_analyzer.py`
- JSON输出 schema 新增 `sender_ziegler_office` 字段（位于 `multiple_origins` 和 `confidence` 之间）
- SYSTEM_PROMPT 新增 `sender_ziegler_office 提取规则` 章节：
  - 从签名公司名/地址提取国家（英文）
  - 需与 destination_rules 国家名匹配（Belgium/Germany/Netherlands/France等）
  - 非Ziegler发件人必须留空字符串

#### `services/router.py`
- `get_routing()` 增加 `sender_ziegler_office: str = ""` 参数
- 新增 Ziegler办事处路由块（在非Ziegler块之后、POD destination_rules 之前）：
  - 条件：SEA + SHA/NGB + core + sender_ziegler_office 不为空 + is_ziegler_sender()
  - 用 sender_ziegler_office（办事处国家）查 destination_rules，替代 destination_country
- `get_forward_instruction()` 从 `ai_result.get("sender_ziegler_office", "")` 读取
- `_build_single_instruction()` + 两处多起运地调用均透传 `sender_ziegler_office`

**重要BUG修复**: biz_data 必须在 Ziegler 办事处路由块之前赋值（原先在后面，会导致 NameError）— 已将 `biz_data = branch_data.get(biz_key, {})` 移至非Ziegler块之后、Ziegler办事处块之前

**验证**:
```
Test1: Ziegler NL + NGB + POD=France → ngb.lshen (Netherlands规则) ✅
Test2: Ziegler DE + SHA + POD=Netherlands → DE.CentralChinaBooking (Germany规则) ✅
Test3: 非Ziegler + SHA + Core → Vivian Li ✅（M3规则不受影响）
Test4: Ziegler 未提取到office → fallback到POD国家(France→demi.hua) ✅
Test5: Ziegler NL + TSN（非SHA/NGB）→ 正常core规则 ✅
Live test: VS//FOB Ningbo+Tianjin-POD Marseille → NGB路由到ngb.lshen ✅（备注"Ziegler Netherlands agent; routed by sender office country"）
```

### M5 — 多模态图片提取（2026-04-21）✅

**需求**: 邮件中客户把货物信息以图片截图方式嵌入邮件（或作为附件），需要 VLM 提取文字/表格供 AI 分析

**现状分析**:
- 图片嵌入邮件正文（inline）情况极少，绝大多数以附件形式出现
- Graph API 已将所有文件附件（含图片）下载到 `temp_attachments/{message_id}/`
- 原 `email_parser.py` 对 `.png/.jpg` 走 `else` 分支返回空字符串，图片被静默跳过
- 234 张历史图片：164 张 <10KB（签名logo），70 张 >10KB（可能含货物信息）

**VLM 验证结果**:
- 七牛云 `qwen-vl-max-2025-01-25`：可用 ✅（qwen3.5-plus/qwen3.6-plus 经验证均可用）
- n1n `qwen3-vl-plus`：可用 ✅（gemini-3.1-flash-lite-preview 现已可用）
- qwen3.5-plus（七牛云初次测试时400错误，但后续确认已恢复可用）

**新增文件**:

#### `services/vision_analyzer.py`（新建）
```python
# 主用: 七牛云 qwen-vl-max-2025-01-25
# 备用: n1n qwen3-vl-plus
# 过滤阈值: MIN_IMAGE_SIZE = 10_000 (10KB)，跳过签名logo
# 支持: .png .jpg .jpeg .gif .bmp .webp .tiff
# should_process(): 判断图片是否值得送VLM（大小 + 格式）
# extract_from_image(): 主→备用 failover，VLM返回"[非货物信息图片]"则空字符串
```

**提取 Prompt 重点**:
- 提取货物信息（品名、重量、体积、柜型、数量）
- 起运地/目的地、贸易条款、日期、费用
- 表格用 | 分隔符还原
- 签名图/logo/装饰图 → 返回 `[非货物信息图片]`

**修改文件**:

#### `config/settings.py`
```python
vlm_api_key / vlm_base_url / vlm_model          # 主用 VLM
vlm_fallback_api_key / vlm_fallback_base_url / vlm_fallback_model  # 备用 VLM
```

#### `services/graph_client.py`
- fileAttachment 返回元数据增加 `"is_inline": bool(att.get("isInline", False))`

#### `services/email_parser.py`
- 导入 `VisionAnalyzer`
- `extract_attachment_text()` 增加 `is_inline: bool = False` 参数
- 图片扩展名走新增的 `_extract_image()` 分支（而非 else 跳过）
- `parse_email()` 中传递 `is_inline=att.get("is_inline", False)`
- 新增 `_extract_image()` 方法：延迟初始化 `self._vision = VisionAnalyzer()`

#### `.env` / `.env.example`
- 新增 VLM_API_KEY / VLM_BASE_URL / VLM_MODEL / VLM_FALLBACK_* 六个配置项

**验证**:
```
987KB 货运报价截图 → 提取2255字符，完整还原表格(POL|POD|COUNTRY|RATE|ETD...) ✅
1.2KB logo → should_process=False，自动跳过 ✅
671KB 非货物图片 → VLM判定[非货物信息图片]，返回空字符串 ✅
模拟邮件集成测试 → 图片附件段正确出现在AI输入 "📎 附件内容" 区 ✅
```

---

## 路由规则优先级（当前）

```
get_routing() / get_forward_instruction() 内部执行顺序:
0. 【M6-R2】混合运输（transport_mode 含 "+"）→ Curtis+Yvonne（短路）
1. 【M6-R6】进口中国（pod_country in China/HK + SEA/AIR）→ 重映射 branch（优先于无货量规则）
2. 【M6-R3】非中国起运（pol_country ≠ China/HK）→ SEA→Curtis+Yvonne；AIR→Susana（短路）
3. 【M6-R4】Tender/Bid HIGH（risk_level=HIGH + tender/bid 关键词）→ 按运输方式通用矩阵（短路）
4. 其他 HIGH → 只发主管（原逻辑）
5. 【M6-R5】无具体货量（no_specific_cargo=True）→ SEA→Curtis+Yvonne+SZhang；AIR→通用矩阵（短路）
6. 【M3】非Ziegler + SEA + SHA/NGB + core → Vivian Li (non_ziegler_sea_sha_ngb_core)
7. 【M4】Ziegler + SEA + SHA/NGB + core + sender_ziegler_office → 按办事处国家查 destination_rules
8. SEA SHA/NGB destination_rules（按POD国家，仅core）→ 匹配特定国家PIC
9. core / non_core 默认 TO
10. fallback → 运输方式 managers
注：R1 DG 危险品 → skip_checker 层阻止建号，路由照常执行（不短路）
```

---

## 当前 AI 输出 Schema（关键字段）

```json
{
  "email_type": "INQUIRY|BOOKING|QUOTE_REPLY|FOLLOW_UP|INFO|OTHER",
  "is_inquiry": true/false,
  "risk_score": 0-100,
  "risk_level": "LOW|MEDIUM|HIGH",
  "risk_flags": ["..."],
  "transport_mode": "SEA|AIR|RAIL|SEA+AIR|...",
  "origin_city": "...",
  "branch_code": "SHA|NGB|SZX|TAO|TSN|XMN|HKG|CKG",
  "pol_country": "",        // [M6新增] 起运地国家（非中国/HK时触发非中国起运规则）
  "destination": "...",
  "pod_country": "",        // [M4 B7修复] AI直接输出POD国家
  "cargo_info": {
    "commodity":"...", "volume_cbm":null, "gross_weight_kg":null,
    "containers":{"20ft":null,"40ft":null,"40hq":null,"45ft":null},
    "ready_date":"..."
  },
  "is_dangerous_goods": true/false,
  "is_lcl": true/false,
  "no_specific_cargo": true/false,  // [M6新增] 无具体货量
  "multiple_origins": true/false,
  "sender_ziegler_office": "",  // [M4新增] Ziegler发件人办事处国家
  "confidence": 0.0-1.0,
  "recommendation": "..."
}
```

---

## 已知 Bug 与修复记录

| 编号 | 问题 | 状态 | 修复方式 |
|---|---|---|---|
| B1 | 主正文签名剥离误删引用中的费率，QUOTE_REPLY 回退 | ✅已修复 | 主正文不做签名/引用剥离 |
| B2 | FOLLOW_UP 边界规则恶化准确率 | ✅已回滚 | 回滚 SYSTEM_PROMPT |
| B3 | SYSTEM_PROMPT 边界判定表恶化 | ✅已回滚 | 回滚 SYSTEM_PROMPT |
| B4 | biz_data 在 Ziegler 办事处路由块之后赋值导致 NameError | ✅已修复 | 将 biz_data 赋值移至路由块之前 |
| B5 | VLM 主备切换逻辑：主VLM返回空视为失败再调备用（非货物图片会多一次备用调用） | ✅已修复 | 主VLM返回任何结果（包括空）即停止，只有 Exception 才切备用 |
| B6 | `skip_checker._hit()` 用子串 `in` 匹配 → "annisa.rahmadhani" 邮件误中 "ISA" 被 skip | ✅已修复 | 改用词边界正则 `re.search(r'\bKEY\b', text, re.IGNORECASE)`，standalone word 才命中 |
| B7 | UPECA TSN SEA 路由错误：`_extract_country("GB, LHR Airport...")` 取末段不在 core_countries → non_core → hkg.cyip/hkg.yho | ✅已修复 | `router.py` `get_forward_instruction()` 优先用 `ai_result.get("pod_country")` 再 fallback `_extract_country()` |
| B8 | `email_parser.build_ai_input()` 对正文做了两次相同的 6000 字符截断判断 | ✅已修复 | 删除重复截断分支，保留单次截断逻辑 |
| B9 | `auto_learn.apply_fewshot_to_prompt()` 重复注入 Few-shot 时会产生重复案例和编号断档 | ✅已修复 | 注入前按案例标题去重，注入后自动重排案例编号 |
| B10 | LogiTrack DB 客户端存在硬编码默认凭据与旧表名假设 | ✅已修复 | `logitrack_db_client.py` 改为 env-only，按实表名候选读取 |
| B11 | Graph 发信接口缺失且调用签名不统一（alert/exporter 参数风格不同） | ✅已修复 | `graph_client.send_email()` 统一入口 + 调用方统一 |
| B12 | 项目目录非 Git 仓库，无法追溯变更 | ✅部分修复 | 已 init + commit + remote；push 因网络阻塞待恢复 |
| B13 | 关键凭据在仓库文件中暴露 | ✅仓库侧修复 | 清理明文，新增脱敏配置文档，改 env-only 读取 |
| B14 | `phase5_dryrun_test.py` 输出缓冲导致终端无显示 | ✅已修复 | 移除 TextIOWrapper，改用 `py -u` + `builtins.print(flush=True)` |
| B15 | `_p()` 递归调用自身 | ✅已修复 | 改用 `builtins.print()` 直接调用 |
| B16 | `transport_mode=UNKNOWN` → mapper 抛错导致 MAP_ERR | ✅已修复 | 增加上下文推断回退（HKG/机场→AIR，默认→SEA） |
| B17 | `ZIEGLERGROUP.COM` → AG（无效国家无PIC） | ✅已修复 | 改映射为 OT + 跨国名称回退查找 |
| B18 | `branch=UNKNOWN` 时 polIds 无 fallback | ✅已修复 | 增加 `_infer_branch_from_context()` + China 默认 SHA |
| B19 | 空字符串 partial match 永真 | ✅已修复 | 增加 `if pol_text:` 守卫条件 |


---

## 回归测试基线（2026-04-20）

- **数据集**: 403 条（conversationId 去重，从 209 增长至 403）
- **类型分布**: QUOTE_REPLY(167), FOLLOW_UP(114), BOOKING(80), INQUIRY(31), INFO(10), OTHER(1)
- **样本**: seed=42，31 封
- **INQUIRY 召回率**: **100%（6/6，零漏判）** ← 核心业务目标
- **总体准确率**: 83.9%（26/31 一致）
- **稳定不一致项**（均为非INQUIRY边界，不影响转发逻辑）:
  1. BOOKING→FOLLOW_UP: "MP-2025100659 Honfield HK"
  2. OTHER→INFO: "Enhance Your Range with Quality Bathrobes"
  3. QUOTE_REPLY→FOLLOW_UP: "ZIELHR-1389 New FCL Pricing"
  4. FOLLOW_UP→QUOTE_REPLY: "CN2604172-S VS FOB Shanghai CP3 IMO"
  5. FOLLOW_UP→BOOKING: "CN2602193-S1 Mubea FCL 286/40"

---

## 后续规划（待实现）

- [x] **M6 六条特殊路由规则**（2026-04-29 落地）：DG危险品/混合运输/非中国起运/Tender-Bid/无具体货量/进口中国（详见 2026-04-29 会话）
- [x] **M7 自动填询价单**（2026-05-07~08 落地）：LogiTrack REST API 集成，AI 提取 → payload 映射 → 自动建单（详见下方 M7 章节）
- [✔] **LLM 多模型对比测试**：qwen3.6-plus vs qwen3.5-plus vs gemini-3.1-flash-lite-preview，评估准确率/价格/速度
- [ ] **--forward 真实转发测试**：小范围生产验证（先选非敏感邮件）
- [ ] **测试样本补充（特殊场景定向采样）**：通过 `auto_learn.py` 从 Sea / Air 活跃文件夹深度采样，目标至少补齐 60+ 封 INQUIRY；必要时补充 Inbox 关键字搜索样本
- [ ] **定时轮询循环**：完善 `main.py` 中的 `schedule` 调度逻辑，支持持续运行模式（非单次轮询）
- [x] **Graph 发送邮件能力**（2026-05-06）：`GraphClient.send_email()` 已实现并统一接口（TO/CC/HTML/文本/附件/saveToSent），告警邮件与导出邮件已共用同一入口
- [x] **填单 schema 设计**（2026-05-07）：明确询价单字段映射（`docs/LOGITRACK_INTEGRATION.md`）
- [x] **系统 API 集成**（2026-05-07）：LogiTrack REST API 完成对接，已创建首个自动询价单
- [ ] **Phase 6 定时自动运行**：Windows Task Scheduler 每 15 分钟运行 `main.py`，无人值守
---

## 本会话复核补充（2026-04-22）

### 需求覆盖结论
- ✅ 已覆盖并落地：非Ziegler路由、Ziegler办事处国家路由、多模态图片提取（附件图片）
- ✅ 已覆盖并记录：模型可用性与选型方向（qwen3.6-plus / qwen3.5-plus / gemini-3.1-flash-lite-preview）
- ⚠️ 尚未执行“正式A/B评测”：当前仅完成了模型可用性验证和技术方案，尚未形成统一评测数据表（准确率/速度/成本）

### 2026-04-22 cargo_info schema 重设计
- cargo_info 新字段：`hazardous_info`、`incoterm`、`ready_date`、`gross_weight_kg`、`net_weight_kg`、`containers{20ft/40ft/40hq/45ft}`、`weight_per_ctn_kg`、`volume_cbm`、`quantity`、`uom`
- 废弃旧字段：`volume`（字符串）、`weight`（字符串）
- 新增顶级字段：`pol`、`pod`、`pod_country`（对应系统表单 POL/POD/POD Country 字段）
- VLM EXTRACTION_PROMPT 修复：新增装箱单/发票/BL 正面白名单，避免误判为非货物图片
- 模型对比结论：gemini最快(~6s)适合填单；deepseek最稳定(~11s)适合路由；qwen3.6-plus淘汰

### 2026-04-22 live_test A/B 测试增强
- `--first-only`：按 conversationId 去重，取每个对话链第一封（原始询价）分析
- `--models`：多模型 A/B 对比（deepseek-chat/qwen3.6-plus/qwen3.5-plus/gemini-3.1-flash-lite-preview）
- `--output`：保存 JSON（cargo_info/latency_ms/model_agreement_rate），用于自动填单最佳实践
- 修复 `--folders` help 文案 bug（"Inbox"→"TEST"）
- 典型命令: `python scripts/live_test.py --first-only --count 30 --folders "Sea,Inbox" --models "deepseek-chat,qwen/qwen3.6-plus,qwen/qwen3.5-plus,gemini-3.1-flash-lite-preview" --output data/benchmark.json`

### 已修复问题（原未修复）
- `scripts/live_test.py` CLI 文案与默认值不一致：
  - 代码默认值是 `default="TEST"`
  - help 文案写的是“默认: Inbox”
  - 影响：仅文案误导，不影响功能
  - 状态：✅ 已修复（help 文案已改为 TEST）

### 当前能力边界（已确认）
- 内嵌截图（body inline image）在真实邮件中占比很低；当前方案已可稳定处理“附件形式”的截图提取
- 对于极少数正文内嵌图，若 Graph 未作为 fileAttachment 返回，则无法走当前附件解析链，需要后续补 MIME/HTML 内联资源抓取能力
---

## 会话补充（2026-04-29）

### Bug 修复（本会话落地）

- **B6 ISA 词边界**：`services/skip_checker.py` `_hit()` 从 `keyword in text` 改为 `re.search(r'\bKEY\b', text, re.IGNORECASE)`，修复 annisa 邮件被误 skip
- **B7 UPECA TSN SEA 路由**：`services/router.py` `get_forward_instruction()` 增加 `pod_country` 优先级 fallback，修复 destination 字段解析失败导致路由到 non_core
- **验证**：TEST 文件夹 7/7 封 live_test，B6/B7 均通过验证

### live_test.py + test_tracker.py 增强（本会话落地）

- **TestTracker 写入**：每封邮件分析后自动写入 `data/tested_emails.json`（调用 `_tracker.record_test()`）
- **skip_check 嵌入结果框**：INQUIRY 结果框内末行显示 `│ ✅ skip_check: False` 或 `│ 🚫 skip_check: True [类别] 命中 'xxx'`
- **fewshot_score 打印**：框外打印 `📊 fewshot_score: N [tags] ⭐ 候选`（分数≥48标记候选）
- **候选阈值**：`test_tracker.py` `is_candidate = score >= 48`（原30，改为48）
- **main.py 集成确认**：skip_checker（line 228）和 vision_analyzer（通过 email_parser 延迟初始化）均已在生产流程中

### M6 — 六条特殊路由规则（2026-04-29 落地 ✅）

**通用路由矩阵（特殊规则触发时）**：

| 运输方式 | 收件人 |
|---|---|
| SEA | Curtis(hkg.cyip) + Yvonne(hkg.yho) + Susan Zhang(susan.zhang) |
| AIR 国内（SHA/NGB/SZX/XMN/TAO/TSN/CKG） | Haiqing(shg.hsong) |
| AIR 港/海外（HKG） | Susana(hkg.suwong) |
| RAIL | 正常路由不变 |

**规则列表**：

| 规则 | 触发条件 | 路由 | 建号 |
|---|---|---|---|
| R1 DG危险品 | `is_dangerous_goods=True` | 正常路由不变 | 不建号 |
| R2 混合运输 | `transport_mode` 含 "+" | Curtis+Yvonne | 不建号 |
| R3 非中国起运 | AI新字段 `pol_country` ≠ China/HK | SEA→Curtis+Yvonne；AIR→Susana | 正常建号 |
| R4 Tender/Bid | `risk_level=HIGH` + `risk_flags` 含 tender/bid | 按运输方式走通用矩阵 | 正常建号 |
| R5 无具体货量 | AI新字段 `no_specific_cargo=True` | SEA→Curtis+Yvonne+SZhang；AIR按通用矩阵 | 正常建号 |
| R6 进口中国 | `pod_country` in [China/Hong Kong]（仅SEA+AIR） | 按POD城市推断branch，走该branch CORE PIC | 正常建号 |

**无具体货量 `no_specific_cargo` 判断逻辑（AI 字段）**：
- FCL containers 全 null/0 + 无 gross_weight_kg + 无 volume_cbm
- 同时询 3+ 种柜型价格但无具体货量（如 20GP/40GP/40HQ 无数量）
- 同时询 3+ 个目的港但柜型≤2种且无具体货量
- LCL/AIR：gross_weight_kg 和 volume_cbm 均 null

**优先级（router.py 执行顺序）**：
```
0. R2 混合运输 → Curtis+Yvonne（短路）
1. R6 进口中国 → 重映射 branch（优先于无货量规则）
2. R3 非中国起运 → SEA/AIR 特殊路由（短路）
3. R4 Tender/Bid HIGH → 按运输方式特殊路由（短路）
4. 其他 HIGH → 只发主管（原逻辑）
5. R5 无具体货量 → SEA/AIR 特殊路由（短路）
6. 正常路由流程
```

**改动文件（已落地）**：
- `services/ai_analyzer.py`：新增 `pol_country`（起运地国家）+ `no_specific_cargo`（bool）字段到 SYSTEM_PROMPT + schema；注入 2 个 DG Few-shot 案例
- `data/pic_routing.json`：`special_rules` 新增7条路由条目（mixed_transport / non_china_origin_sea/air / tender_bid_sea/air_domestic/air_overseas / no_cargo_sea）
- `services/router.py`：`get_forward_instruction()` 按6步优先级序列完整重构；新增 `_detect_import_china()` / `_get_tender_bid_instruction()` / `_get_air_special_instruction()` helpers；新增模块常量 `_CHINA_MAINLAND_BRANCHES` / `_IMPORT_POD_BRANCH_MAP`
- `services/skip_checker.py`：新增 `is_dangerous_goods` + `transport_mode` 参数；DG（路由不变，skip=True）、混合运输（skip=True）两类逻辑；新增 `check_skip()` wrapper 兼容 main.py

**Live Test 验证（Test Specific，9封）**：
- DG 危险品 skip ✅：两封 DG 邮件正确触发 `🚫 skip_check: True [危险品]`
- 非中国起运 SEA ✅：Chicago→HKG 路由至 `hkg.cyip + hkg.yho`（non_china_origin_sea）
- Tender/Bid + DG ✅：Shekou→Mauritius DG golf carts（tender 关键词）→ MEDIUM，`tender_bid_sea`（hkg.cyip+hkg.yho+susan.zhang）

### live_test.py --inject 功能（2026-04-29 落地 ✅）

- `--inject` flag：分析完成后自动从 fewshot 候选生成补丁，写入 `data/suggested_fewshot_patch.txt`，注入 ai_analyzer.py SYSTEM_PROMPT
- `--inject-top N`：控制最多注入几个候选（默认1）
- 新增 `_run_inject()` helper + `ai_input` 字段透传
- 历史验证：9封邮件 → 3候选，top2 注入 → 2 个 DG 相关 Few-shot 案例成功注入
- 当前审核补充：`data/suggested_fewshot_patch.txt` 中 score > 40 的候选共有 4 个（75 / 65 / 65 / 55）；人工审核后保留 4 个高分新增案例
- 去重处理：清理 1 个重复度过高的 DG LCL forwarded 变体，当前 `services/ai_analyzer.py` Few-shot 区块保留连续编号 19-22
- 根因修复：`scripts/auto_learn.py` `apply_fewshot_to_prompt()` 已增加按案例标题去重 + 自动重排案例编号，后续重复注入不会再堆叠

### 本轮清理与验证（2026-04-29 晚）

- `services/skip_checker.py` `check_skip()` 包装函数已验证：`analysis` 中的 `pod_country` / `is_dangerous_goods` / `transport_mode` 会正确透传到底层 `check()`
- `services/email_parser.py`：删除 `build_ai_input()` 中重复的正文 6000 字符截断分支
- `.gitignore`：新增 `_reg*.txt`、`_forward_test.txt`、`_regression_output.txt`，避免根目录临时回归文件进入版本控制

---

## 会话补充（2026-05-06）

### 一、LogiTrack DB 直连最终校准（按生产库实表名）

**你确认的 DB 信息（本会话）**：
- 表名（红框即实表名）：`country`、`dict_sales_country`、`dict_sales_office`、`dict_sales_pic`、`port`、`container_types`
- 新只读账号：`logitrack`（来源主机 `192.168.103.16`，权限 `SELECT` + `SHOW VIEW`）

**代码修正（已落地）**：
- `services/logitrack_db_client.py`
  - 删除硬编码默认账号口令（原 `logitrack_user/ldf123`）
  - DB 配置改为仅从环境变量读取（`LOGITRACK_DB_*`）
  - 表名候选优先级与实库一致：`country`/`port`/`container_types` 优先
  - 未配置 DB 环境变量时安全降级（不阻断主流程）
- `tools/query_logitrack_db.py`
  - 删除脚本内硬编码 DB 凭据
  - 改为仅用 `LOGITRACK_DB_*` 环境变量

### 二、凭据清理与轮换加固（本会话要求）

**目标完成情况**：
- ✅ 仓库代码与文档中已移除真实 key/token/password（仅保留环境变量名）
- ✅ 配置仅从环境变量读取（Graph/LLM/VLM/LogiTrack DB）
- ✅ 新增脱敏环境说明：`docs/ENVIRONMENT_SETUP.md`
- ⚠️ “旧凭据已失效” 需在外部系统执行（Azure/LLM供应商/DB），仓库侧无法代替吊销

**本次修改文件**：
- `.env`（已清空真实值，仅保留变量键）
- `.env.example`（新增 `LOGITRACK_DB_*`、`ALERT_ADMIN_EMAIL`）
- `config/settings.py`（新增 DB 环境变量字段）
- `milestone.md` / `README.md` / `docs/AI_QUICK_CONTEXT.md` / `docs/AI_FULL_PROJECT_CONTEXT.md`

### 三、Graph 发信能力补齐并统一接口（本会话要求）

**统一接口已完成**：
- `services/graph_client.py` 新增 `send_email()`：
  - TO、CC
  - HTML 正文 / Text 正文
  - 附件（bytes 或 path）
  - `save_to_sent` 开关
  - 兼容老参数名（`to_emails` / `cc_emails` / `body`）

**调用统一**：
- `services/alert.py` 告警发信改走 `send_email(to=..., body_text=...)`
- `services/logitrack_exporter.py` 导出发信改走 `send_email(to=..., body_html=..., attachments=..., save_to_sent=True)`

**测试验证（已通过）**：
- `tests/test_graph_client_send_email.py`（send_email 载荷结构测试）
- `tests/test_notifications.py`（alert/exporter 共用接口测试）
- 运行结果：`Ran 4 tests ... OK`

### 四、Git 版本控制落地（本会话要求）

**已完成**：
- 本地仓库初始化：`git init -b main`
- 远端绑定：`origin = https://github.com/dornach-Davian-Liang/email-ai-automation.git`
- 首个提交完成：`9e048ea`（Initialize repository and secure configuration）

**未完成项（外部阻塞）**：
- `git push -u origin main` 两次均失败：网络层 `Recv failure: Connection was reset`
- 结论：本地版本管理已建立，远端发布待网络/代理恢复后执行

### 五、本会话新增/修复问题索引

| 编号 | 问题 | 状态 | 修复方式 |
|---|---|---|---|
| B10 | LogiTrack DB 客户端存在硬编码默认凭据与旧表名假设 | ✅已修复 | `logitrack_db_client.py` 改为 env-only，按实表名候选读取 |
| B11 | Graph 发信接口缺失且调用签名不统一（alert/exporter 参数风格不同） | ✅已修复 | `graph_client.send_email()` 统一入口 + 调用方统一 |
| B12 | 项目目录非 Git 仓库，无法追溯变更 | ✅部分修复 | 已 init + commit + remote；push 因网络阻塞待恢复 |
| B13 | 关键凭据在仓库文件中暴露 | ✅仓库侧修复 | 清理明文，新增脱敏配置文档，改 env-only 读取 |

---

## 会话补充（2026-05-07~08）

### M7 — LogiTrack 自动填询价单（2026-05-07~08 落地 ✅）

**目标**: 邮件识别为 INQUIRY 且 SkipChecker 允许建号时，自动调用 LogiTrack REST API 创建询价单。

**实现分阶段进展**:

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1.5 | LogiTrack DB nullable 迁移（salesPicId/polIds/podIds 改可空） | ✅ 已完成 |
| Phase 1.7 | createdBy 过滤器（EnquirySpecification/Service/Controller） | ✅ 已完成 |
| Phase 2 | LogiTrack REST API 客户端 + 字段映射器 + 主数据解析 | ✅ 已完成 |
| Phase 3 | `.env` 配置 + `logitrack_test` 测试数据库建立 | ✅ 已完成 |
| Phase 4 | 前端增强：AI 来源徽标 + "🤖 AI 自动" 筛选按钮 | ✅ 已完成 |
| Phase 5 | 集成测试脚本（offline/online dry-run + --create） | ✅ 已完成 |
| Phase 6 | 定时自动运行（Windows Task Scheduler） | ❌ 待实施 |

**新增/修改文件**:

#### `services/logitrack_client.py`（新建）
- `LogiTrackClient` 类：REST API 封装（create_enquiry, get_ports, get_sales_pics, get_sales_countries, check_duplicate 等）
- `resolve_port(term, port_type, country)`: 精确/模糊匹配港口（alias→portCode→portName→city）
- `resolve_sales_pic(country_code, preferred_name, override_name)`: 按国家+名称查 PIC
- `resolve_sales_country(value, aliases)`: 国家名/代码→销售国家 dict
- `resolve_country_code(value, sales_country=False)`: 名称→ISO2 code

#### `services/logitrack_mapper.py`（新建）
- `LogiTrackSchemaMapper.build_create_payload()`: 完整 payload 构建（30+ 字段映射）
- `_resolve_transport_mode()`: UNKNOWN 推断（SEA/AIR 按上下文）
- `_resolve_sales_country()`: 多级候选（sender_office → domain → branch → global）
- `_resolve_sales_pic()`: 同国家匹配 + 跨国名称回退（AG/OT 泛域名）
- `_resolve_ports()`: POL/POD 解析 + branch default fallback + UNKNOWN 推断
- `_infer_branch_from_context()`: 从 ziegler_office/pol 文本推断 CN branch
- `_resolve_core_non_core()`: 复用路由器 core_countries 判断

#### `services/logitrack_db_client.py`（新建）
- 直连 MySQL 查询主数据（备用方案，env-only 认证）

#### `services/logitrack_exporter.py`（新建）
- 每日查询 `[AUTO-FILL INCOMPLETE]` 记录 → CSV 附件邮件通知

#### `data/logitrack_mapping.json`（新建）
- 字段映射配置：branch→POL 默认值（SEA/AIR 各8个 branch）、sender_domain→salesCountry、port_aliases、country_default_sales_pic 等

#### `scripts/phase5_dryrun_test.py`（新建）
- Phase 5 集成测试工具
- 支持 `--folder`、`--limit`、`--create`、`--online` 参数
- offline 模式使用 `tested_emails.json` 缓存预览
- online 模式通过 Graph API 拉取邮件全文
- 输出详细的字段匹配报告 + JSON 日志

#### LogiTrack 前端修改（`logitrack-pro/`）
- `components/enquiry/EnquiryList.tsx`: 新增 "🤖 AI 自动" 筛选按钮 + createdBy 列紫色徽标
- `services/api.ts`: list() 增加 `createdBy` 过滤参数
- `types.ts`: `EnquirySearchParams` 新增 `createdBy?: string`

#### LogiTrack 后端修改（`backend/`）
- `EnquirySpecification.java`: 增加 `createdBy` 查询条件
- `EnquiryService.java` / `EnquiryController.java`: 透传 `createdBy` 参数
- DB schema: `salesPicId`/`polIds`/`podIds` 改 nullable（支持 INCOMPLETE 建单）

**端到端测试结果（2026-05-07 18:16）**:
```
Test folder: "Test Specific" (5 emails)
- [1] SEA+AIR → SKIP (mixed_transport) ✅
- [2] transport=UNKNOWN → 推断 SEA, payload INCOMPLETE (polIds缺失)
- [3] KDP Tools NGB→SOU → COMPLETE, salesPicId=562(Caron Payne/GB)
- [4] QINGDAO-JAKARTA → SKIP (no_specific_cargo) ✅
- [5] FOB Guangzhou → SKIP (no_specific_cargo) ✅

Summary: mapper_error=0, COMPLETE=1/2 (50%), created=1 (id=19347)
```

**关键设计决策**:
1. 建单失败不阻断转发流程（try-except → logger.warning）
2. INCOMPLETE payload 仍允许建单，remark 中标注 `[AUTO-FILL INCOMPLETE: field1, field2]`
3. `createdBy = "email-ai-bot"` 标识自动建单，前端可按此过滤
4. REST API → 生产库 `logitrack`（非测试库）
5. 跳过建号的邮件类型：DG危险品、混合运输（SEA+AIR 等）

### 本轮 Bug 修复（2026-05-07~08）

| 编号 | 问题 | 状态 | 修复方式 |
|---|---|---|---|
| B14 | `phase5_dryrun_test.py` 输出缓冲：`io.TextIOWrapper` 包裹 stdout 导致 block-buffering，终端无输出 | ✅已修复 | 移除 TextIOWrapper，改用 `py -u` + `builtins.print(flush=True)` |
| B15 | `_p()` 递归调用：print 重定向后 `_p` 调用 `print` 实际调了自己 | ✅已修复 | `_p()` 改用 `builtins.print()` 直接调用 |
| B16 | `transport_mode=UNKNOWN` → mapper 抛 `LogiTrackMappingError` 导致整封邮件 MAP_ERR | ✅已修复 | `_resolve_transport_mode()` 增加上下文推断：HKG/机场→AIR，其他→SEA |
| B17 | `ZIEGLERGROUP.COM` 域名映射 `AG`（无效国家，无 PIC） | ✅已修复 | mapping.json 改为 `OT` + `_resolve_sales_pic()` 增加跨国名称回退查找 |
| B18 | `branch=UNKNOWN` 时 polIds 无 fallback → 全部 polIds=null | ✅已修复 | `_resolve_ports()` 增加 `_infer_branch_from_context()` + China 国家 → SHA 默认 |
| B19 | `_infer_branch_from_context()` 空字符串 `""` partial match 永真 (`"" in city` = True) | ✅已修复 | 增加 `if pol_text:` 守卫条件 |

### 当前自动建单效果指标

| 指标 | 数值 | 说明 |
|------|------|------|
| Mapper Error 率 | 0/5 (0%) | 修复 B16 后 UNKNOWN 不再报错 |
| Payload COMPLETE 率 | 1/2 (50%) | 2封可处理邮件中 1 封完整 |
| Missing 字段 | polIds (1/5=20%) | 仅在 branch=UNKNOWN + pol=空 时缺失 |
| Created 成功率 | 1/1 (100%) | 所有提交的 payload 均成功建单 |
| salesPicId 命中率 | 2/2 (100%) | 跨国名称回退修复后 |

### Graph API 凭据更新确认（2026-05-07）

- 用户提供新 `CLIENT_SECRET`，写入 `.env`
- Token 获取验证通过：HTTP 200，token length=2048
- `list_folders()` + `fetch_emails_by_folder_id()` 均正常工作
- 邮箱文件夹列表正确返回（含 Sea、Air、Test Specific 等）

---

## 会话补充（2026-05-09~13）

### M8 — Reply All 转发（2026-05-09）✅

- LIVE 模式从 `forward_email()` 改为 `reply_all_email()` — 保留原 To/CC，追加路由 PIC
- `graph_client.py` 新增 `reply_all_email()`：`createReplyAll` 草稿 → PATCH extra_to/extra_cc → send
- 支持 TEST_FORWARD / LIVE / DRY_RUN 三态

### M9 — GIF 内联图片货量提取（2026-05-09）✅

- `graph_client.py` 新增 `get_inline_images()`：提取邮件正文 `cid:` 引用的内联图片
- 内联图片 → 下载 → VLM 识别 → `inline_image_texts` 注入 AI 输入
- `main.py` Step 1.5 新增内联图片管线；Step 5.5 VLM 货量回填（`no_specific_cargo` 修正）
- 覆盖约 1/10 邮件场景（含货物信息截图的内联 GIF/PNG）

### M10 — UAT Bug 修复 + AI 字段增强 + 监控面板（2026-05-11）✅

**Bug 修复（B20-B22）**:
- **B20**: `graph_client.py` 移除 `Prefer: outlook.body-content-type="text"` 请求头 → GIF 内联图片 VLM 管线恢复正常
- **B21**: `router.py` `is_core` 默认值 `True` → `False` → 未知目的地正确路由为 NON-CORE
- **B22**: `router.py` R5 AIR + no_cargo 分支改用 `_build_single_instruction()` 修复路由异常

**AI 字段增强（§12.1 六个新字段）**:
- `cargo_info` 新增：`hs_code`、`cargo_ready_date_raw`、`cargo_dimensions`、`special_requirements`
- 顶层新增：`quote_deadline`、`customer_reference`

**routing_reason 字典（§12.2）**:
- `get_forward_instruction()` 返回值新增 `routing_reason`（9 个子字段）
- 记录：CORE/NON-CORE 依据、触发规则编号、branch 解析路径、fallback 情况
- 写入监控面板 MySQL `routing_json` 字段

**LOGITRACK_DRY_RUN 模式**:
- `.env` 新增 `LOGITRACK_DRY_RUN=true` → 打印 payload 但不实际建单（UAT 安全模式）

**Web 监控面板（M33~M38 对应，Spring Boot 侧）**:
- `services/monitor_api.py`（FastAPI :5100）+ `services/monitor_db.py`（MySQL 写入）
- `ProcessManagerService.java` 管理 Python 子进程启/停/状态
- React 前端：`components/settings/monitoring/` — Dashboard/日志/调试/配置四个 Tab

### M11 — TEST_FORWARD UAT 修复 + 邮件格式升级（2026-05-13）✅

**Bug 修复（B23-B27）**:
- **B23**: `ProcessManagerService.java` LIVE 模式参数 `--live` → `--forward`
- **B24**: LIVE 模式 `input()` EOFError → 注入 `LIVE_CONFIRMED=true` 环境变量绕过
- **B25**: UI 删除去重记录内存不刷新 → `TestTracker.reload()` + 每轮 `tracker.reload()`
- **B26**: 多起运地（如 TSN+TAO）各自发邮件 → `_merge_instructions_by_mode()` 按运输方式合并为单邮件
- **B27**: 转发邮件无换行 + 暴露 AI 元数据 → HTML body + 精简 `_build_forward_comment()`

**邮件格式升级**:
- 新增 `_build_greeting_and_comment()`：双模板（有 REF / 无 REF）
- 新增 `_build_ref_subject()`：去多层 Re:/FW: 前缀，添加 `FW: <REF>` 格式
- `forward_email()` / `reply_all_email()` 全面改为 HTML body（`createForward/ReplyAll` → PATCH → send）

---

## 会话补充（2026-05-14~15）

### M12 — 附件转发 + 浙江城市映射修正 + 多票货拆单（2026-05-14~15）✅（当前会话）

**触发案例**: 分析 "EXW CHINE TO CALLAO PORT FCL" 邮件（DB ID=12248）
- 邮件有两个起运地：青岛 + 浙江省丽水
- 丽水不在城市映射表 → 回退到 TAO → NGB PIC 漏发
- PDF 附件含货物/发货地信息未随邮件转发
- 同一对话链后续新询价因 conversationId 去重被跳过

**Bug 修复（B28-B32）**:

| 编号 | 问题 | 根因 | 修复 |
|---|---|---|---|
| B28 | 杭州（Hangzhou）路由到 NGB 而非 SHA | `_city_to_branch("hangzhou")="NGB"` 错误 | `router.py` 改为 SHA；`ai_analyzer.py` Prompt 同步更新 |
| B29 | 转发/Reply All 邮件不携带原始附件 | `forward_email/reply_all_email` 无附件上传逻辑 | `graph_client.py` 新增 `_add_file_attachments_to_draft()`，两个转发函数新增 `attachments` 参数 |
| B30 | CALLAO 丽水案例 NGB PIC 漏发 | `_city_to_branch("lishui")=None` → fallback 到 TAO → merge 后只有 TAO | `router.py` + `main.py` Step 5.7 + `ai_analyzer.py` 补充浙江城市映射（lishui/taizhou/jinhua/quzhou→NGB；jiaxing/huzhou→SHA；zhoushan→NGB）|
| B31 | 对话链中新回复邮件被去重跳过 | `is_tested(conversationId)` 同链所有邮件共享 ID | `main.py` 去重 key 改为 `message_id`（每封独立） |
| B32 | 多票货（青岛+丽水）只建 1 个询价单 | 无多票拆分架构 | `main.py` Step 8.5 新增多票拆单逻辑（方案 B3） |

**功能实现**:

#### 1. 附件随转发邮件（B29）

`services/graph_client.py`:
```python
def _add_file_attachments_to_draft(self, draft_id: str, attachments: list[str]):
    """将本地文件作为附件上传到草稿邮件（≤3MB 直接上传，超限 warning 跳过）"""

def forward_email(..., attachments: list[str] = None): ...
def reply_all_email(..., attachments: list[str] = None): ...
```

`main.py`:
- Step 1 下载附件后记录路径列表 `attachments`
- Step 10 调用转发时传入 `attachments=attachments`

#### 2. 浙江城市映射修正（B28 + B30）

`services/router.py` `_city_to_branch()` 更新后映射（关键变化）：
```python
"hangzhou": "SHA",  # 修正（原 NGB→SHA，杭州属浙北/沪杭甬）
"jiaxing": "SHA", "huzhou": "SHA",     # 浙北：嘉兴/湖州→SHA
"lishui": "NGB", "taizhou": "NGB",     # 浙南：丽水/台州→NGB
"jinhua": "NGB", "quzhou": "NGB",      # 浙中：金华/衢州→NGB
"zhoushan": "NGB",                      # 舟山港→NGB
```

同步更新位置：`router.py`（3处城市映射）、`main.py` Step 5.7（附件城市推断）、`ai_analyzer.py` SYSTEM_PROMPT Branch 映射表。

#### 3. 去重 key 改为 message_id（B31）

`main.py` Step 0b:
```python
# BEFORE: if conv_id_check and tracker.is_tested(conv_id_check):
# AFTER:
if message_id and tracker.is_tested(message_id):
    logger.info("  ⏭️  此邮件已处理过，跳过 (message_id)")
```
同时两处 `tracker.record_test(conversation_id=message_id, ...)` 均已更新。

#### 4. 多票货 B3 拆单架构（B32）

`services/ai_analyzer.py` 新增 schema 字段：
```json
"shipments": null  // 多票时为数组：[{origin_city, branch_code, commodity, containers, ...}, ...]
```

`main.py` Step 8.5（新增）:
```python
shipments = analysis.get("shipments")
shipment_tasks = []
if shipments and len(shipments) >= 2:
    for ship in shipments:
        sub = copy.deepcopy(analysis)
        sub["origin_city"] = ship.get("origin_city")
        sub["branch_code"] = ship.get("branch_code")
        sub["multiple_origins"] = False
        sub["shipments"] = None
        sub_instructions = router.get_forward_instruction(sub, ...)
        shipment_tasks.append((sub, sub_instructions, sub_plan))
else:
    shipment_tasks.append((analysis, instructions, forward_plan))
```

`main.py` Step 9-10（重构为循环）:
- 遍历 `shipment_tasks`，每票独立：LogiTrack 建单（独立 REF）→ 独立转发邮件
- 多票时打印 `📦 票 [1/2]`, `📦 票 [2/2]`
- `_mon` 字典仅由第一票（`_task_idx==0`）更新，避免重复写入监控

**验证结果**:
```
_test_callao_routing.py:
  Branch=TAO+NGB, TO 包含 tao.hhao + ngb.vli ✅

_test_multi_shipment.py:
  📦 多票货拆单: 2 票
  票 [1/2]: Origin=Qingdao, Branch=TAO → TO=[tao.hhao, tao.nyuan]
  票 [2/2]: Origin=Lishui, Branch=NGB → TO=[ngb.vli]
  ✅ 总计 2 票
```

**改动文件**:

| 文件 | 改动说明 |
|------|----------|
| `services/router.py` | `_city_to_branch()` 杭州/浙江城市映射修正；`rizhao/weihai/linyi→TAO`（M11）；`xingang→TSN`（M11）|
| `services/graph_client.py` | `_add_file_attachments_to_draft()`；`forward_email/reply_all_email` 附件参数 |
| `services/ai_analyzer.py` | Branch 映射表（SHA/NGB 地理修正）；`shipments` schema 字段 + 多票拆分规则 |
| `main.py` | Step 5.7 附件城市推断；Step 0b 去重改 message_id；Step 8.5 多票拆单；Step 9-10 循环重构；record_test 改 message_id |

**设计讨论结论**:
- **城市映射补全**: 不补全全国 300+ 城市，按物流高频场景逐步补充
- **多票方案 B3 vs B1**: 维持 B3（向后兼容 + AI 低错误率），B1（全量重构）成本收益不划算

### M13 — 已建号主题 FOLLOW_UP 边界修正 + Few-shot 外部化状态同步（2026-05-19）✅

**触发案例**: Sea-Completed 两个真实案例
- Case 1: `Re: <CN2605138-S> Mubea FCL 40ft Quote request`
- Case 2: `20'GP Shenzhen to Riyadh`

**核心结论**:
- Subject **含内部建号**（如 `<CN2605138-S>`）时，应优先判定为已建号询价线程；即使正文出现 `pls quote` / `kindly quote`，本质仍是 `FOLLOW_UP`
- Subject **不含内部建号** 时，即使正文提及旧单号，只要当前邮件提出新的箱型/独立报价需求，仍应保留为新 `INQUIRY`

**本次修正**:
- `services/ai_analyzer.py`
  - 在 `FOLLOW_UP` 定义中新增高优先级规则：Subject 含 `<CN...-S>` / `<CN...-A>` / `<CN...-AS>` 时强制按已建号跟进处理
  - 在“多轮对话处理指引”中新增 `重要B（已建号判 FOLLOW_UP）`
- `data/base_fewshot.json`
  - 新增 **案例23**：已建号追价请求 → `FOLLOW_UP`
  - 新增 **案例24**：同代理但新箱型/新需求 → `INQUIRY`
  - 保留 **案例25**：内部同事把 chinapricing 拉入外部询价循环时，需从引用邮件抽取原始询价

**状态同步**:
- Few-shot 已不再是硬编码固定文本，当前已采用：
  - `data/base_fewshot.json` 基础案例
  - `data/training_fewshot.json` 纠错案例
  - `services/ai_analyzer.py` `_build_prompt()` 动态合并加载
- `services/monitor_api.py` 已提供训练相关接口：
  - `/pyapi/training/cases`
  - `/pyapi/training/fewshot-stats`
  - `/pyapi/training/preview-prompt`
  - `/pyapi/training/simulate`
  - `/pyapi/training/regression`

**验证结果**:
- Case 1 定向验证通过：`email_type=FOLLOW_UP`、`is_inquiry=false`
- 已建号追价场景不再进入新询价建号路径，降低重复建号/重复转发风险

