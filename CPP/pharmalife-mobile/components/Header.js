import { StyleSheet, Text, View } from "react-native";

// Заголовок із лічильниками: усього замовлень, виконано та загальна сума
export default function Header({ total, done, sum }) {
  return (
    <View>
      <Text style={styles.title}>ФармаЛайф Mobile</Text>
      <Text style={styles.stats}>
        Усього замовлень: {total} · Виконано: {done}
      </Text>
      <Text style={styles.sum}>На суму: {sum.toFixed(2)} ₴</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#14724d",
    textAlign: "center",
    marginBottom: 8,
  },
  stats: {
    fontSize: 16,
    color: "#5d6f68",
    textAlign: "center",
    marginBottom: 4,
  },
  sum: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f9d6b",
    textAlign: "center",
    marginBottom: 20,
  },
});
