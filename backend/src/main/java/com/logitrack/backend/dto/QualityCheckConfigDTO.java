package com.logitrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 质检配置 DTO（前端读写）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QualityCheckConfigDTO {

    /** 是否启用定时质检 */
    private Boolean enabled;

    /**
     * Spring CRON 表达式（6 位）
     * 示例: "0 0 9 * * ?" = 每天 09:00
     */
    private String cronExpression;

    /** 检查最近 N 天的 AI 建单 */
    private Integer checkScopeDays;

    /** 全局通知邮箱列表 */
    private List<String> globalRecipients;

    /** 是否按路由指令分发报告 */
    private Boolean routeBasedEnabled;
}
