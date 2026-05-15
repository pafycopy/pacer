import { useState, useRef, useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, Easing,
} from 'react-native-reanimated';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Pressable, Vibration, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/store/workoutStore';

const MIN_SPEED_MS = 0.5 / 3.6;
const HOLD_DURATION = 2000;

type RepPhase = 'idle' | 'running' | 'rest' | 'done';

type RepResult = {
  rep: number;
  distance: number;   // km aktual
  duration: number;   // detik
  pace: string;       // "5:23"
  hit: boolean;       // apakah mencapai target jarak
};

export default function IntervalTracker() {
  const router = useRouter();
  const { uid, dateKey, workoutName, distance, pace, reps, restTime } =
    useLocalSearchParams<{
      uid: string;
      dateKey: string;
      workoutName: string;
      distance: string;  // meter
      pace: string;      // min/km desimal
      reps: string;
      restTime: string;  // detik
    }>();

  const { saveTrackingResult } = useWorkoutStore();

  const totalReps = parseInt(reps ?? '1');
  const targetDistM = parseFloat(distance ?? '400');
  const targetDistKm = targetDistM / 1000;
  const restDuration = parseInt(restTime ?? '90');

  const [currentRep, setCurrentRep] = useState(1);
  const [phase, setPhase] = useState<RepPhase>('idle');
  const [isHolding, setIsHolding] = useState(false);

  // State tracking rep ini
  const [repDist, setRepDist] = useState(0);
  const [repTime, setRepTime] = useState(0);
  const [repMovingTime, setRepMovingTime] = useState(0);

  // Rest countdown
  const [restCountdown, setRestCountdown] = useState(restDuration);

  // Total waktu keseluruhan
  const [totalTime, setTotalTime] = useState(0);

  // Hasil per rep
  const [repResults, setRepResults] = useState<RepResult[]>([]);

  const subscription = useRef<any>(null);
  const repTimerRef = useRef<any>(null);
  const restTimerRef = useRef<any>(null);
  const totalTimerRef = useRef<any>(null);
  const holdTimeout = useRef<any>(null);
  const lastLocationRef = useRef<any>(null);
  const isMovingRef = useRef<boolean>(false);

  const holdProgress = useSharedValue(0);

  // ---- Total time counter ----
  useEffect(() => {
    if (phase === 'running' || phase === 'rest') {
      totalTimerRef.current = setInterval(() => {
        setTotalTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(totalTimerRef.current);
    }
    return () => clearInterval(totalTimerRef.current);
  }, [phase]);

  // ---- Rep timer ----
  useEffect(() => {
    if (phase === 'running') {
      repTimerRef.current = setInterval(() => {
        setRepTime((prev) => prev + 1);
        if (isMovingRef.current) setRepMovingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(repTimerRef.current);
    }
    return () => clearInterval(repTimerRef.current);
  }, [phase]);

  // ---- Rest countdown ----
  useEffect(() => {
    if (phase === 'rest') {
      restTimerRef.current = setInterval(() => {
        setRestCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(restTimerRef.current);
            startNextRep();
            return restDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restTimerRef.current);
    }
    return () => clearInterval(restTimerRef.current);
  }, [phase]);

  const toRad = (value: number) => (value * Math.PI) / 180;

  const getDistance = (loc1: any, loc2: any): number => {
    const R = 6371;
    const dLat = toRad(loc2.latitude - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 *
      Math.cos(toRad(loc1.latitude)) *
      Math.cos(toRad(loc2.latitude));
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const calcPace = (dist: number, movingTime: number): string => {
    if (dist === 0 || movingTime === 0) return '--:--';
    const paceSecPerKm = movingTime / dist;
    const minutes = Math.floor(paceSecPerKm / 60);
    const seconds = Math.floor(paceSecPerKm % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatTargetPace = (p: string): string => {
    const val = parseFloat(p);
    if (isNaN(val)) return p;
    const m = Math.floor(val);
    const s = Math.round((val - m) * 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startLocationWatch = async () => {
    subscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 500, distanceInterval: 1 },
      (loc) => {
        const newCoord = loc.coords;
        isMovingRef.current = (newCoord.speed ?? 0) >= MIN_SPEED_MS;

        setRepDist((prev) => {
          const last = lastLocationRef.current;
          if (last) {
            const dist = getDistance(last, newCoord);
            if (dist < 0.001 || (newCoord.accuracy != null && newCoord.accuracy > 20)) return prev;
            lastLocationRef.current = newCoord;
            const newDist = prev + dist;

            // ← Auto stop saat melewati target jarak
            if (newDist >= targetDistKm) {
              setTimeout(() => autoCompleteRep(newDist), 0);
            }

            return newDist;
          }
          lastLocationRef.current = newCoord;
          return prev;
        });
      }
    );
  };

  // Auto stop saat target jarak tercapai
  const autoCompleteRep = async (finalDist: number) => {
    if (phase !== 'running') return;

    subscription.current?.remove();
    subscription.current = null;
    clearInterval(repTimerRef.current);

    // Haptic + vibrasi notifikasi
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 150, 100, 150]);

    const actualPace = calcPace(finalDist, repMovingTime);
    const targetPaceVal = parseFloat(pace ?? '0');
    const paceParts = actualPace.split(':');
    const actualPaceSec = paceParts.length === 2
      ? parseInt(paceParts[0]) * 60 + parseInt(paceParts[1])
      : Infinity;
    const targetPaceSec = targetPaceVal * 60;
    const paceHit = actualPaceSec <= targetPaceSec;

    const result: RepResult = {
      rep: currentRep,
      distance: finalDist,
      duration: repTime,
      pace: actualPace,
      hit: paceHit && finalDist >= targetDistKm,
    };

    setRepResults((prev) => [...prev, result]);

    if (currentRep >= totalReps) {
      // Semua rep selesai
      finishWorkout([...repResults, result]);
    } else {
      // Mulai rest
      setPhase('rest');
      setRestCountdown(restDuration);
    }
  };

  // Manual complete rep (hold to finish rep)
  const manualCompleteRep = () => {
    autoCompleteRep(repDist);
  };

  const startNextRep = async () => {
    clearInterval(restTimerRef.current);

    // Reset state rep
    setCurrentRep((prev) => prev + 1);
    setRepDist(0);
    setRepTime(0);
    setRepMovingTime(0);
    lastLocationRef.current = null;

    await startLocationWatch();
    setPhase('running');
  };

  const skipRest = () => {
    clearInterval(restTimerRef.current);
    startNextRep();
  };

  const finishWorkout = (results: RepResult[]) => {
    clearInterval(totalTimerRef.current);
    clearInterval(restTimerRef.current);
    subscription.current?.remove();

    const totalDist = results.reduce((acc, r) => acc + r.distance, 0);
    const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);

    saveTrackingResult(dateKey, uid, {
      actualDistance: totalDist,
      actualDuration: totalDuration,
      actualPace: calcPace(totalDist, totalDuration),
      completedAt: Date.now(),
      repResults: results,  // simpan per rep untuk ditampilkan di card
    } as any);

    setPhase('done');
  };

  const handleStart = async () => {
    if (phase === 'idle') {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== 'granted') { alert('Izin lokasi ditolak.'); return; }
      await startLocationWatch();
      setPhase('running');
    }
  };

  const handleDiscard = () => {
    Alert.alert('Keluar dari latihan?', 'Progress akan hilang.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar', style: 'destructive',
        onPress: () => {
          subscription.current?.remove();
          clearInterval(totalTimerRef.current);
          clearInterval(restTimerRef.current);
          router.back();
        },
      },
    ]);
  };

  // Progress jarak — 0 sampai 1
  const distProgress = Math.min(repDist / targetDistKm, 1);

  // Hold to finish rep
  const handleHoldStart = () => {
    if (phase !== 'running') return;
    setIsHolding(true);
    holdProgress.value = withTiming(1, { duration: HOLD_DURATION, easing: Easing.linear });
    holdTimeout.current = setTimeout(() => {
      manualCompleteRep();
      setIsHolding(false);
      holdProgress.value = withTiming(0, { duration: 200 });
    }, HOLD_DURATION);
  };

  const handleHoldEnd = () => {
    if (!isHolding) return;
    setIsHolding(false);
    holdProgress.value = withTiming(0, { duration: 200 });
    clearTimeout(holdTimeout.current);
  };

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255, 149, 0, ${0.3 + holdProgress.value * 0.7})`,
    transform: [{ scale: 1 + holdProgress.value * 0.03 }],
  }));

  const animatedFillStyle = useAnimatedStyle(() => ({
    opacity: holdProgress.value * 0.2,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: isHolding ? 0.6 + holdProgress.value * 0.4 : 1,
  }));

  if (phase === 'done') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{workoutName}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.doneContainer}>
          <Text style={styles.doneTitle}>🎉 Sesi Selesai!</Text>
          <Text style={styles.doneSub}>
            {repResults.filter((r) => r.hit).length}/{totalReps} target tercapai
          </Text>

          {/* Summary */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TOTAL WAKTU</Text>
              <Text style={styles.summaryValue}>{formatTime(totalTime)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TOTAL JARAK</Text>
              <Text style={styles.summaryValue}>
                {(repResults.reduce((a, r) => a + r.distance, 0) * 1000).toFixed(0)}m
              </Text>
            </View>
          </View>

          {/* Per rep results */}
          <Text style={styles.repResultTitle}>HASIL PER REPETISI</Text>
          {repResults.map((result) => (
            <View key={result.rep} style={[
              styles.repResultCard,
              { borderLeftColor: result.hit ? '#4CD964' : '#FF3B30' },
            ]}>
              <View style={styles.repResultHeader}>
                <Text style={styles.repResultNum}>REP {result.rep}</Text>
                <View style={[
                  styles.repResultBadge,
                  { backgroundColor: result.hit ? '#F0FFF4' : '#FFF5F5' },
                ]}>
                  <Ionicons
                    name={result.hit ? 'checkmark-circle' : 'close-circle'}
                    size={12}
                    color={result.hit ? '#2E7D32' : '#FF3B30'}
                  />
                  <Text style={[
                    styles.repResultBadgeText,
                    { color: result.hit ? '#2E7D32' : '#FF3B30' },
                  ]}>
                    {result.hit ? 'Target Tercapai' : 'Belum Tercapai'}
                  </Text>
                </View>
              </View>

              <View style={styles.repResultStats}>
                <View style={styles.repResultStat}>
                  <Text style={styles.repResultStatLabel}>JARAK</Text>
                  <Text style={styles.repResultStatValue}>
                    {(result.distance * 1000).toFixed(0)}m
                  </Text>
                  <Text style={styles.repResultStatTarget}>target {targetDistM}m</Text>
                </View>
                <View style={styles.repResultStat}>
                  <Text style={styles.repResultStatLabel}>PACE</Text>
                  <Text style={[
                    styles.repResultStatValue,
                    { color: result.hit ? '#2E7D32' : '#FF3B30' },
                  ]}>
                    {result.pace}/km
                  </Text>
                  <Text style={styles.repResultStatTarget}>
                    target {formatTargetPace(pace ?? '0')}/km
                  </Text>
                </View>
                <View style={styles.repResultStat}>
                  <Text style={styles.repResultStatLabel}>WAKTU</Text>
                  <Text style={styles.repResultStatValue}>{formatTime(result.duration)}</Text>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Selesai</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName}>{workoutName}</Text>
          <Text style={styles.workoutSub}>
            REP {currentRep}/{totalReps} · {formatTime(totalTime)}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Rep indicators */}
      <View style={styles.repIndicators}>
        {Array.from({ length: totalReps }).map((_, i) => {
          const done = i < repResults.length;
          const active = i === currentRep - 1 && phase === 'running';
          const result = repResults[i];
          return (
            <View key={i} style={[
              styles.repDot,
              done && { backgroundColor: result?.hit ? '#4CD964' : '#FF3B30' },
              active && { backgroundColor: '#FF9500', transform: [{ scale: 1.2 }] },
            ]} />
          );
        })}
      </View>

      <View style={styles.container}>

        {/* REST OVERLAY */}
        {phase === 'rest' && (
          <View style={styles.restOverlay}>
            <Text style={styles.restLabel}>ISTIRAHAT</Text>
            <Text style={styles.restCountdown}>{restCountdown}</Text>
            <Text style={styles.restSub}>detik</Text>
            <Text style={styles.restNext}>Rep {currentRep + 1} berikutnya</Text>
            <TouchableOpacity style={styles.skipBtn} onPress={skipRest}>
              <Text style={styles.skipText}>SKIP ▶</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CENTER */}
        <View style={styles.centerContent}>
          {/* Progress jarak */}
          <View style={styles.distProgressContainer}>
            <View style={styles.distProgressBar}>
              <View style={[styles.distProgressFill, { width: `${distProgress * 100}%` as any }]} />
            </View>
            <Text style={styles.distProgressText}>
              {(repDist * 1000).toFixed(0)}m / {targetDistM}m
            </Text>
          </View>

          <Text style={styles.label}>JARAK REP INI</Text>
          <Text style={styles.distance}>
            {(repDist * 1000).toFixed(0)}
            <Text style={styles.unit}>m</Text>
          </Text>

          <Text style={styles.targetHint}>
            Target: {targetDistM}m @ {formatTargetPace(pace ?? '0')}/km
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.statValue}>{formatTime(repTime)}</Text>
              <Text style={styles.statSub}>MM:SS</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>AVG PACE</Text>
              <Text style={[
                styles.statValue,
                phase === 'running' && (() => {
                  const p = parseFloat(pace ?? '0');
                  const parts = calcPace(repDist, repMovingTime).split(':');
                  const actualSec = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : 0;
                  const targetSec = p * 60;
                  return actualSec <= targetSec && actualSec > 0
                    ? { color: '#2E7D32' }
                    : actualSec > 0 ? { color: '#FF3B30' } : {};
                })(),
              ]}>
                {calcPace(repDist, repMovingTime)}
              </Text>
              <Text style={styles.statSub}>MIN/KM</Text>
            </View>
          </View>
        </View>

        {/* BUTTONS */}
        <View>
          {phase === 'idle' && (
            <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#63EA7B' }]} onPress={handleStart}>
              <Text style={styles.mainBtnText}>MULAI INTERVAL</Text>
            </TouchableOpacity>
          )}

          {phase === 'running' && (
            <>
              <Text style={styles.bottomHint}>
                {isHolding ? 'Tahan untuk selesaikan rep ini...' : 'Otomatis berhenti saat target jarak tercapai'}
              </Text>
              <Pressable onPressIn={handleHoldStart} onPressOut={handleHoldEnd}>
                <Animated.View style={[styles.holdBtn, animatedBorderStyle]}>
                  <Animated.View style={[styles.holdBtnFill, animatedFillStyle]} />
                  <Animated.Text style={[styles.holdBtnText, animatedTextStyle]}>
                    {isHolding ? '⏹ SELESAIKAN REP...' : 'HOLD TO FINISH REP'}
                  </Animated.Text>
                </Animated.View>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F5F4' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerCenter: { alignItems: 'center' },
  workoutName: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: '#111' },
  workoutSub: { fontSize: 11, color: '#888', marginTop: 2 },
  headerTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: '#111' },

  // Rep indicators
  repIndicators: {
    flexDirection: 'row', gap: 6, justifyContent: 'center',
    paddingVertical: 10, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    flexWrap: 'wrap', paddingHorizontal: 16,
  },
  repDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0',
  },

  container: {
    flex: 1, paddingHorizontal: 20, paddingBottom: 30,
    justifyContent: 'space-between',
  },
  centerContent: { alignItems: 'center', gap: 8, paddingTop: 16 },

  // Distance progress bar
  distProgressContainer: { width: '100%', gap: 4 },
  distProgressBar: {
    height: 8, backgroundColor: '#E8E8E8', borderRadius: 4, overflow: 'hidden',
  },
  distProgressFill: {
    height: '100%', backgroundColor: '#FF9500', borderRadius: 4,
  },
  distProgressText: { fontSize: 11, color: '#888', textAlign: 'right' },

  label: { fontSize: 13, letterSpacing: 1.5, color: '#666' },
  distance: { fontSize: 64, fontWeight: '900', color: '#000', lineHeight: 72 },
  unit: { fontSize: 28, fontWeight: '700', color: '#555' },
  targetHint: { fontSize: 12, color: '#888' },

  statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  statCard: {
    flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '600', letterSpacing: 1 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#000', marginTop: 4 },
  statSub: { fontSize: 9, color: '#AAA', marginTop: 2 },

  // Rest overlay
  restOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#1A1A2Eee', zIndex: 99,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  restLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF88', letterSpacing: 2 },
  restCountdown: { fontSize: 80, fontWeight: '800', color: '#4CD964' },
  restSub: { fontSize: 16, color: '#FFFFFF88' },
  restNext: { fontSize: 13, color: '#FFFFFF66', marginTop: 4 },
  skipBtn: {
    marginTop: 16, paddingVertical: 12, paddingHorizontal: 40,
    borderRadius: 30, borderWidth: 1, borderColor: '#FFFFFF44',
  },
  skipText: { color: '#FFFFFF', fontWeight: '700', letterSpacing: 1 },

  // Buttons
  mainBtn: {
    borderRadius: 999, height: 58,
    justifyContent: 'center', alignItems: 'center',
  },
  mainBtnText: { color: '#111', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  bottomHint: {
    textAlign: 'center', color: '#888', fontSize: 12, marginBottom: 12,
  },
  holdBtn: {
    height: 58, borderRadius: 999,
    borderWidth: 2, borderColor: 'rgba(255,149,0,0.3)',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  holdBtnFill: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FF9500', borderRadius: 999,
  },
  holdBtnText: { color: '#FF9500', fontWeight: '700', letterSpacing: 1, fontSize: 14 },

  // Done screen
  doneContainer: { padding: 20, gap: 16, paddingBottom: 40 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  doneSub: { fontSize: 15, color: '#888', textAlign: 'center' },
  summaryBox: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#FFFFFF22' },
  summaryLabel: { fontSize: 10, fontWeight: '600', color: '#FFFFFF88', letterSpacing: 0.5 },
  summaryValue: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  repResultTitle: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8 },
  repResultCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderLeftWidth: 4, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  repResultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  repResultNum: { fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  repResultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  repResultBadgeText: { fontSize: 11, fontWeight: '700' },
  repResultStats: { flexDirection: 'row', justifyContent: 'space-between' },
  repResultStat: { alignItems: 'center', gap: 2 },
  repResultStatLabel: { fontSize: 10, fontWeight: '600', color: '#AAA', letterSpacing: 0.5 },
  repResultStatValue: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  repResultStatTarget: { fontSize: 10, color: '#BBB' },
  doneBtn: {
    backgroundColor: '#1A1A2E', borderRadius: 40, paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});