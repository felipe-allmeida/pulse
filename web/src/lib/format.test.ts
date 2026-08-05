import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './format';

describe('formatRelativeTime', () => {
  const now = new Date('2026-08-04T10:00:00Z');

  it('formats seconds ago', () => {
    expect(formatRelativeTime('2026-08-04T09:59:45Z', now)).toMatch(/second/);
  });

  it('formats minutes ago', () => {
    expect(formatRelativeTime('2026-08-04T09:55:00Z', now)).toMatch(/minute/);
  });

  it('formats hours ago', () => {
    expect(formatRelativeTime('2026-08-04T07:00:00Z', now)).toMatch(/hour/);
  });

  it('formats days ago', () => {
    expect(formatRelativeTime('2026-08-01T10:00:00Z', now)).toMatch(/day/);
  });

  it('is deterministic given a fixed now', () => {
    const a = formatRelativeTime('2026-08-04T09:55:00Z', now);
    const b = formatRelativeTime('2026-08-04T09:55:00Z', now);
    expect(a).toBe(b);
  });
});
