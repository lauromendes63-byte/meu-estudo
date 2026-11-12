/**
 * Física contínua por velocidade e gestos nativos a 120Hz:
 * 1) Arrasto vertical interruptível via Web Animations API + setPointerCapture para sheets/modais
 * 2) Swipe lateral da borda esquerda para voltar em Master -> Detail
 * 3) SwipeableList via CSS Scroll Snap + IntersectionObserver (sem interceptar touchmove!)
 */

export function attachSheetDrag({ surface, handle, onDismiss }) {
  if (!surface || !handle) return () => {};

  let activeAnim = null;
  let pointerId = null;
  let startY = 0;
  let currentY = 0;
  let prevSampleY = 0;
  let prevSampleTime = 0;
  let velocityY = 0;
  let isDragging = false;

  const cancelRunningAnim = () => {
    if (activeAnim) {
      try {
        activeAnim.cancel();
      } catch {
        // Animation already finished or unavailable
      }
      activeAnim = null;
    }
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    if (event.target.closest('button, input, select, textarea, a')) return;

    cancelRunningAnim();
    pointerId = event.pointerId;
    startY = event.clientY;
    currentY = 0;
    prevSampleY = event.clientY;
    prevSampleTime = performance.now();
    velocityY = 0;
    isDragging = true;

    surface.style.transition = 'none';
    handle.classList.add('is-dragging');
    handle.setPointerCapture?.(pointerId);
  };

  const onPointerMove = (event) => {
    if (!isDragging || event.pointerId !== pointerId) return;

    const rawDelta = event.clientY - startY;
    const now = performance.now();
    const dt = Math.max(1, now - prevSampleTime);
    const instantVelocity = (event.clientY - prevSampleY) / dt;
    velocityY = velocityY * 0.45 + instantVelocity * 0.55;
    prevSampleY = event.clientY;
    prevSampleTime = now;

    // Resistência elástica se puxar para cima (feedback físico de borracha)
    const visualOffset =
      rawDelta < 0 ? -Math.pow(Math.abs(rawDelta), 0.72) * 0.4 : rawDelta;
    currentY = rawDelta;
    surface.style.transform = `translate3d(0, ${visualOffset.toFixed(1)}px, 0)`;
  };

  const finishDrag = async (cancelled = false) => {
    if (!isDragging) return;
    isDragging = false;
    handle.classList.remove('is-dragging');
    try {
      if (handle.hasPointerCapture?.(pointerId)) {
        handle.releasePointerCapture(pointerId);
      }
    } catch {
      // Ignore capture errors
    }

    const shouldDismiss = !cancelled && (currentY > 105 || velocityY > 0.55);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (shouldDismiss) {
      const targetHeight = Math.max(surface.getBoundingClientRect().height || 400, 320);
      if (!reduced && typeof surface.animate === 'function') {
        activeAnim = surface.animate(
          [
            { transform: surface.style.transform || `translate3d(0, ${Math.max(0, currentY)}px, 0)` },
            { transform: `translate3d(0, ${targetHeight}px, 0)` }
          ],
          {
            duration: 190,
            easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
            fill: 'forwards'
          }
        );
        try {
          await activeAnim.finished;
        } catch {
          // Interrupted
        }
        cancelRunningAnim();
      }
      surface.style.transition = '';
      surface.style.transform = '';
      onDismiss?.();
      return;
    }

    // Mola elástica de retorno até 0
    if (!reduced && typeof surface.animate === 'function') {
      activeAnim = surface.animate(
        [
          { transform: surface.style.transform || 'translate3d(0, 0, 0)' },
          { transform: 'translate3d(0, -4px, 0)', offset: 0.65 },
          { transform: 'translate3d(0, 0, 0)' }
        ],
        {
          duration: 240,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)'
        }
      );
      try {
        await activeAnim.finished;
      } catch {
        // User grabbed mid-spring
      }
      activeAnim = null;
    }
    surface.style.transition = '';
    surface.style.transform = '';
  };

  const onPointerUp = (event) => {
    if (event.pointerId !== pointerId) return;
    finishDrag(false);
  };

  const onLostCapture = () => {
    finishDrag(true);
  };

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup', onPointerUp);
  handle.addEventListener('pointercancel', onLostCapture);

  return () => {
    cancelRunningAnim();
    handle.removeEventListener('pointerdown', onPointerDown);
    handle.removeEventListener('pointermove', onPointerMove);
    handle.removeEventListener('pointerup', onPointerUp);
    handle.removeEventListener('pointercancel', onLostCapture);
  };
}

