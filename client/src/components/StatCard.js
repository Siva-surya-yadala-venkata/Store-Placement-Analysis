import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendDirection, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600'
  };

  const trendColorClasses = {
    up: 'text-green-600',
    down: 'text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center mt-4">
          {trendDirection === 'up' ? (
            <TrendingUp className={`w-4 h-4 ${trendColorClasses.up}`} />
          ) : (
            <TrendingDown className={`w-4 h-4 ${trendColorClasses.down}`} />
          )}
          <span className={`ml-2 text-sm font-medium ${trendColorClasses[trendDirection] || trendColorClasses.up}`}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
