import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Square } from 'lucide-react';
import * as Tone from 'tone';

interface Props {
  file: File;
  onConfirm: (start: number, end: number, duration: number, b64Data: string) => void;
  onCancel: () => void;
}

export function SampleTrimmerModal({ file, onConfirm, onCancel }: Props) {
  const [duration, setDuration] = useState<number>(0);
  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [base64Data, setBase64Data] = useState<string>('');
  const playerRef = useRef<Tone.Player | null>(null);
  const urlRef = useRef<string>('');

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setBase64Data(e.target.result);
      }
    };
    reader.readAsDataURL(file);

    const url = URL.createObjectURL(file);
    urlRef.current = url;
    
    const player = new Tone.Player({
      url,
      onload: () => {
        const dur = player.buffer.duration;
        setDuration(dur);
        setEnd(dur);
      }
    }).toDestination();
    
    playerRef.current = player;

    return () => {
      player.dispose();
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const togglePlay = async () => {
    if (!playerRef.current || !playerRef.current.loaded) return;
    
    await Tone.start();
    
    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
    } else {
      playerRef.current.start(0, start, end - start);
      setIsPlaying(true);
      
      // Auto stop when reached end
      setTimeout(() => {
        setIsPlaying(false);
      }, (end - start) * 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#151619] border border-[#333] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[#333] flex items-center justify-between bg-[#242424]">
          <h2 className="text-lg font-bold text-white">Trim Sample</h2>
          <button onClick={onCancel} className="text-[#8E9299] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-[#8E9299] text-sm mb-2">{file.name}</p>
            <p className="text-white font-mono text-xs">Duration: {duration.toFixed(2)}s</p>
          </div>

          {duration > 0 ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#8E9299] mb-1">
                  <span>START: {start.toFixed(2)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.01"
                  value={start}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val < end) setStart(val);
                  }}
                  className="w-full custom-slider"
                  style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold text-[#8E9299] mb-1">
                  <span>END: {end.toFixed(2)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.01"
                  value={end}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > start) setEnd(val);
                  }}
                  className="w-full custom-slider"
                  style={{ '--thumb-color': '#FF4444' } as any}
                />
              </div>
              
              <div className="flex justify-center pt-2">
                <button
                  onClick={togglePlay}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-colors ${
                    isPlaying ? 'bg-[#FF4444] text-white' : 'bg-[#242424] text-white hover:bg-[#333]'
                  }`}
                >
                  {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'STOP' : 'PREVIEW'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-[#8E9299] py-8">
              Loading audio...
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-[#333] flex gap-3 bg-[#242424]">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg font-bold text-[#8E9299] hover:text-white hover:bg-[#333] transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={() => onConfirm(start, end, duration, base64Data)}
            disabled={duration === 0 || !base64Data}
            className="flex-1 py-2 bg-[#00AAFF] hover:bg-[#33bbff] text-white rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}
