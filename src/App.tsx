import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import DataImport from './components/data-import/DataImport';
import TestEntry from './components/test-entry/TestEntry';
import Analytics from './components/analytics/Analytics';
import Login from './components/auth/Login';
import SqlServerMaterialImport from './components/data-import/SqlServerMaterialImport';
import ProductParameterManager from './components/settings/ProductParameterManager';
import TestResultsReport from './components/reports/TestResultsReport';

const AppContent: React.FC = () => {
  const { state } = useApp();
  const { currentView, user } = state;

  if (!user) {
    return <Login />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'data-import':
        return <DataImport />;
      case 'test-entry':
        return <TestEntry />;
      case 'analytics':
        return <Analytics />;
      case 'sqlserver-material-import':
        return <SqlServerMaterialImport />;
      case 'settings':
        return <ProductParameterManager />;
      case 'test-results-report':
        return <TestResultsReport />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;