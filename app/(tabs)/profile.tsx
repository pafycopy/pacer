import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileHeader from '@/components/ui/profile/profilheader';
import PremiumCard from '@/components/ui/profile/premiumcard';
import StatsCard from '@/components/ui/profile/statscard';
import ActivityCalendar from '@/components/ui/profile/activitycalendar';
import ActivityHistoryCard from '@/components/ui/profile/activityhistorycard';

const ProfileScreen = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Foto, Nama, Lokasi */}
        <ProfileHeader />

        {/* Banner Premium */}
        <PremiumCard />

        {/* Total Distance & Total Runs */}
        <StatsCard />

        {/* Kalender Aktivitas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activity Calendar</Text>
        </View>
        <ActivityCalendar />

        {/* Riwayat Workout */}
        <ActivityHistoryCard />

        {/* Tombol Logout */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#E53935" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53935',
  },
});