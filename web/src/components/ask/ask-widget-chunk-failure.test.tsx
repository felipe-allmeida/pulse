import { screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { useAskWidgetStore } from '@/stores/ask-widget-store';

/*
  The panel's chunk never arrives. This is the deploy race, not a hypothetical:
  a visitor holds a tab open on build v1, v2 ships, they open the panel, and
  the v1-hashed chunk that `React.lazy` asks for is no longer on the server.

  Throwing from the factory is how Vitest makes `import('./ask-panel')` reject,
  which is exactly the shape of a failed chunk fetch.
*/
vi.mock('./ask-panel', () => {
  throw new Error('Failed to fetch dynamically imported module: /assets/ask-panel-v1hash.js');
});

import { AskWidget } from './ask-widget';

describe('AskWidget when the panel chunk fails to load', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    useAskWidgetStore.setState({ isOpen: false, pendingQuestion: null });
    // React logs every error that reaches a boundary. That is the boundary
    // working, not the test failing — silence it so the run stays readable.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('keeps the rest of the page rendered instead of taking it down', async () => {
    await renderWithI18n(
      <div>
        <p>the page itself</p>
        <AskWidget />
      </div>,
    );

    const trigger = screen.getByRole('button', { name: /ask about felipe/i });
    fireEvent.click(trigger);

    // Let the rejected import settle and React commit the boundary's fallback.
    await waitFor(() => expect(consoleError).toHaveBeenCalled());

    // The whole point: the failure is contained. Without a boundary around the
    // lazy panel this throw escapes to the router's global boundary, which
    // unmounts the entire route — measured against a real build, #root went
    // from 218,598 bytes to 377.
    expect(screen.getByText('the page itself')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ask about felipe/i })).toBeInTheDocument();
  });

  it('renders nothing in place of the panel, rather than an error of its own', async () => {
    await renderWithI18n(<AskWidget />);

    fireEvent.click(screen.getByRole('button', { name: /ask about felipe/i }));
    await waitFor(() => expect(consoleError).toHaveBeenCalled());

    // An optional widget that failed should be absent, not apologetic: no
    // panel, and no error text substituted for it.
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/ai assistant/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('does not re-throw when the widget is opened a second time', async () => {
    await renderWithI18n(<AskWidget />);
    const trigger = screen.getByRole('button', { name: /ask about felipe/i });

    fireEvent.click(trigger);
    await waitFor(() => expect(consoleError).toHaveBeenCalled());

    // `React.lazy` caches the rejection, so a second open replays the same
    // throw. The boundary has already latched, so the page must simply stay
    // where it is.
    fireEvent.click(trigger);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /ask about felipe/i })).toBeInTheDocument(),
    );
  });
});
