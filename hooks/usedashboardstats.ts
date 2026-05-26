import { useMemo } from 'react';
import { useWorkoutStore, SavedWorkout, toDateKey } from '@/store/workoutStore';
import { educationData } from '@/constants/educationdata';

// ─── Helper: rentang tanggal ──────────────────────────────────────────────
const getDateRange = (period: 'hari' | 'minggu' | 'bulan' | 'tahun') => {
  const now   = new Date();
  const start = new Date(now);

  if (period === 'hari') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'minggu') {
    const day = now.getDay(); // 0=minggu
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'bulan') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
};

// ─── Helper: semua workout dalam rentang ─────────────────────────────────
const getWorkoutsInRange = (
  workoutsByDate: Record<string, SavedWorkout[]>,
  start: Date,
  end: Date
): SavedWorkout[] => {
  const result: SavedWorkout[] = [];
  Object.entries(workoutsByDate).forEach(([dateKey, workouts]) => {
    const d = new Date(dateKey);
    if (d >= start && d <= end) {
      result.push(...workouts);
    }
  });
  return result;
};

// ─── Helper: konsistensi minggu ini (%) ──────────────────────────────────
const calcConsistency = (
  workoutsByDate: Record<string, SavedWorkout[]>
): number => {
  // Hitung 4 minggu terakhir, berapa hari ada workout
  const totalDays = 28;
  let activeDays  = 0;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const workouts = workoutsByDate[key] ?? [];
    if (workouts.some((w) => w.status === 'completed')) activeDays++;
  }
  return Math.round((activeDays / totalDays) * 100);
};

// ─── Helper: minggu ke-berapa dalam bulan ────────────────────────────────
const getCurrentWeekOfMonth = (): number => {
  const now  = new Date();
  const day  = now.getDate();
  return Math.ceil(day / 7);
};

// ─── Helper: sesi completed minggu ini ───────────────────────────────────
const getWeekSessions = (workoutsByDate: Record<string, SavedWorkout[]>) => {
  const { start, end } = getDateRange('minggu');
  const workouts = getWorkoutsInRange(workoutsByDate, start, end);
  const completed = workouts.filter((w) => w.status === 'completed').length;
  const total     = workouts.length;
  return { completed, total };
};

// ─── Helper: format tanggal relatif ──────────────────────────────────────
const formatRelativeTime = (completedAt: number): string => {
  const now   = Date.now();
  const diffMs = now - completedAt;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMin / 60);
  const diffD   = Math.floor(diffH / 24);

  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffH   < 24) return `Hari ini, ${new Date(completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  if (diffD   === 1) return `Kemarin, ${new Date(completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  return new Date(completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

// ─── Helper: icon & warna per workout type ───────────────────────────────
const resolveWorkoutIcon = (workoutType: string): { icon: string; iconBg: string } => {
  switch (workoutType) {
    case 'Easy Run':          return { icon: 'walk',           iconBg: '#D9E2FF' };
    case 'Long Run':          return { icon: 'walk',           iconBg: '#DDFFE2' };
    case 'Tempo Run':         return { icon: 'speedometer',    iconBg: '#C8F5C8' };
    case 'Interval Run':      return { icon: 'timer',          iconBg: '#f3c0c0' };
    case 'Strength Training': return { icon: 'barbell',        iconBg: '#FFE5D6' };
    default:                  return { icon: 'fitness',        iconBg: '#F0F0F0' };
  }
};

// ─── Helper: stat utama per workout ──────────────────────────────────────
const resolveActivityStat = (w: SavedWorkout): { stat: string; statSub?: string } => {
  if (w.trackingResult) {
    const dist = w.trackingResult.actualDistance;
    const pace = w.trackingResult.actualPace;
    if (dist > 0) return { stat: `${dist.toFixed(2)} km`, statSub: pace !== '--' ? pace : undefined };
    const dur = w.trackingResult.actualDuration;
    if (dur > 0) {
      const m = Math.floor(dur / 60);
      const s = dur % 60;
      return { stat: `${m}:${String(s).padStart(2, '0')}` };
    }
  }
  return { stat: '-' };
};

// ─── Tips rotasi dari educationData (bawa topicId untuk navigasi) ────────
const getTipOfDay = () => {
  const allLessons = educationData.flatMap((topic) =>
    topic.lessons.map((lesson) => ({
      id:          lesson.id,
      topicId:     topic.id,   // ← untuk navigasi dari dashboard ke education
      title:       lesson.title,
      description: lesson.description,
      icon:        topic.icon,
      iconBg:      topic.color,
    }))
  );
  const idx = new Date().getDate() % allLessons.length;
  return allLessons[idx];
};

// ─── Main hook ────────────────────────────────────────────────────────────
export const useDashboardStats = () => {
  const { workoutsByDate } = useWorkoutStore();

  return useMemo(() => {
    // Stats per periode
    const periods = ['hari', 'minggu', 'bulan', 'tahun'] as const;
    const dataByPeriod = Object.fromEntries(
      periods.map((period) => {
        const { start, end } = getDateRange(period);
        const workouts       = getWorkoutsInRange(workoutsByDate, start, end);
        const completed      = workouts.filter((w) => w.status === 'completed');
        const totalDistance  = completed.reduce(
          (sum, w) => sum + (w.trackingResult?.actualDistance ?? 0), 0
        );
        return [period, {
          workout:  completed.length,
          distance: parseFloat(totalDistance.toFixed(2)),
        }];
      })
    ) as Record<typeof periods[number], { workout: number; distance: number }>;

    // Konsistensi
    const consistencyPercent = calcConsistency(workoutsByDate);

    // Sesi minggu ini
    const { completed: completedSessions, total: totalSessions } = getWeekSessions(workoutsByDate);

    // Aktivitas terakhir (max 5, hanya completed)
    const allCompleted = Object.entries(workoutsByDate)
      .flatMap(([, workouts]) => workouts)
      .filter((w) => w.status === 'completed' && w.trackingResult?.completedAt)
      .sort((a, b) => (b.trackingResult!.completedAt) - (a.trackingResult!.completedAt))
      .slice(0, 5);

    const recentActivities = allCompleted.map((w) => ({
      id:       w.uid,
      type:     w.workoutName || w.workoutType,
      label:    formatRelativeTime(w.trackingResult!.completedAt),
      ...resolveWorkoutIcon(w.workoutType),
      ...resolveActivityStat(w),
    }));

    // Pesan monitoring
    const consistencyMsg =
      consistencyPercent >= 80
        ? `Kamu sudah ${consistencyPercent}% konsisten bulan ini! Pertahankan ritmenya.`
        : consistencyPercent >= 50
        ? `Konsistensimu ${consistencyPercent}% bulan ini. Sedikit lagi untuk mencapai target!`
        : `Konsistensimu ${consistencyPercent}% bulan ini. Yuk mulai rutin berolahraga!`;

    // Weekly activity label
    const weeklyLabel =
      consistencyPercent >= 80 ? 'Bagus!' :
      consistencyPercent >= 50 ? 'Lumayan!' : 'Ayo semangat!';

    // Tip hari ini
    const tip = getTipOfDay();

    return {
      dataByPeriod,
      consistencyPercent,
      consistencyMsg,
      completedSessions,
      totalSessions: Math.max(totalSessions, 1),
      currentWeek: getCurrentWeekOfMonth(),
      recentActivities,
      weeklyLabel,
      tip,
    };
  }, [workoutsByDate]);
};