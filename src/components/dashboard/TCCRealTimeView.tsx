import React, { useEffect, useRef, useState } from 'react';
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
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const TAGS = [
  { key: 'RE1_1-TCC', label: 'RE1_1_TCC.PV', color: '#3b82f6', name: 'RE1_1' },
  { key: 'RE1_2-TCC', label: 'RE1_2_TCC.PV', color: '#22c55e', name: 'RE1_2' },
  { key: 'RE1_3-TCC', label: 'RE1_3_TCC.PV', color: '#f59e42', name: 'RE1_3' },
  { key: 'RE1_4-TCC', label: 'RE1_4_TCC.PV', color: '#e11d48', name: 'RE1_4' },
  { key: 'RE1_5-TCC', label: 'RE1_5_TCC.PV', color: '#a21caf', name: 'RE1_5' },
  { key: 'RE1_6-TCC', label: 'RE1_6_TCC.PV', color: '#0ea5e9', name: 'RE1_6' },
];

const MAX_RECORDS = 100;

interface TCCRecord {
  tag: string;
  value: number;
  timestamp: string;
  formattedTime: string;
}

const TCCRealTimeView: React.FC = () => {
  const [series, setSeries] = useState<{ [tag: string]: any[] }>({});
  const [recordCount, setRecordCount] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [showTable, setShowTable] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:3002/ws/production');
    
    wsRef.current.onopen = () => {
      console.log('TCC WebSocket connected');
      setConnectionStatus('connected');
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // Handle connection status messages
      if (message.type === 'connection_status') {
        console.log('Connection status:', message.message);
        return;
      }
      
      // Handle data messages
      const { tag, data } = message;

      // Only process TCC tags
      if (tag && tag.includes('-TCC')) {
        setSeries(prev => {
          const currentSeries = prev[tag] || [];
          const newSeries = [...currentSeries, data];
          
          // Keep only the last MAX_RECORDS
          const limitedSeries = newSeries.slice(-MAX_RECORDS);
          
          return {
            ...prev,
            [tag]: limitedSeries,
          };
        });

        setLastUpdate(new Date().toLocaleTimeString());
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('TCC WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

    wsRef.current.onclose = () => {
      console.log('TCC WebSocket disconnected');
      setConnectionStatus('disconnected');
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  // Update record count when series change
  useEffect(() => {
    const firstTag = TAGS[0].key;
    if (series[firstTag]) {
      setRecordCount(series[firstTag].length);
    }
  }, [series]);

  // Prepare data for table view
  const getTableData = (): TCCRecord[] => {
    const allRecords: TCCRecord[] = [];
    
    TAGS.forEach(tag => {
      const tagData = series[tag.key] || [];
      tagData.forEach((record: any) => {
        allRecords.push({
          tag: tag.name,
          value: parseFloat(record.Value) || 0,
          timestamp: record.DateTime,
          formattedTime: new Date(record.DateTime).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        });
      });
    });

    // Sort by timestamp (newest first) and take the latest 100
    return allRecords
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, MAX_RECORDS);
  };

  if (!series[TAGS[0].key] || series[TAGS[0].key].length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">TCC Real-Time Monitoring</h3>
          <div className="text-sm text-gray-500">Waiting for data...</div>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="animate-pulse">⏳</div>
            <div className="mt-2">Connecting to real-time TCC data...</div>
          </div>
        </div>
      </div>
    );
  }

  const labels = series[TAGS[0].key].map((d: any) => {
    const date = new Date(d.DateTime);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }) || [];

  const datasets = TAGS.map(({ key, label, color }) => ({
    label,
    data: (series[key] || []).map((d: any) => parseFloat(d.Value) || 0),
    borderColor: color,
    backgroundColor: color + '20',
    fill: false,
    tension: 0.2,
    pointRadius: 1.5,
    pointHoverRadius: 4,
    borderWidth: 2,
  }));

  const chartData = { labels, datasets };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      title: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            return `Time: ${context[0].label}`;
          },
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}%`;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: false, 
        title: { 
          display: true, 
          text: 'TCC Value (%)',
          font: { size: 12, weight: 'bold' as const }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
      x: {
        title: { 
          display: true, 
          text: 'Time',
          font: { size: 12, weight: 'bold' as const }
        },
        ticks: { 
          display: true,
          maxTicksLimit: 10,
          font: { size: 10 }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    animation: {
      duration: 300
    }
  };

  const tableData = getTableData();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">TCC Real-Time Monitoring</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`}></div>
            <span className="text-gray-600 capitalize">{connectionStatus}</span>
          </div>
          <div className="text-gray-500">
            Records: <span className="font-semibold text-blue-600">{recordCount}</span>/100
          </div>
          {lastUpdate && (
            <div className="text-gray-500">
              Last: <span className="font-mono">{lastUpdate}</span>
            </div>
          )}
          <button
            onClick={() => setShowTable(!showTable)}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
          >
            {showTable ? 'Show Chart' : 'Show Table'}
          </button>
        </div>
      </div>
      
      {showTable ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                {TAGS.map(tag => (
                  <th key={tag.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {tag.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.slice(0, 20).map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {record.formattedTime}
                  </td>
                  {TAGS.map(tag => {
                    const tagRecord = tableData.find(r => r.tag === tag.name && r.formattedTime === record.formattedTime);
                    return (
                      <td key={tag.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tagRecord ? `${tagRecord.value.toFixed(3)}%` : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Showing latest 20 of {tableData.length} records
          </div>
        </div>
      ) : (
        <>
          <div className="h-80">
            <Line data={chartData} options={options} />
          </div>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            Showing last {Math.min(recordCount, MAX_RECORDS)} real-time TCC measurements
          </div>
        </>
      )}
    </div>
  );
};

export default TCCRealTimeView; 