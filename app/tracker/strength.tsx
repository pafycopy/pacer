import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/store/workoutStore';

type SetStatus = 'pending' | 'done';
type ScreenState = 'preview' | 'exercise' | 'rest' | 'finished';
type InputType = 'reps' | 'duration';

type ExerciseProgress = {
  id: string;
  name: string;
  inputType: InputType;
  sets: Array<{ set: number; reps: string; duration: string; status: SetStatus }>;
};

const REST_DURATION = 30;

export default function StrengthTracker() {
  const router = useRouter();
  const { uid, dateKey, workoutName, selectedExercises } = useLocalSearchParams<{
    uid: string; dateKey: string; workoutName: string; selectedExercises: string;
  }>();
  const { saveTrackingResult } = useWorkoutStore();

  // ── Parse exercises ──────────────────────────────────────────────────────
  const exercises: ExerciseProgress[] = (() => {
    try {
      const parsed = JSON.parse(selectedExercises ?? '[]');
      return parsed.map((e: any) => ({
        id: e.id,
        name: e.name,
        inputType: (e.inputType ?? 'reps') as InputType,
        sets: e.sets.map((s: any) => ({
          set: s.set,
          reps: s.reps ?? '10',
          duration: s.duration ?? '30',
          status: 'pending' as SetStatus,
        })),
      }));
    } catch { return []; }
  })();

  // ── State ────────────────────────────────────────────────────────────────
  const [progress, setProgress] = useState<ExerciseProgress[]>(exercises);
  const [screen, setScreen] = useState<ScreenState>('preview');
  const [isTraining, setIsTraining] = useState(false);
  const [restCountdown, setRestCountdown] = useState(REST_DURATION);
  const [totalTime, setTotalTime] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  // State khusus set timer (untuk exercise inputType === 'duration')
  const [setCountdown, setSetCountdown] = useState(0);
  const [setTimerActive, setSetTimerActive] = useState(false);

  const totalTimerRef = useRef<any>(null);
  const restTimerRef = useRef<any>(null);
  const setTimerRef = useRef<any>(null);

  // Refs untuk hindari stale closure di interval
  const exerciseIndexRef = useRef(0);
  const setIndexRef = useRef(0);
  const progressRef = useRef<ExerciseProgress[]>(exercises);
  exerciseIndexRef.current = currentExerciseIndex;
  setIndexRef.current = currentSetIndex;
  progressRef.current = progress;

  const currentExercise = progress[currentExerciseIndex];
  const currentSet = currentExercise?.sets[currentSetIndex];

  // ── Total timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen === 'exercise' || screen === 'rest') {
      if (!totalTimerRef.current) {
        totalTimerRef.current = setInterval(() => setTotalTime((p) => p + 1), 1000);
      }
    } else {
      clearInterval(totalTimerRef.current);
      totalTimerRef.current = null;
    }
  }, [screen]);

  // ── Rest timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen === 'rest') {
      setRestCountdown(REST_DURATION);
      restTimerRef.current = setInterval(() => {
        setRestCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(restTimerRef.current);
            restTimerRef.current = null;
            goToNextFromRef();
            return REST_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    return () => { clearInterval(restTimerRef.current); restTimerRef.current = null; };
  }, [screen]);

  // Cleanup unmount
  useEffect(() => {
    return () => {
      clearInterval(totalTimerRef.current);
      clearInterval(restTimerRef.current);
      clearInterval(setTimerRef.current);
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h} Jam ${m} Menit`;
    if (m > 0) return `${m} Menit ${s} Detik`;
    return `${s} Detik`;
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalSets = progress.reduce((acc, e) => acc + e.sets.length, 0);
  const doneSets = progress.reduce((acc, e) => acc + e.sets.filter((s) => s.status === 'done').length, 0);

  // ── Actions ──────────────────────────────────────────────────────────────
  const startWorkout = () => setScreen('exercise');

  const startSet = () => {
    setIsTraining(true);
    // Jika exercise pakai durasi → mulai countdown set timer
    if (currentExercise.inputType === 'duration') {
      const secs = parseInt(currentSet.duration ?? '30');
      setSetCountdown(secs);
      setSetTimerActive(true);
      setTimerRef.current = setInterval(() => {
        setSetCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(setTimerRef.current);
            setTimerRef.current = null;
            setSetTimerActive(false);
            // Auto complete saat waktu habis
            completeSetAuto();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // completeSetAuto dipanggil saat set timer habis otomatis
  const completeSetAuto = () => {
    const exIdx = exerciseIndexRef.current;
    const setIdx = setIndexRef.current;
    const prog = progressRef.current;

    const updated = prog.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, si) => si === setIdx ? { ...s, status: 'done' as SetStatus } : s),
      };
    });
    setProgress(updated);

    const exercise = prog[exIdx];
    const isLastSet = setIdx === exercise.sets.length - 1;
    const isLastExercise = exIdx === prog.length - 1;

    setIsTraining(false);
    if (isLastSet && isLastExercise) { setScreen('finished'); return; }
    setScreen('rest');
  };

  const completeSet = () => {
    // Hentikan set timer jika masih jalan (tap manual sebelum habis)
    clearInterval(setTimerRef.current);
    setTimerRef.current = null;
    setSetTimerActive(false);
    setIsTraining(false);

    const updated = progress.map((ex, ei) => {
      if (ei !== currentExerciseIndex) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, si) => si === currentSetIndex ? { ...s, status: 'done' as SetStatus } : s),
      };
    });
    setProgress(updated);

    const isLastSet = currentSetIndex === currentExercise.sets.length - 1;
    const isLastExercise = currentExerciseIndex === progress.length - 1;
    if (isLastSet && isLastExercise) { setScreen('finished'); return; }
    setScreen('rest');
  };

  // goToNext dari ref — aman dipanggil dari interval
  const goToNextFromRef = () => {
    const exIdx = exerciseIndexRef.current;
    const setIdx = setIndexRef.current;
    const prog = progressRef.current;
    const exercise = prog[exIdx];
    const isLastSet = setIdx === exercise.sets.length - 1;
    if (!isLastSet) { setCurrentSetIndex(setIdx + 1); }
    else { setCurrentExerciseIndex(exIdx + 1); setCurrentSetIndex(0); }
    setIsTraining(false);
    setScreen('exercise');
  };

  const goToNext = () => {
    const isLastSet = currentSetIndex === currentExercise.sets.length - 1;
    if (!isLastSet) { setCurrentSetIndex((p) => p + 1); }
    else { setCurrentExerciseIndex((p) => p + 1); setCurrentSetIndex(0); }
    setIsTraining(false);
    setScreen('exercise');
  };

  const skipRest = () => {
    clearInterval(restTimerRef.current);
    restTimerRef.current = null;
    goToNext();
  };

  // Tambah 15 detik ke countdown istirahat
  const addRestTime = () => {
    setRestCountdown((prev) => prev + 15);
  };

  const handleFinish = () => {
    clearInterval(totalTimerRef.current);
    clearInterval(restTimerRef.current);
    clearInterval(setTimerRef.current);
    saveTrackingResult(dateKey, uid, {
      actualDistance: 0, actualDuration: totalTime, actualPace: '--', completedAt: Date.now(),
    });
    router.back();
  };

  const getUpNext = () => {
    const isLastSet = currentSetIndex === currentExercise?.sets.length - 1;
    if (!isLastSet) return { name: currentExercise?.name, label: `Set ${currentSetIndex + 2} / ${currentExercise?.sets.length}` };
    const nextEx = progress[currentExerciseIndex + 1];
    return nextEx ? { name: nextEx.name, label: 'Set 1' } : null;
  };
  const upNext = getUpNext();

  // ─────────────────────────────────────────────────────────────────────────
  // PREVIEW SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'preview') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.previewScroll} showsVerticalScrollIndicator={false}>
          <View style={s.previewHero}>
            <View style={s.previewBadge}><Text style={s.previewBadgeText}>FOUNDATION</Text></View>
            <Text style={s.previewTitle}>{workoutName}</Text>
          </View>
          <View style={s.statsRow}>
            <View style={s.statItem}><Text style={s.statLabel}>DURASI EST.</Text><Text style={s.statValue}>~{Math.round(totalSets * 1.5)} Min</Text></View>
            <View style={s.statDivider} />
            <View style={s.statItem}><Text style={s.statLabel}>EXERCISES</Text><Text style={s.statValue}>{progress.length}</Text></View>
            <View style={s.statDivider} />
            <View style={s.statItem}><Text style={s.statLabel}>TOTAL SETS</Text><Text style={s.statValue}>{totalSets}</Text></View>
          </View>
          {progress.map((exercise) => (
            <View key={exercise.id} style={s.previewCard}>
              <View style={s.previewThumb}><Ionicons name="barbell-outline" size={22} color="#CCC" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.previewCardTitle}>{exercise.name}</Text>
                <Text style={s.previewCardSub}>
                  {exercise.sets.length} set ×{' '}
                  {exercise.inputType === 'reps'
                    ? `${exercise.sets[0]?.reps} reps`
                    : `${exercise.sets[0]?.duration} dtk`}
                </Text>
              </View>
              {/* Badge tipe */}
              <View style={[s.typeBadge, exercise.inputType === 'duration' && s.typeBadgeDuration]}>
                <Ionicons name={exercise.inputType === 'duration' ? 'timer-outline' : 'repeat-outline'} size={12} color={exercise.inputType === 'duration' ? '#007AFF' : '#FF6B35'} />
                <Text style={[s.typeBadgeText, exercise.inputType === 'duration' && { color: '#007AFF' }]}>
                  {exercise.inputType === 'duration' ? 'Waktu' : 'Reps'}
                </Text>
              </View>
            </View>
          ))}
          <Text style={s.previewQuote}>"Istirahat juga bagian dari progres"</Text>
          <TouchableOpacity style={s.startBtn} onPress={startWorkout} activeOpacity={0.88}>
            <Text style={s.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXERCISE SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'exercise') {
    const isDuration = currentExercise.inputType === 'duration';
    const targetValue = isDuration ? parseInt(currentSet.duration ?? '30') : parseInt(currentSet.reps ?? '0');

    return (
      <SafeAreaView style={s.safe}>
        <View style={s.exScreen}>
          {/* Progress bar + timer */}
          <View style={s.exTopBar}>
            <View style={s.progressBarWrap}>
              <View style={[s.progressBarFill, { width: `${(doneSets / totalSets) * 100}%` as any }]} />
            </View>
            <Text style={s.timerText}>{formatTime(totalTime)}</Text>
          </View>

          <Text style={s.exTitle}>{currentExercise.name}</Text>

          <View style={s.videoPlaceholder}>
            <Ionicons name="barbell-outline" size={48} color="#555" />
          </View>

          {/* Stat cards */}
          <View style={s.exStatsRow}>
            <View style={s.exStatCard}>
              <Text style={s.exStatLabel}>SET</Text>
              <Text style={s.exStatValue}>
                {currentSetIndex + 1}
                <Text style={s.exStatTotal}>/{currentExercise.sets.length}</Text>
              </Text>
            </View>
            <View style={s.exStatCard}>
              {/* Label berubah sesuai tipe */}
              <Text style={s.exStatLabel}>{isDuration ? 'DURASI' : 'TARGET REPS'}</Text>
              {isDuration ? (
                // Tampilkan countdown aktif saat latihan, target saat belum mulai
                <Text style={[s.exStatValue, setTimerActive && { color: '#FF6B35' }]}>
                  {setTimerActive ? setCountdown : targetValue}
                  <Text style={s.exStatTotal}> dtk</Text>
                </Text>
              ) : (
                <Text style={s.exStatValue}>{currentSet.reps}</Text>
              )}
            </View>
          </View>

          {/* CTA button */}
          <TouchableOpacity
            style={[s.ctaBtn, isTraining && { backgroundColor: '#FFD84D' }]}
            onPress={isTraining ? completeSet : startSet}
            activeOpacity={0.88}
          >
            <Ionicons name={isTraining ? 'checkmark' : (isDuration ? 'timer-outline' : 'play')} size={20} color="#111" />
            <Text style={s.ctaBtnText}>
              {isTraining
                ? (isDuration ? `SELESAI (${setCountdown} dtk)` : 'COMPLETE SET')
                : (isDuration ? 'MULAI TIMER' : 'START SET')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REST SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'rest') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.restScroll} showsVerticalScrollIndicator={false}>
          <View style={s.restTopRow}>
            <Text style={s.restTopTimer}>{formatTime(totalTime)}</Text>
            <Text style={s.restTopLabel}>waktu berjalan</Text>
          </View>
          <Text style={s.restHeading}>Rest Time</Text>
          <View style={s.restCircle}>
            <Text style={s.restCountdownText}>{formatCountdown(restCountdown)}</Text>
            <Text style={s.restCountdownSub}>detik tersisa</Text>
          </View>
          {upNext && (
            <View style={s.upNextCard}>
              <Text style={s.upNextLabel}>SELANJUTNYA</Text>
              <Text style={s.upNextTitle}>{upNext.name}</Text>
              <Text style={s.upNextSub}>{upNext.label}</Text>
            </View>
          )}
          {/* Dua tombol: +15 SEC dan SKIP REST */}
          <View style={s.restBtnRow}>
            <TouchableOpacity style={s.addTimeBtn} onPress={addRestTime} activeOpacity={0.88}>
              <Ionicons name="add" size={16} color="#111" />
              <Text style={s.addTimeBtnText}>+15 SEC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.skipBtn} onPress={skipRest} activeOpacity={0.88}>
              <Text style={s.skipBtnText}>SKIP REST ▶</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FINISHED SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.finishedScreen}>
        <View style={s.trophyWrap}><Ionicons name="trophy" size={36} color="#5BFF7A" /></View>
        <Text style={s.finishedTitle}>Workout Selesai!</Text>
        <Text style={s.finishedSub}>Pelan tidak apa-apa, yang penting konsisten</Text>
        <View style={s.durationCard}>
          <Text style={s.durationLabel}>DURASI TOTAL</Text>
          <Text style={s.durationValue}>{formatTime(totalTime)}</Text>
        </View>
        <View style={s.finStatsRow}>
          <View style={s.finStatCard}><Ionicons name="barbell" size={18} color="#4D7CFE" /><Text style={s.finStatLabel}>LATIHAN</Text><Text style={s.finStatValue}>{progress.length}</Text></View>
          <View style={s.finStatCard}><Ionicons name="layers" size={18} color="#A78BFA" /><Text style={s.finStatLabel}>TOTAL SETS</Text><Text style={s.finStatValue}>{totalSets}</Text></View>
        </View>
        <TouchableOpacity style={s.finishBtn} onPress={handleFinish} activeOpacity={0.88}>
          <Text style={s.finishBtnText}>Kembali ke Dashboard</Text>
          <Ionicons name="arrow-forward" size={18} color="#111" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  // Preview
  previewScroll: { padding: 20, gap: 14, paddingBottom: 40 },
  previewHero: { backgroundColor: '#111', borderRadius: 24, padding: 24, height: 180, justifyContent: 'flex-end', gap: 8 },
  previewBadge: { alignSelf: 'flex-start', backgroundColor: '#5BFF7A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  previewBadgeText: { fontSize: 11, fontWeight: '800', color: '#111', letterSpacing: 1 },
  previewTitle: { color: '#FFF', fontSize: 26, fontWeight: '800' },
  statsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 36, backgroundColor: '#F0F0F0' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 },
  statValue: { fontSize: 15, fontWeight: '800', color: '#111' },
  previewCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  previewThumb: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center' },
  previewCardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  previewCardSub: { fontSize: 13, color: '#888', marginTop: 4 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF1EC', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeDuration: { backgroundColor: '#EEF4FF' },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#FF6B35' },
  previewQuote: { textAlign: 'center', fontSize: 13, color: '#AAA', fontStyle: 'italic', paddingVertical: 4 },
  startBtn: { backgroundColor: '#5BFF7A', borderRadius: 50, paddingVertical: 18, alignItems: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#111' },
  // Exercise
  exScreen: { flex: 1, padding: 20, gap: 16 },
  exTopBar: { gap: 6 },
  progressBarWrap: { height: 5, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#5BFF7A', borderRadius: 3 },
  timerText: { fontSize: 13, fontWeight: '700', color: '#888', textAlign: 'right' },
  exTitle: { fontSize: 30, fontWeight: '800', color: '#111' },
  videoPlaceholder: { height: 240, backgroundColor: '#333', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  exStatsRow: { flexDirection: 'row', gap: 12 },
  exStatCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 16 },
  exStatLabel: { fontSize: 11, fontWeight: '700', color: '#888' },
  exStatValue: { fontSize: 36, fontWeight: '800', color: '#111', marginTop: 8 },
  exStatTotal: { fontSize: 20, fontWeight: '600', color: '#AAA' },
  ctaBtn: { backgroundColor: '#5BFF7A', borderRadius: 40, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: '#111' },
  // Rest
  restScroll: { flexGrow: 1, padding: 20, gap: 20, alignItems: 'center', paddingBottom: 40 },
  restTopRow: { alignItems: 'center', gap: 2 },
  restTopTimer: { fontSize: 28, fontWeight: '800', color: '#111' },
  restTopLabel: { fontSize: 12, color: '#888' },
  restHeading: { fontSize: 22, fontWeight: '800', color: '#111' },
  restCircle: { width: 220, height: 220, borderRadius: 110, borderWidth: 8, borderColor: '#5BFF7A', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', gap: 4 },
  restCountdownText: { fontSize: 54, fontWeight: '800', color: '#111' },
  restCountdownSub: { fontSize: 13, color: '#888', fontWeight: '500' },
  upNextCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 22, padding: 20, gap: 4 },
  upNextLabel: { fontSize: 11, fontWeight: '700', color: '#2EAF62', letterSpacing: 0.5 },
  upNextTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  upNextSub: { fontSize: 13, color: '#888', fontWeight: '500' },
  skipBtn: { flex: 1, backgroundColor: '#5BFF7A', borderRadius: 40, paddingVertical: 18, alignItems: 'center' },
  skipBtnText: { fontWeight: '800', color: '#111', fontSize: 14 },
  restBtnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  addTimeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFF', borderRadius: 40, paddingVertical: 18, paddingHorizontal: 20, borderWidth: 1.5, borderColor: '#E0E0E0' },
  addTimeBtnText: { fontWeight: '800', color: '#111', fontSize: 14 },
  // Finished
  finishedScreen: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 4 },
  trophyWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  finishedTitle: { fontSize: 32, fontWeight: '800', color: '#111', marginTop: 16, textAlign: 'center' },
  finishedSub: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 22 },
  durationCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 22, padding: 20, marginTop: 20, gap: 6 },
  durationLabel: { fontSize: 11, fontWeight: '700', color: '#888' },
  durationValue: { fontSize: 34, fontWeight: '800', color: '#111' },
  finStatsRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  finStatCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 14, gap: 4 },
  finStatLabel: { fontSize: 10, fontWeight: '700', color: '#888', marginTop: 8 },
  finStatValue: { fontSize: 26, fontWeight: '800', color: '#111' },
  finishBtn: { width: '100%', backgroundColor: '#5BFF7A', paddingVertical: 18, borderRadius: 40, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  finishBtnText: { fontSize: 16, fontWeight: '800', color: '#111' },
});