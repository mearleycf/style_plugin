// @ts-nocheck
export function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function setChildren(el, children) {
  clearElement(el);
  children.forEach(child => el.appendChild(child));
}
