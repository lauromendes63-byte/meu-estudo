import { describe, expect, it } from 'vitest';
import {
  canonicalizeIconKey,
  createMemoryStorageAdapter,
  normalizeStateSnapshot,
  validateBackupPayload
} from '../../src/domain/storage-adapter.js';

describe('storage-adapter & legacy migration compatibility', () => {
  it('migrates deprecated icon keys deterministically', () => {
    expect(canonicalizeIconKey('joint', 'Reumatologia')).toBe('reuma');
    expect(canonicalizeIconKey('general', 'Clínica Médica')).toBe('stethoscope');
    expect(canonicalizeIconKey('brain', 'Psiquiatria Geral')).toBe('psiq');
    expect(canonicalizeIconKey('brain', 'Saúde Mental')).toBe('psiq');
    expect(canonicalizeIconKey('brain', 'Neurologia')).toBe('brain');
  });

  it('preserves user data across snapshots with safe field coercion', () => {
    const snap = normalizeStateSnapshot({
      modules: [{ id: 'm1', name: 'Reumato', iconKey: 'joint', colorKey: 'indigo' }],
      lessons: [{ id: 'l1', moduleId: 'm1', number: '4', title: 'LES', notes: '• FAN+', isStudied: 1 }],
      exams: [{ id: 'e1', name: 'P1', date: '2026-12-01', moduleId: 'm1', lessonIds: ['l1'] }]
    });

    expect(snap.modules[0].iconKey).toBe('reuma');
    expect(snap.lessons[0].number).toBe(4);
    expect(snap.lessons[0].isStudied).toBe(true);
    expect(snap.exams[0].lessonIds).toEqual(['l1']);
  });

  it('rejects malformed backup JSON and accepts valid backup files', () => {
    expect(validateBackupPayload('{invalid').ok).toBe(false);
    expect(validateBackupPayload('{"modules":[]}').ok).toBe(false);

    const valid = validateBackupPayload(
      JSON.stringify({
        modules: [{ id: 'm1', name: 'Cardio', iconKey: 'heart', colorKey: 'crimson' }],
        lessons: [],
        exams: []
      })
    );
    expect(valid.ok).toBe(true);
    expect(valid.data.modules[0].name).toBe('Cardio');
  });

  it('persists and restores view mode via memory adapter', () => {
    const adapter = createMemoryStorageAdapter();
    expect(adapter.loadViewMode()).toBe('list');
    adapter.saveViewMode('grid');
    expect(adapter.loadViewMode()).toBe('grid');
  });
});
