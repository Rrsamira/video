
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Sparkles, Layout, Crown, Settings, ChevronRight, Send, 
  Play, Download, Plus, Zap, Image as ImageIcon, Video, 
  Volume2, FastForward, Upload, X, Loader2, Sparkle,
  Undo2, Redo2, Wand2, Search, Film, Palette, Check, Layers, Monitor, Smartphone, Lock,
  ArrowRightLeft, ArrowDownToLine, Move, Clock
} from 'lucide-react';
import { ProjectState, VideoClip, EditTool, AIFilter } from './types';
import Toolbar from './components/Editor/Toolbar';
import PreviewWindow from './components/Editor/PreviewWindow';
import Timeline from './components/Editor/Timeline';
import { 
  processAICommand, fastAIResponse, 
  generateHighQualityImage, generateVeoVideo, 
  analyzeVideoContent, generateSpeech,
} from './services/geminiService';
import { AI_FILTERS, CATEGORIES } from './data/filters';

const imageStyles = ['Cinematic', 'Realistic', 'Anime', 'Digital Art', '3D Render', 'Sketch'];

const App: React.FC = () => {
  const [view, setView] = useState<'splash' | 'home' | 'editor'>('splash');
  const [aiLoading, setAiLoading] = useState(false);
  const [command, setCommand] = useState('');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Generation States
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [endingImage, setEndingImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [imageStyle, setImageStyle] = useState<string>('Cinematic');
  const [aiTab, setAiTab] = useState<'image' | 'video'>('image');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoResolution, setVideoResolution] = useState<'720p' | '1080p'>('720p');
  
  const [recentGen, setRecentGen] = useState<string | null>(null);
  const [veoProgress, setVeoProgress] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  // Filter Studio State
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');

  const magicInputRef = useRef<HTMLInputElement>(null);

  // History for Undo/Redo
  const [past, setPast] = useState<ProjectState[]>([]);
  const [future, setFuture] = useState<ProjectState[]>([]);

  const [state, setState] = useState<ProjectState>({
    name: 'Hollywood Masterpiece',
    clips: [
      { id: '1', name: 'Opening Sequence', duration: 15, startTime: 0, thumbnail: 'https://picsum.photos/seed/edit1/400/225' },
      { id: '2', name: 'Drone Landscape', duration: 25, startTime: 15, thumbnail: 'https://picsum.photos/seed/edit2/400/225' },
      { id: '3', name: 'Close-up Detail', duration: 10, startTime: 40, thumbnail: 'https://picsum.photos/seed/edit3/400/225' },
    ],
    currentTime: 0,
    totalDuration: 50,
    isPlaying: false,
    selectedClipId: null,
    activeTool: EditTool.AI,
    isPremium: false,
  });

  const updateState = useCallback((newState: ProjectState | ((prev: ProjectState) => ProjectState), skipHistory: boolean = false) => {
    setState(prev => {
      const resolved = typeof newState === 'function' ? newState(prev) : newState;
      if (!skipHistory) {
        const hasClipsChanged = JSON.stringify(prev.clips) !== JSON.stringify(resolved.clips);
        if (hasClipsChanged) {
          setPast(p => [...p, prev]);
          setFuture([]);
        }
      }
      return resolved;
    });
  }, []);

  const handleUpdateClip = useCallback((clipId: string, updates: Partial<VideoClip>) => {
    updateState(p => ({
      ...p,
      clips: p.clips.map(c => c.id === clipId ? { ...c, ...updates } : c)
    }));
  }, [updateState]);

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(past.slice(0, past.length - 1));
    setFuture(f => [state, ...f]);
    setState(previous);
  }, [past, state]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(future.slice(1));
    setPast(p => [...p, state]);
    setState(next);
  }, [future, state]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo(); else handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  useEffect(() => {
    let interval: any;
    if (state.isPlaying) {
      interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          currentTime: prev.currentTime >= prev.totalDuration ? 0 : prev.currentTime + 0.1
        }));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [state.isPlaying]);

  useEffect(() => {
    const timer = setTimeout(() => setView('home'), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'start') setUploadingImage(reader.result as string);
        else setEndingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const ensureApiKey = async () => {
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      return true;
    }
    return true;
  };

  const handleVeoGenerate = async (prompt?: string) => {
    const finalPrompt = prompt || command || magicPrompt;
    if (!uploadingImage || !finalPrompt.trim()) return;
    
    setAiLoading(true);
    setVeoProgress('Authenticating with Veo Core...');
    await ensureApiKey();
    setVeoProgress('Analyzing Motion Physics...');
    
    try {
      const startBase64 = uploadingImage.split(',')[1];
      // Note: In real Veo usage, endingImage would be passed to generateVeoVideo
      // We'll simulate the call here using the existing service
      const videoUrl = await generateVeoVideo(startBase64, finalPrompt, videoAspectRatio);
      
      if (videoUrl) {
        setRecentGen(uploadingImage);
        const newClip: VideoClip = {
          id: Date.now().toString(),
          name: "Veo Production",
          duration: 7,
          startTime: state.totalDuration,
          thumbnail: uploadingImage
        };
        updateState(p => ({
          ...p,
          clips: [...p.clips, newClip],
          totalDuration: p.totalDuration + 7
        }));
        setVeoProgress('Ready for Playback!');
      }
    } catch (e) {
      console.error(e);
      setVeoProgress('Production Error.');
    } finally {
      setAiLoading(false);
      setTimeout(() => setVeoProgress(''), 3000);
    }
  };

  const handleImagenGenerate = async (prompt?: string) => {
    const corePrompt = prompt || command || magicPrompt;
    if (!corePrompt.trim()) return;
    
    setAiLoading(true);
    await ensureApiKey();
    const finalPrompt = `${imageStyle} style: ${corePrompt}. Highly detailed, 8k resolution.`;
    
    try {
      const imageUrl = await generateHighQualityImage(finalPrompt, imageSize);
      if (imageUrl) {
        setRecentGen(imageUrl);
        const newClip: VideoClip = {
          id: Date.now().toString(),
          name: `${imageStyle}: ${corePrompt.slice(0, 10)}...`,
          duration: 5,
          startTime: state.totalDuration,
          thumbnail: imageUrl
        };
        updateState(p => ({
          ...p,
          clips: [...p.clips, newClip],
          totalDuration: p.totalDuration + 5
        }));
      }
    } catch (e) { console.error(e); } finally { setAiLoading(false); }
  };

  const handleMagicGenerate = async () => {
    if (!magicPrompt.trim()) return;
    if (magicPrompt.toLowerCase().includes('video') || magicPrompt.toLowerCase().includes('animate')) {
      if (!uploadingImage) {
        setAnalysisResult("A source image is required for motion generation.");
        return;
      }
      await handleVeoGenerate(magicPrompt);
    } else {
      await handleImagenGenerate(magicPrompt);
    }
    setMagicPrompt('');
  };

  const handleAICommandGeneral = async () => {
    if (!command.trim()) return;
    setAiLoading(true);
    try {
      if (state.activeTool === EditTool.AI) {
        if (aiTab === 'image') await handleImagenGenerate();
        else await handleVeoGenerate();
      } else {
        const res = await processAICommand(command);
        setAnalysisResult(res.description);
      }
      setCommand('');
    } catch (e) { console.error(e); } finally { setAiLoading(false); }
  };

  const filteredFilters = useMemo(() => {
      return AI_FILTERS.filter(f => {
          const matchCategory = filterCategory === 'all' || f.category === filterCategory;
          const matchSearch = f.name.toLowerCase().includes(filterSearch.toLowerCase()) || f.description.toLowerCase().includes(filterSearch.toLowerCase());
          return matchCategory && matchSearch;
      });
  }, [filterCategory, filterSearch]);

  const selectedClip = state.clips.find(c => c.id === state.selectedClipId);

  if (view === 'splash') {
    return (
      <div className="h-screen w-screen bg-[#111827] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-[#6366F1] blur-3xl opacity-20 animate-pulse" />
          <div className="w-32 h-32 bg-[#1F2937] border border-gray-800 rounded-3xl flex items-center justify-center shadow-2xl mb-8 relative z-10">
            <Sparkles className="text-[#6366F1] w-16 h-16" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-2 tracking-tighter">EditFlow <span className="text-[#6366F1]">Pro</span></h1>
        <p className="text-gray-500 font-semibold tracking-[0.3em] uppercase text-[10px]">Advanced Creative Suite</p>
      </div>
    );
  }

  if (view === 'home') {
    return (
      <div className="h-screen w-screen bg-[#0d1117] text-white flex flex-col font-sans">
        <nav className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#111827]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#6366F1] rounded-lg text-white shadow-lg shadow-indigo-500/20">
              <Sparkles size={20} />
            </div>
            <span className="font-bold text-xl tracking-tighter">EditFlow Pro</span>
          </div>
          <button onClick={() => setShowPremiumModal(true)} className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#6366F1] hover:bg-indigo-500 transition-all">
            <Crown size={16} />
            <span>{state.isPremium ? 'PRO ACTIVE' : 'UPGRADE'}</span>
          </button>
        </nav>
        <main className="flex-1 flex flex-col items-center justify-center p-10 bg-gradient-to-b from-[#111827] to-[#0d1117]">
          <div className="max-w-6xl w-full">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-2 tracking-tight">Project Hub</h2>
                <p className="text-gray-400">Collaborative video editing with Native Gemini Intelligence.</p>
              </div>
              <button onClick={() => setView('editor')} className="bg-white text-black px-8 py-4 rounded-2xl font-bold shadow-2xl hover:scale-105 transition-all flex items-center space-x-3">
                <Plus size={20} />
                <span>Create Production</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div onClick={() => setView('editor')} className="group relative bg-[#111827] rounded-3xl p-5 border border-gray-800 cursor-pointer hover:border-indigo-500/50 transition-all overflow-hidden">
                <img src="https://picsum.photos/seed/editor/800/450" className="aspect-video w-full rounded-2xl object-cover mb-4 group-hover:scale-110 transition-transform duration-1000" />
                <h3 className="font-bold text-xl mb-1">{state.name}</h3>
                <p className="text-gray-500 text-sm flex items-center">
                  <Clock size={12} className="mr-2" /> Last modified: Just now
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0d1117] flex flex-col overflow-hidden text-white font-sans">
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-4 bg-[#111827] z-50 shadow-lg">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('home')} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all">
            <Layout size={22} />
          </button>
          <div className="h-6 w-px bg-gray-800" />
          <h1 className="text-sm font-bold tracking-tight">{state.name}</h1>
          <div className="flex items-center space-x-1 ml-6 bg-gray-900/50 rounded-xl p-1 border border-gray-800">
            <button onClick={handleUndo} disabled={past.length === 0} className="p-2 text-gray-400 disabled:opacity-20 hover:text-white"><Undo2 size={18} /></button>
            <button onClick={handleRedo} disabled={future.length === 0} className="p-2 text-gray-400 disabled:opacity-20 hover:text-white"><Redo2 size={18} /></button>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8">
          <div className="flex items-center bg-[#1F2937] border border-gray-700 rounded-2xl px-5 py-2.5 shadow-2xl transition-all ring-1 ring-white/5">
             <Wand2 size={20} className="mr-3 text-indigo-400" />
             <input value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleMagicGenerate()} placeholder="Magic Assist: 'Animate this sunset' or 'Apply Noir'..." className="flex-1 bg-transparent border-none text-sm focus:ring-0 placeholder-gray-600 font-medium" />
             <button onClick={handleMagicGenerate} disabled={!magicPrompt.trim() || aiLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-20">
               {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <span>Execute</span>}
             </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="bg-white text-black px-6 py-2 text-xs font-bold rounded-xl shadow-xl hover:scale-105 transition-all">Publish</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Toolbar activeTool={state.activeTool} onSelectTool={(tool) => updateState(p => ({ ...p, activeTool: tool }))} />
        
        <main className="flex-1 flex flex-col bg-[#0d1117] p-4 space-y-4">
          <div className="flex-1 flex space-x-4 overflow-hidden">
            {/* DYNAMIC SIDEBAR */}
            <div className="w-80 bg-[#111827] rounded-3xl border border-gray-800 flex flex-col shadow-2xl overflow-hidden">
              
              {state.activeTool === EditTool.FILTER ? (
                /* FILTER STUDIO Interface (Already Implemented) */
                <div className="flex flex-col h-full">
                  <div className="p-5 border-b border-gray-800 bg-gradient-to-r from-emerald-500/10 to-transparent">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[11px] font-bold uppercase text-emerald-400 tracking-[0.2em] flex items-center">
                          <Palette size={14} className="mr-2" /> AI Filter Lab
                        </h3>
                     </div>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input 
                          type="text" 
                          placeholder="Search filters..." 
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-emerald-500 transition-all"
                        />
                     </div>
                  </div>
                  
                  <div className="flex p-2 gap-1 overflow-x-auto custom-scrollbar no-scrollbar border-b border-gray-800 bg-gray-900/20">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => setFilterCategory(cat.id)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight transition-all ${filterCategory === cat.id ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                    {!state.selectedClipId && (
                      <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-6">
                        <Palette size={48} className="mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Select a clip to apply AI filters</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {filteredFilters.map(f => (
                        <button 
                          key={f.id}
                          onClick={() => {
                            if (f.premium && !state.isPremium) {
                              setShowPremiumModal(true);
                              return;
                            }
                            if (state.selectedClipId) handleUpdateClip(state.selectedClipId, { filter: f.id });
                          }}
                          className={`group flex flex-col text-left rounded-2xl border p-2 transition-all ${
                            selectedClip?.filter === f.id ? 'bg-emerald-500/10 border-emerald-500' : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          <div className="aspect-square w-full rounded-xl overflow-hidden mb-2 relative bg-gray-800 flex items-center justify-center text-3xl">
                             {f.icon}
                             {f.premium && !state.isPremium && <div className="absolute top-2 right-2 p-1 bg-amber-500 rounded-md text-white"><Lock size={10} /></div>}
                             {selectedClip?.filter === f.id && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"><Check className="text-emerald-400" size={24} /></div>}
                          </div>
                          <span className="text-[10px] font-bold truncate block">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* ADVANCED AI GENERATION STUDIO */
                <div className="flex flex-col h-full">
                  <div className="p-2 flex bg-gray-900/50 border-b border-gray-800">
                    <button 
                      onClick={() => setAiTab('image')} 
                      className={`flex-1 flex items-center justify-center space-x-2 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${aiTab === 'image' ? 'bg-[#6366F1] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                      <ImageIcon size={14} /> <span>Still Lab</span>
                    </button>
                    <button 
                      onClick={() => setAiTab('video')} 
                      className={`flex-1 flex items-center justify-center space-x-2 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${aiTab === 'video' ? 'bg-[#10B981] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Video size={14} /> <span>Cinematic Lab</span>
                    </button>
                  </div>

                  <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar">
                    {aiTab === 'image' ? (
                      /* Still Lab UI */
                      <>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center"><Layers size={14} className="mr-2" /> Style Intent</label>
                          <div className="flex flex-wrap gap-2">
                            {imageStyles.map(style => (
                              <button key={style} onClick={() => setImageStyle(style)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${imageStyle === style ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-gray-800/40 border-gray-800 text-gray-500'}`}>{style}</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Base Prompt</label>
                          <textarea value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Cyberpunk landscape with neon rain..." className="w-full bg-black/40 border border-gray-800 rounded-2xl p-4 text-xs text-white focus:border-indigo-500 h-24 resize-none transition-all" />
                          <button onClick={() => handleImagenGenerate()} disabled={aiLoading || !command.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl text-xs font-bold transition-all disabled:opacity-20 flex items-center justify-center">
                            {aiLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                            Create Image Segment
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Advanced Cinematic Lab UI */
                      <>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center"><Film size={14} className="mr-2" /> Production Specs</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <span className="text-[9px] text-gray-600 uppercase font-bold">Aspect Ratio</span>
                              <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
                                <button onClick={() => setVideoAspectRatio('16:9')} className={`flex-1 p-2 rounded-lg transition-all ${videoAspectRatio === '16:9' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}><Monitor size={14} className="mx-auto" /></button>
                                <button onClick={() => setVideoAspectRatio('9:16')} className={`flex-1 p-2 rounded-lg transition-all ${videoAspectRatio === '9:16' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}><Smartphone size={14} className="mx-auto" /></button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <span className="text-[9px] text-gray-600 uppercase font-bold">Resolution</span>
                              <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
                                <button onClick={() => setVideoResolution('720p')} className={`flex-1 py-2 rounded-lg text-[9px] font-bold transition-all ${videoResolution === '720p' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}>720P</button>
                                <button onClick={() => setVideoResolution('1080p')} className={`flex-1 py-2 rounded-lg text-[9px] font-bold transition-all ${videoResolution === '1080p' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}>1080P</button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-gray-800/50">
                           <div className="flex items-center justify-between">
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Keyframe Guidance</label>
                             <span className="text-[8px] text-emerald-500/60 font-bold uppercase">Start & End (Optional)</span>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              {!uploadingImage ? (
                                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-800 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer bg-black/20 group">
                                  <Upload size={18} className="text-gray-700 mb-2 group-hover:text-emerald-500" />
                                  <span className="text-[8px] text-gray-600 font-bold uppercase">Start</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'start')} className="hidden" />
                                </label>
                              ) : (
                                <div className="relative group aspect-square rounded-2xl overflow-hidden border border-emerald-500/30 shadow-lg">
                                  <img src={uploadingImage} className="w-full h-full object-cover" />
                                  <button onClick={() => setUploadingImage(null)} className="absolute top-1 right-1 p-1 bg-black/80 text-white rounded-full"><X size={10} /></button>
                                </div>
                              )}

                              {!endingImage ? (
                                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-800 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer bg-black/20 group">
                                  <Upload size={18} className="text-gray-700 mb-2 group-hover:text-indigo-500" />
                                  <span className="text-[8px] text-gray-600 font-bold uppercase">End</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'end')} className="hidden" />
                                </label>
                              ) : (
                                <div className="relative group aspect-square rounded-2xl overflow-hidden border border-indigo-500/30 shadow-lg">
                                  <img src={endingImage} className="w-full h-full object-cover" />
                                  <button onClick={() => setEndingImage(null)} className="absolute top-1 right-1 p-1 bg-black/80 text-white rounded-full"><X size={10} /></button>
                                </div>
                              )}
                           </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center">
                            <Move size={12} className="mr-2" /> Motion Instructions
                          </label>
                          <textarea 
                            value={command} 
                            onChange={(e) => setCommand(e.target.value)} 
                            placeholder="Describe the cinematic action... 'Cinematic pan around the mountain' or 'Explosive reveal'..." 
                            className="w-full bg-black/40 border border-gray-800 rounded-2xl p-4 text-xs text-white focus:border-emerald-500 h-28 resize-none transition-all placeholder-gray-800" 
                          />
                          <button 
                            onClick={() => handleVeoGenerate()} 
                            disabled={aiLoading || !command.trim() || !uploadingImage} 
                            className="w-full group bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-2xl text-xs font-bold transition-all disabled:opacity-20 flex items-center justify-center shadow-xl shadow-emerald-500/10"
                          >
                            {aiLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Zap size={16} className="mr-2 group-hover:scale-125 transition-transform" />}
                            Process Veo Production
                          </button>
                          {veoProgress && (
                            <div className="flex flex-col items-center space-y-2 animate-in fade-in">
                               <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{veoProgress}</p>
                               <div className="w-full h-0.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 animate-progress-indeterminate" />
                               </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PREVIEW & MAIN INTERACTION */}
            <div className="flex-1 flex flex-col space-y-4">
               <PreviewWindow state={state} onTogglePlay={() => setState(p => ({ ...p, isPlaying: !p.isPlaying }))} />
               <div className="bg-[#111827] rounded-3xl p-5 border border-gray-800 flex flex-col shadow-2xl ring-1 ring-white/5">
                  <div className="flex items-center space-x-5 px-2">
                    <Sparkles size={24} className="text-indigo-400" />
                    <input 
                      value={command} 
                      onChange={(e) => setCommand(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleAICommandGeneral()} 
                      placeholder="Instruct your creative assistant... 'Apply teal filter', 'Add subtitle', 'Animate this'..." 
                      className="flex-1 bg-transparent border-none text-base focus:ring-0 placeholder-gray-700 font-bold tracking-tight" 
                    />
                    <button onClick={handleAICommandGeneral} disabled={aiLoading} className="bg-indigo-600 text-white p-3.5 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50">
                      {aiLoading ? <Zap size={22} className="animate-spin" /> : <Send size={22} />}
                    </button>
                  </div>
               </div>
            </div>
          </div>
          <Timeline state={state} onSeek={(time) => setState(p => ({ ...p, currentTime: time }))} onSelectClip={(id) => updateState(p => ({ ...p, selectedClipId: id }))} onUpdateClip={handleUpdateClip} />
        </main>
      </div>
      
      <footer className="h-10 bg-black flex items-center justify-between px-8 text-[9px] text-gray-600 tracking-[0.3em] uppercase border-t border-gray-900 font-bold">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
             <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
             <span>GEMINI AI CORE</span>
          </div>
          <div className="w-px h-3 bg-gray-800" />
          <div className="flex items-center space-x-2">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
             <span>VEO 3.1 ENGINE</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <span className="text-emerald-500">KERNEL: v2.5.8-STABLE</span>
        </div>
      </footer>

      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111827] rounded-[2.5rem] max-w-xl w-full p-10 relative shadow-[0_0_150px_rgba(99,102,241,0.15)] border border-gray-800 overflow-hidden text-center">
            <button onClick={() => setShowPremiumModal(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors bg-gray-800/50 rounded-full"><X size={20} /></button>
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/20"><Crown size={48} /></div>
            <h2 className="text-3xl font-bold mb-4 tracking-tighter">Unlock EditFlow Pro Lab</h2>
            <p className="text-gray-400 mb-10 max-w-sm mx-auto leading-relaxed">Access 100+ Advanced Cinematic Filters, 4K Image Upscaling, and Unlimited Veo Motion Generations at 1080p.</p>
            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
               <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700/50">
                  <span className="text-emerald-400 font-bold text-[10px] block mb-1">PRO ENGINE</span>
                  <p className="text-[11px] text-gray-400">1080p Cinematic Exports</p>
               </div>
               <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700/50">
                  <span className="text-sky-400 font-bold text-[10px] block mb-1">AI MODELS</span>
                  <p className="text-[11px] text-gray-400">Access to Pro Reasoning</p>
               </div>
            </div>
            <button onClick={() => { updateState(p => ({ ...p, isPremium: true })); setShowPremiumModal(false); }} className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-5 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95">Upgrade to Lifetime Pro</button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes progress-indeterminate {
          0% { left: -100%; width: 100%; }
          100% { left: 100%; width: 100%; }
        }
        .animate-progress-indeterminate {
          position: relative;
          animation: progress-indeterminate 1.5s infinite linear;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default App;
