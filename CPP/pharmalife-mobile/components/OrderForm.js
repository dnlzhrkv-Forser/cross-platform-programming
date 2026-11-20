import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Форма додавання замовлення: чотири поля — чотири окремі стани useState
export default function OrderForm({ onAdd }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [total, setTotal] = useState("");

  const handleAdd = () => {
    const added = onAdd(name, phone, address, total);
    if (added) {
      setName("");
      setPhone("");
      setAddress("");
      setTotal("");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Нове замовлення</Text>
      <TextInput
        style={styles.input}
        placeholder="Ім’я клієнта"
        value={name}
        onChangeText={setName}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder="Телефон, +380…"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder="Сума, ₴"
          value={total}
          onChangeText={setTotal}
          keyboardType="numeric"
        />
      </View>
      <TextInput
        style={styles.input}
        placeholder="Адреса доставки"
        value={address}
        onChangeText={setAddress}
        returnKeyType="done"
        onSubmitEditing={handleAdd}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>Додати замовлення</Text>
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
