// ─── variable picker ───────────────────────────────────────────────────────────────────────
let vpState = null;

document.addEventListener('click', e => {
  if (!e.target.closest('#varPicker') && !e.target.classList.contains('vb-btn') && !e.target.classList.contains('bb-var-btn')) {
    closeVarPicker();
  }
}, true);

function openVarPicker(id, field, anchorEl, isBulk) {
  if (!isBindableVarField(field)) return;
  vpState = { id, field, bulk: !!isBulk };
  const picker = document.getElementById('varPicker');
  picker.classList.add('open');
  document.getElementById('varPickerLabel').textContent = field.replace(/([A-Z])/g, ' $1').toLowerCase();
  document.getElementById('varPickerSearch').value = '';
  document.getElementById('varPickerClear').style.display = '';
  renderVarPickerList('');
  const rect = anchorEl.getBoundingClientRect();
  let top = rect.bottom + 2, left = rect.left;
  if (left + 260 > window.innerWidth)  left = window.innerWidth - 264;
  if (top  + 300 > window.innerHeight) top  = rect.top - 302;
  picker.style.top = top + 'px';
  picker.style.left = left + 'px';
  document.getElementById('varPickerSearch').focus();
}
function closeVarPicker() {
  document.getElementById('varPicker').classList.remove('open');
  vpState = null;
}
function renderVarPickerList(query) {
  const list = document.getElementById('varPickerList');
  clearElement(list);
  const q = query.toLowerCase();
  const filtered = variableList.filter(v =>
    v.name.toLowerCase().includes(q) || v.collectionName.toLowerCase().includes(q)
  );
  if (!filtered.length) {
    const d = document.createElement('div');
    d.className = 'vp-none';
    d.textContent = variableList.length ? 'No matches' : 'No FLOAT variables found';
    list.appendChild(d);
    return;
  }
  const currentId = vpState ? (
    vpState.bulk ? bulkVarBindings[vpState.field] : getEffectiveVar(vpState.id, vpState.field)
  ) : null;
  filtered.forEach(v => {
    const item = document.createElement('div');
    item.className = 'vp-item' + (v.id === currentId ? ' selected' : '');
    const nm = document.createElement('span'); nm.className = 'vp-name'; nm.textContent = v.name;
    const col = document.createElement('span'); col.className = 'vp-coll'; col.textContent = v.collectionName;
    item.appendChild(nm); item.appendChild(col);
    item.addEventListener('click', () => {
      if (vpState) {
        if (vpState.bulk) {
          bulkVarBindings[vpState.field] = v.id;
          updateBulkVarChip(vpState.field);
        } else {
          setVarBinding(vpState.id, vpState.field, v.id);
          refreshRow(vpState.id);
        }
      }
      closeVarPicker();
    });
    list.appendChild(item);
  });
}
document.getElementById('varPickerSearch').addEventListener('input', e => renderVarPickerList(e.target.value));
document.getElementById('varPickerClear').addEventListener('click', () => {
  if (vpState) {
    if (vpState.bulk) {
      bulkVarBindings[vpState.field] = null;
      updateBulkVarChip(vpState.field);
    } else {
      setVarBinding(vpState.id, vpState.field, null);
      refreshRow(vpState.id);
    }
  }
  closeVarPicker();
});
