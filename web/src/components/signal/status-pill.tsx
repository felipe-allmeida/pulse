import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pill } from '@/components/signal/pill';

export interface StatusPillProps {
  /** Optional trailing detail rendered after the localized status text (e.g. "open to Staff / Principal"). */
  detail?: ReactNode;
  className?: string;
}

/**
 * The aqua "● Available now" pill — a pulsing signal dot next to the
 * localized status text. Thin wrapper over the shared `Pill` shell (`dot`
 * mode), which owns the pulse/`data-motion`/`prefers-reduced-motion`
 * behavior.
 */
export function StatusPill({ detail, className }: StatusPillProps) {
  const { t } = useTranslation('contact');

  return (
    <Pill dot className={className}>
      {t('contact:statusOpen')}
      {detail ? <> · {detail}</> : null}
    </Pill>
  );
}
