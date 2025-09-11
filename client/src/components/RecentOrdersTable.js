import React from 'react';
import { format } from 'date-fns';
import { Package, MapPin, DollarSign } from 'lucide-react';

const RecentOrdersTable = ({ orders }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No recent orders available</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Area
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.orderId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Package className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {order.orderId}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {order.areaId?.name || order.areaId}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    ₹{order.total?.toLocaleString()}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {order.status?.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentOrdersTable;
