import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  consistencyPercent: number; // 0–100
  message: string;
};

export default function MonitoringProgress({ consistencyPercent, message }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Monitoring Progres</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#4CD964',
    borderRadius: 20,
    padding: 20,
    gap: 6,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111' },
  message: { fontSize: 13, lineHeight: 20, color: '#1A4A1A' },
});