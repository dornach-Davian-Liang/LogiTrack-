package com.logitrack.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Email AI Automation 进程管理服务
 * 负责启动、停止和查询 Python email-ai-automation 进程
 */
@Service
@Slf4j
public class ProcessManagerService {

    @Value("${emailai.python.executable:C:\\Python314\\python.exe}")
    private String pythonExecutable;

    @Value("${emailai.working.dir:C:\\Users\\Administrator\\Desktop\\email-ai-automation}")
    private String workingDir;

    @Value("${emailai.main.script:main.py}")
    private String mainScript;

    @Value("${emailai.monitor.api.url:http://127.0.0.1:5100}")
    private String monitorApiUrl;

    /** PID 文件路径（用于停止进程） */
    private static final String PID_FILE = "logs/emailai.pid";

    // ─── 公开 DTO ────────────────────────────────────────────────────────────

    public record ProcessStatusDTO(
        boolean running,
        Long pid,
        String runMode,
        String startedAt,
        String message
    ) {}

    public record StartRequestDTO(
        String runMode,           // DRY_RUN / TEST_FORWARD / LIVE
        Integer pollInterval,     // 秒，null 则使用默认
        String createRefMode,     // DRY_RUN / TEST_FORWARD / LIVE（独立建单模式）
        Boolean logitrackDryRun,  // 兼容旧前端：true=DRY_RUN，false=LIVE
        String testMailbox,       // TEST_FORWARD 模式目标邮箱
        String auditBcc           // LIVE 模式审核 BCC 邮箱
    ) {}

    // ─── 查询进程状态 ─────────────────────────────────────────────────────────

    public ProcessStatusDTO getStatus() {
        // 1. 先尝试访问 /pyapi/status（最准确）
        try {
            URL url = new URL(monitorApiUrl + "/pyapi/status");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(2000);
            conn.setReadTimeout(3000);
            conn.setRequestMethod("GET");
            int code = conn.getResponseCode();
            if (code == 200) {
                // 读取 run_mode 字段
                try (InputStream is = conn.getInputStream();
                     BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                    String body = sb.toString();
                    String runMode = extractJsonString(body, "run_mode");
                    Long pid = readPidFile();
                    return new ProcessStatusDTO(true, pid, runMode, null, "服务运行中");
                }
            }
        } catch (Exception e) {
            // FastAPI 不在线
        }

        // 2. 检查 PID 文件
        Long pid = readPidFile();
        if (pid != null) {
            boolean alive = isProcessAlive(pid);
            if (alive) {
                return new ProcessStatusDTO(true, pid, "UNKNOWN", null, "服务运行中（API 暂不可达）");
            } else {
                // PID 文件过期，清理
                deletePidFile();
            }
        }

        return new ProcessStatusDTO(false, null, null, null, "服务未运行");
    }

    // ─── 启动进程 ──────────────────────────────────────────────────────────────

