// ============================================================
// TrendChart - 趋势图表组件（增强版，支持多图形 + 中英双语）
// ============================================================

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
  Layers,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { ComparisonResult, ComparisonType } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface TrendChartProps {
  data: ComparisonResult;
  comparisonType: ComparisonType;
}

type ChartType = 'composed' | 'area' | 'line' | 'bar' | 'radar' | 'growth';

// 调色板
const CHART_COLORS = {
  total: '#3b82f6',
  totalLight: '#bfdbfe',
  quoted: '#f59e0b',
  quotedLight: '#fde68a',
  confirmed: '#10b981',
  confirmedLight: '#a7f3d0',
  conversion: '#8b5cf6',
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280',
};

// 雷达图颜色序列
const RADAR_SERIES_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];

export const TrendChart: React.FC<TrendChartProps> = ({ data, comparisonType }) => {
  const { language } = useLanguage();
  const [chartType, setChartType] = useState<ChartType>('composed');

  // ── 双语文案 ──────────────────────────────────────────────────
  const T = {
    zh: {
      trendAnalysis: '趋势分析',
      composedChart: '综合图',
      areaChart: '面积图',
      lineChart: '折线图',
      barChart: '柱状图',
      radarChart: '雷达图',
      growthChart: '增长率图',
      totalEnquiries: '总询价数',
      quoted: '已报价',
      confirmed: '已确认',
      conversionRate: '转化率(%)',
      growthRate: '环比增长率(%)',
      overallTrend: '整体趋势',
      upward: '上升趋势 📈',
      downward: '下降趋势 📉',
      avgConversion: '平均转化率',
      excellent: '✨ 表现优秀',
      roomToImprove: '💪 有提升空间',
      totalVolume: '所有时期合计询价量',
      trend: '趋势走向',
      rate: '转化效率',
      volume: '总量统计',
      bestPeriod: '最佳时期',
      worstPeriod: '最差时期',
      peakEnquiries: '最高询价量',
      vsLastPeriod: '较上期',
      positive: '上升',
      negative: '下降',
      unchanged: '持平',
      growthPositive: '↑ 增长期',
      growthNegative: '↓ 衰退期',
      changeVsPrev: '较前期变化',
    },
    en: {
      trendAnalysis: 'Trend Analysis',
      composedChart: 'Composed',
      areaChart: 'Area',
      lineChart: 'Line',
      barChart: 'Bar',
      radarChart: 'Radar',
      growthChart: 'Growth',
      totalEnquiries: 'Total Enquiries',
      quoted: 'Quoted',
      confirmed: 'Confirmed',
      conversionRate: 'Conversion(%)',
      growthRate: 'Growth Rate(%)',
      overallTrend: 'Overall Trend',
      upward: 'Upward Trend 📈',
      downward: 'Downward Trend 📉',
      avgConversion: 'Avg Conversion',
      excellent: '✨ Excellent',
      roomToImprove: '💪 Room to Improve',
      totalVolume: 'Total across all periods',
      trend: 'Trend',
      rate: 'Conversion',
      volume: 'Volume',
      bestPeriod: 'Best Period',
      worstPeriod: 'Worst Period',
      peakEnquiries: 'Peak Enquiries',
      vsLastPeriod: 'vs Last Period',
      positive: 'Growth',
      negative: 'Decline',
      unchanged: 'Unchanged',
      growthPositive: '↑ Growth',
      growthNegative: '↓ Decline',
      changeVsPrev: 'Change vs Prev',
    },
  };
  const t = T[language as 'zh' | 'en'] ?? T.en;

  // ── 数据准备 ──────────────────────────────────────────────────
  const chartData = data.periodStats.map((stat) => ({
    period: stat.period,
    [t.totalEnquiries]: stat.totalEnquiries,
    [t.quoted]: stat.quoted,
    [t.confirmed]: stat.confirmed,
    [t.conversionRate]: Number(stat.conversionRate.toFixed(1)),
  }));

  // 增长率数据（用于 growth 图）
  const growthData = data.periodStats.map((stat, i) => {
    const prev = i > 0 ? data.periodStats[i - 1].totalEnquiries : null;
    const growthVal =
      prev !== null && prev > 0
        ? Number((((stat.totalEnquiries - prev) / prev) * 100).toFixed(1))
        : null;
    return {
      period: stat.period,
      [t.growthRate]: growthVal,
      total: stat.totalEnquiries,
    };
  });

  // 雷达图数据：每行为一个指标，每列为一个时期
  const radarSubjects = [t.totalEnquiries, t.quoted, t.confirmed, t.conversionRate];
  const maxTotalForRadar = Math.max(...data.periodStats.map((s) => s.totalEnquiries), 1);
  const conversionScale = maxTotalForRadar / 100;
  const radarData = radarSubjects.map((subject) => {
    const entry: Record<string, string | number> = { subject };
    data.periodStats.forEach((stat) => {
      if (subject === t.totalEnquiries) entry[stat.period] = stat.totalEnquiries;
      else if (subject === t.quoted) entry[stat.period] = stat.quoted;
      else if (subject === t.confirmed) entry[stat.period] = stat.confirmed;
      else entry[stat.period] = Number((stat.conversionRate * conversionScale).toFixed(1));
    });
    return entry;
  });

  // 趋势方向
  const stats = data.periodStats;
  const isUpward =
    stats.length > 1 &&
    stats[stats.length - 1].totalEnquiries >= stats[0].totalEnquiries;
  const peakStat = [...stats].sort((a, b) => b.totalEnquiries - a.totalEnquiries)[0];
  const sortedByRank = [...stats].sort((a, b) => b.totalEnquiries - a.totalEnquiries);

  // 通用 Tooltip 样式
  const tooltipStyle = {
    backgroundColor: 'rgba(255,255,255,0.97)',
    border: 'none',
    borderRadius: '10px',
    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
    fontSize: '13px',
  };

  // 图表类型按钮列表
  const chartButtons: { type: ChartType; icon: React.ReactNode; label: string }[] = [
    { type: 'composed', icon: <Activity className="h-3.5 w-3.5" />, label: t.composedChart },
    { type: 'area', icon: <Layers className="h-3.5 w-3.5" />, label: t.areaChart },
    { type: 'line', icon: <LineChartIcon className="h-3.5 w-3.5" />, label: t.lineChart },
    { type: 'bar', icon: <BarChart3 className="h-3.5 w-3.5" />, label: t.barChart },
    { type: 'radar', icon: <Radio className="h-3.5 w-3.5" />, label: t.radarChart },
    { type: 'growth', icon: <TrendingUp className="h-3.5 w-3.5" />, label: t.growthChart },
  ];

  const btnClass = (type: ChartType) =>
    `flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
      chartType === type
        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
    }`;

  // 渲染主图表
  const renderMainChart = () => {
    const margin = { top: 20, right: 30, bottom: 20, left: 20 };

    if (chartType === 'composed') {
      return (
        <ComposedChart data={chartData} margin={margin}>
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.total} stopOpacity={0.25} />
              <stop offset="95%" stopColor={CHART_COLORS.total} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 11 }} tickMargin={8} />
          <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.conversion} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
          <Bar yAxisId="left" dataKey={t.totalEnquiries} fill={CHART_COLORS.totalLight} stroke={CHART_COLORS.total} strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={48} />
          <Bar yAxisId="left" dataKey={t.quoted} fill={CHART_COLORS.quotedLight} stroke={CHART_COLORS.quoted} strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={48} />
          <Bar yAxisId="left" dataKey={t.confirmed} fill={CHART_COLORS.confirmedLight} stroke={CHART_COLORS.confirmed} strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={48} />
          <Line yAxisId="right" type="monotone" dataKey={t.conversionRate} stroke={CHART_COLORS.conversion} strokeWidth={3} dot={{ r: 5, fill: CHART_COLORS.conversion, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
        </ComposedChart>
      );
    }

    if (chartType === 'area') {
      return (
        <AreaChart data={chartData} margin={margin}>
          <defs>
            <linearGradient id="gradT" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.total} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.total} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradQ" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.quoted} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.quoted} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.confirmed} stopOpacity={0.35} />
              <stop offset="95%" stopColor={CHART_COLORS.confirmed} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 11 }} tickMargin={8} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
          <Area type="monotone" dataKey={t.totalEnquiries} stroke={CHART_COLORS.total} strokeWidth={2.5} fill="url(#gradT)" dot={{ r: 4, fill: CHART_COLORS.total }} activeDot={{ r: 7 }} />
          <Area type="monotone" dataKey={t.quoted} stroke={CHART_COLORS.quoted} strokeWidth={2.5} fill="url(#gradQ)" dot={{ r: 4, fill: CHART_COLORS.quoted }} activeDot={{ r: 7 }} />
          <Area type="monotone" dataKey={t.confirmed} stroke={CHART_COLORS.confirmed} strokeWidth={2.5} fill="url(#gradC)" dot={{ r: 4, fill: CHART_COLORS.confirmed }} activeDot={{ r: 7 }} />
        </AreaChart>
      );
    }

    if (chartType === 'line') {
      return (
        <LineChart data={chartData} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 11 }} tickMargin={8} />
          <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.conversion} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
          <Line yAxisId="left" type="monotone" dataKey={t.totalEnquiries} stroke={CHART_COLORS.total} strokeWidth={3} dot={{ r: 5, fill: CHART_COLORS.total, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
          <Line yAxisId="left" type="monotone" dataKey={t.quoted} stroke={CHART_COLORS.quoted} strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4, fill: CHART_COLORS.quoted }} activeDot={{ r: 7 }} />
          <Line yAxisId="left" type="monotone" dataKey={t.confirmed} stroke={CHART_COLORS.confirmed} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.confirmed }} activeDot={{ r: 7 }} />
          <Line yAxisId="right" type="monotone" dataKey={t.conversionRate} stroke={CHART_COLORS.conversion} strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: CHART_COLORS.conversion }} activeDot={{ r: 6 }} />
        </LineChart>
      );
    }

    if (chartType === 'bar') {
      return (
        <BarChart data={chartData} margin={margin} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 11 }} tickMargin={8} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
          <Bar dataKey={t.totalEnquiries} fill={CHART_COLORS.total} radius={[5, 5, 0, 0]} maxBarSize={52}>
            {chartData.map((_, i) => (
              <Cell key={i} opacity={0.85 + (i % 2) * 0.15} />
            ))}
          </Bar>
          <Bar dataKey={t.quoted} fill={CHART_COLORS.quoted} radius={[5, 5, 0, 0]} maxBarSize={52} />
          <Bar dataKey={t.confirmed} fill={CHART_COLORS.confirmed} radius={[5, 5, 0, 0]} maxBarSize={52} />
        </BarChart>
      );
    }

    if (chartType === 'radar') {
      return (
        <RadarChart data={radarData} margin={margin}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
          <PolarRadiusAxis angle={30} tick={{ fontSize: 9, fill: '#94a3b8' }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
          {data.periodStats.map((stat, i) => (
            <Radar
              key={stat.period}
              name={stat.period}
              dataKey={stat.period}
              stroke={RADAR_SERIES_COLORS[i % RADAR_SERIES_COLORS.length]}
              fill={RADAR_SERIES_COLORS[i % RADAR_SERIES_COLORS.length]}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      );
    }

    // growth chart
    return (
      <ComposedChart data={growthData} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 11 }} tickMargin={8} />
        <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 11 }} unit="%" />
        <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
        <ReferenceLine yAxisId="left" y={0} stroke="#cbd5e1" strokeDasharray="4 2" />
        <Bar yAxisId="left" dataKey={t.growthRate} maxBarSize={52} radius={[5, 5, 0, 0]}>
          {growthData.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry[t.growthRate] === null
                  ? '#e2e8f0'
                  : (entry[t.growthRate] as number) >= 0
                  ? CHART_COLORS.positive
                  : CHART_COLORS.negative
              }
              opacity={entry[t.growthRate] === null ? 0.4 : 0.85}
            />
          ))}
        </Bar>
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="total"
          name={t.totalEnquiries}
          stroke={CHART_COLORS.total}
          strokeWidth={2.5}
          dot={{ r: 4, fill: CHART_COLORS.total }}
          activeDot={{ r: 7 }}
        />
      </ComposedChart>
    );
  };

  const maxTotal = Math.max(...stats.map((s) => s.totalEnquiries), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{t.trendAnalysis}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {comparisonType === 'MONTHLY'
                ? language === 'zh' ? '月度数据对比' : 'Monthly comparison'
                : language === 'zh' ? '季度数据对比' : 'Quarterly comparison'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {chartButtons.map((btn) => (
            <button key={btn.type} onClick={() => setChartType(btn.type)} className={btnClass(btn.type)}>
              {btn.icon}
              <span className="hidden sm:inline">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="px-5 pt-6 pb-2">
        {chartType === 'growth' && (
          <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: CHART_COLORS.positive }} />
              {t.growthPositive}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: CHART_COLORS.negative }} />
              {t.growthNegative}
            </span>
            <span className="text-gray-400">— {t.totalEnquiries}</span>
          </div>
        )}
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderMainChart()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Row */}
      <div className="px-5 py-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-50/10 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{t.trend}</p>
            {isUpward
              ? <TrendingUp className="h-4 w-4 text-green-500" />
              : <TrendingDown className="h-4 w-4 text-red-400" />}
          </div>
          <p className="text-sm font-bold text-gray-800">{isUpward ? t.upward : t.downward}</p>
          <p className="text-xs text-blue-500 mt-1">{stats[0]?.period} → {stats[stats.length - 1]?.period}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-50/10 border border-purple-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">{t.rate}</p>
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-purple-700">{data.summary.avgConversionRate.toFixed(1)}%</p>
          <p className="text-xs text-purple-500 mt-1">
            {data.summary.avgConversionRate >= 25 ? t.excellent : t.roomToImprove}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50/10 border border-green-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">{t.bestPeriod}</p>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-sm font-bold text-gray-800">{data.summary.bestPeriod}</p>
          <p className="text-xs text-green-600 mt-1">{t.peakEnquiries}: {peakStat?.totalEnquiries ?? '-'}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-50/10 border border-amber-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">{t.volume}</p>
            <BarChart3 className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-700">{data.summary.grandTotal.toLocaleString()}</p>
          <p className="text-xs text-amber-500 mt-1">{t.totalVolume}</p>
        </div>
      </div>

      {/* Period Growth Detail List */}
      <div className="px-5 pb-5">
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{t.changeVsPrev}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.map((stat, i) => {
              const prev = i > 0 ? stats[i - 1].totalEnquiries : null;
              const growth =
                prev !== null && prev > 0
                  ? ((stat.totalEnquiries - prev) / prev) * 100
                  : null;
              const rankIndex = sortedByRank.findIndex((s) => s.period === stat.period) + 1;
              return (
                <div key={stat.period} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center">
                      {rankIndex}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{stat.period}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-1.5">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-400 transition-all"
                          style={{ width: `${(stat.totalEnquiries / maxTotal) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{stat.totalEnquiries}</span>
                    </div>
                    {growth === null ? (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Minus className="h-3 w-3" />
                        {language === 'zh' ? '首期' : '1st'}
                      </span>
                    ) : growth > 0 ? (
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <ArrowUpRight className="h-3 w-3" />+{growth.toFixed(1)}%
                      </span>
                    ) : growth < 0 ? (
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                        <ArrowDownRight className="h-3 w-3" />{growth.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Minus className="h-3 w-3" />0%
                      </span>
                    )}
                    <span className="text-xs text-purple-600 font-semibold w-12 text-right">
                      {stat.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
