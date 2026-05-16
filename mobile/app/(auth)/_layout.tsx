import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../../src/AuthContext';

export default function AuthLayout() {
  const { token, loading } = useAuth();

  useEffect(() => {
    if (!loading && token) router.replace('/(tabs)');
  }, [token, loading]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
