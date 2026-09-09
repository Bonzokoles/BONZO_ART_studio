import { GoogleGenAI } from '@google/genai';
import type {
  ProviderId,
  AspectRatio,
  ModelInfo,
  GenerationPreset,
  ImageParams,
  PollingStats,
  HistoryItem,
} from '../types';
import { getKey } from './keyStorage';
import { generateProceduralArtwork } from './geminiService';
import { debugLogger } from './debugLogger';

export const ASPECT_RATIO_DIMENSIONS: Record<
  AspectRatio,
  { width: number; height: number; label: string }
> = {
  '1:1': { width: 1024, height: 1024, label: '1:1 SQUARE' },
  '16:9': { width: 1344, height: 768, label: '16:9 LANDSCAPE' },
  '9:16': { width: 768, height: 1344, label: '9:16 PORTRAIT' },
  '4:3': { width: 1280, height: 960, label: '4:3 CLASSIC' },
  '3:4': { width: 960, height: 1280, label: '3:4 VERTICAL' },
  '2:3': { width: 852, height: 1280, label: '2:3 PHOTO' },
  '3:2': { width: 1280, height: 852, label: '3:2 PHOTO' },
  '21:9': { width: 1536, height: 656, label: '21:9 CINEMA' },
};

export const PRESETS: GenerationPreset[] = [
  {
    id: 'flux-fast',
    label: 'FLUX Fast',
    provider: 'fal',
    model: 'fal-ai/flux/schnell',
    mode: 'fast',
    description: 'Ultra-fast 4-step generation by Black Forest Labs ($0.003/img)',
  },
  {
    id: 'flux-pro',
    label: 'FLUX Pro',
    provider: 'fal',
    model: 'fal-ai/flux-pro/v1.1',
    mode: 'quality',
    description: 'SOTA photorealism, typography & prompt fidelity ($0.05/img)',
  },
  {
    id: 'sdxl',
    label: 'SD 3.5 Medium',
    provider: 'replicate',
    model: 'stability-ai/stable-diffusion-3.5-medium',
    mode: 'quality',
    description: 'Stability AI SD 3.5 Medium ($0.035/img)',
  },
  {
    id: 'gpt-image',
    label: 'GPT Image 1',
    provider: 'openai',
    model: 'dall-e-3',
    mode: 'quality',
    description: 'OpenAI DALL-E 3 rich semantic conceptual comprehension ($0.04/img)',
  },
  {
    id: 'nano-banana',
    label: 'Nano Banana',
    provider: 'google',
    model: 'gemini-2.5-flash-image',
    mode: 'fast',
    description: 'Google multimodal image synthesizer (Free Tier 500 req/day)',
  },
  {
    id: 'nano-banana-pro',
    label: 'Nano Banana Pro',
    provider: 'google',
    model: 'gemini-3-pro-image',
    mode: 'quality',
    description: 'Google DeepMind high-fidelity image model, output to 4K',
  },
];

