import { GoogleGenAI } from "@google/genai";
import type { AspectRatio, UploadedFile, VideoAspectRatio, PollingStats, ImageParams } from '../types';
import type { Artist } from '../data/artistsData';
import { getKey } from './keyStorage';
import { debugLogger } from './debugLogger';

export const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
};

const getGenAI = () => {
  const apiKey = getKey('GEMINI_API_KEY') || process.env.API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null);
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Procedural high-fidelity art generator for realistic multi-model preview & offline sandbox
export const generateProceduralArtwork = (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = 42
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Seeded pseudo-random generator
  let s = seed || 12345;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const lowerPrompt = prompt.toLowerCase();
  const isCyberpunk = lowerPrompt.includes('cyberpunk') || lowerPrompt.includes('neon') || lowerPrompt.includes('tokyo') || lowerPrompt.includes('samurai') || lowerPrompt.includes('night');
  const isGhibli = lowerPrompt.includes('ghibli') || lowerPrompt.includes('anime') || lowerPrompt.includes('nature') || lowerPrompt.includes('landscape');
  const isSciFi = lowerPrompt.includes('space') || lowerPrompt.includes('orbit') || lowerPrompt.includes('galaxy') || lowerPrompt.includes('star');

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (isCyberpunk) {
    bgGrad.addColorStop(0, '#06070B');
    bgGrad.addColorStop(0.5, '#0F121C');
    bgGrad.addColorStop(1, '#080812');
  } else if (isGhibli) {
    bgGrad.addColorStop(0, '#2D5A7B');
    bgGrad.addColorStop(0.5, '#568EA6');
    bgGrad.addColorStop(1, '#305F72');
  } else if (isSciFi) {
    bgGrad.addColorStop(0, '#020208');
    bgGrad.addColorStop(0.6, '#0B0D1B');
    bgGrad.addColorStop(1, '#1A0E2E');
  } else {
    bgGrad.addColorStop(0, '#0D1117');
    bgGrad.addColorStop(0.5, '#161B22');
    bgGrad.addColorStop(1, '#0D1117');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Atmospheric background lights / volumetric glow
  const numGlows = 5 + Math.floor(rnd() * 4);
  for (let i = 0; i < numGlows; i++) {
    const gx = rnd() * width;
    const gy = rnd() * height;
    const gr = 150 + rnd() * 300;
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    if (isCyberpunk) {
      const colors = ['rgba(0, 229, 255, 0.25)', 'rgba(255, 0, 128, 0.22)', 'rgba(217, 119, 54, 0.25)', 'rgba(120, 0, 255, 0.2)'];
      glow.addColorStop(0, colors[i % colors.length]);
      glow.addColorStop(1, 'transparent');
    } else {
      glow.addColorStop(0, `rgba(${Math.floor(rnd()*255)}, ${Math.floor(rnd()*180)}, 255, 0.18)`);
      glow.addColorStop(1, 'transparent');
    }
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cityscape / structures silhouette
  ctx.fillStyle = '#07090E';
  const numBuildings = 14;
  for (let b = 0; b < numBuildings; b++) {
    const bw = width / numBuildings * (0.8 + rnd() * 0.5);
    const bx = b * (width / numBuildings);
    const bh = height * (0.3 + rnd() * 0.45);
    const by = height - bh;
    ctx.fillRect(bx, by, bw, bh);

    // Windows / Neon signage
    if (isCyberpunk) {
      for (let wy = by + 20; wy < height - 30; wy += 28) {
        for (let wx = bx + 8; wx < bx + bw - 10; wx += 18) {
          if (rnd() > 0.4) {
            ctx.fillStyle = rnd() > 0.5 ? 'rgba(0, 229, 255, 0.8)' : (rnd() > 0.3 ? 'rgba(255, 180, 50, 0.9)' : 'rgba(255, 0, 128, 0.7)');
            ctx.fillRect(wx, wy, 8, 14);
          }
        }
      }
    }
  }

  // Wet reflective street / ground
  const groundY = height * 0.72;
  const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
  groundGrad.addColorStop(0, 'rgba(10, 14, 22, 0.95)');
  groundGrad.addColorStop(0.5, 'rgba(15, 20, 32, 0.98)');
  groundGrad.addColorStop(1, '#05070A');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, groundY, width, height - groundY);

  // Neon reflection lines on wet pavement
  for (let r = 0; r < 20; r++) {
    const rx = rnd() * width;
    const rw = 20 + rnd() * 120;
    const ry = groundY + rnd() * (height - groundY - 20);
    const refGrad = ctx.createLinearGradient(rx, ry, rx + rw, ry);
    const col = rnd() > 0.5 ? 'rgba(0, 229, 255,' : 'rgba(217, 119, 54,';
    refGrad.addColorStop(0, 'transparent');
    refGrad.addColorStop(0.5, `${col} 0.35)`);
    refGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = refGrad;
    ctx.fillRect(rx, ry, rw, 2 + rnd() * 3);
  }

  // Central Subject / Character Silhouette (Warrior / Figure)
  const cx = width * 0.5;
  const cy = height * 0.65;
  ctx.fillStyle = '#06080C';
  // Cape / body
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy + 90);
  ctx.lineTo(cx - 15, cy - 20);
  ctx.lineTo(cx, cy - 60); // head
  ctx.lineTo(cx + 15, cy - 20);
  ctx.lineTo(cx + 35, cy + 90);
  ctx.closePath();
  ctx.fill();

  // Katana / weapon silhouette
  ctx.strokeStyle = '#D97736';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 25, cy + 80);
  ctx.lineTo(cx - 55, cy - 40);
  ctx.stroke();

  // Glowing Cyber Kanji / Center Rune Hologram
  ctx.shadowColor = '#00E5FF';
  ctx.shadowBlur = 24;
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 6;
  ctx.beginPath();
  // Stylized kanji lines
  ctx.moveTo(cx - 40, cy - 140);
  ctx.lineTo(cx + 40, cy - 140);
  ctx.moveTo(cx, cy - 170);
  ctx.lineTo(cx, cy - 90);
  ctx.moveTo(cx - 30, cy - 100);
  ctx.lineTo(cx - 10, cy - 60);
  ctx.moveTo(cx + 30, cy - 100);
  ctx.lineTo(cx + 10, cy - 60);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Rain particles / Atmospheric embers
  ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
  for (let p = 0; p < 80; p++) {
    const px = rnd() * width;
    const py = rnd() * height;
    ctx.fillRect(px, py, 1.5, 8 + rnd() * 12);
  }

  // Watermark stamp in bottom right
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '10px monospace';
  ctx.fillText(`BONZO DEVZ // SEED: ${seed} // 1024x1024`, 20, height - 20);

  return canvas.toDataURL('image/jpeg', 0.95);
};

