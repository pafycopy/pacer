import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<any>(undefined); // undefined = belum dicek

  useEffect(() => {
    // Cek session saat app pertama buka
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listen perubahan auth (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // masih loading

    // Cast 'segments' menjadi string[] agar TypeScript mengizinkan pengecekan 'auth'
    const inAuthGroup = (segments as string[]).includes('auth');

    if (!session && !inAuthGroup) {
      router.replace('./auth');       // belum login → ke halaman auth
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/dashboard');     // sudah login → ke app
    }
  }, [session, segments]);

  return (
    <SafeAreaProvider>
       <SafeAreaView style={{ flex: 1, backgroundColor: '#E5E5E5' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
      </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}