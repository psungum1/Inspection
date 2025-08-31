import React, { useState } from 'react';
import { Download, Calendar, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Reports: React.FC = () => {
  const { state } = useApp();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  });

  const reportTypes = [
    {
      id: 'daily',
      name: 'Daily Quality Report',
      description: 'Comprehensive daily summary of all quality metrics',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 'weekly',
      name: 'Weekly Trend Analysis',
      description: 'Weekly trends and statistical analysis',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'compliance',
      name: 'Regulatory Compliance Report',
      description: 'Report for regulatory authorities and audits',
      icon: BarChart3,
      color: 'purple'
    },
    {
      id: 'coa',
      name: 'Certificate of Analysis',
      description: 'Detailed certificate for specific batches',
      icon: FileText,
      color: 'amber'
    }
  ];

  const mockReports = [
    {
      id: '1',
      name: 'Daily Quality Report - 2025-01-02',
      type: 'Daily Report',
      date: '2025-01-02',
      status: 'ready',
      size: '2.3 MB'
    },
    {
      id: '2',
      name: 'Weekly Analysis - Week 1',
      type: 'Weekly Report',
      date: '2025-01-01',
      status: 'ready',
      size: '5.7 MB'
    },
    {
      id: '3',
      name: 'Compliance Report - December 2024',
      type: 'Compliance',
      date: '2024-12-31',
      status: 'generating',
      size: 'Processing...'
    }
  ];

  const handleGenerateReport = (reportType: string) => {
    console.log('Generating report:', reportType, dateRange);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      amber: 'bg-amber-100 text-amber-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Reports & Analytics
        </h2>
        <p className="text-gray-600">
          Generate comprehensive reports and export quality control data
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Date Range</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${getIconColor(report.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {report.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {report.description}
                  </p>
                  <button
                    onClick={() => handleGenerateReport(report.id)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {mockReports.map((report) => (
            <div key={report.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {report.name}
                  </h4>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{report.type}</span>
                    <span>{report.date}</span>
                    <span>{report.size}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                  {report.status === 'ready' && (
                    <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Export</h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;