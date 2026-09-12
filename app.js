/**
 * ============================================================
 * BANGLA FONT LIBRARY — app.js
 * Production-ready vanilla JavaScript ES6+
 * Supports 500+ fonts with lazy loading, pagination,
 * bulk ZIP download, dark mode, search, filter, sort.
 * ============================================================
 */

'use strict';

/* ── CONSTANTS ──────────────────────────────────────────────── */
const FONTS_JSON_URL   = 'fonts.json';
const FONTS_PER_PAGE   = 24;       // cards per page
const DEFAULT_PREVIEW  = 'বাংলা ভাষার সৌন্দর্য';
const ZIP_FILENAME     = 'Bangla-Fonts.zip';
const LS_THEME_KEY     = 'bfl-theme';
const LS_PREVIEW_KEY   = 'bfl-preview';
const LAZY_ROOT_MARGIN = '200px';   // load font when card is 200px away from viewport

/* ── APPLICATION STATE ──────────────────────────────────────── */
const state = {
  allFonts:        [],   // raw data from fonts.json
  filteredFonts:   [],   // after search + filter + sort
  selectedIds:     new Set(),
  loadedFonts:     new Set(), // font-face already injected
  currentPage:     1,
  totalPages:      1,
  searchQuery:     '',
  activeFilter:    'all',
  sortOrder:       'name-asc',
  previewText:     DEFAULT_PREVIEW,
  fontSize:        28,
  letterSpacing:   0,
  lineHeight:      1.4,
  textAlign:       'left',
  isLoading:       true,
  modalFont:       null,
};

/* ── DOM REFERENCES ─────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const dom = {
  body:             document.body,
  fontGrid:         $('font-grid'),
  loadingState:     $('loading-state'),
  emptyState:       $('empty-state'),
  errorState:       $('error-state'),
  errorMessage:     $('error-message'),
  retryBtn:         $('retry-btn'),
  clearFiltersBtn:  $('clear-filters-btn'),
  resultsCount:     $('results-count'),
  heroCount:        $('hero-font-count'),
  statTotal:        $('stat-total'),
  statTTF:          $('stat-ttf'),
  statOTF:          $('stat-otf'),
  paginationWrap:   $('pagination-wrap'),
  pagination:       $('pagination'),
  pageInfoText:     $('page-info-text'),
  selectionBar:     $('selection-bar'),
  selectionCount:   $('selection-count-text'),
  clearSelectionBtn:$('clear-selection-btn'),
  downloadSelected: $('download-selected-btn'),
  selectAllBtn:     $('select-all-btn'),
  deselectAllBtn:   $('deselect-all-btn'),
  sortSelect:       $('sort-select'),
  themeToggle:      $('theme-toggle'),
  // search inputs (synced)
  headerSearch:     $('header-search-input'),
  headerSearchClear:$('header-search-clear'),
  heroSearch:       $('hero-search-input'),
  heroSearchClear:  $('hero-search-clear'),
  mobileSearch:     $('mobile-search-input'),
  mobileMenuToggle: $('mobile-menu-toggle'),
  mobileMenu:       $('mobile-menu'),
  // preview controls
  previewTextInput: $('preview-text-input'),
  fontSizeSlider:   $('font-size-slider'),
  fontSizeValue:    $('font-size-value'),
  letterSpacingSlider: $('letter-spacing-slider'),
  letterSpacingValue:  $('letter-spacing-value'),
  lineHeightSlider: $('line-height-slider'),
  lineHeightValue:  $('line-height-value'),
  resetPreview:     $('reset-preview'),
  // modal
  modalOverlay:     $('modal-overlay'),
  modalFontName:    $('modal-font-name'),
  modalMeta:        $('modal-meta'),
  modalPreviewText: $('modal-preview-text'),
  modalPreviewArea: $('modal-preview-area'),
  modalInfoGrid:    $('modal-info-grid'),
  modalTextInput:   $('modal-text-input'),
  modalSizeSlider:  $('modal-size-slider'),
  modalSizeValue:   $('modal-size-value'),
  modalDownloadBtn: $('modal-download-btn'),
  modalClose:       $('modal-close'),
  modalCloseBtn:    $('modal-close-btn'),
  // progress
  progressOverlay:  $('progress-overlay'),
  progressText:     $('progress-text'),
  progressBar:      $('progress-bar'),
  progressSub:      $('progress-sub'),
  // footer
  footerYear:       $('footer-year'),
  toastContainer:   $('toast-container'),
};

/* ── INTERSECTION OBSERVER for lazy font loading ────────────── */
let fontObserver = null;

