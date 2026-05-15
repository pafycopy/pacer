import { StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import React from 'react'
import Header from '@/components/header'
import { Colors } from '@/constants/theme'

const education = () => {
  return (
    <View style={styles.container}>
      <Header
        title="Education"
        image="https://i.pravatar.cc/100"
     />
      
    </View>
  )
}

export default education

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
})