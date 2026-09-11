import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Trash2, Save, FolderOpen, Terminal } from 'lucide-react';
import { registerWorkflowNodes, setWorkflowLogSink } from './nodes';

const STORAGE_KEY = 'bonzo-workflow-graph';

interface LogEntry {
  ts: string;
  lvl: string;
  msg: string;
}

const PALETTE: { group: string; items: { type: string; label: string; tag: string }[] }[] = [
  {
    group: 'INPUT',
    items: [
      { type: 'input/prompt', label: 'Prompt Node', tag: 'TXT' },
      { type: 'model/checkpoint', label: 'Checkpoint', tag: 'CKPT' },
    ],
  },
  {
    group: 'PROCESS',
    items: [
      { type: 'generate/ksampler', label: 'KSampler', tag: 'DIFF' },
      { type: 'latent/empty', label: 'Latent Empty', tag: 'LAT' },
      { type: 'postprocess/vae_decode', label: 'VAE Decode', tag: 'VAE' },
      { type: 'edit/inpaint', label: 'Inpaint Edit', tag: 'INP' },
    ],
  },
  {
    group: 'POST',
    items: [
      { type: 'postprocess/enhancer', label: 'Enhancer (TODO)', tag: 'UPS' },
      { type: 'output/save', label: 'Save Output', tag: 'OUT' },
    ],
  },
];

const LOG_COLORS: Record<string, string> = {
  OK: '#10b981',
  RUN: '#38bdf8',
  ERR: '#ef4444',
  WARN: '#f59e0b',
  INFO: '#9ca3af',
};

