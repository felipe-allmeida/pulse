import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

/**
 * The router's global error boundary — `defaultErrorComponent` in main.tsx.
 *
 * This is the screen of last resort: anything a route (or a component below
 * it) throws and nobody catches lands here, having already unmounted whatever
 * was on the page. TanStack's built-in version is an unstyled black-on-black
 * "Something went wrong!" with a "Show Error" toggle, in English, which is
 * what a visitor whose route chunk failed to download actually saw.
 *
 * It stays deliberately thin: no `AppShell`, no `Link`, no router hooks. The
 * most likely reason to be here at all is that a chunk did not arrive, and a
 * boundary that reaches for more of the app to render itself is a boundary
 * that can fail the same way twice. `location.reload()` for the same reason —
 * a client-side retry re-runs the import that already failed, while a reload
 * refetches the document and, with `no-cache` on it, whatever the current
 * build's assets now are.
 */
export function RouterErrorScreen() {
  const { t } = useTranslation('common');

  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground"
    >
      <p className="font-mono text-base">{t('common:error')}</p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        {t('common:retry')}
      </Button>
    </div>
  );
}
