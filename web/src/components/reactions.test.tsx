import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const usePulseHubMock = vi.fn();

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => usePulseHubMock(),
}));

const { Reactions } = await import('./reactions');

describe('Reactions', () => {
  it('renders exactly the 8 allow-listed emoji buttons and no free-text input', () => {
    const react = vi.fn();
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'connected', react });

    render(<Reactions />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(8);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('calls react() with the clicked emoji', async () => {
    const react = vi.fn();
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'connected', react });

    render(<Reactions />);

    screen.getByText('🔥').click();

    expect(react).toHaveBeenCalledWith('🔥');
    expect(react).toHaveBeenCalledTimes(1);
  });
});
