export type WorkoutField =
  | 'distance'
  | 'pace'
  | 'sets'
  | 'reps'
  | 'weight'
  | 'duration'
  | 'restDuration'
  | 'notes';

export type WorkoutFormConfig = {
  workoutType: string;
  fields: WorkoutField[];
  distanceUnit?: 'km' | 'm';
  paceUnit?: '/km' | '/100m';
  notesPlaceholder?: string;
};

export const WORKOUT_FORM_CONFIGS: Record<string, WorkoutFormConfig> = {
  'Easy Run': {
    workoutType: 'Easy Run',
    fields: ['distance', 'pace', 'notes'],
    distanceUnit: 'km',
    paceUnit: '/km',
    notesPlaceholder: 'Bagaimana perasaanmu? Cuaca? Terrain?',
  },
  'Long Run': {
    workoutType: 'Long Run',
    fields: ['distance', 'pace', 'notes'],
    distanceUnit: 'km',
    paceUnit: '/km',
    notesPlaceholder: 'Total jarak, nutrisi, bagaimana kaki terasa?',
  },
  'Interval Run': {
    workoutType: 'Interval Run',
    fields: ['distance', 'reps', 'restDuration', 'notes'],
    distanceUnit: 'm',
    paceUnit: '/km',
    notesPlaceholder: 'Berapa repetisi selesai? Pace tiap interval? Bagaimana recovery?',
  },
  'Tempo Run': {
    workoutType: 'Tempo Run',
    fields: ['distance', 'pace', 'notes'],
    distanceUnit: 'km',
    paceUnit: '/km',
    notesPlaceholder: 'Bagaimana rasanya mempertahankan pace? Angin? Elevasi?',
  },
  'Strength Training': {
    workoutType: 'Strength Training',
    fields: ['sets', 'reps', 'weight', 'duration', 'notes'],
    notesPlaceholder: 'Otot mana yang dilatih? Tingkat kelelahan?',
  },
};

export const getFormConfig = (workoutType: string): WorkoutFormConfig =>
  WORKOUT_FORM_CONFIGS[workoutType] ?? {
    workoutType,
    fields: ['distance', 'pace', 'notes'],
    distanceUnit: 'km',
    paceUnit: '/km',
  };

const formatMinutes = (totalMin: number): string => {
  const hours = Math.floor(totalMin / 60);
  const mins = Math.floor(totalMin % 60);
  const secs = Math.round((totalMin % 1) * 60);
  if (hours > 0) return `${hours}j ${mins}m`;
  if (secs > 0) return `${mins}m ${secs}s`;
  return `${mins} menit`;
};

// Easy Run, Tempo Run, Long Run: jarak × pace
export const calcEstimatedTime = (
  distance: string,
  pace: string,
  unit: 'km' | 'm' = 'km'
): string => {
  const d = parseFloat(distance);
  const p = parseFloat(pace);
  if (!d || !p || isNaN(d) || isNaN(p) || d <= 0 || p <= 0) return '--';
  const distanceInKm = unit === 'm' ? d / 1000 : d;
  return formatMinutes(distanceInKm * p);
};

// Interval Run: jarak per interval × pace × sets
export const calcIntervalTime = (
  distance: string,
  pace: string,
  sets: string,
  unit: 'km' | 'm' = 'm'
): string => {
  const d = parseFloat(distance);
  const p = parseFloat(pace);
  const s = parseInt(sets);
  if (!d || !p || !s || isNaN(d) || isNaN(p) || isNaN(s) || d <= 0 || p <= 0 || s <= 0) return '--';
  const distanceInKm = unit === 'm' ? d / 1000 : d;
  return formatMinutes(distanceInKm * p * s);
};