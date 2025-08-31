export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'quality_manager' | 'operator' | 'viewer';
  permissions: string[];
}

export interface ProductionOrder {
  orderNumber: string;
  lineNumber: number | string;
  productionDateTime: string;
  operatorId: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  testResults: TestResult[];
  testResultsCount?: number; // Add optional test results count
  createdAt: string;
  updatedAt: string;
  // PLC-specific fields
  productName?: string;
  recipeName?: string;
  campaignId?: string;
  lotId?: string;
  batchSize?: number;
  batchLogId?: string;
}

export interface TestResult {
  id: string;
  orderNumber: string;
  parameterId: string;
  round: number;
  stage?: string;
  value: number;
  unit: string;
  timestamp: string;
  operatorId: string;
  status: 'pass' | 'warning' | 'fail';
  comments?: string;
  attachments?: string[];
}

export interface TestParameter {
  id: string;
  name: string;
  unit: string;
  minValue: number;
  maxValue: number;
  warningMin: number;
  warningMax: number;
  criticalMin?: number;
  criticalMax?: number;
  category: string;
  description?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  errors: ValidationError[];
  duplicates: string[];
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    dateRange?: { start: string; end: string };
    lineNumbers?: number[];
    operatorIds?: string[];
    status?: string[];
  };
}

export interface DashboardMetrics {
  activeOrders: number;
  completedToday: number;
  testsPending: number;
  qualityCompliance: number;
  lineUtilization: { [key: string]: { percent: number; productName: string | null; lotId: string | null; batchId: string | null } };
}

export interface ChartData {
  timestamp: string;
  value: number;
  threshold?: number;
  status: 'pass' | 'warning' | 'fail';
}

export interface TestStage {
  id: number;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductParameterMapping {
  id: number;
  product_name: string;
  parameter_name: string;
  parameter_order: number;
  unit?: string;
  acceptable_min?: number;
  acceptable_max?: number;
  warning_min?: number;
  warning_max?: number;
  critical_min?: number;
  critical_max?: number;
}