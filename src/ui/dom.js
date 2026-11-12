export function clearChildren(el) {
  if (!el) return;
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'className') {
      node.className = v;
    } else if (k === 'textContent') {
      node.textContent = v;
    } else if (k === 'innerHTML') {
      node.innerHTML = v;
    } else if (k === 'dataset' && typeof v === 'object') {
      for (const [dk, dv] of Object.entries(v)) {
        if (dv !== undefined && dv !== null) {
          node.dataset[dk] = String(dv);
        }
      }
    } else if (k === 'style' && typeof v === 'string') {
      node.style.cssText = v;
    } else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v === true) {
      node.setAttribute(k, '');
    } else {
      node.setAttribute(k, String(v));
    }
  }

  for (const child of children.flat()) {
    if (child === undefined || child === null || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      node.appendChild(document.createTextNode(String(child)));
    } else {
      node.appendChild(child);
    }
  }
  return node;
}

export function createSquircleNode(iconKey, colorObj, sizeClass = '') {
  return el('div', {
    className: `module-squircle ${sizeClass}`.trim(),
    style: `background-color: ${colorObj.bg}; border-color: ${colorObj.border}; color: ${colorObj.hex};`,
    innerHTML: iconKey
  });
}
