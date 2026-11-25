import type { ComponentType, ReactNode } from 'react';
import { renderRouter } from 'expo-router/testing-library';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TonightProvider } from '../features/tonight/TonightProvider';
import { DbProvider } from '../store/DbContext';
import type { SqlDb } from '../store/sql';

/** Renders app routes (by file name, e.g. { index, desk }) with a database, tonight's provider and the gesture root. */
export function renderApp(routes: Record<string, ComponentType>, { initialUrl = '/', db }: { initialUrl?: string; db: SqlDb }) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DbProvider db={db}><TonightProvider>{children}</TonightProvider></DbProvider>
    </GestureHandlerRootView>
  );
  return renderRouter(routes, { initialUrl, wrapper });
}
