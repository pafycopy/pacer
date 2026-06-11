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
  rpe?: string;
}

const WORKOUT_METADATA: Record<WorkoutType, WorkoutMeta> = {
  "Easy Run": {
    type: "Easy Run",
    intensity: "Zone 1 (Easy)",
    description: "Lari dengan intensitas rendah, bisa berbicara santai. Membangun dasar aerobik dan pemulihan.",
    rpe: "3-4/10",
  },
  "Long Run": {
    type: "Long Run",
    intensity: "Zone 1 (Easy)",
    description: "Lari jarak jauh dengan intensitas rendah, meningkatkan daya tahan dan efisiensi.",
    rpe: "4-5/10",
  },
  "Tempo Run": {
    type: "Tempo Run",
    intensity: "Zone 2 (Moderate)",
    description: "Lari dengan kecepatan yang nyaman tapi menantang, meningkatkan ambang laktat.",
    rpe: "6-7/10",
  },
  "Interval Run": {
    type: "Interval Run",
    intensity: "Zone 3 (Hard)",
    description: "Pengulangan lari cepat diikuti istirahat, meningkatkan kecepatan dan VO2max.",
    rpe: "8-9/10",
  },
  "Strength Training": {
    type: "Strength Training",
    intensity: "Zone 2 (Moderate)",
    description: "Latihan kekuatan untuk mencegah cedera dan meningkatkan efisiensi lari.",
    rpe: "5-7/10",
  },
};

// =========================
// 2. Base Config
// =========================

const BASE_CONFIG: Record<string, {
  distance: Record<WorkoutType, number>;
  pace: Record<WorkoutType, number>;
}> = {
  beginner: {
    distance: { "Easy Run": 1.5, "Long Run": 2.5, "Tempo Run": 1.0, "Interval Run": 0.2, "Strength Training": 0 },
    pace: { "Easy Run": 9.5, "Long Run": 10.5, "Tempo Run": 8.5, "Interval Run": 7.5, "Strength Training": 0 },
  },
  intermediate: {
    distance: { "Easy Run": 3.0, "Long Run": 5.0, "Tempo Run": 3.0, "Interval Run": 0.4, "Strength Training": 0 },
    pace: { "Easy Run": 7.5, "Long Run": 8.0, "Tempo Run": 6.5, "Interval Run": 5.5, "Strength Training": 0 },
  },
  advanced: {
    distance: { "Easy Run": 5.0, "Long Run": 8.0, "Tempo Run": 5.0, "Interval Run": 1.0, "Strength Training": 0 },
    pace: { "Easy Run": 6.0, "Long Run": 6.5, "Tempo Run": 5.0, "Interval Run": 4.5, "Strength Training": 0 },
  },
};

const INJURY_DISTANCE_FACTOR: Record<InjuryHistory, number> = {
  none: 1.0, knee: 0.7, ankle: 0.7, shin_splints: 0.6, other: 0.8,
};

const INJURY_AVOID: Record<InjuryHistory, WorkoutType[]> = {
  none: [],
  knee: ["Interval Run"],
  ankle: ["Interval Run", "Tempo Run"],
  shin_splints: ["Interval Run", "Tempo Run", "Long Run"],
  other: [],
};

const WEEKLY_PROGRESS_FACTOR = [1.0, 1.1, 1.2, 1.1];

// =========================
// 3. Helper Functions
// =========================

