import React, { useEffect, useState } from 'react';
import type { ProgressStage, TelemetryLog } from '../types';
import { Terminal, Activity, Clock, Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface ProgressIndicatorProps {
  id?: string;
  title: string;
  stages: ProgressStage[];
  currentStageIndex: number;
  progressPercent?: number;
  telemetryLogs?: TelemetryLog[];
  elapsedSeconds?: number;
  pollCount?: number;
  modelName?: string;
  customStatus?: string;
  isCompleted?: boolean;
  hasError?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  id = 'progress-indicator',
  title,
  stages,
  currentStageIndex,
  progressPercent,
  telemetryLogs = [],
  elapsedSeconds = 0,
  pollCount,
  modelName,
  customStatus,
  isCompleted = false,
  hasError = false,
}) => {
  const [showLogs, setShowLogs] = useState(true);
  const [seconds, setSeconds] = useState(elapsedSeconds);

  useEffect(() => {
    setSeconds(elapsedSeconds);
  }, [elapsedSeconds]);

  useEffect(() => {
    if (isCompleted || hasError) return;
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted, hasError]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}s`;
  };

  // Calculate default percentage if not explicitly provided
  const calculatedPercent =
    typeof progressPercent === 'number'
      ? Math.min(100, Math.max(0, Math.round(progressPercent)))
      : stages.length > 0
      ? Math.min(95, Math.round(((currentStageIndex + 0.5) / stages.length) * 100))
      : 50;

  const currentStage = stages[currentStageIndex] || stages[stages.length - 1];

  return (
    <div
      id={id}
      className="w-full bg-[#111111] border border-[#333333] text-[#e0e0e0] font-mono text-xs mb-4"
    >
      {/* Top Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#161616] border-b border-[#333333] gap-2">
        <div className="flex items-center space-x-2">
          {hasError ? (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-[#ff3333]/20 text-[#ff3333] border border-[#ff3333]/40 font-bold tracking-wider">
              [ERR]
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/40 font-bold tracking-wider">
              [OK]
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 font-bold tracking-wider animate-pulse">
              [RUN]
            </span>
          )}
          <span className="font-bold text-[#ffffff] uppercase tracking-wider">{title}</span>
          {modelName && (
            <span className="text-[#888888] border-l border-[#333333] pl-2">
              ENGINE: <span className="text-[#00e5ff]">{modelName}</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3 text-[#aaaaaa]">
          {pollCount !== undefined && pollCount > 0 && (
            <span className="border border-[#333333] px-1.5 py-0.5 bg-[#0e0e0e]">
              POLL: <span className="text-[#ffb700]">#{pollCount}</span>
            </span>
          )}
          <span className="inline-flex items-center space-x-1 border border-[#333333] px-1.5 py-0.5 bg-[#0e0e0e]">
            <Clock size={12} className="text-[#888888]" />
            <span>ELAPSED: {formatTime(seconds)}</span>
          </span>
        </div>
      </div>

      {/* Primary Progress Status Line & Bar */}
      <div className="p-3 bg-[#0d0d0d] border-b border-[#262626]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Activity size={14} className="text-[#00e5ff] animate-pulse" />
            <span className="text-[#888888]">CURRENT OPERATION:</span>
            <span className="text-[#00ff66] font-semibold">
              {customStatus || (currentStage ? `[${currentStage.code}] ${currentStage.label}` : 'PROCESSING')}
            </span>
          </div>
          <div className="font-bold text-[#00e5ff]">{calculatedPercent}%</div>
        </div>

        {/* Dense Sharp Progress Bar */}
        <div className="w-full bg-[#1e1e1e] h-2 border border-[#333333] relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00e5ff] via-[#00ff66] to-[#00e5ff] transition-all duration-300 relative"
            style={{ width: `${calculatedPercent}%` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:12px_12px] animate-[terminalShimmer_1s_linear_infinite]" />
          </div>
        </div>
      </div>

      {/* Multi-Stage Stepper Pipeline */}
      {stages.length > 0 && (
        <div className="p-3 bg-[#111111] border-b border-[#262626]">
          <div className="flex items-center mb-2 text-[#888888] text-[11px] uppercase tracking-wider">
            <Layers size={12} className="mr-1 text-[#00e5ff]" />
            <span>Pipeline Execution Stages ({currentStageIndex + 1}/{stages.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5">
            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isPending = idx > currentStageIndex;

              return (
                <div
                  key={stage.id}
                  className={`px-2 py-1.5 border text-[11px] flex flex-col justify-between ${
                    isPast
                      ? 'bg-[#141c14] border-[#00ff66]/40 text-[#00ff66]'
                      : isCurrent
                      ? 'bg-[#121f24] border-[#00e5ff] text-[#00e5ff] font-bold'
                      : 'bg-[#141414] border-[#262626] text-[#666666]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="opacity-70">[{stage.code}]</span>
                    <span>
                      {isPast ? '[OK]' : isCurrent ? '[RUN]' : '[WAIT]'}
                    </span>
                  </div>
                  <div className="truncate mt-1 text-[11px]">{stage.label}</div>
                  {stage.detail && isCurrent && (
                    <div className="text-[10px] text-[#888888] truncate mt-0.5">
                      {stage.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Terminal Telemetry Log Stream */}
      {telemetryLogs.length > 0 && (
        <div className="bg-[#0a0a0a]">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-[#141414] hover:bg-[#1c1c1c] text-[#888888] hover:text-[#e0e0e0] border-b border-[#262626] transition-colors"
          >
            <span className="flex items-center space-x-1.5">
              <Terminal size={12} className="text-[#00e5ff]" />
              <span>TERMINAL TELEMETRY LOGS ({telemetryLogs.length} events)</span>
            </span>
            {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showLogs && (
            <div className="p-2 max-h-32 overflow-y-auto space-y-1 bg-[#0a0a0a] text-[11px]">
              {telemetryLogs.map((log, index) => (
                <div key={index} className="flex items-start space-x-2 leading-tight">
                  <span className="text-[#555555] select-none">[{log.timestamp}]</span>
                  <span
                    className={`font-bold ${
                      log.level === 'ERR'
                        ? 'text-[#ff3333]'
                        : log.level === 'OK'
                        ? 'text-[#00ff66]'
                        : log.level === 'WARN'
                        ? 'text-[#ffb700]'
                        : log.level === 'POLL'
                        ? 'text-[#ffb700]'
                        : 'text-[#00e5ff]'
                    }`}
                  >
                    [{log.level}]
                  </span>
                  <span className="text-[#cccccc] break-all">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
