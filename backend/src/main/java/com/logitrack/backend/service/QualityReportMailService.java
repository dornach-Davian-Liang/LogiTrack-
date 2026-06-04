package com.logitrack.backend.service;

import com.logitrack.backend.dto.QualityCheckResultDTO;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据质检报告邮件发送服务
 * 构建 HTML 邮件报告并通过 Spring Mail 发送。
 * JavaMailSender 未配置时降级为通过 Python 服务的 Graph API 发送。
 */
@Service
@Slf4j
public class QualityReportMailService {

    /** JavaMailSender 未配置时为 null，降级到 Python Graph API */
    @Autowired(required = false)
    private JavaMailSender mailSender;

    /** SMTP 用户名：为空则认为 SMTP 未配置，使用 Python Graph API */
    @Value("${spring.mail.username:}")
    private String mailUsername;

    /** Python Email AI 服务地址（用于 Graph API 邮件降级发送） */
    @Value("${emailai.monitor.api.url:http://127.0.0.1:5100}")
    private String pythonApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${quality.mail.from:noreply-logitrack@zieglergroup.cn}")
    private String mailFrom;

    private static final DateTimeFormatter DATE_FMT     = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // ======================================================================
    // 对外发送接口
    // ======================================================================

    /**
     * 发送全局质检报告给所有全局收件人。
     *
     * @return 实际成功发送的收件人数量
     */
    public int sendGlobalReport(List<String> recipients,
                                List<QualityCheckResultDTO> results,
                                Map<String, Integer> fieldStats,
                                int scopeDays) {
        if (recipients == null || recipients.isEmpty()) {
            log.info("[QualityMail] No global recipients, skip.");
            return 0;
        }
        long incompleteCount = results.stream()
            .filter(r -> !Boolean.TRUE.equals(r.getIsComplete()) && !Boolean.TRUE.equals(r.getVerified()))
            .count();
        if (incompleteCount == 0) {
            log.info("[QualityMail] No incomplete records, skip global report.");
            return 0;
        }
        String subject = String.format("[LogiTrack 数据质检] %s — %d/%d 条记录缺失必填字段",
            LocalDate.now().format(DATE_FMT), incompleteCount, results.size());
        String html = buildGlobalHtml(results, fieldStats, scopeDays);
        int sent = 0;
        for (String recipient : recipients) {
            try {
                sendHtmlMail(recipient, subject, html);
                sent++;
            } catch (Exception e) {
                log.error("[QualityMail] Failed to send global report to {}: {}", recipient, e.getMessage());
            }
        }
        log.info("[QualityMail] Global report sent to {}/{} recipients.", sent, recipients.size());
        return sent;
    }

    /**
     * 按路由分发报告：每个收件人只收到与自己相关的数据。
     *
     * @param grouped groupByRouteRecipient() 的分组结果
     * @return 实际成功发送的收件人数量
     */
    public int sendRouteBasedReports(Map<String, List<QualityCheckResultDTO>> grouped) {
        if (grouped == null || grouped.isEmpty()) return 0;
        int sent = 0;
        for (Map.Entry<String, List<QualityCheckResultDTO>> entry : grouped.entrySet()) {
            String recipient = entry.getKey();
            List<QualityCheckResultDTO> recipientResults = entry.getValue();
            if (recipientResults.isEmpty()) continue;
            String subject = String.format("[LogiTrack] 您负责的 %d 条 AI 建单需补充数据 — %s",
                recipientResults.size(), LocalDate.now().format(DATE_FMT));
            String html = buildRouteHtml(recipient, recipientResults);
            try {
                sendHtmlMail(recipient, subject, html);
                sent++;
            } catch (Exception e) {
                log.error("[QualityMail] Failed to send route report to {}: {}", recipient, e.getMessage());
            }
        }
        log.info("[QualityMail] Route-based reports sent to {} recipients.", sent);
        return sent;
    }

    // ======================================================================
    // HTML 报告构建（public，Controller 预览时也可调用）
    // ======================================================================

