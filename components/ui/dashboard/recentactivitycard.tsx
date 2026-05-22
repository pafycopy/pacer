import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Activity = {
  id: string;
  type: string;        // 'Easy Run', 'Interval Training', dll
  label: string;       // 'Hari ini, 06:00 AM'
  stat: string;        // '5.2 km'
  statSub?: string;    // '03:33' (pace/durasi)
  icon: string;
  iconBg: string;
};

type Props = {
  activities: Activity[];
  onSeeAll?: () => void;
};

export default function RecentActivityCard({ activities, onSeeAll }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Aktivitas Terakhir</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>Lihat semua</Text>
          </TouchableOpacity>
        )}
      </View>

      {activities.map((activity) => (
        <View key={activity.id} style={styles.activityRow}>
          <View style={[styles.activityIcon, { backgroundColor: activity.iconBg }]}>
            <Ionicons name={activity.icon as any} size={18} color="#111" />
          </View>

          <View style={styles.activityInfo}>
            <Text style={styles.activityType}>{activity.type}</Text>
            <Text style={styles.activityLabel}>{activity.label}</Text>
          </View>

          <View style={styles.activityStat}>
            <Text style={styles.activityStatValue}>{activity.stat}</Text>
            {activity.statSub && (
              <Text style={styles.activityStatSub}>{activity.statSub}</Text>
            )}
          </View>
        </View>
      ))}

      {activities.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Belum ada aktivitas</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 20, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#4CD964' },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  activityIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  activityInfo: { flex: 1 },
  activityType: { fontSize: 14, fontWeight: '700', color: '#111' },
  activityLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  activityStat: { alignItems: 'flex-end' },
  activityStatValue: { fontSize: 14, fontWeight: '800', color: '#111' },
  activityStatSub: { fontSize: 11, color: '#888', marginTop: 1 },
  empty: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#BBB' },
});