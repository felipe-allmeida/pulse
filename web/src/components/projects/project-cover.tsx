import type { Project } from '@/content/projects';

export interface ProjectCoverProps {
  project: Project;
  /** Ambient signal accent for the featured project's slot. */
  glow?: boolean;
  className?: string;
}

/** Node counts that read as a diagram rather than a texture. */
const MIN_NODES = 3;
const MAX_NODES = 6;

/**
 * A generated cover for a project that has no screenshot — drawn from the
 * project's own content rather than invented: one node per architecture step,
 * falling back to its tech count, connected left to right the way the
 * case-study flow connects them.
 *
 * It exists because most of these projects cannot be screenshotted. Two are
 * private client systems with no public instance, one is an internal tool from
 * 2020 whose repository contains no UI at all, and one belongs to a former
 * employer whose front end the author did not build. A mockup of any of them
 * would be a picture of something that does not exist; this is openly a
 * diagram, so it claims nothing.
 *
 * Deterministic: the same project always draws the same cover, because the
 * only input is its content. No randomness, no animation, no image asset.
 *
 * The project's name is carried by `aria-label` and never drawn — the card
 * prints it directly underneath, and a cover repeating it would put the same
 * words on screen twice.
 */
export function ProjectCover({ project, glow = false, className }: ProjectCoverProps) {
  const steps = project.detail?.architecture?.steps.length ?? project.tech.length;
  const nodes = Math.min(Math.max(steps, MIN_NODES), MAX_NODES);
  const gap = 100 / (nodes - 1 + 2);

  return (
    <div
      role="img"
      aria-label={`${project.name} — generated diagram`}
      className={[
        'relative aspect-video w-full overflow-hidden rounded-xl border bg-signal-muted/10',
        glow ? 'border-signal/35' : 'border-signal/15',
        className ?? '',
      ].join(' ')}
    >
      <svg viewBox="0 0 100 56" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full">
        <g stroke="currentColor" className="text-signal/15" strokeWidth="0.15">
          {[14, 28, 42].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} />
          ))}
        </g>
        <g className="text-signal/35">
          <line
            x1={gap}
            y1="28"
            x2={100 - gap}
            y2="28"
            stroke="currentColor"
            strokeWidth="0.3"
            strokeDasharray="1.5 1.5"
          />
        </g>
        {Array.from({ length: nodes }, (_, index) => {
          const x = gap + (index * (100 - gap * 2)) / (nodes - 1);
          const last = index === nodes - 1;
          return (
            <g key={index} className={last ? 'text-signal' : 'text-signal/55'}>
              <rect
                x={x - 4.5}
                y={16}
                width="9"
                height="24"
                rx="2"
                fill="currentColor"
                fillOpacity={last ? 0.25 : 0.14}
                stroke="currentColor"
                strokeWidth="0.3"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
