import { showToast } from '../ui/feedback.js';

export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '3.0.0';
export const BUILD_TIME =
  typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();
export const BUILD_LABEL =
  typeof __BUILD_LABEL__ !== 'undefined' ? __BUILD_LABEL__ : 'Local';

export function createPwaUpdater() {
  let pendingServerData = null;

  const bannerEl = document.getElementById('update-banner');
  const labelEl = document.getElementById('update-banner-label');
  const btnApply = document.getElementById('btn-apply-update');
  const btnDismiss = document.getElementById('btn-dismiss-update');

  async function applyUpdate() {
    if (btnApply) {
      btnApply.disabled = true;
      btnApply.textContent = 'Atualizando…';
    }
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }
    } catch {
      // Ignore cleanup failures and proceed to reload
    }
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(Date.now()));
    window.location.replace(url.toString());
  }

  function showUpdateBanner(serverData) {
    if (!bannerEl) return;
    if (labelEl) {
      labelEl.textContent = `v${serverData.version} • ${serverData.buildLabel || 'Toque para atualizar'}`;
    }
    bannerEl.hidden = false;
  }

  btnApply?.addEventListener('click', applyUpdate);
  btnDismiss?.addEventListener('click', () => {
    if (bannerEl) bannerEl.hidden = true;
    if (pendingServerData?.version) {
      sessionStorage.setItem('meu_estudo_dismissed_update', String(pendingServerData.version));
    }
  });

  async function checkForUpdates({ manual = false } = {}) {
    if (typeof window === 'undefined' || !navigator.onLine) {
      if (manual) showToast({ message: 'Sem conexão com a internet', isError: true });
      return false;
    }

    const dismissedVer = sessionStorage.getItem('meu_estudo_dismissed_update');
    try {
      const response = await fetch(`./version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) return false;

      const serverData = await response.json();
      const serverTs = Date.parse(serverData.buildTime || '') || 0;
      const localTs = Date.parse(BUILD_TIME || '') || 0;
      const isNewer =
        (serverData.version && serverData.version !== APP_VERSION) ||
        (serverTs > localTs + 5000);

      if (isNewer) {
        pendingServerData = serverData;
        if (manual || dismissedVer !== String(serverData.version)) {
          showUpdateBanner(serverData);
        }
        return true;
      }

      if (manual) {
        showToast(`Você já está na versão mais recente (v${APP_VERSION})`);
      }
      return false;
    } catch {
      if (manual) showToast({ message: 'Não foi possível verificar atualizações', isError: true });
      return false;
    }
  }

  function init() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {
          // Dev servers or insecure origins may skip SW
        });
      });
    }

    setTimeout(() => checkForUpdates({ manual: false }), 2500);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates({ manual: false });
      }
    });
  }

  return {
    version: APP_VERSION,
    buildTime: BUILD_TIME,
    buildLabel: BUILD_LABEL,
    init,
    checkForUpdates,
    getPendingUpdate: () => pendingServerData
  };
}
