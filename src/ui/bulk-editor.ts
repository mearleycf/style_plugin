// @ts-nocheck
import { clearElement } from './dom-utils';
import { isBindableVarField } from './message-validation';
import { bulkVarBindings, clearBulkVarBindings, openVarPicker, edits, getFontStyles, getValidStyleForFamily, hasBulkVarBinding, refreshRow, registerBulkBarUpdater, selectedIds, setChange, setVarBinding, styles, updateToolbar, renderTable, variableMap } from './app';

// ─── bulk bar ─────────────────────────────────────────────────────────────────────────────────
export function updateBulkBar() {
  const sel = selectedIds();
  const bar = document.getElementById('bulkBar');
  if (sel.length < 2) {
    bar.classList.add('hidden');
    bar.classList.remove('flex');
    updateToolbar();
    return;
  }
  bar.classList.remove('hidden');
  bar.classList.add('flex');

  const families = [...new Set(sel.map(id => {
    const e = edits.get(id);
    if (e && e.changes.fontName) return e.changes.fontName.family;
    const s = styles.find(x => x.id === id);
    return s ? s.fontName.family : null;
  }).filter(Boolean))];
  const bulkFamily = document.getElementById('bb-family').value.trim();
  const familyForOptions = bulkFamily || (families.length === 1 ? families[0] : '');
  populateBulkStyleOptions(familyForOptions);
  updateToolbar();
}

export function populateBulkStyleOptions(family) {
  const bbStyle = document.getElementById('bb-style');
  const previousStyle = bbStyle.value;
  clearElement(bbStyle);
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '—';
  bbStyle.appendChild(emptyOption);
  const stylesForFamily = getFontStyles(family);
  if (stylesForFamily.length) {
    stylesForFamily.forEach(st => {
      const o = document.createElement('option');
      o.value = o.textContent = st;
      if (st === previousStyle) o.selected = true;
      bbStyle.appendChild(o);
    });
  }
  if (previousStyle && !stylesForFamily.includes(previousStyle)) bbStyle.value = '';
}

// ─── bulk variable bindings ────────────────────────────────────────────────────────────────
document.getElementById('bulkBar').addEventListener('click', e => {
  const btn = e.target.closest('[data-bulk-field]');
  if (btn) {
    e.stopPropagation();
    if (!isBindableVarField(btn.dataset.bulkField)) return;
    openVarPicker(null, btn.dataset.bulkField, btn, true);
    return;
  }
  const clearBtn = e.target.closest('[data-clear-bulk]');
  if (clearBtn) {
    delete bulkVarBindings[clearBtn.dataset.clearBulk];
    updateBulkVarChip(clearBtn.dataset.clearBulk);
  }
});

export function updateBulkVarChip(field) {
  const chip = document.getElementById('bb-var-' + field);
  if (!chip) return;
  if (hasBulkVarBinding(field)) {
    const varId = bulkVarBindings[field];
    const info = variableMap.get(varId);
    chip.querySelector('span').textContent = varId === null ? 'Unbind variable' : (info ? info.name : varId);
    chip.classList.remove('hidden');
    chip.classList.add('flex');
  } else {
    chip.classList.add('hidden');
    chip.classList.remove('flex');
  }
}

document.getElementById('applyBulkBtn').addEventListener('click', () => {
  const sel = selectedIds();
  if (!sel.length) return;

  const family  = document.getElementById('bb-family').value.trim();
  const styleSt = document.getElementById('bb-style').value;
  const size    = parseFloat(document.getElementById('bb-size').value);
  const lhUnit  = document.getElementById('bb-lhUnit').value;
  const lhVal   = parseFloat(document.getElementById('bb-lhVal').value);
  const lsUnit  = document.getElementById('bb-lsUnit').value;
  const lsVal   = parseFloat(document.getElementById('bb-lsVal').value);
  const tc      = document.getElementById('bb-case').value;
  const deco    = document.getElementById('bb-deco').value;
  const lt      = document.getElementById('bb-lt').value;
  const paraSp  = parseFloat(document.getElementById('bb-paraSp').value);
  const indent  = parseFloat(document.getElementById('bb-indent').value);
  const listSp  = parseFloat(document.getElementById('bb-listSp').value);
  const hangList = document.getElementById('bb-hangList').value;
  const hangPunct = document.getElementById('bb-hangPunct').value;

  sel.forEach(id => {
    const viewModel = styles.find(s => s.id === id);
    if (!viewModel) return;

    if (family || styleSt) {
      const cur = (edits.get(id) && edits.get(id).changes.fontName) || viewModel.fontName;
      const nextFamily = family || cur.family;
      const nextStyle = styleSt || getValidStyleForFamily(nextFamily, cur.style);
      setChange(id, 'fontName', { family: nextFamily, style: getValidStyleForFamily(nextFamily, nextStyle) });
    }
    if (!isNaN(size) && !hasBulkVarBinding('fontSize'))             setChange(id, 'fontSize', size);
    if (lhUnit === 'AUTO' && !hasBulkVarBinding('lineHeight')) {
      setChange(id, 'lineHeight', { unit: 'AUTO' });
    } else if (lhUnit && !isNaN(lhVal) && !hasBulkVarBinding('lineHeight')) {
      setChange(id, 'lineHeight', { unit: lhUnit, value: lhVal });
    }
    if (lsUnit && !isNaN(lsVal) && !hasBulkVarBinding('letterSpacing')) setChange(id, 'letterSpacing', { unit: lsUnit, value: lsVal });
    if (tc)                                                        setChange(id, 'textCase', tc);
    if (deco)                                                      setChange(id, 'textDecoration', deco);
    if (lt)                                                        setChange(id, 'leadingTrim', lt);
    if (!isNaN(paraSp) && !hasBulkVarBinding('paragraphSpacing'))   setChange(id, 'paragraphSpacing', paraSp);
    if (!isNaN(indent) && !hasBulkVarBinding('paragraphIndent'))    setChange(id, 'paragraphIndent', indent);
    if (!isNaN(listSp))                                             setChange(id, 'listSpacing', listSp);
    if (hangList)                                                   setChange(id, 'hangingList', hangList === 'true');
    if (hangPunct)                                                  setChange(id, 'hangingPunctuation', hangPunct === 'true');

    for (const [field, varId] of Object.entries(bulkVarBindings)) {
      setVarBinding(id, field, varId);
    }
  });

  clearBulkVarBindings();
  ['fontSize','lineHeight','letterSpacing','paragraphSpacing','paragraphIndent'].forEach(updateBulkVarChip);
  renderTable();
});

registerBulkBarUpdater(updateBulkBar);
