import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const usePulseHubMock = vi.fn();

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => usePulseHubMock(),
}));

const { ConnectionStatus } = await import('./connection-status');

describe('ConnectionStatus', () => {
  it('renders the connected label', () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 0, react: vi.fn() });
    render(<ConnectionStatus />);
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it('renders the reconnecting label', () => {
    usePulseHubMock.mockReturnValue({ connection: 'reconnecting', count: 0, react: vi.fn() });
    render(<ConnectionStatus />);
    expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
  });

  it('renders the offline label', () => {
    usePulseHubMock.mockReturnValue({ connection: 'offline', count: 0, react: vi.fn() });
    render(<ConnectionStatus />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });
});
