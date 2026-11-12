import { clearChildren, createSquircleNode, el } from '../dom.js';
import { getMedicalIconSvg, QUICK_SPECIALTY_PRESETS, UI_ICONS } from '../../icons/medical-icons.js';
import { getColorConfig } from '../../icons/palette.js';
import { reconcileKeyedList } from '../reconcile.js';
import { showToast, vibrate } from '../feedback.js';

export function createModulesView({
  engine,
  onOpenModuleDetail,
  onOpenCreateModule,
  onQuickAddLesson
}) {
  const countBadge = document.getElementById('modules-count-badge');
  const listEl = document.getElementById('modulos-list');
  const btnCreateModule = document.getElementById('btn-open-create-module');
  const btnViewList = document.getElementById('btn-view-list');
  const btnViewGrid = document.getElementById('btn-view-grid');

  btnCreateModule?.addEventListener('click', () => onOpenCreateModule?.(null));
  btnViewList?.addEventListener('click', () => {
    vibrate(8);
    engine.setViewMode('list');
  });
  btnViewGrid?.addEventListener('click', () => {
    vibrate(8);
    engine.setViewMode('grid');
  });

  function createQuickAddButton(mod) {
    const btn = el('button', {
      type: 'button',
      className: 'icon-btn-sm touch-target',
      'aria-label': `Nova aula em ${mod.name}`,
      title: `Adicionar aula em ${mod.name}`,
      innerHTML: UI_ICONS.plus,
      onClick: (event) => {
        event.stopPropagation();
        vibrate(10);
        onQuickAddLesson?.(mod.id);
      }
    });
    return btn;
  }

  function createModuleCardNode(mod) {
    return el('article', {
      className: 'module-card'
    });
  }

  function patchModuleCardNode(card, mod, isGrid) {
    const colorObj = getColorConfig(mod.colorKey);
    const prog = engine.getModuleProgress(mod.id);
    const iconSvg = getMedicalIconSvg(mod.iconKey);

    card.className = isGrid ? 'module-card module-grid-card' : 'module-card';
    card.style.borderLeftWidth = isGrid ? '1px' : '3px';
    card.style.borderLeftColor = isGrid ? '' : colorObj.hex;

    const pills = [];
    if (prog.pendingReviews > 0) {
      pills.push(
        el(
          'span',
          { className: 'badge-pill badge-pill--danger tabular-nums' },
          el('span', { className: 'badge-dot', 'aria-hidden': 'true' }),
          `${prog.pendingReviews} rev.`
        )
      );
    }
    if (prog.pendingStudy > 0) {
      pills.push(
        el(
          'span',
          { className: 'badge-pill badge-pill--warning tabular-nums' },
          `${prog.pendingStudy} pendente${prog.pendingStudy > 1 ? 's' : ''}`
        )
      );
    }
    if (prog.totalCount === 0) {
      pills.push(el('span', { className: 'badge-pill badge-pill--neutral' }, 'Sem aulas'));
    }

    const progressTrack = el(
      'div',
      { className: 'module-progress-track', 'aria-hidden': 'true' },
      el('div', {
        className: 'module-progress-fill',
        style: `width: ${prog.percent}%; background-color: ${colorObj.hex};`
      })
    );

    clearChildren(card);

    if (isGrid) {
      const top = el(
        'div',
        { className: 'module-card-top' },
        createSquircleNode(iconSvg, colorObj),
        createQuickAddButton(mod)
      );
      const title = el(
        'h3',
        { className: 'module-grid-title' },
        el('button', {
          type: 'button',
          className: 'card-open-trigger',
          'aria-label': `Abrir módulo ${mod.name}`,
          textContent: mod.name,
          onClick: () => onOpenModuleDetail?.(mod.id)
        })
      );
      const footer = el(
        'div',
        { className: 'module-grid-footer' },
        el('span', { className: 'tabular-nums', textContent: `${prog.studiedCount}/${prog.totalCount} aulas` }),
        el('span', { className: 'tabular-nums', style: `color: ${colorObj.text}; font-weight: 600;`, textContent: `${prog.percent}%` })
      );
      const badgeWrap = pills.length > 0 ? el('div', { className: 'module-card-meta' }, pills[0]) : null;
      card.append(top, title, badgeWrap || el('div', { className: 'module-card-meta' }), footer, progressTrack);
      return;
    }

    const row = el(
      'div',
      { className: 'module-card-row' },
      createSquircleNode(iconSvg, colorObj),
      el(
        'div',
        { className: 'module-card-body' },
        el(
          'div',
          { className: 'module-card-top' },
          el(
            'h3',
            { className: 'module-card-title' },
            el('button', {
              type: 'button',
              className: 'card-open-trigger',
              'aria-label': `Abrir módulo ${mod.name}`,
              textContent: mod.name,
              onClick: () => onOpenModuleDetail?.(mod.id)
            })
          ),
          el('span', {
            className: 'tabular-nums',
            style: `color: ${colorObj.text}; font-size: 0.78rem; font-weight: 600; flex-shrink: 0;`,
            textContent: `${prog.percent}%`
          })
        ),
        el(
          'div',
          { className: 'module-card-meta' },
          el('span', { className: 'tabular-nums', textContent: `${prog.studiedCount}/${prog.totalCount} aulas` }),
          ...pills
        ),
        progressTrack
      ),
      createQuickAddButton(mod)
    );
    card.appendChild(row);
  }

  function renderEmptyState() {
    clearChildren(listEl);
    listEl.className = 'modules-list';

    const presetButtons = QUICK_SPECIALTY_PRESETS.slice(0, 6).map((preset) => {
      const colorObj = getColorConfig(preset.color);
      return el(
        'button',
        {
          type: 'button',
          className: 'preset-btn',
          onClick: () => {
            vibrate(14);
            engine.saveModule({
              name: preset.name,
              iconKey: preset.icon,
              colorKey: preset.color
            });
            showToast(`${preset.name} adicionada`);
          }
        },
        createSquircleNode(getMedicalIconSvg(preset.icon), colorObj, 'module-squircle--sm'),
        el('span', { className: 'preset-label', textContent: preset.short })
      );
    });

    const emptyCard = el(
      'div',
      { className: 'empty-card' },
      el('div', { className: 'empty-icon-box', innerHTML: UI_ICONS.book, 'aria-hidden': 'true' }),
      el('h3', { className: 'empty-title', textContent: 'Seu caderno médico' }),
      el('p', {
        className: 'empty-copy',
        textContent: 'Toque em um eixo clínico para criar instantaneamente ou personalize seu primeiro módulo.'
      }),
      el('div', { className: 'presets-grid' }, ...presetButtons),
      el(
        'button',
        {
          type: 'button',
          className: 'btn-primary',
          style: 'width: 100%; margin-top: 16px;',
          onClick: () => onOpenCreateModule?.(null)
        },
        el('span', { innerHTML: UI_ICONS.plus, 'aria-hidden': 'true' }),
        el('span', { textContent: 'Personalizar Novo Módulo' })
      )
    );

    listEl.appendChild(emptyCard);
  }

  function render() {
    const modules = engine.state.modules;
    if (countBadge) {
      countBadge.textContent = String(modules.length);
    }

    const isGrid = engine.state.moduleViewMode === 'grid';
    btnViewList?.classList.toggle('is-active', !isGrid);
    btnViewGrid?.classList.toggle('is-active', isGrid);

    if (!listEl) return;

    if (modules.length === 0) {
      renderEmptyState();
      return;
    }

    // Se saiu do estado vazio, limpa o empty-card antes da reconciliação por chave
    if (listEl.querySelector('.empty-card')) {
      clearChildren(listEl);
    }

    listEl.className = isGrid ? 'modules-grid' : 'modules-list';

    reconcileKeyedList(
      listEl,
      modules,
      (mod) => `${mod.id}:${isGrid ? 'grid' : 'list'}`,
      (mod) => createModuleCardNode(mod),
      (node, mod) => patchModuleCardNode(node, mod, isGrid)
    );
  }

  return { render };
}
