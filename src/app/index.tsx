import { StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Workout</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '600' },
});