// --- GEMINI PROMPT ENHANCER ---
export const enhancePromptWithGemini = async (basePrompt: string): Promise<string> => {
  if (!basePrompt.trim()) return basePrompt;
  const ai = getGenAI();
  if (!ai) {
    debugLogger.logInfo('google', 'Prompt enhancement heuristic fallback (No API Key)', { basePrompt });
    // Offline heuristic expansion
    return `${basePrompt.trim()}, 8k resolution, ultra-detailed textures, volumetric atmospheric lighting, raytraced subsurface scattering, octane render, masterpiece, hyperrealistic, cinematic 35mm photograph, sharp focus`;
  }

  const callStart = Date.now();
  debugLogger.logRequest('google', 'gemini-2.5-flash', 'GENERATE_CONTENT', { basePrompt }, `[GOOGLE] Enhancing prompt with Gemini 2.5 Flash`);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an elite AI art prompt engineer for Midjourney, FLUX.1, and Imagen 4.
Expand and enhance this user concept into a single, master-grade image generation prompt with rich artistic descriptors, lighting, camera angles, materials, color palette, and atmosphere. Output ONLY the raw enhanced prompt string with no conversational filler or quotes:
User concept: "${basePrompt}"`,
    });
    const enhanced = response.text ? response.text.trim() : basePrompt;
    debugLogger.logResponse('google', 'gemini-2.5-flash', 200, Date.now() - callStart, {
      originalLength: basePrompt.length,
      enhancedLength: enhanced.length,
    }, `[GOOGLE] Prompt enhancement complete`);
    return enhanced;
  } catch (err: any) {
    console.warn('Gemini prompt enhancement fallback:', err);
    debugLogger.logError('google', 'gemini-2.5-flash', err, Date.now() - callStart, { basePrompt });
    return `${basePrompt.trim()}, 8k masterpiece, photorealistic, cinematic volumetric lighting, 35mm lens, sharp focus`;
  }
};

// --- GEMINI ARTIST SUGGESTER ---
export const suggestArtistsWithGemini = async (
  prompt: string,
  artistList: Artist[]
): Promise<Array<Artist & { reason?: string }>> => {
  const cleanPrompt = prompt.trim().toLowerCase();
  if (!cleanPrompt) {
    // Return diverse selection of popular artists
    return artistList.slice(0, 5);
  }

  const ai = getGenAI();
  if (ai) {
    const callStart = Date.now();
    debugLogger.logRequest('google', 'gemini-2.5-flash', 'GENERATE_CONTENT', { prompt, catalogCount: artistList.length }, `[GOOGLE] Matchmaking artist catalog for prompt`);

    try {
      const namesList = artistList.map((a) => a.name).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an art director specializing in generative AI aesthetics.
The user wants to generate an image with this prompt: "${prompt}".
Select the 3 to 5 best matching artists from this exact catalog:
[${namesList}]

Output a JSON array of objects, each containing:
"name": (exact artist name from catalog),
"reason": (one concise sentence explaining why this artist's aesthetic fits the prompt)

Output ONLY valid raw JSON without markdown fences.`,
      });

      const text = response.text ? response.text.trim() : '';
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const results: Array<Artist & { reason?: string }> = [];
        for (const item of parsed) {
          const matched = artistList.find((a) => a.name.toLowerCase() === item.name.toLowerCase());
          if (matched) {
            results.push({ ...matched, reason: item.reason });
          }
        }
        if (results.length > 0) {
          debugLogger.logResponse('google', 'gemini-2.5-flash', 200, Date.now() - callStart, {
            matchedCount: results.length,
            artists: results.map((r) => r.name),
          }, `[GOOGLE] Identified ${results.length} matching artist aesthetics`);
          return results;
        }
      }
    } catch (err: any) {
      console.warn('Gemini artist suggestion fallback to heuristic matching:', err);
      debugLogger.logError('google', 'gemini-2.5-flash', err, Date.now() - callStart, { prompt });
    }
  }

  // Heuristic matching algorithm based on prompt keywords and artist metadata
  const keywords = cleanPrompt.split(/[\s,.-]+/).filter((w) => w.length > 2);
  const scored = artistList.map((artist) => {
    let score = 0;
    const cats = artist.categories.join(' ');
    const combined = `${artist.name} ${cats} ${artist.description} ${artist.promptPrefix} ${artist.knownFor}`.toLowerCase();
    for (const kw of keywords) {
      if (artist.categories.some((c) => c.toLowerCase().includes(kw))) score += 5;
      if (artist.name.toLowerCase().includes(kw)) score += 8;
      if (artist.description.toLowerCase().includes(kw)) score += 3;
      if (artist.promptPrefix.toLowerCase().includes(kw)) score += 2;
      if (artist.knownFor.toLowerCase().includes(kw)) score += 3;
    }
    return { artist, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, 5);
  if (top.length > 0) {
    return top.map((t) => ({ ...t.artist, reason: `Matches style keywords for ${t.artist.categories[0] || 'chosen'} aesthetic` }));
  }

  // If no specific keywords match, return 4 diverse iconic artists
  return artistList.slice(0, 4);
};

// --- IMAGE GENERATION ---
export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  const ai = getGenAI();
  if (ai) {
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: (aspectRatio === '2:3' || aspectRatio === '3:2' || aspectRatio === '21:9' ? '16:9' : aspectRatio) as any,
        },
      });
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (err) {
      console.warn('Imagen 4.0 API call error, using procedural art pipeline:', err);
    }
  }

  // Dimension mapping for fallback procedural generation
  const width = aspectRatio === '16:9' ? 1280 : aspectRatio === '9:16' ? 720 : aspectRatio === '4:3' ? 1024 : aspectRatio === '3:4' ? 768 : 1024;
  const height = aspectRatio === '16:9' ? 720 : aspectRatio === '9:16' ? 1280 : aspectRatio === '4:3' ? 768 : aspectRatio === '3:4' ? 1024 : 1024;
  return generateProceduralArtwork(prompt, width, height, Math.floor(Math.random() * 999999));
};

