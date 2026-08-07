import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

const usePulseHubMock = vi.fn();

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => usePulseHubMock(),
}));

const { LiveIndicator } = await import('./live-indicator');

describe('LiveIndicator', () => {
  it('renders the online count as visible text', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 7, react: vi.fn() });
    await renderWithI18n(<LiveIndicator />);

    expect(screen.getByText('7 online')).toBeInTheDocument();
  });

  it('renders a singular count of 1 online', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 1, react: vi.fn() });
    await renderWithI18n(<LiveIndicator />);

    expect(screen.getByText('1 online')).toBeInTheDocument();
  });

  it('formats large counts with Intl.NumberFormat for the active locale in pt-BR', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 1234, react: vi.fn() });
    await renderWithI18n(<LiveIndicator />, { locale: 'pt-BR' });

    expect(screen.getByText('1.234 online')).toBeInTheDocument();
  });

  it('exposes the connection state through the accessible name, not a second badge', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 4, react: vi.fn() });
    await renderWithI18n(<LiveIndicator />);

    expect(screen.getByRole('status', { name: /connected.*4 online/i })).toBeInTheDocument();
  });

  it('reflects reconnecting in the accessible name', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'reconnecting', count: 4, react: vi.fn() });
    await renderWithI18n(<LiveIndicator />);

    expect(screen.getByRole('status', { name: /reconnecting.*4 online/i })).toBeInTheDocument();
  });

  it('reflects offline in the accessible name', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'offline', count: 0, react: vi.fn() });
    await renderWithI18n(<LiveIndicator />);

    expect(screen.getByRole('status', { name: /offline.*0 online/i })).toBeInTheDocument();
  });

  it('renders the pt-BR connected label in the accessible name', async () => {
    usePulseHubMock.mockReturnValue({ connection: 'connected', count: 4, react: vi.fn() });
    await renderWithI18n(<LiveIndicator />, { locale: 'pt-BR' });

    expect(screen.getByRole('status', { name: /conectado.*4 online/i })).toBeInTheDocument();
  });
});
