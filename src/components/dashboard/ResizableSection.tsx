import React, { useRef, useState, useEffect } from 'react';

interface ResizableSectionProps {
  id: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  children: React.ReactNode;
}

const getSizeKey = (id: string) => `dashboard-section-size-${id}`;

const ResizableSection: React.FC<ResizableSectionProps> = ({
  id,
  minWidth = 280,
  minHeight = 120,
  maxWidth = 2000,
  maxHeight = 1200,
  children
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Load size from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(getSizeKey(id));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSize(parsed);
      } catch {}
    }
  }, [id]);

  // Set initial size if not set
  useEffect(() => {
    if (sectionRef.current && size.width === 0 && size.height === 0) {
      const rect = sectionRef.current.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    }
  }, [size.width, size.height]);

  // Save size to localStorage
  useEffect(() => {
    if (size.width && size.height) {
      localStorage.setItem(getSizeKey(id), JSON.stringify(size));
    }
  }, [id, size]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width: size.width, height: size.height });
    document.body.style.cursor = 'nwse-resize';
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      let newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width + dx));
      let newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height + dy));
      setSize({ width: newWidth, height: newHeight });
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startPos, startSize, minWidth, minHeight, maxWidth, maxHeight]);

  return (
    <div
      ref={sectionRef}
      style={{
        width: size.width ? size.width : undefined,
        height: size.height ? size.height : undefined,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        position: 'relative',
        resize: 'none',
        overflow: 'visible',
        transition: isResizing ? 'none' : 'box-shadow 0.2s',
        boxShadow: isResizing ? '0 0 0 2px #3b82f6' : undefined
      }}
      className="group"
    >
      {children}
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute bottom-1.5 right-1.5 w-5 h-5 flex items-end justify-end cursor-nwse-resize z-20"
        style={{ userSelect: 'none' }}
        title="Resize section"
      >
        <div className="w-4 h-4 bg-white border border-blue-300 rounded-md shadow flex items-center justify-center group-hover:bg-blue-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 13L13 3" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 13L13 8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ResizableSection; 