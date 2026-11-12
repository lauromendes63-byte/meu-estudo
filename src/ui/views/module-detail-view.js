import { clearChildren, createSquircleNode, el } from '../dom.js';
import { getMedicalIconSvg, UI_ICONS } from '../../icons/medical-icons.js';
import { getColorConfig } from '../../icons/palette.js';
import { formatDateDisplay } from '../../domain/dates.js';
import { askConfirmation } from '../overlays.js';
import { reconcileKeyedList } from '../reconcile.js';
import { showToast, triggerCelebration, vibrate } from '../feedback.js';

const FILTER_DEFS = [
  { key: 'all', label: 'Todas' },
  { key: 'unstudied', label: 'A Estudar' },
  { key: 'review', label: 'Revisar Hoje' },
  { key: 'studied', label: 'Estudadas' }
];

export function createModuleDetailView({
  engine,
  onBack,
  onEditModule,
  onAddLesson,
  onEditLesson,
  onViewLesson
}) {
  const summaryEl = document.getElementById('module-summary-card');
  const filtersEl = document.getElementById('module-detail-filters');
  const lessonsListEl = document.getElementById('module-lessons-list');

  const btnBack = document.getElementById('btn-back-to-modules');
  const btnEditMod = document.getElementById('btn-edit-current-module');
  const btnDeleteMod = document.getElementById('btn-delete-current-module');
  const btnAddLesson = document.getElementById('btn-add-lesson-in-module');

  btnBack?.addEventListener('click', () => onBack?.());
  btnEditMod?.addEventListener('click', () => {
    if (engine.state.currentModuleId) {
      onEditModule?.(engine.state.currentModuleId);
    }
  });
  btnDeleteMod?.addEventListener('click', async () => {
    const mod = engine.getModule(engine.state.currentModuleId);
    if (!mod) return;
    const confirmed = await askConfirmation({
      title: `Excluir "${mod.name}"?`,
      message: 'Todas as aulas e provas vinculadas a este módulo serão removidas permanentemente.',
      confirmLabel: 'Excluir Módulo',
      danger: true
    });
    if (confirmed) {
      engine.deleteModule(mod.id);
      vibrate([15, 25, 15]);
      showToast('Módulo removido');
      onBack?.({ skipTransition: true });
    }
  });
  btnAddLesson?.addEventListener('click', () => {
    if (engine.state.currentModuleId) {
      onAddLesson?.(engine.state.currentModuleId);
    }
  });

  function isLessonReviewDue(lesson, todayStr) {
    if (!lesson.isStudied || !lesson.reviews) return false;
    return Object.values(lesson.reviews).some((rev) => rev && !rev.done && rev.dueDate <= todayStr);
  }

  function toggleFilter(nextFilter) {
    engine.state.moduleLessonFilter =
      engine.state.moduleLessonFilter === nextFilter && nextFilter !== 'all' ? 'all' : nextFilter;
    vibrate(8);
    render();
  }

  function renderSummary(mod, colorObj, prog) {
    if (!summaryEl) return;
    clearChildren(summaryEl);

    const pendingBadges = [];
    if (prog.pendingStudy > 0) {
      pendingBadges.push(
        el(
          'button',
          {
            type: 'button',
            className: 'badge-pill badge-pill--warning',
            onClick: () => toggleFilter('unstudied')
          },
          `${prog.pendingStudy} para estudar`
        )
      );
    }
    if (prog.pendingReviews > 0) {
      pendingBadges.push(
        el(
          'button',
          {
            type: 'button',
            className: 'badge-pill badge-pill--danger',
            onClick: () => toggleFilter('review')
          },
          el('span', { className: 'badge-dot', 'aria-hidden': 'true' }),
          `${prog.pendingReviews} revisar hoje`
        )
      );
    }

    summaryEl.append(
      el(
        'div',
        { className: 'summary-head' },
        createSquircleNode(getMedicalIconSvg(mod.iconKey), colorObj, 'module-squircle--lg'),
        el(
          'div',
          { className: 'summary-info' },
          el('h2', { className: 'summary-title', textContent: mod.name }),
          el('p', {
            className: 'summary-subtitle tabular-nums',
            textContent: `${prog.studiedCount} de ${prog.totalCount} aulas estudadas`
          }),
          pendingBadges.length > 0
            ? el('div', { className: 'module-card-meta', style: 'margin-top: 6px;' }, ...pendingBadges)
            : null
        ),
        el('span', {
          className: 'summary-pct',
          style: `color: ${colorObj.text};`,
          textContent: `${prog.percent}%`
        })
      ),
      el(
        'div',
        { className: 'module-progress-track', style: 'margin-top: 12px;' },
        el('div', {
          className: 'module-progress-fill',
          style: `width: ${prog.percent}%; background-color: ${colorObj.hex};`
        })
      )
    );
  }

  function renderFilters(lessons, todayStr) {
    if (!filtersEl) return;
    clearChildren(filtersEl);

    const counts = {
      all: lessons.length,
      unstudied: lessons.filter((l) => !l.isStudied).length,
      review: lessons.filter((l) => isLessonReviewDue(l, todayStr)).length,
      studied: lessons.filter((l) => l.isStudied).length
    };

    for (const def of FILTER_DEFS) {
      const isActive = engine.state.moduleLessonFilter === def.key;
      const chip = el(
        'button',
        {
          type: 'button',
          className: `filter-chip ${isActive ? 'is-active' : ''}`,
          onClick: () => toggleFilter(def.key)
        },
        el('span', { textContent: def.label }),
        el('span', { className: 'tabular-nums', style: 'opacity: 0.8;', textContent: String(counts[def.key]) })
      );
      filtersEl.appendChild(chip);
    }
  }

  function createLessonRowNode() {
    return el('article', {
      className: 'lesson-card'
    });
  }

  function patchLessonRowNode(row, lesson, colorObj, todayStr) {
    const dueNow = isLessonReviewDue(lesson, todayStr);
    const numStr = `Aula ${String(lesson.number).padStart(2, '0')}`;

    clearChildren(row);

    const metaChildren = [
      el('span', {
        className: 'lesson-num-tag',
        style: `background-color: ${colorObj.bg}; color: ${colorObj.text}; border-color: ${colorObj.border};`,
        textContent: numStr
      })
    ];

    if (dueNow) {
      metaChildren.push(
        el(
          'span',
          { className: 'badge-pill badge-pill--danger' },
          el('span', { className: 'badge-dot', 'aria-hidden': 'true' }),
          'Revisar hoje'
        )
      );
    } else if (lesson.isStudied && lesson.studiedAt) {
      metaChildren.push(
        el('span', {
          className: 'badge-pill badge-pill--neutral tabular-nums',
          textContent: formatDateDisplay(lesson.studiedAt)
        })
      );
    }

    const mainCol = el(
      'div',
      { className: 'lesson-card-main' },
      el('div', { className: 'lesson-meta-row' }, ...metaChildren),
      el(
        'h4',
        { className: 'lesson-title' },
        el('button', {
          type: 'button',
          className: 'card-open-trigger',
          'aria-label': `Abrir ${numStr}: ${lesson.title}`,
          textContent: lesson.title,
          onClick: () => onViewLesson?.(lesson.id)
        })
      ),
      lesson.notes
        ? el('p', { className: 'lesson-preview', textContent: lesson.notes.replace(/\n+/g, ' ') })
        : null
    );

    const editBtn = el('button', {
      type: 'button',
      className: 'icon-btn-sm touch-target',
      'aria-label': `Editar ${numStr}`,
      title: 'Editar aula',
      innerHTML: UI_ICONS.edit,
      onClick: (event) => {
        event.stopPropagation();
        onEditLesson?.(lesson.id);
      }
    });

    const toggleBtn = el(
      'button',
      {
        type: 'button',
        className: `status-toggle-btn touch-target ${lesson.isStudied ? 'is-studied' : ''}`,
        'aria-label': lesson.isStudied ? `Desmarcar estudo de ${numStr}` : `Marcar ${numStr} como estudada`,
        onClick: (event) => {
          event.stopPropagation();
          const res = engine.toggleLessonStudied(lesson.id);
          if (!res) return;
          if (res.isStudied) {
            vibrate([12, 24, 14]);
            triggerCelebration();
            showToast({
              message: `${numStr} concluída — ciclos D+1/D+7/D+30 agendados`,
              undoFn: res.undo
            });
          } else {
            vibrate(10);
            showToast({
              message: `${numStr} marcada como pendente`,
              undoFn: res.undo
            });
          }
        }
      },
      lesson.isStudied
        ? el('span', { innerHTML: UI_ICONS.check, style: 'width: 14px; height: 14px; display: inline-flex;' })
        : null,
      el('span', { textContent: lesson.isStudied ? 'Estudada' : 'Estudar' })
    );

    row.append(mainCol, el('div', { className: 'lesson-card-actions' }, editBtn, toggleBtn));
  }

  function render() {
    const moduleId = engine.state.currentModuleId;
    if (!moduleId) return;

    const mod = engine.getModule(moduleId);
    if (!mod) return;

    const colorObj = getColorConfig(mod.colorKey);
    const prog = engine.getModuleProgress(mod.id);
    const todayStr = engine.getTodayStr();

    renderSummary(mod, colorObj, prog);
    renderFilters(prog.lessons, todayStr);

    if (!lessonsListEl) return;

    const filter = engine.state.moduleLessonFilter || 'all';
    const visibleLessons = prog.lessons.filter((lesson) => {
      if (filter === 'unstudied') return !lesson.isStudied;
      if (filter === 'studied') return Boolean(lesson.isStudied);
      if (filter === 'review') return isLessonReviewDue(lesson, todayStr);
      return true;
    });

    if (visibleLessons.length === 0) {
      clearChildren(lessonsListEl);
      const emptyMsg =
        prog.lessons.length === 0
          ? 'Nenhuma aula cadastrada neste módulo ainda.'
          : 'Nenhuma aula encontrada neste filtro.';
      lessonsListEl.appendChild(
        el(
          'div',
          { className: 'empty-card' },
          el('h3', { className: 'empty-title', textContent: prog.lessons.length === 0 ? 'Comece por aqui' : 'Tudo limpo' }),
          el('p', { className: 'empty-copy', textContent: emptyMsg })
        )
      );
      return;
    }

    if (lessonsListEl.querySelector('.empty-card')) {
      clearChildren(lessonsListEl);
    }

    reconcileKeyedList(
      lessonsListEl,
      visibleLessons,
      (lesson) => lesson.id,
      () => createLessonRowNode(),
      (node, lesson) => patchLessonRowNode(node, lesson, colorObj, todayStr)
    );
  }

  return { render };
}
