import { addDays, getTodayStr } from './dates.js';
import { normalizeText } from './notes-parser.js';
import { canonicalizeIconKey, normalizeStateSnapshot, validateBackupPayload } from './storage-adapter.js';

export const REVIEW_STAGES = ['d1', 'd7', 'd30'];

export function createSpacedReviews(studiedDateStr) {
  return {
    d1: { dueDate: addDays(studiedDateStr, 1), done: false, doneAt: null },
    d7: { dueDate: addDays(studiedDateStr, 7), done: false, doneAt: null },
    d30: { dueDate: addDays(studiedDateStr, 30), done: false, doneAt: null }
  };
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createStudyEngine({ storageAdapter, todayFn = getTodayStr } = {}) {
  const initialData = storageAdapter ? storageAdapter.loadData() : { modules: [], lessons: [], exams: [] };
  const initialViewMode = storageAdapter ? storageAdapter.loadViewMode() : 'list';

  const state = {
    modules: initialData.modules,
    lessons: initialData.lessons,
    exams: initialData.exams,
    moduleViewMode: initialViewMode,
    activeTab: 'tab-modulos',
    currentModuleId: null,
    moduleLessonFilter: 'all',
    estudoModuleFilter: 'all',
    studySubTab: 'revisar',
    scrollPositions: {
      'tab-modulos': 0,
      'tab-estudo': 0,
      'tab-provas': 0
    }
  };

  const listeners = new Set();

  function emit(change = { scope: 'all', reason: 'update' }) {
    for (const listener of listeners) {
      listener(state, change);
    }
  }

  function persist(reason = 'mutate', scope = 'all') {
    const saved = storageAdapter ? storageAdapter.saveData(state) : true;
    emit({ scope, reason, persisted: saved });
    return saved;
  }

  function resolveExamModuleIds(exam) {
    if (!exam) return [];
    const ids = [];
    if (Array.isArray(exam.moduleIds)) {
      for (const mid of exam.moduleIds) {
        if (mid && state.modules.some((m) => m.id === mid)) ids.push(mid);
      }
    }
    if (exam.moduleId && state.modules.some((m) => m.id === exam.moduleId)) {
      ids.push(exam.moduleId);
    }
    for (const lid of exam.lessonIds || []) {
      const lesson = state.lessons.find((l) => l.id === lid);
      if (lesson?.moduleId && state.modules.some((m) => m.id === lesson.moduleId)) {
        ids.push(lesson.moduleId);
      }
    }
    return Array.from(new Set(ids));
  }

  function syncLessonWithExams(lesson, selectedExamId) {
    for (const ex of state.exams) {
      if (!Array.isArray(ex.lessonIds)) ex.lessonIds = [];
      if (!Array.isArray(ex.moduleIds)) ex.moduleIds = ex.moduleId ? [ex.moduleId] : [];
      if (ex.id === selectedExamId) {
        if (!ex.lessonIds.includes(lesson.id)) ex.lessonIds.push(lesson.id);
        if (lesson.moduleId && !ex.moduleIds.includes(lesson.moduleId)) {
          ex.moduleIds.push(lesson.moduleId);
        }
        ex.moduleId = ex.moduleIds[0] || lesson.moduleId || '';
      } else {
        ex.lessonIds = ex.lessonIds.filter((id) => id !== lesson.id);
      }
    }
  }

  return {
    state,

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    emit(change) {
      emit(change);
    },

    getTodayStr() {
      return todayFn();
    },

    getModule(id) {
      return state.modules.find((m) => m.id === id) || null;
    },

    getLesson(id) {
      return state.lessons.find((l) => l.id === id) || null;
    },

    getExam(id) {
      return state.exams.find((e) => e.id === id) || null;
    },

    getExamModuleIds(examOrId) {
      const exam = typeof examOrId === 'string' ? this.getExam(examOrId) : examOrId;
      return resolveExamModuleIds(exam);
    },

    getLessonsForModule(moduleId) {
      return state.lessons
        .filter((l) => l.moduleId === moduleId)
        .sort((a, b) => Number(a.number) - Number(b.number));
    },

    getNextLessonNumber(moduleId) {
      if (!moduleId) return 1;
      const lessons = this.getLessonsForModule(moduleId);
      if (lessons.length === 0) return 1;
      return Math.max(...lessons.map((l) => Number(l.number) || 0)) + 1;
    },

    getModuleProgress(moduleId) {
      const lessons = this.getLessonsForModule(moduleId);
      const studiedCount = lessons.filter((l) => l.isStudied).length;
      const totalCount = lessons.length;
      const percent = totalCount > 0 ? Math.round((studiedCount / totalCount) * 100) : 0;
      const pendingStudy = lessons.filter((l) => !l.isStudied).length;
      const pendingReviews = this.getReviewsForModule(moduleId);
      return { lessons, studiedCount, totalCount, percent, pendingStudy, pendingReviews };
    },

    getReviewsOverdue() {
      const todayStr = todayFn();
      const list = [];
      for (const lesson of state.lessons) {
        if (!lesson.isStudied || !lesson.reviews) continue;
        for (const stage of REVIEW_STAGES) {
          const rev = lesson.reviews[stage];
          if (rev && !rev.done && rev.dueDate < todayStr) {
            list.push({ lesson, stage, dueDate: rev.dueDate, status: 'atrasada' });
          }
        }
      }
      return list;
    },

    getReviewsDueToday() {
      const todayStr = todayFn();
      const list = [];
      for (const lesson of state.lessons) {
        if (!lesson.isStudied || !lesson.reviews) continue;
        for (const stage of REVIEW_STAGES) {
          const rev = lesson.reviews[stage];
          if (rev && !rev.done && rev.dueDate === todayStr) {
            list.push({ lesson, stage, dueDate: rev.dueDate, status: 'hoje' });
          }
        }
      }
      return list;
    },

    getPendingReviews() {
      return [...this.getReviewsOverdue(), ...this.getReviewsDueToday()];
    },

    getReviewsForModule(moduleId) {
      const todayStr = todayFn();
      let count = 0;
      for (const lesson of state.lessons) {
        if (lesson.moduleId !== moduleId || !lesson.isStudied || !lesson.reviews) continue;
        for (const stage of REVIEW_STAGES) {
          const rev = lesson.reviews[stage];
          if (rev && !rev.done && rev.dueDate <= todayStr) {
            count++;
          }
        }
      }
      return count;
    },

    getUnstudiedLessonsForModule(moduleId) {
      return state.lessons.filter((l) => l.moduleId === moduleId && !l.isStudied).length;
    },

    getUpcomingReviews(limit = 5) {
      const todayStr = todayFn();
      const list = [];
      for (const lesson of state.lessons) {
        if (!lesson.isStudied || !lesson.reviews) continue;
        for (const stage of REVIEW_STAGES) {
          const rev = lesson.reviews[stage];
          if (rev && !rev.done && rev.dueDate > todayStr) {
            list.push({ lesson, stage, dueDate: rev.dueDate });
          }
        }
      }
      return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, limit);
    },

    setViewMode(mode) {
      const next = mode === 'grid' ? 'grid' : 'list';
      if (state.moduleViewMode === next) return false;
      state.moduleViewMode = next;
      storageAdapter?.saveViewMode(next);
      emit({ scope: 'modules', reason: 'viewMode' });
      return true;
    },

    saveModule({ id, name, iconKey, colorKey }) {
      const trimmed = String(name || '').trim();
      if (!trimmed) return null;
      const canonicalIcon = canonicalizeIconKey(iconKey, trimmed);

      if (id) {
        const mod = this.getModule(id);
        if (!mod) return null;
        mod.name = trimmed;
        mod.iconKey = canonicalIcon;
        mod.colorKey = colorKey || mod.colorKey;
        persist('updateModule');
        return { mod, isNew: false };
      }

      const mod = {
        id: makeId('m'),
        name: trimmed,
        iconKey: canonicalIcon,
        colorKey: colorKey || 'navy',
        createdAt: Date.now()
      };
      state.modules.push(mod);
      persist('createModule');
      return { mod, isNew: true };
    },

    deleteModule(moduleId) {
      const mod = this.getModule(moduleId);
      if (!mod) return false;
      const removedLessonIds = new Set(
        state.lessons.filter((l) => l.moduleId === moduleId).map((l) => l.id)
      );
      state.modules = state.modules.filter((m) => m.id !== moduleId);
      state.lessons = state.lessons.filter((l) => l.moduleId !== moduleId);
      state.exams = state.exams
        .map((e) => {
          const baseModIds =
            Array.isArray(e.moduleIds) && e.moduleIds.length > 0
              ? e.moduleIds
              : e.moduleId
                ? [e.moduleId]
                : [];
          const nextModIds = baseModIds.filter((id) => id !== moduleId);
          if (nextModIds.length === 0) return null;
          return {
            ...e,
            moduleIds: nextModIds,
            moduleId: nextModIds[0],
            lessonIds: (e.lessonIds || []).filter((id) => !removedLessonIds.has(id))
          };
        })
        .filter(Boolean);
      if (state.currentModuleId === moduleId) {
        state.currentModuleId = null;
      }
      persist('deleteModule');
      return true;
    },

    saveLesson({ id, moduleId, number, title, notes, isStudied, examId }) {
      const trimmedTitle = String(title || '').trim();
      if (!trimmedTitle) return null;

      const resolvedModuleId = moduleId || state.modules[0]?.id;
      if (!resolvedModuleId) return null;

      const lessonNum = Math.max(1, parseInt(number, 10) || 1);
      const trimmedNotes = String(notes || '').trim();
      const normalizedExamId = examId || null;
      const todayStr = todayFn();

      if (id) {
        const lesson = this.getLesson(id);
        if (!lesson) return null;
        lesson.title = trimmedTitle;
        lesson.notes = trimmedNotes;
        lesson.number = lessonNum;
        lesson.moduleId = resolvedModuleId;
        lesson.examId = normalizedExamId;
        if (isStudied && !lesson.isStudied) {
          lesson.isStudied = true;
          lesson.studiedAt = todayStr;
          lesson.reviews = createSpacedReviews(todayStr);
        } else if (!isStudied && lesson.isStudied) {
          lesson.isStudied = false;
          lesson.studiedAt = null;
          lesson.reviews = null;
        }
        syncLessonWithExams(lesson, normalizedExamId);
        persist('updateLesson');
        return { lesson, isNew: false };
      }

      const lesson = {
        id: makeId('l'),
        moduleId: resolvedModuleId,
        number: lessonNum,
        title: trimmedTitle,
        notes: trimmedNotes,
        isStudied: Boolean(isStudied),
        studiedAt: isStudied ? todayStr : null,
        reviews: isStudied ? createSpacedReviews(todayStr) : null,
        examId: normalizedExamId,
        createdAt: Date.now()
      };
      state.lessons.push(lesson);
      syncLessonWithExams(lesson, normalizedExamId);
      persist('createLesson');
      return { lesson, isNew: true };
    },

    deleteLesson(lessonId) {
      const lesson = this.getLesson(lessonId);
      if (!lesson) return null;

      const backupLesson = structuredClone(lesson);
      const affectedExamIds = [];

      state.lessons = state.lessons.filter((l) => l.id !== lessonId);
      for (const exam of state.exams) {
        if (Array.isArray(exam.lessonIds) && exam.lessonIds.includes(lessonId)) {
          affectedExamIds.push(exam.id);
          exam.lessonIds = exam.lessonIds.filter((id) => id !== lessonId);
        }
      }

      persist('deleteLesson');

      return {
        lesson: backupLesson,
        undo: () => {
          state.lessons.push(backupLesson);
          for (const exId of affectedExamIds) {
            const ex = this.getExam(exId);
            if (ex && Array.isArray(ex.lessonIds) && !ex.lessonIds.includes(backupLesson.id)) {
              ex.lessonIds.push(backupLesson.id);
            }
          }
          persist('restoreLesson');
        }
      };
    },

    toggleLessonStudied(lessonId) {
      const lesson = this.getLesson(lessonId);
      if (!lesson) return null;

      const prevStudied = lesson.isStudied;
      const prevStudiedAt = lesson.studiedAt;
      const prevReviews = lesson.reviews ? structuredClone(lesson.reviews) : null;

      if (!lesson.isStudied) {
        lesson.isStudied = true;
        lesson.studiedAt = todayFn();
        lesson.reviews = createSpacedReviews(lesson.studiedAt);
      } else {
        lesson.isStudied = false;
        lesson.studiedAt = null;
        lesson.reviews = null;
      }

      persist('toggleLessonStudied');

      return {
        lesson,
        isStudied: lesson.isStudied,
        undo: () => {
          lesson.isStudied = prevStudied;
          lesson.studiedAt = prevStudiedAt;
          lesson.reviews = prevReviews;
          persist('undoToggleLesson');
        }
      };
    },

    toggleReviewStage(lessonId, stageKey) {
      const lesson = this.getLesson(lessonId);
      if (!lesson || !lesson.reviews || !lesson.reviews[stageKey]) return null;
      const rev = lesson.reviews[stageKey];
      rev.done = !rev.done;
      rev.doneAt = rev.done ? todayFn() : null;
      persist('toggleReviewStage');
      return { lesson, stageKey, done: rev.done };
    },

    completeReview(lessonId, stageKey) {
      const lesson = this.getLesson(lessonId);
      if (!lesson || !lesson.reviews || !lesson.reviews[stageKey]) return null;
      const rev = lesson.reviews[stageKey];
      const prevDone = rev.done;
      const prevDoneAt = rev.doneAt;

      rev.done = true;
      rev.doneAt = todayFn();
      persist('completeReview');

      const remainingToday = this.getPendingReviews().length;
      return {
        lesson,
        stageKey,
        remainingToday,
        undo: () => {
          rev.done = prevDone;
          rev.doneAt = prevDoneAt;
          persist('undoCompleteReview');
        }
      };
    },

    saveExam({ id, name, date, moduleId, moduleIds, lessonIds = [] }) {
      const trimmedName = String(name || '').trim();
      if (!trimmedName || !date) return null;

      const checkedIds = Array.isArray(lessonIds)
        ? Array.from(new Set(lessonIds.map((lid) => String(lid || '').trim()).filter(Boolean)))
        : [];

      const candidateModIds = [];
      if (Array.isArray(moduleIds)) {
        for (const mid of moduleIds) {
          if (mid) candidateModIds.push(String(mid));
        }
      }
      if (moduleId) {
        candidateModIds.push(String(moduleId));
      }
      for (const lid of checkedIds) {
        const lesson = this.getLesson(lid);
        if (lesson?.moduleId) candidateModIds.push(lesson.moduleId);
      }

      const validModuleIds = Array.from(new Set(candidateModIds)).filter((mid) => this.getModule(mid));
      if (validModuleIds.length === 0) return null;

      const primaryModuleId = validModuleIds[0];
      let targetExamId = id || null;
      let isNew = false;

      if (targetExamId) {
        const exam = this.getExam(targetExamId);
        if (!exam) return null;
        exam.name = trimmedName;
        exam.date = date;
        exam.moduleId = primaryModuleId;
        exam.moduleIds = validModuleIds;
        exam.lessonIds = checkedIds;
      } else {
        isNew = true;
        targetExamId = makeId('e');
        state.exams.push({
          id: targetExamId,
          name: trimmedName,
          date,
          moduleId: primaryModuleId,
          moduleIds: validModuleIds,
          lessonIds: checkedIds,
          createdAt: Date.now()
        });
      }

      for (const lesson of state.lessons) {
        if (checkedIds.includes(lesson.id)) {
          lesson.examId = targetExamId;
        } else if (lesson.examId === targetExamId) {
          lesson.examId = null;
        }
      }

      persist(isNew ? 'createExam' : 'updateExam');
      return { exam: this.getExam(targetExamId), isNew };
    },

    deleteExam(examId) {
      const exam = this.getExam(examId);
      if (!exam) return false;
      for (const lesson of state.lessons) {
        if (lesson.examId === examId) lesson.examId = null;
      }
      state.exams = state.exams.filter((e) => e.id !== examId);
      persist('deleteExam');
      return true;
    },

    querySearch(rawQuery = '') {
      const q = normalizeText(rawQuery);
      const isPendingFilter = q === 'pendente' || q === 'pendentes';
      const isReviewFilter = q === 'revisar' || q === 'revisao';

      if (!q) {
        return {
          mode: 'recent',
          modules: state.modules.slice(0, 4),
          lessons: [...state.lessons]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 8)
        };
      }

      if (isPendingFilter) {
        return {
          mode: 'filter',
          modules: [],
          lessons: state.lessons.filter((l) => !l.isStudied)
        };
      }

      if (isReviewFilter) {
        const seen = new Set();
        const revLessons = [];
        for (const item of this.getPendingReviews()) {
          if (!seen.has(item.lesson.id)) {
            seen.add(item.lesson.id);
            revLessons.push(item.lesson);
          }
        }
        return {
          mode: 'filter',
          modules: [],
          lessons: revLessons
        };
      }

      const modules = state.modules.filter((m) => normalizeText(m.name).includes(q));
      const lessons = state.lessons.filter((l) => {
        const mod = this.getModule(l.moduleId);
        const haystack = normalizeText(
          `${l.title} ${l.notes || ''} Aula ${String(l.number).padStart(2, '0')} ${mod ? mod.name : ''}`
        );
        return haystack.includes(q);
      });

      return { mode: 'search', modules, lessons };
    },

    exportBackupPayload() {
      return {
        app: 'MeuEstudo',
        user: 'Lauro',
        version: 1,
        exportedAt: new Date().toISOString(),
        modules: structuredClone(state.modules),
        lessons: structuredClone(state.lessons),
        exams: structuredClone(state.exams)
      };
    },

    importBackupPayload(rawJson) {
      const validation = validateBackupPayload(rawJson);
      if (!validation.ok) return validation;
      const snap = normalizeStateSnapshot(validation.data);
      state.modules = snap.modules;
      state.lessons = snap.lessons;
      state.exams = snap.exams;
      state.currentModuleId = null;
      persist('importBackup');
      return { ok: true, counts: { modules: snap.modules.length, lessons: snap.lessons.length, exams: snap.exams.length } };
    }
  };
}
