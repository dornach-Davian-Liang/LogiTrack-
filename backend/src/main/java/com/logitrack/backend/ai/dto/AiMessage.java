package com.logitrack.backend.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 对话历史消息，role: "user" | "assistant"
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMessage {

    /** user / assistant / system / tool */
    private String role;

    /** 消息内容 */
    private String content;
}
