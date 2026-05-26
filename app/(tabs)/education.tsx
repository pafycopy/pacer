import { StyleSheet, View, ScrollView, Modal } from 'react-native'
import React, { useState, useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'

import Header from '@/components/header'
import { Colors } from '@/constants/theme'

import EducationCard from '@/components/ui/education/educationcard'
import EducationHero from '@/components/ui/education/educationhero'

import RunningTechniqueScreen from '@/components/ui/education/runningtechniquescreen'
import InjuryPreventionScreen from '@/components/ui/education/injurypreventionscreen'
import WarmupScreen from '@/components/ui/education/warmupscreen'
import StrengthScreen from '@/components/ui/education/strengthscreen'

import { educationData, EducationTopic } from '@/constants/educationdata'

const Education = () => {
  const { topicId } = useLocalSearchParams<{ topicId?: string }>()
  const router = useRouter()

  const [selectedTopic, setSelectedTopic] = useState<EducationTopic | null>(null)

  // useFocusEffect — jalan setiap kali tab ini aktif/difokus
  // Jadi kalau dari dashboard bawa topicId, modal langsung terbuka
  useFocusEffect(
    useCallback(() => {
      if (topicId) {
        const topic = educationData.find((t) => String(t.id) === topicId)
        if (topic) {
          setSelectedTopic(topic)
          // Hapus topicId dari params setelah diproses
          // supaya kalau user balik ke tab ini manual, modal tidak terbuka lagi
          router.setParams({ topicId: undefined })
        }
      }
    }, [topicId])
  )

  const renderScreen = () => {
    if (!selectedTopic) return null

    switch (selectedTopic.type) {
      case 'running':
        return <RunningTechniqueScreen topic={selectedTopic} onBack={() => setSelectedTopic(null)} />
      case 'injury':
        return <InjuryPreventionScreen topic={selectedTopic} onBack={() => setSelectedTopic(null)} />
      case 'warmup':
        return <WarmupScreen topic={selectedTopic} onBack={() => setSelectedTopic(null)} />
      case 'strength':
        return <StrengthScreen topic={selectedTopic} onBack={() => setSelectedTopic(null)} />
      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Education" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <EducationHero />

        {educationData.map((topic) => (
          <EducationCard
            key={topic.id}
            title={topic.title}
            description={topic.description}
            icon={topic.icon}
            color={topic.color}
            onPress={() => setSelectedTopic(topic)}
          />
        ))}
      </ScrollView>

      <Modal
        visible={!!selectedTopic}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedTopic(null)}
      >
        {renderScreen()}
      </Modal>
    </View>
  )
}

export default Education

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
})