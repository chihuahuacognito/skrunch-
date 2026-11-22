import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A whole-second countdown. remaining is null when idle. onDone fires once when it reaches zero,
 * never after stop() or unmount.
 */
export function useCountdown(onDone: () => void): { remaining: number | null; start(seconds: number): void; stop(): void } {
  const [remaining, setRemaining] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const left = useRef(0);
  const done = useRef(onDone);
  done.current = onDone;

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRemaining(null);
  }, []);

  const start = useCallback((seconds: number) => {
    if (timer.current) clearInterval(timer.current);
    left.current = seconds;
    setRemaining(seconds);
    timer.current = setInterval(() => {
      left.current -= 1;
      if (left.current > 0) {
        setRemaining(left.current);
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
