import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SubsectionHeading } from './subsection-heading';

describe('SubsectionHeading', () => {
  it('renders its children as an h2', () => {
    render(<SubsectionHeading>Experience</SubsectionHeading>);

    expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeInTheDocument();
  });

  it('merges a custom className with the base styles', () => {
    render(<SubsectionHeading className="extra-class">Skills</SubsectionHeading>);

    expect(screen.getByRole('heading', { level: 2, name: 'Skills' })).toHaveClass('extra-class');
  });
});
