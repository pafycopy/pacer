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
  muscles?: string[];      // Area Fokus
  description?: string;    // Deskripsi singkat
  benefits?: string[];     // Manfaat bagi pelari
};

export type ExerciseSet = {
  set: number;
  reps: string;
  duration: string;
  kg: string;
};

export type SelectedExercise = {
  exercise: Exercise;
  sets: ExerciseSet[];
  expanded: boolean;
};

export const EXERCISES: Exercise[] = [
  // Strength - Lower Body
  {
    id: 's1', name: 'Squat', category: 'Strength', group: 'Lower Body',
    inputType: 'reps', defaultReps: '12',
    muscles: ['Otot Glutes', 'Quadrisep', 'Hamstring', 'Betis'],
    description: 'Squat adalah latihan fungsional dasar yang melibatkan gerakan menurunkan pinggul dari posisi berdiri lalu kembali berdiri tegak.',
    benefits: ['Perbaikan Postur Tubuh', 'Peningkatan Kepadatan Tulang', 'Peningkatan Kekuatan Otot Ekstremitas Bawah'],
  },
  {
    id: 's2', name: 'Lunges', category: 'Strength', group: 'Lower Body',
    inputType: 'reps', defaultReps: '10',
    muscles: ['Quadrisep', 'Hamstring', 'Glutes'],
    description: 'Lunges adalah latihan unilateral yang membangun kekuatan kaki secara simetris dan melatih keseimbangan tubuh.',
    benefits: ['Keseimbangan Otot Kiri-Kanan', 'Stabilitas Lutut', 'Peningkatan Koordinasi Tubuh'],
  },
  {
    id: 's3', name: 'Glute Bridge', category: 'Strength', group: 'Lower Body',
    inputType: 'reps', defaultReps: '15',
    muscles: ['Glutes', 'Hamstring', 'Core'],
    description: 'Glute Bridge mengaktifkan dan memperkuat otot bokong serta stabilitas panggul yang krusial untuk berlari.',
    benefits: ['Aktivasi Otot Bokong', 'Stabilitas Panggul', 'Pengurangan Risiko Nyeri Punggung Bawah'],
  },
  // Strength - Balance
  {
    id: 's4', name: 'Single Leg Balance', category: 'Strength', group: 'Balance',
    inputType: 'duration', defaultDuration: '30',
    muscles: ['Betis', 'Core', 'Glutes'],
    description: 'Latihan keseimbangan satu kaki yang melatih proprioception dan stabilitas pergelangan kaki.',
    benefits: ['Peningkatan Keseimbangan', 'Stabilitas Pergelangan Kaki', 'Pencegahan Cedera Ankle'],
  },
  {
    id: 's5', name: 'Single Leg Squat', category: 'Strength', group: 'Balance',
    inputType: 'reps', defaultReps: '8',
    muscles: ['Quadrisep', 'Glutes', 'Core'],
    description: 'Versi squat satu kaki yang menggabungkan kekuatan dan keseimbangan dalam satu gerakan fungsional.',
    benefits: ['Kekuatan Fungsional', 'Keseimbangan Dinamis', 'Simetri Otot Kiri-Kanan'],
  },
  {
    id: 's6', name: 'Skater Hop', category: 'Strength', group: 'Balance',
    inputType: 'reps', defaultReps: '10',
    muscles: ['Glutes', 'Quadrisep', 'Betis'],
    description: 'Gerakan lateral eksplosif yang membangun kekuatan arah samping dan keseimbangan dinamis.',
    benefits: ['Kekuatan Lateral', 'Respons Cepat Terhadap Perubahan Arah', 'Pencegahan Cedera Lutut'],
  },
  // Strength - Plyometric
  {
    id: 's7', name: 'High Knees', category: 'Strength', group: 'Plyometric',
    inputType: 'duration', defaultDuration: '30',
    muscles: ['Quadrisep', 'Core', 'Betis'],
    description: 'Drill berlari di tempat yang meningkatkan frekuensi langkah dan mengaktifkan otot fleksor pinggul secara dinamis.',
    benefits: ['Peningkatan Cadence Lari', 'Aktivasi Fleksor Pinggul', 'Peningkatan Koordinasi Kaki'],
  },
  {
    id: 's8', name: 'Jump Lunges', category: 'Strength', group: 'Plyometric',
    inputType: 'reps', defaultReps: '10',
    muscles: ['Quadrisep', 'Glutes', 'Betis'],
    description: 'Variasi lunge eksplosif yang melatih power otot kaki dan kemampuan akselerasi.',
    benefits: ['Power Eksplosif Kaki', 'Peningkatan Akselerasi', 'Kekuatan Otot Tungkai'],
  },
  {
    id: 's9', name: 'Broad Jump', category: 'Strength', group: 'Plyometric',
    inputType: 'reps', defaultReps: '8',
    muscles: ['Quadrisep', 'Glutes', 'Hamstring'],
    description: 'Lompatan horizontal yang membangun power eksplosif seluruh kaki dan melatih mekanika pendaratan yang aman.',
    benefits: ['Power Horizontal', 'Mekanika Pendaratan yang Aman', 'Kekuatan Otot Posterior'],
  },
  // Core
  {
    id: 'c1', name: 'Plank', category: 'Core',
    inputType: 'duration', defaultDuration: '45',
    muscles: ['Core', 'Bahu', 'Glutes'],
    description: 'Latihan isometrik fundamental yang membangun stabilitas inti tubuh dari kepala hingga tumit.',
    benefits: ['Stabilitas Inti Tubuh', 'Perbaikan Postur Berlari', 'Pencegahan Nyeri Punggung'],
  },
  {
    id: 'c2', name: 'Side Plank', category: 'Core',
    inputType: 'duration', defaultDuration: '30',
    muscles: ['Core', 'Glutes', 'Bahu'],
    description: 'Variasi plank lateral yang memperkuat otot oblique dan mencegah hip drop saat berlari.',
    benefits: ['Kekuatan Otot Oblique', 'Pencegahan Hip Drop', 'Stabilitas Lateral'],
  },
  {
    id: 'c3', name: 'Mountain Climber', category: 'Core',
    inputType: 'reps', defaultReps: '20',
    muscles: ['Core', 'Quadrisep', 'Bahu'],
    description: 'Gerakan dinamis yang menggabungkan kekuatan core dengan kardio, mensimulasikan gerakan kaki berlari.',
    benefits: ['Kekuatan Core Dinamis', 'Peningkatan Kardiovaskular', 'Koordinasi Tangan-Kaki'],
  },
  // Mobility
  {
    id: 'm1', name: 'Leg Swing', category: 'Mobility',
    inputType: 'reps', defaultReps: '15',
    muscles: ['Hamstring', 'Quadrisep', 'Glutes'],
    description: 'Peregangan dinamis yang membuka mobilitas sendi pinggul untuk stride yang lebih panjang.',
    benefits: ['Mobilitas Sendi Pinggul', 'Peningkatan Panjang Stride', 'Pemanasan Otot Kaki'],
  },
  {
    id: 'm2', name: 'Hip Circle', category: 'Mobility',
    inputType: 'reps', defaultReps: '10',
    muscles: ['Glutes', 'Core'],
    description: 'Gerakan melingkar yang melumasi sendi panggul dan meningkatkan rentang gerak ke segala arah.',
    benefits: ['Pelumasan Sendi Panggul', 'Rentang Gerak Optimal', 'Pencegahan Kekakuan Pinggul'],
  },
  {
    id: 'm3', name: "World's Greatest Stretch", category: 'Mobility',
    inputType: 'duration', defaultDuration: '30',
    muscles: ['Glutes', 'Hamstring', 'Core', 'Bahu'],
    description: 'Peregangan komprehensif yang menargetkan hampir semua otot utama dalam satu gerakan efisien.',
    benefits: ['Peregangan Seluruh Tubuh', 'Efisiensi Waktu Pemanasan', 'Mobilitas Multi-Sendi'],
  },
  // Recovery
  {
    id: 'r1', name: 'Hamstring Stretch', category: 'Recovery',
    inputType: 'duration', defaultDuration: '40',
    muscles: ['Hamstring'],
    description: 'Peregangan statis paha belakang yang mencegah kekakuan dan nyeri pasca lari.',
    benefits: ['Pengurangan Kekakuan Pasca Lari', 'Pencegahan Cedera Hamstring', 'Pemulihan Lebih Cepat'],
  },
  {
    id: 'r2', name: 'Quad Stretch', category: 'Recovery',
    inputType: 'duration', defaultDuration: '40',
    muscles: ['Quadrisep'],
    description: 'Peregangan paha depan yang meredakan ketegangan dan menjaga keseimbangan kekuatan kaki.',
    benefits: ['Meredakan Ketegangan Paha', 'Keseimbangan Otot Depan-Belakang', 'Fleksibilitas Quadrisep'],
  },
  {
    id: 'r3', name: 'Child Pose', category: 'Recovery',
    inputType: 'duration', defaultDuration: '60',
    muscles: ['Punggung', 'Glutes', 'Bahu'],
    description: 'Pose restoratif yang meregangkan punggung, pinggul, dan bahu sambil menenangkan sistem saraf.',
    benefits: ['Relaksasi Sistem Saraf', 'Peregangan Punggung Bawah', 'Pemulihan Mental Pasca Latihan'],
  },
];