    /** 构建全局质检报告 HTML（含统计卡片 + 字段热力图 + 详细表格） */
    public String buildGlobalHtml(List<QualityCheckResultDTO> results,
                                  Map<String, Integer> fieldStats,
                                  int scopeDays) {
        long total = results.size();
        long incomplete = results.stream()
            .filter(r -> !Boolean.TRUE.equals(r.getIsComplete()) && !Boolean.TRUE.equals(r.getVerified()))
            .count();
        long complete = total - incomplete;
        String rateStr = total > 0
            ? String.format("%.1f%%", complete * 100.0 / total) : "N/A";
        String rateColor = (total > 0 && complete * 100.0 / total >= 80) ? "#16a34a" : "#d97706";

        StringBuilder sb = new StringBuilder();
        appendHtmlHeader(sb);

        // --- 报告标题 ---
        sb.append("<h2 style='color:#1e40af;margin:0 0 8px 0;'>")
          .append("&#128202; LogiTrack Pro &mdash; AI 建单数据质检报告</h2>");
        sb.append("<p style='color:#6b7280;margin:0 0 24px 0;font-size:13px;'>")
          .append("执行时间: ").append(LocalDateTime.now().format(DATETIME_FMT))
          .append(" &nbsp;|&nbsp; 检查范围: 最近 ").append(scopeDays).append(" 天 AI 自动创建询价单")
          .append("</p>");

        // --- 统计卡片（4 列）---
        sb.append("<table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:28px;'>")
          .append("<tr>");
        appendStatCard(sb, "总检查",   String.valueOf(total),    "#1e40af");
        appendStatCard(sb, "字段完整", String.valueOf(complete), "#16a34a");
        appendStatCard(sb, "&#9888; 有缺失", String.valueOf(incomplete), "#dc2626");
        appendStatCard(sb, "完整率",   rateStr, rateColor);
        sb.append("</tr></table>");

        // --- 字段缺失统计 ---
        if (fieldStats != null) {
            long statsTotal = fieldStats.values().stream().anyMatch(v -> v > 0) ? total : 0;
            if (statsTotal > 0) {
                sb.append("<h3 style='color:#374151;margin:0 0 10px 0;font-size:15px;'>")
                  .append("字段缺失统计</h3>");
                sb.append("<table width='100%' cellpadding='0' cellspacing='0' ")
                  .append("style='background:#f9fafb;border-radius:6px;margin-bottom:28px;'>")
                  .append("<tbody>");
                fieldStats.entrySet().stream()
                    .filter(e -> e.getValue() > 0)
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                    .forEach(entry -> {
                        String label = DataQualityCheckService.FIELD_LABELS
                            .getOrDefault(entry.getKey(), entry.getKey());
                        double pct = entry.getValue() * 100.0 / total;
                        String barColor = pct > 80 ? "#dc2626" : pct > 40 ? "#d97706" : "#2563eb";
                        int barWidth = (int) Math.min(pct, 100);
                        sb.append("<tr style='border-bottom:1px solid #e5e7eb;'>")
                          .append("<td style='padding:8px 14px;color:#6b7280;white-space:nowrap;width:160px;'>")
                          .append(escapeHtml(label)).append("</td>")
                          .append("<td style='padding:8px 14px;width:200px;'>")
                          .append("<div style='background:#e5e7eb;border-radius:4px;height:10px;'>")
                          .append("<div style='width:").append(barWidth).append("%;background:")
                          .append(barColor).append(";height:10px;border-radius:4px;'></div></div></td>")
                          .append("<td style='padding:8px 14px;font-weight:600;color:")
                          .append(barColor).append(";white-space:nowrap;'>")
                          .append(entry.getValue()).append("/").append(total)
                          .append(" (").append(String.format("%.0f%%", pct)).append(")</td>")
                          .append("</tr>");
                    });
                sb.append("</tbody></table>");
            }
        }

        // --- 详细缺失记录表格 ---
        List<QualityCheckResultDTO> incompleteList = results.stream()
            .filter(r -> !Boolean.TRUE.equals(r.getIsComplete()) && !Boolean.TRUE.equals(r.getVerified()))
            .toList();
        if (!incompleteList.isEmpty()) {
            sb.append("<h3 style='color:#374151;margin:0 0 10px 0;font-size:15px;'>")
              .append("详细缺失记录（").append(incompleteList.size()).append(" 条）</h3>");
            sb.append("<table width='100%' cellpadding='0' cellspacing='0' ")
              .append("style='border-collapse:collapse;border-radius:6px;overflow:hidden;'>")
              .append("<thead><tr style='background:#1e40af;color:white;'>")
              .append("<th style='padding:10px 12px;text-align:left;white-space:nowrap;'>REF</th>")
              .append("<th style='padding:10px 12px;text-align:left;'>缺失字段</th>")
              .append("<th style='padding:10px 12px;text-align:left;white-space:nowrap;'>路由收件人</th>")
              .append("<th style='padding:10px 12px;text-align:left;'>邮件主题</th>")
              .append("</tr></thead><tbody>");
            for (int i = 0; i < incompleteList.size(); i++) {
                QualityCheckResultDTO r = incompleteList.get(i);
                String rowBg = i % 2 == 0 ? "#ffffff" : "#f9fafb";
                String routeDisplay = r.getRouteRecipients().isEmpty()
                    ? "<span style='color:#9ca3af;'>—</span>"
                    : r.getRouteRecipients().stream()
                        .map(e -> "<span style='color:#4b5563;font-size:12px;'>" + e.split("@")[0] + "</span>")
                        .reduce((a, b) -> a + ", " + b).orElse("—");
                String subj = truncate(r.getEmailSubject(), 55);
                sb.append("<tr style='background:").append(rowBg)
                  .append(";border-bottom:1px solid #e5e7eb;'>")
                  .append("<td style='padding:9px 12px;font-weight:700;color:#1e40af;white-space:nowrap;'>")
                  .append(escapeHtml(r.getRefNumber())).append("</td>")
                  .append("<td style='padding:9px 12px;'>").append(buildFieldBadges(r.getMissingFields())).append("</td>")
                  .append("<td style='padding:9px 12px;'>").append(routeDisplay).append("</td>")
                  .append("<td style='padding:9px 12px;color:#374151;font-size:13px;'>")
                  .append(escapeHtml(subj)).append("</td>")
                  .append("</tr>");
            }
            sb.append("</tbody></table>");
        }

        appendHtmlFooter(sb);
        return sb.toString();
    }

