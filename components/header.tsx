import { View, Text, Image, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

type HeaderProps = {
  title: string;
  image?: string;
};

const Header = ({ title, image }: HeaderProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <Image
        source={{
          uri: image || "https://i.pravatar.cc/100",
        }}
        style={styles.avatar}
      />
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});