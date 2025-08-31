import React, { useState, useEffect } from 'react';
import { Plus, Settings } from 'lucide-react';
import DraggableChart from './DraggableChart';
import { TestParameter, TestResult } from '../../types';

interface ChartConfig {
  id: string;
  lineNumber: number;
  parameter: TestParameter;
  testResults: TestResult[];
}

interface ChartGridProps {
  charts: ChartConfig[];
  onChartsReorder: (charts: ChartConfig[]) => void;
  onChartRemove: (chartId: string) => void;
  onAddChart: () => void;
  testParameters: TestParameter[];
  trendResults: TestResult[];
  activeLines: number[];
}

const ChartGrid: React.FC<ChartGridProps> = ({
  charts,
  onChartsReorder,
  onChartRemove,
  onAddChart,
  testParameters,
  trendResults,
  activeLines
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setIsDragging(true);
    setDraggedIndex(index);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setIsDragging(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the charts
    const newCharts = [...charts];
    const draggedChart = newCharts[draggedIndex];
    newCharts.splice(draggedIndex, 1);
    newCharts.splice(dropIndex, 0, draggedChart);

    onChartsReorder(newCharts);
    
    setIsDragging(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Auto-generate charts if none exist
  useEffect(() => {
    if (charts.length === 0 && activeLines.length > 0 && testParameters.length > 0) {
      const initialCharts: ChartConfig[] = [];
      
      // Create one chart per line for the first parameter
      activeLines.slice(0, 3).forEach((lineNumber, index) => {
        const parameter = testParameters[0];
        const lineTestResults = trendResults.filter(
          tr => (tr as any).lineNumber === lineNumber && 
          (tr.parameterId === parameter.id || (tr as any).parameter_id === parameter.id)
        );
        
        initialCharts.push({
          id: `chart-${lineNumber}-${parameter.id}-${index}`,
          lineNumber,
          parameter,
          testResults: lineTestResults
        });
      });
      
      if (initialCharts.length > 0) {
        onChartsReorder(initialCharts);
      }
    }
  }, [charts.length, activeLines, testParameters, trendResults, onChartsReorder]);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Trend Charts
          </h3>
          <p className="text-sm text-gray-600">
            Drag and drop to reorder charts. Hover over charts to remove them.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onAddChart}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Chart
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      {charts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-500">
            <div className="text-lg font-medium mb-2">No charts configured</div>
            <div className="text-sm mb-4">Click "Add Chart" to start monitoring trends</div>
            <button
              onClick={onAddChart}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Chart
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 chart-container"
          onDragEnd={handleDragEnd}
        >
          {charts.map((chart, index) => (
            <DraggableChart
              key={chart.id}
              id={chart.id}
              lineNumber={chart.lineNumber}
              parameter={chart.parameter}
              testResults={chart.testResults}
              index={index}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onRemove={onChartRemove}
              isDragging={isDragging}
              draggedIndex={draggedIndex}
            />
          ))}
        </div>
      )}

      {/* Drag and Drop Instructions */}
      {charts.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Drag and Drop Tips</h4>
              <div className="mt-1 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Use the grip handle to drag charts</li>
                  <li>Hover over charts to see the remove button</li>
                  <li>Charts will automatically save their new order</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartGrid; 