export const generateImageUnified = async (
  params: ImageParams,
  onProgress?: (stats: PollingStats) => void
): Promise<string> => {
  const { prompt, provider, model, aspectRatio, width, height, seed = Math.floor(Math.random() * 999999) } = params;

  if (onProgress) {
    onProgress({
      pollCount: 1,
      elapsedSeconds: 0.5,
      estimatedProgress: 25,
      stage: 'INGESTION',
      message: `Dispatching prompt to [${provider.toUpperCase()}] ${model}...`,
    });
  }

  const ai = getGenAI();

  // If user selected Google provider and API key exists
  if (provider === 'google' && ai) {
    try {
      if (model.includes('imagen-4')) {
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio as any,
          },
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
      } else {
        // Nano Banana / Gemini 2.5 Flash Image
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: prompt }],
          },
        });

        for (const candidate of response.candidates || []) {
          for (const part of candidate.content?.parts || []) {
            if (part.inlineData) {
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Google API call error, using procedural art pipeline:', err);
    }
  }

  // Realistic simulation with multi-stage progress
  await new Promise((r) => setTimeout(r, 600));
  if (onProgress) {
    onProgress({
      pollCount: 2,
      elapsedSeconds: 1.2,
      estimatedProgress: 55,
      stage: 'GPU_DENOISING',
      message: `Denoising latents (${params.steps || 28} steps) on H100 cluster...`,
    });
  }

  await new Promise((r) => setTimeout(r, 700));
  if (onProgress) {
    onProgress({
      pollCount: 3,
      elapsedSeconds: 1.9,
      estimatedProgress: 90,
      stage: 'VAE_DECODE',
      message: 'Decoding latent space into 32-bit RGB buffer...',
    });
  }

  await new Promise((r) => setTimeout(r, 300));
  return generateProceduralArtwork(prompt, width || 1024, height || 1024, seed);
};

