import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '@/components/header';
import WeekCalendar from '@/components/ui/calendar/weekcalendar';
import { Colors } from '@/constants/theme';
import TrainingType, { WorkoutType } from '@/components/ui/calendar/trainingtype';
import TodayWorkoutCard from '@/components/ui/calendar/todaytrainingcard';
import WorkoutFormScreen, { WorkoutFormValues, Props as FormProps } from '@/components/ui/calendar/workoutformscreen';
import TempoRunForm from '@/components/ui/calendar/temporunform';
import StrengthTrainingForm from '@/components/ui/calendar/strengthtrainingform';
import { useWorkoutStore, toDateKey, SavedWorkout } from '@/store/workoutStore';
import { resolveStats } from '@/utils/resolveWorkoutStats';

const FORM_REGISTRY: Record<string, React.ComponentType<FormProps>> = {
  'Tempo Run': TempoRunForm as React.ComponentType<FormProps>,
  'Strength Training': StrengthTrainingForm as React.ComponentType<FormProps>,
};

const TRACKER_REGISTRY: Record<string, string> = {
  'Easy Run':          '/tracker/running',
  'Long Run':          '/tracker/running',
  'Tempo Run':         '/tracker/tempo',    // ← tracker khusus
  'Interval Run':      '/tracker/interval',
  'Strength Training': '/tracker/strength',
};

const training = () => {
  const router = useRouter();
  const {
    selectedDate,
    getWorkoutsByDate,
    addWorkout,
    updateWorkout,
    deleteWorkout,
  } = useWorkoutStore();

  const dateKey = toDateKey(selectedDate);
  const todayWorkouts = getWorkoutsByDate(dateKey);

  const [formVisible, setFormVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutType | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<SavedWorkout | null>(null);

  const handleSelectTraining = (workout: WorkoutType) => {
    setEditingWorkout(null);
    setSelectedWorkout(workout);
    setFormVisible(true);
  };

  const handleSave = (data: WorkoutFormValues) => {
    if (editingWorkout) {
      updateWorkout(dateKey, editingWorkout.uid, data);
    } else {
      addWorkout(dateKey, data);
    }
    setFormVisible(false);
    setEditingWorkout(null);
  };

  const handleEdit = (workout: SavedWorkout) => {
    setEditingWorkout(workout);
    setSelectedWorkout({
      id: 0,
      label: workout.workoutType,
      icon: '🏃',
      iconBg: '#E8E8E8',
    });
    setFormVisible(true);
  };

  const handleDelete = (uid: string) => {
    deleteWorkout(dateKey, uid);
  };

  const handleStartWorkout = (workout: SavedWorkout) => {
    const trackerPath = TRACKER_REGISTRY[workout.workoutType];
    if (!trackerPath) return;

    router.push({
      pathname: trackerPath as any,
      params: {
        uid: workout.uid,
        dateKey,
        workoutType: workout.workoutType,
        workoutName: workout.workoutName,

        // Interval Run
        ...(workout.workoutType === 'Interval Run' && {
          distance: workout.distance,
          pace: workout.pace,
          sets: workout.sets,
        }),

        // Tempo Run — kirim data per fase
        ...(workout.workoutType === 'Tempo Run' && workout.warmup && workout.tempo && workout.cooldown && {
          warmupDistance:   workout.warmup.distance,
          warmupPace:       workout.warmup.pace,
          tempoDistance:    workout.tempo.distance,
          targetPace:       workout.tempo.targetPace,
          cooldownDistance: workout.cooldown.distance,
          cooldownPace:     workout.cooldown.pace,
        }),

        // Strength Training
        ...(workout.workoutType === 'Strength Training' && {
          selectedExercises: JSON.stringify(workout.selectedExercises ?? []),
        }),
      },
    });
  };

  const ActiveForm = selectedWorkout
    ? (FORM_REGISTRY[selectedWorkout.label] ?? WorkoutFormScreen)
    : null;

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const sectionTitle = isToday
    ? 'Today'
    : selectedDate.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long',
      });

  return (
    <View style={styles.container}>
      <Header title="Calendar" image="https://i.pravatar.cc/100" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <WeekCalendar />

        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>

          {todayWorkouts.length === 0 ? (
            <TodayWorkoutCard isEmpty />
          ) : (
            todayWorkouts.map((workout) => (
              <TodayWorkoutCard
                key={workout.uid}
                workoutType={workout.workoutType}
                workoutName={workout.workoutName}
                stats={resolveStats(workout)}
                status={workout.status}

                // Pace result — Easy/Long/Interval Run
                paceResult={
                  workout.trackingResult &&
                  workout.pace &&
                  workout.distance &&
                  workout.workoutType !== 'Tempo Run'
                    ? {
                        targetPace: workout.pace,
                        actualPace: workout.trackingResult.actualPace,
                        targetDistance: workout.distance,
                        actualDistance: workout.trackingResult.actualDistance,
                      }
                    : undefined
                }

                // Tempo result — 3 fase dengan data akurat per fase
                tempoResult={
                  workout.workoutType === 'Tempo Run' &&
                  workout.trackingResult?.phaseResults &&
                  workout.warmup &&
                  workout.tempo &&
                  workout.cooldown
                    ? {
                        phases: [
                          {
                            label: '🔥 WARM UP',
                            targetDistance: workout.warmup.distance,
                            actualDistance: workout.trackingResult.phaseResults.warmup.actualDistance,
                            targetPace: workout.warmup.pace,
                            actualPace: workout.trackingResult.phaseResults.warmup.actualPace,
                          },
                          {
                            label: '⚡ TEMPO SESSION',
                            targetDistance: workout.tempo.distance,
                            actualDistance: workout.trackingResult.phaseResults.tempo.actualDistance,
                            targetPace: workout.tempo.targetPace,
                            actualPace: workout.trackingResult.phaseResults.tempo.actualPace,
                          },
                          {
                            label: '❄️ COOL DOWN',
                            targetDistance: workout.cooldown.distance,
                            actualDistance: workout.trackingResult.phaseResults.cooldown.actualDistance,
                            targetPace: workout.cooldown.pace,
                            actualPace: workout.trackingResult.phaseResults.cooldown.actualPace,
                          },
                        ],
                      }
                    : undefined
                }

                onStartPress={() => handleStartWorkout(workout)}
                onEdit={() => handleEdit(workout)}
                onDelete={() => handleDelete(workout.uid)}
              />
            ))
          )}
        </View>

        <Text style={styles.title}>
          <Ionicons name="add-sharp" size={24} color="#000" /> Tambah latihan
        </Text>

        <TrainingType onSelect={handleSelectTraining} />
      </ScrollView>

      <Modal
        visible={formVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setFormVisible(false)}
      >
        {selectedWorkout && ActiveForm && (
          <ActiveForm
            workout={selectedWorkout}
            initialValues={editingWorkout ?? undefined}
            onBack={() => { setFormVisible(false); setEditingWorkout(null); }}
            onSave={handleSave}
          />
        )}
      </Modal>
    </View>
  );
};

export default training;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: { paddingBottom: 40 },
  todaySection: { paddingHorizontal: 16, marginTop: 20, gap: 12 },
  sectionTitle: {
    fontSize: 22, fontWeight: '800', color: '#1A1A2E',
    letterSpacing: -0.5, marginBottom: 4,
  },
  title: {
    padding: 12, marginLeft: 16, marginTop: 16,
    textAlign: 'left', fontSize: 16, fontWeight: 'bold',
  },
});