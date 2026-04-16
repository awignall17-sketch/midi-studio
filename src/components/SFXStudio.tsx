import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Mp3Encoder } from '@breezystack/lamejs';
import { Play, Square, Download, ArrowLeft, Circle, BookOpen, X } from 'lucide-react';
import { audioBufferToWav } from '../utils';

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
};

export type SFXStep = {
  active: boolean;
  lockedState?: SFXSnapshot;
};

export default function SFXStudio({ onBack }: { onBack: () => void }) {
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
  const [showGuide, setShowGuide] = useState(false);
  
  const [sequence, setSequence] = useState<SFXStep[]>(Array(8).fill({ active: false }));
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [seqBpm, setSeqBpm] = useState(120);
  const seqRef = useRef<Tone.Sequence | null>(null);

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

      updateSynth();
      
      const drawWaveform = () => {
        if (!canvasRef.current || !waveformRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const values = waveformRef.current.getValue();
        
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00AAFF';
        
        for (let i = 0; i < values.length; i++) {
          const x = (i / (values.length - 1)) * width;
          const y = ((values[i] as number) + 1) / 2 * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        animationRef.current = requestAnimationFrame(drawWaveform);
      };
      drawWaveform();
    };
    initAudio();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (synthRef.current) synthRef.current.dispose();
      if (noiseSynthRef.current) noiseSynthRef.current.dispose();
      if (subSynthRef.current) subSynthRef.current.dispose();
      if (filterRef.current) filterRef.current.dispose();
      if (reverbRef.current) reverbRef.current.dispose();
      if (delayRef.current) delayRef.current.dispose();
      if (distRef.current) distRef.current.dispose();
      if (bitcrusherRef.current) bitcrusherRef.current.dispose();
      if (chorusRef.current) chorusRef.current.dispose();
      if (phaserRef.current) phaserRef.current.dispose();
      if (autoFilterRef.current) autoFilterRef.current.dispose();
      if (tremoloRef.current) tremoloRef.current.dispose();
      if (pitchShiftRef.current) pitchShiftRef.current.dispose();
      if (vibratoRef.current) vibratoRef.current.dispose();
      if (eqRef.current) eqRef.current.dispose();
      if (compRef.current) compRef.current.dispose();
      if (recorderRef.current) recorderRef.current.dispose();
      if (waveformRef.current) waveformRef.current.dispose();
      if (seqRef.current) seqRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    updateSynth();
  }, [synthType, oscType, noiseType]);

  useEffect(() => {
    const envelope = { 
      attack: Math.max(0.005, attack), 
      decay: Math.max(0.01, decay), 
      sustain, 
      release: Math.max(0.01, release) 
    };
    if (synthRef.current) {
      if (synthRef.current.envelope) {
        synthRef.current.envelope.set(envelope);
      }
      if (synthType === 'membrane' && synthRef.current.pitchDecay !== undefined) {
        synthRef.current.pitchDecay = pitchDecay;
      }
    }
    if (noiseSynthRef.current && noiseSynthRef.current.envelope) {
      noiseSynthRef.current.envelope.set(envelope);
    }
  }, [attack, decay, sustain, release, pitchDecay, synthType]);

  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.frequency.value = filterFreq;
      filterRef.current.Q.value = filterRes;
    }
  }, [filterFreq, filterRes]);

  useEffect(() => {
    if (reverbRef.current) reverbRef.current.wet.value = fxReverb;
    if (delayRef.current) delayRef.current.wet.value = fxDelay;
    if (distRef.current) distRef.current.wet.value = fxDist;
    if (bitcrusherRef.current) bitcrusherRef.current.wet.value = fxBitcrush;
    if (chorusRef.current) chorusRef.current.wet.value = fxChorus;
    if (phaserRef.current) phaserRef.current.wet.value = fxPhaser;
    if (autoFilterRef.current) autoFilterRef.current.wet.value = fxAutoFilter;
    if (pitchShiftRef.current) pitchShiftRef.current.pitch = fxPitchShift;
    if (tremoloRef.current) {
      tremoloRef.current.frequency.value = fxTremoloFreq;
      tremoloRef.current.depth.value = fxTremoloDepth;
    }
  }, [fxReverb, fxDelay, fxDist, fxBitcrush, fxChorus, fxPhaser, fxAutoFilter, fxPitchShift, fxTremoloFreq, fxTremoloDepth]);

  useEffect(() => {
    if (vibratoRef.current) {
      vibratoRef.current.frequency.value = vibratoFreq;
      vibratoRef.current.depth.value = vibratoDepth;
    }
  }, [vibratoFreq, vibratoDepth]);

  useEffect(() => {
    if (eqRef.current) {
      eqRef.current.low.value = eqLow;
      eqRef.current.mid.value = eqMid;
      eqRef.current.high.value = eqHigh;
    }
  }, [eqLow, eqMid, eqHigh]);

  useEffect(() => {
    if (compRef.current) {
      compRef.current.threshold.value = compThreshold;
      compRef.current.ratio.value = compRatio;
    }
  }, [compThreshold, compRatio]);

  useEffect(() => {
    if (noiseSynthRef.current) {
      noiseSynthRef.current.volume.value = noiseMix > 0 ? Tone.gainToDb(noiseMix) : -Infinity;
    }
    if (subSynthRef.current) {
      subSynthRef.current.volume.value = subMix > 0 ? Tone.gainToDb(subMix) : -Infinity;
    }
  }, [noiseMix, subMix]);

  const updateSynth = () => {
    if (!vibratoRef.current) return;
    
    if (synthRef.current) synthRef.current.dispose();
    if (noiseSynthRef.current) noiseSynthRef.current.dispose();
    if (subSynthRef.current) subSynthRef.current.dispose();

    const envelope = { 
      attack: Math.max(0.005, attack), 
      decay: Math.max(0.01, decay), 
      sustain, 
      release: Math.max(0.01, release) 
    };

    switch (synthType) {
      case 'synth':
        synthRef.current = new Tone.Synth({ oscillator: { type: oscType as any }, envelope }).connect(vibratoRef.current);
        break;
      case 'fm':
        synthRef.current = new Tone.FMSynth({ oscillator: { type: oscType as any }, envelope }).connect(vibratoRef.current);
        break;
      case 'am':
        synthRef.current = new Tone.AMSynth({ oscillator: { type: oscType as any }, envelope }).connect(vibratoRef.current);
        break;
      case 'membrane':
        synthRef.current = new Tone.MembraneSynth({ pitchDecay, oscillator: { type: oscType as any }, envelope }).connect(vibratoRef.current);
        break;
      case 'noise':
        synthRef.current = new Tone.NoiseSynth({ noise: { type: noiseType as any }, envelope }).connect(vibratoRef.current);
        break;
      case 'metal':
        synthRef.current = new Tone.MetalSynth({ envelope }).connect(vibratoRef.current);
        break;
    }

    noiseSynthRef.current = new Tone.NoiseSynth({
      noise: { type: noiseType as any },
      envelope,
      volume: noiseMix > 0 ? Tone.gainToDb(noiseMix) : -Infinity
    }).connect(vibratoRef.current);

    subSynthRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
      volume: subMix > 0 ? Tone.gainToDb(subMix) : -Infinity
    }).connect(vibratoRef.current);
  };

  useEffect(() => {
    Tone.Transport.bpm.value = seqBpm;
  }, [seqBpm]);

  useEffect(() => {
    if (seqRef.current) {
      seqRef.current.dispose();
    }
    
    seqRef.current = new Tone.Sequence((time, stepIndex) => {
      Tone.Draw.schedule(() => {
        const currentEls = document.getElementsByClassName('sfx-step-current');
        while(currentEls.length > 0) {
          currentEls[0].classList.remove('sfx-step-current', 'ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-[#242424]');
        }
        const nextEls = document.getElementsByClassName(`sfx-step-${stepIndex}`);
        for (let i = 0; i < nextEls.length; i++) {
          nextEls[i].classList.add('sfx-step-current', 'ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-[#242424]');
        }
      }, time);
      
      if (sequence[stepIndex]?.active) {
        if (sequence[stepIndex].lockedState) {
          playSnapshot(sequence[stepIndex].lockedState, time);
        } else {
          playSound(time);
        }
      }
    }, Array.from({ length: 8 }, (_, i) => i), "8n");
    
    if (isPlayingSeq) {
      seqRef.current.start(0);
    }
    
    return () => {
      if (seqRef.current) seqRef.current.dispose();
    };
  }, [sequence, isPlayingSeq, synthType, oscType, attack, decay, sustain, release, pitch, pitchSweep, sweepTime, noiseType, pitchDecay]);

  const playSnapshot = (snap: SFXSnapshot, time: number) => {
    if (!vibratoRef.current) return;
    
    const envelope = { attack: Math.max(0.005, snap.attack), decay: Math.max(0.01, snap.decay), sustain: snap.sustain, release: Math.max(0.01, snap.release) };
    let tempSynth: any;
    let tempNoise: any;
    let tempSub: any;

    try {
      switch (snap.synthType) {
        case 'synth': tempSynth = new Tone.Synth({ oscillator: { type: snap.oscType as any }, envelope }).connect(vibratoRef.current); break;
        case 'fm': tempSynth = new Tone.FMSynth({ oscillator: { type: snap.oscType as any }, envelope }).connect(vibratoRef.current); break;
        case 'am': tempSynth = new Tone.AMSynth({ oscillator: { type: snap.oscType as any }, envelope }).connect(vibratoRef.current); break;
        case 'membrane': tempSynth = new Tone.MembraneSynth({ pitchDecay: snap.pitchDecay, oscillator: { type: snap.oscType as any }, envelope }).connect(vibratoRef.current); break;
        case 'noise': tempSynth = new Tone.NoiseSynth({ noise: { type: snap.noiseType as any }, envelope }).connect(vibratoRef.current); break;
        case 'metal': tempSynth = new Tone.MetalSynth({ envelope }).connect(vibratoRef.current); break;
      }
      
      if (snap.noiseMix > 0) {
        tempNoise = new Tone.NoiseSynth({ noise: { type: snap.noiseType as any }, envelope, volume: Tone.gainToDb(snap.noiseMix) }).connect(vibratoRef.current);
      }
      if (snap.subMix > 0) {
        tempSub = new Tone.MembraneSynth({ pitchDecay: 0.05, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }, volume: Tone.gainToDb(snap.subMix) }).connect(vibratoRef.current);
      }

      if (snap.synthType === 'noise' || snap.synthType === 'metal') {
        tempSynth.triggerAttackRelease('16n', time);
      } else {
        const freq = Tone.Frequency(snap.pitch).toFrequency();
        try { tempSynth.frequency.setValueAtTime(freq, time); } catch(e){}
        tempSynth.triggerAttackRelease(snap.pitch, '16n', time);
        
        if (snap.pitchSweep === 'up') {
          tempSynth.frequency.linearRampToValueAtTime(Tone.Frequency(snap.pitch).transpose(24).toFrequency(), time + snap.sweepTime);
        } else if (snap.pitchSweep === 'down') {
          tempSynth.frequency.linearRampToValueAtTime(Tone.Frequency(snap.pitch).transpose(-24).toFrequency(), time + snap.sweepTime);
        }
      }

      if (tempNoise) tempNoise.triggerAttackRelease('16n', time);
      if (tempSub) tempSub.triggerAttackRelease('C2', '16n', time);

      // Clean up synths after plays
      const duration = (snap.attack + snap.decay + snap.release + 2) * 1000;
      setTimeout(() => {
        tempSynth?.dispose();
        tempNoise?.dispose();
        tempSub?.dispose();
      }, duration);
    } catch (e) {
      console.warn("Failed to play snapshot", e);
    }
  };

  const playSound = async (time?: number | React.MouseEvent) => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    if (synthRef.current) {
      const t = typeof time === 'number' ? time : Tone.now() + 0.02;
      if (synthType === 'noise' || synthType === 'metal') {
        synthRef.current.triggerAttackRelease('16n', t);
      } else {
        try {
          const freq = Tone.Frequency(pitch).toFrequency();
          try {
            synthRef.current.frequency.setValueAtTime(freq, t);
          } catch (e) {} // Some synths might not support setValueAtTime directly
          synthRef.current.triggerAttackRelease(pitch, '16n', t);
          
          if (pitchSweep === 'up') {
            synthRef.current.frequency.linearRampToValueAtTime(Tone.Frequency(pitch).transpose(24).toFrequency(), t + sweepTime);
          } else if (pitchSweep === 'down') {
            synthRef.current.frequency.linearRampToValueAtTime(Tone.Frequency(pitch).transpose(-24).toFrequency(), t + sweepTime);
          }
        } catch (e) {
          console.warn("Invalid pitch:", pitch);
        }
      }

      if (noiseMix > 0 && noiseSynthRef.current) {
        noiseSynthRef.current.triggerAttackRelease('16n', t);
      }
      if (subMix > 0 && subSynthRef.current) {
        subSynthRef.current.triggerAttackRelease('C2', '16n', t);
      }
    }
  };

  const toggleSeq = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    if (isPlayingSeq) {
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      setIsPlayingSeq(false);
      const currentEls = document.getElementsByClassName('sfx-step-current');
      while(currentEls.length > 0) {
        currentEls[0].classList.remove('sfx-step-current', 'ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-[#242424]');
      }
    } else {
      Tone.Transport.start();
      setIsPlayingSeq(true);
    }
  };

  const [randomizeTrigger, setRandomizeTrigger] = useState(0);

  useEffect(() => {
    if (randomizeTrigger > 0) {
      playSound();
    }
  }, [randomizeTrigger]);

  const randomize = () => {
    const synths = ['synth', 'fm', 'am', 'membrane', 'noise', 'metal'];
    const oscs = ['sine', 'square', 'triangle', 'sawtooth'];
    const sweeps = ['none', 'up', 'down'];
    const noises = ['white', 'pink', 'brown'];
    const notes = ['C2', 'C3', 'C4', 'C5', 'C6', 'G2', 'G3', 'G4', 'G5', 'F#3', 'A4'];
    
    setSynthType(synths[Math.floor(Math.random() * synths.length)]);
    setOscType(oscs[Math.floor(Math.random() * oscs.length)]);
    setNoiseType(noises[Math.floor(Math.random() * noises.length)]);
    setPitch(notes[Math.floor(Math.random() * notes.length)]);
    setPitchSweep(sweeps[Math.floor(Math.random() * sweeps.length)] as any);
    
    setAttack(Math.random() * 0.5 + 0.001);
    setDecay(Math.random() * 0.8 + 0.01);
    setSustain(Math.random());
    setRelease(Math.random() * 2 + 0.01);
    
    setSweepTime(Math.random() * 0.5 + 0.05);
    
    setFilterFreq(Math.random() * 19000 + 1000);
    setFilterRes(Math.random() * 10);
    
    setFxDist(Math.random() > 0.7 ? Math.random() * 0.8 : 0);
    setFxBitcrush(Math.random() > 0.7 ? Math.random() * 0.8 : 0);
    setFxChorus(Math.random() > 0.7 ? Math.random() * 0.8 : 0);
    setFxPhaser(Math.random() > 0.7 ? Math.random() * 0.8 : 0);
    setFxAutoFilter(Math.random() > 0.7 ? Math.random() * 0.8 : 0);
    setFxDelay(Math.random() > 0.7 ? Math.random() * 0.5 : 0);
    setFxReverb(Math.random() > 0.7 ? Math.random() * 0.5 : 0);
    
    setVibratoFreq(Math.random() * 20);
    setVibratoDepth(Math.random() > 0.7 ? Math.random() : 0);
    
    setFxPitchShift(Math.random() > 0.7 ? Math.floor(Math.random() * 24) - 12 : 0);
    setFxTremoloFreq(Math.random() * 20);
    setFxTremoloDepth(Math.random() > 0.7 ? Math.random() : 0);

    setEqLow(Math.random() * 24 - 12);
    setEqMid(Math.random() * 24 - 12);
    setEqHigh(Math.random() * 24 - 12);

    setNoiseMix(Math.random() > 0.5 ? Math.random() : 0);
    setSubMix(Math.random() > 0.5 ? Math.random() : 0);
    setCompThreshold(Math.random() * -60);
    setCompRatio(Math.random() * 19 + 1);

    setRandomizeTrigger(prev => prev + 1);
  };

  const reset = () => {
    setSynthType('synth');
    setOscType('sine');
    setAttack(0.01);
    setDecay(0.1);
    setSustain(0.5);
    setRelease(1);
    setPitch('C4');
    setPitchDecay(0.05);
    setPitchSweep('none');
    setSweepTime(0.2);
    setNoiseType('white');
    setFilterFreq(20000);
    setFilterRes(0);
    setFxReverb(0);
    setFxDelay(0);
    setFxDist(0);
    setFxBitcrush(0);
    setFxTremoloFreq(5);
    setFxTremoloDepth(0);
    setFxPitchShift(0);
    setFxChorus(0);
    setFxPhaser(0);
    setFxAutoFilter(0);
    setVibratoFreq(5);
    setVibratoDepth(0);
    setEqLow(0);
    setEqMid(0);
    setEqHigh(0);
    setNoiseMix(0);
    setSubMix(0);
    setCompThreshold(-24);
    setCompRatio(1);
    setSequence(Array(8).fill(false));
    setSeqBpm(120);
    
    if (isPlayingSeq) {
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      setIsPlayingSeq(false);
      const currentEls = document.getElementsByClassName('sfx-step-current');
      while(currentEls.length > 0) {
        currentEls[0].classList.remove('sfx-step-current', 'ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-[#242424]');
      }
    }
  };

  const applyPreset = (preset: string) => {
    setFxTremoloDepth(0);
    setFxPitchShift(0);
    setFxChorus(0);
    setFxPhaser(0);
    setFxAutoFilter(0);
    setEqLow(0);
    setEqMid(0);
    setEqHigh(0);
    setNoiseMix(0);
    setSubMix(0);
    setCompThreshold(-24);
    setCompRatio(1);

    switch (preset) {
      case 'coin':
        setSynthType('synth'); setOscType('square'); setAttack(0.01); setDecay(0.3); setSustain(0); setRelease(0.1); setPitch('B5'); setPitchSweep('none'); setFilterFreq(20000); setFxDelay(0); setFxReverb(0); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0);
        break;
      case 'jump':
        setSynthType('synth'); setOscType('sine'); setAttack(0.01); setDecay(0.4); setSustain(0); setRelease(0.1); setPitch('C4'); setPitchSweep('up'); setSweepTime(0.2); setFilterFreq(20000); setFxDelay(0); setFxReverb(0); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0);
        break;
      case 'laser':
        setSynthType('synth'); setOscType('sawtooth'); setAttack(0.01); setDecay(0.2); setSustain(0); setRelease(0.1); setPitch('C6'); setPitchSweep('down'); setSweepTime(0.1); setFilterFreq(20000); setFxDelay(0.2); setFxReverb(0.1); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0);
        break;
      case 'hit':
        setSynthType('noise'); setNoiseType('white'); setAttack(0.01); setDecay(0.2); setSustain(0); setRelease(0.1); setFilterFreq(1000); setFilterRes(0); setFxDelay(0); setFxReverb(0); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0); setNoiseMix(0.5); setSubMix(0.8); setEqLow(10); setCompThreshold(-40); setCompRatio(8);
        break;
      case 'powerup':
        setSynthType('fm'); setOscType('sine'); setAttack(0.05); setDecay(0.5); setSustain(0.2); setRelease(0.5); setPitch('C4'); setPitchSweep('up'); setSweepTime(0.4); setFilterFreq(5000); setFxDelay(0.3); setFxReverb(0.2); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0);
        break;
      case 'explosion':
        setSynthType('noise'); setNoiseType('brown'); setAttack(0.005); setDecay(0.4); setSustain(0.1); setRelease(2.0); setFilterFreq(600); setFilterRes(0); setFxDist(0.8); setFxBitcrush(0.3); setFxDelay(0.1); setFxReverb(0.4); setVibratoDepth(0); setNoiseMix(0.9); setSubMix(1); setEqLow(18); setEqHigh(2); setCompThreshold(-40); setCompRatio(14); setFxTremoloDepth(0.4); setFxTremoloFreq(20);
        break;
      case 'water':
        setSynthType('noise'); setNoiseType('pink'); setAttack(0.2); setDecay(0.8); setSustain(0.5); setRelease(1.5); setFilterFreq(1200); setFilterRes(6); setFxAutoFilter(0.9); setFxChorus(0.6); setFxPhaser(0.5); setFxDelay(0.4); setFxReverb(0.5); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0); setNoiseMix(1); setSubMix(0); setFxTremoloFreq(5);
        break;
      case 'magic':
        setSynthType('fm'); setOscType('sine'); setAttack(0.1); setDecay(0.5); setSustain(0.4); setRelease(2.0); setPitch('C5'); setPitchSweep('up'); setSweepTime(0.8); setFilterFreq(10000); setFilterRes(2); setFxAutoFilter(0); setFxChorus(0.6); setFxPhaser(0.8); setFxDelay(0.4); setFxReverb(0.8); setFxTremoloDepth(0.6); setFxTremoloFreq(15); setVibratoDepth(0.2); setNoiseMix(0.2); setNoiseType('white'); setSubMix(0);
        break;
      case 'wind':
        setSynthType('noise'); setNoiseType('pink'); setAttack(1.5); setDecay(1); setSustain(1); setRelease(3); setFilterFreq(1000); setFilterRes(1.5); setFxAutoFilter(0.7); setFxPhaser(0.6); setFxChorus(0); setFxDelay(0); setFxReverb(0.6); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0); setNoiseMix(1); setSubMix(0.1); setFxTremoloFreq(0.5); setFxTremoloDepth(0.8);
        break;
      case 'select':
        setSynthType('synth'); setOscType('sine'); setAttack(0.001); setDecay(0.1); setSustain(0); setRelease(0.1); setPitch('C6'); setPitchSweep('none'); setFilterFreq(20000); setFxDelay(0); setFxReverb(0); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0);
        break;
      case 'error':
        setSynthType('synth'); setOscType('sawtooth'); setAttack(0.01); setDecay(0.1); setSustain(0.5); setRelease(0.2); setPitch('C2'); setPitchSweep('none'); setFilterFreq(2000); setFxDist(0.8); setFxBitcrush(0.5); setFxDelay(0); setFxReverb(0); setVibratoDepth(0); setSubMix(0.5);
        break;
      case 'ufo':
        setSynthType('synth'); setOscType('sine'); setAttack(0.5); setDecay(0.5); setSustain(1); setRelease(1); setPitch('C4'); setPitchSweep('none'); setFilterFreq(20000); setVibratoFreq(10); setVibratoDepth(0.5); setFxDelay(0.4); setFxReverb(0.4); setFxDist(0); setFxBitcrush(0); setFxTremoloDepth(0.5); setFxTremoloFreq(8);
        break;
      case 'click':
        setSynthType('synth'); setOscType('sine'); setAttack(0.001); setDecay(0.02); setSustain(0); setRelease(0.01); setPitch('C6'); setPitchSweep('none'); setFilterFreq(20000); setFxDelay(0); setFxReverb(0); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0); setNoiseMix(0); setSubMix(0);
        break;
      case 'button':
        setSynthType('synth'); setOscType('square'); setAttack(0.005); setDecay(0.05); setSustain(0); setRelease(0.05); setPitch('G4'); setPitchSweep('down'); setSweepTime(0.05); setFilterFreq(5000); setFxDelay(0); setFxReverb(0.05); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0); setNoiseMix(0.1); setSubMix(0);
        break;
      case 'heavy_hit':
        setSynthType('noise'); setNoiseType('brown'); setAttack(0.001); setDecay(0.4); setSustain(0); setRelease(0.2); setFilterFreq(500); setFilterRes(0); setFxDelay(0); setFxReverb(0.1); setFxDist(0.8); setFxBitcrush(0); setVibratoDepth(0); setNoiseMix(0.8); setSubMix(1); setEqLow(15); setCompThreshold(-40); setCompRatio(12);
        break;
      case 'ui_hover':
        setSynthType('synth'); setOscType('sine'); setAttack(0.01); setDecay(0.05); setSustain(0); setRelease(0.05); setPitch('E5'); setPitchSweep('up'); setSweepTime(0.05); setFilterFreq(20000); setFxDelay(0); setFxReverb(0); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0); setNoiseMix(0); setSubMix(0);
        break;
      case 'ui_confirm':
        setSynthType('fm'); setOscType('sine'); setAttack(0.01); setDecay(0.3); setSustain(0); setRelease(0.1); setPitch('C5'); setPitchSweep('up'); setSweepTime(0.1); setFilterFreq(20000); setFxDelay(0); setFxReverb(0.1); setFxDist(0); setFxBitcrush(0); setVibratoDepth(0); setNoiseMix(0); setSubMix(0);
        break;
    }
    setRandomizeTrigger(prev => prev + 1);
  };

  const toggleRecording = async () => {
    if (!recorderRef.current) return;
    
    if (isRecording) {
      const recording = await recorderRef.current.stop();
      setRecordedBlob(recording);
      setIsRecording(false);
    } else {
      setRecordedBlob(null);
      recorderRef.current.start();
      setIsRecording(true);
      if (!isPlayingSeq) {
        playSound();
      }
    }
  };

  const downloadRecording = async () => {
    if (!recordedBlob) return;
    setIsDownloading(true);
    try {
      const arrayBuffer = await recordedBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      if (exportFormat === 'mp3') {
        const channels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const mp3encoder = new Mp3Encoder(channels, sampleRate, 128);
        const mp3Data: Int8Array[] = [];
        
        const sampleBlockSize = 1152;
        const left = audioBuffer.getChannelData(0);
        const right = channels > 1 ? audioBuffer.getChannelData(1) : left;
        
        for (let i = 0; i < left.length; i += sampleBlockSize) {
          const leftChunk = left.subarray(i, i + sampleBlockSize);
          const rightChunk = right.subarray(i, i + sampleBlockSize);
          
          const leftInt16 = new Int16Array(leftChunk.length);
          const rightInt16 = new Int16Array(rightChunk.length);
          
          for (let j = 0; j < leftChunk.length; j++) {
            let l = leftChunk[j];
            let r = rightChunk[j];
            
            // Clamp values to [-1, 1] to prevent integer overflow/wrap-around
            if (l > 1) l = 1;
            if (l < -1) l = -1;
            if (r > 1) r = 1;
            if (r < -1) r = -1;
            
            leftInt16[j] = l < 0 ? l * 0x8000 : l * 0x7FFF;
            rightInt16[j] = r < 0 ? r * 0x8000 : r * 0x7FFF;
          }
          
          const mp3buf = channels === 1 ? mp3encoder.encodeBuffer(leftInt16) : mp3encoder.encodeBuffer(leftInt16, rightInt16);
          if (mp3buf.length > 0) mp3Data.push(mp3buf);
        }
        
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) mp3Data.push(mp3buf);
        
        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sfxName || 'sfx'}.mp3`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const wavBlob = audioBufferToWav(audioBuffer);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sfxName || 'sfx'}.wav`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to convert audio:", err);
      alert("Failed to convert audio to " + exportFormat.toUpperCase() + ". Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#151619] text-white font-mono p-8 relative">
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1b20] border border-[#333] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#333]">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="text-[#00AAFF]" /> SFX Studio Guide
              </h2>
              <button onClick={() => setShowGuide(false)} className="text-[#8E9299] hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar text-[#8E9299] space-y-6">
              <section>
                <h3 className="text-white font-bold text-lg mb-2">1. Generator & Layers</h3>
                <p>The Generator is the core of your sound. Choose a Synth Type (like FM, AM, or Noise) and an Oscillator Type (Sine, Square, Sawtooth). Use Noise for hits and explosions, and Synths for melodic sounds like coins or lasers.</p>
                <p className="mt-2"><strong>Layers:</strong> You can add a Sub Bass layer for deep impact and a Noise layer for extra texture and grit.</p>
              </section>
              <section>
                <h3 className="text-white font-bold text-lg mb-2">2. Envelope</h3>
                <p>The Envelope shapes the volume of your sound over time:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Attack:</strong> How fast the sound reaches full volume.</li>
                  <li><strong>Decay:</strong> How quickly it drops to the sustain level.</li>
                  <li><strong>Sustain:</strong> The volume level while holding the note.</li>
                  <li><strong>Release:</strong> How long the sound fades out after stopping.</li>
                </ul>
              </section>
              <section>
                <h3 className="text-white font-bold text-lg mb-2">3. Pitch & Sweep</h3>
                <p>Set the base Pitch (e.g., C4). Use Pitch Sweep to make the pitch slide UP (great for jumps/powerups) or DOWN (great for lasers/falls) over a specific Sweep Time.</p>
              </section>
              <section>
                <h3 className="text-white font-bold text-lg mb-2">4. Effects (FX)</h3>
                <p>Add character to your sound with effects. Distortion adds grit, Bitcrush gives a retro 8-bit feel, Delay adds echoes, and Reverb places the sound in a room. Modulation effects like Chorus, Phaser, AutoFilter, Tremolo, and Vibrato add movement and wobble.</p>
              </section>
              <section>
                <h3 className="text-white font-bold text-lg mb-2">5. Master (EQ & Dynamics)</h3>
                <p>Shape the final tone using the 3-band EQ (Low, Mid, High). Use the Compressor to control the dynamic range, making quiet parts louder and loud parts quieter for a more punchy, professional sound.</p>
              </section>
              <section>
                <h3 className="text-white font-bold text-lg mb-2">6. Mini Sequencer</h3>
                <p>Create rhythmic patterns by clicking the steps. Adjust the BPM to change the speed. Press PLAY SEQ to loop the pattern.</p>
              </section>
              <section>
                <h3 className="text-white font-bold text-lg mb-2">7. Recording & Export</h3>
                <p>Click RECORD to start capturing audio. The sound will play automatically. Click STOP REC when finished, then choose MP3 or WAV and click SAVE to download your sound effect.</p>
              </section>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-[#2A2B30] rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold tracking-tighter text-[#00AAFF]">SFX STUDIO</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={playSound}
              className="flex items-center gap-2 px-6 py-3 bg-[#00AAFF] hover:bg-[#33bbff] text-white font-bold rounded-lg transition-colors"
            >
              <Play size={20} /> PLAY SOUND
            </button>
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors ${
                isRecording ? 'bg-[#FF4444] hover:bg-[#ff5555] text-white' : 'bg-[#2A2B30] hover:bg-[#333] text-white'
              }`}
            >
              {isRecording ? <Square size={20} /> : <div className="w-3 h-3 rounded-full bg-[#FF4444]" />}
              {isRecording ? 'STOP REC' : 'RECORD'}
            </button>
            {recordedBlob && !isRecording && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sfxName}
                  onChange={e => setSfxName(e.target.value)}
                  placeholder="SFX Name"
                  className="bg-[#2A2B30] text-white px-3 py-3 rounded-lg border border-[#333] outline-none font-bold w-32"
                  disabled={isDownloading}
                />
                <select 
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value as 'mp3' | 'wav')}
                  className="bg-[#2A2B30] text-white px-3 py-3 rounded-lg border border-[#333] outline-none font-bold"
                  disabled={isDownloading}
                >
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                </select>
                <button
                  onClick={downloadRecording}
                  disabled={isDownloading}
                  className={`flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors ${
                    isDownloading ? 'bg-[#333] text-[#888] cursor-not-allowed' : 'bg-[#00AAFF] hover:bg-[#0099ee] text-white'
                  }`}
                >
                  <Download size={20} /> {isDownloading ? 'SAVING...' : 'SAVE'}
                </button>
              </div>
            )}
            
            <div className="flex-1" />
            
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-2 px-4 py-3 bg-[#2A2B30] hover:bg-[#333] text-[#8E9299] hover:text-white font-bold rounded-lg transition-colors"
            >
              <BookOpen size={20} /> GUIDE
            </button>
          </div>
        </div>

        <div className="mb-6 bg-[#242424] p-4 rounded-xl border border-[#333] flex flex-wrap items-center gap-4">
          <span className="text-sm font-bold text-[#8E9299]">PRESETS:</span>
          <button onClick={() => applyPreset('coin')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">COIN</button>
          <button onClick={() => applyPreset('jump')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">JUMP</button>
          <button onClick={() => applyPreset('laser')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">LASER</button>
          <button onClick={() => applyPreset('hit')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">HIT</button>
          <button onClick={() => applyPreset('heavy_hit')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">HEAVY HIT</button>
          <button onClick={() => applyPreset('powerup')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">POWERUP</button>
          <button onClick={() => applyPreset('explosion')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">EXPLOSION</button>
          <button onClick={() => applyPreset('water')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">WATER</button>
          <button onClick={() => applyPreset('magic')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">MAGIC</button>
          <button onClick={() => applyPreset('wind')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">WIND</button>
          <button onClick={() => applyPreset('select')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">SELECT</button>
          <button onClick={() => applyPreset('click')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">CLICK</button>
          <button onClick={() => applyPreset('button')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">BUTTON</button>
          <button onClick={() => applyPreset('ui_hover')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">UI HOVER</button>
          <button onClick={() => applyPreset('ui_confirm')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">UI CONFIRM</button>
          <button onClick={() => applyPreset('error')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">ERROR</button>
          <button onClick={() => applyPreset('ufo')} className="px-3 py-1 bg-[#2A2B30] hover:bg-[#333] rounded text-sm font-bold transition-colors">UFO</button>
          
          <div className="flex-1" />
          <button onClick={reset} className="px-4 py-1 bg-[#FF4444] hover:bg-[#ff5555] text-white rounded text-sm font-bold transition-colors">🔄 RESET</button>
          <button onClick={randomize} className="px-4 py-1 bg-[#8A2BE2] hover:bg-[#9d4edd] text-white rounded text-sm font-bold transition-colors">🎲 RANDOMIZE</button>
        </div>

        <div className="mb-6 bg-[#242424] p-4 rounded-xl border border-[#333]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#8E9299]">WAVEFORM</span>
          </div>
          <canvas ref={canvasRef} width={800} height={100} className="w-full h-[100px] bg-[#151619] rounded-lg border border-[#333]" />
        </div>

        <div className="mb-6 bg-[#242424] p-4 rounded-xl border border-[#333]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-[#8E9299]">MINI SEQUENCER</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#8E9299]">BPM</span>
                <input 
                  type="number" value={seqBpm} onChange={e => setSeqBpm(Number(e.target.value))}
                  className="w-16 bg-[#151619] border border-[#333] rounded px-2 py-1 text-xs"
                />
              </div>
              <button
                onClick={toggleSeq}
                className={`flex items-center gap-2 px-4 py-1.5 font-bold rounded transition-colors text-sm ${
                  isPlayingSeq ? 'bg-[#FF4444] text-white' : 'bg-[#00AAFF] text-white'
                }`}
              >
                {isPlayingSeq ? <Square size={14} /> : <Play size={14} />}
                {isPlayingSeq ? 'STOP' : 'PLAY SEQ'}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            {sequence.map((step, i) => (
              <div key={i} className="flex flex-col flex-1 gap-1">
                <button
                  onClick={() => {
                    const newSeq = [...sequence];
                    newSeq[i] = { ...newSeq[i], active: !newSeq[i].active };
                    setSequence(newSeq);
                    if (newSeq[i].active) {
                      newSeq[i].lockedState ? playSnapshot(newSeq[i].lockedState!, Tone.now()) : playSound();
                    }
                  }}
                  className={`sfx-step-${i} h-12 rounded-lg border-2 transition-all flex items-center justify-center ${
                    step.active ? (step.lockedState ? 'bg-[#AA00FF] border-[#AA00FF]' : 'bg-[#00AAFF] border-[#00AAFF]') : 'bg-[#151619] border-[#333] hover:border-[#555]'
                  }`}
                >
                  {step.lockedState && <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>}
                </button>
                <div className="flex gap-1 justify-center">
                  <button 
                    onClick={() => {
                      const newSeq = [...sequence];
                      if (newSeq[i].lockedState) {
                        newSeq[i].lockedState = undefined;
                      } else {
                        newSeq[i].lockedState = { synthType, oscType, attack, decay, sustain, release, pitch, pitchDecay, pitchSweep, sweepTime, noiseType, noiseMix, subMix };
                      }
                      setSequence(newSeq);
                    }}
                    className={`text-[10px] px-1 py-0.5 rounded ${step.lockedState ? 'bg-[#AA00FF]/20 text-[#AA00FF]' : 'bg-[#333] text-[#8E9299] hover:text-white'}`}
                    title={step.lockedState ? "Clear saved sound" : "Save current sound to this step"}
                  >
                    SAVE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Generator */}
          <div className="bg-[#242424] p-4 rounded-xl border border-[#333]">
            <h2 className="text-lg font-bold mb-3 text-[#8E9299]">GENERATOR</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#8E9299] mb-1">TYPE</label>
                <select 
                  value={synthType} 
                  onChange={e => setSynthType(e.target.value)}
                  className="w-full bg-[#151619] border border-[#333] rounded p-2 text-sm"
                >
                  <option value="synth">Basic Synth</option>
                  <option value="fm">FM Synth</option>
                  <option value="am">AM Synth</option>
                  <option value="membrane">Membrane (Drums)</option>
                  <option value="noise">Noise</option>
                  <option value="metal">Metal</option>
                </select>
              </div>

              {synthType !== 'noise' && synthType !== 'metal' && (
                <div>
                  <label className="block text-xs font-bold text-[#8E9299] mb-1">OSCILLATOR</label>
                  <select 
                    value={oscType} 
                    onChange={e => setOscType(e.target.value)}
                    className="w-full bg-[#151619] border border-[#333] rounded p-2 text-sm"
                  >
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                    <option value="sawtooth">Sawtooth</option>
                  </select>
                </div>
              )}

              {synthType === 'noise' && (
                <div>
                  <label className="block text-xs font-bold text-[#8E9299] mb-1">NOISE COLOR</label>
                  <select 
                    value={noiseType} 
                    onChange={e => setNoiseType(e.target.value)}
                    className="w-full bg-[#151619] border border-[#333] rounded p-2 text-sm"
                  >
                    <option value="white">White</option>
                    <option value="pink">Pink</option>
                    <option value="brown">Brown</option>
                  </select>
                </div>
              )}

              {synthType !== 'noise' && synthType !== 'metal' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#8E9299] mb-1">PITCH</label>
                    <input 
                      type="text" 
                      value={pitch} 
                      onChange={e => setPitch(e.target.value)}
                      className="w-full bg-[#151619] border border-[#333] rounded p-2 text-sm"
                      placeholder="e.g. C4, F#2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#8E9299] mb-1">PITCH SWEEP</label>
                    <select 
                      value={pitchSweep} 
                      onChange={e => setPitchSweep(e.target.value as any)}
                      className="w-full bg-[#151619] border border-[#333] rounded p-2 text-sm"
                    >
                      <option value="none">None</option>
                      <option value="up">Sweep Up</option>
                      <option value="down">Sweep Down</option>
                    </select>
                  </div>
                  {pitchSweep !== 'none' && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold text-[#8E9299]">SWEEP TIME</label>
                        <span className="text-xs">{sweepTime.toFixed(2)}s</span>
                      </div>
                      <input 
                        type="range" min="0.01" max="2" step="0.01" value={sweepTime}
                        onChange={e => setSweepTime(parseFloat(e.target.value))}
                        className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                      />
                    </div>
                  )}
                </>
              )}

              {synthType === 'membrane' && (
                <div>
                  <label className="block text-xs font-bold text-[#8E9299] mb-1">PITCH DECAY</label>
                  <input 
                    type="range" min="0.01" max="0.5" step="0.01" value={pitchDecay}
                    onChange={e => setPitchDecay(parseFloat(e.target.value))}
                    className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Envelope */}
          <div className="bg-[#242424] p-4 rounded-xl border border-[#333]">
            <h2 className="text-lg font-bold mb-3 text-[#8E9299]">ENVELOPE</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">ATTACK</label>
                  <span className="text-xs">{attack.toFixed(2)}s</span>
                </div>
                <input 
                  type="range" min="0.001" max="2" step="0.01" value={attack}
                  onChange={e => setAttack(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">DECAY</label>
                  <span className="text-xs">{decay.toFixed(2)}s</span>
                </div>
                <input 
                  type="range" min="0.01" max="2" step="0.01" value={decay}
                  onChange={e => setDecay(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">SUSTAIN</label>
                  <span className="text-xs">{sustain.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={sustain}
                  onChange={e => setSustain(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">RELEASE</label>
                  <span className="text-xs">{release.toFixed(2)}s</span>
                </div>
                <input 
                  type="range" min="0.01" max="5" step="0.01" value={release}
                  onChange={e => setRelease(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
            </div>
          </div>

          {/* Effects */}
          <div className="bg-[#242424] p-4 rounded-xl border border-[#333]">
            <h2 className="text-lg font-bold mb-3 text-[#8E9299]">EFFECTS</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">FILTER FREQ</label>
                  <span className="text-xs">{filterFreq}Hz</span>
                </div>
                <input 
                  type="range" min="20" max="20000" step="10" value={filterFreq}
                  onChange={e => setFilterFreq(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">FILTER RES</label>
                  <span className="text-xs">{filterRes.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0" max="20" step="0.1" value={filterRes}
                  onChange={e => setFilterRes(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">DISTORTION</label>
                  <span className="text-xs">{Math.round(fxDist * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={fxDist}
                  onChange={e => setFxDist(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">BITCRUSH</label>
                  <span className="text-xs">{Math.round(fxBitcrush * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={fxBitcrush}
                  onChange={e => setFxBitcrush(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">CHORUS</label>
                  <span className="text-xs">{Math.round(fxChorus * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={fxChorus}
                  onChange={e => setFxChorus(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">PHASER</label>
                  <span className="text-xs">{Math.round(fxPhaser * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={fxPhaser}
                  onChange={e => setFxPhaser(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">AUTOFILTER</label>
                  <span className="text-xs">{Math.round(fxAutoFilter * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={fxAutoFilter}
                  onChange={e => setFxAutoFilter(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">DELAY</label>
                  <span className="text-xs">{Math.round(fxDelay * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={fxDelay}
                  onChange={e => setFxDelay(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">REVERB</label>
                  <span className="text-xs">{Math.round(fxReverb * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={fxReverb}
                  onChange={e => setFxReverb(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">VIBRATO FREQ</label>
                  <span className="text-xs">{vibratoFreq.toFixed(1)}Hz</span>
                </div>
                <input 
                  type="range" min="0" max="20" step="0.1" value={vibratoFreq}
                  onChange={e => setVibratoFreq(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">VIBRATO DEPTH</label>
                  <span className="text-xs">{Math.round(vibratoDepth * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={vibratoDepth}
                  onChange={e => setVibratoDepth(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">TREMOLO FREQ</label>
                  <span className="text-xs">{fxTremoloFreq.toFixed(1)}Hz</span>
                </div>
                <input 
                  type="range" min="0.1" max="20" step="0.1" value={fxTremoloFreq}
                  onChange={e => setFxTremoloFreq(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">TREMOLO DEPTH</label>
                  <span className="text-xs">{Math.round(fxTremoloDepth * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={fxTremoloDepth}
                  onChange={e => setFxTremoloDepth(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">PITCH SHIFT</label>
                  <span className="text-xs">{fxPitchShift > 0 ? '+' : ''}{fxPitchShift} ST</span>
                </div>
                <input 
                  type="range" min="-24" max="24" step="1" value={fxPitchShift}
                  onChange={e => setFxPitchShift(parseInt(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
            </div>
          </div>

          {/* EQ & Layers */}
          <div className="bg-[#242424] p-4 rounded-xl border border-[#333]">
            <h2 className="text-lg font-bold mb-3 text-[#8E9299]">EQ & LAYERS</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">EQ LOW</label>
                  <span className="text-xs">{eqLow > 0 ? '+' : ''}{eqLow.toFixed(1)} dB</span>
                </div>
                <input 
                  type="range" min="-24" max="24" step="0.1" value={eqLow}
                  onChange={e => setEqLow(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">EQ MID</label>
                  <span className="text-xs">{eqMid > 0 ? '+' : ''}{eqMid.toFixed(1)} dB</span>
                </div>
                <input 
                  type="range" min="-24" max="24" step="0.1" value={eqMid}
                  onChange={e => setEqMid(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">EQ HIGH</label>
                  <span className="text-xs">{eqHigh > 0 ? '+' : ''}{eqHigh.toFixed(1)} dB</span>
                </div>
                <input 
                  type="range" min="-24" max="24" step="0.1" value={eqHigh}
                  onChange={e => setEqHigh(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div className="border-t border-[#333] my-4 pt-4"></div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">NOISE LAYER MIX</label>
                  <span className="text-xs">{Math.round(noiseMix * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={noiseMix}
                  onChange={e => setNoiseMix(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">SUB LAYER MIX</label>
                  <span className="text-xs">{Math.round(subMix * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={subMix}
                  onChange={e => setSubMix(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div className="h-px bg-[#333] my-4"></div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">COMP THRESHOLD</label>
                  <span className="text-xs">{compThreshold.toFixed(1)} dB</span>
                </div>
                <input 
                  type="range" min="-60" max="0" step="1" value={compThreshold}
                  onChange={e => setCompThreshold(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-[#8E9299]">COMP RATIO</label>
                  <span className="text-xs">{compRatio.toFixed(1)}:1</span>
                </div>
                <input 
                  type="range" min="1" max="20" step="0.1" value={compRatio}
                  onChange={e => setCompRatio(parseFloat(e.target.value))}
                  className="w-full custom-slider" style={{ '--thumb-color': '#00AAFF' } as any}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
