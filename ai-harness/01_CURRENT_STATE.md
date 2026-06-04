# Current State

> 最后更新: 2026-05-27

## 已完成功能

### LogiTrack Pro
- 询价管理全生命周期 (FCL/LCL/AIR, 多POL/POD, Route Groups, 状态流转)
- 报价管理 (Offer + 多柜型价格线)
- 报表仪表板 (统计卡片、月度趋势、国家排名、时期对比)
- RBAC 权限 (Admin/Sales Manager/Operating User) + AOP 审计日志
- 主数据 CRUD (国家、港口、Sales PIC、Carrier、货币、柜型)
- AI 数据分析问答 (Function Calling + Recharts 图表)
- XLSX 后端导出 (Apache POI) + 多选筛选
- Email AI 监控面板 (7 个 Tab: Dashboard/日志/调试/配置/服务管理/AI训练/数据质检)
- ProcessManagerService (Java subprocess 管理 Python 进程)
- CREATE_REF 独立模式控制（启动参数 + 运行时切换，UI/Java/Python 全链路打通）
- **数据质检模块** (P1~P7 全部完成): 定时/手动质检 AI 建单缺失字段，热力图/趋势图/执行历史，报告通过 Graph API 发送邮件

### Email AI Automation
- 邮件自动拉取解析 (Graph API + VLM cid: 内联图片提取)
- AI 分析 (DeepSeek-V4-Flash, 25 个 Few-shot, 26+ 字段, thinking=medium)
- LLM 三层容错 (主API + 备用API + Pro升级自动切换)
- PIC 路由引擎 (10+ 优先级规则, 多起运地合并, 多票货拆单)
- 三模式运行 (DRY_RUN / TEST_FORWARD / LIVE)
- LogiTrack 自动建单 (mapper + client + main.py Step 9, feature flag 控制)
- CREATE_REF 建号模式独立于全局运行模式（DRY_RUN / TEST_FORWARD / LIVE）
- Reply All 转发 + 附件 + inline 签名过滤
- SkipChecker (DG/混合/无货量拦截)
- FastAPI 监控 API (20+ 端点)
- AI 训练 API (纠错/注入/回归/模拟)
- 告警系统 (连续失败/配额耗尽/超时)
- 发件人姓名多来源解析器
- 去重缓存 (message_id) + 热更新
- 业务级重复询价判重（40 分钟复用窗口，跨 conversation 复用已有 REF；补件继续转发，纯重复抑制）
- **conversation_id DB 去重 + 60 天窗口**：Step 9a 新增跨批次持久化去重，同 conversation_id 历史建号记录在 60 天内复用 REF，防止内部员工 Reply-All 触发重复建号

## 正在开发功能

| 功能 | 状态 | 说明 |
|------|------|------|
| LLM 成本控制 (Flash/Pro 混合策略) | M47 刚落地 | 主力 Flash + 高风险自动升级 Pro，需持续观察成本/准确率平衡 |
| LIVE 模式全面上线验证 | 技术就绪，UAT 中 | CREATE_REF 启动链路已修复，待业务做 UI 侧端到端验证后正式切换 |

## 未完成功能

| 功能 | 优先级 | 状态 |
|------|--------|------|
| Phase 6: Windows Task Scheduler 定时运行 | P0 | 未配置 |
| LIVE 模式正式上线 | P1 | 技术就绪，待业务确认 |
| training_fewshot.json 积累业务样本 | P1 | 基础设施就绪，数据为空 |
| Payload 完整率提升 (polIds 缺失) | P1 | 需 online 模式全文 |
| AI Text-to-SQL (LogiTrack AI Phase 3-4) | P2 | 未启动，当前仅 Function Calling |
| `logitrack_exporter.py` 接入主流程 | P2 | 代码存在但未 import |
| 端到端自动化测试 | P2 | 无 CI，无自动化测试覆盖 |
| Git push 远端发布 | P2 | 网络阻塞，远程仓库无最新代码 |

## 当前已知 Bug

| # | 描述 | 影响 | 优先级 |
|---|------|------|--------|
| 1 | polIds 缺失率 ~20% (800字符预览不够) | 建单 INCOMPLETE | P1 |
| 2 | ZIEGLERGROUP.COM 泛域名 → salesCountryCode=OT | 不精确 | P2 |
| 3 | Git push 网络阻塞 | 远程仓库无最新代码 | P2 |

## 待确认项

| 项目 | 问题 | 风险 |
|------|------|------|
| `.env.example` 与 `settings.py` | LLM backup/escalation 新字段可能未同步到 `.env.example` | 新环境部署遗漏配置 |
| 监控 API 权限边界 | `/pyapi/routing` PUT + `/pyapi/training/*` POST 可修改路由和训练数据 | 无认证保护，需明确操作边界 |
| 部署文档多份 | 历史存在多份部署文档与路径，需统一到当前机器实际路径 | 新人/AI 按错误路径操作 |

## 当前最大风险

