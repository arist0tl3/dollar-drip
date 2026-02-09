import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWeekStart } from '../utils.js';

const fixedNow = new Date('2026-02-04T12:00:00Z');

describe('getWeekStart', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses Monday as default reset day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    const weekStart = getWeekStart('UTC');
    expect(weekStart.toISOString()).toBe('2026-02-02T00:00:00.000Z');
  });

  it('respects custom reset day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    const weekStart = getWeekStart('UTC', 0);
    expect(weekStart.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('normalizes invalid reset day to Monday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    const weekStart = getWeekStart('UTC', 10);
    expect(weekStart.toISOString()).toBe('2026-02-02T00:00:00.000Z');
  });
});
