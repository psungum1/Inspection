import React, { useState, useEffect } from 'react';
import { X, Clock, Package, Beaker, TrendingUp, Download, Calendar, RefreshCw } from 'lucide-react';
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

interface OrderDetailModalProps {
  order: any;
  phData: any[];
  tccData: any[];
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ 
  order, 
  phData, 
  tccData, 
  onClose 
}) => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [materialInputs, setMaterialInputs] = useState<any[]>([]);
  const [orderPHData, setOrderPHData] = useState<any[]>([]);
  const [orderTCCData, setOrderTCCData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ph' | 'tcc' | 'tests' | 'materials'>('overview');
  const [flowRate, setFlowRate] = useState<number | null>(null);

  useEffect(() => {
    if (order) {
      fetchOrderDetails();
    }
  }, [order]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      console.log(`Fetching order details for batch_id: ${order.batch_id}`);
      
      // Fetch test results using both batch_id and order number
      try {
        const testResponse = await apiService.getPlcOrderWithResults(order.batch_id);
        console.log('Test results response:', testResponse);
        
        if (testResponse.data?.testResults) {
          setTestResults(testResponse.data.testResults);
          console.log(`Found ${testResponse.data.testResults.length} test results`);
        } else {
          console.log('No test results found in response');
          // Try alternative approach - get test results directly
          const directTestResponse = await apiService.getTestResults(order.batch_id);
          if (directTestResponse.data) {
            setTestResults(directTestResponse.data);
            console.log(`Found ${directTestResponse.data.length} direct test results`);
          }
        }
      } catch (testError) {
        console.error('Error fetching test results:', testError);
        // Continue with other data
      }

      // Fetch material inputs
      try {
        const materialResponse = await apiService.getMaterialInputsByBatchId(order.batch_id);
        console.log('Material inputs response:', materialResponse);
        
        if (materialResponse.data && Array.isArray(materialResponse.data)) {
          setMaterialInputs(materialResponse.data);
          console.log(`Found ${materialResponse.data.length} material inputs`);
        } else {
          console.log('No material inputs found or invalid data format');
          setMaterialInputs([]);
        }
      } catch (materialError) {
        console.error('Error fetching material inputs:', materialError);
        setMaterialInputs([]);
        // Continue with other data
      }

      // Fetch flow rate for this order (batch)
      try {
        const frResponse = await apiService.getFlowRateByBatchId(order.batch_id);
        if (frResponse.data?.success && frResponse.data.data) {
          const value = Number(frResponse.data.data.flowRate);
          setFlowRate(Number.isFinite(value) ? value : null);
        } else {
          setFlowRate(null);
        }
      } catch (frError) {
        console.error('Error fetching flow rate:', frError);
        setFlowRate(null);
      }

      // Fetch specific PH and TCC data for this order
      await fetchOrderPHTCCData();
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderPHTCCData = async () => {
    if (!order?.lot_suffix || !order?.log_open_dt_utc) return;

    setDataLoading(true);
    try {
      const startDate = order.log_open_dt_utc;
      const endDate = order.log_close_dt_utc || new Date().toISOString();

      console.log(`Fetching PH/TCC data for order ${order.batch_id} with lot pattern ${order.lot_suffix}`);
      console.log(`Date range: ${startDate} to ${endDate}`);

      // Fetch PH data
      const phResponse = await apiService.getPHTCCData({
        lotPattern: order.lot_suffix as '1' | '2' | '3' | '4' | '5' | '6',
        startDate,
        endDate,
        dataType: 'ph'
      });

      if (phResponse.data?.success && phResponse.data.data) {
        setOrderPHData(phResponse.data.data);
        console.log(`Fetched ${phResponse.data.data.length} PH records for order ${order.batch_id}`);
      }

      // Fetch TCC data
      const tccResponse = await apiService.getPHTCCData({
        lotPattern: order.lot_suffix as '1' | '2' | '3' | '4' | '5' | '6',
        startDate,
        endDate,
        dataType: 'tcc'
      });

      if (tccResponse.data?.success && tccResponse.data.data) {
        setOrderTCCData(tccResponse.data.data);
        console.log(`Fetched ${tccResponse.data.data.length} TCC records for order ${order.batch_id}`);
      }

    } catch (error) {
      console.error('Error fetching PH/TCC data for order:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const getOrderPHChartData = () => {
    // Use specific order data first, fallback to passed data
    const dataSource = orderPHData.length > 0 ? orderPHData : phData.filter(item => item.batch_id === order.batch_id);
    if (!dataSource.length) return null;

    const chartData = dataSource.map(item => ({
      x: new Date(item.DateTime),
      y: parseFloat(item.Value) || 0
    })).sort((a, b) => a.x.getTime() - b.x.getTime());

    return {
      datasets: [{
        label: `${order.batch_id} (RE1_${order.lot_suffix})`,
        data: chartData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      }]
    };
  };

  const getOrderTCCChartData = () => {
    // Use specific order data first, fallback to passed data
    const dataSource = orderTCCData.length > 0 ? orderTCCData : tccData.filter(item => item.batch_id === order.batch_id);
    if (!dataSource.length) return null;

    const chartData = dataSource.map(item => ({
      x: new Date(item.DateTime),
      y: parseFloat(item.Value) || 0
    })).sort((a, b) => a.x.getTime() - b.x.getTime());

    return {
      datasets: [{
        label: `${order.batch_id} (RE1_${order.lot_suffix})`,
        data: chartData,
        borderColor: 'rgb(245, 101, 101)',
        backgroundColor: 'rgba(245, 101, 101, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: 'rgb(245, 101, 101)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      }]
    };
  };

  const getChartOptions = (title: string, yAxisLabel: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: 20
      },
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleString('th-TH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
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
            day: 'dd/MM',
            week: 'dd/MM',
            month: 'MMM yyyy'
          }
        },
        title: {
          display: true,
          text: 'เวลา',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1
        },
        ticks: {
          maxTicksLimit: 10,
          font: {
            size: 10
          }
        }
      },
      y: {
        title: {
          display: true,
          text: yAxisLabel,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 10
          },
          callback: function(value: any) {
            return parseFloat(value).toFixed(2);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    elements: {
      point: {
        hoverRadius: 8,
        borderWidth: 2
      }
    }
  });

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('th-TH');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'ดำเนินการ', class: 'bg-green-100 text-green-800' },
      completed: { label: 'เสร็จสิ้น', class: 'bg-gray-100 text-gray-800' },
      pass: { label: 'ผ่าน', class: 'bg-green-100 text-green-800' },
      fail: { label: 'ไม่ผ่าน', class: 'bg-red-100 text-red-800' },
      warning: { label: 'เตือน', class: 'bg-yellow-100 text-yellow-800' },
      passed: { label: 'ผ่าน', class: 'bg-green-100 text-green-800' },
      failed: { label: 'ไม่ผ่าน', class: 'bg-red-100 text-red-800' },
      pending: { label: 'รอดำเนินการ', class: 'bg-blue-100 text-blue-800' },
      unknown: { label: 'ไม่ทราบสถานะ', class: 'bg-gray-100 text-gray-800' },
      'เสร็จสิ้น': { label: 'เสร็จสิ้น', class: 'bg-green-100 text-green-800' },
      'รอดำเนินการ': { label: 'รอดำเนินการ', class: 'bg-yellow-100 text-yellow-800' },
      'เสร็จ': { label: 'เสร็จ', class: 'bg-green-100 text-green-800' }
    };

    if (!status) {
      status = 'unknown';
    }

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || 
                  statusConfig[status as keyof typeof statusConfig] ||
                  { label: status, class: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const handleExportData = (type: 'ph' | 'tcc' | 'tests' | 'materials') => {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'ph':
        // Use specific order data first, fallback to passed data
        data = orderPHData.length > 0 ? orderPHData : phData.filter(item => item.batch_id === order.batch_id);
        filename = `${order.batch_id}_PH_Data.csv`;
        break;
      case 'tcc':
        // Use specific order data first, fallback to passed data
        data = orderTCCData.length > 0 ? orderTCCData : tccData.filter(item => item.batch_id === order.batch_id);
        filename = `${order.batch_id}_TCC_Data.csv`;
        break;
      case 'tests':
        data = testResults;
        filename = `${order.batch_id}_Test_Results.csv`;
        break;
      case 'materials':
        data = materialInputs;
        filename = `${order.batch_id}_Material_Inputs.csv`;
        break;
    }

    if (data.length === 0) {
      alert('ไม่มีข้อมูลสำหรับการส่งออก');
      return;
    }

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  รายละเอียด Order: {order.batch_id}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {order.product_name} - Lot Pattern: RE1_{order.lot_suffix}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchOrderPHTCCData}
                  disabled={dataLoading}
                  className="flex items-center px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
                  รีเฟรชข้อมูล
                </button>
                <button
                  onClick={onClose}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-xs text-gray-500">เวลาเริ่ม</div>
                  <div className="text-sm font-medium">{formatDateTime(order.log_open_dt_utc)}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-xs text-gray-500">เวลาสิ้นสุด</div>
                  <div className="text-sm font-medium">
                    {order.log_close_dt_utc 
                      ? formatDateTime(order.log_close_dt_utc)
                      : 'ยังไม่เสร็จสิ้น'
                    }
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Package className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-xs text-gray-500">สถานะ</div>
                  <div className="text-sm font-medium">{getStatusBadge(order.status)}</div>
                </div>
              </div>

              <div className="flex items-center">
                <Beaker className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-xs text-gray-500">Batch Size</div>
                  <div className="text-sm font-medium">{order.batch_size || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-xs text-gray-500">Flow Rate</div>
                  <div className="text-sm font-medium">{flowRate !== null ? `${flowRate.toFixed(3)} Kg/min` : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {[
                { id: 'overview', name: 'ภาพรวม', icon: TrendingUp },
                { id: 'ph', name: 'PH Data', icon: Beaker },
                { id: 'tcc', name: 'TCC Data', icon: TrendingUp },
                { id: 'tests', name: 'Test Results', icon: Beaker },
                { id: 'materials', name: 'Material Inputs', icon: Package }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 inline mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
              </div>
            )}

            {!loading && activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Beaker className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">PH Data Points</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {orderPHData.length > 0 ? orderPHData.length : phData.filter(item => item.batch_id === order.batch_id).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-red-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-600">TCC Data Points</p>
                        <p className="text-2xl font-bold text-red-900">
                          {orderTCCData.length > 0 ? orderTCCData.length : tccData.filter(item => item.batch_id === order.batch_id).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Beaker className="h-8 w-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">Test Results</p>
                        <p className="text-2xl font-bold text-green-900">{testResults.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-purple-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-600">Material Inputs</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {Array.isArray(materialInputs) ? materialInputs.length : 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PH Chart */}
                  {getOrderPHChartData() && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="h-64">
                        <Line 
                          data={getOrderPHChartData()!} 
                          options={getChartOptions(`ข้อมูล PH ตามช่วงเวลาของ Order`, 'PH Value')} 
                        />
                      </div>
                      {dataLoading && (
                        <div className="text-center text-sm text-gray-500 mt-2">
                          กำลังโหลดข้อมูล PH...
                        </div>
                      )}
                    </div>
                  )}

                  {/* TCC Chart */}
                  {getOrderTCCChartData() && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="h-64">
                        <Line 
                          data={getOrderTCCChartData()!} 
                          options={getChartOptions(`ข้อมูล TCC ตามช่วงเวลาของ Order`, 'TCC Value')} 
                        />
                      </div>
                      {dataLoading && (
                        <div className="text-center text-sm text-gray-500 mt-2">
                          กำลังโหลดข้อมูล TCC...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Data Loading Indicator */}
                {dataLoading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <span className="text-sm text-gray-600 mt-2 block">กำลังดึงข้อมูล PH & TCC...</span>
                  </div>
                )}

                {/* No Data Message */}
                {!getOrderPHChartData() && !getOrderTCCChartData() && !dataLoading && (
                  <div className="text-center py-8 text-gray-500">
                    <Beaker className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>ไม่มีข้อมูล PH หรือ TCC สำหรับ order นี้</p>
                    <p className="text-sm">กรุณาตรวจสอบช่วงเวลาและ lot pattern</p>
                  </div>
                )}
              </div>
            )}

            {!loading && activeTab === 'ph' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">PH Data</h4>
                    <p className="text-sm text-gray-500">
                      จำนวนข้อมูล: {orderPHData.length > 0 ? orderPHData.length : phData.filter(item => item.batch_id === order.batch_id).length} รายการ
                    </p>
                  </div>
                  {(getOrderPHChartData() || orderPHData.length > 0) && (
                    <button
                      onClick={() => handleExportData('ph')}
                      className="flex items-center px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </button>
                  )}
                </div>
                
                {dataLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <span className="text-gray-600 mt-2 block">กำลังโหลดข้อมูล PH...</span>
                  </div>
                )}

                {!dataLoading && getOrderPHChartData() ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="h-96">
                      <Line 
                        data={getOrderPHChartData()!} 
                        options={getChartOptions(`ข้อมูล PH ตามช่วงเวลาของ Order ${order.batch_id}`, 'PH Value')} 
                      />
                    </div>
                  </div>
                ) : !dataLoading ? (
                  <div className="text-center text-gray-500 py-8">
                    <Beaker className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>ไม่มีข้อมูล PH สำหรับ order นี้</p>
                    <p className="text-sm">ช่วงเวลา: {formatDateTime(order.log_open_dt_utc)} - {order.log_close_dt_utc ? formatDateTime(order.log_close_dt_utc) : 'ยังไม่เสร็จสิ้น'}</p>
                  </div>
                ) : null}
              </div>
            )}

            {!loading && activeTab === 'tcc' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">TCC Data</h4>
                    <p className="text-sm text-gray-500">
                      จำนวนข้อมูล: {orderTCCData.length > 0 ? orderTCCData.length : tccData.filter(item => item.batch_id === order.batch_id).length} รายการ
                    </p>
                  </div>
                  {(getOrderTCCChartData() || orderTCCData.length > 0) && (
                    <button
                      onClick={() => handleExportData('tcc')}
                      className="flex items-center px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </button>
                  )}
                </div>
                
                {dataLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                    <span className="text-gray-600 mt-2 block">กำลังโหลดข้อมูล TCC...</span>
                  </div>
                )}

                {!dataLoading && getOrderTCCChartData() ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="h-96">
                      <Line 
                        data={getOrderTCCChartData()!} 
                        options={getChartOptions(`ข้อมูล TCC ตามช่วงเวลาของ Order ${order.batch_id}`, 'TCC Value')} 
                      />
                    </div>
                  </div>
                ) : !dataLoading ? (
                  <div className="text-center text-gray-500 py-8">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>ไม่มีข้อมูล TCC สำหรับ order นี้</p>
                    <p className="text-sm">ช่วงเวลา: {formatDateTime(order.log_open_dt_utc)} - {order.log_close_dt_utc ? formatDateTime(order.log_close_dt_utc) : 'ยังไม่เสร็จสิ้น'}</p>
                  </div>
                ) : null}
              </div>
            )}

            {!loading && activeTab === 'tests' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Test Results</h4>
                  {testResults.length > 0 && (
                    <button
                      onClick={() => handleExportData('tests')}
                      className="flex items-center px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </button>
                  )}
                </div>
                {testResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Parameter
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Round
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {testResults.map((result, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {result.parameter_name || result.parameterId || result.parameter_id || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.round || 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {typeof result.value === 'number' ? result.value.toFixed(3) : result.value || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.unit || result.parameter_unit || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(result.status || 'unknown')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.timestamp ? formatDateTime(result.timestamp) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Beaker className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">ไม่มีข้อมูล Test Results</p>
                    <p className="text-sm">สำหรับ Order: {order.batch_id}</p>
                    <p className="text-xs mt-2 text-gray-400">
                      ข้อมูลที่พยายามดึง: testResults.length = {testResults.length}
                    </p>
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => {
                          console.log('Current testResults:', testResults);
                          console.log('Order data:', order);
                          fetchOrderDetails();
                        }}
                        className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                      >
                        <RefreshCw className="h-4 w-4 inline mr-2" />
                        รีเฟรชข้อมูล
                      </button>
                      
                      <button
                        onClick={async () => {
                          console.log('Running debug for order:', order.batch_id);
                          try {
                            const debugResponse = await apiService.debugTestResults(order.batch_id);
                            console.log('Debug results:', debugResponse.data);
                            alert('ผลลัพธ์ debug แสดงใน Console (กด F12)');
                          } catch (error) {
                            console.error('Debug error:', error);
                            alert('เกิดข้อผิดพลาดในการ debug');
                          }
                        }}
                        className="px-4 py-2 text-sm text-green-600 border border-green-300 rounded-md hover:bg-green-50"
                      >
                        <Beaker className="h-4 w-4 inline mr-2" />
                        Debug ข้อมูล
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && activeTab === 'materials' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Material Inputs</h4>
                  {materialInputs.length > 0 && (
                    <button
                      onClick={() => handleExportData('materials')}
                      className="flex items-center px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </button>
                  )}
                </div>
                {materialInputs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Material Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Material Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Input Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Operator
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {materialInputs.map((material, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {material.Material_ID || material.Material_Code || material.material_id || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {material.Material_Name || material.material_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {typeof material.Actual_Qty === 'number' ? 
                                material.Actual_Qty.toFixed(3) : 
                                material.Actual_Qty || material.Quantity || material.quantity || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {material.UnitOfMeasure || material.Unit || material.unit || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {material.DateTimeUTC ? 
                                formatDateTime(material.DateTimeUTC) : 
                                (material.Input_Date && material.Input_Time ? 
                                  formatDateTime(material.Input_Date + 'T' + material.Input_Time) : 
                                  material.Input_Date || 'N/A')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {material.Operator_ID || material.operator_id || material.UnitOrConnection || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">ไม่มีข้อมูล Material Inputs</p>
                    <p className="text-sm">สำหรับ Order: {order.batch_id}</p>
                    <p className="text-xs mt-2 text-gray-400">
                      ข้อมูลที่พยายามดึง: materialInputs.length = {materialInputs.length}
                    </p>
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => {
                          console.log('Current materialInputs:', materialInputs);
                          console.log('Order data:', order);
                          fetchOrderDetails();
                        }}
                        className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                      >
                        <RefreshCw className="h-4 w-4 inline mr-2" />
                        รีเฟรชข้อมูล
                      </button>
                      
                      <button
                        onClick={async () => {
                          console.log('Running debug for material inputs batch:', order.batch_id);
                          try {
                            const debugResponse = await apiService.debugMaterialInputs(order.batch_id);
                            console.log('Material Input Debug results:', debugResponse.data);
                            alert('ผลลัพธ์ debug แสดงใน Console (กด F12)');
                          } catch (error) {
                            console.error('Material Input Debug error:', error);
                            alert('เกิดข้อผิดพลาดในการ debug');
                          }
                        }}
                        className="px-4 py-2 text-sm text-green-600 border border-green-300 rounded-md hover:bg-green-50"
                      >
                        <Package className="h-4 w-4 inline mr-2" />
                        Debug Material Inputs
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
