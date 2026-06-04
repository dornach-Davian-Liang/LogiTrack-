import React from 'react';
import { Bot, User, ExternalLink } from 'lucide-react';
import type { AiMessage } from '../../services/aiApi';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface MessageBubbleProps {
  message: AiMessage & { chartData?: string; functionCalled?: string; isLoading?: boolean };
  onNavigate?: () => void;
}

/**
 * 单条对话气泡
 * - user: 右侧蓝色气泡
 * - assistant: 左侧白色气泡，支持 Markdown 风格的简单渲染
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onNavigate }) => {
  const isUser = message.role === 'user';

  if (message.isLoading) {
    return (
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Bot size={16} className="text-blue-600" />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span>AI 正在分析数据...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex items-start gap-3 mb-4 justify-end">
        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[70%] shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
      </div>
    );
  }

  // Assistant 消息
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        <Bot size={16} className="text-blue-600" />
      </div>
      <div className="max-w-[80%] space-y-2">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <AssistantContent content={message.content} />
        </div>
        {/* Recharts 图表（有数据时渲染） */}
        {message.chartData && (
          <AiChartWidget
            chartData={message.chartData}
            functionCalled={message.functionCalled}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────
// 助手消息内容：简单 Markdown 渲染
// ──────────────────────────────────────────
const AssistantContent: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="text-sm text-gray-800 leading-relaxed space-y-1">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1" />;

        // 粗体标题行 **text**
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={idx} className="font-semibold text-gray-900">
              {line.slice(2, -2)}
            </p>
          );
        }
        // 无序列表
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>{renderInlineMarkdown(line.slice(2))}</span>
            </div>
          );
        }
        // 有序列表
        const orderedMatch = line.match(/^(\d+)\.\s(.+)/);
        if (orderedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-blue-500 font-medium min-w-[1.2rem]">{orderedMatch[1]}.</span>
              <span>{renderInlineMarkdown(orderedMatch[2])}</span>
            </div>
          );
        }
        // 标题 ##
        if (line.startsWith('## ')) {
          return (
            <p key={idx} className="font-semibold text-gray-900 text-base mt-2">
              {line.slice(3)}
            </p>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <p key={idx} className="font-bold text-gray-900 text-lg mt-2">
              {line.slice(2)}
            </p>
          );
        }
        // 分隔线
        if (line.trim() === '---') {
          return <hr key={idx} className="border-gray-200 my-2" />;
        }
        // 普通段落
        return (
          <p key={idx} className="whitespace-pre-wrap">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * 简单内联 Markdown：**bold** 和 `code`
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  const codeRegex = /`([^`]+)`/g;

  // 合并两种正则
  const combinedRegex = /\*\*(.*?)\*\*|`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(
        <code key={match.index} className="bg-gray-100 text-blue-700 px-1 py-0.5 rounded text-xs font-mono">
          {match[2]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

// ──────────────────────────────────────────
// AI Chart Widget — 基于 chartData 自动选择图表类型
// ──────────────────────────────────────────

interface AiChartWidgetProps {
  chartData: string;
  functionCalled?: string;
  onNavigate?: () => void;
}

type ChartType = 'line-trend' | 'bar-comparison' | 'bar-breakdown' | 'bar-office' | 'bar-group' | 'none';

/** key → chart type 映射（按后端实际返回字段名） */
function detectChartType(data: Record<string, unknown>): ChartType {
  const has = (k: string) => Array.isArray(data[k]) && (data[k] as unknown[]).length > 0;

  // 月度趋势：get_monthly_trend
  if (has('trend')) return 'line-trend';

  // 多期对比：get_period_comparison
  if (has('periods')) return 'bar-comparison';

  // CN 办公室绩效：get_cn_office_performance / get_conversion_rate(byOffice)
  if (has('cnOfficePerformance') || has('byOffice') || has('offices')) return 'bar-office';

  // 货运类型：get_cargo_type_breakdown
  // 目的地：get_destination_analysis
  // 产品类型：get_product_breakdown
  if (has('cargoTypeBreakdown') || has('cargoBreakdown') || has('cargoTypes') ||
      has('topDestinations') || has('productBreakdown')) return 'bar-breakdown';

  // 多维度交叉分析：get_cross_analysis
  if (has('data')) return 'bar-group';

  return 'none';
}

const COLORS = {
  enquiries: '#3B82F6',  // blue
  confirmed: '#10B981',  // green
  rate:      '#F59E0B',  // amber
};

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}：{typeof entry.value === 'number' && entry.name.includes('%')
            ? `${entry.value.toFixed(1)}%`
            : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const AiChartWidget: React.FC<AiChartWidgetProps> = ({ chartData, functionCalled, onNavigate }) => {
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(chartData); } catch { return null; }

  const chartType = detectChartType(data);

  // 导航按钮（复用）
  const navButton = onNavigate ? (
    <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex justify-end">
      <button
        onClick={onNavigate}
        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-200 hover:border-blue-400"
      >
        <ExternalLink size={12} />
        前往报表详情
      </button>
    </div>
  ) : null;

  // 无图表时：若有导航回调仍显示跳转按钮
  if (chartType === 'none') {
    if (!onNavigate) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-3 py-2 bg-gray-50 flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">📊 数据已加载</span>
        </div>
        {navButton}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* 标题栏（无按钮） */}
      <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-600">📊 数据图表</span>
      </div>

      {/* 图表区域 */}
      <div className="p-3">
        {chartType === 'line-trend' && (
          <LineTrendChart rows={(data.trend as Record<string, unknown>[])} />
        )}
        {chartType === 'bar-comparison' && (
          <BarComparisonChart
            rows={(data.periods as Record<string, unknown>[])}
            comparisonType={(data.comparisonType as string) ?? 'MONTHLY'}
          />
        )}
        {chartType === 'bar-breakdown' && (
          <CssBarChart
            rows={((data.cargoTypeBreakdown ?? data.cargoBreakdown ?? data.cargoTypes ?? data.topDestinations ?? data.productBreakdown) as Record<string, unknown>[])}
            nameKey={data.cargoTypeBreakdown ? 'cargoType' : data.topDestinations ? 'country' : data.productBreakdown ? 'product' : 'cargo'}
          />
        )}
        {chartType === 'bar-office' && (
          <CssBarChart
            rows={((data.cnOfficePerformance ?? data.byOffice ?? data.offices) as Record<string, unknown>[])}
            nameKey="office"
          />
        )}
        {chartType === 'bar-group' && (
          <CssBarChart
            rows={(data.data as Record<string, unknown>[])}
            nameKey="group"
          />
        )}
      </div>

      {/* 底部导航按钮 */}
      {navButton}
    </div>
  );
};

