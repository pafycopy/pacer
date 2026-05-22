import { StyleSheet, View, ScrollView, Modal } from 'react-native'
import React, { useState } from 'react'

import Header from '@/components/header'
import { Colors } from '@/constants/theme'

import EducationCard from '@/components/ui/education/educationcard'
import EducationHero from '@/components/ui/education/educationhero'

import RunningTechniqueScreen from '@/components/ui/education/runningtechniquescreen'
import InjuryPreventionScreen from '@/components/ui/education/injurypreventionscreen'
import WarmupScreen from '@/components/ui/education/warmupscreen'
import StrengthScreen from '@/components/ui/education/strengthscreen'

import {
  educationData,
  EducationTopic,
} from '@/constants/educationdata'

const Education = () => {

  const [selectedTopic, setSelectedTopic] =
    useState<EducationTopic | null>(null)

  const renderScreen = () => {

    if (!selectedTopic) return null

    switch (selectedTopic.type) {

      case 'running':
        return (
          <RunningTechniqueScreen
            topic={selectedTopic}
            onBack={() => setSelectedTopic(null)}
          />
        )

      case 'injury':
        return (
          <InjuryPreventionScreen
            topic={selectedTopic}
            onBack={() => setSelectedTopic(null)}
          />
        )

      case 'warmup':
        return (
          <WarmupScreen
            topic={selectedTopic}
            onBack={() => setSelectedTopic(null)}
          />
        )

      case 'strength':
        return (
          <StrengthScreen
            topic={selectedTopic}
            onBack={() => setSelectedTopic(null)}
          />
        )

      default:
        return null
    }
  }

  return (
    <View style={styles.container}>

      <Header
        title="Education"
        image="https://i.pravatar.cc/100"
      />

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