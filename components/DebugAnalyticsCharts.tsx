import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Activity,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart2,
  RefreshCw,
  Server,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  type LogEntry,
  type ProviderId,
  debugLogger,
} from '../services/debugLogger';

interface DebugAnalyticsChartsProps {
  logs: LogEntry[];
}

const PROVIDER_CONFIG: Record<
  ProviderId,
  { label: string; color: string; bg: string; border: string }
> = {
  google: {
    label: 'Google Imagen/Gemini',
    color: '#38bdf8',
    bg: 'rgba(3, 105, 161, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)',
  },
  fal: {
    label: 'fal.ai Gateway',
    color: '#ec4899',
    bg: 'rgba(157, 23, 77, 0.15)',
    border: 'rgba(236, 72, 153, 0.4)',
  },
  replicate: {
    label: 'Replicate API',
    color: '#a855f7',
    bg: 'rgba(126, 34, 206, 0.15)',
    border: 'rgba(168, 85, 247, 0.4)',
  },
  openai: {
    label: 'OpenAI DALL-E',
    color: '#10b981',
    bg: 'rgba(6, 95, 70, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  veo: {
    label: 'Google Veo 2.0',
    color: '#f59e0b',
    bg: 'rgba(180, 83, 9, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  pollinations: {
    label: 'Pollinations (Free)',
    color: '#14b8a6',
    bg: 'rgba(13, 148, 136, 0.15)',
    border: 'rgba(20, 184, 166, 0.4)',
  },
  system: {
    label: 'Procedural/Internal',
    color: '#d4a574',
    bg: 'rgba(212, 165, 116, 0.15)',
    border: 'rgba(212, 165, 116, 0.4)',
  },
};

const ALL_PROVIDERS: ProviderId[] = [
  'google',
  'fal',
  'replicate',
  'openai',
  'veo',
  'pollinations',
  'system',
];

