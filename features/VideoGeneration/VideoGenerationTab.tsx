import React, { useState } from 'react';
import { Video, Settings2, Play, Sparkles, Wand2, Database } from 'lucide-react';

export const VideoGenerationTab: React.FC = () => {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [engine, setEngine] = useState('veo-3.1');

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        // Symulacja komunikacji z API i zrzucenia pliku na dysk by pokazał się w NLE
        setTimeout(() => {
            alert(`[DEV] Mock API: Wideo wygenerowane z modelem ${engine}. Plik zostałby teraz zrzucony do /public/video/ jako plik widoczny dla Timeline Studio.`);
            setIsGenerating(false);
        }, 2000);
    };

    return (
        <div className="flex-1 flex overflow-hidden w-full font-mono text-xs select-none bg-[#0b0d12] animate-fade-in">
            {/* Left Configuration Panel */}
            <aside className="w-[350px] bg-[#11131a] border-r border-[#1f2937] flex flex-col">
                <div className="p-4 border-b border-[#1f2937] flex items-center space-x-2 text-white">
                    <Settings2 size={16} className="text-[#10b981]" />
                    <span className="font-bold uppercase tracking-widest text-[11px]">GENERATOR CONFIG</span>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] text-[#9ca3af] font-bold uppercase tracking-wider">Engine Provider</label>
                        <select 
                            value={engine}
                            onChange={(e) => setEngine(e.target.value)}
                            className="bg-[#0b0d12] border border-[#1f2937] text-white p-2 outline-none focus:border-[#10b981] transition-colors"
                        >
                            <option value="veo-3.1">Google Veo 3.1 (High Fidelity)</option>
                            <option value="luma-dream">Luma Dream Machine</option>
                            <option value="fal-fast">Fal.ai Fast Video</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] text-[#9ca3af] font-bold uppercase tracking-wider">Cinematic Prompt</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the camera movement, lighting, and action..."
                            className="bg-[#0b0d12] border border-[#1f2937] text-white p-3 h-32 outline-none focus:border-[#10b981] transition-colors resize-none"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                            <label className="text-[9px] text-[#9ca3af] font-bold uppercase tracking-wider">Aspect Ratio</label>
                            <select className="bg-[#0b0d12] border border-[#1f2937] text-white p-2 outline-none focus:border-[#10b981]">
                                <option>16:9 (Cinematic)</option>
                                <option>9:16 (Vertical)</option>
                                <option>1:1 (Square)</option>
                            </select>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <label className="text-[9px] text-[#9ca3af] font-bold uppercase tracking-wider">Motion Intensity</label>
                            <input type="range" min="1" max="100" defaultValue="50" className="mt-2 accent-[#10b981]" />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[#1f2937] bg-[#0e1017]">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt}
                        className={`w-full py-3 flex items-center justify-center space-x-2 font-bold uppercase tracking-wider transition-all
                            ${isGenerating || !prompt ? 'bg-[#1f2937] text-[#6b7280] cursor-not-allowed' : 'bg-[#10b981] hover:bg-[#059669] text-black'}`}
                    >
                        {isGenerating ? <Sparkles size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        <span>{isGenerating ? 'GENERATING SEQUENCE...' : 'GENERATE VIDEO'}</span>
                    </button>
                </div>
            </aside>

            {/* Center Preview Panel */}
            <main className="flex-1 flex flex-col bg-[#0b0d12] relative items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1f2937]/30 to-[#0b0d12]">
                <div className="w-full max-w-4xl aspect-video border border-[#1f2937] bg-black shadow-2xl flex flex-col items-center justify-center text-[#1f2937]">
                    <Video size={48} className="mb-4 opacity-50" />
                    <span className="font-bold tracking-widest uppercase text-xl">WAITING FOR GENERATION</span>
                    <span className="text-[10px] mt-2 opacity-50">Output will be passed automatically to the Timeline Studio</span>
                </div>
                
                {/* Recent Generations Gallery Mockup */}
                <div className="w-full max-w-4xl mt-8 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[#6b7280] flex items-center gap-1"><Database size={10}/> RECENT GENERATIONS</span>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-48 aspect-video border border-[#1f2937] bg-[#11131a] hover:border-[#10b981] cursor-pointer flex items-center justify-center group transition-colors">
                                <Play size={12} className="text-[#1f2937] group-hover:text-[#10b981] transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};
