# Session Handoff

## 2026-05-27 conversation_id 去重修复 + 60天窗口新建号规则

### 本次做了什么

**问题 2 修复：CN2605292-S 重复建号根因**
- 原因：内部员工（Nicy Yang `ngb.nyang@zieglergroup.cn`）对外部客户询价邮件做 Reply-All 时，由于 `sender_email` 不同，原有业务去重（`query_recent_business_ref_candidates` 按 sender 过滤）无法关联到 CN2605289-S，从而重复建号
- 另外，`_conv_ref_cache` 仅在内存中存在于同一批次，跨轮次完全失效

**问题 3 修复：同 conversation_id 下 60 天窗口新建号规则**
- 在 Step 9a 原有内存缓存之后，增加 DB 层级的 `conversation_id` 查询
- 查到同 conversation_id 历史建号记录后，按 `processed_at` 与当前时间的差值判断：
  - 距今 < 60 天 → 复用已有 REF，不重复建号
  - 距今 ≥ 60 天 → 判定为过期，允许新建号
- 60 天阈值通过 `CONVERSATION_REF_REUSE_DAYS` 环境变量可配置

### 修改了哪些文件

| 文件 | 修改说明 |
|------|----------|
| `email-ai-automation/config/settings.py` | 新增 `conversation_ref_reuse_days: int = 60` 配置项，支持 `CONVERSATION_REF_REUSE_DAYS` 环境变量覆盖 |
| `email-ai-automation/services/monitor_db.py` | `query_existing_ref_by_conversation()` 返回值新增 `processed_at_dt`（原始 datetime 对象），供 60 天窗口比较；`created_at` 字符串字段保留向后兼容 |
| `email-ai-automation/main.py` | 导入 `query_existing_ref_by_conversation`；Step 9a 在内存缓存后增加 DB 层级查询 + 60 天窗口判断逻辑 |
| `email-ai-automation/tests/test_conversation_dedup.py` | 新增 7 个单元测试，覆盖：DB 返回值结构、无记录时返回 None、60 天边界（59/60天）、配置默认值 |

### 验证了什么

- `py -X utf8 -c "import ast; ast.parse(open('main.py',...)); ..."` — `main.py` / `monitor_db.py` / `settings.py` 全部语法检查通过
- `py -X utf8 -m unittest tests.test_business_dedup -v` — 原有 6 个业务去重测试全部通过（无回归）
- `py -X utf8 -m unittest tests.test_conversation_dedup -v` — 新增 7 个测试全部通过
- 验证 import AST：`from services.monitor_db import [..., 'query_existing_ref_by_conversation']` 存在于 line 27
- 验证 `settings.conversation_ref_reuse_days = 60` 运行时正确加载

### 下次应继续什么

1. **LIVE 验证**：在 LIVE/TEST_FORWARD 模式下跑一轮真实邮件，观察 Step 9a 日志是否出现 `"同对话链已建号 %s（DB，距今%d天 < %d天窗口），复用REF"` 字样
2. **CN2605292-S 数据清理**：手动核查 LogiTrack 中是否需要将 CN2605292-S 合并/关闭
3. **监控面板**：在监控日志的 `routing_json` 字段中，确认 `business_dedup` 记录的 `action` 不再为 `NEW_REF` 当同 conversation 再次出现时
4. **AI 分类优化（中优先级）**：Nicy Yang "Add Timothy to follow" 类型的内部协调邮件应被 AI 正确分类为 `is_inquiry: false`，但此修复已作为保底防线

### 风险提示

- 同 conversation_id 内若确有全新业务询价（不同目的地/货物），60 天内仍会复用旧 REF；通常此类情况会开新邮件线程，实际风险低
- `query_existing_ref_by_conversation()` 每封 inquiry 邮件增加一次 DB 查询（单行索引查询），性能影响可忽略
- 此修改仅影响 Email AI 项目；不涉及 LogiTrack Pro 后端/前端，也不修改任何 API 契约或数据库 schema

---

## 2026-05-27 Reply-All recipient cleanup

### What was done

- Implemented a Reply-All recipient cleanup policy in Email AI Automation to keep the original requester, current routed PIC recipients, TAO manager CC, and Glen, while removing unrelated internal Ziegler recipients carried over from the source email.
- Wired the cleanup into `GraphClient.reply_all_email()` and passed `original_sender` from `main.py` during LIVE reply-all forwarding.
- Added focused tests for both the pure recipient policy and the Graph PATCH payload built by `reply_all_email()`.

### Modified files

- `C:\Users\Administrator\Desktop\email-ai-automation\services\recipient_policy.py`
- `C:\Users\Administrator\Desktop\email-ai-automation\services\graph_client.py`
- `C:\Users\Administrator\Desktop\email-ai-automation\main.py`
- `C:\Users\Administrator\Desktop\email-ai-automation\tests\test_reply_all_recipient_policy.py`
- `C:\Users\Administrator\Desktop\email-ai-automation\tests\test_graph_client_send_email.py`

### Validation

- `py -c "import ast, pathlib; ..."` -> OK for updated files
- `py -m unittest tests.test_reply_all_recipient_policy -v` -> 2 tests passed
- `py -m unittest tests.test_graph_client_send_email -v` -> 3 tests passed
- `py -m unittest tests.test_forwarding_guard -v` -> 2 tests passed
- Controlled UAT against real mailbox folder `Sea` with subject `Rate 1x40'HC EXW Shandong - Rotterdam / BD`:
  - AI analysis -> `INQUIRY`, `SEA`, `TAO`, destination `Rotterdam, Netherlands`
  - Final sanitized TO -> `sales.ocean.nl@zieglergroup.com`, `tao.hhao@zieglergroup.cn`, `tao.nyuan@zieglergroup.cn`
  - Final sanitized CC -> `hkg.cyip@zieglergroup.cn`, `hkg.yho@zieglergroup.cn`, `susan.zhang@zieglergroup.cn`
  - Removed unrelated internal recipients -> `shg.txu@zieglergroup.cn`, `ngb.lshen@zieglergroup.cn`, `ngb.vli@zieglergroup.cn`
- `py -m pytest ...` could not run because `pytest` is not installed in the current Python 3.14 environment

### Remaining / follow-up

- UAT the real Qingdao / TAO LIVE reply-all flow against a mailbox sample to confirm the Graph draft keeps `sales.ocean.nl@zieglergroup.com`, Hetty, Nicole, and TAO manager CC while dropping Timothy / Lucia / Vivian.
- If business later wants to remove TAO manager CC as well, that is a separate routing-config change in `data/pic_routing.json` and should be handled independently from this cleanup layer.

### Risk notes

- The cleanup runs only on LIVE `reply_all_email()`; `TEST_FORWARD` still uses `forward_email()`, so mailbox behavior must be validated with either mocks or controlled UAT.
- Internal-domain preservation currently keys off `zieglergroup.cn` / `zieglergroup.com`, with `glen.boyce@zieglergroup.cn` hard-kept as a business exception.

> 每次新 Chat / Codex 接手项目时的上下文传递。  
> 最后更新: 2026-05-27

---

