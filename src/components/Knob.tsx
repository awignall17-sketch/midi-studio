import React, { useState, useEffect, useRef } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  color?: string;
}

export function Knob({ value, min, max, step = 1, onChange, label, color = '#00AAFF' }: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const startVal = useRef<number>(0);
  
  // Calculate angle (usually -135 to +135 degrees)
  const normalizedValue = (value - min) / (max - min);
  const angle = -135 + normalizedValue * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startVal.current = value;
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    // Sensitivity: 1 pixel = 1% change
    const deltaY = startY.current - e.clientY;
    const deltaVal = deltaY * (max - min) / 100;
    
    let newValue = startVal.current + deltaVal;
    
    // Apply bounds and step
    newValue = Math.max(min, Math.min(max, newValue));
    if (step) {
      newValue = Math.round(newValue / step) * step;
    }
    
    onChange(newValue);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const handleDoubleClick = () => {
    onChange((min + max) / 2); // Reset to center
  };

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div 
        className="relative w-16 h-16 rounded-full bg-[#111] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),_0_2px_4px_rgba(0,0,0,0.5)] border border-[#333] cursor-ns-resize flex items-center justify-center transition-transform active:scale-95"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Glow */}
        <div 
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity"
          style={{ backgroundColor: color, filter: 'blur(8px)' }}
        />
        
        {/* Center cap */}
        <div className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center">
          {/* Indicator Dot */}
          <div 
            className="absolute w-full h-full"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div 
              className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: color, color: color }}
            />
          </div>
        </div>
        
        {/* Value overlay on hover */}
        {isDragging && (
          <div className="absolute -top-8 bg-black border border-[#333] text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap">
            {value.toFixed(step < 1 ? 2 : 0)}
          </div>
        )}
      </div>
      <span className="text-[10px] font-bold text-[#8E9299] tracking-wider uppercase">{label}</span>
    </div>
  );
}
