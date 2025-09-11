import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Package, Clock, MapPin, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';
import LoadingSpinner from '../components/LoadingSpinner';

const RealTimeOrders = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const { realTimeOrders, competitorUpdates } = useAnalysis();

  // Use real-time data from context instead of API calls
  const orders = realTimeOrders || [];
  const isLoading = false;
  const error = null;

  const { data: areas } = useQuery(
    'areas',
    () => axios.get('/api/analysis/locations/available').then(res => res.data),
    { onError: () => {} }
  );

  // Generate order stats from real-time data
  const orderStats = {
    totalOrders: Array.isArray(realTimeOrders) ? realTimeOrders.length : 0,
    activeOrders: Array.isArray(realTimeOrders) ? realTimeOrders.filter(order => order.status !== 'delivered' && order.status !== 'cancelled').length : 0,
    todayRevenue: Array.isArray(realTimeOrders) ? realTimeOrders.reduce((sum, order) => sum + (order.total || 0), 0) : 0,
    avgDeliveryTime: 25 // Simulated average delivery time
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error loading orders</div>;

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <Package className="h-4 w-4" />;
      case 'preparing':
        return <Package className="h-4 w-4" />;
      case 'out_for_delivery':
        return <MapPin className="h-4 w-4" />;
      case 'delivered':
        return <Package className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Real-Time Orders</h1>
          <p className="text-sm sm:text-base text-gray-600">Monitor live orders and track delivery performance across all areas</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                  {orderStats?.totalOrders || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                  {orderStats?.activeOrders || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                  ₹{orderStats?.todayRevenue?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Delivery Time</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                  {orderStats?.avgDeliveryTime || 0} min
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-center">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                <option value="all">All Areas</option>
                {Array.isArray(areas) && areas.map((area) => (
                  <option key={area.name} value={area.name}>
                    {area.name} - {area.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center sm:ml-auto">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-gray-600">Live Updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Order Details</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Customer
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Items
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Time
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(orders) && orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        #{order.orderId}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900">{order.customerName}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">{order.areaName}</div>
                      <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">{order.city}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900">
                        {order.items?.length || 0} items
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {order.items?.slice(0, 2).map(item => item.name).join(', ')}
                        {order.items?.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        ₹{order.total?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 hidden sm:inline">{order.status}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <button className="text-orange-600 hover:text-orange-900 mr-2 sm:mr-3">
                        View
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!orders || orders.length === 0) && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or check back later for new orders.
              </p>
            </div>
          )}
        </div>

        {/* Real-time Updates Feed */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Live Updates Feed</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Array.isArray(realTimeOrders) && realTimeOrders.slice(0, 10).map((order, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-900 truncate">
                    New order #{order.orderId} received from {order.areaName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  ₹{order.total?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeOrders;
