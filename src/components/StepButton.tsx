import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';
import { StepData } from '../types';

interface Props {
  color: string;
  isActive: boolean;
  trackId: string;
  stepIndex: number;
  onToggle: (trackId: string, stepIndex: number) => void;
}

export const StepButton = React.memo(function StepButton({ isActive, color, onToggle, trackId, stepIndex }: Props) {
  const [isPressing, setIsPressing] = useState(false);

  return (
    <div className="relative w-8 h-10 sm:w-10 sm:h-12">
      <button
        onPointerDown={() => setIsPressing(true)}
        onPointerUp={() => setIsPressing(false)}
        onPointerLeave={() => setIsPressing(false)}
        onClick={(e) => {
          e.preventDefault();
          onToggle(trackId, stepIndex);
        }}
        className={clsx(
          "absolute top-0 left-0 w-full h-10 sm:h-12 rounded-md transition-all duration-100 border-2 touch-none step-btn overflow-hidden flex items-center justify-center",
          isActive ? "border-transparent" : "border-[#333]",
          isPressing && "scale-95"
        )}
        style={{
          backgroundColor: isActive ? color : 'transparent',
          boxShadow: isActive ? `0 0 12px ${color}80` : 'none',
          opacity: isActive ? 0.8 : 1,
        }}
      />
    </div>
  );
});
