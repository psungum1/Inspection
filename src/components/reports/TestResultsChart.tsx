import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { TrendingUp, BarChart3 } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface TestResultData {
  id: string;
  order_number: string;
  parameter_id: string;
  parameter_name: string;
  round: number;
  value: number;
  unit: string;
  status: 'pass' | 'warning' | 'fail';
  operator_id: string;
  timestamp: string;
  acceptable_min?: number;
  acceptable_max?: number;
  warning_min?: number;
  warning_max?: number;
  critical_min?: number;
  critical_max?: number;
  product_name?: string;
}

interface TestResultsChartProps {
  className?: string;
  filteredData: TestResultData[];
  selectedParameter: string;
  dateFrom: string;
  dateTo: string;
}

const TestResultsChart: React.FC<TestResultsChartProps> = ({ 
  className = '', 
  filteredData, 
  selectedParameter, 
  dateFrom, 
  dateTo 
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [groupBy, setGroupBy] = useState<'date' | 'order' | 'round'>('date');
  
  // Available parameters from filtered data
  const availableParameters = Array.from(new Set(filteredData.map(r => r.parameter_name)));

  const getChartData = () => {
    if (!selectedParameter || filteredData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Filter data by selected parameter
    const parameterData = filteredData.filter(item => item.parameter_name === selectedParameter);
    
    if (parameterData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    let labels: string[] = [];
    let values: number[] = [];
    let passValues: number[] = [];
    let warningValues: number[] = [];
    let failValues: number[] = [];

    if (groupBy === 'date') {
      // Group by date
      const groupedByDate = parameterData.reduce((acc, item) => {
        const date = new Date(item.timestamp).toLocaleDateString('th-TH');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(item);
        return acc;
      }, {} as Record<string, TestResultData[]>);

      labels = Object.keys(groupedByDate).sort();
      
             labels.forEach(date => {
         const dayData = groupedByDate[date];
         const avgValue = dayData.reduce((sum, item) => sum + item.value, 0) / dayData.length;
         values.push(avgValue);
         
         const passData = dayData.filter(item => item.status === 'pass');
         const warningData = dayData.filter(item => item.status === 'warning');
         const failData = dayData.filter(item => item.status === 'fail');
         
         const passAvg = passData.length > 0 ? passData.reduce((sum, item) => sum + item.value, 0) / passData.length : 0;
         const warningAvg = warningData.length > 0 ? warningData.reduce((sum, item) => sum + item.value, 0) / warningData.length : 0;
         const failAvg = failData.length > 0 ? failData.reduce((sum, item) => sum + item.value, 0) / failData.length : 0;
         
         passValues.push(passAvg);
         warningValues.push(warningAvg);
         failValues.push(failAvg);
       });
    } else if (groupBy === 'order') {
      // Group by order
      const groupedByOrder = parameterData.reduce((acc, item) => {
        if (!acc[item.order_number]) {
          acc[item.order_number] = [];
        }
        acc[item.order_number].push(item);
        return acc;
      }, {} as Record<string, TestResultData[]>);

      labels = Object.keys(groupedByOrder);
      
             labels.forEach(order => {
         const orderData = groupedByOrder[order];
         const avgValue = orderData.reduce((sum, item) => sum + item.value, 0) / orderData.length;
         values.push(avgValue);
         
         const passData = orderData.filter(item => item.status === 'pass');
         const warningData = orderData.filter(item => item.status === 'warning');
         const failData = orderData.filter(item => item.status === 'fail');
         
         const passAvg = passData.length > 0 ? passData.reduce((sum, item) => sum + item.value, 0) / passData.length : 0;
         const warningAvg = warningData.length > 0 ? warningData.reduce((sum, item) => sum + item.value, 0) / warningData.length : 0;
         const failAvg = failData.length > 0 ? failData.reduce((sum, item) => sum + item.value, 0) / failData.length : 0;
         
         passValues.push(passAvg);
         warningValues.push(warningAvg);
         failValues.push(failAvg);
       });
    } else {
      // Group by round
      const groupedByRound = parameterData.reduce((acc, item) => {
        if (!acc[item.round]) {
          acc[item.round] = [];
        }
        acc[item.round].push(item);
        return acc;
      }, {} as Record<number, TestResultData[]>);

      labels = Object.keys(groupedByRound).map(Number).sort((a, b) => a - b).map(String);
      
             labels.forEach(round => {
         const roundData = groupedByRound[Number(round)];
         const avgValue = roundData.reduce((sum, item) => sum + item.value, 0) / roundData.length;
         values.push(avgValue);
         
         const passData = roundData.filter(item => item.status === 'pass');
         const warningData = roundData.filter(item => item.status === 'warning');
         const failData = roundData.filter(item => item.status === 'fail');
         
         const passAvg = passData.length > 0 ? passData.reduce((sum, item) => sum + item.value, 0) / passData.length : 0;
         const warningAvg = warningData.length > 0 ? warningData.reduce((sum, item) => sum + item.value, 0) / warningData.length : 0;
         const failAvg = failData.length > 0 ? failData.reduce((sum, item) => sum + item.value, 0) / failData.length : 0;
         
         passValues.push(passAvg);
         warningValues.push(warningAvg);
         failValues.push(failAvg);
       });
    }

    // Get reference lines from first item (they should be the same for the parameter)
    const firstItem = parameterData[0];
    const datasets = [
      {
        label: 'Average Value',
        data: values,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1
      }
    ];

    // Add status datasets if grouping by date
    if (groupBy === 'date') {
      datasets.push(
        {
          label: 'Pass',
          data: passValues,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1
        },
        {
          label: 'Warning',
          data: warningValues,
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1
        },
        {
          label: 'Fail',
          data: failValues,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1
        }
      );
    }

    // Add reference lines
    if (firstItem.acceptable_min !== undefined) {
      datasets.push({
        label: 'Acceptable Min',
        data: new Array(labels.length).fill(firstItem.acceptable_min),
        borderColor: 'rgba(34, 197, 94, 0.5)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 1,
        fill: false,
        tension: 0,
        borderDash: [5, 5]
      } as any);
    }

    if (firstItem.acceptable_max !== undefined) {
      datasets.push({
        label: 'Acceptable Max',
        data: new Array(labels.length).fill(firstItem.acceptable_max),
        borderColor: 'rgba(34, 197, 94, 0.5)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 1,
        fill: false,
        tension: 0,
        borderDash: [5, 5]
      } as any);
    }

    if (firstItem.warning_min !== undefined) {
      datasets.push({
        label: 'Warning Min',
        data: new Array(labels.length).fill(firstItem.warning_min),
        borderColor: 'rgba(245, 158, 11, 0.5)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        fill: false,
        tension: 0,
        borderDash: [5, 5]
      } as any);
    }

    if (firstItem.warning_max !== undefined) {
      datasets.push({
        label: 'Warning Max',
        data: new Array(labels.length).fill(firstItem.warning_max),
        borderColor: 'rgba(245, 158, 11, 0.5)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        fill: false,
        tension: 0,
        borderDash: [5, 5]
      } as any);
    }

    if (firstItem.critical_min !== undefined) {
      datasets.push({
        label: 'Critical Min',
        data: new Array(labels.length).fill(firstItem.critical_min),
        borderColor: 'rgba(239, 68, 68, 0.5)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        fill: false,
        tension: 0,
        borderDash: [5, 5]
      } as any);
    }

    if (firstItem.critical_max !== undefined) {
      datasets.push({
        label: 'Critical Max',
        data: new Array(labels.length).fill(firstItem.critical_max),
        borderColor: 'rgba(239, 68, 68, 0.5)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        fill: false,
        tension: 0,
        borderDash: [5, 5]
      } as any);
    }

    return {
      labels,
      datasets
    };
  };

    const getChartOptions = () => {
    const firstItem = filteredData.find(item => item.parameter_name === selectedParameter);
    const unit = firstItem?.unit || '';
    const parameterData = filteredData.filter(item => item.parameter_name === selectedParameter);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `${selectedParameter} Trend Analysis (${parameterData.length} data points | Avg: ${parameterData.length > 0 ? (parameterData.reduce((sum: number, item: TestResultData) => sum + item.value, 0) / parameterData.length).toFixed(2) : 'N/A'})`
        },
                 tooltip: {
           callbacks: {
             label: function(context: any) {
               let label = context.dataset.label || '';
               if (label) {
                 label += ': ';
               }
               if (context.parsed.y !== null) {
                 label += context.parsed.y.toFixed(2);
                 if (unit) {
                   label += ` ${unit}`;
                 }
               }
               return label;
             }
           }
         }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: groupBy === 'date' ? 'Date' : groupBy === 'order' ? 'Order Number' : 'Round'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: unit ? `Value (${unit})` : 'Value'
          }
        }
      }
    };
  };

  const chartData = getChartData();
  const chartOptions = getChartOptions();

  // Calculate chart statistics
  const chartStats = {
    total: filteredData.filter(item => item.parameter_name === selectedParameter).length,
    pass: filteredData.filter(item => item.parameter_name === selectedParameter && item.status === 'pass').length,
    warning: filteredData.filter(item => item.parameter_name === selectedParameter && item.status === 'warning').length,
    fail: filteredData.filter(item => item.parameter_name === selectedParameter && item.status === 'fail').length
  };

  if (!selectedParameter) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500 py-8">
          <p>No parameter selected for chart display</p>
          <p className="text-sm">Please select a parameter from the filters above</p>
        </div>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500 py-8">
          <p>No data available for chart display</p>
          <p className="text-sm">Please adjust your filters to see data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Test Results Trend Analysis
        </h3>
        
        {/* Chart Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Chart Type Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded-md transition-colors ${
                chartType === 'line' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Line Chart"
            >
              <TrendingUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-md transition-colors ${
                chartType === 'bar' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Bar Chart"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>

          {/* Group By Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Group by:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'date' | 'order' | 'round')}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Date</option>
              <option value="order">Order</option>
              <option value="round">Round</option>
            </select>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          {chartType === 'line' ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>

        {/* Chart Statistics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{chartStats.total}</div>
            <div className="text-sm text-blue-700">Total Tests</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{chartStats.pass}</div>
            <div className="text-sm text-green-700">Pass</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{chartStats.warning}</div>
            <div className="text-sm text-amber-700">Warning</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{chartStats.fail}</div>
            <div className="text-sm text-red-700">Fail</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResultsChart;
