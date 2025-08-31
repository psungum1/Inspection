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
  { key: 'RE1_1-TCC', label: 'RE1_1_TCC.PV' ,color: '#3b82f6' },
  { key: 'RE1_2-TCC', label: 'RE1_2_TCC.PV' , color: '#22c55e' },
  { key: 'RE1_3-TCC', label: 'RE1_3_TCC.PV' , color: '#f59e42' },
  { key: 'RE1_4-TCC', label: 'RE1_4_TCC.PV' , color: '#e11d48' },
  { key: 'RE1_5-TCC', label: 'RE1_5_TCC.PV' , color: '#a21caf' },
  { key: 'RE1_6-TCC', label: 'RE1_6_TCC.PV' , color: '#0ea5e9' },
];

const MAX_RECORDS = 100; // Limit to 100 records

const TCCChart: React.FC = () => {
  const [series, setSeries] = useState<{ [tag: string]: any[] }>({});
  const [recordCount, setRecordCount] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:3002/ws/production');
    
    wsRef.current.onopen = () => {
      console.log('TCC WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const { tag, data } = JSON.parse(event.data);

      // Only process TCC tags
      if (tag.includes('-TCC')) {
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
    };

    wsRef.current.onclose = () => {
      console.log('TCC WebSocket disconnected');
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

  if (!series[TAGS[0].key] || series[TAGS[0].key].length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">TCC (Real Time)</h3>
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
            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`;
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">TCC (Real Time)</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600">Live</span>
          </div>
          <div className="text-gray-500">
            Records: <span className="font-semibold text-blue-600">{recordCount}</span>/100
          </div>
          {lastUpdate && (
            <div className="text-gray-500">
              Last: <span className="font-mono">{lastUpdate}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Showing last {Math.min(recordCount, MAX_RECORDS)} real-time TCC measurements
      </div>
    </div>
  );
};

export default TCCChart; 