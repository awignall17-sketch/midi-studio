export interface StepData {
  active: boolean;
  note: string;
  velocity: number;
  duration: string;
  offset: number;
  stepSpan?: number; // How many steps this note spans
}

export interface TrackTemplate {
  id: string;
  name: string;
  type: 'drum' | 'melodic';
  instrument: string;
  volume: number;
  pan: number;
  defaultNote: string;
  delayWet: number;
  reverbWet: number;
  distWet: number;
  chorusWet: number;
  bitcrusherWet: number;
  swing: number;
  sampleUrl?: string;
  sampleRootNote?: string;
  samplePlaybackSpeed?: number;
  sampleReverse?: boolean;
  sampleDuration?: number;
  sampleStart?: number;
  sampleEnd?: number;
  sampleFade?: boolean;
}

export interface TrackData {
  id: string;
  name: string;
  type: 'drum' | 'melodic';
  instrument: string;
  color: string;
  steps: StepData[];
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  defaultNote: string;
  delayWet: number;
  reverbWet: number;
  distWet: number;
  chorusWet: number;
  bitcrusherWet: number;
  swing: number;
  minimized?: boolean;
  stepsCount?: number;
  sampleUrl?: string;
  sampleRootNote?: string;
  samplePlaybackSpeed?: number;
  sampleReverse?: boolean;
  sampleDuration?: number;
  sampleStart?: number;
  sampleEnd?: number;
  sampleFade?: boolean;
  envelope?: { attack: number; decay: number; sustain: number; release: number };
  filterCutoff?: number;
  filterResonance?: number;
  drive?: number;
  lfoRate?: number;
  ampMod?: number;
}
