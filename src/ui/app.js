// ─── column definitions ────────────────────────────────────────────
const COLS = [
  { key:'check',  label:'',           w:32,  resizable:false },
  { key:'state',  label:'',           w:28,  resizable:false },
  { key:'name',   label:'Name',       w:300, resizable:true  },
  { key:'family', label:'Family',     w:140, resizable:true  },
  { key:'style',  label:'Style',      w:100, resizable:true  },
  { key:'size',   label:'Size',       w:90,  resizable:true  },
  { key:'lh',     label:'Line Ht',    w:110, resizable:true  },
  { key:'ls',     label:'Letter Sp',  w:100, resizable:true  },
  { key:'paraSp', label:'Para Sp',    w:90,  resizable:true  },
  { key:'indent', label:'Indent',     w:90,  resizable:true  },
  { key:'listSp', label:'List Sp',    w:80,  resizable:true  },
  { key:'case',   label:'Case',       w:80,  resizable:true  },
  { key:'deco',   label:'Decoration', w:85,  resizable:true  },
  { key:'lt',     label:'Lead Trim',  w:85,  resizable:true  },
  { key:'hangL',  label:'Hang List',  w:70,  resizable:true  },
  { key:'hangP',  label:'Hang Punct', w:70,  resizable:true  },
];

// ─── state ────────────────────────────────────────────────────────────────────────────────
let colWidths = COLS.map(c => c.w);
let styles = [];
let fontMap = {};
let variableList = [];
let variableMap = new Map();
let edits = new Map();
let applyStatus = new Map();
let nameFilter = '';
let bulkVarBindings = {};
let restoreAfterCanonicalReload = null;

function hasBulkVarBinding(field) {
  return Object.prototype.hasOwnProperty.call(bulkVarBindings, field);
}

function getFontStyles(family) {
  const stylesForFamily = fontMap[family];
  return Array.isArray(stylesForFamily) ? stylesForFamily : [];
}

function getValidStyleForFamily(family, preferredStyle) {
  const stylesForFamily = getFontStyles(family);
  if (!stylesForFamily.length) return preferredStyle || '';
  return stylesForFamily.includes(preferredStyle) ? preferredStyle : stylesForFamily[0];
}

function makeFontNameForFamily(family, preferredStyle) {
  return { family, style: getValidStyleForFamily(family, preferredStyle) };
}

function hideErrorPanel() {
  const ep = document.getElementById('errorPanel');
  ep.style.display = 'none';
  setChildren(ep, []);
}

function renderErrorPanel(title, messages) {
  const ep = document.getElementById('errorPanel');
  const strong = document.createElement('strong');
  strong.textContent = title;
  const nodes = [strong];
  if (messages.length) nodes.push(document.createTextNode(' '));
  messages.forEach((message, index) => {
    if (index > 0) nodes.push(document.createTextNode(' • '));
    nodes.push(document.createTextNode(message));
  });
  setChildren(ep, nodes);
  ep.style.display = 'block';
}

function requestCanonicalReload() {
  parent.postMessage({ pluginMessage: { type: 'load-styles' } }, '*');
}

// ─── header ─────────────────────────────────────────────────────────────────────────────
function buildHeader() {
  const cg = document.getElementById('colgroup');
  const hr = document.getElementById('headerRow');
  clearElement(cg);
  clearElement(hr);
  COLS.forEach((col, i) => {
    const c = document.createElement('col');
    c.style.width = colWidths[i] + 'px';
    cg.appendChild(c);

    const th = document.createElement('th');
    th.style.position = 'relative';
    if (col.key === 'check') {
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'selectAll';
      cb.addEventListener('change', onSelectAll);
      th.appendChild(cb);
    } else {
      const inner = document.createElement('div');
      inner.className = 'th-inner';
      const lbl = document.createElement('span');
      lbl.className = 'th-label';
      lbl.textContent = col.label;
      inner.appendChild(lbl);
      th.appendChild(inner);
    }
    if (col.resizable) {
      const handle = document.createElement('div');
      handle.className = 'th-resize';
      handle.addEventListener('mousedown', e => startResize(e, i));
      th.appendChild(handle);
    }
    hr.appendChild(th);
  });
}

// ─── column resize ────────────────────────────────────────────────────────────────────
let resizeState = null;
function startResize(e, colIdx) {
  e.preventDefault();
  resizeState = { colIdx, startX: e.clientX, startW: colWidths[colIdx] };
  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeUp);
}
function onResizeMove(e) {
  if (!resizeState) return;
  colWidths[resizeState.colIdx] = Math.max(30, resizeState.startW + (e.clientX - resizeState.startX));
  applyColWidths();
}
function onResizeUp() {
  resizeState = null;
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeUp);
  requestResize();
}
function applyColWidths() {
  document.querySelectorAll('#colgroup col').forEach((c, i) => { c.style.width = colWidths[i] + 'px'; });
}

