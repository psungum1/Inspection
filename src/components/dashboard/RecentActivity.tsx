import React from 'react';
import { Clock, User, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDistanceToNow } from 'date-fns';

const RecentActivity: React.FC = () => {
  const { state } = useApp();
  const { testResults, orders } = state;

  // Generate recent activity from test results and orders
  const recentActivity = [
    ...testResults.slice(0, 3).map(test => ({
      id: test.id,
      type: 'test',
      message: `Test result recorded for ${test.orderNumber}`,
      status: test.status,
      timestamp: test.timestamp,
      user: test.operatorId
    })),
    ...orders.slice(0, 2).map(order => ({
      id: order.orderNumber,
      type: 'order',
      message: `Order ${order.orderNumber} ${order.status}`,
      status: order.status === 'completed' ? 'pass' : 'warning',
      timestamp: order.updatedAt,
      user: order.operatorId
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
      case 'completed':
        return 'text-green-600';
      case 'warning':
        return 'text-amber-600';
      case 'fail':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
      case 'completed':
        return 'bg-green-100 text-green-600';
      case 'warning':
        return 'bg-amber-100 text-amber-600';
      case 'fail':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>
      
      <div className="space-y-3">
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`p-1 rounded-full ${getStatusIcon(activity.status)}`}>
                <AlertCircle className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {activity.message}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>{activity.user}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;