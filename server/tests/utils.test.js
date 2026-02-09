import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWeekStart } from '../utils.js';

const fixedNow = new Date('2026-02-04T12:00:00Z');

function localDateKey(date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

describe('getWeekStart', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses Monday as default reset day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    const weekStart = getWeekStart('UTC');
    expect(weekStart.getHours()).toBe(0);
    expect(weekStart.getMinutes()).toBe(0);
    expect(localDateKey(weekStart)).toBe('2026-02-02');
  });

  it('respects custom reset day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    const weekStart = getWeekStart('UTC', 0);
    expect(weekStart.getHours()).toBe(0);
    expect(weekStart.getMinutes()).toBe(0);
    expect(localDateKey(weekStart)).toBe('2026-02-01');
  });

  it('normalizes invalid reset day to Monday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    const weekStart = getWeekStart('UTC', 10);
    expect(weekStart.getHours()).toBe(0);
    expect(weekStart.getMinutes()).toBe(0);
    expect(localDateKey(weekStart)).toBe('2026-02-02');
  });
});
