import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Lets one selection through per visit to a screen: a double tap, or a tap plus a sloppy sweep, must
 * not navigate twice. Coming back to the screen (focus) allows the next selection.
 */
export function useOnceUntilFocus(): { claim(): boolean; release(): void } {
  const taken = useRef(false);
  useFocusEffect(
    useCallback(() => {
      taken.current = false;
    }, []),
  );
  return {
    claim: () => {
      if (taken.current) return false;
      taken.current = true;
      return true;
    },
    release: () => {
      taken.current = false;
    },
  };
}
