import { useEffect, useRef, useState } from 'react';

const POLL_MS = 250;
const left = (endsAt: number) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

/**
 * Whole seconds until endsAt (a wall-clock time), or null when there is nothing to count. It reads the clock rather
 * than counting ticks, so a rest that ran out while the phone was locked ends as soon as the app looks again.
 * onEnd fires once per endsAt.
 */
export function useRemaining(endsAt: number | null, onEnd: () => void): number | null {
  const [seen, setSeen] = useState<{ endsAt: number; n: number } | null>(null);
  const end = useRef(onEnd);
  end.current = onEnd;

  useEffect(() => {
    if (endsAt === null) return;
    let ended = false;
    const check = () => {
      const n = left(endsAt);
      setSeen({ endsAt, n });
      if (n === 0 && !ended) {
        ended = true;
        clearInterval(id);
        end.current();
      }
    };
    const id = setInterval(check, POLL_MS);
    check();
    return () => clearInterval(id);
  }, [endsAt]);

  if (endsAt === null) return null;
  // Until the effect has polled this endsAt, read the clock directly so a new rest never shows the old one's time.
  return seen?.endsAt === endsAt ? seen.n : left(endsAt);
}
