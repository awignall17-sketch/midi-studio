import React, { useState, useEffect } from 'react';
import { Search, X, Music, SlidersHorizontal, MousePointerClick, AudioWaveform, Clock, Headphones, ArrowLeft, BookOpen, ChevronRight, HelpCircle, Layers, Settings2, Globe, ThumbsDown, ThumbsUp } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function HelpModal({ onClose }: Props) {
  const [searchWord, setSearchWord] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [helpfulStatus, setHelpfulStatus] = useState<'none' | 'yes' | 'no'>('none');

  useEffect(() => {
    setHelpfulStatus('none');
  }, [selectedTopic]);

  const helpTopics = [
    {
      title: 'Adding & Sequencing Beats',
      icon: <MousePointerClick className="w-6 h-6 text-[#00AAFF]" />,
      tags: ['click', 'press', 'add', 'beat', 'delete', 'remove', 'sequence'],
      description: 'The foundation of MIDI Creator Pro. Learn how to place, move, and organize your rhythmic patterns.',
      content: `• Click any gray rectangle in the track timeline to add a beat.\n• Click an active beat again to remove it.\n• You can quickly sequence beats by tapping along the track timeline.\n\n### Patterns & Loops\nEach track consists of a series of steps. By default, patterns are 16 steps long (1 bar). You can expand your project using the BARS control in the top toolbar to create longer compositions.`
    },
    {
      title: 'Micro-Timing & Advanced Settings',
      icon: <Clock className="w-6 h-6 text-[#FF4444]" />,
      tags: ['long click', 'hold', 'right click', 'micro', 'timing', 'offset', 'velocity', 'pitch', 'duration'],
      description: 'Go beyond the grid. Fine-tune every single note for professional expression and human feel.',
      content: `• First, add a beat so it is active (colored).\n• LONG-CLICK (hold it down) or RIGHT-CLICK the active beat to open the Advanced Step Settings menu.\n\n### Parameters\n• **Velocity**: Adjust how hard the note is hit. Higher velocity often sounds brighter or louder.\n• **Pitch (Melodic Tracks)**: Shift the exact musical key of that specific note without changing the whole track.\n• **Duration**: Dictates how long the synth plays (Gate). Perfect for long pads or short staccato stabs.\n• **Step Span (Hold)**: Visually drag the note over multiple grid squares.\n• **Offset**: Micro-timing. Shift the beat slightly early or late. An offset visual dot will appear on the beat! Use this to create "swing" or "drunk" rhythms.`
    },
    {
      title: 'Enhanced Headphone Mode',
      icon: <Headphones className="w-6 h-6 text-[#22cc22]" />,
      tags: ['headphone', 'binaural', 'pan', 'spatial', '3d'],
      description: 'Experience your music in 3D space with advanced binaural spatialization.',
      content: `• Toggle "HEADPHONES" in the Settings menu to activate Spatial Audio Mode.\n• When enabled, the pan knobs on your tracks utilize Binaural 3D panning instead of standard stereo panning.\n• This simulates sound moving around your head in a 3D acoustic space, perfect for creating immersive soundscapes or detailed headphone mixes.\n\n### Why use it?\nIt provides a much wider soundstage than standard panning, allowing you to "place" instruments behind or above you.`
    },
    {
      title: 'Using the Sampler',
      icon: <AudioWaveform className="w-6 h-6 text-[#AA00FF]" />,
      tags: ['sampler', 'upload', 'audio', 'wav', 'mp3', 'clip', 'trim', 'speed', 'root'],
      description: 'Turn any sound file into a playable instrument. Ideal for vocal chops and found sounds.',
      content: `• Add a new track and set the instrument to 'Sampler'.\n• Click 'UPLOAD SAMPLE' to load any .mp3 or .wav file from your computer.\n\n### Advanced Sample Editing\n• **SPEED**: Make the sample playback faster or slower. This also affects the pitch like a tape machine.\n• **START/END**: Trim the exact piece of the sample you want to hear. Eliminate silence at the start of recordings.\n• **ROOT NOTE**: Setting the root pitch lets you play your custom sample like a piano across different pitches! Adjusting the pitch in Step Settings will then shift the sample musically.`
    },
    {
      title: 'Master Effects (FX)',
      icon: <SlidersHorizontal className="w-6 h-6 text-[#FF44FF]" />,
      tags: ['reverb', 'delay', 'echo', 'compression', 'eq', 'filter', 'master'],
      description: 'Polish your final mix. Use compression, EQ, and spatial effects to bring your beat to life.',
      content: `• The bottom strip contains global Master Effects affecting your whole song.\n\n### Master Chain\n• **COMP THR & RATIO**: This controls compression. It makes quiet sounds louder and loud sounds smoother, giving your track that commercial "glue".\n• **ECHO (Delay) & VERB (Reverb)**: Adds 3D space and bounce to your overall track. Use sparingly to avoid a muddy mix.\n• **EQ (Low, Mid, High)**: Shape the frequency balance. Boost the lows for more bass, or cut highs to reduce harshness.`
    },
    {
      title: 'Track Operations',
      icon: <Layers className="w-6 h-6 text-[#FFCC00]" />,
      tags: ['track', 'delete', 'clear', 'mute', 'solo', 'duplicate'],
      description: 'Manage your instruments with track-level controls.',
      content: `Each track has several controls on the left side to help you write and arrange:\n\n• **Trash Can**: Completely removes the track from the project.\n• **Eraser**: Clears all active beats from the track, but keeps the track and its settings.\n• **Copy**: Duplicates the pattern from the track.\n• **Eye / Dropdown Arrow**: Minimize or maximize the track to save screen real-estate.\n• **Speaker**: Mutes or unmutes the track during playback.`
    },
    {
      title: 'Tempo & Groove (BPM / Swing)',
      icon: <Settings2 className="w-6 h-6 text-[#00FFFF]" />,
      tags: ['tempo', 'bpm', 'speed', 'swing', 'groove', 'shuffle'],
      description: 'Control the speed and feel of your master composition.',
      content: `• **BPM (Beats Per Minute)**: Sets the speed of playback. Higher is faster. Hip-hop usually sits around 80-100 BPM, House at 120-130 BPM, and Drum & Bass at 170+ BPM.\n• **SWING**: Adds a rhythmic 'skip' or shuffle to your beats. At 0%, robots play your drums. At 50%, they have a slight hip-hop bounce. At 100%, it's fully swung.`
    },
    {
      title: 'SFX Studio (Sound Design)',
      icon: <Music className="w-6 h-6 text-[#ff8800]" />,
      tags: ['sfx', 'synth', 'design', 'generator', 'laser', 'explosion', 'coin'],
      description: 'A dedicated laboratory for designing classic game sound effects from scratch.',
      content: `• Enter SFX STUDIO mode from the sidebar.\n• SFX Studio lets you synthesize video game sounds like Lasers, Explosions, and Powerups using oscillators and noise generators.\n\n### Workflow\n1. Choose a **Generator** type (Basic, FM, AM, Membrane).\n2. Shape the volume with the **Envelope** (Attack, Decay, etc).\n3. Add movement with **Effects** (Bitcrush, Pitch Shift, Filter).\n4. Use **USE IN MIDI STUDIO** to instantly bring your design back into your main project as a playable instrument!`
    },
    {
      title: 'Performance Mode',
      icon: <Search className="w-6 h-6 text-[#FFCC00]" />,
      tags: ['performance', 'lag', 'speed', 'slow', 'animation'],
      description: 'Disable visual flair to prioritize audio stability on older devices.',
      content: `• If you experience audio crackling or visual lag, enable PERFORMANCE MODE in the settings.\n• This disables complex CSS animations and playhead trackers, freeing up CPU overhead for the audio engine.\n• Highly recommended for projects with more than 12 tracks.`
    },
    {
      title: 'Importing & Saving Projects',
      icon: <BookOpen className="w-6 h-6 text-[#00FFFF]" />,
      tags: ['save', 'load', 'json', 'export', 'backup', 'project'],
      description: 'Never lose a beat. Learn how to save your creations to your computer and load them back later.',
      content: `• Click **SAVE PROJECT** in the top navigation to download a .json file containing your entire session (pattern data, tempo, synth settings, and FX).\n• Use **LOAD PROJECT** to open past sessions.\n• Note: Custom audio samples uploaded into Sampler tracks are NOT saved inside the JSON file to keep files small. You must upload the audio files again when you reload the project.`
    },
    {
      title: 'Keyboard Shortcuts',
      icon: <HelpCircle className="w-6 h-6 text-[#FF00AA]" />,
      tags: ['keyboard', 'shortcuts', 'hotkeys', 'play', 'stop'],
      description: 'Speed up your workflow using the computer keyboard.',
      content: `• **Spacebar**: Play / Pause the main transport.\n• **Shift + Space**: Stop and reset playback to the beginning.\n• Keep an eye out for tooltips on buttons, as we're always adding more shortcut actions to common interfaces.`
    }
  ];

  const filteredTopics = helpTopics.filter(topic => 
    topic.title.toLowerCase().includes(searchWord.toLowerCase()) || 
    topic.description.toLowerCase().includes(searchWord.toLowerCase()) ||
    topic.tags.some(t => t.includes(searchWord.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] z-[100] flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="h-20 border-b border-[#333] flex items-center justify-between px-8 bg-[#151619] shrink-0">
        <div className="flex items-center gap-4">
          {selectedTopic !== null ? (
            <button 
              onClick={() => setSelectedTopic(null)}
              className="p-3 hover:bg-[#2A2B30] rounded-xl transition-all border border-[#333]"
            >
              <ArrowLeft size={24} />
            </button>
          ) : (
            <div className="p-3 bg-[#00AAFF]/10 rounded-xl">
              <BookOpen className="text-[#00AAFF]" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              {selectedTopic !== null ? helpTopics[selectedTopic].title : 'USER GUIDE & HELP CENTER'}
            </h2>
            <p className="text-[10px] text-[#8E9299] font-bold uppercase tracking-widest">
              {selectedTopic !== null ? 'Documentation Article' : 'Everything you need to know about MIDI Creator Pro'}
            </p>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="p-3 hover:bg-[#FF4444]/20 hover:text-[#FF4444] text-[#8E9299] rounded-xl transition-all border border-[#333] hover:border-[#FF4444]/50"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {selectedTopic === null ? (
          <div className="flex-1 flex flex-col">
            {/* Search and Hero */}
            <div className="p-12 border-b border-[#333] bg-gradient-to-b from-[#151619] to-[#0a0a0c] relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00AAFF]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
               
               <div className="max-w-4xl mx-auto relative z-10">
                 <h1 className="text-5xl font-black text-white mb-8 tracking-tighter leading-none uppercase">How can we help you <span className="text-[#00AAFF]">create?</span></h1>
                 <div className="relative">
                   <Search className="w-6 h-6 text-[#8E9299] absolute left-5 top-1/2 -translate-y-1/2" />
                   <input 
                     type="text" 
                     placeholder="Search guides, features, terms..." 
                     value={searchWord}
                     onChange={(e) => setSearchWord(e.target.value)}
                     className="w-full bg-[#151619] border-2 border-[#333] text-white rounded-2xl py-6 pl-14 pr-6 text-xl outline-none focus:border-[#00AAFF] focus:ring-4 ring-[#00AAFF]/10 transition-all font-bold placeholder:text-[#333]"
                   />
                 </div>
               </div>
            </div>

            {/* Topics Grid */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTopics.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-[#151619] rounded-3xl border border-dashed border-[#333]">
                    <Search className="w-12 h-12 text-[#333] mx-auto mb-4" />
                    <h3 className="text-xl font-black text-[#8E9299]">NO RESULTS FOUND</h3>
                    <p className="text-sm text-[#444]">Try different keywords or browse our main categories.</p>
                  </div>
                ) : (
                  helpTopics.map((topic, i) => {
                    const isVisible = topic.title.toLowerCase().includes(searchWord.toLowerCase()) || topic.description.toLowerCase().includes(searchWord.toLowerCase()) || topic.tags.some(t => t.includes(searchWord.toLowerCase()));
                    if (!isVisible && searchWord) return null;
                    return (
                      <button 
                        key={i} 
                        onClick={() => setSelectedTopic(i)}
                        className="bg-[#151619] border border-[#333] rounded-3xl p-8 text-left hover:border-[#00AAFF] hover:bg-[#1a1b20] transition-all group relative overflow-hidden flex flex-col h-full"
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-20 transition-opacity">
                          {topic.icon}
                        </div>
                        <div className="w-14 h-14 bg-[#242424] p-3 rounded-2xl border border-[#333] mb-6 group-hover:scale-110 transition-transform flex items-center justify-center">
                          {topic.icon}
                        </div>
                        <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight group-hover:text-[#00AAFF] transition-colors">{topic.title}</h3>
                        <p className="text-sm text-[#8E9299] leading-relaxed font-bold border-l-2 border-[#333] pl-4 flex-1">
                          {topic.description}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-[#0a0a0c] animate-in slide-in-from-right-10 duration-500">
            <div className="max-w-4xl mx-auto py-20 px-8">
              <div className="flex items-center gap-4 mb-12">
                 <div className="w-20 h-20 bg-[#1a1b20] p-5 rounded-3xl border border-[#333] shadow-2xl">
                    {helpTopics[selectedTopic].icon}
                 </div>
                 <div>
                    <div className="flex gap-2 mb-2">
                       {helpTopics[selectedTopic].tags.map(tag => (
                         <span key={tag} className="text-[9px] font-black bg-[#00AAFF]/10 text-[#00AAFF] px-2 py-0.5 rounded-full uppercase tracking-tighter">#{tag}</span>
                       ))}
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{helpTopics[selectedTopic].title}</h1>
                 </div>
              </div>

              <div className="prose prose-invert prose-lg max-w-none">
                 <div className="text-white whitespace-pre-line text-lg leading-relaxed font-medium bg-[#151619] border border-[#333] p-12 rounded-[40px] shadow-2xl">
                    {helpTopics[selectedTopic].content}
                    
                    <div className="mt-12 border-t border-[#333] pt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="text-xl font-black text-white">Was this article helpful?</div>
                      {helpfulStatus === 'none' ? (
                        <div className="flex gap-4 w-full sm:w-auto">
                          <button onClick={() => setHelpfulStatus('yes')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-[#242424] hover:bg-[#2A2B30] hover:text-[#00AAFF] hover:border-[#00AAFF]/50 text-white font-bold border border-[#333] transition-colors"><ThumbsUp size={20} /> Yes</button>
                          <button onClick={() => setHelpfulStatus('no')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-[#242424] hover:bg-[#2A2B30] hover:text-[#FF4444] hover:border-[#FF4444]/50 text-white font-bold border border-[#333] transition-colors"><ThumbsDown size={20} /> No</button>
                        </div>
                      ) : (
                        <div className="text-[#00AAFF] font-black text-lg bg-[#00AAFF]/10 px-6 py-3 rounded-2xl border border-[#00AAFF]/30 animate-in fade-in zoom-in duration-300">
                          {helpfulStatus === 'yes' ? 'Thanks for your feedback!' : 'Thanks, we will improve this.'}
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
