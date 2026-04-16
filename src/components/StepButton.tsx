import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';
import { StepData } from '../types';

interface Props {
  key?: React.Key;
  step: StepData;
  color: string;
  isActive: boolean;
  trackId: string;
  stepIndex: number;
  onToggle: (trackId: string, stepIndex: number) => void;
  onOpenSettings: (trackId: string, stepIndex: number, rect: DOMRect) => void;
}

export const StepButton = React.memo(function StepButton({ step, color, isActive, trackId, stepIndex, onToggle, onOpenSettings }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const span = step.stepSpan || 1;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle primary button (left click / touch)
    if (e.button !== 0) return;
    
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      if (buttonRef.current && isActive) {
        onOpenSettings(trackId, stepIndex, buttonRef.current.getBoundingClientRect());
      }
      setIsPressing(false);
      timerRef.current = null;
    }, 500); // 500ms long press
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      onToggle(trackId, stepIndex); // It was a short click
    }
    setIsPressing(false);
  };

  const handlePointerLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  };

  // Also allow right click to open settings immediately
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
    if (buttonRef.current && isActive) {
      onOpenSettings(trackId, stepIndex, buttonRef.current.getBoundingClientRect());
    }
  };

  return (
    <div className={clsx("relative w-8 h-10 sm:w-10 sm:h-12", isActive && span > 1 && "z-20")}>
      <button
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={handleContextMenu}
        className={clsx(
          "absolute top-0 left-0 h-10 sm:h-12 rounded-md transition-all duration-100 border-2 touch-none step-btn overflow-hidden flex items-center",
          isActive ? "border-transparent" : "border-[#333]",
          isPressing && "scale-95",
          (step.offset || 0) < 0 ? "justify-start pl-1" : ((step.offset || 0) > 0 ? "justify-end pr-1" : "justify-center")
        )}
        style={{
          width: isActive && span > 1 ? `calc(${span * 100}% + ${(span - 1) * 4}px)` : '100%',
          backgroundColor: isActive ? color : 'transparent',
          boxShadow: isActive ? `0 0 12px ${color}80` : 'none',
          opacity: isActive ? 0.8 : 1,
        }}
      >
        {isActive && step.offset !== 0 && (
          <div className="w-1.5 h-1.5 bg-black/40 rounded-full" title="Micro-timing offset"></div>
        )}
      </button>
    </div>
  );
});
