import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import DayCard from "@/components/ui/calendar/daycard";
import { generateDays } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutStore, toDateKey } from "@/store/workoutStore";

const WeekCalendar = () => {
  const { setSelectedDate, getWorkoutDates } = useWorkoutStore();
  const workoutDates = getWorkoutDates();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeDate, setActiveDate] = useState(new Date());

  const days = generateDays(currentDate, 5).map((d) => ({
    ...d,
    active: d.fullDate.toDateString() === activeDate.toDateString(),
  }));

  const firstDay = days[0].fullDate;
  const lastDay = days[days.length - 1].fullDate;
  const firstMonth = firstDay.toLocaleString("en-US", { month: "short" });
  const lastMonth = lastDay.toLocaleString("en-US", { month: "short" });
  const rangeText =
    firstMonth === lastMonth
      ? `${firstMonth} ${firstDay.getDate()} - ${lastDay.getDate()}`
      : `${firstMonth} ${firstDay.getDate()} - ${lastMonth} ${lastDay.getDate()}`;

  const handleNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 5);
    setCurrentDate(newDate);
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 5);
    setCurrentDate(newDate);
  };

  const handleSelectDate = (date: Date) => {
    setActiveDate(date);
    setSelectedDate(date); // update store
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{rangeText}</Text>
        <View style={styles.arrows}>
          <TouchableOpacity onPress={handlePrev} style={styles.btn}>
            <Ionicons name="chevron-back" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.btn}>
            <Ionicons name="chevron-forward" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        {days.map((item, index) => (
          <DayCard
            key={index}
            {...item}
            hasWorkout={workoutDates.includes(toDateKey(item.fullDate))}
            onPress={() => handleSelectDate(item.fullDate)}
          />
        ))}
      </View>
    </View>
  );
};

export default WeekCalendar;

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  title: { fontSize: 28, fontWeight: "bold" },
  arrows: { flexDirection: "row" },
  btn: {
    backgroundColor: "#eee", padding: 8,
    borderRadius: 20, marginLeft: 8,
  },
  row: { flexDirection: "row" },
});