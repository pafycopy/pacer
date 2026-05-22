import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Tabs } from 'expo-router'

const Tabslayout = () => {
  return (
    <Tabs 
      screenOptions={{
        tabBarActiveTintColor:'#006E2F',
        tabBarInactiveTintColor:'#191C1E',
        headerShown: false,
        tabBarStyle: {
          height: 60, // atur tinggi di sini (coba 50–70)
          paddingBottom: 5, // biar tidak terlalu tinggi di bawah
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12, // kecilkan teks
        }
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "dashboard",tabBarIcon:({color,size})=>(
        <Ionicons name="home" color={color} size={size} />
      ) }} />
      <Tabs.Screen name="education" options={{ title: "education",tabBarIcon:({color,size})=>(
        <Ionicons name="library" color={color} size={size} />
      ) }} />
      <Tabs.Screen name="training" options={{ title: "training",tabBarIcon:({color,size})=>(
        <Ionicons name="barbell" color={color} size={size} />
      ) }} />
      <Tabs.Screen name="profile" options={{ title: "profile",tabBarIcon:({color,size})=>(
        <Ionicons name="person" color={color} size={size} />
      ) }} />
    </Tabs>
  )
}

export default Tabslayout