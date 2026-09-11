export type LogType = 'REQ' | 'RES' | 'ERR' | 'INFO' | 'WARN';
export type ProviderId = 'google' | 'fal' | 'replicate' | 'openai' | 'system' | 'veo' | 'pollinations';

export interface LogEntry {
  id: string;
  timestamp: string; // HH:MM:SS.mmm
  rawTimestamp: number;
  type: LogType;
  provider: ProviderId;
  endpoint: string;
  method?: string; // POST, GET, SDK, WS
  status?: number | string; // 200, 401, 429, 'OK', 'FAILED'
  durationMs?: number;
  message: string;
  requestPayload?: any;
  responsePayload?: any;
  headers?: Record<string, string>;
  errorDetails?: string;
}

type LogListener = (logs: LogEntry[]) => void;
type ActiveCallListener = (count: number) => void;

class DebugLoggerService {
  private logs: LogEntry[] = [];
  private maxLogs: number = 250;
  private listeners: Set<LogListener> = new Set();
  private activeCallListeners: Set<ActiveCallListener> = new Set();
  private activeCallsCount: number = 0;

  constructor() {
    // Initial system boot log
    this.logInfo('system', 'DEBUG CONSOLE INITIALIZED // Ready for multi-provider API tracking', {
      environment: 'Web Container',
      port: 3219,
      supportedProviders: ['google', 'fal', 'replicate', 'openai', 'veo'],
    });
  }

  private formatTimestamp(date: Date = new Date()): string {
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    const mmm = pad(date.getMilliseconds(), 3);
    return `${hh}:${mm}:${ss}.${mmm}`;
  }

  private sanitizePayload(data: any): any {
    if (!data) return data;
    try {
      // Deep clone to avoid mutating original objects
      const str = JSON.stringify(data, (key, value) => {
        // Redact potential API keys or sensitive authorization headers
        if (
          typeof key === 'string' &&
          /key|token|auth|secret|password|bearer/i.test(key) &&
          typeof value === 'string' &&
          value.length > 8
        ) {
          return `${value.substring(0, 4)}...[REDACTED]`;
        }
        // Truncate long base64 strings in log inspect preview
        if (typeof value === 'string' && value.startsWith('data:image/')) {
          return `[Base64 Image Data (${Math.round(value.length / 1024)} KB)]`;
        }
        return value;
      });
      return JSON.parse(str);
    } catch {
      return String(data);
    }
  }

  private notify() {
    const copy = [...this.logs];
    this.listeners.forEach((cb) => {
      try {
        cb(copy);
      } catch (err) {
        console.error('Error in debug log listener:', err);
      }
    });
  }

  private notifyActiveCalls() {
    this.activeCallListeners.forEach((cb) => {
      try {
        cb(this.activeCallsCount);
      } catch (err) {
        console.error('Error in active call listener:', err);
      }
    });
  }

  public subscribe(callback: LogListener): () => void {
    this.listeners.add(callback);
    callback([...this.logs]);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeActiveCalls(callback: ActiveCallListener): () => void {
    this.activeCallListeners.add(callback);
    callback(this.activeCallsCount);
    return () => {
      this.activeCallListeners.delete(callback);
    };
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public getActiveCallsCount(): number {
    return this.activeCallsCount;
  }

  public clear(): void {
    this.logs = [];
    this.logInfo('system', 'DEBUG LOGS CLEARED');
  }

  public startCall(): void {
    this.activeCallsCount++;
    this.notifyActiveCalls();
  }

  public endCall(): void {
    this.activeCallsCount = Math.max(0, this.activeCallsCount - 1);
    this.notifyActiveCalls();
  }

  public logRequest(
    provider: ProviderId,
    endpoint: string,
    method: string = 'POST',
    payload?: any,
    message?: string
  ): string {
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const entry: LogEntry = {
      id,
      timestamp: this.formatTimestamp(),
      rawTimestamp: Date.now(),
      type: 'REQ',
      provider,
      endpoint,
      method,
      status: 'DISPATCHED',
      message: message || `[DISPATCH] ${method} -> ${endpoint}`,
      requestPayload: this.sanitizePayload(payload),
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.startCall();
    this.notify();

    // Echo to stdout with required bracketed tag and timestamp
    console.log(`[${entry.timestamp}] [REQ] [${provider.toUpperCase()}] ${entry.message}`);
    return id;
  }

  public logResponse(
    provider: ProviderId,
    endpoint: string,
    status: number | string,
    durationMs: number,
    responsePayload?: any,
    message?: string
  ): void {
    const entry: LogEntry = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: this.formatTimestamp(),
      rawTimestamp: Date.now(),
      type: 'RES',
      provider,
      endpoint,
      status,
      durationMs,
      message: message || `[RESOLVED] Status: ${status} in ${durationMs}ms`,
      responsePayload: this.sanitizePayload(responsePayload),
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.endCall();
    this.notify();

    console.log(
      `[${entry.timestamp}] [RES] [${provider.toUpperCase()}] ${status} (${durationMs}ms) - ${entry.message}`
    );
  }

  public logError(
    provider: ProviderId,
    endpoint: string,
    error: any,
    durationMs?: number,
    requestPayload?: any
  ): void {
    const errMsg = error?.message || error?.statusText || (typeof error === 'string' ? error : 'Unknown Error');
    const entry: LogEntry = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: this.formatTimestamp(),
      rawTimestamp: Date.now(),
      type: 'ERR',
      provider,
      endpoint,
      status: error?.status || 'ERROR',
      durationMs,
      message: `[FAILURE] ${errMsg}`,
      errorDetails: error?.stack || (typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error)),
      requestPayload: this.sanitizePayload(requestPayload),
      responsePayload: error?.response || error?.data || undefined,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.endCall();
    this.notify();

    console.error(
      `[${entry.timestamp}] [ERR] [${provider.toUpperCase()}] ${entry.message} - ${endpoint}`
    );
  }

  public logInfo(provider: ProviderId, message: string, details?: any): void {
    const entry: LogEntry = {
      id: `inf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: this.formatTimestamp(),
      rawTimestamp: Date.now(),
      type: 'INFO',
      provider,
      endpoint: 'internal',
      status: 'OK',
      message: `[INFO] ${message}`,
      responsePayload: this.sanitizePayload(details),
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.notify();
    console.log(`[${entry.timestamp}] [INFO] [${provider.toUpperCase()}] ${message}`);
  }

  public logWarning(provider: ProviderId, message: string, details?: any): void {
    const entry: LogEntry = {
      id: `wrn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: this.formatTimestamp(),
      rawTimestamp: Date.now(),
      type: 'WARN',
      provider,
      endpoint: 'internal',
      status: 'WARN',
      message: `[WARN] ${message}`,
      responsePayload: this.sanitizePayload(details),
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.notify();
    console.warn(`[${entry.timestamp}] [WARN] [${provider.toUpperCase()}] ${message}`);
  }

  public exportJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const debugLogger = new DebugLoggerService();
