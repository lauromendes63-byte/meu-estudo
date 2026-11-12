import confetti from 'canvas-confetti';
import { UI_ICONS } from '../icons/medical-icons.js';

let toastTimer = null;
let pendingUndoFn = null;
let listenersBound = false;

export function vibrate(pattern = 12) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Vibração indisponível no dispositivo/navegador
  }
}

export function initToastListeners() {
  if (listenersBound || typeof document === 'undefined') return;
  listenersBound = true;

  const undoBtn = document.getElementById('toast-undo-btn');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      if (typeof pendingUndoFn === 'function') {
        const fn = pendingUndoFn;
        pendingUndoFn = null;
        fn();
        hideToast();
        vibrate([10, 20, 10]);
      }
    });
  }
}

export function hideToast() {
  const host = document.getElementById('toast-container');
  const undoBtn = document.getElementById('toast-undo-btn');
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  if (host) {
    host.classList.remove('is-visible');
  }
  if (undoBtn) {
    undoBtn.hidden = true;
  }
  pendingUndoFn = null;
}

export function showToast(messageOrOpts, isErrorFlag = false, undoCallback = null) {
  initToastListeners();

  const opts =
    typeof messageOrOpts === 'object' && messageOrOpts !== null
      ? messageOrOpts
      : { message: messageOrOpts, isError: isErrorFlag, undoFn: undoCallback };

  const host = document.getElementById('toast-container');
  const pill = document.getElementById('toast-pill');
  const iconBox = document.getElementById('toast-icon');
  const msgEl = document.getElementById('toast-msg');
  const undoBtn = document.getElementById('toast-undo-btn');

  if (!host || !pill || !msgEl) return;

  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  pendingUndoFn = typeof opts.undoFn === 'function' ? opts.undoFn : null;
  msgEl.textContent = String(opts.message || '');
  pill.classList.toggle('is-error', Boolean(opts.isError));

  if (iconBox) {
    iconBox.innerHTML = opts.isError ? UI_ICONS.close : UI_ICONS.check;
  }

  if (undoBtn) {
    undoBtn.hidden = !pendingUndoFn;
  }

  host.classList.add('is-visible');

  const duration = pendingUndoFn ? 4600 : opts.durationMs || 2800;
  toastTimer = setTimeout(() => {
    hideToast();
  }, duration);
}

export function triggerCelebration({ fullDayComplete = false } = {}) {
  try {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

    confetti({
      particleCount: fullDayComplete ? 68 : 26,
      spread: fullDayComplete ? 72 : 48,
      origin: { y: fullDayComplete ? 0.58 : 0.72 },
      colors: ['#162654', '#2F683A', '#1F6C9F', '#8C5B00'],
      disableForReducedMotion: true
    });
  } catch {
    // Ambiente sem canvas (ex: jsdom)
  }
}
