import { normalizeText } from './notes-parser.js';

export const STORAGE_KEY = 'meu_estudo_data_v1';
export const VIEW_MODE_KEY = 'meu_estudo_view_mode_v2';

export function canonicalizeIconKey(iconKey, moduleName = '') {
  let key = String(iconKey || 'heart');
  if (key === 'joint') key = 'reuma';
  if (key === 'general') key = 'stethoscope';

  const normName = normalizeText(moduleName);
  if ((normName.includes('psiquiatria') || normName.includes('mental')) && key === 'brain') {
    key = 'psiq';
  }
  return key;
}

export function normalizeStateSnapshot(parsed) {
  const rawModules = Array.isArray(parsed?.modules) ? parsed.modules : [];
  const rawLessons = Array.isArray(parsed?.lessons) ? parsed.lessons : [];
  const rawExams = Array.isArray(parsed?.exams) ? parsed.exams : [];

  const modules = rawModules
    .filter((m) => m && typeof m === 'object' && m.id)
    .map((m) => ({
      id: String(m.id),
      name: String(m.name || 'Módulo'),
      iconKey: canonicalizeIconKey(m.iconKey, m.name),
      colorKey: String(m.colorKey || 'navy'),
      createdAt: Number(m.createdAt) || Date.now()
    }));

  const lessons = rawLessons
    .filter((l) => l && typeof l === 'object' && l.id && l.moduleId)
    .map((l) => ({
      id: String(l.id),
      moduleId: String(l.moduleId),
      number: Number(l.number) || 1,
      title: String(l.title || ''),
      notes: typeof l.notes === 'string' ? l.notes : '',
      isStudied: Boolean(l.isStudied),
      studiedAt: (l.studiedAt || l.studiedDate) ? String(l.studiedAt || l.studiedDate) : null,
      reviews: l.reviews && typeof l.reviews === 'object' ? structuredClone(l.reviews) : null,
      examId: l.examId ? String(l.examId) : null,
      createdAt: Number(l.createdAt) || Date.now()
    }));

  const exams = rawExams
    .filter((e) => e && typeof e === 'object' && e.id)
    .map((e) => ({
      id: String(e.id),
      name: String(e.name || ''),
      date: String(e.date || ''),
      moduleId: String(e.moduleId || ''),
      lessonIds: Array.isArray(e.lessonIds) ? e.lessonIds.map(String) : [],
      createdAt: Number(e.createdAt) || Date.now()
    }));

  return { modules, lessons, exams };
}

export function validateBackupPayload(rawText) {
  try {
    const parsed = typeof rawText === 'string' ? JSON.parse(rawText) : rawText;
    if (!parsed || !Array.isArray(parsed.modules) || !Array.isArray(parsed.lessons)) {
      return { ok: false, error: 'Estrutura de backup inválida.' };
    }
    return {
      ok: true,
      data: normalizeStateSnapshot(parsed)
    };
  } catch {
    return { ok: false, error: 'Arquivo JSON inválido.' };
  }
}

export function createLocalStorageAdapter(storage = globalThis.localStorage) {
  return {
    loadData() {
      try {
        const raw = storage?.getItem(STORAGE_KEY);
        if (!raw) return { modules: [], lessons: [], exams: [] };
        const parsed = JSON.parse(raw);
        const normalized = normalizeStateSnapshot(parsed);
        const rawMods = Array.isArray(parsed?.modules) ? parsed.modules : [];
        const migratedIcons = rawMods.some(
          (m, idx) => m && normalized.modules[idx] && m.iconKey !== normalized.modules[idx].iconKey
        );
        if (migratedIcons) {
          this.saveData(normalized);
        }
        return normalized;
      } catch {
        return { modules: [], lessons: [], exams: [] };
      }
    },
    saveData(snapshot) {
      try {
        storage?.setItem(
          STORAGE_KEY,
          JSON.stringify({
            version: 1,
            updatedAt: new Date().toISOString(),
            modules: snapshot.modules,
            lessons: snapshot.lessons,
            exams: snapshot.exams
          })
        );
        return true;
      } catch {
        return false;
      }
    },
    loadViewMode() {
      try {
        const val = storage?.getItem(VIEW_MODE_KEY);
        return val === 'grid' ? 'grid' : 'list';
      } catch {
        return 'list';
      }
    },
    saveViewMode(mode) {
      try {
        storage?.setItem(VIEW_MODE_KEY, mode === 'grid' ? 'grid' : 'list');
      } catch {
        // Ignore storage write errors on view preference
      }
    }
  };
}

export function createMemoryStorageAdapter(initial = {}) {
  let storedData = normalizeStateSnapshot(initial.data || initial);
  let storedViewMode = initial.viewMode === 'grid' ? 'grid' : 'list';

  return {
    loadData() {
      return normalizeStateSnapshot(storedData);
    },
    saveData(snapshot) {
      storedData = normalizeStateSnapshot(snapshot);
      return true;
    },
    loadViewMode() {
      return storedViewMode;
    },
    saveViewMode(mode) {
      storedViewMode = mode === 'grid' ? 'grid' : 'list';
    }
  };
}