// ─── name filter ─────────────────────────────────────────────────────────────────────────────
function getFilteredStyles() {
  if (!nameFilter) return styles;
  const q = nameFilter.toLowerCase();
  return styles.filter(s => s.name.toLowerCase().includes(q));
}

function refreshNameGroupList() {
  const dl = document.getElementById('nameGroupList');
  clearElement(dl);
  const groups = new Set();
  styles.forEach(s => {
    const parts = s.name.split('/');
    for (let i = 1; i < parts.length; i++) {
      groups.add(parts.slice(0, i).join('/'));
    }
  });
  [...groups].sort().forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    dl.appendChild(opt);
  });
}

document.getElementById('filterName').addEventListener('input', e => {
  nameFilter = e.target.value;
  e.target.classList.toggle('active', !!nameFilter);
  document.getElementById('clearFilterBtn').style.display = nameFilter ? '' : 'none';
  renderTable();
});

document.getElementById('clearFilterBtn').addEventListener('click', () => {
  nameFilter = '';
  const inp = document.getElementById('filterName');
  inp.value = '';
  inp.classList.remove('active');
  document.getElementById('clearFilterBtn').style.display = 'none';
  renderTable();
});

// ─── edit helpers ───────────────────────────────────────────────────────────────────────────
function getEdit(id) {
  if (!edits.has(id)) edits.set(id, { changes: {}, varBindings: {} });
  return edits.get(id);
}
function setChange(id, field, value) {
  getEdit(id).changes[field] = value;
  markDirty(id);
}
function setVarBinding(id, field, variableId) {
  if (!isBindableVarField(field)) return;
  getEdit(id).varBindings[field] = variableId;
  markDirty(id);
}
function getEffectiveVar(id, field) {
  if (!isBindableVarField(field)) return null;
  const e = edits.get(id);
  if (e && field in e.varBindings) return e.varBindings[field];
  const viewModel = styles.find(s => s.id === id);
  return viewModel ? (getViewModelBoundVars(viewModel)[field] ?? null) : null;
}
function getEditedValue(id, field) {
  const e = edits.get(id);
  return e && field in e.changes ? e.changes[field] : null;
}
function markDirty(id) {
  const row = document.querySelector('tr[data-id="' + CSS.escape(id) + '"]');
  if (row) { row.classList.add('dirty'); updateStateDot(row, id); }
  updateToolbar();
}
function isDirty(id) {
  const e = edits.get(id);
  if (!e) return false;
  return Object.keys(e.changes).length > 0 || Object.keys(e.varBindings).length > 0;
}
function updateStateDot(row, id) {
  const cell = row.querySelector('.state-cell');
  if (!cell) return;
  clearElement(cell);
  const status = applyStatus.get(id);
  if (status) {
    const dot = document.createElement('span');
    dot.className = 'dot ' + (status.ok ? 'dot-ok' : 'dot-err');
    dot.title = status.error || 'OK';
    cell.appendChild(dot);
  } else if (isDirty(id)) {
    const dot = document.createElement('span');
    dot.className = 'dot dot-pending';
    dot.title = 'Unsaved changes';
    cell.appendChild(dot);
  }
}

// ─── selection ────────────────────────────────────────────────────────────────────────────────
function selectedIds() {
  return [...document.querySelectorAll('tbody tr input.row-check:checked')]
    .map(cb => cb.closest('tr').dataset.id);
}
function onSelectAll(e) {
  document.querySelectorAll('tbody tr input.row-check').forEach(cb => { cb.checked = e.target.checked; });
  updateBulkBar();
  updateToolbar();
}
function updateSelectAll() {
  const all   = document.querySelectorAll('tbody tr input.row-check').length;
  const checked = document.querySelectorAll('tbody tr input.row-check:checked').length;
  const sa = document.getElementById('selectAll');
  if (!sa) return;
  sa.indeterminate = checked > 0 && checked < all;
  sa.checked = all > 0 && checked === all;
}

// ─── toolbar ──────────────────────────────────────────────────────────────────────────────────
function updateToolbar() {
  const dirtyCount = styles.filter(s => isDirty(s.id)).length;
  const sel = selectedIds();
  const filtered = getFilteredStyles();
  document.getElementById('applyBtn').disabled = dirtyCount === 0;
  document.getElementById('clearBtn').disabled = dirtyCount === 0;
  document.getElementById('selInfo').textContent =
    sel.length ? sel.length + ' selected' :
    (nameFilter ? filtered.length + ' / ' + styles.length + ' styles' : styles.length + ' styles');
  updateSelectAll();
}

