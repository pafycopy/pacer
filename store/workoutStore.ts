import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutFormValues } from '@/components/ui/calendar/workoutformscreen';

export type PhaseResult = {
  actualDistance: number;
  actualDuration: number;
  actualPace: string;
};

export type RepResult = {
  rep: number;
  distance: number;
  duration: number;
  pace: string;
  hit: boolean;
};

export type TrackingResult = {
  actualDistance: number;
  actualDuration: number;
  actualPace: string;
  completedAt: number;
  phaseResults?: {
    warmup: PhaseResult;
    tempo: PhaseResult;
    cooldown: PhaseResult;
  };
  repResults?: RepResult[];
};

export type WorkoutStatus = 'planned' | 'completed';

export type SavedWorkout = WorkoutFormValues & {
  uid: string;
  status: WorkoutStatus;
  trackingResult?: TrackingResult;
  warmup?: { distance: string; pace: string };
  tempo?: { distance: string; targetPace: string; actualPace: string };
  cooldown?: { distance: string; pace: string };
  trainingCategory?: string;
  selectedExercises?: Array<{
    id: string;
    name: string;
    sets: Array<{ set: number; reps: string; kg?: string }>;
  }>;
};

type WorkoutStore = {
  workoutsByDate: Record<string, SavedWorkout[]>;
  selectedDate: string; // ← diubah dari Date ke string agar bisa disimpan
  setSelectedDate: (date: Date) => void;
  getSelectedDate: () => Date;
  addWorkout: (dateKey: string, data: WorkoutFormValues) => void;
  updateWorkout: (dateKey: string, uid: string, data: WorkoutFormValues) => void;
  deleteWorkout: (dateKey: string, uid: string) => void;
  saveTrackingResult: (dateKey: string, uid: string, result: TrackingResult) => void;
  getWorkoutsByDate: (dateKey: string) => SavedWorkout[];
  getWorkoutDates: () => string[];
};

export const useWorkoutStore = create<WorkoutStore>()(
  // ↓ Bungkus dengan persist — inilah satu-satunya perubahan utama
  persist(
    (set, get) => ({
      workoutsByDate: {},
      selectedDate: new Date().toISOString(), // simpan sebagai string ISO

      // Simpan sebagai string ISO supaya AsyncStorage bisa serialisasi
      setSelectedDate: (date: Date) =>
        set({ selectedDate: date.toISOString() }),

      // Kembalikan sebagai objek Date saat dipakai komponen
      getSelectedDate: () => new Date(get().selectedDate),

      addWorkout: (dateKey, data) => {
        const newWorkout: SavedWorkout = {
          ...data,
          uid: `${Date.now()}-${Math.random()}`,
          status: 'planned',
        };
        set((state) => ({
          workoutsByDate: {
            ...state.workoutsByDate,
            [dateKey]: [...(state.workoutsByDate[dateKey] ?? []), newWorkout],
          },
        }));
      },

      updateWorkout: (dateKey, uid, data) => {
        set((state) => ({
          workoutsByDate: {
            ...state.workoutsByDate,
            [dateKey]: (state.workoutsByDate[dateKey] ?? []).map((w) =>
              w.uid === uid ? { ...w, ...data, uid, status: w.status } : w
            ),
          },
        }));
      },

      deleteWorkout: (dateKey, uid) => {
        set((state) => ({
          workoutsByDate: {
            ...state.workoutsByDate,
            [dateKey]: (state.workoutsByDate[dateKey] ?? []).filter(
              (w) => w.uid !== uid
            ),
          },
        }));
      },

      saveTrackingResult: (dateKey, uid, result) => {
        set((state) => ({
          workoutsByDate: {
            ...state.workoutsByDate,
            [dateKey]: (state.workoutsByDate[dateKey] ?? []).map((w) =>
              w.uid === uid
                ? { ...w, trackingResult: result, status: 'completed' }
                : w
            ),
          },
        }));
      },

      getWorkoutsByDate: (dateKey) => get().workoutsByDate[dateKey] ?? [],

      getWorkoutDates: () =>
        Object.keys(get().workoutsByDate).filter(
          (key) => get().workoutsByDate[key].length > 0
        ),
    }),
    {
      name: 'pacer-workout-storage', // nama key di AsyncStorage HP
      storage: createJSONStorage(() => AsyncStorage),

      // Hanya simpan workoutsByDate ke storage — selectedDate tidak perlu
      partialize: (state) => ({ workoutsByDate: state.workoutsByDate }),
    }
  )
);

export const toDateKey = (date: Date): string =>
  date.toISOString().split('T')[0];