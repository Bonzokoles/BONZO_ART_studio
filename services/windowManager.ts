import {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_MODIFIERS,
  getArtistPromptAddition,
} from '../data/artistsData';
import { getAllArtists } from '../data/allArtists';
import { getKey } from './keyStorage';

export type WindowType = 'wildcards' | 'audioStudio' | 'workflows';

export interface WindowStateInfo {
  open: boolean;
  ref: Window | null;
}

export const WINDOW_STATES: Record<WindowType, WindowStateInfo> = {
  wildcards: { open: false, ref: null },
  audioStudio: { open: false, ref: null },
  workflows: { open: false, ref: null },
};

type StateChangeCallback = (states: Record<WindowType, boolean>) => void;
const listeners: Set<StateChangeCallback> = new Set();

export function getWindowStates(): Record<WindowType, boolean> {
  return {
    wildcards: Boolean(WINDOW_STATES.wildcards.open && WINDOW_STATES.wildcards.ref && !WINDOW_STATES.wildcards.ref.closed),
    audioStudio: Boolean(WINDOW_STATES.audioStudio.open && WINDOW_STATES.audioStudio.ref && !WINDOW_STATES.audioStudio.ref.closed),
    workflows: Boolean(WINDOW_STATES.workflows.open && WINDOW_STATES.workflows.ref && !WINDOW_STATES.workflows.ref.closed),
  };
}

export function subscribeWindowStates(callback: StateChangeCallback): () => void {
  listeners.add(callback);
  callback(getWindowStates());
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners() {
  const states = getWindowStates();
  listeners.forEach((cb) => cb(states));
}

// Background polling to detect when windows are closed via OS [X] button
if (typeof window !== 'undefined') {
  setInterval(() => {
    let changed = false;
    for (const key of Object.keys(WINDOW_STATES) as WindowType[]) {
      const state = WINDOW_STATES[key];
      if (state.open && (!state.ref || state.ref.closed)) {
        state.open = false;
        state.ref = null;
        changed = true;
      }
    }
    if (changed) {
      notifyListeners();
    }
  }, 500);

  // Listen to message events from popup windows
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'BONZO_WINDOW_CLOSED') {
      const type = event.data.windowType as WindowType;
      if (type && WINDOW_STATES[type]) {
        WINDOW_STATES[type].open = false;
        WINDOW_STATES[type].ref = null;
        notifyListeners();
      }
    }
  });
}

export function updateButtonState(type: WindowType, isOpen: boolean, windowRef: Window | null = null) {
  WINDOW_STATES[type].open = isOpen;
  WINDOW_STATES[type].ref = isOpen ? windowRef : null;
  notifyListeners();
}

