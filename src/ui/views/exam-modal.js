import { clearChildren, el } from '../dom.js';
import { addDays } from '../../domain/dates.js';
import { wireDialogBackdropDismiss } from '../overlays.js';
import { attachSheetDrag } from '../gestures.js';
import { showToast, vibrate } from '../feedback.js';

export function createExamModal({ engine, router, onNeedModule }) {
  const dlg = document.getElementById('modal-exam');
  const dragSurface = dlg?.querySelector('.dialog-card');
  const dragHandle = dlg?.querySelector('[data-dialog-drag]');
  const btnClose = document.getElementById('btn-close-modal-exam');
  const titleEl = document.getElementById('modal-exam-title');
  const form = document.getElementById('form-exam');
  const idInput = document.getElementById('exam-id-input');
  const nameInput = document.getElementById('exam-name-input');
  const dateInput = document.getElementById('exam-date-input');
  const moduleSelect = document.getElementById('exam-module-select');
  const checklistEl = document.getElementById('exam-lessons-checklist');
  const btnSelectAll = document.getElementById('btn-exam-select-all');

  async function close() {
    await router.closeDialogOverlay(dlg);
  }

  wireDialogBackdropDismiss(dlg, close);
  btnClose?.addEventListener('click', close);
  attachSheetDrag({ surface: dragSurface, handle: dragHandle, onDismiss: close });

  function renderLessonsChecklist(moduleId, preselectedIds = []) {
    if (!checklistEl) return;
    clearChildren(checklistEl);

    if (!moduleId) {
      checklistEl.appendChild(
        el('p', {
          style: 'font-size: 0.78rem; color: var(--ink-muted); text-align: center; padding: 10px;',
          textContent: 'Selecione um módulo acima para escolher as aulas.'
        })
      );
      return;
    }

    const lessons = engine.getLessonsForModule(moduleId);
    if (lessons.length === 0) {
      checklistEl.appendChild(
        el('p', {
          style: 'font-size: 0.78rem; color: var(--ink-muted); text-align: center; padding: 10px;',
          textContent: 'Nenhuma aula cadastrada neste módulo ainda.'
        })
      );
      return;
    }

    const selectedSet = new Set(preselectedIds);
    for (const lesson of lessons) {
      const checkId = `exam-check-${lesson.id}`;
      const checkbox = el('input', {
        type: 'checkbox',
        id: checkId,
        name: 'examLessonIds',
        value: lesson.id,
        checked: selectedSet.has(lesson.id),
        style: 'width: 18px; height: 18px; accent-color: var(--accent-navy); flex-shrink: 0;'
      });
      const label = el(
        'label',
        {
          htmlFor: checkId,
          style: 'display: flex; align-items: center; gap: 10px; padding: 7px 8px; border-radius: 8px; background: var(--bg-surface); border: 1px solid var(--border-subtle); cursor: pointer; font-size: 0.8rem;'
        },
        checkbox,
        el('span', {
          className: 'tabular-nums',
          style: 'font-size: 0.72rem; font-weight: 600; color: var(--accent-navy); flex-shrink: 0;',
          textContent: `Aula ${String(lesson.number).padStart(2, '0')}`
        }),
        el('span', {
          style: 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
          textContent: lesson.title
        })
      );
      checklistEl.appendChild(label);
    }
  }

  moduleSelect?.addEventListener('change', () => {
    renderLessonsChecklist(moduleSelect.value, []);
  });

  btnSelectAll?.addEventListener('click', () => {
    if (!checklistEl) return;
    const boxes = Array.from(checklistEl.querySelectorAll('input[type="checkbox"]'));
    if (boxes.length === 0) return;
    const allChecked = boxes.every((b) => b.checked);
    for (const box of boxes) box.checked = !allChecked;
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const checkedIds = checklistEl
      ? Array.from(checklistEl.querySelectorAll('input[type="checkbox"]:checked')).map((c) => c.value)
      : [];

    const res = engine.saveExam({
      id: idInput?.value || null,
      name: nameInput?.value || '',
      date: dateInput?.value || '',
      moduleId: moduleSelect?.value || '',
      lessonIds: checkedIds
    });

    if (!res) {
      showToast({ message: 'Preencha nome, data e módulo da prova', isError: true });
      return;
    }

    vibrate(12);
    showToast(res.isNew ? 'Prova cadastrada' : 'Prova atualizada');
    await close();
  });

  function open(editExamId = null) {
    if (engine.state.modules.length === 0) {
      showToast('Cadastre ao menos um módulo antes da prova');
      onNeedModule?.();
      return;
    }

    if (moduleSelect) {
      clearChildren(moduleSelect);
      moduleSelect.appendChild(el('option', { value: '', textContent: 'Selecione o Módulo' }));
      for (const mod of engine.state.modules) {
        moduleSelect.appendChild(el('option', { value: mod.id, textContent: mod.name }));
      }
    }

    const existing = editExamId ? engine.getExam(editExamId) : null;
    if (existing) {
      if (titleEl) titleEl.textContent = 'Editar Prova';
      if (idInput) idInput.value = existing.id;
      if (nameInput) nameInput.value = existing.name;
      if (dateInput) dateInput.value = existing.date;
      if (moduleSelect) moduleSelect.value = existing.moduleId;
      renderLessonsChecklist(existing.moduleId, existing.lessonIds || []);
    } else {
      if (titleEl) titleEl.textContent = 'Cadastrar Prova';
      if (idInput) idInput.value = '';
      if (nameInput) nameInput.value = '';
      if (dateInput) dateInput.value = addDays(engine.getTodayStr(), 14);
      const firstModId = engine.state.modules[0]?.id || '';
      if (moduleSelect) moduleSelect.value = firstModId;
      renderLessonsChecklist(firstModId, []);
    }

    router.openDialogOverlay(dlg);
    setTimeout(() => nameInput?.focus(), 140);
  }

  return { open };
}
