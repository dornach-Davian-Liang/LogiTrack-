# LogiTrack Pro + Email AI Automation — Copilot Instructions

> **这是一个复杂的 vibe coding 双项目工作区，处于 UAT 上线测试阶段。**  
> **核心上下文在 `ai-harness/` 目录，本文件仅提供规则索引。**

---

## 1. 上下文加载规则

每次新会话或接手任务时，**必须先读取**：

1. `ai-harness/00_AI_README.md` — **入口指引**（必读顺序、禁止事项、流程）
2. `ai-harness/09_SESSION_HANDOFF.md` — 上次交接
3. `ai-harness/01_CURRENT_STATE.md` — 当前状态

按需读取：
- 涉及 API → `ai-harness/04_API_CONTRACTS.md`
- 涉及数据库 → `ai-harness/05_DATABASE_SCHEMA.md`
- 涉及跨项目 → `ai-harness/06_INTEGRATION_MAP.md`
- 不确定模块位置 → `ai-harness/14_MODULE_MAP.md`
- 不确定业务概念 → `ai-harness/03_DOMAIN_MODEL.md`
- 不确定下一步做什么 → `ai-harness/18_NEXT_ACTIONS.md`

---

## 2. 双项目概要

| 项目 | 技术 | 端口 | 路径 |
|------|------|------|------|
| LogiTrack Pro | Java 17 / Spring Boot 3.2 + React 19 / TS | :8080 / :3000 | `C:\logitrack\LogiTrack--update-status-report-20260126023903\` |
| Email AI Automation | Python 3.14 + FastAPI | :5100 | `C:\Users\Administrator\Desktop\email-ai-automation\` |

- 共享 MySQL `logitrack` @ localhost:3306 (root/ldf123)
- React Vite 代理: `/api/*`→:8080, `/pyapi/*`→:5100
- Spring Boot 通过 subprocess 管理 Python 进程

---

## 3. 修改代码规则

1. **先读目标文件** — 理解现有实现再动手
2. **确认影响范围** — 检查谁 import/调用了目标代码
3. **最小必要修改** — 不顺手重构、不美化无关代码
4. **跨项目改动** — 必须先读 `ai-harness/06_INTEGRATION_MAP.md`
5. **修改后验证** — 前端 `npm run build`，后端 `mvn compile`，Python 语法检查

---

## 4. 禁止行为

1. ❌ 没有明确任务时大规模重构
2. ❌ 随意删除已有功能
3. ❌ 随意重命名数据库字段
4. ❌ 引入新依赖（除非先说明原因）
5. ❌ 修改无关文件
6. ❌ 把密钥写入前端代码
7. ❌ 凭空假设不存在的接口
8. ❌ 修改 `services/router.py` 路由优先级（除非有回归测试）
9. ❌ 修改 `ai_analyzer.py` SYSTEM_PROMPT（除非有回归计划）
10. ❌ 修改 `data/base_fewshot.json`（25案例已稳定）
11. ❌ 修改 `POST /api/enquiries` 字段名（Email AI mapper 依赖）
12. ❌ 假设 README/里程碑文档是最新的 — 以代码为准

---

## 5. 输出格式要求

每次任务完成后必须输出：

1. **修改文件清单**
2. **验证步骤** (具体命令)
3. **影响范围** (是否影响另一个项目)
4. **风险提示**

---

## 6. 测试要求

| 改动类型 | 验证命令 |
|----------|----------|
| 前端 | `cd logitrack-pro && npm run build` |
| 后端 | `cd backend && mvn clean compile` |
| Python | `py -c "import ast; ast.parse(open('file.py','utf-8').read())"` |
| 路由逻辑 | `py -m pytest tests/test_router.py -v` |
| 建单映射 | `py -m pytest tests/test_logitrack_mapper.py -v` |
| 回归 | `py scripts/regression_test.py` |

---

## 7. 跨项目开发要求

- Email AI → LogiTrack: 通过 REST API (`POST /api/enquiries`)，不直接写 DB
- LogiTrack 前端 → Email AI: 通过 Vite proxy `/pyapi/*`，不直连 :5100
- 修改一侧 API 接口 → 必须同步另一侧的客户端/类型定义
- 修改 `email_processing_log` 表 → Python 和 Java 双方都需要适配

---

## 8. 文档更新要求

| 条件 | 更新文件 |
|------|----------|
| 每次任务完成 | `ai-harness/09_SESSION_HANDOFF.md` |
| 架构/技术决策 | `ai-harness/10_DECISIONS_LOG.md` |
| 修改 API | `ai-harness/04_API_CONTRACTS.md` |
| 修改数据库 | `ai-harness/05_DATABASE_SCHEMA.md` |
| 修改集成关系 | `ai-harness/06_INTEGRATION_MAP.md` |
| 功能状态变化 | `ai-harness/01_CURRENT_STATE.md` |

---

## 9. 高风险边界（改动前务必确认）

| 边界 | 文件 | 风险 |
|------|------|------|
| 去重逻辑 | `main.py` + `test_tracker.py` | message_id/conversation_id/Ref 复用 |
| 多票拆单 | `main.py` Step 8.5 | 拆分异常可能产生垃圾数据 |
| LLM 容错 | `ai_analyzer.py` | Flash→Backup→Pro 三层切换 |
| 路由引擎 | `router.py` + `pic_routing.json` | 10+ 优先级规则，修改需回归 |
| 自动建单 | `logitrack_mapper.py` → REST API | 字段映射错误影响生产数据 |

---

## 10. 快速参考

- **AI 入口指引**: `ai-harness/00_AI_README.md`
- **模块地图**: `ai-harness/14_MODULE_MAP.md`
- **详细架构**: `ai-harness/02_ARCHITECTURE.md`
- **业务术语**: `ai-harness/03_DOMAIN_MODEL.md`
- **任务模板**: `ai-harness/08_TASK_TEMPLATE.md`
- **部署说明**: `ai-harness/12_DEPLOYMENT_NOTES.md`
- **测试清单**: `ai-harness/11_TEST_CHECKLIST.md`
- **风险防护**: `ai-harness/16_RISK_AND_GUARDRAILS.md`
- **里程碑**: `ai-harness/15_MILESTONE_STATUS.md`
- **下一步行动**: `ai-harness/18_NEXT_ACTIONS.md`
- **简历面试**: `ai-harness/17_RESUME_AND_INTERVIEW.md`
- **Prompt 模板**: `ai-harness/13_CONTEXT_LOADING_GUIDE.md`
