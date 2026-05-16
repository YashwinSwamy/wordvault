import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../../src/AuthContext';
import { colors } from '../../src/colors';

function TabIcon({ name, color }: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome name={name} size={22} color={color} />;
}

export default function TabLayout() {
  const { token, loading } = useAuth();

  useEffect(() => {
    if (!loading && !token) router.replace('/(auth)/login');
  }, [token, loading]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle:             { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle:             { backgroundColor: colors.surface },
        headerTintColor:         colors.text,
        headerTitleStyle:        { fontFamily: 'SpaceMono' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Collections',
          tabBarIcon: ({ color }) => <TabIcon name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}
