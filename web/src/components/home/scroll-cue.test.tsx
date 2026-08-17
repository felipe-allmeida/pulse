import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { ScrollCue } from './scroll-cue';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });
  fireEvent.scroll(window);
}

/** Stands in for the real <section id="how-i-help"> that HowIHelp renders. */
function mountTarget() {
  const target = document.createElement('section');
  target.id = 'how-i-help';
  const scrollIntoView = vi.fn();
  target.scrollIntoView = scrollIntoView;
  document.body.appendChild(target);
  return { scrollIntoView };
}

afterEach(() => {
  document.getElementById('how-i-help')?.remove();
  scrollTo(0);
});

describe('ScrollCue', () => {
  it('renders a labelled button', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<ScrollCue />);

    expect(await screen.findByRole('button', { name: 'Scroll' })).toBeInTheDocument();
  });

  it('smooth-scrolls to the next section when clicked', async () => {
    mockMatchMedia(false);
    const { scrollIntoView } = mountTarget();

    await renderWithI18n(<ScrollCue />);
    fireEvent.click(await screen.findByRole('button', { name: 'Scroll' }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('jumps without smooth scrolling under prefers-reduced-motion: reduce', async () => {
    mockMatchMedia(true);
    const { scrollIntoView } = mountTarget();

    await renderWithI18n(<ScrollCue />);
    fireEvent.click(await screen.findByRole('button', { name: 'Scroll' }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('does not throw when the scroll target is absent', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<ScrollCue />);

    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Scroll' }))).not.toThrow();
  });

  it('freezes the travelling segment under prefers-reduced-motion: reduce', async () => {
    mockMatchMedia(true);

    await renderWithI18n(<ScrollCue />);

    expect(await screen.findByTestId('scroll-cue')).toHaveAttribute('data-motion', 'static');
  });

  it('animates the travelling segment when motion is allowed', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<ScrollCue />);

    expect(await screen.findByTestId('scroll-cue')).toHaveAttribute('data-motion', 'animated');
  });

  it('fades out and stops taking clicks once the page is scrolled', async () => {
    mockMatchMedia(false);
    const { scrollIntoView } = mountTarget();

    await renderWithI18n(<ScrollCue />);
    const cue = await screen.findByTestId('scroll-cue');
    expect(cue).toHaveClass('opacity-100');

    scrollTo(120);

    expect(cue).toHaveClass('opacity-0');
    expect(cue).toHaveClass('pointer-events-none');
    expect(cue).toHaveAttribute('tabindex', '-1');

    fireEvent.click(cue);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('comes back when the page returns to the top', async () => {
    mockMatchMedia(false);

    await renderWithI18n(<ScrollCue />);
    const cue = await screen.findByTestId('scroll-cue');

    scrollTo(120);
    expect(cue).toHaveClass('opacity-0');

    scrollTo(0);
    expect(cue).toHaveClass('opacity-100');
  });
});
