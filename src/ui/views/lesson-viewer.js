import { clearChildren, el } from '../dom.js';
import { formatDateDisplay } from '../../domain/dates.js';
import { buildNotesFragment } from '../../domain/notes-parser.js';
import { REVIEW_STAGES } from '../../domain/study-engine.js';
import { askConfirmation, wireDialogBackdropDismiss } from '../overlays.js';
import { attachSheetDrag } from '../gestures.js';
import { showToast, triggerCelebration, vibrate } from '../feedback.js';

const STAGE_TITLES = {
  d1: 'D+1',
  d7: 'D+7',
  d30: 'D+30'
};

export function createLessonViewer({ engine, router, onEditLesson, onOpenModuleDetail }) {
  const dlg = document.getElementById('modal-view-lesson');
  const dragSurface = dlg?.querySelector('.dialog-card');
  const dragHandle = dlg?.querySelector('[data-dialog-drag]');
  const btnClose = document.getElementById('btn-close-view-lesson');
  const badgeEl = document.getElementById('view-lesson-badge');
  const modTagBtn = document.getElementById('view-lesson-module-tag');
  const titleEl = document.getElementById('view-lesson-title');
  const toggleBtn = document.getElementById('view-lesson-toggle-status');
  const scheduleGrid = document.getElementById('view-lesson-schedule-grid');
  const notesContentEl = document.getElementById('view-lesson-notes-content');
  const btnEdit = document.getElementById('btn-edit-lesson-trigger');
  const btnDelete = document.getElementById('btn-delete-lesson-trigger');

  let viewingLessonId = null;

  async function close() {
    await router.closeDialogOverlay(dlg);
  }

  wireDialogBackdropDismiss(dlg, close);
  btnClose?.addEventListener('click', close);
  attachSheetDrag({ surface: dragSurface, handle: dragHandle, onDismiss: close });

  function renderCurrentLesson() {
    if (!viewingLessonId) return;
    const lesson = engine.getLesson(viewingLessonId);
    if (!lesson) {
      close();
      return;
    }

    const mod = engine.getModule(lesson.moduleId);
    const numStr = `Aula ${String(lesson.number).padStart(2, '0')}`;
    const todayStr = engine.getTodayStr();

    if (badgeEl) badgeEl.textContent = numStr;
    if (modTagBtn) modTagBtn.textContent = mod ? mod.name : 'Módulo';
    if (titleEl) titleEl.textContent = lesson.title;

    if (toggleBtn) {
      toggleBtn.textContent = lesson.isStudied ? 'Estudada' : 'Marcar como estudada';
      toggleBtn.className = lesson.isStudied
        ? 'status-toggle-btn is-studied'
        : 'status-toggle-btn';
    }

    if (scheduleGrid) {
      clearChildren(scheduleGrid);
      for (const stage of REVIEW_STAGES) {
        const rev = lesson.reviews?.[stage];
        let stateClass = '';
        let dateText = '—';
        let statusText = 'Pendente';

        if (!lesson.isStudied || !rev) {
          statusText = 'Aguardando';
        } else {
          dateText = formatDateDisplay(rev.dueDate);
          if (rev.done) {
            stateClass = 'is-done';
            statusText = 'Feita';
          } else if (rev.dueDate < todayStr) {
            stateClass = 'is-overdue';
            statusText = 'Atrasada';
          } else if (rev.dueDate === todayStr) {
            stateClass = 'is-today';
            statusText = 'Hoje';
          } else {
            statusText = 'Agendada';
          }
        }

        const stageBtn = el(
          'button',
          {
            type: 'button',
            className: `review-stage-btn ${stateClass}`.trim(),
            disabled: !lesson.isStudied || !rev,
            onClick: () => {
              const res = engine.toggleReviewStage(lesson.id, stage);
              if (!res) return;
              vibrate(res.done ? [12, 22, 12] : 8);
              if (res.done) triggerCelebration();
              renderCurrentLesson();
            }
          },
          el('div', {
            className: 'tabular-nums',
            style: 'font-size: 0.72rem; font-weight: 700;',
            textContent: STAGE_TITLES[stage]
          }),
          el('div', {
            className: 'tabular-nums',
            style: 'font-size: 0.7rem; opacity: 0.85; margin-top: 2px;',
            textContent: dateText
          }),
          el('div', {
            style: 'font-size: 0.65rem; font-weight: 600; margin-top: 2px;',
            textContent: statusText
          })
        );
        scheduleGrid.appendChild(stageBtn);
      }
    }

    if (notesContentEl) {
      clearChildren(notesContentEl);
      notesContentEl.appendChild(buildNotesFragment(document, lesson.notes || ''));
    }
  }

  modTagBtn?.addEventListener('click', async () => {
    const lesson = viewingLessonId ? engine.getLesson(viewingLessonId) : null;
    if (!lesson) return;
    await close();
    onOpenModuleDetail?.(lesson.moduleId);
  });

  toggleBtn?.addEventListener('click', () => {
    if (!viewingLessonId) return;
    const res = engine.toggleLessonStudied(viewingLessonId);
    if (!res) return;
    if (res.isStudied) {
      vibrate([12, 24, 14]);
      triggerCelebration();
      showToast({ message: 'Estudada — ciclos D+1/D+7/D+30 criados', undoFn: res.undo });
    } else {
      vibrate(8);
      showToast({ message: 'Estudo desmarcado', undoFn: res.undo });
    }
    renderCurrentLesson();
  });

  btnEdit?.addEventListener('click', async () => {
    const targetId = viewingLessonId;
    if (!targetId) return;
    await close();
    onEditLesson?.(targetId);
  });

  btnDelete?.addEventListener('click', async () => {
    const lesson = viewingLessonId ? engine.getLesson(viewingLessonId) : null;
    if (!lesson) return;

    const ok = await askConfirmation({
      title: `Excluir "${lesson.title}"?`,
      message: 'Esta ação remove a aula e seus ciclos de revisão.',
      confirmLabel: 'Excluir Aula',
      danger: true
    });
    if (ok) {
      const deleted = engine.deleteLesson(lesson.id);
      await close();
      if (deleted) {
        vibrate(14);
        showToast({ message: 'Aula excluída', undoFn: deleted.undo });
      }
    }
  });

  function open(lessonId) {
    if (!engine.getLesson(lessonId)) return;
    viewingLessonId = lessonId;
    renderCurrentLesson();
    router.openDialogOverlay(dlg);
  }

  return { open, renderIfOpen: renderCurrentLesson };
}
