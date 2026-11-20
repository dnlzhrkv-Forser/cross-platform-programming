import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Номер замовлення — останні 6 цифр id (як у вебверсії)
const orderNumber = (order) => order.id.slice(-6);

// Один рядок списку: торкання — позначити виконаним, кнопка — видалити
export default function OrderItem({ order, onToggle, onDelete }) {
  return (
    <View style={[styles.item, order.done && styles.itemDone]}>
      <TouchableOpacity style={styles.textArea} onPress={() => onToggle(order.id)}>
        <Text style={[styles.name, order.done && styles.textDone]}>
          №{orderNumber(order)} · {order.name}
        </Text>
        <Text style={[styles.details, order.done && styles.textDone]}>
          {order.phone} · {order.address}
        </Text>
        <Text style={[styles.details, order.done && styles.textDone]}>
          Сума: {order.total.toFixed(2)} ₴
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(order.id)}>
        <Text style={styles.deleteText}>Видалити</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e7f6ef",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  itemDone: {
    backgroundColor: "#b7e4cc",
  },
  textArea: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1c2b26",
  },
  details: {
    fontSize: 13,
    color: "#5d6f68",
    marginTop: 2,
  },
  textDone: {
    textDecorationLine: "line-through",
    color: "#14724d",
  },
  deleteButton: {
    backgroundColor: "#b3261e",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
});
