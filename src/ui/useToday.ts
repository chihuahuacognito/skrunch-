import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { localToday } from '../platform/today';

/**
 * The training day, re-read whenever the app returns to the foreground. Android keeps a daily app's
 * process alive, so a screen left open last night must notice that it is a new day.
 */
export function useToday(): string {
  const [today, setToday] = useState(() => localToday());
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') setToday(localToday());
    });
    return () => sub.remove();
  }, []);
  return today;
}
