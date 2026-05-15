import { useState, useRef, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Alert, View, Text, StyleSheet,
  TouchableOpacity, Pressable, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/store/workoutStore';

const MIN_SPEED_MS = 0.5 / 3.6;
const HOLD_DURATION = 2000;

type TempoPhase = 'warmup' | 'tempo' | 'cooldown';

type PhaseData = {
  key: TempoPhase;
  label: string;
  color: string;
  emoji: string;
  targetDistance: string;
  targetPace: string;
};

type PhaseResult = {
  actualDistance: number;
  actualDuration: number;
  actualPace: string;
};

export default function TempoTracker() {
  const router = useRouter();
  const {
    uid, dateKey, workoutName,
    warmupDistance, warmupPace,
    tempoDistance, targetPace,
    cooldownDistance, cooldownPace,
  } = useLocalSearchParams<{
    uid: string;
    dateKey: string;
    workoutName: string;
    warmupDistance: string;
    warmupPace: string;
    tempoDistance: string;
    targetPace: string;
    cooldownDistance: string;
    cooldownPace: string;
  }>();

  const { saveTrackingResult } = useWorkoutStore();

  const phases: PhaseData[] = [
    {
      key: 'warmup',
      label: 'Warm Up',
      color: '#FF9500',
      emoji: '🔥',
      targetDistance: warmupDistance ?? '0',
      targetPace: warmupPace ?? '0',
    },
    {
      key: 'tempo',
      label: 'Tempo Session',
      color: '#2E7D32',
      emoji: '⚡',
      targetDistance: tempoDistance ?? '0',
      targetPace: targetPace ?? '0',
    },
    {
      key: 'cooldown',
      label: 'Cool Down',
      color: '#007AFF',
      emoji: '❄️',
      targetDistance: cooldownDistance ?? '0',
      targetPace: cooldownPace ?? '0',
    },
  ];

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [isHolding, setIsHolding] = useState(false);

  // Tracking per fase
  const [phaseResults, setPhaseResults] = useState<Record<TempoPhase, PhaseResult>>({
    warmup:   { actualDistance: 0, actualDuration: 0, actualPace: '--:--' },
    tempo:    { actualDistance: 0, actualDuration: 0, actualPace: '--:--' },
    cooldown: { actualDistance: 0, actualDuration: 0, actualPace: '--:--' },
  });

  // State tracking fase ini
  const [phaseDist, setPhaseDist] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const [phaseMovingTime, setPhaseMovingTime] = useState(0);

  const subscription = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const holdTimeout = useRef<any>(null);
  const lastLocationRef = useRef<any>(null);
  const isMovingRef = useRef<boolean>(false);

  const holdProgress = useSharedValue(0);

  const currentPhase = phases[currentPhaseIndex];
  const isLastPhase = currentPhaseIndex === phases.length - 1;
  const allDone = currentPhaseIndex >= phases.length;

  // ---- Timer ----
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        setPhaseTime((prev) => prev + 1);
        if (isMovingRef.current) setPhaseMovingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const calcPace = (dist: number, movingTime: number): string => {
    if (dist === 0 || movingTime === 0) return '--:--';
    const paceSecPerKm = movingTime / dist;
    const minutes = Math.floor(paceSecPerKm / 60);
    const seconds = Math.floor(paceSecPerKm % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const startLocationWatch = async () => {
    subscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 3 },
      (loc) => {
        const newCoord = loc.coords;
        isMovingRef.current = (newCoord.speed ?? 0) >= MIN_SPEED_MS;
        setPhaseDist((prev) => {
          const last = lastLocationRef.current;
          if (last) {
            const dist = getDistance(last, newCoord);
            if (dist < 0.003 || (newCoord.accuracy != null && newCoord.accuracy > 20)) return prev;
            lastLocationRef.current = newCoord;
            return prev + dist;
          }
          lastLocationRef.current = newCoord;
          return prev;
        });
      }
    );
  };

  const handleStart = async () => {
    if (status === 'idle') {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== 'granted') { alert('Izin lokasi ditolak.'); return; }
      await startLocationWatch();
      setStatus('running');
    } else if (status === 'running') {
      subscription.current?.remove();
      subscription.current = null;
      isMovingRef.current = false;
      lastLocationRef.current = null;
      setStatus('paused');
    } else {
      await startLocationWatch();
      setStatus('running');
    }
  };

  // Selesaikan fase ini → simpan result → lanjut ke fase berikutnya
  const completePhase = async () => {
    subscription.current?.remove();
    subscription.current = null;
    isMovingRef.current = false;
    lastLocationRef.current = null;

    const pace = calcPace(phaseDist, phaseMovingTime);
    const phaseKey = currentPhase.key;

    // Simpan result fase ini
    setPhaseResults((prev) => ({
      ...prev,
      [phaseKey]: {
        actualDistance: phaseDist,
        actualDuration: phaseTime,
        actualPace: pace,
      },
    }));

    // Haptic feedback fase selesai
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 100, 80, 200]);

    if (isLastPhase) {
      // Semua fase selesai → simpan ke store
      finishWorkout(phaseKey, phaseDist, phaseTime, pace);
    } else {
      // Lanjut ke fase berikutnya → reset state fase
      setCurrentPhaseIndex((prev) => prev + 1);
      setPhaseDist(0);
      setPhaseTime(0);
      setPhaseMovingTime(0);
      setStatus('idle');
    }
  };

  const finishWorkout = (
    lastPhaseKey: TempoPhase,
    lastDist: number,
    lastDuration: number,
    lastPace: string,
  ) => {
    const results = {
      ...phaseResults,
      [lastPhaseKey]: {
        actualDistance: lastDist,
        actualDuration: lastDuration,
        actualPace: lastPace,
      },
    };

    const totalDist = results.warmup.actualDistance +
      results.tempo.actualDistance +
      results.cooldown.actualDistance;

    const totalDuration = results.warmup.actualDuration +
      results.tempo.actualDuration +
      results.cooldown.actualDuration;

    saveTrackingResult(dateKey, uid, {
      actualDistance: totalDist,
      actualDuration: totalDuration,
      actualPace: results.tempo.actualPace, // pace utama dari sesi tempo
      completedAt: Date.now(),
      // Simpan per-fase untuk ditampilkan di card
      phaseResults: {
        warmup: results.warmup,
        tempo: results.tempo,
        cooldown: results.cooldown,
      },
    } as any);

    router.back();
  };

  const handleDiscard = () => {
    Alert.alert('Keluar dari latihan?', 'Progress latihan akan hilang.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar', style: 'destructive',
        onPress: () => { subscription.current?.remove(); router.back(); },
      },
    ]);
  };

  // Hold to Stop
  const handleHoldStart = () => {
    setIsHolding(true);
    holdProgress.value = withTiming(1, { duration: HOLD_DURATION, easing: Easing.linear });
    holdTimeout.current = setTimeout(() => {
      Vibration.vibrate([0, 100, 80, 100, 80, 300]);
      completePhase();
    }, HOLD_DURATION);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    holdProgress.value = withTiming(0, { duration: 200 });
    clearTimeout(holdTimeout.current);
  };

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(${currentPhaseIndex === 0 ? '255,149,0' : currentPhaseIndex === 1 ? '46,125,50' : '0,122,255'}, ${0.3 + holdProgress.value * 0.7})`,
    transform: [{ scale: 1 + holdProgress.value * 0.03 }],
  }));

  const animatedFillStyle = useAnimatedStyle(() => ({
    opacity: holdProgress.value * 0.15,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: isHolding ? 0.6 + holdProgress.value * 0.4 : 1,
  }));

  const phaseColor = currentPhase?.color ?? '#888';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName}>{workoutName || 'TEMPO RUN'}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Phase Stepper */}
      <View style={styles.stepper}>
        {phases.map((phase, index) => {
          const isDone = index < currentPhaseIndex;
          const isActive = index === currentPhaseIndex;
          return (
            <View key={phase.key} style={styles.stepperItem}>
              <View style={[
                styles.stepperDot,
                isDone && { backgroundColor: phase.color, borderColor: phase.color },
                isActive && { borderColor: phase.color, borderWidth: 2 },
              ]}>
                {isDone
                  ? <Ionicons name="checkmark" size={12} color="#fff" />
                  : <Text style={[styles.stepperNum, isActive && { color: phase.color }]}>
                      {index + 1}
                    </Text>
                }
              </View>
              <Text style={[
                styles.stepperLabel,
                isActive && { color: phase.color, fontWeight: '700' },
                isDone && { color: '#AAA' },
              ]}>
                {phase.emoji} {phase.label}
              </Text>
              {index < phases.length - 1 && (
                <View style={[styles.stepperLine, isDone && { backgroundColor: phase.color }]} />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.container}>
        {/* Badge */}
        <View>
          {status !== 'idle' && (
            <View style={[styles.badge, { backgroundColor: status === 'running' ? phaseColor : '#FF9500' }]}>
              <Text style={styles.badgeText}>
                {status === 'running'
                  ? isMovingRef.current ? 'TRACKING' : 'DIAM'
                  : 'PAUSED'}
              </Text>
            </View>
          )}
        </View>

        {/* Distance */}
        <View>
          <Text style={styles.phaseTitle}>
            {currentPhase?.emoji} {currentPhase?.label}
          </Text>
          <Text style={styles.label}>DISTANCE</Text>
          <Text style={[styles.distance, { color: phaseColor }]}>
            {phaseDist.toFixed(2)}
            <Text style={styles.unit}> KM</Text>
          </Text>

          {/* Target */}
          <Text style={styles.targetText}>
            Target: {currentPhase?.targetDistance} km @ {(() => {
              const p = parseFloat(currentPhase?.targetPace ?? '0');
              if (isNaN(p)) return currentPhase?.targetPace;
              const m = Math.floor(p);
              const s = Math.round((p - m) * 60);
              return `${m}:${s < 10 ? '0' : ''}${s}/km`;
            })()}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.statValue}>{formatTime(phaseTime)}</Text>
              <Text style={styles.statSub}>MM:SS</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>AVG PACE</Text>
              <Text style={styles.statValue}>{calcPace(phaseDist, phaseMovingTime)}</Text>
              <Text style={styles.statSub}>MIN/KM</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View>
          {status !== 'idle' && (
            <Text style={styles.bottomText}>
              {isHolding
                ? `Selesaikan ${currentPhase?.label}...`
                : isLastPhase ? 'Tahan untuk selesaikan sesi' : `Tahan untuk lanjut ke fase berikutnya`}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: status === 'paused' ? '#FFB84D' : phaseColor }]}
            onPress={handleStart}
          >
            <Text style={styles.mainBtnText}>
              {status === 'idle' ? `MULAI ${currentPhase?.label.toUpperCase()}`
                : status === 'running' ? '⏸ PAUSE'
                : '▶ RESUME'}
            </Text>
          </TouchableOpacity>

          {status !== 'idle' && (
            <Pressable onPressIn={handleHoldStart} onPressOut={handleHoldEnd}>
              <Animated.View style={[styles.finishBtn, animatedBorderStyle]}>
                <Animated.View style={[styles.finishBtnFill, { backgroundColor: phaseColor }, animatedFillStyle]} />
                <Animated.Text style={[styles.finishText, { color: phaseColor }, animatedTextStyle]}>
                  {isHolding
                    ? isLastPhase ? '✓ SELESAI...' : '→ FASE BERIKUTNYA...'
                    : isLastPhase ? 'HOLD TO FINISH' : 'HOLD TO NEXT PHASE'}
                </Animated.Text>
              </Animated.View>
            </Pressable>
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
  },
  headerCenter: { alignItems: 'center' },
  workoutName: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: '#111' },

  // Stepper
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  stepperItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepperDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  stepperNum: { fontSize: 11, fontWeight: '700', color: '#AAA' },
  stepperLabel: { fontSize: 10, fontWeight: '600', color: '#AAA', textAlign: 'center' },
  stepperLine: {
    position: 'absolute', top: 12, right: -20,
    width: 40, height: 1, backgroundColor: '#E0E0E0',
  },

  container: {
    flex: 1, paddingHorizontal: 20, paddingBottom: 30,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'center', marginTop: 10,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  phaseTitle: { textAlign: 'center', fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 4 },
  label: { textAlign: 'center', fontSize: 13, letterSpacing: 1.5, color: '#666', marginBottom: 8 },
  distance: { textAlign: 'center', fontSize: 58, fontWeight: '900', lineHeight: 64 },
  unit: { fontSize: 28, fontWeight: '700', color: '#555' },
  targetText: { textAlign: 'center', fontSize: 12, color: '#888', marginTop: 4, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '600', letterSpacing: 1 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#000', marginTop: 6 },
  statSub: { marginTop: 2, fontSize: 11, color: '#666', fontWeight: '500' },
  bottomText: { textAlign: 'center', color: '#666', marginBottom: 18, fontSize: 13 },
  mainBtn: {
    borderRadius: 999, height: 58,
    justifyContent: 'center', alignItems: 'center',
  },
  mainBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  finishBtn: {
    marginTop: 12, height: 58, borderRadius: 999,
    borderWidth: 2, borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  finishBtnFill: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999,
  },
  finishText: { fontWeight: '700', letterSpacing: 1, fontSize: 14 },
});