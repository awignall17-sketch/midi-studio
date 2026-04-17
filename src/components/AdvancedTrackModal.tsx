import React, { useState } from 'react';
import { X, Activity, Upload, FileAudio } from 'lucide-react';
import { TrackData } from '../types';
import { Knob } from './Knob';

interface Props {
  track: TrackData;
  onUpdateTrack: (data: Partial<TrackData>) => void;
  onSampleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

export function AdvancedTrackModal({ track, onUpdateTrack, onSampleUpload, onClose }: Props) {
  const [attack, setAttack] = useState(track.envelope?.attack ?? 0.05);
  const [decay, setDecay] = useState(track.envelope?.decay ?? 0.2);
  const [sustain, setSustain] = useState(track.envelope?.sustain ?? 0.5);
  const [release, setRelease] = useState(track.envelope?.release ?? 1);

  const [filterCutoff, setFilterCutoff] = useState(track.filterCutoff ?? 20000);
  const [filterResonance, setFilterResonance] = useState(track.filterResonance ?? 0);
  const [drive, setDrive] = useState(track.drive ?? 0);
  const [lfoRate, setLfoRate] = useState(track.lfoRate ?? 0);
  const [ampMod, setAmpMod] = useState(track.ampMod ?? 0);

  const applyChanges = () => {
    onUpdateTrack({
      envelope: { attack, decay, sustain, release },
      filterCutoff,
      filterResonance,
      drive,
      lfoRate,
      ampMod
    });
    onClose();
  };

  // SVGs calculations for ADSR
  const maxTime = Math.max(attack + decay + 1.0 + release, 1.0); // Minimum 1 second total
  const width = 800; // viewBox width
  const height = 200; // viewBox height
  
  const xA = (attack / maxTime) * width;
  const xD = xA + (decay / maxTime) * width;
  const xS = xD + (1.0 / maxTime) * width; // 1s fixed sustain display
  const xR = xS + (release / maxTime) * width;
  
  const yPeak = 20;
  const yBottom = 180;
  const heightSpan = yBottom - yPeak;
  const ySustain = yBottom - (sustain * heightSpan);

  const points = `0,${yBottom} ${xA},${yPeak} ${xD},${ySustain} ${xS},${ySustain} ${xR},${yBottom}`;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#151619] border border-[#333] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-[#333] flex items-center justify-between bg-[#242424]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00AAFF]" />
            ADVANCED AUTOMATION & SYNTHESIS: {track.name.toUpperCase()}
          </h2>
          <button onClick={onClose} className="text-[#8E9299] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ADSR Graph Section */}
          <div className="bg-[#1a1b20] rounded-xl border border-[#333] overflow-hidden flex flex-col">
            <div className="p-2 border-b border-[#333] flex justify-between items-center bg-[#242424]">
              <span className="text-xs font-bold text-[#8E9299]">ENVELOPE AUTOMATION (ADSR)</span>
            </div>
            
            <div className="relative w-full h-48 bg-[#0a0a0c]">
              {/* Grid lines */}
              <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              
              <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full z-10 preserve-3d">
                {/* Fill */}
                <polygon points={`${points} 0,${yBottom}`} fill="rgba(255, 170, 0, 0.15)" />
                {/* Line */}
                <polyline 
                  points={points} 
                  fill="none" 
                  stroke="#FFAA00" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                
                {/* Nodes */}
                <circle cx={xA} cy={yPeak} r="6" fill="#FFAA00" className="cursor-pointer hover:r-8 transition-all" />
                <circle cx={xD} cy={ySustain} r="6" fill="#FFAA00" className="cursor-pointer hover:r-8 transition-all" />
                <circle cx={xS} cy={ySustain} r="6" fill="#FFAA00" className="cursor-pointer hover:r-8 transition-all" />
                <circle cx={xR} cy={yBottom} r="6" fill="#FFAA00" className="cursor-pointer hover:r-8 transition-all" />
              </svg>
            </div>

            <div className="grid grid-cols-4 gap-4 p-4 bg-[#1a1b20]">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8E9299]">ATTACK ({attack.toFixed(3)}s)</span>
                <input type="range" min="0.001" max="2" step="0.001" value={attack} onChange={e => setAttack(parseFloat(e.target.value))} className="custom-slider" style={{ '--thumb-color': '#FFAA00' } as any} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8E9299]">DECAY ({decay.toFixed(2)}s)</span>
                <input type="range" min="0" max="2" step="0.01" value={decay} onChange={e => setDecay(parseFloat(e.target.value))} className="custom-slider" style={{ '--thumb-color': '#FFAA00' } as any} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8E9299]">SUSTAIN ({Math.round(sustain * 100)}%)</span>
                <input type="range" min="0" max="1" step="0.01" value={sustain} onChange={e => setSustain(parseFloat(e.target.value))} className="custom-slider" style={{ '--thumb-color': '#FFAA00' } as any} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8E9299]">RELEASE ({release.toFixed(2)}s)</span>
                <input type="range" min="0" max="5" step="0.01" value={release} onChange={e => setRelease(parseFloat(e.target.value))} className="custom-slider" style={{ '--thumb-color': '#FFAA00' } as any} />
              </div>
            </div>
          </div>

          {/* Knobs Section */}
          <div className="bg-[#1a1b20] rounded-xl border border-[#333] p-6 flex items-center justify-around flex-wrap gap-8">
            <Knob label="FILTER CUTOFF" min={20} max={20000} value={filterCutoff} onChange={setFilterCutoff} color="#00AAFF" />
            <Knob label="RESONANCE" min={0} max={20} step={0.1} value={filterResonance} onChange={setFilterResonance} color="#FFAA00" />
            <Knob label="DRIVE" min={0} max={1} step={0.01} value={drive} onChange={setDrive} color="#00AAFF" />
            <Knob label="LFO RATE" min={0} max={20} step={0.1} value={lfoRate} onChange={setLfoRate} color="#FFAA00" />
            <Knob label="AMP MOD" min={0} max={1} step={0.01} value={ampMod} onChange={setAmpMod} color="#00AAFF" />
          </div>

          {track.instrument === 'sampler' && (
            <div className="bg-[#1a1b20] p-4 rounded-xl border border-[#333] text-center">
              <FileAudio className="w-8 h-8 text-[#8E9299] mx-auto mb-2" />
              <p className="text-sm text-[#8E9299] mb-4">You are editing a Sampler track. Upload a custom sample.</p>
              <label className="inline-flex items-center gap-2 px-6 py-2 bg-[#00AAFF] hover:bg-[#33bbff] text-white font-bold rounded-lg cursor-pointer transition-colors text-sm">
                <Upload className="w-4 h-4" />
                <span>UPLOAD NEW AUDIO</span>
                <input 
                  type="file" 
                  accept="audio/mp3,audio/wav" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    onSampleUpload(e);
                    onClose();
                  }}
                />
              </label>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-[#333] flex justify-end gap-2 bg-[#242424]">
          <button onClick={onClose} className="px-4 py-2 font-bold text-[#8E9299] hover:text-white transition-colors">
            CANCEL
          </button>
          <button onClick={applyChanges} className="px-6 py-2 bg-[#00AAFF] hover:bg-[#33bbff] text-white font-bold rounded-lg transition-colors">
            APPLY CHANGES
          </button>
        </div>
      </div>
    </div>
  );
}
