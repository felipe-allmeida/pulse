import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectScreenshot } from './project-screenshot';

describe('ProjectScreenshot', () => {
  it('renders no img and no visible placeholder text when there is no src', () => {
    render(<ProjectScreenshot alt="Pulse screenshot" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/screenshot coming|captura de tela em breve/i)).not.toBeInTheDocument();
  });

  it('marks the no-screenshot accent treatment as decorative (aria-hidden)', () => {
    const { container } = render(<ProjectScreenshot alt="Pulse screenshot" />);

    const decorative = container.querySelector('[aria-hidden="true"]');
    expect(decorative).toBeInTheDocument();
  });

  it('renders the real image with a meaningful alt, lazy loading, when src is set', () => {
    render(<ProjectScreenshot src="https://example.com/shot.png" alt="Pulse screenshot" />);

    const image = screen.getByRole('img', { name: 'Pulse screenshot' });
    expect(image).toHaveAttribute('src', 'https://example.com/shot.png');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('applies a tamed glow (no oversized halo) for the featured slot', () => {
    render(<ProjectScreenshot src="https://example.com/shot.png" alt="Pulse screenshot" glow />);

    const image = screen.getByRole('img', { name: 'Pulse screenshot' });
    expect(image.className).not.toMatch(/shadow-\[0_0_60px/);
  });
});
