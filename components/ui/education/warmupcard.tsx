import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  title: string;
  subtitle?: string;
  description: string;
  onPressVideo?: () => void;
};

export default function WarmupCard({
  title,
  subtitle,
  description,
  onPressVideo,
}: Props) {
  return (
    <View style={styles.card}>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Subtitle — "Mengapa Hal Ini Penting:" */}
      {subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Show Video button — selalu tampil */}
      <TouchableOpacity
        style={styles.videoBtn}
        onPress={onPressVideo}
        activeOpacity={0.85}
      >
        <Ionicons name="play-circle" size={16} color="#FFF" />
        <Text style={styles.videoBtnText}>Show Video</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
    marginBottom: 16,
  },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 8,
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  videoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});