import React, { useState } from 'react';
import { Search, X, Music, SlidersHorizontal, MousePointerClick, AudioWaveform, Clock } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function HelpModal({ onClose }: Props) {
  const [searchWord, setSearchWord] = useState('');

  const helpTopics = [
    {
      title: 'Adding & Sequencing Beats',
      icon: <MousePointerClick className="w-5 h-5 text-[#00AAFF]" />,
      tags: ['click', 'press', 'add', 'beat', 'delete', 'remove', 'sequence'],
      content: `• Click any gray rectangle in the track timeline to add a beat.\n• Click an active beat again to remove it.\n• You can quickly sequence beats by tapping along the track timeline.`
    },
    {
      title: 'Micro-Timing & Advanced Settings',
      icon: <Clock className="w-5 h-5 text-[#FF4444]" />,
      tags: ['long click', 'hold', 'right click', 'micro', 'timing', 'offset', 'velocity', 'pitch', 'duration'],
      content: `• First, add a beat so it is active (colored).\n• LONG-CLICK (hold it down) or RIGHT-CLICK the active beat to open the Advanced Step Settings menu.\n• Velocity: Adjust how hard the note is hit.\n• Pitch (Melodic Tracks): Shift the exact key of that specific note.\n• Duration: Dictates how long the synth plays (Stretch).\n• Step Span (Hold): Visually drag the note over multiple grid squares.\n• Offset: Micro-timing. Shift the beat slightly early or late. An offset visual dot will appear on the beat!`
    },
    {
      title: 'Using the Sampler',
      icon: <AudioWaveform className="w-5 h-5 text-[#AA00FF]" />,
      tags: ['sampler', 'upload', 'audio', 'wav', 'mp3', 'clip', 'trim', 'speed', 'root'],
      content: `• Add a new track and set the instrument to 'Sampler'.\n• Click 'UPLOAD SAMPLE' to load any .mp3 or .wav file from your computer.\n• IMPORTANT: Sampler tracks are saved to your browser session. \n• SPEED: Make the sample playback faster or slower.\n• START/END: Trim the exact piece of the sample you want to hear.\n• ROOT NOTE: Setting the root pitch lets you play your custom sample like a piano across different pitches! (Via Right-Click -> Step Settings)`
    },
    {
      title: 'Master Effects (FX)',
      icon: <SlidersHorizontal className="w-5 h-5 text-[#22cc22]" />,
      tags: ['reverb', 'delay', 'echo', 'compression', 'eq', 'filter', 'master'],
      content: `• The bottom strip contains global Master Effects affecting your whole song.\n• COMP THR & RATIO: This controls compression. It makes quiet sounds louder and loud sounds smoother.\n• ECHO (Delay) & VERB (Reverb): Adds 3D space and bounce to your overall track.\n• EQ (Low, Mid, High): Boost the lows for more bass, or cut highs to reduce harshness.`
    },
    {
      title: 'SFX Studio (Sound Design)',
      icon: <Music className="w-5 h-5 text-[#ff8800]" />,
      tags: ['sfx', 'synth', 'design', 'generator', 'laser', 'explosion', 'coin'],
      content: `• Click 'BACK' to return to the main menu and enter the SFX STUDIO mode.\n• SFX Studio lets you synthesize video game sounds like Lasers, Explosions, and Powerups.\n• Use the Modulator panel (FM/AM) to drastically mutate the sound.\n• Once you design a sound you like, you can 'EXPORT WAV' and upload it inside MIDI Studio!`
    }
  ];

  const filteredTopics = helpTopics.filter(topic => 
    topic.title.toLowerCase().includes(searchWord.toLowerCase()) || 
    topic.content.toLowerCase().includes(searchWord.toLowerCase()) ||
    topic.tags.some(t => t.includes(searchWord.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#151619] border border-[#333] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#8E9299] hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <div className="p-6 border-b border-[#333] flex flex-col gap-4 shrink-0">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            HELP CENTER
          </h2>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-[#8E9299] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search guides, features, terms..." 
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              className="w-full bg-[#1a1b20] border border-[#333] text-white rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#00AAFF] transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
          {filteredTopics.length === 0 ? (
            <div className="text-center text-[#8E9299] py-10">
              No results found for "{searchWord}"
            </div>
          ) : (
            filteredTopics.map((topic, i) => (
              <div key={i} className="bg-[#1a1b20] border border-[#333] rounded-xl p-5 hover:border-[#444] transition-colors">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                  <div className="bg-[#242424] p-2 rounded-lg border border-[#333]">{topic.icon}</div>
                  {topic.title}
                </h3>
                <div className="text-sm text-[#8E9299] leading-relaxed whitespace-pre-line ml-[52px]">
                  {topic.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
