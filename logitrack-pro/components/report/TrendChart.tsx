// ============================================================
// TrendChart - 趋势图表组件（使用 Recharts）
// ============================================================

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { ComparisonResult, ComparisonType } from '../../types';

interface TrendChartProps {
  data: ComparisonResult;
  comparisonType: ComparisonType;
}

type ChartType = 'line' | 'bar';

export const TrendChart: React.FC<TrendChartProps> = ({ data, comparisonType }) => {
  const [chartType, setChartType] = useState<ChartType>('line');

  // 转换数据格式为 Recharts 需要的格式
  const chartData = data.periodStats.map((stat, index) => ({
    period: stat.period,
    总询价数: stat.totalEnquiries,
    已报价: stat.quoted,
    已确认: stat.confirmed,
    转化率: Number(stat.conversionRate.toFixed(1)),
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">趋势分析</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              chartType === 'line'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📈 折线图
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              chartType === 'bar'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 柱状图
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="总询价数"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="已报价"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="已确认"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
              <Bar dataKey="总询价数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="已报价" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="已确认" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>

        {/* Insights */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-700 font-medium mb-1">询价趋势</p>
            <p className="text-sm textblue-900">
              {data.periodStats[data.periodStats.length - 1].totalEnquiries >
              data.periodStats[0].totalEnquiries
                ? '📈 整体呈上升趋势'
                : '📉 整体呈下降趋势'}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-green-700 font-medium mb-1">转化率</p>
            <p className="text-sm text-green-900">
              平均 {data.summary.avgConversionRate.toFixed(1)}%{' '}
              {data.summary.avgConversionRate >= 25 ? '✨ 表现优秀' : '💪 有提升空间'}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-xs text-yellow-700 font-medium mb-1">总量</p>
            <p className="text-sm text-yellow-900">
              总计 {data.summary.grandTotal} 条询价
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