## 本次已完成内容（2026-05-27）

### Problem 2：质检漏记 6 条修复

**根因**：Python `_write_mon` 失败静默，6条 enquiry 建单成功但无 `email_processing_log` 记录，旧代码通过 `email_processing_log` join 查询只能找到 53 条。

**修复方案**：直接查 `enquiry` 表 `created_by='email-ai-bot'`，再反查 log，null-safe 处理孤立记录。

**修改文件**：
- `backend/.../repository/EnquiryRepository.java`：新增 `findByCreatedBySince()` + `LocalDateTime` import
- `backend/.../repository/EmailProcessingLogRepository.java`：新增 `findByLogitrackIdIn()`
- `backend/.../service/DataQualityCheckService.java`：`runCheck()` 完全重写，直接查 enquiry 表

### Problem 1：Settings 页面英文 i18n

**完成范围**：Settings 页面全部组件（User Management、Audit Log、Email Monitoring 7个子标签页）全部接入 i18n。

**translations.ts 新增**：
- `settings.*`（userManagement 全部字段）
- `monitoring.*`（tabs/service/overview/logs/debug/config/training/quality）
- `monitoring.logs.colTime/justNow/minutesAgo/hoursAgo/daysAgo`（后加）
- `monitoring.config.tabRouting/tabApi/tabRules`（后加）

**修改的前端文件**（全部完成）：
- `i18n/translations.ts`
- `components/settings/SettingsLayout.tsx`
- `components/settings/monitoring/MonitoringDashboard.tsx`
- `components/settings/UserManagement.tsx`
- `components/settings/monitoring/tabs/ServiceControl.tsx`
- `components/settings/monitoring/tabs/StatusOverview.tsx`
- `components/settings/monitoring/tabs/ProcessingLogs.tsx`
- `components/settings/monitoring/tabs/DebugControl.tsx`
- `components/settings/monitoring/tabs/ConfigViewer.tsx`
- `components/settings/monitoring/tabs/AITraining.tsx`
- `components/settings/monitoring/tabs/DataQualityCheck.tsx`

**验证结果**：
- `npm run typecheck` ✅ 零错误
- `npm run build` ✅ 成功（53.74s，chunk size warning 为预存在问题）
- `mvn compile` ✅ 零错误

---

## 遗留注意事项

- ConfigViewer 中 `SKIP_CATEGORY_LABELS`/`SKIP_FIELD_LABELS` 为双语设计（中英文混合），未翻译，属于业务数据标签而非 UI 文本
- DataQualityCheck 中的数据库字段标签（`FIELD_LABELS`）保持英文，与后端一致
- 质检服务重启后才会用新的 59 条查询逻辑（DataQualityCheckService 已编译进 target/classes）

---



### LogiTrack：用户归属办公室权限 + Enquiry Product Type 多选筛选

#### 功能说明
1. **用户绑定 Assigned CN Office（多选）**：创建/编辑用户时必须选择归属办公室，支持多选
2. **行级数据权限**：非 Admin 用户只能看到自己归属办公室的 Enquiry 数据（列表 + 导出均生效）
3. **管理员可编辑用户 Assigned CN Office**：编辑弹窗新增多选下拉，仅 Admin 可访问
4. **现有用户全量迁移**：所有现有用户已自动分配全部 8 个 CN Office（后续管理员手动分配）
5. **Enquiry 列表 Product Type 多选筛选**：第一行筛选区域新增"All Product Types"多选下拉

#### 修改了哪些文件

**数据库**：
- 新建 `user_cn_office` 表（user_id + cn_office_code 联合主键，外键约束）
- 插入默认 CN Office 数据（8条：SHANGHAI/SHENZHEN/NINGBO/HONG KONG/TIANJIN/QINGDAO/XIAMEN/CN-MULTI）
- 为所有现有用户插入全量办公室记录（11用户 × 8办公室 = 88条）

**后端 Java**：
- `entity/User.java`：新增 `@ManyToMany cnOffices` 关联 + `getCnOfficeCodes()` 便捷方法
- `dto/UserDTO.java`：新增 `cnOfficeCodes` 字段
- `dto/LoginResponseDTO.java`：新增 `cnOffices` 字段
- `service/UserService.java`：注入 `CnOfficeRepository`；`createUser()` 增加 `cnOfficeCodes` 参数（必填校验）；`updateUser()` 增加 `cnOfficeCodes/updateCnOffices` 参数；新增 `getUserAllowedOffices()` 方法；`convertToDTO()` 回填 `cnOfficeCodes`
- `service/AuthService.java`：`login()` 返回 `cnOffices` 字段
- `controller/UserController.java`：`createUser` / `updateUser` 解析并传递 `cnOfficeCodes`
- `controller/EnquiryController.java`：注入 `AuthService` + `UserService`；新增 `resolveOfficeFilter()` 方法；`GET /api/enquiries` 和 `export-xlsx` 注入行级权限过滤
- `specification/EnquirySpecification.java`：`productCode` 改为支持逗号分隔多值；`assignedCnOffice` 增加 `__NONE__` 哨兵处理

**前端 React**：
- `services/settingsApi.ts`：`UserItem` 新增 `cnOfficeCodes` 字段
- `components/settings/UserManagement.tsx`：
  - 引入 `masterDataApi`；新增 `cnOfficeOptions` 状态和 `showOfficeDropdown` 状态
  - `DEFAULT_FORM` 新增 `cnOfficeCodes: []`
  - 创建/编辑弹窗新增"归属办公室"多选下拉（必填，带红星提示）
  - 用户列表表头新增"归属办公室"列，显示已绑定办公室
- `services/api.ts`：`enquiryApi.list()` 新增 `productCode` 参数支持（多值数组）
- `types.ts`：`EnquirySearchParams.productCode` 改为 `ProductCode | string` 支持逗号拼接
- `components/enquiry/EnquiryList.tsx`：
  - 新增 `productTypeFilter` state 和 `productOptions` state
  - 新增 `productRef` + `showProductDropdown` 下拉控制
  - `useEffect` 加载 `masterDataApi.getProducts()`
  - 外部点击关闭逻辑覆盖 product 下拉
  - `fetchEnquiries` 传递 `productCode`
  - `handleExportXlsx` 传递 `productCode`
  - 筛选区第一行从 4 列改为 5 列，Status 后插入"All Product Types"多选下拉

#### 验证了什么
- `mvn compile -q` → 无错误
- `mvn package -DskipTests -q` → 打包成功
- `npm run typecheck` → TypeScript 无错误
- `npm run build` → 构建成功（built in 37.24s）
- 新 Spring Boot JAR（PID 35204）已启动，8080 端口正常监听
- 数据库：`user_cn_office` 88条记录，`dict_cn_office` 8条记录

#### 下次应继续什么
1. 硬刷新浏览器，用 admin 登录验证：
   - 系统设置 → 用户管理：表格新增"归属办公室"列，编辑用户弹窗有多选下拉
   - Enquiry 列表筛选区第一行出现"All Product Types"下拉
2. 手动为每个用户分配实际归属的 CN Office（通过编辑用户弹窗）
3. 用非 Admin 账号登录，验证只能看到自己归属办公室的询价数据

