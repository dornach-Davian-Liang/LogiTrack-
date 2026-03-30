package com.logitrack.backend.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 对话响应 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {

    /** AI 生成的自然语言回复 */
    private String reply;

    /** 本轮调用的分析函数名（调试用，可选） */
    private String functionCalled;

    /** 聚合数据原始 JSON 字符串（可选，供前端渲染图表） */
    private String chartData;

    /** 建议的后续问题 */
    private java.util.List<String> suggestions;

    /** 错误信息（正常流程为 null） */
    private String error;
}
