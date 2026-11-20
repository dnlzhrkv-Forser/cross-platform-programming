import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Форма додавання препарату: три поля — три окремі стани useState
export default function MedicineForm({ onAdd }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleAdd = async () => {
    const added = await onAdd(name, price, quantity);
    if (added) {
      setName("");
      setPrice("");
      setQuantity("1");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Новий препарат</Text>
      <TextInput
        style={styles.input}
        placeholder="Назва препарату"
        value={name}
        onChangeText={setName}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder="Ціна, ₴"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder="Кількість"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
      </View>
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>Додати препарат</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1c2b26",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cfe0d8",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowInput: {
    flex: 1,
    minWidth: 0,
  },
  addButton: {
    backgroundColor: "#1f9d6b",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
