import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const usePulseHubMock = vi.fn();

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => usePulseHubMock(),
}));

const { PresenceBadge } = await import('./presence-badge');

describe('PresenceBadge', () => {
  it('renders the online count from usePulseHub', () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 7, react: vi.fn() });
    render(<PresenceBadge />);
    expect(screen.getByText('7 online')).toBeInTheDocument();
  });
});
