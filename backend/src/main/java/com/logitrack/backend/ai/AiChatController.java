package com.logitrack.backend.ai;

import com.logitrack.backend.ai.dto.ChatRequest;
import com.logitrack.backend.ai.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AI 数据分析问答 REST 接口
 *
 * POST /api/ai/chat  - 发送一条消息，返回 AI 回复
 * GET  /api/ai/ping  - 健康检查
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiChatController {

    private final AiChatService aiChatService;

    /**
     * 健康检查端点
     */
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("AI Chat Service is running");
    }

    /**
     * 发送一条问答消息
     *
     * 请求体示例：
     * {
     *   "message": "本月询价量是多少？",
     *   "history": [
     *     {"role": "user",      "content": "你好"},
     *     {"role": "assistant", "content": "您好！有什么数据问题需要分析？"}
     *   ]
     * }
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        log.info("AI chat request: message={}, historyLen={}",
                request.getMessage(),
                request.getHistory() == null ? 0 : request.getHistory().size());

        if (request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ChatResponse.builder().error("消息不能为空").build());
        }

        ChatResponse response = aiChatService.chat(request);
        return ResponseEntity.ok(response);
    }
}
