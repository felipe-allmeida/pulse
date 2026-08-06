import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

const usePulseHubMock = vi.fn();

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => usePulseHubMock(),
}));

const { PresenceBadge } = await import('./presence-badge');

describe('PresenceBadge', () => {
  it('renders the online count from usePulseHub', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 7, react: vi.fn() });
    await renderWithI18n(<PresenceBadge />);
    expect(screen.getByText('7 online')).toBeInTheDocument();
  });

  it('renders a singular count of 1 online', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 1, react: vi.fn() });
    await renderWithI18n(<PresenceBadge />);
    expect(screen.getByText('1 online')).toBeInTheDocument();
  });

  it('formats large counts with Intl.NumberFormat for the active locale in pt-BR', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 1234, react: vi.fn() });
    await renderWithI18n(<PresenceBadge />, { locale: 'pt-BR' });
    expect(screen.getByText('1.234 online')).toBeInTheDocument();
  });
});
