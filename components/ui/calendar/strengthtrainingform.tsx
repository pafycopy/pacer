import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  EXERCISES, CATEGORY_CONFIG, CATEGORIES,
  ExerciseCategory, Exercise, SelectedExercise, ExerciseSet,
} from '@/constants/strengthdata';
import { WorkoutFormValues } from '@/components/ui/calendar/workoutformscreen';

type Props = {
  initialValues?: WorkoutFormValues;
  onBack: () => void;
  onSave: (values: WorkoutFormValues) => void;
};

const makeSet = (setNum: number): ExerciseSet => ({
  set: setNum,
  reps: '10',
  kg: '0',
});

export default function StrengthTrainingForm({ initialValues, onBack, onSave }: Props) {
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory>(
    (initialValues?.trainingCategory as ExerciseCategory) ?? 'Strength'
  );
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>(() => {
    if (!initialValues?.selectedExercises) return [];
    return initialValues.selectedExercises
      .map((saved) => {
        const exercise = EXERCISES.find((e) => e.id === saved.id);
        if (!exercise) return null;
        return { exercise, sets: saved.sets, expanded: false };
      })
      .filter(Boolean) as SelectedExercise[];
  });
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [error, setError] = useState('');
  const isEditing = !!initialValues;

  // Saat ganti category, clear exercise yang dipilih
  const handleCategoryChange = (cat: ExerciseCategory) => {
    setActiveCategory(cat);
    setSelectedExercises([]);
    setError('');
  };

  const toggleExercise = (exercise: Exercise) => {
    setError('');
    setSelectedExercises((prev) => {
      const exists = prev.find((e) => e.exercise.id === exercise.id);
      if (exists) return prev.filter((e) => e.exercise.id !== exercise.id);
      return [...prev, { exercise, sets: [makeSet(1)], expanded: true }];
    });
  };

  const isSelected = (id: string) => selectedExercises.some((e) => e.exercise.id === id);

  const toggleExpand = (id: string) => {
    setSelectedExercises((prev) =>
      prev.map((e) => e.exercise.id === id ? { ...e, expanded: !e.expanded } : e)
    );
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'reps', value: string) => {
    setSelectedExercises((prev) =>
      prev.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        const newSets = e.sets.map((s, i) =>
          i === setIndex ? { ...s, [field]: value } : s
        );
        return { ...e, sets: newSets };
      })
    );
  };

  const addSet = (exerciseId: string) => {
    setSelectedExercises((prev) =>
      prev.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        return { ...e, sets: [...e.sets, makeSet(e.sets.length + 1)] };
      })
    );
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setSelectedExercises((prev) =>
      prev.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        if (e.sets.length <= 1) return e;
        const newSets = e.sets
          .filter((_, i) => i !== setIndex)
          .map((s, i) => ({ ...s, set: i + 1 }));
        return { ...e, sets: newSets };
      })
    );
  };

  const handleSave = () => {
    if (selectedExercises.length === 0) {
      setError('Pilih minimal 1 exercise');
      return;
    }
    const totalSets = selectedExercises.reduce((acc, e) => acc + e.sets.length, 0);
    onSave({
      workoutType: 'Strength Training',
      workoutName: `${activeCategory} Session`,
      distance: '',
      pace: '',
      sets: String(totalSets),
      reps: '',
      weight: '',
      duration: { hour: 0, min: 0, sec: 0 },
      notes,
      trainingCategory: activeCategory,
      selectedExercises: selectedExercises.map((e) => ({
        id: e.exercise.id,
        name: e.exercise.name,
        sets: e.sets,
      })),
    });
  };

  const exercisesInCategory = EXERCISES.filter((e) => e.category === activeCategory);
  const grouped = exercisesInCategory.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const key = ex.group ?? activeCategory;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex);
    return acc;
  }, {});

  const catConfig = CATEGORY_CONFIG[activeCategory];
  const totalSets = selectedExercises.reduce((acc, e) => acc + e.sets.length, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STRENGTH TRAINING</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Training Context — Radio Button */}
        <Text style={styles.sectionLabel}>TRAINING CONTEXT</Text>
        <View style={styles.contextList}>
          {CATEGORIES.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const active = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.contextItem, active && styles.contextItemActive]}
                onPress={() => handleCategoryChange(cat)}
                activeOpacity={0.75}
              >
                {/* Radio Button */}
                <View style={[styles.radio, active && { borderColor: '#2E7D32' }]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                {/* Label */}
                <Text style={[styles.contextLabel, active && styles.contextLabelActive]}>
                  {cfg.icon} {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Exercise List */}
        <Text style={styles.sectionLabel}>EXERCISES</Text>
        <View style={[styles.catDescBox, { borderLeftColor: catConfig.color }]}>
          <Text style={[styles.catDescText, { color: catConfig.color }]}>{catConfig.desc}</Text>
        </View>

        {Object.entries(grouped).map(([groupName, exercises]) => (
          <View key={groupName} style={styles.groupBlock}>
            {exercises[0].group && (
              <Text style={styles.groupTitle}>{groupName}</Text>
            )}

            {exercises.map((exercise) => {
              const selected = isSelected(exercise.id);
              const selData = selectedExercises.find((e) => e.exercise.id === exercise.id);

              return (
                <View key={exercise.id}>
                  <TouchableOpacity
                    style={[
                      styles.exerciseRow,
                      selected && { borderColor: catConfig.color, backgroundColor: '#F9FFF9' },
                    ]}
                    onPress={() => toggleExercise(exercise)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.exerciseLeft}>
                      <Ionicons name="reorder-three-outline" size={18} color="#BBB" style={{ marginRight: 8 }} />
                      <Text style={[styles.exerciseName, selected && { color: '#1A1A2E', fontWeight: '700' }]}>
                        {exercise.name}
                      </Text>
                    </View>
                    <View style={styles.exerciseRight}>
                      {selected && selData && (
                        <Text style={[styles.setsBadge, { color: catConfig.color }]}>
                          {selData.sets.length} Sets
                        </Text>
                      )}
                      {selected ? (
                        <TouchableOpacity onPress={() => toggleExpand(exercise.id)}>
                          <Ionicons
                            name={selData?.expanded ? 'chevron-up' : 'chevron-down'}
                            size={18} color="#888"
                          />
                        </TouchableOpacity>
                      ) : (
                        <Ionicons name="add-circle-outline" size={20} color="#BBB" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Set & Reps — tanpa KG */}
                  {selected && selData?.expanded && (
                    <View style={styles.setsContainer}>
                      {/* Header */}
                      <View style={styles.setsHeader}>
                        <Text style={[styles.setsHeaderCell, { width: 36 }]}>SET</Text>
                        <Text style={[styles.setsHeaderCell, { flex: 1 }]}>REPETISI</Text>
                        <View style={{ width: 28 }} />
                      </View>

                      {selData.sets.map((s, idx) => (
                        <View key={idx} style={styles.setRow}>
                          {/* Set Number */}
                          <View style={[styles.setNumberBox, { backgroundColor: catConfig.color + '22' }]}>
                            <Text style={[styles.setNumber, { color: catConfig.color }]}>{s.set}</Text>
                          </View>

                          {/* Reps */}
                          <View style={styles.setInputBox}>
                            <TextInput
                              style={styles.setInput}
                              keyboardType="number-pad"
                              value={s.reps}
                              onChangeText={(v) => updateSet(exercise.id, idx, 'reps', v)}
                            />
                          </View>

                          {/* Delete Set */}
                          <TouchableOpacity
                            onPress={() => removeSet(exercise.id, idx)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            disabled={selData.sets.length <= 1}
                          >
                            <Ionicons
                              name="trash-outline" size={16}
                              color={selData.sets.length <= 1 ? '#DDD' : '#FF3B30'}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {/* Add Set */}
                      <TouchableOpacity
                        style={styles.addSetBtn}
                        onPress={() => addSet(exercise.id)}
                      >
                        <Ionicons name="add" size={16} color={catConfig.color} />
                        <Text style={[styles.addSetText, { color: catConfig.color }]}>Add Set</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NOTES</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Otot mana yang dilatih? Tingkat kelelahan?"
            placeholderTextColor="#BBB"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Summary */}
        {selectedExercises.length > 0 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>RINGKASAN</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>EXERCISE</Text>
                <Text style={styles.summaryValue}>{selectedExercises.length}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>TOTAL SETS</Text>
                <Text style={styles.summaryValue}>{totalSets}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Simpan Perubahan' : 'Simpan Latihan'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', letterSpacing: 1 },
  form: { padding: 16, gap: 16, paddingBottom: 32 },

  // Section Label
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8,
  },

  // Training Context Radio
  contextList: { gap: 8 },
  contextItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  contextItemActive: {
    borderColor: '#2E7D32', backgroundColor: '#F0FFF4',
  },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#CCCCCC',
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#2E7D32',
  },
  contextLabel: { fontSize: 15, fontWeight: '500', color: '#555' },
  contextLabelActive: { fontWeight: '700', color: '#1A1A2E' },

  // Category Description
  catDescBox: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 4 },
  catDescText: { fontSize: 13, fontWeight: '600' },

  // Group
  groupBlock: { gap: 0 },
  groupTitle: {
    fontSize: 11, fontWeight: '700', color: '#AAA',
    paddingVertical: 8, paddingHorizontal: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Exercise Row
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 14,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#F0F0F0', marginBottom: 6,
  },
  exerciseLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  exerciseName: { fontSize: 14, fontWeight: '500', color: '#555' },
  exerciseRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setsBadge: { fontSize: 12, fontWeight: '700' },

  // Sets Container — tanpa kolom KG
  setsContainer: {
    backgroundColor: '#FAFAFA', borderRadius: 12,
    padding: 12, marginBottom: 8, marginTop: -4, gap: 8,
  },
  setsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  setsHeaderCell: { fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setNumberBox: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  setNumber: { fontSize: 14, fontWeight: '800' },
  setInputBox: {
    flex: 1, backgroundColor: '#FFFFFF',
    borderRadius: 8, borderWidth: 1, borderColor: '#E8E8E8',
  },
  setInput: {
    textAlign: 'center', fontSize: 15, fontWeight: '700',
    color: '#1A1A2E', paddingVertical: 10,
  },
  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 4,
    borderWidth: 1, borderStyle: 'dashed', borderColor: '#DDD',
    borderRadius: 8,
  },
  addSetText: { fontSize: 13, fontWeight: '600' },

  // Error
  errorText: { fontSize: 12, color: '#FF3B30', textAlign: 'center' },

  // Notes
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8 },
  textArea: {
    backgroundColor: '#F4F4F4', borderRadius: 12, padding: 14,
    fontSize: 14, color: '#1A1A2E', minHeight: 80, textAlignVertical: 'top',
  },

  // Summary
  summaryBox: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20, gap: 12,
  },
  summaryTitle: { fontSize: 11, fontWeight: '700', color: '#FFFFFF99', letterSpacing: 0.8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#FFFFFF22' },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: '#FFFFFF88', letterSpacing: 0.5 },
  summaryValue: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },

  // Footer
  footer: { padding: 20, paddingBottom: 28 },
  saveButton: {
    backgroundColor: '#1A1A2E', borderRadius: 50, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});