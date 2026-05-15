export type ExerciseCategory = 'Strength' | 'Core' | 'Mobility' | 'Recovery';

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  group?: string;
};

export type ExerciseSet = {
  set: number;
  reps: string;
  kg: string;
};

export type SelectedExercise = {
  exercise: Exercise;
  sets: ExerciseSet[];
  expanded: boolean;
};

export const EXERCISES: Exercise[] = [
  // Strength - Lower Body
  { id: 's1', name: 'Squat',        category: 'Strength', group: 'Lower Body' },
  { id: 's2', name: 'Lunges',       category: 'Strength', group: 'Lower Body' },
  { id: 's3', name: 'Glute Bridge', category: 'Strength', group: 'Lower Body' },
  // Strength - Balance
  { id: 's4', name: 'Single Leg Balance', category: 'Strength', group: 'Balance' },
  { id: 's5', name: 'Single Leg Squat',   category: 'Strength', group: 'Balance' },
  { id: 's6', name: 'Skater Hop',         category: 'Strength', group: 'Balance' },
  // Strength - Plyometric
  { id: 's7', name: 'High Knees',  category: 'Strength', group: 'Plyometric' },
  { id: 's8', name: 'Jump Lunges', category: 'Strength', group: 'Plyometric' },
  { id: 's9', name: 'Broad Jump',  category: 'Strength', group: 'Plyometric' },
  // Core
  { id: 'c1', name: 'Plank',            category: 'Core' },
  { id: 'c2', name: 'Side Plank',       category: 'Core' },
  { id: 'c3', name: 'Mountain Climber', category: 'Core' },
  // Mobility
  { id: 'm1', name: 'Leg Swing',                category: 'Mobility' },
  { id: 'm2', name: 'Hip Circle',               category: 'Mobility' },
  { id: 'm3', name: "World's Greatest Stretch", category: 'Mobility' },
  // Recovery
  { id: 'r1', name: 'Hamstring Stretch', category: 'Recovery' },
  { id: 'r2', name: 'Quad Stretch',      category: 'Recovery' },
  { id: 'r3', name: 'Child Pose',        category: 'Recovery' },
];

export const CATEGORY_CONFIG: Record<ExerciseCategory, { color: string; icon: string; desc: string }> = {
  Strength: { color: '#FF6B35', icon: '💪', desc: 'Kekuatan & daya ledak otot' },
  Core:     { color: '#2E7D32', icon: '🎯', desc: 'Stabilitas & postur lari' },
  Mobility: { color: '#007AFF', icon: '🤸', desc: 'Fleksibilitas & range of motion' },
  Recovery: { color: '#9C27B0', icon: '🧘', desc: 'Cooldown & relaksasi otot' },
};

export const CATEGORIES: ExerciseCategory[] = ['Strength', 'Core', 'Mobility', 'Recovery'];