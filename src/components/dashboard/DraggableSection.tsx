import React, { useState, useRef } from 'react';
import { GripVertical } from 'lucide-react';

interface DraggableSectionProps {
  id: string;
  index: number;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging: boolean;
  draggedIndex: number | null;
  label: string;
  children: React.ReactNode;
}

const DraggableSection: React.FC<DraggableSectionProps> = ({
  id,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  draggedIndex,
  label,
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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
      ref={sectionRef}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative bg-white rounded-lg border-2 transition-all duration-300 cursor-move chart-card mb-6
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
      {/* Drag Handle and Label */}
      <div className="absolute top-2 left-2 z-10 flex items-center space-x-2">
        <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors" />
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {label}
        </span>
      </div>
      <div className="pt-8">{children}</div>
      {isDropTarget && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-50 rounded-lg pointer-events-none" />
      )}
      {isDragOver && !isBeingDragged && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-20 rounded-lg pointer-events-none" />
      )}
    </div>
  );
};

export default DraggableSection; 