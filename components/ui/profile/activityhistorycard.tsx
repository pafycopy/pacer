import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkoutStore, SavedWorkout } from '@/store/workoutStore';

// Icon & warna per tipe workout
const getWorkoutMeta = (type: string) => {
  switch (type) {
    case 'Easy Run':
      return { icon: 'run', color: '#4CAF50', bg: '#E8F5E9' };
    case 'Long Run':
      return { icon: 'run-fast', color: '#2196F3', bg: '#E3F2FD' };
    case 'Interval Run':
      return { icon: 'timer-outline', color: '#FF9800', bg: '#FFF3E0' };
    case 'Tempo Run':
      return { icon: 'speedometer', color: '#9C27B0', bg: '#F3E5F5' };
    case 'Strength Training':
      return { icon: 'weight-lifter', color: '#F44336', bg: '#FFEBEE' };
    case 'Rest Day':
      return { icon: 'sleep', color: '#607D8B', bg: '#ECEFF1' };
    default:
      return { icon: 'run', color: '#4CAF50', bg: '#E8F5E9' };
  }
};

const formatDateLabel = (dateKey: string): string => {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const WorkoutRow = ({
  workout,
  dateLabel,
}: {
  workout: SavedWorkout;
  dateLabel: string;
}) => {
  const meta = getWorkoutMeta(workout.workoutType);
  // Strength Training: tampilkan jumlah exercise & total sets
  const isStrength = workout.workoutType === 'Strength Training';
  const exerciseCount = workout.selectedExercises?.length ?? 0;
  const totalSets = workout.selectedExercises?.reduce(
    (acc, ex) => acc + (ex.sets?.length ?? 0), 0
  ) ?? 0;

  // Running: hanya pakai actualDistance (jarak nyata), bukan target
  const distance =
    !isStrength && workout.trackingResult?.actualDistance
      ? `${workout.trackingResult.actualDistance.toFixed(2)} km`
      : null;

  const pace =
    !isStrength && workout.trackingResult?.actualPace
      ? `${workout.trackingResult.actualPace}/km`
      : null;

  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
        <MaterialCommunityIcons
          name={meta.icon as any}
          size={22}
          color={meta.color}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.workoutName}>{workout.workoutName}</Text>
        <Text style={styles.detail}>
          {isStrength
            ? `${exerciseCount} exercise · ${totalSets} sets`
            : [distance, pace].filter(Boolean).join(" · ") || "Belum ada data"}
        </Text>
      </View>

      <Text style={styles.dateLabel}>{dateLabel}</Text>
    </View>
  );
};

const ActivityHistoryCard = () => {
  const { workoutsByDate } = useWorkoutStore();

  // Ambil semua workout completed, urutkan dari terbaru
  const history: { workout: SavedWorkout; dateKey: string }[] = [];

  Object.entries(workoutsByDate).forEach(([dateKey, workouts]) => {
    workouts.forEach((w) => {
      if (w.status === 'completed') {
        history.push({ workout: w, dateKey });
      }
    });
  });

  history.sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  const displayed = history.slice(0, 5); // tampilkan 5 terbaru

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity History</Text>
        {history.length > 5 && (
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        )}
      </View>

      {displayed.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="fitness-outline" size={32} color="#ccc" />
          <Text style={styles.emptyText}>Belum ada aktivitas selesai</Text>
        </View>
      ) : (
        displayed.map(({ workout, dateKey }) => (
          <WorkoutRow
            key={workout.uid}
            workout={workout}
            dateLabel={formatDateLabel(dateKey)}
          />
        ))
      )}
    </View>
  );
};

export default ActivityHistoryCard;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  viewAll: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  detail: {
    fontSize: 12,
    color: '#888',
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#bbb',
  },
});