import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Mp3Encoder } from '@breezystack/lamejs';
import { Play, Square, Download, ArrowLeft, Circle, BookOpen, X, Plus, Minus, Zap, Waves, Infinity, Activity, Volume2, Music, Settings2, HelpCircle, Save, FileAudio } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { audioBufferToWav } from '../utils';
import { engine } from '../audio';

export type SFXSnapshot = {
  synthType: string;
  oscType: string;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  pitch: string;
  pitchDecay: number;
  pitchSweep: 'none' | 'up' | 'down';
  sweepTime: number;
  noiseType: string;
  noiseMix: number;
  subMix: number;
  fxParams: {
    filterFreq: number;
    filterRes: number;
    fxDist: number;
    fxBitcrush: number;
    fxReverb: number;
    fxDelay: number;
  };
};

export type SFXStep = {
  active: boolean;
  lockedState?: SFXSnapshot;
};

interface SFXStudioProps {
  onBack: () => void;
  onAddToMIDI?: (name: string, sampleUrl: string) => void;
}

const ControlGroup = ({ label, icon, children, className = '' }: { label: string, icon: React.ReactNode, children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#151619] border border-[#333] rounded-2xl overflow-hidden ${className}`}>
    <div className="bg-[#242424] px-4 py-2 border-b border-[#333] flex items-center gap-2">
      {icon}
      <span className="text-[10px] font-black text-[#8E9299] uppercase tracking-widest">{label}</span>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

interface HelpCardProps {
  key?: any;
  title: string;
  icon: any;
  description: string;
  details: string[];
  isExpanded: boolean;
  onToggle: () => void;
}

const HelpCard = ({ 
  title, 
  icon: Icon, 
  description, 
  details, 
  isExpanded, 
  onToggle 
}: HelpCardProps) => {
  return (
    <motion.div 
      layout
      onClick={onToggle}
      className={`p-6 rounded-2xl border transition-all cursor-pointer select-none ${
        isExpanded 
          ? 'bg-[#1a1b20] border-[#00AAFF] shadow-[0_0_40px_rgba(0,170,255,0.15)] md:col-span-2' 
          : 'bg-[#151619] border-[#333] hover:border-[#444] hover:bg-[#1a1b20]'
      }`}
    >
      <div className="flex items-center gap-4 mb-3">
        <div className={`p-2.5 rounded-xl transition-colors ${isExpanded ? 'bg-[#00AAFF] text-white' : 'bg-[#1a1b20] text-[#00AAFF]'}`}>
          <Icon size={22} />
        </div>
        <h3 className={`font-black uppercase tracking-tight transition-all ${isExpanded ? 'text-white text-lg' : 'text-[#8E9299] text-sm'}`}>
          {title}
        </h3>
      </div>
      <p className={`text-xs leading-relaxed transition-colors ${isExpanded ? 'text-white/80' : 'text-[#8E9299]'}`}>
        {description}
      </p>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-[#333] space-y-4"
          >
            {details.map((detail, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00AAFF] mt-1.5 shrink-0" />
                <p className="text-xs text-white/70 leading-relaxed font-medium">{detail}</p>
              </div>
            ))}
            <div className="mt-4 p-4 bg-[#00AAFF]/10 rounded-xl border border-[#00AAFF]/20 flex items-start gap-4">
              <div className="p-2 bg-[#00AAFF] rounded-lg text-white">
                <Zap size={14} fill="currentColor" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#00AAFF] uppercase tracking-widest">SFX Hint</p>
                <p className="text-[11px] text-[#00AAFF]/80 mt-1 italic leading-relaxed">Combine these settings to create unique signatures for your game or project.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function SFXStudio({ onBack, onAddToMIDI }: SFXStudioProps) {
  const [synthType, setSynthType] = useState('synth');
  const [oscType, setOscType] = useState('sine');
  const [attack, setAttack] = useState(0.01);
  const [decay, setDecay] = useState(0.1);
  const [sustain, setSustain] = useState(0.5);
  const [release, setRelease] = useState(1);
  const [pitch, setPitch] = useState('C4');
  const [pitchDecay, setPitchDecay] = useState(0.05);
  const [pitchSweep, setPitchSweep] = useState<'none' | 'up' | 'down'>('none');
  const [sweepTime, setSweepTime] = useState(0.2);
  const [noiseType, setNoiseType] = useState('white');
  
  const [filterFreq, setFilterFreq] = useState(20000);
  const [filterRes, setFilterRes] = useState(0);
  
  const [fxReverb, setFxReverb] = useState(0);
  const [fxDelay, setFxDelay] = useState(0);
  const [fxDist, setFxDist] = useState(0);
  const [fxBitcrush, setFxBitcrush] = useState(0);
  const [fxTremoloFreq, setFxTremoloFreq] = useState(5);
  const [fxTremoloDepth, setFxTremoloDepth] = useState(0);
  const [fxPitchShift, setFxPitchShift] = useState(0);
  const [fxChorus, setFxChorus] = useState(0);
  const [fxPhaser, setFxPhaser] = useState(0);
  const [fxAutoFilter, setFxAutoFilter] = useState(0);

  const [vibratoFreq, setVibratoFreq] = useState(5);
  const [vibratoDepth, setVibratoDepth] = useState(0);

  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);
  const [noiseMix, setNoiseMix] = useState(0);
  const [subMix, setSubMix] = useState(0);
  const [compThreshold, setCompThreshold] = useState(-24);
  const [compRatio, setCompRatio] = useState(1);

  const synthRef = useRef<any>(null);
  const noiseSynthRef = useRef<Tone.NoiseSynth | null>(null);
  const subSynthRef = useRef<Tone.MembraneSynth | null>(null);
  const eqRef = useRef<Tone.EQ3 | null>(null);
  const compRef = useRef<Tone.Compressor | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const distRef = useRef<Tone.Distortion | null>(null);
  const bitcrusherRef = useRef<Tone.BitCrusher | null>(null);
  const chorusRef = useRef<Tone.Chorus | null>(null);
  const phaserRef = useRef<Tone.Phaser | null>(null);
  const autoFilterRef = useRef<Tone.AutoFilter | null>(null);
  const tremoloRef = useRef<Tone.Tremolo | null>(null);
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null);
  const vibratoRef = useRef<Tone.Vibrato | null>(null);
  const recorderRef = useRef<Tone.Recorder | null>(null);
  const waveformRef = useRef<Tone.Waveform | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [exportFormat, setExportFormat] = useState<'mp3' | 'wav'>('mp3');
  const [sfxName, setSfxName] = useState('sfx');
  const [isDownloading, setIsDownloading] = useState(false);
  const [playTrigger, setPlayTrigger] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'generator' | 'envelope' | 'effects' | 'layers'>('generator');
  const [playheadPos, setPlayheadPos] = useState<number | null>(null);
  const [exportMode, setExportMode] = useState<'sound' | 'sequence'>('sound');

  const [sequence, setSequence] = useState<SFXStep[]>(Array(16).fill({ active: false }));
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [seqBpm, setSeqBpm] = useState(120);
  const seqRef = useRef<Tone.Sequence | null>(null);

  const [ready, setReady] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [headphoneMode, setHeadphoneMode] = useState(false);
  const [expandedHelpCard, setExpandedHelpCard] = useState<number | null>(null);

  const HELP_CARDS = [
    {
      title: "Generator Types",
      icon: Zap,
      description: "Pick the right synthesis engine for your sound's foundation.",
      details: [
        "Synth: Best for lasers, jingles, and melodic UI clicks.",
        "Noise: Essential for explosions, wind, and crunchy snare textures.",
        "Sub: Adds a 40-60Hz weight to kick-style sounds.",
        "Membrane: Perfect for percussion and punchy impacts."
      ]
    },
    {
      title: "The Envelope",
      icon: Activity,
      description: "Controls the 'shape' of your sound over time (ADSR).",
      details: [
        "Attack: How fast the sound starts. 0.01s is punchy, 1s is a swell.",
        "Decay: The fall after the initial peak. Short for blips, long for drums.",
        "Sustain: The steady level while holding the trigger.",
        "Release: The tail after let-go. Important for natural-sounding fades."
      ]
    },
    {
      title: "Sequencing & SAV",
      icon: Save,
      description: "Create complex loops by freezing different generators on each step.",
      details: [
        "Click SAV to lock the curent knobs into that specific step.",
        "This saves everything: Pitch, Osc Type, Effects, and Envelopes.",
        "Use this to build a full drum kit (Kick on 1, Snare on 5) in one loop.",
        "Unlock steps to revert them to follow the live knob positions."
      ]
    },
    {
      title: "Pitch Sweeps",
      icon: Infinity,
      description: "Dynamic pitch movement is the secret to arcade and sci-fi sounds.",
      details: [
        "Down-Sweep: Standard for kicks and lasers failing through space.",
        "Up-Sweep: Great for 'jump' sounds or charging-up effects.",
        "Sweep Time: Adjusts how fast the slide happens relative to the sound length.",
        "Pitch Decay: Controls how quickly the exponential slide levels off."
      ]
    },
    {
      title: "Layers & Noise",
      icon: Waves,
      description: "Professional SFX are rarely just one oscillator. Mix and match.",
      details: [
        "Noise Mix: Adds grit and 'air' to melodic synths.",
        "Sub Osc: Layers a deep sine wave underneath for maximum bass impact.",
        "Change Noise Types (White, Brown, Pink) for different texture 'colors'.",
        "FM/AM Synths: Use these for metallic, bell-like, or robotic timbres."
      ]
    },
    {
      title: "Export & Live Rec",
      icon: Download,
      description: "Capture your creations for use in MIDI Studio or external projects.",
      details: [
        "Export Sound: Renders a single, high-quality audio file of the current setup.",
        "Export Sequence: Renders the entire 16-step animation as a loop.",
        "REC LIVE: Records everything you play in real-time. Hit STOP to finish.",
        "DOWNLOAD REC: Appears after a live recording to save your session."
      ]
    }
  ];

  useEffect(() => {
    const initAudio = async () => {
      await Tone.start();
      
      compRef.current = new Tone.Compressor(-24, 1).toDestination();
      eqRef.current = new Tone.EQ3(0, 0, 0).connect(compRef.current);
      filterRef.current = new Tone.Filter(20000, "lowpass").connect(eqRef.current);
      reverbRef.current = new Tone.Reverb({ decay: 2, wet: 0 }).connect(filterRef.current);
      delayRef.current = new Tone.FeedbackDelay("8n", 0.5).connect(reverbRef.current);
      delayRef.current.wet.value = 0;
      distRef.current = new Tone.Distortion({ distortion: 0.8, wet: 0 }).connect(delayRef.current);
      bitcrusherRef.current = new Tone.BitCrusher(4).connect(distRef.current);
      bitcrusherRef.current.wet.value = 0;
      chorusRef.current = new Tone.Chorus(4, 2.5, 0.5).start().connect(bitcrusherRef.current);
      chorusRef.current.wet.value = 0;
      phaserRef.current = new Tone.Phaser({ frequency: 15, octaves: 5, baseFrequency: 1000 }).connect(chorusRef.current);
      phaserRef.current.wet.value = 0;
      autoFilterRef.current = new Tone.AutoFilter("4n").start().connect(phaserRef.current);
      autoFilterRef.current.wet.value = 0;
      tremoloRef.current = new Tone.Tremolo(5, 0).start().connect(autoFilterRef.current);
      pitchShiftRef.current = new Tone.PitchShift(0).connect(tremoloRef.current);
      vibratoRef.current = new Tone.Vibrato(5, 0).connect(pitchShiftRef.current);
      
      recorderRef.current = new Tone.Recorder();
      waveformRef.current = new Tone.Waveform(256);
      compRef.current.connect(recorderRef.current);
      compRef.current.connect(waveformRef.current);

      setReady(true);
      
      const drawWaveform = () => {
        if (!canvasRef.current || !waveformRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const values = waveformRef.current.getValue();

        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = '#00AAFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const sliceWidth = width / values.length;
        let x = 0;
        for (let i = 0; i < values.length; i++) {
          const v = values[i] as number;
          const y = (v + 1) * height / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        animationRef.current = requestAnimationFrame(drawWaveform);
      };
      drawWaveform();
    };

    initAudio();
    return () => {
      cancelAnimationFrame(animationRef.current!);
      engine.stopAll();
      [synthRef, noiseSynthRef, subSynthRef, eqRef, compRef, filterRef, reverbRef, delayRef, distRef, bitcrusherRef, chorusRef, phaserRef, autoFilterRef, tremoloRef, pitchShiftRef, vibratoRef, seqRef].forEach(ref => {
        if (ref.current) ref.current.dispose();
      });
    };
  }, []);

  const updateSynth = () => {
    if (!ready || !vibratoRef.current) return;
    if (synthRef.current) synthRef.current.dispose();
    
    try {
      if (synthType === 'synth') synthRef.current = new Tone.Synth({ oscillator: { type: oscType as any }, envelope: { attack, decay, sustain, release } }).connect(vibratoRef.current!);
      else if (synthType === 'fm') synthRef.current = new Tone.FMSynth({ oscillator: { type: oscType as any }, envelope: { attack, decay, sustain, release } }).connect(vibratoRef.current!);
      else if (synthType === 'am') synthRef.current = new Tone.AMSynth({ oscillator: { type: oscType as any }, envelope: { attack, decay, sustain, release } }).connect(vibratoRef.current!);
      else if (synthType === 'membrane') synthRef.current = new Tone.MembraneSynth({ oscillator: { type: oscType as any }, envelope: { attack, decay, sustain, release } }).connect(vibratoRef.current!);
      else if (synthType === 'metal') synthRef.current = new Tone.MetalSynth({ envelope: { attack, decay, release } }).connect(vibratoRef.current!);
    } catch (e) {
      console.warn("Synth instantiation failed, falling back to basic Synth", e);
      synthRef.current = new Tone.Synth().connect(vibratoRef.current!);
    }
    
    if (noiseSynthRef.current) {
      try {
        noiseSynthRef.current.set({ noise: { type: noiseType as any } });
        noiseSynthRef.current.volume.value = Tone.gainToDb(noiseMix);
      } catch (e) { }
    } else {
      noiseSynthRef.current = new Tone.NoiseSynth({ noise: { type: noiseType as any }, volume: Tone.gainToDb(noiseMix) }).connect(vibratoRef.current!);
    }

    if (subSynthRef.current) {
      subSynthRef.current.volume.value = Tone.gainToDb(subMix);
    } else {
      subSynthRef.current = new Tone.MembraneSynth({ volume: Tone.gainToDb(subMix) }).connect(vibratoRef.current!);
    }
  };

  useEffect(updateSynth, [ready, synthType, oscType, attack, decay, sustain, release, noiseType, noiseMix, subMix]);

  useEffect(() => {
    if (!ready) return;
    Tone.getDestination().volume.value = masterVolume;
    if (headphoneMode) {
      // Simulate headphone spatialization or just a subtle EQ lift for clarity
      if (eqRef.current) {
        eqRef.current.high.value = eqHigh + 2;
        eqRef.current.low.value = eqLow + 1;
      }
    }
  }, [ready, masterVolume, headphoneMode, eqHigh, eqLow]);

  useEffect(() => {
    if (filterRef.current) filterRef.current.Q.value = filterRes;
    if (reverbRef.current) reverbRef.current.wet.value = fxReverb;
    if (delayRef.current) delayRef.current.wet.value = fxDelay;
    if (distRef.current) distRef.current.wet.value = fxDist;
    if (bitcrusherRef.current) bitcrusherRef.current.wet.value = fxBitcrush;
    if (chorusRef.current) chorusRef.current.wet.value = fxChorus;
    if (phaserRef.current) phaserRef.current.wet.value = fxPhaser;
    if (autoFilterRef.current) autoFilterRef.current.wet.value = fxAutoFilter;
    if (tremoloRef.current) tremoloRef.current.wet.value = fxTremoloDepth;
    if (tremoloRef.current) tremoloRef.current.frequency.value = fxTremoloFreq;
    if (pitchShiftRef.current) pitchShiftRef.current.pitch = fxPitchShift;
    if (vibratoRef.current) vibratoRef.current.frequency.value = vibratoFreq;
    if (vibratoRef.current) vibratoRef.current.depth.value = vibratoDepth;
    if (eqRef.current) {
      eqRef.current.low.value = eqLow;
      eqRef.current.mid.value = eqMid;
      eqRef.current.high.value = eqHigh;
    }
    if (compRef.current) {
      compRef.current.threshold.value = compThreshold;
      compRef.current.ratio.value = compRatio;
    }
  }, [ready, filterFreq, filterRes, fxReverb, fxDelay, fxDist, fxBitcrush, fxChorus, fxPhaser, fxAutoFilter, fxTremoloDepth, fxTremoloFreq, fxPitchShift, vibratoFreq, vibratoDepth, eqLow, eqMid, eqHigh, compThreshold, compRatio]);

  const playSound = (time?: number) => {
    if (!ready) return;
    const t = time || Tone.now();
    
    if (synthType !== 'noise' && synthRef.current) {
      synthRef.current.triggerAttackRelease(pitch, release, t);
      
      // Pitch wrap logic
      if (pitchSweep === 'up') {
        const freq = synthRef.current.toFrequency(pitch);
        synthRef.current.frequency?.setValueAtTime(freq, t);
        synthRef.current.frequency?.exponentialRampToValueAtTime(freq * 3, t + sweepTime);
      } else if (pitchSweep === 'down') {
        const freq = synthRef.current.toFrequency(pitch);
        synthRef.current.frequency?.setValueAtTime(freq, t);
        synthRef.current.frequency?.exponentialRampToValueAtTime(freq * 0.1, t + sweepTime);
      }
    }
    if (noiseMix > 0 && noiseSynthRef.current) {
      noiseSynthRef.current.triggerAttackRelease('8n', t);
    }
    if (subMix > 0 && subSynthRef.current) {
      subSynthRef.current.triggerAttackRelease('C1', '8n', t);
    }
  };

  const playSnapshot = (snap: SFXSnapshot, time: number) => {
    if (!ready) return;
    let temp: any;
    try {
      if (snap.synthType === 'membrane') temp = new Tone.MembraneSynth({ oscillator: { type: snap.oscType as any }, envelope: { attack: snap.attack, decay: snap.decay, sustain: snap.sustain, release: snap.release } }).connect(vibratoRef.current!);
      else if (snap.synthType === 'metal') temp = new Tone.MetalSynth({ envelope: { attack: snap.attack, decay: snap.decay, release: snap.release } }).connect(vibratoRef.current!);
      else if (snap.synthType === 'fm') temp = new Tone.FMSynth({ oscillator: { type: snap.oscType as any }, envelope: { attack: snap.attack, decay: snap.decay, sustain: snap.sustain, release: snap.release } }).connect(vibratoRef.current!);
      else if (snap.synthType === 'am') temp = new Tone.AMSynth({ oscillator: { type: snap.oscType as any }, envelope: { attack: snap.attack, decay: snap.decay, sustain: snap.sustain, release: snap.release } }).connect(vibratoRef.current!);
      else temp = new Tone.Synth({ oscillator: { type: snap.oscType as any }, envelope: { attack: snap.attack, decay: snap.decay, sustain: snap.sustain, release: snap.release } }).connect(vibratoRef.current!);
    } catch (e) {
      temp = new Tone.Synth().connect(vibratoRef.current!);
    }

    temp.triggerAttackRelease(snap.pitch, snap.release, time);
    // Pitch wrap logic
    if (snap.pitchSweep === 'up') {
      const freq = temp.toFrequency(snap.pitch);
      temp.frequency?.setValueAtTime(freq, time);
      temp.frequency?.exponentialRampToValueAtTime(freq * 3, time + snap.sweepTime);
    } else if (snap.pitchSweep === 'down') {
      const freq = temp.toFrequency(snap.pitch);
      temp.frequency?.setValueAtTime(freq, time);
      temp.frequency?.exponentialRampToValueAtTime(freq * 0.1, time + snap.sweepTime);
    }
    
    // Noise and Sub layers for snapshots
    if (snap.noiseMix > 0) {
      const n = new Tone.NoiseSynth({ noise: { type: snap.noiseType as any }, volume: Tone.gainToDb(snap.noiseMix) }).connect(vibratoRef.current!);
      n.triggerAttackRelease('8n', time);
      setTimeout(() => n.dispose(), 2000);
    }
    if (snap.subMix > 0) {
      const sub = new Tone.MembraneSynth({ volume: Tone.gainToDb(snap.subMix) }).connect(vibratoRef.current!);
      sub.triggerAttackRelease('C1', '8n', time);
      setTimeout(() => sub.dispose(), 2000);
    }

    setTimeout(() => temp.dispose(), (snap.release + 2) * 1000);
  };

  const handleToggleRecord = async () => {
    if (!ready) return;
    if (isRecording) {
      const blob = await recorderRef.current!.stop();
      setRecordedBlob(blob);
      setIsRecording(false);
    } else {
      setRecordedBlob(null);
      recorderRef.current!.start();
      setIsRecording(true);
      playSound();
    }
  };

  const downloadBlob = async (audioSource: Blob | AudioBuffer, name: string, format: 'mp3' | 'wav') => {
    let finalBlob: Blob;
    
    if (format === 'mp3') {
      let audioBuffer: AudioBuffer;
      if (audioSource instanceof Blob) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await audioSource.arrayBuffer();
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      } else {
        audioBuffer = audioSource;
      }

      const channels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const mp3encoder = new Mp3Encoder(channels, sampleRate, 128);
      const mp3Data: any[] = [];
      const left = audioBuffer.getChannelData(0);
      const right = channels > 1 ? audioBuffer.getChannelData(1) : left;
      
      const sampleBlockSize = 1152;
      for (let i = 0; i < left.length; i += sampleBlockSize) {
        const leftChunk = left.slice(i, i + sampleBlockSize);
        const rightChunk = right.slice(i, i + sampleBlockSize);
        const leftInt16 = new Int16Array(leftChunk.length);
        const rightInt16 = new Int16Array(rightChunk.length);
        for (let j = 0; j < leftChunk.length; j++) {
          leftInt16[j] = leftChunk[j] < 0 ? leftChunk[j] * 0x8000 : leftChunk[j] * 0x7FFF;
          rightInt16[j] = rightChunk[j] < 0 ? rightChunk[j] * 0x8000 : rightChunk[j] * 0x7FFF;
        }
        const mp3buf = mp3encoder.encodeBuffer(leftInt16, rightInt16) as any;
        if (mp3buf.length > 0) mp3Data.push(mp3buf);
      }
      const mp3flush = mp3encoder.flush() as any;
      if (mp3flush.length > 0) mp3Data.push(mp3flush);
      
      finalBlob = new Blob(mp3Data, { type: 'audio/mp3' });
    } else {
      if (audioSource instanceof AudioBuffer) {
        finalBlob = audioBufferToWav(audioSource);
      } else {
        finalBlob = audioSource;
      }
    }

    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAudio = async (type: 'sound' | 'sequence', format: 'mp3' | 'wav') => {
    if (!ready) return;
    setIsDownloading(true);
    
    try {
      const duration = type === 'sound' ? (attack + decay + release + 1) : (16 * Tone.Time("16n").toSeconds() + 1);
      
      const buffer = await Tone.Offline(async () => {
        // Essential: use a local destination
        const dest = Tone.Destination;
        
        // Setup simple synths
        const main = new Tone.Synth({
          oscillator: { type: oscType as any },
          envelope: { attack, decay, sustain, release }
        }).toDestination();
        
        if (type === 'sound') {
          main.triggerAttackRelease(pitch, release, 0);
        } else {
          sequence.forEach((step, i) => {
            if (step.active) {
              const time = i * Tone.Time("16n").toSeconds();
              const s = step.lockedState;
              if (s) {
                const temp = new Tone.Synth({
                  oscillator: { type: s.oscType as any },
                  envelope: { attack: s.attack, decay: s.decay, sustain: s.sustain, release: s.release }
                }).toDestination();
                temp.triggerAttackRelease(s.pitch, s.release, time);
              } else {
                main.triggerAttackRelease(pitch, release, time);
              }
            }
          });
        }
      }, duration);

      await downloadBlob(buffer.get() as AudioBuffer, `${sfxName || 'SFX'}_${type}`, format);
    } catch (e) {
      console.error("Export Error:", e);
      alert("Export failed. Please ensure the app is reloaded.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendToMIDI = async () => {
    if (!onAddToMIDI || !ready) return;
    setIsDownloading(true);
    try {
      const duration = (attack + decay + release + 0.5);
      const buffer = await Tone.Offline(async () => {
        const osc = new Tone.Synth({
          oscillator: { type: oscType as any },
          envelope: { attack, decay, sustain, release }
        }).toDestination();
        osc.triggerAttackRelease(pitch, release, 0);
        
        if (noiseMix > 0) {
          const noise = new Tone.NoiseSynth({
            noise: { type: noiseType as any },
            envelope: { attack, decay, sustain, release },
            volume: Tone.gainToDb(noiseMix)
          }).toDestination();
          noise.triggerAttackRelease(release, 0);
        }
      }, duration);

      const wavBlob = audioBufferToWav(buffer.get() as AudioBuffer);
      const url = URL.createObjectURL(wavBlob);
      onAddToMIDI(sfxName || 'SFX', url);
    } catch (e) {
      console.error(e);
      alert("Failed to send to MIDI studio.");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (playTrigger > 0 && ready) {
      playSound();
    }
  }, [playTrigger, ready]);

  const randomizeParams = () => {
    const synths = ['synth', 'fm', 'am', 'membrane', 'metal', 'noise'];
    const oscs = ['sine', 'square', 'triangle', 'sawtooth'];
    const notes = ['C2', 'E2', 'C3', 'G3', 'C4', 'A4', 'C5', 'F5'];
    setSynthType(synths[Math.floor(Math.random() * synths.length)]);
    setOscType(oscs[Math.floor(Math.random() * oscs.length)]);
    setPitch(notes[Math.floor(Math.random() * notes.length)]);
    setAttack(Math.random() * 0.1);
    setDecay(0.1 + Math.random() * 0.5);
    setSustain(Math.random() * 0.5);
    setRelease(0.1 + Math.random() * 0.9);
    setSubMix(Math.random());
    setNoiseMix(Math.random());
    setFxReverb(Math.random() * 0.5);
    setFxDelay(Math.random() * 0.3);
    setPlayTrigger(prev => prev + 1);
  };

  const applyPreset = (p: string) => {
    if (p === 'kick') { setSynthType('membrane'); setAttack(0.001); setDecay(0.2); setSustain(0.01); setRelease(0.2); setPitch('C1'); setSubMix(0.5); setOscType('sine'); }
    if (p === 'snare') { setSynthType('synth'); setOscType('triangle'); setAttack(0.001); setDecay(0.1); setSustain(0); setRelease(0.1); setPitch('G3'); setNoiseMix(0.7); setNoiseType('white'); }
    if (p === 'laser') { setSynthType('synth'); setOscType('sawtooth'); setAttack(0.01); setDecay(0.2); setSustain(0); setRelease(0.2); setPitch('C5'); setPitchSweep('down'); setSweepTime(0.2); }
    if (p === 'explosion') { setSynthType('noise'); setNoiseType('brown'); setAttack(0.01); setDecay(0.5); setSustain(0.1); setRelease(1); setFxDist(0.8); setFxReverb(0.6); setSubMix(0.4); }
    if (p === 'coin') { setSynthType('synth'); setOscType('square'); setAttack(0.01); setDecay(0.1); setSustain(0.5); setRelease(0.2); setPitch('B5'); setPitchSweep('none'); }
    if (p === 'jump') { setSynthType('synth'); setOscType('triangle'); setAttack(0.05); setDecay(0.2); setSustain(0); setRelease(0.2); setPitch('C4'); setPitchSweep('up'); setSweepTime(0.2); }
    // Trigger playback after state updates propagate
    setPlayTrigger(prev => prev + 1);
  };

  const toggleSeq = async () => {
    if (!ready) return;
    await Tone.start();
    if (isPlayingSeq) {
      if (seqRef.current) seqRef.current.stop();
      setIsPlayingSeq(false);
      setPlayheadPos(null);
    } else {
      if (seqRef.current) seqRef.current.dispose();
      // Inside toggleSeq
      seqRef.current = new Tone.Sequence((time, step) => {
        setPlayheadPos(step.index);
        if (isRecording) {
            // Logic to highlight/mark the recording step could be here if needed 
            // but the playhead already provides the timing.
        }
        if (step.active) {
          step.lockedState ? playSnapshot(step.lockedState, time) : playSound(time);
        }
      }, sequence.map((s, i) => ({ ...s, index: i })), "16n").start(0);
      Tone.Transport.bpm.value = seqBpm;
      Tone.Transport.start();
      setIsPlayingSeq(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 sm:p-8 font-sans">
      {/* Pro Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 md:p-8 backdrop-blur-3xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`border rounded-[32px] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl ${lightMode ? 'bg-white border-gray-200' : 'bg-[#0a0a0c] border-[#333]'}`}
          >
            <div className={`p-8 border-b flex items-center justify-between ${lightMode ? 'bg-gray-50 border-gray-200' : 'bg-[#151619]/50 border-[#333]'}`}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#00AAFF]/20 rounded-2xl flex items-center justify-center text-[#00AAFF]">
                  <HelpCircle size={32} />
                </div>
                <div>
                  <h2 className={`text-3xl font-black tracking-tighter ${lightMode ? 'text-black' : 'text-white'}`}>
                    SFX <span className="text-[#00AAFF]">CREATOR</span> GUIDE
                  </h2>
                  <p className="text-[#8E9299] text-xs font-bold uppercase tracking-widest mt-1">Professional Sound Design Logic</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGuide(false)} 
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all border ${lightMode ? 'bg-white border-gray-200 hover:bg-gray-100 text-gray-400' : 'bg-[#1a1b20] border-[#333] hover:bg-[#FF4444] text-[#8E9299] hover:text-white'}`}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-[#00AAFF] rounded-full" />
                  <h3 className={`text-xl font-black uppercase italic tracking-tight ${lightMode ? 'text-black' : 'text-white'}`}>Interactive Modules</h3>
                </div>
                <LayoutGroup>
                  <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {HELP_CARDS.map((card, idx) => (
                      <HelpCard 
                        key={idx}
                        title={card.title}
                        icon={card.icon}
                        description={card.description}
                        details={card.details}
                        isExpanded={expandedHelpCard === idx}
                        onToggle={() => setExpandedHelpCard(expandedHelpCard === idx ? null : idx)}
                      />
                    ))}
                  </motion.div>
                </LayoutGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className={`p-8 rounded-[24px] border ${lightMode ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1b20] border-[#333]'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Save className="text-[#00AAFF]" size={20} />
                    <h4 className={`font-bold uppercase tracking-widest text-xs italic ${lightMode ? 'text-gray-500' : 'text-white/40'}`}>The SAV Workflow</h4>
                  </div>
                  <p className={`text-xs leading-relaxed ${lightMode ? 'text-gray-600' : 'text-[#8E9299]'}`}>
                    The <strong>SAV (Snapshot)</strong> feature is what makes this studio professional. You can design a kick, hit SAV on step 1, then change everything to a snare and hit SAV on step 5. The sequencer will automatically reload the correct settings for each beat.
                  </p>
                </div>
                <div className={`p-8 rounded-[24px] border ${lightMode ? 'bg-[#00AAFF]/5 border-[#00AAFF]/20' : 'bg-[#00AAFF]/5 border-[#00AAFF]/20'}`}>
                  <div className="flex items-center gap-3 mb-4 text-[#00AAFF]">
                    <Download size={20} />
                    <h4 className="font-bold uppercase tracking-widest text-xs italic">Exporting Logic</h4>
                  </div>
                  <p className="text-xs text-[#00AAFF]/70 leading-relaxed font-medium">
                    Use <strong>SINGLE SOUND</strong> for individual assets. Use <strong>SEQUENCE</strong> for percussion loops. Use <strong>LIVE REC</strong> to capture your tweaks and slider movements for a more organic sound.
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 border-t flex justify-center ${lightMode ? 'bg-gray-50 border-gray-200' : 'bg-[#151619] border-[#333]'}`}>
              <button 
                onClick={() => setShowGuide(false)}
                className="px-12 py-4 bg-[#00AAFF] hover:bg-[#0099ee] text-white font-black rounded-2xl shadow-lg shadow-[#00AAFF]/20 transition-all uppercase tracking-widest text-xs active:scale-95"
              >
                Return to Studio
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div style={{ transform: zoom !== 1 ? `scale(${zoom})` : 'none', transformOrigin: 'top center' }} className={`max-w-6xl mx-auto transition-all duration-200 ${lightMode ? 'dark:text-black text-black' : 'text-white'}`}>
        <header className={`flex items-center justify-between mb-8 p-4 rounded-xl border shadow-lg transition-colors ${lightMode ? 'bg-white border-gray-200' : 'bg-[#1a1b20] border-[#333]'}`}>
          <div className="flex items-center gap-4">
            <button onClick={onBack} className={`p-3 rounded-xl border group transition-colors ${lightMode ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-[#151619] border-[#333] hover:bg-[#2A2B30]'}`}><ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" /></button>
            <div><h1 className={`text-2xl font-black tracking-tighter ${lightMode ? 'text-black' : 'text-white'}`}>SFX <span className="text-[#00AAFF]">STUDIO</span></h1><p className="text-[10px] text-[#8E9299] font-bold uppercase tracking-widest leading-none mt-1">Professional Sound Design</p></div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSettings(!showSettings)} className={`p-3 rounded-xl border transition-all ${showSettings ? 'bg-[#00AAFF]/20 border-[#00AAFF] text-[#00AAFF]' : 'bg-[#151619] border-[#333] text-[#8E9299]'}`}><Settings2 size={20} /></button>
            <button onClick={() => setShowGuide(true)} className="p-3 bg-[#151619] hover:bg-[#2A2B30] rounded-xl border border-[#333] text-[#8E9299] hover:text-white"><HelpCircle size={20} /></button>
            <div className="w-px h-8 bg-[#333] mx-1" />
            <div className="flex items-center bg-[#151619] border border-[#333] rounded-lg p-1">
              <button onClick={() => setZoom(Math.max(0.7, zoom - 0.1))} className="p-2 hover:bg-[#2A2B30] text-[#8E9299]"><Minus size={16} /></button>
              <span className="text-xs font-mono font-bold w-12 text-center text-[#8E9299]">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-2 hover:bg-[#2A2B30] text-[#8E9299]"><Plus size={16} /></button>
            </div>
            <button onClick={handleSendToMIDI} disabled={isDownloading} className="px-5 py-2.5 bg-[#8A2BE2] text-white font-black text-xs rounded-xl border-b-4 border-[#6a1bb2] active:border-b-0 active:translate-y-1">USE IN MIDI</button>
          </div>
        </header>

        {showSettings && (
          <div className={`mb-6 p-6 rounded-2xl border grid grid-cols-1 md:grid-cols-3 gap-6 animate-in zoom-in-95 transition-all ${lightMode ? 'bg-white border-[#00AAFF]/50 shadow-xl' : 'bg-[#1a1b20] border-[#00AAFF]/30'}`}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#00AAFF]"><Volume2 size={16} /><span className="text-xs font-black uppercase tracking-widest">Master Gain</span></div>
              <input type="range" min="-60" max="6" value={masterVolume} onChange={e => setMasterVolume(Number(e.target.value))} className="w-full custom-slider" />
            </div>
            <div className="flex flex-col justify-center gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#8E9299]">Light Mode</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={lightMode} onChange={e => setLightMode(e.target.checked)} />
                  <div className="w-10 h-5 bg-[#333] rounded-full peer peer-checked:bg-[#00AAFF] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#8E9299]">Headphones</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={headphoneMode} onChange={e => setHeadphoneMode(e.target.checked)} />
                  <div className="w-10 h-5 bg-[#333] rounded-full peer peer-checked:bg-[#FF4444] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-[#8E9299]">Performance</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={performanceMode} onChange={e => setPerformanceMode(e.target.checked)} />
                  <div className="w-10 h-5 bg-[#333] rounded-full peer peer-checked:bg-[#FF8800] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setExportFormat('mp3')} className={`py-2 rounded-lg text-xs font-black border transition-all ${exportFormat === 'mp3' ? 'bg-[#00AAFF] border-[#00AAFF] text-white' : 'border-[#333] text-[#8E9299]'}`}>MP3</button>
                <button onClick={() => setExportFormat('wav')} className={`py-2 rounded-lg text-xs font-black border transition-all ${exportFormat === 'wav' ? 'bg-[#00AAFF] border-[#00AAFF] text-white' : 'border-[#333] text-[#8E9299]'}`}>WAV</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className={`lg:col-span-3 p-6 rounded-2xl border space-y-6 transition-all ${lightMode ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#1a1b20] border-[#333]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={async () => { await Tone.start(); playSound(); }} className="w-16 h-16 bg-[#00AAFF] hover:bg-[#0099EE] text-white rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95"><Play size={28} fill="white" className="ml-1" /></button>
                <button onClick={async () => { await Tone.start(); randomizeParams(); }} className="h-10 px-4 rounded-xl font-black text-xs transition-all border border-[#00AAFF]/30 text-[#00AAFF] hover:bg-[#00AAFF]/10 flex items-center gap-2">
                  DICE
                </button>
                <div className={`font-mono text-xl font-black ${lightMode ? 'text-black' : 'text-white'}`}>{synthType.toUpperCase()} @ {pitch}</div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-[10px] font-black text-[#8E9299] uppercase tracking-widest italic opacity-60">Export Tool</span>
                  <div className={`flex items-center gap-2 p-1.5 border rounded-2xl transition-all shadow-sm ${lightMode ? 'bg-gray-50 border-gray-200' : 'bg-[#151619] border-[#333]'}`}>
                    <div className="flex bg-black/20 p-1 rounded-xl">
                      <button 
                        onClick={() => setExportFormat('mp3')} 
                        className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all ${exportFormat === 'mp3' ? 'bg-[#00AAFF] text-white shadow-lg' : 'text-[#8E9299] hover:text-white'}`}
                      >MP3</button>
                      <button 
                        onClick={() => setExportFormat('wav')} 
                        className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all ${exportFormat === 'wav' ? 'bg-[#00AAFF] text-white shadow-lg' : 'text-[#8E9299] hover:text-white'}`}
                      >WAV</button>
                    </div>

                    <div className="flex gap-1 border-x px-2 mx-1 border-[#333]">
                      <button 
                        onClick={() => setExportMode('sound')} 
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${exportMode === 'sound' ? 'bg-[#00AAFF]/20 text-[#00AAFF]' : 'text-[#8E9299] hover:text-white'}`}
                      >SINGLE</button>
                      <button 
                        onClick={() => setExportMode('sequence')} 
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${exportMode === 'sequence' ? 'bg-[#AA00FF]/20 text-[#AA00FF]' : 'text-[#8E9299] hover:text-white'}`}
                      >SEQUENCE</button>
                    </div>

                    {/* Combined Export/Download Button */}
                    <button 
                      onClick={() => recordedBlob ? downloadBlob(recordedBlob, `${sfxName}_live`, exportFormat) : exportAudio(exportMode, exportFormat)} 
                      disabled={isDownloading}
                      className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${recordedBlob ? 'bg-[#FF4444] text-white' : 'bg-[#00AAFF] text-white hover:bg-[#0099EE]'}`}
                    >
                      <Download size={12} />
                      {isDownloading ? 'EXPORTING...' : (recordedBlob ? 'DOWNLOAD REC' : 'DOWNLOAD')}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleToggleRecord}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-black text-xs transition-all ${
                    isRecording? 'bg-[#FF4444] text-white shadow-[0_0_20px_rgba(255,44,44,0.5)] border-transparent' : `border border-[#FF4444]/30 text-[#FF4444] ${lightMode ? 'bg-white' : 'bg-[#151619]'}`
                  }`}
                >
                  <Circle size={14} fill="currentColor" className={isRecording ? 'animate-pulse' : ''} />
                  {isRecording? 'STOP REC' : 'REC LIVE'}
                </button>
              </div>
            </div>
            <div className={`h-24 rounded-xl border overflow-hidden transition-all ${lightMode ? 'bg-gray-100 border-gray-300' : 'bg-[#0a0a0c] border-[#333]'}`}><canvas ref={canvasRef} width={800} height={100} className="w-full h-full opacity-60" /></div>
          </div>

          <ControlGroup label="Presets" icon={<Zap size={14} className="text-[#00AAFF]" />} className={lightMode ? 'bg-white border-gray-200' : ''}>
            <div className="grid grid-cols-2 gap-2">
              {['kick', 'snare', 'laser', 'explosion', 'coin', 'jump'].map(p => (
                <button key={p} onClick={async () => { await Tone.start(); applyPreset(p); }} className={`py-2.5 border rounded-lg text-[9px] font-black uppercase transition-all ${lightMode ? 'bg-gray-50 border-gray-200 hover:bg-[#00AAFF]/10 text-gray-700' : 'bg-[#1a1b20] border-[#333] hover:bg-[#00AAFF]/20 text-white'}`}>{p}</button>
              ))}
            </div>
          </ControlGroup>
        </div>

        <section className={`mb-8 p-6 rounded-2xl border transition-all ${lightMode ? 'bg-white border-gray-200 shadow-md' : 'bg-[#1a1b20] border-[#333]'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3"><Activity size={20} className="text-[#00AAFF]" /><h2 className={`text-sm font-black italic tracking-widest ${lightMode ? 'text-black' : 'text-white'}`}>MINI SEQUENCER</h2></div>
            <div className="flex items-center gap-4">
              <input type="number" value={seqBpm} onChange={e => setSeqBpm(Number(e.target.value))} className={`w-16 rounded-lg px-2 py-1 text-xs font-mono font-black transition-all ${lightMode ? 'bg-gray-50 border-gray-200 text-[#00AAFF]' : 'bg-[#1a1b20] border-[#333] text-[#00AAFF]'}`} />
              <button onClick={toggleSeq} className={`h-12 px-8 rounded-xl font-black text-xs transition-all flex items-center gap-3 ${isPlayingSeq ? 'bg-[#FF4444]' : 'bg-[#00AAFF]'} text-white`}>
                {isPlayingSeq ? <Square size={16} fill="white" /> : <Play size={16} fill="white" />}{isPlayingSeq ? 'STOP' : 'PLAY'}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            {sequence.map((step, i) => (
              <div key={i} className="flex-1 flex flex-col gap-2">
                <button
                  onClick={async () => {
                    await Tone.start();
                    const newSeq = [...sequence];
                    newSeq[i] = { ...newSeq[i], active: !newSeq[i].active };
                    setSequence(newSeq);
                    if (newSeq[i].active) step.lockedState ? playSnapshot(step.lockedState, Tone.now()) : playSound();
                  }}
                  className={`h-14 rounded-lg border-2 transition-all flex items-center justify-center relative ${playheadPos === i ? 'ring-2 ring-[#00AAFF]/50' : ''} ${step.active ? (step.lockedState ? 'bg-[#AA00FF] border-[#AA00FF]' : 'bg-[#00AAFF] border-[#00AAFF]') : (lightMode ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1b20] border-[#333]')}`}
                >
                  {step.lockedState && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                </button>
                <button 
                  onClick={() => {
                    const newSeq = [...sequence];
                    if (newSeq[i].lockedState) {
                      newSeq[i].lockedState = undefined;
                    } else {
                      newSeq[i].lockedState = { 
                        synthType, oscType, attack, decay, sustain, release, pitch, 
                        pitchDecay, pitchSweep, sweepTime, noiseType, noiseMix, subMix, 
                        fxParams: { filterFreq, filterRes, fxDist, fxBitcrush, fxReverb, fxDelay } 
                      };
                    }
                    setSequence(newSeq);
                  }}
                  className={`text-[8px] font-black py-1 rounded-md border transition-all ${step.lockedState ? 'bg-[#AA00FF]/20 text-[#AA00FF] border-[#AA00FF]' : (lightMode ? 'bg-gray-50 text-gray-400 border-gray-200' : 'bg-[#151619] text-[#8E9299] border-[#333]')}`}
                >{step.lockedState ? 'CLR' : 'SAV'}</button>
              </div>
            ))}
          </div>
        </section>

        <div className={`rounded-2xl border overflow-hidden shadow-2xl transition-all ${lightMode ? 'bg-white border-gray-200' : 'bg-[#1a1b20] border-[#333]'}`}>
          <div className={`flex border-b transition-all ${lightMode ? 'bg-gray-50 border-gray-200' : 'bg-[#242424] border-[#333]'}`}>
            {['generator', 'envelope', 'effects', 'layers'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 text-[10px] font-black transition-all ${activeTab === tab ? `bg-transparent text-[#00AAFF] border-b-2 border-[#00AAFF]` : `${lightMode ? 'text-gray-400' : 'text-[#8E9299]'} hover:bg-black/5`}`}>{tab.toUpperCase()}</button>
            ))}
          </div>
          <div className="p-8">
            {activeTab === 'generator' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-[#8E9299] uppercase tracking-widest mb-3">Engine</label>
                    <select value={synthType} onChange={e => setSynthType(e.target.value)} className={`w-full border rounded-xl p-4 text-xs font-bold appearance-none cursor-pointer transition-all ${lightMode ? 'bg-gray-50 border-gray-200 text-black' : 'bg-[#1a1b20] border-[#333] text-white'}`}><option value="synth">Basic</option><option value="fm">FM (Metal)</option><option value="am">AM (Buzzy)</option><option value="membrane">Membrane (Drum)</option><option value="metal">Cymbal</option></select>
                  </div>
                  {synthType !== 'noise' && (
                    <div className="grid grid-cols-2 gap-2">
                    {['sine', 'square', 'triangle', 'sawtooth'].map(shape => (<button key={shape} onClick={() => setOscType(shape)} className={`py-3 rounded-lg text-[10px] font-black uppercase border transition-all ${oscType === shape ? 'bg-[#00AAFF] border-[#00AAFF] text-white' : (lightMode ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-[#1a1b20] border-[#333] text-white')}`}>{shape}</button>))}
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <div><label className="block text-[10px] font-black text-[#8E9299] uppercase tracking-widest mb-3">Pitch</label><input type="text" value={pitch} onChange={e => setPitch(e.target.value)} className={`w-full border rounded-xl p-4 text-center font-black transition-all ${lightMode ? 'bg-gray-50 border-gray-200 text-[#00AAFF]' : 'bg-[#1a1b20] border-[#333] text-[#00AAFF]'}`} /></div>
                  <div className="flex gap-2">{['up', 'none', 'down'].map(s => (<button key={s} onClick={() => setPitchSweep(s as any)} className={`flex-1 py-2 rounded-lg text-[10px] font-black border transition-all ${pitchSweep === s ? 'bg-[#AA00FF] border-[#AA00FF] text-white' : (lightMode ? 'bg-gray-50 border-gray-200 text-gray-400' : 'border-[#333] text-[#8E9299]')}`}>{s.toUpperCase()}</button>))}</div>
                </div>
              </div>
            )}
            {activeTab === 'envelope' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[ { label: 'A', val: attack, set: setAttack, max: 2 }, { label: 'D', val: decay, set: setDecay, max: 2 }, { label: 'S', val: sustain, set: setSustain, max: 1 }, { label: 'R', val: release, set: setRelease, max: 5 } ].map(p => (
                  <div key={p.label} className="space-y-3"><div className={`flex justify-between text-[10px] font-black ${lightMode ? 'text-gray-500' : ''}`}><span>{p.label}</span><span>{p.val.toFixed(2)}s</span></div><input type="range" min="0.001" max={p.max} step="0.01" value={p.val} onChange={e => p.set(parseFloat(e.target.value))} className="w-full custom-slider" /></div>
                ))}
              </div>
            )}
            {activeTab === 'effects' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[ { label: 'FILTER', val: filterFreq, set: setFilterFreq, min: 20, max: 20000 }, { label: 'DISTORT', val: fxDist, set: setFxDist, min: 0, max: 1 }, { label: 'REVERB', val: fxReverb, set: setFxReverb, min: 0, max: 1 }, { label: 'DELAY', val: fxDelay, set: setFxDelay, min: 0, max: 1 } ].map(p => (
                  <div key={p.label} className="space-y-3"><div className={`flex justify-between text-[10px] font-black ${lightMode ? 'text-gray-500' : ''}`}><span>{p.label}</span></div><input type="range" min={p.min} max={p.max} step="0.01" value={p.val} onChange={e => p.set(parseFloat(e.target.value))} className="w-full custom-slider" /></div>
                ))}
              </div>
            )}
            {activeTab === 'layers' && (
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4"><label className="text-[10px] font-black uppercase text-[#8E9299]">Noise Layer</label><input type="range" min="0" max="1" step="0.01" value={noiseMix} onChange={e => setNoiseMix(parseFloat(e.target.value))} className="w-full custom-slider" /></div>
                <div className="space-y-4"><label className="text-[10px] font-black uppercase text-[#8E9299]">Sub Layer</label><input type="range" min="0" max="1" step="0.01" value={subMix} onChange={e => setSubMix(parseFloat(e.target.value))} className="w-full custom-slider" /></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
