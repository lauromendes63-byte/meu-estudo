/**
 * Reconcilia elementos filhos de um container por chave única (`data-key`),
 * reaproveitando nós DOM existentes em vez de destruir e reconstruir toda a árvore.
 * Preserva estado de foco, animações em curso e performance a 120Hz.
 */
export function reconcileKeyedList(container, items, getKey, createFn, patchFn) {
  if (!container) return;

  const existingByKey = new Map();
  for (const child of Array.from(container.children)) {
    const key = child.dataset?.key;
    if (key && !child.classList.contains('is-removing')) {
      existingByKey.set(key, child);
    }
  }

  const nextKeys = new Set();
  const orderedNodes = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const key = String(getKey(item, i));
    nextKeys.add(key);

    let el = existingByKey.get(key);
    if (!el) {
      el = createFn(item, i);
      if (el) {
        el.dataset.key = key;
      }
    }
    if (el) {
      patchFn(el, item, i);
      orderedNodes.push(el);
    }
  }

  // Remove chaves obsoletas (que não estão em transição de remoção)
  for (const [key, oldEl] of existingByKey.entries()) {
    if (!nextKeys.has(key)) {
      oldEl.remove();
    }
  }

  // Ajusta ordenação cirurgicamente movendo apenas os nós fora de posição
  let cursor = container.firstElementChild;
  for (const targetEl of orderedNodes) {
    while (cursor && cursor.classList.contains('is-removing')) {
      cursor = cursor.nextElementSibling;
    }
    if (cursor === targetEl) {
      cursor = cursor.nextElementSibling;
    } else {
      container.insertBefore(targetEl, cursor || null);
    }
  }
}
