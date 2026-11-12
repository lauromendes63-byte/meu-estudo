import { showToast } from '../ui/feedback.js';

export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '3.0.0';
export const BUILD_TIME =
  typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();
export const BUILD_LABEL =
  typeof __BUILD_LABEL__ !== 'undefined' ? __BUILD_LABEL__ : 'Local';

export function createPwaUpdater() {
  let pendingServerData = null;
  let deferredInstallPrompt = null;
  const installListeners = new Set();

  const bannerEl = document.getElementById('update-banner');
  const labelEl = document.getElementById('update-banner-label');
  const btnApply = document.getElementById('btn-apply-update');
  const btnDismiss = document.getElementById('btn-dismiss-update');

  function isStandaloneMode() {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator?.standalone === true
    );
  }

  function getInstallState() {
    if (isStandaloneMode()) return 'installed';
    if (deferredInstallPrompt) return 'ready';
    return 'browser';
  }

  function notifyInstallListeners() {
    const state = getInstallState();
    for (const cb of installListeners) {
      cb(state);
    }
  }

  async function promptInstall() {
    if (!deferredInstallPrompt) {
      return { outcome: 'unavailable' };
    }
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    notifyInstallListeners();
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      return { outcome: choice?.outcome || 'dismissed' };
    } catch {
      return { outcome: 'error' };
    }
  }

  function subscribeInstall(listener) {
    installListeners.add(listener);
    return () => installListeners.delete(listener);
  }

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

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('./sw.js', { scope: './', updateViaCache: 'none' })
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch(() => {
        // Dev servers or insecure origins may skip SW
      });
  }

  function init() {
    registerServiceWorker();

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      notifyInstallListeners();
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      notifyInstallListeners();
      showToast('Aplicativo instalado na tela inicial');
    });

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
    getPendingUpdate: () => pendingServerData,
    getInstallState,
    promptInstall,
    subscribeInstall
  };
}
