import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { useAskWidgetStore } from '@/stores/ask-widget-store';

/*
  The panel body — chat state, composer, `streamAsk` — is the weight (Task
  7). This shell is deliberately the opposite: it must stay eager, because
  the floating trigger has to exist at first paint (and in prerendered HTML
  for crawlers) with no chunk fetch in between. Only `AskPanel` is lazy.
*/
const AskPanel = lazy(() => import('./ask-panel').then((m) => ({ default: m.AskPanel })));

/**
 * Contains a failure to load (or render) the panel to the panel itself.
 *
 * Without this, `Suspense` handles the pending chunk but nothing handles a
 * *rejected* one, so the throw walks all the way out to the router's global
 * boundary and replaces the entire site with an error screen — measured: an
 * `#root` of 218,598 bytes on /pt became 377. That is a decorative widget
 * taking the page down, and `lazy` caches the rejection, so reopening does
 * nothing and only a reload recovers.
 *
 * `null` is the right fallback precisely because this is optional: the visitor
 * loses a chat panel they may not have wanted, and keeps the page they came
 * for. Nothing here is recoverable in place — the cached rejection means a
 * retry button would be a lie — so there is nothing to offer them either.
 */
class AskPanelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function AskWidget() {
  const { t } = useTranslation('ask');
  const isOpen = useAskWidgetStore((s) => s.isOpen);
  const setOpen = useAskWidgetStore((s) => s.setOpen);
  const pendingQuestion = useAskWidgetStore((s) => s.pendingQuestion);

  // Fetch the panel's chunk on first open — by the trigger below, or by a
  // suggestion chip elsewhere in the tree setting `isOpen`/`pendingQuestion`
  // on the shared store — rather than unconditionally at mount (that would
  // give back most of the weight this split exists to save). `hasOpened` is
  // sticky: once true it never goes back to false, so a later close doesn't
  // unmount `AskPanel` out from under Radix. Radix's own open/closed state
  // then drives the slide-out animation the normal way instead of the panel
  // being ripped out of the DOM mid-transition.
  const [hasOpened, setHasOpened] = useState(isOpen || pendingQuestion !== null);
  useEffect(() => {
    if (isOpen || pendingQuestion) setHasOpened(true);
  }, [isOpen, pendingQuestion]);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {/*
          Compact on phones: with the full label this trigger was 252px wide on
          a 375px viewport (67% of the screen) and sat on top of page content,
          at 40px tall — under the 44px touch target. Below `sm` it collapses
          to a 48px circular icon button (label still announced via
          aria-label); from `sm` up the label comes back.
        */}
        <Button
          size="lg"
          aria-label={t('ask:trigger')}
          className="fixed right-6 bottom-6 z-50 size-12 rounded-full border border-signal/40 bg-signal p-0 font-mono text-signal-foreground shadow-[0_0_24px_-6px_var(--color-signal)] hover:bg-signal/90 sm:h-12 sm:w-auto sm:px-6"
        >
          <MessageCircle />
          <span className="hidden sm:inline">{t('ask:trigger')}</span>
        </Button>
      </SheetTrigger>
      {hasOpened && (
        <AskPanelBoundary>
          <Suspense fallback={null}>
            <AskPanel />
          </Suspense>
        </AskPanelBoundary>
      )}
    </Sheet>
  );
}
