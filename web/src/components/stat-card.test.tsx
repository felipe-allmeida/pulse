import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Activity } from 'lucide-react';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Active" value={5} icon={Activity} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders a sparkline when series is provided', () => {
    render(<StatCard label="Active" value={5} icon={Activity} series={[1, 2, 3, 4, 5]} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
