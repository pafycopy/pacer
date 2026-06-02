import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

type Screen = 'splash' | 'register' | 'login';

export default function AuthScreen() {
  const router = useRouter();
  const { setName } = useUserStore();

  const [screen, setScreen] = useState<Screen>('splash');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── REGISTER ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!fullName.trim()) { Alert.alert('Nama tidak boleh kosong'); return; }
    if (!email.trim()) { Alert.alert('Email tidak boleh kosong'); return; }
    if (password.length < 6) { Alert.alert('Password minimal 6 karakter'); return; }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setName(fullName.trim());
      Alert.alert('Berhasil', 'Cek email kamu untuk verifikasi akun');
    } catch (err: any) {
      Alert.alert('Register gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN EMAIL ───────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password) { Alert.alert('Isi email dan password'); return; }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Login gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── GOOGLE LOGIN ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    try {
      setLoading(true);

      const redirectTo = Linking.createURL('/');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('OAuth URL tidak ditemukan');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        // Coba ambil code dari URL (PKCE flow)
        const urlObj = new URL(result.url);
        const code = urlObj.searchParams.get('code');

        if (code) {
          // ✅ exchangeCodeForSession — benar untuk Supabase JS v2
          const { data: sessionData, error: sessionError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (sessionError) throw sessionError;
          if (sessionData?.session) {
            router.replace('/(tabs)/dashboard');
          }
        } else {
          // Fallback: ambil session langsung
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            router.replace('/(tabs)/dashboard');
          }
        }
      }

    } catch (err: any) {
      Alert.alert('Google Login Error', err?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  // ── SPLASH SCREEN ─────────────────────────────────────────────────────────
  if (screen === 'splash') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.splashContainer}>

          {/* Logo */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>B</Text>
              <View style={styles.logoDumbbell}>
                <Ionicons name="barbell" size={22} color="#4ADE80" />
              </View>
            </View>
          </View>

          {/* Text */}
          <View style={styles.splashTextBlock}>
            <Text style={styles.splashTitle}>
              Pantau latihan lari{'\n'}
              dan progres{'\n'}
              kebugaran Anda
            </Text>
            <Text style={styles.splashSub}>
              Bangun kebiasaan sehat bersama Brecise
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.splashButtons}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => setScreen('register')}
            >
              <Text style={styles.btnPrimaryText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setScreen('login')}>
              <Text style={styles.splashLoginText}>
                Sudah Punya Akun?{' '}
                <Text style={styles.splashLoginBold}>Masuk</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    );
  }

  // ── FORM SCREEN (login / register) ───────────────────────────────────────
  const isRegister = screen === 'register';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* Back */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setScreen('splash')}
            >
              <Ionicons name="arrow-back" size={20} color="#111" />
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.formLogoWrapper}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>B</Text>
                <View style={styles.logoDumbbell}>
                  <Ionicons name="barbell" size={18} color="#4ADE80" />
                </View>
              </View>
              <Text style={styles.appName}>Brecise</Text>
            </View>

            {/* Fields */}
            <View style={styles.fields}>

              {/* Full Name — hanya register */}
              {isRegister && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="person-outline" size={18} color="#AAA" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="User"
                      placeholderTextColor="#CCC"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>
              )}

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color="#AAA" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#CCC"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color="#AAA" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#CCC"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18} color="#AAA"
                    />
                  </TouchableOpacity>
                </View>
              </View>

            </View>

            {/* Submit */}
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  {isRegister ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ATAU LOGIN MELALUI</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogle}
              disabled={loading}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Google</Text>
            </TouchableOpacity>

            {/* Switch */}
            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => setScreen(isRegister ? 'login' : 'register')}
            >
              <Text style={styles.switchText}>
                {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
                <Text style={styles.switchBold}>
                  {isRegister ? 'Masuk' : 'Daftar'}
                </Text>
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  // Splash
  splashContainer: {
    flex: 1, justifyContent: 'space-between',
    paddingHorizontal: 28, paddingTop: 60, paddingBottom: 48,
  },
  logoWrapper: { alignItems: 'center' },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  logoText: { fontSize: 44, fontWeight: '900', color: '#FFFFFF', lineHeight: 52 },
  logoDumbbell: {
    position: 'absolute', top: -8, right: -8,
    backgroundColor: '#111', borderRadius: 20, padding: 4,
  },
  splashTextBlock: { alignItems: 'center', gap: 10 },
  splashTitle: { fontSize: 28, fontWeight: '800', color: '#111', textAlign: 'center', lineHeight: 38 },
  splashSub: { fontSize: 14, color: '#888', textAlign: 'center' },
  splashButtons: { gap: 16, alignItems: 'center' },
  splashLoginText: { fontSize: 14, color: '#888' },
  splashLoginBold: { fontWeight: '800', color: '#111' },

  // Form
  formContainer: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  formLogoWrapper: { alignItems: 'center', gap: 10, marginBottom: 32 },
  appName: { fontSize: 20, fontWeight: '800', color: '#111' },
  fields: { gap: 16, marginBottom: 20 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#555', letterSpacing: 0.3 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F7F7', borderRadius: 12,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1.5, borderColor: '#EEEEEE',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111' },

  // Buttons
  btnPrimary: {
    backgroundColor: '#6BFF8F', borderRadius: 40,
    height: 54, width: '100%',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#111' },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEEEEE' },
  dividerText: { fontSize: 10, fontWeight: '700', color: '#BBB', letterSpacing: 0.5 },

  // Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 40, height: 54,
    borderWidth: 1.5, borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF', marginBottom: 24,
  },
  googleIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '600', color: '#111' },

  // Switch
  switchRow: { alignItems: 'center' },
  switchText: { fontSize: 14, color: '#888' },
  switchBold: { fontWeight: '800', color: '#111' },
});