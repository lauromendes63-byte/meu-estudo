import { clearChildren, createSquircleNode, el } from '../dom.js';
import { getMedicalIconSvg, UI_ICONS } from '../../icons/medical-icons.js';
import { getColorConfig } from '../../icons/palette.js';
import { formatDateDisplay } from '../../domain/dates.js';
import { createSwipeListController } from '../gestures.js';
import { showToast, triggerCelebration, vibrate } from '../feedback.js';

export function createStudyView({ engine, onQuickAddLesson, onViewLesson }) {
  const segmentedEl = document.getElementById('study-segmented-control');
  const btnRevisar = document.getElementById('btn-subtab-revisar');
  const btnEstudar = document.getElementById('btn-subtab-estudar');
  const countRevisarEl = document.getElementById('subtab-count-revisar');
  const countEstudarEl = document.getElementById('subtab-count-estudar');
  const paneRevisar = document.getElementById('subpane-revisar');
  const paneEstudar = document.getElementById('subpane-estudar');
  const revisoesListHost = document.getElementById('estudo-revisoes-list');
  const moduleFiltersEl = document.getElementById('estudo-module-filters');
  const pendentesListHost = document.getElementById('estudo-pendentes-list');
  const btnQuickAdd = document.getElementById('btn-quick-add-lesson-estudo');
  const statusRegion = document.getElementById('study-swipe-status');

  const swipeController = createSwipeListController({
    getStatusEl: () => statusRegion,
    onCommitItem: async (item) => {
      const kind = item.dataset.swipeKind;
      const lessonId = item.dataset.lessonId;
      const stage = item.dataset.stage;

      if (kind === 'review' && lessonId && stage) {
        const res = engine.completeReview(lessonId, stage);
        if (!res) return;
        const doneAll = res.remainingToday === 0;
        vibrate(doneAll ? [16, 30, 16] : [12, 22, 12]);
        triggerCelebration({ fullDayComplete: doneAll });
        showToast({
          message: doneAll
            ? 'Todas as revisões de hoje concluídas'
            : `Revisão ${stage.toUpperCase()} concluída`,
          undoFn: res.undo
        });
      } else if (kind === 'study' && lessonId) {
        const res = engine.toggleLessonStudied(lessonId);
        if (!res) return;
        vibrate([12, 22, 12]);
        triggerCelebration();
        showToast({
          message: 'Aula concluída — D+1, D+7 e D+30 agendados',
          undoFn: res.undo
        });
      }
    }
  });

  function switchSubTab(target) {
    engine.state.studySubTab = target === 'estudar' ? 'estudar' : 'revisar';
    render();
    refreshVisibleLists();
  }

  btnRevisar?.addEventListener('click', () => {
    vibrate(8);
    switchSubTab('revisar');
  });
  btnEstudar?.addEventListener('click', () => {
    vibrate(8);
    switchSubTab('estudar');
  });
  btnQuickAdd?.addEventListener('click', () => {
    const preMod =
      engine.state.estudoModuleFilter !== 'all' ? engine.state.estudoModuleFilter : null;
    onQuickAddLesson?.(preMod);
  });

  function buildReviewSwipeItem(item) {
    const mod = engine.getModule(item.lesson.moduleId);
    const colorObj = getColorConfig(mod?.colorKey);
    const numStr = `Aula ${String(item.lesson.number).padStart(2, '0')}`;
    const stageLabel = item.stage.toUpperCase();
    const isOverdue = item.status === 'atrasada';

    const actionBtn = el(
      'button',
      {
        type: 'button',
        className: 'SwipeableList-action touch-target',
        dataset: { direction: 'right' }
      },
      el('span', { textContent: `Concluir ${stageLabel}` }),
      el('span', { className: 'visually-hidden', textContent: ` ${item.lesson.title}` })
    );

    const content = el(
      'div',
      {
        className: 'SwipeableList-content'
      },
      createSquircleNode(getMedicalIconSvg(mod?.iconKey || 'heart'), colorObj, 'module-squircle--sm'),
      el(
        'div',
        { className: 'lesson-card-main' },
        el(
          'div',
          { className: 'lesson-meta-row' },
          el('span', {
            className: `badge-pill ${isOverdue ? 'badge-pill--danger' : 'badge-pill--warning'} tabular-nums`,
            textContent: stageLabel
          }),
          el('span', {
            className: 'badge-pill badge-pill--neutral',
            textContent: mod ? mod.name : 'Módulo'
          }),
          isOverdue
            ? el('span', {
                className: 'tabular-nums',
                style: 'font-size: 0.7rem; color: var(--tone-danger); font-weight: 600;',
                textContent: formatDateDisplay(item.dueDate)
              })
            : null
        ),
        el(
          'h4',
          { className: 'lesson-title SwipeableList-label' },
          el('button', {
            type: 'button',
            className: 'card-open-trigger',
            'aria-label': `Abrir ${item.lesson.title}`,
            textContent: item.lesson.title,
            onClick: () => onViewLesson?.(item.lesson.id)
          })
        ),
        el('p', { className: 'lesson-preview tabular-nums', textContent: numStr })
      ),
      actionBtn
    );

    const li = el(
      'li',
      {
        className: 'SwipeableList-item',
        dataset: {
          key: `rev:${item.lesson.id}:${item.stage}`,
          swipeKind: 'review',
          lessonId: item.lesson.id,
          stage: item.stage
        }
      },
      el('div', { className: 'SwipeableList-track' }, content)
    );
    return li;
  }

  function buildStudySwipeItem(lesson) {
    const mod = engine.getModule(lesson.moduleId);
    const colorObj = getColorConfig(mod?.colorKey);
    const numStr = `Aula ${String(lesson.number).padStart(2, '0')}`;

    const actionBtn = el(
      'button',
      {
        type: 'button',
        className: 'SwipeableList-action touch-target',
        dataset: { direction: 'right' }
      },
      el('span', { textContent: 'Estudada' }),
      el('span', { className: 'visually-hidden', textContent: ` ${lesson.title}` })
    );

    const content = el(
      'div',
      {
        className: 'SwipeableList-content'
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
          el('span', {
            className: 'badge-pill badge-pill--neutral',
            textContent: mod ? mod.name : 'Módulo'
          })
        ),
        el(
          'h4',
          { className: 'lesson-title SwipeableList-label' },
          el('button', {
            type: 'button',
            className: 'card-open-trigger',
            'aria-label': `Abrir ${lesson.title}`,
            textContent: lesson.title,
            onClick: () => onViewLesson?.(lesson.id)
          })
        ),
        lesson.notes
          ? el('p', { className: 'lesson-preview', textContent: lesson.notes.replace(/\n+/g, ' ') })
          : null
      ),
      actionBtn
    );

    return el(
      'li',
      {
        className: 'SwipeableList-item',
        dataset: {
          key: `study:${lesson.id}`,
          swipeKind: 'study',
          lessonId: lesson.id
        }
      },
      el('div', { className: 'SwipeableList-track' }, content)
    );
  }

  function renderReviewsPane(overdue, dueToday) {
    if (!revisoesListHost) return;
    clearChildren(revisoesListHost);

    const total = overdue.length + dueToday.length;
    if (total === 0) {
      const upcoming = engine.getUpcomingReviews(5);
      const upcomingNodes =
        upcoming.length > 0
          ? el(
              'div',
              { className: 'upcoming-card' },
              el('span', {
                className: 'field-label',
                textContent: 'Próximas revisões agendadas'
              }),
              el(
                'div',
                { className: 'upcoming-list' },
                ...upcoming.map((item) => {
                  const mod = engine.getModule(item.lesson.moduleId);
                  return el(
                    'button',
                    {
                      type: 'button',
                      className: 'upcoming-row',
                      onClick: () => onViewLesson?.(item.lesson.id)
                    },
                    el(
                      'div',
                      { style: 'min-width: 0; flex: 1;' },
                      el('div', {
                        style: 'font-size: 0.82rem; font-weight: 600; color: var(--ink-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
                        textContent: item.lesson.title
                      }),
                      el('div', {
                        style: 'font-size: 0.72rem; color: var(--ink-muted);',
                        textContent: `${mod ? mod.name : 'Módulo'} • ${item.stage.toUpperCase()}`
                      })
                    ),
                    el('span', {
                      className: 'badge-pill badge-pill--navy tabular-nums',
                      textContent: formatDateDisplay(item.dueDate)
                    })
                  );
                })
              )
            )
          : null;

      revisoesListHost.appendChild(
        el(
          'div',
          { className: 'empty-card' },
          el('div', { className: 'empty-icon-box', innerHTML: UI_ICONS.check, 'aria-hidden': 'true' }),
          el('h3', { className: 'empty-title', textContent: 'Revisões em dia' }),
          el('p', {
            className: 'empty-copy',
            textContent: 'Nenhum ciclo D+1, D+7 ou D+30 pendente para hoje.'
          }),
          upcomingNodes
        )
      );
      return;
    }

    revisoesListHost.appendChild(
      el(
        'div',
        { className: 'swipe-hint-bar' },
        el('span', { textContent: 'Deslize o card para concluir ou toque no botão' }),
        el('span', { className: 'tabular-nums', textContent: `${total} no foco` })
      )
    );

    if (overdue.length > 0) {
      revisoesListHost.appendChild(
        el(
          'div',
          { className: 'study-group-header' },
          el('h3', {
            id: 'heading-overdue-reviews',
            className: 'study-group-title is-danger',
            tabIndex: -1,
            textContent: `Em atraso (${overdue.length})`
          })
        )
      );
      const ulOverdue = el(
        'ul',
        {
          className: 'SwipeableList',
          role: 'list',
          'aria-labelledby': 'heading-overdue-reviews'
        },
        ...overdue.map(buildReviewSwipeItem)
      );
      swipeController.setupList(ulOverdue);
      revisoesListHost.appendChild(ulOverdue);
    }

    if (dueToday.length > 0) {
      revisoesListHost.appendChild(
        el(
          'div',
          { className: 'study-group-header' },
          el('h3', {
            id: 'heading-today-reviews',
            className: 'study-group-title is-warning',
            tabIndex: -1,
            textContent: `Vencendo hoje (${dueToday.length})`
          })
        )
      );
      const ulToday = el(
        'ul',
        {
          className: 'SwipeableList',
          role: 'list',
          'aria-labelledby': 'heading-today-reviews'
        },
        ...dueToday.map(buildReviewSwipeItem)
      );
      swipeController.setupList(ulToday);
      revisoesListHost.appendChild(ulToday);
    }
  }

  function renderUnstudiedPane(unstudied) {
    if (moduleFiltersEl) {
      clearChildren(moduleFiltersEl);
      if (engine.state.modules.length > 0 && unstudied.length > 0) {
        const countsByMod = new Map();
        for (const l of unstudied) {
          countsByMod.set(l.moduleId, (countsByMod.get(l.moduleId) || 0) + 1);
        }

        const chips = [
          el(
            'button',
            {
              type: 'button',
              className: `filter-chip ${engine.state.estudoModuleFilter === 'all' ? 'is-active' : ''}`,
              onClick: () => {
                engine.state.estudoModuleFilter = 'all';
                render();
                refreshVisibleLists();
              }
            },
            el('span', { textContent: 'Todos' }),
            el('span', { className: 'tabular-nums', textContent: String(unstudied.length) })
          )
        ];

        for (const mod of engine.state.modules) {
          const count = countsByMod.get(mod.id) || 0;
          if (count === 0) continue;
          const isActive = engine.state.estudoModuleFilter === mod.id;
          chips.push(
            el(
              'button',
              {
                type: 'button',
                className: `filter-chip ${isActive ? 'is-active' : ''}`,
                onClick: () => {
                  engine.state.estudoModuleFilter = mod.id;
                  render();
                  refreshVisibleLists();
                }
              },
              el('span', { textContent: mod.name }),
              el('span', { className: 'tabular-nums', textContent: String(count) })
            )
          );
        }
        moduleFiltersEl.append(...chips);
      }
    }

    if (!pendentesListHost) return;
    clearChildren(pendentesListHost);

    const activeFilter = engine.state.estudoModuleFilter;
    const filtered =
      activeFilter && activeFilter !== 'all'
        ? unstudied.filter((l) => l.moduleId === activeFilter)
        : unstudied;

    if (filtered.length === 0) {
      pendentesListHost.appendChild(
        el(
          'div',
          { className: 'empty-card' },
          el('div', { className: 'empty-icon-box', innerHTML: UI_ICONS.book, 'aria-hidden': 'true' }),
          el('h3', { className: 'empty-title', textContent: 'Sem aulas na fila' }),
          el('p', {
            className: 'empty-copy',
            textContent: 'Todas as aulas cadastradas foram estudadas ou nenhum módulo possui pendências.'
          }),
          el(
            'button',
            {
              type: 'button',
              className: 'btn-primary',
              style: 'margin-top: 16px;',
              onClick: () => onQuickAddLesson?.(null)
            },
            el('span', { innerHTML: UI_ICONS.plus, 'aria-hidden': 'true' }),
            el('span', { textContent: 'Adicionar Nova Aula' })
          )
        )
      );
      return;
    }

    pendentesListHost.append(
      el(
        'div',
        { className: 'study-group-header' },
        el('h3', {
          id: 'heading-pending-lessons',
          className: 'study-group-title is-navy',
          tabIndex: -1,
          textContent: `Fila de estudo (${filtered.length})`
        })
      )
    );

    const ulPending = el(
      'ul',
      {
        className: 'SwipeableList',
        role: 'list',
        'aria-labelledby': 'heading-pending-lessons'
      },
      ...filtered.map(buildStudySwipeItem)
    );
    swipeController.setupList(ulPending);
    pendentesListHost.appendChild(ulPending);
  }

  function refreshVisibleLists() {
    requestAnimationFrame(() => {
      document.querySelectorAll('#tab-estudo .SwipeableList').forEach((list) => {
        swipeController.refresh(list);
      });
    });
  }

  function render() {
    const overdue = engine.getReviewsOverdue();
    const dueToday = engine.getReviewsDueToday();
    const unstudied = engine.state.lessons.filter((l) => !l.isStudied);
    const totalReviews = overdue.length + dueToday.length;

    if (countRevisarEl) countRevisarEl.textContent = String(totalReviews);
    if (countEstudarEl) countEstudarEl.textContent = String(unstudied.length);

    const activeSubTab = engine.state.studySubTab || 'revisar';
    if (segmentedEl) segmentedEl.dataset.active = activeSubTab;
    btnRevisar?.classList.toggle('is-active', activeSubTab === 'revisar');
    btnEstudar?.classList.toggle('is-active', activeSubTab === 'estudar');

    if (paneRevisar) paneRevisar.hidden = activeSubTab !== 'revisar';
    if (paneEstudar) paneEstudar.hidden = activeSubTab !== 'estudar';

    renderReviewsPane(overdue, dueToday);
    renderUnstudiedPane(unstudied);
  }

  return { render, refreshVisibleLists };
}
