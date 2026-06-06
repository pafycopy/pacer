import { AssessmentData, InjuryHistory } from "@/store/assessmentStore";
import { WorkoutFormValues } from "@/components/ui/calendar/workoutformscreen";

// =========================
// 1. Definisi Tipe Workout dan Zona Intensitas
// =========================

type WorkoutType = "Easy Run" | "Long Run" | "Tempo Run" | "Interval Run" | "Strength Training";
type IntensityZone = "Zone 1 (Easy)" | "Zone 2 (Moderate)" | "Zone 3 (Hard)";

interface WorkoutMeta {
  type: WorkoutType;
  intensity: IntensityZone;
  description: string;
  rpe?: string; // Rate of Perceived Exertion
}

const WORKOUT_METADATA: Record<WorkoutType, WorkoutMeta> = {
  "Easy Run": {
    type: "Easy Run",
    intensity: "Zone 1 (Easy)",
    description: "Lari dengan intensitas rendah, bisa berbicara santai. Membangun dasar aerobik dan pemulihan.",
    rpe: "3-4/10 (sangat mudah hingga cukup mudah)",
  },
  "Long Run": {
    type: "Long Run",
    intensity: "Zone 1 (Easy)",
    description: "Lari jarak jauh dengan intensitas rendah, meningkatkan daya tahan dan efisiensi.",
    rpe: "4-5/10 (cukup mudah)",
  },
  "Tempo Run": {
    type: "Tempo Run",
    intensity: "Zone 2 (Moderate)",
    description: "Lari dengan kecepatan yang nyaman tapi menantang, meningkatkan ambang laktat.",
    rpe: "6-7/10 (agak sulit hingga sulit)",
  },
  "Interval Run": {
    type: "Interval Run",
    intensity: "Zone 3 (Hard)",
    description: "Pengulangan lari cepat diikuti istirahat, meningkatkan kecepatan dan VO2max.",
    rpe: "8-9/10 (sangat sulit)",
  },
  "Strength Training": {
    type: "Strength Training",
    intensity: "Zone 2 (Moderate)", // Bisa bervariasi, tapi umumnya moderate effort
    description: "Latihan kekuatan untuk mencegah cedera dan meningkatkan efisiensi lari.",
    rpe: "5-7/10 (cukup mudah hingga sulit)",
  },
};

// =========================
// 2. Base Data (Jarak, Pace, Frekuensi) per Level
// =========================

const BASE_CONFIG: Record<string, {
  distance: Record<WorkoutType, number>;
  pace: Record<WorkoutType, number>; // Pace dalam min/km desimal
}> = {
  beginner: {
    distance: {
      "Easy Run": 1.5,
      "Long Run": 2.5,
      "Tempo Run": 1.0, // Mulai dengan jarak pendek untuk adaptasi
      "Interval Run": 0.2, // Interval sangat pendek (200m) untuk melatih form
      "Strength Training": 0,
    },
    pace: {
      "Easy Run": 9.5,
      "Long Run": 10.5,
      "Tempo Run": 8.5, // Sedikit lebih cepat dari easy run
      "Interval Run": 7.5, // Kecepatan yang menantang tapi singkat
      "Strength Training": 0,
    },
  },
  intermediate: {
    distance: {
      "Easy Run": 3.0,
      "Long Run": 5.0,
      "Tempo Run": 3.0,
      "Interval Run": 0.4, // 400m intervals
      "Strength Training": 0,
    },
    pace: {
      "Easy Run": 7.5,
      "Long Run": 8.0,
      "Tempo Run": 6.5,
      "Interval Run": 5.5,
      "Strength Training": 0,
    },
  },
  advanced: {
    distance: {
      "Easy Run": 5.0,
      "Long Run": 8.0,
      "Tempo Run": 5.0,
      "Interval Run": 1.0, // per rep
      "Strength Training": 0,
    },
    pace: {
      "Easy Run": 6.0, // ~10 km/h
      "Long Run": 6.5,
      "Tempo Run": 5.0,
      "Interval Run": 4.5,
      "Strength Training": 0,
    },
  },
};

// =========================
// 3. Faktor Penyesuaian (Cedera, Progres Mingguan)
// =========================

const INJURY_DISTANCE_FACTOR: Record<InjuryHistory, number> = {
  none: 1.0,
  knee: 0.7,
  ankle: 0.7,
  shin_splints: 0.6,
  other: 0.8,
};

const INJURY_AVOID: Record<InjuryHistory, WorkoutType[]> = {
  none: [],
  knee: ["Interval Run"],
  ankle: ["Interval Run", "Tempo Run"],
  shin_splints: ["Interval Run", "Tempo Run", "Long Run"],
  other: [],
};

// Progres mingguan (+10% per minggu, minggu 4 deload)
const WEEKLY_PROGRESS_FACTOR = [1.0, 1.1, 1.2, 1.1]; // Minggu 1, 2, 3, 4 (deload)

// =========================
// 4. Helper Functions
// =========================

// Format pace desimal → string "M:SS"
const formatPace = (pace: number): string => {
  const m = Math.floor(pace);
  const s = Math.round((pace - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

// Buat workout form values
const makeWorkout = (
  type: WorkoutType,
  weekNum: number,
  assessment: AssessmentData,
): WorkoutFormValues | null => {
  const { level, injury, activityLevel } = assessment;
  const weekFactor = WEEKLY_PROGRESS_FACTOR[weekNum - 1];
  const injuryFactor = INJURY_DISTANCE_FACTOR[injury];
  const activityBonus = activityLevel === "very_active" ? 1.1 : activityLevel === "sedentary" ? 0.9 : 1.0;

  // Cek apakah workout ini dihindari karena cedera
  if (INJURY_AVOID[injury].includes(type)) return null;

  const baseDist = BASE_CONFIG[level].distance[type];
  let basePace = BASE_CONFIG[level].pace[type];

  // Adjust pace based on activity level
  // Sedentary runners get a slower pace (higher min/km), active runners get a slightly faster pace
  const paceAdjustment = activityLevel === "sedentary" ? 1.2 : activityLevel === "very_active" ? 0.9 : 1.0;
  basePace = basePace * paceAdjustment;

  let distance = parseFloat((baseDist * weekFactor * injuryFactor * activityBonus).toFixed(2));
  let pace = parseFloat((basePace).toFixed(2));

  // Add RPE to notes
  const rpeNote = WORKOUT_METADATA[type].rpe ? `RPE: ${WORKOUT_METADATA[type].rpe}. ` : "";
  const injuryNote = injury !== "none" ? "Program disesuaikan dengan kondisi fisik Anda." : "";
  const notes = rpeNote + injuryNote;

  // Specific adjustments for workout types
  if (type === "Strength Training") {
    const sets = level === "beginner" ? 2 : level === "intermediate" ? 3 : 4;
    const setsReduced = Math.max(1, Math.round(sets * injuryFactor));
    return {
      workoutType: "Strength Training",
      workoutName: "Strength Training",
      distance: "",
      pace: "",
      sets: String(setsReduced),
      reps: "10",
      restTime: "90",
      weight: "",
      duration: { hour: 0, min: 30, sec: 0 },
      notes: notes,
      trainingCategory: "Strength",
      selectedExercises: [],
      isGenerated: true,
    };
  }

  if (type === "Interval Run") {
    // Logic: Beginner (3-4 reps), Intermediate (5-6 reps), Advanced (8-10 reps)
    const baseReps = level === "beginner" ? 3 : level === "intermediate" ? 5 : 8;
    const repsAdj = Math.max(1, Math.round(baseReps * weekFactor * injuryFactor));
    const totalIntervalDistance = parseFloat((distance * repsAdj).toFixed(2));
    
    return {
      workoutType: "Interval Run",
      workoutName: `Interval Run W${weekNum} (${repsAdj}x${baseDist}km)`,
      distance: String(totalIntervalDistance),
      pace: formatPace(pace),
      sets: String(repsAdj),
      reps: String(baseDist),
      restTime: level === "beginner" ? "120" : "90", // Istirahat lebih lama untuk pemula
      weight: "",
      duration: { hour: 0, min: 0, sec: 0 },
      notes: notes + " Fokus pada teknik lari dan pernapasan saat interval.",
      isGenerated: true,
    };
  }

  if (type === "Tempo Run") {
    const warmupDist = parseFloat((1.0 * weekFactor * injuryFactor).toFixed(2));
    const cooldownDist = parseFloat((1.0 * weekFactor * injuryFactor).toFixed(2));
    const warmupPace = parseFloat((BASE_CONFIG[level].pace["Easy Run"] + 1).toFixed(2));

    return {
      workoutType: "Tempo Run",
      workoutName: `Tempo Run W${weekNum}`,
      distance: String(distance),
      pace: formatPace(pace),
      sets: "",
      reps: "",
      restTime: "",
      weight: "",
      duration: { hour: 0, min: 0, sec: 0 },
      notes: notes,
      warmup: { distance: String(warmupDist), pace: formatPace(warmupPace) },
      tempo: { distance: String(distance), targetPace: formatPace(pace), actualPace: "" },
      cooldown: { distance: String(cooldownDist), pace: formatPace(warmupPace) },
      isGenerated: true,
    };
  }

  // Easy Run / Long Run
  return {
    workoutType: type,
    workoutName: `${type} W${weekNum}`,
    distance: String(distance),
    pace: formatPace(pace),
    sets: "",
    reps: "",
    restTime: "",
    weight: "",
    duration: { hour: 0, min: 0, sec: 0 },
    notes: notes,
    isGenerated: true,
  };
};

// =========================
// 5. Main Generator Program
// =========================

export type GeneratedDay = {
  dateKey: string; // "YYYY-MM-DD"
  workout: WorkoutFormValues;
};

export const generateProgram = (assessment: AssessmentData): GeneratedDay[] => {
  const { level, daysPerWeek } = assessment;
  const results: GeneratedDay[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Mulai besok
  startDate.setHours(0, 0, 0, 0);

  const availableWorkouts = Object.keys(WORKOUT_METADATA) as WorkoutType[];
  const easyWorkouts = availableWorkouts.filter(type => WORKOUT_METADATA[type].intensity === "Zone 1 (Easy)" && !INJURY_AVOID[assessment.injury].includes(type));
  const hardWorkouts = availableWorkouts.filter(type => (WORKOUT_METADATA[type].intensity === "Zone 2 (Moderate)" || WORKOUT_METADATA[type].intensity === "Zone 3 (Hard)") && !INJURY_AVOID[assessment.injury].includes(type));
  const strengthWorkoutType = availableWorkouts.find(type => type === "Strength Training" && !INJURY_AVOID[assessment.injury].includes(type));

  for (let week = 1; week <= 4; week++) {
    const weekWorkouts: WorkoutType[] = [];
    let currentHardRuns = 0;
    let currentEasyRuns = 0;
    let currentStrength = 0;

    // Determine number of hard, easy, and strength workouts for the week
    let numTotalWorkouts = daysPerWeek;
    let numStrengthTarget = (strengthWorkoutType && numTotalWorkouts >= 2) ? 1 : 0; // Strength muncul mulai dari 2 hari/minggu
    let numRunningDays = numTotalWorkouts - numStrengthTarget;
    
    let numHardRunsTarget = Math.floor(numRunningDays * 0.2); // ~20% dari hari lari
    if (numRunningDays >= 3 && numHardRunsTarget === 0) numHardRunsTarget = 1; // Minimal 1 hard run jika lari >= 3 hari
    
    let numEasyRunsTarget = numRunningDays - numHardRunsTarget;

    // Distribute workouts across the week
    const dailyWorkouts: (WorkoutType | null)[] = Array(7).fill(null);
    
    // Kita butuh slot hari sebanyak numTotalWorkouts
    const trainingDaySlots = pickTrainingDays(numTotalWorkouts);

    // 1. Place Strength Training
    if (strengthWorkoutType && numStrengthTarget > 0) {
      // Tempatkan strength di slot pertama yang tersedia
      dailyWorkouts[trainingDaySlots[0]] = strengthWorkoutType;
      currentStrength++;
    }

    // 2. Place hard runs, ensuring no consecutive hard days
    // Logic: Rotasi hard workouts berdasarkan minggu agar tidak selalu Tempo yang muncul
    let hardRunCandidatesList = [...hardWorkouts];
    // Rotate the list based on the week number
    if (week % 2 === 0) {
      hardRunCandidatesList.reverse(); // Balik urutan agar Interval jadi yang pertama di minggu genap
    }

    for (let i = 0; i < numHardRunsTarget; i++) {
      if (hardRunCandidatesList.length === 0) break;
      let placed = false;
      
      // Ambil tipe workout untuk repetisi ini
      const workoutToPlace = hardRunCandidatesList[i % hardRunCandidatesList.length];

      // Iterate through training days to find a suitable slot
      for (const dayIndex of trainingDaySlots) {
        if (dailyWorkouts[dayIndex] === null) {
          // Check if previous or next day is a hard run
          const prevDay = (dayIndex + 6) % 7;
          const nextDay = (dayIndex + 1) % 7;
          const isPrevHard = dailyWorkouts[prevDay] && (WORKOUT_METADATA[dailyWorkouts[prevDay] as WorkoutType].intensity !== "Zone 1 (Easy)");
          const isNextHard = dailyWorkouts[nextDay] && (WORKOUT_METADATA[dailyWorkouts[nextDay] as WorkoutType].intensity !== "Zone 1 (Easy)");

          if (!isPrevHard && !isNextHard) {
            dailyWorkouts[dayIndex] = workoutToPlace;
            placed = true;
            currentHardRuns++;
            break;
          }
        }
      }
      if (!placed) { // If no ideal slot, place it where possible
        for (const dayIndex of trainingDaySlots) {
          if (dailyWorkouts[dayIndex] === null) {
            dailyWorkouts[dayIndex] = workoutToPlace;
            currentHardRuns++;
            break;
          }
        }
      }
    }

    // Place easy runs (Long Run first, then Easy Runs)
    let easyRunCandidates: WorkoutType[] = ([...easyWorkouts].filter(type => type === "Long Run") as WorkoutType[])
      .concat([...easyWorkouts].filter(type => type === "Easy Run") as WorkoutType[]);

    for (let i = 0; i < numEasyRunsTarget; i++) {
      if (easyRunCandidates.length === 0) break;
      for (const dayIndex of trainingDaySlots) {
        if (dailyWorkouts[dayIndex] === null) {
          dailyWorkouts[dayIndex] = easyRunCandidates.shift()!;
          currentEasyRuns++;
          break;
        }
      }
    }

    // Fill any remaining training slots with Easy Runs if available
    for (const dayIndex of trainingDaySlots) {
      if (dailyWorkouts[dayIndex] === null && easyWorkouts.length > 0) {
        dailyWorkouts[dayIndex] = easyWorkouts[0]; // Just pick one easy run type
        currentEasyRuns++;
      }
    }

    // Generate workouts for the week
    for (let slot = 0; slot < daysPerWeek; slot++) {
      const dayOfWeek = trainingDaySlots[slot]; // 0=Minggu ... 6=Sabtu

      const weekOffset = (week - 1) * 7;
      const date = new Date(startDate);

      const startDow = startDate.getDay();
      let daysUntil = dayOfWeek - startDow;
      if (daysUntil < 0) daysUntil += 7;
      date.setDate(startDate.getDate() + weekOffset + daysUntil);

      const dateKey = date.toISOString().split("T")[0];
      const workoutType = dailyWorkouts[dayOfWeek];

      if (workoutType) {
        const workout = makeWorkout(workoutType, week, assessment);
        if (workout) {
          results.push({ dateKey, workout });
        }
      }
    }
  }

  return results;
};

// Helper: pilih hari latihan yang tersebar
const pickTrainingDays = (count: number): number[] => {
  // Hari 1=Senin ... 6=Sabtu, 0=Minggu
  const allDays = [1, 3, 5, 2, 4, 6, 0]; // urutan prioritas: Senin, Rabu, Jumat, Selasa, Kamis, Sabtu, Minggu
  return allDays.slice(0, count).sort((a, b) => a - b);
};
