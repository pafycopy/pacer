import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/header';
import { Colors } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';

import TipsCard            from '@/components/ui/dashboard/tipscard';
import MonitoringProgress  from '@/components/ui/dashboard/monitoringprogress';
import WeeklyPlanCard      from '@/components/ui/dashboard/weeklyplancard';
import StatsRow            from '@/components/ui/dashboard/statsrow';
import WeeklyActivityLabel from '@/components/ui/dashboard/weeklyactivitylabel';
import RecentActivityCard  from '@/components/ui/dashboard/recentactivitycard';

import { useDashboardStats } from '@/hooks/usedashboardstats';

const Dashboard = () => {
  const router = useRouter();
  const { avatarUri } = useUserStore();

  const {
    dataByPeriod,
    consistencyPercent,
    consistencyMsg,
    completedSessions,
    totalSessions,
    currentWeek,
    recentActivities,
    weeklyLabel,
    tip,
  } = useDashboardStats();

  // Navigasi ke tab Education dan langsung buka topik terkait tips
  const handleTipPress = () => {
    router.push({
      pathname: '/(tabs)/education',
      params: { topicId: String(tip.topicId) },
    })
  }

  return (
    <View style={styles.container}>
      <Header
        title="Home"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tips hari ini — klik langsung ke halaman education topik terkait */}
        <TipsCard tip={tip} onPress={handleTipPress} />

        <MonitoringProgress
          consistencyPercent={consistencyPercent}
          message={consistencyMsg}
        />

        <WeeklyPlanCard
          currentWeek={currentWeek}
          totalWeeks={4}
          completedSessions={completedSessions}
          totalSessions={totalSessions}
          milestone={`Minggu ${currentWeek} dari 4`}
          onViewPlan={() => router.push('/(tabs)/training')}
        />

        <StatsRow
          totalWorkout={dataByPeriod.minggu.workout}
          totalDistance={dataByPeriod.minggu.distance}
          dataByPeriod={dataByPeriod}
        />

        <WeeklyActivityLabel
          sublabel="AKTIVITAS MINGGUAN"
          label={weeklyLabel}
        />

        <RecentActivityCard
          activities={recentActivities}
          onSeeAll={() => router.push('/(tabs)/training')}
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
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
});