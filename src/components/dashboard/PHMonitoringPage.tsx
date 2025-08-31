import React from 'react';
import PHRealTimeView from './PHRealTimeView';

const PHMonitoringPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PH Real-Time Monitoring</h1>
          <p className="text-gray-600">
            Live monitoring of PH values across all production lines.
            Displaying the latest 100 real-time measurements.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <PHRealTimeView />
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PH Monitoring Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">What is PH?</h4>
                <p className="text-sm text-gray-600">
                  PH (Potential of Hydrogen) is a measure of the acidity or alkalinity of a solution. 
                  It's a critical parameter in production processes that affects product quality, 
                  chemical reactions, and process efficiency.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Real-Time Data</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Updates every 2 seconds</li>
                  <li>• Shows last 100 measurements</li>
                  <li>• Monitors 6 production lines</li>
                  <li>• Automatic data management</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PHMonitoringPage; 