import { validateBackupPayload } from '../../domain/storage-adapter.js';
import { getTodayStr } from '../../domain/dates.js';
import { askConfirmation, wireDialogBackdropDismiss } from '../overlays.js';
import { attachSheetDrag } from '../gestures.js';
import { showToast, vibrate } from '../feedback.js';

export function createSettingsModal({ engine, router, updater }) {
  const dlg = document.getElementById('modal-settings');
  const dragSurface = dlg?.querySelector('.dialog-card');
  const dragHandle = dlg?.querySelector('[data-dialog-drag]');
  const btnClose = document.getElementById('btn-close-modal-settings');

  const statModulesEl = document.getElementById('stat-total-modules');
  const statLessonsEl = document.getElementById('stat-total-lessons');
  const statExamsEl = document.getElementById('stat-total-exams');
  const btnExport = document.getElementById('btn-export-backup');
  const inputImport = document.getElementById('input-import-backup');
  const versionLabelEl = document.getElementById('settings-version-label');
  const buildLabelEl = document.getElementById('settings-build-label');
  const updateStatusEl = document.getElementById('settings-update-status');
  const btnCheckUpdate = document.getElementById('btn-check-update-manual');
  const installTitleEl = document.getElementById('settings-install-title');
  const installDescEl = document.getElementById('settings-install-desc');
  const btnInstallPwa = document.getElementById('btn-install-pwa');

  function syncInstallUi(state) {
    if (!installTitleEl || !installDescEl || !btnInstallPwa) return;
    if (state === 'installed') {
      installTitleEl.textContent = 'App Instalado';
      installDescEl.textContent = 'Rodando em tela cheia como WebAPK offline';
      btnInstallPwa.hidden = true;
    } else if (state === 'ready') {
      installTitleEl.textContent = 'Pronto para Instalar';
      installDescEl.textContent = 'Cria aplicativo nativo sem barra do navegador';
      btnInstallPwa.hidden = false;
    } else {
      installTitleEl.textContent = 'Instalação PWA';
      installDescEl.textContent = 'No Chrome Android: menu ⋮ → Adicionar à tela inicial → Instalar';
      btnInstallPwa.hidden = true;
    }
  }

  updater?.subscribeInstall?.(syncInstallUi);

  btnInstallPwa?.addEventListener('click', async () => {
    if (!updater?.promptInstall) return;
    vibrate(10);
    const res = await updater.promptInstall();
    if (res.outcome === 'accepted') {
      syncInstallUi('installed');
    } else if (res.outcome === 'unavailable') {
      showToast('Use o menu ⋮ do Google Chrome e toque em Instalar');
    }
  });

  async function close() {
    await router.closeDialogOverlay(dlg);
  }

  wireDialogBackdropDismiss(dlg, close);
  btnClose?.addEventListener('click', close);
  attachSheetDrag({ surface: dragSurface, handle: dragHandle, onDismiss: close });

  btnExport?.addEventListener('click', () => {
    const payload = engine.exportBackupPayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MeuEstudo_Backup_${getTodayStr()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    vibrate(10);
    showToast('Backup JSON exportado');
  });

  inputImport?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result || '');
      const validation = validateBackupPayload(text);
      if (!validation.ok) {
        showToast({ message: validation.error, isError: true });
        inputImport.value = '';
        return;
      }

      const ok = await askConfirmation({
        title: 'Restaurar Backup?',
        message: `Substituirá os dados atuais por ${validation.data.modules.length} módulos e ${validation.data.lessons.length} aulas.`,
        confirmLabel: 'Restaurar Dados',
        danger: true
      });

      if (ok) {
        const res = engine.importBackupPayload(text);
        if (res.ok) {
          vibrate([12, 24, 12]);
          showToast('Backup restaurado com sucesso');
          await close();
        } else {
          showToast({ message: res.error, isError: true });
        }
      }
      inputImport.value = '';
    };
    reader.readAsText(file);
  });

  btnCheckUpdate?.addEventListener('click', async () => {
    if (!updater) return;
    if (updateStatusEl) updateStatusEl.textContent = 'Verificando versão no servidor…';
    const found = await updater.checkForUpdates({ manual: true });
    if (updateStatusEl) {
      updateStatusEl.textContent = found
        ? 'Nova versão encontrada'
        : `Versão v${updater.version} atualizada`;
    }
  });

  function open() {
    if (statModulesEl) statModulesEl.textContent = String(engine.state.modules.length);
    if (statLessonsEl) statLessonsEl.textContent = String(engine.state.lessons.length);
    if (statExamsEl) statExamsEl.textContent = String(engine.state.exams.length);
    if (versionLabelEl && updater) versionLabelEl.textContent = `v${updater.version}`;
    if (buildLabelEl && updater) buildLabelEl.textContent = updater.buildLabel;
    if (updater?.getInstallState) syncInstallUi(updater.getInstallState());
    router.openDialogOverlay(dlg);
  }

  return { open };
}
