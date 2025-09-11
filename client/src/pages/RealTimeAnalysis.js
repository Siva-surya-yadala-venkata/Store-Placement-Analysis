import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { 
  MapPin, TrendingUp, Package, DollarSign, Users, 
  Clock, BarChart3, Target, AlertCircle, CheckCircle 
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import 'leaflet/dist/leaflet.css';

const RealTimeAnalysis = () => {
  const { locationName } = useParams();
  const location = useLocation();
  const [selectedArea, setSelectedArea] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [realTimeOrders, setRealTimeOrders] = useState([]);

  const { data: locationData, isLoading } = useQuery(
    ['location-analysis', locationName],
    () => axios.get(`/api/analysis/location/${locationName}`).then(res => res.data),
    { 
      refetchInterval: 10000, // Refresh every 10 seconds
      staleTime: 5000 
    }
  );

  const { data: competitorData } = useQuery(
    ['competitor-analysis', locationName],
    () => axios.get(`/api/analysis/competitors/${locationName}`).then(res => res.data),
    { 
      refetchInterval: 15000, // Refresh every 15 seconds
      staleTime: 10000 
    }
  );

  const { data: heatmap } = useQuery(
    ['heatmap-data', locationName],
    () => axios.get(`/api/analysis/heatmap/${locationName}`).then(res => res.data),
    { 
      refetchInterval: 20000, // Refresh every 20 seconds
      staleTime: 15000 
    }
  );

  useEffect(() => {
    if (heatmap) {
      setHeatmapData(heatmap);
    }
  }, [heatmap]);

  useEffect(() => {
    // Simulate real-time order updates
    const interval = setInterval(() => {
      if (locationData) {
        const newOrder = {
          id: Date.now(),
          orderId: `ORD${Math.floor(Math.random() * 10000)}`,
          customerName: `Customer ${Math.floor(Math.random() * 100)}`,
          amount: Math.floor(Math.random() * 500) + 100,
          area: locationData.location.name,
          timestamp: new Date(),
          status: 'pending'
        };
        setRealTimeOrders(prev => [newOrder, ...prev.slice(0, 9)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [locationData]);

  if (isLoading) return <LoadingSpinner />;

  const getWarehouseScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getHeatmapColor = (intensity) => {
    if (intensity > 80) return '#ff0000'; // Red - High
    if (intensity > 60) return '#ff6600'; // Orange - Medium-High
    if (intensity > 40) return '#ffcc00'; // Yellow - Medium
    if (intensity > 20) return '#99ff00'; // Light Green - Low-Medium
    return '#00ff00'; // Green - Low
  };

  const getRadius = (intensity) => {
    return Math.max(10, Math.min(50, intensity / 2));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏪 Real-Time Analysis: {locationData?.location?.name}
              </h1>
              <p className="text-gray-600">
                Live data analysis, competitor insights, and warehouse recommendations
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Live Updates</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {locationData?.blinkit?.estimatedOrders || 0}
                </p>
                <p className="text-xs text-green-600">↗️ +15% this hour</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ₹{locationData?.blinkit?.averageOrderValue?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-green-600">↗️ +8% this hour</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Market Share</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {locationData?.analysis?.marketShare?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-green-600">↗️ +3% this week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-purple-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Warehouse Score</p>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getWarehouseScoreColor(locationData?.analysis?.warehouseScore || 0)}`}>
                  {locationData?.analysis?.warehouseScore || 0}/100
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {locationData?.analysis?.aiRecommendation || 'Analyzing...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Competitor Analysis */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Competitor Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Blinkit</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {locationData?.blinkit?.estimatedOrders || 0}
                </div>
                <p className="text-sm text-blue-600">orders</p>
                <div className="text-lg font-bold text-blue-800 mt-2">
                  ₹{locationData?.blinkit?.averageOrderValue?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-blue-600">avg order</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </span>
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Zepto</h4>
                <div className="text-2xl font-bold text-green-600">
                  {locationData?.zepto?.estimatedOrders || 0}
                </div>
                <p className="text-sm text-green-600">orders</p>
                <div className="text-lg font-bold text-green-800 mt-2">
                  ₹{locationData?.zepto?.averageOrderValue?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-green-600">avg order</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    locationData?.zepto?.serviceAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {locationData?.zepto?.serviceAvailable ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Swiggy</h4>
                <div className="text-2xl font-bold text-purple-600">
                  {locationData?.swiggy?.estimatedOrders || 0}
                </div>
                <p className="text-sm text-purple-600">orders</p>
                <div className="text-lg font-bold text-purple-800 mt-2">
                  ₹{locationData?.swiggy?.averageOrderValue?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-purple-600">avg order</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    locationData?.swiggy?.serviceAvailable 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {locationData?.swiggy?.serviceAvailable ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Orders</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {realTimeOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900">#{order.orderId}</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₹{order.amount}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Map with Heatmap */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Location Heatmap</h3>
          <div className="h-96 rounded-lg overflow-hidden">
            <MapContainer
              center={[locationData?.location?.coordinates?.lat || 20.5937, locationData?.location?.coordinates?.lng || 78.9629]}
              zoom={8}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Heatmap Markers */}
              {heatmapData.map((point, index) => (
                <CircleMarker
                  key={index}
                  center={[point.lat, point.lng]}
                  radius={getRadius(point.intensity)}
                  fillColor={getHeatmapColor(point.intensity)}
                  color={getHeatmapColor(point.intensity)}
                  weight={2}
                  opacity={0.8}
                  fillOpacity={0.6}
                  eventHandlers={{
                    click: () => setSelectedArea(point.area)
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <h3 className="font-medium text-gray-900">{point.area?.name}</h3>
                      <p className="text-sm text-gray-600">{point.area?.city}</p>
                      <p className="text-sm text-gray-600">Intensity: {point.intensity}%</p>
                      <p className="text-sm text-gray-600">Orders: {point.area?.totalOrders || 0}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Main Location Marker */}
              {locationData?.location?.coordinates && (
                <CircleMarker
                  center={[locationData.location.coordinates.lat, locationData.location.coordinates.lng]}
                  radius={12}
                  fillColor="#3b82f6"
                  color="#1d4ed8"
                  weight={3}
                  opacity={1}
                  fillOpacity={0.8}
                >
                  <Popup>
                    <div className="text-center">
                      <h3 className="font-medium text-gray-900">{locationData.location.name}</h3>
                      <p className="text-sm text-gray-600">{locationData.location.city}</p>
                      <p className="text-sm text-gray-600">Warehouse Score: {locationData.analysis?.warehouseScore || 0}/100</p>
                    </div>
                  </Popup>
                </CircleMarker>
              )}
            </MapContainer>
          </div>

          {/* Heatmap Legend */}
          <div className="mt-4 flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium text-gray-900 mb-2">Heatmap Legend</h4>
              <div className="flex space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span>High (80%+)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                  <span>Medium-High (60-80%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Medium (40-60%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  <span>Low (0-40%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warehouse Recommendations */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Warehouse Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Current Location Analysis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Warehouse Score:</span>
                  <span className="font-medium">{locationData?.analysis?.warehouseScore || 0}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Share:</span>
                  <span className="font-medium">{locationData?.analysis?.marketShare?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Competitors:</span>
                  <span className="font-medium">{locationData?.analysis?.competitorCount || 0} active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Volume:</span>
                  <span className="font-medium">{locationData?.blinkit?.estimatedOrders || 0} orders</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Recommendation</h4>
              <p className="text-sm text-gray-700 mb-3">
                {locationData?.analysis?.recommendation || 'Analyzing data...'}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>High order volume potential</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>Strong market presence</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>Favorable competitor landscape</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Extended Time-Window Stats */}
        {locationData?.analysis?.blinkitPerformance?.windows && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {['monthly','yearly','lifetime'].map((key)=>{
              const stats = locationData.analysis.blinkitPerformance.windows[key] || {};
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <div key={key} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">{label} Orders</h4>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
                  <p className="mt-2 text-sm text-gray-600">Avg Order Value: ₹{stats.avgOrderValue?.toLocaleString() || 0}</p>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>

  );
};

export default RealTimeAnalysis;
