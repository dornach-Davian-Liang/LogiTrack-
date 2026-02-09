// ============================================================
// StatCard - 统计卡片组件
// ============================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  comparison?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'red';
  format?: 'number' | 'percentage';
  unit?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  comparison,
  icon,
  color = 'blue',
  format = 'number',
  unit,
}) => {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 text-blue-600',
    green: 'border-green-500 bg-green-50 text-green-600',
    yellow: 'border-yellow-500 bg-yellow-50 text-yellow-600',
    orange: 'border-orange-500 bg-orange-50 text-orange-600',
    purple: 'border-purple-500 bg-purple-50 text-purple-600',
    red: 'border-red-500 bg-red-50 text-red-600',
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-4 w-4 text-gray-400" />;
    return change > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-gray-600';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg border-l-4 ${colorClasses[color]}`}>
      <div className="p-5">
        <div className="flex items-center">
          {icon && (
            <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[color]}`}>
              {icon}
            </div>
          )}
          <div className={`${icon ? 'ml-5' : ''} w-0 flex-1`}>
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-bold text-gray-900">
                  {format === 'percentage' && typeof value === 'string' ? value : value}
                  {unit && <span className="text-xl text-gray-600 ml-1">{unit}</span>}
                </div>
                {change !== undefined && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span className="ml-1">{Math.abs(change)}</span>
                  </div>
                )}
              </dd>
              {comparison && (
                <dd className="mt-1 text-xs text-gray-500">{comparison}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
