import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/supabaseWorkoutStore';

// ── Tipe Activity untuk RecentActivityCard ───────────────────────────────
export type Activity = {
  id: string;
  workoutType: string;
  type: string;
  label: string;
  stat: string;
  statSub?: string;
};

// ── Helper format tanggal ─────────────────────────────────────────────────
const formatLabel = (dateKey: string): string => {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hari ini';
  if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

// ── Tips harian — rotasi setiap hari ─────────────────────────────────────
// topicId sesuai educationData:
// 1 = Teknik Berlari, 2 = Pencegahan Cedera, 3 = Pemanasan & Pendinginan, 4 = Latihan Kekuatan
const TIPS = [
  { id: 1, topicId: 3, title: 'High Knees', icon: 'walk', iconBg: '#DDFFE2',
    description: 'Mengaktifkan otot fleksor pinggul dan bokong, serta melatih postur angkatan kaki yang ideal saat berlari.' },
  { id: 2, topicId: 3, title: 'Butt Kicks', icon: 'body', iconBg: '#E2F0FF',
    description: 'Melatih otot hamstring dan meningkatkan frekuensi langkah kaki agar lebih efisien saat berlari.' },
  { id: 3, topicId: 3, title: 'Leg Swings', icon: 'sync', iconBg: '#E2F4FF',
    description: 'Memanaskan sendi pinggul dan meningkatkan range of motion sebelum lari jarak jauh.' },
  { id: 4, topicId: 3, title: 'Walking Lunges', icon: 'walk', iconBg: '#FFF2E2',
    description: 'Mengaktifkan otot paha dan bokong sebagai persiapan sebelum lari agar lebih bertenaga.' },
  { id: 5, topicId: 3, title: 'Arm Swing', icon: 'arrow-up', iconBg: '#FFEAE2',
    description: 'Ayunan lengan yang benar membantu menjaga keseimbangan dan efisiensi energi saat berlari.' },
  { id: 6, topicId: 1, title: 'Postur Tubuh', icon: 'body', iconBg: '#DDFFE2',
    description: 'Jaga tubuh tegak dengan bahu rileks. Condongkan tubuh sedikit ke depan dari pergelangan kaki.' },
  { id: 7, topicId: 2, title: 'Cegah Shin Splints', icon: 'fitness', iconBg: '#FFE8E8',
    description: 'Tingkatkan volume lari secara bertahap maksimal 10% per minggu untuk mencegah shin splints.' },
  { id: 8, topicId: 4, title: 'Core Stability', icon: 'accessibility', iconBg: '#F2E2FF',
    description: 'Core yang kuat menjaga postur lari tetap stabil dan mengurangi risiko cedera punggung bawah.' },
];

// ── Helper hitung awal minggu (Senin) ────────────────────────────────────
const getWeekStart = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const getMonthStart = (): Date => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const getYearStart = (): Date => new Date(new Date().getFullYear(), 0, 1);

// ─────────────────────────────────────────────────────────────────────────
export const useDashboardStats = () => {
  const { workoutsByDate } = useWorkoutStore();

  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart  = getWeekStart();
    const monthStart = getMonthStart();
    const yearStart  = getYearStart();

    // ── Akumulasi stats ───────────────────────────────────────────────────
    const dataByPeriod = {
      hari:   { workout: 0, distance: 0 },
      minggu: { workout: 0, distance: 0 },
      bulan:  { workout: 0, distance: 0 },
      tahun:  { workout: 0, distance: 0 },
    };

    let totalPlannedWeek = 0;
    let completedWeek = 0;

    const recentActivities: Activity[] = [];

    Object.entries(workoutsByDate).forEach(([dateKey, workouts]) => {
      const date = new Date(dateKey);
      date.setHours(0, 0, 0, 0);

      const isToday  = date.getTime() === today.getTime();
      const isWeek   = date >= weekStart;
      const isMonth  = date >= monthStart;
      const isYear   = date >= yearStart;

      workouts.forEach((w) => {
        // Planned minggu ini (untuk weekly plan)
        if (isWeek) {
          totalPlannedWeek += 1;
          if (w.status === 'completed') completedWeek += 1;
        }

        if (w.status !== 'completed') return;

        const dist = w.trackingResult?.actualDistance ?? 0;

        if (isToday)  { dataByPeriod.hari.workout++;   dataByPeriod.hari.distance += dist; }
        if (isWeek)   { dataByPeriod.minggu.workout++;  dataByPeriod.minggu.distance += dist; }
        if (isMonth)  { dataByPeriod.bulan.workout++;   dataByPeriod.bulan.distance += dist; }
        if (isYear)   { dataByPeriod.tahun.workout++;   dataByPeriod.tahun.distance += dist; }

        // Recent activities
        const isStrength = w.workoutType === 'Strength Training';
        const exerciseCount = w.selectedExercises?.length ?? 0;
        const totalSets = w.selectedExercises?.reduce((acc, ex) => acc + (ex.sets?.length ?? 0), 0) ?? 0;

        const stat = isStrength
          ? `${exerciseCount} exercise`
          : dist > 0 ? `${dist.toFixed(1)} km` : '-';

        const statSub = isStrength
          ? `${totalSets} sets`
          : w.trackingResult?.actualPace
          ? `${w.trackingResult.actualPace}/km`
          : undefined;

        recentActivities.push({
          id: w.uid,
          workoutType: w.workoutType,
          type: w.workoutName,
          label: formatLabel(dateKey),
          stat,
          statSub,
        });
      });
    });

    // Bulatkan jarak
    Object.keys(dataByPeriod).forEach((k) => {
      const key = k as keyof typeof dataByPeriod;
      dataByPeriod[key].distance = Math.round(dataByPeriod[key].distance * 10) / 10;
    });

    // Urutkan terbaru, ambil 5
    recentActivities.sort((a, b) => b.id.localeCompare(a.id));
    const displayed = recentActivities.slice(0, 5);

    // ── Konsistensi ───────────────────────────────────────────────────────
    const consistencyPercent = totalPlannedWeek > 0
      ? Math.round((completedWeek / totalPlannedWeek) * 100)
      : 0;

    const consistencyMsg =
      consistencyPercent >= 80 ? `Kamu sudah ${consistencyPercent}% konsisten minggu ini! Pertahankan ritmenya.`
      : consistencyPercent >= 50 ? `Kamu ${consistencyPercent}% konsisten minggu ini. Ayo tingkatkan!`
      : 'Mulai rencanakan latihan minggu ini untuk membangun konsistensi.';

    // ── Weekly plan ───────────────────────────────────────────────────────
    const weekNum = Math.ceil((today.getDate()) / 7);
    const currentWeek = Math.min(weekNum, 4);

    // ── Weekly label ─────────────────────────────────────────────────────
    const weeklyLabel =
      dataByPeriod.minggu.workout >= 5 ? 'Luar Biasa! 🔥'
      : dataByPeriod.minggu.workout >= 3 ? 'Bagus!'
      : dataByPeriod.minggu.workout >= 1 ? 'Mulai Bagus'
      : 'Ayo Mulai';

    // ── Tips hari ini (rotasi harian) ─────────────────────────────────────
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const tip = TIPS[dayOfYear % TIPS.length];

    return {
      dataByPeriod,
      consistencyPercent,
      consistencyMsg,
      completedSessions: completedWeek,
      totalSessions: Math.max(totalPlannedWeek, 1),
      currentWeek,
      recentActivities: displayed,
      weeklyLabel,
      tip,
    };
  }, [workoutsByDate]);
};