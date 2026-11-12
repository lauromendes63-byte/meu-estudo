import { clearChildren, createSquircleNode, el } from '../dom.js';
import { getMedicalIconSvg } from '../../icons/medical-icons.js';
import { getColorConfig } from '../../icons/palette.js';
import { attachSheetDrag } from '../gestures.js';
import { showToast, triggerCelebration, vibrate } from '../feedback.js';

const TAG_TEMPLATES = {
  red: '[Alerta: ]',
  gold: '[Padrão-Ouro: ]',
  yellow: '[Fisiopato: ]',
  green: '[Diagnóstico: ]',
  purple: '[Conduta: ]',
  blue: '[Conceito: ]'
};

export function createLessonSheet({ engine, router, onNeedModule }) {
  const rootEl = document.getElementById('sheet-lesson');
  const overlayEl = document.getElementById('sheet-lesson-overlay');
  const drawerEl = document.getElementById('sheet-lesson-drawer');
  const dragHandleEl = document.getElementById('sheet-lesson-drag-header');
  const btnClose = document.getElementById('btn-close-sheet-lesson');

  const form = document.getElementById('form-lesson');
  const titleHeadingEl = document.getElementById('lesson-modal-title');
  const idInput = document.getElementById('lesson-id-input');
  const modulesSelectorEl = document.getElementById('lesson-modules-selector');
  const numberPreviewEl = document.getElementById('lesson-number-preview');
  const numberInput = document.getElementById('lesson-number-input');
  const btnNumMinus = document.getElementById('btn-lesson-num-minus');
  const btnNumPlus = document.getElementById('btn-lesson-num-plus');
  const titleInput = document.getElementById('lesson-title-input');
  const notesInput = document.getElementById('lesson-notes-input');
  const btnBold = document.getElementById('btn-format-bold');
  const btnBullet = document.getElementById('btn-format-bullet');
  const examSelect = document.getElementById('lesson-exam-select');
  const studiedToggle = document.getElementById('lesson-studied-toggle');
  const btnSaveAndNext = document.getElementById('btn-save-and-next-lesson');

  let selectedModuleId = null;

  function updateNumberPreview(rawVal) {
    const num = Math.max(1, parseInt(rawVal, 10) || 1);
    if (numberInput) numberInput.value = String(num);
    if (numberPreviewEl) {
      numberPreviewEl.textContent = `Aula ${String(num).padStart(2, '0')}`;
    }
  }

  function autoResizeNotes() {
    if (!notesInput) return;
    notesInput.style.height = 'auto';
    const nextHeight = Math.max(84, Math.min(notesInput.scrollHeight, 220));
    notesInput.style.height = `${nextHeight}px`;
  }

  function renderModuleChips() {
    if (!modulesSelectorEl) return;
    clearChildren(modulesSelectorEl);

    for (const mod of engine.state.modules) {
      const colorObj = getColorConfig(mod.colorKey);
      const isSelected = mod.id === selectedModuleId;
      const chip = el(
        'button',
        {
          type: 'button',
          className: `module-select-chip ${isSelected ? 'is-selected' : ''}`,
          onClick: () => {
            selectedModuleId = mod.id;
            renderModuleChips();
            populateExamOptions();
            if (!idInput?.value) {
              updateNumberPreview(engine.getNextLessonNumber(mod.id));
            }
          }
        },
        createSquircleNode(getMedicalIconSvg(mod.iconKey), colorObj, 'module-squircle--sm'),
        el('span', { textContent: mod.name })
      );
      modulesSelectorEl.appendChild(chip);
    }

    const activeChip = modulesSelectorEl.querySelector('.module-select-chip.is-selected');
    activeChip?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }

  function populateExamOptions(preselectedExamId = '') {
    if (!examSelect) return;
    clearChildren(examSelect);
    examSelect.appendChild(el('option', { value: '', textContent: 'Nenhuma prova vinculada' }));

    const sortedExams = [...engine.state.exams].sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
    for (const exam of sortedExams) {
      const mod = engine.getModule(exam.moduleId);
      const label = mod ? `${exam.name} (${mod.name})` : exam.name;
      const opt = el('option', { value: exam.id, textContent: label });
      if (exam.id === preselectedExamId) opt.selected = true;
      examSelect.appendChild(opt);
    }
  }

  function close({ fromPopState = false } = {}) {
    if (!rootEl?.classList.contains('sheet-open')) return;
    router.closeLessonSheetOverlay({ fromPopState });
  }

  router.registerLessonSheetCloser(close);

  attachSheetDrag({
    surface: drawerEl,
    handle: dragHandleEl,
    onDismiss: () => close()
  });

  overlayEl?.addEventListener('click', () => close());
  btnClose?.addEventListener('click', () => close());

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && rootEl?.classList.contains('sheet-open')) {
      event.preventDefault();
      close();
    }
  });

  btnNumMinus?.addEventListener('click', () => {
    vibrate(6);
    const cur = parseInt(numberInput?.value, 10) || 1;
    updateNumberPreview(Math.max(1, cur - 1));
  });

  btnNumPlus?.addEventListener('click', () => {
    vibrate(6);
    const cur = parseInt(numberInput?.value, 10) || 1;
    updateNumberPreview(Math.min(999, cur + 1));
  });

  numberInput?.addEventListener('input', () => {
    const cleaned = numberInput.value.replace(/\D+/g, '');
    if (cleaned !== numberInput.value) numberInput.value = cleaned;
    if (cleaned) updateNumberPreview(cleaned);
  });

  numberInput?.addEventListener('blur', () => {
    updateNumberPreview(numberInput.value || '1');
  });

  btnBold?.addEventListener('click', () => {
    if (!notesInput) return;
    const start = notesInput.selectionStart;
    const end = notesInput.selectionEnd;
    const text = notesInput.value;
    const selected = text.slice(start, end);
    const insertion = `**${selected || 'destaque'}**`;
    notesInput.value = text.slice(0, start) + insertion + text.slice(end);
    notesInput.focus();
    const cursorPos = selected ? start + insertion.length : start + 2;
    notesInput.setSelectionRange(cursorPos, selected ? cursorPos : start + 10);
    autoResizeNotes();
  });

  btnBullet?.addEventListener('click', () => {
    if (!notesInput) return;
    const start = notesInput.selectionStart;
    const text = notesInput.value;
    const needsNewline = start > 0 && text[start - 1] !== '\n';
    const insertion = `${needsNewline ? '\n' : ''}• `;
    notesInput.value = text.slice(0, start) + insertion + text.slice(start);
    const pos = start + insertion.length;
    notesInput.focus();
    notesInput.setSelectionRange(pos, pos);
    autoResizeNotes();
  });

  rootEl?.querySelectorAll('.btn-insert-tag').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!notesInput) return;
      const tpl = TAG_TEMPLATES[btn.dataset.tag];
      if (!tpl) return;
      const start = notesInput.selectionStart;
      const text = notesInput.value;
      const prefix = start > 0 && !/\s/.test(text[start - 1]) ? ' ' : '';
      const fullInsert = `${prefix}${tpl}`;
      notesInput.value = text.slice(0, start) + fullInsert + text.slice(start);
      const caret = start + fullInsert.length - 1;
      notesInput.focus();
      notesInput.setSelectionRange(caret, caret);
      autoResizeNotes();
    });
  });

  notesInput?.addEventListener('input', autoResizeNotes);

  notesInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.isComposing) return;
    const start = notesInput.selectionStart;
    const end = notesInput.selectionEnd;
    if (start !== end) return;
    const val = notesInput.value;

    // Jump out of closing clinical bracket if cursor sits right before ]
    if (val[start] === ']') {
      event.preventDefault();
      notesInput.value = val.slice(0, start + 1) + '\n' + val.slice(start + 1);
      notesInput.setSelectionRange(start + 2, start + 2);
      autoResizeNotes();
      return;
    }

    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const currentLine = val.slice(lineStart, start);
    if (/^\s*•\s*$/.test(currentLine)) {
      event.preventDefault();
      notesInput.value = val.slice(0, lineStart) + val.slice(start);
      notesInput.setSelectionRange(lineStart, lineStart);
      autoResizeNotes();
    } else if (/^\s*•\s+.+/.test(currentLine)) {
      event.preventDefault();
      const insert = '\n• ';
      notesInput.value = val.slice(0, start) + insert + val.slice(start);
      notesInput.setSelectionRange(start + insert.length, start + insert.length);
      autoResizeNotes();
    }
  });

  function persistFromForm({ keepOpenForNext = false } = {}) {
    const titleVal = titleInput?.value?.trim() || '';
    if (!titleVal) {
      titleInput?.focus();
      showToast({ message: 'Informe o tema da aula', isError: true });
      return;
    }

    const result = engine.saveLesson({
      id: idInput?.value || null,
      moduleId: selectedModuleId,
      number: numberInput?.value || '1',
      title: titleVal,
      notes: notesInput?.value || '',
      isStudied: Boolean(studiedToggle?.checked),
      examId: examSelect?.value || null
    });

    if (!result) return;

    vibrate(result.lesson.isStudied ? [12, 24, 14] : 10);
    if (result.lesson.isStudied && result.isNew) {
      triggerCelebration();
    }

    const numLabel = `Aula ${String(result.lesson.number).padStart(2, '0')}`;
    showToast(
      result.isNew
        ? `${numLabel} salva${result.lesson.isStudied ? ' e agendada' : ''}`
        : `${numLabel} atualizada`
    );

    if (keepOpenForNext) {
      idInput.value = '';
      titleInput.value = '';
      notesInput.value = '';
      studiedToggle.checked = false;
      updateNumberPreview(engine.getNextLessonNumber(selectedModuleId));
      autoResizeNotes();
      titleInput.focus();
      return;
    }

    close();
  }

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    persistFromForm({ keepOpenForNext: false });
  });

  btnSaveAndNext?.addEventListener('click', () => {
    persistFromForm({ keepOpenForNext: true });
  });

  function open({ preselectModuleId = null, preselectExamId = null, editLessonId = null } = {}) {
    if (engine.state.modules.length === 0) {
      showToast('Crie seu primeiro módulo antes de adicionar aulas');
      onNeedModule?.();
      return;
    }

    const lesson = editLessonId ? engine.getLesson(editLessonId) : null;
    if (lesson) {
      if (titleHeadingEl) titleHeadingEl.textContent = 'Editar Aula';
      if (idInput) idInput.value = lesson.id;
      selectedModuleId = lesson.moduleId;
      updateNumberPreview(lesson.number);
      if (titleInput) titleInput.value = lesson.title;
      if (notesInput) notesInput.value = lesson.notes || '';
      if (studiedToggle) studiedToggle.checked = Boolean(lesson.isStudied);
      if (btnSaveAndNext) btnSaveAndNext.hidden = true;
      populateExamOptions(lesson.examId || '');
    } else {
      if (titleHeadingEl) titleHeadingEl.textContent = 'Nova Aula';
      if (idInput) idInput.value = '';
      selectedModuleId =
        preselectModuleId || engine.state.currentModuleId || engine.state.modules[0]?.id || null;
      updateNumberPreview(engine.getNextLessonNumber(selectedModuleId));
      if (titleInput) titleInput.value = '';
      if (notesInput) notesInput.value = '';
      if (studiedToggle) studiedToggle.checked = false;
      if (btnSaveAndNext) btnSaveAndNext.hidden = false;
      populateExamOptions(preselectExamId || '');
    }

    renderModuleChips();
    autoResizeNotes();
    router.openLessonSheetOverlay();

    setTimeout(() => {
      titleInput?.focus();
    }, 180);
  }

  return { open, close };
}
