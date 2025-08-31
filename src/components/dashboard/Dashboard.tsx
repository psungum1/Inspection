import React, { useEffect, useRef, useState } from 'react';
import { Responsive, WidthProvider, Layouts, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { TrendingUp, CheckCircle, Clock, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import MetricCard from './MetricCard';
// import ProductionChart from './ProductionChart';
import QualityOverview from './QualityOverview';
import RecentActivity from './RecentActivity';
import ChartGrid from './ChartGrid';
import AddChartModal from './AddChartModal';
import Toast from '../common/Toast';
import ParameterDropdown from '../common/ParameterDropdown';
import { TestParameter } from '../../types';
import apiService from '../../utils/api';
// import TrendChart from './TrendChart';
// import TCCChart from './TCCChart';
import TCCRealTimeView from './TCCRealTimeView';
import PHRealTimeView from './PHRealTimeView';

const ResponsiveGridLayout = WidthProvider(Responsive);
const DASHBOARD_GRID_LAYOUT_KEY = 'dashboard-grid-layout-v1';
const USER_PREF_DASHBOARD_LAYOUT_KEY = 'dashboard-grid-layout';

const sectionIds = ['metrics', 'production', 'tcc', 'utilization', 'charts', 'sidebar'];

const defaultLayouts: Layouts = {
  lg: [
    { i: 'metrics', x: 0, y: 0, w: 8, h: 2, minW: 4, minH: 2 },
    { i: 'production', x: 0, y: 2, w: 4, h: 4, minW: 3, minH: 2 },
    { i: 'tcc', x: 4, y: 2, w: 4, h: 4, minW: 3, minH: 2 },
    { i: 'utilization', x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 2 },
    { i: 'charts', x: 0, y: 6, w: 8, h: 6, minW: 4, minH: 4 },
    { i: 'sidebar', x: 8, y: 6, w: 4, h: 6, minW: 3, minH: 2 },
  ]
};

const Dashboard: React.FC = () => {
  const { state, dispatch } = useApp();
  const { dashboardMetrics, testParameters } = state;
  const [trendResults, setTrendResults] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [charts, setCharts] = useState<any[]>([]);
  const [showAddChartModal, setShowAddChartModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({ message: '', type: 'info', isVisible: false });
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);
  const hasLoadedUserLayoutRef = useRef(false);
  const [parameterData, setParameterData] = useState<any[]>([]);
  const [loadingParameter, setLoadingParameter] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  // Batch/Unit selector state
  const [batchId, setBatchId] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedParameter, setSelectedParameter] = useState('');
  const [batchIdList, setBatchIdList] = useState<string[]>([]);
  const [unitList, setUnitList] = useState<string[]>([]);
  const [batchUnitMap, setBatchUnitMap] = useState<{Batch_ID: string, UnitOrConnection: string}[]>([]);

  // ดึง batch id และ unit ที่ยังไม่ close จาก API
  useEffect(() => {
    apiService.getPHBatchList().then(res => {
      if (res.data) {
        setBatchUnitMap(res.data);
        setBatchIdList(Array.from(new Set(res.data.map((item: any) => item.Batch_ID))));
        setUnitList(Array.from(new Set(res.data.map((item: any) => item.UnitOrConnection).filter(Boolean))));
        // ตั้งค่า default
        if (!batchId && res.data.length > 0) setBatchId(res.data[0].Batch_ID);
        if (!unit && res.data.length > 0) setUnit(res.data[0].UnitOrConnection || '');
      }
    });
  }, []);

  // batchIdList เฉพาะ unit ที่เลือก
  const filteredBatchIdList = unit ? batchUnitMap.filter(item => item.UnitOrConnection === unit).map(item => item.Batch_ID) : batchIdList;

  // batchId default ถ้า unit เปลี่ยน
  useEffect(() => {
    if (unit && filteredBatchIdList.length > 0 && !filteredBatchIdList.includes(batchId)) {
      setBatchId(filteredBatchIdList[0]);
    }
  }, [unit]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => setToast({ message, type, isVisible: true });
  const hideToast = () => setToast(prev => ({ ...prev, isVisible: false }));

  // Auto-refresh for trend data
  useEffect(() => {
    let isMounted = true;
    const fetchTrendData = async () => {
      setLoadingTrends(true);
      const response = await apiService.getOrdersWithTestResults({ status: 'active' });
      if (isMounted && response.data) {
        const allResults = response.data.flatMap((order: any) =>
          (order.test_results || []).map((tr: any) => ({ ...tr, lineNumber: order.line_number }))
        );
        setTrendResults(allResults);
      }
      setLoadingTrends(false);
    };
    fetchTrendData();
    const interval = setInterval(fetchTrendData, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchMetrics = async () => {
      const res = await apiService.getDashboardMetrics();
      if (!cancelled && res.data) {
        dispatch({ type: 'SET_DASHBOARD_METRICS', payload: res.data });
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [dispatch]);

  useEffect(() => {
    const updatedCharts = charts.map(chart => ({
      ...chart,
      testResults: trendResults.filter(
        tr => (tr as any).lineNumber === chart.lineNumber &&
        (tr.parameterId === chart.parameter.id || (tr as any).parameter_id === chart.parameter.id)
      )
    }));
    setCharts(updatedCharts);
  }, [trendResults]);

  // Fetch parameter data from SQL Server (auto-refresh every 5 seconds)
  useEffect(() => {
    if (!batchId || !selectedParameter) return;
    setLoadingParameter(true);
    let isMounted = true;
    const fetchParameterData = () => {
      apiService.getParameterData(batchId, selectedParameter).then(res => {
        if (isMounted && res.data) setParameterData(res.data);
        setLoadingParameter(false);
      });
    };
    fetchParameterData();
    const interval = setInterval(fetchParameterData, 5000); // Refresh every 5 seconds
    return () => { isMounted = false; clearInterval(interval); };
  }, [batchId, selectedParameter]);

  const activeLines = Array.from(new Set(trendResults.map(tr => tr.lineNumber))).sort((a, b) => a - b);

  // Chart management functions (same as before)
  const handleChartsReorder = (newCharts: any[]) => {
    setCharts(newCharts);
    localStorage.setItem('dashboard-charts-order', JSON.stringify(newCharts.map(c => c.id)));
    showToast('Chart order updated successfully', 'success');
  };
  const handleChartRemove = (chartId: string) => {
    const chartToRemove = charts.find(chart => chart.id === chartId);
    const newCharts = charts.filter(chart => chart.id !== chartId);
    setCharts(newCharts);
    localStorage.setItem('dashboard-charts-order', JSON.stringify(newCharts.map(c => c.id)));
    showToast(`Chart for Line ${chartToRemove?.lineNumber} - ${chartToRemove?.parameter.name} removed`, 'info');
  };
  const handleAddChart = () => setShowAddChartModal(true);
  const handleAddChartSubmit = (lineNumber: number, parameter: TestParameter) => {
    const lineTestResults = trendResults.filter(
      tr => (tr as any).lineNumber === lineNumber &&
      (tr.parameterId === parameter.id || (tr as any).parameter_id === parameter.id)
    );
    const newChart = {
      id: `chart-${lineNumber}-${parameter.id}-${Date.now()}`,
      lineNumber,
      parameter,
      testResults: lineTestResults
    };
    const newCharts = [...charts, newChart];
    setCharts(newCharts);
    localStorage.setItem('dashboard-charts-order', JSON.stringify(newCharts.map(c => c.id)));
    showToast(`Chart for Line ${lineNumber} - ${parameter.name} added successfully`, 'success');
  };

  // Tooltip state สำหรับกราฟ PH
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; time: string } | null>(null);

  const renderParameterChart = () => {
    if (!selectedParameter) return <div>Please select a parameter to view chart data.</div>;
    if (loadingParameter) return <div>Loading {selectedParameter} data...</div>;
    
    // Filter parameter data by unit and batchId
    const filteredData = parameterData.filter(
      (item: any) => (!unit || item.UnitOrConnection === unit) && (!batchId || item.Batch_ID === batchId)
    );
    const chartData = filteredData.map((item: any) => ({
      time: item.DateTime,
      value: parseFloat(item.Target_Value)
    })).sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
    if (!chartData.length) return <div>No {selectedParameter} data found.</div>;
    const minValue = Math.min(...chartData.map(d => d.value));
    const maxValue = Math.max(...chartData.map(d => d.value));
    const svgWidth = 1000;
    const svgHeight = 200;
    const padding = 40;
    const tooltipWidth = 140;
    const tooltipHeight = 40;
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div>
            <label className="mr-2 font-semibold">Select Unit:</label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">All</option>
              {unitList.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mr-2 font-semibold">Select Batch ID:</label>
            <select
              value={batchId}
              onChange={e => setBatchId(e.target.value)}
              className="border rounded px-2 py-1"
            >
              {filteredBatchIdList.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          
        </div>
        <h3 className="text-lg font-semibold mb-4">
          {selectedParameter} Target Value Trend (Batch {batchId}{unit ? `, Unit ${unit}` : ''})
        </h3>
        <svg width={svgWidth} height={svgHeight}>
          {/* เส้น min */}
          <line
            x1={padding}
            y1={svgHeight - padding - ((minValue / 10) * (svgHeight - 2 * padding))}
            x2={svgWidth - padding}
            y2={svgHeight - padding - ((minValue / 10) * (svgHeight - 2 * padding))}
            stroke="#22c55e"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          {/* เส้น max */}
          <line
            x1={padding}
            y1={svgHeight - padding - ((maxValue / 10) * (svgHeight - 2 * padding))}
            x2={svgWidth - padding}
            y2={svgHeight - padding - ((maxValue / 10) * (svgHeight - 2 * padding))}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          {/* เส้นกราฟ */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            points={chartData.map((d, i) => {
              const x = padding + (i / (chartData.length - 1)) * (svgWidth - 2 * padding);
              const y = svgHeight - padding - ((d.value / 10) * (svgHeight - 2 * padding));
              return `${x},${y}`;
            }).join(' ')}
          />
          {/* จุดข้อมูล + Tooltip */}
          {chartData.map((d, i) => {
            const x = padding + (i / (chartData.length - 1)) * (svgWidth - 2 * padding);
            const y = svgHeight - padding - ((d.value / 10) * (svgHeight - 2 * padding));
            // Tooltip position logic
            let tooltipX = x - tooltipWidth / 2;
            let tooltipY = y - tooltipHeight - 12; // 12px เหนือจุด
            if (tooltipX < 0) tooltipX = 0;
            if (tooltipX + tooltipWidth > svgWidth) tooltipX = svgWidth - tooltipWidth;
            if (tooltipY < 0) tooltipY = y + 20; // ถ้าหลุดขอบบน ให้ไปอยู่ใต้จุด
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="7"
                  fill="#3b82f6"
                  onMouseEnter={() => setTooltip({ x, y, value: d.value, time: d.time })}
                  onMouseLeave={() => setTooltip(null)}
                />
                {/* Tooltip */}
                {tooltip && tooltip.x === x && tooltip.y === y && (
                  <g>
                    <rect
                      x={tooltipX}
                      y={tooltipY}
                      width={tooltipWidth}
                      height={tooltipHeight}
                      fill="white"
                      stroke="#888"
                      rx="6"
                      ry="6"
                      opacity="0.95"
                    />
                    <text x={tooltipX + 10} y={tooltipY + 15} fontSize="14" fill="#222">
                      {new Date(d.time).toLocaleString()}
                    </text>
                    <text x={tooltipX + 10} y={tooltipY + 32} fontSize="14" fill="#3b82f6">
                      {selectedParameter}: {d.value}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
        <div className="flex flex-wrap mt-2 text-xs text-gray-500">
          <div className="mr-4"><span className="text-green-600 font-bold">Min:</span> {minValue}</div>
          <div className="mr-4"><span className="text-red-600 font-bold">Max:</span> {maxValue}</div>
          {chartData.map((d, i) => (
            <div key={i} className="mr-4">{new Date(d.time).toLocaleString()} : {d.value}</div>
          ))}
        </div>
      </div>
    );
  };

  // Section renderers
  const metricCards = [
    { title: 'Active Orders', value: dashboardMetrics.activeOrders.toString(), icon: Activity, color: 'blue' as const, change: '+5.2%', trend: 'up' as const },
    { title: 'Completed Today', value: dashboardMetrics.completedToday.toString(), icon: CheckCircle, color: 'green' as const, change: '+12.3%', trend: 'up' as const },
    { title: 'Tests Pending', value: dashboardMetrics.testsPending.toString(), icon: Clock, color: 'amber' as const, change: '-8.1%', trend: 'down' as const },
    { title: 'Quality Compliance', value: `${dashboardMetrics.qualityCompliance.toFixed(1)}%`, icon: TrendingUp, color: (dashboardMetrics.qualityCompliance >= 95 ? 'green' : 'red') as ('green' | 'red'), change: '+2.1%', trend: 'up' as const }
  ];

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    metrics: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
        {metricCards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>
    ),
    production: () => <PHRealTimeView />,
    tcc: () => <TCCRealTimeView />,
    utilization: () => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Production Line Utilization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(dashboardMetrics.lineUtilization).map(([line, info]) => {

            const productName = (info as any).productName as string | null;
            const lotId = (info as any).lotId as string | null;
            const batchId = (info as any).batchId as string | null;
            return (
              <div key={line} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Line {line}</span>
                  </div>
                <div className="mt-2 text-sm text-gray-600">Product: {productName || '-'}</div>
                <div className="mt-2 text-sm text-gray-600">Order: {batchId || '-'}</div>
                <div className="mt-2 text-sm text-gray-600">Batch: {lotId || '-'}</div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    charts: () => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
        <div className="mb-4">
          <label className="mr-2 font-semibold">Select Parameter:</label>
          <ParameterDropdown
            value={selectedParameter}
            onChange={setSelectedParameter}
            batchId={batchId}
            placeholder="All Parameters"
            className="border rounded px-2 py-1"
          />
        </div>
        {renderParameterChart()}
        <ChartGrid
          charts={charts}
          onChartsReorder={handleChartsReorder}
          onChartRemove={handleChartRemove}
          onAddChart={handleAddChart}
          testParameters={testParameters}
          trendResults={trendResults}
          activeLines={activeLines}
        />
      </div>
    ),
    sidebar: () => (
      <div className="space-y-8 h-full">
        <QualityOverview />
        <RecentActivity />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'data-import' })} className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-md transition-colors">Import Production Data</button>
            <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'test-entry' })} className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-md transition-colors">Enter Test Results</button>
            <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'analytics' })} className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-md transition-colors">View Analytics Report</button>
          </div>
        </div>
      </div>
    )
  };

  // Load saved layout from server (fallback to localStorage for compatibility)
  useEffect(() => {
    let cancelled = false;
    const loadLayout = async () => {
      // Try server per-user preference
      const res = await apiService.getUserPreference<Layouts>(USER_PREF_DASHBOARD_LAYOUT_KEY);
      if (!cancelled && res.data) {
        setLayouts(res.data as Layouts);
        hasLoadedUserLayoutRef.current = true;
        return;
      }
      // Fallback: localStorage
      const saved = localStorage.getItem(DASHBOARD_GRID_LAYOUT_KEY);
      if (!cancelled && saved) {
        try { setLayouts(JSON.parse(saved)); } catch {}
      }
      hasLoadedUserLayoutRef.current = true;
    };
    loadLayout();
    return () => { cancelled = true; };
  }, []);

  // Save layout (debounced, only after user layout has been loaded)
  const onLayoutChange = (_newLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
    localStorage.setItem(DASHBOARD_GRID_LAYOUT_KEY, JSON.stringify(allLayouts));
    if (!hasLoadedUserLayoutRef.current) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(async () => {
      await apiService.setUserPreference(USER_PREF_DASHBOARD_LAYOUT_KEY, allLayouts);
    }, 300);
  };

  // Persist also on drag/resize stop to ensure save after user finishes interaction
  const persistLayout = async () => {
    if (!hasLoadedUserLayoutRef.current) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await apiService.setUserPreference(USER_PREF_DASHBOARD_LAYOUT_KEY, layouts);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Production Quality Overview</h2>
        <p className="text-gray-600">Real-time monitoring and analysis of production quality metrics</p>
        {loadingTrends && (<div className="text-blue-600 mt-2">Updating trend data...</div>)}
      </div>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1024, md: 768, sm: 480, xs: 0 }}
        cols={{ lg: 12, md: 8, sm: 4, xs: 1 }}
        rowHeight={80}
        margin={[16, 16]}
        isResizable
        isDraggable
        preventCollision={true}
        compactType={null}
        onLayoutChange={onLayoutChange}
        onDragStop={persistLayout}
        onResizeStop={persistLayout}
        measureBeforeMount={false}
        useCSSTransforms={true}
        draggableHandle=".react-grid-dragHandle"
      >
        {sectionIds.map(id => (
          <div key={id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
            <div className="react-grid-dragHandle flex items-center px-4 py-2 border-b border-gray-100 cursor-move select-none">
              <span className="font-semibold text-gray-600 text-sm uppercase tracking-wider">{id.charAt(0).toUpperCase() + id.slice(1)}</span>
            </div>
            <div className="flex-1 p-2 overflow-auto">{sectionRenderers[id]()}</div>
          </div>
        ))}
      </ResponsiveGridLayout>
      <AddChartModal
        isOpen={showAddChartModal}
        onClose={() => setShowAddChartModal(false)}
        onAddChart={handleAddChartSubmit}
        testParameters={testParameters}
        activeLines={activeLines}
        trendResults={trendResults}
        charts={charts}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default Dashboard;