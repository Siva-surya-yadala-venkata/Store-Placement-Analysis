import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  MapPin, 
  Clock, 
  Users,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Components
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import AreaPerformanceChart from '../components/AreaPerformanceChart';
import RecentOrdersTable from '../components/RecentOrdersTable';
import TopAreasList from '../components/TopAreasList';

// Context
import { useAnalysis } from '../context/AnalysisContext';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const { orders: realTimeOrders, competitorUpdates } = useAnalysis();

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    ['dashboard', timeRange],
    async () => {
      const response = await axios.get(`/api/analysis/dashboard?timeRange=${timeRange}`);
      return response.data.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  );

  // Fetch warehouse recommendations
  const { data: recommendations } = useQuery(
    ['warehouse-recommendations'],
    async () => {
      const response = await axios.get('/api/analysis/warehouse-recommendations?minScore=70&limit=5');
      return response.data.data;
    }
  );

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Dashboard data refreshed!');
    } catch (error) {
      toast.error('Failed to refresh dashboard data');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={handleRefresh}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { overview, topAreas, recentOrders } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blinkit Analysis Dashboard</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Real-time insights for store placement and warehouse optimization
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={handleRefresh}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Real-time Updates Banner */}
        {realTimeOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium text-sm sm:text-base">
                  {realTimeOrders.length} new order{realTimeOrders.length !== 1 ? 's' : ''} in real-time
                </span>
              </div>
              <Link
                to="/realtime"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 text-sm"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Orders"
          value={overview?.totalOrders || 0}
          icon={Package}
          trend="+12%"
          trendDirection="up"
          color="blue"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(overview?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          trend="+8%"
          trendDirection="up"
          color="green"
        />
        <StatCard
          title="Active Areas"
          value={overview?.activeAreas || 0}
          icon={MapPin}
          trend="+2"
          trendDirection="up"
          color="purple"
        />
        <StatCard
          title="Avg Order Value"
          value={`₹${Math.round((overview?.totalRevenue || 0) / Math.max(overview?.totalOrders || 1, 1))}`}
          icon={TrendingUp}
          trend="+5%"
          trendDirection="up"
          color="orange"
        />
      </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Charts and Performance */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Area Performance Chart */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-lg font-semibold text-gray-900">Area Performance</h3>
                <Link
                  to="/map"
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>View Map</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <AreaPerformanceChart data={topAreas || []} />
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <Link
                  to="/realtime"
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <RecentOrdersTable orders={recentOrders || []} />
            </div>
        </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Top Performing Areas */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Areas</h3>
              <TopAreasList areas={topAreas || []} />
            </div>

            {/* Warehouse Recommendations */}
            {recommendations && (
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-gray-900">Warehouse Recommendations</h3>
                  <Link
                    to="/recommendations"
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {recommendations.recommendations?.slice(0, 3).map((rec) => (
                    <div key={rec.area.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{rec.area.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                          rec.recommendation.score >= 80 ? 'bg-green-100 text-green-800' :
                          rec.recommendation.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {rec.recommendation.score >= 80 ? 'HIGH' :
                           rec.recommendation.score >= 60 ? 'MEDIUM' : 'LOW'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Score: {rec.recommendation.score}/100</p>
                        <p>Orders: {rec.performance.blinkitOrders}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real-time Activity */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">New Orders</span>
                  <span className="font-medium text-green-600">{realTimeOrders.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Competitor Updates</span>
                  <span className="font-medium text-blue-600">{competitorUpdates.length}</span>
                </div>
                <div className="text-xs text-gray-500 text-center pt-2">
                  Last updated: {format(new Date(), 'HH:mm:ss')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
