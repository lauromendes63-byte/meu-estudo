import { describe, expect, it } from 'vitest';
import { addDays, daysDiff, formatDateDisplay, formatDateFull, formatHeaderDate, getTodayStr } from '../../src/domain/dates.js';

describe('dates domain helpers', () => {
  it('formats YYYY-MM-DD consistently with getTodayStr and addDays', () => {
    const base = '2026-10-29';
    expect(addDays(base, 1)).toBe('2026-10-30');
    expect(addDays(base, 7)).toBe('2026-11-05');
    expect(addDays(base, 30)).toBe('2026-11-28');
    expect(getTodayStr(new Date(2026, 9, 8))).toBe('2026-10-08');
  });

  it('formats short and full Brazilian dates', () => {
    expect(formatDateDisplay('2026-03-05')).toBe('05/03');
    expect(formatDateFull('2026-03-05')).toBe('5 de Mar');
    expect(formatDateDisplay('')).toBe('');
    expect(formatHeaderDate(new Date(2026, 10, 11))).toMatch(/nov/i);
  });

  it('computes signed day differences reliably across month boundaries', () => {
    expect(daysDiff('2026-11-11', '2026-11-11')).toBe(0);
    expect(daysDiff('2026-11-18', '2026-11-11')).toBe(7);
    expect(daysDiff('2026-11-08', '2026-11-11')).toBe(-3);
  });
});