export const MODELS: ModelInfo[] = [
  // Google
  {
    id: 'gemini-2.5-flash-image',
    label: 'Nano Banana (Flash)',
    provider: 'google',
    category: 'image',
    costPerImage: 0.0,
    maxOutputs: 4,
    supportsNegativePrompt: false,
    supportsSeed: true,
  },
  {
    id: 'gemini-3.1-flash-image',
    label: 'Nano Banana 2',
    provider: 'google',
    category: 'image',
    costPerImage: 0.02,
    maxOutputs: 4,
    supportsNegativePrompt: false,
    supportsSeed: true,
  },
  {
    id: 'gemini-3-pro-image',
    label: 'Nano Banana Pro',
    provider: 'google',
    category: 'image',
    costPerImage: 0.04,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'gemini-3.1-flash-lite-image',
    label: 'Nano Banana 2 Lite',
    provider: 'google',
    category: 'image',
    costPerImage: 0.01,
    maxOutputs: 4,
    supportsNegativePrompt: false,
    supportsSeed: true,
  },

  // fal.ai
  {
    id: 'fal-ai/flux/schnell',
    label: 'FLUX.1 Schnell',
    provider: 'fal',
    category: 'image',
    costPerImage: 0.003,
    maxOutputs: 4,
    supportsNegativePrompt: false,
    supportsSeed: true,
  },
  {
    id: 'fal-ai/flux-pro/v1.1',
    label: 'FLUX.1.1 Pro',
    provider: 'fal',
    category: 'image',
    costPerImage: 0.05,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'fal-ai/flux-pro/v1.1-ultra',
    label: 'FLUX.1.1 Pro Ultra',
    provider: 'fal',
    category: 'image',
    costPerImage: 0.06,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'fal-ai/ideogram/v3',
    label: 'Ideogram V3 (fal.ai)',
    provider: 'fal',
    category: 'image',
    costPerImage: 0.05,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'fal-ai/flux/dev',
    label: 'FLUX.1 Dev',
    provider: 'fal',
    category: 'image',
    costPerImage: 0.025,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'fal-ai/recraft-v3',
    label: 'Recraft V3',
    provider: 'fal',
    category: 'image',
    costPerImage: 0.04,
    maxOutputs: 4,
    supportsNegativePrompt: false,
    supportsSeed: true,
  },
  {
    id: 'fal-ai/stable-diffusion-35-large',
    label: 'SD 3.5 Large (fal.ai)',
    provider: 'fal',
    category: 'image',
    costPerImage: 0.03,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'fal-ai/playground-v25',
    label: 'Playground v2.5 (fal.ai)',
    provider: 'fal',
    category: 'image',
    costPerImage: 0.01,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'fal-ai/auraflow',
    label: 'AuraFlow (fal.ai)',
    provider: 'fal',
    category: 'image',
    costPerImage: 0.005,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },

  // Replicate
  {
    id: 'stability-ai/stable-diffusion-3.5-medium',
    label: 'SD 3.5 Medium',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.004,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'black-forest-labs/flux-schnell',
    label: 'FLUX Schnell (Replicate)',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.003,
    maxOutputs: 4,
    supportsNegativePrompt: false,
    supportsSeed: true,
  },
  {
    id: 'black-forest-labs/flux-1.1-pro',
    label: 'FLUX Pro (Replicate)',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.05,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'black-forest-labs/flux-1.1-pro-ultra',
    label: 'FLUX Pro Ultra (Replicate)',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.06,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'black-forest-labs/flux-dev',
    label: 'FLUX Dev (Replicate)',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.025,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'stability-ai/stable-diffusion-3.5-large',
    label: 'SD 3.5 Large (Replicate)',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.035,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'recraft-ai/recraft-v3',
    label: 'Recraft V3',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.015,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'ideogram-ai/ideogram-v2',
    label: 'Ideogram V2',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.008,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
  },
  {
    id: 'lucataco/dreamshaper-xl-turbo',
    label: 'DreamShaper XL Turbo',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.005,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
    replicateVersion: '0a1710e0187b01a255302738ca0158ff02a22f4638679533e111082f9dd1b615',
  },
  {
    id: 'ai-forever/kandinsky-2.2',
    label: 'Kandinsky 2.2',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.01,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
    replicateVersion: 'ad9d7879fbffa2874e1d909d1d37d9bc682889cc65b31f7bb00d2362619f194a',
  },
  {
    id: 'nvidia/sana',
    label: 'NVIDIA Sana',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.005,
    maxOutputs: 4,
    supportsNegativePrompt: true,
    supportsSeed: true,
    replicateVersion: 'c6b5d2b7459910fec94432e9e1203c3cdce92d6db20f714f1355747990b52fa6',
  },
  {
    id: 'bytedance/sdxl-lightning-4step',
    label: 'SDXL Lightning 4-Step',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.003,
    maxOutputs: 4,
    supportsNegativePrompt: false,
    supportsSeed: true,
    replicateVersion: '6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe',
  },
  {
    id: 'luma/photon-flash',
    label: 'Luma Photon Flash',
    provider: 'replicate',
    category: 'image',
    costPerImage: 0.01,
    maxOutputs: 4,
    supportsNegativePrompt: false,
    supportsSeed: true,
    replicateVersion: '8cee7d47f81d8f4f77c1aec44ffb3d1ce09d36388db637ceaa8a6cbcf30b63e1',
  },

  // OpenAI
  {
    id: 'dall-e-3',
    label: 'DALL-E 3',
    provider: 'openai',
    category: 'image',
    costPerImage: 0.04,
    maxOutputs: 1,
    supportsNegativePrompt: false,
    supportsSeed: false,
  },
  {
    id: 'dall-e-2',
    label: 'DALL-E 2',
    provider: 'openai',
    category: 'image',
    costPerImage: 0.02,
    maxOutputs: 4,
    supportsNegativePrompt: false,
    supportsSeed: false,
  },
];

