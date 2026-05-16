import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router, Link } from 'expo-router';
import { register } from '../../src/api';
import { useAuth } from '../../src/AuthContext';
import { colors } from '../../src/colors';
import { User } from '../../src/types';

export default function RegisterScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleRegister = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await register({ username, email, password });
      await signIn(res.data.token, res.data.user as User);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>WordVault</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={styles.buttonText}>Create account</Text>}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn} disabled>
          <Text style={styles.googleText}>Continue with Google (coming soon)</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Link href="/(auth)/login" style={styles.footerLink}>Login</Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: colors.bg },
  page:        { flexGrow: 1, justifyContent: 'center', padding: 28 },
  title:       { fontFamily: 'SpaceMono', fontSize: 28, color: colors.text, textAlign: 'center', marginBottom: 6 },
  subtitle:    { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 32 },
  input:       { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, color: colors.text, fontSize: 14, padding: 12, marginBottom: 12 },
  error:       { color: colors.error, fontSize: 12, marginBottom: 10 },
  button:      { backgroundColor: colors.accent, borderRadius: 8, padding: 13, alignItems: 'center', marginBottom: 20 },
  buttonText:  { color: colors.bg, fontWeight: '700', fontSize: 14 },
  divider:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: 12, marginHorizontal: 10 },
  googleBtn:   { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 24, opacity: 0.5 },
  googleText:  { color: colors.text, fontSize: 14 },
  footerText:  { color: colors.muted, fontSize: 13, textAlign: 'center' },
  footerLink:  { color: colors.accent },
});