function initFontObserver() {
  if (!('IntersectionObserver' in window)) return;
  fontObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const fontId = card.dataset.fontId;
        if (fontId) {
          const font = state.allFonts.find(f => f.id === fontId);
          if (font) loadFont(font);
        }
        fontObserver.unobserve(card);
      }
    });
  }, { rootMargin: LAZY_ROOT_MARGIN });
}

/* ══════════════════════════════════════════════════════════════
   CORE: loadFonts()  — fetch fonts.json
   ══════════════════════════════════════════════════════════════ */
async function loadFonts() {
  showState('loading');
  try {
    const res = await fetch(FONTS_JSON_URL, { cache: 'default' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    // Normalize & validate
    state.allFonts = data
      .filter(f => f && f.file && f.name)
      .map((f, i) => ({
        id:       f.id       || `font-${i}`,
        name:     f.name     || 'Unknown',
        file:     f.file,
        format:   (f.format  || 'TTF').toUpperCase(),
        size:     f.size     || '—',
        sizeBytes:f.sizeBytes || 0,
        category: f.category || 'Bangla',
        license:  f.license  || 'Unknown',
        folder:   f.folder   || null,
      }));

    updateStats();
    applySearchFilterSort();

  } catch (err) {
    console.error('[BFL] Failed to load fonts.json:', err);
    dom.errorMessage.textContent = `fonts.json লোড করা সম্ভব হয়নি। (${err.message})`;
    showState('error');
  }
}

/* ── Update hero statistics ────────────────────────────────── */
function updateStats() {
  const total = state.allFonts.length;
  const ttf   = state.allFonts.filter(f => f.format === 'TTF').length;
  const otf   = state.allFonts.filter(f => f.format === 'OTF').length;

  dom.heroCount.textContent = total;
  animateCounter(dom.statTotal, total);
  animateCounter(dom.statTTF, ttf);
  animateCounter(dom.statOTF, otf);
}

function animateCounter(el, target) {
  let start = 0;
  const step = Math.ceil(target / 40);
  const interval = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = start.toLocaleString('bn-BD');
    if (start >= target) clearInterval(interval);
  }, 20);
}

/* ══════════════════════════════════════════════════════════════
   SEARCH / FILTER / SORT
   ══════════════════════════════════════════════════════════════ */
