export function renderWorkflowsHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>
    const base = document.createElement('base');
    base.href = window.opener ? window.opener.location.origin + '/' : window.location.origin + '/';
    document.head.appendChild(base);
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WORKFLOW EDITOR // LITEGRAPH.JS CANVAS</title>
  <link rel="stylesheet" href="/litegraph/litegraph.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; border-radius: 0 !important; -webkit-font-smoothing: antialiased; }
    body { background: #0b0d12; color: #d4d4d8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.4; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0b0d12; }
    ::-webkit-scrollbar-thumb { background: #1f2937; border: 1px solid #11131a; }

    .win-header { background: #11131a; border-bottom: 1px solid #1f2937; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .win-title { font-family: ui-monospace, monospace; font-size: 11px; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 6px; }
    .win-controls { display: flex; gap: 4px; }
    .ctrl-btn { background: #181b22; border: 1px solid #1f2937; color: #9ca3af; font-family: ui-monospace, monospace; font-size: 10px; padding: 2px 6px; cursor: pointer; }
    .ctrl-btn:hover { background: #1f232b; color: #fff; border-color: #374151; }
    .ctrl-btn.btn-x:hover { background: #ef4444; color: #fff; border-color: #ef4444; }

    .workspace-layout { flex: 1; display: flex; overflow: hidden; }

    /* Nodes Sidebar */
    .nodes-sidebar { width: 200px; background: #11131a; border-right: 1px solid #1f2937; display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto; }
    .sidebar-header { padding: 8px 10px; background: #181b22; border-bottom: 1px solid #1f2937; font-family: ui-monospace, monospace; font-size: 10px; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 0.06em; }
    .node-group { padding: 8px 10px; border-bottom: 1px solid #1f2937; }
    .group-label { font-family: ui-monospace, monospace; font-size: 9px; font-weight: 700; color: #d4a574; text-transform: uppercase; margin-bottom: 6px; display: block; }
    .node-item { display: flex; align-items: center; justify-content: space-between; background: #0b0d12; border: 1px solid #1f2937; padding: 4px 8px; margin-bottom: 4px; font-family: ui-monospace, monospace; font-size: 9px; color: #d4d4d8; cursor: grab; user-select: none; transition: all 0.15s; }
    .node-item:hover { border-color: #d4a574; color: #fff; background: #181b22; }
    .node-type-tag { font-size: 8px; color: #6b7280; background: #11131a; padding: 1px 3px; border: 1px solid #1f2937; }

    /* Canvas overrides */
    .canvas-area { flex: 1; position: relative; overflow: hidden; }
    .canvas-area canvas { width: 100% !important; height: 100% !important; }

    /* LiteGraph theme overrides */
    .litegraph.litecanvas { background-color: #0b0d12 !important; }
    .lgraphcanvas { background: #0b0d12 !important; }

    /* Bottom Ops Bar */
    .ops-bar { background: #0e1017; border-top: 1px solid #1f2937; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; font-family: ui-monospace, monospace; font-size: 10px; flex-shrink: 0; }
    .ops-status { color: #6b7280; display: flex; align-items: center; gap: 6px; }
    .ops-actions { display: flex; gap: 6px; }
    .btn-ops { background: #181b22; border: 1px solid #1f2937; color: #9ca3af; font-family: ui-monospace, monospace; font-size: 10px; font-weight: 700; padding: 4px 10px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.04em; }
    .btn-ops:hover { background: #1f232b; color: #fff; border-color: #374151; }
    .btn-ops.btn-run { background: #181b22; color: #d4a574; border-color: #d4a574; }
    .btn-ops.btn-run:hover { background: #d4a574; color: #0b0d12; }
    .btn-ops.btn-run:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Log panel */
    .log-panel { position: absolute; bottom: 0; right: 0; width: 340px; max-height: 200px; background: #0b0d12ee; border: 1px solid #1f2937; border-bottom: none; overflow-y: auto; z-index: 100; display: none; font-size: 9px; }
    .log-panel.open { display: block; }
    .log-entry { padding: 2px 6px; border-bottom: 1px solid #11131a; }
    .log-entry .ts { color: #6b7280; } .log-entry .lvl-OK { color: #10b981; } .log-entry .lvl-RUN { color: #d4a574; } .log-entry .lvl-ERR { color: #ef4444; } .log-entry .lvl-INFO { color: #9ca3af; }
  </style>
</head>
<body>
  <header class="win-header">
    <div class="win-title">
      <span style="color:#d4a574;">[WORKFLOW EDITOR]</span>
      <span style="color:#6b7280;">//</span>
      <span>LITEGRAPH.JS NODE PIPELINE</span>
    </div>
    <div class="win-controls">
      <button type="button" class="ctrl-btn" onclick="toggleLog()" title="Toggle Log">[LOG]</button>
      <button type="button" class="ctrl-btn btn-x" onclick="window.close()" title="Close">[X]</button>
    </div>
  </header>

  <div class="workspace-layout">
    <aside class="nodes-sidebar">
      <div class="sidebar-header">NODES PALETTE</div>
      <div class="node-group">
        <span class="group-label">INPUT</span>
        <div class="node-item" draggable="true" data-nodetype="input/prompt"><span>Prompt Node</span><span class="node-type-tag">TXT</span></div>
        <div class="node-item" draggable="true" data-nodetype="model/checkpoint"><span>Checkpoint</span><span class="node-type-tag">CKPT</span></div>
      </div>
      <div class="node-group">
        <span class="group-label">PROCESS</span>
        <div class="node-item" draggable="true" data-nodetype="generate/ksampler"><span>KSampler</span><span class="node-type-tag">DIFF</span></div>
        <div class="node-item" draggable="true" data-nodetype="latent/empty"><span>Latent Empty</span><span class="node-type-tag">LAT</span></div>
        <div class="node-item" draggable="true" data-nodetype="postprocess/vae_decode"><span>VAE Decode</span><span class="node-type-tag">VAE</span></div>
        <div class="node-item" draggable="true" data-nodetype="edit/inpaint"><span>Inpaint Edit</span><span class="node-type-tag">INP</span></div>
      </div>
      <div class="node-group">
        <span class="group-label">POST</span>
        <div class="node-item" draggable="true" data-nodetype="postprocess/enhancer"><span>Enhancer (TODO)</span><span class="node-type-tag">UPS</span></div>
        <div class="node-item" draggable="true" data-nodetype="output/save"><span>Save Output</span><span class="node-type-tag">OUT</span></div>
      </div>
    </aside>

    <main class="canvas-area" id="canvas-area">
      <canvas id="graphcanvas"></canvas>
      <div class="log-panel" id="log-panel"></div>
    </main>
  </div>

  <footer class="ops-bar">
    <div class="ops-status">
      <span id="graph-status">[GRAPH: IDLE]</span>
      <span style="color:#1f2937;">|</span>
      <span id="node-count">0 NODES</span>
      <span style="color:#1f2937;">|</span>
      <span id="exec-status"></span>
    </div>
    <div class="ops-actions">
      <button type="button" class="btn-ops" onclick="clearGraph()">[CLEAR]</button>
      <button type="button" class="btn-ops" onclick="loadGraph()">[LOAD]</button>
      <button type="button" class="btn-ops" onclick="saveGraph()">[SAVE]</button>
      <button type="button" class="btn-ops btn-run" id="run-btn" onclick="runWorkflow()">[RUN WORKFLOW]</button>
    </div>
  </footer>

  <script src="/litegraph/litegraph.min.js"></script>
  <script>
    // ═══════════════════════════════════════════════════════════════
    // BONZO CUSTOM NODE TYPES
    // ═══════════════════════════════════════════════════════════════

    const STORAGE_KEY = 'bonzo-workflow-graph';
    const LOG_EL = document.getElementById('log-panel');
    const graph = new LGraph();
    let canvas = null;
    let isRunning = false;

    function logMsg(lvl, msg) {
      const ts = new Date().toTimeString().split(' ')[0];
      const el = document.createElement('div');
      el.className = 'log-entry';
      el.innerHTML = '<span class="ts">' + ts + '</span> <span class="lvl-' + lvl + '">[' + lvl + ']</span> ' + msg;
      LOG_EL.appendChild(el);
      LOG_EL.scrollTop = LOG_EL.scrollHeight;
    }

    function toggleLog() { LOG_EL.classList.toggle('open'); }

    // --- Prompt Node ---
    function BonzoPrompt() {
      this.addOutput('prompt', 'string');
      this.addProperty('text', 'A beautiful landscape painting');
      this.addProperty('negative', '');
      this.addWidget('text', 'Prompt', this.properties.text, (v) => this.properties.text = v);
      this.addWidget('text', 'Negative', this.properties.negative, (v) => this.properties.negative = v);
      this.size = [260, 80];
      this.color = '#1a1d24';
      this.bgcolor = '#11131a';
    }
    BonzoPrompt.title = 'Prompt';
    BonzoPrompt.desc = 'Text prompt input';
    BonzoPrompt.prototype.onExecute = function() {
      this.setOutputData(0, { text: this.properties.text, negative: this.properties.negative });
    };
    LiteGraph.registerNodeType('input/prompt', BonzoPrompt);

    // --- Checkpoint Node ---
    function BonzoCheckpoint() {
      this.addOutput('model', 'string');
      this.addProperty('provider', 'google');
      this.addProperty('model', 'gemini-2.5-flash-image');
      this.addWidget('combo', 'Provider', this.properties.provider, (v) => this.properties.provider = v, { values: ['google', 'fal', 'replicate', 'openai'] });
      this.addWidget('text', 'Model ID', this.properties.model, (v) => this.properties.model = v);
      this.size = [260, 70];
      this.color = '#1a1d24';
      this.bgcolor = '#11131a';
    }
    BonzoCheckpoint.title = 'Checkpoint';
    BonzoCheckpoint.desc = 'Model/provider selector';
    BonzoCheckpoint.prototype.onExecute = function() {
      this.setOutputData(0, { provider: this.properties.provider, model: this.properties.model });
    };
    LiteGraph.registerNodeType('model/checkpoint', BonzoCheckpoint);

    // --- Latent Empty ---
    function BonzoLatent() {
      this.addOutput('latent', 'object');
      this.addProperty('width', 1024);
      this.addProperty('height', 1024);
      this.addWidget('number', 'Width', this.properties.width, (v) => this.properties.width = v, { min: 256, max: 2048, step: 64 });
      this.addWidget('number', 'Height', this.properties.height, (v) => this.properties.height = v, { min: 256, max: 2048, step: 64 });
      this.size = [220, 70];
      this.color = '#1a1d24';
      this.bgcolor = '#11131a';
    }
    BonzoLatent.title = 'Latent Empty';
    BonzoLatent.desc = 'Empty latent space';
    BonzoLatent.prototype.onExecute = function() {
      this.setOutputData(0, { width: this.properties.width, height: this.properties.height });
    };
    LiteGraph.registerNodeType('latent/empty', BonzoLatent);

    // --- KSampler ---
    function BonzoKSampler() {
      this.addInput('prompt', 'string');
      this.addInput('model', 'string');
      this.addInput('latent', 'object');
      this.addOutput('image', 'string');
      this.addProperty('seed', Math.floor(Math.random() * 999999));
      this.addProperty('steps', 25);
      this.addProperty('cfg', 7.5);
      this.addWidget('number', 'Seed', this.properties.seed, (v) => this.properties.seed = v, { min: 0, max: 999999 });
      this.addWidget('number', 'Steps', this.properties.steps, (v) => this.properties.steps = v, { min: 1, max: 100 });
      this.addWidget('number', 'CFG', this.properties.cfg, (v) => this.properties.cfg = v, { min: 1, max: 30, step: 0.5 });
      this.size = [240, 110];
      this.color = '#1a1d24';
      this.bgcolor = '#11131a';
    }
    BonzoKSampler.title = 'KSampler';
    BonzoKSampler.desc = 'Image generation sampler';
    BonzoKSampler.prototype.onExecute = async function() {
      const promptData = this.getInputData(0);
      const modelData = this.getInputData(1);
      const latentData = this.getInputData(2);
      if (!promptData || !modelData) return;
      this.boxcolor = '#d4a574';
      logMsg('RUN', 'KSampler: dispatching ' + modelData.provider + '/' + modelData.model);
      try {
        const w = latentData?.width || 1024;
        const h = latentData?.height || 1024;
        const result = await callProvider(modelData.provider, modelData.model, promptData.text, promptData.negative, w, h, this.properties.seed);
        this.setOutputData(0, result);
        this.boxcolor = '#10b981';
        logMsg('OK', 'KSampler: image generated (' + Math.round(result.length / 1024) + ' KB)');
      } catch (e) {
        this.boxcolor = '#ef4444';
        logMsg('ERR', 'KSampler failed: ' + e.message);
      }
    };
    LiteGraph.registerNodeType('generate/ksampler', BonzoKSampler);

    // --- VAE Decode ---
    function BonzoVAE() {
      this.addInput('image', 'string');
      this.addOutput('image', 'string');
      this.size = [160, 50];
      this.color = '#1a1d24';
      this.bgcolor = '#11131a';
    }
    BonzoVAE.title = 'VAE Decode';
    BonzoVAE.desc = 'Passthrough decode (visual)';
    BonzoVAE.prototype.onExecute = function() {
      this.setOutputData(0, this.getInputData(0));
    };
    LiteGraph.registerNodeType('postprocess/vae_decode', BonzoVAE);

    // --- Inpaint Edit ---
    function BonzoInpaint() {
      this.addInput('image', 'string');
      this.addInput('prompt', 'string');
      this.addOutput('image', 'string');
      this.addProperty('provider', 'google');
      this.addProperty('model', 'gemini-2.5-flash-image');
      this.addWidget('combo', 'Provider', this.properties.provider, (v) => this.properties.provider = v, { values: ['google'] });
      this.size = [240, 70];
      this.color = '#1a1d24';
      this.bgcolor = '#11131a';
    }
    BonzoInpaint.title = 'Inpaint Edit';
    BonzoInpaint.desc = 'Image editing via prompt';
    BonzoInpaint.prototype.onExecute = async function() {
      const imgData = this.getInputData(0);
      const promptData = this.getInputData(1);
      if (!imgData || !promptData) return;
      this.boxcolor = '#d4a574';
      logMsg('RUN', 'Inpaint: editing with ' + this.properties.provider);
      try {
        const result = await callEditProvider(this.properties.provider, this.properties.model, promptData.text, imgData);
        this.setOutputData(0, result);
        this.boxcolor = '#10b981';
        logMsg('OK', 'Inpaint: edit complete');
      } catch (e) {
        this.boxcolor = '#ef4444';
        logMsg('ERR', 'Inpaint failed: ' + e.message);
      }
    };
    LiteGraph.registerNodeType('edit/inpaint', BonzoInpaint);

    // --- Enhancer (STUB) ---
    function BonzoEnhancer() {
      this.addInput('image', 'string');
      this.addOutput('image', 'string');
      this.addProperty('scale', 2);
      this.addWidget('number', 'Scale', 2, (v) => this.properties.scale = v, { min: 2, max: 4, step: 1 });
      this.size = [200, 60];
      this.color = '#1a1d24';
      this.bgcolor = '#11131a';
    }
    BonzoEnhancer.title = 'Enhancer (TODO)';
    BonzoEnhancer.desc = 'TODO: Post-processing / upscale — delegated to another agent';
    BonzoEnhancer.prototype.onExecute = function() {
      logMsg('WARN', 'Enhancer: STUB — post-processing not yet implemented');
      this.boxcolor = '#f59e0b';
      this.setOutputData(0, this.getInputData(0));
    };
    LiteGraph.registerNodeType('postprocess/enhancer', BonzoEnhancer);

    // --- Output ---
    function BonzoOutput() {
      this.addInput('image', 'string');
      this.addProperty('autoSave', true);
      this.addWidget('toggle', 'Auto Save', true, (v) => this.properties.autoSave = v);
      this.size = [180, 50];
      this.color = '#1a1d24';
      this.bgcolor = '#11131a';
    }
    BonzoOutput.title = 'Save Output';
    BonzoOutput.desc = 'Save result to gallery';
    BonzoOutput.prototype.onExecute = function() {
      const img = this.getInputData(0);
      if (!img) return;
      logMsg('OK', 'Output: image ready (' + Math.round(img.length / 1024) + ' KB)');
      this.boxcolor = '#10b981';
      // Post to parent window for gallery save
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'BONZO_WORKFLOW_OUTPUT', image: img }, '*');
      }
    };
    LiteGraph.registerNodeType('output/save', BonzoOutput);

    // ═══════════════════════════════════════════════════════════════
    // KEY STORAGE — request from opener via postMessage (popout-safe)
    // ═══════════════════════════════════════════════════════════════
    const KEY_PREFIX = 'bonzo-studio-key-';
    let _keyCache = {};

    // Request keys from opener window on load
    function requestKeysFromOpener() {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'BONZO_WORKFLOW_REQUEST_KEYS' }, '*');
      }
    }

    // Listen for keys from opener
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'BONZO_WORKFLOW_KEYS_RESPONSE' && e.data.keys) {
        _keyCache = { ..._keyCache, ...e.data.keys };
        logMsg('INFO', 'Received API keys from main window');
      }
    });

    function getKey(name) {
      // Try cache first (from opener postMessage)
      if (_keyCache[name]) return _keyCache[name];
      // Try localStorage with correct prefix
      try {
        const val = localStorage.getItem(KEY_PREFIX + name);
        if (val) return val;
      } catch {}
      return '';
    }

    // Request keys on load
    requestKeysFromOpener();

    async function callProvider(provider, model, prompt, negative, width, height, seed) {
      if (provider === 'google') {
        const key = getKey('GEMINI_API_KEY');
        if (!key) throw new Error('No GEMINI_API_KEY');
        const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: { parts: [{ text: prompt }] } })
        });
        if (!resp.ok) throw new Error('Google API ' + resp.status);
        const data = await resp.json();
        for (const c of data.candidates || []) {
          for (const p of c.content?.parts || []) {
            if (p.inlineData) return 'data:' + p.inlineData.mimeType + ';base64,' + p.inlineData.data;
          }
        }
        throw new Error('No image in response');
      }
      if (provider === 'fal') {
        const key = getKey('FAL_KEY');
        if (!key) throw new Error('No FAL_KEY');
        const isLocal = location.hostname === 'localhost';
        const ep = isLocal ? '/api-fal/' + model : 'https://fal.run/' + model;
        const res = await fetch(ep, { method: 'POST', headers: { 'Authorization': 'Key ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, image_size: { width, height }, num_images: 1, seed: seed || undefined, negative_prompt: negative || undefined })
        });
        if (!res.ok) throw new Error('fal.ai ' + res.status);
        const data = await res.json();
        const url = (data.images || [])[0]?.url;
        if (!url) throw new Error('No image from fal');
        const blob = await fetch(url).then(r => r.blob());
        return new Promise(r => { const rd = new FileReader(); rd.onloadend = () => r(rd.result); rd.readAsDataURL(blob); });
      }
      if (provider === 'replicate') {
        const key = getKey('REPLICATE_API_TOKEN');
        if (!key) throw new Error('No REPLICATE_API_TOKEN');
        const isLocal = location.hostname === 'localhost';
        const ep = isLocal ? '/api-replicate/v1/models/' + model + '/predictions' : 'https://api.replicate.com/v1/models/' + model + '/predictions';
        const res = await fetch(ep, { method: 'POST', headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: { prompt, width, height, seed: seed || undefined, negative_prompt: negative || undefined } })
        });
        if (!res.ok) throw new Error('Replicate ' + res.status);
        let pred = await res.json();
        let polls = 0;
        while (pred.status !== 'succeeded' && pred.status !== 'failed' && polls < 60) {
          await new Promise(r => setTimeout(r, 1500));
          const pollUrl = isLocal ? pred.urls.get.replace('https://api.replicate.com', '/api-replicate') : pred.urls.get;
          const pr = await fetch(pollUrl, { headers: { 'Authorization': 'Bearer ' + key } });
          if (pr.ok) pred = await pr.json();
          polls++;
        }
        if (pred.status === 'succeeded' && pred.output) {
          const urls = Array.isArray(pred.output) ? pred.output : [pred.output];
          const blobs = await Promise.all(urls.map(u => fetch(u).then(r => r.blob())));
          return new Promise(r => { const rd = new FileReader(); rd.onloadend = () => r(rd.result); rd.readAsDataURL(blobs[0]); });
        }
        throw new Error('Replicate failed: ' + (pred.error || pred.status));
      }
      if (provider === 'openai') {
        const key = getKey('OPENAI_API_KEY');
        if (!key) throw new Error('No OPENAI_API_KEY');
        const isLocal = location.hostname === 'localhost';
        const ep = isLocal ? '/api-openai/v1/images/generations' : 'https://api.openai.com/v1/images/generations';
        const sz = width >= 1024 && height >= 1024 ? '1024x1024' : width > height ? '1792x1024' : '1024x1792';
        const res = await fetch(ep, { method: 'POST', headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt, n: 1, size: sz, response_format: 'b64_json' })
        });
        if (!res.ok) throw new Error('OpenAI ' + res.status);
        const data = await res.json();
        const b64 = data.data?.[0]?.b64_json;
        if (!b64) throw new Error('No image from OpenAI');
        return 'data:image/png;base64,' + b64;
      }
      throw new Error('Unknown provider: ' + provider);
    }

    async function callEditProvider(provider, model, prompt, imageBase64) {
      if (provider === 'google') {
        const key = getKey('GEMINI_API_KEY');
        if (!key) throw new Error('No GEMINI_API_KEY');
        const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: { parts: [
            { inlineData: { data: imageBase64.split(',')[1] || imageBase64, mimeType: 'image/png' } },
            { text: prompt }
          ] } })
        });
        if (!resp.ok) throw new Error('Google edit API ' + resp.status);
        const data = await resp.json();
        for (const c of data.candidates || []) {
          for (const p of c.content?.parts || []) {
            if (p.inlineData) return 'data:' + p.inlineData.mimeType + ';base64,' + p.inlineData.data;
          }
        }
        throw new Error('No image in edit response');
      }
      throw new Error('Edit provider ' + provider + ' not implemented');
    }

    // ═══════════════════════════════════════════════════════════════
    // CANVAS INIT + DRAG & DROP
    // ═══════════════════════════════════════════════════════════════
    const canvasEl = document.getElementById('graphcanvas');
    const area = document.getElementById('canvas-area');
    canvasEl.width = area.clientWidth;
    canvasEl.height = area.clientHeight;
    canvas = new LGraphCanvas(canvasEl, graph);
    canvas.background_image = null;
    canvas.clear_background = true;
    canvas.render_shadows = false;
    canvas.default_link_color = '#d4a574';
    canvas.highquality_render = true;

    // Drag & drop from sidebar
    document.querySelectorAll('.node-item[draggable]').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', el.dataset.nodetype);
      });
    });
    canvasEl.addEventListener('dragover', (e) => e.preventDefault());
    canvasEl.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('text/plain');
      if (!type) return;
      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const node = LiteGraph.createNode(type);
      if (node) {
        node.pos = [canvas.convertOffset ? canvas.convertOffset(x) : x / canvas.ds.scale - canvas.ds.offset[0],
                     canvas.convertOffset ? canvas.convertOffset(y) : y / canvas.ds.scale - canvas.ds.offset[1]];
        graph.add(node);
        updateNodeCount();
      }
    });

    // Resize handler
    window.addEventListener('resize', () => {
      canvasEl.width = area.clientWidth;
      canvasEl.height = area.clientHeight;
      canvas.resize();
    });

    function updateNodeCount() {
      document.getElementById('node-count').textContent = graph._nodes.length + ' NODES';
    }

    graph.onNodeAdded = updateNodeCount;
    graph.onNodeRemoved = updateNodeCount;

    // ═══════════════════════════════════════════════════════════════
    // SAVE / LOAD / CLEAR / RUN
    // ═══════════════════════════════════════════════════════════════
    function saveGraph() {
      try {
        const data = graph.serialize();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        logMsg('OK', 'Graph saved to localStorage (' + graph._nodes.length + ' nodes)');
      } catch (e) { logMsg('ERR', 'Save failed: ' + e.message); }
    }

    function loadGraph() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) { logMsg('INFO', 'No saved graph found'); return; }
        graph.configure(JSON.parse(raw));
        updateNodeCount();
        logMsg('OK', 'Graph loaded (' + graph._nodes.length + ' nodes)');
      } catch (e) { logMsg('ERR', 'Load failed: ' + e.message); }
    }

    function clearGraph() {
      graph.clear();
      updateNodeCount();
      logMsg('INFO', 'Graph cleared');
    }

    async function runWorkflow() {
      if (isRunning) return;
      isRunning = true;
      const btn = document.getElementById('run-btn');
      btn.disabled = true;
      btn.textContent = '[RUNNING...]';
      document.getElementById('graph-status').textContent = '[GRAPH: EXECUTING]';
      logMsg('RUN', '=== WORKFLOW EXECUTION START ===');

      // Reset node colors
      graph._nodes.forEach(n => { n.boxcolor = null; n._outputData = {}; });

      try {
        // Topological execution order
        const execOrder = graph.computeExecutionOrder();
        logMsg('INFO', 'Execution order: ' + execOrder.length + ' nodes');

        for (const node of execOrder) {
          if (!node) continue;
          logMsg('RUN', 'Executing: ' + (node.title || node.type));
          node.boxcolor = '#d4a574';

          // Gather inputs from connected nodes
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

          // Execute node (await async)
          try {
            if (node.onExecute) {
              await node.onExecute.call(node);
            }
            // Capture outputs
            if (node.outputs) {
              node._outputData = {};
              for (let o = 0; o < node.outputs.length; o++) {
                node._outputData[o] = node.getOutputData(o);
              }
            }
            node.boxcolor = '#10b981';
          } catch (err) {
            node.boxcolor = '#ef4444';
            logMsg('ERR', 'Node ' + (node.title || node.type) + ' failed: ' + err.message);
          }
        }

        logMsg('OK', '=== WORKFLOW EXECUTION COMPLETE ===');
        document.getElementById('exec-status').textContent = 'COMPLETE';
      } catch (e) {
        logMsg('ERR', 'Workflow failed: ' + e.message);
        document.getElementById('exec-status').textContent = 'FAILED';
      } finally {
        isRunning = false;
        btn.disabled = false;
        btn.textContent = '[RUN WORKFLOW]';
        document.getElementById('graph-status').textContent = '[GRAPH: IDLE]';
      }
    }

    // Auto-load saved graph
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { graph.configure(JSON.parse(raw)); updateNodeCount(); logMsg('INFO', 'Auto-loaded saved graph'); }
    } catch {}

    // Start rendering
    canvas.startRendering();
    graph.start();
    logMsg('INFO', 'LiteGraph.js canvas initialized — drag nodes from palette');

    window.addEventListener('beforeunload', () => {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'BONZO_WINDOW_CLOSED', windowType: 'workflows' }, '*');
      }
    });
  </script>
</body>
</html>`;
}