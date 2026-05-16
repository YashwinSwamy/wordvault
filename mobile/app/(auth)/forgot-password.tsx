import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { forgotPassword } from '../../src/api';
import { colors } from '../../src/colors';

export default function ForgotPasswordScreen() {
  const [email,   setEmail]   = useState('');
  const [message, setMessage] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await forgotPassword(email);
      setMessage('Check your email for a reset link.');
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
      <View style={styles.page}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>We'll send a reset link to your email.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {error   ? <Text style={styles.error}>{error}</Text>     : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={styles.buttonText}>Send reset link</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: colors.bg },
  page:       { flex: 1, justifyContent: 'center', padding: 28 },
  back:       { position: 'absolute', top: 60, left: 28 },
  backText:   { color: colors.muted, fontSize: 14 },
  title:      { fontFamily: 'SpaceMono', fontSize: 24, color: colors.text, marginBottom: 8 },
  subtitle:   { fontSize: 14, color: colors.muted, marginBottom: 28 },
  input:      { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, color: colors.text, fontSize: 14, padding: 12, marginBottom: 12 },
  error:      { color: colors.error, fontSize: 12, marginBottom: 10 },
  success:    { color: colors.success, fontSize: 12, marginBottom: 10 },
  button:     { backgroundColor: colors.accent, borderRadius: 8, padding: 13, alignItems: 'center' },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 14 },
});
