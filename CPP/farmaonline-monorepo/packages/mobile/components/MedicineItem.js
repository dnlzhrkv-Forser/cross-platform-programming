import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatMedicineDate } from "@farmaonline/core";

// Один рядок списку: назва, ціна × кількість, дата створення (з ядра) і кнопка «Видалити»
export default function MedicineItem({ medicine, onDelete }) {
  return (
    <View style={styles.item}>
      <View style={styles.textArea}>
        <Text style={styles.name}>{medicine.name}</Text>
        <Text style={styles.details}>
          {medicine.price.toFixed(2)} ₴ × {medicine.quantity} ={" "}
          {(medicine.price * medicine.quantity).toFixed(2)} ₴
        </Text>
        <Text style={styles.details}>{formatMedicineDate(medicine.createdAt)}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(medicine.id)}>
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