    public Map<String, Object> startProcess(StartRequestDTO req) throws IOException {
        // 检查是否已在运行
        ProcessStatusDTO status = getStatus();
        if (status.running()) {
            return Map.of("ok", false, "message", "服务已在运行中（PID: " + status.pid() + "）");
        }

        // 构建命令行参数
        List<String> cmd = new ArrayList<>();
        cmd.add(pythonExecutable);
        cmd.add("-u");
        cmd.add(mainScript);

        // 运行模式参数
        String mode = req.runMode() != null ? req.runMode() : "DRY_RUN";
        if ("TEST_FORWARD".equals(mode)) {
            cmd.add("--test-forward");
        } else if ("LIVE".equals(mode)) {
            cmd.add("--forward");   // main.py 的 LIVE 模式参数是 --forward（不是 --live）
        }
        // DRY_RUN 是默认模式，不需要参数

        // 构建环境变量覆盖
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(new File(workingDir));
        pb.redirectErrorStream(false);

        // 追加日志到 logs/app.log
        File logFile = new File(workingDir, "logs/app.log");
        logFile.getParentFile().mkdirs();
        pb.redirectOutput(ProcessBuilder.Redirect.appendTo(logFile));
        pb.redirectError(ProcessBuilder.Redirect.appendTo(logFile));

        // 设置环境变量（覆盖 .env 中的值）
        Map<String, String> env = pb.environment();
        env.put("PYTHONUTF8", "1");
        env.put("PYTHONIOENCODING", "utf-8");
        env.put("NO_PROXY", "*");

        // 轮询间隔
        if (req.pollInterval() != null && req.pollInterval() > 0) {
            env.put("POLL_INTERVAL", String.valueOf(req.pollInterval()));
        }
        // CREATE_REF_MODE 独立建单模式（兼容旧版 logitrackDryRun 布尔字段）
        String effectiveCreateRefMode = null;
        if (req.createRefMode() != null && !req.createRefMode().isBlank()) {
            effectiveCreateRefMode = req.createRefMode().trim();
        } else if (req.logitrackDryRun() != null) {
            effectiveCreateRefMode = req.logitrackDryRun() ? "DRY_RUN" : "LIVE";
        }
        if (effectiveCreateRefMode != null && !effectiveCreateRefMode.isBlank()) {
            env.put("CREATE_REF_MODE", effectiveCreateRefMode);
            env.put("LOGITRACK_DRY_RUN", "LIVE".equalsIgnoreCase(effectiveCreateRefMode) ? "false" : "true");
        }
        // TEST_FORWARD 邮箱
        if (req.testMailbox() != null && !req.testMailbox().isBlank()) {
            env.put("TEST_FORWARD_MAILBOX", req.testMailbox().trim());
        }
        // LIVE_AUDIT_BCC — 审核抄送邮箱
        if (req.auditBcc() != null && !req.auditBcc().isBlank()) {
            env.put("LIVE_AUDIT_BCC", req.auditBcc().trim());
        }
        // LIVE 模式：注入非交互式确认标志（前端 LiveConfirmModal 已完成二次确认）
        if ("LIVE".equals(mode)) {
            env.put("LIVE_CONFIRMED", "true");
            env.put("LIVE_OPERATOR", "WebUI-" + java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd-HHmm")));
        }

        Process proc = pb.start();
        long pid = proc.pid();

        // 写 PID 文件
        writePidFile(pid);

        log.info("[ProcessManager] 启动 email-ai-automation: PID={} mode={} pollInterval={} createRefMode={}",
            pid, mode, req.pollInterval(), effectiveCreateRefMode);

        return Map.of(
            "ok", true,
            "pid", pid,
            "mode", mode,
            "message", "服务已启动",
            "startedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
    }

    // ─── 停止进程 ──────────────────────────────────────────────────────────────

    public Map<String, Object> stopProcess() {
        Long pid = readPidFile();

        // ── 方式 1：有 PID 文件，用 ProcessHandle 直接终止（无需外部命令）──────
        if (pid != null) {
            if (!isProcessAlive(pid)) {
                deletePidFile();
                return Map.of("ok", false, "message", "服务未在运行（PID 文件残留已清理）");
            }
            forceKillByHandle(pid);
            deletePidFile();
            boolean stopped = waitUntilDead(pid, 4000);
            if (stopped) {
                log.info("[ProcessManager] 已停止 PID={}", pid);
                return Map.of("ok", true, "pid", pid, "message", "服务已停止");
            } else {
                return Map.of("ok", false, "pid", pid,
                    "message", "进程 PID=" + pid + " 未能在 4 秒内终止，请手动处理");
            }
        }

        // ── 方式 2：无 PID 文件，通过 ProcessHandle 枚举 main.py 进程 ────────
        List<Long> pids = findProcessPids();
        if (pids.isEmpty()) {
            return Map.of("ok", false, "message", "未找到运行中的服务（无匹配 main.py 进程）");
        }
        pids.forEach(this::forceKillByHandle);
        boolean allDead = pids.stream().allMatch(p -> waitUntilDead(p, 3000));
        if (allDead) {
            log.info("[ProcessManager] 已通过进程枚举终止: PIDs={}", pids);
            return Map.of("ok", true, "pids", pids.toString(), "message", "服务已停止");
        } else {
            return Map.of("ok", false, "message", "部分进程未能终止，请手动检查");
        }
    }

    // ─── 辅助方法 ──────────────────────────────────────────────────────────────

    private Long readPidFile() {
        try {
            Path path = Paths.get(workingDir, PID_FILE);
            if (Files.exists(path)) {
                String content = Files.readString(path).trim();
                return Long.parseLong(content);
            }
        } catch (Exception e) {
            log.debug("[ProcessManager] 读取 PID 文件失败: {}", e.getMessage());
        }
        return null;
    }

    private void writePidFile(long pid) {
        try {
            Path path = Paths.get(workingDir, PID_FILE);
            Files.createDirectories(path.getParent());
            Files.writeString(path, String.valueOf(pid));
        } catch (Exception e) {
            log.warn("[ProcessManager] 写入 PID 文件失败: {}", e.getMessage());
        }
    }

    private void deletePidFile() {
        try {
            Files.deleteIfExists(Paths.get(workingDir, PID_FILE));
        } catch (Exception ignored) {}
    }

    // ─── 进程操作辅助（基于 Java 17 ProcessHandle，无需外部命令）────────────

    /** 进程是否存活（直接查询 JVM ProcessHandle 表，无需外部命令）*/
    private boolean isProcessAlive(long pid) {
        return ProcessHandle.of(pid).map(ProcessHandle::isAlive).orElse(false);
    }

    /**
     * 枚举系统全部进程，找出可执行文件名含 "python" 且命令行含 "main.py" 的进程。
     * 使用 ProcessHandle.allProcesses()，完全不依赖 PATH 或外部命令。
     */
    private List<Long> findProcessPids() {
        return ProcessHandle.allProcesses()
            .filter(ph -> {
                ProcessHandle.Info info = ph.info();
                boolean isPython = info.command()
                    .map(c -> {
                        String lower = c.toLowerCase();
                        return lower.contains("python") || lower.endsWith("py.exe");
                    })
                    .orElse(false);
                // commandLine() 在 Windows 上包含完整命令行字符串（含参数）
                boolean cmdLineMatch = info.commandLine()
                    .map(cl -> cl.contains("main.py"))
                    .orElse(false);
                // arguments() 作为备选（部分平台返回 Optional.empty）
                boolean argsMatch = info.arguments()
                    .map(args -> Arrays.stream(args).anyMatch(a -> a.endsWith("main.py")))
                    .orElse(false);
                return isPython && (cmdLineMatch || argsMatch);
            })
            .map(ProcessHandle::pid)
            .collect(Collectors.toList());
    }

    /**
     * 强制终止指定 PID 及其所有子进程。
     * 使用 ProcessHandle.destroyForcibly()，等价于 taskkill /F /T，无需外部命令。
     */
    private void forceKillByHandle(long pid) {
        ProcessHandle.of(pid).ifPresent(ph -> {
            // 先终止子进程树，再终止自身
            ph.descendants().forEach(ProcessHandle::destroyForcibly);
            ph.destroyForcibly();
            log.debug("[ProcessManager] destroyForcibly PID={}", pid);
        });
    }

    /**
     * 等待进程退出，最多等待 timeoutMs 毫秒。
     * 使用 ProcessHandle.onExit() CompletableFuture，无需轮询。
     */
    private boolean waitUntilDead(long pid, long timeoutMs) {
        Optional<ProcessHandle> opt = ProcessHandle.of(pid);
        if (opt.isEmpty()) return true;  // 进程已不存在
        try {
            opt.get().onExit().get(timeoutMs, TimeUnit.MILLISECONDS);
            return true;
        } catch (Exception e) {
            return !opt.get().isAlive();
        }
    }

    /** 简单提取 JSON 字符串字段值 */
    private String extractJsonString(String json, String key) {
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx < 0) return null;
        int colon = json.indexOf(':', idx + search.length());
        if (colon < 0) return null;
        int q1 = json.indexOf('"', colon + 1);
        if (q1 < 0) return null;
        int q2 = json.indexOf('"', q1 + 1);
        if (q2 < 0) return null;
        return json.substring(q1 + 1, q2);
    }
}
