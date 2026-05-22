import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EducationTopic, EducationLesson } from '@/constants/educationdata';
import { ExerciseCategory, EXERCISES } from '@/constants/strengthdata';
import ExerciseCard from '@/components/ui/education/exercisecard';
import EducationLessonDetail from '@/components/ui/education/educationlessondetail';

type Props = {
  topic: EducationTopic;
  onBack: () => void;
};

const StrengthScreen = ({ topic, onBack }: Props) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedLesson, setSelectedLesson] = useState<EducationLesson | null>(null);

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [60, 100], outputRange: [0, 1], extrapolate: 'clamp',
  });

  const getExerciseCount = (lessonTitle: string): string => {
    const categoryMap: Record<string, ExerciseCategory> = {
      'Strength': 'Strength', 'Core': 'Core',
      'Mobility': 'Mobility', 'Recovery': 'Recovery',
    };
    const cat = categoryMap[lessonTitle];
    if (!cat) return '';
    const count = EXERCISES.filter((e) => e.category === cat).length;
    return `${count} Exercises`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Animated.Text numberOfLines={1} style={[styles.headerTitle, { opacity: headerTitleOpacity }]}>
          {topic.title}
        </Animated.Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.heroSection}>
          <View style={[styles.heroBadge, { backgroundColor: topic.color }]}>
            <Ionicons name={topic.icon as any} size={16} color="#111" />
            <Text style={styles.heroBadgeText}>Seri Kursus</Text>
          </View>
          <Text style={styles.heroTitle}>{topic.title}</Text>
          <Text style={styles.heroDescription}>{topic.heroDescription}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.modulLabel}>Modul</Text>

        {topic.lessons.map((lesson) => (
          <ExerciseCard
            key={lesson.id}
            title={lesson.title}
            subtitle={lesson.subtitle}
            description={lesson.description}
            icon={lesson.icon}
            iconColor={lesson.color}
            exercise={getExerciseCount(lesson.title)}
            onPress={() => setSelectedLesson(lesson)}
          />
        ))}
      </Animated.ScrollView>

      <Modal
        visible={!!selectedLesson}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedLesson(null)}
      >
        {selectedLesson && (
          <EducationLessonDetail
            category={selectedLesson.title as ExerciseCategory}
            title={selectedLesson.title}
            subtitle={selectedLesson.subtitle}
            onBack={() => setSelectedLesson(null)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
};

export default StrengthScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FAFAFA',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center', marginHorizontal: 8,
    fontSize: 15, fontWeight: '700', color: '#111',
  },
  content: { padding: 20, paddingBottom: 40 },
  heroSection: { gap: 12, marginBottom: 24 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '700', color: '#111' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#111' },
  heroDescription: { fontSize: 14, lineHeight: 22, color: '#666' },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginBottom: 16 },
  modulLabel: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 16 },
});