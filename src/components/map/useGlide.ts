import { useEffect, useRef, useState } from 'react';

import type { Px } from '@/data/mockTown';

import { lerpCamera, type Camera } from './camera';

/** Animation-frame loop that calls `step(t)` with t in 0..1 over `ms`, linear. Returns a canceller. */
function tween(ms: number, step: (t: number) => void): () => void {
  const start = Date.now();
  let raf = 0;
  const frame = () => {
    const t = Math.min(1, (Date.now() - start) / ms);
    step(t);
    if (t < 1) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

/**
 * Car dots glide between updates: linear, no bounce. `key` must change whenever any target moves
 * (it's cheaper than deep-comparing). When disabled, targets are returned as-is.
 */
export function useGlide(targets: Record<string, Px>, key: string, enabled: boolean, ms = 900): Record<string, Px> {
  const [shown, setShown] = useState<Record<string, Px>>(targets);
  const shownRef = useRef(targets);
  const targetsRef = useRef(targets);

  useEffect(() => {
    targetsRef.current = targets;
    if (!enabled) shownRef.current = targets;
  });

  useEffect(() => {
    if (!enabled) return;
    const to = targetsRef.current;
    const from = shownRef.current;
    return tween(ms, (t) => {
      const next: Record<string, Px> = {};
      for (const id in to) {
        const a = from[id] ?? to[id];
        const b = to[id];
        next[id] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      shownRef.current = next;
      setShown(next);
    });
  }, [key, enabled, ms]);

  if (!enabled) return targets;
  const out: Record<string, Px> = {};
  for (const id in targets) out[id] = shown[id] ?? targets[id];
  return out;
}

/**
 * Camera state with an animated `follow`. `setCamera` is for gestures / fitting (immediate).
 * `glideTo(target)` animates linearly over `ms`, or jumps when `animate` is false.
 */
export function useCameraState(initial: Camera | null) {
  const [camera, setCameraState] = useState<Camera | null>(initial);
  const camRef = useRef<Camera | null>(initial);
  const cancelRef = useRef<(() => void) | null>(null);

  const setCamera = (next: Camera | ((c: Camera) => Camera)) => {
    cancelRef.current?.();
    cancelRef.current = null;
    const value = typeof next === 'function' ? (camRef.current ? next(camRef.current) : null) : next;
    if (!value) return;
    camRef.current = value;
    setCameraState(value);
  };

  const glideTo = (target: Camera, animate: boolean, ms = 900) => {
    cancelRef.current?.();
    const from = camRef.current;
    if (!from || !animate) {
      camRef.current = target;
      setCameraState(target);
      return;
    }
    cancelRef.current = tween(ms, (t) => {
      const c = lerpCamera(from, target, t);
      camRef.current = c;
      setCameraState(c);
    });
  };

  useEffect(() => () => cancelRef.current?.(), []);

  return { camera, setCamera, glideTo, camRef };
}
