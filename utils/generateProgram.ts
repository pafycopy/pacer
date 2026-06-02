import { AssessmentData, InjuryHistory } from '@/store/assessmentStore';
import { WorkoutFormValues } from '@/components/ui/calendar/workoutformscreen';

// ─── Tipe workout per level ───────────────────────────────────────────────
type WorkoutType = 'Easy Run' | 'Long Run' | 'Tempo Run' | 'Interval Run' | 'Strength Training';

const WORKOUT_TYPES_BY_LEVEL: Record<string, WorkoutType[]> = {
  beginner:     ['Easy Run', 'Long Run', 'Strength Training'],
  intermediate: ['Easy Run', 'Long Run', 'Tempo Run', 'Strength Training'],
  advanced:     ['Easy Run', 'Long Run', 'Tempo Run', 'Interval Run', 'Strength Training'],
};

// ─── Base jarak per level (km) ────────────────────────────────────────────
const BASE_DISTANCE: Record<string, Record<WorkoutType, number>> = {
  beginner: {
    'Easy Run':          2.0,
    'Long Run':          3.0,
    'Tempo Run':         0,
    'Interval Run':      0,
    'Strength Training': 0,
  },
  intermediate: {
    'Easy Run':          3.0,
    'Long Run':          5.0,
    'Tempo Run':         3.0,
    'Interval Run':      0,
    'Strength Training': 0,
  },
  advanced: {
    'Easy Run':          5.0,
    'Long Run':          8.0,
    'Tempo Run':         5.0,
    'Interval Run':      1.0, // per rep
    'Strength Training': 0,
  },
};

// ─── Base pace per level (min/km desimal) ─────────────────────────────────
const BASE_PACE: Record<string, Record<WorkoutType, number>> = {
  beginner: {
    'Easy Run':          7.5,
    'Long Run':          8.0,
    'Tempo Run':         0,
    'Interval Run':      0,
    'Strength Training': 0,
  },
  intermediate: {
    'Easy Run':          6.5,
    'Long Run':          7.0,
    'Tempo Run':         5.5,
    'Interval Run':      0,
    'Strength Training': 0,
  },
  advanced: {
    'Easy Run':          5.5,
    'Long Run':          6.0,
    'Tempo Run':         4.5,
    'Interval Run':      4.0,
    'Strength Training': 0,
  },
};

// ─── Faktor injury ────────────────────────────────────────────────────────
// Kurangi jarak dan volume saat ada cedera
const INJURY_DISTANCE_FACTOR: Record<InjuryHistory, number> = {
  none:        1.0,
  knee:        0.7,
  ankle:       0.7,
  shin_splints: 0.6,
  other:       0.8,
};

// Workout yang dihindari saat cedera tertentu
const INJURY_AVOID: Record<InjuryHistory, WorkoutType[]> = {
  none:        [],
  knee:        ['Interval Run'],
  ankle:       ['Interval Run', 'Tempo Run'],
  shin_splints: ['Interval Run', 'Tempo Run', 'Long Run'],
  other:       [],
};

// ─── Progress mingguan (+10% per minggu) ──────────────────────────────────
const WEEKLY_PROGRESS = [1.0, 1.1, 1.2, 1.1]; // minggu 4 sedikit turun (deload)

// ─── Helper: format pace desimal → string "M:SS" ─────────────────────────
const formatPace = (pace: number): string => {
  const m = Math.floor(pace);
  const s = Math.round((pace - m) * 60);
  return `${m}.${String(s).padStart(2, '0')}`;
};

