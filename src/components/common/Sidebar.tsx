import React from 'react';
import { 
  BarChart3, 
  Upload, 
  ClipboardCheck, 
  TrendingUp, 
  Settings,
  Activity,
  Database,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Sidebar: React.FC = () => {
  const { state, dispatch } = useApp();
  const { currentView, user } = state;

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      view: 'dashboard' as const,
      description: 'Production overview and metrics'
    },
    /*
    {
      id: 'data-import',
      name: 'Data Import',
      icon: Upload,
      view: 'data-import' as const,
      description: 'Import production data files'
    },
    */
    {
      id: 'test-entry',
      name: 'Test Entry',
      icon: ClipboardCheck,
      view: 'test-entry' as const,
      description: 'Manual test data entry'
    },
    {
      id: 'sqlserver-material-import',
      name: 'Import SQL',
      icon: ClipboardCheck,
      view: 'sqlserver-material-import' as const,
      description: 'Manual test data entry'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: TrendingUp,
      view: 'analytics' as const,
      description: 'Quality trends and analysis'
    },
    {
      id: 'test-results-report',
      name: 'Test Results',
      icon: FileText,
      view: 'test-results-report' as const,
      description: 'View test results report'
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      view: 'settings' as const,
      description: 'System configuration',
      adminOnly: true
    }
  ];

  const canAccessItem = (item: typeof menuItems[0]) => {
    if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'quality_manager') {
      return false;
    }
    return true;
  };

  return (
    <div className="bg-white shadow-sm border-r border-gray-200 w-64 flex flex-col">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">PQMS</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          if (!canAccessItem(item)) return null;
          
          const Icon = item.icon;
          const isActive = currentView === item.view;
          
          return (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_VIEW', payload: item.view })}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-5 w-5 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              }`} />
              <div className="flex-1 text-left">
                <div className="font-medium">{item.name}</div>
                <div className={`text-xs ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">System Status</span>
          </div>
          <div className="space-y-1 text-xs text-blue-600">
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="font-medium text-green-600">Online</span>
            </div>
            <div className="flex justify-between">
              <span>Last Sync:</span>
              <span className="font-medium">2 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;