import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, RefreshCw, Sparkles, MessageCircle } from 'lucide-react';
import { aiApi, AiMessage } from '../../services/aiApi';
import { MessageBubble } from './MessageBubble';
import type { DashboardFilterParams } from '../../types';

type DisplayMessage = AiMessage & {
  chartData?: string;
  functionCalled?: string;
  isLoading?: boolean;
};

const WELCOME_MESSAGE: DisplayMessage = {
  role: 'assistant',
  content: `👋 您好！我是 **ZAsia Pricing AI 数据助手**。

我可以帮您分析询价业务数据，例如：
- 本月询价量与上月对比
- FCL / LCL / AIR 占比分布
- 各 CN 办公室转化率排名
- 多月趋势分析
- CORE vs NON-CORE 对比

请直接提问，或点击下方快捷问题开始分析 👇`,
};

const QUICK_QUESTIONS = [
  '本月询价总量是多少？',
  '近 6 个月询价量趋势如何？',
  '各 CN 办公室转化率对比',
  'FCL/LCL/AIR 询价占比分析',
  'CORE 与 NON-CORE 询价对比',
  '按货运类型对比转化率',
];

interface AIChatPanelProps {
  /** 点击「前往报表详情」时的导航回调 */
  onNavigateToDashboard?: (filter: Partial<DashboardFilterParams>) => void;
}

/**
 * AI 数据分析问答主面板
 */