// ─── Helper: buat workout form values ────────────────────────────────────
const makeWorkout = (
  type: WorkoutType,
  weekNum: number,
  dayOfWeek: number,
  assessment: AssessmentData,
): WorkoutFormValues | null => {
  const { level, injury, activityLevel } = assessment;
  const weekFactor    = WEEKLY_PROGRESS[weekNum - 1];
  const injuryFactor  = INJURY_DISTANCE_FACTOR[injury];
  const activityBonus = activityLevel === 'very_active' ? 1.1 : activityLevel === 'sedentary' ? 0.9 : 1.0;

  // Cek apakah workout ini dihindari karena cedera
  if (INJURY_AVOID[injury].includes(type)) return null;

  const baseDistArr = BASE_DISTANCE[level];
  const basePaceArr = BASE_PACE[level];

  if (type === 'Strength Training') {
    const sets = level === 'beginner' ? 2 : level === 'intermediate' ? 3 : 4;
    const setsReduced = Math.max(1, Math.round(sets * injuryFactor));
    return {
      workoutType: 'Strength Training',
      workoutName: 'Strength Training',
      distance: '',
      pace: '',
      sets: String(setsReduced),
      reps: '10',
      restTime: '90',
      weight: '',
      duration: { hour: 0, min: 30, sec: 0 },
      notes: injury !== 'none' ? 'Program disesuaikan dengan kondisi fisik Anda.' : '',
      trainingCategory: level === 'beginner' ? 'Strength' : 'Strength',
      selectedExercises: [],
      isGenerated: true,
    };
  }

  if (type === 'Interval Run') {
    const dist    = parseFloat((baseDistArr[type] * weekFactor * injuryFactor * activityBonus).toFixed(2));
    const pace    = parseFloat((basePaceArr[type]).toFixed(2));
    const reps    = level === 'advanced' ? (weekNum <= 2 ? 4 : 6) : 3;
    const repsAdj = Math.max(1, Math.round(reps * injuryFactor));
    return {
      workoutType: 'Interval Run',
      workoutName: `Interval Run W${weekNum}`,
      distance: String(dist),
      pace:     formatPace(pace),
      sets:     String(repsAdj),
      reps:     String(repsAdj),
      restTime: '90',
      weight:   '',
      duration: { hour: 0, min: 0, sec: 0 },
      notes:    injury !== 'none' ? 'Program disesuaikan dengan kondisi fisik Anda.' : '',
      isGenerated: true,
    };
  }

  if (type === 'Tempo Run') {
    const warmupDist   = parseFloat((1.0 * weekFactor * injuryFactor).toFixed(2));
    const tempoDist    = parseFloat((baseDistArr[type] * weekFactor * injuryFactor * activityBonus).toFixed(2));
    const cooldownDist = parseFloat((1.0 * weekFactor * injuryFactor).toFixed(2));
    const warmupPace   = parseFloat((basePaceArr['Easy Run'] + 1).toFixed(2));
    const tempoPace    = parseFloat((basePaceArr[type]).toFixed(2));
    return {
      workoutType: 'Tempo Run',
      workoutName: `Tempo Run W${weekNum}`,
      distance: String(tempoDist),
      pace:     formatPace(tempoPace),
      sets:     '',
      reps:     '',
      restTime: '',
      weight:   '',
      duration: { hour: 0, min: 0, sec: 0 },
      notes:    injury !== 'none' ? 'Program disesuaikan dengan kondisi fisik Anda.' : '',
      warmup:   { distance: String(warmupDist),   pace: formatPace(warmupPace) },
      tempo:    { distance: String(tempoDist),     targetPace: formatPace(tempoPace), actualPace: '' },
      cooldown: { distance: String(cooldownDist),  pace: formatPace(warmupPace) },
      isGenerated: true,
    };
  }

  // Easy Run / Long Run
  const dist = parseFloat((baseDistArr[type] * weekFactor * injuryFactor * activityBonus).toFixed(2));
  const pace = parseFloat((basePaceArr[type]).toFixed(2));

  return {
    workoutType: type,
    workoutName: `${type} W${weekNum}`,
    distance:   String(dist),
    pace:       formatPace(pace),
    sets:       '',
    reps:       '',
    restTime:   '',
    weight:     '',
    duration:   { hour: 0, min: 0, sec: 0 },
    notes:      injury !== 'none' ? 'Program disesuaikan dengan kondisi fisik Anda.' : '',
    isGenerated: true,
  };
};

// ─── Main: generate program 4 minggu ─────────────────────────────────────
export type GeneratedDay = {
  dateKey:  string;   // 'YYYY-MM-DD'
  workout:  WorkoutFormValues;
};

export const generateProgram = (assessment: AssessmentData): GeneratedDay[] => {
  const { level, daysPerWeek } = assessment;
  const allowedTypes = WORKOUT_TYPES_BY_LEVEL[level].filter(
    (t) => !INJURY_AVOID[assessment.injury].includes(t as WorkoutType)
  ) as WorkoutType[];

  const results: GeneratedDay[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // mulai besok
  startDate.setHours(0, 0, 0, 0);

  // Hari latihan dalam seminggu (pilih hari yang tersebar merata)
  // Misalnya 3 hari → [1,3,5] (Senin, Rabu, Jumat)
  const trainingDaySlots = pickTrainingDays(daysPerWeek);

  for (let week = 1; week <= 4; week++) {
    // Rotasi tipe workout dalam seminggu
    const weekWorkouts = buildWeekWorkouts(allowedTypes, daysPerWeek, week);

    for (let slot = 0; slot < daysPerWeek; slot++) {
      const dayOfWeek = trainingDaySlots[slot]; // 0=Minggu ... 6=Sabtu

      // Hitung tanggal aktual
      const weekOffset = (week - 1) * 7;
      const date = new Date(startDate);

      // Cari hari pertama sesuai dayOfWeek dari startDate
      const startDow = startDate.getDay();
      let daysUntil = dayOfWeek - startDow;
      if (daysUntil < 0) daysUntil += 7;
      date.setDate(startDate.getDate() + weekOffset + daysUntil);

      const dateKey = date.toISOString().split('T')[0];
      const workoutType = weekWorkouts[slot];

      const workout = makeWorkout(workoutType, week, dayOfWeek, assessment);
      if (workout) {
        results.push({ dateKey, workout });
      }
    }
  }

  return results;
};

// ─── Helper: pilih hari latihan yang tersebar ─────────────────────────────
const pickTrainingDays = (count: number): number[] => {
  // Hari 1=Senin ... 6=Sabtu, 0=Minggu
  const allDays = [1, 3, 5, 2, 4, 6, 0]; // urutan prioritas
  return allDays.slice(0, count).sort((a, b) => a - b);
};

// ─── Helper: distribusi tipe workout dalam 1 minggu ───────────────────────
const buildWeekWorkouts = (
  types: WorkoutType[],
  count: number,
  week: number,
): WorkoutType[] => {
  const result: WorkoutType[] = [];

  // Selalu ada Strength di hari terakhir latihan
  const hasStrength = types.includes('Strength Training');
  const runTypes    = types.filter((t) => t !== 'Strength Training');

  // Distribusi run types secara merata
  for (let i = 0; i < count; i++) {
    // Hari terakhir → Strength (jika ada)
    if (hasStrength && i === count - 1) {
      result.push('Strength Training');
    } else {
      // Rotasi run types berdasarkan minggu agar bervariasi
      const idx = (i + week - 1) % runTypes.length;
      result.push(runTypes[idx]);
    }
  }

  return result;
};