const formatPace = (pace: number): string => {
  const m = Math.floor(pace);
  const s = Math.round((pace - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

const makeWorkout = (type: WorkoutType, weekNum: number, assessment: AssessmentData): WorkoutFormValues | null => {
  const { level, injury, activityLevel } = assessment;
  const weekFactor = WEEKLY_PROGRESS_FACTOR[weekNum - 1];
  const injuryFactor = INJURY_DISTANCE_FACTOR[injury];
  const activityBonus = activityLevel === "very_active" ? 1.1 : activityLevel === "sedentary" ? 0.9 : 1.0;

  if (INJURY_AVOID[injury].includes(type)) return null;

  const baseDist = BASE_CONFIG[level].distance[type];
  let basePace = BASE_CONFIG[level].pace[type] * (activityLevel === "sedentary" ? 1.2 : activityLevel === "very_active" ? 0.9 : 1.0);

  let distance = parseFloat((baseDist * weekFactor * injuryFactor * activityBonus).toFixed(2));
  let pace = parseFloat((basePace).toFixed(2));
  const notes = (WORKOUT_METADATA[type].rpe ? `RPE: ${WORKOUT_METADATA[type].rpe}. ` : "") + (injury !== "none" ? "Program disesuaikan." : "");

  if (type === "Strength Training") {
    const sets = level === "beginner" ? 2 : level === "intermediate" ? 3 : 4;
    return {
      workoutType: "Strength Training", workoutName: "Strength Training", distance: "", pace: "",
      sets: String(Math.max(1, Math.round(sets * injuryFactor))), reps: "10", restTime: "90", weight: "",
      duration: { hour: 0, min: 30, sec: 0 }, notes, trainingCategory: "Strength", selectedExercises: [], isGenerated: true,
    };
  }

  if (type === "Interval Run") {
    const baseReps = level === "beginner" ? 3 : level === "intermediate" ? 5 : 8;
    const repsAdj = Math.max(1, Math.round(baseReps * weekFactor * injuryFactor));
    return {
      workoutType: "Interval Run", workoutName: `Interval Run (${repsAdj}x${baseDist}km)`,
      distance: String(parseFloat((distance * repsAdj).toFixed(2))), pace: formatPace(pace),
      sets: String(repsAdj), reps: String(baseDist), restTime: level === "beginner" ? "120" : "90", weight: "",
      duration: { hour: 0, min: 0, sec: 0 }, notes: notes + " Fokus pada teknik.", isGenerated: true,
    };
  }

  if (type === "Tempo Run") {
    const warmupDist = parseFloat((1.0 * weekFactor * injuryFactor).toFixed(2));
    const warmupPace = parseFloat((BASE_CONFIG[level].pace["Easy Run"] + 1).toFixed(2));
    return {
      workoutType: "Tempo Run", workoutName: `Tempo Run W${weekNum}`, distance: String(distance), pace: formatPace(pace),
      sets: "", reps: "", restTime: "", weight: "", duration: { hour: 0, min: 0, sec: 0 }, notes,
      warmup: { distance: String(warmupDist), pace: formatPace(warmupPace) },
      tempo: { distance: String(distance), targetPace: formatPace(pace), actualPace: "" },
      cooldown: { distance: String(warmupDist), pace: formatPace(warmupPace) },
      isGenerated: true,
    };
  }

  return {
    workoutType: type, workoutName: `${type} W${weekNum}`, distance: String(distance), pace: formatPace(pace),
    sets: "", reps: "", restTime: "", weight: "", duration: { hour: 0, min: 0, sec: 0 }, notes, isGenerated: true,
  };
};

// =========================
// 4. Main Generator Program
// =========================

export type GeneratedDay = { dateKey: string; workout: WorkoutFormValues; };

// =========================
// Logika distribusi workout per minggu
//
// Prinsip utama:
//   - Strength Training (ST) : maks 2x, tapi TIDAK boleh di hari bersebelahan
//   - Speed (Tempo/Interval) : maks 1x per minggu, rotasi antar minggu
//   - Long Run               : maks 1x per minggu
//   - Easy Run               : mengisi sisa slot (bisa 1-2x)
//
// Cara kerjanya: setiap slot diberi "role" berdasarkan posisinya dalam
// urutan hari latihan (sorted), lalu workout di-assign ke role tersebut.
// =========================

const buildWeeklyPlan = (
  slots: number[],        // hari latihan (0=Min … 6=Sab), sudah sorted
  speedWorkout: WorkoutType | null,
  longRunAvailable: boolean,
  strengthAvailable: boolean,
  daysPerWeek: number,
): (WorkoutType)[] => {
  // slots sudah sorted ascending (mis. [1,2,3,4,5] = Sen-Jum)
  const n = slots.length;
  // result[i] = workout untuk slots[i]
  const result: (WorkoutType | null)[] = Array(n).fill(null);

  // -----------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------
  const assign = (slotIdx: number, type: WorkoutType) => {
    result[slotIdx] = type;
  };

  // Cari slot kosong pertama dari depan / belakang / tengah
  const firstEmpty  = () => result.findIndex(v => v === null);
  const lastEmpty   = () => { for (let i = n-1; i >= 0; i--) if (!result[i]) return i; return -1; };
  const middleEmpty = () => {
    // Pilih slot tengah yang masih kosong, hindari slot yang sudah ada
    const mid = Math.floor(n / 2);
    for (let d = 0; d < n; d++) {
      if (!result[mid - d] && mid - d >= 0) return mid - d;
      if (!result[mid + d] && mid + d < n)  return mid + d;
    }
    return firstEmpty();
  };

  // Urutan kalender: Sen(1)…Sab(6)…Min(0)=7
  const calOrder = (d: number) => d === 0 ? 7 : d;

  // Cek apakah dua slot bersebelahan (hari kalender berdekatan = selisih 1)
  const areAdjacent = (i: number, j: number) =>
    Math.abs(calOrder(slots[i]) - calOrder(slots[j])) === 1;

  // -----------------------------------------------------------
  // Step 1: Tempatkan Strength Training (maks 2x, tidak berdekatan)
  // ST tidak boleh di Minggu — Minggu reserved untuk Long Run
  // -----------------------------------------------------------
  if (strengthAvailable && n >= 1) {
    // Cari slot Senin-Sabtu pertama (bukan Minggu) untuk ST pertama
    const firstWeekday = slots.findIndex(d => d !== 0);
    if (firstWeekday !== -1) {
      assign(firstWeekday, "Strength Training");

      // ST kedua hanya jika daysPerWeek >= 4, tidak berdekatan, dan bukan Minggu
      if (daysPerWeek >= 4) {
        for (let i = n - 1; i >= 0; i--) {
          if (!result[i] && slots[i] !== 0 && !areAdjacent(firstWeekday, i)) {
            assign(i, "Strength Training");
            break;
          }
        }
      }
    }
  }

  // -----------------------------------------------------------
  // Step 2: Tempatkan Long Run → prioritaskan hari Minggu (0),
  // jika tidak ada slot Minggu gunakan slot paling akhir
  // -----------------------------------------------------------
  if (longRunAvailable) {
    const sundaySlotIdx = slots.findIndex(day => day === 0);
    const idx = sundaySlotIdx !== -1 && !result[sundaySlotIdx]
      ? sundaySlotIdx
      : lastEmpty();
    if (idx !== -1) assign(idx, "Long Run");
  }

  // -----------------------------------------------------------
  // Step 3: Tempatkan Speed Session → slot tengah yang masih kosong
  // (jauh dari ST maupun Long Run agar ada buffer recovery)
  // -----------------------------------------------------------
  if (speedWorkout) {
    const idx = middleEmpty();
    if (idx !== -1) assign(idx, speedWorkout);
  }

  // -----------------------------------------------------------
  // Step 4: Isi sisa slot dengan Easy Run
  // -----------------------------------------------------------
  for (let i = 0; i < n; i++) {
    if (!result[i]) assign(i, "Easy Run");
  }

  return result as WorkoutType[];
};

export const generateProgram = (assessment: AssessmentData): GeneratedDay[] => {
  const { daysPerWeek, injury, level } = assessment;
  const results: GeneratedDay[] = [];

  // Anchor ke Senin minggu depan sebagai hari pertama program
  // Contoh: hari ini Sabtu(6) → Senin lusa = +2 hari
  //         hari ini Senin(1) → Senin depan = +7 hari (tidak mulai hari ini)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDow = today.getDay(); // 0=Min, 1=Sen, …, 6=Sab
  const daysUntilMonday = todayDow === 0 ? 1 : todayDow === 1 ? 7 : 8 - todayDow;
  const firstMonday = new Date(today);
  firstMonday.setDate(today.getDate() + daysUntilMonday);

  const isBeginner = level === "beginner";
  const isAllowed = (type: WorkoutType) => !INJURY_AVOID[injury].includes(type);

  for (let week = 1; week <= 4; week++) {
    const slots = pickTrainingDays(daysPerWeek); // sorted: 1(Sen)…6(Sab)…0(Min)=7

    // Tentukan speed session minggu ini (rotasi Tempo ↔ Interval tiap minggu)
    let speedWorkout: WorkoutType | null = null;
    if (!isBeginner) {
      const speedPool = (["Tempo Run", "Interval Run"] as WorkoutType[]).filter(isAllowed);
      if (speedPool.length > 0) {
        speedWorkout = speedPool[(week - 1) % speedPool.length];
      }
    }

    const longRunAvailable  = isAllowed("Long Run");
    const strengthAvailable = isAllowed("Strength Training");

    // Bangun rencana minggu ini — hasil adalah array workout sesuai urutan slots
    const weeklyPlan = buildWeeklyPlan(
      slots,
      speedWorkout,
      longRunAvailable,
      strengthAvailable,
      daysPerWeek,
    );

    // Anchor minggu ini = firstMonday + (week-1)*7 hari
    const weekMonday = new Date(firstMonday);
    weekMonday.setDate(firstMonday.getDate() + (week - 1) * 7);

    // Konversi ke GeneratedDay
    // dayIdx: 1=Sen, 2=Sel, …, 6=Sab, 0=Min
    // Offset dari Senin: Sen=0, Sel=1, …, Sab=5, Min=6
    slots.forEach((dayIdx, i) => {
      const workoutType = weeklyPlan[i];
      if (!workoutType) return;

      const offsetFromMonday = dayIdx === 0 ? 6 : dayIdx - 1;
      const date = new Date(weekMonday);
      date.setDate(weekMonday.getDate() + offsetFromMonday);

      const workout = makeWorkout(workoutType, week, assessment);
      if (workout) results.push({ dateKey: date.toISOString().split("T")[0], workout });
    });
  }

  return results;
};

const pickTrainingDays = (count: number): number[] => {
  // Pola hari latihan fixed per jumlah hari:
  // 2x → Sab(6), Min(0)
  // 3x → Sel(2), Kam(4), Min(0)
  // 4x → Sel(2), Kam(4), Sab(6), Min(0)
  // 5x → Sen(1), Sel(2), Kam(4), Sab(6), Min(0)
  // 6x → Sel(2), Rab(3), Kam(4), Jum(5), Sab(6), Min(0)
  // 7x → Sen(1), Sel(2), Rab(3), Kam(4), Jum(5), Sab(6), Min(0)
  const patterns: Record<number, number[]> = {
    1: [0],
    2: [7, 8],
    3: [2, 4, 8],
    4: [2, 4, 6, 0],
    5: [2, 3, 5, 6, 0],
    6: [2, 3, 4, 5, 6, 0],
  };
  const days = patterns[count] ?? patterns[3];
  // Sudah terurut kalender (Min=0 di akhir setelah Sab=6)
  return days.sort((a, b) => {
    const order = (d: number) => d === 0 ? 7 : d;
    return order(a) - order(b);
  });
};