#### 风险提示
- 行级权限依赖 JWT token 中的 userId，若无 token（匿名请求），不做限制（现有行为不变）
- `__NONE__` 哨兵值：若非 Admin 用户没有绑定任何办公室，Enquiry 列表将返回空
- 现有用户已全选 8 个办公室，在管理员手动分配前不影响数据可见性

---

## 本次已完成内容（2026-05-26 第二轮）

### Email AI：business_dedup 两轮匹配修复（宽松补件识别）

#### 问题根因
Ashley Harris 真实样本 no-send replay 验证时，第二封邮件返回 `NEW_REF` 而非 `REUSE_REF_FORWARD_SUPPLEMENT`。

根本原因：`_same_business_core()` 对 `destination_key` 做严格等值比较。
- Email 1（无附件）：AI 把主题里的 EXW 取货城市 "Shenzhen" 错误识别为目的地 → `SHENZHENPORTCHINA`
- Email 2（带装箱单 Excel）：AI 正确识别目的地 UK → `UKRUNCORN`
- 两者 destination_key 不一致 → 严格匹配失败 → `NEW_REF`

#### 修改方案（分级匹配策略）
`SUPPRESS`（彻底忽略邮件）风险高，必须严格匹配；`FORWARD_SUPPLEMENT`（复用 REF + 照常转发）风险低，可宽松匹配。

**第一轮（严格）**：subject + sender + transport + origin + destination + cargo。命中 → 可触发 SUPPLEMENT 或 SUPPRESS。

**第二轮（宽松，仅在第一轮无命中时运行）**：不比较 destination_key（subject + sender + transport + origin + cargo）。命中 → **只能**触发 SUPPLEMENT，且要求 `current.meaningful_count > 0` 作为额外门控。

#### 修改了哪些文件
- `email-ai-automation/services/business_dedup.py`：
  - `_same_business_core()` 注释明确"适用于 SUPPRESS，需保守"
  - 新增 `_same_business_core_loose()`：不检查 destination_key
  - `decide_duplicate_action()` 改为两轮匹配，第一轮结果包含 `match_pass: 'strict'`，第二轮包含 `match_pass: 'loose'` 和 `dest_mismatch` 诊断字段
- `email-ai-automation/tests/test_business_dedup.py`：
  - 扩充 `test_new_ref_when_business_core_differs` docstring
  - 新增 `test_loose_match_supplement_when_dest_differs_but_has_new_attachment`（Ashley Harris pattern）
  - 新增 `test_no_loose_match_when_origin_differs`（宽松匹配仍检查 origin）

#### 验证了什么
- 语法检查 `business_dedup.py` → OK
- `python -m unittest tests.test_business_dedup -v` → 6 tests, OK
- Ashley Harris no-send replay（从 DB + temp_attachments 本地缓存构建上下文）：
  - 修复前：`{"action":"NEW_REF","rule":"no_business_duplicate_match"}`
  - 修复后：`{"action":"REUSE_REF_FORWARD_SUPPLEMENT","rule":"loose_match_attachment_supplement","matched_ref":"CN2605263-S","match_pass":"loose"}`

#### live TEST_FORWARD 核查结果（2026-05-26 第三轮）
- 脚本：`email-ai-automation/_test_ashley_e2e.py`（DB 模式 + local temp_attachments 缓存）
- no-send 跑通：action=REUSE_REF_FORWARD_SUPPLEMENT, rule=loose_match_attachment_supplement, match_pass=loose, matched_ref=CN2605263-S, dest_mismatch={candidate:SHENZHENPORTCHINA, current:UKRUNCORN}, added_meaningful=1
- TEST_FORWARD 跑通：向 davian.liang@zieglergroup.cn 发出邮件，主题 `[TEST-E2E] FW: <CN2605263-S> LCL EXW Door to Shenzhen rate request`，携带 `副本PL20260520 装箱单.xlsx`（13404 bytes）
- 坑：DB 中同一 message_id 存在两条记录（历史测试写入），须 `ORDER BY processed_at DESC LIMIT 1` 取最新

#### 下次应继续什么
1. 监控 `routing_json.business_dedup.match_pass` 字段，若生产上频繁出现 `loose` 命中，评估是否需要缩小宽松匹配的时间窗口（当前 40 分钟）
2. 若后续出现"同主题同发件人不同货物"被错误 loose-merge 的案例，可以考虑在宽松匹配中加入 cargo_signature 的 commodity / containers 检查
3. `_test_ashley_e2e.py` 已验证完毕，可根据需要保留或删除

#### 风险提示
- 宽松匹配仍然转发（SUPPLEMENT），不会漏单；最坏情况是两条不同询盘被合并到同一 REF，业务人员可人工区分
- SUPPRESS 路径依然使用严格匹配，不受此次修改影响
- `dest_mismatch` 字段记录了宽松命中时的目的地差异，方便后续审计



---

## 本次已完成内容（2026-05-26）

### LogiTrack：Enquiry XLSX 导出 Sales Country 改为显示完整名称

#### 本次做了什么
- `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java`：导出 XLSX 时不再直接写 `salesCountryCode`，改为从 `dict_sales_country` 读取显示名；例如 `CN` 导出为 `CHINA`
- 停止旧的 Spring Boot JAR 进程，重新执行 `mvn package -DskipTests` 并重启 `target/logitrack-backend-1.0.0.jar`，确保运行中的导出接口加载新逻辑

#### 修改了哪些文件
- `backend/src/main/java/com/logitrack/backend/service/EnquiryService.java`
- `backend/target/logitrack-backend-1.0.0.jar`（重新打包并重启运行）

#### 验证了什么
- `cd C:\logitrack\LogiTrack--update-status-report-20260126023903\backend && mvn compile -q` 通过
- `cd C:\logitrack\LogiTrack--update-status-report-20260126023903\backend && mvn package -DskipTests -q` 通过
- 直接请求 `GET /api/enquiries/export-xlsx`，解析返回的 XLSX 可见 `Sales Country` 列样例值已变为 `CHINA`、`UK`、`SOUTH AFRICA`、`AGENTS`

#### 下次应继续什么
1. 若用户还要统一其它导出字典列（如 Office / PIC / Category）显示格式，可沿用当前“代码值 -> 字典显示名”的导出映射方式逐列处理
2. 若后端再次修改导出逻辑，记得继续按当前部署方式重打 JAR 并重启；仅 `mvn compile` 不会更新线上 8080 进程

#### 风险提示
- 当前映射依赖 `dict_sales_country` 活跃字典；若个别历史 code 已停用或缺失，导出仍会回退显示原始 code，避免空白

### Email AI：业务级重复询价判重落地（跨 conversation 复用 REF）

