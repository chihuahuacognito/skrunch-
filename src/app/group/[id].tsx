import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';

/** Placeholder until the muscle-group screen lands (redesign plan Task 8). */
export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView testID={`screen-group-${id}`} style={styles.root}>
      <Text style={styles.title}>{id}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg, padding: tokens.space.lg },
  title: { color: tokens.color.on, fontSize: tokens.font.size.title, fontWeight: '500' },
});
