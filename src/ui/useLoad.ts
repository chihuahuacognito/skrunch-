import { useEffect, useState, type DependencyList } from 'react';

/**
 * Runs an async load once per deps. undefined while loading; results that arrive after unmount or after
 * the deps changed are dropped. A failed load is rethrown during render, so it reaches an error boundary.
 */
export function useLoad<T>(load: () => Promise<T>, deps: DependencyList): T | undefined {
  const [state, setState] = useState<{ value: T } | { error: unknown } | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setState(undefined);
    load().then(
      value => {
        if (live) setState({ value });
      },
      error => {
        if (live) setState({ error });
      },
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  if (state && 'error' in state) throw state.error;
  return state?.value;
}
