'use client';

import { useEffect, useRef } from 'react';

import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { cn, prefersReducedMotion } from '@/lib/utils';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  /** Phase offset so the twinkle never pulses in unison. */
  phase: number;
};

type ParticleFieldProps = {
  count?: number;
  className?: string;
  color?: string;
};

/**
 * Maximum backing-store scale.
 *
 * Deliberately below the display's DPR. This canvas draws nothing but soft,
 * out-of-focus dust — there is no edge for the extra resolution to sharpen —
 * and the buffer is cleared in full every frame, so its area is a fixed
 * per-frame cost. At DPR 2 a full-viewport field clears roughly eight million
 * pixels per frame; at 1.5 that is a little under half as many, for no visible
 * difference in the motes themselves.
 */
const MAX_DPR = 1.5;

/** Edge length of the cached mote sprite, in CSS pixels. */
const SPRITE_SIZE = 24;

/**
 * Pre-render one mote to an offscreen canvas.
 *
 * Drawn once and then blitted, so the per-frame loop never constructs an arc
 * path or allocates an `rgba(...)` string — with 54 motes at 60fps that was
 * over three thousand short-lived strings a second, all of it garbage.
 */
function createSprite(color: string, dpr: number) {
  const sprite = document.createElement('canvas');
  const size = Math.ceil(SPRITE_SIZE * dpr);
  sprite.width = size;
  sprite.height = size;

  const context = sprite.getContext('2d');
  if (!context) return null;

  const centre = size / 2;
  const gradient = context.createRadialGradient(centre, centre, 0, centre, centre, centre);
  gradient.addColorStop(0, `rgba(${color},1)`);
  gradient.addColorStop(0.45, `rgba(${color},0.55)`);
  gradient.addColorStop(1, `rgba(${color},0)`);

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  return sprite;
}

/**
 * Drifting dust motes on a canvas.
 *
 * Runs its own requestAnimationFrame loop (this is pure per-pixel work, not a
 * tween) and suspends it when the tab is hidden or the canvas scrolls out of
 * view, so an offscreen field costs nothing. Each mote is a cached sprite
 * blitted with drawImage rather than a freshly built arc path.
 */
export function ParticleField({ count = 46, className, color = '216,176,106' }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runningRef = useRef(false);
  const frameRef = useRef(0);

  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let sprite: HTMLCanvasElement | null = null;

    const seed = () => {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -0.06 - Math.random() * 0.22,
        radius: 0.5 + Math.random() * 1.6,
        alpha: 0.14 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * nextDpr);
      canvas.height = Math.floor(height * nextDpr);
      context.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);

      // The sprite only has to be rebuilt when the backing-store scale itself
      // changes — moving between displays, not merely resizing the window.
      if (nextDpr !== dpr || !sprite) {
        dpr = nextDpr;
        sprite = createSprite(color, dpr);
      }

      seed();
    };

    const render = (time: number) => {
      if (!runningRef.current) return;

      context.clearRect(0, 0, width, height);

      if (sprite) {
        for (const particle of particles) {
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Wrap rather than respawn: keeps density perfectly constant.
          if (particle.y < -8) {
            particle.y = height + 8;
            particle.x = Math.random() * width;
          }
          if (particle.x < -8) particle.x = width + 8;
          if (particle.x > width + 8) particle.x = -8;

          const twinkle = 0.62 + 0.38 * Math.sin(time * 0.0011 + particle.phase);

          // globalAlpha instead of a per-particle fillStyle string, and a blit
          // instead of an arc path. The sprite's own falloff supplies the soft
          // edge the arc used to get from being small.
          const diameter = particle.radius * 4;
          context.globalAlpha = particle.alpha * twinkle;
          context.drawImage(
            sprite,
            particle.x - diameter / 2,
            particle.y - diameter / 2,
            diameter,
            diameter,
          );
        }

        context.globalAlpha = 1;
      }

      frameRef.current = requestAnimationFrame(render);
    };

    const start = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      frameRef.current = requestAnimationFrame(render);
    };

    const stop = () => {
      runningRef.current = false;
      cancelAnimationFrame(frameRef.current);
    };

    resize();
    start();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Only animate while actually on screen.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    const handleVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [count, color]);

  // Belt-and-braces: guarantees the loop is dead if the component unmounts
  // between an effect scheduling and its cleanup.
  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  );
}