    /** 构建路由分发报告 HTML（只含该收件人负责的数据） */
    public String buildRouteHtml(String recipientEmail,
                                 List<QualityCheckResultDTO> results) {
        String firstName = extractDisplayName(recipientEmail);
        StringBuilder sb = new StringBuilder();
        appendHtmlHeader(sb);

        sb.append("<h2 style='color:#1e40af;margin:0 0 8px 0;'>Hi ").append(firstName).append(",</h2>");
        sb.append("<p style='color:#374151;margin:0 0 20px 0;'>")
          .append("以下由 AI 自动创建的询价单有必填字段缺失，请及时补充：</p>");

        sb.append("<table width='100%' cellpadding='0' cellspacing='0' ")
          .append("style='border-collapse:collapse;border-radius:6px;overflow:hidden;'>")
          .append("<thead><tr style='background:#1e40af;color:white;'>")
          .append("<th style='padding:10px 12px;text-align:left;white-space:nowrap;'>REF</th>")
          .append("<th style='padding:10px 12px;text-align:left;'>缺失字段</th>")
          .append("<th style='padding:10px 12px;text-align:left;'>原始邮件主题</th>")
          .append("</tr></thead><tbody>");
        for (int i = 0; i < results.size(); i++) {
            QualityCheckResultDTO r = results.get(i);
            String rowBg = i % 2 == 0 ? "#ffffff" : "#f9fafb";
            String subj = truncate(r.getEmailSubject(), 65);
            sb.append("<tr style='background:").append(rowBg)
              .append(";border-bottom:1px solid #e5e7eb;'>")
              .append("<td style='padding:9px 12px;font-weight:700;color:#1e40af;white-space:nowrap;'>")
              .append(escapeHtml(r.getRefNumber())).append("</td>")
              .append("<td style='padding:9px 12px;'>").append(buildFieldBadges(r.getMissingFields())).append("</td>")
              .append("<td style='padding:9px 12px;color:#374151;font-size:13px;'>")
              .append(escapeHtml(subj)).append("</td>")
              .append("</tr>");
        }
        sb.append("</tbody></table>");

        sb.append("<p style='color:#6b7280;margin:24px 0 0 0;font-size:13px;'>")
          .append("请登录 LogiTrack Pro 搜索对应 REF 号进行补充。</p>");
        appendHtmlFooter(sb);
        return sb.toString();
    }

