export type FeatureTab =
  | 'Image Generation'
  | 'Image Editing'
  | 'Image Analysis'
  | 'Video Generation'
  | 'Video Continuation'
  | 'Prompt Library';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type VideoAspectRatio = '16:9' | '9:16';

export interface UploadedFile {
  base64: string;
  mimeType: string;
  preview: string;
}

export interface VeoOperationContext {
  operation: any;
  prompt: string;
}

export interface ProgressStage {
  id: string;
  code: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  detail?: string;
}

export interface TelemetryLog {
  timestamp: string;
  level: 'INFO' | 'RUN' | 'POLL' | 'OK' | 'ERR' | 'WARN';
  message: string;
}

export interface PollingStats {
  pollCount: number;
  elapsedSeconds: number;
  estimatedProgress: number;
  stage: string;
  message: string;
}
