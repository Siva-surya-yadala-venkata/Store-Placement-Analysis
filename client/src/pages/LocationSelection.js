import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, TrendingUp, Package, DollarSign, Users } from 'lucide-react';
import { useQuery } from 'react-query';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const LocationSelection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const navigate = useNavigate();

  const { data: locations, isLoading } = useQuery(
    'available-locations',
    () => axios.get('/api/analysis/locations/available').then(res => res.data),
    { 
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 10000 
    }
  );

  const { data: realTimeStats } = useQuery(
    'real-time-stats',
    () => axios.get('/api/analysis/real-time-stats').then(res => res.data),
    { 
      refetchInterval: 10000, // Refresh every 10 seconds
      staleTime: 5000 
    }
  );

  const filteredLocations = locations?.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.state.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    // Navigate to detailed analysis with location data
    navigate(`/analysis/${location.name.toLowerCase()}`, { 
      state: { location, timestamp: new Date() }
    });
  };

  const getWarehouseScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getWarehouseScoreIcon = (score) => {
    if (score >= 80) return '🏆';
    if (score >= 60) return '⭐';
    if (score >= 40) return '📈';
    return '📊';
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏪 Blinkit Warehouse Placement Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select any location to analyze real-time data, competitor presence, and get AI-powered warehouse recommendations
          </p>
        </div>

        {/* Real-Time Stats */}
        {realTimeStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Live Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {realTimeStats.liveOrders || 0}
                  </p>
                  <p className="text-xs text-green-600">↗️ +12% from last hour</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue/Hour</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{realTimeStats.revenuePerHour?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-green-600">↗️ +8% from last hour</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Areas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {realTimeStats.activeAreas || 0}
                  </p>
                  <p className="text-xs text-blue-600">↗️ +2 new today</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Market Share</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {realTimeStats.marketShare || 0}%
                  </p>
                  <p className="text-xs text-green-600">↗️ +3% this week</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations by name, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-500">
              {locations ? filteredLocations.length : 0} locations available
            </div>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <div
              key={location.name}
              className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleLocationSelect(location)}
            >
              <div className="p-6">
                {/* Location Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg mr-3">
                      <MapPin className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {location.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {location.city}, {location.state}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getWarehouseScoreColor(location.warehouseScore || 0)}`}>
                    {getWarehouseScoreIcon(location.warehouseScore || 0)} {location.warehouseScore || 0}/100
                  </div>
                </div>

                {/* Real-Time Metrics */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Blinkit Orders:</span>
                    <span className="font-medium text-blue-600">
                      {location.blinkitOrders || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Competitors:</span>
                    <span className="font-medium text-red-600">
                      {location.competitorCount || 0} active
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Market Share:</span>
                    <span className="font-medium text-green-600">
                      {location.marketShare || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Order Value:</span>
                    <span className="font-medium text-purple-600">
                      ₹{location.averageOrderValue || 0}
                    </span>
                  </div>
                </div>

                {/* Warehouse Recommendation */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600 mb-1">AI Recommendation:</p>
                  <p className="text-sm font-medium text-gray-900">
                    {location.aiRecommendation || 'Analyzing data...'}
                  </p>
                </div>

                {/* Time-window Orders */}
                <div className="space-y-1 text-xs text-gray-600 mb-4">
                  <p>Monthly Orders: <span className="font-medium text-gray-900">{location.monthlyOrders}</span></p>
                  <p>Yearly Orders: <span className="font-medium text-gray-900">{location.yearlyOrders}</span></p>
                  <p>Lifetime Orders: <span className="font-medium text-gray-900">{location.lifetimeOrders}</span></p>
                </div>

                {/* Action Button */}
                <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium">
                  Analyze Location →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredLocations.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or check back later for new locations.
            </p>
          </div>
        )}

        {/* Live Updates Indicator */}
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Live Data Updates</span>
        </div>
      </div>
    </div>
  );
};

export default LocationSelection;
