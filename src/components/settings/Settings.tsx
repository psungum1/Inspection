import React, { useState } from 'react';
import { Save, AlertTriangle, Calendar, Globe, Shield, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ParameterSettings from './ParameterSettings';
import ScheduleSettings from './ScheduleSettings';
import SecuritySettings from './SecuritySettings';
import ProductParameterManager from './ProductParameterManager';
import TestStageManager from './TestStageManager';

const Settings: React.FC = () => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'parameters' | 'schedules' | 'security' | 'general' | 'mapping' | 'stages'>('parameters');
  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    {
      id: 'parameters' as const,
      name: 'Quality Parameters',
      icon: AlertTriangle,
      description: 'Configure acceptable ranges and thresholds'
    },
    {
      id: 'schedules' as const,
      name: 'Inspection Schedules',
      icon: Calendar,
      description: 'Set up automated inspection schedules'
    },
    {
      id: 'security' as const,
      name: 'Security & Access',
      icon: Shield,
      description: 'Manage user roles and security settings'
    },
    {
      id: 'general' as const,
      name: 'General Settings',
      icon: Globe,
      description: 'Language, notifications, and system preferences'
    },
    {
      id: 'mapping' as const,
      name: 'Product-Parameter Mapping',
      icon: Save,
      description: 'Manage product to parameter mapping'
    },
    {
      id: 'stages' as const,
      name: 'Test Stages',
      icon: Layers,
      description: 'Manage test stages for quality control rounds'
    }
  ];

  const handleSave = () => {
    // Save all changes
    console.log('Saving settings...');
    setHasChanges(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          System Settings
        </h2>
        <p className="text-gray-600">
          Configure quality parameters, schedules, and system preferences
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'parameters' && (
            <ParameterSettings 
              parameters={state.testParameters}
              onChange={() => setHasChanges(true)}
            />
          )}
          {activeTab === 'schedules' && (
            <ScheduleSettings 
              schedules={[]}
              parameters={state.testParameters}
              onChange={() => setHasChanges(true)}
            />
          )}
          {activeTab === 'security' && (
            <SecuritySettings onChange={() => setHasChanges(true)} />
          )}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  General Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Language
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Zone
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="UTC-8">Pacific Time (UTC-8)</option>
                      <option value="UTC-5">Eastern Time (UTC-5)</option>
                      <option value="UTC+0">UTC</option>
                      <option value="UTC+8">China Standard Time (UTC+8)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Email Notifications
                      </label>
                      <p className="text-sm text-gray-500">
                        Receive email alerts for critical quality issues
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        SMS Alerts
                      </label>
                      <p className="text-sm text-gray-500">
                        Send SMS for urgent quality failures
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Calibration Reminders
                      </label>
                      <p className="text-sm text-gray-500">
                        Automatic reminders for equipment calibration
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Test Round Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Number of Rounds
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      defaultValue="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Default number of test rounds per order
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allow Unlimited Rounds
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Allow operators to create additional rounds beyond default
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'mapping' && (
            <ProductParameterManager />
          )}
          {activeTab === 'stages' && (
            <TestStageManager />
          )}
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                You have unsaved changes
              </p>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;