#### 本次做了什么
- `email-ai-automation/services/business_dedup.py`：新增业务级判重模块，封装主题归一化、地点/货量签名、业务附件识别、候选提取与动作决策
- `email-ai-automation/services/monitor_db.py`：新增 `query_recent_business_ref_candidates()`，从 `email_processing_log` 查询最近成功建号记录，并解析历史 `ai_analysis_json` / `routing_json` / `forward_to` / `forward_cc`
- `email-ai-automation/main.py`：
  - 在 Step 9 建单前接入业务级判重，仅对单票、未 skip、开启 LogiTrack 时生效
  - 命中 `REUSE_REF_FORWARD_SUPPLEMENT` 时复用已有 REF，并优先沿用首次建号的 PIC 收件人
  - 命中 `REUSE_REF_SUPPRESS` 时跳过建号和转发，仅记监控并标记已读
  - 同步把 `business_dedup_context` / `business_dedup` 写入监控 JSON，便于后续排查
  - 补回并重新接入 `_should_skip_redundant_forward()`，避免回退此前“同线程重复转发抑制”修复
- `email-ai-automation/tests/test_business_dedup.py`：新增规则单测，覆盖 CN 前缀归一化、补件复用、纯重复抑制、核心业务差异新建 REF

#### 修改了哪些文件
- `email-ai-automation/main.py`
- `email-ai-automation/services/business_dedup.py`
- `email-ai-automation/services/monitor_db.py`
- `email-ai-automation/tests/test_business_dedup.py`

#### 验证了什么
- `cd C:\Users\Administrator\Desktop\email-ai-automation && py -m unittest tests.test_business_dedup tests.test_forwarding_guard tests.test_tracker_and_attachments` 通过（8 tests, OK）
- `cd C:\Users\Administrator\Desktop\email-ai-automation && py -c "import ast, pathlib; files=['main.py','services/business_dedup.py','services/monitor_db.py','tests/test_business_dedup.py']; [ast.parse(pathlib.Path(f).read_text(encoding='utf-8')) for f in files]; print('OK')"` 通过
- VS Code `get_errors`：`main.py` / `services/business_dedup.py` / `services/monitor_db.py` / `tests/test_business_dedup.py` 均无错误

#### 下次应继续什么
1. 用 Ashley Harris 那两封真实样本做一次 TEST_FORWARD / no-send 现场核查，确认第二封命中 `REUSE_REF_FORWARD_SUPPLEMENT` 而不再新建 REF
2. 在监控日志中核对 `routing_json.business_dedup` 和 `routing_json.business_dedup_context` 是否按预期落库
3. 若后续出现“同业务不同发件箱”场景，再评估是否引入更强的业务主键或扩大发件人归并规则

#### 风险提示
- 当前判重窗口固定为 40 分钟，候选回看 6 小时；这是保守上线值，后续需要结合真实邮件再校准
- 当前仅对单票流程启用；多票拆单仍保持原逻辑，避免高风险边界联动
- 当前依赖历史成功建号记录中的 sender/subject/业务上下文；若历史脏数据较多，可能影响命中率但不会阻断新建 REF

---

## 上一次任务

实现 INQUIRY / CREATE_REF 独立模式控制；修复 CREATE_REF 监控写回和日志 bug。

---

## 本次已完成内容（2026-05-25）

### 1. CREATE_REF 独立模式控制（全栈实现，全部验证通过）

#### Python 层
- `config/settings.py`：新增 `create_ref_mode: str = os.getenv("CREATE_REF_MODE", "DRY_RUN")`
- `main.py`：
  - 新增全局变量 `CREATE_REF_MODE: str = "DRY_RUN"`
  - `main()` 中从 settings 初始化，并在启动后调用 `update_state(run_mode=RUN_MODE, create_ref_mode=CREATE_REF_MODE)` 同步状态
  - Step 6a 改用 `_cr_dry_run = DRY_RUN or (CREATE_REF_MODE == "DRY_RUN")`、`_cr_test_fwd = ... or CREATE_REF_MODE == "TEST_FORWARD"`
  - **修复**：监控写回 `_mon["logitrack_created"]`、`_mon["logitrack_ref"]`、`_mon["logitrack_error"]`
  - **修复**：日志 key `ref_result.get("refs")` → `ref_result.get("ref_numbers")`
- `services/monitor_api.py`：
  - `_state` 新增 `"create_ref_mode": "DRY_RUN"` 字段
  - 新增 `POST /pyapi/control/create-ref-mode` 运行时切换端点
- `.env`：新增 `CREATE_REF_MODE=DRY_RUN`

#### Java 层
- `ProcessManagerService.java`：`StartRequestDTO` 新增 `String createRefMode` 字段；`startProcess()` 中透传 `CREATE_REF_MODE` 环境变量

#### React 层
- `services/monitorApi.ts`：`PyApiStatus` 新增 `create_ref_mode?: string`；新增 `setCreateRefMode(mode)` 方法；`StartRequestDTO` 新增 `createRefMode?`
- `components/settings/monitoring/tabs/ServiceControl.tsx`：
  - `LaunchConfig` 新增 CREATE_REF 建号模式（仅记录/测试建号/实际建号）三按钮选择
  - `RuntimeControl` 新增 CREATE_REF 建号模式运行时切换（即时生效无需重启）
  - 主组件新增 `createRefMode` state；`refreshStatus` 同步 `py.create_ref_mode`；`executeStart` 传入 `createRefMode`

### 2. 当前运行状态（2026-05-25 16:42 重启）
- Python 服务：PID 27952，LIVE 模式，`create_ref_mode=LIVE`（已通过运行时 API 设置）
- Spring Boot：JAR 正在运行，无法就地重建（JAR 文件锁定）
- 前端：已重新构建（`npm run build` 成功）

### 3. 本次 chat 收尾补充（2026-05-25 18:05）

#### 本次做了什么
- 确认用户遇到的根因不是 Python 逻辑，而是 Spring Boot 运行中的 JAR 仍是旧版，启动时没有透传 `createRefMode`
- 停止 Python 与 Spring Boot 进程，重建后端 JAR，让 `POST /api/monitor/process/start` 的 `createRefMode` 正式进入 `StartRequestDTO`
- 回改前端 `ServiceControl.tsx`：移除 8 秒 `setTimeout` 临时注入方案，恢复在 `processApi.start()` 中正式传 `createRefMode`
- 重建前端 dist，确保浏览器加载的新包包含正式启动参数传递逻辑

#### 修改了哪些文件
- `backend/target/logitrack-backend-1.0.0.jar` — 重新打包，包含新的 `ProcessManagerService` / `StartRequestDTO`
- `logitrack-pro/components/settings/monitoring/tabs/ServiceControl.tsx` — `executeStart()` 改为正式传 `createRefMode`，删除 8 秒补丁
- `logitrack-pro/dist/assets/index-afU8GTRg.js` — 新前端构建产物
- `ai-harness/06_INTEGRATION_MAP.md` — 补充跨项目启动契约与 `createRefMode` 传递说明
- `ai-harness/01_CURRENT_STATE.md` — 更新当前状态与风险
- `ai-harness/09_SESSION_HANDOFF.md` — 记录本次闭环结果

