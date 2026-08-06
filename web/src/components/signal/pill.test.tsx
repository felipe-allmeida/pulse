import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Pill } from './pill';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('Pill', () => {
  it('renders its children', () => {
    mockMatchMedia(false);
    render(<Pill>3 online now</Pill>);

    expect(screen.getByText('3 online now')).toBeInTheDocument();
  });

  it('merges a custom className with the base styles', () => {
    mockMatchMedia(false);
    const { container } = render(<Pill className="extra-class">eyebrow</Pill>);

    expect(container.querySelector('.extra-class')).toHaveTextContent('eyebrow');
  });

  it('omits data-motion and the pulsing dot when dot is not set', () => {
    mockMatchMedia(false);
    const { container } = render(<Pill>static badge</Pill>);

    expect(container.querySelector('[data-motion]')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-ping')).not.toBeInTheDocument();
  });

  it('freezes the pulse under prefers-reduced-motion: reduce when dot is set', () => {
    mockMatchMedia(true);
    const { container } = render(<Pill dot>live</Pill>);

    expect(container.querySelector('[data-motion="static"]')).toBeInTheDocument();
    expect(container.querySelector('.animate-ping')).not.toBeInTheDocument();
  });

  it('animates the pulse when motion is not reduced and dot is set', () => {
    mockMatchMedia(false);
    const { container } = render(<Pill dot>live</Pill>);

    expect(container.querySelector('[data-motion="animated"]')).toBeInTheDocument();
    expect(container.querySelector('.animate-ping')).toBeInTheDocument();
  });
});
