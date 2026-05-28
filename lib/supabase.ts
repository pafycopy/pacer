import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://edbesyritkmfadbstswd.supabase.co'; // ← ganti dengan URL kamu
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkYmVzeXJpdGttZmFkYnN0c3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTY2NDEsImV4cCI6MjA5NTI3MjY0MX0.Gy-tBr87oRzx1kDnQkRsNSg1C76vpkR2n4YnIe-iWjs';                  // ← ganti dengan anon key kamu

// SecureStore adapter — lebih aman dari AsyncStorage untuk token auth
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});