export const AIChatPanel: React.FC<AIChatPanelProps> = ({ onNavigateToDashboard }) => {
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 检查 AI 服务可用性
  useEffect(() => {
    aiApi.ping().then(ok => setIsApiAvailable(ok));
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 构建历史上下文（不含 welcome 或 loading 消息）
  const buildHistory = useCallback((): AiMessage[] => {
    return messages
      .filter(m => !m.isLoading && m.content !== WELCOME_MESSAGE.content)
      .map(m => ({ role: m.role, content: m.content }));
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // 添加用户消息
    const userMsg: DisplayMessage = { role: 'user', content: trimmed };
    const loadingMsg: DisplayMessage = { role: 'assistant', content: '', isLoading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiApi.chat({
        message: trimmed,
        history: buildHistory(),
      });

      // 移除 loading，添加真实回复
      setMessages(prev => {
        const withoutLoading = prev.filter(m => !m.isLoading);
        const assistantMsg: DisplayMessage = {
          role: 'assistant',
          content: response.error
            ? `❗ ${response.error}`
            : response.reply || '抱歉，没有收到有效回复，请重试。',
          chartData: response.chartData,
          functionCalled: response.functionCalled,
        };

        // 如果有建议问题，附加到底部（作为特殊内容）
        const suggestions = response.suggestions;
        if (suggestions && suggestions.length > 0 && !response.error) {
          const suggestionContent = '\n\n---\n💡 **相关问题**\n' +
            suggestions.map(s => `- ${s}`).join('\n');
          assistantMsg.content += suggestionContent;
        }

        return [...withoutLoading, assistantMsg];
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => {
        const withoutLoading = prev.filter(m => !m.isLoading);
        return [...withoutLoading, {
          role: 'assistant',
          content: `❗ 请求失败：${errMsg}\n\n请检查 AI 服务配置（API Key 是否正确）。`,
        }];
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, buildHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── 顶部栏 ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">AI 数据分析助手</h2>
            <p className="text-xs text-gray-500">基于询价数据的智能问答</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* API 状态指示 */}
          {isApiAvailable !== null && (
            <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
              isApiAvailable
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isApiAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {isApiAvailable ? 'AI 已就绪' : 'AI 未连接'}
            </span>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={13} />
            清空对话
          </button>
        </div>
      </div>

      {/* ── 消息列表 ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            onNavigate={msg.chartData && onNavigateToDashboard
              ? () => {
                  const filter = buildDashboardFilter(msg.chartData!, msg.functionCalled);
                  onNavigateToDashboard(filter);
                }
              : undefined
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── 快捷问题 ── */}
      {messages.length <= 1 && (
        <div className="px-6 pb-3 flex-shrink-0">
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <MessageCircle size={11} />
            快捷问题
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
                className="text-xs bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 text-gray-600 px-3 py-1.5 rounded-full transition-colors shadow-sm disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 输入框 ── */}
      <div className="px-6 pb-5 flex-shrink-0">
        <div className="flex items-end gap-3 bg-white border border-gray-300 rounded-2xl shadow-sm focus-within:border-blue-400 focus-within:shadow-md transition-all px-4 py-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入问题... (Enter 发送，Shift+Enter 换行)"
            disabled={isLoading}
            rows={1}
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none disabled:opacity-60 min-h-[24px] max-h-32"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
          >
            {isLoading
              ? <RefreshCw size={15} className="animate-spin" />
              : <Send size={15} />
            }
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 text-center">
          AI 仅接收聚合统计数据，不处理原始询价记录，保障数据安全
        </p>
      </div>
    </div>
  );
};

export default AIChatPanel;

// ──────────────────────────────────────────
// 从 chartData 提取 DashboardFilterParams
// ──────────────────────────────────────────
function buildDashboardFilter(
  chartData: string,
  functionCalled?: string,
): Partial<DashboardFilterParams> {
  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStart = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    .toISOString().split('T')[0];

  try {
    const data: Record<string, unknown> = JSON.parse(chartData);

    // 月度趋势：取第一个月到最后一个月
    if (Array.isArray(data.trend) && (data.trend as unknown[]).length > 0) {
      const months = (data.trend as Record<string, string>[]).map(r => r.month);
      const first = months[0];
      const last = months[months.length - 1];
      if (first && last) {
        const [fy, fm] = first.split('-').map(Number);
        const [ly, lm] = last.split('-').map(Number);
        const startDate = `${fy}-${String(fm).padStart(2, '0')}-01`;
        const endEnd = new Date(ly, lm, 0);  // last day of last month
        const endDate = endEnd.toISOString().split('T')[0];
        return { startDate, endDate };
      }
    }

    // 期间对比：取最早和最晚 period
    if (Array.isArray(data.periods) && (data.periods as unknown[]).length > 0) {
      const periods = (data.periods as Record<string, string>[]).map(r => r.period);
      const monthPeriod = periods.find(p => /^\d{4}-\d{2}$/.test(p));
      if (monthPeriod) {
        const first = periods[0];
        const last = periods[periods.length - 1];
        const [fy, fm] = first.split('-').map(Number);
        const [ly, lm] = last.split('-').map(Number);
        return {
          startDate: `${fy}-${String(fm).padStart(2, '0')}-01`,
          endDate: new Date(ly, lm, 0).toISOString().split('T')[0],
        };
      }
    }

    // 带 period 字段（"2026-01-01 ~ 2026-03-31" 格式）的函数
    // 涵盖：get_cn_office_performance / get_conversion_rate / get_product_breakdown /
    //       get_core_vs_non_core / get_cross_analysis / get_destination_analysis
    if (typeof data.period === 'string' && data.period.includes('~')) {
      const [s, e] = data.period.split('~').map((x: string) => x.trim());
      if (s && e && /^\d{4}-\d{2}-\d{2}$/.test(s) && /^\d{4}-\d{2}-\d{2}$/.test(e)) {
        return { startDate: s, endDate: e };
      }
    }

    // 带 month 字段（单月视图）
    if (typeof data.month === 'string' && /^\d{4}-\d{2}$/.test(data.month)) {
      const [y, m] = data.month.split('-').map(Number);
      return {
        startDate: `${y}-${String(m).padStart(2, '0')}-01`,
        endDate: new Date(y, m, 0).toISOString().split('T')[0],
      };
    }
  } catch { /* ignore */ }

  return { startDate: defaultStart, endDate: defaultEnd };
}
