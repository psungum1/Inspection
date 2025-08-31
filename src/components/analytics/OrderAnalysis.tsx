import React, { useState, useEffect } from 'react';
import { Calendar, Filter, BarChart3, TrendingUp, Beaker, Clock, Eye, Download } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { apiService } from '../../utils/api';
import OrderDetailModal from './OrderDetailModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface OrderAnalysisData {
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
    dateRange: { startDate: string; endDate: string };
  };
}

const OrderAnalysis: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<OrderAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  });
  const [batchPattern, setBatchPattern] = useState<'' | '1' | '2' | '3' | '4' | '5' | '6'>('');
  const [batchId, setBatchId] = useState<string>('');
  const [lotId, setLotId] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');

  const fetchAnalysisData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {};

      // If searching by batchId or lotId, ignore date range
      if (batchId || lotId) {
        if (batchId) params.batchId = batchId;
        if (lotId) params.lotId = lotId;
      } else {
        params.startDate = dateRange.start;
        params.endDate = dateRange.end;
      }
      
      if (batchPattern) {
        params.batchPattern = batchPattern;
      }

      // First, get the order analysis data
      const response = await apiService.getOrderAnalysisByBatchPattern(params);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (!response.data) {
        setError('ไม่ได้รับข้อมูลจากเซิร์ฟเวอร์');
        return;
      }

      let analysisResult = response.data;

      // If no PH/TCC data found, try to fetch using new API
      if (!batchId && !lotId && analysisResult.phData.length === 0 && analysisResult.tccData.length === 0) {
        console.log('No PH/TCC data found in order analysis, trying direct API...');
        
        // Try to fetch PH and TCC data directly for each unique lot pattern in orders
        const lotPatterns = [...new Set(analysisResult.orders.map(order => order.lot_suffix))];
        console.log('Found lot patterns:', lotPatterns);

        const phDataPromises = [];
        const tccDataPromises = [];

        for (const lotPattern of lotPatterns) {
          if (['1', '2', '3', '4', '5', '6'].includes(lotPattern)) {
            phDataPromises.push(
              apiService.getPHTCCData({
                lotPattern: lotPattern as '1' | '2' | '3' | '4' | '5' | '6',
                startDate: dateRange.start,
                endDate: dateRange.end,
                dataType: 'ph'
              })
            );

            tccDataPromises.push(
              apiService.getPHTCCData({
                lotPattern: lotPattern as '1' | '2' | '3' | '4' | '5' | '6',
                startDate: dateRange.start,
                endDate: dateRange.end,
                dataType: 'tcc'
              })
            );
          }
        }

        // Fetch all PH and TCC data
        const phResults = await Promise.allSettled(phDataPromises);
        const tccResults = await Promise.allSettled(tccDataPromises);

        // Combine results
        const combinedPHData = [];
        const combinedTCCData = [];

        phResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.data?.success) {
            const lotPattern = lotPatterns[index];
            result.value.data.data.forEach(record => {
              combinedPHData.push({
                ...record,
                lot_suffix: lotPattern,
                batch_id: `LOT_${lotPattern}` // Temporary batch_id for display
              });
            });
          }
        });

        tccResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.data?.success) {
            const lotPattern = lotPatterns[index];
            result.value.data.data.forEach(record => {
              combinedTCCData.push({
                ...record,
                lot_suffix: lotPattern,
                batch_id: `LOT_${lotPattern}` // Temporary batch_id for display
              });
            });
          }
        });

        analysisResult.phData = combinedPHData;
        analysisResult.tccData = combinedTCCData;
        analysisResult.summary.phDataPoints = combinedPHData.length;
        analysisResult.summary.tccDataPoints = combinedTCCData.length;

        console.log(`Fetched ${combinedPHData.length} PH records and ${combinedTCCData.length} TCC records`);
      }

      setAnalysisData(analysisResult);
    } catch (err) {
      console.error('Error fetching analysis data:', err);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const handleAnalyze = () => {
    fetchAnalysisData();
  };

  const handleTestAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test available tags API
      console.log('Testing available tags API...');
      const tagsResponse = await apiService.getAvailableTags();
      console.log('Available tags:', tagsResponse.data);

      // Test PH data API for pattern 5 (as shown in the screenshot)
      console.log('Testing PH data API for pattern 5...');
      const phResponse = await apiService.getPHTCCData({
        lotPattern: '5',
        startDate: dateRange.start,
        endDate: dateRange.end,
        dataType: 'ph'
      });
      console.log('PH data response:', phResponse.data);

      // Test TCC data API for pattern 5
      console.log('Testing TCC data API for pattern 5...');
      const tccResponse = await apiService.getPHTCCData({
        lotPattern: '5',
        startDate: dateRange.start,
        endDate: dateRange.end,
        dataType: 'tcc'
      });
      console.log('TCC data response:', tccResponse.data);

      alert('API ทดสอบเสร็จแล้ว ดูผลลัพธ์ใน Console');
    } catch (err) {
      console.error('API test error:', err);
      setError('เกิดข้อผิดพลาดในการทดสอบ API: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getPHChartData = () => {
    if (!analysisData?.phData.length) return null;

    // Group data by batch_id
    const batchGroups = analysisData.phData.reduce((acc, item) => {
      if (!acc[item.batch_id]) {
        acc[item.batch_id] = [];
      }
      acc[item.batch_id].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const colors = [
      'rgb(59, 130, 246)', // blue
      'rgb(16, 185, 129)', // green
      'rgb(245, 101, 101)', // red
      'rgb(139, 92, 246)', // purple
      'rgb(245, 158, 11)', // orange
      'rgb(236, 72, 153)', // pink
    ];

    const datasets = Object.entries(batchGroups).map(([batchId, data], index) => ({
      label: `${batchId} (RE1_${data[0]?.lot_suffix})`,
      data: data.map(item => ({
        x: new Date(item.DateTime),
        y: parseFloat(item.Value)
      })).sort((a, b) => a.x.getTime() - b.x.getTime()),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      borderWidth: 2,
      fill: false,
      tension: 0.1,
    }));

    return {
      datasets,
    };
  };

  const getTCCChartData = () => {
    if (!analysisData?.tccData.length) return null;

    // Group data by batch_id
    const batchGroups = analysisData.tccData.reduce((acc, item) => {
      if (!acc[item.batch_id]) {
        acc[item.batch_id] = [];
      }
      acc[item.batch_id].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const colors = [
      'rgb(59, 130, 246)', // blue
      'rgb(16, 185, 129)', // green
      'rgb(245, 101, 101)', // red
      'rgb(139, 92, 246)', // purple
      'rgb(245, 158, 11)', // orange
      'rgb(236, 72, 153)', // pink
    ];

    const datasets = Object.entries(batchGroups).map(([batchId, data], index) => ({
      label: `${batchId} (RE1_${data[0]?.lot_suffix})`,
      data: data.map(item => ({
        x: new Date(item.DateTime),
        y: parseFloat(item.Value)
      })).sort((a, b) => a.x.getTime() - b.x.getTime()),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      borderWidth: 2,
      fill: false,
      tension: 0.1,
    }));

    return {
      datasets,
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleString('th-TH');
          },
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y?.toFixed(3)}`;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            hour: 'HH:mm',
            day: 'dd/MM'
          }
        },
        title: {
          display: true,
          text: 'เวลา'
        }
      },
      y: {
        title: {
          display: true,
          text: 'ค่า'
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">กำลังวิเคราะห์ข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          การวิเคราะห์ Order ตาม Batch Pattern
        </h2>
        <p className="text-gray-600">
          วิเคราะห์ข้อมูล PH และ TCC ของ order แยกตาม lot pattern (RE1_1 หรือ RE1_6)
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Batch ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order ID
            </label>
            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder=""
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
          </div>

          {/* Lot ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lot ID
            </label>
            <input
              type="text"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              placeholder=""
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Batch Pattern Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Lot Pattern
            </label>
            <select
              value={batchPattern}
              onChange={(e) => setBatchPattern(e.target.value as '' | '1' | '2' | '3' | '4' | '5' | '6')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              <option value="1">RE1_1 เท่านั้น</option>
              <option value="2">RE1_2 เท่านั้น</option>
              <option value="3">RE1_3 เท่านั้น</option>
              <option value="4">RE1_4 เท่านั้น</option>
              <option value="5">RE1_5 เท่านั้น</option>
              <option value="6">RE1_6 เท่านั้น</option>
            </select>
          </div>

          {/* Analyze Button */}
          <div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              วิเคราะห์
            </button>
          </div>

          {/* Test API Button */}
          <div>
            <button
              onClick={handleTestAPI}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              ทดสอบ API
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {analysisData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analysisData.summary.totalOrders}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analysisData.summary.activeOrders}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Beaker className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      PH Data Points
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analysisData.summary.phDataPoints}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      TCC Data Points
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analysisData.summary.tccDataPoints}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setViewMode('overview')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 inline mr-2" />
                  ภาพรวม
                </button>
                <button
                  onClick={() => setViewMode('details')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'details'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Eye className="h-4 w-4 inline mr-2" />
                  รายละเอียด
                </button>
              </nav>
            </div>

            <div className="p-6">
              {viewMode === 'overview' && (
                <div className="space-y-8">
                  {/* PH Chart */}
                  {getPHChartData() && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        ข้อมูล PH ตามช่วงเวลาของแต่ละ Order
                      </h3>
                      <div className="h-80">
                        <Line data={getPHChartData()!} options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              display: true,
                              text: 'PH Values Over Time by Order'
                            }
                          },
                          scales: {
                            ...chartOptions.scales,
                            y: {
                              ...chartOptions.scales.y,
                              title: {
                                display: true,
                                text: 'PH Value'
                              }
                            }
                          }
                        }} />
                      </div>
                    </div>
                  )}

                  {/* TCC Chart */}
                  {getTCCChartData() && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        ข้อมูล TCC ตามช่วงเวลาของแต่ละ Order
                      </h3>
                      <div className="h-80">
                        <Line data={getTCCChartData()!} options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              display: true,
                              text: 'TCC Values Over Time by Order'
                            }
                          },
                          scales: {
                            ...chartOptions.scales,
                            y: {
                              ...chartOptions.scales.y,
                              title: {
                                display: true,
                                text: 'TCC Value'
                              }
                            }
                          }
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'details' && (
                <div className="space-y-6">
                  {/* Orders Table */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">รายการ Orders</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Batch ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lot Pattern
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Start Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              End Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analysisData.orders.map((order, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {order.batch_id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.lot_suffix === '1' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : order.lot_suffix === '6'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  RE1_{order.lot_suffix}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.product_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(order.log_open_dt_utc).toLocaleString('th-TH')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.log_close_dt_utc 
                                  ? new Date(order.log_close_dt_utc).toLocaleString('th-TH')
                                  : 'ยังไม่เสร็จสิ้น'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status === 'active' ? 'ดำเนินการ' : 'เสร็จสิ้น'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  ดูรายละเอียด
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && analysisData && (
        <OrderDetailModal
          order={selectedOrder}
          phData={analysisData.phData}
          tccData={analysisData.tccData}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default OrderAnalysis;
