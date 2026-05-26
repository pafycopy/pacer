import React, { useState } from 'react';
import {
  View,
  Text,
 StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  EXERCISES,
  ExerciseCategory,
  Exercise,
} from '@/constants/strengthdata';

import {
  EducationLesson,
  EducationTopic,
} from '@/constants/educationdata';

// ─────────────────────────────────────────────────────────────
// DETAIL MODAL
// ─────────────────────────────────────────────────────────────
function ExerciseDetailModal({
  exercise,
  onClose,
}: {
  exercise: Exercise | null;
  onClose: () => void;
}) {
  if (!exercise) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={d.safe}>

        {/* HEADER */}
        <View style={d.header}>
          <TouchableOpacity onPress={onClose} style={d.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>

          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={d.content}
          showsVerticalScrollIndicator={false}
        >

          {/* TITLE */}
          <Text style={d.exerciseName}>
            {exercise.name}
          </Text>

          {/* IMAGE */}
          <View style={d.mediaBox}>
            <Ionicons
              name="image-outline"
              size={40}
              color="#BBB"
            />
          </View>

          {/* DESCRIPTION */}
          {exercise.description ? (
            <View style={d.card}>

              <Text style={d.description}>
                <Text style={d.descBold}>
                  {exercise.name}{' '}
                </Text>

                {exercise.description
                  .replace(exercise.name, '')
                  .trimStart()}
              </Text>

            </View>
          ) : null}

          {/* AREA FOKUS */}
          {exercise.muscles &&
            exercise.muscles.length > 0 && (
              <View style={d.card}>

                <View style={d.sectionLabelRow}>
                  <Ionicons
                    name="body-outline"
                    size={14}
                    color="#888"
                  />

                  <Text style={d.sectionLabel}>
                    AREA FOKUS
                  </Text>
                </View>

                <View style={d.tagWrap}>
                  {exercise.muscles.map((m) => (
                    <View key={m} style={d.tag}>
                      <Text style={d.tagText}>
                        {m}
                      </Text>
                    </View>
                  ))}
                </View>

              </View>
            )}

          <View style={d.divider} />

          {/* BENEFIT */}
          {exercise.benefits &&
            exercise.benefits.length > 0 && (
              <View style={d.benefitSection}>

                <Text style={d.benefitTitle}>
                  MANFAAT BAGI PELARI
                </Text>

                <View style={d.benefitList}>
                  {exercise.benefits.map((b, i) => (
                    <View
                      key={i}
                      style={d.benefitItem}
                    >

                      <Ionicons
                        name="checkmark-circle-outline"
                        size={26}
                        color="#006E2F"
                      />

                      <Text style={d.benefitItemText}>
                        {b}
                      </Text>

                    </View>
                  ))}
                </View>

              </View>
            )}

        </ScrollView>

      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
type Props = {
  category?: ExerciseCategory;
  title: string;
  subtitle?: string;

  lesson?: EducationLesson;
  topic?: EducationTopic;

  onBack: () => void;
};

export default function EducationLessonDetail({
  category,
  title,
  onBack,
}: Props) {

  const [activeTab, setActiveTab] =
    useState<string | null>(null);

  const [selectedExercise, setSelectedExercise] =
    useState<Exercise | null>(null);

  const allExercises = category
    ? EXERCISES.filter(
        (e) => e.category === category
      )
    : [];

  const groups = Array.from(
    new Set(
      allExercises
        .map((e) => e.group)
        .filter(Boolean)
    )
  ) as string[];

  const filtered = activeTab
    ? allExercises.filter(
        (e) => e.group === activeTab
      )
    : allExercises;

  const FOCUS: Record<
    ExerciseCategory,
    string[]
  > = {
    Strength: [
      'Meningkatkan stabilitas lutut',
      'Membantu efisiensi langkah lari',
      'Membangun kekuatan dasar kaki',
    ],

    Core: [
      'Meningkatkan keseimbangan tubuh',
      'Menjaga postur saat berlari',
      'Mengurangi risiko cedera',
    ],

    Mobility: [
      'Meningkatkan fleksibilitas',
      'Memperlancar gerakan stride',
      'Mengurangi kekakuan otot',
    ],

    Recovery: [
      'Mempercepat pemulihan',
      'Mengurangi nyeri otot',
      'Membantu relaksasi tubuh',
    ],
  };

  const focusItems = category
    ? FOCUS[category]
    : [];

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>

        <TouchableOpacity
          onPress={onBack}
          style={s.backBtn}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#111"
          />
        </TouchableOpacity>

        <Text style={s.headerTitle}>
          {title}
        </Text>

        <View style={{ width: 36 }} />

      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >

        {/* FOCUS CARD */}
        <View style={s.focusCard}>

          <View style={s.focusCircle} />

          <Text style={s.focusTitle}>
            Kekuatan Dasar Dan {'\n'}
            Stabilitas Kaki Untuk {'\n'}
            Mendukung Performa Lari
          </Text>

          <View style={s.focusBadgeRow}>

            <View style={s.badge}>
              <View style={s.badgeDot} />

              <Text style={s.badgeText}>
                Pemula
              </Text>
            </View>

            <View style={s.badge}>
              <Text style={s.badgeText}>
                2-3x per week
              </Text>
            </View>

          </View>

          <View style={s.focusList}>
            {focusItems.map((item, i) => (
              <Text
                key={i}
                style={s.focusListText}
              >
                {item}
              </Text>
            ))}
          </View>

        </View>

        {/* TABS */}
        {groups.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.tabScroll}
          >

            <View style={s.tabRow}>

              {groups.map((group) => {

                const active =
                  activeTab === group;

                return (
                  <TouchableOpacity
                    key={group}
                    style={[
                      s.tabBtn,
                      active && {
                        backgroundColor: '#111',
                      },
                    ]}
                    onPress={() =>
                      setActiveTab(
                        active ? null : group
                      )
                    }
                    activeOpacity={0.8}
                  >

                    <Text
                      style={[
                        s.tabText,
                        active && {
                          color: '#FFF',
                        },
                      ]}
                    >
                      {group}
                    </Text>

                  </TouchableOpacity>
                );
              })}

            </View>

          </ScrollView>
        )}

        {/* EXERCISE LIST */}
        {filtered.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={s.exerciseCard}
            onPress={() =>
              setSelectedExercise(exercise)
            }
            activeOpacity={0.9}
          >

            {/* TITLE */}
            <Text style={s.exerciseCardTitle}>
              {exercise.name}
            </Text>

            {/* INFO */}
            <View style={s.exerciseInfoRow}>

              <Ionicons
                name={
                  exercise.inputType === 'duration'
                    ? 'timer-outline'
                    : 'repeat-outline'
                }
                size={14}
                color="#666"
              />

              <Text style={s.exerciseInfoText}>
                {exercise.inputType === 'duration'
                  ? '30-45 Sec'
                  : '3x 12 Reps'}
              </Text>

            </View>

            {/* BUTTON */}
            <View style={s.detailButton}>

              <Text style={s.detailButtonText}>
                Lihat Detail
              </Text>

            </View>

          </TouchableOpacity>
        ))}

      </ScrollView>

      {/* MODAL */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        onClose={() =>
          setSelectedExercise(null)
        }
      />

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// DETAIL STYLES
// ─────────────────────────────────────────────────────────────
const d = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,

    backgroundColor: '#F0F0F0',

    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 20,
  },

  exerciseName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#111',
    textAlign: 'center',
  },

  mediaBox: {
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',

    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,

    elevation: 2,
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#444',
    textAlign: 'center',
  },

  descBold: {
    fontWeight: '700',
    color: '#111',
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 6,
    marginBottom: 18,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1,
  },

  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 8,
    justifyContent: 'center',
  },

  tag: {
    borderRadius: 20,

    paddingHorizontal: 16,
    paddingVertical: 8,

    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },

  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },

  benefitSection: {
    marginTop: 8,
  },

  benefitTitle: {
    textAlign: 'center',

    fontSize: 13,
    fontWeight: '800',

    color: '#8A8A8A',
    letterSpacing: 2,

    marginBottom: 28,
  },

  benefitList: {
    gap: 22,
  },

  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 10,

    paddingHorizontal: 40,
  },

  benefitItemText: {
    flex: 1,

    fontSize: 16,
    lineHeight: 20,

    fontWeight: '500',
    color: '#222',
  },
});