export function attachMasterDetailSwipeBack({ pane, onCommitBack }) {
  if (!pane) return () => {};

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let tracking = false;
  let lockedHorizontal = false;
  let activeAnim = null;

  const onTouchStart = (event) => {
    if (pane.hidden || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (touch.clientX > 36) return;
    if (activeAnim) {
      try {
        activeAnim.cancel();
      } catch {
        // ignore
      }
      activeAnim = null;
    }
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = performance.now();
    tracking = true;
    lockedHorizontal = false;
  };

  const onTouchMove = (event) => {
    if (!tracking || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (!lockedHorizontal) {
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
        tracking = false;
        return;
      }
      if (dx > 12 && dx > Math.abs(dy) * 1.2) {
        lockedHorizontal = true;
      }
    }

    if (lockedHorizontal) {
      const clampedX = Math.max(0, dx);
      pane.style.transform = `translate3d(${clampedX.toFixed(1)}px, 0, 0)`;
    }
  };

  const onTouchEnd = async (event) => {
    if (!tracking) return;
    tracking = false;
    if (!lockedHorizontal) {
      pane.style.transform = '';
      return;
    }
    lockedHorizontal = false;

    const touch = event.changedTouches[0];
    const dx = Math.max(0, touch.clientX - startX);
    const dt = Math.max(1, performance.now() - startTime);
    const velocityX = dx / dt;
    const width = pane.clientWidth || window.innerWidth || 360;
    const shouldGoBack = dx > Math.min(110, width * 0.32) || velocityX > 0.55;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (shouldGoBack) {
      if (!reduced && typeof pane.animate === 'function') {
        activeAnim = pane.animate(
          [
            { transform: pane.style.transform || `translate3d(${dx}px, 0, 0)` },
            { transform: `translate3d(${width}px, 0, 0)` }
          ],
          {
            duration: 185,
            easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
            fill: 'forwards'
          }
        );
        try {
          await activeAnim.finished;
        } catch {
          // ignore
        }
        activeAnim?.cancel();
        activeAnim = null;
      }
      pane.style.transform = '';
      onCommitBack?.();
      return;
    }

    if (!reduced && typeof pane.animate === 'function') {
      activeAnim = pane.animate(
        [
          { transform: pane.style.transform || `translate3d(${dx}px, 0, 0)` },
          { transform: 'translate3d(0, 0, 0)' }
        ],
        {
          duration: 210,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)'
        }
      );
      try {
        await activeAnim.finished;
      } catch {
        // ignore
      }
      activeAnim = null;
    }
    pane.style.transform = '';
  };

  pane.addEventListener('touchstart', onTouchStart, { passive: true });
  pane.addEventListener('touchmove', onTouchMove, { passive: true });
  pane.addEventListener('touchend', onTouchEnd, { passive: true });
  pane.addEventListener('touchcancel', onTouchEnd, { passive: true });

  return () => {
    pane.removeEventListener('touchstart', onTouchStart);
    pane.removeEventListener('touchmove', onTouchMove);
    pane.removeEventListener('touchend', onTouchEnd);
    pane.removeEventListener('touchcancel', onTouchEnd);
  };
}