export const WorkflowsTab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const canvasInstanceRef = useRef<any>(null);
  const [nodeCount, setNodeCount] = useState<number>(0);
  const [graphStatus, setGraphStatus] = useState<string>('IDLE');
  const [execStatus, setExecStatus] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logOpen, setLogOpen] = useState<boolean>(false);

  const logMsg = useCallback((lvl: string, msg: string) => {
    const ts = new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [...prev.slice(-200), { ts, lvl, msg }]);
  }, []);

  // Register custom node types once and wire the log sink
  useEffect(() => {
    registerWorkflowNodes();
    setWorkflowLogSink(logMsg);
    return () => setWorkflowLogSink(null);
  }, [logMsg]);

  // Initialize LiteGraph canvas
  useEffect(() => {
    const canvasEl = canvasRef.current;
    const areaEl = areaRef.current;
    if (!canvasEl || !areaEl) return;

    const LiteGraph = (window as any).LiteGraph;
    const LGraph = (window as any).LGraph;
    const LGraphCanvas = (window as any).LGraphCanvas;
    if (!LiteGraph || !LGraph || !LGraphCanvas) {
      logMsg('ERR', 'LiteGraph not loaded (script missing)');
      return;
    }

    const resize = () => {
      if (!areaEl || !canvasEl) return;
      canvasEl.width = areaEl.clientWidth;
      canvasEl.height = areaEl.clientHeight;
    };
    resize();

    const graph = new LGraph();
    graphRef.current = graph;

    const canvas = new LGraphCanvas(canvasEl, graph);
    canvasInstanceRef.current = canvas;
    canvas.background_image = null;
    canvas.clear_background = true;
    canvas.render_shadows = false;
    canvas.default_link_color = '#d4a574';
    canvas.highquality_render = true;

    const updateNodeCount = () => {
      const g = graphRef.current;
      setNodeCount(g ? g._nodes.length : 0);
    };
    graph.onNodeAdded = updateNodeCount;
    graph.onNodeRemoved = updateNodeCount;

    // Auto-load saved graph
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        graph.configure(JSON.parse(raw));
        updateNodeCount();
        logMsg('INFO', 'Auto-loaded saved graph');
      }
    } catch {
      /* ignore */
    }

    canvas.startRendering();
    // NOTE: do NOT call graph.start() — it launches a per-frame runStep() loop that
    // would double-execute nodes alongside the manual runWorkflow(). Manual execution
    // only; render loop is driven by canvas.startRendering() above.

    // Keep the canvas buffer synced to the area element (flex layout, scrollbar, tab switch)
    const ro = new ResizeObserver(() => {
      resize();
      if (canvasInstanceRef.current) canvasInstanceRef.current.resize();
    });
    ro.observe(areaEl);

    logMsg('INFO', 'LiteGraph canvas initialized');

    return () => {
      ro.disconnect();
      if (canvasInstanceRef.current) canvasInstanceRef.current.stopRendering?.();
      graphRef.current = null;
      canvasInstanceRef.current = null;
    };
  }, [logMsg]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (!type) return;
    const LiteGraph = (window as any).LiteGraph;
    const graph = graphRef.current;
    const canvasEl = canvasRef.current;
    const canvas = canvasInstanceRef.current;
    if (!LiteGraph || !graph || !canvasEl || !canvas) return;
    const node = LiteGraph.createNode(type);
    if (!node) return;
    const pos = canvas.convertEventToCanvasOffset(e);
    node.pos = [pos[0], pos[1]];
    graph.add(node);
    setNodeCount(graph._nodes.length);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const saveGraph = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    try {
      const data = graph.serialize();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      logMsg('OK', `Graph saved to localStorage (${graph._nodes.length} nodes)`);
    } catch (e: any) {
      logMsg('ERR', `Save failed: ${e.message}`);
    }
  }, [logMsg]);

  const loadGraph = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        logMsg('INFO', 'No saved graph found');
        return;
      }
      graph.configure(JSON.parse(raw));
      setNodeCount(graph._nodes.length);
      logMsg('OK', `Graph loaded (${graph._nodes.length} nodes)`);
    } catch (e: any) {
      logMsg('ERR', `Load failed: ${e.message}`);
    }
  }, [logMsg]);

  const clearGraph = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.clear();
    setNodeCount(0);
    logMsg('INFO', 'Graph cleared');
  }, [logMsg]);

  const runWorkflow = useCallback(async () => {
    const graph = graphRef.current;
    if (!graph || isRunning) return;
    setIsRunning(true);
    setGraphStatus('EXECUTING');
    setExecStatus('');
    logMsg('RUN', '=== WORKFLOW EXECUTION START ===');

    try {
      const execOrder = graph.computeExecutionOrder();
      logMsg('INFO', `Execution order: ${execOrder.length} nodes`);

      // Reset transient output buffers so a re-run doesn't leak stale data
      graph._nodes.forEach((n: any) => {
        n._outputData = {};
        n.boxcolor = null;
      });

      for (const node of execOrder) {
        if (!node) continue;
        logMsg('RUN', `Executing: ${node.title || node.type}`);
        node.boxcolor = '#d4a574';

        if (node.inputs) {
          for (let i = 0; i < node.inputs.length; i++) {
            const input = node.inputs[i];
            if (input.link != null) {
              const link = graph.links[input.link];
              if (link) {
                const srcNode = graph.getNodeById(link.origin_id);
                if (srcNode && srcNode._outputData && srcNode._outputData[link.origin_slot] !== undefined) {
                  node.setInputData(i, srcNode._outputData[link.origin_slot]);
                }
              }
            }
          }
        }

        try {
          if (node.onExecute) {
            await node.onExecute.call(node);
          }
          if (node.outputs) {
            node._outputData = {};
            for (let o = 0; o < node.outputs.length; o++) {
              node._outputData[o] = node.getOutputData(o);
            }
          }
          node.boxcolor = '#10b981';
        } catch (err: any) {
          node.boxcolor = '#ef4444';
          logMsg('ERR', `Node ${node.title || node.type} failed: ${err.message}`);
        }
      }

      logMsg('OK', '=== WORKFLOW EXECUTION COMPLETE ===');
      setExecStatus('COMPLETE');
    } catch (e: any) {
      logMsg('ERR', `Workflow failed: ${e.message}`);
      setExecStatus('FAILED');
    } finally {
      setIsRunning(false);
      setGraphStatus('IDLE');
    }
  }, [isRunning, logMsg]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0b0d12] font-mono" style={{ borderRadius: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-[#11131a] border-b border-[#1f2937] px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.06em]">
          <span className="text-[#d4a574]">[WORKFLOW EDITOR]</span>
          <span className="text-[#6b7280]">//</span>
          <span className="text-[#d4d4d8]">LITEGRAPH.JS NODE PIPELINE</span>
        </div>
        <button
          type="button"
          onClick={() => setLogOpen((v) => !v)}
          className="h-6 px-2.5 text-[10px] font-mono font-bold uppercase border bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:text-white hover:border-[#374151] flex items-center gap-1"
          style={{ borderRadius: 0 }}
        >
          <Terminal size={12} className="text-[#d4a574]" />
          [LOG]
        </button>
      </div>

      {/* Body: palette + canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Nodes palette */}
        <aside className="w-[200px] bg-[#11131a] border-r border-[#1f2937] flex flex-col shrink-0 overflow-y-auto">
          <div className="px-2.5 py-2 bg-[#181b22] border-b border-[#1f2937] text-[10px] font-bold text-white uppercase tracking-[0.06em]">
            Nodes Palette
          </div>
          {PALETTE.map((group) => (
            <div key={group.group} className="px-2.5 py-2 border-b border-[#1f2937]">
              <span className="block text-[9px] font-bold text-[#d4a574] uppercase mb-1.5">{group.group}</span>
              {group.items.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', item.type)}
                  className="flex items-center justify-between bg-[#0b0d12] border border-[#1f2937] px-2 py-1 mb-1 text-[9px] text-[#d4d4d8] cursor-grab select-none hover:border-[#d4a574] hover:text-white hover:bg-[#181b22] transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  <span>{item.label}</span>
                  <span className="text-[8px] text-[#6b7280] bg-[#11131a] px-1 border border-[#1f2937]">{item.tag}</span>
                </div>
              ))}
            </div>
          ))}
        </aside>

        {/* Canvas area */}
        <div ref={areaRef} className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            id="workflow-canvas"
            className="block absolute inset-0"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
          {/* Log panel */}
          {logOpen && (
            <div className="absolute bottom-0 right-0 w-[340px] max-h-[200px] bg-[#0b0d12]/95 border border-[#1f2937] border-b-0 overflow-y-auto z-10 text-[9px] font-mono">
              {logs.length === 0 && (
                <div className="px-1.5 py-1 text-[#6b7280]">[NO LOG ENTRIES]</div>
              )}
              {logs.map((l, i) => (
                <div key={i} className="px-1.5 py-0.5 border-b border-[#11131a]">
                  <span className="text-[#6b7280]">{l.ts}</span>{' '}
                  <span style={{ color: LOG_COLORS[l.lvl] || '#9ca3af' }}>[{l.lvl}]</span>{' '}
                  <span className="text-[#d4d4d8]">{l.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ops bar */}
      <footer className="flex items-center justify-between bg-[#0e1017] border-t border-[#1f2937] px-3 py-2 font-mono text-[10px] shrink-0">
        <div className="flex items-center gap-2 text-[#6b7280]">
          <span className={graphStatus === 'EXECUTING' ? 'text-[#38bdf8]' : ''}>[GRAPH: {graphStatus}]</span>
          <span className="text-[#1f2937]">|</span>
          <span className="text-[#d4d4d8]">{nodeCount} NODES</span>
          {execStatus && (
            <>
              <span className="text-[#1f2937]">|</span>
              <span className={execStatus === 'FAILED' ? 'text-[#ef4444]' : 'text-[#10b981]'}>[{execStatus}]</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={clearGraph} className="btn-ops" style={{ borderRadius: 0 }}>
            <Trash2 size={12} className="mr-1 inline" />
            [CLEAR]
          </button>
          <button type="button" onClick={loadGraph} className="btn-ops" style={{ borderRadius: 0 }}>
            <FolderOpen size={12} className="mr-1 inline" />
            [LOAD]
          </button>
          <button type="button" onClick={saveGraph} className="btn-ops" style={{ borderRadius: 0 }}>
            <Save size={12} className="mr-1 inline" />
            [SAVE]
          </button>
          <button
            type="button"
            onClick={runWorkflow}
            disabled={isRunning}
            className="h-7 px-3 text-[10px] font-bold uppercase tracking-[0.04em] border flex items-center bg-[#181b22] text-[#d4a574] border-[#d4a574] hover:bg-[#d4a574] hover:text-[#0b0d12] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderRadius: 0 }}
          >
            <Play size={12} className="mr-1" />
            {isRunning ? '[RUNNING...]' : '[RUN WORKFLOW]'}
          </button>
        </div>
      </footer>
    </div>
  );
};
