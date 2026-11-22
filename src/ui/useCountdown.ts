import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A whole-second countdown. remaining is null when idle. onDone fires once when it reaches zero,
 * never after stop() or unmount. It counts against the clock (an end time), not ticks, so timers the
 * OS paused or delayed catch up instead of drifting.
 */
export function useCountdown(onDone: () => void): { remaining: number | null; start(seconds: number): void; stop(): void } {
  const [remaining, setRemaining] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const endsAt = useRef(0);
  const done = useRef(onDone);
  done.current = onDone;

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRemaining(null);
  }, []);

  const start = useCallback((seconds: number) => {
    if (timer.current) clearInterval(timer.current);
    endsAt.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    timer.current = setInterval(() => {
      const left = Math.ceil((endsAt.current - Date.now()) / 1000);
      if (left > 0) {
        setRemaining(left);
        return;
      }
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      setRemaining(null);
      done.current();
    }, 1000);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  return { remaining, start, stop };
}
