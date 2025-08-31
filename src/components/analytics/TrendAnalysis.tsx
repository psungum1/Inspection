import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TestResult, TestParameter, ProductionOrder } from '../../types';
import { apiService } from '../../utils/api';

interface TrendAnalysisProps {
  testResults: TestResult[];
  parameters: TestParameter[];
  orders: ProductionOrder[];
  dateRange: { start: string; end: string };
  filters: {
    lineNumbers: number[];
    operatorIds: string[];
    parameters: string[];
  };
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ 
  testResults, 
  parameters, 
  orders,
  dateRange, 
  filters 
}) => {
  const [selectedParameter, setSelectedParameter] = useState(parameters[0]?.id || '');
  const [productOptions, setProductOptions] = useState<Array<{ product_name: string; order_count: number; test_results_count: number }>>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [remoteResults, setRemoteResults] = useState<TestResult[] | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [productParams, setProductParams] = useState<TestParameter[] | null>(null);

  // Load product names for dropdown from backend (PLC orders joined with test results)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const resp = await apiService.getPlcProductNames({
        startDate: dateRange.start,
        endDate: dateRange.end,
        onlyWithResults: true,
      });
      if (!cancelled && resp.data) {
        setProductOptions(resp.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateRange.start, dateRange.end]);

  // Load joined test results when product/parameter/date/operators change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedProduct) {
        setRemoteResults(null);
        return;
      }
      setLoadingData(true);
      const resp = await apiService.getTestResultsByProduct({
        productName: selectedProduct,
        parameterId: selectedParameter || undefined,
        operatorIds: filters.operatorIds && filters.operatorIds.length ? filters.operatorIds : undefined,
        startDate: dateRange.start,
        endDate: dateRange.end,
        limit: 5000,
      });
      setLoadingData(false);
      if (cancelled) return;
      if (resp.data) {
        // Map API rows to TestResult shape if necessary (tr.* should already match)
        const mapped: TestResult[] = resp.data.map((r: any) => ({
          id: r.id,
          orderNumber: r.order_number,
          parameterId: r.parameter_id,
          round: r.round,
          value: typeof r.value === 'number' ? r.value : Number(r.value),
          unit: r.unit,
          timestamp: r.timestamp,
          operatorId: r.operator_id,
          status: r.status,
          comments: r.comments,
          attachments: r.attachments,
        }));
        setRemoteResults(mapped);
      } else {
        setRemoteResults([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProduct, selectedParameter, dateRange.start, dateRange.end, JSON.stringify(filters.operatorIds)]);

  // Load product-specific parameters from product_parameters and map to TestParameter shape
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedProduct) {
        setProductParams(null);
        return;
      }
      const resp = await apiService.getProductParametersByProductName(selectedProduct);
      if (cancelled) return;
      if (resp.data) {
        const mapped: TestParameter[] = resp.data.map((m: any) => ({
          id: m.parameter_name,
          name: m.parameter_name,
          unit: m.unit || '',
          minValue: m.acceptable_min ?? 0,
          maxValue: m.acceptable_max ?? 0,
          warningMin: m.warning_min ?? m.acceptable_min ?? 0,
          warningMax: m.warning_max ?? m.acceptable_max ?? 0,
          criticalMin: m.critical_min ,
          criticalMax: m.critical_max ?? m.acceptable_max ?? 0,
          category: 'Product Parameter'
        }));
        setProductParams(mapped);
        // Ensure selectedParameter is valid for this product
        if (mapped.length > 0 && !mapped.find(p => p.id === selectedParameter)) {
          setSelectedParameter(mapped[0].id);
        }
      } else {
        setProductParams([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProduct]);

  // Filter and process data
  const resultDateStart = new Date(dateRange.start);
  const resultDateEnd = new Date(dateRange.end);

  const dataSourceResults = selectedProduct && remoteResults !== null ? remoteResults : testResults;

  const allowedOrderNumbers = useMemo(() => {
    if (selectedProduct && remoteResults) {
      return new Set(remoteResults.map(r => r.orderNumber));
    }
    // if no selected product, allow all orders (or further down filter by line)
    return new Set<string>(orders.map(o => o.orderNumber));
  }, [selectedProduct, remoteResults, orders]);

  const filteredResults = dataSourceResults.filter(result => {
    const resultDate = new Date(result.timestamp);
    
    return resultDate >= resultDateStart && 
           resultDate <= resultDateEnd &&
           (allowedOrderNumbers.size === 0 || allowedOrderNumbers.has(result.orderNumber)) &&
           (filters.parameters.length === 0 || filters.parameters.includes(result.parameterId)) &&
           (filters.operatorIds.length === 0 || filters.operatorIds.includes(result.operatorId));
  });

  const effectiveParams = productParams && selectedProduct ? productParams : parameters;
  const selectedParam = effectiveParams.find(p => p.id === selectedParameter);
  const parameterResults = filteredResults.filter(r => r.parameterId === selectedParameter);

  // Aggregate results by order for a single-series line with X axis = order number
  const chartData = useMemo(() => {
    const byOrder = new Map<string, { orderNumber: string; avg: number; count: number; status: 'pass' | 'warning' | 'fail' }>();
    parameterResults.forEach(r => {
      const existing = byOrder.get(r.orderNumber);
      const nextAvg = existing ? (existing.avg * existing.count + r.value) / (existing.count + 1) : r.value;
      byOrder.set(r.orderNumber, {
        orderNumber: r.orderNumber,
        avg: nextAvg,
        count: (existing?.count || 0) + 1,
        status: r.status
      });
    });
    const arr = Array.from(byOrder.values());
    // Determine status based on selectedParam bounds using avg
    if (selectedParam) {
      arr.forEach(item => {
        const v = item.avg;
        if (
          (selectedParam.criticalMax !== undefined && v > selectedParam.criticalMax) ||
          (selectedParam.criticalMin !== undefined && v < selectedParam.criticalMin)
        ) {
          item.status = 'fail';
        } else if (v > selectedParam.warningMax || v < selectedParam.warningMin) {
          item.status = 'warning';
        } else {
          item.status = 'pass';
        }
      });
    }
    // Sort orders alphanumerically
    return arr.sort((a, b) => a.orderNumber.localeCompare(b.orderNumber));
  }, [parameterResults, selectedParam]);

  // Calculate statistics
  const values = parameterResults.map(r => r.value);
  const mean = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  const stdDev = values.length > 1 ? Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)
  ) : 0;

  // Note: UCL/LCL not used when visualizing product limit bands; kept here if needed later

  return (
    <div className="space-y-6">
      {/* Product Name Dropdown (from PLC orders) */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Product:</label>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
        >
          <option value="">กรุณาเลือกวันที่ก่อนเลือกสินค้า</option>
          {productOptions.map((opt) => (
            <option key={opt.product_name} value={opt.product_name}>
              {opt.product_name} ({opt.test_results_count})
            </option>
          ))}
        </select>
        {loadingData && <span className="text-xs text-gray-500">กำลังดึงข้อมูล...</span>}
      </div>
      {/* Parameter Selection (from product_parameters if product selected) */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Parameter:</label>
        <select
          value={selectedParameter}
          onChange={(e) => setSelectedParameter(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {effectiveParams.map(param => (
            <option key={param.id} value={param.id}>
              {param.name} ({param.unit})
            </option>
          ))}
        </select>
      </div>

      {/* Limits Summary */}
      {selectedParam && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800">Acceptable Range</div>
            <div className="text-lg font-bold text-green-900">
              {selectedParam.minValue} – {selectedParam.maxValue} {selectedParam.unit}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="text-sm font-medium text-amber-800">Warning Range</div>
            <div className="text-lg font-bold text-amber-900">
              {selectedParam.warningMin} – {selectedParam.warningMax} {selectedParam.unit}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm font-medium text-red-800">Critical Range</div>
            <div className="text-lg font-bold text-red-900">
              {selectedParam.criticalMin ?? '-'} – {selectedParam.criticalMax ?? '-'} {selectedParam.unit}
            </div>
          </div>
        </div>
      )}

      {/* Trend Chart (X axis = Order) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedParam?.name} Trend Analysis
        </h3>
        
        {chartData.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="orderNumber" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  domain={['dataMin', 'dataMax']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any, name: string) => [
                    `${value} ${selectedParam?.unit}`,
                    name
                  ]}
                  labelFormatter={(label) => `Order: ${label}`}
                />
                <Legend />
                
                {/* Control Limits */}
                {selectedParam && (
                  <>
                    <ReferenceLine 
                      y={selectedParam.maxValue} 
                      stroke="#22c55e" 
                      strokeDasharray="5 5"
                      label="Max Acceptable"
                    />
                    <ReferenceLine 
                      y={selectedParam.minValue} 
                      stroke="#22c55e" 
                      strokeDasharray="5 5"
                      label="Min Acceptable"
                    />
                    <ReferenceLine 
                      y={selectedParam.warningMax} 
                      stroke="#f59e0b" 
                      strokeDasharray="3 3"
                      label="Warning Max"
                    />
                    <ReferenceLine 
                      y={selectedParam.warningMin} 
                      stroke="#f59e0b" 
                      strokeDasharray="3 3"
                      label="Warning Min"
                    />
                    {selectedParam.criticalMax !== undefined && (
                      <ReferenceLine 
                        y={selectedParam.criticalMax!} 
                        stroke="#ef4444" 
                        strokeDasharray="1 1"
                        label="Critical Max"
                      />
                    )}
                    {selectedParam.criticalMin !== undefined && (
                      <ReferenceLine 
                        y={selectedParam.criticalMin!} 
                        stroke="#ef4444" 
                        strokeDasharray="1 1"
                        label="Critical Min"
                      />
                    )}
                  </>
                )}
                
                <Line
                  type="monotone"
                  dataKey="avg"
                  name={selectedParam ? `${selectedParam.name}` : 'Value'}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const color = payload.status === 'pass' ? '#16a34a' : payload.status === 'warning' ? '#f59e0b' : '#ef4444';
                    return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={2} />;
                  }}
                  activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-lg font-medium">No Data Available</div>
              <div className="text-sm">No test results found for the selected parameter and date range.</div>
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default TrendAnalysis;