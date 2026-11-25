import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { localToday } from '../platform/today';

// How often an open app checks whether the training day rolled over (04:00).
const POLL_MS = 60_000;

/**
 * The training day, re-read whenever the app returns to the foreground and once a minute while it is open.
 * Android keeps a daily app's process alive, so a screen left open last night must notice that it is a new day.
 */
export function useToday(): string {
  const [today, setToday] = useState(() => localToday());
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') setToday(localToday());
    });
    const poll = setInterval(() => setToday(localToday()), POLL_MS);
    return () => {
      sub.remove();
      clearInterval(poll);
    };
  }, []);
  return today;
}
