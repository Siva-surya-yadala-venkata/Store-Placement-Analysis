import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { MapPin, TrendingUp, Package, DollarSign, Star, CheckCircle } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';
import LoadingSpinner from '../components/LoadingSpinner';

const WarehouseRecommendations = () => {
  const [filterLevel, setFilterLevel] = useState('all');
  const { realTimeOrders, competitorUpdates } = useAnalysis();

  const { data: recommendationsData, isLoading, error } = useQuery(
    ['warehouse-recommendations', filterLevel],
    () => axios.get(`/api/analysis/warehouse-recommendations?minScore=0&limit=20`).then(res => res.data)
  );

  const recommendations = recommendationsData?.data?.recommendations || [];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error loading recommendations</div>;

  const getRecommendationColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getRecommendationIcon = (score) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <Star className="h-5 w-5 text-blue-600" />;
    if (score >= 40) return <TrendingUp className="h-5 w-5 text-yellow-600" />;
    return <Package className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Warehouse Recommendations</h1>
          <p className="text-sm sm:text-base text-gray-600">AI-powered suggestions for optimal warehouse placement based on data analysis</p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-center">
            <label className="text-sm font-medium text-gray-700">Filter by Recommendation Level:</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              <option value="all">All Recommendations</option>
              <option value="excellent">Excellent (80-100)</option>
              <option value="good">Good (60-79)</option>
              <option value="moderate">Moderate (40-59)</option>
              <option value="poor">Poor (0-39)</option>
            </select>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.isArray(recommendations) && recommendations.map((recommendation) => (
            <div
              key={recommendation.area.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-2 sm:space-y-0">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      {recommendation.area.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {recommendation.area.city}, {recommendation.area.state}
                    </p>
                  </div>
                  <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border w-fit ${getRecommendationColor(recommendation.recommendation.score)}`}>
                    {recommendation.recommendation.score}/100
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    {getRecommendationIcon(recommendation.recommendation.score)}
                    <span className="ml-2 text-xs sm:text-sm font-medium text-gray-700">
                      Overall Score: {recommendation.recommendation.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${recommendation.recommendation.score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mx-auto mb-1 sm:mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600">Orders</p>
                    <p className="text-sm sm:text-lg font-semibold text-gray-900">
                      {recommendation.performance.blinkitOrders || 0}
                    </p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mx-auto mb-1 sm:mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600">Revenue</p>
                    <p className="text-sm sm:text-lg font-semibold text-gray-900">
                      ₹{recommendation.performance.blinkitRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                {/* Factors */}
                <div className="mb-4">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Key Factors:</h4>
                  <div className="space-y-1 sm:space-y-2">
                    {Object.entries(recommendation.recommendation.factors || {}).map(([key, value], index) => (
                      <div key={index} className="flex items-center text-xs sm:text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-gray-600">{key}: {value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competitor Analysis */}
                <div className="mb-4">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Competitor Presence:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zepto:</span>
                      <span className="font-medium">{recommendation.competitors.zepto || 0} orders</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Swiggy:</span>
                      <span className="font-medium">{recommendation.competitors.swiggy || 0} orders</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button className="flex-1 bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-xs sm:text-sm font-medium">
                    View Details
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium">
                    Analyze Area
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Statistics */}
        {Array.isArray(recommendations) && recommendations.length > 0 && (
          <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recommendation Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  {recommendations.filter(r => r.recommendation.score >= 80).length}
                </div>
                <div className="text-xs sm:text-sm text-green-700">Excellent</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">
                  {recommendations.filter(r => r.recommendation.score >= 60 && r.recommendation.score < 80).length}
                </div>
                <div className="text-xs sm:text-sm text-blue-700">Good</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {recommendations.filter(r => r.recommendation.score >= 40 && r.recommendation.score < 60).length}
                </div>
                <div className="text-xs sm:text-sm text-yellow-700">Moderate</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-red-600">
                  {recommendations.filter(r => r.recommendation.score < 40).length}
                </div>
                <div className="text-xs sm:text-sm text-red-700">Poor</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseRecommendations;
