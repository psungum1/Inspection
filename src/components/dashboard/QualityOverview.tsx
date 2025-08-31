import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const QualityOverview: React.FC = () => {
  const { state } = useApp();
  const { testResults } = state;

  // Calculate quality metrics
  const totalTests = testResults.length;
  const passedTests = testResults.filter(test => test.status === 'pass').length;
  const warningTests = testResults.filter(test => test.status === 'warning').length;
  const failedTests = testResults.filter(test => test.status === 'fail').length;

  const qualityMetrics = [
    {
      label: 'Passed',
      count: passedTests,
      percentage: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      label: 'Warning',
      count: warningTests,
      percentage: totalTests > 0 ? (warningTests / totalTests) * 100 : 0,
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      label: 'Failed',
      count: failedTests,
      percentage: totalTests > 0 ? (failedTests / totalTests) * 100 : 0,
      icon: XCircle,
      color: 'text-red-600 bg-red-50 border-red-200'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quality Overview
      </h3>
      
      <div className="space-y-4">
        {qualityMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className={`p-3 rounded-lg border ${metric.color}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <span className="text-sm font-bold">{metric.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metric.label === 'Passed' 
                      ? 'bg-green-500'
                      : metric.label === 'Warning'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${metric.percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {metric.percentage.toFixed(1)}% of total tests
              </div>
            </div>
          );
        })}
      </div>

      {totalTests === 0 && (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No test data available</p>
        </div>
      )}
    </div>
  );
};

export default QualityOverview;