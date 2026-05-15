import React, { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';


import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// Tambah export di depan type
export type WorkoutType = {
  id: number;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  active?: boolean;
};

type TrainingTypeProps = {
  onSelect: (workout: WorkoutType) => void;
};

const workoutTypes: WorkoutType[] = [
  {
    id: 1,
    label: 'Easy Run',
    icon: <MaterialIcons name="directions-run" size={24} color="black" />,
    iconBg: '#E8E8E8',
  },
  {
    id: 2,
    label: 'Long Run',
    icon: <MaterialIcons name="sync" size={24} color="black" />,
    iconBg: '#cfc9f1',
  },
  {
    id: 3,
    label: 'Tempo Run',
    icon: <MaterialIcons name="speed" size={24} color="black" />,
    iconBg: '#C8F5C8',
  },
   {
    id: 4,
    label: 'Interval Run',
    icon: <MaterialIcons name="timer" size={24} color="black" />,
    iconBg: '#f3c0c0',
  },
  {
    id: 5,
    label: 'Strength Training',
    icon: <Ionicons name="barbell" size={24} color="black" />,
    iconBg: '#FFE8D6',
  },
];

export default function TrainingType({ onSelect }: TrainingTypeProps) {
  const [selected, setSelected] = useState<number>(3);

  const handlePress = (item: WorkoutType) => {
    setSelected(item.id);
    onSelect(item);
  };

  return (
    <View style={styles.grid}>
      {workoutTypes.map((item) => {
        const isSelected = selected === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.card]}
            onPress={() => handlePress(item)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}>
              {item.icon}
            </View>
            <Text style={[]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  
  iconText: {
    fontSize: 20,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  
});