import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

const usePulseHubMock = vi.fn();

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => usePulseHubMock(),
}));

const { ConnectionStatus } = await import('./connection-status');

describe('ConnectionStatus', () => {
  it('renders the connected label', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 0, react: vi.fn() });
    await renderWithI18n(<ConnectionStatus />);
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it('renders the reconnecting label', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'reconnecting', count: 0, react: vi.fn() });
    await renderWithI18n(<ConnectionStatus />);
    expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
  });

  it('renders the offline label', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'offline', count: 0, react: vi.fn() });
    await renderWithI18n(<ConnectionStatus />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('renders the pt-BR connected label', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 0, react: vi.fn() });
    await renderWithI18n(<ConnectionStatus />, { locale: 'pt-BR' });
    expect(screen.getByText('Conectado')).toBeInTheDocument();
  });
});