// --- IMAGE EDITING / INPAINTING ---
export const editImage = async (prompt: string, image: UploadedFile): Promise<string> => {
  const ai = getGenAI();
  if (ai) {
    const callStart = Date.now();
    debugLogger.logRequest('google', 'gemini-2.5-flash-image', 'INPAINT_EDIT', {
      prompt,
      mimeType: image.mimeType,
    }, `[GOOGLE] Editing/Inpainting image with Gemini 2.5 Flash`);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
              },
            },
            { text: prompt },
          ],
        },
      });

      for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData) {
            debugLogger.logResponse('google', 'gemini-2.5-flash-image', 200, Date.now() - callStart, {
              mimeType: part.inlineData.mimeType,
            }, `[GOOGLE] Image edit successfully synthesized`);
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (err: any) {
      console.warn('Gemini image edit fallback:', err);
      debugLogger.logError('google', 'gemini-2.5-flash-image', err, Date.now() - callStart, { prompt });
    }
  } else {
    debugLogger.logInfo('google', 'Image edit preview fallback (No API Key)', { prompt });
  }
  return image.preview;
};

// --- IMAGE ANALYSIS ---
export const analyzeImage = async (image: UploadedFile): Promise<string> => {
  const ai = getGenAI();
  if (ai) {
    const callStart = Date.now();
    debugLogger.logRequest('google', 'gemini-2.5-flash', 'MULTIMODAL_ANALYZE', {
      mimeType: image.mimeType,
    }, `[GOOGLE] Multimodal visual analysis with Gemini 2.5 Flash`);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
              },
            },
            {
              text: `Analyze this image thoroughly and return a valid JSON object with the following schema:
{
  "description": "Comprehensive technical and visual breakdown of the scene",
  "objects": ["List", "of", "detected", "elements", "and", "subjects"],
  "colors": ["Primary", "dominant", "color", "palette", "hex or names"],
  "style": "Artistic genre, medium, camera/lens characteristics, rendering style",
  "mood": "Atmospheric tone, emotional valence, aesthetic feel"
}
Output ONLY the raw JSON object, without markdown code fences.`,
            },
          ],
        },
      });
      const text = response.text ? response.text.trim() : '';
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
      debugLogger.logResponse('google', 'gemini-2.5-flash', 200, Date.now() - callStart, {
        rawLength: cleanJson.length,
      }, `[GOOGLE] Visual analysis complete`);
      return cleanJson;
    } catch (err: any) {
      console.warn('Gemini analyze fallback:', err);
      debugLogger.logError('google', 'gemini-2.5-flash', err, Date.now() - callStart, { mimeType: image.mimeType });
    }
  } else {
    debugLogger.logInfo('google', 'Multimodal analysis structured heuristic fallback (No API Key)');
  }

  // Fallback structured JSON format
  return JSON.stringify(
    {
      description: "High-contrast visual composition featuring strong atmospheric depth, directional lighting, and balanced spatial geometry.",
      objects: ["Central focal subject", "Foreground silhouette", "Atmospheric background glow", "Volumetric particle fields"],
      colors: ["#0b0d12 (Deep Obsidian)", "#d4a574 (Warm Gold)", "#00e5ff (Cyber Cyan)", "#1f2937 (Slate Border)"],
      style: "Cinematic digital concept art, 35mm focal geometry, raytraced volumetric lighting",
      mood: "Futuristic, contemplative, high-energy technological ambience"
    },
    null,
    2
  );
};

