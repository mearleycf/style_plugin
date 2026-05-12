function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function setChildren(el, children) {
  clearElement(el);
  children.forEach(child => el.appendChild(child));
}
