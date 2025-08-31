import React from 'react';
import { Bell, Settings, User, LogOut, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Header: React.FC = () => {
  const { state, dispatch } = useApp();
  const { user, currentView } = state;

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
    } catch {}
    dispatch({ type: 'SET_USER', payload: null });
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Production Quality Dashboard';
      case 'data-import':
        return 'Data Import & Management';
      case 'test-entry':
        return 'Test Data Entry';
      case 'analytics':
        return 'Quality Analytics';
      case 'settings':
        return 'System Settings';
      default:
        return 'Production Quality Management System';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {getViewTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* System Status */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">System Online</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
            </button>

            {/* Settings */}
            <button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'settings' })}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* User Menu */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-xs">{user?.role.replace('_', ' ').toUpperCase()}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;