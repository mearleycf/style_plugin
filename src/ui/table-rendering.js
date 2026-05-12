// ─── cell builders ─────────────────────────────────────────────────────────────────────────────
function makeVbCell(id, field, numericValue, isBound) {
  const wrap = document.createElement('div');
  wrap.className = 'vb-wrap' + (isBound ? ' vb-bound' : '');
  const inp = document.createElement('input');
  inp.type = isBound ? 'text' : 'number';
  inp.step = '0.5';
  if (isBound) {
    const info = variableMap.get(getEffectiveVar(id, field));
    inp.value = info ? info.name : '(var)';
    inp.readOnly = true;
  } else {
    inp.value = numericValue;
    inp.addEventListener('change', e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setChange(id, field, v); });
  }
  wrap.appendChild(inp);
  const btn = document.createElement('button');
  btn.className = 'vb-btn';
  btn.title = isBound ? 'Change / unbind variable' : 'Bind variable';
  btn.textContent = '⚡';
  btn.addEventListener('mousedown', e => e.stopPropagation());
  btn.addEventListener('click', e => { e.stopPropagation(); openVarPicker(id, field, btn, false); });
  wrap.appendChild(btn);
  return wrap;
}

function makeNumericCell(id, field, numericValue) {
  const inp = document.createElement('input');
  inp.type = 'number';
  inp.step = '0.5';
  inp.value = numericValue;
  inp.addEventListener('change', e => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) setChange(id, field, v);
  });
  return inp;
}

function makeUvVbCell(id, field, uvValue, isBound) {
  const wrap = document.createElement('div');
  wrap.className = 'uv-wrap' + (isBound ? ' vb-bound' : '');
  if (isBound) {
    const inp = document.createElement('input');
    inp.type = 'text';
    const info = variableMap.get(getEffectiveVar(id, field));
    inp.value = info ? info.name : '(var)';
    inp.readOnly = true;
    inp.style.flex = '1';
    wrap.appendChild(inp);
  } else {
    const units = field === 'letterSpacing' ? ['PIXELS','PERCENT'] : ['AUTO','PIXELS','PERCENT'];
    const sel = document.createElement('select');
    sel.className = 'unit-sel';
    units.forEach(u => {
      const o = document.createElement('option');
      o.value = o.textContent = u;
      if (u === uvValue.unit) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', e => {
      const newUnit = e.target.value;
      const cur = getEditedValue(id, field) || uvValue;
      if (newUnit === 'AUTO') {
        setChange(id, field, { unit: 'AUTO' });
      } else {
        setChange(id, field, { unit: newUnit, value: cur.unit === 'AUTO' ? 0 : (cur.value || 0) });
      }
      refreshRow(id);
    });
    wrap.appendChild(sel);
    if (uvValue.unit !== 'AUTO') {
      const inp = document.createElement('input');
      inp.type = 'number'; inp.step = '0.5';
      inp.value = uvValue.value != null ? uvValue.value : '';
      inp.style.flex = '1'; inp.style.minWidth = '0';
      inp.addEventListener('change', e => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) setChange(id, field, { unit: uvValue.unit, value: v });
      });
      wrap.appendChild(inp);
    }
  }
  const btn = document.createElement('button');
  btn.className = 'vb-btn';
  btn.title = isBound ? 'Change / unbind variable' : 'Bind variable';
  btn.textContent = '⚡';
  btn.addEventListener('mousedown', e => e.stopPropagation());
  btn.addEventListener('click', e => { e.stopPropagation(); openVarPicker(id, field, btn, false); });
  wrap.appendChild(btn);
  return wrap;
}

function makeSelect(opts, current, onChange) {
  const sel = document.createElement('select');
  sel.style.cssText = 'width:100%;font-size:11px;border:1px solid transparent;border-radius:2px;background:transparent;';
  opts.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o.replace(/_/g,' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    if (o === current) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', e => onChange(e.target.value));
  return sel;
}

