import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { WorkoutFormValues } from '@/components/ui/calendar/workoutformscreen';

// ─── Types (dari workoutStore lama) ──────────────────────────────────────────
export type TrackingResult = {
  actualDistance: number;
  actualDuration: number;
  actualPace: string;
  completedAt: number;
  repResults?: any[];
  phaseResults?: any;
};

export type SavedWorkout = WorkoutFormValues & {
  uid: string;
  status: 'planned' | 'completed';
  trackingResult?: TrackingResult;
};

// ─── Helper ───────────────────────────────────────────────────────────────────
export const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ─── Store ────────────────────────────────────────────────────────────────────
type SupabaseWorkoutStore = {
  workoutsByDate: Record<string, SavedWorkout[]>;
  selectedDate: Date;
  isLoading: boolean;
  setSelectedDate: (date: Date) => void;
  fetchWorkouts: () => Promise<void>;
  addWorkout: (dateKey: string, data: WorkoutFormValues) => Promise<void>;
  updateWorkout: (dateKey: string, uid: string, data: WorkoutFormValues) => Promise<void>;
  deleteWorkout: (dateKey: string, uid: string) => Promise<void>;
  saveTrackingResult: (dateKey: string, uid: string, result: TrackingResult) => Promise<void>;
  getWorkoutsByDate: (dateKey: string) => SavedWorkout[];
  getWorkoutDates: () => string[];
  clearGeneratedWorkouts: () => Promise<void>;
};

export const useWorkoutStore = create<SupabaseWorkoutStore>((set, get) => ({
  workoutsByDate: {},
  selectedDate: new Date(),
  isLoading: false,

  // ✅ setSelectedDate — dipakai WeekCalendar
  setSelectedDate: (date) => set({ selectedDate: date }),

  // Ambil semua workout dari Supabase
  fetchWorkouts: async () => {
    set({ isLoading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ isLoading: false }); return; }

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) { console.error(error); set({ isLoading: false }); return; }

    const byDate: Record<string, SavedWorkout[]> = {};
    for (const row of data ?? []) {
      const workout: SavedWorkout = {
        ...row.data,
        uid: row.uid,
        status: row.status,
        trackingResult: row.tracking_result,
      };
      if (!byDate[row.date_key]) byDate[row.date_key] = [];
      byDate[row.date_key].push(workout);
    }

    set({ workoutsByDate: byDate, isLoading: false });
  },

  addWorkout: async (dateKey, data) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const uid = `${Date.now()}-${Math.random()}`;
    const newWorkout: SavedWorkout = { ...data, uid, status: 'planned' };

    const { error } = await supabase.from('workouts').insert({
      user_id: user.id,
      date_key: dateKey,
      uid,
      workout_type: data.workoutType,
      workout_name: data.workoutName,
      status: 'planned',
      data: data,
    });

    if (error) { console.error(error); return; }

    set((state) => ({
      workoutsByDate: {
        ...state.workoutsByDate,
        [dateKey]: [...(state.workoutsByDate[dateKey] ?? []), newWorkout],
      },
    }));
  },

  updateWorkout: async (dateKey, uid, data) => {
    const { error } = await supabase
      .from('workouts')
      .update({ data, workout_name: data.workoutName })
      .eq('uid', uid);

    if (error) { console.error(error); return; }

    set((state) => ({
      workoutsByDate: {
        ...state.workoutsByDate,
        [dateKey]: (state.workoutsByDate[dateKey] ?? []).map((w) =>
          w.uid === uid ? { ...w, ...data, uid, status: w.status } : w
        ),
      },
    }));
  },

  deleteWorkout: async (dateKey, uid) => {
    const { error } = await supabase.from('workouts').delete().eq('uid', uid);
    if (error) { console.error(error); return; }

    set((state) => ({
      workoutsByDate: {
        ...state.workoutsByDate,
        [dateKey]: (state.workoutsByDate[dateKey] ?? []).filter((w) => w.uid !== uid),
      },
    }));
  },

  saveTrackingResult: async (dateKey, uid, result) => {
    const { error } = await supabase
      .from('workouts')
      .update({ tracking_result: result, status: 'completed' })
      .eq('uid', uid);

    if (error) { console.error(error); return; }

    set((state) => ({
      workoutsByDate: {
        ...state.workoutsByDate,
        [dateKey]: (state.workoutsByDate[dateKey] ?? []).map((w) =>
          w.uid === uid ? { ...w, trackingResult: result, status: 'completed' } : w
        ),
      },
    }));
  },

  getWorkoutsByDate: (dateKey) => get().workoutsByDate[dateKey] ?? [],

  getWorkoutDates: () =>
    Object.keys(get().workoutsByDate).filter(
      (key) => get().workoutsByDate[key].length > 0
    ),

  clearGeneratedWorkouts: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Hapus dari Supabase yang memiliki isGenerated: true di dalam kolom JSONB 'data'
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('user_id', user.id)
      .eq('data->isGenerated', true);

    if (error) {
      console.error('Error clearing generated workouts:', error);
      return;
    }

    // 2. Update state lokal (filter hanya yang bukan hasil generate)
    set((state) => {
      const next = { ...state.workoutsByDate };
      Object.keys(next).forEach((key) => {
        // Filter: Hanya simpan yang isGenerated-nya TIDAK bernilai true
        next[key] = next[key].filter((w) => w.isGenerated !== true);
        // Hapus key tanggal jika tidak ada lagi latihan di hari itu
        if (next[key].length === 0) delete next[key];
      });
      return { workoutsByDate: next };
    });
  },
}));