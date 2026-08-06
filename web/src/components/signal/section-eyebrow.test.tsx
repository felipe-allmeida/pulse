import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionEyebrow } from './section-eyebrow';

describe('SectionEyebrow', () => {
  it('renders its children', () => {
    render(<SectionEyebrow>/about</SectionEyebrow>);

    expect(screen.getByText('/about')).toBeInTheDocument();
  });

  it('merges a custom className with the base styles', () => {
    render(<SectionEyebrow className="extra-class">/projects</SectionEyebrow>);

    expect(screen.getByText('/projects')).toHaveClass('extra-class');
  });
});
