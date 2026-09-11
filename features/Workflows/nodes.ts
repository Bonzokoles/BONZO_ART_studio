import { executeMultiProviderGeneration, executeImageEdit, saveToGenerationHistory } from '../../services/providerEngine';
import type { AspectRatio, ProviderId, HistoryItem, UploadedFile } from '../../types';

/**
 * Workflow node definitions for the LiteGraph editor.
 *
 * LiteGraph is loaded globally via <script src="/litegraph/litegraph.min.js"> in
 * index.html, so we access `window.LiteGraph` / `window.LGraph` here rather than
 * importing the CJS bundle (whose `this`-based export wrapper is fragile under
 * Vite's ESM interop).
 */

declare global {
  interface Window {
    LiteGraph: any;
    LGraph: any;
    LGraphCanvas: any;
  }
}

type LogFn = (lvl: string, msg: string) => void;

let logSink: LogFn | null = null;

/** Wire the workflow log panel to a React setState callback. */
export const setWorkflowLogSink = (fn: LogFn | null): void => {
  logSink = fn;
};

function wfLog(lvl: string, msg: string): void {
  if (logSink) logSink(lvl, msg);
  else console.log(`[WF:${lvl}]`, msg);
}

/** Nearest known AspectRatio for a width/height pair (for ImageParams). */
function deriveAspectRatio(w: number, h: number): AspectRatio {
  const r = w / h;
  const map: [number, AspectRatio][] = [
    [1, '1:1'],
    [16 / 9, '16:9'],
    [9 / 16, '9:16'],
    [4 / 3, '4:3'],
    [3 / 4, '3:4'],
    [2 / 3, '2:3'],
    [3 / 2, '3:2'],
    [21 / 9, '21:9'],
  ];
  let best: AspectRatio = '1:1';
  let bestD = Infinity;
  for (const [r2, a] of map) {
    const d = Math.abs(r - r2);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

function dataUrlToUploadedFile(dataUrl: string): UploadedFile {
  const m = dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.*)$/);
  const mimeType = m ? m[1] : 'image/png';
  const base64 = m ? m[2] : dataUrl.replace(/^data:image\/[\w.+-]+;base64,/, '');
  return { base64, mimeType, preview: dataUrl, name: 'workflow-input' };
}

/** Metadata from the most recent generative node, consumed by the Output node. */
interface RunMeta {
  prompt: string;
  negativePrompt: string;
  provider: ProviderId;
  model: string;
  width: number;
  height: number;
  seed: number;
  cost: number;
}

let lastRunMeta: RunMeta | null = null;

let registered = false;

