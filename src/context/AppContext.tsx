import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, ProductionOrder, TestParameter, TestResult, FilterPreset, DashboardMetrics } from '../types';

interface AppState {
  user: User | null;
  orders: ProductionOrder[];
  testParameters: TestParameter[];
  testResults: TestResult[];
  filterPresets: FilterPreset[];
  dashboardMetrics: DashboardMetrics;
  currentView: 'dashboard' | 'data-import' | 'test-entry' | 'analytics' | 'settings' | 'sqlserver-material-import' | 'test-results-report';
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_VIEW'; payload: AppState['currentView'] }
  | { type: 'SET_ORDERS'; payload: ProductionOrder[] }
  | { type: 'ADD_ORDER'; payload: ProductionOrder }
  | { type: 'UPDATE_ORDER'; payload: ProductionOrder }
  | { type: 'ADD_TEST_RESULT'; payload: TestResult }
  | { type: 'UPDATE_TEST_PARAMETERS'; payload: TestParameter[] }
  | { type: 'SET_DASHBOARD_METRICS'; payload: DashboardMetrics }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'ADD_FILTER_PRESET'; payload: FilterPreset };

const initialState: AppState = {
  user: null,
  orders: [],
  testParameters: [
    {
      id: 'moisture',
      name: 'Moisture Content',
      unit: '%',
      minValue: 10,
      maxValue: 15,
      warningMin: 11,
      warningMax: 14,
      category: 'Physical Properties'
    },
    {
      id: 'ph',
      name: 'pH Level',
      unit: 'pH',
      minValue: 5.0,
      maxValue: 8.0,
      warningMin: 5.5,
      warningMax: 7.5,
      category: 'Chemical Properties'
    },
    {
      id: 'viscosity',
      name: 'Viscosity',
      unit: 'cP',
      minValue: 500,
      maxValue: 1000,
      warningMin: 600,
      warningMax: 900,
      category: 'Physical Properties'
    },
    {
      id: 'density',
      name: 'Density',
      unit: 'g/cm³',
      minValue: 1.0,
      maxValue: 1.5,
      warningMin: 1.1,
      warningMax: 1.4,
      category: 'Physical Properties'
    }
  ],
  testResults: [],
  filterPresets: [],
  dashboardMetrics: {
    activeOrders: 0,
    completedToday: 0,
    testsPending: 0,
    qualityCompliance: 0,
    lineUtilization: {}
  },
  currentView: 'dashboard',
  isLoading: false,
  error: null,
  success: null
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.orderNumber === action.payload.orderNumber ? action.payload : order
        )
      };
    case 'ADD_TEST_RESULT':
      return { ...state, testResults: [action.payload, ...state.testResults] };
    case 'UPDATE_TEST_PARAMETERS':
      return { ...state, testParameters: action.payload };
    case 'SET_DASHBOARD_METRICS':
      return { ...state, dashboardMetrics: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    case 'ADD_FILTER_PRESET':
      return { ...state, filterPresets: [...state.filterPresets, action.payload] };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};