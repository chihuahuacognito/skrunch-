import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';

/** Placeholder until the Home screen lands (redesign plan Task 7). */
export default function Home() {
  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.text}>Home</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg, padding: tokens.space.lg },
  text: { color: tokens.color.on, fontSize: tokens.font.size.title },
});
