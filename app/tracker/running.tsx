import { useState, useRef, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/store/workoutStore';

const MIN_SPEED_MS = 0.5 / 3.6;
const HOLD_DURATION = 2000;

// File suara lokal — taruh file beep.mp3 di assets/sounds/
const BEEP_SOUND = require('@/assets/sounds/success.mp3');

export default function RunningTracker() {
  const router = useRouter();
  const { uid, dateKey, workoutType, workoutName } = useLocalSearchParams<{
    uid: string;
    dateKey: string;
    workoutType: string;
    workoutName: string;
  }>();

  const { saveTrackingResult } = useWorkoutStore();

  // expo-audio hook — lebih simpel dari expo-av
  const player = useAudioPlayer(BEEP_SOUND);

  const [time, setTime] = useState(0);
  const [movingTime, setMovingTime] = useState(0);
  const [totalDist, setTotalDist] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [isHolding, setIsHolding] = useState(false);

  const subscription = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const holdTimeout = useRef<any>(null);
  const lastLocationRef = useRef<any>(null);
  const isMovingRef = useRef<boolean>(false);
  const lastAnnouncedKm = useRef<number>(0);

  const holdProgress = useSharedValue(0);

  // ---- Timer ----
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
        if (isMovingRef.current) setMovingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // ---- Cek km milestone ----
  // Dengan ini (production 1 km)
useEffect(() => {
  const kmReached = Math.floor(totalDist);
  if (kmReached > 0 && kmReached > lastAnnouncedKm.current) {
    lastAnnouncedKm.current = kmReached;
    announceKilometer(kmReached);
  }
}, [totalDist]);

  const announceKilometer = async (km: number) => {
    console.log('🔔 Km reached:', km.toFixed(2));

    // Haptics — lebih reliable dari Vibration
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Vibrasi tambahan
    Vibration.vibrate([0, 150, 100, 150]);

    // Play sound — expo-audio lebih simpel
    try {
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.warn('Sound error:', e);
    }
  };

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

  const calculatePace = (): string => {
    if (totalDist === 0 || movingTime === 0) return '--:--';
    const paceSecPerKm = movingTime / totalDist;
    const minutes = Math.floor(paceSecPerKm / 60);
    const seconds = Math.floor(paceSecPerKm % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const startLocationWatch = async () => {
  subscription.current = await Location.watchPositionAsync(
    { 
      accuracy: Location.Accuracy.BestForNavigation, 
      timeInterval: 1000, 
      distanceInterval: 5, // ← naikkan dari 3 ke 5 meter
    },
    (loc) => {
      const newCoord = loc.coords;
      const speed = newCoord.speed ?? 0;
      const accuracy = newCoord.accuracy ?? 999;

      // Update moving status
      isMovingRef.current = speed >= MIN_SPEED_MS;

      // ✅ FIX: Skip kalau accuracy jelek
      if (accuracy > 15) return;

      // ✅ FIX: Skip kalau speed terlalu rendah (diam/GPS drift)
      if (speed < MIN_SPEED_MS) {
        lastLocationRef.current = newCoord; // update posisi tapi jangan tambah jarak
        return;
      }

      setTotalDist((prev) => {
        const last = lastLocationRef.current;
        if (last) {
          const dist = getDistance(last, newCoord);

          // ✅ FIX: threshold naik ke 5m untuk kurangi noise
          if (dist < 0.005) return prev;

          lastLocationRef.current = newCoord;
          return prev + dist;
        }
        lastLocationRef.current = newCoord;
        return prev;
      });
    }
  );
};

  const handleMainButton = async () => {
  if (status === 'idle') {
    const { status: permission } = await Location.requestForegroundPermissionsAsync();
    if (permission !== 'granted') { alert('Izin lokasi ditolak.'); return; }
    await startLocationWatch();
    setStatus('running');

    // Sound + haptic saat start
    try {
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.warn('Start sound error:', e);
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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

  const handleFinish = () => {
    subscription.current?.remove();
    saveTrackingResult(dateKey, uid, {
      actualDistance: totalDist,
      actualDuration: time,
      actualPace: calculatePace(),
      completedAt: Date.now(),
    });
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

  const handleHoldStart = () => {
    setIsHolding(true);
    holdProgress.value = withTiming(1, { duration: HOLD_DURATION, easing: Easing.linear });
    holdTimeout.current = setTimeout(() => {
      Vibration.vibrate([0, 100, 80, 100, 80, 300]);
      handleFinish();
    }, HOLD_DURATION);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    holdProgress.value = withTiming(0, { duration: 200 });
    clearTimeout(holdTimeout.current);
  };

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(239, 68, 68, ${0.3 + holdProgress.value * 0.7})`,
    transform: [{ scale: 1 + holdProgress.value * 0.03 }],
  }));

  const animatedFillStyle = useAnimatedStyle(() => ({
    opacity: holdProgress.value * 0.15,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: isHolding ? 0.6 + holdProgress.value * 0.4 : 1,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName}>{workoutName || 'RUNNING'}</Text>
        </View>
        
      </View>

      <View style={styles.container}>
        <View>
          {status !== 'idle' && (
            <View style={[styles.badge, { backgroundColor: status === 'running' ? '#4CD964' : '#FF9500' }]}>
              <Text style={styles.badgeText}>
                {status === 'running'
                  ? isMovingRef.current ? 'TRACKING' : 'DIAM'
                  : 'PAUSED'}
              </Text>
            </View>
          )}
        </View>

        <View>
          <Text style={styles.label}>DISTANCE</Text>
          <Text style={styles.distance}>
            {totalDist.toFixed(2)}
            <Text style={styles.unit}> KM</Text>
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.statValue}>{formatTime(time)}</Text>
              <Text style={styles.statSub}>MM:SS</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>AVG PACE</Text>
              <Text style={styles.statValue}>{calculatePace()}</Text>
              <Text style={styles.statSub}>MIN/KM</Text>
            </View>
          </View>
        </View>

        <View>
          {status !== 'idle' && (
            <Text style={styles.bottomText}>
              {isHolding ? 'Tahan untuk berhenti...' : 'Tubuh Anda sedang beradaptasi'}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: status === 'paused' ? '#FFB84D' : '#63EA7B' }]}
            onPress={handleMainButton}
          >
            <Text style={styles.mainBtnText}>
              {status === 'idle' ? 'START' : status === 'running' ? '⏸ PAUSE' : '▶ RESUME'}
            </Text>
          </TouchableOpacity>

          {status !== 'idle' && (
            <Pressable onPressIn={handleHoldStart} onPressOut={handleHoldEnd}>
              <Animated.View style={[styles.finishBtn, animatedBorderStyle]}>
                <Animated.View style={[styles.finishBtnFill, animatedFillStyle]} />
                <Animated.Text style={[styles.finishText, animatedTextStyle]}>
                  {isHolding ? '🔴  BERHENTI...' : 'HOLD TO STOP'}
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
    paddingHorizontal: 20, paddingTop: 0, paddingBottom: 8,
  },
  headerCenter: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingRight: 22 },
  workoutName: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: '#111' },
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 30, justifyContent: 'space-between' },
  badge: { alignSelf: 'center', marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  label: { textAlign: 'center', fontSize: 13, letterSpacing: 1.5, color: '#666', marginBottom: 8 },
  distance: { textAlign: 'center', fontSize: 58, fontWeight: '900', color: '#000', lineHeight: 64 },
  unit: { fontSize: 28, fontWeight: '700', color: '#555' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '600', letterSpacing: 1 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#000', marginTop: 6 },
  statSub: { marginTop: 2, fontSize: 11, color: '#666', fontWeight: '500' },
  bottomText: { textAlign: 'center', color: '#666', marginBottom: 18, fontSize: 13 },
  mainBtn: { borderRadius: 999, height: 58, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { color: '#111', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  finishBtn: {
    marginTop: 12, height: 58, borderRadius: 999,
    borderWidth: 2, borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  finishBtnFill: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#EF4444', borderRadius: 999,
  },
  finishText: { color: '#EF4444', fontWeight: '700', letterSpacing: 1, fontSize: 14 },
});