// ── 折线图（月度趋势） ──
const LineTrendChart: React.FC<{ rows: Record<string, unknown>[] }> = ({ rows }) => {
  const chartData = rows.map(r => ({
    month: String(r.month ?? ''),
    totalEnquiries: Number(r.totalEnquiries ?? 0),
    confirmed: Number(r.confirmed ?? 0),
    conversionRate: parseFloat(String(r.conversionRate ?? '0')),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10, fill: COLORS.rate }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v}%`}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
        <Bar yAxisId="left" dataKey="totalEnquiries" name="询价量" fill={COLORS.enquiries} radius={[3, 3, 0, 0]} opacity={0.8} />
        <Bar yAxisId="left" dataKey="confirmed" name="已确认" fill={COLORS.confirmed} radius={[3, 3, 0, 0]} opacity={0.8} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="conversionRate"
          name="转化率%"
          stroke={COLORS.rate}
          strokeWidth={2}
          dot={{ r: 3, fill: COLORS.rate }}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// ── 柱状图（期间对比） ──
const BarComparisonChart: React.FC<{
  rows: Record<string, unknown>[];
  comparisonType: string;
}> = ({ rows }) => {
  const chartData = rows.map(r => ({
    period: String(r.period ?? ''),
    totalEnquiries: Number(r.totalEnquiries ?? 0),
    confirmed: Number(r.confirmed ?? 0),
    conversionRate: parseFloat(String(r.conversionRate ?? '0')),
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="period" tick={{ fontSize: 10 }} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10, fill: COLORS.rate }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v}%`}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
        <Bar yAxisId="left" dataKey="totalEnquiries" name="询价量" fill={COLORS.enquiries} radius={[3, 3, 0, 0]} opacity={0.85} />
        <Bar yAxisId="left" dataKey="confirmed" name="已确认" fill={COLORS.confirmed} radius={[3, 3, 0, 0]} opacity={0.85} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="conversionRate"
          name="转化率%"
          stroke={COLORS.rate}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// ── CSS 进度条图（货运类型 / CN 办公室 / 交叉分析 / 目的地等） ──
// 使用纯 CSS 实现，兼容性更好，不依赖 Recharts 布局模式
const CssBarChart: React.FC<{
  rows: Record<string, unknown>[];
  nameKey: string;
}> = ({ rows, nameKey }) => {
  const items = rows
    .slice(0, 10)
    .map(r => ({
      name: String(r[nameKey] ?? r.officeName ?? r.cargo ?? r.name ?? r.group ?? ''),
      value: Number(r.totalEnquiries ?? r.total ?? r.count ?? 0),
      confirmed: Number(r.confirmed ?? 0),
      convRate: String(r.conversionRate ?? ''),
    }));

  if (items.length === 0) return null;

  const maxValue = Math.max(...items.map(i => i.value), 1);

  return (
    <div className="space-y-2">
      {/* 图例 */}
      <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-1">
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400" />询价量</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-400" />已确认</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          {/* 名称 */}
          <span className="w-20 flex-shrink-0 text-gray-600 truncate text-right" title={item.name}>{item.name}</span>
          {/* 进度条组 */}
          <div className="flex-1 min-w-0">
            {/* 询价量 */}
            <div className="relative h-4 bg-gray-100 rounded overflow-hidden mb-0.5">
              <div
                className="absolute inset-y-0 left-0 bg-blue-400 rounded"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
              <span className="absolute inset-y-0 left-1 flex items-center text-[10px] font-medium text-white z-10 drop-shadow">
                {item.value > 0 ? item.value : ''}
              </span>
            </div>
            {/* 已确认 */}
            {item.confirmed > 0 && (
              <div className="relative h-3 bg-gray-100 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-400 rounded"
                  style={{ width: `${(item.confirmed / maxValue) * 100}%` }}
                />
                <span className="absolute inset-y-0 left-1 flex items-center text-[10px] text-white z-10 drop-shadow">
                  {item.confirmed}
                </span>
              </div>
            )}
          </div>
          {/* 转化率 */}
          {item.convRate ? (
            <span className="w-12 flex-shrink-0 text-[10px] text-amber-600 font-medium">{item.convRate}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
};

