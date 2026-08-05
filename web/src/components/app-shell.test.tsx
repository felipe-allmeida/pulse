import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => ({ connection: 'connected', count: 4, react: vi.fn() }),
}));

const { AppShell } = await import('./app-shell');

describe('AppShell', () => {
  it('renders the wordmark, status widgets, and children', () => {
    render(
      <AppShell>
        <div>page content</div>
      </AppShell>,
    );

    expect(screen.getByText('Pulse')).toBeInTheDocument();
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(screen.getByText('4 online')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });
});
