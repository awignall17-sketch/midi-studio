import React, { useState, useRef, useEffect } from 'react';
import { X, Activity, Upload, FileAudio, Play, Square } from 'lucide-react';
import { TrackData } from '../types';
import { Knob } from './Knob';
import * as Tone from 'tone';
import { engine } from '../audio';

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
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPos, setPlayheadPos] = useState(0);
  const playheadInterval = useRef<any>(null);

  const dragNode = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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

  const previewSound = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      setPlayheadPos(0);
      if (playheadInterval.current) clearInterval(playheadInterval.current);
      return;
    }

    await Tone.start();
    
    // Temporarily apply current values to audio engine for preview
    engine.syncTrack(
      track.id, 
      track.instrument, 
      track.volume, 
      track.pan, 
      false, 
      track.delayWet, 
      track.reverbWet, 
      track.distWet, 
      track.chorusWet, 
      track.bitcrusherWet, 
      track.sampleUrl, 
      track.sampleRootNote, 
      track.samplePlaybackSpeed, 
      track.sampleReverse, 
      track.sampleDuration, 
      track.sampleFade ?? true, 
      track.sampleStart ?? 0, 
      track.sampleEnd ?? 0, 
      { attack, decay, sustain, release }, 
      filterCutoff, 
      filterResonance, 
      drive, 
      lfoRate, 
      ampMod
    );

    const note = track.defaultNote || 'C4';
    engine.playNote(track.id, note, 0.8, Tone.now(), '2n', 0);
    
    setIsPlaying(true);
    const start = Date.now();
    const duration = (attack + decay + 0.5 + release) * 1000; // 0.5s sustain for preview
    
    playheadInterval.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = elapsed / duration;
      if (progress >= 1) {
        setIsPlaying(false);
        setPlayheadPos(0);
        clearInterval(playheadInterval.current);
      } else {
        setPlayheadPos(progress);
      }
    }, 16);
  };

  useEffect(() => {
    return () => {
      if (playheadInterval.current) clearInterval(playheadInterval.current);
    };
  }, []);

  // ADSR calculations
  const maxTime = Math.max(attack + decay + 0.5 + release, 1.0); 
  const width = 800;
  const height = 200;
  
  const xA = (attack / maxTime) * width;
  const xD = xA + (decay / maxTime) * width;
  const xS = xD + (0.5 / maxTime) * width; // 0.5s sustain display
  const xR = xS + (release / maxTime) * width;
  
  const yPeak = 20;
  const yBottom = 180;
  const heightSpan = yBottom - yPeak;
  const ySustain = yBottom - (sustain * heightSpan);

  const points = `0,${yBottom} ${xA},${yPeak} ${xD},${ySustain} ${xS},${ySustain} ${xR},${yBottom}`;

  const handlePointerDown = (node: string) => {
    dragNode.current = node;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragNode.current || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    if (dragNode.current === 'attack') {
      const val = Math.max(0.001, Math.min(2, (x / width) * maxTime));
      setAttack(val);
    } else if (dragNode.current === 'decay') {
      const val = Math.max(0, Math.min(2, ((x - xA) / width) * maxTime));
      setDecay(val);
    } else if (dragNode.current === 'sustain') {
      const val = Math.max(0, Math.min(1, (yBottom - y) / heightSpan));
      setSustain(val);
    } else if (dragNode.current === 'release') {
      const val = Math.max(0, Math.min(5, ((x - xS) / width) * maxTime));
      setRelease(val);
    }
  };

  const handlePointerUp = () => {
    dragNode.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#151619] border border-[#333] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-[#333] flex items-center justify-between bg-[#242424]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00AAFF]" />
            ADVANCED AUTOMATION & SYNTHESIS: {track.name.toUpperCase()}
          </h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={previewSound}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${isPlaying ? 'bg-[#FF4444] text-white' : 'bg-[#00AAFF] text-white hover:bg-[#33bbff]'}`}
            >
              {isPlaying ? <Square size={14} fill="white" /> : <Play size={14} fill="white" />}
              {isPlaying ? 'STOP PREVIEW' : 'PREVIEW SOUND'}
            </button>
            <button onClick={onClose} className="text-[#8E9299] hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ADSR Graph Section */}
          <div className="bg-[#1a1b20] rounded-xl border border-[#333] overflow-hidden flex flex-col">
            <div className="p-2 border-b border-[#333] flex justify-between items-center bg-[#242424]">
              <span className="text-xs font-bold text-[#8E9299]">ENVELOPE AUTOMATION (ADSR) - Drag nodes to edit</span>
              <span className="text-[10px] text-[#8E9299]">Total Time: {maxTime.toFixed(2)}s</span>
            </div>
            
            <div className="relative w-full h-48 bg-[#0a0a0c] select-none touch-none">
              {/* Grid lines */}
              <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              
              <svg 
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`} 
                className="absolute inset-0 w-full h-full z-10 preserve-3d"
              >
                {/* Fill */}
                <polygon points={`${points} 0,${yBottom}`} fill="rgba(255, 170, 0, 0.1)" />
                {/* Line */}
                <polyline 
                  points={points} 
                  fill="none" 
                  stroke="#FFAA00" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                
                {/* Playhead */}
                {isPlaying && (
                  <line 
                    x1={playheadPos * width} y1="0" 
                    x2={playheadPos * width} y2={height} 
                    stroke="#00AAFF" strokeWidth="2" strokeDasharray="4 2"
                  />
                )}
                
                {/* Labels */}
                <text x={xA/2} y={height - 10} className="text-[10px] fill-[#8E9299]">ATTACK</text>
                <text x={xA + (xD-xA)/2} y={height - 10} className="text-[10px] fill-[#8E9299]">DECAY</text>
                <text x={xD + (xS-xD)/2} y={height - 10} className="text-[10px] fill-[#8E9299]">SUSTAIN</text>
                <text x={xS + (xR-xS)/2} y={height - 10} className="text-[10px] fill-[#8E9299]">RELEASE</text>

                {/* Nodes */}
                <circle cx={xA} cy={yPeak} r="8" fill="#FFAA00" className="cursor-ew-resize hover:r-10 transition-all shadow-lg" onPointerDown={() => handlePointerDown('attack')} />
                <circle cx={xD} cy={ySustain} r="8" fill="#FFAA00" className="cursor-ew-resize hover:r-10 transition-all shadow-lg" onPointerDown={() => handlePointerDown('decay')} />
                <circle cx={xS} cy={ySustain} r="8" fill="#00AAFF" className="cursor-ns-resize hover:r-10 transition-all shadow-lg" onPointerDown={() => handlePointerDown('sustain')} />
                <circle cx={xR} cy={yBottom} r="8" fill="#FFAA00" className="cursor-ew-resize hover:r-10 transition-all shadow-lg" onPointerDown={() => handlePointerDown('release')} />
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
                <input type="range" min="0" max="1" step="0.01" value={sustain} onChange={e => setSustain(parseFloat(e.target.value))} className="custom-slider" style={{ '--thumb-color': '#00AAFF' } as any} />
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
