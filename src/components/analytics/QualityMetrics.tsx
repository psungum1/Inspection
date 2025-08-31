import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TestResult, TestParameter } from '../../types';

interface QualityMetricsProps {
  testResults: TestResult[];
  parameters: TestParameter[];
  dateRange: { start: string; end: string };
  filters: {
    lineNumbers: number[];
    operatorIds: string[];
    parameters: string[];
  };
}

const QualityMetrics: React.FC<QualityMetricsProps> = ({ 
  testResults, 
  parameters, 
  dateRange, 
  filters 
}) => {
  // Filter data based on date range and filters
  const filteredResults = testResults.filter(result => {
    const resultDate = new Date(result.timestamp);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    return resultDate >= startDate && 
           resultDate <= endDate &&
           (filters.parameters.length === 0 || filters.parameters.includes(result.parameterId)) &&
           (filters.operatorIds.length === 0 || filters.operatorIds.includes(result.operatorId));
  });

  // Calculate overall quality metrics
  const totalTests = filteredResults.length;
  const passedTests = filteredResults.filter(r => r.status === 'pass').length;
  const warningTests = filteredResults.filter(r => r.status === 'warning').length;
  const failedTests = filteredResults.filter(r => r.status === 'fail').length;

  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const warningRate = totalTests > 0 ? (warningTests / totalTests) * 100 : 0;
  const failRate = totalTests > 0 ? (failedTests / totalTests) * 100 : 0;

  // Pie chart data
  const pieData = [
    { name: 'Pass', value: passedTests, color: '#22c55e' },
    { name: 'Warning', value: warningTests, color: '#f59e0b' },
    { name: 'Fail', value: failedTests, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Parameter-wise quality data
  const parameterQuality = parameters.map(param => {
    const paramResults = filteredResults.filter(r => r.parameterId === param.id);
    const paramTotal = paramResults.length;
    const paramPassed = paramResults.filter(r => r.status === 'pass').length;
    const paramWarning = paramResults.filter(r => r.status === 'warning').length;
    const paramFailed = paramResults.filter(r => r.status === 'fail').length;

    return {
      name: param.name,
      pass: paramTotal > 0 ? (paramPassed / paramTotal) * 100 : 0,
      warning: paramTotal > 0 ? (paramWarning / paramTotal) * 100 : 0,
      fail: paramTotal > 0 ? (paramFailed / paramTotal) * 100 : 0,
      total: paramTotal
    };
  }).filter(item => item.total > 0);

  // Operator performance data
  const operatorPerformance = Array.from(new Set(filteredResults.map(r => r.operatorId)))
    .map(operatorId => {
      const operatorResults = filteredResults.filter(r => r.operatorId === operatorId);
      const operatorTotal = operatorResults.length;
      const operatorPassed = operatorResults.filter(r => r.status === 'pass').length;

      return {
        operator: operatorId,
        passRate: operatorTotal > 0 ? (operatorPassed / operatorTotal) * 100 : 0,
        totalTests: operatorTotal
      };
    })
    .filter(item => item.totalTests > 0)
    .sort((a, b) => b.passRate - a.passRate);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-800">Total Tests</div>
          <div className="text-2xl font-bold text-blue-900">{totalTests}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-800">Pass Rate</div>
          <div className="text-2xl font-bold text-green-900">{passRate.toFixed(1)}%</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-sm font-medium text-amber-800">Warning Rate</div>
          <div className="text-2xl font-bold text-amber-900">{warningRate.toFixed(1)}%</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-800">Fail Rate</div>
          <div className="text-2xl font-bold text-red-900">{failRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Distribution Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quality Distribution
          </h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Parameter Quality Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quality by Parameter
          </h3>
          {parameterQuality.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={parameterQuality} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                  <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="pass" stackId="a" fill="#22c55e" name="Pass" />
                  <Bar dataKey="warning" stackId="a" fill="#f59e0b" name="Warning" />
                  <Bar dataKey="fail" stackId="a" fill="#ef4444" name="Fail" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Operator Performance */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Operator Performance
        </h3>
        {operatorPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Tests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pass Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {operatorPerformance.map((operator) => (
                  <tr key={operator.operator}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {operator.operator}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {operator.totalTests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {operator.passRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              operator.passRate >= 95 ? 'bg-green-500' :
                              operator.passRate >= 90 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${operator.passRate}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${
                          operator.passRate >= 95 ? 'text-green-600' :
                          operator.passRate >= 90 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {operator.passRate >= 95 ? 'Excellent' :
                           operator.passRate >= 90 ? 'Good' : 'Needs Improvement'}
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
            No operator data available
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityMetrics;