export type ExerciseCategory = 'Strength' | 'Core' | 'Mobility' | 'Recovery';
export type ExerciseInputType = 'reps' | 'duration';

const BASE = 'https://edbesyritkmfadbstswd.supabase.co/storage/v1/object/public/gifs';

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  group?: string;
  inputType: ExerciseInputType;
  defaultReps?: string;
  defaultDuration?: string;
  muscles?: string[];
  description?: string;
  benefits?: string[];
  gifUrl?: string;
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

  // ── Strength - Lower Body ─────────────────────────────────────────────────
  {
    id: 's1', name: 'Squat', category: 'Strength', group: 'Lower Body',
    inputType: 'reps', defaultReps: '12',
    muscles: ['Otot Glutes', 'Quadrisep', 'Hamstring', 'Betis'],
    description: 'Squat adalah latihan fungsional dasar yang melibatkan gerakan menurunkan pinggul dari posisi berdiri lalu kembali berdiri tegak.',
    benefits: ['Perbaikan Postur Tubuh', 'Peningkatan Kepadatan Tulang', 'Peningkatan Kekuatan Otot Ekstremitas Bawah'],
    gifUrl: `${BASE}/education/latihan_kekuatan/lower_body/Squat.gif`,
  },
  {
    id: 's2', name: 'Reverse Lunges', category: 'Strength', group: 'Lower Body',
    inputType: 'reps', defaultReps: '10',
    muscles: ['Quadrisep', 'Hamstring', 'Glutes'],
    description: 'Lunges adalah latihan unilateral yang membangun kekuatan kaki secara simetris dan melatih keseimbangan tubuh.',
    benefits: ['Keseimbangan Otot Kiri-Kanan', 'Stabilitas Lutut', 'Peningkatan Koordinasi Tubuh'],
    gifUrl: `${BASE}/education/latihan_kekuatan/lower_body/Reverse%20Lunge.gif`,
  },
  {
    id: 's3', name: 'Glute Bridge', category: 'Strength', group: 'Lower Body',
    inputType: 'reps', defaultReps: '15',
    muscles: ['Glutes', 'Hamstring', 'Core'],
    description: 'Glute Bridge mengaktifkan dan memperkuat otot bokong serta stabilitas panggul yang krusial untuk berlari.',
    benefits: ['Aktivasi Otot Bokong', 'Stabilitas Panggul', 'Pengurangan Risiko Nyeri Punggung Bawah'],
    gifUrl: `${BASE}/education/latihan_kekuatan/lower_body/Glute%20Bridge.gif`,
  },
  {
    id: 's4', name: 'Bulgarian Split Squat', category: 'Strength', group: 'Lower Body',
    inputType: 'reps', defaultReps: '10',
    muscles: ['Quadrisep', 'Glutes', 'Hamstring'],
    description: 'Bulgarian Split Squat adalah variasi squat satu kaki dengan kaki belakang ditopang, sangat efektif untuk kekuatan unilateral.',
    benefits: ['Kekuatan Unilateral', 'Keseimbangan Tubuh', 'Stabilitas Pinggul'],
    gifUrl: `${BASE}/education/latihan_kekuatan/lower_body/Bulgarian%20Split%20Squat.gif`,
  },
  {
    id: 's5', name: 'Calf Raises', category: 'Strength', group: 'Lower Body',
    inputType: 'reps', defaultReps: '15',
    muscles: ['Betis'],
    description: 'Calf Raises melatih otot betis yang berperan penting dalam setiap langkah berlari dan mencegah cedera achilles.',
    benefits: ['Kekuatan Otot Betis', 'Pencegahan Cedera Achilles', 'Peningkatan Daya Dorong Kaki'],
    gifUrl: `${BASE}/education/latihan_kekuatan/lower_body/Calf%20Raises.gif`,
  },

  // ── Strength - Balance ────────────────────────────────────────────────────
  {
    id: 's6', name: 'Single Leg Balance', category: 'Strength', group: 'Balance',
    inputType: 'duration', defaultDuration: '30',
    muscles: ['Betis', 'Core', 'Glutes','Hamstring','betis'],
    description: 'Single Leg Balance adalah Latihan keseimbangan satu kaki merupakan gerakan dasar yang memberikan banyak manfaat bagi kehidupan sehari-hari dan kesehatan secara keseluruhan.',
    benefits: [' Membantu Tubuh Menjadi Lebih Stabil', 'Mengurangi Risiko Terjatuh', 'Otot-Otot Pada Kaki Menjadi Lebih Kuat','Menjaga Stabilitas Sendi','Membantu Postur Tubuh Menjadi Lebih Tegap Dan Seimbang'],
    gifUrl: `${BASE}/education/latihan_kekuatan/balance/Single%20Leg%20Balance.gif`,
  },
  {
    id: 's7', name: 'Bird Dog', category: 'Strength', group: 'Balance',
    inputType: 'reps', defaultReps: '8',
    muscles: ['Punggung Bawah', 'Otot Glutes','Bahu','Hamstring','Trisep'],
    description: 'Bird Dog adalah salah satu latihan yang efektif untuk meningkatkan stabilitas otot inti.',
    benefits: ['Memperkuat Otot Inti','Membantu Dalam Meningkatkan Postur Tubuh','Mengurangi Risiko Cedera Punggung Bawah','Meningkatkan Fleksibilitas Dan Mobilitas Sendi','Menjaga Kesehatan Tulang Belakang'],
    gifUrl: `${BASE}/education/latihan_kekuatan/balance/Single%20Leg%20Squat.gif`,
  },
  {
    id: 's8', name: 'Standing Knee Hold', category: 'Strength', group: 'Balance',
    inputType: 'reps', defaultReps: '10',
    muscles: ['Glutes', 'Quadrisep', 'Betis'],
    description: 'Gerakan lateral eksplosif yang membangun kekuatan arah samping dan keseimbangan dinamis.',
    benefits: ['Kekuatan Lateral', 'Respons Cepat Terhadap Perubahan Arah', 'Pencegahan Cedera Lutut'],
    gifUrl: `${BASE}/education/latihan_kekuatan/balance/Skater%20Hop.gif`,
  },
  {
    id: 's9', name: 'Single Leg Balance Reach', category: 'Strength', group: 'Balance',
    inputType: 'reps', defaultReps: '10',
    muscles: ['Glutes', 'Quadrisep', 'Betis'],
    description: 'Gerakan lateral eksplosif yang membangun kekuatan arah samping dan keseimbangan dinamis.',
    benefits: ['Kekuatan Lateral', 'Respons Cepat Terhadap Perubahan Arah', 'Pencegahan Cedera Lutut'],
    gifUrl: `${BASE}/education/latihan_kekuatan/balance/Skater%20Hop.gif`,
  },

  // ── Strength - Plyometric ─────────────────────────────────────────────────
  {
    id: 's10', name: 'High Knees', category: 'Strength', group: 'Plyometric',
    inputType: 'duration', defaultDuration: '30',
    muscles: ['Quadrisep', 'Core', 'Betis'],
    description: 'Drill berlari di tempat yang meningkatkan frekuensi langkah dan mengaktifkan otot fleksor pinggul secara dinamis.',
    benefits: ['Peningkatan Cadence Lari', 'Aktivasi Fleksor Pinggul', 'Peningkatan Koordinasi Kaki'],
    gifUrl: `${BASE}/education/latihan_kekuatan/plyometric/High%20Knees.gif`,
  },
  {
    id: 's11', name: 'Jump Lunges', category: 'Strength', group: 'Plyometric',
    inputType: 'reps', defaultReps: '10',
    muscles: ['Quadrisep', 'Glutes', 'Betis'],
    description: 'Variasi lunge eksplosif yang melatih power otot kaki dan kemampuan akselerasi.',
    benefits: ['Power Eksplosif Kaki', 'Peningkatan Akselerasi', 'Kekuatan Otot Tungkai'],
    gifUrl: `${BASE}/education/latihan_kekuatan/plyometric/Jump%20Lunges.gif`,
  },
  {
    id: 's12', name: 'Broad Jump', category: 'Strength', group: 'Plyometric',
    inputType: 'reps', defaultReps: '8',
    muscles: ['Quadrisep', 'Glutes', 'Hamstring'],
    description: 'Lompatan horizontal yang membangun power eksplosif seluruh kaki dan melatih mekanika pendaratan yang aman.',
    benefits: ['Power Horizontal', 'Mekanika Pendaratan yang Aman', 'Kekuatan Otot Posterior'],
    gifUrl: `${BASE}/education/latihan_kekuatan/plyometric/Broad%20Jump.gif`,
  },

  // ── Core ──────────────────────────────────────────────────────────────────
  {
    id: 'c1', name: 'Plank', category: 'Core',
    inputType: 'duration', defaultDuration: '45',
    muscles: ['Core', 'Bahu', 'Glutes'],
    description: 'Latihan isometrik fundamental yang membangun stabilitas inti tubuh dari kepala hingga tumit.',
    benefits: ['Stabilitas Inti Tubuh', 'Perbaikan Postur Berlari', 'Pencegahan Nyeri Punggung'],
    gifUrl: `${BASE}/education/latihan_kekuatan/core/Plank.gif`,
  },
  {
    id: 'c2', name: 'Side Plank', category: 'Core',
    inputType: 'duration', defaultDuration: '30',
    muscles: ['Core', 'Glutes', 'Bahu'],
    description: 'Variasi plank lateral yang memperkuat otot oblique dan mencegah hip drop saat berlari.',
    benefits: ['Kekuatan Otot Oblique', 'Pencegahan Hip Drop', 'Stabilitas Lateral'],
    gifUrl: `${BASE}/education/latihan_kekuatan/core/Side%20Plank.gif`,
  },
  {
    id: 'c3', name: 'Mountain Climber', category: 'Core',
    inputType: 'reps', defaultReps: '20',
    muscles: ['Core', 'Quadrisep', 'Bahu'],
    description: 'Gerakan dinamis yang menggabungkan kekuatan core dengan kardio, mensimulasikan gerakan kaki berlari.',
    benefits: ['Kekuatan Core Dinamis', 'Peningkatan Kardiovaskular', 'Koordinasi Tangan-Kaki'],
    gifUrl: `${BASE}/education/latihan_kekuatan/core/Mountain%20Climber.gif`,
  },

  // ── Mobility ──────────────────────────────────────────────────────────────
  {
    id: 'm1', name: 'Leg Swing', category: 'Mobility',
    inputType: 'reps', defaultReps: '15',
    muscles: ['Hamstring', 'Quadrisep', 'Glutes'],
    description: 'Peregangan dinamis yang membuka mobilitas sendi pinggul untuk stride yang lebih panjang.',
    benefits: ['Mobilitas Sendi Pinggul', 'Peningkatan Panjang Stride', 'Pemanasan Otot Kaki'],
    gifUrl: `${BASE}/education/latihan_kekuatan/mobility/Leg%20Swing.gif`,
  },
  {
    id: 'm2', name: 'Hip Circle', category: 'Mobility',
    inputType: 'reps', defaultReps: '10',
    muscles: ['Glutes', 'Core'],
    description: 'Gerakan melingkar yang melumasi sendi panggul dan meningkatkan rentang gerak ke segala arah.',
    benefits: ['Pelumasan Sendi Panggul', 'Rentang Gerak Optimal', 'Pencegahan Kekakuan Pinggul'],
    gifUrl: `${BASE}/education/latihan_kekuatan/mobility/Hip%20Circle.gif`,
  },
  {
    id: 'm3', name: "World's Greatest Stretch", category: 'Mobility',
    inputType: 'duration', defaultDuration: '30',
    muscles: ['Glutes', 'Hamstring', 'Core', 'Bahu'],
    description: 'Peregangan komprehensif yang menargetkan hampir semua otot utama dalam satu gerakan efisien.',
    benefits: ['Peregangan Seluruh Tubuh', 'Efisiensi Waktu Pemanasan', 'Mobilitas Multi-Sendi'],
    gifUrl: `${BASE}/education/latihan_kekuatan/mobility/Worlds%20Greatest%20Stretch.gif`,
  },

  // ── Recovery ─────────────────────────────────────────────────────────────
  {
    id: 'r1', name: 'Hamstring Stretch', category: 'Recovery',
    inputType: 'duration', defaultDuration: '40',
    muscles: ['Hamstring'],
    description: 'Peregangan statis paha belakang yang mencegah kekakuan dan nyeri pasca lari.',
    benefits: ['Pengurangan Kekakuan Pasca Lari', 'Pencegahan Cedera Hamstring', 'Pemulihan Lebih Cepat'],
    gifUrl: `${BASE}/education/latihan_kekuatan/recovery/Hamstring%20Stretch.gif`,
  },
  {
    id: 'r2', name: 'Quad Stretch', category: 'Recovery',
    inputType: 'duration', defaultDuration: '40',
    muscles: ['Quadrisep'],
    description: 'Peregangan paha depan yang meredakan ketegangan dan menjaga keseimbangan kekuatan kaki.',
    benefits: ['Meredakan Ketegangan Paha', 'Keseimbangan Otot Depan-Belakang', 'Fleksibilitas Quadrisep'],
    gifUrl: `${BASE}/education/latihan_kekuatan/recovery/Quad%20Stretch.gif`,
  },
  {
    id: 'r3', name: 'Child Pose', category: 'Recovery',
    inputType: 'duration', defaultDuration: '60',
    muscles: ['Punggung', 'Glutes', 'Bahu'],
    description: 'Pose restoratif yang meregangkan punggung, pinggul, dan bahu sambil menenangkan sistem saraf.',
    benefits: ['Relaksasi Sistem Saraf', 'Peregangan Punggung Bawah', 'Pemulihan Mental Pasca Latihan'],
    gifUrl: `${BASE}/education/latihan_kekuatan/recovery/Child%20Pose.gif`,
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