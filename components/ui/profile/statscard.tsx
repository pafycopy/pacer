import { View, Text, StyleSheet } from 'react-native';
import { useWorkoutStore } from '@/store/supabaseWorkoutStore';

const StatsCard = () => {
  const { workoutsByDate } = useWorkoutStore();

  // Hitung total dari semua workout yang sudah completed
  let totalDistance = 0;
  let totalRuns = 0;

  Object.values(workoutsByDate).forEach((workouts) => {
    workouts.forEach((w) => {
      if (w.status !== 'completed') return;

      totalRuns += 1;

      // Hanya hitung jarak nyata (actualDistance), bukan target awal
      if (w.trackingResult?.actualDistance) {
        totalDistance += w.trackingResult.actualDistance;
      }
      // Strength Training tidak punya jarak, skip
    });
  });

  const displayDistance =
    totalDistance >= 1000
      ? `${(totalDistance / 1000).toFixed(1)} km`
      : `${Math.round(totalDistance)} km`;

  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.label}>TOTAL DISTANCE</Text>
        <Text style={styles.value}>
          {displayDistance.split(' ')[0]}
          <Text style={styles.unit}> {displayDistance.split(' ')[1]}</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.card}>
        <Text style={styles.label}>TOTAL RUNS</Text>
        <Text style={styles.value}>{totalRuns}</Text>
      </View>
    </View>
  );
};

export default StatsCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  label: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
});