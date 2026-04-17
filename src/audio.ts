import * as Tone from 'tone';

class AudioEngine {
  masterVol: Tone.Volume;
  masterCompressor: Tone.Compressor;
  masterEQ: Tone.EQ3;
  masterFilter: Tone.Filter;
  masterHPF: Tone.Filter;
  stereoWidener: Tone.StereoWidener;
  delay: Tone.FeedbackDelay | null = null;
  reverb: Tone.Reverb | null = null;
  distortion: Tone.Distortion | null = null;
  chorus: Tone.Chorus | null = null;
  bitcrusher: Tone.BitCrusher | null = null;
  metronome: Tone.MembraneSynth | null = null;
  
  trackFX: Record<string, { dist: Tone.Distortion, delay: Tone.FeedbackDelay, reverb: Tone.Reverb, chorus: Tone.Chorus, bitcrusher: Tone.BitCrusher, filter: Tone.Filter, tremolo: Tone.Tremolo, channel: Tone.Channel }> = {};
  trackInstruments: Record<string, any> = {};
  
  recorder: MediaRecorder | null = null;
  recordedChunks: BlobPart[] = [];
  dest: MediaStreamAudioDestinationNode | null = null;
  initialized = false;
  requestedFormat: string = 'audio/webm';

  constructor() {
    this.masterEQ = new Tone.EQ3(0, 0, 0);
    this.masterFilter = new Tone.Filter(20000, "lowpass");
    this.masterHPF = new Tone.Filter(20, "highpass");
    this.stereoWidener = new Tone.StereoWidener(0);
    this.masterCompressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });
    this.masterVol = new Tone.Volume(0).connect(this.masterHPF);
    this.masterHPF.connect(this.masterFilter);
    this.masterFilter.connect(this.masterEQ);
    this.masterEQ.connect(this.stereoWidener);
    this.stereoWidener.connect(this.masterCompressor);
    this.masterCompressor.toDestination();
  }

  setHeadphoneMode(enabled: boolean) {
    if (this.stereoWidener) {
      this.stereoWidener.width.value = enabled ? 0.8 : 0;
    }
  }

  async init() {
    if (this.initialized) return;
    await Tone.start();
    Tone.context.lookAhead = 0.2;
    
    const ctx = Tone.getContext().rawContext as AudioContext;
    if (ctx.createMediaStreamDestination) {
      this.dest = ctx.createMediaStreamDestination();
      Tone.getDestination().connect(this.dest);
    }

    this.delay = new Tone.FeedbackDelay("8n", 0.3);
    this.reverb = new Tone.Reverb(2.5);
    this.distortion = new Tone.Distortion(0.5);
    this.chorus = new Tone.Chorus(4, 2.5, 0.5).start();
    this.bitcrusher = new Tone.BitCrusher(8);
    
    this.delay.wet.value = 0;
    this.reverb.wet.value = 0;
    this.distortion.wet.value = 0;
    this.chorus.wet.value = 0;
    this.bitcrusher.wet.value = 0;

    // Chain: Tracks -> BitCrusher -> Chorus -> Distortion -> Delay -> Reverb -> Master
    this.bitcrusher.connect(this.chorus);
    this.chorus.connect(this.distortion);
    this.distortion.connect(this.delay);
    this.delay.connect(this.reverb);
    this.reverb.connect(this.masterVol);

    this.metronome = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
    }).connect(this.masterVol);

    this.initialized = true;
  }

  setMasterFX(delayWet: number, delayTime: string, reverbWet: number, distWet: number, chorusWet: number, bitcrusherWet: number, masterVolume: number, eqLow: number = 0, eqMid: number = 0, eqHigh: number = 0, filterFreq: number = 20000, hpfFreq: number = 20) {
    if (this.delay) {
      this.delay.wet.value = delayWet;
      this.delay.delayTime.value = delayTime;
    }
    if (this.reverb) this.reverb.wet.value = reverbWet;
    if (this.distortion) this.distortion.wet.value = distWet;
    if (this.chorus) this.chorus.wet.value = chorusWet;
    if (this.bitcrusher) this.bitcrusher.wet.value = bitcrusherWet;
    if (this.masterVol) this.masterVol.volume.value = masterVolume;
    if (this.masterFilter) this.masterFilter.frequency.value = filterFreq;
    if (this.masterHPF) this.masterHPF.frequency.value = hpfFreq;
    if (this.masterEQ) {
      this.masterEQ.low.value = eqLow;
      this.masterEQ.mid.value = eqMid;
      this.masterEQ.high.value = eqHigh;
    }
  }

  setSwing(swing: number) {
    Tone.Transport.swing = swing;
    Tone.Transport.swingSubdivision = '16n';
  }

  private createInstrument(type: string, sampleUrl?: string, sampleRootNote: string = 'C4', samplePlaybackSpeed: number = 1, sampleReverse: boolean = false, sampleDuration: number = 1, sampleFade: boolean = true, sampleStart: number = 0, sampleEnd: number = 0) {
    if (type === 'sampler' && sampleUrl) {
      const player = new Tone.Player({
        url: sampleUrl,
        fadeOut: sampleFade ? 0.5 : 0,
        fadeIn: 0.01
      });
      (player as any)._sampleRootNote = sampleRootNote;
      (player as any)._samplePlaybackSpeed = samplePlaybackSpeed;
      (player as any)._sampleDuration = sampleDuration;
      (player as any)._sampleFade = sampleFade;
      (player as any)._sampleStart = sampleStart;
      (player as any)._sampleEnd = sampleEnd;
      player.reverse = sampleReverse;
      return player;
    }

    switch (type) {
      // CHIPTUNE & 8-BIT
      case '8bit': return new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'square' }, envelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.1 }, volume: 0 });
      case 'chiptune': return new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 }, volume: 2 });
      
      // TRAP & PHONK
      case '808': return new Tone.MembraneSynth({ pitchDecay: 0.008, octaves: 3, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 2.0, sustain: 0.1, release: 2.0 }, volume: 6 });
      case '808_hard': return new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 3, oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 2, sustain: 0.1, release: 2 }, volume: 6 });
      case 'phonk_808': return new Tone.MembraneSynth({ pitchDecay: 0.015, octaves: 4, oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 1.5, sustain: 0.2, release: 1.5 }, volume: 4 });
      case 'phonk_cowbell': return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 1.5, modulationIndex: 2, oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 }, volume: 2 });
      case 'memphis_cowbell': return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 1.8, modulationIndex: 3, oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }, volume: 3 });
      case 'trap_snare': return new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.15 }, volume: 4 });
      case 'phonk_snare': return new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }, volume: 5 });
      case 'trap_clap': return new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }, volume: 3 });
      case 'reese_bass': return new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 20 }, envelope: { attack: 0.1, decay: 0.2, sustain: 1, release: 1 }, volume: 0 });
      case 'trap_brass': return new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsquare', count: 3, spread: 10 }, envelope: { attack: 0.05, decay: 0.3, sustain: 0.8, release: 0.5 }, volume: 2 });
      case 'trap_sub': return new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.05, decay: 0.5, sustain: 1, release: 1 }, volume: 8 });
      case 'phonk_bass': return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 0.5, modulationIndex: 5, oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.4 }, volume: 4 });
      case 'phonk_pad': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sawtooth' }, filter: { Q: 1, type: 'lowpass', rolloff: -24 }, envelope: { attack: 0.5, decay: 1, sustain: 0.8, release: 2 }, filterEnvelope: { attack: 0.5, decay: 1, sustain: 0.8, release: 2, baseFrequency: 200, octaves: 2 }, volume: -2 });
      case 'trap_pluck': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'square' }, filter: { Q: 3, type: 'lowpass', rolloff: -24 }, envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.2 }, filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.2, baseFrequency: 1000, octaves: 2 }, volume: 2 });

      // EDM & SYNTHWAVE
      case 'hardstyle_kick': return new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 5, oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.5 }, volume: 4 });
      case 'supersaw': return new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 5, spread: 30 }, envelope: { attack: 0.01, decay: 0.5, sustain: 0.5, release: 1 }, volume: -2 });
      case 'trance_pluck': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sawtooth' }, filter: { Q: 2, type: 'lowpass', rolloff: -24 }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }, filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.2, baseFrequency: 500, octaves: 3 }, volume: 2 });
      case 'acid_bass': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sawtooth' }, filter: { Q: 4, type: 'lowpass', rolloff: -24 }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 }, filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5, baseFrequency: 100, octaves: 4 }, volume: 2 });

      // STANDARD DRUMS
      case 'kick': return new Tone.MembraneSynth({ volume: 2 });
      case 'kick_punchy': return new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 5, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }, volume: 6 });
      case 'kick_deep': return new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 3, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.8 }, volume: 6 });
      case 'snare': return new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }, volume: 2 });
      case 'snare_tight': return new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }, volume: 4 });
      case 'clap': return new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 }, volume: 2 });
      case 'tom': return new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.01, release: 1.4 }, volume: 2 });
      case 'ride': return new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 2, sustain: 0, release: 2 }, volume: -5 });
      case 'crash': return new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 3, sustain: 0, release: 3 }, volume: -2 });

      // PERCUSSION
      case 'bongo': return new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 2, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }, volume: 2 });
      case 'woodblock': return new Tone.MembraneSynth({ pitchDecay: 0.005, octaves: 1.5, oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }, volume: 4 });
      case 'triangle_perc': return new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 1, sustain: 0, release: 1 }, volume: -5 });
      case 'shaker': return new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.01, decay: 0.05, sustain: 0, release: 0.05 }, volume: -2 });

      // BASS
      case 'sub_bass': return new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.05, decay: 0.2, sustain: 1, release: 1 }, volume: 4 });
      case 'bass': return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 0.5, modulationIndex: 1.2, oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 }, volume: 2 });
      case 'fm_bass': return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 1, modulationIndex: 5, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.5 }, volume: 2 });

      // KEYS & CHORDS
      case 'piano': return new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fmsine', modulationType: 'sine', harmonicity: 2 }, envelope: { attack: 0.01, decay: 1, sustain: 0, release: 2 } });
      case 'e_piano': return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3, modulationIndex: 2, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 2, sustain: 0, release: 2 } });
      case 'lofi_keys': return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 2, modulationIndex: 1, oscillator: { type: 'triangle' }, envelope: { attack: 0.05, decay: 1, sustain: 0.2, release: 2 }, volume: 2 });
      case 'organ': return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 2, modulationIndex: 0.5, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 1, release: 0.5 } });
      case 'synth_pad': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sawtooth' }, filter: { Q: 2, type: 'lowpass', rolloff: -24 }, envelope: { attack: 1, decay: 1, sustain: 1, release: 4 }, filterEnvelope: { attack: 1, decay: 1, sustain: 1, release: 4, baseFrequency: 300, octaves: 2 }, volume: -2 });
      case 'choir_pad': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sine' }, filter: { Q: 1, type: 'lowpass', rolloff: -12 }, envelope: { attack: 1.5, decay: 1, sustain: 1, release: 4 }, filterEnvelope: { attack: 1.5, decay: 1, sustain: 1, release: 4, baseFrequency: 400, octaves: 1 }, volume: -2 });

      // LEADS & PLUCKS
      case 'synth_lead': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'square' }, filter: { Q: 3, type: 'lowpass', rolloff: -24 }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 1 }, filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 1, baseFrequency: 500, octaves: 3 } });
      case 'glide_lead': return new Tone.PolySynth(Tone.MonoSynth, { portamento: 0.1, oscillator: { type: 'sawtooth' }, filter: { Q: 1, type: 'lowpass', rolloff: -12 }, envelope: { attack: 0.01, decay: 0.1, sustain: 1, release: 1 }, filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 1, release: 1, baseFrequency: 800, octaves: 2 } });
      case 'theremin': return new Tone.PolySynth(Tone.Synth, { portamento: 0.2, oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.1, sustain: 1, release: 2 } });
      case 'pluck': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sawtooth' }, filter: { Q: 2, type: 'lowpass', rolloff: -24 }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }, filterEnvelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1, baseFrequency: 800, octaves: 3 } });
      case 'am_synth': return new Tone.PolySynth(Tone.AMSynth, { harmonicity: 2.5, oscillator: { type: 'triangle' }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.5 } });

      // STRINGS & WINDS
      case 'guitar': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'pwm', modulationFrequency: 0.2 }, filter: { Q: 1, type: 'lowpass', rolloff: -12 }, envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5 }, filterEnvelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5, baseFrequency: 1000, octaves: 1 } });
      case 'overdrive_guitar': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sawtooth' }, filter: { Q: 2, type: 'lowpass', rolloff: -24 }, envelope: { attack: 0.01, decay: 1, sustain: 0.5, release: 0.5 }, filterEnvelope: { attack: 0.01, decay: 1, sustain: 0.5, release: 0.5, baseFrequency: 2000, octaves: 1 }, volume: 2 });
      case 'strings': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sawtooth' }, filter: { Q: 1, type: 'lowpass', rolloff: -12 }, envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 2 }, filterEnvelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 2, baseFrequency: 800, octaves: 1 } });
      case 'pizzicato': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sawtooth' }, filter: { Q: 1, type: 'lowpass', rolloff: -24 }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }, filterEnvelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1, baseFrequency: 1000, octaves: 2 } });
      case 'brass': return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 1, modulationIndex: 1, oscillator: { type: 'sawtooth' }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.5 } });
      case 'flute': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sine' }, filter: { Q: 1, type: 'lowpass', rolloff: -12 }, envelope: { attack: 0.1, decay: 0.1, sustain: 1, release: 0.5 }, filterEnvelope: { attack: 0.1, decay: 0.1, sustain: 1, release: 0.5, baseFrequency: 1200, octaves: 1 } });

      // CINEMATIC & ORCHESTRAL
      case 'cinematic_brass': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'fatsawtooth', count: 4, spread: 25 }, filter: { Q: 1.5, type: 'lowpass', rolloff: -24 }, envelope: { attack: 0.2, decay: 0.3, sustain: 1, release: 1.5 }, filterEnvelope: { attack: 0.2, decay: 0.8, sustain: 0.7, release: 1.5, baseFrequency: 300, octaves: 3 }, volume: 4 });
      case 'cinematic_strings': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sawtooth' }, filter: { Q: 0.5, type: 'lowpass', rolloff: -12 }, envelope: { attack: 1.2, decay: 0.5, sustain: 1, release: 3 }, filterEnvelope: { attack: 1.2, decay: 0.5, sustain: 1, release: 3, baseFrequency: 500, octaves: 1 }, volume: 2 });
      case 'taiko_drum': return new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 3, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.5 }, volume: 8 });
      case 'epic_choir': return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 2, modulationIndex: 1.5, oscillator: { type: 'sine' }, envelope: { attack: 1.5, decay: 1, sustain: 0.7, release: 3 }, volume: 0 });
      case 'orchestral_hit': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 15 }, filter: { Q: 2, type: 'lowpass', rolloff: -24 }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.8 }, filterEnvelope: { attack: 0.005, decay: 0.3, sustain: 0.1, release: 0.8, baseFrequency: 1000, octaves: 3 }, volume: 4 });
      
      // POP & ROCK
      case 'electric_bass': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'triangle' }, filter: { Q: 1, type: 'lowpass', rolloff: -24 }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.5 }, filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3, baseFrequency: 200, octaves: 2 }, volume: 6 });
      case 'acoustic_guitar': return new Tone.PolySynth(Tone.MonoSynth, { oscillator: { type: 'sawtooth' }, filter: { Q: 2, type: 'lowpass', rolloff: -12 }, envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1 }, filterEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1, baseFrequency: 800, octaves: 2 }, volume: 2 });


      default: return new Tone.PolySynth(Tone.Synth);
    }
  }

  syncTrack(trackId: string, instrumentType: string, volume: number, pan: number, muted: boolean, delayWet: number = 0, reverbWet: number = 0, distWet: number = 0, chorusWet: number = 0, bitcrusherWet: number = 0, sampleUrl?: string, sampleRootNote: string = 'C4', samplePlaybackSpeed: number = 1, sampleReverse: boolean = false, sampleDuration: number = 1, sampleFade: boolean = true, sampleStart: number = 0, sampleEnd: number = 0, envelope?: { attack: number, decay: number, sustain: number, release: number }, filterCutoff: number = 20000, filterResonance: number = 0, drive: number = 0.5, lfoRate: number = 0, ampMod: number = 0) {
    if (!this.initialized) return;

    if (!this.trackFX[trackId]) {
      const filter = new Tone.Filter(20000, "lowpass");
      const tremolo = new Tone.Tremolo(0, 0).start();
      const dist = new Tone.Distortion(0.5);
      const delay = new Tone.FeedbackDelay("8n", 0.3);
      const reverb = new Tone.Reverb(2.5);
      const chorus = new Tone.Chorus(4, 2.5, 0.5).start();
      const bitcrusher = new Tone.BitCrusher(8);
      const channel = new Tone.Channel().connect(this.bitcrusher!);
      
      filter.connect(tremolo);
      tremolo.connect(bitcrusher);
      bitcrusher.connect(chorus);
      chorus.connect(dist);
      dist.connect(delay);
      delay.connect(reverb);
      reverb.connect(channel);

      this.trackFX[trackId] = { dist, delay, reverb, chorus, bitcrusher, filter, tremolo, channel };
    }
    
    const fx = this.trackFX[trackId];
    fx.channel.volume.value = volume;
    fx.channel.pan.value = pan;
    fx.channel.mute = muted;
    fx.delay.wet.value = delayWet;
    fx.reverb.wet.value = reverbWet;
    fx.dist.wet.value = distWet;
    fx.chorus.wet.value = chorusWet;
    fx.bitcrusher.wet.value = bitcrusherWet;
    
    // Automation params
    fx.filter.frequency.value = filterCutoff;
    fx.filter.Q.value = filterResonance;
    fx.dist.distortion = drive;
    fx.tremolo.frequency.value = lfoRate;
    fx.tremolo.depth.value = ampMod;

    if (!this.trackInstruments[trackId] || (this.trackInstruments[trackId] as any)._type !== instrumentType || (this.trackInstruments[trackId] as any)._sampleUrl !== sampleUrl || (this.trackInstruments[trackId] as any)._sampleRootNote !== sampleRootNote || (this.trackInstruments[trackId] as any)._samplePlaybackSpeed !== samplePlaybackSpeed || (this.trackInstruments[trackId] as any)._sampleReverse !== sampleReverse || (this.trackInstruments[trackId] as any)._sampleDuration !== sampleDuration || (this.trackInstruments[trackId] as any)._sampleFade !== sampleFade || (this.trackInstruments[trackId] as any)._sampleStart !== sampleStart || (this.trackInstruments[trackId] as any)._sampleEnd !== sampleEnd) {
      if (this.trackInstruments[trackId]) {
        this.trackInstruments[trackId].dispose();
      }
      const inst = this.createInstrument(instrumentType, sampleUrl, sampleRootNote, samplePlaybackSpeed, sampleReverse, sampleDuration, sampleFade, sampleStart, sampleEnd);
      (inst as any)._type = instrumentType;
      (inst as any)._sampleUrl = sampleUrl;
      (inst as any)._sampleRootNote = sampleRootNote;
      (inst as any)._samplePlaybackSpeed = samplePlaybackSpeed;
      (inst as any)._sampleReverse = sampleReverse;
      (inst as any)._sampleDuration = sampleDuration;
      (inst as any)._sampleFade = sampleFade;
      (inst as any)._sampleStart = sampleStart;
      (inst as any)._sampleEnd = sampleEnd;
      inst.connect(fx.filter);
      this.trackInstruments[trackId] = inst;
    }

    if (envelope && this.trackInstruments[trackId] && typeof this.trackInstruments[trackId].set === 'function') {
      try {
        this.trackInstruments[trackId].set({ envelope });
      } catch (e) {
        // Instrument might not support classic ADSR envelope
      }
    }
  }

  stopAll() {
    Tone.Transport.stop();
    Object.values(this.trackInstruments).forEach(inst => {
      try {
        if (inst instanceof Tone.Player) {
          inst.stop();
        } else if (inst instanceof Tone.PolySynth) {
          inst.releaseAll();
        } else if (inst.triggerRelease) {
          inst.triggerRelease(Tone.now() + 0.02);
        }
      } catch (e) {
        console.warn('Error stopping instrument', e);
      }
    });
  }

  deleteTrack(trackId: string) {
    if (this.trackInstruments[trackId]) {
      this.trackInstruments[trackId].dispose();
      delete this.trackInstruments[trackId];
    }
    if (this.trackFX[trackId]) {
      const fx = this.trackFX[trackId];
      fx.dist.dispose();
      fx.delay.dispose();
      fx.reverb.dispose();
      fx.chorus.dispose();
      fx.bitcrusher.dispose();
      fx.channel.dispose();
      delete this.trackFX[trackId];
    }
  }

  playMetronome(isDownbeat: boolean, time: number) {
    if (!this.metronome) return;
    this.metronome.triggerAttackRelease(isDownbeat ? 'C5' : 'C4', '16n', time, isDownbeat ? 0.8 : 0.4);
  }

  setMasterCompressor(threshold: number, ratio: number) {
    this.masterCompressor.threshold.value = threshold;
    this.masterCompressor.ratio.value = ratio;
  }

  setMasterEQ(low: number, mid: number, high: number) {
    this.masterEQ.low.value = low;
    this.masterEQ.mid.value = mid;
    this.masterEQ.high.value = high;
  }

  playNote(trackId: string, note: string, velocity: number, time?: number, duration: string | number = '16n', offset: number = 0) {
    const inst = this.trackInstruments[trackId];
    if (!inst) return;

    const t = (time !== undefined ? time : Tone.now() + 0.02) + (offset * Tone.Time('16n').toSeconds());
    
    const isNoise = inst.name === 'NoiseSynth' || inst.name === 'MetalSynth' || inst instanceof Tone.NoiseSynth || inst instanceof Tone.MetalSynth;
    
    if (inst instanceof Tone.Player || inst.name === 'Player') {
      if (inst.loaded) {
        const rootNote = (inst as any)._sampleRootNote || 'C4';
        const speed = (inst as any)._samplePlaybackSpeed || 1;
        const sampleDuration = (inst as any)._sampleDuration || 1;
        const sampleStart = (inst as any)._sampleStart || 0;
        const sampleEnd = (inst as any)._sampleEnd || 0;
        const interval = Tone.Frequency(note || 'C4').toMidi() - Tone.Frequency(rootNote).toMidi();
        const ratio = Tone.intervalToFrequencyRatio(interval);
        inst.playbackRate = speed * ratio;
        
        let playDuration = sampleDuration;
        if (sampleEnd > sampleStart) {
          playDuration = sampleEnd - sampleStart;
        } else if (sampleEnd === 0 && inst.buffer) {
          playDuration = inst.buffer.duration - sampleStart;
        }
        
        inst.start(t, sampleStart, playDuration);
      }
    } else if (inst instanceof Tone.Sampler || inst.name === 'Sampler') {
      if (inst.loaded) {
        inst.triggerAttackRelease(note || 'C4', duration, t, velocity);
      }
    } else if (isNoise) {
      inst.triggerAttackRelease(duration, t, velocity);
    } else {
      inst.triggerAttackRelease(note || 'C4', duration, t, velocity);
    }
  }

  startRecording(format: string = 'audio/webm') {
    if (!this.dest) return;
    this.recordedChunks = [];
    this.requestedFormat = format;
    
    const mimeType = MediaRecorder.isTypeSupported(format) ? format : 'audio/webm';
    
    this.recorder = new MediaRecorder(this.dest.stream, { mimeType });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.recorder.start();
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.recorder) return resolve(new Blob());
      this.recorder.onstop = async () => {
        const mimeType = this.recorder?.mimeType || 'audio/webm';
        let blob = new Blob(this.recordedChunks, { type: mimeType });
        
        if (this.requestedFormat === 'audio/wav' && mimeType !== 'audio/wav') {
          blob = await this.convertToWav(blob);
        }
        
        resolve(blob);
      };
      this.recorder.stop();
    });
  }

  async convertToWav(blob: Blob): Promise<Blob> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioBuffer.length * numOfChan * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, audioBuffer.length * numOfChan * 2, true);

    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    offset = 44;
    while (pos < audioBuffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][pos]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
      pos++;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }
}

export const engine = new AudioEngine();
