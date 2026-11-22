import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DbProvider } from '../store/DbContext';
import { migrate } from '../store/schema';
import { tokens } from '../theme/tokens';

/** Hands expo-sqlite's opened database to the app's DbProvider. */
function ExpoDb({ children }: { children: ReactNode }) {
  return <DbProvider db={useSQLiteContext()}>{children}</DbProvider>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName="workout.db" onInit={migrate}>
          <ExpoDb>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.color.bg } }} />
          </ExpoDb>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
