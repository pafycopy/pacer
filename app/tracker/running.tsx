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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFinishWorkout } from '@/hooks/useFinishWorkout';

const MIN_SPEED_MS  = 0.5 / 3.6;
const HOLD_DURATION = 2000;
const BEEP_SOUND    = require('@/assets/sounds/success.mp3');

export default function RunningTracker() {
  const router = useRouter();
  const { uid, dateKey, workoutType, workoutName } = useLocalSearchParams<{
    uid: string; dateKey: string; workoutType: string; workoutName: string;
  }>();

  const player = useAudioPlayer(BEEP_SOUND);

  const [time,        setTime]        = useState(0);
  const [movingTime,  setMovingTime]  = useState(0);
  const [totalDist,   setTotalDist]   = useState(0);
  const [status,      setStatus]      = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const [isHolding,   setIsHolding]   = useState(false);
  const [finalStats,  setFinalStats]  = useState<{ dist: number; time: number; pace: string } | null>(null);

  const subscription      = useRef<any>(null);
  const timerRef          = useRef<any>(null);
  const holdTimeout       = useRef<any>(null);
  const lastLocationRef   = useRef<any>(null);
  const isMovingRef       = useRef<boolean>(false);
  const lastAnnouncedKm   = useRef<number>(0);
  const totalDistRef      = useRef<number>(0);
  const timeRef           = useRef<number>(0);
  const movingTimeRef     = useRef<number>(0);

  useEffect(() => { totalDistRef.current  = totalDist;  }, [totalDist]);
  useEffect(() => { timeRef.current       = time;       }, [time]);
  useEffect(() => { movingTimeRef.current = movingTime; }, [movingTime]);

  const { finish } = useFinishWorkout(
    dateKey, uid, [timerRef], subscription,
    { hasOwnDoneScreen: true, onAfterSave: () => setStatus('done') },
  );

  const holdProgress = useSharedValue(0);

  // ── Timer ──────────────────────────────────────────────────────────────────
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

  // ── Km milestone ──────────────────────────────────────────────────────────
  useEffect(() => {
    const kmReached = Math.floor(totalDist);
    if (kmReached > 0 && kmReached > lastAnnouncedKm.current) {
      lastAnnouncedKm.current = kmReached;
      announceKilometer(kmReached);
    }
  }, [totalDist]);

  const announceKilometer = async (km: number) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 150, 100, 150]);
    try { player.seekTo(0); player.play(); } catch (e) {}
  };

  const toRad = (value: number) => (value * Math.PI) / 180;

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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Format durasi untuk done screen: "45 Menit" atau "1 Jam 20 Menit"
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h} Jam ${m} Menit`;
    if (m > 0) return `${m} Menit ${s > 0 ? `${s} Detik` : ''}`.trim();
    return `${s} Detik`;
  };

  const calcPace = (dist: number, mTime: number): string => {
    if (dist === 0 || mTime === 0) return '--:--';
    const sec = mTime / dist;
    return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  };

  const startLocationWatch = async () => {
    subscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 5 },
      (loc) => {
        const newCoord = loc.coords;
        const speed    = newCoord.speed ?? 0;
        const accuracy = newCoord.accuracy ?? 999;
        isMovingRef.current = speed >= MIN_SPEED_MS;
        if (accuracy > 15) return;
        if (speed < MIN_SPEED_MS) { lastLocationRef.current = newCoord; return; }
        setTotalDist((prev) => {
          const last = lastLocationRef.current;
          if (last) {
            const dist = getDistance(last, newCoord);
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
      try { player.seekTo(0); player.play(); } catch (e) {}
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (status === 'running') {
      subscription.current?.remove();
      subscription.current    = null;
      isMovingRef.current     = false;
      lastLocationRef.current = null;
      setStatus('paused');
    } else {
      await startLocationWatch();
      setStatus('running');
    }
  };

  const handleFinish = () => {
    const snapDist = totalDistRef.current;
    const snapTime = timeRef.current;
    const snapPace = calcPace(snapDist, movingTimeRef.current);
    setFinalStats({ dist: snapDist, time: snapTime, pace: snapPace });
    finish({ actualDistance: snapDist, actualDuration: snapTime, actualPace: snapPace, completedAt: Date.now() });
  };

  const handleDiscard = () => {
    Alert.alert('Keluar dari latihan?', 'Progress latihan akan hilang.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => { subscription.current?.remove(); router.back(); } },
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
    transform:   [{ scale: 1 + holdProgress.value * 0.03 }],
  }));
  const animatedFillStyle  = useAnimatedStyle(() => ({ opacity: holdProgress.value * 0.15 }));
  const animatedTextStyle  = useAnimatedStyle(() => ({
    opacity: isHolding ? 0.6 + holdProgress.value * 0.4 : 1,
  }));

  // ─── DONE SCREEN ──────────────────────────────────────────────────────────
  if (status === 'done' && finalStats) {
    return (
      <SafeAreaView style={st.safeArea}>
        <ScrollView contentContainerStyle={st.doneScroll} showsVerticalScrollIndicator={false}>

          {/* Icon lari dengan centang hijau */}
          <View style={st.finishedIconWrap}>
            <View style={st.finishedIconCircle}>
              <Ionicons name="walk" size={44} color="#fff" />
            </View>
            <View style={st.finishedCheckBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#5BFF7A" />
            </View>
          </View>

          {/* Judul */}
          <Text style={st.doneTitle}>Berlari{''}Selesai!</Text>
          <Text style={st.doneSub}>Pelan tidak apa-apa, yang penting konsisten</Text>

          {/* Durasi total — card besar */}
          <View style={st.durationCard}>
            <Text style={st.durationLabel}>DURASI TOTAL</Text>
            <Text style={st.durationValue}>{formatDuration(finalStats.time)}</Text>
          </View>

          {/* 2 stat card: Jarak & Pace */}
          <View style={st.statsRow}>
            <View style={st.statCard}>
              <Ionicons name="navigate-outline" size={18} color="#5BFF7A" />
              <Text style={st.statLabel}>JARAK</Text>
              <Text style={st.statValue}>{finalStats.dist.toFixed(2)}</Text>
              <Text style={st.statUnit}>km</Text>
            </View>
            <View style={st.statCard}>
              <Ionicons name="speedometer-outline" size={18} color="#4D7CFE" />
              <Text style={st.statLabel}>AVG PACE</Text>
              <Text style={st.statValue}>{finalStats.pace}</Text>
              <Text style={st.statUnit}>min/km</Text>
            </View>
          </View>

          {/* Tombol kembali */}
          <TouchableOpacity style={st.doneBtn} onPress={() => router.back()} activeOpacity={0.88}>
            <Text style={st.doneBtnText}>Kembali ke Dashboard</Text>
            <Ionicons name="arrow-forward" size={18} color="#111" />
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── RUNNING SCREEN ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={st.safeArea}>
      <View style={st.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={st.workoutName}>{workoutName || 'RUNNING'}</Text>
        </View>
      </View>

      <View style={st.container}>
        <View>
          {status !== 'idle' && (
            <View style={[st.badge, { backgroundColor: status === 'running' ? '#4CD964' : '#FF9500' }]}>
              <Text style={st.badgeText}>
                {status === 'running' ? (isMovingRef.current ? 'TRACKING' : 'DIAM') : 'PAUSED'}
              </Text>
            </View>
          )}
        </View>

        <View>
          <Text style={st.label}>DISTANCE</Text>
          <Text style={st.distance}>
            {totalDist.toFixed(2)}
            <Text style={st.unit}> KM</Text>
          </Text>
          <View style={st.runStatsRow}>
            <View style={st.runStatCard}>
              <Text style={st.statLabel}>DURATION</Text>
              <Text style={st.statValue}>{formatTime(time)}</Text>
              <Text style={st.statUnit}>MM:SS</Text>
            </View>
            <View style={st.runStatCard}>
              <Text style={st.statLabel}>AVG PACE</Text>
              <Text style={st.statValue}>{calcPace(totalDist, movingTime)}</Text>
              <Text style={st.statUnit}>MIN/KM</Text>
            </View>
          </View>
        </View>

        <View>
          {status !== 'idle' && (
            <Text style={st.bottomText}>
              {isHolding ? 'Tahan untuk berhenti...' : 'Tubuh Anda sedang beradaptasi'}
            </Text>
          )}
          <TouchableOpacity
            style={[st.mainBtn, { backgroundColor: status === 'paused' ? '#FFB84D' : '#63EA7B' }]}
            onPress={handleMainButton}
          >
            {(status === 'running' || status === 'idle') && (
              <Ionicons
                name={status === 'idle' ? 'play' : 'pause'}
                size={18} color="#111"
                style={{ marginRight: 6 }}
              />
            )}
            {status === 'paused' && (
              <Ionicons name="play" size={18} color="#111" style={{ marginRight: 6 }} />
            )}
            <Text style={st.mainBtnText}>
              {status === 'idle' ? 'START' : status === 'running' ? 'PAUSE' : 'RESUME'}
            </Text>
          </TouchableOpacity>
          {status !== 'idle' && (
            <Pressable onPressIn={handleHoldStart} onPressOut={handleHoldEnd}>
              <Animated.View style={[st.finishBtn, animatedBorderStyle]}>
                <Animated.View style={[st.finishBtnFill, animatedFillStyle]} />
                <Animated.Text style={[st.finishText, animatedTextStyle]}>
                  {isHolding ? 'BERHENTI...' : 'HOLD TO STOP'}
                </Animated.Text>
              </Animated.View>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },

  // ── Done screen ────────────────────────────────────────────────────────────
  doneScroll: {
    padding: 24, gap: 16, paddingBottom: 48, alignItems: 'center',
  },
  finishedIconWrap: { position: 'relative', marginBottom: 4 },
  finishedIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  finishedCheckBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', borderRadius: 14, padding: 1 },
  trophyWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    marginTop: 12,
  },
  doneTitle: {
    fontSize: 36, fontWeight: '800', color: '#111', lineHeight: 44,
    textAlign: 'center', marginTop: 4,
  },
  doneSub: {
    fontSize: 14, color: '#777', textAlign: 'center',
    lineHeight: 22, marginTop: -4,
  },
  durationCard: {
    width: '100%', backgroundColor: '#FFF',
    borderRadius: 22, padding: 22, gap: 6,
  },
  durationLabel: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 0.6 },
  durationValue: { fontSize: 34, fontWeight: '800', color: '#111' },
  statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  statCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 20,
    padding: 16, gap: 4,
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#888', marginTop: 8, letterSpacing: 0.5 },
  statValue: { fontSize: 26, fontWeight: '800', color: '#111' },
  statUnit:  { fontSize: 11, color: '#AAA', fontWeight: '500' },
  doneBtn: {
    width: '100%', backgroundColor: '#5BFF7A',
    paddingVertical: 18, borderRadius: 40, marginTop: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: '#111' },

  // ── Running screen ─────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 0, paddingBottom: 8,
  },
  headerCenter: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingRight: 22 },
  workoutName:  { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: '#111' },
  container:    { flex: 1, paddingHorizontal: 20, paddingBottom: 30, justifyContent: 'space-between' },
  badge:        { alignSelf: 'center', marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText:    { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  label:        { textAlign: 'center', fontSize: 13, letterSpacing: 1.5, color: '#666', marginBottom: 8 },
  distance:     { textAlign: 'center', fontSize: 58, fontWeight: '900', color: '#000', lineHeight: 64 },
  unit:         { fontSize: 28, fontWeight: '700', color: '#555' },
  runStatsRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 12 },
  runStatCard:  { flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  bottomText:   { textAlign: 'center', color: '#666', marginBottom: 18, fontSize: 13 },
  mainBtn: {
    borderRadius: 999, height: 58,
    justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row',
  },
  mainBtnText: { color: '#111', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  finishBtn: {
    marginTop: 10, height: 58, borderRadius: 999,
    borderWidth: 0,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  finishBtnFill: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#EF4444', borderRadius: 999,
  },
  finishText: { color: '#555', fontWeight: '700', letterSpacing: 1.5, fontSize: 14 },
});