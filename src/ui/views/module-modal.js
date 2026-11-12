import { clearChildren, el } from '../dom.js';
import { getMedicalIconSvg, matchSpecialtyByName, MEDICAL_ICONS } from '../../icons/medical-icons.js';
import { getColorConfig, PALETTE_COLORS } from '../../icons/palette.js';
import { wireDialogBackdropDismiss } from '../overlays.js';
import { attachSheetDrag } from '../gestures.js';
import { showToast, vibrate } from '../feedback.js';

export function createModuleModal({ engine, router }) {
  const dlg = document.getElementById('modal-module');
  const dragSurface = dlg?.querySelector('.dialog-card');
  const dragHandle = dlg?.querySelector('[data-dialog-drag]');
  const btnClose = document.getElementById('btn-close-modal-module');
  const titleEl = document.getElementById('modal-module-title');
  const form = document.getElementById('form-module');
  const idInput = document.getElementById('module-id-input');
  const nameInput = document.getElementById('module-name-input');
  const previewBox = document.getElementById('module-live-preview-icon');
  const autoMatchHint = document.getElementById('module-automatch-hint');
  const iconGrid = document.getElementById('module-icon-grid');
  const colorRow = document.getElementById('module-color-row');

  let selectedIcon = 'heart';
  let selectedColor = 'crimson';
  let userOverrodePicker = false;

  async function close() {
    await router.closeDialogOverlay(dlg);
  }

  wireDialogBackdropDismiss(dlg, close);
  btnClose?.addEventListener('click', close);
  attachSheetDrag({ surface: dragSurface, handle: dragHandle, onDismiss: close });

  function updateLivePreview() {
    if (!previewBox) return;
    const colorObj = getColorConfig(selectedColor);
    previewBox.style.cssText = `background-color: ${colorObj.bg}; border-color: ${colorObj.border}; color: ${colorObj.hex};`;
    previewBox.innerHTML = getMedicalIconSvg(selectedIcon);
  }

  function renderIconPicker() {
    if (!iconGrid) return;
    clearChildren(iconGrid);
    const colorObj = getColorConfig(selectedColor);

    for (const item of MEDICAL_ICONS) {
      const isSelected = item.key === selectedIcon;
      const btn = el(
        'button',
        {
          type: 'button',
          className: `icon-pick-btn ${isSelected ? 'is-selected' : ''}`,
          onClick: () => {
            userOverrodePicker = true;
            selectedIcon = item.key;
            if (!idInput?.value && item.defaultColor) {
              selectedColor = item.defaultColor;
            }
            if (autoMatchHint) autoMatchHint.textContent = 'Seleção manual';
            vibrate(6);
            updateLivePreview();
            renderIconPicker();
            renderColorPicker();
          }
        },
        el('div', {
          className: 'module-squircle module-squircle--sm',
          style: `background-color: ${colorObj.bg}; border-color: ${colorObj.border}; color: ${colorObj.hex};`,
          innerHTML: item.svg
        }),
        el('span', { textContent: item.label })
      );
      iconGrid.appendChild(btn);
    }
  }

  function renderColorPicker() {
    if (!colorRow) return;
    clearChildren(colorRow);

    for (const colorObj of PALETTE_COLORS) {
      const isSelected = colorObj.key === selectedColor;
      const swatch = el('button', {
        type: 'button',
        className: `color-swatch-btn ${isSelected ? 'is-selected' : ''}`,
        style: `background-color: ${colorObj.hex};`,
        'aria-label': colorObj.label,
        title: colorObj.label,
        onClick: () => {
          userOverrodePicker = true;
          selectedColor = colorObj.key;
          if (autoMatchHint) autoMatchHint.textContent = 'Cor personalizada';
          vibrate(6);
          updateLivePreview();
          renderIconPicker();
          renderColorPicker();
        }
      });
      colorRow.appendChild(swatch);
    }
  }

  nameInput?.addEventListener('input', () => {
    if (userOverrodePicker) return;
    const match = matchSpecialtyByName(nameInput.value);
    if (match) {
      selectedIcon = match.key;
      selectedColor = match.defaultColor;
      if (autoMatchHint) autoMatchHint.textContent = `Sugestão: ${match.label}`;
      updateLivePreview();
      renderIconPicker();
      renderColorPicker();
    } else if (autoMatchHint) {
      autoMatchHint.textContent = 'Auto-seleção ativa';
    }
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const res = engine.saveModule({
      id: idInput?.value || null,
      name: nameInput?.value || '',
      iconKey: selectedIcon,
      colorKey: selectedColor
    });
    if (!res) {
      nameInput?.focus();
      showToast({ message: 'Informe o nome do módulo', isError: true });
      return;
    }

    vibrate(12);
    showToast(res.isNew ? `${res.mod.name} criado` : `${res.mod.name} atualizado`);
    await close();
  });

  function open(editModuleId = null) {
    const existing = editModuleId ? engine.getModule(editModuleId) : null;
    if (existing) {
      if (titleEl) titleEl.textContent = 'Editar Módulo';
      if (idInput) idInput.value = existing.id;
      if (nameInput) nameInput.value = existing.name;
      selectedIcon = existing.iconKey;
      selectedColor = existing.colorKey;
      userOverrodePicker = true;
      if (autoMatchHint) autoMatchHint.textContent = 'Personalizado';
    } else {
      if (titleEl) titleEl.textContent = 'Novo Módulo';
      if (idInput) idInput.value = '';
      if (nameInput) nameInput.value = '';
      selectedIcon = 'heart';
      selectedColor = 'crimson';
      userOverrodePicker = false;
      if (autoMatchHint) autoMatchHint.textContent = 'Auto-seleção ativa';
    }

    updateLivePreview();
    renderIconPicker();
    renderColorPicker();
    router.openDialogOverlay(dlg);
    setTimeout(() => nameInput?.focus(), 140);
  }

  return { open };
}
