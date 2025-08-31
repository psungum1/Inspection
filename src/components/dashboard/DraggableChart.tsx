import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, X } from 'lucide-react';
import TrendChart from './TrendChart';
import { TestParameter, TestResult } from '../../types';

interface DraggableChartProps {
  id: string;
  lineNumber: number;
  parameter: TestParameter;
  testResults: TestResult[];
  index: number;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onRemove: (id: string) => void;
  isDragging: boolean;
  draggedIndex: number | null;
}

const DraggableChart: React.FC<DraggableChartProps> = ({
  id,
  lineNumber,
  parameter,
  testResults,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onRemove,
  isDragging,
  draggedIndex
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', id);
    onDragStart(e, index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, index);
  };

  const isBeingDragged = isDragging && draggedIndex === index;
  const isDropTarget = isDragOver && draggedIndex !== null && draggedIndex !== index;

  return (
    <div
      ref={chartRef}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative bg-white rounded-lg border-2 transition-all duration-300 cursor-move chart-card
        ${isBeingDragged ? 'dragging opacity-50 scale-95 shadow-xl' : ''}
        ${isDropTarget ? 'drop-target scale-105' : 'border-gray-200 hover:border-gray-300'}
        ${isHovered && !isBeingDragged ? 'shadow-lg border-blue-200' : 'shadow-sm'}
        ${isDragOver && !isBeingDragged ? 'border-dashed border-blue-400' : ''}
      `}
      style={{
        transform: isBeingDragged ? 'scale(0.95) rotate(2deg)' : isDropTarget ? 'scale(1.05)' : 'none',
        zIndex: isBeingDragged ? 1000 : isDropTarget ? 100 : 'auto'
      }}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 left-2 z-10">
        <div className="flex items-center space-x-2">
          <GripVertical 
            className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors" 
          />
          {isHovered && !isBeingDragged && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(id);
              }}
              className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-colors"
              title="Remove chart"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-4 pt-8">
        <TrendChart
          lineNumber={lineNumber}
          parameter={parameter}
          testResults={testResults}
        />
      </div>

      {/* Drop Indicator */}
      {isDropTarget && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-50 rounded-lg pointer-events-none" />
      )}

      {/* Drag Overlay */}
      {isDragOver && !isBeingDragged && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-20 rounded-lg pointer-events-none" />
      )}
    </div>
  );
};

export default DraggableChart; 