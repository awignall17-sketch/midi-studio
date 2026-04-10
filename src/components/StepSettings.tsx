import React from 'react';
import { StepData } from '../types';

interface Props {
  step: StepData;
  rect: DOMRect;
  onUpdate: (data: Partial<StepData>) => void;
  onClose: () => void;
  type: 'drum' | 'melodic';
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = [1, 2, 3, 4, 5, 6];

export function StepSettings({ step, rect, onUpdate, onClose, type }: Props) {
  // Position the popover near the rect, ensuring it stays on screen
  let top = rect.bottom + window.scrollY + 10;
  let left = rect.left + window.scrollX - 50;
  
  // Basic bounds checking
  if (left < 10) left = 10;
  if (top + 150 > window.innerHeight) {
    top = rect.top + window.scrollY - 160; // show above if too low
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div 
        className="absolute z-50 bg-[#151619] border border-[#333] rounded-lg p-4 shadow-2xl flex flex-col gap-4 w-56"
        style={{ top, left }}
      >
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-[#8E9299]">STEP SETTINGS</span>
          <button onClick={onClose} className="text-[#8E9299] hover:text-white">&times;</button>
        </div>
        
        {type === 'melodic' && (
          <div className="flex flex-col gap-2">
            <label className="text-[0.625rem] font-mono text-[#8E9299]">PITCH</label>
            <div className="flex gap-2">
              <select 
                className="bg-[#242424] text-white text-xs p-1 rounded border border-[#333] flex-1 outline-none focus:border-[#FF4444]"
                value={(step.note || 'C4').replace(/\d/, '')}
                onChange={e => onUpdate({ note: e.target.value + (step.note || 'C4').replace(/\D/g, '') })}
              >
                {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select 
                className="bg-[#242424] text-white text-xs p-1 rounded border border-[#333] w-16 outline-none focus:border-[#FF4444]"
                value={(step.note || 'C4').replace(/\D/g, '')}
                onChange={e => onUpdate({ note: (step.note || 'C4').replace(/\d/, '') + e.target.value })}
              >
                {OCTAVES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-[0.625rem] font-mono text-[#8E9299]">VELOCITY ({Math.round(step.velocity * 100)}%)</label>
          <input 
            type="range" 
            min="0" max="1" step="0.05" 
            value={step.velocity}
            onChange={e => onUpdate({ velocity: parseFloat(e.target.value) })}
            className="w-full accent-[#FF4444]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[0.625rem] font-mono text-[#8E9299]">DURATION (STRETCH)</label>
          <select 
            className="bg-[#242424] text-white text-xs p-1 rounded border border-[#333] outline-none focus:border-[#FF4444]"
            value={step.duration}
            onChange={e => onUpdate({ duration: e.target.value })}
          >
            <option value="32n">1/32 (Short)</option>
            <option value="16n">1/16 (Normal)</option>
            <option value="8n">1/8 (Long)</option>
            <option value="4n">1/4 (Very Long)</option>
            <option value="2n">1/2 (Half Note)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[0.625rem] font-mono text-[#8E9299]">STEP SPAN (HOLD)</label>
          <div className="flex items-center gap-2">
            <input 
              type="range" 
              min="1" max="16" step="1" 
              value={step.stepSpan || 1}
              onChange={e => onUpdate({ stepSpan: parseInt(e.target.value) })}
              className="flex-1 accent-[#FF4444]"
            />
            <span className="text-xs text-white w-4 text-right">{step.stepSpan || 1}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[0.625rem] font-mono text-[#8E9299]">MICRO-TIMING (MOVE)</label>
          <input 
            type="range" 
            min="-0.5" max="0.5" step="0.05" 
            value={step.offset}
            onChange={e => onUpdate({ offset: parseFloat(e.target.value) })}
            className="w-full accent-[#FF4444]"
          />
          <div className="flex justify-between text-[8px] text-[#8E9299]">
            <span>EARLY</span>
            <span>ON GRID</span>
            <span>LATE</span>
          </div>
        </div>
      </div>
    </>
  );
}
