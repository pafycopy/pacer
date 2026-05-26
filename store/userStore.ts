import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserStore = {
  name: string;
  location: string;
  avatarUri: string | null;
  isPremium: boolean;
  setName: (name: string) => void;
  setLocation: (location: string) => void;
  setAvatarUri: (uri: string) => void;
  setPremium: (val: boolean) => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      name: 'Alex Johnson',
      location: 'Surakarta, Indonesia',
      avatarUri: null,
      isPremium: false,
      setName: (name) => set({ name }),
      setLocation: (location) => set({ location }),
      setAvatarUri: (uri) => set({ avatarUri: uri }),
      setPremium: (val) => set({ isPremium: val }),
    }),
    {
      name: 'pacer-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);