// ══════════════════════════════════════════════════════════════════════════════
// HTML GENERATOR: WILDCARDS WINDOW (PART 2)
// ══════════════════════════════════════════════════════════════════════════════
export function renderWildcardsHTML(): string {
  const mergedArtists = getAllArtists();

  const serializedArtists = JSON.stringify(mergedArtists);
  const serializedCategories = JSON.stringify(CATEGORIES);
  const serializedColors = JSON.stringify(CATEGORY_COLORS);
  const serializedModifiers = JSON.stringify(CATEGORY_MODIFIERS);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>
    // Dynamically inject base href based on current origin to bypass about:blank base issues
    const base = document.createElement('base');
    base.href = window.opener ? window.opener.location.origin + '/' : window.location.origin + '/';
    document.head.appendChild(base);
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BONZO AI // WILDCARDS LIBRARY</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      border-radius: 0 !important;
      -webkit-font-smoothing: antialiased;
    }
    body {
      background-color: #0b0d12;
      color: #d4d4d8;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      overflow-x: hidden;
      overflow-y: scroll;
    }
    code, pre, .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    /* Scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #0b0d12;
    }
    ::-webkit-scrollbar-thumb {
      background: #1f2937;
      border: 1px solid #11131a;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #374151;
    }

    /* Top Sticky Header */
    .header-bar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #11131a;
      border-bottom: 1px solid #1f2937;
      padding: 10px 12px;
    }
    .header-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .title-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: ui-monospace, monospace;
      font-size: 11px;
      font-weight: 800;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      display: inline-block;
    }
    .count-tag {
      font-size: 9px;
      color: #d4a574;
      background: rgba(212, 165, 116, 0.1);
      border: 1px solid rgba(212, 165, 116, 0.3);
      padding: 1px 4px;
      font-family: ui-monospace, monospace;
    }
    .btn-close {
      background: #181b22;
      border: 1px solid #1f2937;
      color: #9ca3af;
      font-family: ui-monospace, monospace;
      font-size: 10px;
      padding: 2px 6px;
      cursor: pointer;
    }
    .btn-close:hover {
      background: #ef4444;
      color: #ffffff;
      border-color: #ef4444;
    }

    /* Search Box */
    .search-box {
      position: relative;
      margin-bottom: 8px;
    }
    .search-input {
      width: 100%;
      background: #0b0d12;
      border: 1px solid #1f2937;
      color: #ffffff;
      font-size: 11px;
      padding: 6px 8px 6px 26px;
      font-family: ui-monospace, monospace;
      outline: none;
    }
    .search-input:focus {
      border-color: #d4a574;
    }
    .search-icon {
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      font-size: 10px;
      font-family: ui-monospace, monospace;
      pointer-events: none;
    }

    /* Category Filter Chips */
    .category-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      max-height: 96px;
      overflow-y: auto;
      padding-bottom: 2px;
    }
    .cat-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      font-size: 9px;
      font-family: ui-monospace, monospace;
      text-transform: uppercase;
      font-weight: 700;
      background: #181b22;
      color: #9ca3af;
      border: 1px solid #1f2937;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .cat-btn:hover {
      color: #ffffff;
      border-color: #374151;
    }
    .cat-btn.active {
      background: #d4a574;
      color: #0b0d12;
      border-color: #d4a574;
    }
    .cat-count {
      font-size: 8px;
      padding: 0 3px;
      background: #0b0d12;
      color: #9ca3af;
      border: 1px solid #1f2937;
    }
    .cat-btn.active .cat-count {
      background: rgba(11, 13, 18, 0.3);
      color: #0b0d12;
      border-color: transparent;
      font-weight: 900;
    }

    /* Artist List */
    .artist-list {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .artist-card {
      background: #0e1017;
      border: 1px solid #1f2937;
      padding: 8px;
      display: flex;
      gap: 10px;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .artist-card:hover {
      border-color: #374151;
      background: #11131a;
    }
    .artist-thumb {
      width: 80px;
      height: 80px;
      min-width: 80px;
      min-height: 80px;
      max-width: 80px;
      max-height: 80px;
      background: #181b22;
      border: 1px solid #1f2937;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ui-monospace, monospace;
      font-weight: 800;
      font-size: 18px;
      color: #ffffff;
      user-select: none;
      overflow: hidden;
      flex-shrink: 0;
    }
    .artist-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .artist-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .artist-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 6px;
    }
    .artist-name {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .btn-add {
      background: #181b22;
      border: 1px solid #1f2937;
      color: #d4a574;
      font-family: ui-monospace, monospace;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 8px;
      cursor: pointer;
      text-transform: uppercase;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .btn-add:hover {
      background: #222733;
      border-color: #d4a574;
      color: #ffffff;
    }
    .btn-add.added {
      background: #10b981 !important;
      color: #0b0d12 !important;
      border-color: #10b981 !important;
      font-weight: 900;
    }
    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      margin: 1px 0;
    }
    .tag-pill {
      font-size: 10px;
      font-family: ui-monospace, monospace;
      text-transform: uppercase;
      font-weight: 700;
      padding: 1px 4px;
      border: 1px solid #1f2937;
    }
    .artist-desc {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .artist-known {
      font-size: 8px;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: ui-monospace, monospace;
    }

    .empty-notice {
      text-align: center;
      padding: 40px 16px;
      color: #6b7280;
      font-family: ui-monospace, monospace;
    }

    .toast-popup {
      position: fixed;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: #0b0d12;
      font-family: ui-monospace, monospace;
      font-size: 10px;
      font-weight: 800;
      padding: 4px 10px;
      border: 1px solid #059669;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 100;
    }
    .toast-popup.visible {
      opacity: 1;
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(11, 13, 18, 0.85);
      z-index: 100;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-backdrop.visible {
      display: flex;
    }
    .modal-content {
      background: #11131a;
      border: 1px solid #2a3140;
      width: 100%;
      max-width: 1360px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: none;
    }
    .modal-header {
      padding: 12px 16px;
      border-bottom: 1px solid #1f2937;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #181b22;
    }
    .modal-title {
      font-size: 11px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-family: ui-monospace, monospace;
    }
    .modal-close-btn {
      background: transparent;
      border: none;
      color: #9ca3af;
      font-family: ui-monospace, monospace;
      font-size: 10px;
      cursor: pointer;
    }
    .modal-close-btn:hover {
      color: #d4a574;
    }
    .modal-body {
      padding: 16px;
      overflow-y: auto;
      display: grid;
      grid-template-columns: 480px 1fr;
      gap: 16px;
    }
    @media (max-width: 640px) {
      .modal-body {
        grid-template-columns: 1fr;
      }
    }
    .modal-left {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .modal-img-container {
      width: 100%;
      aspect-ratio: 1;
      background: #0b0d12;
      border: 1px solid #1f2937;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 2px;
    }
    .split-img {
      width: 100%;
      height: 100%;
      background-size: 200% 200%;
      background-repeat: no-repeat;
    }
    .split-img.tl { background-position: 0% 0%; }
    .split-img.tr { background-position: 100% 0%; }
    .split-img.bl { background-position: 0% 100%; }
    .split-img.br { background-position: 100% 100%; }
    .modal-action-btn {
      background: #d4a574;
      color: #0b0d12;
      border: 1px solid #d4a574;
      font-family: ui-monospace, monospace;
      font-size: 10px;
      font-weight: 800;
      padding: 8px;
      cursor: pointer;
      text-transform: uppercase;
      text-align: center;
      width: 100%;
    }
    .modal-action-btn:hover {
      background: #1f232b;
      color: #d4a574;
      border-color: #d4a574;
    }
    .modal-right {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
    }
    .info-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .info-label {
      font-size: 8px;
      font-weight: 600;
      color: #6b7280;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .info-value-box {
      background: #0b0d12;
      border: 1px solid #1f2937;
      padding: 8px;
      font-size: 10px;
      color: #d4a574;
      word-break: break-all;
      cursor: pointer;
    }
    .info-value-box:hover {
      border-color: #d4a574;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .info-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .info-value {
      font-size: 10px;
      color: #ffffff;
      font-weight: 700;
    }
    .info-value-text {
      font-size: 10px;
      color: #d4d4d8;
    }
    .modal-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .artist-card {
      cursor: pointer;
    }
  </style>
</head>
<body>
  <!-- Sticky Control Header -->
  <header class="header-bar">
    <div class="header-title-row">
      <div class="title-badge">
        <span class="status-dot"></span>
        <span>WILDCARDS LIBRARY</span>
        <span class="count-tag" id="header-total-count">0 ARTISTS</span>
      </div>
      <button type="button" class="btn-close" onclick="window.close()" title="Close Window">[X]</button>
    </div>

    <!-- Search Input -->
    <div class="search-box">
      <span class="search-icon">[?]</span>
      <input
        type="text"
        id="search-input"
        class="search-input"
        placeholder="Search artists, categories, keywords..."
        autocomplete="off"
        spellcheck="false"
      />
    </div>

    <!-- Category Filter Chips -->
    <div class="category-pills" id="categories-container">
      <!-- Injected via JavaScript -->
    </div>
  </header>

  <!-- Artist Cards List -->
  <main class="artist-list" id="artists-container">
    <!-- Injected via JavaScript -->
  </main>

  <div id="toast" class="toast-popup">[ADDED TO PROMPT]</div>

  <!-- Artist Details Modal -->
  <div id="details-modal" class="modal-backdrop" onclick="closeDetailsModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div id="modal-artist-name" class="modal-title">Artist Name</div>
        <button type="button" class="modal-close-btn" onclick="toggleDetailsModal(false)">[CLOSE]</button>
      </div>
      <div class="modal-body">
        <div class="modal-left">
          <div class="modal-img-container" id="modal-img-container">
            <!-- Split Grid Injected via JS -->
          </div>
          <button type="button" id="modal-btn-add" class="modal-action-btn">[ADD ARTIST STYLE TO PROMPT]</button>
          <a id="modal-btn-wiki" href="#" target="_blank" class="modal-action-btn" style="display: block; margin-top: 8px; text-align: center; text-decoration: none; background: transparent; color: #d4a574; border: 1px solid #d4a574;">[ SEARCH WIKIPEDIA ]</a>
        </div>
        <div class="modal-right">
          <div class="info-group">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="info-label">PROMPT ADDITION / WEIGHT:</span>
              <span id="modal-weight-val" class="info-label" style="color:#d4a574;">1.0</span>
            </div>
            <input type="range" id="modal-weight-slider" min="0.1" max="2.0" step="0.1" value="1.0" 
              style="width: 100%; accent-color: #d4a574; cursor: pointer; height: 4px; background: #1f2937; outline: none; appearance: none; margin: 4px 0 8px 0;"
              oninput="document.getElementById('modal-weight-val').innerText = this.value; window.updateDynamicPrompt(this.value);" />
            <div id="modal-prompt-box" class="info-value-box font-mono" data-base="" onclick="window.copyPromptText()">in the style of...</div>
          </div>
          <div class="info-grid">
            <div class="info-cell">
              <span class="info-label">LIFESPAN:</span>
              <span id="modal-lifespan" class="info-value">-</span>
            </div>
            <div class="info-cell">
              <span class="info-label">TESTED MODEL:</span>
              <span id="modal-checkpoint" class="info-value">-</span>
            </div>
          </div>
          <div class="info-group">
            <span class="info-label">CATEGORIES:</span>
            <div id="modal-categories-row" class="modal-tags"></div>
          </div>
          <div class="info-group">
            <span class="info-label">DESCRIPTION & TIPS:</span>
            <div id="modal-description" class="info-value-text">Description details...</div>
          </div>
          <div class="info-group">
            <span class="info-label">KNOWN FOR:</span>
            <div id="modal-known" class="info-value-text">Known achievements...</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const ALL_ARTISTS = ${serializedArtists};
    const CATEGORIES = ${serializedCategories};
    const CATEGORY_COLORS = ${serializedColors};
    const CATEGORY_MODIFIERS = ${serializedModifiers};

    let selectedCategory = 'all';
    let searchQuery = '';

    // Generate deterministic background gradient
    function generateGradient(name) {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const h1 = Math.abs(hash % 360);
      const h2 = (h1 + 45) % 360;
      return 'linear-gradient(135deg, hsl(' + h1 + ', 50%, 15%) 0%, hsl(' + h2 + ', 40%, 8%) 100%)';
    }

    function getCategoryColor(catId) {
      return CATEGORY_COLORS[catId.toLowerCase()] || '#d4a574';
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('visible');
      setTimeout(() => {
        toast.classList.remove('visible');
      }, 1200);
    }

    function addArtistToMain(artistId, btnElement) {
      const artist = ALL_ARTISTS.find(a => a.id === artistId);
      if (!artist) return;

      // Cross-window postMessage
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'WILDCARD_ADD_ARTIST', artistId: artistId }, '*');
      }

      // BroadcastChannel fallback
      try {
        const bc = new BroadcastChannel('bonzo_ai_channel');
        bc.postMessage({ type: 'WILDCARD_ADD_ARTIST', artistId: artistId });
      } catch(e) {}

      // Button feedback
      if (btnElement) {
        btnElement.classList.add('added');
        btnElement.textContent = '[ADDED]';
        setTimeout(() => {
          btnElement.classList.remove('added');
          btnElement.textContent = '[ADD]';
        }, 1200);
      }

      showToast('[ADDED: ' + artist.name.toUpperCase() + ']');
    }

    function renderCategories() {
      const container = document.getElementById('categories-container');
      
      // Calculate category counts
      const counts = { all: ALL_ARTISTS.length };
      CATEGORIES.forEach(cat => {
        counts[cat.id] = ALL_ARTISTS.filter(a =>
          a.categories.some(c => c.toLowerCase() === cat.id.toLowerCase())
        ).length;
      });

      let html = '<button type="button" class="cat-btn ' + (selectedCategory === 'all' ? 'active' : '') + '" onclick="setCategory(\\'all\\')">';
      html += '<span>ALL</span>';
      html += '<span class="cat-count">' + counts.all + '</span>';
      html += '</button>';

      CATEGORIES.forEach(cat => {
        const isSel = selectedCategory === cat.id;
        const count = counts[cat.id] || 0;
        const color = cat.color || '#d4a574';
        
        html += '<button type="button" class="cat-btn ' + (isSel ? 'active' : '') + '" style="' + (!isSel ? 'border-left: 2px solid ' + color : '') + '" onclick="setCategory(\\'' + cat.id + '\\')">';
        html += '<span>' + cat.label + '</span>';
        html += '<span class="cat-count">' + count + '</span>';
        html += '</button>';
      });

      container.innerHTML = html;
      document.getElementById('header-total-count').textContent = ALL_ARTISTS.length + ' ARTISTS';
    }

    function setCategory(catId) {
      selectedCategory = catId;
      renderCategories();
      renderArtists();
    }

    function renderArtists() {
      const container = document.getElementById('artists-container');
      const q = searchQuery.toLowerCase().trim();

      const filtered = ALL_ARTISTS.filter(artist => {
        // Category match
        if (selectedCategory !== 'all') {
          const matchCat = artist.categories.some(c => c.toLowerCase() === selectedCategory.toLowerCase());
          if (!matchCat) return false;
        }
        // Search query match
        if (q) {
          const matchName = artist.name.toLowerCase().includes(q);
          const matchCats = artist.categories.some(c => c.toLowerCase().includes(q));
          const matchDesc = (artist.description || '').toLowerCase().includes(q);
          const matchKnown = (artist.knownFor || '').toLowerCase().includes(q);
          const matchPrefix = (artist.promptPrefix || '').toLowerCase().includes(q);
          if (!matchName && !matchCats && !matchDesc && !matchKnown && !matchPrefix) {
            return false;
          }
        }
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-notice">[NO ARTISTS MATCHING SEARCH CRITERIA]</div>';
        return;
      }

      let html = '';
      filtered.forEach(artist => {
        const primaryCat = artist.categories[0] || 'anime';
        const color = getCategoryColor(primaryCat);
        const initial = (artist.name[0] || 'A').toUpperCase();

        html += '<div class="artist-card" style="border-left: 4px solid ' + color + ';" onclick="openArtistDetails(\\\'' + artist.id + '\\\')">';
        
        // Thumbnail Slot
        html += '<div class="artist-thumb" style="background: ' + generateGradient(artist.name) + '">';
        if (artist.imageSlot) {
          html += '<img class="lazy-load" data-src="' + artist.imageSlot + '" alt="' + artist.name + '" style="opacity: 0; transition: opacity 0.3s ease;" onload="this.style.opacity=1;" />';
        } else {
          html += '<span>' + initial + '</span>';
        }
        html += '</div>';

        // Info Body
        html += '<div class="artist-info">';
        html += '  <div class="artist-header">';
        html += '    <div class="artist-name" title="' + artist.name + '">' + artist.name + '</div>';
        html += '    <button type="button" class="btn-add" onclick="event.stopPropagation(); addArtistToMain(\\'' + artist.id + '\\', this)">[ADD]</button>';
        html += '  </div>';

        // Category Tags
        html += '  <div class="tag-row">';
        artist.categories.forEach(c => {
          const tagColor = getCategoryColor(c);
          html += '    <span class="tag-pill" style="color:' + tagColor + '; background:' + tagColor + '18; border-color:' + tagColor + '44;">' + c + '</span>';
        });
        html += '  </div>';

        // Description
        html += '  <div class="artist-desc">' + (artist.description || artist.promptPrefix) + '</div>';
        
        // Known For
        if (artist.knownFor) {
          html += '  <div class="artist-known">KNOWN: ' + artist.knownFor + '</div>';
        }

        html += '</div>'; // End info
        html += '</div>'; // End card
      });

      container.innerHTML = html;
      
      // Initialize strict IntersectionObserver lazy loading
      requestAnimationFrame(() => {
        if (!window._lazyObserver) {
          window._lazyObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.removeAttribute('data-src');
                  observer.unobserve(img);
                }
              }
            });
          }, { root: container, rootMargin: '300px' });
        } else {
          // Prevent memory leak on DOM teardown
          window._lazyObserver.disconnect();
        }
        
        // Re-attach observer to new items
        document.querySelectorAll('.artist-card .lazy-load').forEach(img => {
          window._lazyObserver.observe(img);
        });
      });
    }

    // --- DETAILS MODAL FUNCTIONS ---
    window.uploadArtistImage = async function(file, artistId) {
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('artistId', artistId);
      
      try {
        showToast('[UPLOADING ARTWORK...]');
        const res = await fetch('http://localhost:3219/api/upload-artist', { method: 'POST', body: formData });
        if (res.ok) {
          showToast('[UPLOAD SUCCESS - RELOADING]');
          setTimeout(() => { openArtistDetails(artistId); }, 400);
        } else {
          showToast('[UPLOAD FAILED]');
        }
      } catch(e) {
        showToast('[SERVER UNREACHABLE]');
      }
    };
    function openArtistDetails(artistId) {
      const artist = ALL_ARTISTS.find(a => a.id === artistId);
      if (!artist) return;

      document.getElementById('modal-artist-name').textContent = artist.name.toUpperCase();
      
      const imgContainer = document.getElementById('modal-img-container');
      const applySplitImage = (src) => {
        imgContainer.innerHTML = 
          '<div class="split-img tl" style="background-image: url(\\'' + src + '\\')"></div>' +
          '<div class="split-img tr" style="background-image: url(\\'' + src + '\\')"></div>' +
          '<div class="split-img bl" style="background-image: url(\\'' + src + '\\')"></div>' +
          '<div class="split-img br" style="background-image: url(\\'' + src + '\\')"></div>';
        imgContainer.style.display = 'grid';
        imgContainer.style.background = '#0b0d12';
      };

      const showUploadFallback = () => {
        const initial = (artist.name[0] || 'A').toUpperCase();
        imgContainer.innerHTML = 
          '<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family: ui-monospace, monospace; color:#ffffff; cursor:pointer; user-select:none; background:' + generateGradient(artist.name) + '"' +
          ' ondragover="event.preventDefault(); this.style.opacity=0.7;"' +
          ' ondragleave="this.style.opacity=1;"' +
          ' ondrop="event.preventDefault(); this.style.opacity=1; window.uploadArtistImage(event.dataTransfer.files[0], \\'' + artist.id + '\\');"' +
          ' onclick="document.getElementById(\\'modal-file-input\\').click()">' +
          '<span style="font-size:48px; font-weight:800;">' + initial + '</span>' +
          '<span style="font-size:11px; margin-top:12px; font-weight:700; letter-spacing:0.1em; opacity:0.8;">[ DROP IMAGE OR CLICK TO UPLOAD ]</span>' +
          '</div>' +
          '<input type="file" id="modal-file-input" style="display:none" accept="image/*" onchange="window.uploadArtistImage(this.files[0], \\'' + artist.id + '\\')" />';
        imgContainer.style.display = 'block';
      };

      const cleanId = artist.id.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-');
      const predictedSrc = '/img/artists/' + cleanId + '.webp';
      
      const testImg = new Image();
      testImg.onload = function() { applySplitImage(predictedSrc); };
      testImg.onerror = function() {
        if (artist.imageSlot) {
          const testOrig = new Image();
          testOrig.onload = function() { applySplitImage(artist.imageSlot); };
          testOrig.onerror = function() { showUploadFallback(); };
          testOrig.src = artist.imageSlot;
        } else {
          showUploadFallback();
        }
      };
      testImg.src = predictedSrc + '?t=' + Date.now();

      const promptBox = document.getElementById('modal-prompt-box');
      promptBox.dataset.base = artist.promptPrefix;
      promptBox.textContent = artist.promptPrefix;
      document.getElementById('modal-weight-slider').value = 1.0;
      document.getElementById('modal-weight-val').innerText = "1.0";
      
      window.updateDynamicPrompt = function(weight) {
        const base = promptBox.dataset.base;
        if (!base) return;
        if (parseFloat(weight) === 1.0) {
          promptBox.textContent = base;
        } else {
          // Wrap in standard A1111/Comfy syntax
          promptBox.textContent = "(" + base + ":" + weight + ")";
        }
      };

      window.copyPromptText = function() {
        const text = promptBox.textContent;
        navigator.clipboard.writeText(text);
        showToast('[COPIED TO CLIPBOARD]');
      };
      
      const lifespan = (artist.born || artist.death) 
        ? (artist.born || '?') + ' - ' + (artist.death || 'Present')
        : 'N/A';
      document.getElementById('modal-lifespan').textContent = lifespan;
      document.getElementById('modal-checkpoint').textContent = artist.checkpoint || 'N/A';
      
      document.getElementById('modal-description').textContent = artist.description || artist.promptPrefix;
      document.getElementById('modal-known').textContent = artist.knownFor || 'Visual arts';

      // Set add button onclick
      const addBtn = document.getElementById('modal-btn-add');
      addBtn.onclick = function() {
        addArtistToMain(artist.id, addBtn);
      };

      // Set wiki link
      const wikiBtn = document.getElementById('modal-btn-wiki');
      wikiBtn.href = 'https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(artist.name);

      // Set category tags
      const tagsRow = document.getElementById('modal-categories-row');
      let tagsHtml = '';
      artist.categories.forEach(c => {
        const tagColor = getCategoryColor(c);
        tagsHtml += '<span class="tag-pill" style="color:' + tagColor + '; background:' + tagColor + '18; border-color:' + tagColor + '44;">' + c + '</span>';
      });
      tagsRow.innerHTML = tagsHtml;

      toggleDetailsModal(true);
    }

    function toggleDetailsModal(show) {
      const modal = document.getElementById('details-modal');
      if (show) {
        modal.classList.add('visible');
      } else {
        modal.classList.remove('visible');
      }
    }

    function closeDetailsModal(event) {
      if (event.target === document.getElementById('details-modal')) {
        toggleDetailsModal(false);
      }
    }

    function copyPromptText() {
      const txt = document.getElementById('modal-prompt-box').textContent;
      navigator.clipboard.writeText(txt);
      showToast('[COPIED PROMPT PREFIX]');
    }

    // Search Input Listener
    document.getElementById('search-input').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderArtists();
    });

    // Notify opener on unload
    window.addEventListener('beforeunload', () => {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'BONZO_WINDOW_CLOSED', windowType: 'wildcards' }, '*');
      }
    });

    // Initial render
    renderCategories();
    renderArtists();
  </script>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// HTML GENERATOR: VIDEO CONFIG WINDOW (PART 3)
