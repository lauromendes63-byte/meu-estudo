import { closeModalDialog, openModalDialog } from './overlays.js';

/**
 * Coordenador único de navegação entre abas principais, detalhe de módulo,
 * overlays e pilha de histórico 1-para-1 compatível com o botão Voltar do Android.
 */
export function createRouter({
  engine,
  renderAll,
  syncHeaderAndNav,
  onDetailShown,
  onStudyPaneShown
} = {}) {
  const TAB_ORDER = ['tab-modulos', 'tab-estudo', 'tab-provas'];
  const panes = {
    'tab-modulos': () => document.getElementById('tab-modulos'),
    'tab-modulo-detail': () => document.getElementById('tab-modulo-detail'),
    'tab-estudo': () => document.getElementById('tab-estudo'),
    'tab-provas': () => document.getElementById('tab-provas')
  };

  let isHandlingPopState = false;
  let suppressNextPopState = false;
  let activeTransition = null;
  let lessonSheetCloseHook = null;
  const trackedDialogs = new WeakSet();
  const dialogNeedsHistoryConsume = new WeakSet();

  function isOverlayOpen() {
    const sheet = document.getElementById('sheet-lesson');
    if (sheet?.classList.contains('sheet-open')) return true;
    return Boolean(document.querySelector('dialog[open]'));
  }

  function pushHistoryStep(viewName) {
    if (isHandlingPopState || typeof window === 'undefined') return;
    if (window.history.state?.meuEstudoView !== viewName) {
      try {
        window.history.pushState({ meuEstudoView: viewName }, '');
      } catch {
        // Ignore security error in restricted frames
      }
    }
  }

  function consumeTopHistoryStep() {
    if (isHandlingPopState || typeof window === 'undefined') return;
    if (window.history.state?.meuEstudoView) {
      suppressNextPopState = true;
      window.history.back();
    }
  }

  function runWithViewTransition(updateFn, type) {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced || typeof document.startViewTransition !== 'function' || !type) {
      updateFn();
      return;
    }
    if (activeTransition) {
      try {
        activeTransition.skipTransition();
      } catch {
        // ignore
      }
    }
    const vt = document.startViewTransition({
      update: updateFn,
      types: [type]
    });
    activeTransition = vt;
    vt.finished.finally(() => {
      if (activeTransition === vt) activeTransition = null;
    });
  }

  function showOnlyPane(paneId) {
    for (const [id, getter] of Object.entries(panes)) {
      const el = getter();
      if (!el) continue;
      const shouldShow = id === paneId;
      el.hidden = !shouldShow;
      if (shouldShow) {
        el.classList.remove('is-entering');
        void el.offsetWidth;
        el.classList.add('is-entering');
      } else {
        el.classList.remove('is-entering');
      }
    }
  }

  function saveCurrentMainScroll() {
    const main = document.getElementById('main-content');
    if (!main) return;
    if (!engine.state.currentModuleId && engine.state.scrollPositions[engine.state.activeTab] !== undefined) {
      engine.state.scrollPositions[engine.state.activeTab] = main.scrollTop;
    }
  }

  function restoreMainScroll(topPx = 0) {
    const main = document.getElementById('main-content');
    if (!main) return;
    requestAnimationFrame(() => {
      main.scrollTop = topPx;
    });
  }

  function switchTab(targetTabId) {
    if (!TAB_ORDER.includes(targetTabId)) return;

    saveCurrentMainScroll();
    const isReturningFromDetail = Boolean(engine.state.currentModuleId);

    engine.state.activeTab = targetTabId;
    engine.state.currentModuleId = null;

    if (isReturningFromDetail && window.history.state?.meuEstudoView === 'detail') {
      consumeTopHistoryStep();
    }

    showOnlyPane(targetTabId);
    renderAll();
    syncHeaderAndNav();
    restoreMainScroll(engine.state.scrollPositions[targetTabId] || 0);

    if (targetTabId === 'tab-estudo') {
      onStudyPaneShown?.();
    }
  }

  function openModuleDetail(moduleId) {
    if (!engine.getModule(moduleId)) return;

    saveCurrentMainScroll();
    engine.state.activeTab = 'tab-modulos';
    engine.state.currentModuleId = moduleId;
    engine.state.moduleLessonFilter = 'all';

    pushHistoryStep('detail');

    runWithViewTransition(() => {
      showOnlyPane('tab-modulo-detail');
      renderAll();
      syncHeaderAndNav();
    }, 'forward');

    restoreMainScroll(0);
    onDetailShown?.();
  }

  function closeModuleDetail({ skipTransition = false, fromPopState = false } = {}) {
    if (!engine.state.currentModuleId) return;

    engine.state.currentModuleId = null;
    if (!fromPopState && window.history.state?.meuEstudoView === 'detail') {
      consumeTopHistoryStep();
    }

    const update = () => {
      showOnlyPane('tab-modulos');
      renderAll();
      syncHeaderAndNav();
    };

    if (skipTransition) {
      update();
    } else {
      runWithViewTransition(update, 'backward');
    }

    restoreMainScroll(engine.state.scrollPositions['tab-modulos'] || 0);
  }

  function registerLessonSheetCloser(fn) {
    lessonSheetCloseHook = fn;
  }

  function openLessonSheetOverlay() {
    const root = document.getElementById('sheet-lesson');
    if (!root) return;
    if (!root.classList.contains('sheet-open')) {
      pushHistoryStep('overlay');
      root.classList.add('sheet-open');
    }
  }

  function closeLessonSheetOverlay({ fromPopState = false } = {}) {
    const root = document.getElementById('sheet-lesson');
    if (!root) return;
    root.classList.remove('sheet-open');
    if (!fromPopState && window.history.state?.meuEstudoView === 'overlay') {
      consumeTopHistoryStep();
    }
  }

  function consumeDialogHistory(dialog, fromPopState = false) {
    if (!dialog || !dialogNeedsHistoryConsume.has(dialog)) return;
    dialogNeedsHistoryConsume.delete(dialog);
    if (!fromPopState && !isHandlingPopState && window.history.state?.meuEstudoView === 'overlay') {
      consumeTopHistoryStep();
    }
  }

  function openDialogOverlay(dialog) {
    if (!dialog) return;
    if (!trackedDialogs.has(dialog)) {
      trackedDialogs.add(dialog);
      dialog.addEventListener('close', () => {
        consumeDialogHistory(dialog, false);
      });
    }
    if (!dialog.open) {
      pushHistoryStep('overlay');
      dialogNeedsHistoryConsume.add(dialog);
      openModalDialog(dialog);
    }
  }

  async function closeDialogOverlay(dialog, { fromPopState = false } = {}) {
    if (!dialog) return;
    if (fromPopState) {
      dialogNeedsHistoryConsume.delete(dialog);
    }
    if (dialog.open) {
      await closeModalDialog(dialog);
    }
    consumeDialogHistory(dialog, fromPopState);
  }

  function initHistoryListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('popstate', async () => {
      if (suppressNextPopState) {
        suppressNextPopState = false;
        return;
      }

      isHandlingPopState = true;
      try {
        const sheet = document.getElementById('sheet-lesson');
        if (sheet?.classList.contains('sheet-open')) {
          if (typeof lessonSheetCloseHook === 'function') {
            lessonSheetCloseHook({ fromPopState: true });
          } else {
            closeLessonSheetOverlay({ fromPopState: true });
          }
          return;
        }

        const openDlg = document.querySelector('dialog[open]');
        if (openDlg) {
          await closeDialogOverlay(openDlg, { fromPopState: true });
          return;
        }

        if (engine.state.currentModuleId) {
          closeModuleDetail({ fromPopState: true });
        }
      } finally {
        isHandlingPopState = false;
      }
    });
  }

  return {
    isOverlayOpen,
    switchTab,
    openModuleDetail,
    closeModuleDetail,
    registerLessonSheetCloser,
    openLessonSheetOverlay,
    closeLessonSheetOverlay,
    openDialogOverlay,
    closeDialogOverlay,
    initHistoryListener
  };
}
