import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { MapPin, TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AreaAnalysis = () => {
  const [selectedArea, setSelectedArea] = useState('');
  const [areas, setAreas] = useState([]);
  const { realTimeOrders, competitorUpdates } = useAnalysis();

  const { data: areaData, isLoading, error } = useQuery(
    ['area-analysis', selectedArea],
    () => axios.get(`/api/analysis/location/${selectedArea}`).then(res => res.data),
    { enabled: !!selectedArea }
  );

  const { data: areasList } = useQuery(
    'areas',
    () => axios.get('/api/analysis/locations/available').then(res => res.data),
    { 
      onSuccess: (data) => setAreas(data || []),
      onError: () => setAreas([])
    }
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error loading area analysis</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Area Analysis</h1>
          <p className="text-sm sm:text-base text-gray-600">Analyze performance and opportunities for specific areas</p>
        </div>

        {/* Area Selection */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Area
          </label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          >
            <option value="">Choose an area...</option>
            {Array.isArray(areas) && areas.map((area) => (
              <option key={area.name} value={area.name}>
                {area.name} - {area.city}
              </option>
            ))}
          </select>
        </div>

        {selectedArea && areaData && (
          <div className="space-y-6">
            {/* Area Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                      {areaData.blinkit?.estimatedOrders || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                      ₹{((areaData.blinkit?.estimatedOrders || 0) * (areaData.blinkit?.averageOrderValue || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Market Share</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                      {areaData.analysis?.marketShare || 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Growth Rate</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                      {areaData.analysis?.warehouseScore || 0}/100
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitor Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Competitor Analysis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Blinkit</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{((areaData.blinkit?.estimatedOrders || 0) * (areaData.blinkit?.averageOrderValue || 0)).toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600">
                    {areaData.blinkit?.estimatedOrders || 0} orders
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Zepto</h4>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{((areaData.zepto?.estimatedOrders || 0) * (areaData.zepto?.averageOrderValue || 0)).toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600">
                    {areaData.zepto?.estimatedOrders || 0} orders
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900">Swiggy</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{((areaData.swiggy?.estimatedOrders || 0) * (areaData.swiggy?.averageOrderValue || 0)).toLocaleString()}
                  </p>
                  <p className="text-sm text-purple-600">
                    {areaData.swiggy?.estimatedOrders || 0} orders
                  </p>
                </div>
              </div>
            </div>

            {/* Real-time Updates */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Real-time Updates</h3>
              <div className="space-y-3">
                {Array.isArray(realTimeOrders) && realTimeOrders.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.orderId}</p>
                        <p className="text-sm text-gray-600">{order.areaName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{order.total}</p>
                      <p className="text-sm text-gray-600">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AreaAnalysis;
