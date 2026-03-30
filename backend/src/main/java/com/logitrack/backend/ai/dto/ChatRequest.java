package com.logitrack.backend.ai.dto;

import lombok.Data;
import java.util.List;

/**
 * AI 对话请求 DTO
 */
@Data
public class ChatRequest {

    /** 本轮用户消息 */
    private String message;

    /** 历史消息（可选），实现多轮对话上下文 */
    private List<AiMessage> history;
}
