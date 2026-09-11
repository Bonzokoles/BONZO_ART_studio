import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ApiKeyDrawer } from './components/ApiKeyDrawer';
import { DebugConsoleOverlay } from './components/DebugConsoleOverlay';
import { ImageGenerationTab } from './features/ImageGeneration/ImageGenerationTab';
import { ImageEditingTab } from './features/ImageEditing/ImageEditingTab';
import { ImageAnalysisTab } from './features/ImageAnalysis/ImageAnalysisTab';
import { VideoGenerationTab } from './features/VideoGeneration/VideoGenerationTab';
import { VideoContinuationTab } from './features/VideoContinuation/VideoContinuationTab';
import { PromptLibraryTab } from './features/PromptLibrary/PromptLibraryTab';
import { TimelineStudioTab } from './features/TimelineStudio/TimelineStudioTab';
import { WorkflowsTab } from './features/Workflows/WorkflowsTab';
import {
  getArtistPromptAddition,
} from './data/artistsData';
import { findArtistById } from './data/allArtists';
import { debugLogger, type LogEntry } from './services/debugLogger';
import type { FeatureTab, VeoOperationContext, EditContext } from './types';
import { Activity, Sparkles, Terminal, ChevronUp, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeatureTab>('Image Generation');
  const [veoContext, setVeoContext] = useState<VeoOperationContext | null>(null);
  const [editContext, setEditContext] = useState<EditContext | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [logCount, setLogCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [activeCalls, setActiveCalls] = useState<number>(0);

  useEffect(() => {
    const unsubLogs = debugLogger.subscribe((logs: LogEntry[]) => {
      setLogCount(logs.length);
      setErrorCount(logs.filter((l) => l.type === 'ERR').length);
    });

    const unsubActive = debugLogger.subscribeActiveCalls((count: number) => {
      setActiveCalls(count);
    });

    return () => {
      unsubLogs();
      unsubActive();
    };
  }, []);

  useEffect(() => {
    // Cross-window postMessage listener from dedicated Wildcards window
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'WILDCARD_ADD_ARTIST') {
        const artistId = event.data.artistId;
        const artist = findArtistById(artistId);
        if (artist) {
          const addition = getArtistPromptAddition(artist);
          window.dispatchEvent(
            new CustomEvent('bonzo-append-prompt', { detail: { text: addition, artist } })
          );
          setToastMessage(`[WILDCARD APPLIED: ${artist.name.toUpperCase()}]`);
          setTimeout(() => {
            setToastMessage(null);
          }, 2500);
        }
      } else if (event.data?.type === 'BONZO_TIMELINE_ADD_ASSET') {
        window.dispatchEvent(
          new CustomEvent('bonzo-append-timeline-asset', { detail: event.data })
        );
        setToastMessage(`[TIMELINE ASSET: ${event.data.assetType} READY]`);
        setTimeout(() => setToastMessage(null), 2500);
      }
    };

    window.addEventListener('message', handleMessage);

    // BroadcastChannel fallback
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('bonzo_ai_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'WILDCARD_ADD_ARTIST') {
          const artistId = event.data.artistId;
          const artist = findArtistById(artistId);
          if (artist) {
            const addition = getArtistPromptAddition(artist);
            window.dispatchEvent(
              new CustomEvent('bonzo-append-prompt', { detail: { text: addition, artist } })
            );
            setToastMessage(`[WILDCARD APPLIED: ${artist.name.toUpperCase()}]`);
            setTimeout(() => {
              setToastMessage(null);
            }, 2500);
          }
        } else if (event.data?.type === 'BONZO_TIMELINE_ADD_ASSET') {
          window.dispatchEvent(
            new CustomEvent('bonzo-append-timeline-asset', { detail: event.data })
          );
          setToastMessage(`[TIMELINE ASSET: ${event.data.assetType} READY]`);
          setTimeout(() => setToastMessage(null), 2500);
        }
      };
    } catch (e) {
      // BroadcastChannel unsupported or restricted
    }

    // Keyboard shortcut to toggle Debug Console: Ctrl+` or Cmd+`
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === '~')) {
        e.preventDefault();
        setIsDebugOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown);
      if (bc) bc.close();
    };
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Image Generation':
        return <ImageGenerationTab onSendToEdit={(ctx) => { setEditContext(ctx); setActiveTab('Image Editing'); }} />;
      case 'Image Editing':
        return <ImageEditingTab editContext={editContext} onConsumeEditContext={() => setEditContext(null)} />;
      case 'Image Analysis':
        return <ImageAnalysisTab />;
      case 'Video Generation':
        return <VideoGenerationTab setVeoContext={setVeoContext} />;
      case 'Video Continuation':
        return <VideoContinuationTab veoContext={veoContext} setVeoContext={setVeoContext} />;
      case 'Prompt Library':
        return <PromptLibraryTab />;
      case 'Timeline Studio':
        return <TimelineStudioTab />;
      case 'Workflows':
        return <WorkflowsTab />;
      default:
        return <ImageGenerationTab />;
    }
  };

  return (
    <div
      id="app-root"
      className="min-h-screen bg-[#0b0d12] text-[#d4d4d8] font-sans flex flex-col selection:bg-[#d4a574]/20"
    >
      {/* Top Navigation Bar */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Workspace */}
      <main id="main-workspace" className="flex-1 w-full flex flex-col overflow-hidden pb-9">
        {renderActiveTab()}
      </main>

      {/* API Keys Configuration Drawer */}
      <ApiKeyDrawer />

      {/* Collapsable Debug Console Overlay */}
      <DebugConsoleOverlay
        isOpen={isDebugOpen}
        onToggle={() => setIsDebugOpen(!isDebugOpen)}
      />

      {/* System Telemetry Ops Footer */}
      <footer
        id="app-footer"
        className="fixed bottom-0 left-0 right-0 z-30 w-full bg-[#0e1017] border-t border-[#1f2937] py-1.5 px-4 font-mono text-[11px] text-[#9ca3af] shadow-lg select-none"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left Core Online Telemetry */}
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 text-[#10b981]">
              <Activity size={12} className="animate-pulse" />
              <span>[CORE: ONLINE]</span>
            </span>
            <span className="text-[#1f2937]">|</span>
            <span className="hidden md:inline">
              PROVIDERS:{' '}
              <span className="text-[#ffffff]">GOOGLE / FAL.AI / REPLICATE / OPENAI</span>
            </span>
          </div>

          {/* Center Debug Console Trigger Button */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-reset-session"
              type="button"
              onClick={() => window.location.reload()}
              className="h-6 px-2.5 flex items-center space-x-1.5 text-[10px] font-mono font-bold uppercase border transition-all bg-[#141720] text-[#d4d4d8] border-[#1f2937] hover:border-[#d4a574] hover:text-white"
              style={{ borderRadius: 0 }}
              title="Odśwież aplikację (reset stanu)"
            >
              <RefreshCw size={12} className="text-[#d4a574]" />
              <span>[REFRESH]</span>
            </button>
            <button
              id="btn-toggle-debug-console"
              type="button"
              onClick={() => setIsDebugOpen(!isDebugOpen)}
              className={`h-6 px-2.5 flex items-center space-x-1.5 text-[10px] font-mono font-bold uppercase border transition-all ${
                isDebugOpen
                  ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574] shadow-sm'
                  : activeCalls > 0
                  ? 'bg-[#181b22] text-[#d4a574] border-[#d4a574] animate-pulse'
                  : errorCount > 0
                  ? 'bg-[#181b22] text-[#ef4444] border-[#dc2626]/60 hover:bg-[#7f1d1d]/20'
                  : 'bg-[#141720] text-[#d4d4d8] border-[#1f2937] hover:border-[#d4a574] hover:text-white'
              }`}
              style={{ borderRadius: 0 }}
              title="Toggle Multi-Provider Real-time Debug Console"
            >
              <Terminal size={12} className={isDebugOpen ? 'text-[#0b0d12]' : 'text-[#d4a574]'} />
              <span>[DEBUG CONSOLE: {logCount} LOGS</span>
              {errorCount > 0 && (
                <span className="text-[#ef4444] flex items-center space-x-0.5">
                  <span>|</span>
                  <AlertCircle size={10} />
                  <span>{errorCount} ERR</span>
                </span>
              )}
              {activeCalls > 0 && (
                <span className="text-[#38bdf8] flex items-center space-x-0.5">
                  <span>|</span>
                  <Activity size={10} className="animate-spin" />
                  <span>{activeCalls} RUN</span>
                </span>
              )}
              <span>]</span>
              {isDebugOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          </div>

          {/* Right Build & Port Tags */}
          <div className="flex items-center space-x-3 text-[#6b7280]">
            <span className="hidden sm:inline">BONZO AI ART DEVZ</span>
            <span className="hidden sm:inline text-[#1f2937]">|</span>
            <span className="text-[#9ca3af]">[PORT: 3219]</span>
          </div>
        </div>
      </footer>

      {/* Cross-Window Action Notification Toast */}
      {toastMessage && (
        <div
          id="toast-cross-window"
          className="fixed bottom-14 right-6 z-50 bg-[#10b981] text-[#0b0d12] border border-[#059669] px-3.5 py-2 font-mono text-xs font-black uppercase flex items-center space-x-2 shadow-2xl animate-fade-in"
          style={{ borderRadius: 0 }}
        >
          <Sparkles size={14} className="shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
