import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

const SUPABASE_URL     = 'https://edbesyritkmfadbstswd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkYmVzeXJpdGttZmFkYnN0c3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTY2NDEsImV4cCI6MjA5NTI3MjY0MX0.Gy-tBr87oRzx1kDnQkRsNSg1C76vpkR2n4YnIe-iWjs';

// Diperlukan agar browser OAuth bisa menutup diri sendiri setelah redirect
WebBrowser.maybeCompleteAuthSession();

const ExpoSecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:           ExpoSecureStoreAdapter,
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl: false,
  },
});