import React, { useRef, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import {
  EducationTopic,
  EducationLesson,
} from '@/constants/educationdata';

import EducationLessonDetail from './educationlessondetail';

type Props = {
  topic: EducationTopic;
  onBack: () => void;
};

const InjuryPreventionScreen = ({
  topic,
  onBack,
}: Props) => {

  const scrollY =
    useRef(new Animated.Value(0)).current;

  const [selectedLesson, setSelectedLesson] =
    useState<EducationLesson | null>(null);

  const headerTitleOpacity =
    scrollY.interpolate({
      inputRange: [60, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* HEADER */}
      <View style={styles.header}>

        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#111"
          />
        </TouchableOpacity>

        <Animated.Text
          numberOfLines={1}
          style={[
            styles.headerTitle,
            { opacity: headerTitleOpacity },
          ]}
        >
          {topic.title}
        </Animated.Text>

        <View style={{ width: 36 }} />

      </View>

      {/* CONTENT */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y: scrollY,
                },
              },
            },
          ],
          {
            useNativeDriver: true,
          }
        )}
      >

        {/* HERO */}
        <View style={styles.heroSection}>

          <View
            style={[
              styles.heroBadge,
              {
                backgroundColor: topic.color,
              },
            ]}
          >

            <Ionicons
              name={topic.icon as any}
              size={16}
              color="#111"
            />

            <Text style={styles.heroBadgeText}>
              Injury Prevention
            </Text>

          </View>

          <Text style={styles.heroTitle}>
            {topic.title}
          </Text>

          <Text style={styles.heroDescription}>
            {topic.heroDescription}
          </Text>

        </View>

        <View style={styles.divider} />

        {/* LESSONS */}
        {topic.lessons.map((lesson) => (

          <TouchableOpacity
            key={lesson.id}
            style={styles.lessonCard}
            activeOpacity={0.8}
            onPress={() =>
              setSelectedLesson(lesson)
            }
          >

            <View style={styles.lessonTop}>

              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: topic.color,
                  },
                ]}
              >
                <Ionicons
                  name="medkit"
                  size={18}
                  color="#111"
                />
              </View>

              <View style={styles.lessonText}>

                <Text style={styles.lessonTitle}>
                  {lesson.title}
                </Text>

                {lesson.subtitle ? (
                  <Text style={styles.lessonSubtitle}>
                    {lesson.subtitle}
                  </Text>
                ) : null}

              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#999"
              />

            </View>

            <Text style={styles.lessonDescription}>
              {lesson.description}
            </Text>

          </TouchableOpacity>

        ))}

        {/* FOOTER */}
        <View style={styles.footer}>

          <Ionicons
            name="shield-checkmark"
            size={18}
            color="#34C759"
          />

          <Text style={styles.footerText}>
            Pencegahan cedera lebih baik
            daripada pemulihan cedera.
          </Text>

        </View>

      </Animated.ScrollView>

      {/* MODAL DETAIL */}
      <Modal
        visible={!!selectedLesson}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() =>
          setSelectedLesson(null)
        }
      >

        {selectedLesson && (
          <EducationLessonDetail
            lesson={selectedLesson}
            topic={topic}
            onBack={() =>
              setSelectedLesson(null)
            }
          />
        )}

      </Modal>

    </SafeAreaView>
  );
};

export default InjuryPreventionScreen;

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 16,
    paddingVertical: 12,

    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',

    backgroundColor: '#FAFAFA',
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,

    backgroundColor: '#F0F0F0',

    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,

    textAlign: 'center',

    marginHorizontal: 8,

    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  heroSection: {
    gap: 12,
    marginBottom: 24,
  },

  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,

    alignSelf: 'flex-start',

    paddingHorizontal: 12,
    paddingVertical: 6,

    borderRadius: 20,
  },

  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },

  heroDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 24,
  },

  lessonCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    padding: 18,

    marginBottom: 14,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,

    elevation: 1,
  },

  lessonTop: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 12,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  lessonText: {
    flex: 1,
  },

  lessonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  lessonSubtitle: {
    marginTop: 2,

    fontSize: 12,
    color: '#888',
  },

  lessonDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: '#666',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,

    marginTop: 12,
  },

  footerText: {
    flex: 1,

    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },

});