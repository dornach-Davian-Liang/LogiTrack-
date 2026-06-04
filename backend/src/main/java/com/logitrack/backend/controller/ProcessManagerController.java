package com.logitrack.backend.controller;

import com.logitrack.backend.service.ProcessManagerService;
import com.logitrack.backend.service.ProcessManagerService.ProcessStatusDTO;
import com.logitrack.backend.service.ProcessManagerService.StartRequestDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Email AI Automation 进程管理控制器
 *
 * GET  /api/monitor/process/status  — 查询进程运行状态
 * POST /api/monitor/process/start   — 启动服务（含参数：mode/pollInterval/dryRun/testMailbox）
 * POST /api/monitor/process/stop    — 停止服务
 */
@RestController
@RequestMapping("/api/monitor/process")
@RequiredArgsConstructor
@Slf4j
public class ProcessManagerController {

    private final ProcessManagerService processManagerService;

    /**
     * GET /api/monitor/process/status
     * 查询 email-ai-automation 是否在运行
     */
    @GetMapping("/status")
    public ResponseEntity<ProcessStatusDTO> getStatus() {
        try {
            return ResponseEntity.ok(processManagerService.getStatus());
        } catch (Exception e) {
            log.error("[ProcessManager] getStatus 失败: {}", e.getMessage());
            return ResponseEntity.ok(new ProcessStatusDTO(false, null, null, null, "查询失败: " + e.getMessage()));
        }
    }

    /**
     * POST /api/monitor/process/start
     * 启动 email-ai-automation
     *
     * Body:
     * {
     *   "runMode": "TEST_FORWARD",   // DRY_RUN / TEST_FORWARD / LIVE
     *   "pollInterval": 60,          // 轮询间隔秒数（可选）
     *   "createRefMode": "DRY_RUN",  // CREATE_REF 建单模式（可选）
     *   "testMailbox": "xx@yy.com"  // TEST_FORWARD 目标邮箱（可选）
     * }
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> start(@RequestBody StartRequestDTO req) {
        try {
            log.info("[ProcessManager] 启动请求: mode={} pollInterval={} createRefMode={} testMailbox={}",
                    req.runMode(), req.pollInterval(), req.createRefMode(), req.testMailbox());
            Map<String, Object> result = processManagerService.startProcess(req);
            boolean ok = Boolean.TRUE.equals(result.get("ok"));
            return ok ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("[ProcessManager] 启动失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("ok", false, "message", e.getMessage()));
        }
    }

    /**
     * POST /api/monitor/process/stop
     * 停止 email-ai-automation
     */
    @PostMapping("/stop")
    public ResponseEntity<Map<String, Object>> stop() {
        try {
            log.info("[ProcessManager] 停止请求");
            Map<String, Object> result = processManagerService.stopProcess();
            boolean ok = Boolean.TRUE.equals(result.get("ok"));
            return ok ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("[ProcessManager] 停止失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("ok", false, "message", e.getMessage()));
        }
    }
}