// ─── render ───────────────────────────────────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('tableBody');
  clearElement(tbody);
  getFilteredStyles().forEach(viewModel => tbody.appendChild(buildRow(viewModel)));
  updateToolbar();
  requestResize();
}

function refreshRow(id) {
  const viewModel = styles.find(s => s.id === id);
  if (!viewModel) return;
  const existing = document.querySelector('tr[data-id="' + CSS.escape(id) + '"]');
  if (!existing) return;
  const wasChecked = existing.querySelector('input.row-check') && existing.querySelector('input.row-check').checked;
  const newRow = buildRow(viewModel);
  existing.replaceWith(newRow);
  if (wasChecked) { const cb = newRow.querySelector('input.row-check'); if (cb) cb.checked = true; }
  updateToolbar();
}

// ─── apply ─────────────────────────────────────────────────────────────────────────────────────
document.getElementById('applyBtn').addEventListener('click', sendApply);
document.getElementById('clearBtn').addEventListener('click', () => {
  edits.clear(); applyStatus.clear();
  hideErrorPanel();
  renderTable();
});
document.getElementById('reloadBtn').addEventListener('click', () => {
  requestCanonicalReload();
});

function sendApply() {
  const pending = styles.filter(s => isDirty(s.id));
  if (!pending.length) return;
  const editList = pending.map(s => {
    const e = edits.get(s.id);
    return { id: s.id, changes: e.changes, varBindings: e.varBindings };
  });
  parent.postMessage({ pluginMessage: { type: 'apply-changes', edits: editList } }, '*');
  document.getElementById('applyBtn').disabled = true;
}

// ─── messages ──────────────────────────────────────────────────────────────────────────────────
window.onmessage = event => {
  const msg = event.data && event.data.pluginMessage;
  if (!msg) return;

  if (msg.type === 'styles-loaded') {
    try {
      const payload = validateStylesLoadedMessage(msg);
      styles = payload.styles;
      fontMap = payload.fonts;
      variableList = payload.variables;
      variableMap.clear();
      variableList.forEach(v => variableMap.set(v.id, v));
      if (restoreAfterCanonicalReload) {
        edits = restoreAfterCanonicalReload.edits;
        applyStatus = restoreAfterCanonicalReload.applyStatus;
        restoreAfterCanonicalReload = null;
      } else {
        edits.clear(); applyStatus.clear();
        hideErrorPanel();
      }
      refreshNameGroupList();
      renderTable();
    } catch (err) {
      renderErrorPanel('Invalid styles-loaded message:', [err instanceof Error ? err.message : String(err)]);
    }
    return;
  }

  if (msg.type === 'apply-results') {
    let results;
    try {
      results = validateApplyResultsMessage(msg);
    } catch (err) {
      renderErrorPanel('Invalid apply-results message:', [err instanceof Error ? err.message : String(err)]);
      return;
    }
    const failed = [];
    let hasSuccessfulApply = false;
    results.forEach(r => {
      applyStatus.set(r.id, { ok: r.ok, error: r.error });
      if (r.ok) {
        hasSuccessfulApply = true;
        edits.delete(r.id);
      } else { failed.push(r); }
    });
    if (failed.length) {
      renderErrorPanel('Errors (' + failed.length + '):', failed.map(r => r.name + ': ' + (r.error || 'unknown')));
    } else { hideErrorPanel(); }
    renderTable();
    if (hasSuccessfulApply) {
      restoreAfterCanonicalReload = failed.length
        ? { edits: new Map(edits), applyStatus: new Map(applyStatus) }
        : null;
      requestCanonicalReload();
    }
    return;
  }

  if (msg.type === 'error') {
    renderErrorPanel('Error:', [typeof msg.message === 'string' ? msg.message : 'Unknown error']);
  }
};

// ─── auto-resize ────────────────────────────────────────────────────────────────────────
let resizeRaf = null;
function requestResize() {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    const rows = document.querySelectorAll('#tableBody tr');
    const rowH = rows.length ? (rows[0].offsetHeight || 28) : 28;
    const theadH = (document.querySelector('thead') || {offsetHeight:32}).offsetHeight || 32;
    const toolbarH = document.getElementById('toolbar').offsetHeight;
    const bulkBar  = document.getElementById('bulkBar');
    const bulkH    = bulkBar.style.display !== 'none' ? bulkBar.offsetHeight : 0;
    const ep       = document.getElementById('errorPanel');
    const epH      = ep.style.display !== 'none' ? ep.offsetHeight : 0;
    const totalH = Math.min(800, Math.max(300, toolbarH + bulkH + epH + theadH + rows.length * rowH + 8));
    const totalW = Math.max(800, colWidths.reduce((a,b) => a+b, 0) + 20);
    parent.postMessage({ pluginMessage: { type: 'resize', width: totalW, height: totalH } }, '*');
  });
}
