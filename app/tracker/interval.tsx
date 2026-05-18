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
import { useFinishWorkout } from '@/hooks/useFinishWorkout';

// ─── Konstanta filter GPS ───────────────────────────────────────────────────
const MIN_SPEED_MS       = 1.0;    // minimal 1.0 m/s (~3.6 km/h) baru dihitung bergerak
const MIN_ACCURACY_M     = 15;     // tolak titik GPS dengan akurasi > 15 meter
const MIN_DIST_THRESHOLD = 0.003;  // minimal 3 meter (0.003 km) per update agar dihitung
const HOLD_DURATION      = 2000;

type RepPhase = 'idle' | 'running' | 'rest' | 'done';

type RepResult = {
  rep: number;
  distance: number;
  duration: number;
  pace: string;
  hit: boolean;
};

export default function IntervalTracker() {
  const router = useRouter();
  const { uid, dateKey, workoutName, distance, pace, reps, restTime } =
    useLocalSearchParams<{
      uid: string;
      dateKey: string;
      workoutName: string;
      distance: string; // dalam kilometer
      pace: string;
      reps: string;
      restTime: string;
    }>();

  const totalReps      = parseInt(reps ?? '1');
  const targetDistKm   = parseFloat(distance ?? '0');
  const restDuration   = parseInt(restTime ?? '0');

  const [currentRep,    setCurrentRep]    = useState(1);
  const [phase,         setPhase]         = useState<RepPhase>('idle');
  const [isHolding,     setIsHolding]     = useState(false);
  const [repDist,       setRepDist]       = useState(0);
  const [repTime,       setRepTime]       = useState(0);
  const [repMovingTime, setRepMovingTime] = useState(0);
  const [restCountdown, setRestCountdown] = useState(restDuration);
  const [totalTime,     setTotalTime]     = useState(0);
  const [repResults,    setRepResults]    = useState<RepResult[]>([]);

  const subscription      = useRef<any>(null);
  const repTimerRef       = useRef<any>(null);
  const restTimerRef      = useRef<any>(null);
  const totalTimerRef     = useRef<any>(null);
  const holdTimeout       = useRef<any>(null);
  const lastLocationRef   = useRef<any>(null);
  const isMovingRef       = useRef<boolean>(false);
  const phaseRef          = useRef<RepPhase>('idle');
  const repDistRef        = useRef<number>(0);
  const repMovingTimeRef  = useRef<number>(0);
  const repTimeRef        = useRef<number>(0);
  const currentRepRef     = useRef<number>(1);

  // ─── Kalman filter state per sumbu ────────────────────────────────────────
  const kalmanRef = useRef({
    lat: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
    lon: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
  });

  const holdProgress = useSharedValue(0);

  // ─── Hook finish ───────────────────────────────────────────────────────────
  const { finish } = useFinishWorkout(
    dateKey,
    uid,
    [repTimerRef, restTimerRef, totalTimerRef],
    subscription,
    {
      hasOwnDoneScreen: true,
      onAfterSave: () => setPhase('done'),
    },
  );

  // Sync refs
  useEffect(() => { phaseRef.current = phase; },               [phase]);
  useEffect(() => { repDistRef.current = repDist; },           [repDist]);
  useEffect(() => { repMovingTimeRef.current = repMovingTime; },[repMovingTime]);
  useEffect(() => { repTimeRef.current = repTime; },           [repTime]);
  useEffect(() => { currentRepRef.current = currentRep; },     [currentRep]);

  // Total timer
  useEffect(() => {
    if (phase === 'running' || phase === 'rest') {
      totalTimerRef.current = setInterval(() => setTotalTime((p) => p + 1), 1000);
    } else {
      clearInterval(totalTimerRef.current);
    }
    return () => clearInterval(totalTimerRef.current);
  }, [phase]);

  // Rep timer — hanya tambah movingTime kalau benar-benar bergerak
  useEffect(() => {
    if (phase === 'running') {
      repTimerRef.current = setInterval(() => {
        setRepTime((p) => p + 1);
        if (isMovingRef.current) setRepMovingTime((p) => p + 1);
      }, 1000);
    } else {
      clearInterval(repTimerRef.current);
    }
    return () => clearInterval(repTimerRef.current);
  }, [phase]);

  // Rest countdown
  useEffect(() => {
    if (phase === 'rest') {
      restTimerRef.current = setInterval(() => {
        setRestCountdown((p) => {
          if (p <= 1) {
            clearInterval(restTimerRef.current);
            startNextRep();
            return restDuration;
          }
          return p - 1;
        });
      }, 1000);
    } else {
      clearInterval(restTimerRef.current);
    }
    return () => clearInterval(restTimerRef.current);
  }, [phase]);

  // ─── Kalman filter 1D ─────────────────────────────────────────────────────
  const kalmanUpdate = (axis: 'lat' | 'lon', measurement: number): number => {
    const k = kalmanRef.current[axis];
    if (!k.initialized) {
      k.estimate     = measurement;
      k.initialized  = true;
      return measurement;
    }
    k.errorEstimate += 0.0001; // process noise
    k.gain           = k.errorEstimate / (k.errorEstimate + k.errorMeasure);
    k.estimate       = k.estimate + k.gain * (measurement - k.estimate);
    k.errorEstimate  = (1 - k.gain) * k.errorEstimate;
    return k.estimate;
  };

  const resetKalman = () => {
    kalmanRef.current = {
      lat: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
      lon: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
    };
  };

  // ─── Haversine ────────────────────────────────────────────────────────────
  const toRad = (v: number) => (v * Math.PI) / 180;

  const getDistance = (loc1: any, loc2: any): number => {
    const R    = 6371;
    const dLat = toRad(loc2.latitude  - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const a    =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 *
      Math.cos(toRad(loc1.latitude)) *
      Math.cos(toRad(loc2.latitude));
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ─── Helper format ────────────────────────────────────────────────────────
  const calcPace = (dist: number, movingTime: number): string => {
    if (dist === 0 || movingTime === 0) return '--:--';
    const s = movingTime / dist;
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const formatTargetPace = (p: string): string => {
    const val = parseFloat(p);
    if (isNaN(val)) return p;
    const m = Math.floor(val);
    const s = Math.round((val - m) * 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const isPaceHit = (actualPace: string): boolean => {
    const targetPaceVal = parseFloat(pace ?? '0');
    const parts = actualPace.split(':');
    if (parts.length !== 2) return false;
    const actualSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return actualSec <= targetPaceVal * 60;
  };

  // ─── GPS watch ────────────────────────────────────────────────────────────
  const startLocationWatch = async () => {
    subscription.current = await Location.watchPositionAsync(
      {
        accuracy:         Location.Accuracy.BestForNavigation,
        timeInterval:     1000,   // update per 1 detik (bukan 500ms) → lebih stabil
        distanceInterval: 2,      // minimal bergerak 2 meter baru trigger update
      },
      (loc) => {
        const coord    = loc.coords;
        const accuracy = coord.accuracy ?? 999;
        const speed    = coord.speed ?? 0;

        // 1. Tolak titik dengan akurasi buruk
        if (accuracy > MIN_ACCURACY_M) return;

        // 2. Tentukan apakah sedang bergerak berdasarkan speed sensor
        isMovingRef.current = speed >= MIN_SPEED_MS;

        // 3. Kalman filter pada koordinat
        const filteredLat = kalmanUpdate('lat', coord.latitude);
        const filteredLon = kalmanUpdate('lon', coord.longitude);
        const filteredCoord = { latitude: filteredLat, longitude: filteredLon };

        setRepDist((prev) => {
          const last = lastLocationRef.current;
          if (!last) {
            lastLocationRef.current = filteredCoord;
            return prev;
          }

          const dist = getDistance(last, filteredCoord);

          // 4. Tolak jarak terlalu kecil (noise GPS diam)
          if (dist < MIN_DIST_THRESHOLD) return prev;

          // 5. Tolak jarak tidak wajar > 0.1 km per update (teleport / spike)
          if (dist > 0.1) return prev;

          // 6. Tolak jika tidak bergerak menurut sensor speed
          if (!isMovingRef.current) return prev;

          lastLocationRef.current = filteredCoord;
          const newDist = prev + dist;

          if (newDist >= targetDistKm && phaseRef.current === 'running') {
            setTimeout(() => triggerAutoComplete(newDist), 0);
          }
          return newDist;
        });
      }
    );
  };

  // ─── Logic rep ────────────────────────────────────────────────────────────
  const triggerAutoComplete = async (finalDist: number) => {
    if (phaseRef.current !== 'running') return;

    subscription.current?.remove();
    subscription.current = null;
    clearInterval(repTimerRef.current);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 150, 100, 150]);

    const actualPace = calcPace(finalDist, repMovingTimeRef.current);
    const hit        = isPaceHit(actualPace) && finalDist >= targetDistKm;

    const result: RepResult = {
      rep:      currentRepRef.current,
      distance: finalDist,
      duration: repTimeRef.current,
      pace:     actualPace,
      hit,
    };

    setRepResults((prev) => {
      const updated = [...prev, result];
      if (currentRepRef.current >= totalReps) {
        finishWorkout(updated);
      } else {
        setPhase('rest');
        setRestCountdown(restDuration);
      }
      return updated;
    });
  };

  const startNextRep = async () => {
    clearInterval(restTimerRef.current);
    setCurrentRep((p) => p + 1);
    setRepDist(0);
    setRepTime(0);
    setRepMovingTime(0);
    lastLocationRef.current = null;
    resetKalman(); // reset filter untuk rep baru
    await startLocationWatch();
    setPhase('running');
  };

  const skipRest = () => {
    clearInterval(restTimerRef.current);
    startNextRep();
  };

  const finishWorkout = (results: RepResult[]) => {
    const totalDist     = results.reduce((a, r) => a + r.distance, 0);
    const totalDuration = results.reduce((a, r) => a + r.duration, 0);

    // hook otomatis: bersihkan timer + GPS + save store + panggil onAfterSave (setPhase done)
    finish({
      actualDistance: totalDist,
      actualDuration: totalDuration,
      actualPace:     calcPace(totalDist, totalDuration),
      completedAt:    Date.now(),
      repResults:     results,
    });
  };

  const handleStart = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { alert('Izin lokasi ditolak.'); return; }
    resetKalman();
    await startLocationWatch();
    setPhase('running');
  };

  const handleDiscard = () => {
    Alert.alert('Keluar?', 'Progress akan hilang.', [
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

  // ─── Hold button ──────────────────────────────────────────────────────────
  const distProgress = Math.min(repDist / targetDistKm, 1);

  const handleHoldStart = () => {
    if (phase !== 'running') return;
    setIsHolding(true);
    holdProgress.value = withTiming(1, { duration: HOLD_DURATION, easing: Easing.linear });
    holdTimeout.current = setTimeout(() => {
      triggerAutoComplete(repDistRef.current);
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
    borderColor: `rgba(255,149,0,${0.3 + holdProgress.value * 0.7})`,
    transform:   [{ scale: 1 + holdProgress.value * 0.03 }],
  }));
  const animatedFillStyle = useAnimatedStyle(() => ({ opacity: holdProgress.value * 0.2 }));
  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: isHolding ? 0.6 + holdProgress.value * 0.4 : 1,
  }));

  // ─── Done screen ──────────────────────────────────────────────────────────
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

          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TOTAL WAKTU</Text>
              <Text style={styles.summaryValue}>{formatTime(totalTime)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TOTAL JARAK</Text>
              <Text style={styles.summaryValue}>
                {repResults.reduce((a, r) => a + r.distance, 0).toFixed(2)} km
              </Text>
            </View>
          </View>

          <Text style={styles.repResultTitle}>HASIL PER REPETISI</Text>

          {repResults.map((result) => (
            <View key={result.rep} style={[
              styles.repResultCard,
              { borderLeftColor: result.hit ? '#4CD964' : '#FF3B30' },
            ]}>
              <View style={styles.repResultHeader}>
                <Text style={styles.repResultNum}>REP {result.rep}</Text>
                <View style={[styles.repResultBadge, { backgroundColor: result.hit ? '#F0FFF4' : '#FFF5F5' }]}>
                  <Ionicons
                    name={result.hit ? 'checkmark-circle' : 'close-circle'}
                    size={12} color={result.hit ? '#2E7D32' : '#FF3B30'}
                  />
                  <Text style={[styles.repResultBadgeText, { color: result.hit ? '#2E7D32' : '#FF3B30' }]}>
                    {result.hit ? 'Target Tercapai' : 'Belum Tercapai'}
                  </Text>
                </View>
              </View>
              <View style={styles.repResultStats}>
                <View style={styles.repResultStat}>
                  <Text style={styles.repResultStatLabel}>JARAK</Text>
                  <Text style={styles.repResultStatValue}>{result.distance.toFixed(2)} km</Text>
                  <Text style={styles.repResultStatTarget}>target {targetDistKm} km</Text>
                </View>
                <View style={styles.repResultStat}>
                  <Text style={styles.repResultStatLabel}>PACE</Text>
                  <Text style={[styles.repResultStatValue, { color: result.hit ? '#2E7D32' : '#FF3B30' }]}>
                    {result.pace}/km
                  </Text>
                  <Text style={styles.repResultStatTarget}>target {formatTargetPace(pace ?? '0')}/km</Text>
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

  // ─── Running screen ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName}>{workoutName}</Text>
          <Text style={styles.workoutSub}>REP {currentRep}/{totalReps} · {formatTime(totalTime)}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Rep indicators */}
      <View style={styles.repIndicators}>
        {Array.from({ length: totalReps }).map((_, i) => {
          const done   = i < repResults.length;
          const active = i === currentRep - 1 && phase === 'running';
          const result = repResults[i];
          return (
            <View key={i} style={[
              styles.repDot,
              done   && { backgroundColor: result?.hit ? '#4CD964' : '#FF3B30' },
              active && { backgroundColor: '#FF9500', transform: [{ scale: 1.2 }] },
            ]} />
          );
        })}
      </View>

      <View style={styles.container}>
        {/* Rest overlay */}
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

        {/* Center */}
        <View style={styles.centerContent}>
          <View style={styles.distProgressContainer}>
            <View style={styles.distProgressBar}>
              <View style={[styles.distProgressFill, { width: `${distProgress * 100}%` as any }]} />
            </View>
            <Text style={styles.distProgressText}>
              {repDist.toFixed(2)} km / {targetDistKm} km
            </Text>
          </View>

          <Text style={styles.label}>JARAK REP INI</Text>
          <Text style={styles.distance}>
            {repDist.toFixed(2)}
            <Text style={styles.unit}> km</Text>
          </Text>
          <Text style={styles.targetHint}>
            Target: {targetDistKm} km @ {formatTargetPace(pace ?? '0')}/km
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
                (() => {
                  const cp = calcPace(repDist, repMovingTime);
                  if (cp === '--:--') return {};
                  return isPaceHit(cp) ? { color: '#2E7D32' } : { color: '#FF3B30' };
                })(),
              ]}>
                {calcPace(repDist, repMovingTime)}
              </Text>
              <Text style={styles.statSub}>MIN/KM</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View>
          {phase === 'idle' && (
            <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#63EA7B' }]} onPress={handleStart}>
              <Text style={styles.mainBtnText}>MULAI INTERVAL</Text>
            </TouchableOpacity>
          )}

          {phase === 'running' && (
            <>
              <Text style={styles.bottomHint}>
                {isHolding
                  ? 'Tahan untuk selesaikan rep...'
                  : 'Otomatis berhenti saat target jarak tercapai'}
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
  repIndicators: {
    flexDirection: 'row', gap: 6, justifyContent: 'center',
    paddingVertical: 10, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    flexWrap: 'wrap', paddingHorizontal: 16,
  },
  repDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' },
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 30, justifyContent: 'space-between' },
  centerContent: { alignItems: 'center', gap: 8, paddingTop: 16 },
  distProgressContainer: { width: '100%', gap: 4 },
  distProgressBar: { height: 8, backgroundColor: '#E8E8E8', borderRadius: 4, overflow: 'hidden' },
  distProgressFill: { height: '100%', backgroundColor: '#FF9500', borderRadius: 4 },
  distProgressText: { fontSize: 11, color: '#888', textAlign: 'right' },
  label: { fontSize: 13, letterSpacing: 1.5, color: '#666' },
  distance: { fontSize: 64, fontWeight: '900', color: '#000', lineHeight: 72 },
  unit: { fontSize: 28, fontWeight: '700', color: '#555' },
  targetHint: { fontSize: 12, color: '#888' },
  statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  statCard: { flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '600', letterSpacing: 1 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#000', marginTop: 4 },
  statSub: { fontSize: 9, color: '#AAA', marginTop: 2 },
  restOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#1A1A2Eee', zIndex: 99,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  restLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF88', letterSpacing: 2 },
  restCountdown: { fontSize: 80, fontWeight: '800', color: '#4CD964' },
  restSub: { fontSize: 16, color: '#FFFFFF88' },
  restNext: { fontSize: 13, color: '#FFFFFF66', marginTop: 4 },
  skipBtn: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 30, borderWidth: 1, borderColor: '#FFFFFF44' },
  skipText: { color: '#FFFFFF', fontWeight: '700', letterSpacing: 1 },
  mainBtn: { borderRadius: 999, height: 58, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { color: '#111', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  bottomHint: { textAlign: 'center', color: '#888', fontSize: 12, marginBottom: 12 },
  holdBtn: {
    height: 58, borderRadius: 999, borderWidth: 2,
    borderColor: 'rgba(255,149,0,0.3)', backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  holdBtnFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FF9500', borderRadius: 999 },
  holdBtnText: { color: '#FF9500', fontWeight: '700', letterSpacing: 1, fontSize: 14 },
  doneContainer: { padding: 20, gap: 16, paddingBottom: 40 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  doneSub: { fontSize: 15, color: '#888', textAlign: 'center' },
  summaryBox: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#FFFFFF22' },
  summaryLabel: { fontSize: 10, fontWeight: '600', color: '#FFFFFF88', letterSpacing: 0.5 },
  summaryValue: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  repResultTitle: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8 },
  repResultCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderLeftWidth: 4, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  repResultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  repResultNum: { fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  repResultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  repResultBadgeText: { fontSize: 11, fontWeight: '700' },
  repResultStats: { flexDirection: 'row', justifyContent: 'space-between' },
  repResultStat: { alignItems: 'center', gap: 2 },
  repResultStatLabel: { fontSize: 10, fontWeight: '600', color: '#AAA', letterSpacing: 0.5 },
  repResultStatValue: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  repResultStatTarget: { fontSize: 10, color: '#BBB' },
  doneBtn: { backgroundColor: '#1A1A2E', borderRadius: 40, paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});