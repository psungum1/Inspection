import React, { useState } from 'react';
import { Calendar, Filter, Download, TrendingUp, BarChart3, PieChart, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import TrendAnalysis from './TrendAnalysis';
import QualityMetrics from './QualityMetrics';
import ProductionAnalysis from './ProductionAnalysis';
import OrderAnalysis from './OrderAnalysis';
import FilterPanel from './FilterPanel';

const Analytics: React.FC = () => {
  const { state } = useApp();
  const [activeView, setActiveView] = useState<'trends' | 'quality' | 'production' | 'orders'>('trends');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  });
  const [filters, setFilters] = useState({
    lineNumbers: [] as number[],
    operatorIds: [] as string[],
    parameters: [] as string[]
  });
  const [showFilters, setShowFilters] = useState(false);

  const analyticsViews = [
    {
      id: 'trends' as const,
      name: 'Trend Analysis',
      icon: TrendingUp,
      description: 'Quality parameter trends over time'
    },
    /*
    {
      id: 'quality' as const,
      name: 'Quality Metrics',
      icon: PieChart,
      description: 'Pass/fail rates and compliance metrics'
    },
    {
      id: 'production' as const,
      name: 'Production Analysis',
      icon: BarChart3,
      description: 'Production line performance analysis'
    },
    */
    {
      id: 'orders' as const,
      name: 'Order Analysis',
      icon: FileText,
      description: 'Order analysis by batch pattern with PH & TCC data'
    }
  ];

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting analytics data as ${format}`);
    // Export implementation would go here
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Quality Analytics
        </h2>
        <p className="text-gray-600">
          Advanced analytics and insights for production quality data
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Date Range */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
            </div>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              orders={state.orders}
              parameters={state.testParameters}
            />
          </div>
        )}
      </div>

      {/* View Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {analyticsViews.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;
              
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-left">
                    <div>{view.name}</div>
                    <div className="text-xs text-gray-400">{view.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeView === 'trends' && (
            <TrendAnalysis
              testResults={state.testResults}
              parameters={state.testParameters}
              orders={state.orders}
              dateRange={dateRange}
              filters={filters}
            />
          )}
          {/*
          {activeView === 'quality' && (
            <QualityMetrics
              testResults={state.testResults}
              parameters={state.testParameters}
              dateRange={dateRange}
              filters={filters}
            />
          )}
          {activeView === 'production' && (
            <ProductionAnalysis
              orders={state.orders}
              testResults={state.testResults}
              dateRange={dateRange}
              filters={filters}
            />
          )}
          */}
          {activeView === 'orders' && (
            <OrderAnalysis />
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;