#### 验证了什么
- `mvn package -DskipTests` 成功，生成新 JAR（18:02:21）
- `npm run build` 成功，生成新前端包 `index-afU8GTRg.js`
- 直接调用 `POST /api/monitor/process/start`，请求体带 `createRefMode=TEST_FORWARD`
- 启动后检查 `/pyapi/status`，返回 `create_ref_mode=TEST_FORWARD`、`run_mode=TEST_FORWARD`，确认前端/Java/Python 全链路生效
- 停止测试进程，保留 Spring Boot 新 JAR 运行，等待用户从 UI 重新启动验证

#### 下次应继续什么
1. 浏览器硬刷新（Ctrl+Shift+R）后，从 UI 分别验证 CREATE_REF 的 `TEST_FORWARD` 与 `LIVE` 启动路径
2. 用真实测试邮件做一轮端到端验证，确认监控面板中的 `logitrack_created` / `logitrack_ref` 与实际建号一致
3. 业务确认后再推进 LIVE 模式正式上线与 Windows Task Scheduler 定时运行

#### 风险提示
- 浏览器若缓存旧版 dist，会继续看到旧逻辑；必须硬刷新后再测
- Java 侧后续凡是改启动 DTO 或 `ProcessManagerService`，都必须 `mvn package` 并重启，`mvn compile` 不够
- `CREATE_REF_MODE=LIVE` 会真实建号，建议继续先用 `TEST_FORWARD` 做 UAT 验证

---

## 待办事项（下次接手时）

### ✅ 全部完成（2026-05-25 18:02 维护窗口）
1. **✅ 重建 Spring Boot JAR**：已停止 Spring Boot → `mvn package -DskipTests` → 新 JAR 18:02:21
   - `StartRequestDTO` 含 `createRefMode` 字段；`startProcess()` 透传 `CREATE_REF_MODE` 环境变量
2. **✅ 前端已重建**：`npm run build` → `index-afU8GTRg.js`（18:02）
   - `executeStart()` 正式传入 `createRefMode` 字段（移除了 8 秒临时 setTimeout）
3. **验证结果**：API 测试 `createRefMode=TEST_FORWARD` → Python 以 `create_ref_mode=TEST_FORWARD` 启动 ✓

### 现状（2026-05-25 18:05）
- Spring Boot：PID 18116，新 JAR 运行中
- Python 服务：已停止（上次测试后停止，等待用户从 UI 重新启动）
- 前端：新 dist `index-afU8GTRg.js`，**用户需硬刷新浏览器（Ctrl+Shift+R）**

### .env 说明
- `CREATE_REF_MODE=DRY_RUN`（.env 默认值）— 安全兜底；Spring Boot 启动时会用 UI 选项覆盖此值

---

## 架构说明

### CREATE_REF 模式控制层级（优先级从高到低）

```
全局 DRY_RUN（CLI --dry-run）
  ├── 约束：若全局 DRY_RUN=True，则 CREATE_REF 也强制为 DRY_RUN
  └── CREATE_REF_MODE（独立）：DRY_RUN / TEST_FORWARD / LIVE
        ├── .env CREATE_REF_MODE 启动时加载
        ├── 运行时 POST /pyapi/control/create-ref-mode 可即时覆盖
        └── UI 启动参数面板可在 processApi.start() 时通过 Java 透传
```

### 运行时 API 端点（新增）
- `POST /pyapi/control/create-ref-mode` body: `{"mode": "DRY_RUN"|"TEST_FORWARD"|"LIVE"}`

---

---

## 上一次任务

建立 AI Coding Harness 文档体系；修复前端 typecheck；对齐 API/DB 文档。

---

## 本次已完成内容（2026-05-26）

### CREATE_REF 独立模式控制（全栈实现）

**目的**：将 CREATE_REF 建号功能从全局 DRY_RUN/LIVE 模式中解耦，允许 INQUIRY 用 LIVE 转发的同时，CREATE_REF 仍用 DRY_RUN 安全测试。

**修改文件**：
1. `email-ai-automation/config/settings.py` — 新增 `create_ref_mode: str = os.getenv("CREATE_REF_MODE", "DRY_RUN")`
2. `email-ai-automation/main.py`:
   - 新增全局变量 `CREATE_REF_MODE: str = "DRY_RUN"`
   - `main()` 中从 `settings.create_ref_mode` 初始化
   - Step 6a 改用 `_cr_dry_run = DRY_RUN or (CREATE_REF_MODE == "DRY_RUN")` / `_cr_test_fwd`
   - **顺手修复**：`_mon["logitrack_created"]` / `_mon["logitrack_ref"]` 写回（之前 CREATE_REF 邮件在监控中显示 0/NULL）
   - **顺手修复**：日志行 `ref_result.get("refs")` → `ref_result.get("ref_numbers")`
3. `email-ai-automation/services/monitor_api.py`:
   - `_state` 加 `"create_ref_mode": "DRY_RUN"`
   - 新增端点 `POST /pyapi/control/create-ref-mode`（接受 `{mode: "DRY_RUN"|"TEST_FORWARD"|"LIVE"}`）
4. `email-ai-automation/.env` — 新增 `CREATE_REF_MODE=DRY_RUN`
5. `backend/.../ProcessManagerService.java` — `StartRequestDTO` 新增 `String createRefMode`，`startProcess()` 注入 `CREATE_REF_MODE` 环境变量
6. `logitrack-pro/services/monitorApi.ts`:
   - `PyApiStatus` 新增 `create_ref_mode?: string`
   - `StartRequestDTO` 新增 `createRefMode?: string`
   - `monitorPyApi` 新增 `setCreateRefMode(mode: string)` 方法
7. `logitrack-pro/components/.../ServiceControl.tsx`:
   - `LaunchConfigProps`/`LaunchConfig` 加 `createRefMode`/`setCreateRefMode`
   - 启动配置面板新增"CREATE_REF 建号模式"三按钮（仅记录/测试建号/实际建号）
   - `RuntimeControlProps`/`RuntimeControl` 加 `currentCreateRefMode`，运行时调整面板新增同样三按钮
   - 主组件 state、refreshStatus 同步、executeStart 传参全部对齐

**验证结果**：
- Python 语法检查：main.py OK / settings.py OK / monitor_api.py OK
- TypeScript typecheck：无错误
- Java mvn compile：无错误

**当前运行状态**：服务仍在运行（需重启才能生效 CREATE_REF_MODE 读取）

---

## 待处理事项

- 重启 Python 服务以加载新的 `CREATE_REF_MODE` 逻辑
- 重启 Spring Boot 以加载新的 `ProcessManagerService.java`（若需 UI 启动时传递 createRefMode）
- 前端 `npm run build` 并重启 Vite 开发服务器
- 将 CREATE_REF_MODE 调整为 `LIVE` 后进行端到端验证（建号 → 监控显示 logitrack_created=1, logitrack_ref=CN...)

---

## 风险提示

- `CREATE_REF_MODE=LIVE` 会真实调用 LogiTrack API 建号，确保先用 `TEST_FORWARD` 验证
- `_mon["logitrack_ref"]` 现在写入 DB，最大长度 50，多号用逗号拼接；若超长需关注（CREATE_REF_MULTI_SHIPMENT 最多约 5 票）

---

## 上一次任务

建立 AI Coding Harness 文档体系；修复前端 typecheck；对齐 API/DB 文档。

---

## 本次已完成内容（2026-05-22）

### 服务管理“停止服务失败（无匹配 main.py 进程）”修复（后端）
- 问题：页面显示服务运行中（监控 API 可达）但点击“停止服务”报错“找不到运行中的服务（无匹配 main.py 进程）”
- 根因：
  1. 运行中的 Python 进程可能缺失 `emailai.pid`
  2. Java `ProcessHandle` 在部分场景读取不到完整 commandLine/arguments，导致 main.py 枚举失败
- 修复：`ProcessManagerService.stopProcess()` 新增兜底路径
  - 当 PID 文件和 main.py 枚举都失败时，按 `monitorApiUrl` 端口（默认 5100）通过 `netstat -ano -p tcp` 反查监听 PID
  - 对该 PID 执行 `destroyForcibly` 终止
- 回归验证：
  - `POST /api/monitor/process/stop` 返回 `{"ok":true,"message":"服务已停止（端口兜底）"}`
  - 随后 `/pyapi/status` 不可达、`/api/monitor/process/status` 返回未运行

### 数据质检模块 P1~P7 全部完成并上线

**完整功能链路已通端到端验证：**
- 前端「邮件监控 → 🔍 数据质检」Tab 正常显示（30条有缺失字段，Category 等字段检测正确）
- 手动触发「▶ 立即执行」正确发送报告邮件到 `davian.liang@zieglergroup.cn`
- 执行历史正确记录（reportSent=true, globalRecipientsCount=1）

### 修复的三个运行时 Bug

#### Bug 1：`/api/monitor/quality/run` 返回 404

#### Bug 2：质检返回 0 条（500 错误）

#### Bug 3：质检执行成功但邮件 0 人（未发送）
  1. `spring.mail.host` 默认值改为空（`${MAIL_HOST:}`），SMTP 未配置时不创建 Bean
  2. `sendHtmlMail()` 判断条件改为 `mailSender != null && mailUsername != null && !mailUsername.isBlank()`
  3. Python `monitor_api.py` 新增 `POST /pyapi/internal/send-email` 端点，内部调用 `GraphClient.send_email()`
  4. Java 降级路径：SMTP 不可用时，通过 `RestTemplate` 调 `localhost:5100/pyapi/internal/send-email`

---

### LogiTrack Pro（Java 后端）
| 文件 | 改动说明 |
|------|---------|
| `backend/src/main/java/.../service/QualityReportMailService.java` | 新增 `mailUsername` 注入；`sendHtmlMail()` 增加 username 判断；新增 RestTemplate + 降级调 Python 逻辑 |
| `backend/src/main/resources/application.properties` | `spring.mail.host` 默认值清空；新增降级路径注释 |

### Email AI Automation（Python）

| 文件 | 改动说明 |
|------|---------|
| `services/monitor_api.py` | 新增 `POST /pyapi/internal/send-email` 端点（内部用 GraphClient 发送 HTML 邮件）|

### Harness 文档

| 文件 | 改动说明 |
|------|---------|
| `ai-harness/06_INTEGRATION_MAP.md` | 新增 `A→B` 邮件发送通道说明；更新跨项目影响矩阵 |
| `ai-harness/01_CURRENT_STATE.md` | 更新已完成功能、删除 Bug#4（build 已修复）、更新最近稳定版本 |
| `ai-harness/09_SESSION_HANDOFF.md` | 本文件 |

---

## 验证结果

| 验证项 | 结果 |
|--------|------|
| `mvn compile` | ✅ BUILD SUCCESS |
| `mvn package -DskipTests` | ✅ BUILD SUCCESS |
| `npm run typecheck` | ✅ 0 errors |
| `/api/monitor/quality/config` HTTP | ✅ 200 OK |
| `/api/monitor/quality/results?days=7` | ✅ totalChecked=38, totalIncomplete=30 |
| `POST /pyapi/internal/send-email`（Python 直调）| ✅ `{"ok":true}` |
| `POST /api/monitor/quality/run`（完整链路）| ✅ reportSent=true, globalRecipientsCount=1 |
| 邮件实际到达 | ✅ davian.liang@zieglergroup.cn 已收到 |

---

## 下次应继续什么

### P0（立即）
1. **启用定时质检**：在前端「数据质检 → 质检配置」勾选「启用定时质检」，频率设每天 09:00，保存配置
2. **配置 Windows Task Scheduler**：定时自动启动 Email AI 主进程

### P1（近期）
3. **质检范围扩大**：目前检查范围默认 7 天，可根据业务需要调整
4. **启用路由分发**：勾选「路由分发」，让各 PIC 收到各自负责的缺失字段通知
5. 解决 polIds 缺失率（使用邮件全文而非 800 字符预览）
6. TEST_FORWARD 模式下积累 10+ 训练案例

### P2（计划中）
7. LIVE 模式正式上线（业务确认后）
8. Git push 网络疏通

---

## 风险提示

| 风险 | 说明 | 处置建议 |
|------|------|---------|
| Python 服务未运行时邮件发送失败 | Java 降级调 `localhost:5100`，若 Python 服务宕机则邮件全部失败 | 质检执行前确认 Python 服务运行中（前端「服务管理」Tab 状态绿色） |
| `spring.mail.host` 清空后如需配置真实 SMTP | 需同时设置 `MAIL_HOST`、`MAIL_USERNAME`、`MAIL_PASSWORD` 环境变量或修改 properties | 当前不需要，降级方案已稳定 |
| `POST /pyapi/internal/send-email` 无认证 | FastAPI 绑定 127.0.0.1，外网不可达，风险可控 | 保持仅内网调用，不对外暴露 |
| 重新打包后需重启才生效 | Java 改动必须 `mvn package` + 重启进程，`mvn compile` 不够 | 每次后端改动后记得执行完整打包步骤 |

---

## 当前不要碰的地方

- `services/router.py` — 路由引擎核心
- `services/ai_analyzer.py` SYSTEM_PROMPT — 影响分类准确率
- `data/base_fewshot.json` — 25 个稳定案例
- `database/schema*.sql` — 生产数据库
- `backend/.../entity/Enquiry.java` — 核心实体
- `POST /api/enquiries` 字段名 — Email AI mapper 依赖

---

## 是否影响另一个项目

**是，跨项目改动：**
- Python `monitor_api.py` 新增端点，Java `QualityReportMailService` 依赖此端点
- 若 Python 服务重启（版本升级/崩溃），新端点自动生效，无需 Java 重启
- 已更新 `ai-harness/06_INTEGRATION_MAP.md` 记录此新通道

---

## 新 Chat 启动提示词

```
我正在继续开发 LogiTrack Pro + Email AI Automation 双项目工作区。
请先阅读 ai-harness/09_SESSION_HANDOFF.md 和 ai-harness/01_CURRENT_STATE.md 了解当前状态。
如果涉及跨项目改动，请先阅读 ai-harness/06_INTEGRATION_MAP.md。
遵守 ai-harness/07_AI_CODING_RULES.md 中的所有规则。
```


---

## 上一次任务

创建并补全 AI Coding Harness 文档体系。

## 本次已完成内容

- 建立 `ai-harness/` 目录，包含 14 个标准化文档
- 创建 `.github/copilot-instructions.md`、`AGENTS.md`、`tasks/` 模板体系
- 新增前端 `npm run typecheck`（`tsc --noEmit`）
- 修复 `EnquiryForm.tsx` 中 5 处 `OfferType` 类型收窄错误，使 `npm run typecheck` 可通过
- 从 Spring Boot Controller + `services/monitor_api.py` 重建 `04_API_CONTRACTS.md`
- 从 MySQL `information_schema` 实时导出并重建 `05_DATABASE_SCHEMA.md`
- 修正文档中的过期路由说明（如 `/api/monitor/process/*`、`/api/enquiries/export-xlsx`）

## 修改文件

- `logitrack-pro/package.json`
- `logitrack-pro/components/enquiry/EnquiryForm.tsx`
- `ai-harness/04_API_CONTRACTS.md`
- `ai-harness/05_DATABASE_SCHEMA.md`
- `ai-harness/09_SESSION_HANDOFF.md`
- `ai-harness/11_TEST_CHECKLIST.md`
- `AGENTS.md`

## 当前状态

- 两个项目均处于 **UAT 测试阶段**
- LogiTrack Pro: 生产环境运行中，9000+ 条真实数据
- Email AI: TEST_FORWARD 模式验证中，LIVE 技术就绪
- 前端 `npm run typecheck` 已可执行并通过
- Harness 中的 API / 数据库文档已和当前代码、当前 MySQL 实库重新对齐
- 前端 `npm run build` 仍未在本次任务中修复或复验

## 当前阻塞

- 前端 build 历史报错仍待单独修复（本次只接通并验证了 `typecheck`）
- Windows Task Scheduler 定时运行未配置

## 当前风险

- 无 CI/CD，代码变更靠手动验证
- 单机部署无冗余
- subprocess 进程管理无 watchdog
- 文档若不继续维护，API / DB 契约仍会再次漂移

## 下一个建议任务

1. 修复并复验前端 `npm run build`
2. 配置 Windows Task Scheduler
3. 为 Email AI 项目补一份本地 `AGENTS.md`
4. 为前端补 `lint` / `test` / `check` 脚本（需确认后再做）

## 新 Chat 启动提示词

```
我正在继续开发 LogiTrack Pro + Email AI Automation 双项目工作区。
请先阅读 ai-harness/09_SESSION_HANDOFF.md 和 ai-harness/01_CURRENT_STATE.md 了解当前状态。
如果涉及跨项目改动，请先阅读 ai-harness/06_INTEGRATION_MAP.md。
遵守 ai-harness/07_AI_CODING_RULES.md 中的所有规则。
```

## 当前不要碰的地方

- `services/router.py` — 路由引擎核心
- `services/ai_analyzer.py` SYSTEM_PROMPT — 影响分类准确率
- `data/base_fewshot.json` — 25 个稳定案例
- `database/schema*.sql` — 生产数据库
- `backend/.../entity/Enquiry.java` — 核心实体

## 是否影响另一个项目

- 文档更新涉及两个项目的上下文说明，但**没有修改跨项目 API 或数据库运行契约**。
- 代码改动仅影响 LogiTrack 前端类型检查与表单内部类型收窄，不影响 Email AI 运行路径。

## 是否需要我补充信息

暂无。如有新的功能需求或 bug，按 `08_TASK_TEMPLATE.md` 或 `tasks/TASK_TEMPLATE.md` 模板派发任务。

---

## 2026-05-25 NotebookLM 知识库第一批生成

### 本次完成

- 创建 `notebooklm_project_knowledge_base/`。
- 生成 NotebookLM 可导入的第一批 5 份 Markdown 文档：
  - `01_项目总览.md`
  - `02_系统架构.md`
  - `03_核心业务流程.md`
  - `04_前端分析.md`
  - `05_后端分析.md`
- 内容基于已读取的真实代码、配置和 Harness 文档：
  - LogiTrack Pro: `README.md`、`logitrack-pro/package.json`、`vite.config.ts`、`backend/pom.xml`、`application.properties`、Controller/Service/AI 关键文件扫描。
  - Email AI Automation: `README.md`、`requirements.txt`、`.env.example`、`main.py`、`services/ai_analyzer.py`、`services/router.py`、`services/logitrack_mapper.py`、`services/monitor_api.py` 等关键文件扫描。
  - Harness: `01_CURRENT_STATE.md`、`02_ARCHITECTURE.md`、`03_DOMAIN_MODEL.md`、`04_API_CONTRACTS.md`、`05_DATABASE_SCHEMA.md`、`06_INTEGRATION_MAP.md`、`07_AI_CODING_RULES.md`。

### 修改文件

- `notebooklm_project_knowledge_base/01_项目总览.md`
- `notebooklm_project_knowledge_base/02_系统架构.md`
- `notebooklm_project_knowledge_base/03_核心业务流程.md`
- `notebooklm_project_knowledge_base/04_前端分析.md`
- `notebooklm_project_knowledge_base/05_后端分析.md`
- `ai-harness/09_SESSION_HANDOFF.md`

### 验证

- 已运行 `Get-ChildItem -Path notebooklm_project_knowledge_base -File | Select-Object Name,Length`，确认 5 个文档存在。
- 已运行 `rg -n` 检查每个文档包含统一核心章节：标题、本文档用途、核心结论、对应代码位置、面试表达、追问、回答建议、需要补充信息。
- 未运行 `npm run build` 或 `mvn compile`，因为本次仅新增 Markdown 知识库文档，未修改业务代码。

### 影响范围

- 仅文档新增和 handoff 更新。
- 不影响前端、后端、Python 服务、API、数据库 schema 或运行配置。
- 文档中明确标注了【代码已实现】、【部分实现 / 疑似实现】、【代码中未发现，需要我补充】等真实性边界。

### 风险与后续

- Harness 文档读取时存在编码显示异常，第一批文档已尽量以真实代码和配置为准。
- 后续继续生成 `06_数据库与数据模型.md` 到 `24_术语表.md` 时，需要进一步读取实体、SQL、AI prompt、测试、部署和决策日志。
- 已在文档中明确：当前未发现 RAG/embedding/vector retrieval/rerank 实现，后续不要包装成已完成能力。
---

## 2026-05-25 NotebookLM 知识库 06-12 补全

### 本次完成

- 读取并确认 `notebooklm_project_knowledge_base/` 已存在 01-05：
  - `01_项目总览.md`
  - `02_系统架构.md`
  - `03_核心业务流程.md`
  - `04_前端分析.md`
  - `05_后端分析.md`
- 未覆盖、未重复生成已有文档。
- 基于当前代码、已有 NotebookLM 文档与 harness 文档，新增 06-12：
  - `06_EmailAI自动化分析.md`
  - `07_API与跨项目集成.md`
  - `08_数据库与数据模型.md`
  - `09_监控运维与模式控制.md`
  - `10_AI规则提示词与路由策略.md`
  - `11_测试验证与UAT清单.md`
  - `12_风险路线图与后续交接.md`

### 参考来源