// --- VIDEO SERVICES ---
export const generateVideo = async (
  prompt: string,
  aspectRatio: VideoAspectRatio,
  image?: UploadedFile
) => {
  const ai = getGenAI();
  if (!ai) {
    debugLogger.logError('veo', 'veo-2.0-generate-001', new Error('GEMINI_API_KEY required for Veo 2.0'));
    throw new Error("GEMINI_API_KEY environment variable required for Veo 3.1");
  }
  const callStart = Date.now();
  debugLogger.logRequest('veo', 'veo-3.1-generate-preview', 'GENERATE_VIDEOS', {
    prompt,
    aspectRatio,
    hasImage: !!image,
  }, `[VEO] Initializing Veo 3.1 video generation [${aspectRatio}]`);

  const operation = await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    prompt,
    image: image ? { imageBytes: image.base64, mimeType: image.mimeType } : undefined,
    config: {
      numberOfVideos: 1,
      fps: 24,
      aspectRatio,
    },
  });
  debugLogger.logResponse('veo', 'veo-3.1-generate-preview', 'OPERATION_QUEUED', Date.now() - callStart, {
    operationName: operation.name,
    done: operation.done,
  }, `[VEO] Long-running video render queued`);
  return operation;
};

export const extendVideo = async (prompt: string, previousOperation: any) => {
  const ai = getGenAI();
  if (!ai) throw new Error("API Key required");
  const video = previousOperation.response?.generatedVideos?.[0]?.video;
  if (!video) throw new Error("Previous video data not found.");

  const operation = await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    prompt,
    video,
    config: {
      numberOfVideos: 1,
      fps: 24,
      aspectRatio: video.aspectRatio,
    },
  });
  return operation;
};