// ─── row builder ──────────────────────────────────────────────────────────────────────────────
function buildRow(viewModel) {
  const id = viewModel.id;
  const e = edits.get(id) || { changes:{}, varBindings:{} };
  const c = e.changes;
  const status = applyStatus.get(id);

  const fn     = c.fontName         ?? viewModel.fontName;
  const fs     = c.fontSize         ?? viewModel.fontSize;
  const lh     = c.lineHeight       ?? viewModel.lineHeight;
  const ls     = c.letterSpacing    ?? viewModel.letterSpacing;
  const paraSp = c.paragraphSpacing ?? viewModel.paragraphSpacing;
  const indent = c.paragraphIndent  ?? viewModel.paragraphIndent;
  const listSp = c.listSpacing      ?? viewModel.listSpacing;
  const tc     = c.textCase         ?? viewModel.textCase;
  const deco   = c.textDecoration   ?? viewModel.textDecoration;
  const lt     = c.leadingTrim      ?? viewModel.leadingTrim;
  const hangL  = c.hangingList      ?? viewModel.hangingList;
  const hangP  = c.hangingPunctuation ?? viewModel.hangingPunctuation;

  const varFs     = getEffectiveVar(id, 'fontSize');
  const varLh     = getEffectiveVar(id, 'lineHeight');
  const varLs     = getEffectiveVar(id, 'letterSpacing');
  const varParaSp = getEffectiveVar(id, 'paragraphSpacing');
  const varIndent = getEffectiveVar(id, 'paragraphIndent');

  const tr = document.createElement('tr');
  tr.dataset.id = id;
  if (isDirty(id)) tr.classList.add('dirty');

  function td(content) {
    const cell = document.createElement('td');
    if (content instanceof Node) cell.appendChild(content);
    else if (content !== undefined) cell.textContent = content;
    return cell;
  }

  const cbCell = document.createElement('td');
  const rowCb = document.createElement('input');
  rowCb.type = 'checkbox'; rowCb.className = 'row-check';
  rowCb.addEventListener('change', () => { updateBulkBar(); updateToolbar(); });
  cbCell.appendChild(rowCb);
  tr.appendChild(cbCell);

  const stateCell = document.createElement('td');
  stateCell.className = 'state-cell';
  if (status) {
    const dot = document.createElement('span');
    dot.className = 'dot ' + (status.ok ? 'dot-ok' : 'dot-err');
    dot.title = status.error || 'OK';
    stateCell.appendChild(dot);
  } else if (isDirty(id)) {
    const dot = document.createElement('span');
    dot.className = 'dot dot-pending';
    dot.title = 'Unsaved changes';
    stateCell.appendChild(dot);
  }
  tr.appendChild(stateCell);

  const nameInp = document.createElement('input');
  nameInp.type = 'text'; nameInp.value = c.name ?? viewModel.name;
  nameInp.addEventListener('change', ev => setChange(id, 'name', ev.target.value));
  tr.appendChild(td(nameInp));

  const famInp = document.createElement('input');
  famInp.type = 'text'; famInp.value = fn.family;
  famInp.addEventListener('change', ev => {
    const cur = (edits.get(id) && edits.get(id).changes.fontName) || viewModel.fontName;
    const nextFamily = ev.target.value.trim() || cur.family;
    setChange(id, 'fontName', makeFontNameForFamily(nextFamily, cur.style));
    refreshRow(id);
    updateBulkBar();
  });
  tr.appendChild(td(famInp));

  const styleCell = document.createElement('td');
  const availStyles = fontMap[fn.family];
  if (availStyles && availStyles.length) {
    const sel = document.createElement('select');
    sel.style.cssText = 'width:100%;font-size:11px;border:1px solid transparent;border-radius:2px;background:transparent;';
    availStyles.forEach(st => {
      const o = document.createElement('option'); o.value = o.textContent = st;
      if (st === fn.style) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', ev => {
      const cur = (edits.get(id) && edits.get(id).changes.fontName) || viewModel.fontName;
      setChange(id, 'fontName', { family: cur.family, style: ev.target.value });
    });
    styleCell.appendChild(sel);
  } else {
    const inp = document.createElement('input');
    inp.type = 'text'; inp.value = fn.style;
    inp.addEventListener('change', ev => {
      const cur = (edits.get(id) && edits.get(id).changes.fontName) || viewModel.fontName;
      setChange(id, 'fontName', { family: cur.family, style: ev.target.value });
    });
    styleCell.appendChild(inp);
  }
  tr.appendChild(styleCell);

  tr.appendChild(td(makeVbCell(id, 'fontSize', fs, !!varFs)));
  tr.appendChild(td(makeUvVbCell(id, 'lineHeight', lh, !!varLh)));
  tr.appendChild(td(makeUvVbCell(id, 'letterSpacing', ls, !!varLs)));
  tr.appendChild(td(makeVbCell(id, 'paragraphSpacing', paraSp, !!varParaSp)));
  tr.appendChild(td(makeVbCell(id, 'paragraphIndent', indent, !!varIndent)));
  tr.appendChild(td(makeNumericCell(id, 'listSpacing', listSp)));
  tr.appendChild(td(makeSelect(['ORIGINAL','UPPER','LOWER','TITLE','SMALL_CAPS','SMALL_CAPS_FORCED'], tc, v => setChange(id, 'textCase', v))));
  tr.appendChild(td(makeSelect(['NONE','UNDERLINE','STRIKETHROUGH'], deco, v => setChange(id, 'textDecoration', v))));
  tr.appendChild(td(makeSelect(['NONE','CAP_HEIGHT'], lt, v => setChange(id, 'leadingTrim', v))));

  const hangLCell = document.createElement('td'); hangLCell.style.textAlign = 'center';
  const hangLCb = document.createElement('input'); hangLCb.type = 'checkbox'; hangLCb.checked = !!hangL;
  hangLCb.addEventListener('change', ev => setChange(id, 'hangingList', ev.target.checked));
  hangLCell.appendChild(hangLCb); tr.appendChild(hangLCell);

  const hangPCell = document.createElement('td'); hangPCell.style.textAlign = 'center';
  const hangPCb = document.createElement('input'); hangPCb.type = 'checkbox'; hangPCb.checked = !!hangP;
  hangPCb.addEventListener('change', ev => setChange(id, 'hangingPunctuation', ev.target.checked));
  hangPCell.appendChild(hangPCb); tr.appendChild(hangPCell);

  return tr;
}
