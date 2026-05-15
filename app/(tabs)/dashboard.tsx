import { StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import React from 'react'
import Header from '@/components/header'
import { Colors } from '@/constants/theme'

const Dashboard = () => {
  return (
    <View style={styles.container}>
      <Header
        title="Dashboard"
        image="https://i.pravatar.cc/100"
     />
      
    </View>
  )
}

export default Dashboard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
})