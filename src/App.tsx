import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Mp3Encoder } from '@breezystack/lamejs';
import { Play, Square, Circle, Download, Volume2, VolumeX, Settings2, Bell, BellOff, Plus, Minus, Trash2, PlusCircle, SlidersHorizontal, Save, FolderOpen, Undo2, Redo2, Upload, BookOpen, X, Copy, ArrowLeft, ArrowRight, Eraser, CopyPlus, ChevronUp, ChevronDown, Loader2, Repeat, Timer, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { engine } from './audio';
import { TrackData, StepData, TrackTemplate } from './types';
import { audioBufferToWav } from './utils';
import { StepSettings } from './components/StepSettings';
import { TrackRow } from './components/TrackRow';
import { PromptModal } from './components/PromptModal';
import { SampleTrimmerModal } from './components/SampleTrimmerModal';
import SFXStudio from './components/SFXStudio';
import { HelpModal } from './components/HelpModal';

const createEmptySteps = (length: number, defaultNote: string) => 
  Array.from({ length }, () => ({ active: false, note: defaultNote, velocity: 0.8, duration: '16n', offset: 0, stepSpan: 1 }));

const INITIAL_TRACKS: TrackData[] = [
  { id: '1', name: 'KICK', type: 'drum', instrument: 'kick', color: '#FF4444', volume: 0, pan: 0, muted: false, solo: false, defaultNote: 'C1', delayWet: 0, reverbWet: 0, distWet: 0, chorusWet: 0, bitcrusherWet: 0, swing: 0, steps: createEmptySteps(16, 'C1') },
  { id: '2', name: 'SNARE', type: 'drum', instrument: 'snare', color: '#FFAA00', volume: 0, pan: 0, muted: false, solo: false, defaultNote: 'C4', delayWet: 0, reverbWet: 0, distWet: 0, chorusWet: 0, bitcrusherWet: 0, swing: 0, steps: createEmptySteps(16, 'C4') },
  { id: '3', name: 'CLAP', type: 'drum', instrument: 'clap', color: '#FFFF00', volume: -5, pan: 0, muted: false, solo: false, defaultNote: 'C4', delayWet: 0, reverbWet: 0, distWet: 0, chorusWet: 0, bitcrusherWet: 0, swing: 0, steps: createEmptySteps(16, 'C4') },
  { id: '4', name: 'BASS', type: 'melodic', instrument: 'bass', color: '#00AAFF', volume: 0, pan: 0, muted: false, solo: false, defaultNote: 'C2', delayWet: 0, reverbWet: 0, distWet: 0, chorusWet: 0, bitcrusherWet: 0, swing: 0, steps: createEmptySteps(16, 'C2') },
  { id: '5', name: 'SYNTH', type: 'melodic', instrument: 'synth_lead', color: '#AA00FF', volume: -5, pan: 0, muted: false, solo: false, defaultNote: 'C4', delayWet: 0, reverbWet: 0, distWet: 0, chorusWet: 0, bitcrusherWet: 0, swing: 0, steps: createEmptySteps(16, 'C4') },
];

export default function App() {
  const [started, setStarted] = useState(false);
  const [appMode, setAppMode] = useState<'midi' | 'sfx'>('midi');
  const [playing, setPlaying] = useState(false);
  const [loopPlayback, setLoopPlayback] = useState(true);
  const [autoStopRecord, setAutoStopRecord] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [tracks, setTracks] = useState<TrackData[]>(INITIAL_TRACKS);
  const [templates, setTemplates] = useState<TrackTemplate[]>(() => {
    const saved = localStorage.getItem('track_templates');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem('track_templates', JSON.stringify(templates));
  }, [templates]);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'mp3' | 'wav'>('mp3');
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(0);
  
  const [bars, setBars] = useState(1);
  const [metronome, setMetronome] = useState(false);
  const [delayWet, setDelayWet] = useState(0);
  const [delayTime, setDelayTime] = useState('8n');
  const [reverbWet, setReverbWet] = useState(0);
  const [distWet, setDistWet] = useState(0);
  const [masterChorusWet, setMasterChorusWet] = useState(0);
  const [masterBitcrusherWet, setMasterBitcrusherWet] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0);
  const [masterCompThreshold, setMasterCompThreshold] = useState(-24);
  const [masterCompRatio, setMasterCompRatio] = useState(4);
  const [masterEqLow, setMasterEqLow] = useState(0);
  const [masterEqMid, setMasterEqMid] = useState(0);
  const [masterEqHigh, setMasterEqHigh] = useState(0);
  const [masterFilterFreq, setMasterFilterFreq] = useState(20000);
  const [masterHPFFreq, setMasterHPFFreq] = useState(20);
  const [swing, setSwing] = useState(0);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [performanceMode, setPerformanceMode] = useState(false);
  const [headphoneMode, setHeadphoneMode] = useState(false);
  const [defaultVelocity, setDefaultVelocity] = useState(0.8);
  const [trackFollow, setTrackFollow] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 3>(1);

  // defaultVelocity reference so we can use it in toggleStep without stale closure
  const defaultVelocityRef = useRef(defaultVelocity);
  useEffect(() => { defaultVelocityRef.current = defaultVelocity; }, [defaultVelocity]);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.remove('zoom-1', 'zoom-2', 'zoom-3');
    document.documentElement.classList.add(`zoom-${zoomLevel}`);
  }, [theme, zoomLevel]);

  useEffect(() => {
    engine.setHeadphoneMode(headphoneMode);
  }, [headphoneMode]);

  const [past, setPast] = useState<TrackData[][]>([]);
  const [future, setFuture] = useState<TrackData[][]>([]);
  const [showProGuide, setShowProGuide] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [trimmerModal, setTrimmerModal] = useState<{
    isOpen: boolean;
    file: File;
    trackIndex: number | null;
  } | null>(null);
  const globalUploadRef = useRef<HTMLInputElement>(null);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    inputType?: 'text' | 'number' | 'select' | 'none';
    options?: { label: string; value: string }[];
    onConfirm: (value: string) => void;
    onCancel: () => void;
  } | null>(null);

  const handleTapTempo = () => {
    const now = performance.now();
    const times = [...tapTimes, now].slice(-4);
    setTapTimes(times);
    
    if (times.length >= 2) {
      const intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      if (newBpm >= 40 && newBpm <= 300) {
        setBpm(newBpm);
      }
    }
  };

  const commitHistory = React.useCallback(() => {
    setPast(prev => [...prev, tracksRef.current].slice(-50));
    setFuture([]);
  }, []);

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(prev => prev.slice(0, -1));
    setFuture(prev => [tracks, ...prev]);
    setTracks(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(prev => prev.slice(1));
    setPast(prev => [...prev, tracks]);
    setTracks(next);
  };

  const [settingsOpen, setSettingsOpen] = useState<{
    trackIndex: number;
    stepIndex: number;
    rect: DOMRect;
  } | null>(null);

  const stepRef = useRef(0);
  const tracksRef = useRef(tracks);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  const metronomeRef = useRef(metronome);
  useEffect(() => { metronomeRef.current = metronome; }, [metronome]);

  const loopPlaybackRef = useRef(loopPlayback);
  useEffect(() => { loopPlaybackRef.current = loopPlayback; }, [loopPlayback]);

  const autoStopRecordRef = useRef(autoStopRecord);
  useEffect(() => { autoStopRecordRef.current = autoStopRecord; }, [autoStopRecord]);

  const recordingRef = useRef(recording);
  useEffect(() => { recordingRef.current = recording; }, [recording]);

  const performanceModeRef = useRef(performanceMode);
  useEffect(() => { performanceModeRef.current = performanceMode; }, [performanceMode]);

  useEffect(() => {
    engine.setMasterFX(delayWet, delayTime, reverbWet, distWet, masterChorusWet, masterBitcrusherWet, masterVolume, masterEqLow, masterEqMid, masterEqHigh, masterFilterFreq, masterHPFFreq);
    engine.setMasterCompressor(masterCompThreshold, masterCompRatio);
  }, [delayWet, delayTime, reverbWet, distWet, masterChorusWet, masterBitcrusherWet, masterVolume, masterEqLow, masterEqMid, masterEqHigh, masterFilterFreq, masterHPFFreq, masterCompThreshold, masterCompRatio]);

  useEffect(() => {
    engine.setSwing(swing);
  }, [swing]);

  useEffect(() => {
    if (!started) return;
    const hasSolo = tracks.some(t => t.solo);
    tracks.forEach(track => {
      const isMuted = hasSolo ? !track.solo : track.muted;
      engine.syncTrack(track.id, track.instrument, track.volume, track.pan, isMuted, track.delayWet, track.reverbWet, track.distWet, track.chorusWet, track.bitcrusherWet, track.sampleUrl, track.sampleRootNote, track.samplePlaybackSpeed, track.sampleReverse, track.sampleDuration, track.sampleFade ?? true, track.sampleStart ?? 0, track.sampleEnd ?? 0);
    });
  }, [tracks, started]);

  useEffect(() => {
    setTracks(prev => prev.map(track => {
      const newSteps = [...track.steps];
      const targetLength = bars * 16;
      while (newSteps.length < targetLength) {
        newSteps.push({ active: false, note: track.defaultNote, velocity: 0.8, duration: '16n', offset: 0 });
      }
      if (newSteps.length > targetLength) {
        newSteps.length = targetLength;
      }
      let newStepsCount = track.stepsCount;
      if (newStepsCount && newStepsCount > targetLength) {
        newStepsCount = targetLength;
      }
      return { ...track, steps: newSteps, stepsCount: newStepsCount };
    }));
  }, [bars]);

  const trackFollowRef = useRef(trackFollow);
  useEffect(() => { trackFollowRef.current = trackFollow; }, [trackFollow]);

  useEffect(() => {
    if (!started) return;

    const currentTotalSteps = bars * 16;
    const indices = Array.from({ length: currentTotalSteps }, (_, i) => i);

    const sequence = new Tone.Sequence((time, currentStepIndex) => {
      if (metronomeRef.current && currentStepIndex % 4 === 0) {
        engine.playMetronome(currentStepIndex % 16 === 0, time);
      }

      const hasSolo = tracksRef.current.some(t => t.solo);
      const stepDuration = Tone.Time('16n').toSeconds();

      tracksRef.current.forEach(track => {
        if (track.muted) return;
        if (hasSolo && !track.solo) return;

        const actualStepIndex = currentStepIndex % (track.stepsCount || currentTotalSteps);
        const stepData = track.steps[actualStepIndex];
        if (stepData?.active) {
          let swingOffset = 0;
          if (actualStepIndex % 2 === 1) {
            swingOffset = (track.swing || 0) * 0.5;
          }
          const totalOffsetFraction = Math.max(-0.48, Math.min(0.48, (stepData.offset || 0) + swingOffset));
          const totalOffset = totalOffsetFraction * stepDuration;
          const span = stepData.stepSpan || 1;
          const duration = span > 1 ? span * stepDuration : stepData.duration;
          engine.playNote(track.id, stepData.note, stepData.velocity, time, duration, totalOffset);
        }
      });
      
      if (!performanceModeRef.current) {
        Tone.Draw.schedule(() => {
          const currentEls = document.getElementsByClassName('is-current');
          while(currentEls.length > 0) {
            currentEls[0].classList.remove('is-current');
          }
          const nextEls = document.getElementsByClassName(`step-container-${currentStepIndex}`);
          for (let i = 0; i < nextEls.length; i++) {
            nextEls[i].classList.add('is-current');
            // Auto scroll container wrapper if trackFollow is enabled
            if (i === 0 && trackFollowRef.current) {
              const el = nextEls[i] as HTMLElement;
              const container = el.closest('.custom-scrollbar');
              if (container) {
                // Scroll container to center the element smoothly
                const containerRect = container.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const scrollLeft = el.offsetLeft - containerRect.width / 2 + elRect.width / 2;
                container.scrollTo({ left: scrollLeft, behavior: 'auto' });
              }
            }
          }
        }, time);
      }
      
      if (currentStepIndex === currentTotalSteps - 1) {
        if (!loopPlaybackRef.current) {
          Tone.Draw.schedule(() => {
            Tone.Transport.stop();
            Tone.Draw.cancel();
            setPlaying(false);
            const currentEls = document.getElementsByClassName('is-current');
            while(currentEls.length > 0) {
              currentEls[0].classList.remove('is-current');
            }
            stepRef.current = 0;
          }, time + Tone.Time('16n').toSeconds());
        }
        
        if (recordingRef.current && autoStopRecordRef.current) {
          Tone.Draw.schedule(async () => {
            const blob = await engine.stopRecording();
            setRecordedBlob(blob);
            setRecording(false);
          }, time + Tone.Time('16n').toSeconds());
        }
      }
      
      stepRef.current = currentStepIndex + 1;
    }, indices, '16n');

    sequence.start(0);

    return () => {
      sequence.dispose();
    };
  }, [started, bars]);

  useEffect(() => {
    if (tapTimes.length > 0) {
      const timeout = setTimeout(() => setTapTimes([]), 2000);
      return () => clearTimeout(timeout);
    }
  }, [tapTimes]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const handleStart = async (mode: 'midi' | 'sfx') => {
    await engine.init();
    setAppMode(mode);
    setStarted(true);
  };

  const togglePlay = () => {
    if (playing) {
      Tone.Transport.pause();
    } else {
      Tone.Transport.start();
    }
    setPlaying(!playing);
  };

  const stopPlayback = () => {
    Tone.Transport.stop();
    Tone.Draw.cancel();
    setPlaying(false);
    const currentEls = document.getElementsByClassName('is-current');
    while(currentEls.length > 0) {
      currentEls[0].classList.remove('is-current');
    }
    const nextEls = document.getElementsByClassName('step-container-0');
    for (let i = 0; i < nextEls.length; i++) {
      nextEls[i].classList.add('is-current');
    }
    stepRef.current = 0;
  };

  const toggleRecording = async () => {
    if (recording) {
      const blob = await engine.stopRecording();
      setRecordedBlob(blob);
      setRecording(false);
    } else {
      setRecordedBlob(null);
      engine.startRecording();
      setRecording(true);
      if (!playing) togglePlay();
    }
  };

  const downloadRecording = async () => {
    if (!recordedBlob) return;
    
    setPromptModal({
      isOpen: true,
      title: 'Export Audio',
      message: 'Enter a name for your audio file:',
      defaultValue: `recording-${new Date().toISOString().slice(0, 10)}`,
      inputType: 'text',
      onConfirm: async (name) => {
        setPromptModal(null);
        setIsDownloading(true);
        try {
          const arrayBuffer = await recordedBlob.arrayBuffer();
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          if (exportFormat === 'mp3') {
            const channels = audioBuffer.numberOfChannels;
            const sampleRate = audioBuffer.sampleRate;
            const mp3encoder = new Mp3Encoder(channels, sampleRate, 128);
            const mp3Data = [];
            
            const left = audioBuffer.getChannelData(0);
            const right = channels > 1 ? audioBuffer.getChannelData(1) : left;
            
            const sampleBlockSize = 1152;
            
            for (let i = 0; i < left.length; i += sampleBlockSize) {
              const leftChunk = new Int16Array(Math.min(sampleBlockSize, left.length - i));
              const rightChunk = new Int16Array(Math.min(sampleBlockSize, right.length - i));
              
              for (let j = 0; j < leftChunk.length; j++) {
                let l = left[i + j];
                let r = right[i + j];
                
                // Clamp values to [-1, 1] to prevent integer overflow/wrap-around
                if (l > 1) l = 1;
                if (l < -1) l = -1;
                if (r > 1) r = 1;
                if (r < -1) r = -1;
                
                l = l < 0 ? l * 32768 : l * 32767;
                r = r < 0 ? r * 32768 : r * 32767;
                leftChunk[j] = l;
                rightChunk[j] = r;
              }
              
              const mp3buf = channels === 1 ? mp3encoder.encodeBuffer(leftChunk) : mp3encoder.encodeBuffer(leftChunk, rightChunk);
              if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
              }
            }
            
            const mp3buf = mp3encoder.flush();
            if (mp3buf.length > 0) {
              mp3Data.push(mp3buf);
            }
            
            const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
            
            const url = URL.createObjectURL(mp3Blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name || 'recording'}.mp3`;
            a.click();
            URL.revokeObjectURL(url);
          } else {
            const wavBlob = audioBufferToWav(audioBuffer);
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name || 'recording'}.wav`;
            a.click();
            URL.revokeObjectURL(url);
          }
        } catch (err) {
          console.error("Failed to convert audio:", err);
          alert("Failed to convert audio to " + exportFormat.toUpperCase() + ". Please try again.");
        } finally {
          setIsDownloading(false);
        }
      },
      onCancel: () => setPromptModal(null)
    });
  };

  const toggleStep = React.useCallback((trackId: string, stepIndex: number) => {
    commitHistory();
    setTracks(prevTracks => {
      const newTracks = prevTracks.map((track) => {
        if (track.id === trackId) {
          const newSteps = [...track.steps];
          const defaultStep = { active: false, note: track.defaultNote || 'C4', velocity: defaultVelocityRef.current, duration: '16n', offset: 0, stepSpan: 1 };
          const step = { ...(newSteps[stepIndex] || defaultStep) };
          step.active = !step.active;
          newSteps[stepIndex] = step;
          
          if (step.active) {
            const span = step.stepSpan || 1;
            const duration = span > 1 ? span * Tone.Time('16n').toSeconds() : step.duration;
            engine.playNote(track.id, step.note, step.velocity, Tone.now() + 0.02, duration, 0);
          }
          return { ...track, steps: newSteps };
        }
        return track;
      });
      return newTracks;
    });
  }, [commitHistory]);

  const handleOpenSettings = React.useCallback((trackId: string, stepIndex: number, rect: DOMRect) => {
    // Find trackIndex from trackId
    const trackIndex = tracksRef.current.findIndex(t => t.id === trackId);
    if (trackIndex !== -1) {
      setSettingsOpen({ trackIndex, stepIndex, rect });
    }
  }, []);

  const updateStep = (trackIndex: number, stepIndex: number, data: Partial<StepData>) => {
    commitHistory();
    setTracks(prev => {
      const newTracks = [...prev];
      if (!newTracks[trackIndex].steps[stepIndex]) return prev;
      
      const newTrack = { ...newTracks[trackIndex] };
      const newSteps = [...newTrack.steps];
      newSteps[stepIndex] = { ...newSteps[stepIndex], ...data };
      newTrack.steps = newSteps;
      
      newTracks[trackIndex] = newTrack;
      return newTracks;
    });
  };

  const updateTrack = React.useCallback((trackIndex: number, data: Partial<TrackData>, skipHistory = false) => {
    if (!skipHistory) {
      commitHistory();
    }
    setTracks(prev => {
      const newTracks = [...prev];
      if (data.instrument && !data.name) {
        data.name = data.instrument.toUpperCase().replace('_', ' ');
      }
      if (data.instrument) {
        if (['808', '808_hard', 'phonk_808', 'kick', 'hardstyle_kick'].includes(data.instrument)) {
          data.defaultNote = 'C1';
          data.type = 'drum';
        } else if (['bass', 'synth_bass', 'reese_bass', 'trap_sub'].includes(data.instrument)) {
          data.defaultNote = 'C2';
          data.type = 'melodic';
        } else if (['snare', 'clap', 'tom', 'crash', 'ride', 'trap_snare', 'phonk_snare', 'trap_clap', 'bongo', 'woodblock', 'triangle_perc', 'shaker'].includes(data.instrument)) {
          data.defaultNote = 'C4';
          data.type = 'drum';
        } else {
          data.defaultNote = 'C4';
          data.type = 'melodic';
        }
        
        // If changing to a drum, or if it was a drum and we changed instrument, reset all step notes to the new default note
        if (data.type === 'drum' || prev[trackIndex].type === 'drum') {
          data.steps = prev[trackIndex].steps.map(step => ({ ...step, note: data.defaultNote || 'C4' }));
        }
      }
      
      if (data.stepsCount !== undefined) {
        const currentSteps = data.steps || prev[trackIndex].steps;
        if (data.stepsCount > currentSteps.length) {
          const newSteps = [...currentSteps];
          for (let i = currentSteps.length; i < data.stepsCount; i++) {
            newSteps[i] = { active: false, note: data.defaultNote || prev[trackIndex].defaultNote || 'C4', velocity: 0.8, duration: '16n', offset: 0, stepSpan: 1 };
          }
          data.steps = newSteps;
        }
      }
      
      newTracks[trackIndex] = { ...newTracks[trackIndex], ...data };
      return newTracks;
    });
  }, [commitHistory]);

  const shiftTrackLeft = React.useCallback((trackIndex: number) => {
    commitHistory();
    setTracks(prev => {
      const newTracks = [...prev];
      const steps = [...newTracks[trackIndex].steps];
      const first = steps.shift();
      if (first) steps.push(first);
      newTracks[trackIndex].steps = steps;
      return newTracks;
    });
  }, [commitHistory]);

  const shiftTrackRight = React.useCallback((trackIndex: number) => {
    commitHistory();
    setTracks(prev => {
      const newTracks = [...prev];
      const steps = [...newTracks[trackIndex].steps];
      const last = steps.pop();
      if (last) steps.unshift(last);
      newTracks[trackIndex].steps = steps;
      return newTracks;
    });
  }, [commitHistory]);

  const duplicateTrack = React.useCallback((trackIndex: number) => {
    commitHistory();
    setTracks(prev => {
      const trackToCopy = prev[trackIndex];
      const newTrack: TrackData = {
        ...trackToCopy,
        id: Math.random().toString(36).substr(2, 9),
        name: trackToCopy.name + ' COPY',
        steps: trackToCopy.steps.map(s => ({ ...s }))
      };
      const newTracks = [...prev];
      newTracks.splice(trackIndex + 1, 0, newTrack);
      return newTracks;
    });
  }, [commitHistory]);

  const randomizeTrack = React.useCallback((trackIndex: number) => {
    commitHistory();
    setTracks(prev => prev.map((track, i) => {
      if (i === trackIndex) {
        return {
          ...track,
          steps: track.steps.map(step => ({
            ...step,
            active: Math.random() > 0.7,
            velocity: 0.5 + Math.random() * 0.5
          }))
        };
      }
      return track;
    }));
  }, [commitHistory]);

  const humanizeTrack = React.useCallback((trackIndex: number) => {
    commitHistory();
    setTracks(prev => prev.map((track, i) => {
      if (i === trackIndex) {
        return {
          ...track,
          steps: track.steps.map(step => ({
            ...step,
            offset: step.active ? (Math.random() * 0.1 - 0.05) : step.offset,
            velocity: step.active ? Math.max(0.1, Math.min(1, step.velocity + (Math.random() * 0.2 - 0.1))) : step.velocity
          }))
        };
      }
      return track;
    }));
  }, [commitHistory]);

  const clearTrack = React.useCallback((trackIndex: number) => {
    const options = [{ label: 'All Bars', value: 'all' }];
    for (let i = 1; i <= bars; i++) {
      options.push({ label: `Bar ${i}`, value: i.toString() });
    }

    setPromptModal({
      isOpen: true,
      title: 'Clear Track',
      message: 'Select which part of the track to clear:',
      defaultValue: 'all',
      inputType: 'select',
      options,
      onConfirm: (value) => {
        commitHistory();
        setTracks(prev => {
          const newTracks = [...prev];
          if (value === 'all') {
            newTracks[trackIndex].steps = newTracks[trackIndex].steps.map(s => ({ ...s, active: false }));
          } else {
            const barIndex = parseInt(value) - 1;
            const startStep = barIndex * 16;
            const endStep = startStep + 16;
            newTracks[trackIndex].steps = newTracks[trackIndex].steps.map((s, i) => {
              if (i >= startStep && i < endStep) {
                return { ...s, active: false };
              }
              return s;
            });
          }
          return newTracks;
        });
        setPromptModal(null);
      },
      onCancel: () => setPromptModal(null)
    });
  }, [commitHistory, bars]);

  const deleteTrack = React.useCallback((trackIndex: number) => {
    commitHistory();
    setTracks(prev => {
      const newTracks = [...prev];
      const trackId = newTracks[trackIndex].id;
      newTracks.splice(trackIndex, 1);
      engine.deleteTrack(trackId);
      return newTracks;
    });
  }, [commitHistory]);

  const moveTrackUp = React.useCallback((trackIndex: number) => {
    if (trackIndex === 0) return;
    commitHistory();
    setTracks(prev => {
      const newTracks = [...prev];
      const temp = newTracks[trackIndex - 1];
      newTracks[trackIndex - 1] = newTracks[trackIndex];
      newTracks[trackIndex] = temp;
      return newTracks;
    });
  }, [commitHistory]);

  const moveTrackDown = React.useCallback((trackIndex: number) => {
    commitHistory();
    setTracks(prev => {
      if (trackIndex === prev.length - 1) return prev;
      const newTracks = [...prev];
      const temp = newTracks[trackIndex + 1];
      newTracks[trackIndex + 1] = newTracks[trackIndex];
      newTracks[trackIndex] = temp;
      return newTracks;
    });
  }, [commitHistory]);

  const saveTemplate = React.useCallback((trackIndex: number) => {
    const track = tracks[trackIndex];
    setPromptModal({
      isOpen: true,
      title: 'Save Track Template',
      message: 'Enter a name for this track template:',
      defaultValue: track.name + ' Template',
      inputType: 'text',
      onConfirm: (name) => {
        const template: TrackTemplate = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          type: track.type,
          instrument: track.instrument,
          volume: track.volume,
          pan: track.pan,
          delayWet: track.delayWet,
          reverbWet: track.reverbWet,
          distWet: track.distWet,
          chorusWet: track.chorusWet,
          bitcrusherWet: track.bitcrusherWet,
          swing: track.swing,
          defaultNote: track.defaultNote,
          sampleUrl: track.sampleUrl,
          sampleRootNote: track.sampleRootNote,
          samplePlaybackSpeed: track.samplePlaybackSpeed,
        };
        setTemplates(prev => [...prev, template]);
      }
    });
  }, [tracks]);

  const loadTemplate = () => {
    if (templates.length === 0) {
      alert('No templates saved yet. Save a track as a template first!');
      return;
    }
    setPromptModal({
      isOpen: true,
      title: 'Load Track Template',
      message: 'Select a template to load as a new track:',
      defaultValue: templates[0].id,
      inputType: 'select',
      options: templates.map(t => ({ label: t.name, value: t.id })),
      onConfirm: (templateId) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;
        
        commitHistory();
        const newTrack: TrackData = {
          ...template,
          id: Math.random().toString(36).substr(2, 9),
          steps: createEmptySteps(bars * 16, template.defaultNote)
        };
        setTracks(prev => [...prev, newTrack]);
      }
    });
  };

  const addTrack = () => {
    setPromptModal({
      isOpen: true,
      title: 'Add Track',
      message: 'Select an instrument for the new track:',
      defaultValue: 'piano',
      inputType: 'select',
      options: [
        { label: 'Kick (Basic)', value: 'kick' },
        { label: 'Kick (Punchy)', value: 'kick_punchy' },
        { label: '808 Bass', value: '808' },
        { label: 'Snare', value: 'snare' },
        { label: 'Clap', value: 'clap' },
        { label: 'Piano', value: 'piano' },
        { label: 'Synth Bass', value: 'synth_bass' },
        { label: 'Pluck Synth', value: 'pluck' },
        { label: 'Pad', value: 'pad' },
        { label: '8-Bit (Square)', value: '8bit' },
        { label: 'Chiptune (Triangle)', value: 'chiptune' }
      ],
      onConfirm: (instrument) => {
        commitHistory();
        
        let defaultNote = 'C4';
        let type: 'drum' | 'melodic' = 'melodic';
        
        if (instrument === 'kick' || instrument === '808' || instrument === '808_hard' || instrument === 'phonk_808') {
          defaultNote = 'C1';
          type = 'drum';
        } else if (instrument === 'bass' || instrument === 'synth_bass' || instrument === 'reese_bass' || instrument === 'trap_sub') {
          defaultNote = 'C2';
          type = 'melodic';
        } else if (instrument === 'snare' || instrument === 'clap' || instrument === 'tom' || instrument === 'crash' || instrument === 'ride' || instrument === 'trap_snare' || instrument === 'phonk_snare' || instrument === 'trap_clap') {
          type = 'drum';
        }

        const newTrack: TrackData = {
          id: Math.random().toString(36).substr(2, 9),
          name: instrument.toUpperCase(),
          type: type,
          instrument: instrument,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
          volume: 0,
          pan: 0,
          muted: false,
          solo: false,
          delayWet: 0,
          reverbWet: 0,
          distWet: 0,
          chorusWet: 0,
          bitcrusherWet: 0,
          swing: 0,
          defaultNote: defaultNote,
          sampleDuration: 1,
          steps: createEmptySteps(bars * 16, defaultNote)
        };
        setTracks([...tracks, newTrack]);
        setPromptModal(null);
      },
      onCancel: () => setPromptModal(null)
    });
  };

  const handleBarsChange = (newBars: number) => {
    commitHistory();
    setBars(newBars);
    setTracks(prevTracks => prevTracks.map(track => {
      const newSteps = [...track.steps];
      const targetLength = newBars * 16;
      
      // Pad with default steps if expanding
      for (let i = track.steps.length; i < targetLength; i++) {
        newSteps[i] = { active: false, note: track.defaultNote || 'C4', velocity: 0.8, duration: '16n', offset: 0, stepSpan: 1 };
      }
      
      let newStepsCount = track.stepsCount;
      // If the track was previously spanning the full length, expand it to the new full length
      if (track.stepsCount === bars * 16) {
        newStepsCount = targetLength;
      }
      
      return { ...track, steps: newSteps, stepsCount: newStepsCount };
    }));
  };

  const duplicateBars = () => {
    commitHistory();
    const newBars = Math.min(128, bars * 2);
    if (newBars === bars) return;
    
    const newTracks = tracks.map(track => {
      const newSteps = [...track.steps];
      const currentLength = bars * 16;
      const targetLength = newBars * 16;
      const actualStepLength = track.steps.length;
      
      // Pad up to currentLength if needed
      for (let i = actualStepLength; i < currentLength; i++) {
        newSteps[i] = { active: false, note: track.defaultNote || 'C4', velocity: 0.8, duration: '16n', offset: 0, stepSpan: 1 };
      }
      
      for (let i = currentLength; i < targetLength; i++) {
        const sourceStep = newSteps[i % currentLength];
        newSteps[i] = { ...sourceStep };
      }
      
      let newStepsCount = track.stepsCount;
      if (track.stepsCount === currentLength) {
        newStepsCount = targetLength;
      }
      
      return { ...track, steps: newSteps, stepsCount: newStepsCount };
    });
    
    setBars(newBars);
    setTracks(newTracks);
  };

  const saveProject = () => {
    setPromptModal({
      isOpen: true,
      title: 'Save Project',
      message: 'Enter a name for your project:',
      defaultValue: `midi-project-${new Date().toISOString().slice(0, 10)}`,
      inputType: 'text',
      onConfirm: (name) => {
        const project = { 
          bpm, bars, swing, delayWet, delayTime, reverbWet, distWet, 
          masterChorusWet, masterBitcrusherWet, masterVolume, 
          masterCompThreshold, masterCompRatio, 
          masterEqLow, masterEqMid, masterEqHigh, masterFilterFreq,
          tracks 
        };
        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name || 'my-project'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setPromptModal(null);
      },
      onCancel: () => setPromptModal(null)
    });
  };

  const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      // Stop playback before loading new data to prevent glitches
      Tone.Transport.stop();
      setPlaying(false);
      try {
        const project = JSON.parse(event.target?.result as string);
        if (project.bpm) setBpm(project.bpm);
        if (project.bars) setBars(project.bars);
        if (project.swing !== undefined) setSwing(project.swing);
        if (project.delayWet !== undefined) setDelayWet(project.delayWet);
        if (project.delayTime) setDelayTime(project.delayTime);
        if (project.reverbWet !== undefined) setReverbWet(project.reverbWet);
        if (project.distWet !== undefined) setDistWet(project.distWet);
        if (project.masterChorusWet !== undefined) setMasterChorusWet(project.masterChorusWet);
        if (project.masterBitcrusherWet !== undefined) setMasterBitcrusherWet(project.masterBitcrusherWet);
        if (project.masterVolume !== undefined) setMasterVolume(project.masterVolume);
        if (project.masterCompThreshold !== undefined) setMasterCompThreshold(project.masterCompThreshold);
        if (project.masterCompRatio !== undefined) setMasterCompRatio(project.masterCompRatio);
        if (project.masterEqLow !== undefined) setMasterEqLow(project.masterEqLow);
        if (project.masterEqMid !== undefined) setMasterEqMid(project.masterEqMid);
        if (project.masterEqHigh !== undefined) setMasterEqHigh(project.masterEqHigh);
        if (project.masterFilterFreq !== undefined) setMasterFilterFreq(project.masterFilterFreq);
        if (project.tracks) {
          const loadedBars = project.bars || 1;
          const paddedTracks = project.tracks.map((track: TrackData) => {
            const targetLength = track.stepsCount || loadedBars * 16;
            if (track.steps.length < targetLength) {
              const newSteps = [...track.steps];
              for (let i = track.steps.length; i < targetLength; i++) {
                newSteps[i] = { active: false, note: track.defaultNote || 'C4', velocity: 0.8, duration: '16n', offset: 0, stepSpan: 1 };
              }
              return { ...track, steps: newSteps };
            }
            return track;
          });
          setTracks(paddedTracks);
        }
      } catch (err) {
        console.error('Invalid project file');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be loaded again if needed
    e.target.value = '';
  };

  const toggleMute = React.useCallback((trackIndex: number) => {
    commitHistory();
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks[trackIndex].muted = !newTracks[trackIndex].muted;
      return newTracks;
    });
  }, [commitHistory]);

  const toggleSolo = React.useCallback((trackIndex: number) => {
    commitHistory();
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks[trackIndex].solo = !newTracks[trackIndex].solo;
      return newTracks;
    });
  }, [commitHistory]);

  const handleSampleUpload = React.useCallback((trackIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTrimmerModal({ isOpen: true, file, trackIndex });
    e.target.value = '';
  }, []);

  const handleGlobalSampleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTrimmerModal({ isOpen: true, file, trackIndex: null });
    e.target.value = '';
  };

  const confirmSampleTrim = (start: number, end: number, duration: number) => {
    if (!trimmerModal) return;
    
    const url = URL.createObjectURL(trimmerModal.file);
    const name = trimmerModal.file.name.split('.')[0].substring(0, 10).toUpperCase();
    
    if (trimmerModal.trackIndex !== null) {
      updateTrack(trimmerModal.trackIndex, { 
        sampleUrl: url, 
        name,
        sampleStart: start,
        sampleEnd: end,
        sampleDuration: end - start
      });
    } else {
      // Add new track
      const newTrack: TrackData = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        type: 'melodic',
        instrument: 'sampler',
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        volume: 0,
        pan: 0,
        muted: false,
        solo: false,
        delayWet: 0,
        reverbWet: 0,
        distWet: 0,
        chorusWet: 0,
        bitcrusherWet: 0,
        swing: 0,
        defaultNote: 'C4',
        sampleUrl: url,
        sampleStart: start,
        sampleEnd: end,
        sampleDuration: end - start,
        sampleFade: true,
        steps: Array(bars * 16).fill(null).map(() => ({ active: false, note: 'C4', velocity: 1, duration: '16n', offset: 0 }))
      };
      setTracks(prev => [...prev, newTrack]);
    }
    
    setTrimmerModal(null);
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-[#151619] flex items-center justify-center font-mono text-white">
        <div className="text-center space-y-6 max-w-md p-8 bg-[#242424] rounded-xl border border-[#333] shadow-2xl">
          <h1 className="text-3xl font-bold tracking-tighter">AUDIO ENGINE</h1>
          <p className="text-[#8E9299] text-sm">
            Choose a mode to begin creating.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button 
              onClick={() => handleStart('midi')}
              className="w-full py-16 bg-[#FF4444] hover:bg-[#ff5555] text-white font-bold rounded-2xl transition-all transform hover:scale-105 flex flex-col items-center gap-4 shadow-xl"
            >
              <span className="text-3xl tracking-wider">MIDI STUDIO</span>
              <span className="text-base font-normal opacity-90">Sequencer & Beats</span>
            </button>
            <button 
              onClick={() => handleStart('sfx')}
              className="w-full py-16 bg-[#00AAFF] hover:bg-[#33bbff] text-white font-bold rounded-2xl transition-all transform hover:scale-105 flex flex-col items-center gap-4 shadow-xl"
            >
              <span className="text-3xl tracking-wider">SFX STUDIO</span>
              <span className="text-base font-normal opacity-90">Sound Design</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appMode === 'sfx') {
    return (
      <SFXStudio onBack={() => {
        setStarted(false);
        engine.stopAll();
      }} />
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0a0c] to-[#151619] text-white font-mono p-4 sm:p-6 select-none flex flex-col overflow-hidden">
      <div className="w-full h-full mx-auto flex flex-col gap-4 sm:gap-6">
        
        {/* Header & Transport */}
        <div className="flex flex-col gap-4 bg-[#1a1b20] p-4 sm:p-6 rounded-xl border border-[#2a2b30] shadow-2xl">
          {/* Top Row: Transport & Global Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <div className="flex items-center gap-4 flex-wrap">
              <button 
                onClick={() => {
                  setStarted(false);
                  engine.stopAll();
                }}
                className="p-2 bg-[#333] hover:bg-[#444] rounded-lg text-[#8E9299] hover:text-white transition-colors flex items-center gap-2"
                title="Leave MIDI Studio"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-bold hidden sm:inline">BACK</span>
              </button>
              <h1 className="text-xl font-bold tracking-tighter text-[#FF4444]">MIDI STUDIO</h1>
              <button 
                onClick={() => setShowHelpModal(true)}
                className="p-1.5 bg-[#333] hover:bg-[#444] rounded-full text-[#8E9299] hover:text-white transition-colors"
                title="Help Center"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="h-6 w-px bg-[#333] hidden sm:block"></div>
              
              {/* Transport */}
              <div className="flex gap-2">
                <button 
                  onClick={togglePlay}
                  className={`p-3 rounded-lg transition-colors ${playing ? 'bg-[#333] text-[#FF4444]' : 'bg-[#333] hover:bg-[#444]'}`}
                  title={playing ? "Pause" : "Play"}
                >
                  <Play className="w-5 h-5" fill={playing ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={stopPlayback}
                  className="p-3 bg-[#333] hover:bg-[#444] rounded-lg transition-colors"
                  title="Stop"
                >
                  <Square className="w-5 h-5" fill="currentColor" />
                </button>
                <button 
                  onClick={() => setLoopPlayback(!loopPlayback)}
                  className={`p-3 rounded-lg transition-colors ${loopPlayback ? 'bg-[#333] text-[#00AAFF]' : 'bg-[#333] hover:bg-[#444] text-gray-400'}`}
                  title={loopPlayback ? "Looping Enabled" : "Looping Disabled"}
                >
                  <Repeat className="w-5 h-5" />
                </button>
              </div>

              <div className="h-6 w-px bg-[#333] hidden sm:block"></div>

              {/* Tempo, Swing & Bars */}
              <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
                <button 
                  onClick={() => setMetronome(!metronome)}
                  className={`p-2 rounded transition-colors ${metronome ? 'bg-[#FF4444]/20 text-[#FF4444]' : 'text-[#8E9299] hover:text-white'}`}
                  title="Toggle Metronome"
                >
                  {metronome ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </button>
                <div className="w-px h-6 bg-[#333]"></div>
                <button onClick={() => setBpm(b => Math.max(60, b - 1))} className="p-2 text-[#8E9299] hover:text-[#FF4444]"><Minus className="w-3 h-3"/></button>
                <span className="text-sm w-8 text-center font-bold">{bpm}</span>
                <button onClick={() => setBpm(b => Math.min(200, b + 1))} className="p-2 text-[#8E9299] hover:text-[#FF4444]"><Plus className="w-3 h-3"/></button>
                <button 
                  onClick={() => {
                    const now = Date.now();
                    const newTapTimes = [...tapTimes, now].slice(-4);
                    setTapTimes(newTapTimes);
                    if (newTapTimes.length > 1) {
                      const intervals = [];
                      for (let i = 1; i < newTapTimes.length; i++) {
                        intervals.push(newTapTimes[i] - newTapTimes[i-1]);
                      }
                      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
                      const newBpm = Math.round(60000 / avgInterval);
                      if (newBpm >= 60 && newBpm <= 200) {
                        setBpm(newBpm);
                      }
                    }
                  }}
                  className="p-1 px-2 text-[0.625rem] font-bold text-[#8E9299] hover:text-white bg-[#242424] border border-[#333] rounded transition-colors"
                  title="Tap Tempo"
                >
                  TAP
                </button>
              </div>

              <div className="flex items-center gap-2 bg-[#1a1a1a] p-1.5 rounded-lg border border-[#333]">
                <span className="text-[0.625rem] text-[#8E9299] font-bold px-2">SWING</span>
                <input 
                  type="range" min="0" max="1" step="0.05" value={swing}
                  onChange={e => setSwing(parseFloat(e.target.value))}
                  className="w-16 custom-slider slider-purple"
                />
              </div>

              <div className="flex items-center gap-2 bg-[#1a1a1a] p-1.5 rounded-lg border border-[#333]">
                <span className="text-[0.625rem] text-[#8E9299] font-bold px-2">BARS</span>
                <input 
                  type="number" 
                  min="1" max="128" 
                  value={bars} 
                  onChange={e => handleBarsChange(Math.max(1, Math.min(128, parseInt(e.target.value) || 1)))}
                  className="bg-[#242424] text-xs p-1 rounded border border-[#333] outline-none w-16 text-center"
                />
                <button 
                  onClick={duplicateBars} 
                  className="p-1 text-[#8E9299] hover:text-white bg-[#242424] border border-[#333] rounded transition-colors" 
                  title="Duplicate Bars (Copy pattern forward)"
                >
                  <CopyPlus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-6 w-px bg-[#333] hidden sm:block"></div>

              {/* View options */}
              <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
                <button
                  onClick={() => setTrackFollow(!trackFollow)}
                  className={`p-2 rounded text-xs font-bold transition-colors ${trackFollow ? 'bg-[#00AAFF]/20 text-[#00AAFF]' : 'text-[#8E9299] hover:text-white'}`}
                  title="Auto-scroll to follow playback"
                >
                  TRACK FOLLOW
                </button>
                <div className="w-px h-6 bg-[#333]"></div>
                <select 
                  value={zoomLevel} 
                  onChange={e => setZoomLevel(parseInt(e.target.value) as 1 | 2 | 3)} 
                  className="bg-transparent text-[#8E9299] hover:text-white text-xs px-2 py-1 outline-none font-bold"
                  title="UI Size / Zoom Mode"
                >
                  <option value={1} className="bg-[#1a1a1a]">SIZE 1</option>
                  <option value={2} className="bg-[#1a1a1a]">SIZE 2</option>
                  <option value={3} className="bg-[#1a1a1a]">SIZE 3</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Project Actions */}
              <div className="flex gap-2">
                <button onClick={undo} disabled={past.length === 0} className="p-2 text-[#8E9299] hover:text-white disabled:opacity-50 disabled:hover:text-[#8E9299] bg-[#1a1a1a] rounded-lg border border-[#333] transition-colors" title="Undo">
                  <Undo2 className="w-4 h-4" />
                </button>
                <button onClick={redo} disabled={future.length === 0} className="p-2 text-[#8E9299] hover:text-white disabled:opacity-50 disabled:hover:text-[#8E9299] bg-[#1a1a1a] rounded-lg border border-[#333] transition-colors" title="Redo">
                  <Redo2 className="w-4 h-4" />
                </button>
                <button onClick={() => {
                  setPromptModal({
                    isOpen: true,
                    title: 'CLEAR PROJECT',
                    message: 'Are you sure you want to delete all data and reset the tracks?',
                    defaultValue: '',
                    inputType: 'none',
                    onConfirm: () => {
                      commitHistory();
                      setTracks(tracks.map(t => ({ ...t, steps: t.steps.map(s => ({ ...s, active: false })) })));
                      setPromptModal(null);
                    },
                    onCancel: () => setPromptModal(null)
                  });
                }} className="p-2 text-[#8E9299] hover:text-[#FF4444] bg-[#1a1a1a] rounded-lg border border-[#333] transition-colors" title="Clear All Tracks">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => {
                  commitHistory();
                  setTracks(tracks.map(t => ({ ...t, muted: false, solo: false })));
                }} className="p-2 text-[#8E9299] hover:text-[#00AAFF] bg-[#1a1a1a] rounded-lg border border-[#333] transition-colors" title="Clear All Mutes/Solos">
                  <VolumeX className="w-4 h-4" />
                </button>
                <button onClick={saveProject} className="p-2 text-[#8E9299] hover:text-white bg-[#1a1a1a] rounded-lg border border-[#333] flex items-center gap-2 transition-colors" title="Save Project">
                  <Save className="w-4 h-4" />
                  <span className="text-xs font-bold hidden lg:inline">SAVE</span>
                </button>
                <label className="p-2 text-[#8E9299] hover:text-white bg-[#1a1a1a] rounded-lg border border-[#333] flex items-center gap-2 cursor-pointer transition-colors" title="Load Project">
                  <FolderOpen className="w-4 h-4" />
                  <span className="text-xs font-bold hidden lg:inline">LOAD</span>
                  <input type="file" accept=".json" className="hidden" onChange={loadProject} />
                </label>
                <button onClick={() => setShowProGuide(true)} className="p-2 text-[#8E9299] hover:text-[#00AAFF] bg-[#1a1a1a] rounded-lg border border-[#333] flex items-center gap-2 transition-colors" title="Pro Guide">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-bold hidden lg:inline">GUIDE</span>
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-[#8E9299] hover:text-[#00AAFF] bg-[#1a1a1a] rounded-lg border border-[#333] flex items-center gap-2 transition-colors" title="Settings">
                  <Settings2 className="w-4 h-4" />
                  <span className="text-xs font-bold hidden lg:inline">SETTING</span>
                </button>
              </div>

              <div className="h-6 w-px bg-[#333] hidden sm:block"></div>

              {/* Recording */}
              <div className="flex items-center gap-2">
                <select
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value as 'mp3' | 'wav')}
                  className="bg-[#1a1a1a] text-xs text-[#8E9299] p-2 rounded-lg border border-[#333] outline-none focus:border-[#FF4444] transition-colors"
                  disabled={recording}
                >
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                </select>

                <button 
                  onClick={() => setAutoStopRecord(!autoStopRecord)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border ${
                    autoStopRecord 
                      ? 'bg-[#00AAFF]/20 border-[#00AAFF] text-[#00AAFF]' 
                      : 'bg-[#1a1a1a] border-[#333] text-[#8E9299] hover:text-white hover:border-[#444]'
                  }`}
                  title={autoStopRecord ? "Auto-stop recording at end of loop" : "Manual stop recording"}
                >
                  <Timer className="w-4 h-4" />
                  <span className="text-xs font-bold hidden sm:inline">AUTO-STOP</span>
                </button>

                <button 
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${
                    recording 
                      ? 'bg-[#FF4444]/20 border-[#FF4444] text-[#FF4444] shadow-[0_0_15px_rgba(255,68,68,0.3)]' 
                      : 'bg-[#1a1a1a] border-[#333] text-[#8E9299] hover:text-white hover:border-[#444]'
                  }`}
                >
                  <Circle className={`w-4 h-4 ${recording ? 'fill-current animate-pulse' : ''}`} />
                  <span className="text-xs font-bold">{recording ? 'RECORDING...' : 'RECORD'}</span>
                </button>

                {recordedBlob && !recording && (
                  <button 
                    onClick={downloadRecording}
                    disabled={isDownloading}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                      isDownloading 
                        ? 'bg-[#333] border-[#444] text-[#888] cursor-not-allowed' 
                        : 'bg-[#00AAFF]/20 border-[#00AAFF] text-[#00AAFF] hover:bg-[#00AAFF]/30'
                    }`}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="text-xs font-bold">{isDownloading ? 'CONVERTING...' : 'SAVE'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Master FX */}
          <div className="flex items-center gap-3 bg-[#1a1a1a] p-2 rounded-lg border border-[#333] overflow-x-auto custom-scrollbar w-full">
            <SlidersHorizontal className="w-4 h-4 text-[#8E9299] ml-1 shrink-0" />
            <span className="text-xs font-bold text-[#8E9299] mr-2 shrink-0">MASTER FX</span>
            
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">VOL</span>
              <input 
                type="range" min="-60" max="6" step="1" value={masterVolume}
                onChange={e => setMasterVolume(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-red"
              />
            </div>
            <div className="w-px h-4 bg-[#333] shrink-0 mx-1"></div>
            
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">ECHO</span>
              <input 
                type="range" min="0" max="1" step="0.05" value={delayWet}
                onChange={e => setDelayWet(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-blue"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">VERB</span>
              <input 
                type="range" min="0" max="1" step="0.05" value={reverbWet}
                onChange={e => setReverbWet(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-purple"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">DIST</span>
              <input 
                type="range" min="0" max="1" step="0.05" value={distWet}
                onChange={e => setDistWet(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-red"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">CHOR</span>
              <input 
                type="range" min="0" max="1" step="0.05" value={masterChorusWet}
                onChange={e => setMasterChorusWet(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-blue"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">CRSH</span>
              <input 
                type="range" min="0" max="1" step="0.05" value={masterBitcrusherWet}
                onChange={e => setMasterBitcrusherWet(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-purple"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">LPF</span>
              <input 
                type="range" min="20" max="20000" step="1" value={masterFilterFreq}
                onChange={e => setMasterFilterFreq(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-green"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">HPF</span>
              <input 
                type="range" min="20" max="20000" step="1" value={masterHPFFreq}
                onChange={e => setMasterHPFFreq(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-green"
              />
            </div>
            <div className="w-px h-4 bg-[#333] shrink-0 mx-1"></div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">COMP THR</span>
              <input 
                type="range" min="-60" max="0" step="1" value={masterCompThreshold}
                onChange={e => setMasterCompThreshold(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-yellow"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">RATIO</span>
              <input 
                type="range" min="1" max="20" step="1" value={masterCompRatio}
                onChange={e => setMasterCompRatio(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-yellow"
              />
            </div>
            <div className="w-px h-4 bg-[#333] shrink-0 mx-1"></div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">LOW</span>
              <input 
                type="range" min="-24" max="12" step="1" value={masterEqLow}
                onChange={e => setMasterEqLow(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-red"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">MID</span>
              <input 
                type="range" min="-24" max="12" step="1" value={masterEqMid}
                onChange={e => setMasterEqMid(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-yellow"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[0.625rem] text-[#8E9299]">HIGH</span>
              <input 
                type="range" min="-24" max="12" step="1" value={masterEqHigh}
                onChange={e => setMasterEqHigh(parseFloat(e.target.value))}
                className="w-16 custom-slider slider-blue"
              />
            </div>
          </div>
        </div>

        {/* Sequencer Grid */}
        <div className="bg-[#1a1b20] rounded-xl border border-[#2a2b30] shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-auto relative custom-scrollbar">
            <div className="inline-block min-w-full min-h-full overflow-hidden">
              {/* Timeline Header */}
              <div className="flex border-b border-[#2a2b30] sticky top-0 z-20 bg-[#151619]">
                <div className="w-72 sm:w-80 flex-shrink-0 sticky left-0 z-30 bg-[#151619] p-2 sm:p-3 border-r border-[#2a2b30] shadow-[4px_0_10px_rgba(0,0,0,0.3)] flex items-center justify-between">
                  <span className="text-[0.625rem] font-bold text-[#8E9299] tracking-widest">TIMELINE</span>
                  <span className="text-[0.625rem] font-bold text-[#666]">{bars} BARS</span>
                </div>
                <div className="flex items-center p-3 sm:p-4 bg-[#151619] relative">
                  {Array.from({ length: bars * 16 }).map((_, stepIndex) => (
                    <React.Fragment key={stepIndex}>
                      {stepIndex > 0 && stepIndex % 16 === 0 && <div className="h-full w-px bg-transparent mx-2 sm:mx-3 flex-shrink-0"></div>}
                      <div className={`flex-shrink-0 w-8 sm:w-10 flex justify-center relative step-container step-container-${stepIndex} ${stepIndex % 4 === 0 && stepIndex % 16 !== 0 ? "ml-2 sm:ml-3" : "ml-1 sm:ml-1.5"}`}>
                        <span className={`text-[0.625rem] font-bold timeline-text text-[#666]`}>
                          {stepIndex % 4 === 0 ? (stepIndex / 4) + 1 : ''}
                        </span>
                        <div className="playhead-indicator absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 w-0.5 bg-[#FF4444] opacity-80 z-10 pointer-events-none shadow-[0_0_8px_#FF4444]" />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {tracks.map((track, trackIndex) => (
                  <motion.div 
                    key={track.id} 
                    layout 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.9 }} 
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <TrackRow
                      track={track}
                      trackIndex={trackIndex}
                      totalTracks={tracks.length}
                      bars={bars}
                      onUpdateTrack={updateTrack}
                      onMoveTrackUp={moveTrackUp}
                      onMoveTrackDown={moveTrackDown}
                      onToggleMute={toggleMute}
                      onToggleSolo={toggleSolo}
                      onShiftTrackLeft={shiftTrackLeft}
                      onShiftTrackRight={shiftTrackRight}
                      onDuplicateTrack={duplicateTrack}
                      onRandomizeTrack={randomizeTrack}
                      onHumanizeTrack={humanizeTrack}
                      onClearTrack={clearTrack}
                      onDeleteTrack={deleteTrack}
                      onSampleUpload={handleSampleUpload}
                      onCommitHistory={commitHistory}
                      onToggleStep={toggleStep}
                      onOpenSettings={handleOpenSettings}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="p-3 bg-[#151619] border-t border-[#2a2b30] flex gap-2">
            <button onClick={addTrack} className="flex-1 py-2 border border-dashed border-[#333] text-[#8E9299] hover:text-white hover:border-[#666] rounded-lg flex items-center justify-center gap-2 transition-colors">
              <PlusCircle className="w-4 h-4" />
              <span className="font-bold text-xs">ADD TRACK</span>
            </button>
            <button onClick={() => globalUploadRef.current?.click()} className="flex-1 py-2 border border-dashed border-[#333] text-[#8E9299] hover:text-white hover:border-[#666] rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="font-bold text-xs">UPLOAD SAMPLE</span>
            </button>
            <input type="file" accept="audio/*" className="hidden" ref={globalUploadRef} onChange={handleGlobalSampleUpload} />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-[#8E9299] text-xs space-y-1">
          <p>Click a step to toggle it. Long-press or right-click a step to adjust pitch, velocity, and hold duration.</p>
          <p><strong>M</strong> = Mute track | <strong>S</strong> = Solo track (only soloed tracks will play)</p>
          <p>Recorded audio is automatically converted and saved in MP3 format.</p>
        </div>

      </div>

      {/* Step Settings Popover */}
      {settingsOpen && tracks[settingsOpen.trackIndex] && tracks[settingsOpen.trackIndex].steps?.[settingsOpen.stepIndex] && (
        <StepSettings
          step={tracks[settingsOpen.trackIndex].steps[settingsOpen.stepIndex]}
          rect={settingsOpen.rect}
          type={tracks[settingsOpen.trackIndex].type}
          onUpdate={(data) => updateStep(settingsOpen.trackIndex, settingsOpen.stepIndex, data)}
          onClose={() => setSettingsOpen(null)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151619] border border-[#333] rounded-xl p-6 max-w-md w-full shadow-2xl relative"
          >
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-[#8E9299] hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Settings2 className="text-[#00AAFF]" />
              APP SETTINGS
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#8E9299] mb-3 border-b border-[#333] pb-2">APPEARANCE</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">Light Mode</div>
                    <div className="text-xs text-[#8E9299]">Switch app theme to light</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={theme === 'light'} onChange={e => setTheme(e.target.checked ? 'light' : 'dark')} />
                    <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00AAFF]"></div>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-[#8E9299] mb-3 border-b border-[#333] pb-2">AUDIO</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">Headphone Mode</div>
                      <div className="text-xs text-[#8E9299]">Enhance spatial audio for headphones</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={headphoneMode} onChange={e => setHeadphoneMode(e.target.checked)} />
                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#44FF44]"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">Default Note Velocity</div>
                      <div className="text-xs text-[#8E9299]">Starting velocity for new blocks</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8E9299] font-bold">{Math.round(defaultVelocity * 100)}%</span>
                      <input 
                        type="range" min="0.1" max="1" step="0.05" value={defaultVelocity}
                        onChange={e => setDefaultVelocity(parseFloat(e.target.value))}
                        className="w-24 custom-slider slider-blue"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-[#8E9299] mb-3 border-b border-[#333] pb-2">PERFORMANCE</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">Performance Mode</div>
                    <div className="text-xs text-[#8E9299]">Disables visual animations to save CPU CPU</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={performanceMode} onChange={e => setPerformanceMode(e.target.checked)} />
                    <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4444]"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-[#333] flex justify-end">
              <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2 bg-[#00AAFF] hover:bg-[#0099ee] text-white font-bold rounded-lg transition-colors">
                DONE
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pro Guide Modal */}
      {showProGuide && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#151619] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#151619] border-b border-[#333] p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-[#00AAFF] flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                HOW TO MAKE PROFESSIONAL BEATS
              </h2>
              <button onClick={() => setShowProGuide(false)} className="p-2 text-[#8E9299] hover:text-white rounded-lg hover:bg-[#242424] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 text-[#8E9299] text-sm leading-relaxed">
              <section>
                <h3 className="text-white font-bold text-base mb-2">1. Sound Selection is Everything</h3>
                <p>Professional beats start with high-quality sounds. A great kick and snare will do 80% of the work. Use the new <strong>Sampler (Upload)</strong> instrument to load your own premium drum samples (.wav or .mp3) instead of relying solely on synthesized drums.</p>
                <p className="text-[#FF4444] mt-2 text-xs"><em>Note: Custom uploaded samples are stored locally in your browser session. If you save and load a project later, you may need to re-upload your custom samples.</em></p>
              </section>
              
              <section>
                <h3 className="text-white font-bold text-base mb-2">2. The Groove (Swing & Velocity)</h3>
                <p>Robotic beats sound amateur. To make it bounce:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Velocity:</strong> Right-click (or long-press) a step to open the Step Editor. Lower the velocity on "ghost notes" (in-between hits) and keep the main hits (like the snare on the 2 and 4) at max velocity.</li>
                  <li><strong>Swing:</strong> Use the global Swing slider (top right) to delay every 16th note slightly. This gives the beat a human, "dilla-style" feel.</li>
                  <li><strong>Micro-timing:</strong> In the Step Editor, use the <em>Offset</em> slider to push a snare slightly late or a hi-hat slightly early.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">3. Layering & Frequencies</h3>
                <p>Don't let instruments fight for the same frequency space.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Keep your Kick and 808/Bass in the center (Pan = 0).</li>
                  <li>Pan your hi-hats slightly to the left or right to create width.</li>
                  <li>Use the Track Volume to mix. The Kick and Snare should usually be the loudest elements. Turn down the hi-hats and synths so they sit <em>behind</em> the drums.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">4. Space & Depth (FX)</h3>
                <p>Use the global Reverb and Delay to create a 3D space.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Add a tiny bit of Reverb to the Snare and Clap to make them sound larger.</li>
                  <li>Keep the Kick and Bass completely dry (0% Reverb) so they stay punchy and don't muddy the mix.</li>
                  <li>Use Delay on melodic elements (Plucks, Pianos) to fill empty space.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">5. Arrangement & Variation</h3>
                <p>A 1-bar loop gets boring quickly. Increase the <strong>BARS</strong> setting to 4 or 8. Add small variations at the end of every 4th bar (like a drum fill, an extra kick, or dropping the hi-hats out entirely) to keep the listener engaged.</p>
              </section>
              <section>
                <h3 className="text-white font-bold text-base mb-2">5. New Features: 8-Bit, Looping & Auto-Stop</h3>
                <p>Take advantage of the latest studio tools:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Chiptune & 8-Bit:</strong> Add retro video game vibes using the new 8-Bit (Square) and Chiptune (Triangle) instruments.</li>
                  <li><strong>Looping:</strong> Toggle the <Repeat className="w-3 h-3 inline" /> Repeat button next to the Stop button to continuously loop your beat, or play it just once.</li>
                  <li><strong>Auto-Stop Recording:</strong> Click the <Timer className="w-3 h-3 inline" /> AUTO-STOP button before recording. The studio will automatically stop recording exactly at the end of the last bar, giving you a perfect, seamless loop for export.</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
      {promptModal && (
        <PromptModal
          isOpen={promptModal.isOpen}
          title={promptModal.title}
          message={promptModal.message}
          defaultValue={promptModal.defaultValue}
          inputType={promptModal.inputType}
          options={promptModal.options}
          onConfirm={promptModal.onConfirm}
          onCancel={promptModal.onCancel}
        />
      )}
      {trimmerModal && trimmerModal.isOpen && (
        <SampleTrimmerModal
          file={trimmerModal.file}
          onConfirm={confirmSampleTrim}
          onCancel={() => setTrimmerModal(null)}
        />
      )}
      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} />
      )}
    </div>
  );
}
