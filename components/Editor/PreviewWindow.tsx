
import React, { useMemo } from 'react';
import { Play, Pause, Maximize, Settings, Sparkles } from 'lucide-react';
import { ProjectState } from '../../types';
import { AI_FILTERS } from '../../data/filters';

interface PreviewWindowProps {
  state: ProjectState;
  onTogglePlay: () => void;
}

const PreviewWindow: React.FC<PreviewWindowProps> = ({ state, onTogglePlay }) => {
  const activeClip = useMemo(() => 
    state.clips.find(c => state.currentTime >= c.startTime && state.currentTime <= c.startTime + c.duration),
    [state.clips, state.currentTime]
  );

  const filterStyle = useMemo(() => {
    if (!activeClip?.filter) return {};
    const filterDef = AI_FILTERS.find(f => f.id === activeClip.filter);
    if (!filterDef) return {};
    
    // Return custom styles from metadata if available
    if (filterDef.style) return filterDef.style;

    // Fallback logic for generic types if metadata is missing
    switch (filterDef.category) {
      case 'cinematic': return { filter: 'contrast(1.2) saturate(0.8) sepia(0.2)' };
      case 'vintage': return { filter: 'sepia(0.6) brightness(0.9) contrast(0.8)' };
      case 'bw': return { filter: 'grayscale(1) contrast(1.1)' };
      case 'ai': return { filter: 'saturate(1.5) contrast(1.1)', border: '1px solid rgba(16, 185, 129, 0.3)' };
      default: return {};
    }
  }, [activeClip]);

  return (
    <div className="flex-1 bg-black rounded-3xl overflow-hidden flex flex-col relative group border border-gray-800 shadow-2xl">
      {/* Viewport */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gray-900/40">
        {activeClip ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <div 
              className="w-full h-full bg-cover bg-center transition-all duration-700 ease-out"
              style={{ 
                backgroundImage: `url(${activeClip.thumbnail})`,
                ...filterStyle
              }}
            />
            
            {/* AI HUD OVERLAY */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-black/10" />
            <div className="absolute top-6 left-6 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-code tracking-widest text-white/80">LIVE RENDERING</span>
            </div>
            
            {activeClip.filter && (
              <div className="absolute bottom-6 left-6 flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30">
                  <Sparkles size={12} className="text-emerald-400" />
                  <span className="text-[9px] font-bold tracking-widest text-emerald-400 uppercase">FX: {AI_FILTERS.find(f => f.id === activeClip.filter)?.name}</span>
              </div>
            )}

            {!state.isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] text-white">
                <div className="bg-white/10 p-6 rounded-full border border-white/10 hover:scale-110 transition-transform cursor-pointer" onClick={onTogglePlay}>
                    <Play size={48} fill="white" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-700 flex flex-col items-center">
            <Settings className="w-16 h-16 mb-4 animate-pulse opacity-20" />
            <p className="text-xs uppercase tracking-[0.4em] font-bold">Monitor: Offline</p>
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-8 bg-black/80 backdrop-blur-2xl px-8 py-3 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all shadow-2xl translate-y-4 group-hover:translate-y-0">
          <button onClick={onTogglePlay} className="text-white hover:text-sky-400 transition-colors">
            {state.isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" />}
          </button>
          <div className="h-6 w-px bg-white/10" />
          <button className="text-white/60 hover:text-white transition-colors">
             <Maximize size={24} />
          </button>
        </div>
      </div>

      {/* Professional Footer Bar */}
      <div className="bg-[#111827] h-10 flex items-center justify-between px-6 border-t border-gray-800">
        <div className="flex items-center space-x-4">
           <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">720p HD</span>
           <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">24 FPS</span>
        </div>
        <div className="flex items-center space-x-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
           <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Engine Optimized</span>
        </div>
      </div>
    </div>
  );
};

export default PreviewWindow;
