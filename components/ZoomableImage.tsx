
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icon';

interface ZoomableImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, className = '' }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Reset state when source changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  // Use a manual DOM listener to handle the wheel event.
  // This is necessary because React's onWheel is passive by default in modern browsers,
  // making preventDefault() ineffective for stopping native browser zoom.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // If Ctrl is held, we handle custom zoom and MUST block browser zoom
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        
        const delta = -e.deltaY * 0.002;
        // Limit scale between 1x and 8x
        setScale(prev => {
          const next = Math.min(Math.max(1, prev + delta), 8);
          if (next === 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      } else {
        // No Ctrl key: Let the page scroll naturally
        if (scale === 1) {
          setShowHint(true);
          if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
          hintTimeoutRef.current = setTimeout(() => setShowHint(false), 2000);
        }
      }
    };

    // { passive: false } is the key to making preventDefault() work
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const zoomIn = () => setScale(s => Math.min(s + 0.5, 8));
  const zoomOut = () => {
    setScale(s => {
      const next = Math.max(1, s - 0.5);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const reset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden touch-none group checkerboard-bg ${className} ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <img 
        src={src} 
        alt={alt}
        draggable={false}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          maxWidth: '90%',
          maxHeight: '90%'
        }}
        className="object-contain select-none rounded-lg shadow-2xl pointer-events-none" 
      />

      {/* Modifier Key Hint */}
      {showHint && scale === 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-white animate-in fade-in zoom-in duration-300">
            Use <kbd className="bg-gray-700 px-1.5 py-0.5 rounded border border-gray-600 text-[10px]">Ctrl</kbd> + Scroll to zoom
          </div>
        </div>
      )}

      {/* Floating Zoom Controls */}
      <div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-xl z-30 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={zoomOut} 
          className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={scale <= 1}
          title="Zoom Out"
        >
          <Icons.Minus className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-gray-300 w-10 text-center select-none">
          {Math.round(scale * 100)}%
        </span>
        <button 
          onClick={zoomIn} 
          className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={scale >= 8}
          title="Zoom In"
        >
          <Icons.Plus className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1"></div>
        <button 
          onClick={reset} 
          className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-yellow-400 transition-colors" 
          title="Reset View"
        >
          <Icons.RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
