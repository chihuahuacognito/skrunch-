import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';

/** Placeholder until the redesign plan builds this screen. */
export default function HistoryScreen() {
  return (
    <SafeAreaView testID="screen-history" style={styles.root}>
      <Text style={styles.title}>History</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg, padding: tokens.space.lg },
  title: { color: tokens.color.on, fontSize: tokens.font.size.title, fontWeight: '500' },
});