export function attachTabSwipe({
  container,
  shouldIgnoreStart,
  getAdjacentTab,
  getActivePane,
  onCommitTab
} = {}) {
  if (!container) return () => {};

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocityX = 0;
  let tracking = false;
  let lockedHorizontal = false;
  let activePane = null;
  let activeAnim = null;

  const cancelAnim = () => {
    if (activeAnim) {
      try {
        activeAnim.cancel();
      } catch {
        // ignore
      }
      activeAnim = null;
    }
  };

  const hasScrollableHorizontalAncestor = (target) => {
    let node = target?.nodeType === 1 ? target : target?.parentElement;
    while (node && node !== container) {
      if (
        node.matches?.('.SwipeableList-item.is-initialized, .SwipeableList-track, [data-no-tab-swipe]')
      ) {
        return true;
      }
      if (node.scrollWidth > node.clientWidth + 2) {
        const overflowX = getComputedStyle(node).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') {
          return true;
        }
      }
      node = node.parentElement;
    }
    return false;
  };

  const onTouchStart = (event) => {
    if (event.touches.length !== 1) return;
    if (shouldIgnoreStart?.(event)) return;

    const touch = event.touches[0];
    const viewportWidth = window.innerWidth || container.clientWidth || 360;
    if (touch.clientX < 24 || touch.clientX > viewportWidth - 24) return;
    if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (hasScrollableHorizontalAncestor(event.target)) return;

    cancelAnim();
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = performance.now();
    lastX = startX;
    lastTime = startTime;
    velocityX = 0;
    tracking = true;
    lockedHorizontal = false;
    activePane = null;
  };

  const onTouchMove = (event) => {
    if (!tracking || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (!lockedHorizontal) {
      if (Math.abs(dx) <= 10 && Math.abs(dy) <= 10) return;
      if (Math.abs(dy) >= Math.abs(dx) * 0.9) {
        tracking = false;
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) * 1.15 && Math.abs(dx) > 14) {
        lockedHorizontal = true;
        activePane = getActivePane?.() || null;
        cancelAnim();
      } else {
        return;
      }
    }

    const now = performance.now();
    const dt = Math.max(1, now - lastTime);
    const instantVelocity = (touch.clientX - lastX) / dt;
    velocityX = velocityX * 0.45 + instantVelocity * 0.55;
    lastX = touch.clientX;
    lastTime = now;

    if (!activePane) return;

    const delta = dx < 0 ? 1 : -1;
    const hasTarget = Boolean(getAdjacentTab?.(delta));
    const width = activePane.clientWidth || window.innerWidth || 360;

    if (hasTarget) {
      const visualDx = dx * 0.42;
      const opacity = Math.max(0.72, 1 - Math.abs(dx) / (width * 1.5));
      activePane.style.transform = `translate3d(${visualDx.toFixed(1)}px, 0, 0)`;
      activePane.style.opacity = opacity.toFixed(3);
    } else {
      const rubberDx = Math.sign(dx) * Math.min(26, Math.pow(Math.abs(dx), 0.62));
      activePane.style.transform = `translate3d(${rubberDx.toFixed(1)}px, 0, 0)`;
      activePane.style.opacity = '';
    }
  };

  const finishSwipe = async (event, cancelled = false) => {
    if (!tracking) return;
    tracking = false;

    const pane = activePane;
    activePane = null;

    if (!lockedHorizontal) {
      if (pane) {
        pane.style.transform = '';
        pane.style.opacity = '';
      }
      return;
    }
    lockedHorizontal = false;

    const touch = event.changedTouches?.[0];
    const dx = !cancelled && touch ? touch.clientX - startX : 0;
    const dt = Math.max(1, performance.now() - startTime);
    const avgVelocity = dx / dt;
    const effectiveVelocity =
      Math.abs(velocityX) > Math.abs(avgVelocity) && Math.sign(velocityX) === Math.sign(dx)
        ? velocityX
        : avgVelocity;

    const delta = dx < 0 ? 1 : -1;
    const targetTab = !cancelled && dx !== 0 ? getAdjacentTab?.(delta) : null;
    const width = pane?.clientWidth || window.innerWidth || 360;
    const shouldCommit =
      Boolean(targetTab) &&
      (Math.abs(dx) > Math.min(82, width * 0.24) ||
        (Math.abs(effectiveVelocity) > 0.36 &&
          Math.sign(effectiveVelocity) === Math.sign(dx) &&
          Math.abs(dx) > 24));

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (shouldCommit) {
      if (pane && !reduced && typeof pane.animate === 'function') {
        activeAnim = pane.animate(
          [
            {
              transform: pane.style.transform || 'translate3d(0, 0, 0)',
              opacity: pane.style.opacity || '1'
            },
            {
              transform: `translate3d(${Math.sign(dx) * 32}px, 0, 0)`,
              opacity: 0
            }
          ],
          {
            duration: 90,
            easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
            fill: 'forwards'
          }
        );
        try {
          await activeAnim.finished;
        } catch {
          // ignore
        }
        cancelAnim();
      }
      if (pane) {
        pane.style.transform = '';
        pane.style.opacity = '';
      }
      onCommitTab?.(targetTab, delta > 0 ? 'next' : 'prev');
      return;
    }

    if (pane) {
      if (!reduced && typeof pane.animate === 'function' && pane.style.transform) {
        activeAnim = pane.animate(
          [
            {
              transform: pane.style.transform,
              opacity: pane.style.opacity || '1'
            },
            {
              transform: 'translate3d(0, 0, 0)',
              opacity: 1
            }
          ],
          {
            duration: 180,
            easing: 'cubic-bezier(0.23, 1, 0.32, 1)'
          }
        );
        try {
          await activeAnim.finished;
        } catch {
          // ignore
        }
        activeAnim = null;
      }
      pane.style.transform = '';
      pane.style.opacity = '';
    }
  };

  const onTouchEnd = (event) => finishSwipe(event, false);
  const onTouchCancel = (event) => finishSwipe(event, true);

  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchmove', onTouchMove, { passive: true });
  container.addEventListener('touchend', onTouchEnd, { passive: true });
  container.addEventListener('touchcancel', onTouchCancel, { passive: true });

  return () => {
    cancelAnim();
    container.removeEventListener('touchstart', onTouchStart);
    container.removeEventListener('touchmove', onTouchMove);
    container.removeEventListener('touchend', onTouchEnd);
    container.removeEventListener('touchcancel', onTouchCancel);
  };
}