1. **无 CI/CD** — 代码变更靠手动验证
2. **单机部署** — 无冗余，机器故障即全部停服
3. **进程管理脆弱** — subprocess 无 watchdog
4. **发布依赖手动重建/硬刷新** — Spring Boot 改动需重打 JAR，前端改动后浏览器可能缓存旧 dist
5. **角色耦合** — LogiTrack 既是业务系统，又是 Email AI 的控制台/进程管理器/监控 UI
6. **main.py 耦合度高** — 邮件处理、AI、建单、转发、监控写入全在一个 1200+ 行文件中
7. **数据一致性边界** — message_id/conversation_id/Ref 复用/多票拆单逻辑是高风险边界

## 最近稳定版本

- **LogiTrack Pro**: M48 (2026-05-21) — Enquiry 多选筛选 + XLSX 导出升级 + Category + SZX-LCL
- **Email AI**: M16 (2026-05-21) — SZX-LCL 路由拆分 + 新 branch 持久化

## 当前不要碰的模块

| 模块 | 原因 |
|------|------|
| `services/router.py` + `data/pic_routing.json` | 路由引擎核心，修改必须跑回归测试 |
| `services/ai_analyzer.py` SYSTEM_PROMPT | Prompt 变更影响全局分类/路由准确率 |
| `data/base_fewshot.json` | 25 个案例已稳定，修改需回归验证 |
| `backend/.../entity/Enquiry.java` | 30+ 字段，被多处 Service/DTO 依赖 |
| `database/schema*.sql` | 数据库已有 9000+ 条生产数据 |

## 最近一次重要改动

**M53 / M21 (2026-05-27)**:
- Email AI conversation_id 跨批次去重修复：Step 9a 新增 DB 层级 conversation_id 查询 + 60 天复用窗口
- 修复 CN2605292-S 类型的内部 Reply-All 重复建号问题（原因：sender_email 不同导致 business_dedup 漏判）
- 新增 `settings.conversation_ref_reuse_days=60`（可通过 `CONVERSATION_REF_REUSE_DAYS` 环境变量配置）
- `monitor_db.query_existing_ref_by_conversation()` 新增 `processed_at_dt` 返回字段
- 新增 `tests/test_conversation_dedup.py`（7 个测试用例）

**M52 / M20 (2026-05-26)**:
- LogiTrack Enquiry XLSX 导出补齐 `Sales Country` 显示名映射：后端导出改从 `dict_sales_country` 取字典名称，不再直接输出 code
- 已重打并重启 Spring Boot JAR，`/api/enquiries/export-xlsx` 实测样例从 `CN` 变为 `CHINA`

**M51 / M19 (2026-05-26)**:
- Email AI 新增业务级重复询价判重：基于 `email_processing_log` 最近成功建号记录，在单票场景下按 sender + 归一化主题 + 核心业务字段 + 附件增量判定 `NEW_REF` / `REUSE_REF_FORWARD_SUPPLEMENT` / `REUSE_REF_SUPPRESS`
- 第二封“补件邮件”会复用首次 REF，并优先沿用首次命中的 PIC 收件人；纯重复邮件则跳过建号和转发
- 新增单测覆盖主题归一化、补件复用、纯重复抑制，并确认此前同线程重复转发抑制未回退

**M50 / M18 (2026-05-25)**:
- 完成 CREATE_REF 独立模式控制的启动链路闭环：前端启动参数 → Spring Boot `StartRequestDTO` → Python 环境变量 `CREATE_REF_MODE`
- 修复 CREATE_REF 启动后回落为 `DRY_RUN` 的问题：重建 Spring Boot JAR，前端 `executeStart()` 恢复正式传 `createRefMode`
- Python 侧补齐 `create_ref_mode` / `logitrack_dry_run` 状态同步，并修复 `__main__`/`main` 双模块实例导致的运行时切换失效
- 修复 CREATE_REF DRY_RUN 下错误记录 tracker 导致 LIVE 无法重试的问题
- 验证：`mvn package -DskipTests` 成功，`npm run build` 成功，API 启动测试 `createRefMode=TEST_FORWARD` 后 `/pyapi/status` 返回 `create_ref_mode=TEST_FORWARD`

## 下一步建议任务

1. 配置 Windows Task Scheduler 定时启动 Email AI (P0)
2. **LIVE 验证 conversation_id 去重**：观察监控日志是否出现 `"同对话链已建号...复用REF"` 日志，确认 Nicy Yang 类型回复不再重复建号 (P1)
3. 让业务在浏览器硬刷新后，从 UI 分别验证 CREATE_REF 的 `TEST_FORWARD` / `LIVE` 启动与运行时切换 (P1)
4. 在数据质检配置中启用「启用定时质检」并设置每天 09:00 CRON (P1)
5. 在 TEST_FORWARD 模式下积累 10+ 训练案例 (P1)
6. 解决 polIds 缺失率 — 使用邮件全文而非 800 字符预览 (P1)
