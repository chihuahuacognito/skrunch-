import type { ComponentType, ReactNode } from 'react';
import { renderRouter } from 'expo-router/testing-library';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DbProvider } from '../store/DbContext';
import type { SqlDb } from '../store/sql';

/** Renders app routes (by file name, e.g. { index, menu }) with a database and the gesture root. */
export function renderApp(routes: Record<string, ComponentType>, { initialUrl = '/', db }: { initialUrl?: string; db: SqlDb }) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DbProvider db={db}>{children}</DbProvider>
    </GestureHandlerRootView>
  );
  return renderRouter(routes, { initialUrl, wrapper });
}