export interface MultiGenerationResult {
  images: string[];
  provider: ProviderId;
  model: string;
  cost: number;
  width: number;
  height: number;
  seed: number;
  generationTimeMs: number;
}

export const executeMultiProviderGeneration = async (
  params: ImageParams,
  options?: {
    signal?: AbortSignal;
    onProgress?: (stats: PollingStats) => void;
  }
): Promise<MultiGenerationResult> => {
  const startTime = Date.now();
  const {
    prompt,
    provider,
    model,
    aspectRatio,
    width,
    height,
    numOutputs = 1,
    seed = Math.floor(Math.random() * 999999),
    negativePrompt = '',
  } = params;

  const count = Math.max(1, Math.min(4, numOutputs));
  const modelDef = MODELS.find((m) => m.id === model) || MODELS[0];
  const unitCost = modelDef.costPerImage || 0.003;
  const totalCost = unitCost * count;

  const emitProgress = (progress: number, stage: string, message: string) => {
    if (options?.onProgress) {
      options.onProgress({
        pollCount: Math.round(progress / 25) + 1,
        elapsedSeconds: (Date.now() - startTime) / 1000,
        estimatedProgress: progress,
        stage,
        message,
      });
    }
  };

  emitProgress(10, 'INITIALIZE', `[${provider.toUpperCase()}] Preparing tensor pipeline for ${model}...`);

  // --- GOOGLE PROVIDER ---
  if (provider === 'google') {
    const key = getKey('GEMINI_API_KEY');
    if (key) {
      const callStart = Date.now();
      try {
        const ai = new GoogleGenAI({ apiKey: key });

        if (model.includes('imagen-4')) {
          emitProgress(30, 'DIFFUSION', 'Imagen 4.0 dispatching latent diffusion batch...');
          const googleRatio =
            aspectRatio === '2:3' || aspectRatio === '3:2' || aspectRatio === '21:9'
              ? '16:9'
              : aspectRatio;

          const requestPayload = {
            model: 'imagen-4.0-generate-001',
            prompt: negativePrompt ? `${prompt} --no ${negativePrompt}` : prompt,
            numberOfImages: count,
            outputMimeType: 'image/jpeg',
            aspectRatio: googleRatio,
          };

          debugLogger.logRequest(
            'google',
            'imagen-4.0-generate-001',
            'SDK_CALL',
            requestPayload,
            `[GOOGLE] imagen-4.0-generate-001 -> Generating ${count} image(s) [${googleRatio}]`
          );

          const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: negativePrompt ? `${prompt} --no ${negativePrompt}` : prompt,
            config: {
              numberOfImages: count,
              outputMimeType: 'image/jpeg',
              aspectRatio: googleRatio as any,
            },
          });

          const generatedImages = (response.generatedImages || []).map(
            (img) => `data:image/jpeg;base64,${img.image.imageBytes}`
          );

          if (generatedImages.length > 0) {
            const duration = Date.now() - callStart;
            debugLogger.logResponse(
              'google',
              'imagen-4.0-generate-001',
              200,
              duration,
              { count: generatedImages.length, mimeType: 'image/jpeg', aspectRatio: googleRatio },
              `[GOOGLE] Imagen 4.0 returned ${generatedImages.length} image(s)`
            );
            emitProgress(100, 'COMPLETED', `Imagen 4.0 synthesized ${generatedImages.length} image(s)`);
            return {
              images: generatedImages,
              provider,
              model,
              cost: totalCost,
              width,
              height,
              seed,
              generationTimeMs: Date.now() - startTime,
            };
          } else {
            throw new Error(`[GOOGLE ERROR] Imagen API returned empty results.`);
          }
        } else {
          // Gemini 2.5 Flash / Nano Banana
          emitProgress(40, 'SYNTHESIS', 'Gemini 2.5 multimodal image synthesis active...');
          const results: string[] = [];

          debugLogger.logRequest(
            'google',
            'gemini-2.5-flash-image',
            'SDK_CALL',
            { prompt, count, model: 'gemini-2.5-flash-image' },
            `[GOOGLE] gemini-2.5-flash-image -> Generating ${count} variation(s)`
          );

          for (let i = 0; i < count; i++) {
            if (options?.signal?.aborted) throw new Error('Generation aborted by user');
            const response = await ai.models.generateContent({
              model,
              contents: {
                parts: [{ text: count > 1 ? `${prompt} (variation ${i + 1})` : prompt }],
              },
            });

            for (const candidate of response.candidates || []) {
              for (const part of candidate.content?.parts || []) {
                if (part.inlineData) {
                  results.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                  break;
                }
              }
            }
          }

          if (results.length > 0) {
            const duration = Date.now() - callStart;
            debugLogger.logResponse(
              'google',
              'gemini-2.5-flash-image',
              200,
              duration,
              { count: results.length },
              `[GOOGLE] Gemini 2.5 Flash delivered ${results.length} image(s)`
            );
            emitProgress(100, 'COMPLETED', `Gemini 2.5 generated ${results.length} image(s)`);
            return {
              images: results,
              provider,
              model,
              cost: 0,
              width,
              height,
              seed,
              generationTimeMs: Date.now() - startTime,
            };
          } else {
            throw new Error(`[GOOGLE ERROR] Gemini multimodal synthesis returned empty results.`);
          }
        }
      } catch (err: any) {
        console.warn('Google direct API call error:', err);
        debugLogger.logError(
          'google',
          model,
          err,
          Date.now() - callStart,
          { prompt, model, count }
        );
        throw new Error(`[GOOGLE ERROR] Połączenie nieudane: ${err.message || 'Błąd autoryzacji lub sieci.'}`);
      }
    } else {
      debugLogger.logWarning('google', `No GEMINI_API_KEY found in key storage; fallback to procedural preview`);
      throw new Error(`[GOOGLE ERROR] Brak klucza GEMINI_API_KEY w ustawieniach lub pliku .env.local.`);
    }
  }

  // --- FAL.AI PROVIDER ---
  if (provider === 'fal') {
    const key = getKey('FAL_KEY');
    if (key) {
      const callStart = Date.now();
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const endpoint = isLocalhost ? `/api-fal/${model}` : `https://fal.run/${model}`;
      const payload = {
        prompt,
        image_size: { width, height },
        num_images: count,
        seed: seed || undefined,
        negative_prompt: negativePrompt || undefined,
      };

      try {
        emitProgress(35, 'FAL_DISPATCH', `Calling fal.ai gateway [${model}]...`);
        debugLogger.logRequest('fal', endpoint, 'POST', payload, `[FAL.AI] POST ${model} (${width}x${height}, count: ${count})`);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Key ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: options?.signal,
        });

        const duration = Date.now() - callStart;

        if (res.ok) {
          const data = await res.json();
          debugLogger.logResponse('fal', endpoint, res.status, duration, {
            imageCount: data.images?.length || 0,
            seed: data.seed,
            timings: data.timings,
          }, `[FAL.AI] Response 200 OK (${data.images?.length || 0} images)`);

          const imageUrls = (data.images || []).map((i: any) => i.url);
          if (imageUrls.length > 0) {
            emitProgress(80, 'BUFFER_CONVERT', 'Fetching image blobs from fal.ai...');
            const base64List = await Promise.all(
              imageUrls.map(async (url: string) => {
                const b = await fetch(url).then((r) => r.blob());
                return new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(b);
                });
              })
            );

            emitProgress(100, 'COMPLETED', `fal.ai delivered ${base64List.length} image(s)`);
            return {
              images: base64List,
              provider,
              model,
              cost: totalCost,
              width,
              height,
              seed,
              generationTimeMs: Date.now() - startTime,
            };
          } else {
            throw new Error(`[FAL.AI ERROR] Serwer fal.ai nie zwrócił adresów URL obrazów.`);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn('fal.ai error:', errData);
          debugLogger.logError('fal', endpoint, {
            status: res.status,
            statusText: res.statusText,
            response: errData,
            message: `HTTP ${res.status} ${res.statusText} - ${errData.detail || errData.message || 'fal.ai error'}`,
          }, duration, payload);
          
          if (res.status === 401 || res.status === 403) {
            throw new Error("API_KEY_ERROR: Klucz FAL_KEY w .env.local lub ustawieniach jest nieprawidłowy.");
          } else if (res.status === 402) {
            throw new Error("QUOTA_ERROR: Brak środków/funduszy na koncie fal.ai.");
          } else {
            throw new Error(`[FAL.AI ERROR ${res.status}] ${errData.detail || errData.message || res.statusText || 'Błędne ustawienia lub problem z serwisem.'}`);
          }
        }
      } catch (err: any) {
        console.warn('fal.ai fetch error:', err);
        debugLogger.logError('fal', endpoint, err, Date.now() - callStart, payload);
        throw err;
      }
    } else {
      debugLogger.logWarning('fal', `No FAL_KEY configured in key drawer; fallback to procedural preview`);
      throw new Error("API_KEY_MISSING: Brak klucza FAL_KEY w ustawieniach lub pliku .env.local.");
    }
  }

  // --- REPLICATE PROVIDER ---
  if (provider === 'replicate') {
    const key = getKey('REPLICATE_API_TOKEN');
    if (key) {
      const callStart = Date.now();
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const replicateVersion = modelDef.replicateVersion;
      // Community models need POST /v1/predictions with a pinned version.
      // Official models (no replicateVersion) use POST /v1/models/{slug}/predictions.
      const endpoint = isLocalhost
        ? (replicateVersion
            ? `/api-replicate/v1/predictions`
            : `/api-replicate/v1/models/${model}/predictions`)
        : (replicateVersion
            ? `https://api.replicate.com/v1/predictions`
            : `https://api.replicate.com/v1/models/${model}/predictions`);
      const inputPayload = {
        prompt,
        width,
        height,
        num_outputs: count,
        seed: seed || undefined,
        negative_prompt: negativePrompt || undefined,
      };

      try {
        emitProgress(25, 'REPLICATE_QUEUED', `Submitting prediction to Replicate [${model}]...`);
        debugLogger.logRequest('replicate', endpoint, 'POST', { input: inputPayload }, `[REPLICATE] Queuing prediction for ${model}`);

        const createBody = replicateVersion
          ? { version: replicateVersion, input: inputPayload }
          : { input: inputPayload };

        const createRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createBody),
          signal: options?.signal,
        });

        if (createRes.ok) {
          let prediction = await createRes.json();
          let pollAttempts = 0;
          debugLogger.logInfo('replicate', `[REPLICATE] Prediction created (ID: ${prediction.id}, status: ${prediction.status})`, { predictionId: prediction.id });

          while (
            prediction.status !== 'succeeded' &&
            prediction.status !== 'failed' &&
            prediction.status !== 'canceled'
          ) {
            if (options?.signal?.aborted) throw new Error('Generation aborted');
            pollAttempts++;
            await new Promise((r) => setTimeout(r, 1500));
            emitProgress(
              Math.min(90, 30 + pollAttempts * 10),
              'REPLICATE_POLLING',
              `Replicate status: ${prediction.status} (cycle #${pollAttempts})...`
            );

            const pollUrl = isLocalhost 
              ? prediction.urls.get.replace('https://api.replicate.com', '/api-replicate')
              : prediction.urls.get;
            const pollRes = await fetch(pollUrl, {
              headers: { Authorization: `Bearer ${key}` },
            });
            if (pollRes.ok) {
              prediction = await pollRes.json();
            }
          }

          const duration = Date.now() - callStart;

          if (prediction.status === 'succeeded' && prediction.output) {
            debugLogger.logResponse('replicate', prediction.urls.get || endpoint, 200, duration, {
              predictionId: prediction.id,
              pollCycles: pollAttempts,
              metrics: prediction.metrics,
            }, `[REPLICATE] Succeeded in ${pollAttempts} polls (${duration}ms)`);

            const rawUrls = Array.isArray(prediction.output)
              ? prediction.output
              : [prediction.output];

            const images = await Promise.all(
              rawUrls.map(async (u: string) => {
                const b = await fetch(u).then((r) => r.blob());
                return new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(b);
                });
              })
            );

            emitProgress(100, 'COMPLETED', `Replicate delivered ${images.length} image(s)`);
            return {
              images,
              provider,
              model,
              cost: totalCost,
              width,
              height,
              seed,
              generationTimeMs: Date.now() - startTime,
            };
          } else {
            debugLogger.logError('replicate', endpoint, {
              status: prediction.status,
              message: prediction.error || `Prediction ended with status ${prediction.status}`,
              prediction,
            }, duration, inputPayload);
            throw new Error(`[REPLICATE ERROR] Generowanie nie powiodło się: ${prediction.error || 'Status: ' + prediction.status}`);
          }
        } else {
          const errData = await createRes.json().catch(() => ({}));
          debugLogger.logError('replicate', endpoint, {
            status: createRes.status,
            statusText: createRes.statusText,
            response: errData,
            message: `HTTP ${createRes.status} ${createRes.statusText} - ${errData.detail || 'Replicate error'}`,
          }, Date.now() - callStart, inputPayload);
          
          if (createRes.status === 401 || createRes.status === 403) {
            throw new Error("API_KEY_ERROR: Klucz REPLICATE_API_TOKEN w .env.local lub ustawieniach jest nieprawidłowy.");
          } else if (createRes.status === 402) {
            throw new Error("QUOTA_ERROR: Brak środków/funduszy lub przekroczony limit na koncie Replicate.");
          } else {
            throw new Error(`[REPLICATE ERROR ${createRes.status}] ${errData.detail || errData.message || createRes.statusText || 'Błąd konfiguracji lub serwisu.'}`);
          }
        }
      } catch (err: any) {
        console.warn('Replicate API error:', err);
        debugLogger.logError('replicate', endpoint, err, Date.now() - callStart, inputPayload);
        throw err;
      }
    } else {
      debugLogger.logWarning('replicate', `No REPLICATE_API_TOKEN found; fallback to procedural preview`);
      throw new Error("API_KEY_MISSING: Brak klucza REPLICATE_API_TOKEN w ustawieniach lub pliku .env.local.");
    }
  }

  // --- OPENAI PROVIDER ---
  if (provider === 'openai') {
    const key = getKey('OPENAI_API_KEY');
    if (key) {
      const callStart = Date.now();
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const endpoint = isLocalhost 
        ? '/api-openai/v1/images/generations' 
        : 'https://api.openai.com/v1/images/generations';
      const openaiSize =
        width >= 1024 && height >= 1024
          ? '1024x1024'
          : width > height
          ? '1792x1024'
          : '1024x1792';

      const payload = {
        model,
        prompt,
        n: Math.min(model === 'dall-e-3' ? 1 : 4, count),
        size: openaiSize,
        response_format: 'b64_json',
      };

      try {
        emitProgress(35, 'OPENAI_DISPATCH', `Calling OpenAI ${model}...`);
        debugLogger.logRequest('openai', endpoint, 'POST', payload, `[OPENAI] POST ${model} (${openaiSize}, n: ${payload.n})`);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: options?.signal,
        });

        const duration = Date.now() - callStart;

        if (res.ok) {
          const data = await res.json();
          debugLogger.logResponse('openai', endpoint, res.status, duration, {
            created: data.created,
            imageCount: data.data?.length || 0,
          }, `[OPENAI] DALL-E generated ${data.data?.length || 0} image(s)`);

          const images = (data.data || []).map(
            (item: any) => `data:image/png;base64,${item.b64_json}`
          );

          if (images.length > 0) {
            emitProgress(100, 'COMPLETED', `OpenAI delivered ${images.length} image(s)`);
            return {
              images,
              provider,
              model,
              cost: totalCost,
              width,
              height,
              seed,
              generationTimeMs: Date.now() - startTime,
            };
          } else {
            throw new Error(`[OPENAI ERROR] Serwer OpenAI nie zwrócił żadnych danych obrazów.`);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn('OpenAI error:', errData);
          debugLogger.logError('openai', endpoint, {
            status: res.status,
            statusText: res.statusText,
            response: errData,
            message: `HTTP ${res.status} ${res.statusText} - ${errData.error?.message || 'OpenAI error'}`,
          }, duration, payload);
          
          if (res.status === 401 || res.status === 403) {
            throw new Error("API_KEY_ERROR: Klucz OPENAI_API_KEY w .env.local lub ustawieniach jest nieprawidłowy.");
          } else if (res.status === 429 || res.status === 402) {
            throw new Error("QUOTA_ERROR: Przekroczony limit zapytań (Rate Limit) lub brak środków na koncie OpenAI.");
          } else {
            throw new Error(`[OPENAI ERROR ${res.status}] ${errData.error?.message || res.statusText || 'Błąd usługi OpenAI.'}`);
          }
        }
      } catch (err: any) {
        console.warn('OpenAI error:', err);
        debugLogger.logError('openai', endpoint, err, Date.now() - callStart, payload);
        throw err;
      }
    } else {
      debugLogger.logWarning('openai', `No OPENAI_API_KEY found; fallback to procedural preview`);
      throw new Error("API_KEY_MISSING: Brak klucza OPENAI_API_KEY w ustawieniach lub pliku .env.local.");
    }
  }

  // --- PROCEDURAL FALLBACK DISABLED ---
  throw new Error(`BŁĄD GENEROWANIA: Nie udało się wygenerować obrazu u dostawcy ${provider.toUpperCase()}. Sprawdź konsolę debugowania lub ustawienia.`);
};

export const HISTORY_STORAGE_KEY = 'bonzo-creative-studio-history';

export const loadGenerationHistory = (): HistoryItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY) || localStorage.getItem('bonzo-studio-history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveToGenerationHistory = (item: HistoryItem): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadGenerationHistory();
    const updated = [item, ...existing.filter((h) => h.id !== item.id)].slice(0, 20);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('bonzo-history-updated'));
  } catch (err) {
    console.warn('Failed to save history item:', err);
  }
};

export const deleteHistoryItem = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadGenerationHistory();
    const updated = existing.filter((h) => h.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('bonzo-history-updated'));
  } catch (err) {
    console.warn('Failed to delete history item:', err);
  }
};

export const clearGenerationHistory = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    localStorage.removeItem('bonzo-studio-history');
    window.dispatchEvent(new Event('bonzo-history-updated'));
  } catch (err) {
    console.warn('Failed to clear history:', err);
  }
};
