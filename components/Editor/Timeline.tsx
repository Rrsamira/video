
import React, { useRef, useState, useEffect } from 'react';
import { ProjectState, VideoClip } from '../../types';

interface TimelineProps {
  state: ProjectState;
  onSeek: (time: number) => void;
  onSelectClip: (id: string) => void;
  onUpdateClip: (clipId: string, updates: Partial<VideoClip>) => void;
}

const Timeline: React.FC<TimelineProps> = ({ state, onSeek, onSelectClip, onUpdateClip }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pxPerSec = 40;

  // Trimming State
  const [trimming, setTrimming] = useState<{ id: string; side: 'start' | 'end'; initialX: number; initialStart: number; initialDuration: number } | null>(null);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (trimming) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft;
    const time = x / pxPerSec;
    onSeek(Math.min(Math.max(0, time), state.totalDuration));
  };

  const onTrimStart = (e: React.MouseEvent, clip: VideoClip, side: 'start' | 'end') => {
    e.stopPropagation();
    setTrimming({
      id: clip.id,
      side,
      initialX: e.clientX,
      initialStart: clip.startTime,
      initialDuration: clip.duration
    });
  };

  useEffect(() => {
    if (!trimming) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - trimming.initialX;
      const deltaTime = deltaX / pxPerSec;

      if (trimming.side === 'start') {
        const newStart = Math.max(0, trimming.initialStart + deltaTime);
        const newDuration = Math.max(0.5, trimming.initialDuration - (newStart - trimming.initialStart));
        onUpdateClip(trimming.id, { startTime: newStart, duration: newDuration });
      } else {
        const newDuration = Math.max(0.5, trimming.initialDuration + deltaTime);
        onUpdateClip(trimming.id, { duration: newDuration });
      }
    };

    const handleMouseUp = () => {
      setTrimming(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [trimming, onUpdateClip]);

  const playheadPosition = state.currentTime * pxPerSec;

  return (
    <div className="h-64 bg-[#1F2937] border-t border-gray-800 flex flex-col">
      {/* Time Header */}
      <div className="h-8 border-b border-gray-800 flex items-center relative overflow-hidden bg-[#111827]">
        <div className="absolute left-0 top-0 bottom-0" style={{ width: state.totalDuration * pxPerSec }}>
          {Array.from({ length: Math.ceil(state.totalDuration) + 1 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute h-full border-l border-gray-700 flex items-end pb-1 pl-1 text-[9px] text-gray-500 font-code"
              style={{ left: i * pxPerSec }}
            >
              {i}s
            </div>
          ))}
        </div>
      </div>

      {/* Tracks Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative select-none"
        onClick={handleTimelineClick}
      >
        <div 
          className="h-full relative" 
          style={{ width: Math.max(state.totalDuration, 60) * pxPerSec }}
        >
          {/* Track 1: Video */}
          <div className="h-16 mt-4 relative bg-gray-800/20 flex items-center">
             {state.clips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectClip(clip.id);
                  }}
                  className={`absolute h-12 rounded border transition-all cursor-pointer overflow-hidden ${
                    state.selectedClipId === clip.id 
                      ? 'border-[#0EA5E9] bg-[#0EA5E9]/20 ring-2 ring-[#0EA5E9]/50 z-10' 
                      : 'border-gray-600 bg-gray-700'
                  }`}
                  style={{
                    left: clip.startTime * pxPerSec,
                    width: clip.duration * pxPerSec,
                  }}
                >
                  <div className="h-full w-full bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${clip.thumbnail})` }} />
                  <div className="absolute inset-0 p-1 text-[10px] font-semibold truncate bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    {clip.name}
                  </div>
                  
                  {/* Trim Handles - Only visible/active on selected clip */}
                  {state.selectedClipId === clip.id && (
                    <>
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-2 bg-[#6366F1] cursor-ew-resize hover:w-3 transition-all flex items-center justify-center group"
                        onMouseDown={(e) => onTrimStart(e, clip, 'start')}
                      >
                        <div className="w-0.5 h-4 bg-white/50 rounded-full" />
                      </div>
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-2 bg-[#6366F1] cursor-ew-resize hover:w-3 transition-all flex items-center justify-center"
                        onMouseDown={(e) => onTrimStart(e, clip, 'end')}
                      >
                         <div className="w-0.5 h-4 bg-white/50 rounded-full" />
                      </div>
                    </>
                  )}
                </div>
             ))}
          </div>

          {/* Track 2: Audio Placeholder Track */}
          <div className="h-10 mt-2 relative bg-emerald-900/10 flex items-center border-t border-gray-800/50">
             <div className="absolute left-0 right-0 h-4 bg-emerald-500/10 flex items-center overflow-hidden">
                <div className="w-full h-full opacity-30 flex items-center">
                    {Array.from({ length: 150 }).map((_, i) => (
                        <div key={i} className="w-0.5 bg-emerald-400 mx-px" style={{ height: (Math.sin(i * 0.2) * 50 + 50) + '%' }} />
                    ))}
                </div>
             </div>
          </div>

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-red-500 z-40 pointer-events-none"
            style={{ left: playheadPosition }}
          >
            <div className="absolute top-0 -left-1.5 w-3 h-3 bg-red-500 rotate-45" />
          </div>
        </div>
      </div>

      {/* Timeline Controls Footer */}
      <div className="h-10 bg-[#111827] px-4 flex items-center justify-between border-t border-gray-800">
        <div className="flex items-center space-x-4 text-xs font-code text-gray-400">
          <span className="text-sky-400">{state.currentTime.toFixed(2)}s</span>
          <span>/</span>
          <span>{state.totalDuration.toFixed(2)}s</span>
        </div>
        <div className="flex items-center space-x-4">
           {state.isPremium && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-bold tracking-tighter">AI ENGINE READY</span>}
           <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#0EA5E9]" style={{ width: (state.currentTime / state.totalDuration * 100) + '%' }} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
