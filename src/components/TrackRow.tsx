import React from 'react';
import { Volume2, VolumeX, ChevronUp, ChevronDown, Trash2, Copy, Eraser, ArrowRight, ArrowLeft, Upload, Shuffle, Wand2, Save } from 'lucide-react';
import { TrackData } from '../types';
import { StepButton } from './StepButton';

interface Props {
  track: TrackData;
  trackIndex: number;
  totalTracks: number;
  bars: number;
  onUpdateTrack: (trackIndex: number, data: Partial<TrackData>, skipHistory?: boolean) => void;
  onMoveTrackUp: (trackIndex: number) => void;
  onMoveTrackDown: (trackIndex: number) => void;
  onToggleMute: (trackIndex: number) => void;
  onToggleSolo: (trackIndex: number) => void;
  onShiftTrackLeft: (trackIndex: number) => void;
  onShiftTrackRight: (trackIndex: number) => void;
  onHumanizeTrack: (trackIndex: number) => void;
  onDuplicateTrack: (trackIndex: number) => void;
  onRandomizeTrack: (trackIndex: number) => void;
  onClearTrack: (trackIndex: number) => void;
  onDeleteTrack: (trackIndex: number) => void;
  onSampleUpload: (trackIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onCommitHistory: () => void;
  onToggleStep: (trackId: string, stepIndex: number) => void;
  onOpenSettings: (trackId: string, stepIndex: number, rect: DOMRect) => void;
}

export const TrackRow = React.memo(function TrackRow({
  track,
  trackIndex,
  totalTracks,
  bars,
  onUpdateTrack,
  onMoveTrackUp,
  onMoveTrackDown,
  onToggleMute,
  onToggleSolo,
  onShiftTrackLeft,
  onShiftTrackRight,
  onHumanizeTrack,
  onDuplicateTrack,
  onRandomizeTrack,
  onClearTrack,
  onDeleteTrack,
  onSampleUpload,
  onCommitHistory,
  onToggleStep,
  onOpenSettings,
}: Props) {
  return (
    <div className="flex border-b border-[#2a2b30] last:border-0 relative">
      {/* Track Controls (Sticky) */}
      <div className="w-72 sm:w-80 flex-shrink-0 sticky left-0 z-10 bg-[#151619] p-2 sm:p-3 border-r border-[#2a2b30] flex flex-col gap-1.5 shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input 
              type="color" 
              value={track.color} 
              onChange={(e) => onUpdateTrack(trackIndex, { color: e.target.value })}
              className="w-4 h-4 p-0 border-0 rounded cursor-pointer bg-transparent"
              title="Change Track Color"
            />
            <input 
              type="text" 
              value={track.name}
              onChange={(e) => onUpdateTrack(trackIndex, { name: e.target.value })}
              className="bg-transparent text-sm font-bold outline-none w-20"
              style={{ color: track.color }}
            />
          </div>
          <div className="flex gap-0.5">
            <button onClick={() => onToggleMute(trackIndex)} className={`p-1 rounded ${track.muted ? 'text-[#FF4444]' : 'text-[#8E9299] hover:text-white'}`} title="Mute">
              {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={() => onToggleSolo(trackIndex)} className={`p-1 rounded text-xs font-bold ${track.solo ? 'text-[#FFFF00]' : 'text-[#8E9299] hover:text-white'}`} title="Solo">
              S
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-1">
          <select 
            value={track.instrument}
            onChange={(e) => onUpdateTrack(trackIndex, { instrument: e.target.value })}
            className="bg-[#242424] text-xs font-bold text-[#8E9299] p-1 rounded border border-[#333] outline-none flex-1 min-w-0"
          >
            <optgroup label="8-Bit & Chiptune">
              <option value="8bit">8-Bit Square</option>
              <option value="chiptune">Chiptune Triangle</option>
            </optgroup>
            <optgroup label="Trap & Phonk">
              <option value="808">808 Soft</option>
              <option value="808_hard">808 Hard</option>
              <option value="phonk_808">Phonk 808</option>
              <option value="phonk_cowbell">Phonk Cowbell</option>
              <option value="memphis_cowbell">Memphis Cowbell</option>
              <option value="trap_snare">Trap Snare</option>
              <option value="phonk_snare">Phonk Snare</option>
              <option value="trap_clap">Trap Clap</option>
              <option value="reese_bass">Reese Bass</option>
              <option value="trap_brass">Trap Brass</option>
              <option value="trap_sub">Trap Sub</option>
              <option value="phonk_bass">Phonk Bass</option>
              <option value="phonk_pad">Phonk Pad</option>
              <option value="trap_pluck">Trap Pluck</option>
            </optgroup>
            <optgroup label="EDM & Synthwave">
              <option value="hardstyle_kick">Hardstyle Kick</option>
              <option value="supersaw">Supersaw</option>
              <option value="trance_pluck">Trance Pluck</option>
              <option value="acid_bass">Acid Bass</option>
            </optgroup>
            <optgroup label="Standard Drums">
              <option value="kick">Kick (Basic)</option>
              <option value="kick_punchy">Kick (Punchy)</option>
              <option value="kick_deep">Kick (Deep)</option>
              <option value="snare">Snare (Basic)</option>
              <option value="snare_tight">Snare (Tight)</option>
              <option value="clap">Clap</option>
              <option value="tom">Tom</option>
              <option value="ride">Ride Cymbal</option>
              <option value="crash">Crash Cymbal</option>
            </optgroup>
            <optgroup label="Percussion">
              <option value="bongo">Bongo</option>
              <option value="woodblock">Woodblock</option>
              <option value="triangle_perc">Triangle</option>
              <option value="shaker">Shaker</option>
            </optgroup>
            <optgroup label="Bass & Synths">
              <option value="sub_bass">Sub Bass</option>
              <option value="synth_bass">Synth Bass</option>
              <option value="fm_bass">FM Bass</option>
              <option value="pluck">Pluck Synth</option>
              <option value="pad">Warm Pad</option>
              <option value="keys">Electric Keys</option>
              <option value="lead">Lead Synth</option>
            </optgroup>
            <optgroup label="Keys & Chords">
              <option value="piano">Piano</option>
              <option value="e_piano">Electric Piano</option>
              <option value="lofi_keys">Lo-Fi Keys</option>
              <option value="organ">Organ</option>
              <option value="synth_pad">Synth Pad</option>
              <option value="choir_pad">Choir Pad</option>
            </optgroup>
            <optgroup label="Leads & Plucks">
              <option value="synth_lead">Synth Lead</option>
              <option value="glide_lead">Glide Lead</option>
              <option value="theremin">Theremin</option>
              <option value="am_synth">AM Synth</option>
            </optgroup>
            <optgroup label="Strings & Winds">
              <option value="guitar">Guitar</option>
              <option value="overdrive_guitar">Overdrive Guitar</option>
              <option value="strings">Strings</option>
              <option value="pizzicato">Pizzicato</option>
              <option value="brass">Brass</option>
              <option value="flute">Flute</option>
            </optgroup>
            <optgroup label="Pop & Rock">
              <option value="electric_bass">Electric Bass</option>
              <option value="acoustic_guitar">Acoustic Guitar</option>
            </optgroup>
            <optgroup label="Cinematic & Orchestral">
              <option value="cinematic_brass">Cinematic Brass</option>
              <option value="cinematic_strings">Cinematic Strings</option>
              <option value="taiko_drum">Taiko Drum</option>
              <option value="epic_choir">Epic Choir</option>
              <option value="orchestral_hit">Orchestral Hit</option>
            </optgroup>
            <optgroup label="Custom">
              <option value="sampler">Custom Sample...</option>
            </optgroup>
          </select>
          <div className="flex gap-0.5 shrink-0 bg-[#242424] rounded border border-[#333] p-0.5">
            <button onClick={() => onMoveTrackUp(trackIndex)} disabled={trackIndex === 0} className="p-1 text-[#8E9299] hover:text-white disabled:opacity-30" title="Move Track Up">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onMoveTrackDown(trackIndex)} disabled={trackIndex === totalTracks - 1} className="p-1 text-[#8E9299] hover:text-white disabled:opacity-30" title="Move Track Down">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onShiftTrackLeft(trackIndex)} className="p-1 text-[#8E9299] hover:text-white" title="Shift Pattern Left">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onShiftTrackRight(trackIndex)} className="p-1 text-[#8E9299] hover:text-white" title="Shift Pattern Right">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDuplicateTrack(trackIndex)} className="p-1 text-[#8E9299] hover:text-white" title="Duplicate Track">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onRandomizeTrack(trackIndex)} className="p-1 text-[#8E9299] hover:text-white" title="Randomize Steps">
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onHumanizeTrack(trackIndex)} className="p-1 text-[#8E9299] hover:text-white" title="Humanize Timing/Velocity">
              <Wand2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onClearTrack(trackIndex)} className="p-1 text-[#8E9299] hover:text-[#FF4444]" title="Clear Track">
              <Eraser className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDeleteTrack(trackIndex)} className="p-1 text-[#8E9299] hover:text-[#FF4444]" title="Delete Track">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {track.type === 'melodic' && track.instrument !== 'sampler' && (
          <div className="mt-1 flex items-center justify-between gap-2 border-t border-[#2a2b30] pt-1">
            <span className="text-[0.5625rem] font-bold text-[#8E9299]">PITCH</span>
            <div className="flex gap-1" title="Default note when you click a step">
              <select
                value={(track.defaultNote || 'C4').replace(/\d/, '')}
                onChange={(e) => {
                  const newNote = e.target.value + (track.defaultNote || 'C4').replace(/\D/g, '');
                  onUpdateTrack(trackIndex, { defaultNote: newNote });
                }}
                className="bg-[#1a1a1a] text-[#8E9299] hover:text-white text-[0.625rem] p-0.5 rounded border border-[#333] focus:outline-none focus:border-[#00AAFF]"
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select
                value={(track.defaultNote || 'C4').replace(/\D/g, '')}
                onChange={(e) => {
                  const newNote = (track.defaultNote || 'C4').replace(/\d/, '') + e.target.value;
                  onUpdateTrack(trackIndex, { defaultNote: newNote });
                }}
                className="bg-[#1a1a1a] text-[#8E9299] hover:text-white text-[0.625rem] p-0.5 rounded border border-[#333] focus:outline-none focus:border-[#00AAFF]"
              >
                {[1, 2, 3, 4, 5, 6].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        )}

        {track.instrument === 'sampler' && (
          <div className="mt-1 flex flex-col gap-1 border-t border-[#2a2b30] pt-1">
            <label className="flex items-center justify-center gap-1 bg-[#1a1a1a] hover:bg-[#333] border border-[#333] rounded p-1 cursor-pointer text-[0.625rem] text-[#8E9299] hover:text-white transition-colors">
              <Upload className="w-3 h-3" />
              <span>{track.sampleUrl ? 'CHANGE SAMPLE' : 'UPLOAD SAMPLE'}</span>
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => onSampleUpload(trackIndex, e)} />
            </label>
            {track.sampleUrl && (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-[0.5625rem] font-bold text-[#8E9299] w-8" title="Base pitch of the sample">ROOT</span>
                  <select
                    value={track.sampleRootNote || 'C4'}
                    onChange={(e) => onUpdateTrack(trackIndex, { sampleRootNote: e.target.value })}
                    className="flex-1 bg-[#1a1a1a] text-white text-[0.625rem] p-0.5 rounded border border-[#333] focus:outline-none focus:border-[#FF4444]"
                  >
                    {['C2', 'C3', 'C4', 'C5', 'C6'].map(note => (
                      <option key={note} value={note}>{note}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-[0.5625rem] font-bold text-[#8E9299] w-8" title="Note placed in sequencer">NOTE</span>
                  <select
                    value={(track.defaultNote || 'C4').replace(/\d/, '')}
                    onChange={(e) => {
                      const newNote = e.target.value + (track.defaultNote || 'C4').replace(/\D/g, '');
                      onUpdateTrack(trackIndex, { defaultNote: newNote });
                    }}
                    className="flex-1 bg-[#1a1a1a] text-white text-[0.625rem] p-0.5 rounded border border-[#333] focus:outline-none focus:border-[#FF4444]"
                  >
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <select
                    value={(track.defaultNote || 'C4').replace(/\D/g, '')}
                    onChange={(e) => {
                      const newNote = (track.defaultNote || 'C4').replace(/\d/, '') + e.target.value;
                      onUpdateTrack(trackIndex, { defaultNote: newNote });
                    }}
                    className="bg-[#1a1a1a] text-white text-[0.625rem] p-0.5 rounded border border-[#333] focus:outline-none focus:border-[#FF4444]"
                  >
                    {[1, 2, 3, 4, 5, 6].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}
            {track.sampleUrl && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-[0.5625rem] font-bold text-[#8E9299] w-8">SPEED</span>
                  <input
                    type="range" min="0.1" max="4" step="0.1" value={track.samplePlaybackSpeed || 1}
                    onChange={e => onUpdateTrack(trackIndex, { samplePlaybackSpeed: parseFloat(e.target.value) }, true)}
                    onPointerDown={() => onCommitHistory()}
                    className="custom-slider w-full" style={{ '--thumb-color': '#FF4444' } as any}
                  />
                </div>
                <button
                  onClick={() => onUpdateTrack(trackIndex, { sampleReverse: !track.sampleReverse }, true)}
                  className={`text-[0.5625rem] font-bold px-1.5 py-0.5 rounded ${track.sampleReverse ? 'bg-[#FF4444] text-white' : 'bg-[#2A2B30] text-[#8E9299]'}`}
                >
                  REV
                </button>
              </div>
            )}
            {track.sampleUrl && (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 flex items-center gap-1">
                    <span className="text-[0.5625rem] font-bold text-[#8E9299] w-8">START</span>
                    <input
                      type="range" min="0" max="60" step="0.1" value={track.sampleStart || 0}
                      onChange={e => onUpdateTrack(trackIndex, { sampleStart: parseFloat(e.target.value) }, true)}
                      className="custom-slider w-full" style={{ '--thumb-color': '#FF4444' } as any}
                    />
                    <span className="text-[0.5625rem] font-mono text-[#8E9299] w-6 text-right">{track.sampleStart || 0}s</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <span className="text-[0.5625rem] font-bold text-[#8E9299] w-8">END</span>
                    <input
                      type="range" min="0" max="60" step="0.1" value={track.sampleEnd || 0}
                      onChange={e => onUpdateTrack(trackIndex, { sampleEnd: parseFloat(e.target.value) }, true)}
                      className="custom-slider w-full" style={{ '--thumb-color': '#FF4444' } as any}
                    />
                    <span className="text-[0.5625rem] font-mono text-[#8E9299] w-8 text-right">{track.sampleEnd === 0 ? 'MAX' : `${track.sampleEnd}s`}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 flex items-center gap-1">
                    <span className="text-[0.5625rem] font-bold text-[#8E9299] w-8">DUR</span>
                    <input
                      type="range" min="0.1" max="10" step="0.1" value={track.sampleDuration || 1}
                      onChange={e => onUpdateTrack(trackIndex, { sampleDuration: parseFloat(e.target.value) }, true)}
                      onPointerDown={() => onCommitHistory()}
                      className="custom-slider w-full" style={{ '--thumb-color': '#FF4444' } as any}
                    />
                    <span className="text-[0.5625rem] font-mono text-[#8E9299] w-6 text-right">{track.sampleDuration || 1}s</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={track.sampleFade ?? true}
                      onChange={e => onUpdateTrack(trackIndex, { sampleFade: e.target.checked })}
                      className="w-3 h-3 accent-[#FF4444]"
                    />
                    <span className="text-[0.5625rem] font-bold text-[#8E9299]">FADE</span>
                  </label>
                </div>
              </>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[0.625rem] font-bold text-[#8E9299] w-8">VOL</span>
            <input 
              type="range" min="-60" max="6" value={track.volume} 
              onChange={e => onUpdateTrack(trackIndex, { volume: parseFloat(e.target.value) }, true)} 
              onPointerDown={() => onCommitHistory()}
              className="custom-slider w-full" style={{ '--thumb-color': '#FF4444' } as any}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.625rem] font-bold text-[#8E9299] w-8">PAN</span>
            <input 
              type="range" min="-1" max="1" step="0.1" value={track.pan} 
              onChange={e => onUpdateTrack(trackIndex, { pan: parseFloat(e.target.value) }, true)} 
              onPointerDown={() => onCommitHistory()}
              className="custom-slider w-full" style={{ '--thumb-color': '#00AAFF' } as any}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.625rem] font-bold text-[#8E9299] w-8">ECHO</span>
            <input 
              type="range" min="0" max="1" step="0.05" value={track.delayWet} 
              onChange={e => onUpdateTrack(trackIndex, { delayWet: parseFloat(e.target.value) }, true)} 
              onPointerDown={() => onCommitHistory()}
              className="custom-slider w-full" style={{ '--thumb-color': '#00AAFF' } as any}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.625rem] font-bold text-[#8E9299] w-8">VERB</span>
            <input 
              type="range" min="0" max="1" step="0.05" value={track.reverbWet} 
              onChange={e => onUpdateTrack(trackIndex, { reverbWet: parseFloat(e.target.value) }, true)} 
              onPointerDown={() => onCommitHistory()}
              className="custom-slider w-full" style={{ '--thumb-color': '#AA00FF' } as any}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.625rem] font-bold text-[#8E9299] w-8">DIST</span>
            <input 
              type="range" min="0" max="1" step="0.05" value={track.distWet} 
              onChange={e => onUpdateTrack(trackIndex, { distWet: parseFloat(e.target.value) }, true)} 
              onPointerDown={() => onCommitHistory()}
              className="custom-slider w-full" style={{ '--thumb-color': '#FF4444' } as any}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.625rem] font-bold text-[#8E9299] w-8">CHOR</span>
            <input 
              type="range" min="0" max="1" step="0.05" value={track.chorusWet} 
              onChange={e => onUpdateTrack(trackIndex, { chorusWet: parseFloat(e.target.value) }, true)} 
              onPointerDown={() => onCommitHistory()}
              className="custom-slider w-full" style={{ '--thumb-color': '#00AAFF' } as any}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.625rem] font-bold text-[#8E9299] w-8">CRSH</span>
            <input 
              type="range" min="0" max="1" step="0.05" value={track.bitcrusherWet} 
              onChange={e => onUpdateTrack(trackIndex, { bitcrusherWet: parseFloat(e.target.value) }, true)} 
              onPointerDown={() => onCommitHistory()}
              className="custom-slider w-full" style={{ '--thumb-color': '#AA00FF' } as any}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.625rem] font-bold text-[#8E9299] w-8">SWING</span>
            <input 
              type="range" min="0" max="1" step="0.05" value={track.swing} 
              onChange={e => onUpdateTrack(trackIndex, { swing: parseFloat(e.target.value) }, true)} 
              onPointerDown={() => onCommitHistory()}
              className="custom-slider w-full" style={{ '--thumb-color': '#FFAA00' } as any}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.625rem] font-bold text-[#8E9299] w-8">STEPS</span>
            <input 
              type="number" min="1" max={bars * 16} value={track.stepsCount || bars * 16} 
              onChange={e => onUpdateTrack(trackIndex, { stepsCount: parseInt(e.target.value) || bars * 16 })} 
              className="bg-[#1a1a1a] text-[#8E9299] text-xs w-full rounded border border-[#333] px-1 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center p-3 sm:p-4 bg-[#1a1b20]">
        {Array.from({ length: bars * 16 }).map((_, stepIndex) => {
          const actualStepIndex = stepIndex % (track.stepsCount || bars * 16);
          const step = track.steps?.[actualStepIndex] || { active: false, note: track.defaultNote || 'C4', velocity: 0.8, duration: '16n', offset: 0 };
          const isGhost = track.stepsCount ? stepIndex >= track.stepsCount : false;
          return (
            <React.Fragment key={stepIndex}>
              {stepIndex > 0 && stepIndex % 16 === 0 && <div className="h-full w-px bg-[#444] mx-2 sm:mx-3 flex-shrink-0"></div>}
              <div className={`flex-shrink-0 relative step-container step-container-${stepIndex} ${stepIndex % 4 === 0 && stepIndex % 16 !== 0 ? "ml-2 sm:ml-3" : "ml-1 sm:ml-1.5"} ${isGhost ? 'opacity-40' : ''}`}>
                <StepButton
                  trackId={track.id}
                  stepIndex={actualStepIndex}
                  step={step}
                  color={track.color}
                  isActive={step.active}
                  onToggle={onToggleStep}
                  onOpenSettings={onOpenSettings}
                />
                <div className="playhead-indicator absolute -top-3 -bottom-[13px] sm:-top-4 sm:-bottom-[17px] left-1/2 -translate-x-1/2 w-0.5 bg-[#FF4444] opacity-80 z-10 pointer-events-none shadow-[0_0_8px_#FF4444]" />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});
