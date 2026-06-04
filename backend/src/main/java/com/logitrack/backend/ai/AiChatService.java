package com.logitrack.backend.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.logitrack.backend.ai.dto.AiMessage;
import com.logitrack.backend.ai.dto.ChatRequest;
import com.logitrack.backend.ai.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * AI 问答主服务
 *
 * 支持 Provider：
 *   - deepseek (默认，OpenAI 兼容格式, 端点: https://api.deepseek.com/chat/completions)
 *   - claude   (Anthropic 格式, 端点: https://api.anthropic.com/v1/messages)
 *
 * 工作流：
 *   1. 接收用户消息 + 历史上下文
 *   2. 携带 tool definitions 调用 AI
 *   3. 若 AI 返回 tool_call → 执行 AiAnalysisFunctions → 将结果回传 AI
 *   4. AI 生成最终自然语言回答
 *   5. 附带建议问题列表返回前端
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

    private final AiAnalysisFunctions analysisFunctions;
    private final ObjectMapper objectMapper;

    @Value("${ai.provider:deepseek}")
    private String provider;

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.model:deepseek-chat}")
    private String model;

    @Value("${ai.endpoint:https://api.deepseek.com/chat/completions}")
    private String endpoint;

    private static final int MAX_TOOL_CALL_ROUNDS = 3;

    // ==========================================
    // 系统 Prompt
    // ==========================================

    private String buildSystemPrompt() {
        String today = LocalDate.now().toString();
        String currentMonth = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        return String.format("""
你是 LogiTrack Pro 物流管理系统的 AI 数据分析助手。你的职责是基于询价（Enquiry）数据，用简洁专业的中文回答用户的数据分析问题。

当前日期：%s
当前月份：%s
系统数据范围：2025-01-01 至今（%s）

你能分析以下维度：
- 询价量总览（按月/按季度）
- 询价到订舱的转化率
- 货运类型（FCL/LCL/AIR/RAIL）分布
- 目的地国家/大区排名
- CN 各办公室绩效对比
- 多时期对比（MoM/QoQ）
- 多维度交叉分析（如：FCL货物各办公室转化率、欧洲目的地各货运类型占比）
- 产品类型分布
- CORE vs NON-CORE 对比

回答要求：
1. 用数据说话，引用具体数字
2. 在数字后给出业务洞察或建议
3. 回答结构化，可用简短的 Markdown 列表
4. 如数据量不足（0条记录），明确告知用户并建议扩大时间范围
5. 不要猜测或编造数字，所有数据均来自工具调用结果
6. 【时间边界】系统从 2025 年起开始记录数据。如用户询问的时间段晚于当前日期（%s），
   或早于 2025-01-01，请直接回复"该时间段暂无数据（系统记录范围：2025-01-01 至今）"，
   不要调用任何工具函数。
7. 【禁止预测】不得给出未来询价量/转化率的具体预测数字。如需参考，
   可调用 get_monthly_trend 展示历史趋势，并明确标注"以下为历史数据，非预测值"。
8. 【按客户查询】系统工具不支持按具体客户名称过滤，如用户询问某客户的数据，
   请回复"当前数据视图不支持按客户名称查询，可改为按办公室/货运类型/时间维度分析"。
""", today, currentMonth, today, today);
    }

    // ==========================================
    // 主入口
    // ==========================================

    /**
     * 处理一轮对话
     */
    public ChatResponse chat(ChatRequest request) {
        try {
            if ("claude".equalsIgnoreCase(provider)) {
                return chatWithClaude(request);
            } else {
                return chatWithOpenAiCompatible(request);
            }
        } catch (Exception e) {
            log.error("AI chat error: {}", e.getMessage(), e);
            return ChatResponse.builder()
                    .error("AI 服务暂时不可用，请稍后再试：" + e.getMessage())
                    .reply("抱歉，AI 服务出现问题，请稍后重试。")
                    .build();
        }
    }

    // ==========================================
    // OpenAI-Compatible Provider (DeepSeek / OpenAI)
    // ==========================================

    private ChatResponse chatWithOpenAiCompatible(ChatRequest request) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();

        // 构建消息列表
        List<ObjectNode> messages = new ArrayList<>();

        // 系统提示
        ObjectNode sysMsg = objectMapper.createObjectNode();
        sysMsg.put("role", "system");
        sysMsg.put("content", buildSystemPrompt());
        messages.add(sysMsg);

        // 历史消息
        if (request.getHistory() != null) {
            for (AiMessage h : request.getHistory()) {
                ObjectNode histMsg = objectMapper.createObjectNode();
                histMsg.put("role", h.getRole());
                histMsg.put("content", h.getContent());
                messages.add(histMsg);
            }
        }

        // 当前用户消息
        ObjectNode userMsg = objectMapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", request.getMessage());
        messages.add(userMsg);

        // 工具定义
        JsonNode toolsNode = objectMapper.readTree(AiAnalysisFunctions.getToolsSchema());

        // Function calling 循环（最多 MAX_TOOL_CALL_ROUNDS 轮）
        String functionCalled = null;
        String chartData = null;

        for (int round = 0; round < MAX_TOOL_CALL_ROUNDS; round++) {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.set("messages", objectMapper.valueToTree(messages));
            body.set("tools", toolsNode);
            body.put("tool_choice", "auto");
            body.put("max_tokens", 2000);
            body.put("temperature", 0.3);

            String responseJson = callHttpApi(client, endpoint, body.toString(), buildOpenAiHeaders());
            JsonNode responseNode = objectMapper.readTree(responseJson);

            JsonNode choice = responseNode.path("choices").get(0);
            if (choice == null) {
                log.error("No choices in AI response: {}", responseJson);
                break;
            }

            JsonNode message = choice.path("message");
            String finishReason = choice.path("finish_reason").asText();

            // 将 assistant 消息加回对话
            messages.add((ObjectNode) message.deepCopy());

            if ("tool_calls".equals(finishReason) || message.has("tool_calls")) {
                // 处理工具调用
                JsonNode toolCalls = message.path("tool_calls");
                for (JsonNode toolCall : toolCalls) {
                    String toolCallId = toolCall.path("id").asText();
                    String funcName = toolCall.path("function").path("name").asText();
                    String funcArgs = toolCall.path("function").path("arguments").asText();

                    log.info("AI calls function: {} with args: {}", funcName, funcArgs);
                    functionCalled = funcName;

                    // 执行分析函数
                    Map<String, Object> funcResult = analysisFunctions.call(funcName, funcArgs);
                    chartData = objectMapper.writeValueAsString(funcResult);

                    // 将工具结果加回对话
                    ObjectNode toolResultMsg = objectMapper.createObjectNode();
                    toolResultMsg.put("role", "tool");
                    toolResultMsg.put("tool_call_id", toolCallId);
                    toolResultMsg.put("content", chartData);
                    messages.add(toolResultMsg);
                }
                // 继续循环，让 AI 生成最终回答
            } else {
                // 最终文本回答
                String reply = message.path("content").asText();
                return ChatResponse.builder()
                        .reply(reply)
                        .functionCalled(functionCalled)
                        .chartData(chartData)
                        .suggestions(buildSuggestions(request.getMessage()))
                        .build();
            }
        }

        return ChatResponse.builder()
                .reply("数据分析完成，但生成回答时发生异常，请重试。")
                .functionCalled(functionCalled)
                .chartData(chartData)
                .build();
    }

    // ==========================================
    // Claude (Anthropic) Provider
    // ==========================================

    private ChatResponse chatWithClaude(ChatRequest request) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();

        // 构建 Anthropic messages 格式
        ArrayNode messages = objectMapper.createArrayNode();

        // 历史消息
        if (request.getHistory() != null) {
            for (AiMessage h : request.getHistory()) {
                // Claude 只支持 user 和 assistant 角色（tool 结果用 user 角色包裹）
                if ("user".equals(h.getRole()) || "assistant".equals(h.getRole())) {
                    ObjectNode histMsg = objectMapper.createObjectNode();
                    histMsg.put("role", h.getRole());
                    histMsg.put("content", h.getContent());
                    messages.add(histMsg);
                }
            }
        }

        // 当前用户消息
        ObjectNode userMsg = objectMapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", request.getMessage());
        messages.add(userMsg);

        // Claude Tools 定义（转换 OpenAI 格式为 Anthropic 格式）
        ArrayNode claudeTools = buildClaudeTools();

        String functionCalled = null;
        String chartData = null;

        for (int round = 0; round < MAX_TOOL_CALL_ROUNDS; round++) {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.put("max_tokens", 2000);
            body.set("system", objectMapper.getNodeFactory().textNode(buildSystemPrompt()));
            body.set("messages", messages);
            body.set("tools", claudeTools);

            String responseJson = callHttpApi(client, endpoint, body.toString(), buildClaudeHeaders());
            JsonNode responseNode = objectMapper.readTree(responseJson);

            String stopReason = responseNode.path("stop_reason").asText();
            JsonNode contentArray = responseNode.path("content");

            // 将 assistant 回复加到对话
            ObjectNode assistantMsg = objectMapper.createObjectNode();
            assistantMsg.put("role", "assistant");
            assistantMsg.set("content", contentArray);
            messages.add(assistantMsg);

            if ("tool_use".equals(stopReason)) {
                // 处理 tool_use blocks
                ArrayNode toolResults = objectMapper.createArrayNode();
                for (JsonNode block : contentArray) {
                    if ("tool_use".equals(block.path("type").asText())) {
                        String toolUseId = block.path("id").asText();
                        String funcName = block.path("name").asText();
                        String funcArgs = block.path("input").toString();

                        log.info("Claude calls function: {} with args: {}", funcName, funcArgs);
                        functionCalled = funcName;

                        Map<String, Object> funcResult = analysisFunctions.call(funcName, funcArgs);
                        chartData = objectMapper.writeValueAsString(funcResult);

                        ObjectNode toolResult = objectMapper.createObjectNode();
                        toolResult.put("type", "tool_result");
                        toolResult.put("tool_use_id", toolUseId);
                        toolResult.put("content", chartData);
                        toolResults.add(toolResult);
                    }
                }

                // 将 tool results 以 user 消息角色回传
                ObjectNode toolResultMsg = objectMapper.createObjectNode();
                toolResultMsg.put("role", "user");
                toolResultMsg.set("content", toolResults);
                messages.add(toolResultMsg);

            } else {
                // 最终文本结果
                StringBuilder sb = new StringBuilder();
                for (JsonNode block : contentArray) {
                    if ("text".equals(block.path("type").asText())) {
                        sb.append(block.path("text").asText());
                    }
                }
                return ChatResponse.builder()
                        .reply(sb.toString())
                        .functionCalled(functionCalled)
                        .chartData(chartData)
                        .suggestions(buildSuggestions(request.getMessage()))
                        .build();
            }
        }

        return ChatResponse.builder()
                .reply("数据分析完成，但生成回答时发生异常，请重试。")
                .functionCalled(functionCalled)
                .chartData(chartData)
                .build();
    }

    // ==========================================
    // 工具方法
    // ==========================================

    private String callHttpApi(HttpClient client, String url, String body, Map<String, String> headers)
            throws Exception {
        var reqBuilder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofString(body));

        headers.forEach(reqBuilder::header);
        reqBuilder.header("Content-Type", "application/json");

        HttpResponse<String> response = client.send(reqBuilder.build(),
                HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("AI API error {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("AI API returned " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }

    private Map<String, String> buildOpenAiHeaders() {
        return Map.of("Authorization", "Bearer " + apiKey);
    }

    private Map<String, String> buildClaudeHeaders() {
        return Map.of(
                "x-api-key", apiKey,
                "anthropic-version", "2023-06-01"
        );
    }

    /**
     * 将 OpenAI tool schema 转换为 Anthropic tool schema
     */
    private ArrayNode buildClaudeTools() throws Exception {
        ArrayNode openAiTools = (ArrayNode) objectMapper.readTree(AiAnalysisFunctions.getToolsSchema());
        ArrayNode claudeTools = objectMapper.createArrayNode();
        for (JsonNode tool : openAiTools) {
            JsonNode func = tool.path("function");
            ObjectNode claudeTool = objectMapper.createObjectNode();
            claudeTool.put("name", func.path("name").asText());
            claudeTool.put("description", func.path("description").asText());
            claudeTool.set("input_schema", func.path("parameters").deepCopy());
            claudeTools.add(claudeTool);
        }
        return claudeTools;
    }

    /**
     * 根据当前问题生成建议的后续问题
     */
    private List<String> buildSuggestions(String currentQuestion) {
        String q = currentQuestion == null ? "" : currentQuestion.toLowerCase();

        if (q.contains("趋势") || q.contains("月") || q.contains("trend")) {
            return List.of(
                    "各 CN 办公室本期表现如何？",
                    "FCL 和 LCL 的询价量占比是多少？",
                    "CORE 与 NON-CORE 转化率对比"
            );
        } else if (q.contains("转化") || q.contains("订舱") || q.contains("conversion")) {
            return List.of(
                    "哪个办公室转化率最高？",
                    "近 6 个月询价量趋势如何？",
                    "各货运类型转化率对比"
            );
        } else if (q.contains("目的") || q.contains("国家") || q.contains("country")) {
            return List.of(
                    "本月询价总量是多少？",
                    "AIR 产品主要目的地有哪些？",
                    "各 CN 办公室绩效对比"
            );
        } else {
            return List.of(
                    "本月询价总量与上月对比如何？",
                    "最近 6 个月转化率趋势",
                    "各 CN 办公室绩效对比",
                    "FCL/LCL/AIR 占比分布"
            );
        }
    }
}
