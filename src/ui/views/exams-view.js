import { clearChildren, createSquircleNode, el } from '../dom.js';
import { getMedicalIconSvg, UI_ICONS } from '../../icons/medical-icons.js';
import { getColorConfig } from '../../icons/palette.js';
import { daysDiff, formatDateFull } from '../../domain/dates.js';
import { askConfirmation } from '../overlays.js';
import { showToast, triggerCelebration, vibrate } from '../feedback.js';

export function createExamsView({
  engine,
  onOpenCreateExam,
  onEditExam,
  onOpenModuleDetail,
  onQuickAddLessonForExam,
  onViewLesson
}) {
  const listEl = document.getElementById('provas-list');
  const btnNewExam = document.getElementById('btn-open-create-exam');

  btnNewExam?.addEventListener('click', () => onOpenCreateExam?.());

  function getUrgencyBadge(diff) {
    if (diff < 0) {
      return { text: 'Realizada', className: 'badge-pill badge-pill--neutral' };
    }
    if (diff === 0) {
      return { text: 'HOJE', className: 'badge-pill badge-pill--danger tabular-nums' };
    }
    if (diff === 1) {
      return { text: 'Amanhã', className: 'badge-pill badge-pill--warning tabular-nums' };
    }
    if (diff <= 7) {
      return { text: `Faltam ${diff}d`, className: 'badge-pill badge-pill--warning tabular-nums' };
    }
    return { text: `Faltam ${diff}d`, className: 'badge-pill badge-pill--navy tabular-nums' };
  }

  function render() {
    if (!listEl) return;
    clearChildren(listEl);

    const exams = [...engine.state.exams].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (exams.length === 0) {
      listEl.appendChild(
        el(
          'div',
          { className: 'empty-card' },
          el('div', { className: 'empty-icon-box', innerHTML: UI_ICONS.calendar, 'aria-hidden': 'true' }),
          el('h3', { className: 'empty-title', textContent: 'Calendário livre' }),
          el('p', {
            className: 'empty-copy',
            textContent: 'Cadastre suas próximas provas para acompanhar a cobertura percentual das aulas.'
          }),
          el(
            'button',
            {
              type: 'button',
              className: 'btn-primary',
              style: 'margin-top: 16px;',
              onClick: () => onOpenCreateExam?.()
            },
            el('span', { innerHTML: UI_ICONS.plus, 'aria-hidden': 'true' }),
            el('span', { textContent: 'Cadastrar Primeira Prova' })
          )
        )
      );
      return;
    }

    const todayStr = engine.getTodayStr();

    for (const exam of exams) {
      const mod = engine.getModule(exam.moduleId);
      const colorObj = getColorConfig(mod?.colorKey);
      const diff = daysDiff(exam.date, todayStr);
      const urgency = getUrgencyBadge(diff);

      const linkedLessons = (exam.lessonIds || [])
        .map((id) => engine.getLesson(id))
        .filter(Boolean)
        .sort((a, b) => Number(a.number) - Number(b.number));
      const studiedCount = linkedLessons.filter((l) => l.isStudied).length;
      const pct = linkedLessons.length > 0 ? Math.round((studiedCount / linkedLessons.length) * 100) : 0;

      const squircleBtn = el(
        'button',
        {
          type: 'button',
          'aria-label': mod ? `Abrir módulo ${mod.name}` : 'Módulo',
          onClick: () => mod && onOpenModuleDetail?.(mod.id)
        },
        createSquircleNode(getMedicalIconSvg(mod?.iconKey || 'heart'), colorObj)
      );

      const moduleBadgeBtn = el('button', {
        type: 'button',
        className: 'badge-pill badge-pill--neutral',
        textContent: mod ? mod.name : 'Módulo',
        onClick: () => mod && onOpenModuleDetail?.(mod.id)
      });

      const addLessonBtn = el('button', {
        type: 'button',
        className: 'icon-btn-sm touch-target',
        'aria-label': `Nova aula para ${exam.name}`,
        title: 'Adicionar aula vinculada',
        innerHTML: UI_ICONS.plus,
        onClick: () => onQuickAddLessonForExam?.(exam.moduleId, exam.id)
      });

      const editBtn = el('button', {
        type: 'button',
        className: 'icon-btn-sm touch-target',
        'aria-label': `Editar prova ${exam.name}`,
        innerHTML: UI_ICONS.edit,
        onClick: () => onEditExam?.(exam.id)
      });

      const deleteBtn = el('button', {
        type: 'button',
        className: 'icon-btn-sm is-danger touch-target',
        'aria-label': `Excluir prova ${exam.name}`,
        innerHTML: UI_ICONS.trash,
        onClick: async () => {
          const ok = await askConfirmation({
            title: `Excluir "${exam.name}"?`,
            message: 'A prova será removida do cronograma, mantendo as aulas salvas normalmente.',
            confirmLabel: 'Excluir Prova',
            danger: true
          });
          if (ok) {
            engine.deleteExam(exam.id);
            vibrate(12);
            showToast('Prova excluída');
          }
        }
      });

      const detailsSection =
        linkedLessons.length > 0
          ? el(
              'details',
              { className: 'exam-details' },
              el(
                'summary',
                {},
                el('span', { textContent: `Conteúdo do edital (${studiedCount}/${linkedLessons.length})` }),
                el('span', {
                  className: 'tabular-nums',
                  style: `color: ${colorObj.text}; font-weight: 600;`,
                  textContent: `${pct}%`
                })
              ),
              el(
                'div',
                { className: 'exam-checklist' },
                ...linkedLessons.map((lesson) => {
                  const checkBtn = el('button', {
                    type: 'button',
                    className: `exam-lesson-check touch-target ${lesson.isStudied ? 'is-done' : ''}`,
                    'aria-label': lesson.isStudied
                      ? `Desmarcar ${lesson.title}`
                      : `Marcar ${lesson.title} como estudada`,
                    innerHTML: lesson.isStudied ? UI_ICONS.check : '',
                    onClick: () => {
                      const res = engine.toggleLessonStudied(lesson.id);
                      if (!res) return;
                      if (res.isStudied) {
                        vibrate([12, 22, 12]);
                        triggerCelebration();
                        showToast({
                          message: `Aula ${String(lesson.number).padStart(2, '0')} estudada`,
                          undoFn: res.undo
                        });
                      } else {
                        vibrate(8);
                        showToast({ message: 'Estudo desmarcado', undoFn: res.undo });
                      }
                    }
                  });

                  const lessonTitleBtn = el('button', {
                    type: 'button',
                    style: 'flex: 1; text-align: left; min-width: 0; font-size: 0.8125rem; font-weight: 500; color: var(--ink-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
                    textContent: `Aula ${String(lesson.number).padStart(2, '0')} · ${lesson.title}`,
                    onClick: () => onViewLesson?.(lesson.id)
                  });

                  return el('div', { className: 'exam-lesson-row' }, checkBtn, lessonTitleBtn);
                })
              )
            )
          : el(
              'p',
              {
                style: 'margin-top: 10px; font-size: 0.75rem; color: var(--ink-muted);'
              },
              'Nenhuma aula vinculada ainda.'
            );

      const card = el(
        'article',
        { className: 'exam-card' },
        el(
          'div',
          { className: 'exam-card-head' },
          el(
            'div',
            { className: 'exam-card-left' },
            squircleBtn,
            el(
              'div',
              { style: 'min-width: 0;' },
              el('h3', { className: 'exam-title', textContent: exam.name }),
              el(
                'div',
                { className: 'exam-meta' },
                moduleBadgeBtn,
                el('span', { className: 'tabular-nums', textContent: formatDateFull(exam.date) }),
                el('span', { className: urgency.className, textContent: urgency.text })
              )
            )
          ),
          el('div', { className: 'lesson-card-actions' }, addLessonBtn, editBtn, deleteBtn)
        ),
        el(
          'div',
          { className: 'module-progress-track', style: 'margin-top: 12px;' },
          el('div', {
            className: 'module-progress-fill',
            style: `width: ${pct}%; background-color: ${colorObj.hex};`
          })
        ),
        detailsSection
      );

      listEl.appendChild(card);
    }
  }

  return { render };
}
