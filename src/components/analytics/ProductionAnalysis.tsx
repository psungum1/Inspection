import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ProductionOrder, TestResult } from '../../types';

interface ProductionAnalysisProps {
  orders: ProductionOrder[];
  testResults: TestResult[];
  dateRange: { start: string; end: string };
  filters: {
    lineNumbers: number[];
    operatorIds: string[];
    parameters: string[];
  };
}

const ProductionAnalysis: React.FC<ProductionAnalysisProps> = ({ 
  orders, 
  testResults, 
  dateRange, 
  filters 
}) => {
  // Filter orders based on date range and filters
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.productionDateTime);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    return orderDate >= startDate && 
           orderDate <= endDate &&
           (filters.lineNumbers.length === 0 || filters.lineNumbers.includes(order.lineNumber)) &&
           (filters.operatorIds.length === 0 || filters.operatorIds.includes(order.operatorId));
  });

  // Production line analysis
  const lineAnalysis = Array.from(new Set(filteredOrders.map(o => o.lineNumber)))
    .map(lineNumber => {
      const lineOrders = filteredOrders.filter(o => o.lineNumber === lineNumber);
      const lineTests = testResults.filter(t => 
        lineOrders.some(o => o.orderNumber === t.orderNumber)
      );
      
      const totalOrders = lineOrders.length;
      const completedOrders = lineOrders.filter(o => o.status === 'completed').length;
      const totalTests = lineTests.length;
      const passedTests = lineTests.filter(t => t.status === 'pass').length;
      
      return {
        line: `Line ${lineNumber}`,
        totalOrders,
        completedOrders,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        qualityRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
        efficiency: Math.random() * 20 + 80 // Mock efficiency data
      };
    })
    .sort((a, b) => parseInt(a.line.split(' ')[1]) - parseInt(b.line.split(' ')[1]));

  // Daily production trend
  const dailyProduction = (() => {
    const days = new Map<string, { orders: number; quality: number; tests: number; passed: number }>();
    
    filteredOrders.forEach(order => {
      const day = new Date(order.productionDateTime).toLocaleDateString();
      if (!days.has(day)) {
        days.set(day, { orders: 0, quality: 0, tests: 0, passed: 0 });
      }
      days.get(day)!.orders++;
    });

    testResults.forEach(test => {
      const day = new Date(test.timestamp).toLocaleDateString();
      if (days.has(day)) {
        days.get(day)!.tests++;
        if (test.status === 'pass') {
          days.get(day)!.passed++;
        }
      }
    });

    return Array.from(days.entries())
      .map(([day, data]) => ({
        date: day,
        orders: data.orders,
        qualityRate: data.tests > 0 ? (data.passed / data.tests) * 100 : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

  // Operator productivity
  const operatorProductivity = Array.from(new Set(filteredOrders.map(o => o.operatorId)))
    .map(operatorId => {
      const operatorOrders = filteredOrders.filter(o => o.operatorId === operatorId);
      const operatorTests = testResults.filter(t => 
        operatorOrders.some(o => o.orderNumber === t.orderNumber)
      );
      
      return {
        operator: operatorId,
        ordersProcessed: operatorOrders.length,
        testsCompleted: operatorTests.length,
        avgTestsPerOrder: operatorOrders.length > 0 ? operatorTests.length / operatorOrders.length : 0,
        qualityScore: operatorTests.length > 0 ? 
          (operatorTests.filter(t => t.status === 'pass').length / operatorTests.length) * 100 : 0
      };
    })
    .filter(op => op.ordersProcessed > 0)
    .sort((a, b) => b.ordersProcessed - a.ordersProcessed);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-800">Total Orders</div>
          <div className="text-2xl font-bold text-blue-900">{filteredOrders.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-800">Completed</div>
          <div className="text-2xl font-bold text-green-900">
            {filteredOrders.filter(o => o.status === 'completed').length}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-sm font-medium text-amber-800">In Progress</div>
          <div className="text-2xl font-bold text-amber-900">
            {filteredOrders.filter(o => o.status === 'active').length}
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-800">Avg Completion Rate</div>
          <div className="text-2xl font-bold text-purple-900">
            {filteredOrders.length > 0 ? 
              ((filteredOrders.filter(o => o.status === 'completed').length / filteredOrders.length) * 100).toFixed(1)
              : 0}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Line Performance */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Production Line Performance
          </h3>
          {lineAnalysis.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lineAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="line" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalOrders" fill="#3b82f6" name="Total Orders" />
                  <Bar dataKey="completedOrders" fill="#22c55e" name="Completed Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No production data available
            </div>
          )}
        </div>

        {/* Daily Production Trend */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Production Trend
          </h3>
          {dailyProduction.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyProduction}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="Orders" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="qualityRate" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Quality Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* Line Efficiency Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Line Efficiency Analysis
        </h3>
        {lineAnalysis.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Production Line
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lineAnalysis.map((line) => (
                  <tr key={line.line}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {line.line}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {line.totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {line.completionRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {line.qualityRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              line.efficiency >= 90 ? 'bg-green-500' :
                              line.efficiency >= 80 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${line.efficiency}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {line.efficiency.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No line data available
          </div>
        )}
      </div>

      {/* Operator Productivity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Operator Productivity
        </h3>
        {operatorProductivity.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operatorProductivity.map((operator) => (
              <div key={operator.operator} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{operator.operator}</h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    operator.qualityScore >= 95 ? 'bg-green-100 text-green-800' :
                    operator.qualityScore >= 90 ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {operator.qualityScore.toFixed(1)}% Quality
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Orders: {operator.ordersProcessed}</div>
                  <div>Tests: {operator.testsCompleted}</div>
                  <div>Avg Tests/Order: {operator.avgTestsPerOrder.toFixed(1)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No operator data available
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionAnalysis;