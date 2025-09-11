import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, TrendingUp, ArrowRight, Package } from 'lucide-react';

const TopAreasList = ({ areas }) => {
  if (!areas || areas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No areas data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {areas.map((area, index) => (
        <div key={area.areaId} className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
              <h4 className="font-medium text-gray-900">{area.name || area.areaId}</h4>
            </div>
            <Link
              to={`/analysis/${area.name || area.areaId}`}
              className="text-orange-600 hover:text-orange-700 p-1 rounded-full hover:bg-orange-50 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-1">
              <Package className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">
                {area.blinkitData?.totalOrders || 0} orders
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">
                Score: {area.warehouseRecommendation?.score || 0}
              </span>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            {area.city}, {area.state}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopAreasList;
