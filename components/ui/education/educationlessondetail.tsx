import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  EXERCISES, CATEGORY_CONFIG, CATEGORIES,
  ExerciseCategory, Exercise,
} from '@/constants/strengthdata';

// ─── ExerciseDetailModal ──────────────────────────────────────────────────────
function ExerciseDetailModal({
  exercise,
  onClose,
}: {
  exercise: Exercise | null;
  onClose: () => void;
}) {
  if (!exercise) return null;
  const isDuration = exercise.inputType === 'duration';

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={d.safe}>
        <View style={d.header}>
          <TouchableOpacity onPress={onClose} style={d.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={d.headerTitle}>Detail Exercise</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={d.content} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={d.heroCard}>
            <Text style={d.heroName}>{exercise.name}</Text>
            <View style={d.heroBadge}>
              <Ionicons
                name={isDuration ? 'timer-outline' : 'repeat-outline'}
                size={13} color={isDuration ? '#007AFF' : '#FF6B35'}
              />
              <Text style={[d.heroBadgeText, { color: isDuration ? '#007AFF' : '#FF6B35' }]}>
                {isDuration ? 'Berbasis Waktu' : 'Berbasis Reps'}
              </Text>
            </View>
          </View>

          {/* Default set info */}
          <View style={d.infoCard}>
            <Text style={d.infoLabel}>DEFAULT</Text>
            <View style={d.infoRow}>
              <View style={d.infoItem}>
                <Ionicons name="layers-outline" size={18} color="#888" />
                <Text style={d.infoValue}>3 Sets</Text>
              </View>
              <View style={d.infoItem}>
                {isDuration ? (
                  <>
                    <Ionicons name="timer-outline" size={18} color="#888" />
                    <Text style={d.infoValue}>{exercise.defaultDuration} dtk</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="repeat-outline" size={18} color="#888" />
                    <Text style={d.infoValue}>{exercise.defaultReps} reps</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Group & Category */}
          <View style={d.tagRow}>
            {exercise.group && (
              <View style={d.tag}>
                <Text style={d.tagText}>{exercise.group}</Text>
              </View>
            )}
            <View style={[d.tag, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[d.tagText, { color: '#2E7D32' }]}>{exercise.category}</Text>
            </View>
          </View>

          {/* Cara melakukan */}
          <View style={d.sectionCard}>
            <Text style={d.sectionTitle}>Cara Melakukan</Text>
            <Text style={d.sectionText}>
              {getHowTo(exercise.name)}
            </Text>
          </View>

          {/* Tips */}
          <View style={d.tipCard}>
            <Ionicons name="bulb" size={16} color="#FF9500" style={{ marginRight: 8 }} />
            <Text style={d.tipText}>{getTip(exercise.name)}</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Helper teks (bisa dipindah ke educationdata nanti) ───────────────────────
const HOW_TO: Record<string, string> = {
  'Squat': 'Berdiri dengan kaki selebar bahu. Turunkan tubuh seolah duduk di kursi, jaga lutut tidak melewati ujung jari kaki. Punggung tetap tegak. Kembali ke posisi awal.',
  'Lunges': 'Langkah satu kaki ke depan, turunkan lutut belakang mendekati lantai. Pastikan lutut depan sejajar dengan pergelangan kaki. Kembali ke posisi berdiri.',
  'Glute Bridge': 'Berbaring telentang, tekuk lutut. Angkat pinggul ke atas hingga tubuh membentuk garis lurus dari bahu ke lutut. Kencangkan bokong di puncak gerakan.',
  'Plank': 'Posisi push-up dengan siku di lantai. Jaga tubuh lurus dari kepala ke tumit. Kencangkan core dan jangan biarkan pinggul turun.',
  'Side Plank': 'Berbaring miring, topang tubuh dengan satu siku. Angkat pinggul hingga tubuh membentuk garis lurus. Tahan posisi ini.',
  'Mountain Climber': 'Mulai dari posisi plank. Tarik lutut kanan ke arah dada, lalu ganti dengan lutut kiri. Lakukan dengan cepat bergantian.',
};

const TIPS: Record<string, string> = {
  'Squat': 'Bayangkan sedang duduk ke kursi di belakang Anda. Berat badan di tumit, bukan ujung jari kaki.',
  'Lunges': 'Pandangan ke depan dan dada tegak membantu menjaga keseimbangan.',
  'Glute Bridge': 'Tahan 1-2 detik di puncak untuk aktivasi bokong yang lebih optimal.',
  'Plank': 'Bernapas secara normal — jangan menahan napas saat menahan posisi.',
  'Side Plank': 'Mulai dengan versi lutut di lantai jika terlalu berat, tingkatkan bertahap.',
  'Mountain Climber': 'Semakin cepat gerakan, semakin besar manfaat kardio-nya.',
};

const getHowTo = (name: string) =>
  HOW_TO[name] ?? 'Lakukan gerakan ini dengan kontrol penuh. Fokus pada otot yang dilatih dan jaga postur tubuh yang benar sepanjang gerakan.';

const getTip = (name: string) =>
  TIPS[name] ?? 'Mulai dengan beban tubuh saja, tingkatkan intensitas secara bertahap seiring kemampuan berkembang.';

// ─── Main Screen ──────────────────────────────────────────────────────────────
type Props = {
  // Tipe kategori yang dibuka: 'Strength' | 'Core' | 'Mobility' | 'Recovery'
  category: ExerciseCategory;
  // Judul tampil di header, misal "Strength"
  title: string;
  subtitle?: string;
  onBack: () => void;
};

export default function EducationLessonDetail({ category, title, subtitle, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const catConfig = CATEGORY_CONFIG[category];

  // Ambil semua exercise kategori ini
  const allExercises = EXERCISES.filter((e) => e.category === category);

  // Kumpulkan semua group unik
  const groups = Array.from(new Set(allExercises.map((e) => e.group).filter(Boolean))) as string[];

  // Filter berdasar tab aktif
  const filtered = activeTab
    ? allExercises.filter((e) => e.group === activeTab)
    : allExercises;

  // Fokus inti — deskripsi singkat per kategori
  const FOCUS: Record<ExerciseCategory, string[]> = {
    Strength:   ['Kekuatan kaki', 'Stabilitas', 'Power untuk lari'],
    Core:       ['Stabilitas postur', 'Keseimbangan tubuh', 'Mencegah cedera punggung'],
    Mobility:   ['Rentang gerak', 'Fleksibilitas sendi', 'Kelancaran stride'],
    Recovery:   ['Pemulihan otot', 'Mengurangi kekakuan', 'Relaksasi pasca lari'],
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Animated_Text style={s.headerTitle}>{title}</Animated_Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Fokus Inti */}
        <View style={s.focusCard}>
          <Text style={s.focusTitle}>Fokus Inti</Text>
          {FOCUS[category].map((item, i) => (
            <View key={i} style={s.focusItem}>
              <Text style={s.focusBullet}>–</Text>
              <Text style={s.focusText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Tab filter group — hanya tampil kalau ada group */}
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

        {/* Exercise list */}
        {filtered.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={s.exerciseRow}
            onPress={() => setSelectedExercise(exercise)}
            activeOpacity={0.75}
          >
            <View style={s.exerciseLeft}>
              {/* Ikon tipe */}
              <View style={[s.typeIcon, { backgroundColor: exercise.inputType === 'duration' ? '#EEF4FF' : '#FFF1EC' }]}>
                <Ionicons
                  name={exercise.inputType === 'duration' ? 'timer-outline' : 'repeat-outline'}
                  size={16}
                  color={exercise.inputType === 'duration' ? '#007AFF' : '#FF6B35'}
                />
              </View>
              <View>
                <Text style={s.exerciseName}>{exercise.name}</Text>
                <Text style={s.exerciseTarget}>
                  {exercise.group ? `Target: ${exercise.group}` : exercise.category}
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

      {/* Detail modal */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </SafeAreaView>
  );
}

// Animated.Text workaround
const Animated_Text = ({ style, children }: any) => (
  <Text style={style}>{children}</Text>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
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

  focusCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, gap: 6,
  },
  focusTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 8 },
  focusItem:  { flexDirection: 'row', gap: 8 },
  focusBullet: { fontSize: 14, color: '#888' },
  focusText:  { fontSize: 14, lineHeight: 22, color: '#444' },

  tabScroll:  { marginBottom: 16 },
  tabRow:     { flexDirection: 'row', gap: 8, paddingRight: 20 },
  tabBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, backgroundColor: '#F0F0F0',
  },
  tabText: { fontSize: 12, fontWeight: '700', color: '#555' },

  exerciseRow: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  exerciseLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  exerciseName:  { fontSize: 15, fontWeight: '700', color: '#111' },
  exerciseTarget: { fontSize: 12, color: '#888', marginTop: 2 },
  viewDetailBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewDetailText: { fontSize: 13, fontWeight: '600', color: '#111' },
});

// ─── Detail modal styles ──────────────────────────────────────────────────────
const d = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FFF',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#111' },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  heroCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, gap: 10 },
  heroName: { fontSize: 26, fontWeight: '800', color: '#111' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#F3F3F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '700' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, gap: 10 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 0.6 },
  infoRow: { flexDirection: 'row', gap: 20 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoValue: { fontSize: 18, fontWeight: '800', color: '#111' },
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: { backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 12, fontWeight: '600', color: '#555' },
  sectionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  sectionText: { fontSize: 14, lineHeight: 22, color: '#444' },
  tipCard: {
    backgroundColor: '#FFF8EC', borderRadius: 16, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#FF9500',
    flexDirection: 'row', alignItems: 'flex-start',
  },
  tipText: { fontSize: 14, lineHeight: 22, color: '#CC6600', flex: 1 },
});