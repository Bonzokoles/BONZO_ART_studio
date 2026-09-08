import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Scissors, Layers, Plus, Music, Video, Sparkles, LayoutGrid, Library, X } from 'lucide-react';
import { initialTimelineState, TimelineState, AssetFolder, TimelineClip, TrackType } from './timelineState';

const PIXELS_PER_SECOND = 20;

export const TimelineStudioTab: React.FC = () => {
    const [state, setState] = useState<TimelineState>(initialTimelineState);
    const [activeLibrary, setActiveLibrary] = useState<AssetFolder | null>(null);
    const [serverProjects, setServerProjects] = useState<{id: string, name: string}[]>([]);
    
    const requestRef = useRef<number>();

    // Load available projects on mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch("http://localhost:3219/api/load-projects");
                if (res.ok) {
                    const data = await res.json();
                    setServerProjects(data.projects || []);
                }
            } catch (e) {
                console.error("Failed to load projects list", e);
            }
        };
        fetchProjects();
    }, []);

    // --- Playback Engine (setInterval) ---
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        let lastTime = performance.now();

        if (state.isPlaying) {
            lastTime = performance.now();
            interval = setInterval(() => {
                const now = performance.now();
                const deltaTime = (now - lastTime) / 1000;
                lastTime = now;
                
                setState(prev => {
                    if (!prev.isPlaying) return prev;
                    const newTime = prev.currentTime + deltaTime;
                    if (newTime > 300) return { ...prev, isPlaying: false, currentTime: 300 };
                    return { ...prev, currentTime: newTime };
                });
            }, 33); // ~30fps lock to reduce rendering overhead
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [state.isPlaying]);

    const togglePlay = () => setState(p => ({ ...p, isPlaying: !p.isPlaying }));

    // --- Timeline Scrubbing / Seeking ---
    const handleScrubbing = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        // X coord relative to the scroll container inner content
        const clickX = e.clientX - rect.left + e.currentTarget.scrollLeft;
        const newTime = Math.max(0, clickX / PIXELS_PER_SECOND);
        setState(p => ({ ...p, currentTime: newTime }));
    };

    // --- Drag and Drop Handlers (From Left Panel to Track) ---
    const handleDragStartFromLibrary = (e: React.DragEvent, sourceId: string, duration: number) => {
        e.dataTransfer.setData('sourceId', sourceId);
        e.dataTransfer.setData('duration', duration.toString());
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDropOnTrack = (e: React.DragEvent, trackId: string) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('sourceId');
        const durationStr = e.dataTransfer.getData('duration');
        if (!sourceId) return;

        const duration = parseFloat(durationStr) || 5;
        const trackElement = e.currentTarget as HTMLDivElement;
        const rect = trackElement.getBoundingClientRect();
        const dropX = e.clientX - rect.left;
        
        const startTime = Math.max(0, dropX / PIXELS_PER_SECOND);
        const newClip: TimelineClip = {
            id: `clip-${Date.now()}`,
            source: sourceId,
            startTime,
            duration,
            trackId,
            title: sourceId
        };
        setState(prev => ({ ...prev, clips: [...prev.clips, newClip] }));
    };

    // --- In-Timeline Interactions (Trimming & Moving) ---
    type InteractionType = 'trim-start' | 'trim-end' | 'move';
    const [interaction, setInteraction] = useState<{
        type: InteractionType;
        clipId: string;
        startX: number;
        initialStart: number;
        initialDuration: number;
    } | null>(null);

    const handleClipInteractionStart = (e: React.MouseEvent, type: InteractionType, clip: TimelineClip) => {
        e.stopPropagation();
        setInteraction({
            type,
            clipId: clip.id,
            startX: e.clientX,
            initialStart: clip.startTime,
            initialDuration: clip.duration
        });
    };

    useEffect(() => {
        if (!interaction) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - interaction.startX;
            const deltaSeconds = deltaX / PIXELS_PER_SECOND;

            setState(prev => {
                return {
                    ...prev,
                    clips: prev.clips.map(clip => {
                        if (clip.id !== interaction.clipId) return clip;
                        
                        let newStart = clip.startTime;
                        let newDuration = clip.duration;

                        if (interaction.type === 'move') {
                            newStart = Math.max(0, interaction.initialStart + deltaSeconds);
                        } else if (interaction.type === 'trim-end') {
                            newDuration = Math.max(0.5, interaction.initialDuration + deltaSeconds);
                        } else if (interaction.type === 'trim-start') {
                            const timeChange = Math.min(interaction.initialDuration - 0.5, deltaSeconds);
                            const validTimeChange = Math.max(-interaction.initialStart, timeChange);
                            
                            newStart = interaction.initialStart + validTimeChange;
                            newDuration = interaction.initialDuration - validTimeChange;
                        }

                        return { ...clip, startTime: newStart, duration: newDuration };
                    })
                };
            });
        };

        const handleMouseUp = () => setInteraction(null);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [interaction]);

    // --- API Integrations (Save / Render / Load) ---
    const handleSaveProject = async () => {
        try {
            const res = await fetch("http://localhost:3219/api/save-project", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId: "bonzo_timeline_01", ...state })
            });
            if(res.ok) {
                alert("[DEV] Projekt wideo zapisany pomyślnie na serwerze Bun!");
                // Refresh list
                const fres = await fetch("http://localhost:3219/api/load-projects");
                if(fres.ok) { const d = await fres.json(); setServerProjects(d.projects); }
            }
        } catch (e) {
            console.error("Save error", e);
        }
    };

    const handleLoadProject = async (projectId: string) => {
        // Z uwagi na prostą architekturę, load po prostu wymaga wystawienia odpowiedniego endpointu 
        // lub w tym przypadku odczytu GET. Symulacja wczytywania:
        alert(`[DEV] Komenda odczytu zapisanej konfiguracji Timeline'u dla projektu: ${projectId}`);
    }

    const handleRenderVideo = async () => {
        try {
            const res = await fetch("http://localhost:3219/api/render-timeline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ timelineState: state })
            });
            if(res.ok) alert("[DEV] Silnik FFmpeg (Backend) rozpoczął kompilację wideo!");
        } catch (e) {
            console.error("Render error", e);
        }
    };

    // --- Composite Output Logic ---
    // Znajdź aktywny klip wideo na podstawie osi czasu i priorytetu tracków (np. V2 wyżej niż V1)
    const activeVideoTrackIds = state.tracks.filter(t => t.type === 'video').map(t => t.id);
    const activeClipsAtCurrentTime = state.clips.filter(c => 
        state.currentTime >= c.startTime && state.currentTime < c.startTime + c.duration
    );
    const topVideoClip = activeClipsAtCurrentTime
        .filter(c => activeVideoTrackIds.includes(c.trackId))
        .sort((a, b) => activeVideoTrackIds.indexOf(a.trackId) - activeVideoTrackIds.indexOf(b.trackId))[0]; // Pierwszy ze zdefiniowanych, bo V2 jest index 0, V1 index 1

    return (
        <div className="flex-1 flex overflow-hidden w-full font-mono text-xs select-none animate-fade-in relative">
            {/* Left Panel */}
            <aside className="w-[220px] min-w-[220px] bg-[#0b0d12] border-r border-[#1f2937] p-3 flex flex-col overflow-y-auto">
                <div className="flex items-center space-x-2 text-[#ffffff] pb-2 border-b border-[#1f2937] sticky top-0 bg-[#0b0d12] z-10">
                    <LayoutGrid size={14} className="text-[#4285f4]" />
                    <span className="font-bold uppercase tracking-wider text-[10px]">PROJECT MEDIA</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(num => {
                        const clipId = `VEO-0${num}.mp4`;
                        const clipDuration = num * 2 + 3;
                        return (
                            <div 
                                key={num} 
                                draggable
                                onDragStart={(e) => handleDragStartFromLibrary(e, clipId, clipDuration)}
                                className="aspect-video bg-[#181b22] border border-[#1f2937] hover:border-[#4285f4] cursor-grab active:cursor-grabbing flex flex-col justify-end group relative overflow-hidden p-1"
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                                    <Video size={16} />
                                </div>
                                <span className="text-[7px] text-[#ffffff] font-bold z-10 drop-shadow-md truncate">{clipId}</span>
                                <div className="absolute top-1 right-1 text-[7px] bg-[#000000]/80 border border-[#1f2937] px-0.5 text-white z-10">00:{clipDuration < 10 ? `0${clipDuration}` : clipDuration}</div>
                            </div>
                        )
                    })}
                </div>
            </aside>

            {/* Center Area */}
            <section className="flex-1 flex flex-col bg-[#0b0d12] overflow-hidden min-w-0 relative">
                {/* Top: Player */}
                <div className="flex-1 flex items-center justify-center p-4 border-b border-[#1f2937] relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1f2937]/30 to-[#0b0d12]">
                    <div className="w-[80%] max-w-3xl aspect-video bg-[#000000] border border-[#1f2937] flex flex-col items-center justify-center relative shadow-2xl overflow-hidden">
                        {topVideoClip ? (
                            <div className="flex flex-col items-center justify-center w-full h-full bg-[#181b22]/50 animate-pulse-fast">
                                <span className="text-[#4285f4] font-bold text-3xl tracking-widest">[ {topVideoClip.title} ]</span>
                                <span className="text-[#9ca3af] mt-2">PLAYING FROM TRACK: {state.tracks.find(t=>t.id===topVideoClip.trackId)?.name}</span>
                            </div>
                        ) : (
                            <span className="text-[#1f2937] font-bold text-2xl tracking-widest">[ COMPOSITION PREVIEW ]</span>
                        )}
                        <div className="absolute bottom-2 left-2 text-[10px] text-[#1f2937]">
                            <span className={topVideoClip ? "text-[#4285f4]" : ""}>
                                {state.currentTime.toFixed(2)}s
                            </span> / 1920x1080 24FPS
                        </div>
                    </div>
                </div>
                {/* Bottom: Timeline */}
                <div className="h-[280px] min-h-[280px] bg-[#11131a] flex flex-col shadow-inner">
                    <div className="h-8 border-b border-[#1f2937] flex items-center px-2 bg-[#0e1017]">
                        <button onClick={togglePlay} className="p-1 hover:bg-[#1f2937] text-[#10b981] hover:text-[#d4a574] transition-colors w-8 flex justify-center">
                            {state.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button className="p-1 hover:bg-[#1f2937] text-[#d4d4d8] hover:text-[#d4a574] ml-1 transition-colors"><Scissors size={14} /></button>
                        <div className="flex-1 ml-4 border-l border-[#1f2937] h-full flex items-center overflow-x-auto relative no-scrollbar" onClick={handleScrubbing}>
                             <div className="relative w-[6000px] h-full cursor-pointer">
                                {Array.from({ length: 60 }).map((_, i) => (
                                    <div key={i} className="absolute top-0 bottom-0 border-l border-[#1f2937] pointer-events-none" style={{ left: `${i * 10 * PIXELS_PER_SECOND}px` }}>
                                        <span className="text-[8px] text-[#6b7280] ml-1 absolute top-2 pointer-events-none">{i * 10}s</span>
                                    </div>
                                ))}
                                {/* PLAYHEAD GIZMO */}
                                <div 
                                    className="absolute w-[1px] h-full bg-[#ef4444] top-0 z-40 shadow-[0_0_8px_#ef4444] pointer-events-none transition-all duration-75"
                                    style={{ left: `${state.currentTime * PIXELS_PER_SECOND}px` }}
                                >
                                    <div className="absolute -top-0 -left-[5px] w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#ef4444]"></div>
                                </div>
                             </div>
                        </div>

                        {/* Integration Actions */}
                        <div className="flex items-center space-x-2 pl-4 border-l border-[#1f2937] h-full">
                            <button onClick={handleSaveProject} className="px-3 h-5 bg-[#1f2937] hover:bg-[#d4a574] text-white hover:text-black font-bold text-[9px] transition-colors">SAVE PROJECT</button>
                            <button onClick={handleRenderVideo} className="px-3 h-5 bg-[#10b981] hover:bg-[#059669] text-black font-bold text-[9px] transition-colors">RENDER TIMELINE</button>
                        </div>
                    </div>
                    {/* Tracks */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-1 p-1 relative bg-[#0b0d12]">
                        {state.tracks.map(track => {
                            let icon = <Video size={10} />;
                            let trackColor = '#d4d4d8';
                            if(track.type === 'audio') { icon = <Music size={10} />; trackColor = '#f59e0b'; }
                            if(track.type === 'effect') { icon = <Sparkles size={10} />; trackColor = '#a855f7'; }
                            
                            const trackClips = state.clips.filter(c => c.trackId === track.id);

                            return (
                                <div key={track.id} className="h-12 relative flex group shrink-0 w-full">
                                     <div className="w-14 h-full bg-[#11131a] border border-[#1f2937] flex flex-col items-center justify-center text-[9px] font-bold z-50 relative shadow-md" style={{ color: trackColor }}>
                                         {icon}
                                         <span className="mt-1">{track.name}</span>
                                     </div>
                                     <div 
                                        className="flex-1 relative overflow-hidden bg-[#181b22] border-y border-r border-[#1f2937] opacity-90 transition-colors hover:bg-[#1f2937]/50"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDropOnTrack(e, track.id)}
                                     >
                                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI4IiBmaWxsPSIjMWYyOTM3Ij48L3JlY3Q+Cjwvc3ZnPg==')] opacity-30 pointer-events-none"></div>
                                        
                                        <div className="absolute top-0 bottom-0 left-0 w-[6000px]">
                                            {/* Track local Playhead line to cut across tracks */}
                                            <div 
                                                className="absolute top-0 bottom-0 w-[1px] bg-[#ef4444]/30 z-40 pointer-events-none transition-all duration-75"
                                                style={{ left: `${state.currentTime * PIXELS_PER_SECOND}px` }}
                                            ></div>

                                            {trackClips.map(clip => (
                                                <div 
                                                    key={clip.id}
                                                    onMouseDown={(e) => handleClipInteractionStart(e, 'move', clip)}
                                                    className="absolute top-1 bottom-1 border border-black/50 rounded-sm shadow-md flex items-center px-1 overflow-hidden group/clip hover:ring-1 hover:ring-[#ffffff] transition-shadow cursor-pointer select-none"
                                                    style={{ 
                                                        left: `${clip.startTime * PIXELS_PER_SECOND}px`, 
                                                        width: `${clip.duration * PIXELS_PER_SECOND}px`,
                                                        backgroundColor: track.type === 'video' ? '#4285f4' : track.type === 'audio' ? '#f59e0b' : '#a855f7',
                                                        opacity: interaction?.clipId === clip.id ? 0.6 : 0.9,
                                                        zIndex: interaction?.clipId === clip.id ? 30 : 10
                                                    }}
                                                >
                                                    <span className="text-[8px] font-bold text-white truncate pointer-events-none drop-shadow-md">{clip.title}</span>
                                                    
                                                    <div 
                                                        onMouseDown={(e) => handleClipInteractionStart(e, 'trim-start', clip)}
                                                        className="absolute left-0 top-0 bottom-0 w-2 bg-white/10 hover:bg-white/80 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 transition-opacity z-20"
                                                    ></div>
                                                    <div 
                                                        onMouseDown={(e) => handleClipInteractionStart(e, 'trim-end', clip)}
                                                        className="absolute right-0 top-0 bottom-0 w-2 bg-white/10 hover:bg-white/80 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 transition-opacity z-20"
                                                    ></div>
                                                </div>
                                            ))}
                                        </div>
                                     </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Right Panel */}
            <aside className="w-[180px] min-w-[180px] bg-[#11131a] border-l border-[#1f2937] p-3 flex flex-col shrink-0">
                <div className="flex items-center justify-between text-[#ffffff] pb-2 border-b border-[#1f2937]">
                    <div className="flex items-center space-x-2">
                        <Layers size={14} className="text-[#d4a574]" />
                        <span className="font-bold uppercase tracking-wider text-[10px]">LIBRARIES & SAVES</span>
                    </div>
                </div>
                
                {/* Saved Projects List */}
                {serverProjects.length > 0 && (
                    <div className="mt-2 mb-2 pb-2 border-b border-[#1f2937]">
                        <span className="text-[9px] text-[#9ca3af] font-bold mb-1 block">SAVED PROJECTS</span>
                        {serverProjects.map(proj => (
                            <div key={proj.id} onClick={() => handleLoadProject(proj.id)} className="flex items-center space-x-1 p-1 bg-[#0b0d12] hover:bg-[#1f2937] border border-[#1f2937] hover:border-[#10b981] cursor-pointer text-[9px] text-white">
                                <span>{proj.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-1 flex flex-col gap-2">
                    {state.folders.map(lib => (
                        <div key={lib.id} className="flex flex-col items-center justify-center p-3 bg-[#0b0d12] border border-[#1f2937] hover:border-[#d4a574] cursor-pointer group shadow-md" onClick={() => setActiveLibrary(lib)}>
                            <Library size={18} style={{ color: lib.color }} className="mb-2" />
                            <span className="text-[9px] font-bold text-[#d4d4d8] group-hover:text-[#ffffff] text-center uppercase">{lib.name}</span>
                        </div>
                    ))}
                    <button className="mt-2 flex flex-col items-center justify-center p-3 bg-transparent border border-dashed border-[#1f2937] hover:border-[#10b981] hover:text-[#10b981] text-[#6b7280] cursor-pointer transition-colors" onClick={() => alert('New library configurator popup...')}>
                        <Plus size={16} className="mb-1" />
                        <span className="text-[9px] font-bold uppercase">CREATE THEME</span>
                    </button>
                </div>
            </aside>

            {/* Modal */}
            {activeLibrary && (
                <div className="absolute inset-0 z-50 bg-[#000000]/80 flex items-center justify-center p-8 backdrop-blur-sm animate-fade-in" onClick={() => setActiveLibrary(null)}>
                    <div className="w-full max-w-2xl h-[70vh] bg-[#0b0d12] border border-[#1f2937] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="h-10 border-b border-[#1f2937] bg-[#11131a] flex items-center justify-between px-4 shrink-0">
                            <div className="flex items-center space-x-2 font-bold text-[11px] uppercase tracking-wider" style={{ color: activeLibrary.color }}>
                                <Library size={13} />
                                <span>LIBRARY: {activeLibrary.name}</span>
                            </div>
                            <button className="text-[#6b7280] hover:text-white transition-colors" onClick={() => setActiveLibrary(null)}>
                                <X size={14} />
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="flex items-center justify-center h-full text-[#525660] text-[10px] uppercase border border-dashed border-[#1f2937]">
                                [ DROP NEW MEDIA OR DRAG TO TIMELINE FROM HERE ]
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
