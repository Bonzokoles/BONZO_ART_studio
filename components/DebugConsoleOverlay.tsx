import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  Maximize2,
  Minimize2,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  AlertTriangle,
  Code,
  X,
  BarChart2,
} from 'lucide-react';
import {
  debugLogger,
  type LogEntry,
  type LogType,
  type ProviderId,
} from '../services/debugLogger';
import { DebugAnalyticsCharts } from './DebugAnalyticsCharts';

interface DebugConsoleOverlayProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const DebugConsoleOverlay: React.FC<DebugConsoleOverlayProps> = ({
  isOpen,
  onToggle,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'charts'>('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeCalls, setActiveCalls] = useState<number>(0);
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time log updates
  useEffect(() => {
    const unsubLogs = debugLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    const unsubActive = debugLogger.subscribeActiveCalls((count) => {
      setActiveCalls(count);
    });

    return () => {
      unsubLogs();
      unsubActive();
    };
  }, []);

  // Auto-scroll when new logs arrive if enabled
  useEffect(() => {
    if (autoScroll && scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll, isOpen]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    debugLogger.clear();
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(debugLogger.exportJSON());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bonzo_debug_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(debugLogger.exportJSON());
    setIsCopiedAll(true);
    setTimeout(() => setIsCopiedAll(false), 1500);
  };

  const handleCopySingle = (entry: LogEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (selectedProvider !== 'ALL' && log.provider !== selectedProvider.toLowerCase()) {
      return false;
    }
    if (selectedType === 'REQ/RES') {
      if (log.type !== 'REQ' && log.type !== 'RES') return false;
    } else if (selectedType !== 'ALL' && log.type !== selectedType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchEnd = log.endpoint.toLowerCase().includes(q);
      const matchProv = log.provider.toLowerCase().includes(q);
      const matchPayload = log.requestPayload
        ? JSON.stringify(log.requestPayload).toLowerCase().includes(q)
        : false;
      const matchRes = log.responsePayload
        ? JSON.stringify(log.responsePayload).toLowerCase().includes(q)
        : false;
      if (!matchMsg && !matchEnd && !matchProv && !matchPayload && !matchRes) {
        return false;
      }
    }
    return true;
  });

  const errorCount = logs.filter((l) => l.type === 'ERR').length;
  const reqCount = logs.filter((l) => l.type === 'REQ').length;
  const resCount = logs.filter((l) => l.type === 'RES').length;

  const getTypeBadge = (type: LogType) => {
    switch (type) {
      case 'REQ':
        return (
          <span className="inline-flex items-center space-x-1 text-[#38bdf8] bg-[#0369a1]/20 border border-[#0284c7]/40 px-1.5 py-0.5 text-[9px] font-bold">
            <ArrowUpRight size={9} />
            <span>[REQ]</span>
          </span>
        );
      case 'RES':
        return (
          <span className="inline-flex items-center space-x-1 text-[#10b981] bg-[#065f46]/20 border border-[#059669]/40 px-1.5 py-0.5 text-[9px] font-bold">
            <ArrowDownLeft size={9} />
            <span>[RES]</span>
          </span>
        );
      case 'ERR':
        return (
          <span className="inline-flex items-center space-x-1 text-[#ef4444] bg-[#991b1b]/20 border border-[#dc2626]/40 px-1.5 py-0.5 text-[9px] font-bold">
            <AlertCircle size={9} />
            <span>[ERR]</span>
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center space-x-1 text-[#f59e0b] bg-[#b45309]/20 border border-[#d97706]/40 px-1.5 py-0.5 text-[9px] font-bold">
            <AlertTriangle size={9} />
            <span>[WARN]</span>
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center space-x-1 text-[#d4a574] bg-[#d4a574]/10 border border-[#d4a574]/30 px-1.5 py-0.5 text-[9px] font-bold">
            <Info size={9} />
            <span>[INFO]</span>
          </span>
        );
    }
  };

  const getProviderBadge = (provider: ProviderId) => {
    const colors: Record<ProviderId, { text: string; bg: string; border: string }> = {
      google: { text: '#38bdf8', bg: '#0369a1/10', border: '#0284c7/30' },
      fal: { text: '#ec4899', bg: '#9d174d/10', border: '#db2777/30' },
      replicate: { text: '#a855f7', bg: '#7e22ce/10', border: '#9333ea/30' },
      openai: { text: '#10b981', bg: '#065f46/10', border: '#059669/30' },
      veo: { text: '#f59e0b', bg: '#b45309/10', border: '#d97706/30' },
      pollinations: { text: '#14b8a6', bg: '#0f766e/10', border: '#0d9488/30' },
      system: { text: '#9ca3af', bg: '#374151/10', border: '#4b5563/30' },
    };
    const c = colors[provider] || colors.system;
    return (
      <span
        className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border"
        style={{
          color: c.text,
          backgroundColor: `rgba(24, 27, 34, 0.8)`,
          borderColor: `rgba(55, 65, 81, 0.6)`,
        }}
      >
        [{provider.toUpperCase()}]
      </span>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      id="debug-console-overlay"
      className={`fixed bottom-[37px] left-0 right-0 z-40 bg-[#0e1017] border-t-2 border-[#d4a574] border-x border-[#1f2937] font-mono shadow-2xl flex flex-col transition-all duration-200 ${
        isMaximized ? 'h-[620px] max-h-[85vh]' : 'h-[370px]'
      }`}
      style={{ borderRadius: 0 }}
      role="region"
      aria-label="API Debug Console"
    >
      {/* Top Header Controls Bar */}
      <div className="bg-[#11131a] border-b border-[#1f2937] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 select-none shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-white font-bold text-xs">
            <Terminal size={14} className="text-[#d4a574]" />
            <span>[DEBUG CONSOLE // API TELEMETRY]</span>
          </div>

          {/* Console Tab Switchers */}
          <div className="flex items-center space-x-1">
            <button
              id="btn-console-tab-logs"
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`h-6 px-2.5 text-[10px] font-bold uppercase border transition-colors flex items-center space-x-1.5 ${
                activeTab === 'logs'
                  ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574] shadow-sm'
                  : 'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:text-white hover:border-[#374151]'
              }`}
              style={{ borderRadius: 0 }}
            >
              <Terminal size={11} />
              <span>[LOG STREAM: {logs.length}]</span>
            </button>

            <button
              id="btn-console-tab-charts"
              type="button"
              onClick={() => setActiveTab('charts')}
              className={`h-6 px-2.5 text-[10px] font-bold uppercase border transition-colors flex items-center space-x-1.5 ${
                activeTab === 'charts'
                  ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574] shadow-sm'
                  : 'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:text-white hover:border-[#374151]'
              }`}
              style={{ borderRadius: 0 }}
            >
              <BarChart2 size={11} />
              <span>[LATENCY & SUCCESS CHARTS]</span>
            </button>
          </div>

          {/* Real-time metrics summary */}
          <div className="hidden lg:flex items-center space-x-2 text-[10px]">
            <span className="text-[#1f2937]">|</span>
            <span className="text-[#38bdf8]">
              REQ: <strong>{reqCount}</strong>
            </span>
            <span className="text-[#10b981]">
              RES: <strong>{resCount}</strong>
            </span>
            <span className="text-[#ef4444]">
              ERR: <strong>{errorCount}</strong>
            </span>
            {activeCalls > 0 && (
              <>
                <span className="text-[#1f2937]">|</span>
                <span className="text-[#d4a574] animate-pulse flex items-center space-x-1 font-bold">
                  <Activity size={10} />
                  <span>[IN FLIGHT: {activeCalls}]</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Window & Action Controls */}
        <div className="flex items-center space-x-1.5">
          {activeTab === 'logs' && (
            <button
              id="btn-debug-autoscroll"
              type="button"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`h-6 px-2 text-[9px] font-bold uppercase border transition-colors ${
                autoScroll
                  ? 'bg-[#181b22] text-[#10b981] border-[#059669]/50'
                  : 'bg-[#181b22] text-[#6b7280] border-[#1f2937]'
              }`}
              style={{ borderRadius: 0 }}
              title="Toggle Auto-Scroll to latest logs"
            >
              [AUTO-SCROLL: {autoScroll ? 'ON' : 'OFF'}]
            </button>
          )}

          <button
            id="btn-debug-copy-all"
            type="button"
            onClick={handleCopyAll}
            className="h-6 px-2 text-[9px] font-bold uppercase bg-[#181b22] text-[#9ca3af] border border-[#1f2937] hover:bg-[#1f232b] hover:text-white flex items-center space-x-1"
            style={{ borderRadius: 0 }}
            title="Copy all logs to clipboard as JSON"
          >
            {isCopiedAll ? (
              <>
                <Check size={10} className="text-[#10b981]" />
                <span className="text-[#10b981]">[COPIED]</span>
              </>
            ) : (
              <>
                <Copy size={10} />
                <span>[COPY ALL]</span>
              </>
            )}
          </button>

          <button
            id="btn-debug-export"
            type="button"
            onClick={handleExport}
            className="h-6 px-2 text-[9px] font-bold uppercase bg-[#181b22] text-[#9ca3af] border border-[#1f2937] hover:bg-[#1f232b] hover:text-white flex items-center space-x-1"
            style={{ borderRadius: 0 }}
            title="Export debug session as JSON file"
          >
            <Download size={10} />
            <span>[EXPORT]</span>
          </button>

          <button
            id="btn-debug-clear"
            type="button"
            onClick={handleClear}
            className="h-6 px-2 text-[9px] font-bold uppercase bg-[#181b22] text-[#ef4444] border border-[#1f2937] hover:bg-[#7f1d1d]/30 hover:border-[#ef4444] flex items-center space-x-1"
            style={{ borderRadius: 0 }}
            title="Clear all logs"
          >
            <Trash2 size={10} />
            <span>[CLEAR]</span>
          </button>

          <button
            id="btn-debug-maximize"
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-6 w-6 text-[9px] bg-[#181b22] text-[#9ca3af] border border-[#1f2937] hover:bg-[#1f232b] hover:text-white flex items-center justify-center"
            style={{ borderRadius: 0 }}
            title={isMaximized ? 'Restore Console Size' : 'Maximize Console'}
          >
            {isMaximized ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>

          <button
            id="btn-debug-close"
            type="button"
            onClick={onToggle}
            className="h-6 w-6 text-[9px] bg-[#181b22] text-[#9ca3af] border border-[#1f2937] hover:bg-[#ef4444] hover:text-white flex items-center justify-center"
            style={{ borderRadius: 0 }}
            title="Minimize Debug Console"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'charts' ? (
        <DebugAnalyticsCharts logs={logs} />
      ) : (
        <>
          {/* Filter Toolbar */}
          <div className="bg-[#0b0d12] border-b border-[#1f2937] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Provider Filters */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              <span className="text-[9px] text-[#6b7280] uppercase mr-1">PROVIDER:</span>
              {['ALL', 'GOOGLE', 'FAL', 'REPLICATE', 'OPENAI', 'VEO', 'SYSTEM'].map((prov) => {
                const isSel = selectedProvider === prov;
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => setSelectedProvider(prov)}
                    className={`h-5 px-1.5 text-[9px] font-bold uppercase border transition-colors ${
                      isSel
                        ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574]'
                        : 'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:text-white hover:border-[#374151]'
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    {prov}
                  </button>
                );
              })}
            </div>

            {/* Level Filters & Search */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <span className="text-[9px] text-[#6b7280] uppercase mr-1">LEVEL:</span>
                {['ALL', 'REQ/RES', 'ERR', 'INFO', 'WARN'].map((lvl) => {
                  const isSel = selectedType === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedType(lvl)}
                      className={`h-5 px-1.5 text-[9px] font-bold uppercase border transition-colors ${
                        isSel
                          ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574]'
                          : 'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:text-white hover:border-[#374151]'
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search
                  size={10}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6b7280]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs & payloads..."
                  className="h-5 pl-5 pr-2 w-36 sm:w-48 bg-[#11131a] border border-[#1f2937] text-[10px] text-white focus:outline-none focus:border-[#d4a574]"
                  style={{ borderRadius: 0 }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white"
                  >
                    <X size={9} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Log Entries Stream List */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-[#1f2937]/50 bg-[#090b0f]"
          >
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-[#6b7280] text-xs flex flex-col items-center justify-center space-y-2">
                <Terminal size={24} className="text-[#374151]" />
                <span>[NO LOG ENTRIES MATCHING ACTIVE FILTERS]</span>
                <span className="text-[10px] text-[#4b5563]">
                  API requests and responses from Google, fal.ai, Replicate, and OpenAI will appear here in real-time.
                </span>
              </div>
            ) : (
              filteredLogs.map((log, index) => {
                const isExpanded = expandedLogId === log.id;
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={log.id}
                    className={`text-[11px] transition-colors ${
                      isEven ? 'bg-[#0b0d12]' : 'bg-[#0f1118]'
                    } ${isExpanded ? 'bg-[#181b22]/90 border-l-2 border-l-[#d4a574]' : 'hover:bg-[#151821]'}`}
                  >
                    {/* Main Log Row */}
                    <div
                      className="px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer select-text"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        {/* Timestamp */}
                        <span className="text-[#6b7280] text-[10px] font-mono shrink-0">
                          [{log.timestamp}]
                        </span>

                        {/* Type Badge */}
                        <span className="shrink-0">{getTypeBadge(log.type)}</span>

                        {/* Provider Badge */}
                        <span className="shrink-0">{getProviderBadge(log.provider)}</span>

                        {/* Method / Status Tag */}
                        {log.method && (
                          <span className="text-[9px] text-[#9ca3af] bg-[#181b22] px-1 border border-[#1f2937] shrink-0">
                            {log.method}
                          </span>
                        )}

                        {/* Message / Endpoint */}
                        <span
                          className={`truncate ${
                            log.type === 'ERR'
                              ? 'text-[#ef4444] font-bold'
                              : log.type === 'RES'
                              ? 'text-[#e0e0e0]'
                              : log.type === 'REQ'
                              ? 'text-[#93c5fd]'
                              : 'text-[#d4d4d8]'
                          }`}
                          title={log.message}
                        >
                          {log.message}
                        </span>
                      </div>

                      {/* Status / Latency & Actions */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {log.durationMs !== undefined && (
                          <span className="text-[9px] text-[#9ca3af] bg-[#181b22] px-1.5 py-0.5 border border-[#1f2937]">
                            {log.durationMs}ms
                          </span>
                        )}

                        {log.status && log.status !== 'OK' && log.status !== 'DISPATCHED' && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 font-bold uppercase border ${
                              String(log.status).startsWith('2') || log.status === 'COMPLETED'
                                ? 'text-[#10b981] border-[#059669]/40 bg-[#065f46]/10'
                                : 'text-[#ef4444] border-[#dc2626]/40 bg-[#991b1b]/10'
                            }`}
                          >
                            [{String(log.status)}]
                          </span>
                        )}

                        {/* Single Copy Button */}
                        <button
                          type="button"
                          onClick={(e) => handleCopySingle(log, e)}
                          className="p-1 text-[#6b7280] hover:text-[#d4a574] hover:bg-[#1f232b]"
                          title="Copy log entry JSON"
                        >
                          {copiedId === log.id ? (
                            <Check size={11} className="text-[#10b981]" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>

                        {/* Expand/Collapse Chevron */}
                        <span className="text-[#6b7280]">
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Inspection Payload Drawer */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#1f2937] bg-[#07080c] text-[10px] space-y-2">
                        <div className="flex items-center justify-between text-[#9ca3af] border-b border-[#1f2937]/50 pb-1">
                          <span>INSPECT PAYLOAD // ID: {log.id}</span>
                          <div className="flex items-center space-x-2">
                            <span>ENDPOINT: {log.endpoint}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopySingle(log, e)}
                              className="h-5 px-2 text-[9px] bg-[#181b22] text-[#d4a574] border border-[#1f2937] hover:bg-[#222733]"
                            >
                              [COPY ENTRY JSON]
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {/* Request Payload */}
                          {log.requestPayload && (
                            <div className="bg-[#0b0d12] border border-[#1f2937] p-2">
                              <div className="text-[9px] font-bold text-[#38bdf8] mb-1 flex items-center justify-between">
                                <span>REQUEST DATA:</span>
                                <span>{log.method || 'POST'}</span>
                              </div>
                              <pre className="overflow-x-auto text-[10px] text-[#93c5fd] max-h-48 leading-tight">
                                {JSON.stringify(log.requestPayload, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Response Payload */}
                          {log.responsePayload && (
                            <div className="bg-[#0b0d12] border border-[#1f2937] p-2">
                              <div className="text-[9px] font-bold text-[#10b981] mb-1 flex items-center justify-between">
                                <span>RESPONSE DATA:</span>
                                <span>STATUS: {String(log.status)}</span>
                              </div>
                              <pre className="overflow-x-auto text-[10px] text-[#86efac] max-h-48 leading-tight">
                                {JSON.stringify(log.responsePayload, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Error Details */}
                          {log.errorDetails && (
                            <div className="col-span-full bg-[#1c0b0e] border border-[#ef4444]/40 p-2 text-[#fca5a5]">
                              <div className="text-[9px] font-bold text-[#ef4444] mb-1">
                                ERROR TRACE / DETAILS:
                              </div>
                              <pre className="overflow-x-auto text-[10px] text-[#fca5a5] max-h-40 leading-tight">
                                {log.errorDetails}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </aside>
  );
};
