import { describe, expect, it, vi } from 'vitest';
import { fetchVisits } from './api';

describe('fetchVisits', () => {
  it('returns typed points', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify([
              { lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T10:00:00Z' },
            ]),
          ),
      ),
    );
    const pts = await fetchVisits();
    expect(pts[0].city).toBe('Lisbon');
  });
});
