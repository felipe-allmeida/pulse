import { useEffect, useMemo, useRef } from 'react';
import { geoGraticule10, geoInterpolate, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { useVisits } from '@/lib/api';
import { byNewest, EMPTY_POINTS } from '@/lib/points';
import { world } from '@/lib/world';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import type { VisitPoint } from '@/types/pulse';

/** Single aqua "signal" accent — matches `--color-signal` in styles.css. */
const SIGNAL = '#3ae0c4';

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

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildProjection(width: number, height: number): GeoProjection {
  const projection = geoNaturalEarth1().fitSize([width, height], world);
  projection.scale(projection.scale() * ZOOM);
  return projection;
}

function drawGlowPoint(
  ctx: CanvasRenderingContext2D,
  projection: GeoProjection,
  point: VisitPoint,
  isOrigin: boolean,
  time: number,
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
    ctx.strokeStyle = withAlpha(SIGNAL, haloOpacity);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = SIGNAL;
  ctx.shadowBlur = isOrigin ? 12 : 5;
  ctx.beginPath();
  ctx.arc(x, y, isOrigin ? 3 : 1.6, 0, Math.PI * 2);
  ctx.fillStyle = withAlpha(SIGNAL, isOrigin ? 0.9 : 0.5);
  ctx.fill();
  ctx.restore();
}

function drawArc(
  ctx: CanvasRenderingContext2D,
  projection: GeoProjection,
  origin: VisitPoint,
  target: VisitPoint,
  time: number,
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
  ctx.strokeStyle = withAlpha(SIGNAL, 0.12);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const phase = (time % ARC_SWEEP_PERIOD_MS) / ARC_SWEEP_PERIOD_MS;
  const [lon, lat] = interpolate(phase);
  const coords = projection([lon, lat]);
  if (!coords) return;
  ctx.save();
  ctx.shadowColor = SIGNAL;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(coords[0], coords[1], 1.6, 0, Math.PI * 2);
  ctx.fillStyle = withAlpha(SIGNAL, 0.8 * (1 - Math.abs(phase - 0.5) * 0.6));
  ctx.fill();
  ctx.restore();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  projection: GeoProjection,
  points: VisitPoint[],
  origin: VisitPoint | undefined,
  arcTargets: VisitPoint[],
  time: number,
) {
  const path = geoPath(projection, ctx);

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  path(geoGraticule10());
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.beginPath();
  path(world);
  ctx.fill();
  ctx.restore();

  if (origin) {
    for (const target of arcTargets) drawArc(ctx, projection, origin, target, time);
  }

  for (const point of points) {
    if (point === origin) continue;
    drawGlowPoint(ctx, projection, point, false, time);
  }
  if (origin) drawGlowPoint(ctx, projection, origin, true, time);
}

/**
 * Ambient, decorative live world-map background for the hero. Reuses the
 * same data source (`useVisits`) and projection approach (d3-geo
 * `geoNaturalEarth1` over the shared `world` topology) as `LiveMap` — dimmed
 * landmasses/graticule, glowing presence points, the most recent visit
 * emphasized as the "you are here" origin with a pulsing halo, and a few
 * sweeping arcs from it to other recent points. A radial veil on top keeps
 * the overlay hero text at AA contrast.
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

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectionRef = useRef<SizedProjection | null>(null);

  const recentPoints = useMemo(() => byNewest(points, MAX_POINTS), [points]);
  const origin = recentPoints[0];
  const arcTargets = useMemo(() => recentPoints.slice(1, 1 + ARC_COUNT), [recentPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

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
          : buildProjection(width, height);
      projectionRef.current = { width, height, projection };

      drawFrame(ctx, projection, recentPoints, origin, arcTargets, time);
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
  }, [reducedMotion, recentPoints, origin, arcTargets]);

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
