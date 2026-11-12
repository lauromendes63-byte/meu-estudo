import { describe, expect, it } from 'vitest';
import { createMemoryStorageAdapter } from '../../src/domain/storage-adapter.js';
import { createStudyEngine } from '../../src/domain/study-engine.js';

describe('createStudyEngine core domain workflows', () => {
  function setupEngine(today = '2026-11-11') {
    const storageAdapter = createMemoryStorageAdapter();
    return createStudyEngine({ storageAdapter, todayFn: () => today });
  }

  it('creates D+1, D+7, D+30 schedules on studied lessons and supports completeReview + undo', () => {
    let fakeToday = '2026-11-11';
    const engine = createStudyEngine({
      storageAdapter: createMemoryStorageAdapter(),
      todayFn: () => fakeToday
    });

    const { mod } = engine.saveModule({ name: 'Cardiologia', iconKey: 'heart', colorKey: 'crimson' });
    const { lesson } = engine.saveLesson({
      moduleId: mod.id,
      number: 1,
      title: 'Insuficiência Cardíaca',
      notes: '[Alerta: B3 indica sobrecarga]',
      isStudied: true
    });

    expect(lesson.reviews.d1.dueDate).toBe('2026-11-12');
    expect(lesson.reviews.d7.dueDate).toBe('2026-11-18');
    expect(lesson.reviews.d30.dueDate).toBe('2026-12-11');
    expect(engine.getPendingReviews()).toHaveLength(0);

    fakeToday = '2026-11-12';
    expect(engine.getReviewsDueToday()).toHaveLength(1);
    expect(engine.getPendingReviews()).toHaveLength(1);

    const completion = engine.completeReview(lesson.id, 'd1');
    expect(completion.remainingToday).toBe(0);
    expect(lesson.reviews.d1.done).toBe(true);

    completion.undo();
    expect(lesson.reviews.d1.done).toBe(false);
    expect(engine.getPendingReviews()).toHaveLength(1);
  });

  it('maintains bidirectional sync between lessons and exams even across delete/undo', () => {
    const engine = setupEngine();
    const { mod } = engine.saveModule({ name: 'Nefrologia', iconKey: 'kidney', colorKey: 'cyan' });
    const { lesson: l1 } = engine.saveLesson({ moduleId: mod.id, number: 1, title: 'SN vs GN', isStudied: false });
    const { lesson: l2 } = engine.saveLesson({ moduleId: mod.id, number: 2, title: 'LRA', isStudied: true });

    const { exam } = engine.saveExam({
      name: 'P1 Nefro',
      date: '2026-11-25',
      moduleId: mod.id,
      lessonIds: [l1.id, l2.id]
    });

    expect(engine.getLesson(l1.id).examId).toBe(exam.id);
    expect(engine.getLesson(l2.id).examId).toBe(exam.id);

    const del = engine.deleteLesson(l1.id);
    expect(engine.getExam(exam.id).lessonIds).toEqual([l2.id]);

    del.undo();
    expect(engine.getLesson(l1.id)).not.toBeNull();
    expect(engine.getExam(exam.id).lessonIds).toContain(l1.id);
  });

  it('filters global search by keywords, pending lessons, and due reviews', () => {
    const engine = createStudyEngine({
      storageAdapter: createMemoryStorageAdapter(),
      todayFn: () => '2026-11-12'
    });

    const { mod } = engine.saveModule({ name: 'Pneumologia', iconKey: 'lung', colorKey: 'blue' });
    engine.saveLesson({
      moduleId: mod.id,
      number: 1,
      title: 'Asma Brônquica',
      notes: '[Padrão-Ouro: Espirometria]',
      isStudied: false
    });
    engine.saveLesson({
      moduleId: mod.id,
      number: 2,
      title: 'DPOC',
      notes: '[Alerta: Retenção de CO2]',
      isStudied: true
    });

    // Manually set d1 due today on DPOC
    const dpoc = engine.state.lessons[1];
    dpoc.reviews.d1.dueDate = '2026-11-12';

    expect(engine.querySearch('pendente').lessons.map((l) => l.title)).toEqual(['Asma Brônquica']);
    expect(engine.querySearch('revisar').lessons.map((l) => l.title)).toEqual(['DPOC']);
    expect(engine.querySearch('Padrão-Ouro:').lessons.map((l) => l.title)).toEqual(['Asma Brônquica']);
    expect(engine.querySearch('pneumo').modules).toHaveLength(1);
  });

  it('supports multi-module exams and preserves remaining modules when one module is deleted', () => {
    const engine = setupEngine();
    const { mod: cardio } = engine.saveModule({ name: 'Cardiologia', iconKey: 'heart', colorKey: 'crimson' });
    const { mod: pneumo } = engine.saveModule({ name: 'Pneumologia', iconKey: 'lung', colorKey: 'blue' });
    const { mod: neuro } = engine.saveModule({ name: 'Neurologia', iconKey: 'brain', colorKey: 'indigo' });

    const { lesson: c1 } = engine.saveLesson({ moduleId: cardio.id, number: 1, title: 'IC', isStudied: true });
    const { lesson: p1 } = engine.saveLesson({ moduleId: pneumo.id, number: 1, title: 'Asma', isStudied: false });
    const { lesson: n1 } = engine.saveLesson({ moduleId: neuro.id, number: 1, title: 'AVC', isStudied: false });

    const { exam } = engine.saveExam({
      name: 'Simulado M1',
      date: '2026-11-26',
      moduleIds: [cardio.id, pneumo.id],
      lessonIds: [c1.id, p1.id]
    });

    expect(exam.moduleId).toBe(cardio.id);
    expect(exam.moduleIds).toEqual([cardio.id, pneumo.id]);
    expect(engine.getExamModuleIds(exam.id)).toEqual([cardio.id, pneumo.id]);
    expect(engine.getLesson(c1.id).examId).toBe(exam.id);
    expect(engine.getLesson(p1.id).examId).toBe(exam.id);

    // Assigning a lesson from a 3rd module via saveLesson automatically extends the exam's moduleIds
    engine.saveLesson({
      id: n1.id,
      moduleId: neuro.id,
      number: 1,
      title: 'AVC',
      isStudied: false,
      examId: exam.id
    });
    expect(engine.getExamModuleIds(exam.id)).toEqual([cardio.id, pneumo.id, neuro.id]);

    // Deleting Cardio drops Cardio lessons/ref from the exam while keeping Pneumo and Neuro intact
    expect(engine.deleteModule(cardio.id)).toBe(true);
    const updatedExam = engine.getExam(exam.id);
    expect(updatedExam).not.toBeNull();
    expect(updatedExam.moduleId).toBe(pneumo.id);
    expect(updatedExam.moduleIds).toEqual([pneumo.id, neuro.id]);
    expect(updatedExam.lessonIds).toEqual([p1.id, n1.id]);

    // Deleting the remaining modules deletes the now-empty exam
    engine.deleteModule(pneumo.id);
    engine.deleteModule(neuro.id);
    expect(engine.getExam(exam.id)).toBeNull();
  });
});
