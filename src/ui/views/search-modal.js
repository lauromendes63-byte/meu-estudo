import { clearChildren, createSquircleNode, el } from '../dom.js';
import { getMedicalIconSvg, UI_ICONS } from '../../icons/medical-icons.js';
import { getColorConfig } from '../../icons/palette.js';
import { wireDialogBackdropDismiss } from '../overlays.js';
import { attachSheetDrag } from '../gestures.js';

export function createSearchModal({ engine, router, onOpenModuleDetail, onViewLesson }) {
  const dlg = document.getElementById('modal-search');
  const dragSurface = dlg?.querySelector('.dialog-card');
  const dragHandle = dlg?.querySelector('[data-dialog-drag]');
  const form = document.getElementById('form-global-search');
  const inputEl = document.getElementById('global-search-input');
  const btnClose = document.getElementById('btn-close-modal-search');
  const resultsEl = document.getElementById('global-search-results');
  const chipBtns = Array.from(document.querySelectorAll('.search-chip-btn'));

  async function close() {
    await router.closeDialogOverlay(dlg);
  }

  wireDialogBackdropDismiss(dlg, close);
  btnClose?.addEventListener('click', close);
  attachSheetDrag({ surface: dragSurface, handle: dragHandle, onDismiss: close });

  function syncActiveChip(currentQuery) {
    for (const btn of chipBtns) {
      const chipVal = btn.dataset.searchChip || '';
      btn.classList.toggle('is-active', currentQuery.trim() === chipVal);
    }
  }

  function renderResults(rawQuery = '') {
    if (!resultsEl) return;
    clearChildren(resultsEl);
    syncActiveChip(rawQuery);

    const { mode, modules, lessons } = engine.querySearch(rawQuery);

    if (modules.length === 0 && lessons.length === 0) {
      resultsEl.appendChild(
        el(
          'div',
          { style: 'text-align: center; padding: 28px 12px; color: var(--ink-muted); font-size: 0.82rem;' },
          'Nenhum resultado encontrado para este filtro.'
        )
      );
      return;
    }

    if (modules.length > 0) {
      resultsEl.appendChild(
        el('div', {
          className: 'field-label',
          style: 'margin-bottom: 6px;',
          textContent: mode === 'recent' ? 'Módulos' : `Módulos (${modules.length})`
        })
      );

      const modGrid = el('div', {
        style: 'display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px;'
      });

      for (const mod of modules) {
        const colorObj = getColorConfig(mod.colorKey);
        const btn = el(
          'button',
          {
            type: 'button',
            style: 'display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 12px; border: 1px solid var(--border-subtle); background: var(--bg-canvas); text-align: left; min-width: 0;',
            onClick: async () => {
              await close();
              onOpenModuleDetail?.(mod.id);
            }
          },
          createSquircleNode(getMedicalIconSvg(mod.iconKey), colorObj, 'module-squircle--sm'),
          el('span', {
            style: 'font-size: 0.78rem; font-weight: 600; color: var(--ink-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
            textContent: mod.name
          })
        );
        modGrid.appendChild(btn);
      }

      resultsEl.appendChild(modGrid);
    }

    if (lessons.length > 0) {
      resultsEl.appendChild(
        el('div', {
          className: 'field-label',
          style: 'margin-bottom: 6px;',
          textContent: mode === 'recent' ? 'Aulas recentes' : `Aulas (${lessons.length})`
        })
      );

      const stack = el('div', { className: 'lessons-stack' });
      for (const lesson of lessons) {
        const mod = engine.getModule(lesson.moduleId);
        const colorObj = getColorConfig(mod?.colorKey);
        const numStr = `Aula ${String(lesson.number).padStart(2, '0')}`;

        const row = el(
          'button',
          {
            type: 'button',
            className: 'lesson-card',
            style: 'width: 100%; text-align: left;',
            onClick: async () => {
              await close();
              onViewLesson?.(lesson.id);
            }
          },
          createSquircleNode(getMedicalIconSvg(mod?.iconKey || 'heart'), colorObj, 'module-squircle--sm'),
          el(
            'div',
            { className: 'lesson-card-main' },
            el(
              'div',
              { className: 'lesson-meta-row' },
              el('span', {
                className: 'lesson-num-tag',
                style: `background-color: ${colorObj.bg}; color: ${colorObj.text}; border-color: ${colorObj.border};`,
                textContent: numStr
              }),
              el('span', { className: 'badge-pill badge-pill--neutral', textContent: mod ? mod.name : 'Módulo' }),
              lesson.isStudied
                ? el('span', { className: 'badge-pill badge-pill--success', textContent: 'Estudada' })
                : null
            ),
            el('div', { className: 'lesson-title', textContent: lesson.title }),
            lesson.notes
              ? el('div', { className: 'lesson-preview', textContent: lesson.notes.replace(/\n+/g, ' ') })
              : null
          ),
          el('span', { innerHTML: UI_ICONS.chevronRight, style: 'color: var(--ink-muted);', 'aria-hidden': 'true' })
        );
        stack.appendChild(row);
      }
      resultsEl.appendChild(stack);
    }
  }

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    renderResults(inputEl?.value || '');
  });

  inputEl?.addEventListener('input', () => {
    renderResults(inputEl.value);
  });

  for (const btn of chipBtns) {
    btn.addEventListener('click', () => {
      const val = btn.dataset.searchChip || '';
      if (inputEl) inputEl.value = val;
      renderResults(val);
    });
  }

  function open() {
    if (inputEl) inputEl.value = '';
    renderResults('');
    router.openDialogOverlay(dlg);
    setTimeout(() => inputEl?.focus(), 140);
  }

  return { open };
}