function filterFonts(fonts) {
  const q = state.searchQuery.toLowerCase().trim();
  const f = state.activeFilter;

  return fonts.filter(font => {
    // Format filter
    if (f !== 'all' && font.format !== f) return false;

    // Search
    if (q) {
      const haystack = [font.name, font.id, font.category, font.format]
        .join(' ').toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });
}

function sortFonts(fonts) {
  const sorted = [...fonts];
  switch (state.sortOrder) {
    case 'name-asc':   return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':  return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'size-asc':   return sorted.sort((a, b) => a.sizeBytes - b.sizeBytes);
    case 'size-desc':  return sorted.sort((a, b) => b.sizeBytes - a.sizeBytes);
    default:           return sorted;
  }
}

function applySearchFilterSort() {
  const filtered = filterFonts(state.allFonts);
  state.filteredFonts = sortFonts(filtered);
  state.currentPage = 1;
  state.totalPages  = Math.ceil(state.filteredFonts.length / FONTS_PER_PAGE);
  renderFonts();
}

/* ══════════════════════════════════════════════════════════════
   RENDER: renderFonts() — build the page
   ══════════════════════════════════════════════════════════════ */
function renderFonts() {
  const total = state.filteredFonts.length;

  if (total === 0) {
    showState('empty');
    dom.paginationWrap.hidden = true;
    dom.resultsCount.textContent = 'কোনো ফন্ট পাওয়া যায়নি';
    return;
  }

  showState('none');

  // Paginate
  const start = (state.currentPage - 1) * FONTS_PER_PAGE;
  const end   = Math.min(start + FONTS_PER_PAGE, total);
  const page  = state.filteredFonts.slice(start, end);

  // Results count
  dom.resultsCount.textContent =
    `${start + 1}–${end} / ${total} টি ফন্ট দেখানো হচ্ছে`;

  // Render cards
  dom.fontGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  page.forEach(font => fragment.appendChild(createFontCard(font)));
  dom.fontGrid.appendChild(fragment);

  // Observe cards for lazy font loading
  if (fontObserver) {
    dom.fontGrid.querySelectorAll('.font-card').forEach(card => {
      fontObserver.observe(card);
    });
  }

  // Pagination
  renderPagination(total);
}

/* ── Create a single font card ─────────────────────────────── */
function createFontCard(font) {
  const isSelected = state.selectedIds.has(font.id);
  const isLoaded   = state.loadedFonts.has(font.id);

  const card = document.createElement('article');
  card.className = `font-card${isSelected ? ' selected' : ''}`;
  card.dataset.fontId = font.id;
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', `${font.name} ফন্ট`);

  card.innerHTML = `
    <div class="card-header">
      <div class="card-checkbox-wrap">
        <input
          type="checkbox"
          class="card-checkbox"
          id="chk-${font.id}"
          aria-label="${font.name} নির্বাচন করুন"
          ${isSelected ? 'checked' : ''}
        />
      </div>
      <div class="card-info">
        <div class="card-name" title="${escapeHtml(font.name)}">${escapeHtml(font.name)}</div>
        <div class="card-badges">
          <span class="badge badge-format">${font.format}</span>
          <span class="badge badge-size">${font.size}</span>
        </div>
      </div>
    </div>

    <div class="card-preview" aria-label="${escapeHtml(font.name)} ফন্টে প্রিভিউ">
      <div
        class="card-preview-text${isLoaded ? '' : ' loading'}"
        style="
          font-family: '${font.id}', serif;
          font-size: ${state.fontSize}px;
          letter-spacing: ${state.letterSpacing}px;
          line-height: ${state.lineHeight};
          text-align: ${state.textAlign};
        "
        data-preview-target="${font.id}"
      >${escapeHtml(state.previewText)}</div>
    </div>

    <div class="card-footer">
      <button
        class="card-btn card-btn-preview"
        data-action="preview"
        data-font-id="${font.id}"
        aria-label="${font.name} ফন্টের বিস্তারিত প্রিভিউ"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        প্রিভিউ
      </button>
      <button
        class="card-btn card-btn-download"
        data-action="download"
        data-font-id="${font.id}"
        aria-label="${font.name} ডাউনলোড করুন"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        ডাউনলোড
      </button>
    </div>
  `;

  // Checkbox change
  const checkbox = card.querySelector('.card-checkbox');
  checkbox.addEventListener('change', () => selectFont(font.id, checkbox.checked));

  // Button clicks via delegation on card
  card.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const fontId = btn.dataset.fontId;
    if (action === 'preview')  openPreviewModal(fontId);
    if (action === 'download') downloadFont(fontId);
  });

  return card;
}

/* ══════════════════════════════════════════════════════════════
   FONT LOADING — dynamic @font-face injection
   ══════════════════════════════════════════════════════════════ */