/**
 * Controlador de SwipeableList via CSS Scroll Snap + IntersectionObserver,
 * seguindo a arquitetura moderna sem listeners manuais de drag/wheel.
 */
export function createSwipeListController({ getStatusEl, onCommitItem } = {}) {
  const swipeHandles = new WeakMap();
  const wiredLists = new WeakSet();
  const supportsScrollInitialTarget =
    typeof CSS !== 'undefined' && CSS.supports?.('scroll-initial-target', 'nearest');
  const needsScrollWorkaround = !supportsScrollInitialTarget;
  const hasIO = typeof IntersectionObserver === 'function';
  const hasRO = typeof ResizeObserver === 'function';

  const trackResizeObserver =
    needsScrollWorkaround && hasRO
      ? new ResizeObserver((entries) => {
          for (const entry of entries) {
            const track = entry.target;
            if (track.clientWidth > 0 && !track.closest('.SwipeableList-item.is-removing')) {
              track.scrollLeft = track.clientWidth;
            }
          }
        })
      : null;

  const viewportObserver = hasIO
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const item = entry.target;
          if (entry.isIntersecting) {
            const handle = swipeHandles.get(item) || setupItem(item);
            if (handle) {
              handle.observer?.observe(handle.content);
            }
          } else {
            const handle = swipeHandles.get(item);
            handle?.observer?.unobserve(handle.content);
          }
        }
      })
    : null;

  async function animateAndCommit(item, content, direction, entry) {
    if (item.classList.contains('is-removing')) return;
    item.classList.add('is-removing');

    const list = item.parentElement;
    if (list && item.contains(document.activeElement)) {
      const rows = Array.from(list.children).filter(
        (row) => row === item || !row.classList.contains('is-removing')
      );
      const index = rows.indexOf(item);
      const next = rows[index + 1] || rows[index - 1];
      const listHeading = list.getAttribute('aria-labelledby')
        ? document.getElementById(list.getAttribute('aria-labelledby'))
        : null;
      const nextBtn = next?.querySelector('.SwipeableList-action, button');
      (nextBtn || listHeading)?.focus?.();
    }

    const labelText = item.querySelector('.SwipeableList-label')?.textContent || 'Item';
    const statusEl = typeof getStatusEl === 'function' ? getStatusEl() : null;
    if (statusEl) {
      statusEl.textContent = `${labelText} concluído`;
    }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const rect = entry.boundingClientRect || item.getBoundingClientRect();
    const rootLeft = entry.rootBounds ? entry.rootBounds.x : rect.x;
    const xOffset = rect.x - rootLeft;
    const translateDist = direction === 'left' ? rect.width - xOffset : -(xOffset + rect.width);

    if (rect.height > 0 && typeof item.animate === 'function') {
      const opts = { duration: reduce ? 140 : 250, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' };
      item.animate([{ height: `${rect.height}px` }, { height: '0px' }], opts);
      if (!reduce && typeof content.animate === 'function' && rect.width > 0) {
        content.animate([{ translate: `${translateDist}px` }], opts);
      }
      const anims = typeof item.getAnimations === 'function' ? item.getAnimations({ subtree: true }) : [];
      await Promise.race([
        Promise.allSettled(anims.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 320))
      ]);
    }

    await onCommitItem?.(item, { direction });

    // Safari scroll-latching guard: inert before delayed DOM disposal if still connected
    if (globalThis.GestureEvent && item.isConnected) {
      item.inert = true;
      setTimeout(() => item.remove(), 5000);
    } else if (item.isConnected) {
      item.remove();
    }
  }

  function setupItem(item) {
    if (swipeHandles.has(item)) return swipeHandles.get(item);
    const track = item.querySelector('.SwipeableList-track');
    const content = track?.querySelector('.SwipeableList-content');
    if (!track || !content) return null;

    item.classList.add('is-initialized');

    if (needsScrollWorkaround && track.clientWidth > 0) {
      track.scrollLeft = track.clientWidth;
      trackResizeObserver?.observe(track);
    }

    const activateThreshold = 0.82;
    const commitThreshold = 0.22;

    const commit = (direction, entry) => {
      if (item.classList.contains('is-removing')) return;
      viewportObserver?.unobserve(item);
      if (needsScrollWorkaround) trackResizeObserver?.unobserve(track);
      handle.observer?.disconnect();
      animateAndCommit(item, content, direction, entry);
    };

    const observer = hasIO
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries[entries.length - 1];
            if (!entry || !entry.rootBounds || entry.rootBounds.width <= 0 || entry.boundingClientRect.width <= 0) {
              return;
            }
            const ratio = entry.intersectionRatio;
            const direction = entry.boundingClientRect.x - entry.rootBounds.x > 0 ? 'left' : 'right';

            if (ratio < commitThreshold) {
              commit(direction, entry);
              return;
            }

            item.classList.toggle('is-activating', ratio < activateThreshold);
            if (entry.boundingClientRect.x !== entry.rootBounds.x) {
              item.dataset.swipeDirection = direction;
            }
          },
          {
            root: track,
            threshold: [commitThreshold, activateThreshold]
          }
        )
      : null;

    const handle = { observer, content, track, commit };
    swipeHandles.set(item, handle);
    return handle;
  }

  function observeItem(item) {
    if (viewportObserver) {
      viewportObserver.observe(item);
    } else {
      setupItem(item);
    }
  }

  function setupList(list) {
    if (!list || wiredLists.has(list)) return;
    wiredLists.add(list);

    for (const item of Array.from(list.children)) {
      if (item.matches?.('.SwipeableList-item')) {
        observeItem(item);
      }
    }

    if (typeof MutationObserver === 'function') {
      new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && node.matches?.('.SwipeableList-item')) {
              observeItem(node);
            }
          }
        }
      }).observe(list, { childList: true });
    }

    list.addEventListener('click', (event) => {
      const actionBtn = event.target.closest?.('.SwipeableList-action');
      const item = actionBtn?.closest?.('.SwipeableList-item');
      if (!actionBtn || !item) return;

      event.stopPropagation();
      const handle = swipeHandles.get(item) || setupItem(item);
      if (!handle) return;

      handle.commit(actionBtn.dataset.direction || 'right', {
        boundingClientRect: handle.content.getBoundingClientRect(),
        rootBounds: handle.track.getBoundingClientRect()
      });
    });
  }

  function refresh(list) {
    if (!list) return;
    setupList(list);
    for (const item of Array.from(list.children)) {
      if (!item.matches?.('.SwipeableList-item') || item.classList.contains('is-removing')) continue;
      const track = item.querySelector('.SwipeableList-track');
      if (needsScrollWorkaround && track && track.clientWidth > 0 && item.classList.contains('is-initialized')) {
        track.scrollLeft = track.clientWidth;
      }
    }
  }

  return { setupList, refresh };
}
