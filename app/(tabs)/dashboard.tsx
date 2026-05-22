import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '@/components/header';
import { Colors } from '@/constants/theme';
import TipsCard from '@/components/ui/dashboard/tipscard';
import MonitoringProgress from '@/components/ui/dashboard/monitoringprogress';
import WeeklyPlanCard from '@/components/ui/dashboard/weeklyplancard';
import StatsRow from '@/components/ui/dashboard/statsrow';
import WeeklyActivityLabel from '@/components/ui/dashboard/weeklyactivitylabel';
import RecentActivityCard from '@/components/ui/dashboard/recentactivitycard';

// ── Data dummy — nanti diganti dari store/API ─────────────────────────────
const TIP = {
  id: 1,
  title: 'High Knees',
  description:
    'Mengaktifkan otot fleksor pinggul dan bokong (glutes), serta melatih postur angkatan kaki yang ideal saat berlari.',
  icon: 'walk',
  iconBg: '#DDFFE2',
};

const RECENT_ACTIVITIES = [
  {
    id: '1',
    type: 'Morning Run',
    label: 'Hari ini, 06:00 AM',
    stat: '5.2 km',
    statSub: '03:33',
    icon: 'walk',
    iconBg: '#D9E2FF',
  },
  {
    id: '2',
    type: 'Interval Training',
    label: 'Kemarin, 05:50 PM',
    stat: '45 min',
    icon: 'timer',
    iconBg: '#FFE5D6',
  },
];

const Dashboard = () => {
  return (
    <View style={styles.container}>
      <Header title="Home" image="https://i.pravatar.cc/100" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tips section */}
        <Text style={styles.sectionLabel}>Tips</Text>
        <TipsCard tip={TIP} />

        {/* Monitoring progres
        <MonitoringProgress
          consistencyPercent={80}
          message="Kamu sudah 80% konsisten minggu ini! Pertahankan ritmenya."
        /> */}

        {/* Weekly plan
        <WeeklyPlanCard
          currentWeek={1}
          totalWeeks={4}
          completedSessions={0}
          totalSessions={2}
          milestone="Minggu 1 dari 4"
          onViewPlan={() => {}}
        /> */}

        {/* Stats */}
        <StatsRow totalWorkout={0} totalDistance={0} />

        {/* Weekly activity label */}
        <WeeklyActivityLabel sublabel="AKTIVITAS MINGGUAN" label="Bagus!" />

        {/* Recent activities */}
        <RecentActivityCard
          activities={RECENT_ACTIVITIES}
          onSeeAll={() => {}}
        />
      </ScrollView>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 14,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 0.6,
    marginBottom: -4,
    paddingHorizontal: 16,
  },
});