function loadFont(font) {
  if (state.loadedFonts.has(font.id)) return;

  // Mark as loading so we don't double-load
  state.loadedFonts.add(font.id);

  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: '${font.id}';
      src: url('${encodeFilePath(font.file)}') format('${fontFormat(font.format)}');
      font-display: swap;
    }
  `;
  document.head.appendChild(style);

  // When font loads, remove shimmer class
  if ('FontFace' in window) {
    const ff = new FontFace(font.id, `url('${encodeFilePath(font.file)}')`);
    ff.load().then(() => {
      document.fonts.add(ff);
      removeLoadingState(font.id);
    }).catch(() => {
      // Font failed — remove loading shimmer anyway, show text with fallback
      removeLoadingState(font.id);
    });
  } else {
    // Fallback: remove shimmer after a short delay
    setTimeout(() => removeLoadingState(font.id), 500);
  }
}

function removeLoadingState(fontId) {
  document.querySelectorAll(`[data-preview-target="${fontId}"]`).forEach(el => {
    el.classList.remove('loading');
  });
}

function fontFormat(format) {
  switch (format.toUpperCase()) {
    case 'TTF':  return 'truetype';
    case 'OTF':  return 'opentype';
    case 'WOFF': return 'woff';
    case 'WOFF2':return 'woff2';
    default:     return 'truetype';
  }
}

function encodeFilePath(filePath) {
  // Encode each path segment separately, preserve slashes
  return filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
}

/* ══════════════════════════════════════════════════════════════
   SELECTION SYSTEM
   ══════════════════════════════════════════════════════════════ */
function selectFont(fontId, selected) {
  if (selected) {
    state.selectedIds.add(fontId);
  } else {
    state.selectedIds.delete(fontId);
  }
  updateSelectionUI(fontId, selected);
  updateSelectionBar();
}

function updateSelectionUI(fontId, selected) {
  const card = dom.fontGrid.querySelector(`[data-font-id="${fontId}"]`);
  if (!card) return;
  card.classList.toggle('selected', selected);
  const checkbox = card.querySelector('.card-checkbox');
  if (checkbox) checkbox.checked = selected;
}

function updateSelectionBar() {
  const count = state.selectedIds.size;
  dom.selectionBar.hidden = count === 0;
  dom.selectionCount.textContent = `${toBengaliNumber(count)}টি ফন্ট নির্বাচিত`;
  dom.deselectAllBtn.hidden = count === 0;
}

function selectAllFonts() {
  // Select ALL filtered fonts, not just current page
  state.filteredFonts.forEach(font => state.selectedIds.add(font.id));
  // Update visible cards
  dom.fontGrid.querySelectorAll('.font-card').forEach(card => {
    card.classList.add('selected');
    const cb = card.querySelector('.card-checkbox');
    if (cb) cb.checked = true;
  });
  updateSelectionBar();
}

function deselectAllFonts() {
  state.selectedIds.clear();
  dom.fontGrid.querySelectorAll('.font-card').forEach(card => {
    card.classList.remove('selected');
    const cb = card.querySelector('.card-checkbox');
    if (cb) cb.checked = false;
  });
  updateSelectionBar();
}

/* ══════════════════════════════════════════════════════════════
   DOWNLOAD: individual font
   ══════════════════════════════════════════════════════════════ */
function downloadFont(fontId) {
  const font = state.allFonts.find(f => f.id === fontId);
  if (!font) return;

  const btn = dom.fontGrid.querySelector(`[data-action="download"][data-font-id="${fontId}"]`);
  if (btn) btn.classList.add('downloading');

  const a = document.createElement('a');
  a.href = font.file;
  a.download = font.file.split('/').pop(); // filename only
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    if (btn) btn.classList.remove('downloading');
    showToast(`${font.name} ডাউনলোড শুরু হয়েছে`, 'success');
  }, 600);
}

/* ══════════════════════════════════════════════════════════════
   BULK DOWNLOAD — ZIP using JSZip
   ══════════════════════════════════════════════════════════════ */
async function downloadSelectedFonts() {
  if (state.selectedIds.size === 0) {
    showToast('কোনো ফন্ট নির্বাচিত নেই', 'warning');
    return;
  }

  if (typeof JSZip === 'undefined') {
    showToast('ZIP লাইব্রেরি লোড হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।', 'error');
    return;
  }

  const selectedFonts = state.allFonts.filter(f => state.selectedIds.has(f.id));
  const total = selectedFonts.length;

  showProgressOverlay();
  updateProgress('শুরু হচ্ছে...', 0, '');

  const zip  = new JSZip();
  let   done = 0;
  const errors = [];

  for (const font of selectedFonts) {
    done++;
    const label = `${toBengaliNumber(done)} / ${toBengaliNumber(total)} ডাউনলোড হচ্ছে`;
    updateProgress(label, (done / total) * 80, font.name);

    try {
      const res = await fetch(font.file);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const filename = font.file.split('/').pop();
      zip.file(filename, blob);
    } catch (err) {
      console.warn(`[BFL] Could not fetch ${font.file}:`, err);
      errors.push(font.name);
    }
  }

  updateProgress('ZIP তৈরি হচ্ছে...', 85, '');

  try {
    const content = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } },
      (meta) => {
        updateProgress(
          'ZIP তৈরি হচ্ছে...',
          85 + meta.percent * 0.14,
          `${Math.round(meta.percent)}% সম্পন্ন`
        );
      }
    );

    updateProgress('ডাউনলোড হচ্ছে...', 100, '');

    const url = URL.createObjectURL(content);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = ZIP_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    hideProgressOverlay();

    if (errors.length > 0) {
      showToast(`ZIP ডাউনলোড হয়েছে। ${errors.length}টি ফন্ট যোগ করা সম্ভব হয়নি।`, 'warning', 5000);
    } else {
      showToast(`${toBengaliNumber(total)}টি ফন্ট ZIP হিসেবে ডাউনলোড হয়েছে!`, 'success');
    }
  } catch (err) {
    console.error('[BFL] ZIP generation failed:', err);
    hideProgressOverlay();
    showToast('ZIP তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
  }
}

function showProgressOverlay() {
  dom.progressOverlay.hidden = false;
}

function hideProgressOverlay() {
  dom.progressOverlay.hidden = true;
}

function updateProgress(text, percent, sub) {
  dom.progressText.textContent = text;
  dom.progressBar.style.width  = `${Math.min(percent, 100)}%`;
  dom.progressSub.textContent  = sub || '';
}

/* ══════════════════════════════════════════════════════════════
   MODAL: Font Preview
   ══════════════════════════════════════════════════════════════ */
function openPreviewModal(fontId) {
  const font = state.allFonts.find(f => f.id === fontId);
  if (!font) return;

  state.modalFont = font;

  // Load font if not already
  loadFont(font);

  // Populate modal
  dom.modalFontName.textContent = font.name;
  dom.modalMeta.innerHTML = `
    <span>${font.format}</span>
    <span>•</span>
    <span>${font.size}</span>
    <span>•</span>
    <span>${font.license}</span>
  `;

  // Set preview text and styles
  const previewEl = dom.modalPreviewText;
  previewEl.textContent = state.previewText;
  previewEl.style.fontFamily = `'${font.id}', serif`;
  previewEl.style.fontSize   = '48px';
  dom.modalSizeSlider.value  = 48;
  dom.modalSizeValue.textContent = 48;
  dom.modalTextInput.value   = state.previewText;

  // Info grid
  dom.modalInfoGrid.innerHTML = `
    <div class="info-item">
      <div class="info-label">ফরম্যাট</div>
      <div class="info-value">${font.format}</div>
    </div>
    <div class="info-item">
      <div class="info-label">ফাইল সাইজ</div>
      <div class="info-value">${font.size}</div>
    </div>
    <div class="info-item">
      <div class="info-label">লাইসেন্স</div>
      <div class="info-value">${font.license}</div>
    </div>
    <div class="info-item">
      <div class="info-label">ক্যাটাগরি</div>
      <div class="info-value">${font.category}</div>
    </div>
    <div class="info-item">
      <div class="info-label">ফাইল নাম</div>
      <div class="info-value" style="word-break:break-all;font-size:12px;">${font.file.split('/').pop()}</div>
    </div>
    <div class="info-item">
      <div class="info-label">ফন্ট আইডি</div>
      <div class="info-value" style="font-size:12px;">${font.id}</div>
    </div>
  `;

  // Download button
  dom.modalDownloadBtn.onclick = () => downloadFont(font.id);

  // Show modal
  dom.modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  dom.modalClose.focus();
  trapFocus(dom.modalOverlay);
}

function closePreviewModal() {
  dom.modalOverlay.hidden = true;
  document.body.style.overflow = '';
  state.modalFont = null;
}

/* Focus trap for accessibility */
function trapFocus(element) {
  const focusable = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  function handleKeydown(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    if (element.hidden) element.removeEventListener('keydown', handleKeydown);
  }
  element.addEventListener('keydown', handleKeydown);
}

/* ══════════════════════════════════════════════════════════════
   updatePreview() — apply preview settings to all visible cards
   ══════════════════════════════════════════════════════════════ */
function updatePreview() {
  const targets = document.querySelectorAll('[data-preview-target]');
  targets.forEach(el => {
    el.textContent        = state.previewText;
    el.style.fontSize     = `${state.fontSize}px`;
    el.style.letterSpacing= `${state.letterSpacing}px`;
    el.style.lineHeight   = state.lineHeight;
    el.style.textAlign    = state.textAlign;
  });
  // Save preview text to localStorage
  try {
    localStorage.setItem(LS_PREVIEW_KEY, state.previewText);
  } catch(_) {}
}

/* ══════════════════════════════════════════════════════════════
   PAGINATION
   ══════════════════════════════════════════════════════════════ */
function renderPagination(total) {
  const totalPages = Math.ceil(total / FONTS_PER_PAGE);
  state.totalPages = totalPages;

  dom.paginationWrap.hidden = totalPages <= 1;
  if (totalPages <= 1) return;

  dom.pagination.innerHTML = '';
  const cur = state.currentPage;

  const addBtn = (label, page, isActive = false, isDisabled = false, isEllipsis = false) => {
    const btn = document.createElement('button');
    btn.className = `page-btn${isActive ? ' active' : ''}${isEllipsis ? ' ellipsis' : ''}`;
    btn.textContent = label;
    btn.disabled = isDisabled;
    btn.setAttribute('aria-label', isEllipsis ? '...' : `পেজ ${page}`);
    if (isActive) btn.setAttribute('aria-current', 'page');
    if (!isEllipsis && !isDisabled && !isActive) {
      btn.addEventListener('click', () => {
        state.currentPage = page;
        renderFonts();
        dom.fontGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    dom.pagination.appendChild(btn);
  };

  // Prev
  addBtn('←', cur - 1, false, cur === 1);

  // Page numbers with ellipsis
  const pages = getPaginationRange(cur, totalPages);
  pages.forEach(p => {
    if (p === '...') {
      addBtn('...', null, false, false, true);
    } else {
      addBtn(toBengaliNumber(p), p, p === cur);
    }
  });

  // Next
  addBtn('→', cur + 1, false, cur === totalPages);

  // Info
  dom.pageInfoText.textContent =
    `পেজ ${toBengaliNumber(cur)} / ${toBengaliNumber(totalPages)}`;
}

function getPaginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const range = [];
  if (current <= 4) {
    range.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    range.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    range.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return range;
}

/* ══════════════════════════════════════════════════════════════
   THEME: Dark / Light Mode
   ══════════════════════════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem(LS_THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;
  setTheme(isDark);
}

function setTheme(isDark) {
  dom.body.classList.toggle('dark-mode',  isDark);
  dom.body.classList.toggle('light-mode', !isDark);
  dom.themeToggle.setAttribute(
    'aria-label',
    isDark ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'
  );
  try {
    localStorage.setItem(LS_THEME_KEY, isDark ? 'dark' : 'light');
  } catch(_) {}
}

function toggleTheme() {
  setTheme(dom.body.classList.contains('light-mode'));
}

/* ══════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════════════════════════════ */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const icon = {
    success: '✓',
    error:   '✗',
    info:    'ℹ',
    warning: '⚠',
  }[type] || 'ℹ';

  toast.innerHTML = `<span style="font-size:16px">${icon}</span><span>${escapeHtml(message)}</span>`;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ══════════════════════════════════════════════════════════════
   STATE VISIBILITY HELPERS
   ══════════════════════════════════════════════════════════════ */
function showState(type) {
  dom.loadingState.hidden = type !== 'loading';
  dom.emptyState.hidden   = type !== 'empty';
  dom.errorState.hidden   = type !== 'error';
  if (type === 'none') {
    // grid is shown via content
    dom.fontGrid.style.display = '';
  } else {
    dom.fontGrid.style.display = 'none';
  }
}

/* ══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ══════════════════════════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toBengaliNumber(n) {
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(n).replace(/[0-9]/g, d => bn[d]);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ── Sync all search inputs ─────────────────────────────────── */
function syncSearchInputs(value) {
  dom.headerSearch.value = value;
  dom.heroSearch.value   = value;
  dom.mobileSearch.value = value;
  dom.headerSearchClear.hidden = !value;
  dom.heroSearchClear.hidden   = !value;
}

/* ══════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ══════════════════════════════════════════════════════════════ */
function initEventListeners() {

  /* ── Theme toggle ─────────────────────────── */
  dom.themeToggle.addEventListener('click', toggleTheme);

  /* ── Mobile menu toggle ───────────────────── */
  dom.mobileMenuToggle.addEventListener('click', () => {
    const isOpen = dom.mobileMenu.classList.toggle('open');
    dom.mobileMenuToggle.setAttribute('aria-expanded', isOpen);
    dom.mobileMenuToggle.setAttribute('aria-label', isOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন');
    if (isOpen) dom.mobileSearch.focus();
  });

  /* ── Search (all inputs synced) ──────────── */
  const onSearch = debounce((value) => {
    state.searchQuery = value;
    syncSearchInputs(value);
    applySearchFilterSort();
  }, 300);

  dom.headerSearch.addEventListener('input', e => onSearch(e.target.value));
  dom.heroSearch.addEventListener('input',   e => onSearch(e.target.value));
  dom.mobileSearch.addEventListener('input', e => onSearch(e.target.value));

  dom.headerSearchClear.addEventListener('click', () => onSearch(''));
  dom.heroSearchClear.addEventListener('click',   () => onSearch(''));

  /* ── Filter tabs ──────────────────────────── */
  $$('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.filter-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      state.activeFilter = tab.dataset.filter;
      applySearchFilterSort();
    });
  });

  /* ── Sort ─────────────────────────────────── */
  dom.sortSelect.addEventListener('change', () => {
    state.sortOrder = dom.sortSelect.value;
    applySearchFilterSort();
  });

  /* ── Select all / Deselect all ───────────── */
  dom.selectAllBtn.addEventListener('click', selectAllFonts);
  dom.deselectAllBtn.addEventListener('click', deselectAllFonts);

  /* ── Selection bar ───────────────────────── */
  dom.clearSelectionBtn.addEventListener('click', deselectAllFonts);
  dom.downloadSelected.addEventListener('click', downloadSelectedFonts);

  /* ── Clear filters button (empty state) ──── */
  dom.clearFiltersBtn.addEventListener('click', () => {
    state.searchQuery  = '';
    state.activeFilter = 'all';
    syncSearchInputs('');
    $$('.filter-tab').forEach((t, i) => {
      t.classList.toggle('active', i === 0);
      t.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    });
    applySearchFilterSort();
  });

  /* ── Retry button (error state) ──────────── */
  dom.retryBtn.addEventListener('click', loadFonts);

  /* ── Preview controls ────────────────────── */
  dom.previewTextInput.addEventListener('input', () => {
    state.previewText = dom.previewTextInput.value || DEFAULT_PREVIEW;
    updatePreview();
  });

  dom.fontSizeSlider.addEventListener('input', () => {
    state.fontSize = parseInt(dom.fontSizeSlider.value, 10);
    dom.fontSizeValue.textContent = state.fontSize;
    updatePreview();
  });

  dom.letterSpacingSlider.addEventListener('input', () => {
    state.letterSpacing = parseFloat(dom.letterSpacingSlider.value);
    dom.letterSpacingValue.textContent = state.letterSpacing;
    updatePreview();
  });

  dom.lineHeightSlider.addEventListener('input', () => {
    state.lineHeight = parseFloat(dom.lineHeightSlider.value);
    dom.lineHeightValue.textContent = state.lineHeight;
    updatePreview();
  });

  $$('.align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.align-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      state.textAlign = btn.dataset.align;
      updatePreview();
    });
  });

  dom.resetPreview.addEventListener('click', () => {
    state.previewText    = DEFAULT_PREVIEW;
    state.fontSize       = 28;
    state.letterSpacing  = 0;
    state.lineHeight     = 1.4;
    state.textAlign      = 'left';

    dom.previewTextInput.value       = DEFAULT_PREVIEW;
    dom.fontSizeSlider.value         = 28;
    dom.fontSizeValue.textContent    = 28;
    dom.letterSpacingSlider.value    = 0;
    dom.letterSpacingValue.textContent = 0;
    dom.lineHeightSlider.value       = 1.4;
    dom.lineHeightValue.textContent  = '1.4';

    $$('.align-btn').forEach((b, i) => {
      b.classList.toggle('active', i === 0);
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    });

    updatePreview();
    showToast('প্রিভিউ রিসেট হয়েছে', 'info');
  });

  /* ── Modal controls ──────────────────────── */
  dom.modalClose.addEventListener('click', closePreviewModal);
  dom.modalCloseBtn.addEventListener('click', closePreviewModal);

  dom.modalOverlay.addEventListener('click', e => {
    if (e.target === dom.modalOverlay) closePreviewModal();
  });

  dom.modalTextInput.addEventListener('input', () => {
    const text = dom.modalTextInput.value || DEFAULT_PREVIEW;
    dom.modalPreviewText.textContent = text;
  });

  dom.modalSizeSlider.addEventListener('input', () => {
    const size = parseInt(dom.modalSizeSlider.value, 10);
    dom.modalSizeValue.textContent = size;
    dom.modalPreviewText.style.fontSize = `${size}px`;
  });

  /* ── Keyboard: Escape closes modal ──────── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!dom.modalOverlay.hidden) closePreviewModal();
    }
  });

  /* ── Footer year ─────────────────────────── */
  dom.footerYear.textContent = new Date().getFullYear();

  /* ── Restore saved preview text ─────────── */
  try {
    const saved = localStorage.getItem(LS_PREVIEW_KEY);
    if (saved) {
      state.previewText = saved;
      dom.previewTextInput.value = saved;
    }
  } catch(_) {}
}

/* ══════════════════════════════════════════════════════════════
   INIT — entry point
   ══════════════════════════════════════════════════════════════ */
async function init() {
  initTheme();
  initFontObserver();
  initEventListeners();
  await loadFonts();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
