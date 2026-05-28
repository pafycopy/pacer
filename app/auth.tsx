import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) { Alert.alert('Isi email dan password'); return; }
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Login gagal', error.message);
      else router.replace('/(tabs)/dashboard');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) Alert.alert('Register gagal', error.message);
      else Alert.alert('Cek email kamu untuk verifikasi!');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>PACER</Text>
        <Text style={s.subtitle}>{isLogin ? 'Masuk ke akunmu' : 'Buat akun baru'}</Text>

        <TextInput
          style={s.input} placeholder="Email"
          value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none"
        />
        <TextInput
          style={s.input} placeholder="Password"
          value={password} onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={s.btn} onPress={handleAuth} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Loading...' : isLogin ? 'Masuk' : 'Daftar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={s.toggle}>
            {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 14 },
  title: { fontSize: 36, fontWeight: '900', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 8 },
  input: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    fontSize: 15, borderWidth: 1, borderColor: '#E8E8E8',
  },
  btn: {
    backgroundColor: '#111', borderRadius: 40,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  toggle: { color: '#888', textAlign: 'center', fontSize: 14, marginTop: 8 },
});