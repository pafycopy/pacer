import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  EXERCISES, CATEGORY_CONFIG,
  ExerciseCategory, Exercise,
} from '@/constants/strengthdata';

// ─── Muscle tag colors ────────────────────────────────────────────────────────
const MUSCLE_COLORS: Record<string, { bg: string; text: string }> = {
  'Otot Glutes': { bg: '#FFF3E0', text: '#E65100' },
  'Quadrisep':   { bg: '#E8F5E9', text: '#2E7D32' },
  'Hamstring':   { bg: '#F3E5F5', text: '#6A1B9A' },
  'Betis':       { bg: '#E0F7FA', text: '#00695C' },
  'Glutes':      { bg: '#FFF3E0', text: '#E65100' },
  'Core':        { bg: '#E3F2FD', text: '#1565C0' },
  'Bahu':        { bg: '#FCE4EC', text: '#AD1457' },
  'Punggung':    { bg: '#FFF8E1', text: '#F57F17' },
};
const getMuscleStyle = (m: string) =>
  MUSCLE_COLORS[m] ?? { bg: '#F0F0F0', text: '#555' };

// ─── Exercise Detail Modal ────────────────────────────────────────────────────
function ExerciseDetailModal({
  exercise, onClose,
}: { exercise: Exercise | null; onClose: () => void }) {
  if (!exercise) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={d.safe}>

        {/* Header — hanya tombol back */}
        <View style={d.header}>
          <TouchableOpacity onPress={onClose} style={d.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={d.content} showsVerticalScrollIndicator={false}>

          {/* ── 1. JUDUL ── */}
          <Text style={d.exerciseName}>{exercise.name}</Text>

          {/* ── 2. GIF / IMAGE ── */}
          {exercise.gifUrl ? (
            <Image
              source={{ uri: exercise.gifUrl }}
              style={d.mediaImage}
              resizeMode="cover"
            />
          ) : (
            <View style={d.mediaBox}>
              <Ionicons name="image-outline" size={40} color="#BBB" />
            </View>
          )}

          {/* ── 3. DESKRIPSI — dalam card ── */}
          {exercise.description ? (
            <View style={d.card}>
              <Text style={d.description}>
                <Text style={d.descBold}>{exercise.name} </Text>
                {exercise.description.replace(exercise.name, '').trimStart()}
              </Text>
            </View>
          ) : null}

          {/* ── 4. AREA FOKUS — dalam card ── */}
          {exercise.muscles && exercise.muscles.length > 0 && (
            <View style={d.card}>
              <View style={d.sectionLabelRow}>
                <Ionicons name="body-outline" size={14} color="#888" />
                <Text style={d.sectionLabel}>AREA FOKUS</Text>
              </View>
              <View style={d.tagWrap}>
                {exercise.muscles.map((m) => (
                  <View key={m} style={d.tag}>
                    <Text style={d.tagText}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={d.divider} />

          {/* ── 5. MANFAAT BAGI PELARI ── */}
          {exercise.benefits && exercise.benefits.length > 0 && (
            <View style={d.section}>
              <Text style={d.sectionLabel}>MANFAAT BAGI PELARI</Text>
              {exercise.benefits.map((b, i) => (
                <View key={i} style={d.benefitRow}>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#006E2F" />
                  <Text style={d.benefitText}>{b}</Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
import { EducationLesson, EducationTopic } from '@/constants/educationdata';

type Props = {
  // Mode strength: pakai category
  category?: ExerciseCategory;
  title?: string;           // ← optional, fallback ke lesson.title
  subtitle?: string;
  // Mode injury: pakai lesson + topic
  lesson?: EducationLesson;
  topic?: EducationTopic;
  onBack: () => void;
};

export default function EducationLessonDetail({ category, title, subtitle, lesson, topic, onBack }: Props) {
  // Resolve title dari props atau dari lesson
  const resolvedTitle = title ?? lesson?.title ?? '';
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const allExercises = category ? EXERCISES.filter((e) => e.category === category) : [];
  const groups = Array.from(new Set(allExercises.map((e) => e.group).filter(Boolean))) as string[];
  const filtered = activeTab ? allExercises.filter((e) => e.group === activeTab) : allExercises;

  const FOCUS: Record<ExerciseCategory, string[]> = {
    Strength: ['Kekuatan kaki', 'Stabilitas', 'Power untuk lari'],
    Core:     ['Stabilitas postur', 'Keseimbangan tubuh', 'Mencegah cedera punggung'],
    Mobility: ['Rentang gerak', 'Fleksibilitas sendi', 'Kelancaran stride'],
    Recovery: ['Pemulihan otot', 'Mengurangi kekakuan', 'Relaksasi pasca lari'],
  };
  const focusItems = category ? FOCUS[category] : [];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.focusCard}>
          <Text style={s.focusTitle}>Fokus Inti</Text>
          {focusItems.map((item, i) => (
            <View key={i} style={s.focusItem}>
              <Text style={s.focusBullet}>–</Text>
              <Text style={s.focusText}>{item}</Text>
            </View>
          ))}
        </View>

        {groups.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
            <View style={s.tabRow}>
              {groups.map((group) => {
                const active = activeTab === group;
                return (
                  <TouchableOpacity
                    key={group}
                    style={[s.tabBtn, active && { backgroundColor: '#111' }]}
                    onPress={() => setActiveTab(active ? null : group)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.tabText, active && { color: '#FFF' }]}>{group}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {filtered.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={s.exerciseRow}
            onPress={() => setSelectedExercise(exercise)}
            activeOpacity={0.75}
          >
            <View style={s.exerciseLeft}>
              <View style={[s.typeIcon, {
                backgroundColor: exercise.inputType === 'duration' ? '#EEF4FF' : '#FFF1EC',
              }]}>
                <Ionicons
                  name={exercise.inputType === 'duration' ? 'timer-outline' : 'repeat-outline'}
                  size={16}
                  color={exercise.inputType === 'duration' ? '#007AFF' : '#FF6B35'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.exerciseName}>{exercise.name}</Text>
                <Text style={s.exerciseTarget}>
                  {exercise.muscles
                    ? `Target: ${exercise.muscles.slice(0, 2).join(', ')}`
                    : exercise.category}
                </Text>
              </View>
            </View>
            <View style={s.viewDetailBtn}>
              <Text style={s.viewDetailText}>View Detail</Text>
              <Ionicons name="chevron-forward" size={16} color="#111" />
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>

      <ExerciseDetailModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles — Detail Modal ────────────────────────────────────────────────────
const d = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: 20, paddingBottom: 48, gap: 20 },

  // 1. Judul — center, besar
  exerciseName: {
    fontSize: 34, fontWeight: '900', color: '#111', textAlign: 'center',
  },

  // 2. Media — rounded, tidak ada teks hint
  mediaBox: {
    height: 200, borderRadius: 16, backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%', height: 200, borderRadius: 16,
  },

  // Card wrapper
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  // 3. Deskripsi — center, nama bold
  description: {
    fontSize: 15, lineHeight: 24, color: '#444', textAlign: 'center',
  },
  descBold: { fontWeight: '700', color: '#111' },

  // Divider
  divider: { height: 1, backgroundColor: '#F0F0F0' },

  // 4 & 5. Section
  section: { gap: 14, alignItems: 'center' },
  sectionLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: '#888',
    letterSpacing: 1, textAlign: 'center',
  },

  // Area fokus — outline tags, center
  tagWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, justifyContent: 'center',
  },
  tag: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FFF',
  },
  tagText: { fontSize: 13, fontWeight: '600', color: '#333' },

  // Manfaat — list dengan centang, kiri
  benefitRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 10,
  width: '100%',
  paddingHorizontal: 30,
},

benefitText: {
  flex: 1,
  fontSize: 15,
  color: '#333',
  fontWeight: '500',
  lineHeight: 22,
  textAlign: 'justify',
},
});

// ─── Styles — List Screen ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FAFAFA',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#111' },
  content: { padding: 20, paddingBottom: 40 },
  focusCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, gap: 6 },
  focusTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 8 },
  focusItem: { flexDirection: 'row', gap: 8 },
  focusBullet: { fontSize: 14, color: '#888' },
  focusText: { fontSize: 14, lineHeight: 22, color: '#444' },
  tabScroll: { marginBottom: 16 },
  tabRow: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  tabBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, backgroundColor: '#F0F0F0',
  },
  tabText: { fontSize: 12, fontWeight: '700', color: '#555' },
  exerciseRow: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  exerciseLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  exerciseName: { fontSize: 15, fontWeight: '700', color: '#111' },
  exerciseTarget: { fontSize: 12, color: '#888', marginTop: 2 },
  viewDetailBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewDetailText: { fontSize: 13, fontWeight: '600', color: '#111' },
});