    // ======================================================================
    // 私有辅助方法
    // ======================================================================

    private void sendHtmlMail(String to, String subject, String htmlBody) throws Exception {
        if (mailSender != null && mailUsername != null && !mailUsername.isBlank()) {
            // SMTP 已配置：优先使用 SMTP 发送
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(msg);
            log.info("[QualityMail] SMTP sent -> {} | {}", to, subject);
        } else {
            // 降级：通过 Python Graph API 发送
            log.info("[QualityMail] SMTP not configured, delegating to Python Graph API -> {}", to);
            String url = pythonApiUrl + "/pyapi/internal/send-email";
            Map<String, String> payload = new HashMap<>();
            payload.put("to", to);
            payload.put("subject", subject);
            payload.put("body_html", htmlBody);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(payload, headers);
            try {
                restTemplate.postForObject(url, request, Map.class);
                log.info("[QualityMail] Graph API sent -> {} | {}", to, subject);
            } catch (Exception e) {
                log.error("[QualityMail] Graph API send failed to {}: {}", to, e.getMessage());
                throw e;
            }
        }
    }

    private void appendHtmlHeader(StringBuilder sb) {
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>")
          .append("<meta name='viewport' content='width=device-width,initial-scale=1.0'>")
          .append("</head>")
          .append("<body style='font-family:Arial,Helvetica,sans-serif;font-size:14px;")
          .append("color:#374151;background:#f3f4f6;margin:0;padding:20px;'>")
          .append("<div style='max-width:860px;margin:0 auto;background:#ffffff;")
          .append("border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);padding:32px;'>");
    }

    private void appendHtmlFooter(StringBuilder sb) {
        sb.append("<hr style='border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px 0;'>")
          .append("<p style='color:#9ca3af;font-size:12px;margin:0;'>")
          .append("此报告由 LogiTrack Pro 系统自动生成，请勿直接回复本邮件。")
          .append("</p></div></body></html>");
    }

    private void appendStatCard(StringBuilder sb, String label, String value, String color) {
        sb.append("<td width='25%' style='padding:0 6px 0 0;'>")
          .append("<div style='background:#f9fafb;border-left:4px solid ").append(color)
          .append(";padding:14px 16px;border-radius:4px;'>")
          .append("<div style='font-size:26px;font-weight:700;color:").append(color).append(";'>")
          .append(value).append("</div>")
          .append("<div style='font-size:12px;color:#6b7280;margin-top:4px;'>").append(label).append("</div>")
          .append("</div></td>");
    }

    private String buildFieldBadges(List<String> missingFields) {
        if (missingFields == null || missingFields.isEmpty()) {
            return "<span style='color:#16a34a;font-size:13px;'>&#10003; 完整</span>";
        }
        StringBuilder sb = new StringBuilder();
        for (String key : missingFields) {
            String label = DataQualityCheckService.FIELD_LABELS.getOrDefault(key, key);
            sb.append("<span style='display:inline-block;background:#fee2e2;color:#dc2626;")
              .append("font-size:11px;padding:2px 8px;border-radius:9999px;margin:1px 2px 1px 0;")
              .append("white-space:nowrap;'>")
              .append(escapeHtml(label)).append("</span>");
        }
        return sb.toString();
    }

    private String extractDisplayName(String email) {
        if (email == null || email.isBlank()) return "Team";
        String local = email.split("@")[0];
        // 格式如 "hkg.cyip" 取最后一段；"firstname.lastname" 取第一段
        String[] parts = local.split("[._-]");
        String name = parts.length > 1 ? parts[parts.length - 1] : parts[0];
        return name.isEmpty() ? "Team" : Character.toUpperCase(name.charAt(0)) + name.substring(1);
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "—";
        return s.length() > maxLen ? s.substring(0, maxLen) + "…" : s;
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }
}
