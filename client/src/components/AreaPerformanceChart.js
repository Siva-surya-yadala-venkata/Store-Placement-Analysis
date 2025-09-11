import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AreaPerformanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data available for chart
      </div>
    );
  }

  const chartData = data.map(area => ({
    name: area.name || area.areaId,
    orders: area.blinkitData?.totalOrders || 0,
    revenue: area.blinkitData?.totalRevenue || 0,
    score: area.warehouseRecommendation?.score || 0
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              name === 'orders' ? value : `₹${value.toLocaleString()}`,
              name === 'orders' ? 'Orders' : name === 'revenue' ? 'Revenue' : 'Score'
            ]}
          />
          <Bar dataKey="orders" fill="#3B82F6" name="Orders" />
          <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaPerformanceChart;
