import { write, file } from "bun";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

// Ensure root directories exist
const uploadDir = path.join(process.cwd(), "public", "img", "artists");
const projectsDir = path.join(process.cwd(), "data", "projects");
const outputDir = path.join(process.cwd(), "output");

[uploadDir, projectsDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

Bun.serve({
  port: 3219,
  async fetch(req) {
    const url = new URL(req.url);
    
    // CORS Preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const headers = { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
    };

    // --- UPLOAD ARTISTS ---
    if (req.method === "POST" && url.pathname === "/api/upload-artist") {
      try {
        const formData = await req.formData();
        const f = formData.get("file") as File;
        const artistId = formData.get("artistId") as string;
        
        if (!f || !artistId) return new Response("Missing payload", { status: 400 });

        const cleanId = artistId.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-');
        const ext = path.extname(f.name) || '.webp';
        const filename = `${cleanId}${ext}`;
        const filePath = path.join(uploadDir, filename);
        
        const buffer = await f.arrayBuffer();
        await write(filePath, buffer);
        console.log(`[UPLOAD] Saved artist artwork: ${filename}`);

        return new Response(JSON.stringify({ success: true, path: `/img/artists/${filename}` }), { headers });
      } catch (err) {
        console.error("[UPLOAD ERROR]", err);
        return new Response("Upload failed server-side", { status: 500 });
      }
    }

    // --- NLE PROJECTS SAVE ---
    if (req.method === "POST" && url.pathname === "/api/save-project") {
        try {
            const projectData = await req.json();
            const projectId = projectData.projectId || `project_${Date.now()}`;
            const filePath = path.join(projectsDir, `${projectId}.json`);
            
            await write(filePath, JSON.stringify(projectData, null, 2));
            console.log(`[NLE] Saved project: ${projectId}`);
            
            return new Response(JSON.stringify({ success: true, projectId }), { headers });
        } catch (err) {
            console.error("[SAVE ERROR]", err);
            return new Response("Failed to save project", { status: 500 });
        }
    }

    // --- NLE PROJECTS LOAD ---
    if (req.method === "GET" && url.pathname === "/api/load-projects") {
        try {
            const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.json'));
            const projects = files.map(filename => {
                const data = JSON.parse(fs.readFileSync(path.join(projectsDir, filename), 'utf-8'));
                return { id: filename.replace('.json', ''), name: data.name || filename, updatedAt: fs.statSync(path.join(projectsDir, filename)).mtime };
            });
            return new Response(JSON.stringify({ projects }), { headers });
        } catch (err) {
            return new Response("Failed to load projects", { status: 500 });
        }
    }

    // --- FFMPEG RENDER ENGINE ---
    if (req.method === "POST" && url.pathname === "/api/render-timeline") {
        try {
            const { timelineState } = await req.json();
            console.log("[NLE RENDER] Starting FFmpeg composition process...");
            
            const clips = timelineState.clips || [];
            if (clips.length === 0) return new Response(JSON.stringify({ error: "Empty timeline" }), { headers, status: 400 });

            // Sort clips by startTime for logical processing
            clips.sort((a: any, b: any) => a.startTime - b.startTime);

            let maxDuration = 0;
            clips.forEach((c: any) => {
                const end = c.startTime + c.duration;
                if (end > maxDuration) maxDuration = end;
            });

            // Base Canvas (Black background)
            const resolution = '1920x1080';
            const fps = 30;

            let filterComplex = `color=c=black:s=${resolution}:d=${maxDuration}:r=${fps}[bg];\n`;
            let inputArgs: string[] = [];
            let vLabels: string[] = [];
            let aLabels: string[] = [];
            
            let validIndex = 0;
            clips.forEach((clip: any) => {
                const absoluteClipPath = path.join(process.cwd(), "public", clip.source);
                if (!fs.existsSync(absoluteClipPath)) {
                   console.warn(`[FFMPEG WARN] File missing: ${absoluteClipPath}`);
                   return;
                }
                
                // Add to inputs
                inputArgs.push(`-i "${absoluteClipPath.replace(/\\/g, '/')}"`);
                const isAudioOnly = clip.source.endsWith('.mp3') || clip.source.endsWith('.wav');
                
                if (!isAudioOnly) {
                   // Video Trim & Scaling
                   filterComplex += `[${validIndex}:v]trim=duration=${clip.duration},setpts=PTS-STARTPTS+${clip.startTime}/TB,scale=${resolution}:force_original_aspect_ratio=decrease,pad=${resolution}:(ow-iw)/2:(oh-ih)/2[v${validIndex}];\n`;
                   vLabels.push(`[v${validIndex}]`);
                }
                
                // Audio delay & trim 
                filterComplex += `[${validIndex}:a]atrim=duration=${clip.duration},asetpts=PTS-STARTPTS,adelay=${clip.startTime * 1000}|${clip.startTime * 1000}[a${validIndex}];\n`;
                aLabels.push(`[a${validIndex}]`);
                
                validIndex++;
            });

            // Overlay all video streams over background base
            let lastOverlay = '[bg]';
            vLabels.forEach((vLabel, i) => {
                const outLabel = (i === vLabels.length - 1) ? '[vout]' : `[bg${i}]`;
                filterComplex += `${lastOverlay}${vLabel}overlay=enable='between(t,${clips[i].startTime},${clips[i].startTime + clips[i].duration})'${outLabel};\n`;
                lastOverlay = outLabel;
            });
            
            // Mix all audio streams
            if (aLabels.length > 0) {
                filterComplex += `${aLabels.join('')}amix=inputs=${aLabels.length}:duration=first:dropout_transition=2[aout];\n`;
            }

            const outRenderPath = path.join(outputDir, `render_final_${Date.now()}.mp4`);
            
            let mapArgs = vLabels.length > 0 ? `-map "[vout]"` : '';
            if (aLabels.length > 0) mapArgs += ` -map "[aout]"`;

            // Build Final Command
            const filterArg = (vLabels.length > 0 || aLabels.length > 0) ? `-filter_complex "${filterComplex}" ${mapArgs}` : '';
            const cmd = `ffmpeg -y ${inputArgs.join(' ')} ${filterArg} -c:v libx264 -c:a aac -shortest "${outRenderPath}"`;

            console.log("[FFMPEG COMPILING CMD]:", cmd);

            // Execute FFmpeg compilation in a detached shell
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[FFMPEG EXPORT ERROR]: ${error.message}`);
                } else {
                    console.log(`[FFMPEG] Successfully exported Timeline to: ${outRenderPath}`);
                }
            });
            
            // Return 'queued' status asynchronously so UI doesn't freeze
            return new Response(JSON.stringify({ success: true, status: 'rendering', outputQueue: outRenderPath }), { headers });
            
        } catch (err) {
            console.error("[NLE RENDER ERROR]", err);
            return new Response("Failed to initialize render process", { status: 500 });
        }
    }

    return new Response("Endpoint Not Found", { status: 404 });
  }
});

console.log("[BONZO DEVZ] Upload Service active on port: 3219");
console.log("[BONZO DEVZ] NLE State Engine active. FFmpeg bridging armed.");
