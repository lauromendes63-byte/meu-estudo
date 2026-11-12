import { clearChildren, createSquircleNode, el } from '../dom.js';
import { addDays, daysDiff, formatDateFull } from '../../domain/dates.js';
import { getMedicalIconSvg } from '../../icons/medical-icons.js';
import { getColorConfig } from '../../icons/palette.js';
import { wireDialogBackdropDismiss } from '../overlays.js';
import { attachSheetDrag } from '../gestures.js';
import { showToast, vibrate } from '../feedback.js';

const WEEKDAYS_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatFriendlyExamDate(dateStr, todayStr) {
  if (!dateStr || !dateStr.includes('-')) return '';
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return '';
  const localDate = new Date(y, m - 1, d);
  const weekday = WEEKDAYS_SHORT_PT[localDate.getDay()] || '';
  const full = formatDateFull(dateStr);
  const diff = daysDiff(dateStr, todayStr);

  if (diff === 0) return `${weekday}, ${full} · hoje`;
  if (diff === 1) return `${weekday}, ${full} · amanhã`;
  if (diff > 1) return `${weekday}, ${full} · em ${diff}d`;
  return `${weekday}, ${full} · há ${Math.abs(diff)}d`;
}

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
  const dateFriendlyEl = document.getElementById('exam-date-friendly');
  const datePresetsEl = document.getElementById('exam-date-presets');
  const modulesSelectorEl = document.getElementById('exam-modules-selector');
  const btnToggleAllModules = document.getElementById('btn-exam-toggle-all-modules');
  const checklistEl = document.getElementById('exam-lessons-checklist');
  const selectedCountEl = document.getElementById('exam-selected-count');
  const btnSelectAll = document.getElementById('btn-exam-select-all');

  let selectedModuleIds = new Set();
  let selectedLessonIds = new Set();

  async function close() {
    await router.closeDialogOverlay(dlg);
  }

  wireDialogBackdropDismiss(dlg, close);
  btnClose?.addEventListener('click', close);
  attachSheetDrag({ surface: dragSurface, handle: dragHandle, onDismiss: close });

  function getActiveSelectedModules() {
    return engine.state.modules.filter((m) => selectedModuleIds.has(m.id));
  }

  function syncDateUI() {
    const todayStr = engine.getTodayStr();
    const val = dateInput?.value || '';
    if (dateFriendlyEl) {
      dateFriendlyEl.textContent = val ? formatFriendlyExamDate(val, todayStr) : '';
    }
    if (datePresetsEl) {
      datePresetsEl.querySelectorAll('.exam-date-preset-btn').forEach((btn) => {
        const offset = Number(btn.dataset.offset);
        const presetDate = addDays(todayStr, offset);
        const isMatch = Boolean(val) && val === presetDate;
        btn.classList.toggle('is-active', isMatch);
        btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
      });
    }
  }

  function updateCountersAndActions() {
    const activeModules = getActiveSelectedModules();
    const allModuleLessons = activeModules.flatMap((m) => engine.getLessonsForModule(m.id));
    const activeLessonIds = new Set(allModuleLessons.map((l) => l.id));

    for (const lid of Array.from(selectedLessonIds)) {
      if (!activeLessonIds.has(lid)) {
        selectedLessonIds.delete(lid);
      }
    }

    const selectedTotal = selectedLessonIds.size;
    if (selectedCountEl) {
      selectedCountEl.textContent = `${selectedTotal} ${selectedTotal === 1 ? 'aula' : 'aulas'}`;
    }

    if (btnSelectAll) {
      const allChecked =
        allModuleLessons.length > 0 && allModuleLessons.every((l) => selectedLessonIds.has(l.id));
      btnSelectAll.disabled = allModuleLessons.length === 0;
      btnSelectAll.textContent = allChecked ? 'Limpar seleção' : 'Selecionar Todas';
    }

    if (btnToggleAllModules) {
      const totalMods = engine.state.modules.length;
      const allModsSelected = totalMods > 0 && selectedModuleIds.size === totalMods;
      btnToggleAllModules.textContent = allModsSelected ? 'Limpar' : 'Selecionar Todos';
    }

    if (checklistEl) {
      checklistEl.querySelectorAll('.exam-checklist-group').forEach((groupEl) => {
        const modId = groupEl.dataset.moduleId;
        const toggleBtn = groupEl.querySelector('.exam-checklist-group-toggle');
        if (!modId || !toggleBtn) return;
        const lessons = engine.getLessonsForModule(modId);
        const allGroupChecked =
          lessons.length > 0 && lessons.every((l) => selectedLessonIds.has(l.id));
        toggleBtn.textContent = allGroupChecked ? 'Limpar' : `Marcar (${lessons.length})`;
      });
    }
  }

  function renderModuleChips() {
    if (!modulesSelectorEl) return;
    clearChildren(modulesSelectorEl);

    for (const mod of engine.state.modules) {
      const colorObj = getColorConfig(mod.colorKey);
      const isSelected = selectedModuleIds.has(mod.id);
      const chip = el(
        'button',
        {
          type: 'button',
          className: `module-select-chip ${isSelected ? 'is-selected' : ''}`,
          'aria-pressed': isSelected ? 'true' : 'false',
          onClick: () => {
            vibrate(6);
            if (selectedModuleIds.has(mod.id)) {
              selectedModuleIds.delete(mod.id);
              for (const lesson of engine.getLessonsForModule(mod.id)) {
                selectedLessonIds.delete(lesson.id);
              }
            } else {
              selectedModuleIds.add(mod.id);
            }
            renderModuleChips();
            renderLessonsChecklist();
          }
        },
        createSquircleNode(getMedicalIconSvg(mod.iconKey), colorObj, 'module-squircle--sm'),
        el('span', { textContent: mod.name })
      );
      modulesSelectorEl.appendChild(chip);
    }
  }

  function renderLessonsChecklist() {
    if (!checklistEl) return;
    clearChildren(checklistEl);

    const activeModules = getActiveSelectedModules();
    if (activeModules.length === 0) {
      checklistEl.appendChild(
        el('p', {
          style: 'font-size: 0.78rem; color: var(--ink-muted); text-align: center; padding: 12px 10px;',
          textContent: 'Selecione ao menos um módulo acima para escolher as aulas.'
        })
      );
      updateCountersAndActions();
      return;
    }

    for (const mod of activeModules) {
      const colorObj = getColorConfig(mod.colorKey);
      const lessons = engine.getLessonsForModule(mod.id);

      const groupToggleBtn =
        lessons.length > 0
          ? el('button', {
              type: 'button',
              className: 'exam-checklist-group-toggle',
              onClick: () => {
                vibrate(6);
                const allChecked = lessons.every((l) => selectedLessonIds.has(l.id));
                for (const l of lessons) {
                  if (allChecked) {
                    selectedLessonIds.delete(l.id);
                  } else {
                    selectedLessonIds.add(l.id);
                  }
                }
                renderLessonsChecklist();
              }
            })
          : null;

      const groupHeader = el(
        'div',
        { className: 'exam-checklist-group-head' },
        el(
          'div',
          { className: 'exam-checklist-group-title' },
          el('span', {
            className: 'badge-dot',
            style: `color: ${colorObj.hex};`,
            'aria-hidden': 'true'
          }),
          el('span', {
            style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
            textContent: mod.name
          })
        ),
        groupToggleBtn
      );

      const groupRows =
        lessons.length > 0
          ? lessons.map((lesson) => {
              const checkId = `exam-check-${lesson.id}`;
              const isChecked = selectedLessonIds.has(lesson.id);
              let labelRef = null;

              const checkbox = el('input', {
                type: 'checkbox',
                id: checkId,
                name: 'examLessonIds',
                value: lesson.id,
                checked: isChecked,
                style: 'width: 18px; height: 18px; accent-color: var(--accent-navy); flex-shrink: 0;',
                onChange: () => {
                  if (checkbox.checked) {
                    selectedLessonIds.add(lesson.id);
                  } else {
                    selectedLessonIds.delete(lesson.id);
                  }
                  labelRef?.classList.toggle('is-checked', checkbox.checked);
                  updateCountersAndActions();
                }
              });

              labelRef = el(
                'label',
                {
                  htmlFor: checkId,
                  className: `exam-checklist-row ${isChecked ? 'is-checked' : ''}`
                },
                checkbox,
                el('span', {
                  className: 'tabular-nums',
                  style: `font-size: 0.72rem; font-weight: 700; color: ${colorObj.text}; flex-shrink: 0;`,
                  textContent: `Aula ${String(lesson.number).padStart(2, '0')}`
                }),
                el('span', {
                  style: 'flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
                  textContent: lesson.title
                }),
                lesson.isStudied
                  ? el('span', {
                      className: 'badge-pill badge-pill--success',
                      textContent: 'Estudada'
                    })
                  : null
              );
              return labelRef;
            })
          : [
              el('p', {
                style: 'font-size: 0.75rem; color: var(--ink-muted); padding: 4px 6px;',
                textContent: 'Nenhuma aula cadastrada neste módulo ainda.'
              })
            ];

      checklistEl.appendChild(
        el(
          'div',
          { className: 'exam-checklist-group', dataset: { moduleId: mod.id } },
          groupHeader,
          ...groupRows
        )
      );
    }

    updateCountersAndActions();
  }

  datePresetsEl?.addEventListener('click', (event) => {
    const btn = event.target.closest('.exam-date-preset-btn');
    if (!btn || !dateInput) return;
    const offset = Number(btn.dataset.offset);
    if (!Number.isFinite(offset)) return;
    vibrate(6);
    dateInput.value = addDays(engine.getTodayStr(), offset);
    syncDateUI();
  });

  dateInput?.addEventListener('input', syncDateUI);
  dateInput?.addEventListener('change', syncDateUI);

  btnToggleAllModules?.addEventListener('click', () => {
    vibrate(6);
    const totalMods = engine.state.modules.length;
    if (totalMods === 0) return;
    if (selectedModuleIds.size === totalMods) {
      selectedModuleIds.clear();
      selectedLessonIds.clear();
    } else {
      for (const mod of engine.state.modules) {
        selectedModuleIds.add(mod.id);
      }
    }
    renderModuleChips();
    renderLessonsChecklist();
  });

  btnSelectAll?.addEventListener('click', () => {
    const activeLessons = getActiveSelectedModules().flatMap((m) => engine.getLessonsForModule(m.id));
    if (activeLessons.length === 0) return;
    vibrate(6);
    const allChecked = activeLessons.every((l) => selectedLessonIds.has(l.id));
    for (const l of activeLessons) {
      if (allChecked) {
        selectedLessonIds.delete(l.id);
      } else {
        selectedLessonIds.add(l.id);
      }
    }
    renderLessonsChecklist();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const activeModIds = getActiveSelectedModules().map((m) => m.id);
    if (activeModIds.length === 0) {
      showToast({ message: 'Selecione ao menos um módulo cobrado na prova', isError: true });
      return;
    }

    const res = engine.saveExam({
      id: idInput?.value || null,
      name: nameInput?.value || '',
      date: dateInput?.value || '',
      moduleIds: activeModIds,
      lessonIds: Array.from(selectedLessonIds)
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

    const existing = editExamId ? engine.getExam(editExamId) : null;
    if (existing) {
      if (titleEl) titleEl.textContent = 'Editar Prova';
      if (idInput) idInput.value = existing.id;
      if (nameInput) nameInput.value = existing.name;
      if (dateInput) dateInput.value = existing.date;
      selectedModuleIds = new Set(engine.getExamModuleIds(existing));
      selectedLessonIds = new Set(
        (existing.lessonIds || []).filter((lid) => Boolean(engine.getLesson(lid)))
      );
    } else {
      if (titleEl) titleEl.textContent = 'Cadastrar Prova';
      if (idInput) idInput.value = '';
      if (nameInput) nameInput.value = '';
      if (dateInput) dateInput.value = addDays(engine.getTodayStr(), 14);
      const firstModId = engine.state.modules[0]?.id;
      selectedModuleIds = firstModId ? new Set([firstModId]) : new Set();
      selectedLessonIds = new Set();
    }

    syncDateUI();
    renderModuleChips();
    renderLessonsChecklist();
    router.openDialogOverlay(dlg);

    if (!existing) {
      setTimeout(() => nameInput?.focus(), 140);
    }
  }

  return { open };
}