export const CATEGORY_CONFIG: Record<ExerciseCategory, { color: string; icon: string; desc: string }> = {
  Strength: { color: '#FF6B35', icon: '💪', desc: 'Kekuatan & daya ledak otot' },
  Core:     { color: '#2E7D32', icon: '🎯', desc: 'Stabilitas & postur lari' },
  Mobility: { color: '#007AFF', icon: '🤸', desc: 'Fleksibilitas & range of motion' },
  Recovery: { color: '#9C27B0', icon: '🧘', desc: 'Cooldown & relaksasi otot' },
};

export const CATEGORIES: ExerciseCategory[] = ['Strength', 'Core', 'Mobility', 'Recovery'];

export const makeDefaultSet = (exercise: Exercise, setNum: number): ExerciseSet => ({
  set: setNum,
  reps:     exercise.inputType === 'reps'     ? (exercise.defaultReps     ?? '10') : '0',
  duration: exercise.inputType === 'duration' ? (exercise.defaultDuration ?? '30') : '0',
  kg: '0',
});

export const getSetsLabel = (exercise: Exercise, sets: ExerciseSet[]): string => {
  const val = exercise.inputType === 'reps'
    ? `${sets[0]?.reps} reps`
    : `${sets[0]?.duration} dtk`;
  return `${sets.length} x ${val}`;
};