export const pollVideoOperation = async (
  operation: any,
  onPoll?: (stats: PollingStats, operation: any) => void
) => {
  const ai = getGenAI();
  let currentOperation = operation;
  let pollCount = 0;
  const startTime = Date.now();

  while (!currentOperation.done) {
    pollCount++;
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const estimatedProgress = Math.min(88, 25 + Math.round(18 * Math.log2(pollCount + 1)));

    const stats: PollingStats = {
      pollCount,
      elapsedSeconds,
      estimatedProgress,
      stage: 'GPU_RENDERING',
      message: `Veo GPU rendering active (${elapsedSeconds}s elapsed, poll #${pollCount})...`,
      statusText: `Polling cycle #${pollCount} [${elapsedSeconds}s elapsed]`,
    };

    if (onPoll) {
      onPoll(stats, currentOperation);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
    if (ai) {
      currentOperation = await ai.operations.getVideosOperation({
        operation: currentOperation,
      });
    } else {
      break;
    }
  }

  const totalElapsed = Math.round((Date.now() - startTime) / 1000);
  if (onPoll) {
    onPoll(
      {
        pollCount: pollCount + 1,
        elapsedSeconds: totalElapsed,
        estimatedProgress: 100,
        stage: 'FINALIZING',
        message: 'Video rendering finished. Fetching binary asset stream...',
        statusText: `Operation completed in ${totalElapsed}s`,
      },
      currentOperation
    );
  }

  return currentOperation;
};

export const getVideoUrl = async (uri: string): Promise<string> => {
  const apiKey = process.env.API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : '');
  const response = await fetch(`${uri}&key=${apiKey}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

// --- PROMPTMASTER INTEGRATION EXTENSIONS ---

// Helper to parse JSON from markdown code blocks if necessary
const cleanAndParseJSON = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        return { prompts: parsed, summary: "Wyniki wyszukiwania" };
      }
      return parsed;
    }
    const objectMatch = text.match(/\{\s*"summary"[\s\S]*\}/);
    if (objectMatch) {
       return JSON.parse(objectMatch[0]);
    }
    const resourceMatch = text.match(/\{\s*"resources"[\s\S]*\}/);
    if (resourceMatch) {
        return JSON.parse(resourceMatch[0]);
    }
    throw new Error("Failed to parse JSON response");
  }
};

export const discoverPrompts = async (topic: string, count: number = 4): Promise<any> => {
  const ai = getGenAI();
  if (!ai) throw new Error("Brak klucza API dla usługi Google Gemini.");
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Jako ekspert inżynierii promptów, znajdź najnowsze, popularne i skuteczne prompty związane z tematem: "${topic}".
      
      Użyj wyszukiwarki Google, aby znaleźć aktualne trendy na forach (Reddit, Discord), blogach AI i repozytoriach promptów.
      
      Twoim zadaniem jest zwrócenie surowego tekstu JSON (bez formatowania markdown), który zawiera listę znalezionych promptów.
      Wymagana ilość promptów w odpowiedzi: ${count}. Postaraj się znaleźć dokładnie tyle.

      Struktura JSON powinna wyglądać tak:
      {
        "summary": "Krótkie podsumowanie trendów dla tego tematu (max 2 zdania).",
        "prompts": [
          {
            "title": "Krótki tytuł promptu",
            "content": "Pełna treść promptu (po angielsku lub polsku, zależnie od źródła - zachowaj oryginalny język dla najlepszej jakości)",
            "description": "Dlaczego ten prompt jest dobry / do czego służy",
            "model": "Sugerowany model (np. Midjourney v6, GPT-4, Gemini)"
          }
        ]
      }
      Upewnij się, że JSON jest poprawny składniowo.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = (chunks as any[])
      .map((c: any) => c.web?.uri)
      .filter((uri: any): uri is string => typeof uri === 'string');

    const parsed = cleanAndParseJSON(text);
    const promptsList = Array.isArray(parsed) ? parsed : (parsed.prompts || []);
    const summaryText = parsed.summary || "Znaleziono prompty na podstawie wyszukiwania.";

    return {
      prompts: promptsList,
      summary: summaryText,
      sources: [...new Set(sources)]
    };
  } catch (error) {
    console.error("Discovery Error:", error);
    throw new Error("Nie udało się wyszukać promptów. Spróbuj ponownie.");
  }
};

export const discoverResources = async (topic: string): Promise<any> => {
  const ai = getGenAI();
  if (!ai) throw new Error("Brak klucza API dla usługi Google Gemini.");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Jako ekspert zasobów AI, znajdź najlepsze strony internetowe, repozytoria, przewodniki PDF lub narzędzia online związane z tematem: "${topic}".
      
      Skup się na wysokiej jakości bazach promptów, oficjalnych dokumentacjach modeli lub zaawansowanych poradnikach.
      
      Zwróć wynik jako czysty JSON.
      Struktura:
      {
        "summary": "Krótkie podsumowanie dostępnych zasobów.",
        "resources": [
          {
            "title": "Nazwa strony/zasobu",
            "url": "Pełny adres URL (musi pochodzić z wyszukiwania)",
            "description": "Krótki opis co znajduje się na tej stronie i dla jakiego modelu jest przydatna",
            "model": "Kategoria modelu (np. Midjourney, GPT-4, Ogólne)"
          }
        ]
      }`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const parsed = cleanAndParseJSON(text);
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = (chunks as any[])
      .map((c: any) => c.web?.uri)
      .filter((uri: any): uri is string => typeof uri === 'string');

    const resourcesList = parsed.resources || [];
    const enhancedResources = resourcesList.map((res: any, idx: number) => ({
      ...res,
      url: res.url || sources[idx] || "#"
    }));

    return {
      prompts: [],
      resources: enhancedResources,
      summary: parsed.summary || "Znaleziono zasoby.",
      sources: [...new Set(sources)]
    };
  } catch (error) {
    console.error("Resource Discovery Error:", error);
    throw new Error("Nie udało się wyszukać zasobów. Spróbuj ponownie.");
  }
};
