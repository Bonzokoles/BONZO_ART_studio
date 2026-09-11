export type ProviderId = 'fal' | 'replicate' | 'google' | 'openai' | 'local' | 'pollinations';

export type FeatureTab =
  | 'Image Generation'
  | 'Image Editing'
  | 'Image Analysis'
  | 'Video Generation'
  | 'Video Continuation'
  | 'Prompt Library'
  | 'Timeline Studio'
  | 'Workflows';

export type AppMode = 'canvas' | 'workflow';
export type LeftTab = 'generate' | 'nodes' | 'styles' | 'train';
export type RightTab = 'assets' | 'layers' | 'process';
export type CanvasTool = 'pan' | 'select' | 'pen' | 'text' | 'upload' | 'rectangle' | 'dropper' | 'wand';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2' | '21:9';
export type VideoAspectRatio = '16:9' | '9:16';

export interface GenerationPreset {
  id: string;
  label: string;
  provider: ProviderId;
  model: string;
  mode?: 'fast' | 'quality' | 'cheap';
  description: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  prompt: string;
  negativePrompt?: string;
  provider: ProviderId;
  model: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  seed: number;
  cost: number;
  images: string[];
  timeMs?: number;
}

export interface ModelInfo {
  id: string;
  label: string;
  provider: ProviderId;
  category: 'image' | 'video' | 'postprocess' | 'edit';
  costPerImage?: number;
  maxOutputs?: number;
  supportsNegativePrompt?: boolean;
  supportsSeed?: boolean;
  /** Replicate community models need a pinned version (POST /v1/predictions). */
  replicateVersion?: string;
}

export interface ImageParams {
  prompt: string;
  provider: ProviderId;
  model: string;
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  numOutputs: number;
  seed?: number;
  negativePrompt?: string;
  guidanceScale: number;
  steps: number;
  mode?: 'fast' | 'quality' | 'cheap';
}

export interface UploadedFile {
  base64: string;
  mimeType: string;
  preview: string;
  name?: string;
}

export interface CanvasLayer {
  id: string;
  name: string;
  type: 'image' | 'text' | 'mask' | 'shape';
  url?: string;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
  prompt?: string;
  provider?: ProviderId;
  model?: string;
  seed?: number;
}

export interface GeneratedAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  prompt: string;
  provider: ProviderId;
  model: string;
  aspectRatio: string;
  width: number;
  height: number;
  seed: number;
  guidanceScale: number;
  timestamp: string;
  generationTimeMs: number;
  rawPayload?: any;
}

export interface StylePreset {
  id: string;
  name: string;
  category: string;
  promptSuffix: string;
  negativePrompt?: string;
  previewGradient: string;
  description: string;
  tags: string[];
}

export interface WorkflowNode {
  id: string;
  title: string;
  type: 'prompt' | 'checkpoint' | 'ksampler' | 'latent' | 'vae' | 'output' | 'enhancer' | 'inpaint';
  x: number;
  y: number;
  inputs: { id: string; name: string; type: string; connectedFrom?: string }[];
  outputs: { id: string; name: string; type: string }[];
  params: Record<string, any>;
  status?: 'idle' | 'running' | 'completed' | 'error';
}

export interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  fromOutputId: string;
  toNodeId: string;
  toInputId: string;
}

export interface AnalysisReport {
  description: string;
  objects: string[];
  colors: string[];
  style: string;
  mood: string;
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
  statusText?: string;
  estimatedTotalSeconds?: number;
}

export interface VeoOperationContext {
  operation: any;
  prompt: string;
}

export interface EditContext {
  image: string;
  prompt: string;
  provider: ProviderId;
  model: string;
}

export interface LoraTrainingConfig {
  triggerWord: string;
  baseModel: string;
  epochs: number;
  rank: number;
  alpha: number;
  learningRate: number;
  datasetCount: number;
  status: 'idle' | 'training' | 'completed' | 'error';
  currentEpoch: number;
  lossHistory: number[];
}
