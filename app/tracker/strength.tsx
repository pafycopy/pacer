import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/store/workoutStore';

type SetStatus = 'pending' | 'active' | 'done';

type ExerciseProgress = {
  id: string;
  name: string;
  sets: Array<{
    set: number;
    reps: string;
    status: SetStatus;
  }>;
};

// Rest timer default 60 detik
const REST_DURATION = 60;

export default function StrengthTracker() {
  const router = useRouter();
  const { uid, dateKey, workoutName, selectedExercises } = useLocalSearchParams<{
    uid: string;
    dateKey: string;
    workoutName: string;
    selectedExercises: string;
  }>();

  const { saveTrackingResult } = useWorkoutStore();

  // Parse exercise dari params
  const exercises: ExerciseProgress[] = (() => {
    try {
      const parsed = JSON.parse(selectedExercises ?? '[]');
      return parsed.map((e: any) => ({
        id: e.id,
        name: e.name,
        sets: e.sets.map((s: any) => ({
          set: s.set,
          reps: s.reps,
          status: 'pending' as SetStatus,
        })),
      }));
    } catch {
      return [];
    }
  })();

  const [progress, setProgress] = useState<ExerciseProgress[]>(exercises);
  const [resting, setResting] = useState(false);
  const [restCountdown, setRestCountdown] = useState(REST_DURATION);
  const [totalTime, setTotalTime] = useState(0);
  const [started, setStarted] = useState(false);

  const restTimerRef = useRef<any>(null);
  const totalTimerRef = useRef<any>(null);

  // Total time counter
  useEffect(() => {
    if (started) {
      totalTimerRef.current = setInterval(() => {
        setTotalTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(totalTimerRef.current);
  }, [started]);

  // Rest countdown
  useEffect(() => {
    if (resting) {
      restTimerRef.current = setInterval(() => {
        setRestCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(restTimerRef.current);
            setResting(false);
            setRestCountdown(REST_DURATION);
            return REST_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restTimerRef.current);
    }
    return () => clearInterval(restTimerRef.current);
  }, [resting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Tandai set selesai → mulai rest timer
  const completeSet = (exerciseId: string, setIndex: number) => {
    if (!started) setStarted(true);
    setProgress((prev) =>
      prev.map((e) => {
        if (e.id !== exerciseId) return e;
        const newSets = e.sets.map((s, i) =>
          i === setIndex ? { ...s, status: 'done' as SetStatus } : s
        );
        return { ...e, sets: newSets };
      })
    );
    // Mulai rest setelah set selesai
    setResting(true);
    setRestCountdown(REST_DURATION);
  };

  const skipRest = () => {
    clearInterval(restTimerRef.current);
    setResting(false);
    setRestCountdown(REST_DURATION);
  };

  // Hitung progress keseluruhan
  const totalSets = progress.reduce((acc, e) => acc + e.sets.length, 0);
  const doneSets = progress.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.status === 'done').length, 0
  );
  const allDone = doneSets === totalSets;

  const handleFinish = () => {
    clearInterval(totalTimerRef.current);
    clearInterval(restTimerRef.current);

    saveTrackingResult(dateKey, uid, {
      actualDistance: 0,
      actualDuration: totalTime,
      actualPace: '--',
      completedAt: Date.now(),
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workoutName}</Text>
        <Text style={styles.headerTime}>{formatTime(totalTime)}</Text>
      </View>

      {/* Rest Timer Overlay */}
      {resting && (
        <View style={styles.restOverlay}>
          <Text style={styles.restLabel}>ISTIRAHAT</Text>
          <Text style={styles.restCountdown}>{restCountdown}</Text>
          <Text style={styles.restSub}>detik</Text>
          <TouchableOpacity style={styles.skipBtn} onPress={skipRest}>
            <Text style={styles.skipText}>SKIP ▶</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Overall Progress */}
        <View style={styles.progressBox}>
          <Text style={styles.progressLabel}>PROGRESS</Text>
          <Text style={styles.progressValue}>{doneSets} / {totalSets} sets</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(doneSets / totalSets) * 100}%` as any }]} />
          </View>
        </View>

        {/* Exercise List */}
        {progress.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>

            {exercise.sets.map((s, idx) => {
              const isDone = s.status === 'done';
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.setRow, isDone && styles.setRowDone]}
                  onPress={() => !isDone && completeSet(exercise.id, idx)}
                  disabled={isDone}
                  activeOpacity={0.75}
                >
                  <View style={[styles.setNumBox, isDone && styles.setNumBoxDone]}>
                    {isDone
                      ? <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      : <Text style={styles.setNum}>{s.set}</Text>
                    }
                  </View>
                  <Text style={[styles.setReps, isDone && styles.setRepsDone]}>
                    {s.reps} repetisi
                  </Text>
                  {!isDone && (
                    <Text style={styles.tapHint}>Tap selesai</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Finish Button */}
        {allDone && (
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
            <Text style={styles.finishBtnText}>Selesai & Simpan</Text>
          </TouchableOpacity>
        )}

        {/* Stop early */}
        {!allDone && started && (
          <TouchableOpacity style={styles.stopBtn} onPress={handleFinish}>
            <Text style={styles.stopBtnText}>Hentikan & Simpan Progress</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F3F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  headerTime: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },

  // Rest Overlay
  restOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#1A1A2Eee', zIndex: 99,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  restLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF88', letterSpacing: 2 },
  restCountdown: { fontSize: 80, fontWeight: '800', color: '#4CD964' },
  restSub: { fontSize: 16, color: '#FFFFFF88' },
  skipBtn: {
    marginTop: 16, paddingVertical: 12, paddingHorizontal: 40,
    borderRadius: 30, borderWidth: 1, borderColor: '#FFFFFF44',
  },
  skipText: { color: '#FFFFFF', fontWeight: '700', letterSpacing: 1 },

  content: { padding: 16, gap: 14, paddingBottom: 40 },

  // Progress Box
  progressBox: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 8,
  },
  progressLabel: { fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 0.8 },
  progressValue: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  progressBar: {
    height: 6, backgroundColor: '#E8E8E8', borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#4CD964', borderRadius: 3 },

  // Exercise Card
  exerciseCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 10,
  },
  exerciseName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10,
    backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#EEEEEE',
  },
  setRowDone: { backgroundColor: '#F0FFF4', borderColor: '#C8F5C8' },
  setNumBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#E8E8E8', alignItems: 'center', justifyContent: 'center',
  },
  setNumBoxDone: { backgroundColor: '#4CD964' },
  setNum: { fontSize: 13, fontWeight: '800', color: '#888' },
  setReps: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  setRepsDone: { color: '#2E7D32' },
  tapHint: { fontSize: 11, color: '#BBB', fontWeight: '500' },

  // Buttons
  finishBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2E7D32', borderRadius: 40, paddingVertical: 16,
  },
  finishBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  stopBtn: {
    alignItems: 'center', paddingVertical: 14,
    borderRadius: 40, borderWidth: 1, borderColor: '#FFE0E0', backgroundColor: '#FFF5F5',
  },
  stopBtnText: { color: '#FF3B30', fontWeight: '600', fontSize: 14 },
});