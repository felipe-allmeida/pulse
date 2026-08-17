import { useEffect, useMemo, useRef } from 'react';
import { geoGraticule10, geoInterpolate, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { useVisitor, useVisits } from '@/lib/api';
import { byNewest, EMPTY_POINTS, isSameSpot, selectArcTargets, type Coordinates } from '@/lib/points';
import type { World } from '@/lib/world';
import { useWorld } from '@/hooks/use-world';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils';
import type { VisitPoint } from '@/types/pulse';

/** How many recent points to render as ambient glow dots. */
const MAX_POINTS = 40;
/** How many of the most recent *other* points get a sweeping arc to the origin. */
const ARC_COUNT = 3;
/** Slight overzoom past `fitSize` so the map fills a wide/short hero instead of letterboxing. */
const ZOOM = 1.25;

const HALO_PERIOD_MS = 2600;
const ARC_SWEEP_PERIOD_MS = 4200;

type Props = {
  className?: string;
};

type SizedProjection = { width: number; height: number; projection: GeoProjection };

/**
 * The ambient map used to hardcode `#3ae0c4` (the fixed dark-mode
 * `--color-signal`), which only reads at ~1.7:1 against a white surface —
 * effectively invisible once the hero stopped pinning `dark`. Canvas
 * `fillStyle`/`strokeStyle` can't take a live `var(--x)` reference the way
 * an SVG/CSS property can (no cascade to resolve against), so instead this
 * reads `--signal-strong`/`--foreground`'s *resolved* HSL triplet off
 * `documentElement` at draw time and builds an `hsl(...)` string from it —
 * re-read every frame, so it tracks the current theme automatically for the
 * animated case, and (see the `theme` dependency on the effect below) also
 * forces a redraw for the `prefers-reduced-motion` single-frame case.
 */
function readHslTriplet(varName: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || '170 73% 55%';
}

function withAlpha(hslTriplet: string, alpha: number): string {
  return `hsl(${hslTriplet} / ${alpha})`;
}

function buildProjection(world: World, width: number, height: number): GeoProjection {
  const projection = geoNaturalEarth1().fitSize([width, height], world);
  projection.scale(projection.scale() * ZOOM);
  return projection;
}

/** The theme-resolved colors a frame draws with — read fresh per frame, see `readHslTriplet`. */
type Palette = {
  /** `--signal-strong`'s resolved HSL triplet: the accent used for points/arcs/halos. */
  signal: string;
  /** `--foreground`'s resolved HSL triplet: tints the graticule/landmass so they stay visible on either surface. */
  foreground: string;
};

function drawGlowPoint(
  ctx: CanvasRenderingContext2D,
  projection: GeoProjection,
  point: Coordinates,
  isOrigin: boolean,
  time: number,
  palette: Palette,
) {
  const coords = projection([point.lon, point.lat]);
  if (!coords) return;
  const [x, y] = coords;

  if (isOrigin) {
    const phase = (time % HALO_PERIOD_MS) / HALO_PERIOD_MS;
    const haloRadius = 6 + phase * 16;
    const haloOpacity = 0.35 * (1 - phase);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(palette.signal, haloOpacity);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = withAlpha(palette.signal, 1);
  ctx.shadowBlur = isOrigin ? 12 : 5;
  ctx.beginPath();
  ctx.arc(x, y, isOrigin ? 3 : 1.6, 0, Math.PI * 2);
  ctx.fillStyle = withAlpha(palette.signal, isOrigin ? 0.9 : 0.5);
  ctx.fill();
  ctx.restore();
}

function drawArc(
  ctx: CanvasRenderingContext2D,
  projection: GeoProjection,
  origin: Coordinates,
  target: Coordinates,
  time: number,
  palette: Palette,
) {
  const interpolate = geoInterpolate([origin.lon, origin.lat], [target.lon, target.lat]);
  const STEPS = 40;

  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= STEPS; i++) {
    const [lon, lat] = interpolate(i / STEPS);
    const coords = projection([lon, lat]);
    if (!coords) continue;
    if (i === 0) ctx.moveTo(coords[0], coords[1]);
    else ctx.lineTo(coords[0], coords[1]);
  }
  ctx.strokeStyle = withAlpha(palette.signal, 0.12);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const phase = (time % ARC_SWEEP_PERIOD_MS) / ARC_SWEEP_PERIOD_MS;
  const [lon, lat] = interpolate(phase);
  const coords = projection([lon, lat]);
  if (!coords) return;
  ctx.save();
  ctx.shadowColor = withAlpha(palette.signal, 1);
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(coords[0], coords[1], 1.6, 0, Math.PI * 2);
  ctx.fillStyle = withAlpha(palette.signal, 0.8 * (1 - Math.abs(phase - 0.5) * 0.6));
  ctx.fill();
  ctx.restore();
}

function drawFrame(
  world: World,
  ctx: CanvasRenderingContext2D,
  projection: GeoProjection,
  points: VisitPoint[],
  origin: Coordinates | undefined,
  arcTargets: VisitPoint[],
  time: number,
  palette: Palette,
) {
  const path = geoPath(projection, ctx);

  // Graticule/landmass used to be a fixed white tint, drawn for a hero that
  // always committed to dark — now tinted from `--foreground` so they stay a
  // faint but visible line/fill on whichever surface the theme resolves to
  // (near-white lines on the dark surface, near-black on the light one).
  ctx.save();
  ctx.strokeStyle = withAlpha(palette.foreground, 0.08);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  path(geoGraticule10());
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = withAlpha(palette.foreground, 0.06);
  ctx.beginPath();
  path(world);
  ctx.fill();
  ctx.restore();

  if (origin) {
    for (const target of arcTargets) drawArc(ctx, projection, origin, target, time, palette);
  }

  for (const point of points) {
    // Anyone sharing the origin's city is already under the origin's own halo.
    if (origin && isSameSpot(point, origin)) continue;
    drawGlowPoint(ctx, projection, point, false, time, palette);
  }
  if (origin) drawGlowPoint(ctx, projection, origin, true, time, palette);
}

/**
 * Ambient, decorative live world-map background for the hero. Reuses the
 * same data source (`useVisits`) and projection approach (d3-geo
 * `geoNaturalEarth1` over the shared `world` topology) as `LiveMap` — dimmed
 * landmasses/graticule, glowing presence points, the viewer's own location
 * emphasized as the "you are here" origin with a pulsing halo, and a few
 * sweeping arcs from it to other recent points. A radial veil on top keeps
 * the overlay hero text at AA contrast.
 *
 * The origin comes from `/api/visitor` rather than from the newest point in
 * `useVisits`. That older shortcut was almost never actually the viewer: a
 * visit only reaches `/api/map` after the outbox -> RabbitMQ -> Worker ->
 * Postgres round trip, and the query refetches on a 10s interval, so on first
 * paint the highlighted dot was whoever came before. The hero copy points
 * straight at this dot and calls it the reader, so it has to be them.
 *
 * Purely decorative: `aria-hidden` + `pointer-events-none`. Honors
 * `prefers-reduced-motion` by drawing a single static frame instead of
 * running a `requestAnimationFrame` loop (`data-motion` reflects which mode
 * is active, for tests/inspection).
 */
export function HeroMap({ className }: Props) {
  const { data } = useVisits();
  const points = data ?? EMPTY_POINTS;
  const reducedMotion = useReducedMotion();
  // Not read directly — the effect below re-reads the CSS variables from
  // `documentElement` itself (the source of truth for the resolved color).
  // Subscribing here just makes `theme` a dependency, so the effect (and its
  // single static frame) re-runs on toggle even when reduced-motion means
  // there's no per-frame rAF loop that would otherwise pick up the change.
  const theme = useThemeStore((s) => s.theme);
  const world = useWorld();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectionRef = useRef<SizedProjection | null>(null);

  const recentPoints = useMemo(() => byNewest(points, MAX_POINTS), [points]);

  const { data: visitor } = useVisitor();
  const geo = visitor?.geo;
  // Undefined until geo resolves (or forever, if the deployment has no geo
  // database) — the map then simply draws no origin, no halo, and no arcs,
  // matching the hero line, which drops its "that dot is you" clause in
  // exactly the same case.
  const origin = useMemo<Coordinates | undefined>(
    () => (geo ? { lat: geo.lat, lon: geo.lon } : undefined),
    [geo],
  );
  const arcTargets = useMemo(() => selectArcTargets(recentPoints, origin, ARC_COUNT), [recentPoints, origin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !world) return;

    let disposed = false;
    let frameId: number | null = null;

    const render = (time: number) => {
      if (disposed) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const backingWidth = Math.round(width * dpr);
      const backingHeight = Math.round(height * dpr);
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const cached = projectionRef.current;
      const projection =
        cached && cached.width === width && cached.height === height
          ? cached.projection
          : buildProjection(world, width, height);
      projectionRef.current = { width, height, projection };

      const palette: Palette = {
        signal: readHslTriplet('--signal-strong'),
        foreground: readHslTriplet('--foreground'),
      };
      drawFrame(world, ctx, projection, recentPoints, origin, arcTargets, time, palette);
    };

    render(0);

    const handleResize = () => render(reducedMotion ? 0 : performance.now());
    window.addEventListener('resize', handleResize);

    if (!reducedMotion) {
      const loop = (time: number) => {
        render(time);
        frameId = requestAnimationFrame(loop);
      };
      frameId = requestAnimationFrame(loop);
    }

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [reducedMotion, recentPoints, origin, arcTargets, theme, world]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-motion={reducedMotion ? 'static' : 'animated'}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, hsl(var(--background)) 82%)',
        }}
      />
    </div>
  );
}
