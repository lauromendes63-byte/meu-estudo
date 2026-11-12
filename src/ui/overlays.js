let supportsDisplayTransitionCache;

export function canTransitionDisplay() {
  if (supportsDisplayTransitionCache !== undefined) {
    return supportsDisplayTransitionCache;
  }
  if (
    typeof window === 'undefined' ||
    !window.CSS?.supports?.('transition-behavior', 'allow-discrete') ||
    !document.body
  ) {
    supportsDisplayTransitionCache = false;
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransitionCache = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransitionCache;
}

export function supportsTopLayerExit() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay());
}

export function openModalDialog(dialog) {
  if (!dialog) return;
  dialog.removeAttribute('data-closing');
  if (!dialog.open && typeof dialog.showModal === 'function') {
    dialog.showModal();
  }
}

export async function closeModalDialog(dialog) {
  if (!dialog || !dialog.open) return;

  if (!supportsTopLayerExit()) {
    dialog.setAttribute('data-closing', '');
    const animations = typeof dialog.getAnimations === 'function' ? dialog.getAnimations({ subtree: true }) : [];
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((resolve) => setTimeout(resolve, 600))
      ]);
    }
    if (!dialog.hasAttribute('data-closing')) return;
    dialog.removeAttribute('data-closing');
  }

  if (dialog.open && typeof dialog.close === 'function') {
    dialog.close();
  }
}

export function wireDialogBackdropDismiss(dialog, onDismissRequest) {
  if (!dialog) return;

  // Intercept Esc / back-gesture close request so animated exit and history pop stay unified
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (typeof onDismissRequest === 'function') {
      onDismissRequest();
    } else {
      closeModalDialog(dialog);
    }
  });

  // Fallback for browsers lacking HTMLDialogElement.closedBy ("any")
  if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
    const isOutside = (event) => {
      const card = dialog.querySelector('.dialog-card') || dialog;
      const r = card.getBoundingClientRect();
      return (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      );
    };

    let pressedOutside = false;
    dialog.addEventListener('pointerdown', (event) => {
      pressedOutside = isOutside(event);
    });
    dialog.addEventListener('pointerup', (event) => {
      if (pressedOutside && isOutside(event)) {
        if (typeof onDismissRequest === 'function') {
          onDismissRequest();
        } else {
          closeModalDialog(dialog);
        }
      }
      pressedOutside = false;
    });
  }
}

let activeConfirmResolve = null;

export function askConfirmation({
  title = 'Confirmar Ação',
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true
} = {}) {
  const dlg = document.getElementById('modal-confirm');
  const titleEl = document.getElementById('confirm-modal-title');
  const msgEl = document.getElementById('confirm-modal-message');
  const cancelBtn = document.getElementById('btn-confirm-cancel');
  const okBtn = document.getElementById('btn-confirm-ok');

  if (!dlg || !titleEl || !msgEl || !cancelBtn || !okBtn) {
    return Promise.resolve(false);
  }

  if (activeConfirmResolve) {
    activeConfirmResolve(false);
    activeConfirmResolve = null;
  }

  titleEl.textContent = title;
  msgEl.textContent = message;
  cancelBtn.textContent = cancelLabel;
  okBtn.textContent = confirmLabel;
  okBtn.className = danger ? 'btn-danger-solid' : 'btn-primary';
  dlg.returnValue = '';

  return new Promise((resolve) => {
    activeConfirmResolve = resolve;

    const cleanup = () => {
      dlg.removeEventListener('close', onClose);
      cancelBtn.removeEventListener('click', onCancelClick);
      okBtn.removeEventListener('click', onOkClick);
    };

    const settle = (value) => {
      cleanup();
      activeConfirmResolve = null;
      resolve(value);
    };

    const onClose = () => {
      const res = dlg.returnValue === 'confirm';
      dlg.returnValue = '';
      settle(res);
    };

    const onCancelClick = async () => {
      dlg.returnValue = 'cancel';
      await closeModalDialog(dlg);
    };

    const onOkClick = async () => {
      dlg.returnValue = 'confirm';
      await closeModalDialog(dlg);
    };

    dlg.addEventListener('close', onClose);
    cancelBtn.addEventListener('click', onCancelClick);
    okBtn.addEventListener('click', onOkClick);

    openModalDialog(dlg);
    cancelBtn.focus();
  });
}
