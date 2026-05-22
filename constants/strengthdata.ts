export type ExerciseCategory = 'Strength' | 'Core' | 'Mobility' | 'Recovery';
export type ExerciseInputType = 'reps' | 'duration';

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  group?: string;
  inputType: ExerciseInputType;
  defaultReps?: string;
  defaultDuration?: string;
};

export type ExerciseSet = {
  set: number;
  reps: string;
  duration: string; // detik, dipakai saat inputType === 'duration'
  kg: string;
};

export type SelectedExercise = {
  exercise: Exercise;
  sets: ExerciseSet[];
  expanded: boolean;
};

export const EXERCISES: Exercise[] = [
  // Strength - Lower Body
  { id: 's1', name: 'Squat',        category: 'Strength', group: 'Lower Body', inputType: 'reps',     defaultReps: '12' },
  { id: 's2', name: 'Lunges',       category: 'Strength', group: 'Lower Body', inputType: 'reps',     defaultReps: '10' },
  { id: 's3', name: 'Glute Bridge', category: 'Strength', group: 'Lower Body', inputType: 'reps',     defaultReps: '15' },
  // Strength - Balance
  { id: 's4', name: 'Single Leg Balance', category: 'Strength', group: 'Balance', inputType: 'duration', defaultDuration: '30' },
  { id: 's5', name: 'Single Leg Squat',   category: 'Strength', group: 'Balance', inputType: 'reps',     defaultReps: '8'  },
  { id: 's6', name: 'Skater Hop',         category: 'Strength', group: 'Balance', inputType: 'reps',     defaultReps: '10' },
  // Strength - Plyometric
  { id: 's7', name: 'High Knees',  category: 'Strength', group: 'Plyometric', inputType: 'duration', defaultDuration: '30' },
  { id: 's8', name: 'Jump Lunges', category: 'Strength', group: 'Plyometric', inputType: 'reps',     defaultReps: '10' },
  { id: 's9', name: 'Broad Jump',  category: 'Strength', group: 'Plyometric', inputType: 'reps',     defaultReps: '8'  },
  // Core
  { id: 'c1', name: 'Plank',            category: 'Core', inputType: 'duration', defaultDuration: '45' },
  { id: 'c2', name: 'Side Plank',       category: 'Core', inputType: 'duration', defaultDuration: '30' },
  { id: 'c3', name: 'Mountain Climber', category: 'Core', inputType: 'reps',     defaultReps: '20'     },
  // Mobility
  { id: 'm1', name: 'Leg Swing',                category: 'Mobility', inputType: 'reps',     defaultReps: '15'     },
  { id: 'm2', name: 'Hip Circle',               category: 'Mobility', inputType: 'reps',     defaultReps: '10'     },
  { id: 'm3', name: "World's Greatest Stretch", category: 'Mobility', inputType: 'duration', defaultDuration: '30' },
  // Recovery
  { id: 'r1', name: 'Hamstring Stretch', category: 'Recovery', inputType: 'duration', defaultDuration: '40' },
  { id: 'r2', name: 'Quad Stretch',      category: 'Recovery', inputType: 'duration', defaultDuration: '40' },
  { id: 'r3', name: 'Child Pose',        category: 'Recovery', inputType: 'duration', defaultDuration: '60' },
];

export const CATEGORY_CONFIG: Record<ExerciseCategory, { color: string; icon: string; desc: string }> = {
  Strength: { color: '#FF6B35', icon: '💪', desc: 'Kekuatan & daya ledak otot' },
  Core:     { color: '#2E7D32', icon: '🎯', desc: 'Stabilitas & postur lari' },
  Mobility: { color: '#007AFF', icon: '🤸', desc: 'Fleksibilitas & range of motion' },
  Recovery: { color: '#9C27B0', icon: '🧘', desc: 'Cooldown & relaksasi otot' },
};

export const CATEGORIES: ExerciseCategory[] = ['Strength', 'Core', 'Mobility', 'Recovery'];

/** Buat set default berdasarkan inputType exercise */
export const makeDefaultSet = (exercise: Exercise, setNum: number): ExerciseSet => ({
  set: setNum,
  reps:     exercise.inputType === 'reps'     ? (exercise.defaultReps     ?? '10') : '0',
  duration: exercise.inputType === 'duration' ? (exercise.defaultDuration ?? '30') : '0',
  kg: '0',
});

/** Label ringkas untuk preview: "3 x 12 reps" atau "3 x 45 dtk" */
export const getSetsLabel = (exercise: Exercise, sets: ExerciseSet[]): string => {
  const val = exercise.inputType === 'reps'
    ? `${sets[0]?.reps} reps`
    : `${sets[0]?.duration} dtk`;
  return `${sets.length} x ${val}`;
};