// Custom sharp tooltip for Recharts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className="bg-[#0b0d12] border border-[#d4a574]/60 p-2 font-mono text-[10px] shadow-2xl z-50 text-white"
      style={{ borderRadius: 0 }}
    >
      <div className="text-[#9ca3af] border-b border-[#1f2937] pb-1 mb-1.5 flex items-center justify-between gap-4 font-bold">
        <span>[TIME / SEQ]</span>
        <span className="text-[#d4a574]">{label}</span>
      </div>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          const color = entry.color || entry.stroke || entry.fill || '#d4a574';
          const name = entry.name || entry.dataKey;
          const val = entry.value;
          const unit =
            typeof name === 'string' && name.toLowerCase().includes('rate')
              ? '%'
              : typeof name === 'string' && name.toLowerCase().includes('count')
              ? ' calls'
              : 'ms';

          return (
            <div key={`tip-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-1.5">
                <span
                  className="w-2 h-2 shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[#d4d4d8] uppercase">{name}:</span>
              </div>
              <span className="font-bold font-mono" style={{ color }}>
                {typeof val === 'number' ? (val % 1 === 0 ? val : val.toFixed(1)) : val}
                {unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DebugAnalyticsCharts: React.FC<DebugAnalyticsChartsProps> = ({ logs }) => {
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('ALL');
  const [chartViewMode, setChartViewMode] = useState<'latency' | 'success' | 'volume'>('latency');

  // Compute aggregate statistics per provider
  const statsByProvider = useMemo(() => {
    const map = new Map<
      ProviderId,
      {
        provider: ProviderId;
        label: string;
        color: string;
        reqCount: number;
        resCount: number;
        errCount: number;
        totalCalls: number;
        successRate: number;
        latencies: number[];
        avgLatency: number;
        minLatency: number;
        maxLatency: number;
        p95Latency: number;
      }
    >();

    ALL_PROVIDERS.forEach((prov) => {
      map.set(prov, {
        provider: prov,
        label: PROVIDER_CONFIG[prov].label,
        color: PROVIDER_CONFIG[prov].color,
        reqCount: 0,
        resCount: 0,
        errCount: 0,
        totalCalls: 0,
        successRate: 100,
        latencies: [],
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        p95Latency: 0,
      });
    });

    logs.forEach((log) => {
      const p = map.get(log.provider);
      if (!p) return;

      if (log.type === 'REQ') {
        p.reqCount++;
      } else if (log.type === 'RES') {
        p.resCount++;
        if (log.durationMs !== undefined && log.durationMs > 0) {
          p.latencies.push(log.durationMs);
        }
      } else if (log.type === 'ERR') {
        p.errCount++;
        if (log.durationMs !== undefined && log.durationMs > 0) {
          p.latencies.push(log.durationMs);
        }
      }
    });

    // Compute mathematical averages and success rates
    map.forEach((p) => {
      p.totalCalls = p.resCount + p.errCount;
      if (p.totalCalls > 0) {
        p.successRate = Number(((p.resCount / p.totalCalls) * 100).toFixed(1));
      } else {
        p.successRate = 100;
      }

      if (p.latencies.length > 0) {
        const sorted = [...p.latencies].sort((a, b) => a - b);
        const sum = sorted.reduce((acc, curr) => acc + curr, 0);
        p.avgLatency = Math.round(sum / sorted.length);
        p.minLatency = sorted[0];
        p.maxLatency = sorted[sorted.length - 1];
        const p95Idx = Math.floor(sorted.length * 0.95);
        p.p95Latency = sorted[p95Idx] || p.maxLatency;
      }
    });

    return map;
  }, [logs]);

  // Overall session totals
  const overallSummary = useMemo(() => {
    let totalReq = 0;
    let totalRes = 0;
    let totalErr = 0;
    const allLatencies: number[] = [];

    statsByProvider.forEach((stat) => {
      totalReq += stat.reqCount;
      totalRes += stat.resCount;
      totalErr += stat.errCount;
      allLatencies.push(...stat.latencies);
    });

    const totalResolved = totalRes + totalErr;
    const overallSuccessRate =
      totalResolved > 0
        ? Number(((totalRes / totalResolved) * 100).toFixed(1))
        : 100;

    const avgLat =
      allLatencies.length > 0
        ? Math.round(
            allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length
          )
        : 0;

    return {
      totalReq,
      totalRes,
      totalErr,
      totalResolved,
      overallSuccessRate,
      avgLatency: avgLat,
      activeDataPoints: allLatencies.length,
    };
  }, [statsByProvider]);

  // Chronological timeline data points for Area/Line chart
  const timelineData = useMemo(() => {
    // Reverse logs to chronological order (oldest to newest)
    const chronological = [...logs].reverse();
    const dataPoints: Array<{
      time: string;
      rawTime: number;
      google?: number;
      fal?: number;
      replicate?: number;
      openai?: number;
      veo?: number;
      system?: number;
      status?: string | number;
      endpoint?: string;
    }> = [];

    chronological.forEach((entry, idx) => {
      if (entry.durationMs !== undefined && entry.durationMs > 0) {
        const point: any = {
          time: entry.timestamp.split('.')[0] || `#${idx + 1}`,
          rawTime: entry.rawTimestamp,
          endpoint: entry.endpoint,
          status: entry.status,
        };
        point[entry.provider] = entry.durationMs;
        dataPoints.push(point);
      }
    });

    // If no real API requests have completed yet, supply placeholder session structure
    if (dataPoints.length === 0) {
      return [
        { time: '00:00', google: 420, fal: 380, replicate: 650, openai: 520, system: 80 },
        { time: '00:01', google: 390, fal: 410, replicate: 610, openai: 490, system: 95 },
        { time: '00:02', google: 450, fal: 360, replicate: 590, openai: 540, system: 70 },
      ];
    }

    return dataPoints;
  }, [logs]);

  // Bar chart data for Provider Latency Comparison
  const providerLatencyBarData = useMemo(() => {
    return ALL_PROVIDERS.map((prov) => {
      const stat = statsByProvider.get(prov)!;
      return {
        name: prov.toUpperCase(),
        fullName: stat.label,
        avgLatency: stat.avgLatency || (stat.totalCalls === 0 ? 0 : 0),
        minLatency: stat.minLatency,
        maxLatency: stat.maxLatency,
        p95Latency: stat.p95Latency,
        totalCalls: stat.totalCalls,
        color: stat.color,
      };
    });
  }, [statsByProvider]);

  // Bar chart data for Success Rate vs Error Rate comparison
  const providerSuccessRateData = useMemo(() => {
    return ALL_PROVIDERS.map((prov) => {
      const stat = statsByProvider.get(prov)!;
      return {
        name: prov.toUpperCase(),
        fullName: stat.label,
        successRate: stat.successRate,
        successCount: stat.resCount,
        errorCount: stat.errCount,
        totalCalls: stat.totalCalls,
        color: stat.color,
      };
    });
  }, [statsByProvider]);

  // Quick Ping Benchmark action for user testing
  const handleTriggerBenchmarkPing = () => {
    const provs: ProviderId[] = ['google', 'fal', 'replicate', 'openai'];
    const p = provs[Math.floor(Math.random() * provs.length)];
    const reqId = debugLogger.logRequest(
      p,
      `/api/v1/${p}/health_check`,
      'GET',
      { probe: 'telemetry_ping', timestamp: Date.now() },
      `[PING] Telemetry health check ping -> ${p.toUpperCase()}`
    );

    const simulatedLatency = Math.floor(Math.random() * 450) + 120;
    setTimeout(() => {
      debugLogger.logResponse(
        p,
        `/api/v1/${p}/health_check`,
        200,
        simulatedLatency,
        { status: 'ok', roundTripMs: simulatedLatency, latencyCheck: true },
        `[PONG] Benchmark response 200 OK from ${p.toUpperCase()} (${simulatedLatency}ms)`
      );
    }, simulatedLatency);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#07080c] font-mono text-white p-3 space-y-3">
      {/* Top High-Density Metrics Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {ALL_PROVIDERS.map((prov) => {
          const stat = statsByProvider.get(prov)!;
          const conf = PROVIDER_CONFIG[prov];
          const isSelected =
            selectedProviderFilter === 'ALL' ||
            selectedProviderFilter === prov.toUpperCase();

          return (
            <div
              key={prov}
              onClick={() =>
                setSelectedProviderFilter(
                  selectedProviderFilter === prov.toUpperCase()
                    ? 'ALL'
                    : prov.toUpperCase()
                )
              }
              className={`p-2 border transition-all cursor-pointer select-none relative ${
                isSelected
                  ? 'bg-[#0e1017] border-[#374151] hover:border-[#d4a574]'
                  : 'bg-[#090b0f] border-[#1f2937]/60 opacity-60 hover:opacity-100'
              }`}
              style={{
                borderRadius: 0,
                borderTop: isSelected ? `2px solid ${conf.color}` : undefined,
              }}
            >
              <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                <span style={{ color: conf.color }}>[{prov.toUpperCase()}]</span>
                <span
                  className={`text-[9px] px-1 py-0.2 border ${
                    stat.errCount > 0
                      ? 'text-[#ef4444] border-[#dc2626]/40 bg-[#991b1b]/10'
                      : stat.totalCalls > 0
                      ? 'text-[#10b981] border-[#059669]/40 bg-[#065f46]/10'
                      : 'text-[#6b7280] border-[#374151] bg-[#181b22]'
                  }`}
                >
                  {stat.errCount > 0
                    ? '[ERR]'
                    : stat.totalCalls > 0
                    ? '[ACTIVE]'
                    : '[IDLE]'}
                </span>
              </div>

              <div className="flex items-baseline justify-between text-[10px] text-[#9ca3af] my-0.5">
                <span>AVG LATENCY:</span>
                <span className="text-white font-bold text-xs">
                  {stat.avgLatency > 0 ? `${stat.avgLatency}ms` : '--'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[9px] text-[#6b7280]">
                <span>SUCCESS:</span>
                <span
                  className={`font-bold ${
                    stat.successRate >= 95
                      ? 'text-[#10b981]'
                      : stat.successRate >= 80
                      ? 'text-[#f59e0b]'
                      : 'text-[#ef4444]'
                  }`}
                >
                  {stat.totalCalls > 0 ? `${stat.successRate}%` : '100%'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[9px] text-[#6b7280] mt-0.5">
                <span>CALLS:</span>
                <span className="text-[#d4d4d8]">
                  {stat.resCount} OK / {stat.errCount} ERR
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Ribbon: Chart Views & Filters */}
      <div className="bg-[#11131a] border border-[#1f2937] px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] text-[#9ca3af] uppercase font-bold mr-1">
            VIEW:
          </span>
          <button
            type="button"
            onClick={() => setChartViewMode('latency')}
            className={`h-6 px-2 text-[10px] font-bold uppercase border transition-colors flex items-center space-x-1 ${
              chartViewMode === 'latency'
                ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574]'
                : 'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:text-white'
            }`}
            style={{ borderRadius: 0 }}
          >
            <TrendingUp size={11} />
            <span>[LATENCY TIMELINE]</span>
          </button>

          <button
            type="button"
            onClick={() => setChartViewMode('success')}
            className={`h-6 px-2 text-[10px] font-bold uppercase border transition-colors flex items-center space-x-1 ${
              chartViewMode === 'success'
                ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574]'
                : 'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:text-white'
            }`}
            style={{ borderRadius: 0 }}
          >
            <CheckCircle2 size={11} />
            <span>[SUCCESS RATES & HEALTH]</span>
          </button>

          <button
            type="button"
            onClick={() => setChartViewMode('volume')}
            className={`h-6 px-2 text-[10px] font-bold uppercase border transition-colors flex items-center space-x-1 ${
              chartViewMode === 'volume'
                ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574]'
                : 'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:text-white'
            }`}
            style={{ borderRadius: 0 }}
          >
            <BarChart2 size={11} />
            <span>[LATENCY BENCHMARKS]</span>
          </button>
        </div>

        {/* Global Summary Badge & Probe Action */}
        <div className="flex items-center space-x-3 text-[10px]">
          <div className="hidden sm:flex items-center space-x-2 text-[#9ca3af]">
            <span>
              TOTAL RESOLVED: <strong className="text-white">{overallSummary.totalResolved}</strong>
            </span>
            <span className="text-[#1f2937]">|</span>
            <span>
              SESSION SUCCESS:{' '}
              <strong
                className={
                  overallSummary.overallSuccessRate >= 95
                    ? 'text-[#10b981]'
                    : 'text-[#f59e0b]'
                }
              >
                {overallSummary.overallSuccessRate}%
              </strong>
            </span>
            <span className="text-[#1f2937]">|</span>
            <span>
              GLOBAL AVG:{' '}
              <strong className="text-[#38bdf8]">
                {overallSummary.avgLatency > 0 ? `${overallSummary.avgLatency}ms` : '--'}
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleTriggerBenchmarkPing}
            className="h-6 px-2.5 text-[9px] font-bold uppercase bg-[#181b22] text-[#d4a574] border border-[#d4a574]/50 hover:bg-[#d4a574] hover:text-[#0b0d12] flex items-center space-x-1 transition-colors"
            style={{ borderRadius: 0 }}
            title="Dispatch a real-time probe ping to simulate and benchmark API latency"
          >
            <Zap size={10} />
            <span>[BENCHMARK PROBE PING]</span>
          </button>
        </div>
      </div>

      {/* Main Visualization Viewport */}
      <div className="bg-[#0b0d12] border border-[#1f2937] p-3 flex-1 flex flex-col min-h-[220px]">
        {/* Header for Active Chart */}
        <div className="flex items-center justify-between text-[11px] font-bold text-[#d4a574] border-b border-[#1f2937] pb-2 mb-2">
          <div className="flex items-center space-x-2">
            <Activity size={13} />
            <span>
              {chartViewMode === 'latency' &&
                '[REAL-TIME MULTI-PROVIDER LATENCY TIMELINE // SEQUENCE TRACKER]'}
              {chartViewMode === 'success' &&
                '[PROVIDER SUCCESS RATE (%) & REQUEST STATUS MATRIX]'}
              {chartViewMode === 'volume' &&
                '[BENCHMARK AVERAGE & P95 LATENCY BREAKDOWN (MS)]'}
            </span>
          </div>
          <span className="text-[9px] text-[#6b7280] uppercase">
            UNIT: {chartViewMode === 'success' ? 'PERCENTAGE (%)' : 'MILLISECONDS (MS)'}
          </span>
        </div>

        {/* Chart Render Canvas */}
        <div className="flex-1 w-full min-h-[190px] h-[190px]">
          {chartViewMode === 'latency' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#4b5563"
                  tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#374151' }}
                />
                <YAxis
                  stroke="#4b5563"
                  tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#374151' }}
                  domain={[0, 'auto']}
                  unit="ms"
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    paddingTop: '6px',
                  }}
                />
                {(selectedProviderFilter === 'ALL' || selectedProviderFilter === 'GOOGLE') && (
                  <Line
                    type="monotone"
                    dataKey="google"
                    name="Google Imagen/Gemini"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#38bdf8', stroke: '#0e1017' }}
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 1 }}
                    connectNulls
                  />
                )}
                {(selectedProviderFilter === 'ALL' || selectedProviderFilter === 'FAL') && (
                  <Line
                    type="monotone"
                    dataKey="fal"
                    name="fal.ai Gateway"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#ec4899', stroke: '#0e1017' }}
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 1 }}
                    connectNulls
                  />
                )}
                {(selectedProviderFilter === 'ALL' || selectedProviderFilter === 'REPLICATE') && (
                  <Line
                    type="monotone"
                    dataKey="replicate"
                    name="Replicate API"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#a855f7', stroke: '#0e1017' }}
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 1 }}
                    connectNulls
                  />
                )}
                {(selectedProviderFilter === 'ALL' || selectedProviderFilter === 'OPENAI') && (
                  <Line
                    type="monotone"
                    dataKey="openai"
                    name="OpenAI DALL-E"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#10b981', stroke: '#0e1017' }}
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 1 }}
                    connectNulls
                  />
                )}
                {(selectedProviderFilter === 'ALL' || selectedProviderFilter === 'VEO') && (
                  <Line
                    type="monotone"
                    dataKey="veo"
                    name="Google Veo 2.0"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#f59e0b', stroke: '#0e1017' }}
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 1 }}
                    connectNulls
                  />
                )}
                {(selectedProviderFilter === 'ALL' || selectedProviderFilter === 'SYSTEM') && (
                  <Line
                    type="monotone"
                    dataKey="system"
                    name="Procedural Engine"
                    stroke="#d4a574"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={{ r: 2, fill: '#d4a574' }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}

          {chartViewMode === 'success' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={providerSuccessRateData}
                margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#4b5563"
                  tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#374151' }}
                />
                <YAxis
                  stroke="#4b5563"
                  tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#374151' }}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip content={<CustomChartTooltip />} />
                <ReferenceLine
                  y={95}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{
                    value: 'SLA TARGET 95%',
                    fill: '#10b981',
                    fontSize: 9,
                    position: 'top',
                  }}
                />
                <Bar dataKey="successRate" name="Success Rate" barSize={32}>
                  {providerSuccessRateData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#1f2937"
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartViewMode === 'volume' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={providerLatencyBarData}
                margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#4b5563"
                  tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#374151' }}
                />
                <YAxis
                  stroke="#4b5563"
                  tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#374151' }}
                  unit="ms"
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    paddingTop: '6px',
                  }}
                />
                <Bar
                  dataKey="avgLatency"
                  name="Average Latency (ms)"
                  fill="#d4a574"
                  barSize={24}
                />
                <Bar
                  dataKey="p95Latency"
                  name="P95 Latency (ms)"
                  fill="#38bdf8"
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
