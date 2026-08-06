import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Chip } from './chip';

describe('Chip', () => {
  it('renders its children', () => {
    render(<Chip>TypeScript</Chip>);

    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('merges a custom className with the base styles', () => {
    render(<Chip className="extra-class">React</Chip>);

    expect(screen.getByText('React')).toHaveClass('extra-class');
  });
});
