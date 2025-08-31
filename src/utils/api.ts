import { ProductParameterMapping } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login'; // or your login route
        return { error: 'Session expired. Please log in again.' };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Orders API
  async getOrders(params?: {
    status?: string;
    lineNumber?: number;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/api/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  }

  // Dashboard API
  async getDashboardMetrics(): Promise<ApiResponse<{
    activeOrders: number;
    completedToday: number;
    testsPending: number;
    qualityCompliance: number;
    lineUtilization: Record<string, { percent: number; productName: string | null; lotId: string | null; batchId: string | null }>;
    totalRoundsActiveOrders?: number;
  }>> {
    return this.request('/api/dashboard/metrics');
  }

  async getOrdersWithTestResults(params?: {
    status?: string;
    lineNumber?: number;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/api/orders/with-results${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  }

  async getOrder(orderNumber: string): Promise<ApiResponse<any>> {
    return this.request(`/api/orders/${orderNumber}`);
  }

  async getOrderWithTestResults(orderNumber: string): Promise<ApiResponse<any>> {
    return this.request(`/api/orders/${orderNumber}/with-results`);
  }

  async createOrder(orderData: {
    orderNumber: string;
    lineNumber: number;
    productionDateTime: string;
    operatorId: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async bulkImportOrders(orders: Array<{
    orderNumber: string;
    lineNumber: number;
    productionDateTime: string;
    operatorId: string;
  }>): Promise<ApiResponse<{
    success: boolean;
    totalRows: number;
    successfulRows: number;
    errors: any[];
    duplicates: string[];
    importedOrders: any[];
  }>> {
    return this.request('/api/orders/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ orders }),
    });
  }

  async updateOrderStatus(orderNumber: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/api/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteOrder(orderNumber: string): Promise<ApiResponse<any>> {
    return this.request(`/api/orders/${orderNumber}`, {
      method: 'DELETE',
    });
  }

  // Test Results API
  async getTestResults(orderNumber?: string): Promise<ApiResponse<any[]>> {
    const params = orderNumber ? `?orderNumber=${orderNumber}` : '';
    return this.request(`/api/test-results${params}`);
  }

  async getTestResultsByRound(orderNumber: string, round: number): Promise<ApiResponse<any[]>> {
    return this.request(`/api/test-results/order/${orderNumber}/round/${round}`);
  }

  async createTestResult(testData: {
    orderNumber: string;
    parameterId: string;
    round: number;
    stage?: string;
    value: number;
    unit: string;
    operatorId: string;
    status: string;
    comments?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/api/test-results', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  }

  async updateTestResult(id: string, testData: {
    value?: number;
    unit?: string;
    status?: string;
    comments?: string;
  }): Promise<ApiResponse<any>> {
    return this.request(`/api/test-results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(testData),
    });
  }

  async deleteTestResult(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/test-results/${id}`, {
      method: 'DELETE',
    });
  }

  // Test Parameters API
  async getTestParameters(): Promise<ApiResponse<any[]>> {
    return this.request('/api/test-parameters');
  }

  async createTestParameter(parameterData: {
    name: string;
    unit: string;
    minValue: number;
    maxValue: number;
    warningMin: number;
    warningMax: number;
    category: string;
    description?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/api/test-parameters', {
      method: 'POST',
      body: JSON.stringify(parameterData),
    });
  }

  // Users API
  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.request('/api/users');
  }

  async createUser(userData: {
    name: string;
    email: string;
    role: string;
    permissions: string[];
  }): Promise<ApiResponse<any>> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Auth API
  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request('/api/auth/me');
  }

  async searchOrders(params: {
    query?: string;
    status?: string;
    lineNumber?: number;
    operatorId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.request(`/api/orders/search?${searchParams.toString()}`);
  }

  async searchPlcOrders(params: {
    query?: string;
    batchId?: string;
    productId?: string;
    recipeId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.request(`/api/orders/plc/search?${searchParams.toString()}`);
  }

  // PLC product names dropdown
  async getPlcProductNames(params?: {
    startDate?: string;
    endDate?: string;
    onlyWithResults?: boolean;
  }): Promise<ApiResponse<Array<{ product_name: string; order_count: number; test_results_count: number }>>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    return this.request(`/api/orders/plc/product-names${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  }

  // Test results joined with PLC orders by product
  async getTestResultsByProduct(params: {
    productName: string;
    parameterId?: string;
    operatorIds?: string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('productName', params.productName);
    if (params.parameterId) searchParams.append('parameterId', params.parameterId);
    if (params.operatorIds && params.operatorIds.length) searchParams.append('operatorIds', params.operatorIds.join(','));
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    return this.request(`/api/orders/plc/test-results-by-product?${searchParams.toString()}`);
  }

  async getPlcOrderWithResults(batchId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/orders/plc/${batchId}/with-results`);
  }

  // SQL Server PH API
  async getPHBatchDetail(batchId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/orders/sqlserver/batchdetail?batchId=${encodeURIComponent(batchId)}`);
  }

  // SQL Server PH Batch List API (เฉพาะ batch ที่ยังไม่ close)
  async getPHBatchList(): Promise<ApiResponse<any[]>> {
    return this.request('/api/orders/sqlserver/batchlist');
  }

  // Get unique parameter_id values from ProcessVar
  async getParameterIds(batchId?: string): Promise<ApiResponse<string[]>> {
    const params = batchId ? `?batchId=${batchId}` : '';
    return this.request(`/api/orders/sqlserver/parameters${params}`);
  }

  // Get parameter data for any parameter_id
  async getParameterData(batchId: string, parameterId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/orders/sqlserver/parameter-data?batchId=${batchId}&parameterId=${parameterId}`);
  }

  // Product Parameters Mapping API
  async getProductParametersByProductName(productName: string): Promise<ApiResponse<ProductParameterMapping[]>> {
    return this.request(`/api/product-parameters?product_name=${encodeURIComponent(productName)}`);
  }

  // MaterialInput API
  async getMaterialInputsByBatchId(batchId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/material-inputs/sqlserver/material-inputs/${encodeURIComponent(batchId)}`);
  }

  async getFlowRateByBatchId(batchId: string): Promise<ApiResponse<{ success: boolean; data: { batchLogId: string; actualQty: number; actualValue: number; flowRate: number } | null }>> {
    return this.request(`/api/material-inputs/sqlserver/flow-rate/${encodeURIComponent(batchId)}`);
  }

  async getMaterialInputs(params?: {
    batchId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/api/material-inputs/sqlserver/material-inputs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  }

  // Order Analysis API
  async getOrderAnalysisByBatchPattern(params: {
    startDate?: string;
    endDate?: string;
    batchPattern?: '1' | '2' | '3' | '4' | '5' | '6';
    batchId?: string;
    lotId?: string;
  }): Promise<ApiResponse<{
    orders: any[];
    phData: any[];
    tccData: any[];
    summary: {
      totalOrders: number;
      activeOrders: number;
      completedOrders: number;
      batchPattern: string;
      phDataPoints: number;
      tccDataPoints: number;
      dateRange: { startDate: string | null; endDate: string | null };
    };
  }>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.request(`/api/orders/analysis/batch-pattern?${searchParams.toString()}`);
  }

  // PH and TCC Data API
  async getPHTCCData(params: {
    lotPattern: '1' | '2' | '3' | '4' | '5' | '6';
    startDate: string;
    endDate: string;
    dataType: 'ph' | 'tcc';
  }): Promise<ApiResponse<{
    success: boolean;
    data: any[];
    metadata: {
      lotPattern: string;
      dataType: string;
      tagName: string;
      startDate: string;
      endDate: string;
      recordCount: number;
    };
  }>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.request(`/api/production/data/ph-tcc?${searchParams.toString()}`);
  }

  // Get available tags
  async getAvailableTags(): Promise<ApiResponse<{
    success: boolean;
    tags: string[];
  }>> {
    return this.request('/api/production/data/available-tags');
  }

  // Debug test results
  async debugTestResults(orderNumber: string): Promise<ApiResponse<any>> {
    return this.request(`/api/test-results/debug/${orderNumber}`);
  }

  // Debug material inputs
  async debugMaterialInputs(batchId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/material-inputs/debug/${batchId}`);
  }

  // Test Stages API
  async getTestStages(): Promise<ApiResponse<any[]>> {
    console.log('🌐 API Service: Calling /api/test-stages');
    const result = await this.request<any[]>('/api/test-stages');
    console.log('🌐 API Service: Result:', result);
    return result;
  }

  async createTestStage(stage: {
    name: string;
    description?: string;
    order: number;
  }): Promise<ApiResponse<any>> {
    return this.request('/api/test-stages', {
      method: 'POST',
      body: JSON.stringify(stage),
    });
  }

  async updateTestStage(stageId: number, updates: {
    name?: string;
    description?: string;
    order?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request(`/api/test-stages/${stageId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTestStage(stageId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/test-stages/${stageId}`, {
      method: 'DELETE',
    });
  }

  // User Preferences API
  async getUserPreference<T = any>(key: string): Promise<ApiResponse<T | null>> {
    return this.request(`/api/user-preferences/${encodeURIComponent(key)}`);
  }

  async setUserPreference<T = any>(key: string, value: T): Promise<ApiResponse<any>> {
    return this.request(`/api/user-preferences/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(value),
    });
  }
}

export const apiService = new ApiService();
export default apiService; 