- Harness：
  - `ai-harness/01_CURRENT_STATE.md`
  - `ai-harness/02_ARCHITECTURE.md`
  - `ai-harness/03_DOMAIN_MODEL.md`
  - `ai-harness/04_API_CONTRACTS.md`
  - `ai-harness/05_DATABASE_SCHEMA.md`
  - `ai-harness/06_INTEGRATION_MAP.md`
  - `ai-harness/07_AI_CODING_RULES.md`
  - `ai-harness/12_DEPLOYMENT_NOTES.md`
- LogiTrack Pro code：
  - `backend/src/main/java/com/logitrack/backend/**`
  - `backend/src/main/resources/application.properties`
  - `logitrack-pro/services/monitorApi.ts`
  - `logitrack-pro/components/settings/monitoring/tabs/ServiceControl.tsx`
  - `logitrack-pro/package.json`
  - `backend/pom.xml`
- Email AI Automation code：
  - `C:\Users\Administrator\Desktop\email-ai-automation\main.py`
  - `config/settings.py`
  - `services/monitor_api.py`
  - `services/ai_analyzer.py`
  - `services/router.py`
  - `services/skip_checker.py`
  - `services/logitrack_mapper.py`
  - `services/logitrack_client.py`
  - `data/pic_routing.json`
  - `data/skip_lists.json`

### 验证

- 已运行：
  - `Get-ChildItem -Path notebooklm_project_knowledge_base -File | Sort-Object Name | Select-Object Name,Length,LastWriteTime`
  - 结果：确认 01-12 共 12 个 Markdown 文件存在，06-12 已新增。
- 已运行：
  - `rg -n "CREATE_REF|POST /api/enquiries|router.py|email_processing_log|RUN_MODE|LOGITRACK_DRY_RUN" notebooklm_project_knowledge_base`
  - 结果：关键跨项目、高风险、监控关键词均可在知识库中检索。
- 未运行 `npm run build`、`mvn compile`、Python pytest：本次只新增 NotebookLM Markdown 文档，未修改运行时代码。

### 影响范围

- 仅文档变更：
  - `notebooklm_project_knowledge_base/06_EmailAI自动化分析.md`
  - `notebooklm_project_knowledge_base/07_API与跨项目集成.md`
  - `notebooklm_project_knowledge_base/08_数据库与数据模型.md`
  - `notebooklm_project_knowledge_base/09_监控运维与模式控制.md`
  - `notebooklm_project_knowledge_base/10_AI规则提示词与路由策略.md`
  - `notebooklm_project_knowledge_base/11_测试验证与UAT清单.md`
  - `notebooklm_project_knowledge_base/12_风险路线图与后续交接.md`
  - `ai-harness/09_SESSION_HANDOFF.md`
- 不影响 Java、React、Python runtime。
- 不改变 API、数据库 schema、AI prompt、routing、few-shot。

### 风险与后续

- 当前仓库已有大量未提交/未跟踪变更，本次没有回退或清理任何既有变更。
- 新文档中包含路径、接口和模式说明，但不包含 secret 值。
- 后续若继续扩展 NotebookLM，可考虑 13+ 文档覆盖：
  - 具体 UI 页面操作手册
  - 生产部署 SOP
  - Graph/LLM/VLM 凭证与环境变量模板说明
  - 常见错误案例库与排障 playbook

---

## 2026-05-26 NotebookLM 知识库 13-18 补全

### 本次完成

- 检查 `notebooklm_project_knowledge_base/` 已有 Markdown 文件，确认 01-12 已存在，本次未重复生成既有内容。
- 基于当前代码、已有 NotebookLM 文档和 ai-harness 文档，继续生成 13-18：
  - `13_UI操作手册.md`
  - `14_部署环境与配置SOP.md`
  - `15_数据质量与报告机制.md`
  - `16_主数据与数据迁移手册.md`
  - `17_安全权限与审计.md`
  - `18_故障排查与排障Playbook.md`
- 文档覆盖 UI 操作路径、部署配置、数据质量报告、主数据迁移、安全权限审计和 UAT 故障排查。

### 参考来源

- 必读 harness：
  - `ai-harness/09_SESSION_HANDOFF.md`
  - `ai-harness/01_CURRENT_STATE.md`
  - `ai-harness/07_AI_CODING_RULES.md`
- 按需读取：
  - `ai-harness/04_API_CONTRACTS.md`
  - `ai-harness/05_DATABASE_SCHEMA.md`
  - `ai-harness/06_INTEGRATION_MAP.md`
  - `ai-harness/10_DECISIONS_LOG.md`
  - `ai-harness/11_TEST_CHECKLIST.md`
  - `ai-harness/12_DEPLOYMENT_NOTES.md`
- 代码抽样：
  - `logitrack-pro/App.tsx`
  - `logitrack-pro/components/settings/**`
  - `logitrack-pro/components/master-data/**`
  - `logitrack-pro/services/api.ts`
  - `logitrack-pro/services/settingsApi.ts`
  - `logitrack-pro/services/monitorApi.ts`
  - `backend/src/main/java/**/controller/*Auth*`
  - `backend/src/main/java/**/controller/*Audit*`
  - `backend/src/main/java/**/controller/*MasterData*`
  - `backend/src/main/java/**/controller/*DataQuality*`
  - `backend/src/main/java/**/service/*DataQuality*`
  - `backend/src/main/java/**/scheduler/*DataQuality*`
  - `backend/src/main/resources/application.properties`
  - `C:\Users\Administrator\Desktop\email-ai-automation\config\settings.py`

### 验证

- 已运行：
  - `Get-ChildItem -Path notebooklm_project_knowledge_base -File | Sort-Object Name | Select-Object Name,Length`
  - 结果：确认 01-18 共 18 个 Markdown 文件存在，13-18 文件均已生成。
- 已运行：
  - `rg -n "DataQuality|MasterDataController|X-Username|CREATE_REF|/api/monitor/quality|ProcessManager|故障" notebooklm_project_knowledge_base`
  - 结果：关键主题可被检索到，新增文档覆盖数据质量、主数据、权限审计、配置和排障关键词。
- 未运行 `npm run build`、`mvn compile` 或 Python pytest；本次只新增 Markdown 知识库文档，没有修改运行时代码。

### 修改文件

- `notebooklm_project_knowledge_base/13_UI操作手册.md`
- `notebooklm_project_knowledge_base/14_部署环境与配置SOP.md`
- `notebooklm_project_knowledge_base/15_数据质量与报告机制.md`
- `notebooklm_project_knowledge_base/16_主数据与数据迁移手册.md`
- `notebooklm_project_knowledge_base/17_安全权限与审计.md`
- `notebooklm_project_knowledge_base/18_故障排查与排障Playbook.md`
- `ai-harness/09_SESSION_HANDOFF.md`

### 影响与风险

- 只影响文档，不影响 Java、React、Python 运行逻辑。
- 未改 API、数据库 schema、AI prompt、router、mapper 或 few-shot 数据。
- 生成内容基于当前代码和 harness 抽样，后续若代码继续变化，需要同步更新 NotebookLM 知识库。