// ══════════════════════════════════════════════════════════════════════════════
export function renderAudioStudioHTML(): string {
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
  <title>AUDIO & CAPTIONS // BONZO AI STUDIO</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; border-radius: 0 !important; }
    body { background: #0b0d12; color: #d4d4d8; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; overflow-x: hidden; display: flex; flex-direction: column; min-height: 100vh; }
    .header { background: #11131a; border-bottom: 1px solid #1f2937; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10; }
    .title { font-family: ui-monospace, monospace; color: #ffffff; font-weight: 800; font-size: 11px; }
    .btn-x { background: #181b22; border: 1px solid #1f2937; color: #9ca3af; padding: 2px 6px; font-family: ui-monospace, monospace; cursor: pointer; }
    .btn-x:hover { background: #ef4444; color: #ffffff; border-color: #ef4444; }
    .container { padding: 12px; display: flex; flex-direction: column; gap: 12px; flex: 1; padding-bottom: 80px; }
    
    .panel { background: #11131a; border: 1px solid #1f2937; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
    .panel-title { font-family: ui-monospace, monospace; color: #8b5cf6; font-size: 11px; font-weight: 800; border-bottom: 1px solid #1f2937; padding-bottom: 6px; }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-family: ui-monospace, monospace; font-size: 9px; color: #9ca3af; text-transform: uppercase; font-weight: 700; }
    .form-input { background: #0b0d12; border: 1px solid #1f2937; color: #ffffff; font-family: ui-monospace, monospace; font-size: 10px; padding: 6px; outline: none; }
    .form-input:focus { border-color: #8b5cf6; }
    textarea.form-input { resize: vertical; min-height: 50px; font-family: inherit; }
    
    .btn-action { background: #181b22; border: 1px solid #1f2937; color: #8b5cf6; font-family: ui-monospace, monospace; font-size: 10px; font-weight: 800; padding: 8px; cursor: pointer; text-transform: uppercase; margin-top: 4px; display: flex; justify-content: center; align-items: center; gap: 6px; }
    .btn-action:hover { background: #1f232b; color: #a78bfa; border-color: #8b5cf6; }
    
    /* Player Footer */
    .player-bar { background: #0b0d12; border-top: 1px solid #1f2937; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; position: fixed; bottom: 0; left: 0; right: 0; z-index: 20; box-shadow: 0 -4px 10px rgba(0,0,0,0.5); }
    .player-controls { display: flex; align-items: center; gap: 10px; flex: 1; }
    .btn-play { background: #181b22; border: 1px solid #1f2937; color: #ffffff; font-family: ui-monospace, monospace; font-size: 10px; padding: 6px 12px; cursor: pointer; }
    .btn-play:hover { background: #1f232b; border-color: #8b5cf6; color: #8b5cf6; }
    .visualizer { display: flex; gap: 2px; align-items: center; height: 16px; margin: 0 10px; flex: 1; overflow: hidden; }
    .visualizer span { width: 3px; background: #374151; height: 4px; display: inline-block; transition: 0.1s; }
    .visualizer.active span { background: #8b5cf6; }
    .time-display { font-family: ui-monospace, monospace; color: #9ca3af; font-size: 9px; margin-right: 15px; }
    
    .volume-control { display: flex; align-items: center; gap: 6px; margin-left: 10px; margin-right: 15px; }
    .vol-icon { font-size: 11px; color: #9ca3af; }
    .vol-slider { -webkit-appearance: none; width: 40px; height: 3px; background: #374151; outline: none; }
    .vol-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 8px; height: 8px; background: #8b5cf6; cursor: pointer; border-radius: 0; }
    
    .btn-send { background: #8b5cf6; border: 1px solid #8b5cf6; color: #0b0d12; font-family: ui-monospace, monospace; font-size: 10px; font-weight: 800; padding: 6px 14px; cursor: pointer; text-transform: uppercase; }
    .btn-send:hover { background: #7c3aed; }
    .btn-send:disabled { background: #1f2937; border-color: #1f2937; color: #6b7280; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title"><span style="color:#8b5cf6;">[AUDIO & CAPTIONS STUDIO]</span></div>
    <button class="btn-x" onclick="window.close()">[X]</button>
  </div>
  
  <div class="container">
    <!-- VOICE OVER (TTS) -->
    <div class="panel">
      <div class="panel-title">[VOICE GENERATOR]</div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Provider</label>
          <select class="form-input"><option>ELEVENLABS API</option><option>OPENAI TTS</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Voice Model</label>
          <select class="form-input"><option>Adam (Deep)</option><option>Rachel (Calm)</option><option>Marcus (Narrator)</option></select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Dialogue Text</label>
        <textarea class="form-input" placeholder="Type script here to generate voiceover..."></textarea>
      </div>
      <button class="btn-action" onclick="window.generateAsset('VOICE', 'Adam Voiceover')">[ GENERATE VOICE ]</button>
    </div>

    <!-- SOUND EFFECTS (SFX) & MUSIC -->
    <div class="panel">
      <div class="panel-title" style="color:#d4a574;">[SFX & MUSIC GENERATOR]</div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Engine</label>
          <select class="form-input"><option>SUNO API</option><option>UDIO API</option><option>ELEVENLABS SFX</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Duration</label>
          <select class="form-input"><option>3 Seconds (SFX)</option><option>15 Seconds</option><option>30 Seconds (Music)</option></select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Audio Prompt</label>
        <textarea class="form-input" placeholder="Cinematic bass drop with metallic hit..."></textarea>
      </div>
      <button class="btn-action" style="color:#d4a574; border-color:#1f2937;" onclick="window.generateAsset('SFX', 'Cinematic Bass Drop')">[ GENERATE SFX/MUSIC ]</button>
    </div>

    <!-- CAPTIONS & SUBTITLES -->
    <div class="panel">
      <div class="panel-title" style="color:#38bdf8;">[CAPTIONS & TYPOGRAPHY]</div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Font Family</label>
          <select class="form-input"><option>Bebas Neue</option><option>Inter (Bold)</option><option>Cinzel</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Text Color</label>
          <select class="form-input"><option>#FFFFFF (White)</option><option>#FBBF24 (Yellow)</option><option>#10B981 (Green)</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Stroke / Outline</label>
          <select class="form-input"><option>Thick Black</option><option>Thin Black</option><option>None</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Animation Preset</label>
          <select class="form-input"><option>Pop-In Word by Word</option><option>Fade Line</option><option>Typewriter</option></select>
        </div>
      </div>
      <button class="btn-action" style="color:#38bdf8; border-color:#1f2937;" onclick="window.generateAsset('CAPTIONS', 'Caption Style Applied')">[ GENERATE CAPTIONS STYLE ]</button>
    </div>
  </div>

  <!-- PLAYER FOOTER -->
  <div class="player-bar">
    <div class="player-controls">
      <button class="btn-play" id="playBtn" onclick="window.togglePlay()" disabled>[ PLAY ]</button>
      <div class="visualizer" id="viz">
        <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="time-display" id="timeDisplay">0:00 / 0:00</div>
      <div class="volume-control">
        <span class="vol-icon">🔊</span>
        <input type="range" min="0" max="100" value="75" class="vol-slider" title="Volume">
      </div>
    </div>
    <button class="btn-send" id="sendBtn" onclick="window.sendToTimeline()" disabled>[ SEND TO TIMELINE ]</button>
  </div>

  <!-- TOAST NOTIFICATION -->
  <div id="toast" style="position:fixed; top:45%; left:50%; transform:translate(-50%, -50%); background:#10b981; color:#0b0d12; font-family:monospace; font-size:11px; font-weight:bold; padding:8px 16px; opacity:0; transition:0.2s; pointer-events:none; z-index: 100;">[ASSET ADDED]</div>

  <script>
    let activeAsset = null;
    let activeLabel = null;
    let isPlaying = false;
    let playInterval = null;
    let currentTime = 0;
    let duration = 3000; // 3 seconds mock duration
    
    function updateVisualizer() {
      const spans = document.querySelectorAll('#viz span');
      spans.forEach(s => {
        s.style.height = isPlaying ? (Math.random() * 12 + 4) + 'px' : '4px';
      });
    }

    function formatTime(ms) {
      const totalSeconds = Math.floor(ms / 1000);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    window.togglePlay = function() {
      if(!activeAsset) return;
      isPlaying = !isPlaying;
      
      const playBtn = document.getElementById('playBtn');
      const viz = document.getElementById('viz');
      
      if(isPlaying) {
        playBtn.innerText = '[ STOP ]';
        viz.classList.add('active');
        if(currentTime >= duration) currentTime = 0;
        
        playInterval = setInterval(() => {
          currentTime += 50;
          if(currentTime >= duration) {
             window.togglePlay(); // stop
             currentTime = duration;
          }
          document.getElementById('timeDisplay').innerText = formatTime(currentTime) + ' / ' + formatTime(duration);
          updateVisualizer();
        }, 50);
      } else {
        playBtn.innerText = '[ PLAY ]';
        viz.classList.remove('active');
        clearInterval(playInterval);
        updateVisualizer();
      }
    };

    window.generateAsset = function(type, label) {
      activeAsset = type;
      activeLabel = label;
      
      // Reset Player State
      if(isPlaying) window.togglePlay();
      currentTime = 0;
      duration = (type === 'SFX') ? 3000 : (type === 'VOICE' ? 5000 : 10000); // mock durations
      
      document.getElementById('playBtn').disabled = false;
      document.getElementById('sendBtn').disabled = false;
      document.getElementById('sendBtn').innerText = '[ SEND ' + type + ' ]';
      document.getElementById('timeDisplay').innerText = formatTime(currentTime) + ' / ' + formatTime(duration);
      
      // Auto Play
      window.togglePlay();
    };

    window.sendToTimeline = function() {
      if(!activeAsset) return;
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'BONZO_TIMELINE_ADD_ASSET', assetType: activeAsset, label: activeLabel }, '*');
        
        // Show Toast
        const toast = document.getElementById('toast');
        toast.innerText = '[SENT TO TIMELINE: ' + activeAsset + ']';
        toast.style.opacity = 1;
        setTimeout(() => toast.style.opacity = 0, 1500);
      }
    };

    window.addEventListener('beforeunload', () => {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'BONZO_WINDOW_CLOSED', windowType: 'audioStudio' }, '*');
      }
    });
  </script>
</body>
</html>`;
}

import { renderWorkflowsHTML as _renderWorkflowsHTML } from './workflowHTML';
const renderWorkflowsHTML = _renderWorkflowsHTML;
export { renderWorkflowsHTML };

// ══════════════════════════════════════════════════════════════════════════════
// WINDOW OPENERS & TOGGLE LOGIC (PART 2, 3, 4, 5)
// ══════════════════════════════════════════════════════════════════════════════

export function openWildcardsWindow(): Window | null {
  if (typeof window === 'undefined') return null;

  const w = 420;
  const h = Math.max(500, (window.screen.availHeight || 800) - 100);
  const left = Math.max(0, (window.screen.availWidth || 1200) - w - 40);
  const top = 50;

  try {
    const win = window.open(
      '',
      'bonzo-wildcards',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!win) {
      console.warn('Wildcards popup was blocked by browser.');
      return null;
    }

    win.document.open();
    win.document.write(renderWildcardsHTML());
    win.document.close();

    win.onbeforeunload = () => {
      updateButtonState('wildcards', false, null);
    };

    updateButtonState('wildcards', true, win);
    return win;
  } catch (err) {
    console.error('Failed to open Wildcards window:', err);
    return null;
  }
}

export function openAudioStudioWindow(): Window | null {
  if (typeof window === 'undefined') return null;

  const w = 480;
  const h = 750;
  const left = Math.max(20, (window.screen.availWidth || 1200) - w - 480);
  const top = 50;

  try {
    const win = window.open(
      '',
      'bonzo-audiostudio',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!win) {
      console.warn('Audio Studio popup was blocked by browser.');
      return null;
    }

    win.document.open();
    win.document.write(renderAudioStudioHTML());
    win.document.close();

    win.onbeforeunload = () => {
      updateButtonState('audioStudio', false, null);
    };

    updateButtonState('audioStudio', true, win);
    return win;
  } catch (err) {
    console.error('Failed to open Audio Studio window:', err);
    return null;
  }
}

export function openWorkflowsWindow(): Window | null {
  if (typeof window === 'undefined') return null;

  const w = 900;
  const h = 700;
  const left = Math.max(40, Math.floor(((window.screen.availWidth || 1200) - w) / 2));
  const top = 60;

  try {
    const win = window.open(
      '',
      'bonzo-workflows',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!win) {
      console.warn('Workflows popup was blocked by browser.');
      return null;
    }

    win.document.open();
    win.document.write(renderWorkflowsHTML());
    win.document.close();

    // Send API keys to popout window on request
    const keyMsgHandler = (e: MessageEvent) => {
      if (e.data?.type === 'BONZO_WORKFLOW_REQUEST_KEYS') {
        const keys: Record<string, string> = {};
        for (const keyName of ['GEMINI_API_KEY', 'FAL_KEY', 'REPLICATE_API_TOKEN', 'OPENAI_API_KEY']) {
          const val = getKey(keyName);
          if (val) keys[keyName] = val;
        }
        win.postMessage({ type: 'BONZO_WORKFLOW_KEYS_RESPONSE', keys }, '*');
      }
    };
    window.addEventListener('message', keyMsgHandler);

    win.onbeforeunload = () => {
      window.removeEventListener('message', keyMsgHandler);
      updateButtonState('workflows', false, null);
    };

    updateButtonState('workflows', true, win);
    return win;
  } catch (err) {
    console.error('Failed to open Workflows window:', err);
    return null;
  }
}

export function toggleWindow(type: WindowType): void {
  const current = WINDOW_STATES[type];

  if (current.open && current.ref && !current.ref.closed) {
    try {
      current.ref.close();
    } catch (e) {
      console.warn('Error closing window:', e);
    }
    updateButtonState(type, false, null);
  } else {
    switch (type) {
      case 'wildcards':
        openWildcardsWindow();
        break;
      case 'audioStudio':
        openAudioStudioWindow();
        break;
      case 'workflows':
        openWorkflowsWindow();
        break;
    }
  }
}
