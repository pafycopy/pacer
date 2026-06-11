import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { supabase } from '@/lib/supabase';
import AssessmentFlow from '@/components/ui/assessment/assessmentflow';
import { useAssessmentStore } from '@/store/assessmentStore';

// Mencegah splash screen tertutup otomatis
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<any>(undefined);
  const { isCompleted } = useAssessmentStore();
  const [showAssessment, setShowAssessment] = useState(false);

  // ── Load Fonts ────────────────────────────────────────────────────────────
  const [fontsLoaded, fontError] = useFonts({
  'Lexend-Bold': require('../assets/font/static/Lexend-Bold.ttf'),
  'Lexend-Regular': require('../assets/font/static/Lexend-Regular.ttf'),
  'Lexend-Black': require('../assets/font/static/Lexend-Black.ttf'),
});

  // ── Cek session ───────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Handle deep link OAuth callback ──────────────────────────────────────
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
  if (url.includes('code=')) {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (data?.session) {
        setSession(data.session);
        router.replace('/(tabs)/dashboard'); // ← tambahkan ini
      }
    }
  } else if (url.includes('access_token=')) {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      setSession(data.session);
      router.replace('/(tabs)/dashboard'); // ← tambahkan ini
    }
  } else {
    // URL kosong / tidak dikenal (brecise:///) — cek session yang mungkin sudah ada
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      router.replace('/(tabs)/dashboard');
    } else {
      router.replace('/auth');
    }
  }
};

    const subscription = Linking.addEventListener('url', handleUrl);

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => subscription.remove();
  }, []);

  // ── Hide Splash Screen ───────────────────────────────────────────────────
  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Sembunyikan splash screen setelah font selesai dimuat atau jika ada error
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // ── Routing ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (session === undefined) return;

    const inAuthGroup = (segments as string[]).includes('auth');

    if (!session && !inAuthGroup) {
      router.replace('/auth');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [session, segments]);

  // ── Assessment ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (session && !isCompleted) {
      const timer = setTimeout(() => setShowAssessment(true), 700);
      return () => clearTimeout(timer);
    }
  }, [session, isCompleted]);

  // Jangan render apa-apa jika font belum siap
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#E5E5E5' }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
        </Stack>
        <AssessmentFlow
          visible={showAssessment}
          onClose={() => setShowAssessment(false)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}