import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const useVisitsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useVisits: () => useVisitsMock(),
}));

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const { HeroMap } = await import('./hero-map');

const points = [
  { lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T10:00:00Z' },
  { lat: 40.7, lon: -74.0, city: 'New York', country: 'United States', at: '2026-08-04T11:00:00Z' },
  { lat: 35.7, lon: 139.7, city: 'Tokyo', country: 'Japan', at: '2026-08-04T11:05:00Z' },
];

describe('HeroMap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing given mocked points', () => {
    useVisitsMock.mockReturnValue({ data: points });
    mockMatchMedia(false);

    expect(() => render(<HeroMap />)).not.toThrow();
  });

  it('renders without crashing when there is no visit data yet', () => {
    useVisitsMock.mockReturnValue({ data: undefined });
    mockMatchMedia(false);

    expect(() => render(<HeroMap />)).not.toThrow();
  });

  it('is a decorative, aria-hidden layer', () => {
    useVisitsMock.mockReturnValue({ data: points });
    mockMatchMedia(false);

    const { container } = render(<HeroMap />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not schedule the animation loop under prefers-reduced-motion: reduce', () => {
    useVisitsMock.mockReturnValue({ data: points });
    mockMatchMedia(true);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    const { container } = render(<HeroMap />);

    expect(container.firstElementChild).toHaveAttribute('data-motion', 'static');
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('schedules the animation loop when motion is not reduced', () => {
    useVisitsMock.mockReturnValue({ data: points });
    mockMatchMedia(false);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    const { container } = render(<HeroMap />);

    expect(container.firstElementChild).toHaveAttribute('data-motion', 'animated');
    expect(rafSpy).toHaveBeenCalled();
  });
});
