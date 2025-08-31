import React from 'react';
import { TestParameter, TestResult } from '../../types';

interface TrendChartProps {
  lineNumber: number;
  parameter: TestParameter;
  testResults: TestResult[];
}

const TrendChart: React.FC<TrendChartProps> = ({ lineNumber, parameter, testResults }) => {
  // Filter testResults for this line and parameter
  const filteredResults = testResults
    .filter(tr => tr.parameterId === parameter.id)
    .filter(tr => {
      // Find the order for this testResult
      // Assume testResult.orderNumber is unique in orders
      // We'll need to pass orders if we want to filter by lineNumber
      // For now, assume testResult has lineNumber (if not, this will be fixed in Dashboard)
      // We'll show all results for this parameter
      return true;
    });

  // Sort by timestamp
  const sortedResults = filteredResults.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Prepare chart data
  const chartData = sortedResults.map(result => ({
    time: new Date(result.timestamp).toLocaleString(),
    value: result.value,
    status: result.status
  }));

  // Min/max/warning lines
  const maxValue = Math.max(parameter.maxValue, ...chartData.map(d => d.value));
  const minValue = Math.min(parameter.minValue, ...chartData.map(d => d.value));
  const range = maxValue - minValue;
  const padding = range * 0.1;

  const chartHeight = 200;
  const chartWidth = 600;

  const getY = (value: number) => {
    return chartHeight - ((value - minValue + padding) / (range + 2 * padding)) * chartHeight;
  };

  const pathData = chartData.map((point, index) => {
    const x = (index / (chartData.length - 1)) * chartWidth;
    const y = getY(point.value);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Trend for Line {lineNumber} - {parameter.name}
      </div>
      <div className="relative">
        <svg width={chartWidth} height={chartHeight} className="w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Control limits */}
          <line
            x1="0"
            y1={getY(parameter.maxValue)}
            x2={chartWidth}
            y2={getY(parameter.maxValue)}
            stroke="#22c55e"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <line
            x1="0"
            y1={getY(parameter.minValue)}
            x2={chartWidth}
            y2={getY(parameter.minValue)}
            stroke="#22c55e"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <line
            x1="0"
            y1={getY(parameter.warningMax)}
            x2={chartWidth}
            y2={getY(parameter.warningMax)}
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          <line
            x1="0"
            y1={getY(parameter.warningMin)}
            x2={chartWidth}
            y2={getY(parameter.warningMin)}
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="3,3"
          />

          {/* Data line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {chartData.map((point, index) => (
            <circle
              key={index}
              cx={(index / (chartData.length - 1)) * chartWidth}
              cy={getY(point.value)}
              r="4"
              fill="#3b82f6"
              className="hover:r-6 transition-all cursor-pointer"
            />
          ))}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-green-500 border-dashed"></div>
            <span className="text-gray-600">Acceptable Range</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-amber-500 border-dashed"></div>
            <span className="text-gray-600">Warning Range</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600">Actual Values</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendChart;