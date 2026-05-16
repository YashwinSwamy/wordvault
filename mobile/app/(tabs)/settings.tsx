import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/AuthContext';
import { colors } from '../../src/colors';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <Text style={styles.value}>{user?.username ?? '—'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? '—'}</Text>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg, padding: 16 },
  card:        { backgroundColor: colors.surface, borderRadius: 10, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  label:       { color: colors.muted, fontSize: 11, letterSpacing: 0.8, marginBottom: 4 },
  value:       { color: colors.text, fontSize: 15 },
  signOutBtn:  { marginTop: 24, borderWidth: 1, borderColor: colors.error, borderRadius: 8, padding: 13, alignItems: 'center' },
  signOutText: { color: colors.error, fontWeight: '600', fontSize: 14 },
});