// ─────────────────────────────────────────────────────────────
// MAIN STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',

    fontSize: 17,
    fontWeight: '800',
    color: '#111',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // FOCUS CARD
  focusCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 22,

    padding: 22,
    marginBottom: 22,

    overflow: 'hidden',
    position: 'relative',
  },

  focusCircle: {
    position: 'absolute',

    width: 140,
    height: 140,

    borderRadius: 999,

    backgroundColor: '#DDF5E5',

    top: -50,
    right: -50,
  },

  focusTitle: {
    fontSize: 22,
    lineHeight: 34,

    fontWeight: '900',
    color: '#111',

    marginBottom: 18,

    maxWidth: '90%',
  },

  focusBadgeRow: {
    flexDirection: 'row',
    gap: 8,

    marginBottom: 18,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    backgroundColor: '#F3F3F3',

    paddingHorizontal: 12,
    paddingVertical: 7,

    borderRadius: 999,
  },

  badgeDot: {
    width: 8,
    height: 8,

    borderRadius: 999,

    backgroundColor: '#00C853',
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444',
  },

  focusList: {
    gap: 12,
  },

  focusListText: {
    fontSize: 15,
    lineHeight: 22,

    color: '#444',
    fontWeight: '500',
  },

  // TABS
  tabScroll: {
    marginBottom: 18,
  },

  tabRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },

  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,

    borderRadius: 999,

    backgroundColor: '#FFFFFF',
  },

  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },

  // EXERCISE CARD
  exerciseCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    padding: 16,
    marginBottom: 14,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,

    elevation: 2,
  },

  exerciseCardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',

    marginBottom: 12,
  },

  exerciseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    marginBottom: 18,
  },

  exerciseInfoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },

  detailButton: {
    height: 42,

    borderRadius: 999,

    backgroundColor: '#F3F3F3',

    borderWidth: 1,
    borderColor: '#E5E5E5',

    alignItems: 'center',
    justifyContent: 'center',
  },

  detailButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
  },
});