/** Register the 8 custom node types on the global LiteGraph. Idempotent. */
export function registerWorkflowNodes(): void {
  if (registered) return;
  const LiteGraph = window.LiteGraph;
  if (!LiteGraph) return;
  registered = true;

  // --- Prompt Node ---
  function BonzoPrompt(this: any) {
    this.addOutput('prompt', 'string');
    this.addProperty('text', 'A beautiful landscape painting');
    this.addProperty('negative', '');
    this.addWidget('text', 'Prompt', this.properties.text, (v: string) => (this.properties.text = v));
    this.addWidget('text', 'Negative', this.properties.negative, (v: string) => (this.properties.negative = v));
    this.size = [260, 80];
    this.color = '#1a1d24';
    this.bgcolor = '#11131a';
  }
  BonzoPrompt.title = 'Prompt';
  BonzoPrompt.desc = 'Text prompt input';
  BonzoPrompt.prototype.onExecute = function (this: any) {
    this.setOutputData(0, { text: this.properties.text, negative: this.properties.negative });
  };
  LiteGraph.registerNodeType('input/prompt', BonzoPrompt);

  // --- Checkpoint Node ---
  function BonzoCheckpoint(this: any) {
    this.addOutput('model', 'string');
    this.addProperty('provider', 'google');
    this.addProperty('model', 'gemini-2.5-flash-image');
    this.addWidget('combo', 'Provider', this.properties.provider, (v: string) => (this.properties.provider = v), {
      values: ['google', 'fal', 'replicate', 'openai'],
    });
    this.addWidget('text', 'Model ID', this.properties.model, (v: string) => (this.properties.model = v));
    this.size = [260, 70];
    this.color = '#1a1d24';
    this.bgcolor = '#11131a';
  }
  BonzoCheckpoint.title = 'Checkpoint';
  BonzoCheckpoint.desc = 'Model/provider selector';
  BonzoCheckpoint.prototype.onExecute = function (this: any) {
    this.setOutputData(0, { provider: this.properties.provider, model: this.properties.model });
  };
  LiteGraph.registerNodeType('model/checkpoint', BonzoCheckpoint);

  // --- Latent Empty ---
  function BonzoLatent(this: any) {
    this.addOutput('latent', 'object');
    this.addProperty('width', 1024);
    this.addProperty('height', 1024);
    this.addWidget('number', 'Width', this.properties.width, (v: number) => (this.properties.width = v), { min: 256, max: 2048, step: 64 });
    this.addWidget('number', 'Height', this.properties.height, (v: number) => (this.properties.height = v), { min: 256, max: 2048, step: 64 });
    this.size = [220, 70];
    this.color = '#1a1d24';
    this.bgcolor = '#11131a';
  }
  BonzoLatent.title = 'Latent Empty';
  BonzoLatent.desc = 'Empty latent space';
  BonzoLatent.prototype.onExecute = function (this: any) {
    this.setOutputData(0, { width: this.properties.width, height: this.properties.height });
  };
  LiteGraph.registerNodeType('latent/empty', BonzoLatent);

  // --- KSampler (generation, via providerEngine) ---
  function BonzoKSampler(this: any) {
    this.addInput('prompt', 'string');
    this.addInput('model', 'string');
    this.addInput('latent', 'object');
    this.addOutput('image', 'string');
    this.addProperty('seed', Math.floor(Math.random() * 999999));
    this.addProperty('steps', 25);
    this.addProperty('cfg', 7.5);
    this.addWidget('number', 'Seed', this.properties.seed, (v: number) => (this.properties.seed = v), { min: 0, max: 999999 });
    this.addWidget('number', 'Steps', this.properties.steps, (v: number) => (this.properties.steps = v), { min: 1, max: 100 });
    this.addWidget('number', 'CFG', this.properties.cfg, (v: number) => (this.properties.cfg = v), { min: 1, max: 30, step: 0.5 });
    this.size = [240, 110];
    this.color = '#1a1d24';
    this.bgcolor = '#11131a';
  }
  BonzoKSampler.title = 'KSampler';
  BonzoKSampler.desc = 'Image generation sampler';
  BonzoKSampler.prototype.onExecute = async function (this: any) {
    const promptData = this.getInputData(0);
    const modelData = this.getInputData(1);
    const latentData = this.getInputData(2);
    if (!promptData || !modelData) return;
    this.boxcolor = '#d4a574';
    wfLog('RUN', `KSampler: dispatching ${modelData.provider}/${modelData.model}`);
    try {
      const w = latentData?.width || 1024;
      const h = latentData?.height || 1024;
      const provider = modelData.provider as ProviderId;
      const model = modelData.model as string;
      const result = await executeMultiProviderGeneration({
        prompt: promptData.text,
        negativePrompt: promptData.negative || '',
        provider,
        model,
        width: w,
        height: h,
        aspectRatio: deriveAspectRatio(w, h),
        numOutputs: 1,
        seed: this.properties.seed,
        guidanceScale: this.properties.cfg,
        steps: this.properties.steps,
      });
      lastRunMeta = {
        prompt: promptData.text,
        negativePrompt: promptData.negative || '',
        provider,
        model,
        width: w,
        height: h,
        seed: this.properties.seed,
        cost: result.cost,
      };
      const img = result.images[0];
      this.setOutputData(0, img);
      this.boxcolor = '#10b981';
      wfLog('OK', `KSampler: image generated (${Math.round((img?.length || 0) / 1024)} KB)`);
    } catch (e: any) {
      this.boxcolor = '#ef4444';
      wfLog('ERR', `KSampler failed: ${e.message}`);
    }
  };
  LiteGraph.registerNodeType('generate/ksampler', BonzoKSampler);

  // --- VAE Decode ---
  function BonzoVAE(this: any) {
    this.addInput('image', 'string');
    this.addOutput('image', 'string');
    this.size = [160, 50];
    this.color = '#1a1d24';
    this.bgcolor = '#11131a';
  }
  BonzoVAE.title = 'VAE Decode';
  BonzoVAE.desc = 'Passthrough decode (visual)';
  BonzoVAE.prototype.onExecute = function (this: any) {
    this.setOutputData(0, this.getInputData(0));
  };
  LiteGraph.registerNodeType('postprocess/vae_decode', BonzoVAE);

  // --- Inpaint Edit ---
  function BonzoInpaint(this: any) {
    this.addInput('image', 'string');
    this.addInput('prompt', 'string');
    this.addOutput('image', 'string');
    this.addProperty('provider', 'google');
    this.addProperty('model', 'gemini-2.5-flash-image');
    this.addWidget('combo', 'Provider', this.properties.provider, (v: string) => (this.properties.provider = v), { values: ['google'] });
    this.size = [240, 70];
    this.color = '#1a1d24';
    this.bgcolor = '#11131a';
  }
  BonzoInpaint.title = 'Inpaint Edit';
  BonzoInpaint.desc = 'Image editing via prompt';
  BonzoInpaint.prototype.onExecute = async function (this: any) {
    const imgData = this.getInputData(0);
    const promptData = this.getInputData(1);
    if (!imgData || !promptData) return;
    this.boxcolor = '#d4a574';
    wfLog('RUN', `Inpaint: editing with ${this.properties.provider}`);
    try {
      const file = dataUrlToUploadedFile(imgData);
      const result = await executeImageEdit({
        prompt: promptData.text,
        image: file,
        provider: this.properties.provider as ProviderId,
        model: this.properties.model,
      });
      lastRunMeta = {
        prompt: promptData.text,
        negativePrompt: '',
        provider: this.properties.provider as ProviderId,
        model: this.properties.model,
        width: 1024,
        height: 1024,
        seed: 0,
        cost: 0,
      };
      this.setOutputData(0, result);
      this.boxcolor = '#10b981';
      wfLog('OK', 'Inpaint: edit complete');
    } catch (e: any) {
      this.boxcolor = '#ef4444';
      wfLog('ERR', `Inpaint failed: ${e.message}`);
    }
  };
  LiteGraph.registerNodeType('edit/inpaint', BonzoInpaint);

  // --- Enhancer (STUB — post-processing delegated) ---
  function BonzoEnhancer(this: any) {
    this.addInput('image', 'string');
    this.addOutput('image', 'string');
    this.addProperty('scale', 2);
    this.addWidget('number', 'Scale', this.properties.scale, (v: number) => (this.properties.scale = v), { min: 2, max: 4, step: 1 });
    this.size = [200, 60];
    this.color = '#1a1d24';
    this.bgcolor = '#11131a';
  }
  BonzoEnhancer.title = 'Enhancer (TODO)';
  BonzoEnhancer.desc = 'TODO: Post-processing / upscale — delegated to another agent';
  BonzoEnhancer.prototype.onExecute = function (this: any) {
    wfLog('WARN', 'Enhancer: STUB — post-processing not yet implemented');
    this.boxcolor = '#f59e0b';
    this.setOutputData(0, this.getInputData(0));
  };
  LiteGraph.registerNodeType('postprocess/enhancer', BonzoEnhancer);

  // --- Output (save to gallery via providerEngine history) ---
  function BonzoOutput(this: any) {
    this.addInput('image', 'string');
    this.addProperty('autoSave', true);
    this.addWidget('toggle', 'Auto Save', true, (v: boolean) => (this.properties.autoSave = v));
    this.size = [180, 50];
    this.color = '#1a1d24';
    this.bgcolor = '#11131a';
  }
  BonzoOutput.title = 'Save Output';
  BonzoOutput.desc = 'Save result to gallery';
  BonzoOutput.prototype.onExecute = function (this: any) {
    const img = this.getInputData(0);
    if (!img) return;
    const meta = lastRunMeta;
    if (meta && this.properties.autoSave) {
      const item: HistoryItem = {
        id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        prompt: meta.prompt,
        negativePrompt: meta.negativePrompt || undefined,
        provider: meta.provider,
        model: meta.model,
        aspectRatio: deriveAspectRatio(meta.width, meta.height),
        width: meta.width,
        height: meta.height,
        seed: meta.seed,
        cost: meta.cost,
        images: [img],
      };
      saveToGenerationHistory(item);
      wfLog('OK', `Output: saved to gallery (${Math.round(img.length / 1024)} KB)`);
    } else {
      wfLog('OK', `Output: image ready (${Math.round(img.length / 1024)} KB)`);
    }
    this.boxcolor = '#10b981';
  };
  LiteGraph.registerNodeType('output/save', BonzoOutput);
}
